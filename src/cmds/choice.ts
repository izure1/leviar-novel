import type { SceneContext } from '../core/SceneContext'
import type { Resolvable } from '../define/defineCmd'
import { defineCmd } from '../define/defineCmd'

/** 
 * 선택지를 표시하고 분기한다 
 * 
 * @example
 * ```ts
 * {
 *   type: 'choice',
 *   choices: [
 *     { text: '싸운다', next: 'battle_scene', var: { courage: 10 } },
 *     { text: ({ courage }) => `싸운다 (용기: ${courage})`, next: 'battle_scene' },
 *     { text: '도망친다', goto: 'run_away_label' }
 *   ]
 * }
 * ```
 */
export interface ChoiceCmd<TVars, TLocalVars, TScenes extends readonly string[]> {
  /** 사용자에게 제공될 선택지 목록입니다. */
  choices: {
    /** 선택지 버튼에 표시될 텍스트입니다. 함수를 사용하면 변수를 참조할 수 있습니다. */
    text: Resolvable<string, TVars, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 씬(Scene)의 이름입니다. */
    next?: TScenes[number]
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: string
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: Partial<Record<keyof TVars, any>>
  }[]
}

export const choiceHandler = defineCmd<ChoiceCmd<any, any, any>>((cmd, ctx) => {
  // choices 배열 원소의 text는 이미 resolveVal에 의해 string으로 resolve됨
  ctx.callbacks.onChoice(cmd.choices as any)
  return 'handled'
})
