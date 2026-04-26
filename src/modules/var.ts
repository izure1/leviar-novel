import type { VarsOf } from '../types/config'
import { define } from '../define/defineCmdUI'

/**
 * 전역/지역 변수 값을 설정한다
 *
 * @example
 * ```ts
 * { type: 'var', name: 'likeability', value: 10 }
 * { type: 'var', name: '_tries', value: 0 }
 * ```
 */
export type VarCmd<TVars, TLocalVars> =
  | {
    /** 변경할 변수의 이름입니다. */
    name: keyof TVars & string
    /** 설정할 값입니다. */
    value: TVars[keyof TVars]
  }
  | {
    /** 변경할 변수의 이름입니다. */
    name: keyof TLocalVars & string
    /** 설정할 값입니다. */
    value: TLocalVars[keyof TLocalVars]
  }

const varModule = define<VarCmd<any, any>>({})

varModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

varModule.defineCommand(function* (cmd, ctx) {
  const nameStr = cmd.name as string
  const val = cmd.value

  if (nameStr.startsWith('_')) {
    ctx.scene.setLocalVar(nameStr, val)
  } else {
    ctx.scene.setGlobalVar(nameStr, val)
  }
  return true
})

export default varModule

/** @internal */
export const varHandler = (p: any, ctx: any) => varModule.__handler!(p, ctx)
