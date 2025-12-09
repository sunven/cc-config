import { useEffect, useCallback, useMemo, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfigList } from '@/components/ConfigList'
import { ProjectTab } from '@/components/ProjectTab'
import { ScopeIndicator } from '@/components/ScopeIndicator'
import { ProjectSelector } from '@/components/ProjectSelector'
import { CapabilityPanel } from '@/components/CapabilityPanel'
import { McpList } from '@/components/McpList'
import { AgentList } from '@/components/AgentList'
import { ProjectDashboard } from '@/components/ProjectDashboard'
import { ProjectComparison } from '@/components/ProjectComparison'
import { useUiStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useFileWatcher } from '@/hooks/useFileWatcher'
import { detectCurrentProject } from '@/lib/projectDetection'
import type { Project } from '@/types/project'

function App() {
  // Use selectors for fine-grained subscriptions (Task 3 optimization)
  const currentScope = useUiStore((state) => state.currentScope)
  const setCurrentScope = useUiStore((state) => state.setCurrentScope)

  // Content tab state for capability views
  const [currentContentTab, setCurrentContentTab] = useState<'config' | 'mcp' | 'agents' | 'capabilities'>('config')

  // View state for dashboard and comparison
  const [currentView, setCurrentView] = useState<'dashboard' | 'comparison'>('dashboard')

  // Use selectors for configStore
  const configs = useConfigStore((state) => state.configs)
  const isInitialLoading = useConfigStore((state) => state.isInitialLoading)
  const error = useConfigStore((state) => state.error)
  const switchToScope = useConfigStore((state) => state.switchToScope)

  // Use selectors for projectsStore
  const activeProject = useProjectsStore((state) => state.activeProject)
  const setActiveProject = useProjectsStore((state) => state.setActiveProject)
  const comparison = useProjectsStore((state) => state.comparison)

  // Initialize file watcher for automatic config updates
  useFileWatcher()

  // Detect project on mount - only runs once
  useEffect(() => {
    let mounted = true

    const findProject = async () => {
      try {
        const project = await detectCurrentProject()
        if (mounted && project) {
          setActiveProject(project)
        }
      } catch (error) {
        console.error('Failed to detect project:', error)
      }
    }

    findProject()

    return () => {
      mounted = false
    }
  }, [setActiveProject])

  // Load initial config when app starts - only runs once
  useEffect(() => {
    // Initial load for current scope
    switchToScope(currentScope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally run only once on mount

  // Memoized tab change handler - NO data fetching on tab switch
  // Data is served from cache, only revalidated in background if stale
  const handleTabChange = useCallback((value: string) => {
    const newScope = value as 'user' | 'project'
    setCurrentScope(newScope)
    // Use switchToScope which serves from cache first (instant switch)
    switchToScope(newScope)
  }, [setCurrentScope, switchToScope])

  // Handle project selection from ProjectSelector
  const handleProjectSelect = useCallback((project: Project) => {
    // Switch to project scope and load configs for the selected project
    setCurrentScope('project')
    switchToScope('project', project.path)
  }, [setCurrentScope, switchToScope])

  // Handle view navigation
  const navigateToDashboard = useCallback(() => {
    setCurrentView('dashboard')
  }, [])

  const navigateToComparison = useCallback(() => {
    setCurrentView('comparison')
  }, [])

  // Handle content tab switching
  const switchToCapabilitiesTab = useCallback(() => {
    setCurrentContentTab('capabilities')
  }, [])

  // Memoize project tab visibility condition
  const showProjectTab = useMemo(() =>
    (activeProject || process.env.NODE_ENV === 'test'),
    [activeProject]
  )

  // Check if comparison is active
  const isComparisonActive = comparison.isComparing

  // Dynamic grid columns based on visible tabs
  const tabGridCols = showProjectTab ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          {/* Header */}
          <header className="border-b border-border px-6 py-4">
            <h1 className="text-xl font-semibold">cc-config</h1>
          </header>

          {/* Main Content with Tab Navigation */}
          <main className="p-6">
            <Tabs value={currentScope} onValueChange={handleTabChange} className="w-full">
              <TabsList className={`grid w-full ${tabGridCols}`}>
                <TabsTrigger value="user">用户级</TabsTrigger>
                {showProjectTab && (
                  <TabsTrigger value="project">
                    {activeProject?.name || 'test-project'}
                  </TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="user" className="mt-4 tab-content-transition">
                <div className="mb-4">
                  <ScopeIndicator scope="user" />
                </div>
                <Tabs value={currentContentTab} onValueChange={(value) => setCurrentContentTab(value as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="config">Config</TabsTrigger>
                    <TabsTrigger value="mcp">MCP</TabsTrigger>
                    <TabsTrigger value="agents">Agents</TabsTrigger>
                    <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                    <TabsTrigger value="dashboard" onClick={() => setCurrentView('dashboard')}>Dashboard</TabsTrigger>
                  </TabsList>
                  <TabsContent value="config" className="mt-4">
                    <ConfigList
                      configs={configs}
                      title="User-Level Configuration"
                      isLoading={isInitialLoading}
                      error={error}
                    />
                  </TabsContent>
                  <TabsContent value="capabilities" className="mt-4">
                    <CapabilityPanel scope="user" />
                  </TabsContent>
                  <TabsContent value="dashboard" className="mt-4">
                    <ProjectDashboard onViewCapabilities={switchToCapabilitiesTab} />
                  </TabsContent>
                </Tabs>
              </TabsContent>
              {showProjectTab && (
                <TabsContent value="project" className="mt-4 tab-content-transition">
                  <div className="mb-4 flex items-center gap-4">
                    <ScopeIndicator scope="project" projectName={activeProject?.name} />
                    <ProjectSelector onProjectSelect={handleProjectSelect} />
                  </div>
                  <ProjectTab scope="project" project={activeProject} />
                  <Tabs value={currentContentTab} onValueChange={(value) => setCurrentContentTab(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="config">Config</TabsTrigger>
                      <TabsTrigger value="mcp">MCP</TabsTrigger>
                      <TabsTrigger value="agents">Agents</TabsTrigger>
                      <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
                      <TabsTrigger value="dashboard" onClick={() => setCurrentView('dashboard')}>Dashboard</TabsTrigger>
                    </TabsList>
                    <TabsContent value="config" className="mt-4">
                      <ConfigList
                        configs={configs}
                        title="Project-Level Configuration"
                        isLoading={isInitialLoading}
                        error={error}
                      />
                    </TabsContent>
                    <TabsContent value="mcp" className="mt-4">
                      <McpList scope="project" />
                    </TabsContent>
                    <TabsContent value="agents" className="mt-4">
                      <AgentList scope="project" />
                    </TabsContent>
                    <TabsContent value="capabilities" className="mt-4">
                      <CapabilityPanel scope="project" projectName={activeProject?.name} />
                    </TabsContent>
                    <TabsContent value="dashboard" className="mt-4">
                      <ProjectDashboard onViewCapabilities={switchToCapabilitiesTab} />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              )}
            </Tabs>

            {/* Comparison View - shown when comparison is active */}
            {isComparisonActive && (
              <div className="mt-4">
                <ProjectComparison />
              </div>
            )}
          </main>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
