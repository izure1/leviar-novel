// =============================================================
// defineCmd.ts — 커맨드 핸들러 정의 헬퍼
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

// ─── Resolvable 유틸리티 타입 ────────────────────────────────

/**
 * 단일 값 T, 또는 vars를 받아 T를 반환하는 함수.
 * cmd 속성에 정적 값 대신 동적 함수를 허용합니다.
 *
 * @example
 * ```ts
 * // 정적 값
 * { type: 'character', name: 'arisiero' }
 * // 동적 함수
 * { type: 'character', name: ({ likeability }) => likeability >= 10 ? 'arisiero' : 'hero' }
 * ```
 */
export type Resolvable<T, TVars = any, TLocalVars = any> =
  T | ((vars: TVars & TLocalVars) => T)

/**
 * 배열이면 원소 타입에도 ResolvableProps를 재귀 적용하고, 배열 자체도 Resolvable.
 * 배열이 아니면 단순 Resolvable.
 */
export type ResolvableItem<T, TVars, TLocalVars> =
  T extends Array<infer U>
    ? Resolvable<
        Array<U extends object ? ResolvableProps<U, TVars, TLocalVars> : Resolvable<U, TVars, TLocalVars>>,
        TVars,
        TLocalVars
      >
    : Resolvable<T, TVars, TLocalVars>

/**
 * `type` 키를 제외한 모든 Cmd 속성을 Resolvable로 변환합니다.
 * 배열 속성(예: choices[])의 원소 내부 속성에도 재귀 적용됩니다.
 * 
 * @note `ResolvableItem` 대신 `Resolvable`을 직접 사용하여 TypeScript contextual typing을 보장합니다.
 * (조건부 타입을 mapped type에 넣으면 contextual typing이 deferred되어 vars가 any로 추론됩니다)
 */
export type ResolvableProps<TCmd, TVars = any, TLocalVars = any> = {
  [K in keyof TCmd]: K extends 'type' ? TCmd[K] : Resolvable<TCmd[K], TVars, TLocalVars>
}

// ─── 런타임 resolve 헬퍼 ────────────────────────────────────

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

// ─── defineCmd ───────────────────────────────────────────────

/**
 * 커맨드 핸들러를 정의합니다.
 * 핸들러가 호출될 때 cmd의 모든 속성(함수 포함)이 자동으로 resolve됩니다.
 *
 * @example
 * ```ts
 * export const myHandler = defineCmd<{ message: string }>((cmd, ctx) => {
 *   // cmd.message는 이미 resolve된 string 값
 *   ctx.callbacks.onDialogue(undefined, cmd.message)
 *   return false
 * })
 * ```
 */
export function defineCmd<TCmd>(
  handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult
): (cmd: any, ctx: SceneContext) => CommandResult {
  return (rawParams, ctx) => {
    const resolved = resolveParams(rawParams, ctx)
    return handler(resolved as Omit<TCmd, 'type'>, ctx)
  }
}
