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
 * `defineCmd` 핸들러에서 데이터를 변경하면 Proxy를 통해 `defineUI`의
 * `entry.update(data)`가 자동으로 호출됩니다 (반응형).
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
 *   return {
 *     show: ..., hide: ...,
 *     update: (d) => { /* 스타일/텍스트 반응형 갱신 *\/ }
 *   }
 * })
 *
 * export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx, data) => {
 *   data.lines = [cmd.text]  // → 자동으로 entry.update(data) 호출됨
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
  // ─── 반응형 구독자 ────────────────────────────────────────
  let _onUpdate: ((data: TSchema) => void) | null = null

  /**
   * 버전 카운터: 빌더 초기화 도중 발생한 set을 무시하기 위해 사용합니다.
   * `__uiBuilder` 내부에서 `++_version`을 호출하면, 초기화 중 예약된
   * microtask들이 버전 불일치로 인해 스킵됩니다.
   */
  let _version = 0

  // ─── Proxy로 래핑된 공유 data ─────────────────────────────
  const _raw: TSchema = { ...schema }

  const data = new Proxy(_raw, {
    set(target, key, value) {
      (target as any)[key] = value
      const v = ++_version
      // 동일 틱의 여러 set을 하나의 microtask로 배치 처리
      Promise.resolve().then(() => {
        if (_version === v) {
          _onUpdate?.(data)
        }
      })
      return true
    },
  })

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
      if (rawStyle && typeof rawStyle === 'object') {
        for (const key in rawStyle) {
          if ((rawStyle as any)[key] !== undefined) {
            (data as any)[key] = (rawStyle as any)[key]
          }
        }
      }
      builder(data, ctx)
      return true
    }

    ;(handler as any).__isUIHandler = true
    ;(handler as any).__schemaDefault = schema

    /**
     * `_runInitial`이 직접 호출하는 빌더 래퍼.
     * 1) mergedData를 data proxy에 반영
     * 2) builder 실행 → entry 획득
     * 3) entry.update를 반응형 구독자로 등록
     * 4) 초기화 중 예약된 microtask를 버전 카운터로 무효화
     */
    ;(handler as any).__uiBuilder = (mergedData: TSchema, ctx: SceneContext): UIRuntimeEntry => {
      // 스타일 병합 (proxy 경유 → set 트랩 → microtask 예약)
      for (const key in mergedData) {
        if ((mergedData as any)[key] !== undefined) {
          (data as any)[key] = (mergedData as any)[key]
        }
      }

      const entry = builder(data, ctx)

      // 구독자 등록 후 버전 bump → 초기화 중 예약된 microtask 무효화
      _onUpdate = (d) => entry.update?.(d)
      ++_version

      return entry
    }

    ;(handler as any).__uiOptions = options

    return handler as UIHandler<TSchema>
  }

  return { defineCmd, defineUI }
}
