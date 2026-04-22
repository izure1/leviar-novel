// example/main.ts — 기능 테스트 진입점
import { Novel } from '../src'
import config from './novel.config'

import sceneIntro from './scenes/scene-intro'
import sceneA from './scenes/scene-a'
import sceneCond from './scenes/scene-condition'
import sceneEffects from './scenes/scene-effects'
import exploreMap from './scenes/explore-map'
import sceneZena from './scenes/scene-zena'

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
// Toast 알림
// =============================================================

function showToast(msg: string, type: 'success' | 'error' | 'info' = 'success'): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.className = `toast toast-${type} show`
  setTimeout(() => el.classList.remove('show'), 2200)
}

// =============================================================
// Novel 초기화
// =============================================================

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  const novel = new Novel(config, {
    canvas,
    width: 800,
    height: 600,
    depth: 500,
    scenes: {
      'scene-intro': sceneIntro,
      'scene-a': sceneA,
      'scene-condition': sceneCond,
      'scene-effects': sceneEffects,
      'explore-map': exploreMap,
      'scene-zena': sceneZena,
    },
  })

  // ── 에셋 로드 (경로는 novel.config.ts의 assets에서 관리)
  await novel.load()

  // ── SVG 오브젝트는 런타임에만 생성되므로 직접 추가 로드
  await novel.loadAssets(OBJECTS)

  // ── 시작
  novel.start('scene-zena')

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
      console.log(data)
      localStorage.setItem('leviar-novel-save', JSON.stringify(data))
      showToast('💾 저장 완료!', 'success')
    } catch (e) {
      console.error(e)
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
      const data = JSON.parse(raw)
      novel.loadSave(data)
      showToast('📂 불러오기 완료!', 'success')
    } catch (e) {
      console.error(e)
      showToast('⚠ 불러오기 실패', 'error')
    }
  })

  // ── 다음으로 진행 (클릭 & 스페이스바)
  window.addEventListener('click', () => {
    novel.next()
  })

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault() // 스페이스바 기본 동작(스크롤 등) 방지
      novel.next()
    }
  })
}

main().catch(console.error)
