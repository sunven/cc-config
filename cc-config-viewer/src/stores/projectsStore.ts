import { create } from 'zustand'
import type { Project } from '../types/project'

interface ProjectsStore {
  projects: Project[]
  activeProject: Project | null
  setActiveProject: (project: Project | null) => void
  addProject: (project: Project) => void
  removeProject: (id: string) => void
}

export const useProjectsStore = create<ProjectsStore>((set) => ({
  projects: [],
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
}))
