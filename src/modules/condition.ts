import type { SceneNamesOf, SceneNextTarget, VarsOf } from '../types/config'
import { define } from '../define/defineCmdUI'

/**
 * 변수 조건에 따라 분기한다
 *
 * @example
 * ```ts
 * {
 *   type: 'condition',
 *   $if: ({ courage }) => courage >= 10,
 *   next: 'boss_battle',
 *   else: 'bad_ending'
 * }
 * ```
 */
export interface ConditionCmd<TConfig = any, TVars = any, TLocalVars = any> {
  /**
   * 분기를 결정할 조건 함수입니다.
   *
   * `$` 접두사 규칙: vars를 인자로 받는 함수 자체를 값으로 받습니다.
   * Resolvable로 감싸지 않아 vars 타입이 올바르게 추론됩니다.
   */
  $if: (vars: TVars & TLocalVars) => boolean
  /** 조건이 참일 때 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
  next?: SceneNextTarget<TConfig>
  /** 조건이 참일 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
  goto?: string
  /** 조건이 거짓일 때 이동할 현재 씬 내의 라벨 이름 또는 씬 이름입니다. */
  else?: string
  /** 조건이 거짓일 때 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
  'else-next'?: SceneNextTarget<TConfig>
}

const conditionModule = define<ConditionCmd<any, any>>({})

conditionModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

conditionModule.defineCommand(function* (cmd, ctx) {
  const result = cmd.$if(ctx.scene.getVars())

  if (result) {
    if (cmd.goto) {
      ctx.scene.jumpToLabel(cmd.goto)
    } else if (cmd.next) {
      ctx.scene.loadScene(cmd.next)
    }
  } else {
    if (cmd.else) {
      if (ctx.scene.hasLabel(cmd.else)) {
        ctx.scene.jumpToLabel(cmd.else)
      } else {
        ctx.scene.loadScene(cmd.else)
      }
    } else if (cmd['else-next']) {
      ctx.scene.loadScene(cmd['else-next'])
    }
  }

  return true
})

export default conditionModule

/** @internal Scene.ts BUILTIN_HANDLERS 하위 호환 */
export const conditionHandler = (p: any, ctx: any) => conditionModule.__handler!(p, ctx)
