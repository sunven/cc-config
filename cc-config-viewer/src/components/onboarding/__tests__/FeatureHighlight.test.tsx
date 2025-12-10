import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeatureHighlight } from '../FeatureHighlight'
import type { FeatureHighlight as FeatureHighlightType } from '@/types/onboarding'
import { mockUseOnboarding } from '@/hooks/useOnboarding'
import { Search } from 'lucide-react'

// Mock the useOnboarding hook
vi.mock('@/hooks/useOnboarding', () => {
  const mockFn = vi.fn()
  return {
    useOnboarding: mockFn,
    mockUseOnboarding: mockFn,
  }
})

describe('FeatureHighlight', () => {
  const mockFeature: FeatureHighlightType = {
    id: 'project-discovery',
    title: '项目发现',
    description: '自动发现和管理您的所有 Claude 项目配置',
    step: 'project-discovery',
    icon: Search,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render feature title and description', () => {
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    expect(screen.getByText('项目发现')).toBeInTheDocument()
    expect(screen.getByText('自动发现和管理您的所有 Claude 项目配置')).toBeInTheDocument()
  })

  it('should call nextStep when Next button is clicked', () => {
    const mockNextStep = vi.fn()
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: mockNextStep,
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    const nextButton = screen.getByText('下一步')
    fireEvent.click(nextButton)

    expect(mockNextStep).toHaveBeenCalledTimes(1)
  })

  it('should call prevStep when Previous button is clicked', () => {
    const mockPrevStep = vi.fn()
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 1,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: mockPrevStep,
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    const prevButton = screen.getByText('上一步')
    fireEvent.click(prevButton)

    expect(mockPrevStep).toHaveBeenCalledTimes(1)
  })

  it('should call completeOnboarding when Finish button is clicked on last step', () => {
    const mockComplete = vi.fn()
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 5,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: mockComplete,
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} isLastStep />)

    const finishButton = screen.getByText('完成')
    fireEvent.click(finishButton)

    expect(mockComplete).toHaveBeenCalledTimes(1)
  })

  it('should show skip button when canSkip is true', () => {
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    expect(screen.getByText('跳过引导')).toBeInTheDocument()
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
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    expect(screen.queryByText('跳过引导')).not.toBeInTheDocument()
  })

  it('should display progress indicator', () => {
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 2,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} totalSteps={5} />)

    expect(screen.getByText('第 3 步，共 5 步')).toBeInTheDocument()
  })

  it('should render icon for feature', () => {
    render(<FeatureHighlight feature={mockFeature} />)

    const iconElement = screen.getByTestId('feature-icon')
    expect(iconElement).toBeInTheDocument()
  })

  it('should call skipOnboarding when skip button is clicked', () => {
    const mockSkip = vi.fn()
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 0,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: mockSkip,
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} />)

    const skipButton = screen.getByText('跳过引导')
    fireEvent.click(skipButton)

    expect(mockSkip).toHaveBeenCalledTimes(1)
  })

  it('should disable Next button on last step', () => {
    
    mockUseOnboarding.mockReturnValue({
      hasSeenOnboarding: false,
      isActive: true,
      currentStep: 5,
      canSkip: true,
      startOnboarding: vi.fn(),
      completeOnboarding: vi.fn(),
      skipOnboarding: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      resetOnboarding: vi.fn(),
      setCanSkip: vi.fn(),
      goToStep: vi.fn(),
    } as any)

    render(<FeatureHighlight feature={mockFeature} isLastStep />)

    expect(screen.queryByText('下一步')).not.toBeInTheDocument()
    expect(screen.getByText('完成')).toBeInTheDocument()
  })
})
