import { useProjectStore } from '../../store/useProjectStore'

export function LoadingOverlay() {
  const { globalLoading } = useProjectStore()

  if (!globalLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-300">작업을 처리하는 중입니다...</p>
      </div>
    </div>
  )
}
