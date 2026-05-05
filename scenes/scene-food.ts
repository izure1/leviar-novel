import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  next: {
    scene: 'scene-stream',
    preserve: true,
  },
})(({ label, goto }) => [
  { type: 'mood', mood: 'sunset', action: 'remove', duration: 3000 },
  { type: 'mood', mood: 'night', action: 'add', intensity: 0.7, duration: 3000, disable: true },
  { type: 'dialogue', text: '해가 진다.' },

  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '하... 게임 억까 당해서 멘탈 터지니까 배고파졌다.'
  },
  {
    type: 'dialogue',
    text: '그녀가 배를 부여잡으며 깊은 한숨을 쉬었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '인간의 3大 욕구는 코딩, 수면, 야식 아니야?'
  },
  {
    type: 'dialogue',
    text: '"식욕이 아니라 야식이라고?"'
  },
  {
    type: 'dialogue',
    text: '어이없어서 태클을 걸었지만, 그녀는 아랑곳하지 않았다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '당연하지. 현대인에게 야식은 중꺾마의 원천이야.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '중요한 건 꺾이지 않는 마라맛.'
  },
  {
    type: 'dialogue',
    text: '후미카는 스마트폰을 꺼내 배달 앱을 미친 듯이 스크롤하기 시작했다.'
  },
  {
    type: 'choice',
    choices: [
      { text: '"무난하게 치킨 어때?"', goto: 'chicken' },
      { text: '"아까 매운 거 먹고 싶다며. 엽기 떡볶이?"', goto: 'spicy' },
    ]
  },

  // ─── 치킨 ───
  label('chicken'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: [
      '치킨?',
      '너 T야? 공감 능력 죽었네.',
      '요즘 대세는 마라로제크림치즈찜닭이잖아.'
    ]
  },
  {
    type: 'dialogue',
    text: '그게 무슨 끔찍한 혼종인가.'
  },
  { type: 'dialogue', text: '"마라에 로제에 크림치즈...? 위장 테러 아냐?"' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '테러방지법은 통과됐지만, 찜닭방지법은 아직이거든, 내가.',
  },
  { type: 'dialogue', text: '할 말을 잃었다.' },
  goto('order'),

  // ─── 매운거 ───
  label('spicy'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '오, 기억력 좋은데? 대화가 된다 대화가.'
  },
  {
    type: 'dialogue',
    text: '후미카가 만족스러운 미소를 지었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '근데 매운 거 먹으면 내 위장이 위험해질 수도...'
  },
  { type: 'dialogue', text: '"그렇다면?"' },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '그러니까 마라로제크림치즈찜닭으로 간다.'
  },
  {
    type: 'dialogue',
    text: '대체 어디서부터 태클을 걸어야 할지 모르겠다.'
  },
  { type: 'dialogue', text: '기적의 논리다.' },
  goto('order'),

  // ─── 공통 주문 ───
  label('order'),
  {
    type: 'dialogue',
    text: '결국 기승전 찜닭, 완벽한 답정너였다.'
  },
  {
    type: 'dialogue',
    text: '후미카는 익숙한 손놀림으로 결제를 마쳤다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '배달 60분 걸린대.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  { type: 'dialogue', text: '"잠깐, 방금 내 핸드폰에서 카드 결제 알림이 울린 것 같은데?"' },
  {
    type: 'dialogue',
    text: '등골이 쎄하게 식었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '어, 음식 올 때까지 시간 남았네!'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '유튜브 숏폼으로 도파민 좀 채워야지~'
  },
  { type: 'dialogue', text: '후미카는 내 말을 깔끔하게 씹어버렸다.' },
  {
    type: 'dialogue',
    text: '그리고는 곧바로 화면 속 숏폼 영상으로 빨려 들어갔다.'
  },
])
