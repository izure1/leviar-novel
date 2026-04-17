// example/scenes/scene-condition.ts
// 테스트: condition(and/or), label/goto, var, localVars
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, [

  // ── 지역변수 초기화
  { type: 'var', name: 'tries', value: 0, scope: 'local' },

  // ── 나레이션
  { type: 'dialogue', text: `[조건 분기 테스트]` },
  { type: 'dialogue', text: `현재 호감도와 만남 여부로 분기합니다.` },

  // ── label: cond-check
  { type: 'label', name: 'cond-check' },

  // ── 복합 조건: likeability >= 10 and metHeroine
  {
    type: 'condition',
    if: 'likeability >= 10 and metHeroine',
    goto: 'branch-good',
    else: 'branch-bad',
  },

  // ── 나쁜 분기
  { type: 'label', name: 'branch-bad' },
  { type: 'dialogue', speaker: 'heroine', text: '...왜 이런 대우를 받는 건지 모르겠어요.' },
  { type: 'dialogue', text: '(호감도를 20으로 강제 설정합니다.)' },
  { type: 'var', name: 'likeability', value: 20 },
  { type: 'var', name: 'tries', value: 1, scope: 'local' },
  // 강제 수정 후 재확인
  { type: 'condition', if: 'tries >= 1', goto: 'cond-check' },

  // ── 좋은 분기
  { type: 'label', name: 'branch-good' },
  { type: 'character', action: 'show', name: 'heroine', image: 'smile' },
  { type: 'dialogue', speaker: 'heroine', text: '와, 호감도가 높네요! 감사해요!' },

  // ── or 조건 테스트
  { type: 'dialogue', text: '[or 조건 테스트] likeability >= 50 or endingReached' },
  {
    type: 'condition',
    if: 'likeability >= 50 or endingReached',
    goto: 'skip-normal',
  },
  { type: 'dialogue', speaker: 'heroine', text: '(조건이 거짓 — 50 미만이고 엔딩 미다못함)' },
  { type: 'label', name: 'skip-normal' },

  // ── 지역변수 최종 표시
  { type: 'dialogue', text: `[지역변수] tries = 재시도 횟수. 전역변수 likeability = 현재 호감도.` },
  { type: 'dialogue', text: '씬 이동 후 tries는 초기화되지만 likeability는 유지됩니다.' },
  {
    type: 'choice',
    choices: [
      { text: '카메라 효과 테스트 →', next: 'scene-effects' },
      { text: '처음으로 돌아가기', next: 'scene-intro' },
    ],
  },

], { localVars: { tries: 0 } })
