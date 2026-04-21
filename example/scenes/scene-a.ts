// example/scenes/scene-a.ts
// 테스트: overlay, sakura effect, character-focus, character-highlight, camera-pan, bg-library
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, {}, [

  // ── 배경 전환 + 벚꽃 효과
  { type: 'background', name: 'bg-library', duration: 800, skip: true },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 800, skip: true },

  // ── 타이틀 오버레이
  { type: 'overlay', action: 'add', text: '— 도서관 —', preset: 'title' },
  { type: 'overlay', action: 'remove', preset: 'title', duration: 800, skip: true },
  { type: 'effect', action: 'add', effect: 'sakura', src: 'sakura', rate: 6, skip: true },

  // ── 대사
  { type: 'dialogue', speaker: 'arisiero', text: '벚꽃 잎사귀가 도서관 안까지 들어왔네요!' },
  { type: 'dialogue', text: '그녀는 창가로 걸어갔다.' },
  { type: 'character-focus', name: 'arisiero', point: 'face' },

  // ── 캐릭터 표정 변경 + 클로즈업
  { type: 'character', action: 'show', name: 'arisiero', image: 'smile' },
  { type: 'character-focus', name: 'arisiero', point: 'face', zoom: 'close-up', duration: 800, skip: true },
  { type: 'dialogue', speaker: 'arisiero', text: '(클로즈업 상태 — character-focus 테스트)' },

  // ── 하이라이트 (컷인)
  { type: 'character-highlight', name: 'arisiero', action: 'on', skip: true },
  { type: 'dialogue', speaker: 'arisiero', text: '(하이라이트 컷인 — character-highlight 테스트)' },
  { type: 'character-highlight', name: 'arisiero', action: 'off' },

  // ── 카메라 + 이펙트 리셋
  { type: 'character', name: 'arisiero', action: 'show', position: 'center', skip: true },
  { type: 'camera-zoom', preset: 'reset', duration: 600, skip: true },
  { type: 'camera-pan', position: 'center', duration: 600, skip: true },
  { type: 'effect', action: 'remove', effect: 'sakura', duration: 800 },

  // ── 다음 씬 선택
  { type: 'dialogue', text: '다음 테스트로 이동합니다.' },
  {
    type: 'choice',
    choices: [
      { text: '조건 분기 테스트 →', next: 'scene-condition' },
      { text: '화면 효과 테스트 →', next: 'scene-effects' },
    ],
  },
])
