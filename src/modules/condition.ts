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
  /** 분기를 결정할 조건 함수 또는 boolean 값입니다. */
  if: (vars: VarsOf<TConfig> & TLocalVars) => boolean
  /** 조건이 참일 때 이동할 다음 씬(Scene)의 이름입니다. */
  next?: SceneNamesOf<TConfig>
  /** 조건이 참일 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
  goto?: string
  /** 조건이 거짓일 때 이동할 현재 씬 내의 라벨 이름 또는 씬 이름입니다. */
  else?: string
  /** 조건이 거짓일 때 이동할 다음 씬(Scene)의 이름입니다. */
  'else-next'?: SceneNamesOf<TConfig>
}

const conditionModule = define<ConditionCmd<any, any>>({})

conditionModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

conditionModule.defineCommand(function* (cmd, ctx) {
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
