import { useState } from 'react'
import { useProjectStore } from './store/useProjectStore'
import { PreviewPanel } from './components/Preview/PreviewPanel'
import { ProjectSidebar } from './components/Sidebar/ProjectSidebar'
import { EditorArea } from './components/Editor/EditorArea'
import { DialogBox } from './components/UI/DialogBox'

function App() {
  const { projectPath, setProjectPath } = useProjectStore()
  const [loading, setLoading] = useState(false)
  const [newProjectData, setNewProjectData] = useState<{ isOpen: boolean, parentDir: string } | null>(null)

  const handleOpenProject = async () => {
    const path = await window.api.dialog.openDirectory()
    if (path) {
      setLoading(true)
      const res = await window.api.project.load(path)
      if (res.success) {
        setProjectPath(path)
      } else {
        alert('Failed to load project: ' + res.error)
      }
      setLoading(false)
    }
  }

  const handleScaffoldProject = async () => {
    const parentDir = await window.api.dialog.openDirectory()
    if (parentDir) {
      setNewProjectData({ isOpen: true, parentDir })
    }
  }

  const submitNewProject = async (projectName: string) => {
    if (!projectName || !newProjectData) return
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, '_')
    // Windows 경로 대응
    const separator = newProjectData.parentDir.includes('\\') ? '\\' : '/'
    const targetDir = `${newProjectData.parentDir}${separator}${safeName}`
    
    setLoading(true)
    const check = await window.api.fs.checkExists(targetDir)
    if (check.exists) {
      alert(`이미 해당 경로에 폴더가 존재합니다:\n${targetDir}`)
      setLoading(false)
      setNewProjectData(null)
      return
    }

    const res = await window.api.project.scaffold(targetDir)
    if (res.success) {
      await window.api.project.load(targetDir)
      setProjectPath(targetDir)
    } else {
      alert('Failed to scaffold project: ' + res.error)
    }
    setLoading(false)
    setNewProjectData(null)
  }

  if (!projectPath) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-10 text-center shadow-2xl backdrop-blur-xl">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Fumika Engine
          </h1>
          <p className="mb-8 text-slate-400">The Visual Novel Studio</p>
          <div className="flex flex-col gap-4">
            <button
              onClick={handleOpenProject}
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
            >
              Open Existing Project
            </button>
            <button
              onClick={handleScaffoldProject}
              disabled={loading}
              className="rounded-lg border border-slate-700 bg-transparent px-6 py-3 font-semibold text-white transition-all hover:bg-slate-800 hover:-translate-y-0.5"
            >
              Create New Project
            </button>
          </div>
        </div>

        <DialogBox
          isOpen={newProjectData?.isOpen || false}
          title="새 프로젝트 이름 입력"
          defaultValue="my-visual-novel"
          onConfirm={submitNewProject}
          onCancel={() => setNewProjectData(null)}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-300">
      <ProjectSidebar />

      {/* Main Editor Area */}
      <main className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-slate-800 bg-slate-900/50 px-6 backdrop-blur-md">
          <h3 className="text-sm font-medium">Editor</h3>
        </header>
        <div className="flex-1 p-6 flex gap-6 h-[calc(100vh-56px)]">
          <EditorArea />
          <div className="w-[400px] flex flex-col shrink-0">
            <PreviewPanel />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
