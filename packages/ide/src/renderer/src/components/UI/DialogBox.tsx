import React, { useEffect, useRef } from 'react'

export interface DialogBoxProps {
  isOpen: boolean
  title: string
  defaultValue?: string
  placeholder?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function DialogBox({ isOpen, title, defaultValue = '', placeholder = '', onConfirm, onCancel }: DialogBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (inputRef.current) {
      onConfirm(inputRef.current.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 p-4 rounded shadow-xl w-full max-w-md min-w-[320px] mx-4 animate-fade-scale">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        <input
          ref={inputRef}
          className="w-full bg-slate-900 border border-slate-600 text-white px-2 py-1 rounded mb-4 focus:outline-none focus:border-indigo-500"
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end gap-2">
          <button 
            className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-white" 
            onClick={onCancel}
          >
            취소
          </button>
          <button 
            className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 rounded text-white" 
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
