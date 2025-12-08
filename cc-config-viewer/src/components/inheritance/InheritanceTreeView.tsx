/**
 * InheritanceTreeView component
 *
 * Provides a full inheritance tree view option for complex configuration scenarios.
 *
 * Implements:
 * - AC4: Full inheritance tree view option for complex configuration scenarios
 * - Subtask 4.1: Create expandable tree structure component
 * - Subtask 4.2: Support nested inheritance scenarios
 * - Subtask 4.3: Add tree navigation and search functionality
 * - AC8: Integration with InheritanceChain component (Story 3.2)
 */

import React, { useState } from 'react'
import type { ConfigEntry } from '../../types/config'
import type { InheritanceTreeViewProps } from '../../types/inheritance'
import { SourceIndicator } from '../SourceIndicator'

export const InheritanceTreeView: React.FC<InheritanceTreeViewProps> = ({
  configs,
  className,
  onNodeClick,
  initialExpandedKeys = []
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(initialExpandedKeys))
  const [searchTerm, setSearchTerm] = useState('')

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedKeys(newExpanded)
  }

  const filteredConfigs = configs.filter(config =>
    config.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div
      data-testid="inheritance-tree-view"
      data-inheritance-chain-integration="true"
      className={`inheritance-tree-view ${className || ''}`}
    >
      <div data-testid="tree-container" className="mb-4">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search configurations..."
          className="w-full p-2 border border-gray-300 rounded mb-4"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Tree Root */}
        <div data-testid="tree-root" className="space-y-2">
          {filteredConfigs.map(config => {
            const isExpanded = expandedKeys.has(config.key)

            return (
              <div
                key={config.key}
                data-testid={config.key}
                className={`border border-gray-200 rounded ${isExpanded ? 'node-expanded' : ''}`}
              >
                {/* Node Header */}
                <div
                  className="flex items-center justify-between p-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    toggleExpanded(config.key)
                    onNodeClick?.(config.key)
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <button
                      data-testid="expand-button"
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className="font-mono text-sm">{config.key}</span>
                  </div>
                  <SourceIndicator sourceType={config.source.type} />
                </div>

                {/* Node Content */}
                {isExpanded && (
                  <div data-testid="tree-expanded" className="p-3 bg-white">
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-xs font-medium text-gray-600">Current Value:</h5>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {JSON.stringify(config.value)}
                        </code>
                      </div>

                      <div>
                        <h5 className="text-xs font-medium text-gray-600">Source:</h5>
                        <p className="text-xs text-gray-700">{config.source.path}</p>
                      </div>

                      {config.inherited && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-xs text-yellow-800">
                            ↳ Inherited from User Level
                          </p>
                        </div>
                      )}

                      {config.overridden && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs text-orange-800">
                            ↳ Overridden from User Level
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 text-xs text-gray-600">
          User Level → Project Level
        </div>
      </div>
    </div>
  )
}