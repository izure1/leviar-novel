import { useEffect, useState, MouseEvent } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { DialogBox } from '../UI/DialogBox'

const WATCH_FOLDERS = ['assets', 'scenes', 'characters', 'modules']
const CONFIG_FILES = ['novel.config.ts', 'backgrounds.ts', 'audios.ts', 'main.ts']

interface FileNode {
  name: string
  isDirectory: boolean
  path: string
  children?: FileNode[]
}

type PromptAction = 'create_file' | 'create_folder' | 'rename'
interface PromptData {
  isOpen: boolean
  action: PromptAction
  targetFolder: string
  targetNode?: FileNode
  defaultValue: string
}

export function ProjectSidebar() {
  const { projectPath, activeFile, setActiveFile } = useProjectStore()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    scenes: true,
    assets: true,
    characters: true,
    modules: true,
  })
  const [folderFiles, setFolderFiles] = useState<Record<string, FileNode[]>>({})
  const [promptData, setPromptData] = useState<PromptData | null>(null)

  const toggleFolder = (folderPath: string, e?: MouseEvent) => {
    e?.stopPropagation()
    setExpanded((prev) => ({ ...prev, [folderPath]: !prev[folderPath] }))
  }

  const fetchFiles = async () => {
    if (!projectPath) return
    const newFiles: Record<string, FileNode[]> = {}
    for (const folder of WATCH_FOLDERS) {
      try {
        const res = await window.api.fs.readDir(`${projectPath}/${folder}`, true)
        if (res.success && res.files) {
          const sortNodes = (nodes: FileNode[]) => {
            nodes.sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1
              if (!a.isDirectory && b.isDirectory) return 1
              return a.name.localeCompare(b.name)
            })
            nodes.forEach(n => n.children && sortNodes(n.children))
          }
          const filterHidden = (nodes: FileNode[]): FileNode[] => {
            return nodes.filter(n => !n.name.startsWith('.')).map(n => ({
              ...n,
              children: n.children ? filterHidden(n.children) : undefined
            }))
          }
          const filtered = filterHidden(res.files)
          sortNodes(filtered)
          newFiles[folder] = filtered
        } else {
          newFiles[folder] = []
        }
      } catch (e) {
        newFiles[folder] = []
      }
    }
    setFolderFiles(newFiles)
  }

  useEffect(() => {
    fetchFiles()
    const interval = setInterval(fetchFiles, 2000)
    return () => clearInterval(interval)
  }, [projectPath])

  // ==============================
  // 핸들러
  // ==============================

  const handleUpdateProject = async () => {
    if (!projectPath) return
    if (!window.confirm('프로젝트의 누락된 설정 파일을 복구하고 최신 버전의 fumika 엔진을 설치하시겠습니까? (이 작업은 수십 초 정도 소요될 수 있습니다)')) return
    
    // UI에 로딩 상태를 표시하기 위해 promptData를 임시로 활용하거나 간단한 얼럿 표시
    alert('프로젝트 의존성 설치 및 업데이트를 백그라운드에서 시작합니다...')
    const res = await window.api.project.update(projectPath)
    if (res.success) {
      alert('프로젝트가 성공적으로 업데이트되었습니다!')
    } else {
      alert('프로젝트 업데이트에 실패했습니다:\n' + res.error)
    }
  }

  const handleAddFile = async (e: MouseEvent, folderPath: string, isFolder: boolean = false) => {
    e.stopPropagation()
    if (!projectPath) return
    
    // assets 루트에 파일 추가하는 특별 처리
    if (folderPath.startsWith('assets') && !isFolder) {
      const paths = await window.api.dialog.openFile()
      if (paths && paths.length > 0) {
        for (const src of paths) {
          const fileName = src.split(/[/\\]/).pop()
          if (fileName) {
            const dest = `${projectPath}/${folderPath}/${fileName}`
            await window.api.fs.copyFile(src, dest)
          }
        }
        fetchFiles()
      }
      return
    }

    const rootType = folderPath.split(/[/\\]/)[0]
    setPromptData({
      isOpen: true,
      action: isFolder ? 'create_folder' : 'create_file',
      targetFolder: folderPath,
      defaultValue: isFolder ? 'new_folder' : `new_${rootType.slice(0, -1)}`
    })
  }

  const handleDelete = async (e: MouseEvent, folderPath: string, node: FileNode) => {
    e.stopPropagation()
    if (!projectPath) return
    if (!window.confirm(`정말 '${node.name}'을(를) 삭제하시겠습니까?`)) return

    const fullPath = `${projectPath}/${folderPath}/${node.path}`
    if (node.isDirectory) {
      await window.api.fs.deleteDir(fullPath)
    } else {
      await window.api.fs.deleteFile(fullPath)
      if (activeFile === fullPath) setActiveFile(null)
    }
    fetchFiles()
  }

  const handleRename = (e: MouseEvent, folderPath: string, node: FileNode) => {
    e.stopPropagation()
    const baseName = node.isDirectory ? node.name : node.name.replace(/\.[^/.]+$/, "")
    setPromptData({
      isOpen: true,
      action: 'rename',
      targetFolder: folderPath,
      targetNode: node,
      defaultValue: baseName
    })
  }

  const submitPrompt = async (inputValue: string) => {
    if (!inputValue || !promptData || !projectPath) return
    const { action, targetFolder, targetNode } = promptData
    setPromptData(null)

    const safeName = inputValue.replace(/[^a-zA-Z0-9_-]/g, '_')
    const rootType = targetFolder.split(/[/\\]/)[0]

    if (action === 'create_folder') {
      await window.api.fs.mkdir(`${projectPath}/${targetFolder}/${safeName}`)
    } else if (action === 'create_file') {
      const filePath = `${projectPath}/${targetFolder}/${safeName}.ts`
      const relativeDots = Array(targetFolder.split(/[/\\]/).length).fill('..').join('/')

      let template = ''
      if (rootType === 'scenes') {
        template = `import { defineScene } from 'fumika'\nimport type config from '${relativeDots}/novel.config'\n\nexport default defineScene<typeof config['variables'], typeof config>({\n  // initial: {},\n})(({ label, next }) => [\n  label('start'),\n  { type: 'dialogue', text: '새로운 씬입니다.' }\n])\n`
      } else if (rootType === 'characters') {
        template = `import { defineCharacter } from 'fumika'\nimport assets from '${relativeDots}/declarations/assets'\n\nexport default defineCharacter(assets)({\n  name: '${safeName}',\n  bases: {\n    normal: { src: '', width: 560, points: {} }\n  },\n  emotions: {\n    normal: {}\n  }\n})\n`
      } else if (rootType === 'modules') {
        template = `import { define } from 'fumika'\n\ninterface MyCmd {\n  type: '${safeName}'\n}\n\ninterface MySchema {\n  count: number\n}\n\ninterface MyHook {\n  '${safeName}:event': (val: number) => void\n}\n\nexport default define<MyCmd, MySchema, MyHook>({\n  count: 0\n})\n  .defineCommand(function* (cmd, ctx, state, setState) {\n    // 커맨드 구현\n  })\n  .defineView((ctx, state, setState) => {\n    // 뷰 구현\n    return null\n  })\n`
      } else {
        template = `// New file`
      }

      await window.api.fs.writeFile(filePath, template)
      setActiveFile(filePath)
      
      const fullDir = `${projectPath}/${targetFolder}`
      setExpanded(prev => ({ ...prev, [fullDir]: true, [targetFolder]: true }))
    } else if (action === 'rename' && targetNode) {
      const oldPath = `${projectPath}/${targetFolder}/${targetNode.path}`
      const ext = targetNode.isDirectory ? '' : targetNode.name.match(/\.[^/.]+$/)?.[0] || '.ts'
      const newName = `${safeName}${ext}`
      const dirPath = oldPath.substring(0, oldPath.lastIndexOf('/'))
      const newPath = `${dirPath}/${newName}`
      
      await window.api.fs.renameFile(oldPath, newPath)
      if (activeFile === oldPath) setActiveFile(newPath)
    }
    
    fetchFiles()
  }

  // ==============================
  // 렌더링
  // ==============================

  const renderTree = (nodes: FileNode[], folderPath: string) => {
    return (
      <ul className="pl-3 mt-1 space-y-0.5 border-l border-slate-700/50 ml-2">
        {nodes.length === 0 && (
          <li className="text-xs text-slate-600 italic px-2 py-1 select-none">Empty</li>
        )}
        {nodes.map(node => {
          const isDir = node.isDirectory
          const fullPath = `${projectPath}/${folderPath}/${node.path}`
          const isExpanded = expanded[fullPath]
          const isActive = !isDir && activeFile === fullPath

          return (
            <li key={node.path} className="group relative">
              <div 
                className={`flex items-center justify-between cursor-pointer rounded px-2 py-1.5 text-xs transition-colors select-none ${
                  isActive ? 'bg-indigo-600/30 text-indigo-300 font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                onClick={(e) => {
                  if (isDir) toggleFolder(fullPath, e)
                  else setActiveFile(fullPath)
                }}
                title={node.name}
              >
                <div className="flex items-center truncate max-w-[140px]">
                  {isDir && (
                    <span className="mr-1 opacity-70 w-3 inline-block text-center text-[10px]">
                      {isExpanded ? '▾' : '▸'}
                    </span>
                  )}
                  {!isDir && <span className="mr-1 opacity-40 w-3 inline-block text-center text-[10px]">•</span>}
                  <span className="truncate">{node.name}</span>
                </div>
                
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 px-1 rounded absolute right-0">
                  {isDir && (
                    <>
                      <button onClick={(e) => handleAddFile(e, `${folderPath}/${node.path}`, false)} className="w-5 h-5 flex items-center justify-center hover:text-indigo-400" title="새 파일">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                      <button onClick={(e) => handleAddFile(e, `${folderPath}/${node.path}`, true)} className="w-5 h-5 flex items-center justify-center hover:text-indigo-400" title="새 폴더">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                      </button>
                    </>
                  )}
                  <button onClick={(e) => handleRename(e, folderPath, node)} className="w-5 h-5 flex items-center justify-center hover:text-yellow-400" title="이름 변경">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={(e) => handleDelete(e, folderPath, node)} className="w-5 h-5 flex items-center justify-center hover:text-red-400" title="삭제">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              
              {isDir && isExpanded && node.children && renderTree(node.children, folderPath)}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
      <div className="border-b border-slate-800 p-4 shrink-0 flex justify-between items-start">
        <div className="overflow-hidden mr-2">
          <h2 className="font-bold text-slate-100 truncate">Project Explorer</h2>
          <p className="truncate text-[10px] text-slate-500 mt-1" title={projectPath || ''}>
            {projectPath}
          </p>
        </div>
        <button 
          onClick={handleUpdateProject}
          className="w-7 h-7 flex shrink-0 items-center justify-center rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors"
          title="의존성 복구 및 최신 엔진 업데이트 (npm install)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
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
                    <span className="mr-1 opacity-40 w-3 inline-block text-center text-[10px]">•</span>
                    <span className="truncate">{file}</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Folders */}
          {WATCH_FOLDERS.map((folder) => (
            <div key={folder} className="mb-2">
              <div 
                className="flex items-center justify-between cursor-pointer py-1.5 text-slate-400 hover:text-white select-none transition-colors group rounded px-2"
                onClick={(e) => toggleFolder(folder, e)}
              >
                <div className="flex items-center">
                  <span className="mr-1 opacity-70 w-3 inline-block text-center text-[10px]">
                    {expanded[folder] ? '▾' : '▸'}
                  </span>
                  <span className="font-semibold capitalize">{folder}</span>
                </div>
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  <button 
                    onClick={(e) => handleAddFile(e, folder, false)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 hover:text-indigo-400"
                    title={`새 ${folder} 리소스 추가`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <button 
                    onClick={(e) => handleAddFile(e, folder, true)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-700 hover:text-indigo-400"
                    title={`새 폴더 추가`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                  </button>
                </div>
              </div>
              
              {expanded[folder] && renderTree(folderFiles[folder] || [], folder)}
            </div>
          ))}
        </div>
      </div>

      <DialogBox
        isOpen={promptData?.isOpen || false}
        title={
          promptData?.action === 'create_folder' ? "새 폴더 이름 입력" :
          promptData?.action === 'rename' ? "이름 변경" : "새 파일 이름 입력"
        }
        defaultValue={promptData?.defaultValue}
        onConfirm={submitPrompt}
        onCancel={() => setPromptData(null)}
      />
    </aside>
  )
}
