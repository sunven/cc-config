import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

interface InheritedIndicatorProps {
  source: 'user' | 'project'
  showTooltip?: boolean
}

export function InheritedIndicator({ source, showTooltip = true }: InheritedIndicatorProps) {
  const sourceLabels = {
    user: '继承自用户级',
    project: '继承自项目级'
  }

  const indicator = (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <polyline points="9,14 4,9 9,4" />
        <path d="M20,20v-7a4,4 0 0 0-4-4H4" />
      </svg>
      {sourceLabels[source]}
    </span>
  )

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{indicator}</TooltipTrigger>
        <TooltipContent>
          <p>此配置从 {source === 'user' ? '用户级' : '项目级'} 继承</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return indicator
}
