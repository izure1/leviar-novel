import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { scaffoldProject, updateProject } from './services/project'
import { ProjectWatcher } from './services/watcher'
import { PreviewService } from './services/preview'

const watcher = new ProjectWatcher()
const previewService = new PreviewService()
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Project Management IPCs
  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return canceled ? null : filePaths[0]
  })

  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    return canceled ? null : filePaths
  })

  ipcMain.handle('project:scaffold', async (_, targetDir: string) => {
    try {
      await scaffoldProject(targetDir)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('project:load', async (_, projectPath: string) => {
    try {
      await watcher.start(projectPath, mainWindow ?? undefined)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('project:update', async (_, projectPath: string) => {
    try {
      await updateProject(projectPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('preview:start', async (_, projectPath: string) => {
    try {
      const url = await previewService.start(projectPath)
      return { success: true, url }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('preview:stop', async () => {
    try {
      await previewService.stop()
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('project:getTypes', async (_, _projectPath: string) => {
    try {
      const fs = require('fs/promises')
      const path = require('path')
      const typesDir = app.isPackaged
        ? path.join(process.resourcesPath, 'core-template', 'dist', 'types')
        : path.join(app.getAppPath(), 'resources', 'core-template', 'dist', 'types')
      
      const types: { path: string, content: string }[] = []
      
      const readTypesRecursively = async (currentPath: string, relativeRoot: string = '') => {
        try {
          const entries = await fs.readdir(currentPath, { withFileTypes: true })
          for (const entry of entries) {
            const entryPath = path.join(currentPath, entry.name)
            const relPath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name
            
            if (entry.isDirectory()) {
              await readTypesRecursively(entryPath, relPath)
            } else if (entry.name.endsWith('.d.ts')) {
              const content = await fs.readFile(entryPath, 'utf-8')
              types.push({ path: relPath, content })
            }
          }
        } catch (e) {
          console.error('[IDE] Failed to read types dir:', currentPath, e)
        }
      }
      
      await readTypesRecursively(typesDir)
      return { success: true, types }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // File System IPCs
  ipcMain.handle('fs:checkExists', async (_, targetPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.access(targetPath)
      return { success: true, exists: true }
    } catch {
      return { success: true, exists: false }
    }
  })

  ipcMain.handle('fs:readFile', async (_, filePath: string) => {
    try {
      const fs = require('fs/promises')
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, content }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:writeFile', async (_, filePath: string, content: string) => {
    try {
      const fs = require('fs/promises')
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:copyFile', async (_, src: string, dest: string) => {
    try {
      const fs = require('fs/promises')
      const path = require('path')
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(src, dest)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:renameFile', async (_, oldPath: string, newPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.rename(oldPath, newPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:deleteFile', async (_, targetPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.unlink(targetPath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:deleteDir', async (_, targetPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.rm(targetPath, { recursive: true, force: true })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:mkdir', async (_, targetPath: string) => {
    try {
      const fs = require('fs/promises')
      await fs.mkdir(targetPath, { recursive: true })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('fs:readDir', async (_, dirPath: string, recursive = false) => {
    try {
      const fs = require('fs/promises')
      const path = require('path')
      
      const readRecursively = async (currentPath: string, relativeRoot: string = ''): Promise<any[]> => {
        const entries = await fs.readdir(currentPath, { withFileTypes: true })
        const result: any[] = []
        for (const entry of entries) {
          const isDir = entry.isDirectory()
          const relativePath = path.join(relativeRoot, entry.name).replace(/\\/g, '/')
          const node = { name: entry.name, isDirectory: isDir, path: relativePath, children: [] as any[] }
          if (isDir && recursive) {
            node.children = await readRecursively(path.join(currentPath, entry.name), relativePath)
          }
          result.push(node)
        }
        return result
      }
      
      const files = await readRecursively(dirPath)
      return { success: true, files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
