import { Minus, Square, X, Settings } from 'lucide-react'
import { useProjectStore } from '../../store/useProjectStore'

export function TitleBar() {
  const { projectPath, setIsSettingsOpen } = useProjectStore()
  
  // VS Code 스타일의 타이틀 표시. 프로젝트가 열려있으면 프로젝트 경로 표시.
  const projectName = projectPath ? projectPath.split(/[/\\]/).pop() : ''
  const title = projectName ? `${projectName} - Fumika Engine` : 'Fumika Engine'

  return (
    <div 
      className="flex h-8 shrink-0 items-center justify-between bg-surface-900 border-b border-surface-800 select-none z-50"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div className="flex items-center px-4 h-full">
        <div className="flex items-center gap-4 text-[13px] text-surface-400">
          <div className="flex items-center gap-2 font-semibold text-primary-400">
            <span className="text-[10px]">F</span>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-medium text-surface-300">
        {title}
      </div>

      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex h-full w-10 items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-surface-100 transition-colors"
          title="설정"
        >
          <Settings size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.api.window.minimize()}
          className="flex h-full w-12 items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-surface-100 transition-colors"
          title="최소화"
        >
          <Minus size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="flex h-full w-12 items-center justify-center text-surface-400 hover:bg-surface-700 hover:text-surface-100 transition-colors"
          title="최대화"
        >
          <Square size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="flex h-full w-12 items-center justify-center text-surface-400 hover:bg-red-500 hover:text-white transition-colors"
          title="닫기"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
