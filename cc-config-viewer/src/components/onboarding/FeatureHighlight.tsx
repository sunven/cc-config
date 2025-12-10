import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/hooks/useOnboarding'
import type { FeatureHighlight as FeatureHighlightType } from '@/types/onboarding'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface FeatureHighlightProps {
  feature: FeatureHighlightType
  isLastStep?: boolean
  totalSteps?: number
}

/**
 * FeatureHighlight component for onboarding tour steps
 *
 * Displays feature information with navigation controls
 */
export function FeatureHighlight({ feature, isLastStep = false, totalSteps = 6 }: FeatureHighlightProps) {
  const {
    currentStep,
    canSkip,
    nextStep,
    prevStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboarding()

  const handleNext = () => {
    if (isLastStep) {
      // Complete onboarding on last step
      completeOnboarding()
    } else {
      nextStep()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
            data-testid="feature-icon"
          >
            <feature.icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
        <CardDescription className="text-base">
          {feature.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>第 {currentStep + 1} 步，共 {totalSteps} 步</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>

        {/* Feature-specific content */}
        {feature.content && (
          <div className="mt-4">
            {feature.content}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-4">
        <div className="flex gap-2 flex-1">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              上一步
            </Button>
          )}
        </div>

        <div className="flex gap-2 flex-1 justify-end">
          {canSkip && (
            <Button
              variant="ghost"
              onClick={skipOnboarding}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              跳过引导
            </Button>
          )}

          {!isLastStep ? (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              下一步
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              完成
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
