import config from '../novel.config'
import { defineScene } from 'fumika'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  variables: {
    _gameScore: 0,
  },
  next: {
    scene: 'scene-food',
    preserve: true,
  },
})(({ label, goto, set }) => [
  { type: 'character', name: 'fumika', action: 'remove', duration: 0 },
  { type: 'background', name: 'room', duration: 0 },
  { type: 'screen-wipe', dir: 'in', preset: 'left', duration: 3000, disable: true },
  { type: 'mood', mood: 'sunset', intensity: 0.7, duration: 3000 },
  {
    type: 'dialogue',
    text: [
      '그로부터 며칠 후.',
      '후미카의 아지트.\n낡은 책상 위에는 화려한 RGB 조명이 번쩍이는 키보드와 듀얼 모니터가 놓여 있다.'
    ]
  },
  {
    type: 'dialogue',
    text: '방 안은 먹다 남은 컵라면 용기와 정체불명의 전선들로 어지럽다.'
  },
  {
    type: 'dialogue',
    text: '화면 속에서는 정체불명의 몬스터가 기괴한 폴리곤을 흩뿌리며 춤을 추고 있다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', position: 'center', focus: 'face', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '자, 봐봐. 이 게임이 얼마나 갓겜이냐면...'
  },
  {
    type: 'dialogue',
    text: '그녀는 반짝이는 눈빛으로 모니터를 가리켰다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '여기서 점프키를 세 번 연타하고 앉기를 누르면 하늘을 날 수 있음.'
  },
  {
    type: 'dialogue',
    text: '그게 무슨 미친 조작법인가 싶지만, 화면 속 캐릭터는 정말로 공중부양을 시작했다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: [
      '물론 착지할 땐 맵을 뚫고 지하실로 떨어지지만.',
      '완전 아트 아님?'
    ]
  },
  {
    type: 'dialogue',
    text: '아니, 그건 그냥 치명적인 버그잖아.'
  },

  {
    type: 'choice',
    choices: [
      {
        text: '"버그가 아니라 기능이네요."',
        goto: 'agree',
        var: ({ likeability }) => ({ likeability: likeability + 10 }),
      },
      {
        text: '"그냥 망겜 아니야?"',
        goto: 'disagree',
        var: ({ likeability }) => ({ likeability: likeability - 10 }),
      },
    ]
  },

  // ─── 분기: 동의 ───
  label('agree'),
  {
    type: 'dialogue',
    text: '"버그가 아니라 기능이네요."'
  },
  {
    type: 'dialogue',
    text: '내 영혼 없는 리액션에도 그녀는 크게 감동한 듯했다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '너 꽤 배운 사람이네.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '개발자의 의도를 완벽히 파악했어.'
  },
  goto('play-game'),

  // ─── 분기: 반대 ───
  label('disagree'),
  {
    type: 'dialogue',
    text: '"그냥 망겜 아니야?"'
  },
  {
    type: 'dialogue',
    text: '팩트를 꽂아넣자, 후미카의 표정이 실시간으로 썩어 들어갔다.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '망겜이라니! 이건 언더독의 반란이자 포스트모더니즘 예술이라고!'
  },
  {
    type: 'dialogue',
    text: '되도 않는 개똥철학을 들먹이며 나를 매도한다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '하... 너는 아직 이 세계를 이해할 준비가 안 된 거야.'
  },
  {
    type: 'dialogue',
    text: '오히려 평생 이해하고 싶지 않다.'
  },
  goto('play-game'),

  // ─── 게임 플레이 ───
  label('play-game'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '자, 패드 잡아. 보스전이야.'
  },
  {
    type: 'dialogue',
    text: '어쩌다 보니 나까지 낡은 엑박 패드를 건네받았다.'
  },
  {
    type: 'dialogue',
    text: '기름때가 묻어있는 패드에서는 미세하게 양파링 냄새가 났다.'
  },
  { type: 'screen-flash', preset: 'red', skip: true },
  { type: 'camera-effect', preset: 'shake', duration: 800 },
  {
    type: 'dialogue',
    text: '전투가 시작되자마자 화면이 기괴하게 일그러졌다.'
  },
  {
    type: 'dialogue',
    text: '내 캐릭터가 갑자기 T포즈를 취하더니 하늘로 솟구치기 시작했다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '아... 또 튕겼다.'
  },
  {
    type: 'dialogue',
    text: '그녀는 아무렇지도 않다는 듯 허탈하게 패드를 내려놓았다.'
  },
  {
    type: 'dialogue',
    text: '이딴 걸 갓겜이라고 부르다니, 세상이 어떻게 되먹은 걸까.'
  },
  {
    type: 'dialogue',
    text: '후미카와의 기묘한 똥겜 데이트가 허무하게 끝났다.'
  },
])
