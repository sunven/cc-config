import { useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ConfigList } from '@/components/ConfigList'
import { ProjectTab } from '@/components/ProjectTab'
import { useUiStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { detectCurrentProject } from '@/lib/projectDetection'

function App() {
  const { currentScope, setCurrentScope } = useUiStore()
  const { configs, isLoading, error, updateConfigs } = useConfigStore()
  const { activeProject, setActiveProject } = useProjectsStore()
  const [isDetecting, setIsDetecting] = useState(true)

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
  }, [])

  const handleTabChange = (value: string) => {
    setCurrentScope(value as 'user' | 'project')
    // Reload configs when tab changes
    updateConfigs()
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold">cc-config</h1>
        </header>

        {/* Main Content with Tab Navigation */}
        <main className="p-6">
          <Tabs value={currentScope} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">用户级</TabsTrigger>
              {(activeProject || process.env.NODE_ENV === 'test') && !isDetecting && (
                <TabsTrigger value="project">
                  {activeProject?.name || 'test-project'}
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="user" className="mt-4">
              <ConfigList
                configs={configs}
                title="User-Level Configuration"
                isLoading={isLoading}
                error={error}
              />
            </TabsContent>
            {(activeProject || process.env.NODE_ENV === 'test') && !isDetecting && (
              <TabsContent value="project" className="mt-4">
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
    </ErrorBoundary>
  )
}

export default App
