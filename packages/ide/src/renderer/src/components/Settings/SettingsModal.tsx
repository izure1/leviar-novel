import React from 'react'
import { X, Check } from 'lucide-react'
import { useProjectStore, ThemeColor, ThemeBg } from '../../store/useProjectStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const THEMES: { id: ThemeColor; name: string; hex: string }[] = [
  { id: 'indigo', name: '인디고', hex: '#6366f1' },
  { id: 'rose', name: '로즈', hex: '#f43f5e' },
  { id: 'emerald', name: '에메랄드', hex: '#10b981' },
  { id: 'amber', name: '앰버', hex: '#f59e0b' },
  { id: 'sky', name: '스카이', hex: '#0ea5e9' },
  { id: 'violet', name: '바이올렛', hex: '#8b5cf6' }
]

const BG_THEMES: { id: ThemeBg; name: string; hex: string }[] = [
  { id: 'slate', name: '슬레이트', hex: '#0f172a' },
  { id: 'zinc', name: '징크', hex: '#18181b' },
  { id: 'neutral', name: '뉴트럴', hex: '#171717' },
  { id: 'stone', name: '스톤', hex: '#1c1917' },
  { id: 'gray', name: '그레이', hex: '#111827' }
]

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { themeColor, setThemeColor, themeBg, setThemeBg, formatOnSave, setFormatOnSave } = useProjectStore()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-[500px] rounded-lg border border-surface-800 bg-surface-900 shadow-2xl animate-fade-scale overflow-hidden">
        <header className="flex items-center justify-between border-b border-surface-800 bg-surface-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-surface-100">IDE 설정</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-100 transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-medium text-surface-300">강조 색상 (Accent Color)</h3>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setThemeColor(theme.id)}
                  className={`flex items-center justify-between rounded-md border p-3 transition-all ${
                    themeColor === theme.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-800/50 hover:border-surface-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shadow-inner"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span className="text-sm font-medium text-surface-200">
                      {theme.name}
                    </span>
                  </div>
                  {themeColor === theme.id && (
                    <Check size={16} className="text-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-4 text-sm font-medium text-surface-300">배경 색상 (Background Tone)</h3>
            <div className="grid grid-cols-3 gap-3">
              {BG_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setThemeBg(theme.id)}
                  className={`flex items-center justify-between rounded-md border p-3 transition-all ${
                    themeBg === theme.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-surface-700 bg-surface-800/50 hover:border-surface-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full shadow-inner border border-surface-600"
                      style={{ backgroundColor: theme.hex }}
                    />
                    <span className="text-sm font-medium text-surface-200">
                      {theme.name}
                    </span>
                  </div>
                  {themeBg === theme.id && (
                    <Check size={16} className="text-primary-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="mb-4 text-sm font-medium text-surface-300">에디터 동작 (Editor Behavior)</h3>
            <div className="flex items-center justify-between rounded-md border border-surface-700 bg-surface-800/50 p-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-surface-200">저장 시 자동 포맷팅</span>
                <span className="text-xs text-surface-500">Ctrl+S로 저장할 때 코드를 자동으로 정렬합니다.</span>
              </div>
              <button
                onClick={() => setFormatOnSave(!formatOnSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formatOnSave ? 'bg-primary-500' : 'bg-surface-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formatOnSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-surface-500 mt-4">
            설정은 자동으로 저장되며 IDE 전체 환경에 즉시 반영됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

