import Editor, { useMonaco, loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEffect } from 'react'
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
}

export function CodeEditor({ code, onChange, language = 'typescript' }: Props) {
  const monaco = useMonaco()

  useEffect(() => {
    if (monaco) {
      monaco.editor.setTheme('vs-dark')
      
      // TypeScript 컴파일러 옵션 설정 (타입 에러 우회를 위해 any 캐스팅)
      const ts = (monaco.languages as any).typescript
      if (ts) {
        ts.typescriptDefaults.setCompilerOptions({
          target: ts.ScriptTarget.ESNext,
          allowNonTsExtensions: true,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
          module: ts.ModuleKind.ESNext,
          noEmit: true,
          esModuleInterop: true,
        })

        // 로컬 파일 시스템이 완벽하게 가상화되어 있지 않으므로, 모듈을 찾을 수 없다는 에러 무시
        ts.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          diagnosticCodesToIgnore: [2307, 2792] 
        })
      }
    }
  }, [monaco])

  return (
    <div className="w-full h-full overflow-hidden rounded-lg border border-slate-700 bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage={language}
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
