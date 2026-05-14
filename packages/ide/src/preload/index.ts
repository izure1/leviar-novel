import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    openFile: () => ipcRenderer.invoke('dialog:openFile')
  },
  project: {
    scaffold: (targetDir: string) => ipcRenderer.invoke('project:scaffold', targetDir),
    load: (projectPath: string) => ipcRenderer.invoke('project:load', projectPath),
    update: (projectPath: string) => ipcRenderer.invoke('project:update', projectPath)
  },
  preview: {
    start: (projectPath: string) => ipcRenderer.invoke('preview:start', projectPath),
    stop: () => ipcRenderer.invoke('preview:stop')
  },
  fs: {
    readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
    writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
    copyFile: (src: string, dest: string) => ipcRenderer.invoke('fs:copyFile', src, dest),
    readDir: (path: string, recursive?: boolean) => ipcRenderer.invoke('fs:readDir', path, recursive),
    renameFile: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:renameFile', oldPath, newPath),
    deleteFile: (path: string) => ipcRenderer.invoke('fs:deleteFile', path),
    deleteDir: (path: string) => ipcRenderer.invoke('fs:deleteDir', path),
    mkdir: (path: string) => ipcRenderer.invoke('fs:mkdir', path)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
