// example/scenes/scene-zena.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  variables: {
    _isAnnoyed: false,
    _test: 0,
  },
  initial: commonInitial,
  next: 'scene-zena-game',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'floor', duration: 0 },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 0 },
  { type: 'effect', action: 'add', effect: 'dust', src: 'dust', rate: 25 },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  {
    type: 'dialogue',
    text: '주말 오후의 카페. 창밖으로 내리쬐는 햇살이 평화롭다.'
  },
  { type: 'audio', action: 'play', name: 'bgm', src: 'am223', repeat: true, duration: 3000, volume: 0.1 },
  {
    type: 'dialogue',
    text: '향긋한 커피 향과 사람들의 웅성거림 사이로...'
  },
  {
    type: 'dialogue',
    text: '구석 자리에서 유독 이질적인 살기가 느껴졌다.'
  },
  {
    type: 'dialogue',
    text: '그곳에는 마치 세상 모든 짐을 짊어진 듯한 표정의 소녀가 있었다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', focus: 'face', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아... 인생 진짜 로그아웃하고 싶다.'
  },
  {
    type: 'dialogue',
    text: '소녀는 금방이라도 모니터를 부술 듯한 기세였다.'
  },
  {
    type: 'dialogue',
    text: '그녀는 앞에 놓인 노트북을 죽일 듯이 노려보고 있었다.'
  },
  {
    type: 'dialogue',
    text: '내가 힐끔 쳐다보자, 살벌한 눈빛과 딱 마주쳤다.'
  },
  { type: 'camera-zoom', preset: 'close-up' },
  { type: 'character', action: 'show', name: 'zena', image: 'angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '너, 혹시 제 얼굴에 "나 오늘 갓생 살 거다"라고 쓰여있어?'
  },
  {
    type: 'dialogue',
    text: '초면에 다짜고짜 시비다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '왜 하필 내 앞에서 그렇게 해맑게 커피를 마시는 거야?'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '자비 좀 베풀어줘.'
  },
  { type: 'character-focus', name: 'zena', point: 'face', zoom: 'reset' },

  {
    type: 'choice',
    choices: [
      { text: '"무슨 일 하세요?"라고 묻는다', goto: 'ask-job' },
      { text: '"노트북에 버그 났나요?"라고 묻는다', goto: 'ask-bug' },
      { text: '조용히 자리를 피한다', goto: 'escape' },
    ]
  },

  // ─── 분기: 일 질문 ───
  { type: 'label', name: 'ask-job' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '일? 하, 비즈니스 토크 금지야. 지금 내 두뇌는 404 Error 상태라고.'
  },
  {
    type: 'dialogue',
    text: '대체 무슨 일을 하길래 상태 코드를 입에 달고 사는 걸까.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '그냥... 세상의 모든 코드를 삭제하고 평화로운 자연인으로 살고 싶을 뿐이야.'
  },
  {
    type: 'dialogue',
    text: '확실히 제정신은 아닌 것 같다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '근데 너 커피 맛있어 보인다. 한 입만?'
  },
  {
    type: 'dialogue',
    text: '내 커피잔을 향해 손을 뻗는 폼이 심상치 않다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아, 농담이야. 밴(Ban) 당하기 싫으면 조심해.'
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 분기: 버그 질문 ───
  { type: 'label', name: 'ask-bug' },
  { type: 'camera-effect', preset: 'shake', duration: 400 },
  { type: 'character', action: 'show', name: 'zena', image: 'angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '버그?! 너, 지금 금기어 썼어.'
  },
  {
    type: 'dialogue',
    text: '발작 스위치를 누른 모양이다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '내 인생 자체가 거대한 버그인데 무슨 소릴 하는 거야?'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '세미콜론 하나 때문에 내 주말이 통째로 날아갔다고! 이건 인권 침해야!'
  },
  {
    type: 'dialogue',
    text: '그녀는 허공에 대고 주먹질을 해댔다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '...근데 너 개발자야? 아니면 그냥 훈수 두는 하청 업자야?'
  },
  {
    type: 'dialogue',
    text: '의심스러운 눈초리로 위아래를 훑어본다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '말투가 딱 트위치 채팅창인데.'
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 분기: 도망 ───
  { type: 'label', name: 'escape' },
  {
    type: 'dialogue',
    text: '똥이 무서워서 피하나. 나는 슬그머니 자리에서 일어났다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '어? 어딜 도망가?'
  },
  {
    type: 'dialogue',
    text: '번개같이 손목을 붙잡혔다. 악력이 장난이 아니다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '지금 내 기분이 떡락 중인데 관객도 없이 혼자 화나 있으라고?'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '너, 앉아.'
  },
  {
    type: 'dialogue',
    text: '나는 얌전히 다시 자리에 앉았다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '방금 나랑 눈 마주쳤으니까 이제 우린 구독과 좋아요 관계야. 도망 못 가.'
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 공통 엔딩 ───
  { type: 'label', name: 'common-end' },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '하... 모르겠다. 갓생은 내일부터 살지 뭐.'
  },
  {
    type: 'dialogue',
    text: '그녀는 미련 없이 노트북 화면을 절전 모드로 돌렸다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '너, 나랑 게임이나 한 판 때릴래?'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '요즘 유행하는 그 똥겜 있어. 버그 덩어리인 거.'
  },
  {
    type: 'dialogue',
    text: '아니, 방금 전까지 버그 때문에 화내지 않았나?'
  },
  {
    type: 'dialogue',
    text: '그녀는 대답도 듣지 않고 노트북을 쾅 닫았다.'
  },
  {
    type: 'dialogue',
    text: '그리고 가방에서 몬스터 에너지 드링크를 꺼내 원샷을 때렸다.'
  },
  {
    type: 'dialogue',
    text: '이것이 나와 제나의 끔찍한 첫 만남이었다.'
  },
  { type: 'mood', mood: 'sunset', intensity: 1, duration: 3000 },
  { type: 'screen-wipe', dir: 'out', preset: 'left', duration: 3000, disable: true },
])
