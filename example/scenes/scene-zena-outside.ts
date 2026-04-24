// example/scenes/scene-zena-outside.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  next: 'scene-zena-bug',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0, skip: true },
  { type: 'background', name: 'bg-park', duration: 0, skip: true },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 0, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  {
    type: 'dialogue',
    text: '다음 날 아침. 나는 제나를 강제로 공원에 끌고 나왔다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '악! 눈부셔! 햇빛 에임핵 켰냐! 이거 블루라이트 필터 안 돼?!'
  },
  {
    type: 'choice',
    choices: [
      { text: '"광합성 좀 해. 창백해서 뱀파이어인 줄 알겠다."', goto: 'sun' },
      { text: '"야외 방송 콘텐츠라고 생각해."', goto: 'content' },
    ]
  },

  { type: 'label', name: 'sun' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '뱀파이어면 너부터 물었어. 피도 맛없게 생겼지만.'
  },
  { type: 'condition', if: () => true, goto: 'walk' },

  { type: 'label', name: 'content' },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '오? 콘텐츠? 너 제법 매니저 마인드가 장착됐네. 가산점 +1점.'
  },
  { type: 'condition', if: () => true, goto: 'walk' },

  { type: 'label', name: 'walk' },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    text: '그녀는 투덜거리면서도 나를 따라 천천히 공원을 걸었다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '뭐... 나쁘진 않네. 그래픽 렌더링도 잘 됐고. 풀 텍스처도 나름 고해상도고.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1500 },
])
