import type { SceneNamesOf, VarsOf } from '../types/config'
import { define } from '../define/defineCmdUI'

/**
 * 변수 조건에 따라 분기한다
 *
 * @example
 * ```ts
 * {
 *   type: 'condition',
 *   if: ({ courage }) => courage >= 10,
 *   next: 'boss_battle',
 *   else: 'bad_ending'
 * }
 * ```
 */
export interface ConditionCmd<TConfig = any, TLocalVars = any> {
  if: (vars: VarsOf<TConfig> & TLocalVars) => boolean
  next?: SceneNamesOf<TConfig>
  goto?: string
  else?: string
  'else-next'?: SceneNamesOf<TConfig>
}

const conditionModule = define<ConditionCmd<any, any>>({})

conditionModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))

conditionModule.defineCommand((cmd, ctx) => {
  const result = typeof cmd.if === 'function' ? cmd.if(ctx.scene.getVars()) : (cmd.if as unknown as boolean)

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

export default conditionModule

/** @internal Scene.ts BUILTIN_HANDLERS 하위 호환 */
export const conditionHandler = (p: any, ctx: any) => conditionModule.__handler!(p, ctx)
