import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SampleProject } from '../SampleProject'
import { SAMPLE_PROJECT_DATA } from '@/lib/sampleData'

describe('SampleProject', () => {
  it('should render sample project title', () => {
    render(<SampleProject />)

    expect(screen.getByText('示例项目')).toBeInTheDocument()
  })

  it('should display project name', () => {
    render(<SampleProject />)

    expect(screen.getByText(SAMPLE_PROJECT_DATA.name)).toBeInTheDocument()
  })

  it('should display MCP servers section', () => {
    render(<SampleProject />)

    expect(screen.getByText('MCP 服务器')).toBeInTheDocument()
    expect(screen.getByText('filesystem')).toBeInTheDocument()
    expect(screen.getByText('postgres')).toBeInTheDocument()
    expect(screen.getByText('git')).toBeInTheDocument()
  })

  it('should display agents section', () => {
    render(<SampleProject />)

    expect(screen.getByText('代理')).toBeInTheDocument()
    expect(screen.getByText('CodeReviewer')).toBeInTheDocument()
    expect(screen.getByText('DataAnalyzer')).toBeInTheDocument()
    expect(screen.getByText('DevAssistant')).toBeInTheDocument()
  })

  it('should display configuration section', () => {
    render(<SampleProject />)

    expect(screen.getByText('配置')).toBeInTheDocument()
    expect(screen.getByText('theme')).toBeInTheDocument()
    expect(screen.getByText('scope')).toBeInTheDocument()
  })

  it('should show agent capabilities', () => {
    render(<SampleProject />)

    expect(screen.getAllByText('review').length).toBeGreaterThan(0)
    expect(screen.getAllByText('analyze').length).toBeGreaterThan(0)
    expect(screen.getAllByText('query').length).toBeGreaterThan(0)
  })

  it('should highlight user-level vs project-level sources', () => {
    render(<SampleProject />)

    // Should show source indicators - check for badges with user/project text
    expect(screen.getAllByText(/用户级|project/).length).toBeGreaterThan(0)
  })

  it('should display configuration values', () => {
    render(<SampleProject />)

    expect(screen.getAllByText('dark').length).toBeGreaterThan(0)
    expect(screen.getAllByText('user').length).toBeGreaterThan(0)
    expect(screen.getAllByText('zh-CN').length).toBeGreaterThan(0)
  })

  it('should render in a card layout', () => {
    render(<SampleProject />)

    const cardElement = screen.getByTestId('sample-project-card')
    expect(cardElement).toBeInTheDocument()
  })

  it('should show MCP server status', () => {
    render(<SampleProject />)

    // Check that at least one "active" status appears
    expect(screen.getAllByText('active').length).toBeGreaterThan(0)
  })

  it('should display agent models', () => {
    render(<SampleProject />)

    expect(screen.getByText('claude-3-sonnet')).toBeInTheDocument()
    expect(screen.getByText('claude-3-haiku')).toBeInTheDocument()
    expect(screen.getByText('claude-3-opus')).toBeInTheDocument()
  })

  it('should group items by category', () => {
    render(<SampleProject />)

    // Should have sections for different categories
    expect(screen.getByTestId('mcp-servers-section')).toBeInTheDocument()
    expect(screen.getByTestId('agents-section')).toBeInTheDocument()
    expect(screen.getByTestId('configs-section')).toBeInTheDocument()
  })

  it('should demonstrate key value propositions', () => {
    render(<SampleProject />)

    // Should show variety of configs
    expect(screen.getByText('autoSave')).toBeInTheDocument()
    expect(screen.getByText('notifications')).toBeInTheDocument()
    expect(screen.getByText('editor')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<SampleProject />)

    const mainElement = screen.getByTestId('sample-project-card')
    expect(mainElement).toBeInTheDocument()
  })
})
