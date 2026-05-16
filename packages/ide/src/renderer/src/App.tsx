import { useState, useCallback, useEffect, useRef } from 'react'
import { World } from 'leviar'
import { useProjectStore } from './store/useProjectStore'
import { PreviewPanel } from './components/Preview/PreviewPanel'
import { ProjectSidebar } from './components/Sidebar/ProjectSidebar'
import { EditorArea } from './components/Editor/EditorArea'
import { DebugToolbar } from './components/Toolbar/DebugToolbar'
import { NewProjectDialog, NewProjectOptions } from './components/UI/NewProjectDialog'
import { LoadingOverlay } from './components/UI/LoadingOverlay'
import { SettingsModal } from './components/Settings/SettingsModal'
import { TitleBar } from './components/TitleBar/TitleBar'
import welcomeFumika from './assets/welcome/char_fumika.png'
import welcomeBg from './assets/welcome/bg.png'

const WelcomeScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const dpr = window.devicePixelRatio || 1
    const world = new World({
      canvas: canvasRef.current,
      width: window.innerWidth * dpr,
      height: window.innerHeight * dpr
    } as any)
    const camera = world.createCamera()
    world.camera = camera

    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const onMouseMove = (e: MouseEvent) => {
      // 캔버스 중앙을 0,0 으로 하는 마우스 오프셋 좌표
      targetX = (e.clientX - window.innerWidth / 2) * 0.1
      targetY = (e.clientY - window.innerHeight / 2) * 0.1
    }

    const initWorld = async () => {
      // 에셋을 먼저 비동기로 로드합니다.
      await world.loader.load({
        'character-fumika': welcomeFumika,
        'background': welcomeBg,
      })

      // 로딩된 에셋 키(charWelcome)를 사용하여 이미지를 생성합니다.
      const character = world.createImage({
        attribute: { src: 'character-fumika' },
        style: {
          width: 750,
          boxShadowBlur: 0,
          boxShadowColor: '#ffcbcb',
          boxShadowOffsetX: -10,
          boxShadowOffsetY: 10,
        },
        transform: {
          position: { x: -350, y: -250, z: 25 },
        }
      })

      world.createImage({
        attribute: { src: 'background' },
        style: {
          width: 1024 * 5,
          height: 576 * 5,
          blur: 3,
        },
        transform: {
          position: { z: 350 }
        }
      })

      character.fadeOut(1).once('end', () => {
        character.fadeIn(2500).once('end', () => {
          
        })
      })

      window.addEventListener('mousemove', onMouseMove)

      world.on('update', () => {
        // 부드러운 카메라 이동
        currentX += (targetX - currentX) * 0.05
        currentY += (targetY - currentY) * 0.05
        camera.transform.position.x = currentX
        camera.transform.position.y = currentY
      })

      world.start()
    }

    initWorld()

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      world.stop()
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 opacity-80"
      width={1024}
      height={576}
    />
  )
}

