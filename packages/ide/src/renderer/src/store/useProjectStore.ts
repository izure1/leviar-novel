import { create } from 'zustand'

interface ProjectState {
  projectPath: string | null
  activeFile: string | null
  setProjectPath: (path: string | null) => void
  setActiveFile: (file: string | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectPath: null,
  activeFile: null,
  setProjectPath: (path) => set({ projectPath: path, activeFile: null }),
  setActiveFile: (file) => set({ activeFile: file })
}))
