// example/scenes/scene-effects.ts
// 테스트: mood, rain/fog effect, light/flicker, camera-effect, screen-fade/flash/wipe
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, [

  // ── 공원으로 배경 전환
  { type: 'background', name: 'bg-park', duration: 1000, skip: true },
  { type: 'mood', action: 'add', mood: 'sunset', intensity: 0.7, duration: 1000, skip: true },
  { type: 'dialogue', text: '[화면 효과 테스트] 공원으로 이동했습니다.' },

  // ── 배열 텍스트 테스트 (Syntax Sugar)
  {
    type: 'dialogue', text: [
      '배열 텍스트 테스트입니다.',
      '여러 개의 대사를 작성할 때,',
      '이처럼 배열로 묶어 작성하면',
      '각각 개별적인 대사로 처리됩니다.'
    ]
  },

  // ── 비 이펙트 + night 무드 + 플리커
  // { type: 'mood', action: 'add', mood: 'night', intensity: 0.7, duration: 1200, skip: true },
  // { type: 'mood', action: 'add', mood: 'cold', flicker: 'flicker', skip: true },
  { type: 'effect', action: 'add', effect: 'rain', src: 'rain', rate: 1200, skip: true },
  { type: 'dialogue', text: 'rain 이펙트 + cold 조명 + night 무드.' },

  // ── 카메라 흔들림
  { type: 'camera-effect', preset: 'shake', duration: 500, repeat: 100 },
  { type: 'dialogue', text: 'camera-effect: shake.' },

  // ── 카메라 줌
  { type: 'camera-zoom', preset: 'close-up', duration: 600 },
  { type: 'dialogue', text: 'camera-zoom: close-up.' },
  { type: 'camera-zoom', preset: 'reset', duration: 600 },

  // ── 스크린 플래시
  { type: 'screen-flash', preset: 'white' },
  { type: 'dialogue', text: 'screen-flash: white.' },

  // ── 이펙트/조명 제거 + day 복원
  { type: 'effect', action: 'remove', effect: 'rain', duration: 600, skip: true },
  { type: 'mood', action: 'remove', mood: 'cold', duration: 600, skip: true },
  { type: 'mood', action: 'add', mood: 'day', intensity: 0.5, duration: 1000, skip: true },
  { type: 'dialogue', text: '이펙트 제거, day 무드 복원.' },

  // ── 와이프 전환
  { type: 'screen-wipe', dir: 'out', preset: 'left', duration: 800 },
  { type: 'screen-wipe', dir: 'in', preset: 'right', duration: 800 },
  { type: 'dialogue', text: 'screen-wipe: left-out → right-in.' },

  // ── 페이드 전환
  { type: 'screen-fade', dir: 'out', preset: 'dream', duration: 800 },
  { type: 'screen-fade', dir: 'in', preset: 'dream', duration: 800 },
  { type: 'dialogue', text: 'screen-fade: dream 프리셋.' },

  // ── 카메라 패닝
  { type: 'camera-pan', preset: 'right', duration: 800 },
  { type: 'dialogue', text: 'camera-pan: right.' },
  { type: 'camera-pan', preset: 'center', duration: 800 },

  // ── fog 이펙트
  { type: 'effect', action: 'add', effect: 'fog', src: 'fog', rate: 20 },
  { type: 'dialogue', text: 'fog 이펙트 추가.' },
  { type: 'effect', action: 'remove', effect: 'fog', duration: 800 },

  // ── 완료
  { type: 'dialogue', text: '모든 화면 효과 테스트 완료!' },
  {
    type: 'choice',
    choices: [
      { text: '탐색 씬 (ExploreScene) →', next: 'explore-map' },
      { text: '처음으로 돌아가기', next: 'scene-intro' },
    ],
  },
])
