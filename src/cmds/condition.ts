import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

/** 
 * 변수 조건에 따라 분기한다 
 * 
 * @example
 * ```ts
 * {
 *   type: 'condition',
 *   if: 'courage >= 10 and hasSword',
 *   next: 'boss_battle',
 *   else: 'bad_ending'
 * }
 * ```
 */
export interface ConditionCmd<TVars, TLocalVars, TScenes extends readonly string[]> {
  /**
   * 평가할 조건 함수 또는 값입니다.
   * `vars` 인자를 통해 전역변수와 지역변수(`_` 접두사)를 구조 분해 할당하여 사용할 수 있습니다.
   * 직접 `boolean` 값을 전달하는 것도 가능합니다.
   * 
   * @example
   * ```ts
   * // 함수 형태
   * if: ({ likeability, _tries }) => likeability >= 10 && _tries >= 1
   * // 직접 값
   * if: true
   * ```
   */
  if: (vars: TVars & TLocalVars) => boolean
  /** 조건 충족 시(true) 이동할 씬 이름입니다. */
  next?: TScenes[number]
  /** 조건 충족 시(true) 이동할 현재 씬 내의 라벨 이름입니다. */
  goto?: string
  /**
   * 조건 미충족 시(false) 이동할 라벨 이름 또는 씬 이름입니다.
   * 현재 씬의 라벨 이름으로 먼저 검색하고, 없으면 씬 이름으로 처리합니다.
   */
  else?: string
  /** 
   * 조건 미충족 시(false) 명시적으로 이동할 씬 이름입니다. 
   * (라벨 이동과 씬 이동을 명확히 구분해야 할 때 사용합니다)
   */
  'else-next'?: TScenes[number]
}

export const conditionHandler = defineCmd<ConditionCmd<any, any, any>>((cmd, ctx) => {
  const result = cmd.if as unknown as boolean

  if (result) {
    if (cmd.goto) {
      ctx.scene.jumpToLabel(cmd.goto)
      return 'handled'
    } else if (cmd.next) {
      ctx.scene.end()
      ctx.scene.loadScene(cmd.next)
      return 'handled'
    } else {
      return true
    }
  } else {
    if (cmd.else) {
      if (ctx.scene.hasLabel(cmd.else)) {
        ctx.scene.jumpToLabel(cmd.else)
      } else {
        ctx.scene.end()
        ctx.scene.loadScene(cmd.else)
      }
      return 'handled'
    } else if (cmd['else-next']) {
      ctx.scene.end()
      ctx.scene.loadScene(cmd['else-next'])
      return 'handled'
    } else {
      return true
    }
  }
})
