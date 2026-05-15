import Editor, { useMonaco, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEffect, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Vite Web Worker 설정 (타입 추론 및 언어 지원용)
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

// CDN을 사용하지 않고 로컬 노드 모듈의 monaco-editor를 직접 사용하도록 설정
loader.config({ monaco })

interface Props {
  code: string
  onChange: (value: string | undefined) => void
  language?: string
  filePath?: string
}

// Windows/Mac 절대 경로 → file:/// URI 변환
function toFileUri(absPath: string): string {
  return 'file:///' + absPath.replace(/\\/g, '/')
}

export function CodeEditor({ code, onChange, language = 'typescript', filePath }: Props) {
  const monacoInstance = useMonaco()
  const { projectPath } = useProjectStore()
  // 마지막으로 주입한 projectPath 추적 (중복 주입 방지)
  const injectedProjectPath = useRef<string | null>(null)

  // fumika 타입 및 Monaco 기본 설정
  useEffect(() => {
    if (!monacoInstance) return

    monacoInstance.editor.setTheme('vs-dark')

    // TypeScript 컴파일러 옵션 설정 (타입 에러 우회를 위해 any 캐스팅)
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

    // 로컬 파일 시스템이 완벽하게 가상화되어 있지 않으므로, 모듈을 찾을 수 없다는 에러 무시 (단, fumika 등 주입된 모듈은 에러가 발생하지 않음)
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      // 2307: Cannot find module
      // 주입되지 않은 외부 모듈이나 로컬 상대경로 임포트에 대한 에러만 무시
      diagnosticCodesToIgnore: [2307, 2792]
    })

    // fumika 코어 타입 강제 주입
    const injectFumikaTypes = async () => {
      try {
        const res = await window.api.project.getTypes('')
        if (res.success && res.types) {
          res.types.forEach((t) => {
            const libUri = `file:///node_modules/fumika/dist/types/${t.path}`
            if (!ts.typescriptDefaults.getExtraLibs()[libUri]) {
              ts.typescriptDefaults.addExtraLib(t.content, libUri)
            }
          })

          const entryUri = 'file:///node_modules/fumika/index.d.ts'
          if (!ts.typescriptDefaults.getExtraLibs()[entryUri]) {
            ts.typescriptDefaults.addExtraLib(`export * from './dist/types/index'`, entryUri)
          }
        }
      } catch (e) {
        console.error('Failed to inject fumika types:', e)
      }
    }
    injectFumikaTypes()
  }, [monacoInstance])

  // 프로젝트 .ts 파일들을 Monaco 모델로 주입 → 상대경로 import 타입 추론 활성화
  useEffect(() => {
    if (!monacoInstance || !projectPath) return
    if (injectedProjectPath.current === projectPath) return
    injectedProjectPath.current = projectPath

    const injectProjectFiles = async () => {
      try {
        const res = await window.api.fs.readDir(projectPath, true)
        if (!res.success || !res.files) return

        type DirEntry = { name: string; isDirectory: boolean; path: string; children: DirEntry[] }

        const collectTsPaths = (entries: DirEntry[]): string[] => {
          const result: string[] = []
          for (const entry of entries) {
            if (entry.isDirectory) {
              if (entry.name === 'node_modules') continue
              result.push(...collectTsPaths(entry.children ?? []))
            } else if (entry.name.endsWith('.ts')) {
              // entry.path는 슬래시 구분자 상대 경로 (e.g. "declarations/assets.ts")
              result.push(entry.path)
            }
          }
          return result
        }

        const relativePaths = collectTsPaths(res.files as DirEntry[])

        for (const relPath of relativePaths) {
          const absPath = projectPath + '\\' + relPath.replace(/\//g, '\\')

          // 현재 편집 중인 파일은 <Editor>가 직접 관리하므로 건너뜀
          if (filePath && absPath.toLowerCase() === filePath.toLowerCase()) continue

          const fileRes = await window.api.fs.readFile(absPath)
          if (!fileRes.success || fileRes.content === undefined) continue

          const modelUri = monacoInstance.Uri.parse(toFileUri(absPath))
          const existing = monacoInstance.editor.getModel(modelUri)
          if (existing) {
            if (existing.getValue() !== fileRes.content) {
              existing.setValue(fileRes.content)
            }
          } else {
            monacoInstance.editor.createModel(fileRes.content, 'typescript', modelUri)
          }
        }
      } catch (e) {
        console.error('Failed to inject project files into Monaco:', e)
      }
    }

    injectProjectFiles()
  }, [monacoInstance, projectPath, filePath])

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
