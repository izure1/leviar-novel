import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  next: {
    scene: 'scene-bug',
    preserve: true,
  },
})(({ label, goto, call }) => [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'park', duration: 1000 },
  { type: 'mood', mood: 'day', intensity: 1, duration: 0 },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },
  {
    type: 'audio',
    action: 'play',
    name: 'bgm',
    src: 'daytime',
    duration: 3000,
    repeat: true,
    volume: 0.1,
  },
  {
    type: 'effect',
    action: 'add',
    effect: 'sakura',
    src: 'sakura',
    rate: 25,
    duration: 1000,
  },

  {
    type: 'dialogue',
    text: '다음 날 아침.'
  },
  {
    type: 'dialogue',
    text: '나는 어젯밤 방송 사고의 충격에서 헤어나오지 못하는 후미카를 강제로 끌고 나왔다.'
  },
  {
    type: 'dialogue',
    text: '방구석에만 박혀있다가는 정말로 곰팡이가 피어오를 것 같았기 때문이다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', position: 'center', focus: 'face', duration: 800 },
  { type: 'mood', mood: 'day', intensity: 1, duration: 800, flicker: 'candle' },
  {
    type: 'dialogue',
    text: [
      '햇빛을 쬐자마자 후미카가 눈을 감싸 쥐며 비명을 질렀다.',
      '꼭 퇴마당하는 거 같다.'
    ]
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '햇빛 에임핵 켰냐! 이거 블루라이트 필터 안 돼?!'
  },
  {
    type: 'dialogue',
    text: '세상에 어떤 태양이 블루라이트 필터를 지원한다는 말인가.'
  },
  {
    type: 'choice',
    choices: [
      {
        text: '"광합성 좀 해. 창백해서 뱀파이어인 줄 알겠다."',
        goto: 'sun',
      },
      {
        text: '"야외 방송 콘텐츠라고 생각해."',
        goto: 'content',
        var: ({ likeability }) => ({ likeability: likeability + 5 }),
      },
    ]
  },

  label('sun'),
  {
    type: 'dialogue',
    text: '"광합성 좀 해. 창백해서 뱀파이어인 줄 알겠다."'
  },
  { type: 'character', name: 'fumika', action: 'show', image: 'normal:angry' },
  {
    type: 'dialogue',
    text: '내 지적에 후미카가 덧니를 드러내며 으르렁거렸다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '뱀파이어면 너부터 물었어.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '근데 넌 피도 맛없게 생겨서 물기도 싫어.'
  },
  {
    type: 'dialogue',
    text: '아침부터 시비 거는 솜씨가 보통이 아니다.'
  },
  goto('walk'),

  label('content'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', focus: '', duration: 300 },
  {
    type: 'dialogue',
    text: '"야외 방송 콘텐츠라고 생각해."'
  },
  {
    type: 'dialogue',
    text: '내가 어르고 달래자, 후미카의 귀가 쫑긋거렸다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '오? 콘텐츠?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '너 제법 매니저 마인드가 장착됐네.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '가산점 +1점 주겠어.'
  },
  {
    type: 'dialogue',
    text: '대체 그 점수는 어디다 쓰는 건지 묻고 싶었지만 꾹 참았다.'
  },
  goto('walk'),

  label('walk'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 300 },
  {
    type: 'dialogue',
    text: '결국 그녀는 입술을 삐죽거리면서도 나를 따라나섰다.'
  },
  {
    type: 'dialogue',
    text: '슬리퍼를 질질 끌며 천천히 공원 산책로를 걷기 시작했다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '뭐... 나쁘진 않네.'
  },
  {
    type: 'dialogue',
    text: '그녀는 주변의 나무와 풀꽃들을 유심히 관찰했다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '그래픽 렌더링도 잘 됐고. 풀 텍스처도 나름 고해상도고.'
  },
  {
    type: 'dialogue',
    text: '자연을 보고 렌더링을 운운하다니, 이 녀석의 뇌 구조는 정말 알 수가 없다.'
  }
])
