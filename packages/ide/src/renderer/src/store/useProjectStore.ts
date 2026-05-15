import { create } from 'zustand'

interface ProjectState {
  projectPath: string | null
  activeFile: string | null
  globalLoading: boolean
  isPreviewOpen: boolean
  previewUrl: string | null
  previewLoading: boolean
  setProjectPath: (path: string | null) => void
  setActiveFile: (file: string | null) => void
  setGlobalLoading: (loading: boolean) => void
  setIsPreviewOpen: (open: boolean) => void
  setPreviewUrl: (url: string | null) => void
  setPreviewLoading: (loading: boolean) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectPath: null,
  activeFile: null,
  globalLoading: false,
  isPreviewOpen: true,
  previewUrl: null,
  previewLoading: false,
  setProjectPath: (path) => set({ projectPath: path, activeFile: null, isPreviewOpen: true }),
  setActiveFile: (file) => set({ activeFile: file }),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  setIsPreviewOpen: (open) => set({ isPreviewOpen: open }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setPreviewLoading: (loading) => set({ previewLoading: loading })
}))
