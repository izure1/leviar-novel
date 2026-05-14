import { useEffect, useState } from 'react'
import { useProjectStore } from '../../store/useProjectStore'

export function PreviewPanel() {
  const projectPath = useProjectStore((state) => state.projectPath)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const startPreview = async () => {
    if (!projectPath) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await window.api.preview.start(projectPath)
      if (res.success && res.url) {
        setPreviewUrl(res.url)
      } else {
        setError(res.error || 'Unknown error occurred')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const stopPreview = async () => {
    try {
      await window.api.preview.stop()
      setPreviewUrl(null)
    } catch (err: any) {
      console.error('Failed to stop preview:', err)
    }
  }

  useEffect(() => {
    if (projectPath) {
      startPreview()
    }
    return () => {
      stopPreview()
    }
  }, [projectPath])

  return (
    <div className="w-full flex-1 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden relative">
      {/* Header bar for preview */}
      <div className="h-10 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-4 justify-between shrink-0">
        <span className="text-xs font-semibold text-slate-300">Preview</span>
        <button 
          onClick={startPreview} 
          disabled={loading}
          className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/40 transition-colors"
        >
          {loading ? 'Starting...' : 'Restart'}
        </button>
      </div>

      <div className="flex-1 relative bg-black flex items-center justify-center">
        {!projectPath && (
          <span className="text-sm text-slate-500">프로젝트를 열어주세요</span>
        )}
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-indigo-300 font-medium animate-pulse">프리뷰 서버 시작 중...</p>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 p-6 text-center">
            <svg className="w-10 h-10 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 font-medium mb-2">프리뷰 서버를 켤 수 없습니다.</p>
            <p className="text-xs text-red-300/70 max-w-sm break-all">{error}</p>
          </div>
        )}

        {previewUrl && !error && (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 absolute inset-0"
            title="Fumika Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  )
}
