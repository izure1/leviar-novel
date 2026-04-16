// example/scenes/scene-intro.ts
// 테스트: background, mood, screen-fade, character, narration, dialogue, choice, var
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, 'scene-intro', [

  // ── 오프닝 전환
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'bg-room', duration: 0 },
  { type: 'mood', mood: 'day', intensity: 0.8 },
  { type: 'screen-fade', dir: 'in',  preset: 'black', duration: 1200 },

  // ── 나레이션 (speaker 없음)
  { type: 'dialogue', text: '조용한 교실... 오늘도 수업이 끝났다.' },
  { type: 'dialogue', text: '그때, 누군가 말을 걸어왔다.' },

  // ── 캐릭터 등장 + 대사 동시 (배열 = 자동 진행)
  [
    { type: 'character', action: 'show', name: 'heroine', position: 'center', image: 'normal' },
    { type: 'var',       name: 'metHeroine', value: true },
  ],

  // ── 캐릭터 대사
  { type: 'dialogue', speaker: 'heroine', text: '저기... 안녕하세요!' },
  { type: 'dialogue', speaker: 'heroine', text: '처음 보는 얼굴이네요. 전학 오셨나요?' },
  { type: 'dialogue', text: '어떻게 대답할까...' },

  // ── 선택지 (choice + var 테스트)
  {
    type: 'choice',
    choices: [
      {
        text: '친절하게 대답한다',
        next: 'scene-a',
        var: { likeability: 20 },
      },
      {
        text: '무시하고 지나친다',
        next: 'scene-a',
        var: { likeability: -5 },
      },
    ],
  },
])
