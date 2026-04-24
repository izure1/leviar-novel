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
    name: keyof TVars & string
    value: TVars[keyof TVars]
  }
  | {
    name: keyof TLocalVars & string
    value: TLocalVars[keyof TLocalVars]
  }

const varModule = define<Record<never, never>>({})

varModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))

varModule.defineCommand<VarCmd<any, any>>((cmd, ctx) => {
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
