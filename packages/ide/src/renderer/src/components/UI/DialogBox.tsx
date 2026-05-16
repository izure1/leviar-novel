import React, { useEffect, useRef } from 'react'

export interface DialogBoxProps {
  isOpen: boolean
  title: string
  defaultValue?: string
  placeholder?: string
  options?: { label: string; value: string }[]
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function DialogBox({ isOpen, title, defaultValue = '', placeholder = '', options, onConfirm, onCancel }: DialogBoxProps) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current && inputRef.current.tagName === 'INPUT') {
      (inputRef.current as HTMLInputElement).focus();
      (inputRef.current as HTMLInputElement).select();
    } else if (isOpen && inputRef.current && inputRef.current.tagName === 'SELECT') {
      (inputRef.current as HTMLSelectElement).focus();
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (inputRef.current) {
      onConfirm(inputRef.current.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
      <div className="bg-surface-800 border border-surface-700 p-4 rounded-sm shadow-xl w-full max-w-md min-w-[320px] mx-4 animate-fade-scale">
        <h3 className="text-sm font-bold text-white mb-2">{title}</h3>
        {options ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            className="w-full bg-surface-900 border border-surface-600 text-white px-2 py-1 rounded-sm mb-4 focus:outline-none focus:border-primary-500"
            defaultValue={defaultValue || (options.length > 0 ? options[0].value : '')}
            onKeyDown={handleKeyDown}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className="w-full bg-surface-900 border border-surface-600 text-white px-2 py-1 rounded-sm mb-4 focus:outline-none focus:border-primary-500"
            defaultValue={defaultValue}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
          />
        )}
        <div className="flex justify-end gap-2">
          <button 
            className="px-3 py-1 text-xs bg-surface-700 hover:bg-surface-600 rounded-sm text-white" 
            onClick={onCancel}
          >
            취소
          </button>
          <button 
            className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-500 rounded-sm text-white" 
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}
