import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

/** 
 * 변수 값을 설정한다 
 *
 * - 이름에 `_` 접두사를 붙이면 **씬 지역변수**로 처리됩니다.
 * - 접두사가 없으면 **게임 전역변수**로 처리됩니다.
 * 
 * @example
 * ```ts
 * // 전역변수 설정
 * { type: 'var', name: 'score', value: 100 }
 * // 지역변수 설정 (_ 접두사)
 * { type: 'var', name: '_tries', value: 0 }
 * ```
 */
export type VarCmd<TVars, TLocalVars> =
  | {
    /** 설정할 **전역변수**의 이름입니다. (`_` 접두사 없음) */
    name: keyof TVars & string
    /** 변수에 설정할 고정 값, 또는 전역변수·지역변수를 구조 분해 받아 새 값을 반환하는 함수입니다. */
    value: TVars[keyof TVars] | ((vars: TVars & TLocalVars) => TVars[keyof TVars])
  }
  | {
    /** 설정할 **씬 지역변수**의 이름입니다. (`_` 접두사 필수) */
    name: keyof TLocalVars & string
    /** 변수에 설정할 고정 값, 또는 전역변수·지역변수를 구조 분해 받아 새 값을 반환하는 함수입니다. */
    value: TLocalVars[keyof TLocalVars] | ((vars: TVars & TLocalVars) => TLocalVars[keyof TLocalVars])
  }

export const varHandler = defineCmd<VarCmd<any, any>>((cmd, ctx) => {
  const nameStr = cmd.name as string
  let val = cmd.value

  if (typeof val === 'function') {
    val = (val as any)(ctx.scene.getVars())
  }

  if (nameStr.startsWith('_')) {
    ctx.scene.setLocalVar(nameStr, val)
  } else {
    ctx.scene.setGlobalVar(nameStr, val)
  }
  return true
})
