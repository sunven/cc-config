import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WelcomeScreen } from '../WelcomeScreen'
import { Button } from '@/components/ui/button'
import { mockUseOnboarding } from '@/hooks/useOnboarding'

// Mock the useOnboarding hook
vi.mock('@/hooks/useOnboarding', () => {
  const mockFn = vi.fn()
  return {
    useOnboarding: mockFn,
    mockUseOnboarding: mockFn, // Export for test access
  }
})

// Mock Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  ),
}))

describe('WelcomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock to default values
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
    } as any)
  })

  it('should render welcome message', () => {
    render(<WelcomeScreen />)

    expect(screen.getByText(/欢迎使用 cc-config/)).toBeInTheDocument()
    expect(screen.getByText(/快速入门指南/)).toBeInTheDocument()
  })

  it('should explain Tab = Scope concept', () => {
    render(<WelcomeScreen />)

    expect(screen.getByText(/Tab = 作用域概念/)).toBeInTheDocument()
    expect(screen.getByText(/用户级/)).toBeInTheDocument()
    expect(screen.getByText(/项目级/)).toBeInTheDocument()
    expect(screen.getByText(/配置来源追踪/)).toBeInTheDocument()
  })

  it('should call startOnboarding when Get Started is clicked', () => {
    const mockStartOnboarding = vi.fn()
    // Update the mock before rendering
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: mockStartOnboarding,
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
    } as any)

    render(<WelcomeScreen />)

    const button = screen.getByText('开始使用')
    fireEvent.click(button)

    expect(mockStartOnboarding).toHaveBeenCalledTimes(1)
  })

  it('should call skipOnboarding when Skip Tour is clicked', () => {
    const mockSkipOnboarding = vi.fn()
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: mockSkipOnboarding,
      nextStep: vi.fn(),
    } as any)

    render(<WelcomeScreen />)

    const button = screen.getByText(/跳过引导/)
    fireEvent.click(button)

    expect(mockSkipOnboarding).toHaveBeenCalledTimes(1)
  })

  it('should not show skip button when canSkip is false', () => {
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: false,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
    } as any)

    render(<WelcomeScreen />)

    expect(screen.queryByText(/跳过引导/)).not.toBeInTheDocument()
  })

  it('should display feature highlights', () => {
    render(<WelcomeScreen />)

    expect(screen.getByText(/项目发现与配置比较/)).toBeInTheDocument()
    expect(screen.getByText(/配置来源识别/)).toBeInTheDocument()
    expect(screen.getByText(/MCP 服务器与子代理管理/)).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<WelcomeScreen />)

    const welcomeSection = screen.getByRole('region', { name: /欢迎使用 cc-config/ })
    expect(welcomeSection).toBeInTheDocument()

    const buttons = screen.getAllByTestId('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should show estimated completion time', () => {
    render(<WelcomeScreen />)

    expect(screen.getByText(/预计完成时间/)).toBeInTheDocument()
    expect(screen.getByText(/3 分钟/)).toBeInTheDocument()
  })

  it('should handle keyboard navigation', () => {
    render(<WelcomeScreen />)

    const getStartedButton = screen.getByText('开始使用')

    fireEvent.keyDown(getStartedButton, { key: 'Enter', code: 'Enter' })
    // Button click should be triggered by Enter key
  })

  it('should render in onboarding mode when isActive is true', () => {
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
    } as any)

    render(<WelcomeScreen />)

    // Should render the welcome screen content
    expect(screen.getByText(/欢迎使用 cc-config/)).toBeInTheDocument()
  })

  it('should not render when onboarding is not active', () => {
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: false,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
    } as any)

    render(<WelcomeScreen />)

    // Should return null when not active
    expect(screen.queryByText(/欢迎使用 cc-config/)).not.toBeInTheDocument()
  })
})
