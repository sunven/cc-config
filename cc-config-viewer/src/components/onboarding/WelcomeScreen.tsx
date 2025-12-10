import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOnboarding } from '@/hooks/useOnboarding'

/**
 * WelcomeScreen component for onboarding
 *
 * Displays:
 * - Welcome message
 * - Tab = Scope concept explanation
 * - Key features overview
 * - Get Started and Skip Tour buttons
 */
export function WelcomeScreen() {
  const { isActive, startOnboarding, skipOnboarding, canSkip } = useOnboarding()

  // Don't render if onboarding is not active
  if (!isActive) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="region"
      aria-label="欢迎使用 cc-config"
    >
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            欢迎使用 cc-config
          </CardTitle>
          <CardDescription className="text-lg">
            快速入门指南
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tab = Scope Concept */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Tab = 作用域概念</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">用户级</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  您的个人配置设置
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">项目级</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  特定项目的配置
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              配置来源追踪帮助您理解每个设置来自何处
            </p>
          </div>

          {/* Key Features */}
          <div className="space-y-3">
            <h3 className="text-xl font-semibold">主要功能</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="font-medium">项目发现与配置比较</p>
                  <p className="text-sm text-muted-foreground">
                    轻松发现和比较多个项目的配置差异
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="font-medium">配置来源识别</p>
                  <p className="text-sm text-muted-foreground">
                    追踪配置值的来源，了解继承关系
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                <div>
                  <p className="font-medium">MCP 服务器与子代理管理</p>
                  <p className="text-sm text-muted-foreground">
                    统一查看和管理您的 MCP 服务器和 AI 代理
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estimated Time */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium">预计完成时间</p>
            <p className="text-2xl font-bold text-primary">3 分钟</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          {canSkip && (
            <Button
              variant="outline"
              onClick={skipOnboarding}
              className="flex-1"
            >
              跳过引导
            </Button>
          )}
          <Button
            onClick={startOnboarding}
            className="flex-1"
            data-testid="get-started-button"
          >
            开始使用
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
