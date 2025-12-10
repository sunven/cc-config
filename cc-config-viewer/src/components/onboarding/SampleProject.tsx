import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SAMPLE_PROJECT_DATA } from '@/lib/sampleData'
import { Server, Bot, Settings, User, Folder } from 'lucide-react'

/**
 * SampleProject component for onboarding demonstration
 *
 * Displays sample project data to showcase key features
 */
export function SampleProject() {
  return (
    <div className="w-full max-w-4xl mx-auto" data-testid="sample-project">
      <Card data-testid="sample-project-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Folder className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">示例项目</CardTitle>
              <CardDescription className="text-base mt-1">
                {SAMPLE_PROJECT_DATA.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* MCP Servers Section */}
          <section data-testid="mcp-servers-section">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">MCP 服务器</h3>
            </div>
            <div className="grid gap-3">
              {SAMPLE_PROJECT_DATA.mcpServers.map((server) => (
                <div
                  key={server.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{server.type}</Badge>
                    <span className="font-medium">{server.name}</span>
                    {server.config && (
                      <Badge variant="secondary" className="text-xs">
                        已配置
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={server.status === 'active' ? 'default' : 'secondary'}
                    >
                      {server.status}
                    </Badge>
                    <Badge variant={server.source === 'user' ? 'default' : 'outline'}>
                      {server.source === 'user' ? '用户级' : '项目级'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Agents Section */}
          <section data-testid="agents-section">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">代理</h3>
            </div>
            <div className="grid gap-3">
              {SAMPLE_PROJECT_DATA.agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{agent.name}</span>
                    <Badge variant="outline">{agent.model}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {agent.capabilities.map((capability) => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant={agent.source === 'user' ? 'default' : 'outline'}>
                      {agent.source === 'user' ? '用户级' : '项目级'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Configuration Section */}
          <section data-testid="configs-section">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">配置</h3>
            </div>
            <div className="grid gap-2">
              {Object.entries(SAMPLE_PROJECT_DATA.configs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <span className="font-mono text-sm">{key}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <User className="w-3 h-3 mr-1" />
                      user
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Key Value Propositions */}
          <div className="bg-muted/50 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-2">💡 这个示例展示了：</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 多种 MCP 服务器类型和配置</li>
              <li>• 不同的 AI 代理及其能力</li>
              <li>• 配置的继承关系（用户级 vs 项目级）</li>
              <li>• 实时状态监控</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
