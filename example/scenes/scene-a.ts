// example/scenes/scene-a.ts
// 테스트: overlay, effect, character-focus, character-highlight, camera-pan
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, 'scene-a', [

  // ── 타이틀 오버레이 (add → 대기 → remove 배열)
  { type: 'overlay', action: 'add',  text: '— Scene A: 캐릭터 & 이펙트 —', preset: 'title' },
  [
    { type: 'overlay', action: 'remove', preset: 'title', duration: 800 },
    { type: 'effect',  action: 'add',    effect: 'sakura',  rate: 8 },
  ],

  // ── 대사
  { type: 'dialogue', speaker: 'heroine', text: '벚꽃이 교실 안까지 들어왔네요!' },

  // ── character-focus 클로즈업 + 대사 배열
  [
    { type: 'character-focus', name: 'heroine', point: 'face', zoom: 'close-up', duration: 800 },
    { type: 'dialogue', speaker: 'heroine', text: '(클로즈업 상태입니다)' },
  ],

  // ── 표정 변경 + highlight
  { type: 'character', action: 'show', name: 'heroine', image: 'happy' },
  [
    { type: 'character-highlight', name: 'heroine', action: 'on' },
    { type: 'dialogue', speaker: 'heroine', text: '(하이라이트 컷인 상태!)' },
  ],
  { type: 'character-highlight', name: 'heroine', action: 'off' },

  // ── 카메라 리셋 + 이펙트 제거 배열
  [
    { type: 'camera-zoom', preset: 'reset',  duration: 600 },
    { type: 'camera-pan',  preset: 'center', duration: 600 },
  ],
  { type: 'effect', action: 'remove', effect: 'sakura', duration: 800 },

  // ── 씬 이동 선택
  { type: 'dialogue', text: '다음 테스트로 이동합니다.' },
  {
    type: 'choice',
    choices: [
      { text: '조건 분기 테스트 →', next: 'scene-condition' },
      { text: '카메라 효과 테스트 →', next: 'scene-effects' },
    ],
  },
])
