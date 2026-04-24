// example/scenes/scene-zena-bug.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  next: 'scene-zena-ending',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0, skip: true },
  { type: 'background', name: 'bg-park', duration: 0, skip: true },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 0, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', duration: 0 },
  {
    type: 'dialogue',
    text: '공원을 걷던 중, 갑자기 제나가 발걸음을 멈추고 굳어버렸다.'
  },
  
  { type: 'camera-effect', preset: 'shake', duration: 500 },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', focus: 'face', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '헉... 저, 저기... 버그... 리얼 월드 버그 떴어...!'
  },
  {
    type: 'dialogue',
    text: '그녀의 시선 끝에는 큼지막한 매미 한 마리가 벤치 위에 앉아 있었다.'
  },
  
  {
    type: 'choice',
    choices: [
      { text: '매미를 맨손으로 잡아서 치워준다', goto: 'hero' },
      { text: '같이 비명을 지르며 도망간다', goto: 'run' },
    ]
  },

  { type: 'label', name: 'hero' },
  {
    type: 'dialogue',
    text: '내가 태연하게 매미를 잡아 숲으로 날려보내자, 제나가 존경스러운 눈빛으로 나를 보았다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '미친 피지컬... 너 방금 디버깅 속도 개쩔었어. 인정.'
  },
  { type: 'condition', if: () => true, goto: 'calm' },

  { type: 'label', name: 'run' },
  { type: 'camera-effect', preset: 'shake', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '으아아악! 서버 터진다! 도망가!!!'
  },
  {
    type: 'dialogue',
    text: '우리는 공원 반 바퀴를 전력 질주한 후에야 겨우 멈춰 섰다.'
  },
  { type: 'condition', if: () => true, goto: 'calm' },

  { type: 'label', name: 'calm' },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '하아... 하아... 역시 현실 세계는 버그 덩어리야. 빨리 아지트로 복귀하자.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1500 },
])
