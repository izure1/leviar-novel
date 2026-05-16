import { useEffect, useState, useCallback, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { CodeEditor } from './CodeEditor'
import { ConfirmDialogBox } from '../UI/ConfirmDialogBox'

interface TabData {
  content: string
  isDirty: boolean
  isLoading: boolean
}

const getDraftPath = (filePath: string) => {
  return filePath.replace(/([^/\\]+)$/, '.$1.draft')
}

export function EditorArea() {
  const { activeFile, setActiveFile } = useProjectStore()
  
  const [openTabs, setOpenTabs] = useState<string[]>([])
  const [tabData, setTabData] = useState<Record<string, TabData>>({})
  const [isSaving, setIsSaving] = useState(false)
  
  const [confirmState, setConfirmState] = useState<any>(null)
  const draftTimers = useRef<Record<string, NodeJS.Timeout>>({})
  const fetchedTabs = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!activeFile) return

    setOpenTabs(prev => prev.includes(activeFile) ? prev : [...prev, activeFile])

    if (!fetchedTabs.current.has(activeFile)) {
      fetchedTabs.current.add(activeFile)
      
      setTabData(prev => ({
        ...prev,
        [activeFile]: { content: '', isDirty: false, isLoading: true }
      }))

      const draftPath = getDraftPath(activeFile)
      window.api.fs.readFile(draftPath).then(draftRes => {
        if (draftRes.success && draftRes.content !== undefined) {
          // 임시 저장본 로드
          setTabData(prev => ({
            ...prev,
            [activeFile]: { content: draftRes.content as string, isDirty: true, isLoading: false }
          }))
        } else {
          // 원본 로드
          window.api.fs.readFile(activeFile)
            .then(res => {
              let content = ''
              let isDirty = false
              if (res.success && res.content !== undefined) {
                content = res.content
              } else {
                let template = '// 파일을 찾을 수 없습니다. (저장하면 새로 생성됩니다.)\n'
                const fileName = activeFile.split(/[/\\]/).pop()

                if (fileName === 'backgrounds.ts') {
                  template = `import { defineBackgrounds } from 'fumika'\nimport assets from './declarations/assets'\n\nexport default defineBackgrounds(assets)({\n\n})\n`
                } else if (fileName === 'audios.ts') {
                  template = `import { defineAudios } from 'fumika'\nimport assets from './declarations/assets'\n\nexport default defineAudios(assets)({\n\n})\n`
                } else if (fileName === 'modules.ts') {
                  template = `import { defineCustomModules } from 'fumika'\nimport modules from './declarations/modules'\n\nexport default defineCustomModules(modules)\n`
                } else if (fileName === 'novel.config.ts') {
                  template = `import Assets from './declarations/assets'\nimport Scenes from './declarations/scenes'\nimport Characters from './declarations/characters'\nimport Modules from './modules'\nimport Backgrounds from './backgrounds'\nimport Audios from './audios'\n\nimport { defineNovelConfig } from 'fumika'\n\nexport default defineNovelConfig({\n  assets: Assets,\n  scenes: Scenes,\n  characters: Characters,\n  modules: Modules,\n  backgrounds: Backgrounds,\n  audios: Audios,\n})\n`
                }

                content = template
                isDirty = true
              }

              setTabData(prev => ({
                ...prev,
                [activeFile]: { content, isDirty, isLoading: false }
              }))
            })
        }
      })
    }
  }, [activeFile])

  const handleSave = useCallback(async () => {
    if (!activeFile || isSaving) return
    const data = tabData[activeFile]
    if (!data || !data.isDirty) return
    
    setIsSaving(true)
    try {
      if (draftTimers.current[activeFile]) {
        clearTimeout(draftTimers.current[activeFile])
        delete draftTimers.current[activeFile]
      }
      
      const res = await window.api.fs.writeFile(activeFile, data.content)
      if (res.success) {
        setTabData(prev => ({
          ...prev,
          [activeFile]: { ...prev[activeFile], isDirty: false }
        }))
        // 저장 시 임시 파일 삭제
        window.api.fs.deleteFile(getDraftPath(activeFile))
      } else {
        alert('저장 실패: ' + res.error)
      }
    } finally {
      setIsSaving(false)
    }
  }, [activeFile, tabData, isSaving])

  const handleSaveRef = useRef(handleSave)
  useEffect(() => { handleSaveRef.current = handleSave }, [handleSave])

  const removeTab = useCallback((tab: string) => {
    fetchedTabs.current.delete(tab)
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== tab)
      const currentActive = useProjectStore.getState().activeFile
      if (currentActive === tab) {
        const fallback = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null
        useProjectStore.getState().setActiveFile(fallback)
      }
      return newTabs
    })
    setTabData(prev => {
      const next = { ...prev }
      delete next[tab]
      return next
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const onFileDeleted = (e: any) => {
      const deletedPath = e.detail.path
      if (draftTimers.current[deletedPath]) {
        clearTimeout(draftTimers.current[deletedPath])
        delete draftTimers.current[deletedPath]
      }
      window.api.fs.deleteFile(getDraftPath(deletedPath))
      removeTab(deletedPath)
    }

    const onDirDeleted = (e: any) => {
      const dirPath = e.detail.path
      const tabs = Array.from(fetchedTabs.current)
      tabs.forEach(p => {
        if (p.startsWith(dirPath + '/') || p.startsWith(dirPath + '\\')) {
          if (draftTimers.current[p]) {
            clearTimeout(draftTimers.current[p])
            delete draftTimers.current[p]
          }
          window.api.fs.deleteFile(getDraftPath(p))
          removeTab(p)
        }
      })
    }

    const onFileRenamed = (e: any) => {
      const { oldPath, newPath, isDirectory } = e.detail
      
      const updateTabPath = (oldP: string, newP: string) => {
        setOpenTabs(prev => {
          const idx = prev.indexOf(oldP)
          if (idx === -1) return prev
          const next = [...prev]
          next[idx] = newP
          return next
        })

        setTabData(prev => {
          if (!prev[oldP]) return prev
          const next = { ...prev }
          next[newP] = next[oldP]
          delete next[oldP]
          return next
        })

        fetchedTabs.current.delete(oldP)
        fetchedTabs.current.add(newP)
        
        if (draftTimers.current[oldP]) {
          clearTimeout(draftTimers.current[oldP])
          delete draftTimers.current[oldP]
        }
      }

      if (isDirectory) {
        const tabs = Array.from(fetchedTabs.current)
        tabs.forEach(p => {
          if (p.startsWith(oldPath + '/') || p.startsWith(oldPath + '\\')) {
            const relative = p.slice(oldPath.length)
            const newChildPath = newPath + relative
            updateTabPath(p, newChildPath)
          }
        })
      } else {
        updateTabPath(oldPath, newPath)
      }
    }

    window.addEventListener('file-deleted', onFileDeleted)
    window.addEventListener('dir-deleted', onDirDeleted)
    window.addEventListener('file-renamed', onFileRenamed)

    const unsubscribeFile = window.api.fs.onFileDeleted?.((data) => {
      window.dispatchEvent(new CustomEvent('file-deleted', { detail: { path: data.path } }))
    })
    const unsubscribeDir = window.api.fs.onDirDeleted?.((data) => {
      window.dispatchEvent(new CustomEvent('dir-deleted', { detail: { path: data.path } }))
    })

    return () => {
      window.removeEventListener('file-deleted', onFileDeleted)
      window.removeEventListener('dir-deleted', onDirDeleted)
      window.removeEventListener('file-renamed', onFileRenamed)
      unsubscribeFile?.()
      unsubscribeDir?.()
    }
  }, [removeTab])

  const handleContentChange = (tab: string, val: string | undefined) => {
    const newContent = val || ''
    setTabData(prev => ({
      ...prev,
      [tab]: { ...prev[tab], content: newContent, isDirty: true }
    }))

    // 디바운스로 임시 파일 저장 (1초)
    if (draftTimers.current[tab]) clearTimeout(draftTimers.current[tab])
    draftTimers.current[tab] = setTimeout(() => {
      window.api.fs.writeFile(getDraftPath(tab), newContent)
    }, 1000)
  }

  const handleCloseTab = (tab: string) => {
    if (tabData[tab]?.isDirty) {
      setConfirmState({
        isOpen: true,
        title: '저장되지 않은 변경 사항',
        message: '저장하지 않고 닫으시겠습니까? 변경 사항이 영구적으로 손실됩니다.',
        type: 'danger',
        onConfirm: () => {
          setConfirmState(null)
          if (draftTimers.current[tab]) {
            clearTimeout(draftTimers.current[tab])
            delete draftTimers.current[tab]
          }
          // 저장하지 않고 닫을 경우 임시 파일도 폐기
          window.api.fs.deleteFile(getDraftPath(tab))
          removeTab(tab)
        }
      })
    } else {
      if (draftTimers.current[tab]) {
        clearTimeout(draftTimers.current[tab])
        delete draftTimers.current[tab]
      }
      removeTab(tab)
    }
  }

  return (
    <div className="flex-1 rounded-md border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
      {/* Tab Bar */}
      {openTabs.length > 0 && (
        <div className="flex bg-[#181818] overflow-x-auto overflow-y-hidden border-b border-slate-800 shrink-0 custom-scrollbar h-10 items-end">
          {openTabs.map(tab => {
            const fileName = tab.split(/[/\\]/).pop()
            const isActive = tab === activeFile
            const isDirty = tabData[tab]?.isDirty

            return (
              <div 
                key={tab} 
                className={`flex items-center gap-2 px-3 h-full border-r border-slate-800 cursor-pointer min-w-[120px] max-w-[200px] group transition-colors ${
                  isActive ? 'bg-[#1e1e1e] text-indigo-400 border-t-2 border-t-indigo-500' : 'bg-[#181818] text-slate-500 hover:bg-slate-800/80 border-t-2 border-t-transparent'
                }`}
                onClick={() => setActiveFile(tab)}
                title={tab}
              >
                <span className="truncate flex-1 text-xs select-none">{fileName}</span>
                <div className="flex items-center w-4 h-4 justify-center shrink-0">
                  {isDirty ? (
                    <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:hidden" />
                  ) : null}
                  <button 
                    className={`w-4 h-4 rounded-sm flex items-center justify-center hover:bg-slate-700 hover:text-white transition-opacity ${isDirty ? 'hidden group-hover:flex' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={(e) => { e.stopPropagation(); handleCloseTab(tab) }}
                    title="닫기"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Editor Header */}
      {activeFile && (
        <div className="h-10 bg-slate-800/80 flex items-center px-4 justify-between shrink-0 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium">
              {activeFile.replace(/\\/g, '/').split('/').slice(-3).join(' / ')}
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!tabData[activeFile]?.isDirty || isSaving}
            className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${
              tabData[activeFile]?.isDirty && !isSaving
                ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? '저장 중...' : '저장 (Ctrl+S)'}
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="flex-1 relative bg-[#1e1e1e]">
        {!activeFile ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 font-medium">탭을 선택하세요</p>
          </div>
        ) : (() => {
          const data = tabData[activeFile]
          if (!data) return null
          
          const isEditable = activeFile.endsWith('.ts') || activeFile.endsWith('.json') || activeFile.endsWith('.md')
          
          if (data.isLoading) {
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-slate-400">파일을 불러오는 중...</p>
              </div>
            )
          }
          
          const lowerFile = activeFile.toLowerCase()
          const isImage = lowerFile.match(/\.(png|jpe?g|webp|gif|svg)$/)
          const isVideo = lowerFile.match(/\.(mp4|webm)$/)
          const isAudio = lowerFile.match(/\.(mp3|wav|m4a|ogg)$/)
          
          if (isImage || isVideo || isAudio) {
            // 커스텀 프로토콜을 사용해 로컬 파일 접근 (보안 제약 회피)
            const fileUrl = `local-resource:///${activeFile.replace(/\\/g, '/')}`
            const fileName = activeFile.split(/[/\\]/).pop()

            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#1e1e1e]">
                {isImage && (
                  <img src={fileUrl} alt={fileName} className="max-w-[90%] max-h-[90%] object-contain rounded shadow-lg" />
                )}
                {isVideo && (
                  <video src={fileUrl} controls className="max-w-[90%] max-h-[90%] rounded shadow-lg outline-none" />
                )}
                {isAudio && (
                  <div className="bg-slate-800 p-8 rounded-xl shadow-xl flex flex-col items-center gap-4">
                    <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                    <span className="text-slate-300 font-medium truncate max-w-[250px]">{fileName}</span>
                    <audio src={fileUrl} controls className="outline-none" />
                  </div>
                )}
              </div>
            )
          }

          if (!isEditable) {
            return (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-400">미리보기를 지원하지 않는 파일입니다.</p>
              </div>
            )
          }

          return (
            <div className="absolute inset-0">
              <CodeEditor
                code={data.content}
                onChange={(val) => handleContentChange(activeFile, val)}
                language={activeFile.endsWith('.ts') ? 'typescript' : 'javascript'}
                filePath={activeFile}
              />
            </div>
          )
        })()}
      </div>

      <ConfirmDialogBox
        isOpen={confirmState?.isOpen || false}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        type={confirmState?.type || 'info'}
        showCancel={confirmState?.showCancel !== false}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}
