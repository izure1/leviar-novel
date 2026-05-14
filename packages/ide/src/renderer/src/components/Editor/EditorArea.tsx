import { useEffect, useState, useCallback } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import { CodeEditor } from './CodeEditor'

export function EditorArea() {
  const { activeFile } = useProjectStore()
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!activeFile) return

    let mounted = true
    setLoading(true)
    
    window.api.fs.readFile(activeFile)
      .then(res => {
        if (!mounted) return
        if (res.success && res.content !== undefined) {
          setContent(res.content)
          setIsDirty(false)
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

          setContent(template)
          setIsDirty(true)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [activeFile])

  const handleSave = useCallback(async () => {
    if (!activeFile || !isDirty || isSaving) return
    
    setIsSaving(true)
    try {
      const res = await window.api.fs.writeFile(activeFile, content)
      if (res.success) {
        setIsDirty(false)
      } else {
        alert('저장 실패: ' + res.error)
      }
    } finally {
      setIsSaving(false)
    }
  }, [activeFile, content, isDirty, isSaving])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleContentChange = (val: string | undefined) => {
    setContent(val || '')
    setIsDirty(true)
  }

  if (!activeFile) {
    return (
      <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center">
        <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-slate-500 font-medium">편집할 리소스를 선택하세요</p>
      </div>
    )
  }

  const isEditable = activeFile.endsWith('.ts') || activeFile.endsWith('.json') || activeFile.endsWith('.md')

  return (
    <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
      <div className="h-12 border-b border-slate-800 bg-slate-800/80 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">
              {activeFile.split(/[/\\]/).pop()}
              {isDirty && <span className="text-amber-400 ml-1">*</span>}
            </span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${
            isDirty && !isSaving
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSaving ? '저장 중...' : '저장 (Ctrl+S)'}
        </button>
      </div>

      <div className="flex-1 relative bg-[#1e1e1e]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-slate-400">파일을 불러오는 중...</p>
          </div>
        ) : !isEditable ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-400">텍스트로 편집할 수 없는 파일입니다.</p>
          </div>
        ) : (
          <CodeEditor 
            code={content} 
            onChange={handleContentChange} 
            language={activeFile.endsWith('.ts') ? 'typescript' : 'javascript'} 
          />
        )}
      </div>
    </div>
  )
}
