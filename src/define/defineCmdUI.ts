// =============================================================
// defineCmdUI.ts — defineCmd + defineUI 공유 데이터 팩토리
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'
import type { UIRuntimeEntry, UIEntryOptions } from '../core/UIRegistry'
import type { CustomCmdHandler } from '../types/config'

// ─── UIHandler 타입 ──────────────────────────────────────────

/**
 * defineUI가 반환하는 핸들러에 부착되는 메타데이터.
 * Novel 생성자가 이 메타를 감지하여 _uiDefinitions에 빌더를 자동 등록합니다.
 */
export interface UIHandlerMeta {
  __isUIHandler: true
  /** 타입 추론용 (런타임 미사용) */
  __schemaDefault: unknown
  __uiBuilder: (data: any, ctx: SceneContext) => UIRuntimeEntry
  __uiOptions?: UIEntryOptions
}

/**
 * defineUI가 반환하는 핸들러 타입.
 * novel.config의 `ui` 필드에 key-value로 등록됩니다.
 * `__schemaDefault`는 타입 추론 전용(런타임 미사용)입니다.
 */
export type UIHandler<TSchema> = CustomCmdHandler<Partial<TSchema>> & UIHandlerMeta & {
  __schemaDefault: TSchema
  __uiBuilder: (data: TSchema, ctx: SceneContext) => UIRuntimeEntry
}

// ─── define() 팩토리 ─────────────────────────────────────────

/**
 * `defineCmd`와 `defineUI`가 동일한 데이터 객체를 공유하도록 묶는 팩토리입니다.
 *
 * `schema`가 공유 데이터의 초깃값이자 타입 기반이 됩니다.
 * `defineCmd` 핸들러에서 데이터를 변경하면 `defineUI`에도 반영됩니다.
 *
 * @example
 * ```ts
 * const { defineCmd, defineUI } = define({
 *   bg:       { color: 'rgba(0,0,0,0.82)' },
 *   subIndex: 0,
 *   lines:    [] as string[],
 * })
 *
 * export const dialogueUISetup = defineUI((data, ctx) => {
 *   // data.bg, data.lines 사용
 *   return { show: ..., hide: ..., onDialogue: ... }
 * })
 *
 * export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx, data) => {
 *   data.lines = [cmd.text]  // 변경하면 defineUI의 data도 동일 객체
 *   ctx.ui.get('dialogue')?.onDialogue?.(...)
 *   return false
 * })
 * ```
 */
export function define<TSchema extends Record<string, any>>(schema: TSchema): {
  defineCmd: <TCmd>(
    handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext, data: TSchema) => CommandResult
  ) => CustomCmdHandler<Omit<TCmd, 'type'>>
  defineUI: (
    builder: (data: TSchema, ctx: SceneContext) => UIRuntimeEntry,
    options?: UIEntryOptions
  ) => UIHandler<TSchema>
} {
  // 공유 데이터 객체 (클로저로 defineCmd·defineUI 양측에서 참조)
  const data: TSchema = { ...schema }

  // ─── 내부 resolveParams (defineCmd.ts 동일 로직) ──────────
  function resolveVal(val: any, vars: any): any {
    if (typeof val === 'function') return val(vars)
    if (Array.isArray(val)) {
      return val.map(item =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? resolveObj(item, vars)
          : resolveVal(item, vars)
      )
    }
    return val
  }

  function resolveObj(obj: Record<string, any>, vars: any): Record<string, any> {
    const result: Record<string, any> = {}
    for (const key in obj) {
      result[key] = resolveVal(obj[key], vars)
    }
    return result
  }

  function resolveParams(params: Record<string, any>, ctx: SceneContext): Record<string, any> {
    return resolveObj(params, ctx.scene.getVars())
  }

  // ─── defineCmd ────────────────────────────────────────────
  function defineCmd<TCmd>(
    handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext, data: TSchema) => CommandResult
  ): CustomCmdHandler<Omit<TCmd, 'type'>> {
    return (rawParams, ctx) => {
      const resolved = resolveParams(rawParams as Record<string, any>, ctx)
      return handler(resolved as Omit<TCmd, 'type'>, ctx, data)
    }
  }

  // ─── defineUI ─────────────────────────────────────────────
  function defineUI(
    builder: (data: TSchema, ctx: SceneContext) => UIRuntimeEntry,
    options?: UIEntryOptions
  ): UIHandler<TSchema> {
    const handler = (rawStyle: Partial<TSchema>, ctx: SceneContext): CommandResult => {
      // 전달된 style로 data 갱신 (초기값 오버라이드)
      if (rawStyle && typeof rawStyle === 'object') {
        for (const key in rawStyle) {
          if ((rawStyle as any)[key] !== undefined) {
            (data as any)[key] = (rawStyle as any)[key]
          }
        }
      }

      // 갱신된 data를 CmdState에 저장 (세이브/로드용)
      ctx.cmdState.set('__ui__', { ...data })

      // 빌더로 UI 생성 (UIRegistry 등록은 _runInitial에서 __uiBuilder 직접 호출로 처리)
      builder(data, ctx)

      return true
    }

    ;(handler as any).__isUIHandler   = true
    ;(handler as any).__schemaDefault = schema
    ;(handler as any).__uiBuilder     = builder
    ;(handler as any).__uiOptions     = options

    return handler as UIHandler<TSchema>
  }

  return { defineCmd, defineUI }
}
