import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-xl font-semibold">cc-config</h1>
        </header>

        {/* Main Content with Tab Navigation */}
        <main className="p-6">
          <Tabs defaultValue="user" className="w-full">
            <TabsList>
              <TabsTrigger value="user">User Level</TabsTrigger>
              <TabsTrigger value="project" disabled>
                Project (Coming Soon)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="user" className="mt-4">
              <div className="text-center py-12">
                <h2 className="text-2xl font-medium text-muted-foreground">
                  Welcome to cc-config
                </h2>
                <p className="text-muted-foreground mt-2">
                  Your Claude Code configuration viewer
                </p>
              </div>
            </TabsContent>
            <TabsContent value="project" className="mt-4">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Project configuration will be available soon
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
