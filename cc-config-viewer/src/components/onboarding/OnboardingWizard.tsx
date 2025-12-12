import { useEffect } from 'react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { WelcomeScreen } from './WelcomeScreen'
import { FeatureHighlight } from './FeatureHighlight'
import { SampleProject } from './SampleProject'
import { ONBOARDING_FEATURES } from '@/lib/sampleData'
import {
  Search,
  GitCompare,
  MapPin,
  Settings,
  Download,
  Database
} from 'lucide-react'

/**
 * Mapping of onboarding steps to icons
 */
const STEP_ICONS = {
  welcome: Settings,
  'tab-scope': MapPin,
  'project-discovery': Search,
  'config-comparison': GitCompare,
  'source-identification': MapPin,
  'sample-project': Database,
  complete: Settings,
}

/**
 * OnboardingWizard component
 *
 * Orchestrates the complete onboarding flow:
 * 1. Welcome screen
 * 2. Feature highlights
 * 3. Sample project demonstration
 * 4. Completion
 */
export function OnboardingWizard() {
  const { isActive, currentStep } = useOnboarding()

  // Handle keyboard navigation - must be before any conditional returns
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Escape to skip
      if (e.key === 'Escape') {
        // Skip action will be handled by individual components
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  // Don't render if onboarding is not active
  if (!isActive) {
    return null
  }

  const totalSteps = 6

  // Render different content based on current step
  const renderStepContent = () => {
    // Step 0: Welcome screen (handled by WelcomeScreen component)
    if (currentStep === 0) {
      return null // WelcomeScreen is rendered separately in App.tsx
    }

    // Steps 1-5: Feature highlights
    if (currentStep >= 1 && currentStep <= 5) {
      const featureIndex = currentStep - 1
      const feature = ONBOARDING_FEATURES[featureIndex]

      if (!feature) {
        return null
      }

      // Add icon to feature
      const IconComponent = STEP_ICONS[feature.step] || Settings

      return (
        <FeatureHighlight
          feature={{
            ...feature,
            icon: IconComponent,
          }}
          isLastStep={currentStep === totalSteps - 1}
          totalSteps={totalSteps}
        />
      )
    }

    // Step 5 (index 5): Sample project
    if (currentStep === 5) {
      return <SampleProject />
    }

    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-testid="onboarding-wizard"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding Tour"
    >
      <div className="container mx-auto px-4 py-8">
        {renderStepContent()}
      </div>
    </div>
  )
}
