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
  { type: 'background', name: 'bg-library', duration: 0, skip: true },
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
  { type: 'character', action: 'show', name: 'zena', image: 'smile', position: 'center', duration: 1000 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '오늘 퀘스트 같이 뛰어줘서 고마워.'
  },
  {
    type: 'dialogue',
    text: '그녀는 단순한 외출조차 퀘스트라고 부른다.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '사실 나 혼자서는 나갈 엄두도 못 냈거든.'
  },
  {
    type: 'dialogue',
    text: '살짝 쑥스러운 듯, 제나가 시선을 회피하며 뺨을 긁적였다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '...근데 좀 오글거리네.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아까 한 말은 롤백할게. 못 들은 걸로 해줘.'
  },
  {
    type: 'dialogue',
    text: '기껏 분위기 잡아놓고 1초 만에 철회한다.'
  },

  {
    type: 'choice',
    choices: [
      { text: '"이미 세이브했어."', goto: 'saved' },
      { text: '"그래, 나도 피곤하다."', goto: 'tired' },
    ]
  },

  { type: 'label', name: 'saved' },
  {
    type: 'dialogue',
    text: '"이미 내 뇌에 세이브했어."'
  },
  {
    type: 'dialogue',
    text: '장난스럽게 받아치자, 제나의 눈이 커졌다.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아, 데이터 강제 삭제할 거야!'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '내 흑역사 폴더에 불법 접근하지 마!'
  },
  {
    type: 'dialogue',
    text: '귀끝이 새빨개진 제나가 애꿎은 키보드 샷건을 쳤다.'
  },
  { type: 'condition', if: () => true, goto: 'epilogue' },

  { type: 'label', name: 'tired' },
  {
    type: 'dialogue',
    text: '"그래, 나도 피곤하다. 당분간 외출은 무리야."'
  },
  {
    type: 'dialogue',
    text: '격하게 동의해주자, 그녀의 얼굴에 안도감이 번졌다.'
  },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '그치? 내일은 각자 집에서 디스코드나 켜자.'
  },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '그게 우리다운 거지.'
  },
  {
    type: 'dialogue',
    text: '히키코모리 동맹이 결성되는 순간이었다.'
  },
  { type: 'condition', if: () => true, goto: 'epilogue' },

  { type: 'label', name: 'epilogue' },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아무튼... 수고했어. 파티원.'
  },
  {
    type: 'dialogue',
    text: '제나는 작게 웃으며 다시 헤드셋을 썼다.'
  },
  {
    type: 'dialogue',
    text: '모니터 불빛이 그녀의 뺨을 은은하게 비추었다.'
  },
  {
    type: 'dialogue',
    text: '평범하지만, 버그 투성이인 일상이 다시 시작되고 있었다.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 3000 },
  { type: 'dialogue', text: '제나 에피소드가 모두 종료되었습니다.' },
])
