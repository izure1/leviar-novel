import Editor, { useMonaco, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Vite Web Worker 설정
self.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

loader.config({ monaco })

interface Props {
  code: string
  onChange: (value: string | undefined) => void
  language?: string
  filePath?: string
}

/**
 * Windows 절대경로 → file URI 문자열.
 * addExtraLib의 키로 사용되며, <Editor path>와 동일한 형식이어야 한다.
 */
function toFileUri(absPath: string): string {
  return monaco.Uri.file(absPath).toString()
}

export function CodeEditor({ code, onChange, language = 'typescript', filePath }: Props) {
  const monacoInstance = useMonaco()
  const { projectPath } = useProjectStore()
  // 마지막으로 주입한 projectPath (동일 프로젝트 중복 주입 방지)
  const injectedProjectRef = useRef<string | null>(null)

  // Monaco TS 컴파일러 옵션
  useEffect(() => {
    if (!monacoInstance) return

    monacoInstance.editor.setTheme('vs-dark')

    const ts = (monacoInstance.languages as any).typescript
    if (!ts) return

    ts.typescriptDefaults.setCompilerOptions({
      target: ts.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
    })

    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2307, 2792]
    })
  }, [monacoInstance])

  // 프로젝트 파일 + fumika 타입을 addExtraLib으로 주입
  // addExtraLib은 TS 워커의 별도 가상 파일시스템을 사용하므로
  // createModel/program 동기화 문제를 회피한다.
  useEffect(() => {
    if (!monacoInstance || !projectPath) return
    if (injectedProjectRef.current === projectPath) return
    injectedProjectRef.current = projectPath

    const ts = (monacoInstance.languages as any).typescript
    if (!ts) return

    const injectAll = async () => {
      try {
        // ── 1. 프로젝트 소스 파일 (node_modules 제외) ──
        const res = await window.api.fs.readDir(projectPath, true)
        if (!res.success || !res.files) return

        type DirEntry = { name: string; isDirectory: boolean; path: string; children: DirEntry[] }

        const collectTsPaths = (entries: DirEntry[], skipNodeModules = true): string[] => {
          const result: string[] = []
          for (const entry of entries) {
            if (entry.isDirectory) {
              if (skipNodeModules && entry.name === 'node_modules') continue
              result.push(...collectTsPaths(entry.children ?? [], skipNodeModules))
            } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.d.ts')) {
              result.push(entry.path)
            }
          }
          return result
        }

        const srcPaths = collectTsPaths(res.files as DirEntry[], true)
        for (const relPath of srcPaths) {
          const absPath = projectPath + '\\' + relPath.replace(/\//g, '\\')
          
          const draftPath = absPath.replace(/([^/\\]+)$/, '.$1.draft')
          let fileRes = await window.api.fs.readFile(draftPath)
          
          if (!fileRes.success || fileRes.content === undefined) {
            fileRes = await window.api.fs.readFile(absPath)
          }

          if (!fileRes.success || fileRes.content === undefined) continue

          const libUri = toFileUri(absPath)
          ts.typescriptDefaults.addExtraLib(fileRes.content, libUri)
        }

        // ── 2. fumika 타입 파일 ──
        const typesRes = await window.api.project.getTypes(projectPath)
        if (typesRes.success && typesRes.types) {
          for (const type of typesRes.types) {
            const absPath = projectPath + '\\node_modules\\fumika\\dist\\types\\' + type.path.replace(/\//g, '\\')
            const libUri = toFileUri(absPath)
            ts.typescriptDefaults.addExtraLib(type.content, libUri)
          }

          // fumika 진입점
          const fumikaIndexUri = toFileUri(projectPath + '\\node_modules\\fumika\\index.d.ts')
          ts.typescriptDefaults.addExtraLib(
            `export * from './dist/types/index'`,
            fumikaIndexUri
          )
        }
      } catch (e) {
        console.error('Failed to inject project files:', e)
      }
    }

    injectAll()
  }, [monacoInstance, projectPath])

  // watcher 선언 파일 갱신 → addExtraLib 업데이트
  useEffect(() => {
    if (!monacoInstance) return

    const ts = (monacoInstance.languages as any).typescript
    if (!ts) return

    const unsubscribe = window.api.fs.onFileChanged(({ path: changedPath, content }) => {
      const libUri = toFileUri(changedPath)
      // addExtraLib은 같은 URI로 호출 시 자동 교체
      ts.typescriptDefaults.addExtraLib(content, libUri)
    })

    return unsubscribe
  }, [monacoInstance])

  // 현재 에디터의 변경사항을 가상 파일시스템에 동기화 (디바운스)
  // 원본이 아닌 에디터의 최신 상태(임시저장본 포함)를 타입 추론에 반영
  useEffect(() => {
    if (!monacoInstance || !filePath || code === undefined) return
    const ts = (monacoInstance.languages as any).typescript
    if (!ts) return

    const timer = setTimeout(() => {
      const libUri = toFileUri(filePath)
      ts.typescriptDefaults.addExtraLib(code, libUri)
    }, 500)

    return () => clearTimeout(timer)
  }, [monacoInstance, filePath, code])

  const fileUri = filePath ? toFileUri(filePath) : undefined

  return (
    <div className="w-full h-full overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
        path={fileUri}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  )
}
