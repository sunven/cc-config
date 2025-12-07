import { cn } from '@/lib/utils'

interface ScopeIndicatorProps {
  scope: 'user' | 'project'
  projectName?: string
}

export function ScopeIndicator({ scope, projectName }: ScopeIndicatorProps) {
  const scopeConfig = {
    user: {
      icon: '🏠',
      label: '用户级配置',
      color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    project: {
      icon: '📁',
      label: projectName ? `项目: ${projectName}` : '项目级配置',
      color: 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const config = scopeConfig[scope]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`当前作用域: ${config.label}`}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md border",
        config.color
      )}
    >
      <span className="text-base" aria-hidden="true">{config.icon}</span>
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  )
}
