// example/scenes/scene-zena-ending.ts
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  // 씬 5개 종료 후 처음으로 롤백
  next: 'scene-zena',
}, [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0, skip: true },
  { type: 'background', name: 'room', duration: 0, skip: true },
  { type: 'mood', mood: 'sunset', intensity: 0.8, duration: 0, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 2000 },

  {
    type: 'dialogue',
    text: '어느새 해가 지고, 창밖으로 붉은 노을이 스며들고 있었다.'
  },
  {
    type: 'dialogue',
    text: '다사다난했던 하루가 끝을 향해 가고 있다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', position: 'center', duration: 1000 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '야, 오늘 어그로 핑퐁 좀 치더라.'
  },
  {
    type: 'dialogue',
    text: '외출을 무슨 레이드 뛴 것처럼 말한다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '너 없었으면 중간에 현실 로그아웃 할 뻔했어. 고맙다.'
  },
  {
    type: 'dialogue',
    text: '제나가 모니터로 시선을 고정하며 무심하게 툭 던졌다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'embarrassed', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '...아 씨, 방금 대사 좀 미연시 NPC 같지 않았냐?'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '방금 건 캐시 삭제해. 머릿속 휴지통 비우기 누르라고.'
  },
  {
    type: 'dialogue',
    text: '쑥스러움을 화내는 걸로 무마하려는 게 뻔히 보인다.'
  },

  {
    type: 'choice',
    choices: [
      { text: '"탱커 수고비 내놔."', goto: 'pay' },
      { text: '"다음 레이드는 딴 사람 구해라."', goto: 'tired' },
    ]
  },

  { type: 'label', name: 'pay' },
  {
    type: 'dialogue',
    text: '"어그로 끌어줬으니까 탱커 수고비 내놔."'
  },
  {
    type: 'dialogue',
    text: '뻔뻔하게 손을 내밀자, 제나의 표정이 구겨졌다.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  { type: 'character', action: 'show', name: 'zena', image: 'angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '뭐?! 뉴비 쩔해준 것도 아닌데 무슨 수고비야! 양심 디버깅 좀 해!'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '돈은 없고, 대신 내일 듀오 돌릴 때 내가 특별히 힐러 해준다.'
  },
  {
    type: 'dialogue',
    text: '항상 딜러만 고집하며 돌진하다 죽는 제나의 성향을 생각하면 엄청난 파격 대우다.'
  },
  { type: 'condition', if: () => true, goto: 'epilogue' },

  { type: 'label', name: 'tired' },
  {
    type: 'dialogue',
    text: '"오늘 피로도 다 썼다. 다음 레이드는 다른 파티원 구해라."'
  },
  {
    type: 'dialogue',
    text: '단호하게 선을 긋자, 제나가 당황한 듯 모니터에서 눈을 뗐다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'embarrassed', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '어? 아니... 다음 퀘스트도 탱커 필수인데...'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아 몰라! 딴 사람 없으니까 내가 파티 초대 보내면 조용히 수락이나 눌러!'
  },
  {
    type: 'dialogue',
    text: '결국 강제 징용 엔딩이다.'
  },
  { type: 'condition', if: () => true, goto: 'epilogue' },

  { type: 'label', name: 'epilogue' },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아무튼... 수고했다. 고기방패.'
  },
  {
    type: 'dialogue',
    text: '제나는 피식 웃으며 헤드셋을 고쳐 썼다.'
  },
  {
    type: 'dialogue',
    text: '그리고 무자비하게 게임 매칭 시작 버튼을 눌렀다.'
  },
  {
    type: 'dialogue',
    text: '나의 평화로운 주말은 이렇게 그녀의 게임 중독과 함께 터져버렸다.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 3000 },
  { type: 'dialogue', text: '제나 에피소드가 모두 종료되었습니다.' },
])
