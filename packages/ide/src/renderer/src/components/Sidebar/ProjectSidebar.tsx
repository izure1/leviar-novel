import { useEffect, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { DialogBox } from '../UI/DialogBox'

const WATCH_FOLDERS = ['assets', 'scenes', 'characters', 'modules']
const CONFIG_FILES = ['novel.config.ts', 'backgrounds.ts', 'audios.ts', 'modules.ts', 'main.ts']

export function ProjectSidebar() {
  const { projectPath, activeFile, setActiveFile } = useProjectStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    scenes: true,
    assets: true,
    characters: true,
  })
  const [folderFiles, setFolderFiles] = useState<Record<string, string[]>>({})
  const [promptData, setPromptData] = useState<{ isOpen: boolean; folder: string; defaultValue: string } | null>(null)

  const toggleFolder = (folder: string) => {
    setExpanded((prev) => ({ ...prev, [folder]: !prev[folder] }))
  }

  const handleAddFile = async (e: React.MouseEvent, folder: string) => {
    e.stopPropagation()
    if (!projectPath) return

    if (folder === 'assets') {
      const paths = await window.api.dialog.openFile()
      if (paths && paths.length > 0) {
        for (const src of paths) {
          // Extract filename from path
          const fileName = src.split(/[/\\]/).pop()
          if (fileName) {
            const dest = `${projectPath}/${folder}/${fileName}`
            await window.api.fs.copyFile(src, dest)
          }
        }
      }
    } else {
      setPromptData({ isOpen: true, folder, defaultValue: `new_${folder.slice(0, -1)}` })
    }
  }

  const submitPrompt = async (name: string) => {
    if (!name || !promptData) return
    const folder = promptData.folder
    setPromptData(null)

    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filePath = `${projectPath}/${folder}/${safeName}.ts`

    let template = ''
    if (folder === 'scenes') {
      template = `import { defineScene } from 'fumika'\n\nexport default defineScene({\n  name: '${safeName}',\n  script: function* (cmd) {\n    // 씬 스크립트를 작성하세요\n  }\n})\n`
    } else if (folder === 'characters') {
      template = `import { defineCharacter } from 'fumika'\n\nexport default defineCharacter({\n  name: '${safeName}',\n  sprites: {\n    default: ''\n  }\n})\n`
    } else if (folder === 'modules') {
      template = `import { define } from 'fumika'\n\nexport default define<{}>()\n`
    }

    await window.api.fs.writeFile(filePath, template)
    setActiveFile(filePath)
  }

  useEffect(() => {
    if (!projectPath) return

    const fetchFiles = async () => {
      const newFiles: Record<string, string[]> = {}
      for (const folder of WATCH_FOLDERS) {
        try {
          const res = await window.api.fs.readDir(`${projectPath}/${folder}`)
          if (res.success && res.files) {
            newFiles[folder] = res.files.filter(f => !f.isDirectory && !f.name.startsWith('.')).map(f => f.name)
          } else {
            newFiles[folder] = []
          }
        } catch (e) {
          newFiles[folder] = []
        }
      }
      setFolderFiles(newFiles)
    }

    fetchFiles()
    const interval = setInterval(fetchFiles, 2000)
    return () => clearInterval(interval)
  }, [projectPath])

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
      <div className="border-b border-slate-800 p-4 shrink-0">
        <h2 className="font-bold text-slate-100">Project Explorer</h2>
        <p className="truncate text-xs text-slate-500 mt-1" title={projectPath || ''}>
          {projectPath}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="text-sm">
          {/* Configurations */}
          <div className="mb-4">
            <div className="flex items-center py-1 text-slate-400 select-none">
              <span className="font-semibold uppercase text-xs tracking-wider">Configurations</span>
            </div>
            <ul className="pl-2 mt-1 space-y-0.5">
              {CONFIG_FILES.map((file) => {
                const filePath = `${projectPath}/${file}`
                const isActive = activeFile === filePath
                return (
                  <li 
                    key={file} 
                    className={`cursor-pointer rounded px-2 py-1.5 text-xs truncate transition-colors select-none ${
                      isActive 
                        ? 'bg-indigo-600/30 text-indigo-300 font-medium' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                    onClick={() => setActiveFile(filePath)}
                    title={file}
                  >
                    {file}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Folders */}
          {WATCH_FOLDERS.map((folder) => (
            <div key={folder} className="mb-2">
              <div 
                className="flex items-center justify-between cursor-pointer py-1 text-slate-400 hover:text-white select-none transition-colors group"
                onClick={() => toggleFolder(folder)}
              >
                <div className="flex items-center">
                  <span className="mr-1 opacity-70 w-4 inline-block text-center">
                    {expanded[folder] ? '▾' : '▸'}
                  </span>
                  <span className="font-semibold capitalize">{folder}</span>
                </div>
                <button 
                  onClick={(e) => handleAddFile(e, folder)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`새 ${folder} 리소스 추가`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {expanded[folder] && (
                <ul className="pl-5 mt-1 space-y-0.5">
                  {folderFiles[folder]?.length === 0 && (
                    <li className="text-xs text-slate-600 italic px-2 py-1 select-none">Empty</li>
                  )}
                  {folderFiles[folder]?.map((file) => {
                    const filePath = `${projectPath}/${folder}/${file}`
                    const isActive = activeFile === filePath
                    return (
                      <li 
                        key={file} 
                        className={`cursor-pointer rounded px-2 py-1.5 text-xs truncate transition-colors select-none ${
                          isActive 
                            ? 'bg-indigo-600/30 text-indigo-300 font-medium' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                        onClick={() => setActiveFile(filePath)}
                        title={file}
                      >
                        {file}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <DialogBox
        isOpen={promptData?.isOpen || false}
        title="새 파일 이름 입력"
        defaultValue={promptData?.defaultValue}
        onConfirm={submitPrompt}
        onCancel={() => setPromptData(null)}
      />
    </aside>
  )
}
