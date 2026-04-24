// example/scenes/scene-zena.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  variables: {
    _isAnnoyed: false,
  },
  initial: commonInitial,
  next: 'scene-zena-game',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'bg-floor', duration: 0 },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 0 },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  {
    type: 'dialogue',
    text: [
      '주말 오후의 카페. 창밖으로 내리쬐는 햇살이 평화롭다.',
      '사람들의 웅성거림 사이로, 구석 자리에서 묘한 살기가 느껴졌다.',
      '그곳에는 마치 세상 모든 짐을 짊어진 듯한 표정의 소녀가 있었다.'
    ]
  },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', focus: 'face', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아... 인생 진짜 로그아웃하고 싶다.'
  },

  { type: 'dialogue', text: '그녀는 앞에 놓인 노트북을 죽일 듯이 노려보고 있었다.' },

  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '너, 혹시 제 얼굴에 "나 오늘 갓생 살 거다"라고 쓰여있어?',
      '왜 하필 내 앞에서 그렇게 해맑게 커피를 마시는 거야? 자비 좀 베풀어줘.'
    ]
  },

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
    text: [
      '일? 하, 비즈니스 토크 금지야. 지금 내 두뇌는 404 Error 상태라고.',
      '그냥... 세상의 모든 코드를 삭제하고 평화로운 자연인으로 살고 싶을 뿐이야.'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '근데 너 커피 맛있어 보인다. 한 입만? 아, 농담이야. 밴(Ban) 당하기 싫으면 조심해.'
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 분기: 버그 질문 ───
  { type: 'label', name: 'ask-bug' },
  { type: 'camera-effect', preset: 'shake', duration: 400 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '버그?! 너, 지금 금기어 썼어. 내 인생 자체가 거대한 버그인데 무슨 소릴 하는 거야?',
      '세미콜론 하나 때문에 내 주말이 통째로 날아갔다고! 이건 인권 침해야!'
    ]
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '...근데 너 개발자야? 아니면 그냥 훈수 두는 하청 업자야? 말투가 딱 트위치 채팅창인데.'
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 분기: 도망 ───
  { type: 'label', name: 'escape' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '어? 어딜 도망가? 지금 내 기분이 떡락 중인데 관객도 없이 혼자 화나 있으라고?',
      '너, 앉아. 방금 나랑 눈 마주쳤으니까 이제 우린 구독과 좋아요 관계야. 도망 못 가.'
    ]
  },
  { type: 'condition', if: () => true, goto: 'common-end' },

  // ─── 공통 엔딩 ───
  { type: 'label', name: 'common-end' },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '하... 모르겠다. 갓생은 내일부터 살지 뭐.',
      '너, 나랑 게임이나 한 판 때릴래? 요즘 유행하는 그 버그 겜.'
    ]
  },
  {
    type: 'dialogue',
    text: '그녀는 노트북을 쾅 닫고는, 가방에서 에너지 드링크를 꺼내 원샷했다.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 2000 },
  { type: 'dialogue', text: '제나와의 첫 만남이 끝났습니다.' },
])
