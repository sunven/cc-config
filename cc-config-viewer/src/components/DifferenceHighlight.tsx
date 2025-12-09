import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, AlertTriangle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import type { DiffResult } from '../types/comparison'

interface DifferenceHighlightProps {
  diffResult: DiffResult
  side: 'left' | 'right'
  className?: string
}

/**
 * DifferenceHighlight Component
 * Visual highlighting of capability differences with color coding
 */
export function DifferenceHighlight({ diffResult, side, className }: DifferenceHighlightProps) {
  const getStatusConfig = () => {
    switch (diffResult.status) {
      case 'match':
        return {
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          label: 'Match',
          textColor: 'text-green-700 dark:text-green-300',
        }
      case 'different':
        return {
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
          label: 'Different',
          textColor: 'text-yellow-700 dark:text-yellow-300',
        }
      case 'only-left':
        return {
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: <ArrowLeft className="h-4 w-4 text-blue-600" />,
          label: side === 'left' ? 'Present' : 'Missing',
          textColor: 'text-blue-700 dark:text-blue-300',
        }
      case 'only-right':
        return {
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <ArrowRight className="h-4 w-4 text-green-600" />,
          label: side === 'right' ? 'Present' : 'Missing',
          textColor: 'text-green-700 dark:text-green-300',
        }
      case 'conflict':
        return {
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: <XCircle className="h-4 w-4 text-red-600" />,
          label: 'Conflict',
          textColor: 'text-red-700 dark:text-red-300',
        }
      default:
        return {
          bgColor: 'bg-gray-50 dark:bg-gray-950',
          borderColor: 'border-gray-200 dark:border-gray-800',
          icon: null,
          label: 'Unknown',
          textColor: 'text-gray-700 dark:text-gray-300',
        }
    }
  }

  const config = getStatusConfig()
  const capability = side === 'left' ? diffResult.leftValue : diffResult.rightValue

  if (!capability) {
    return null
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border ${className || ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {config.icon}
              <span className={`text-sm font-medium ${config.textColor}`}>
                {config.label}
              </span>
              <Badge
                variant="secondary"
                className={`text-xs ${
                  diffResult.severity === 'high'
                    ? 'bg-red-100 text-red-700'
                    : diffResult.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {diffResult.severity}
              </Badge>
            </div>
            <div className="font-mono text-xs text-muted-foreground break-all">
              {capability.key}
            </div>
            <div className="mt-2 text-sm">
              <code className="px-2 py-1 bg-background rounded text-xs break-all">
                {JSON.stringify(capability.value, null, 2)}
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}