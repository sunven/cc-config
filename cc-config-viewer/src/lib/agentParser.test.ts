import { describe, it, expect, vi } from 'vitest'
import { parseAgents, parseAgentFromMarkdown } from './agentParser'
import type { AgentParseResult } from '../types/agent'

// Mock tauriApi
vi.mock('./tauriApi', () => ({
  readConfig: vi.fn()
}))

describe('agentParser', () => {
  const mockReadConfig = vi.mocked(import('./tauriApi').then(m => m.readConfig))

  it('parses agent from markdown with frontmatter', async () => {
    const markdown = `---
name: Code Assistant
model:
  name: claude-3-sonnet
  provider: anthropic
  config:
    temperature: 0.7
    max_tokens: 4096
permissions:
  type: write
  scopes:
    - files:read
    - files:write
    - shell:execute
lastModified: 2025-01-15
---

# Code Assistant

This agent helps with code completion and refactoring.
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/code-assistant.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('Code Assistant')
      expect(result.description).toContain('code completion')
      expect(result.model.name).toBe('claude-3-sonnet')
      expect(result.model.provider).toBe('anthropic')
      expect(result.model.config?.temperature).toBe(0.7)
      expect(result.permissions.type).toBe('write')
      expect(result.permissions.scopes).toContain('files:read')
    }
  })

  it('parses agent from markdown without frontmatter', async () => {
    const markdown = `# Data Analyst

## Description
Analyzes data and generates reports.

## Model Configuration
- Model Name: claude-3-haiku
- Provider: anthropic

## Permissions
- Type: read
- Scopes: files:read
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/data-analyst.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('Data Analyst')
      expect(result.description).toContain('Analyzes data')
      expect(result.model.name).toBe('claude-3-haiku')
      expect(result.permissions.type).toBe('read')
      expect(result.permissions.scopes).toContain('files:read')
    }
  })

  it('extracts name from heading when not in frontmatter', async () => {
    const markdown = `# System Admin

Manages system configuration and users.
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/system-admin.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('System Admin')
    }
  })

  it('falls back to filename when no name in content', async () => {
    const markdown = `Some content without a heading.`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/backup-agent.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('backup-agent')
    }
  })

  it('handles custom permissions', async () => {
    const markdown = `---
name: Custom Agent
permissions:
  type: custom
  scopes:
    - custom:scope
  restrictions:
    - no_delete
---

# Custom Agent
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/custom.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.permissions.type).toBe('custom')
      expect(result.permissions.scopes).toContain('custom:scope')
      expect(result.permissions.restrictions).toContain('no_delete')
    }
  })

  it('handles admin permissions', async () => {
    const markdown = `---
name: Admin Agent
permissions:
  type: admin
  scopes:
    - files:read
    - files:write
    - system:admin
---

# Admin Agent
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/admin.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.permissions.type).toBe('admin')
      expect(result.permissions.scopes).toContain('system:admin')
    }
  })

  it('handles empty description', async () => {
    const markdown = `# Agent Without Description`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/simple.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.description).toBe('')
    }
  })

  it('generates ID from name', async () => {
    const markdown = `# My Special Agent!`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/my-special-agent.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.id).toBe('my-special-agent')
    }
  })

  it('handles model config with nested objects', async () => {
    const markdown = `---
name: Advanced Agent
model:
  name: claude-3-opus
  config:
    temperature: 0.5
    system: "You are a helpful assistant"
    tools:
      - filesystem
      - web_search
---

# Advanced Agent
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/advanced.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.model.config?.temperature).toBe(0.5)
      expect(result.model.config?.tools).toContain('filesystem')
    }
  })

  it('handles minimal markdown', async () => {
    const markdown = `Minimal markdown`
    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/minimal.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('minimal')
    }
  })

  it('uses filename when no heading or frontmatter name', async () => {
    const markdown = `Some content without a proper title.`
    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/another-agent.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.name).toBe('another-agent')
    }
  })

  it('handles multiline descriptions', async () => {
    const markdown = `# Multi-line Agent

## Description
This is a longer description
that spans multiple lines
and contains more details.
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/multiline.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.description).toContain('longer description')
      expect(result.description).toContain('multiple lines')
    }
  })

  it('extracts provider from model section', async () => {
    const markdown = `# Provider Agent

## Model
- Provider: openai
- Model: gpt-4
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/provider.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.model.provider).toBe('openai')
    }
  })

  it('handles permissions with complex scopes', async () => {
    const markdown = `---
name: Complex Agent
permissions:
  type: write
  scopes:
    - "files:read"
    - "files:write"
    - "shell:execute"
  restrictions:
    - "no_delete"
    - "read_only_paths"
---

# Complex Agent
`

    const result = parseAgentFromMarkdown(markdown, '/home/user/.claude/agents/complex.md')
    expect(result).not.toBeNull()
    if (result) {
      expect(result.permissions.scopes.length).toBeGreaterThan(0)
      expect(result.permissions.restrictions?.length).toBeGreaterThan(0)
    }
  })
})
