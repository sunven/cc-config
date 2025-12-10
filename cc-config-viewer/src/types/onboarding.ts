/**
 * Type definitions for onboarding system
 */

/**
 * Onboarding step types
 */
export type OnboardingStep =
  | 'welcome'
  | 'tab-scope'
  | 'project-discovery'
  | 'config-comparison'
  | 'source-identification'
  | 'sample-project'
  | 'complete'

/**
 * Onboarding state interface
 */
export interface OnboardingState {
  hasSeenOnboarding: boolean
  isActive: boolean
  currentStep: number
  canSkip: boolean
  skipped: boolean
}

/**
 * Onboarding actions interface
 */
export interface OnboardingActions {
  startOnboarding: () => void
  completeOnboarding: () => void
  skipOnboarding: () => void
  nextStep: () => void
  prevStep: () => void
  resetOnboarding: () => void
  setCanSkip: (canSkip: boolean) => void
  goToStep: (step: number) => void
}

/**
 * Complete onboarding hook return type
 */
export type UseOnboardingReturn = OnboardingState & OnboardingActions

/**
 * Onboarding status in localStorage
 */
export interface OnboardingStatus {
  hasSeen: boolean
  version: string
  completedAt: string | null
}

/**
 * Feature highlight for onboarding tour
 */
export interface FeatureHighlight {
  id: string
  title: string
  description: string
  step: OnboardingStep
  component?: string
  selector?: string
}

/**
 * Sample project data for demonstration
 */
export interface SampleProjectData {
  name: string
  path: string
  mcpServers: Array<{
    name: string
    type: string
    source: string
    status: string
    config?: Record<string, any>
  }>
  agents: Array<{
    name: string
    model: string
    source: string
    capabilities: string[]
  }>
  configs: Record<string, any>
}

/**
 * Onboarding configuration
 */
export interface OnboardingConfig {
  version: string
  steps: OnboardingStep[]
  features: FeatureHighlight[]
  sampleData: SampleProjectData
  estimatedDuration: number // in minutes
}
