import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      dialog: {
        openDirectory: () => Promise<string | null>
        openFile: () => Promise<string[] | null>
      }
      project: {
        scaffold: (targetDir: string) => Promise<{ success: boolean; error?: string }>
        load: (projectPath: string) => Promise<{ success: boolean; error?: string }>
      }
      preview: {
        start: (projectPath: string) => Promise<{ success: boolean; url?: string; error?: string }>
        stop: () => Promise<{ success: boolean; error?: string }>
      }
      fs: {
        readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
        readDir: (dirPath: string) => Promise<{ success: boolean; files?: { name: string; isDirectory: boolean }[]; error?: string }>
        copyFile: (src: string, dest: string) => Promise<{ success: boolean; error?: string }>
      }
    }
  }
}
