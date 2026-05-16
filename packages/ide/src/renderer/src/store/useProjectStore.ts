import { create } from 'zustand'

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'sky' | 'violet'
export type ThemeBg = 'slate' | 'zinc' | 'neutral' | 'stone' | 'gray'

interface ProjectState {
  projectPath: string | null
  activeFile: string | null
  globalLoading: boolean
  isPreviewOpen: boolean
  previewUrl: string | null
  previewLoading: boolean
  themeColor: ThemeColor
  themeBg: ThemeBg
  formatOnSave: boolean
  isSettingsOpen: boolean
  isGraphOpen: boolean
  pendingLine: number | null
  setProjectPath: (path: string | null) => void
  setActiveFile: (file: string | null) => void
  setGlobalLoading: (loading: boolean) => void
  setIsPreviewOpen: (open: boolean) => void
  setPreviewUrl: (url: string | null) => void
  setPreviewLoading: (loading: boolean) => void
  setThemeColor: (color: ThemeColor) => void
  setThemeBg: (bg: ThemeBg) => void
  setFormatOnSave: (format: boolean) => void
  setIsSettingsOpen: (open: boolean) => void
  setIsGraphOpen: (open: boolean) => void
  setPendingLine: (line: number | null) => void
  initSettings: () => Promise<void>
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectPath: null,
  activeFile: null,
  globalLoading: false,
  isPreviewOpen: true,
  previewUrl: null,
  previewLoading: false,
  themeColor: 'amber',
  themeBg: 'neutral',
  formatOnSave: true,
  isSettingsOpen: false,
  isGraphOpen: false,
  pendingLine: null,
  setProjectPath: (path) => set({ projectPath: path, activeFile: null, isPreviewOpen: true }),
  setActiveFile: (file) => {
    set({ activeFile: file })
    const state = get()
    if (state.isGraphOpen && file) {
      set({ isGraphOpen: false })
    }
  },
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  setIsPreviewOpen: (open) => set({ isPreviewOpen: open }),
  setPreviewUrl: (url) => set({ previewUrl: url }),
  setPreviewLoading: (loading) => set({ previewLoading: loading }),
  setThemeColor: (color) => {
    set({ themeColor: color })
    window.api.settings.set({ themeColor: color }).catch(console.error)
  },
  setThemeBg: (bg) => {
    set({ themeBg: bg })
    window.api.settings.set({ themeBg: bg }).catch(console.error)
  },
  setFormatOnSave: (format) => {
    set({ formatOnSave: format })
    window.api.settings.set({ formatOnSave: format }).catch(console.error)
  },
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsGraphOpen: (open) => set({ isGraphOpen: open }),
  setPendingLine: (line) => set({ pendingLine: line }),
  initSettings: async () => {
    try {
      const res = await window.api.settings.get()
      if (res.success && res.settings) {
        set({ 
          themeColor: res.settings.themeColor || 'amber',
          themeBg: res.settings.themeBg || 'neutral',
          formatOnSave: res.settings.formatOnSave ?? true
        })
      }
    } catch (e) {
      console.error('Failed to init settings:', e)
    }
  }
}))

