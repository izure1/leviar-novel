import { useState, useEffect } from 'react'

interface Props {
  content: string
  onChange: (value: string) => void
}

export function BackgroundFormEditor({ content, onChange }: Props) {
  const [bgName, setBgName] = useState('my_background')
  const [src, setSrc] = useState('')
  const [parallax, setParallax] = useState(false)

  // 간단한 정규식으로 기존 값 추출 (AST 미사용 단순 파싱)
  useEffect(() => {
    try {
      const srcMatch = content.match(/src:\s*['"]([^'"]+)['"]/)
      if (srcMatch && srcMatch[1]) setSrc(srcMatch[1])
      
      const parallaxMatch = content.match(/parallax:\s*(true|false)/)
      if (parallaxMatch && parallaxMatch[1]) setParallax(parallaxMatch[1] === 'true')

      // 이름 추출 (export default { bg_name: { ... } })
      const nameMatch = content.match(/export\s+default\s*{\s*['"]?([a-zA-Z0-9_]+)['"]?\s*:/)
      if (nameMatch && nameMatch[1]) setBgName(nameMatch[1])
    } catch (e) {
      // 파싱 실패 시 무시
    }
  }, [content])

  // 값이 바뀔 때마다 템플릿 문자열 재생성하여 부모에게 전달
  const updateTemplate = (n: string, s: string, p: boolean) => {
    const template = `import { defineBackgrounds } from 'fumika'

export default {
  ${n || 'unnamed'}: { src: '${s}', parallax: ${p} }
}
`
    onChange(template)
  }

  return (
    <div className="p-6 bg-[#1e1e1e] h-full overflow-y-auto text-slate-300">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Background Asset Editor</h2>
          <p className="text-sm text-slate-500">배경 이미지를 등록하고 속성을 설정합니다. 템플릿 덮어쓰기 방식으로 동작합니다.</p>
        </div>

        <div className="space-y-4 bg-slate-800/30 p-5 rounded-lg border border-slate-700/50">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">배경 식별자 (ID)</label>
            <input 
              type="text" 
              value={bgName}
              onChange={(e) => {
                setBgName(e.target.value)
                updateTemplate(e.target.value, src, parallax)
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="예: bg_room"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">이미지 경로 (src)</label>
            <input 
              type="text" 
              value={src}
              onChange={(e) => {
                setSrc(e.target.value)
                updateTemplate(bgName, e.target.value, parallax)
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              placeholder="예: assets/bg_room.png"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={() => {
                const newVal = !parallax
                setParallax(newVal)
                updateTemplate(bgName, src, newVal)
              }}
              className={`w-12 h-6 rounded-full transition-colors relative ${parallax ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${parallax ? 'translate-x-6' : ''}`} />
            </button>
            <label className="text-sm font-medium text-slate-300">
              패럴랙스(Parallax) 효과 활성화
            </label>
          </div>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded text-sm text-blue-200">
          <p className="font-semibold mb-1">미리보기</p>
          <p className="opacity-80">저장 시 이 설정값으로 코드가 자동 생성됩니다. 코드 모드에서 생성된 결과를 확인할 수 있습니다.</p>
        </div>
      </div>
    </div>
  )
}
