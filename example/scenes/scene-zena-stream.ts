// example/scenes/scene-zena-stream.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  next: 'scene-zena-outside',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0, skip: true },
  { type: 'background', name: 'bg-library', duration: 0, skip: true },
  { type: 'mood', mood: 'night', intensity: 0.7, duration: 0, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },

  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', duration: 800 },
  {
    type: 'dialogue',
    text: '배달 음식을 기다리며 유튜브를 보던 제나가 갑자기 마이크 선을 건드렸다.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '앗, 잠깐!',
      '이거 방송 켜진 거 아니야?!'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '...어? 켜졌네.',
      '하이룽~ 트수들!',
      '방송 안 켠다고 해놓고 실수로 켜버렸다!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '1초 만에 텐션이 180도 바뀌었다.',
      '인터넷 방송인의 직업병인가.'
    ]
  },
  {
    type: 'choice',
    choices: [
      { text: '카메라 밖에서 조용히 손을 흔들어준다', goto: 'wave' },
      { text: '"야, 내 찜닭은 언제 와?" 라고 소리친다', goto: 'troll' },
    ]
  },

  { type: 'label', name: 'wave' },
  {
    type: 'dialogue',
    text: [
      '나는 카메라 사각지대에서 장난스럽게 손을 흔들었다.',
      '화면 구석에 내 손가락이 1초쯤 잡혔다.'
    ]
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    text: [
      '순간, 미친 듯이 올라가던 채팅창이 일순간 얼어붙더니 매서운 속도로 도배되기 시작했다.',
      '채팅창: [ ??? ] [ 방금 남자 손 아님? ] [ 유니콘 뿔 다 부러지는 소리 들리네 ] [ 화면 까매진다 ㄷㄷㄷ ]'
    ]
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '(소곤소곤) 미쳤어?! 손 치워!',
      '나 육수 우려서 먹고사는 심해 방송이란 말이야!'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '아, 여러분! 방금 그거 제 손이에요!',
      '제가 뼈대 굵은 거 아시잖아요? 하하하!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '어설픈 해명이 화를 불렀다. 채팅창은 뿔이 부러진 유니콘 대신 다른 부류의 시청자들로 폭주하기 시작했다.',
      '채팅창: [ 우욱... ] [ 형 뭐해 ] [ 캠 끄고 듀라한 하는 이유가 있었네 ] [ 역겹다 진짜 ㅋㅋㅋㅋ ] [ 군필 여고생 컨셉임? ]'
    ]
  },
  { type: 'camera-effect', preset: 'shake', duration: 500 },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '아니야! 형 아니라고!',
      '민방위 안 끝났냐니 선 넘네 진짜!',
      '야, 너 때문에 여캠 인생 끝났잖아!'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '이성을 잃은 제나가 내 멱살을 잡고 흔드는 장면까지...',
      '카메라에 고스란히 송출되었다.'
    ]
  },
  {
    type: 'dialogue',
    text: '채팅창: [ ㅋㅋㅋㅋ 물리엔진 개쩐다 ] [ 멱살잡이 합방 폼 미쳤다 ] [ 도파민 터지네 ]'
  },
  { type: 'condition', if: () => true, goto: 'stream-end' },

  { type: 'label', name: 'troll' },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    text: [
      '내가 뒤에서 쩌렁쩌렁하게 외치자,',
      '채팅창이 순식간에 불타오르기 시작했다.',
      '채팅창: [ ㅋㅋㅋㅋ 남자 목소리 뭐냐 ] [ 동거남 찜닭은 중대사항이지 ] [ 뿔 다 갈려서 가루 됨 ] [ 채팅창 까매지는 거 보소 ]'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '악! 야! 너 지금 뭐 하는 거야?!'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '...아, 여러분. 방금 그건 제 GPT입니다.',
      '배달 알림 기능이 좀 리얼하죠? 땀땀...'
    ]
  },
  { type: 'condition', if: () => true, goto: 'stream-end' },

  { type: 'label', name: 'stream-end' },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '오늘 방송은 3분 만에 방종하겠습니다! ㅃㅃ!'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 300 },
  {
    type: 'dialogue',
    text: [
      '방송 종료 버튼을 누르자마자 제나는...',
      '다시 죽은 눈으로 돌아왔다.'
    ]
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1500 },
])
