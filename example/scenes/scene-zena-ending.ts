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
  { type: 'character', action: 'show', name: 'zena', image: 'smile', position: 'center', duration: 1000 },
  
  {
    type: 'dialogue',
    speaker: 'zena',
    text: [
      '오늘 퀘스트(외출) 같이 뛰어줘서 고마워.',
      '사실 나 혼자서는 나갈 엄두도 못 냈거든.'
    ]
  },
  { type: 'character', action: 'show', name: 'zena', image: 'normal', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '...근데 좀 오글거리네. 아까 한 말은 롤백할게. 못 들은 걸로 해줘.'
  },
  
  {
    type: 'choice',
    choices: [
      { text: '"이미 세이브했어."', goto: 'saved' },
      { text: '"그래, 나도 피곤하다."', goto: 'tired' },
    ]
  },

  { type: 'label', name: 'saved' },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '아, 데이터 강제 삭제할 거야! 내 흑역사 폴더에 접근하지 마!'
  },
  { type: 'condition', if: () => true, goto: 'epilogue' },

  { type: 'label', name: 'tired' },
  { type: 'character', action: 'show', name: 'zena', image: 'smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'zena',
    text: '그치? 내일은 각자 집에서 디스코드나 켜자. 그게 우리다운 거지.'
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
    text: '제나는 작게 웃으며 다시 헤드셋을 썼다. 평범하지만, 버그 투성이인 일상이 다시 시작되고 있었다.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 3000 },
  { type: 'dialogue', text: '제나 에피소드가 모두 종료되었습니다.' },
])
