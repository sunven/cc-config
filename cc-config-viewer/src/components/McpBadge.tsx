import React, { memo } from 'react'
import type { McpServer } from '../types'

interface McpBadgeProps {
  server: McpServer
}

export const McpBadge: React.FC<McpBadgeProps> = memo(function McpBadge({ server }) {
  const getStatusColor = (status: McpServer['status']) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 text-green-800'
      case 'stopped':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
        server.status
      )}`}
    >
      {server.name}
      <span className="ml-1 w-2 h-2 rounded-full bg-current opacity-50" />
    </span>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if server content changes
  return (
    prevProps.server.name === nextProps.server.name &&
    prevProps.server.status === nextProps.server.status
  )
})
