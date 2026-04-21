// example/scenes/scene-condition.ts
// 테스트: condition(and/or), label/goto, var, localVars
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, { _tries: 0 }, [

  // ── 나레이션
  { type: 'dialogue', text: `[조건 분기 테스트]` },
  { type: 'dialogue', text: `현재 호감도와 만남 여부로 분기합니다.` },

  // ── label: cond-check
  { type: 'label', name: 'cond-check' },

  // ── 복합 조건: likeability >= 10
  {
    type: 'condition',
    if: ({ likeability }) => likeability >= 10,
    goto: 'branch-good',
    else: 'branch-bad',
  },

  // ── 나쁜 분기
  { type: 'label', name: 'branch-bad' },
  { type: 'dialogue', speaker: 'arisiero', text: '...왜 이런 대우를 받는 건지 모르겠어요.' },
  { type: 'dialogue', text: '(호감도를 20으로 강제 설정합니다. 현재: {{ likeability }} {{ _tries }} {{ likeability >= 10 ? "참" : "거짓" }})' },
  { type: 'var', name: 'likeability', value: 20 },
  { type: 'var', name: '_tries', value: 1 },
  // 강제 수정 후 재확인
  { type: 'condition', if: ({ _tries }) => _tries >= 1, goto: 'cond-check' },

  // ── 좋은 분기
  { type: 'label', name: 'branch-good' },
  // ── [Resolvable 검증] name, image 돈다 함수형 prop
  {
    type: 'character',
    action: 'show',
    name: (vars: typeof config.vars & { _tries: number }) => vars.likeability >= 10 ? 'arisiero' : 'arisiero',
    image: (vars: typeof config.vars & { _tries: number }) => vars.likeability >= 20 ? 'smile' : 'normal',
  },
  { type: 'dialogue', speaker: 'arisiero', text: '와, 호감도가 높네요! 감사해요! (현재: {{ likeability }} {{ _tries }} {{ likeability >= 10 ? "참" : "거짓" }})' },
  // ── [Resolvable 검증] text에 함수 반환값 + {{ }} 템플릿 중첩
  { type: 'dialogue', text: (vars: typeof config.vars & { _tries: number }) => `[함수형 text] 현재 호감도: {{ ${vars.likeability} }}, 조건: ${ vars.likeability >= 10 ? '통과' : '실패'}` },
  // ── [Resolvable 검증] choices 배열 원소 내부 text도 함수형
  {
    type: 'choice',
    choices: [
      { text: (vars: typeof config.vars & { _tries: number }) => `호감도(${vars.likeability})로 계속`, next: 'scene-effects' },
      { text: '시작으로', next: 'scene-intro' },
    ],
  },
  // ── 실제 이 분기 이후는 choice에서 넘어가므로 아래는 도달 안 함

  // ── or 조건 테스트
  { type: 'dialogue', text: '[or 조건 테스트] likeability >= 50 or endingReached' },
  {
    type: 'condition',
    if: ({ likeability, endingReached }) => likeability >= 50 || endingReached,
    goto: 'skip-normal',
  },
  { type: 'dialogue', speaker: 'arisiero', text: '(조건이 거짓 — 50 미만이고 엔딩 미다못함)' },
  { type: 'label', name: 'skip-normal' },

  // ── 지역변수 최종 표시
  { type: 'dialogue', text: `[지역변수] _tries = 재시도 횟수. 전역변수 likeability = 현재 호감도.` },
  { type: 'dialogue', text: '씬 이동 후 _tries는 초기화되지만 likeability는 유지됩니다.' },
  {
    type: 'choice',
    choices: [
      { text: '카메라 효과 테스트 →', next: 'scene-effects' },
      { text: '처음으로 돌아가기', next: 'scene-intro' },
    ],
  },

])
