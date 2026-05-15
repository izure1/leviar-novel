import { create } from 'zustand'

interface ProjectState {
  projectPath: string | null
  activeFile: string | null
  globalLoading: boolean
  setProjectPath: (path: string | null) => void
  setActiveFile: (file: string | null) => void
  setGlobalLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectPath: null,
  activeFile: null,
  globalLoading: false,
  setProjectPath: (path) => set({ projectPath: path, activeFile: null }),
  setActiveFile: (file) => set({ activeFile: file }),
  setGlobalLoading: (loading) => set({ globalLoading: loading })
}))
