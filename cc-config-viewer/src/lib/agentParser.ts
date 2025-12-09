import { readConfig } from './tauriApi'
import type { Agent, AgentParseResult } from '../types/agent'

/**
 * Parse agents from configuration files
 * Supports reading agent definitions from .claude/agents/*.md files
 */
export async function parseAgents(
  userConfig?: Record<string, any>,
  projectConfig?: Record<string, any>
): Promise<{
  userAgents: AgentParseResult[]
  projectAgents: AgentParseResult[]
  inheritedAgents: AgentParseResult[]
}> {
  const userAgents: AgentParseResult[] = []
  const projectAgents: AgentParseResult[] = []
  const inheritedAgents: AgentParseResult[] = []

  // Parse user-level agents from ~/.claude/agents/*.md
  try {
    const userAgentFiles = await readDirectory('~/.claude/agents')
    for (const file of userAgentFiles) {
      if (file.endsWith('.md')) {
        const content = await readConfig(`~/.claude/agents/${file}`)
        const agent = parseAgentFromMarkdown(content, `~/.claude/agents/${file}`)
        if (agent) {
          userAgents.push(agent)
        }
      }
    }
  } catch (error) {
    // No user agents directory or empty - this is fine
    console.log('[agentParser] No user agents found:', error)
  }

  // Parse project-level agents from .claude/agents/*.md
  try {
    const projectAgentFiles = await readDirectory('./.claude/agents')
    for (const file of projectAgentFiles) {
      if (file.endsWith('.md')) {
        const content = await readConfig(`./.claude/agents/${file}`)
        const agent = parseAgentFromMarkdown(content, `./.claude/agents/${file}`)
        if (agent) {
          // Check if this overrides a user-level agent
          const userAgent = userAgents.find(a => a.name === agent.name)
          if (userAgent) {
            // This is an override, mark as inherited
            inheritedAgents.push(userAgent)
          }
          projectAgents.push(agent)
        }
      }
    }
  } catch (error) {
    // No project agents directory - this is fine
    console.log('[agentParser] No project agents found:', error)
  }

  // Deduplicate agents by name, preferring project-level over user-level
  const allAgents = [...projectAgents, ...userAgents]
  const agentMap = new Map<string, AgentParseResult>()

  for (const agent of allAgents) {
    const existing = agentMap.get(agent.name)
    if (!existing) {
      agentMap.set(agent.name, agent)
    } else {
      // Project-level overrides user-level
      if (agent.sourcePath.startsWith('./')) {
        agentMap.set(agent.name, agent)
      }
    }
  }

  // Separate back into user and project
  const finalUserAgents: AgentParseResult[] = []
  const finalProjectAgents: AgentParseResult[] = []

  for (const agent of agentMap.values()) {
    if (agent.sourcePath.startsWith('./')) {
      finalProjectAgents.push(agent)
    } else {
      finalUserAgents.push(agent)
    }
  }

  return {
    userAgents: finalUserAgents,
    projectAgents: finalProjectAgents,
    inheritedAgents
  }
}

/**
 * Parse agent definition from Markdown content
 */
