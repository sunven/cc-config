/**
 * InheritancePathVisualizer component
 *
 * Visualizes the inheritance path from User Level to Project Level
 * with directional arrows and color-coded source indicators.
 *
 * Implements:
 * - AC1: Visual chain display showing "User Level → Project Level" with directional arrows
 * - AC5: Clear visual differentiation between inherited, overridden, and new values
 * - AC6: Responsive design that works on different screen sizes
 * - AC7: Integration with existing color-coded source indicators (Story 3.1)
 * - AC8: Support for the inheritance calculator (Story 3.2)
 */

import React from 'react'
import type { ConfigEntry } from '../../types/config'
import type { InheritancePathVisualizerProps } from '../../types/inheritance'
import { SourceIndicator } from '../SourceIndicator'

export const InheritancePathVisualizer: React.FC<InheritancePathVisualizerProps> = ({
  configs,
  className,
  onHighlight
}) => {
  // Group configs by source type for visualization
  const userConfigs = configs.filter(c => c.source.type === 'user')
  const projectConfigs = configs.filter(c => c.source.type === 'project')
  const inheritedConfigs = configs.filter(c => c.source.type === 'inherited')

  // Handle empty state
  if (configs.length === 0) {
    return (
      <div
        data-testid="inheritance-path-visualizer"
        className={`inheritance-path-visualizer ${className || ''}`}
      >
        <p>No configuration entries</p>
      </div>
    )
  }

  return (
    <div
      data-testid="inheritance-path-visualizer"
      className={`inheritance-path-visualizer responsive ${className || ''}`}
    >
      {/* Visual Chain: User Level → Project Level */}
      <div data-testid="visual-chain" className="mb-6">
        <div className="flex items-center justify-between mb-4">
          {/* User Level */}
          <div
            data-testid="user-level"
            className="flex-1"
          >
            <h3 className="text-lg font-semibold mb-2 text-blue-800">User Level</h3>
            <div className="space-y-2">
              {userConfigs.map(config => (
                <div
                  key={config.key}
                  data-testid={config.key}
                  data-classification="user-level"
                  className="p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => onHighlight?.(config.key)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{config.key}</span>
                    <SourceIndicator sourceType="user" />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {JSON.stringify(config.value)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow Arrow */}
          <div
            data-testid="flow-arrow"
            data-direction="user-to-project"
            className="mx-4 flex flex-col items-center"
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 20 L30 20 M20 10 L30 20 L20 30"
                stroke="#6B7280"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xs text-gray-500 mt-1">inherits to</span>
          </div>

          {/* Project Level */}
          <div
            data-testid="project-level"
            className="flex-1"
          >
            <h3 className="text-lg font-semibold mb-2 text-green-800">Project Level</h3>
            <div className="space-y-2">
              {projectConfigs.map(config => {
                const isInherited = inheritedConfigs.some(ic => ic.key === config.key)
                const isOverridden = config.source.type === 'project' && isInherited

                return (
                  <div
                    key={config.key}
                    data-testid={config.key}
                    data-classification={isOverridden ? 'override' : 'project-specific'}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      isOverridden
                        ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                        : 'bg-green-50 border-green-200 hover:bg-green-100'
                    }`}
                    onClick={() => onHighlight?.(config.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{config.key}</span>
                      <SourceIndicator sourceType={config.source.type} />
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(config.value)}
                    </div>
                    {isOverridden && (
                      <div className="text-xs text-yellow-700 mt-1">
                        ← Overridden from User Level
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Inherited Values Section */}
      {inheritedConfigs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2 text-gray-600">Inherited Values</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {inheritedConfigs.map(config => (
              <div
                key={config.key}
                data-testid={config.key}
                data-classification="inherited"
                className="p-2 bg-gray-50 border border-gray-200 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onHighlight?.(config.key)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{config.key}</span>
                  <SourceIndicator sourceType="inherited" />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {JSON.stringify(config.value)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  from {config.source.path}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}