function App() {
  const { projectPath, setProjectPath, globalLoading, setGlobalLoading, isPreviewOpen, themeColor, themeBg, isSettingsOpen, setIsSettingsOpen, initSettings } = useProjectStore()
  const [newProjectData, setNewProjectData] = useState<{ isOpen: boolean, parentDir: string } | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  const [previewWidth, setPreviewWidth] = useState(400)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    initSettings()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = themeColor
    document.documentElement.dataset.bgTheme = themeBg
  }, [themeColor, themeBg])

  useEffect(() => {
    if (window.api?.window?.forceMaximize) {
      if (projectPath) {
        window.api.window.forceMaximize()
      } else {
        window.api.window.restoreWelcomeSize()
      }
    }
  }, [projectPath])

  const handleSidebarResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = sidebarWidth
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(600, startWidth + (moveEvent.clientX - startX)))
      setSidebarWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      setIsResizing(false)
    }
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
  }, [sidebarWidth])

  const handlePreviewResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    const startX = e.clientX
    const startWidth = previewWidth
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(200, Math.min(1000, startWidth - (moveEvent.clientX - startX)))
      setPreviewWidth(newWidth)
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      setIsResizing(false)
    }
    
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    document.body.style.cursor = 'col-resize'
  }, [previewWidth])

  const handleOpenProject = async () => {
    const path = await window.api.dialog.openDirectory()
    if (path) {
      setGlobalLoading(true)
      const res = await window.api.project.load(path)
      if (res.success) {
        setProjectPath(path)
      } else {
        alert('Failed to load project: ' + res.error)
      }
      setGlobalLoading(false)
    }
  }

  const handleScaffoldProject = async () => {
    const parentDir = await window.api.dialog.openDirectory()
    if (parentDir) {
      setNewProjectData({ isOpen: true, parentDir })
    }
  }

  const submitNewProject = async (options: NewProjectOptions) => {
    if (!newProjectData || !options.folderName) return
    
    // Windows root drive (e.g. D:\) 처리를 위해 끝에 있는 슬래시 제거
    const cleanParent = newProjectData.parentDir.replace(/[\\/]$/, '')
    const separator = newProjectData.parentDir.includes('\\') ? '\\' : '/'
    const targetDir = `${cleanParent}${separator}${options.folderName}`
    
    setGlobalLoading(true)
    const check = await window.api.fs.checkExists(targetDir)
    if (check.exists) {
      alert(`이미 해당 경로에 폴더가 존재합니다:\n${targetDir}`)
      setGlobalLoading(false)
      setNewProjectData(null)
      return
    }

    const res = await window.api.project.scaffold(targetDir, options)
    if (res.success) {
      await window.api.project.load(targetDir)
      setProjectPath(targetDir)
    } else {
      alert('Failed to scaffold project: ' + res.error)
    }
    setGlobalLoading(false)
    setNewProjectData(null)
  }

  if (!projectPath) {
    return (
      <div className="flex h-screen w-screen flex-col bg-surface-900 text-white overflow-hidden relative">
        <TitleBar />
        <WelcomeScene />
        {/* <div className="flex-1 flex flex-col items-center justify-center relative z-10 pointer-events-none">
          <div className="pointer-events-auto rounded-2xl border border-surface-700/50 bg-surface-900/60 p-12 text-center shadow-2xl backdrop-blur-xl">
            <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-cyan-400 to-primary-500 drop-shadow-sm">
              Fumika Engine
            </h1>
            <p className="mb-10 text-surface-400 font-medium tracking-wide">The Next Generation Visual Novel Studio</p>
            <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
              <button
                onClick={handleOpenProject}
                disabled={globalLoading}
                className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all hover:bg-primary-500 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="relative z-10">Open Existing Project</span>
              </button>
              <button
                onClick={handleScaffoldProject}
                disabled={globalLoading}
                className="group flex items-center justify-center gap-2 rounded-lg border border-surface-700 bg-surface-800/50 px-8 py-3.5 font-semibold text-white transition-all hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0"
              >
                Create New Project
              </button>
            </div>
          </div>
        </div> */}

        <NewProjectDialog
          isOpen={newProjectData?.isOpen || false}
          onConfirm={submitNewProject}
          onCancel={() => setNewProjectData(null)}
        />
        <LoadingOverlay />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-950 text-surface-300">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar width={sidebarWidth} />
        <div 
          className="w-1 cursor-col-resize bg-surface-800 hover:bg-primary-500 active:bg-primary-500 z-10 transition-colors shrink-0"
        onMouseDown={handleSidebarResizeStart}
        title="사이드바 크기 조절"
      />

      {/* Main Editor Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center border-b border-surface-800 bg-surface-900/50 px-6 backdrop-blur-md">
          <h3 className="text-sm font-medium">Editor</h3>
          <DebugToolbar />
        </header>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden rounded-none">
            <EditorArea />
          </div>
          {isPreviewOpen && (
            <>
              <div 
                className="w-2 cursor-col-resize rounded-none transition-colors hover:bg-primary-500 active:bg-primary-500 shrink-0 self-stretch" 
                onMouseDown={handlePreviewResizeStart}
                title="프리뷰 크기 조절"
              />
              <div className="flex flex-col shrink-0 h-full rounded-none overflow-hidden border-l border-surface-800 bg-surface-900/50 shadow-xl" style={{ width: previewWidth }}>
                <PreviewPanel />
              </div>
            </>
          )}
        </div>
      </main>
      </div>

      {/* 리사이즈 중 iframe 등이 이벤트를 가로채는 것을 방지하는 전체 화면 보호 오버레이 */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LoadingOverlay />
    </div>
  )
}

export default App

