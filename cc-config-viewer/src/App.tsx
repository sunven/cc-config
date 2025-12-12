import { useEffect, useCallback, useMemo, useState, Suspense, lazy } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ErrorDisplay, ErrorBadge } from '@/components/ErrorDisplay'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfigList } from '@/components/ConfigList'
import { ProjectTab } from '@/components/ProjectTab'
import { ScopeIndicator } from '@/components/ScopeIndicator'
import { ProjectSelector } from '@/components/ProjectSelector'
import { McpList } from '@/components/McpList'
import { AgentList } from '@/components/AgentList'
import { LoadingStates } from '@/components/LoadingStates'
import { Button } from '@/components/ui/button'
import { SkipLink } from '@/components/Accessibility/SkipLink'
import { LanguageSwitcher } from '@/components/Language/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { ZoomControls } from '@/components/ZoomControls'
import { Header as SemanticHeader, Main as SemanticMain } from '@/components/SemanticHTML'
import { useUiStore } from '@/stores/uiStore'
import { useConfigStore } from '@/stores/configStore'
import { useProjectsStore } from '@/stores/projectsStore'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useFileWatcher } from '@/hooks/useFileWatcher'
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor'
import { detectCurrentProject } from '@/lib/projectDetection'
import {
  measureStartupTime,
  globalPerformanceMonitor,
} from '@/lib/performanceMonitor'
import { enableAutoPerformanceLogging, logPerformanceSummary } from '@/lib/performanceLogger'
import type { Project } from '@/types/project'
import { HelpCircle } from 'lucide-react'
import '@/lib/i18n'

