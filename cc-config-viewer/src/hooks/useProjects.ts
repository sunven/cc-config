import { useEffect, useState } from 'react'
import { useProjectsStore } from '../stores/projectsStore'

export function useProjects() {
  const { projects, activeProject, setActiveProject, addProject, removeProject } =
    useProjectsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    try {
      // Project discovery is handled by detectCurrentProject in App.tsx
      // which automatically detects projects based on config files
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function refreshProjects() {
    await loadProjects()
  }

  return {
    projects,
    activeProject,
    loading,
    error,
    setActiveProject,
    addProject,
    removeProject,
    refreshProjects,
  }
}
