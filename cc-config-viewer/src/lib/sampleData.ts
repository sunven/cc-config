import type { SampleProjectData, FeatureHighlight } from '@/types/onboarding'
import { Search, GitCompare, MapPin, Settings, Download, Database } from 'lucide-react'

/**
 * Sample project data for onboarding demonstration
 * This data showcases the key features of cc-config
 */
export const SAMPLE_PROJECT_DATA: SampleProjectData = {
  name: 'sample-claude-project',
  path: '/sample/projects/claude-config-demo',
  mcpServers: [
    {
      name: 'filesystem',
      type: 'stdio',
      source: 'user',
      status: 'active',
    },
    {
      name: 'postgres',
      type: 'http',
      source: 'project',
      status: 'active',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'demo_db',
      },
    },
    {
      name: 'git',
      type: 'stdio',
      source: 'project',
      status: 'active',
      config: {
        repository: 'https://github.com/example/repo.git',
        branch: 'main',
      },
    },
  ],
  agents: [
    {
      name: 'CodeReviewer',
      model: 'claude-3-sonnet',
      source: 'user',
      capabilities: ['review', 'analyze', 'suggest'],
    },
    {
      name: 'DataAnalyzer',
      model: 'claude-3-haiku',
      source: 'project',
      capabilities: ['analyze', 'query', 'visualize'],
    },
    {
      name: 'DevAssistant',
      model: 'claude-3-opus',
      source: 'user',
      capabilities: ['code', 'debug', 'test'],
    },
  ],
  configs: {
    theme: 'dark',
    scope: 'user',
    language: 'zh-CN',
    autoSave: true,
    notifications: {
      email: true,
      desktop: false,
    },
    editor: {
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
    },
  },
}

/**
 * Feature highlights for onboarding tour
 */
export const ONBOARDING_FEATURES: FeatureHighlight[] = [
  {
    id: 'project-discovery',
    title: '项目发现',
    description: '自动发现和管理您的所有 Claude 项目配置',
    step: 'project-discovery',
    icon: Search,
  },
  {
    id: 'config-comparison',
    title: '配置比较',
    description: '并排比较多个项目的配置，快速识别差异',
    step: 'config-comparison',
    icon: GitCompare,
  },
  {
    id: 'source-identification',
    title: '来源追踪',
    description: '追踪每个配置值的来源，理解配置继承关系',
    step: 'source-identification',
    icon: MapPin,
  },
  {
    id: 'mcp-management',
    title: 'MCP 服务器管理',
    description: '统一查看和管理所有 MCP 服务器和子代理',
    step: 'tab-scope',
    icon: Settings,
  },
  {
    id: 'export-functionality',
    title: '配置导出',
    description: '导出配置为 JSON、Markdown 或 CSV 格式',
    step: 'complete',
    icon: Download,
  },
]
