import { useProjectStore } from '../../store/useProjectStore'

export function DebugToolbar() {
  const {
    projectPath,
    activeFile,
    isPreviewOpen,
    previewUrl,
    previewLoading,
    setIsPreviewOpen,
    setPreviewUrl,
    setPreviewLoading
  } = useProjectStore()

  const isSceneActive = activeFile ? activeFile.includes('/scenes/') && activeFile.endsWith('.ts') : false

  const startPreview = async () => {
    if (!projectPath) return
    if (!isSceneActive) return

    setPreviewLoading(true)
    try {
      let activeScene: string | undefined = undefined
      if (activeFile && projectPath) {
        const normalizedFile = activeFile.replace(/\\/g, '/')
        const normalizedProject = projectPath.replace(/\\/g, '/')
        const scenesPrefix = normalizedProject + '/scenes/'
        
        if (normalizedFile.startsWith(scenesPrefix)) {
          activeScene = normalizedFile.substring(scenesPrefix.length).replace(/\.[^/.]+$/, '')
        }
      }
      
      const res = await window.api.preview.start(projectPath, activeScene)
      if (res.success && res.url) {
        setPreviewUrl(res.url)
        if (!isPreviewOpen) setIsPreviewOpen(true)
      } else {
        alert(res.error || 'Failed to start preview')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setPreviewLoading(false)
    }
  }

  const stopPreview = async () => {
    try {
      setPreviewLoading(true)
      await window.api.preview.stop()
      setPreviewUrl(null)
    } catch (err: any) {
      console.error('Failed to stop preview:', err)
    } finally {
      setPreviewLoading(false)
    }
  }

  const openInBrowser = async () => {
    if (previewUrl) {
      await window.api.shell.openExternal(previewUrl)
    }
  }

  if (!projectPath) return null

  return (
    <div className="flex items-center gap-2 ml-4">
      {previewUrl ? (
        <>
          <button
            onClick={stopPreview}
            disabled={previewLoading}
            className="flex items-center justify-center rounded bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
            Stop Debug
          </button>
          <button
            onClick={startPreview}
            disabled={previewLoading || !isSceneActive}
            className={`flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              !isSceneActive ? 'bg-surface-800 text-surface-500 cursor-not-allowed opacity-50' : 'bg-surface-800 text-surface-300 hover:bg-surface-700'
            }`}
            title={!isSceneActive ? "에디터에서 씬 파일을 열어야 디버깅할 수 있습니다." : ""}
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restart
          </button>
          <button
            onClick={openInBrowser}
            className="flex items-center justify-center rounded bg-surface-800 px-3 py-1.5 text-xs font-semibold text-surface-300 transition-colors hover:bg-surface-700"
          >
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Browser
          </button>
        </>
      ) : (
        <button
          onClick={startPreview}
          disabled={previewLoading || !isSceneActive}
          className={`flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
            !isSceneActive ? 'bg-surface-800 text-surface-500 cursor-not-allowed opacity-50' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
          }`}
          title={!isSceneActive ? "에디터에서 씬 파일을 열어야 디버깅할 수 있습니다." : ""}
        >
          {previewLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin mr-1" />
          ) : (
            <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
          Start Debug
        </button>
      )}

      <div className="w-px h-4 bg-surface-700 mx-1"></div>

      <button
        onClick={() => setIsPreviewOpen(!isPreviewOpen)}
        className={`flex items-center justify-center rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
          isPreviewOpen
            ? 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
            : 'bg-surface-800 text-surface-400 hover:bg-surface-700'
        }`}
      >
        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        {isPreviewOpen ? 'Hide Panel' : 'Show Panel'}
      </button>
    </div>
  )
}