export function parseAgentFromMarkdown(content: string, sourcePath: string): AgentParseResult | null {
  try {
    // Parse frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let frontmatter: Record<string, any> = {}
    let markdownContent = content

    if (frontmatterMatch) {
      markdownContent = content.replace(/^---\n[\s\S]*?\n---/, '')
      try {
        // Simple YAML parsing for frontmatter
        const frontmatterText = frontmatterMatch[1]

        // Parse YAML using a more robust approach
        // Split by lines and handle nested structures
        const lines = frontmatterText.split('\n')
        let stack: { key: string; indent: number }[] = []

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const trimmedLine = line.trim()

          if (!trimmedLine || trimmedLine.startsWith('#')) continue

          // Calculate indentation
          const indent = line.match(/^(\s*)/)?.[1].length || 0

          // Adjust stack based on indentation
          while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
            stack.pop()
          }

          // Check if this is a list item
          if (trimmedLine.startsWith('- ')) {
            const value = trimmedLine.substring(2).trim()
            // Get the parent from stack
            if (stack.length > 0) {
              const arrayKey = stack[stack.length - 1].key
              // Navigate to the array's parent
              let parent = frontmatter
              for (let j = 0; j < stack.length - 1; j++) {
                if (!parent[stack[j].key]) {
                  parent[stack[j].key] = {}
                }
                parent = parent[stack[j].key]
              }
              // Ensure the array exists
              if (!parent[arrayKey] || !Array.isArray(parent[arrayKey])) {
                parent[arrayKey] = []
              }
              // Add value to array
              try {
                parent[arrayKey].push(JSON.parse(value))
              } catch {
                parent[arrayKey].push(value)
              }
            }
            continue
          }

          const colonIndex = trimmedLine.indexOf(':')
          if (colonIndex === -1) continue

          const key = trimmedLine.substring(0, colonIndex).trim()
          const value = trimmedLine.substring(colonIndex + 1).trim()

          if (!key) continue

          // Navigate to the correct location in frontmatter
          let target = frontmatter
          for (let j = 0; j < stack.length; j++) {
            const stackKey = stack[j].key
            if (!target[stackKey] || typeof target[stackKey] !== 'object') {
              target[stackKey] = {}
            }
            target = target[stackKey]
          }

          // If value is empty, this is a nested object - add to stack
          if (!value) {
            stack.push({ key, indent })
            continue
          }

          // Set the value
          try {
            // Try to parse as JSON
            target[key] = JSON.parse(value)
          } catch {
            // Use as string
            target[key] = value
          }
        }
      } catch (error) {
        console.warn('[agentParser] Failed to parse frontmatter:', error)
      }
    }

    // Extract name from frontmatter or first heading or filename
    let name = ''
    if (frontmatter.name) {
      name = frontmatter.name
    }
    if (!name) {
      const headingMatch = markdownContent.match(/^#\s+(.+)$/m)
      if (headingMatch) {
        name = headingMatch[1].trim()
      }
    }
    if (!name) {
      // Fallback to filename
      name = sourcePath.split('/').pop()?.replace('.md', '') || 'Unnamed Agent'
    }

    // Extract description from frontmatter or Description section
    let description = frontmatter.description || ''
    if (!description) {
      // First try ## Description section
      const descMatch = markdownContent.match(/## Description\s*\n([\s\S]*?)(?:\n## |\n---|$)/)
      if (descMatch) {
        description = descMatch[1].trim()
      } else {
        // Try to extract description as text after first heading
        const textAfterHeading = markdownContent.replace(/^#\s+.+$/m, '').trim()
        if (textAfterHeading) {
          // Take first paragraph or up to next heading
          const firstParaMatch = textAfterHeading.match(/^([\s\S]*?)(?:\n## |$)/)
          if (firstParaMatch) {
            description = firstParaMatch[1].trim()
          }
        }
      }
    }

    // Extract model configuration
    const model: AgentParseResult['model'] = {
      name: frontmatter.model?.name || frontmatter.model || 'claude-3',
      provider: frontmatter.model?.provider,
      config: {}
    }

    // Extract model config from frontmatter
    if (frontmatter.model?.config || (typeof frontmatter.model === 'object' && frontmatter.model !== null)) {
      if (frontmatter.model.config) {
        model.config = frontmatter.model.config
      } else {
        // Copy all model properties except name and provider to config
        const { name, provider, ...rest } = frontmatter.model
        model.config = rest
      }
    } else if (frontmatter.config) {
      model.config = frontmatter.config
    }

    // Parse model section from markdown if config not in frontmatter or to supplement
    const modelMatch = markdownContent.match(/## Model(?: Configuration)?\s*\n([\s\S]*?)(?:\n## |\n---|$)/)
    if (modelMatch) {
      const modelText = modelMatch[1]
      // Extract model name
      const nameMatch = modelText.match(/(?:Model Name|Name):\s*(.+)/i)
      if (nameMatch) {
        model.name = nameMatch[1].trim()
      }
      // Extract provider
      const providerMatch = modelText.match(/Provider:\s*(.+)/i)
      if (providerMatch) {
        model.provider = providerMatch[1].trim()
      }
      // Parse key-value pairs for config
      const config: Record<string, any> = {}
      modelText.split('\n').forEach(line => {
        const match = line.match(/^\s*-\s+([^:]+):\s+(.+)/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim()
          try {
            config[key] = JSON.parse(value)
          } catch {
            config[key] = value
          }
        }
      })
      if (Object.keys(config).length > 0) {
        model.config = { ...model.config, ...config }
      }
    }

    // Extract permissions
    let permissionsType: 'read' | 'write' | 'admin' | 'custom' = 'read'
    let scopes: string[] = []
    let restrictions: string[] | undefined

    if (frontmatter.permissions) {
      if (typeof frontmatter.permissions === 'string') {
        permissionsType = frontmatter.permissions as any
      } else if (typeof frontmatter.permissions === 'object') {
        if (frontmatter.permissions.type) {
          permissionsType = frontmatter.permissions.type as any
        }
        if (frontmatter.permissions.scopes) {
          scopes = Array.isArray(frontmatter.permissions.scopes) ? frontmatter.permissions.scopes : []
        }
        if (frontmatter.permissions.restrictions) {
          restrictions = frontmatter.permissions.restrictions
        }
      }
    } else {
      // Parse from markdown
      const permMatch = markdownContent.match(/## Permissions?\s*\n([\s\S]*?)(?:\n## |\n---|$)/)
      if (permMatch) {
        const permText = permMatch[1]

        // Extract type
        const typeMatch = permText.match(/^\s*-\s*Type:\s*(\w+)/im)
        if (typeMatch) {
          const type = typeMatch[1].toLowerCase()
          if (['read', 'write', 'admin', 'custom'].includes(type)) {
            permissionsType = type as any
          }
        }

        // Extract scopes - handle both single line and multi-line formats
        const scopesBlockMatch = permText.match(/^\s*-\s*Scopes?:([\s\S]*?)(?=^\s*-\s*(?:Type|Restrictions)|$)/im)
        if (scopesBlockMatch) {
          const scopesText = scopesBlockMatch[1].trim()

          // Check if it's a multi-line list
          if (scopesText.includes('\n')) {
            // Multi-line: extract list items
            const listItems = scopesText.split('\n')
              .map(line => line.trim())
              .filter(line => line.startsWith('-'))
              .map(line => line.replace(/^-\s*/, '').replace(/^"|"$/g, '').trim())
              .filter(Boolean)
            scopes = listItems
          } else {
            // Single line: split by comma
            scopes = scopesText.split(',').map(s => s.trim()).filter(Boolean)
          }
        }

        // Extract restrictions - handle both single line and multi-line formats
        const restrictionsBlockMatch = permText.match(/^\s*-\s*Restrictions?:([\s\S]*?)(?=^\s*-\s*(?:Type|Scopes)|$)/im)
        if (restrictionsBlockMatch) {
          const restrictionsText = restrictionsBlockMatch[1].trim()

          // Check if it's a multi-line list
          if (restrictionsText.includes('\n')) {
            // Multi-line: extract list items
            const listItems = restrictionsText.split('\n')
              .map(line => line.trim())
              .filter(line => line.startsWith('-'))
              .map(line => line.replace(/^-\s*/, '').replace(/^"|"$/g, '').trim())
              .filter(Boolean)
            restrictions = listItems
          } else {
            // Single line: split by comma
            restrictions = restrictionsText.split(',').map(s => s.trim()).filter(Boolean)
          }
        }
      }
    }

    const permissions = {
      type: permissionsType,
      scopes,
      restrictions
    }

    // Generate ID from name
    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Get last modified from metadata or use current date
    const lastModified = frontmatter.lastModified
      ? new Date(frontmatter.lastModified)
      : new Date()

    return {
      id,
      name,
      description,
      model,
      permissions,
      sourcePath,
      lastModified
    }
  } catch (error) {
    console.error(`[agentParser] Failed to parse agent from ${sourcePath}:`, error)
    return null
  }
}

/**
 * Mock readDirectory for now - in a real implementation this would use Tauri fs API
 */
async function readDirectory(path: string): Promise<string[]> {
  // This is a placeholder - in the real implementation we would use Tauri fs API
  // For now, return empty array
  return []
}
