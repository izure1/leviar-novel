import React, { useEffect, useRef } from 'react'

export interface ConfirmDialogBoxProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'danger'
  showCancel?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialogBox({ 
  isOpen, 
  title, 
  message, 
  confirmText = '확인', 
  cancelText = '취소', 
  type = 'info',
  showCancel = true,
  onConfirm, 
  onCancel 
}: ConfirmDialogBoxProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen && confirmRef.current) {
      confirmRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      onCancel()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'danger':
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 sm:mx-0 sm:h-10 sm:w-10">
            <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-slate-900 border border-slate-700/60 p-6 rounded-md shadow-2xl shadow-black/50 w-full max-w-lg min-w-[320px] md:max-w-xl mx-4 animate-fade-scale overflow-hidden relative">
        {/* Glow effect */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
        }`}></div>

        <div className="sm:flex sm:items-start relative z-10">
          {getIcon()}
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-bold leading-6 text-white" id="modal-title">
              {title}
            </h3>
            <div className="mt-2">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 relative z-10">
          {showCancel && (
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-sm bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 shadow-sm ring-1 ring-inset ring-slate-600 hover:bg-slate-800 transition-colors sm:w-auto sm:min-w-[4rem]"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            ref={confirmRef}
            className={`inline-flex w-full justify-center rounded-sm px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 sm:w-auto sm:min-w-[4rem] ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/30 shadow-lg' 
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30 shadow-lg'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 shadow-lg'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
