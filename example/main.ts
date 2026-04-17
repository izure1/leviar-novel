// example/main.ts — 기능 테스트 진입점
import { Novel } from '../src'
import type { SaveData } from '../src'
import config       from './novel.config'
import sceneIntro   from './scenes/scene-intro'
import sceneA       from './scenes/scene-a'
import sceneCond    from './scenes/scene-condition'
import sceneEffects from './scenes/scene-effects'
import exploreMap   from './scenes/explore-map'

// =============================================================
// SVG 인라인 유틸 (클릭 오브젝트만 SVG 사용)
// =============================================================

const svg = (body: string, w: number, h: number): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  )}`

const OBJECTS: Record<string, string> = {
  'obj-door': svg(`
    <rect width="90" height="160" fill="#8B4513" rx="6"/>
    <rect x="8" y="8" width="74" height="144" fill="#A0522D" rx="4"/>
    <rect x="8" y="8" width="74" height="68"  fill="#9b4f28" rx="4"/>
    <circle cx="68" cy="84" r="6" fill="#FFD700"/>
    <line x1="12" y1="80" x2="78" y2="80" stroke="#7a3a10" stroke-width="2"/>
    <text x="45" y="130" text-anchor="middle" fill="#ffd0a0" font-size="11" font-family="sans-serif">처음으로</text>
  `, 90, 160),

  'obj-window': svg(`
    <rect width="110" height="130" fill="#aaa" rx="4"/>
    <rect x="5" y="5" width="100" height="120" fill="#99ccff" rx="3"/>
    <line x1="55" y1="5"  x2="55" y2="125" stroke="#aaa" stroke-width="5"/>
    <line x1="5"  y1="65" x2="105" y2="65"  stroke="#aaa" stroke-width="5"/>
    <text x="55" y="115" text-anchor="middle" fill="#336" font-size="11" font-family="sans-serif">효과 씬</text>
  `, 110, 130),
}

// =============================================================
// SaveData 직렬화 헬퍼 (Set/Map은 JSON에서 직렬화 불가)
// =============================================================

function serializeSave(data: SaveData): string {
  return JSON.stringify({
    ...data,
    rendererState: {
      ...data.rendererState,
      activeEffects: [...data.rendererState.activeEffects],
      activeLights:  [...data.rendererState.activeLights],
      characters:    Object.fromEntries(data.rendererState.characters),
    },
  })
}

function deserializeSave(json: string): SaveData {
  const raw = JSON.parse(json)
  return {
    ...raw,
    rendererState: {
      ...raw.rendererState,
      activeEffects: new Set<any>(raw.rendererState.activeEffects),
      activeLights:  new Set<any>(raw.rendererState.activeLights),
      characters:    new Map<string, any>(Object.entries(raw.rendererState.characters)),
    },
  }
}

// =============================================================
// Toast 알림
// =============================================================

function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent  = msg
  el.className    = `toast toast-${type} show`
  setTimeout(() => el.classList.remove('show'), 2200)
}

// =============================================================
// Novel 초기화
// =============================================================

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  const novel = new Novel(config, {
    canvas,
    width:  800,
    height: 600,
    depth:  500,
    ui: {
      dialogueBg: { color: 'rgba(8,8,20,0.88)', height: 168 },
      speaker:    { fontSize: 17, fontWeight: 'bold', color: '#ffd966' },
      dialogue:   { fontSize: 18, color: '#f0f0f0', lineHeight: 1.65 },
      choice: {
        background:       'rgba(20,20,50,0.90)',
        borderColor:      'rgba(255,255,255,0.25)',
        hoverBackground:  'rgba(80,60,180,0.92)',
        hoverBorderColor: 'rgba(200,180,255,0.8)',
        borderRadius:     10,
        minWidth:         280,
      },
    },
  })

  // ── 씬 등록
  novel.register(sceneIntro)
  novel.register(sceneA)
  novel.register(sceneCond)
  novel.register(sceneEffects)
  novel.register(exploreMap)

  // ── 에셋 로드
  await novel.load({
    // 배경
    bg_floor:   './assets/bg_floor.png',
    bg_library: './assets/bg_library.png',
    bg_park:    './assets/bg_park.png',
    // 캐릭터
    girl_normal: './assets/girl_normal.png',
    girl_smile:  './assets/girl_smile.png',
    // 파티클 (에셋 키 = effect type)
    dust:   './assets/particle_dust.png',
    rain:   './assets/particle_rain.png',
    snow:   './assets/particle_snow.png',
    sakura: './assets/particle_sakura.png',
    fog:    './assets/particle_fog.png',
    // 클릭 오브젝트 (SVG 인라인)
    ...OBJECTS,
  })

  // ── 시작
  novel.start('scene-intro')

  // =============================================================
  // 컨트롤 버튼 연결
  // =============================================================

  const btnSkip = document.getElementById('btn-skip') as HTMLButtonElement
  const btnSave = document.getElementById('btn-save') as HTMLButtonElement
  const btnLoad = document.getElementById('btn-load') as HTMLButtonElement

  // Skip 버튼 — 토글 방식
  btnSkip.addEventListener('click', (e) => {
    e.stopPropagation()
    if (novel.isSkipping) {
      novel.stopSkip()
    } else {
      novel.skip()
    }
  })

  // Skip 버튼 상태 동기화 (300ms 간격)
  setInterval(() => {
    if (novel.isSkipping) {
      btnSkip.textContent = '⏹ 중지'
      btnSkip.classList.add('active')
    } else {
      btnSkip.textContent = '⏩ Skip'
      btnSkip.classList.remove('active')
    }
  }, 300)

  // Save 버튼
  btnSave.addEventListener('click', (e) => {
    e.stopPropagation()
    try {
      const data = novel.save()
      localStorage.setItem('leviar-novel-save', serializeSave(data))
      showToast('💾 저장 완료!', 'success')
    } catch {
      showToast('⚠ 저장 실패: 대화 씬에서만 가능', 'error')
    }
  })

  // Load 버튼
  btnLoad.addEventListener('click', (e) => {
    e.stopPropagation()
    const raw = localStorage.getItem('leviar-novel-save')
    if (!raw) {
      showToast('📂 저장 데이터 없음', 'info')
      return
    }
    try {
      const data = deserializeSave(raw)
      novel.loadSave(data)
      showToast('📂 불러오기 완료!', 'success')
    } catch {
      showToast('⚠ 불러오기 실패', 'error')
    }
  })
}

main().catch(console.error)
