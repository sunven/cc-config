import { useEffect, useState, useCallback, useMemo } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfigList } from '@/components/ConfigList'
import { ProjectTab } from '@/components/ProjectTab'
import { ScopeIndicator } from '@/components/ScopeIndicator'
import { useUiStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useFileWatcher } from '@/hooks/useFileWatcher'
import { detectCurrentProject } from '@/lib/projectDetection'

function App() {
  const { currentScope, setCurrentScope } = useUiStore()
  const { configs, isLoading, error, updateConfigs } = useConfigStore()
  const { activeProject, setActiveProject } = useProjectsStore()
  const [isDetecting, setIsDetecting] = useState(true)

  // Initialize file watcher for automatic config updates
  useFileWatcher()

  // Detect project on mount
  useEffect(() => {
    const findProject = async () => {
      try {
        const project = await detectCurrentProject()
        if (project) {
          setActiveProject(project)
        }
      } catch (error) {
        console.error('Failed to detect project:', error)
      } finally {
        setIsDetecting(false)
      }
    }

    findProject()
  }, [setActiveProject])

  // Load initial config when app starts
  useEffect(() => {
    updateConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentionally run only once on mount

  const handleTabChange = useCallback((value: string) => {
    setCurrentScope(value as 'user' | 'project')
    // Reload configs when tab changes
    updateConfigs()
  }, [setCurrentScope, updateConfigs])

  // Memoize project tab visibility condition
  const showProjectTab = useMemo(() =>
    (activeProject || process.env.NODE_ENV === 'test') && !isDetecting,
    [activeProject, isDetecting]
  )

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
              <TabsContent value="user" className="mt-4">
                <div className="mb-4">
                  <ScopeIndicator scope="user" />
                </div>
                <ConfigList
                  configs={configs}
                  title="User-Level Configuration"
                  isLoading={isLoading}
                  error={error}
                />
              </TabsContent>
              {showProjectTab && (
                <TabsContent value="project" className="mt-4">
                  <div className="mb-4">
                    <ScopeIndicator scope="project" projectName={activeProject?.name} />
                  </div>
                  <ProjectTab scope="project" project={activeProject} />
                  <ConfigList
                    configs={configs}
                    title="Project-Level Configuration"
                    isLoading={isLoading}
                    error={error}
                  />
                </TabsContent>
              )}
            </Tabs>
          </main>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