// Lazy load heavy components for code splitting
const CapabilityPanel = lazy(() => import('@/components/CapabilityPanel').then(m => ({ default: m.CapabilityPanel })))
const ProjectDashboard = lazy(() => import('@/components/ProjectDashboard').then(m => ({ default: m.ProjectDashboard })))
const ProjectComparison = lazy(() => import('@/components/ProjectComparison').then(m => ({ default: m.ProjectComparison })))
const OnboardingWizard = lazy(() => import('@/components/onboarding/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })))

// Inner component that uses accessibility hooks
function AppContent() {
  // Use selectors for fine-grained subscriptions (Task 3 optimization)
  const currentScope = useUiStore((state) => state.currentScope)
  const setCurrentScope = useUiStore((state) => state.setCurrentScope)
  // Split into separate selectors to avoid creating new object on each render
  const isLoading = useUiStore((state) => state.isLoading)
  const loadingMessage = useUiStore((state) => state.loadingMessage)

  // Onboarding state
  const { hasSeenOnboarding, resetOnboarding } = useOnboarding()

  // Content tab state for capability views
  const [currentContentTab, setCurrentContentTab] = useState<'config' | 'mcp' | 'agents' | 'capabilities'>('config')

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

  // Initialize memory monitoring (checks every 30 seconds)
  useMemoryMonitor(30000)

  // Enable auto performance logging in development mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Log slow operations every 60 seconds
      const cleanup = enableAutoPerformanceLogging(60000)

      // Log performance summary on page hide (before user leaves)
      const handleBeforeUnload = () => {
        logPerformanceSummary()
      }

      window.addEventListener('beforeunload', handleBeforeUnload)

      return () => {
        cleanup()
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [])

  // Check onboarding status on app mount
  useEffect(() => {
    // Onboarding is shown automatically by WelcomeScreen component
    // when hasSeenOnboarding is false
    // No action needed here - the component handles the display logic
  }, [hasSeenOnboarding])

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

  // Measure startup time - runs once after app is interactive
  useEffect(() => {
    const measureAppStartup = async () => {
      // Wait for initial loading to complete
      if (isInitialLoading) return

      // Measure startup time from app launch to interactive UI
      const startupMeasurement = measureStartupTime()

      // Record in global performance monitor
      globalPerformanceMonitor.recordMetric(startupMeasurement)

      // Log in development mode
      if (import.meta.env.DEV) {
        const status = startupMeasurement.meetsRequirement ? '✓' : '⚠'
        console.debug(
          `${status} [Performance] App startup: ${startupMeasurement.duration.toFixed(2)}ms (threshold: 3000ms)`
        )
      }
    }

    measureAppStartup()
  }, [isInitialLoading])

  // Memoized tab change handler - NO data fetching on tab switch
  // Data is served from cache, only revalidated in background if stale
  const handleTabChange = useCallback((value: string) => {
    const newScope = value as 'user' | 'project'
    const oldScope = currentScope

    // Measure tab switch performance
    const startTime = performance.now()

    setCurrentScope(newScope)
    // Use switchToScope which serves from cache first (instant switch)
    switchToScope(newScope)

    // Measure tab switch time
    const endTime = performance.now()
    const duration = endTime - startTime

    // Record tab switch measurement
    const tabSwitchMeasurement = {
      name: 'tab-switch',
      duration,
      timestamp: Date.now(),
      meetsRequirement: duration < 100,
      from: oldScope,
      to: newScope,
    }

    // Record in global performance monitor
    globalPerformanceMonitor.recordMetric(tabSwitchMeasurement)

    // Log in development mode for slow tab switches
    if (import.meta.env.DEV && duration > 100) {
      console.warn(
        `⚠ [Performance] Slow tab switch: ${duration.toFixed(2)}ms (threshold: 100ms) from ${oldScope} to ${newScope}`
      )
    }
  }, [setCurrentScope, switchToScope, currentScope])

  // Handle project selection from ProjectSelector
  const handleProjectSelect = useCallback((project: Project) => {
    const oldScope = currentScope

    // Measure project switch performance
    const startTime = performance.now()

    // Switch to project scope and load configs for the selected project
    setCurrentScope('project')
    switchToScope('project', project.path)

    // Measure project switch time
    const endTime = performance.now()
    const duration = endTime - startTime

    // Record project switch measurement
    const projectSwitchMeasurement = {
      name: 'project-switch',
      duration,
      timestamp: Date.now(),
      meetsRequirement: duration < 100,
      from: oldScope,
      to: 'project',
      metadata: { projectPath: project.path },
    }

    // Record in global performance monitor
    globalPerformanceMonitor.recordMetric(projectSwitchMeasurement)

    // Log in development mode for slow switches
    if (import.meta.env.DEV && duration > 100) {
      console.warn(
        `⚠ [Performance] Slow project switch: ${duration.toFixed(2)}ms (threshold: 100ms)`
      )
    }
  }, [setCurrentScope, switchToScope, currentScope])

  // Handle replay tour
  const handleReplayTour = useCallback(() => {
    resetOnboarding()
  }, [resetOnboarding])

  // Handle content tab switching
  const switchToCapabilitiesTab = useCallback(() => {
    setCurrentContentTab('capabilities')
  }, [])

  // Memoize project tab visibility condition
  const showProjectTab = useMemo(() =>
    (activeProject || import.meta.env.MODE === 'test'),
    [activeProject]
  )

  // Check if comparison is active
  const isComparisonActive = comparison.isComparing

  // Dynamic grid columns based on visible tabs
  const tabGridCols = showProjectTab ? 'grid-cols-2' : 'grid-cols-1'

  return (
    <TooltipProvider>
      <SkipLink targetId="main-content" />
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <SemanticHeader className="border-b border-border px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">cc-config</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <ZoomControls />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReplayTour}
              className="flex items-center gap-2"
              aria-label="帮助"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">帮助</span>
            </Button>
            <ErrorBadge />
          </div>
        </SemanticHeader>

        {/* Global Loading Overlay */}
        <LoadingStates
          isLoading={isLoading}
          message={loadingMessage}
          indicator="overlay"
        />

        {/* Onboarding Wizard */}
        <Suspense fallback={<LoadingStates isLoading={true} message="Loading onboarding..." />}>
          <OnboardingWizard />
        </Suspense>

        {/* Main Content with Tab Navigation */}
        <SemanticMain id="main-content" className="p-6 space-y-4">
          {/* Error Display Area */}
          <ErrorDisplay maxErrors={3} />

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
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                </TabsList>
                <TabsContent value="config" className="mt-4">
                  <ConfigList
                    configs={configs}
                    title="User-Level Configuration"
                    isLoading={isInitialLoading}
                    error={error}
                  />
                </TabsContent>
                <TabsContent value="mcp" className="mt-4">
                  <McpList scope="user" />
                </TabsContent>
                <TabsContent value="agents" className="mt-4">
                  <AgentList scope="user" />
                </TabsContent>
                <TabsContent value="capabilities" className="mt-4">
                  <Suspense fallback={<LoadingStates isLoading={true} message="Loading capabilities..." />}>
                    <CapabilityPanel scope="user" />
                  </Suspense>
                </TabsContent>
                <TabsContent value="dashboard" className="mt-4">
                  <Suspense fallback={<LoadingStates isLoading={true} message="Loading dashboard..." />}>
                    <ProjectDashboard onViewCapabilities={switchToCapabilitiesTab} />
                  </Suspense>
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
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
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
                    <Suspense fallback={<LoadingStates isLoading={true} message="Loading capabilities..." />}>
                      <CapabilityPanel scope="project" projectName={activeProject?.name} />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="dashboard" className="mt-4">
                    <Suspense fallback={<LoadingStates isLoading={true} message="Loading dashboard..." />}>
                      <ProjectDashboard onViewCapabilities={switchToCapabilitiesTab} />
                    </Suspense>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            )}
          </Tabs>

          {/* Comparison View - shown when comparison is active */}
          {isComparisonActive && (
            <div className="mt-4">
              <Suspense fallback={<LoadingStates isLoading={true} message="Loading comparison..." />}>
                <ProjectComparison />
              </Suspense>
            </div>
          )}
        </SemanticMain>
      </div>
    </TooltipProvider>
  )
}

// Main App component - wraps content with providers
function App() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('=== App Error Details ===')
      console.error('Error:', error.message)
      console.error('Stack:', error.stack)
      console.error('Component Stack:', errorInfo.componentStack)
    }}>
      <AppContent />
    </ErrorBoundary>
  )
}

export default App
