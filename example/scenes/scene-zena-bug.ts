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
  { type: 'background', name: 'park', duration: 0, skip: true },
  { type: 'mood', mood: 'day', intensity: 1, duration: 0, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', duration: 0 },
  {
    type: 'dialogue',
    text: [
      '공원을 걷던 중,',
      '갑자기 제나가 발걸음을 멈추고 굳어버렸다.'
    ]
  },

  { type: 'camera-effect', preset: 'shake', duration: 500 },
  { type: 'character', action: 'show', name: 'zena', image: 'embarrassed', focus: 'face', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '헉... 저, 저기...',
      '버그... 리얼 월드 버그 떴어...!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '그녀의 시선 끝에는',
      '큼지막한 매미 한 마리가 벤치 위에 앉아 있었다.'
    ]
  },

  {
    type: 'choice',
    choices: [
      { text: '매미를 맨손으로 잡아서 치워준다', goto: 'hero' },
      { text: '같이 비명을 지르며 도망간다', goto: 'run' },
      { text: '매미를 잡아서 등에 붙여준다', goto: 'prank' },
    ]
  },

  { type: 'label', name: 'hero' },
  {
    type: 'dialogue',
    text: [
      '내가 태연하게 매미를 잡아 숲으로 날려보내자,',
      '제나가 존경스러운 눈빛으로 나를 보았다.'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '미친 피지컬...',
      '너 방금 디버깅 속도 개쩔었어. 인정.'
    ]
  },
  { type: 'condition', if: () => true, goto: 'calm' },

  { type: 'label', name: 'run' },
  { type: 'camera-effect', preset: 'shake', duration: 800 },
  { type: 'character', action: 'show', name: 'zena', image: 'embarrassed', duration: 300 },
  { type: 'mood', mood: 'horror', action: 'add', flicker: 'strobe' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '으아아악!',
      '서버 터진다! 도망가!!!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '우리는 공원 반 바퀴를 전력 질주한 후에야',
      '겨우 멈춰 섰다.'
    ]
  },
  { type: 'condition', if: () => true, goto: 'calm' },

  { type: 'label', name: 'calm' },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '하아... 하아...',
      '역시 현실 세계는 버그 덩어리야.',
      '빨리 아지트로 복귀하자.'
    ]
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1500 },

  { type: 'label', name: 'prank' },
  {
    type: 'dialogue',
    text: [
      '나는 재빨리 매미를 낚아채어 제나의 등에 살포시 붙였다.',
      '매미가 맴맴 울기 시작하자 제나의 눈동자가 미친듯이 흔들렸다.'
    ]
  },
  { type: 'camera-effect', preset: 'shake', intensity: 20, duration: 1000 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '꺄아아아아악!!! 야 이 미친!!!',
      '등에! 등에 뭔가 진동이 울리잖아!! 떼 줘!!!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '"일단 정상적으로 매미가 등에 안착해서 맴맴 소리를 내며 작동하고 있으니,"',
      '"함부로 건드리지 않는 게 개발자의 철칙이다. 섣불리 떼려다 다른 데로 튀면 더 큰 버그가 생겨."'
    ]
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '미친 소리 하지 마아아아!!',
      '살려줘어어!!!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '제나는 공원을 미친 듯이 뛰어다니기 시작했다.',
      '강제 달리기 운동으로 오늘치 칼로리 소모는 완벽하다.'
    ]
  },
])
