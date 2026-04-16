// example/scenes/scene-effects.ts
// 테스트: mood 전환, light, flicker, camera-effect, screen-fade/flash/wipe, effect(rain/fog)
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, 'scene-effects', [

  // ── 무드 전환
  { type: 'mood', mood: 'night', intensity: 0.7, duration: 1200 },
  { type: 'dialogue', text: '[화면 효과 테스트] night 무드로 전환했습니다.' },

  // ── 비 이펙트 + 조명
  [
    { type: 'effect', action: 'add', effect: 'rain', rate: 120 },
    { type: 'light',  action: 'add', preset: 'cold' },
  ],
  { type: 'dialogue', text: 'rain 이펙트 + cold 조명 추가.' },

  // ── 조명 플리커
  { type: 'flicker', light: 'cold', flicker: 'flicker' },
  { type: 'dialogue', text: 'flicker(깜빡임) 적용.' },

  // ── 카메라 효과
  { type: 'camera-effect', preset: 'shake',   duration: 500 },
  { type: 'dialogue', text: 'camera-effect: shake.' },
  { type: 'camera-effect', preset: 'bounce',  duration: 600 },
  { type: 'dialogue', text: 'camera-effect: bounce.' },
  { type: 'camera-effect', preset: 'wave',    duration: 1000 },
  { type: 'dialogue', text: 'camera-effect: wave.' },

  // ── 카메라 줌
  { type: 'camera-zoom', preset: 'close-up', duration: 600 },
  { type: 'dialogue', text: 'camera-zoom: close-up.' },
  { type: 'camera-zoom', preset: 'reset',    duration: 600 },

  // ── 스크린 플래시
  { type: 'screen-flash', preset: 'white' },
  { type: 'dialogue', text: 'screen-flash: white.' },

  // ── 이펙트/조명 제거 + 무드 복원 배열
  [
    { type: 'effect', action: 'remove', effect: 'rain', duration: 600 },
    { type: 'light',  action: 'remove', preset: 'cold',  duration: 600 },
    { type: 'mood',   mood: 'day',   intensity: 0.6, duration: 1000 },
  ],
  { type: 'dialogue', text: '이펙트/조명 제거, day 무드로 복원.' },

  // ── 와이프 전환
  { type: 'screen-wipe', dir: 'out', preset: 'left',  duration: 800 },
  { type: 'screen-wipe', dir: 'in',  preset: 'right', duration: 800 },
  { type: 'dialogue', text: 'screen-wipe: left-out → right-in.' },

  // ── 페이드 전환
  { type: 'screen-fade', dir: 'out', preset: 'dream', duration: 800 },
  { type: 'screen-fade', dir: 'in',  preset: 'dream', duration: 800 },
  { type: 'dialogue', text: 'screen-fade: dream 프리셋.' },

  // ── 카메라 패닝
  { type: 'camera-pan', preset: 'right', duration: 800 },
  { type: 'dialogue', text: 'camera-pan: right.' },
  { type: 'camera-pan', preset: 'center', duration: 800 },

  // ── 탐색 씬으로 이동
  { type: 'dialogue', text: '모든 화면 효과 테스트 완료! 탐색 씬으로 이동합니다.' },
  {
    type: 'choice',
    choices: [
      { text: '탐색 씬 (ExploreScene) →', next: 'explore-map' },
      { text: '처음으로 돌아가기',          next: 'scene-intro' },
    ],
  },
])
