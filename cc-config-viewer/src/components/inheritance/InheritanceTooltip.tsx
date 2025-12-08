/**
 * InheritanceTooltip component
 *
 * Displays interactive tooltips revealing the complete inheritance path
 * for each configuration item.
 *
 * Implements:
 * - AC2: Interactive tooltips revealing the complete inheritance path for each configuration item
 * - Subtask 2.3: Display file path and line number for each inherited value
 */

import React from 'react'
import type { InheritanceTooltipProps } from '../../types/inheritance'

export const InheritanceTooltip: React.FC<InheritanceTooltipProps> = ({
  data,
  visible,
  position,
  onClose
}) => {
  if (!visible) return null

  return (
    <div
      data-testid="inheritance-tooltip"
      data-classification={data.classification}
      className="inheritance-tooltip hoverable absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md"
      style={{
        left: position.x,
        top: position.y
      }}
      onClick={onClose}
    >
      <div className="mb-2">
        <h4 className="font-semibold text-sm">{data.configKey}</h4>
      </div>

      <div className="space-y-2">
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-1">Current Value:</h5>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {JSON.stringify(data.currentValue)}
          </code>
        </div>

        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-1">Inheritance Path:</h5>
          <div className="space-y-1">
            {data.path.map((step, index) => (
              <div key={index} className="flex items-center text-xs">
                <span className={`px-2 py-0.5 rounded ${
                  step.level === 'user'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {step.level === 'user' ? 'User Level' : 'Project Level'}
                </span>
                <span className="ml-2 text-gray-600">→</span>
                <span className="ml-2 font-mono">
                  {JSON.stringify(step.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {(data.filePath || data.lineNumber) && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 mb-1">Location:</h5>
            <p className="text-xs text-gray-700">
              {data.filePath && <span>{data.filePath}</span>}
              {data.lineNumber && <span className="ml-2">Line {data.lineNumber}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}