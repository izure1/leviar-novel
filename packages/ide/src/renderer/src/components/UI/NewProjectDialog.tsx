import React, { useState, useEffect, useRef } from 'react'

export interface NewProjectOptions {
  folderName: string
  gameName: string
  projectId: string
  processName: string
  width: number
  height: number
}

export interface NewProjectDialogProps {
  isOpen: boolean
  onConfirm: (options: NewProjectOptions) => void
  onCancel: () => void
}

export function NewProjectDialog({ isOpen, onConfirm, onCancel }: NewProjectDialogProps) {
  const [step, setStep] = useState(1)
  const maxStep = 4

  const [folderName, setFolderName] = useState('my-visual-novel')
  const [gameName, setGameName] = useState('My Visual Novel')
  const [projectId, setProjectId] = useState('com.mycompany.myvisualnovel')
  const [processName, setProcessName] = useState('my-visual-novel')
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [step, isOpen])

  if (!isOpen) return null

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {}
    
    if (currentStep === 2) {
      if (!folderName.trim()) newErrors.folderName = '폴더 이름을 입력해주세요.'
      else if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) newErrors.folderName = '폴더 이름은 영문, 숫자, 하이픈(-), 언더스코어(_)만 가능합니다.'
      
      if (!processName.trim()) newErrors.processName = '프로세스 이름을 입력해주세요.'
      else if (!/^[a-z0-9-]+$/.test(processName)) newErrors.processName = '프로세스 이름은 소문자, 숫자, 하이픈(-)만 가능합니다.'
    }

    if (currentStep === 3) {
      if (!gameName.trim()) newErrors.gameName = '게임 이름을 입력해주세요.'
      
      if (!projectId.trim()) newErrors.projectId = '프로젝트 ID를 입력해주세요.'
      else if (!/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(projectId)) {
        newErrors.projectId = '올바른 프로젝트 ID 형식이 아닙니다 (예: com.example.game)'
      }
    }

    if (currentStep === 4) {
      if (width <= 0) newErrors.width = '해상도는 1 이상이어야 합니다.'
      if (height <= 0) newErrors.height = '해상도는 1 이상이어야 합니다.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step) && step < maxStep) {
      setErrors({})
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setErrors({})
      setStep(step - 1)
    }
  }

  const handleConfirm = () => {
    if (validateStep(step)) {
      onConfirm({
        folderName,
        gameName,
        projectId,
        processName,
        width,
        height
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      if (step < maxStep) {
        handleNext()
      } else {
        handleConfirm()
      }
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in text-sm px-4">
      <div className="bg-slate-800 border border-slate-700 p-6 rounded shadow-xl w-full max-w-lg min-w-[320px] md:max-w-xl animate-fade-scale transition-all" onKeyDown={handleKeyDown}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">새 프로젝트 생성 (단계 {step}/{maxStep})</h3>
        </div>
        
        <div className="flex flex-col gap-4 mb-6 min-h-[140px]">
          {step === 1 && (
            <div className="flex flex-col gap-2 animate-fade-in text-slate-300">
              <span className="font-semibold text-xs text-indigo-400">오픈소스 라이선스 안내</span>
              <div className="bg-slate-900 border border-slate-700 p-3 rounded text-[10px] h-[100px] overflow-y-auto whitespace-pre-wrap font-mono text-slate-400">
                {`MIT 라이선스

저작권 (c) ${new Date().getFullYear()}

이 소프트웨어 및 관련 문서 파일("소프트웨어")의 복제본을 얻는 모든 사람에게, 본 소프트웨어를 사용, 복사, 수정, 병합, 출판, 배포, 서브라이선스 부여 및/또는 판매할 수 있는 권리를 제한 없이 무상으로 취득하는 것을 허가합니다. 단, 다음 조건에 따라 소프트웨어를 제공받는 사람에게도 이러한 권리를 허여해야 합니다:

위의 저작권 고지 및 이 허가 고지는 본 소프트웨어의 모든 복제본 또는 주요 부분에 포함되어야 합니다.

본 소프트웨어는 상품성, 특정 목적에의 적합성 및 비침해성에 대한 보증을 포함하되 이에 국한되지 않는 어떤 형태의 명시적 또는 묵시적 보증 없이 "있는 그대로" 제공됩니다. 어떠한 경우에도 저작권자나 소프트웨어 개발자는 계약, 불법행위 기타 원인에 관계없이 소프트웨어 또는 소프트웨어의 사용이나 기타 거래와 관련하여 발생하는 청구, 손해 또는 기타 책임에 대해 어떠한 책임도 지지 않습니다.`}
              </div>
              <p className="text-xs text-slate-400 mt-1">프로젝트를 생성하면 본 라이선스 규정에 동의하게 되며, 엔진 개발자는 소프트웨어 사용으로 인한 책임을 지지 않습니다.</p>
            </div>
          )}

          {step === 2 && (
            <>
              <label className="flex flex-col gap-1 text-slate-300 animate-fade-in">
                <span className="font-semibold text-xs">폴더 이름 (영문/숫자/하이픈)</span>
                <input
                  ref={inputRef}
                  className={`bg-slate-900 border ${errors.folderName ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                />
                {errors.folderName && <span className="text-red-400 text-[10px]">{errors.folderName}</span>}
              </label>

              <label className="flex flex-col gap-1 text-slate-300 animate-fade-in">
                <span className="font-semibold text-xs">프로세스 이름 (작업 관리자 표시용)</span>
                <input
                  className={`bg-slate-900 border ${errors.processName ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                />
                {errors.processName && <span className="text-red-400 text-[10px]">{errors.processName}</span>}
              </label>
            </>
          )}

          {step === 3 && (
            <>
              <label className="flex flex-col gap-1 text-slate-300 animate-fade-in">
                <span className="font-semibold text-xs">게임 이름 (실제 표기용)</span>
                <input
                  ref={inputRef}
                  className={`bg-slate-900 border ${errors.gameName ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                />
                {errors.gameName && <span className="text-red-400 text-[10px]">{errors.gameName}</span>}
              </label>

              <label className="flex flex-col gap-1 text-slate-300 animate-fade-in">
                <span className="font-semibold text-xs">프로젝트 ID (com.example.game)</span>
                <input
                  className={`bg-slate-900 border ${errors.projectId ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                />
                {errors.projectId && <span className="text-red-400 text-[10px]">{errors.projectId}</span>}
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <div className="flex gap-2 animate-fade-in">
                <label className="flex flex-col gap-1 text-slate-300 flex-1">
                  <span className="font-semibold text-xs">가로 해상도</span>
                  <input
                    ref={inputRef}
                    type="number"
                    className={`bg-slate-900 border ${errors.width ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                  />
                  {errors.width && <span className="text-red-400 text-[10px]">{errors.width}</span>}
                </label>
                <label className="flex flex-col gap-1 text-slate-300 flex-1">
                  <span className="font-semibold text-xs">세로 해상도</span>
                  <input
                    type="number"
                    className={`bg-slate-900 border ${errors.height ? 'border-red-500' : 'border-slate-600'} text-white px-2 py-1.5 rounded focus:outline-none focus:border-indigo-500`}
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                  />
                  {errors.height && <span className="text-red-400 text-[10px]">{errors.height}</span>}
                </label>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button 
            className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors" 
            onClick={onCancel}
          >
            취소
          </button>
          
          <div className="flex gap-2">
            {step > 1 && (
              <button 
                className="px-4 py-2 text-sm border border-slate-600 hover:bg-slate-700 rounded text-white transition-colors" 
                onClick={handlePrev}
              >
                이전
              </button>
            )}
            {step < maxStep ? (
              <button 
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors font-semibold" 
                onClick={handleNext}
              >
                다음
              </button>
            ) : (
              <button 
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors font-semibold" 
                onClick={handleConfirm}
              >
                완료
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
