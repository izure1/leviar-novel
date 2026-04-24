// example/scenes/scene-zena-game.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  variables: {
    _gameScore: 0,
    _zenaRage: 0,
  },
  initial: commonInitial,
  next: 'scene-intro',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'bg-library', duration: 0 },
  { type: 'mood', mood: 'night', intensity: 0.7, duration: 0 },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  {
    type: 'dialogue',
    text: [
      '제나의 아지트. 낡은 책상 위에는 화려한 RGB 조명이 번쩍이는 키보드와 듀얼 모니터가 놓여 있다.',
      '화면 속에서는 정체불명의 몬스터가 기괴한 폴리곤을 흩뿌리며 춤을 추고 있다.'
    ]
  },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', focus: 'face', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '자, 봐봐. 이 게임이 얼마나 갓겜이냐면...',
      '여기서 점프키를 세 번 연타하고 앉기를 누르면 하늘을 날 수 있음.'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '물론 착지할 땐 맵을 뚫고 지하실로 떨어지지만. 완전 아트 아님?'
  },

  {
    type: 'choice',
    choices: [
      { text: '"버그가 아니라 기능이네요."', goto: 'agree' },
      { text: '"그냥 망겜 아니야?"', goto: 'disagree' },
    ]
  },

  // ─── 분기: 동의 ───
  { type: 'label', name: 'agree' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '오, 님 꽤 배우신 분이네. 개발자의 의도를 완벽히 파악했음.'
  },
  { type: 'var', name: 'likeability', value: 10 },
  { type: 'condition', if: () => true, goto: 'play-game' },

  // ─── 분기: 반대 ───
  { type: 'label', name: 'disagree' },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '망겜이라니! 이건 언더독의 반란이자 포스트모더니즘 예술이라고!',
      '하... 님은 아직 이 세계를 이해할 준비가 안 된 거임.'
    ]
  },
  { type: 'condition', if: () => true, goto: 'play-game' },

  // ─── 게임 플레이 ───
  { type: 'label', name: 'play-game' },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '자, 패드 잡으셈. 보스전임.'
  },

  { type: 'screen-flash', preset: 'red', repeat: 5 },
  { type: 'camera-effect', preset: 'shake', duration: 800 },
  {
    type: 'dialogue',
    text: '화면이 기괴하게 일그러지더니, 게임 캐릭터가 T포즈를 취하며 하늘로 솟구쳤다.'
  },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아... 또 튕겼다.'
  },
  {
    type: 'dialogue',
    text: '그녀는 허탈하게 패드를 내려놓았다.'
  },

  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 2000 },
  { type: 'dialogue', text: '제나와의 기묘한 게임 데이트가 끝났습니다.' },
])
