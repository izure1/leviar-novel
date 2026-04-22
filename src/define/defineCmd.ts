// =============================================================
// defineCmd.ts — 커맨드 핸들러 정의 헬퍼
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

// ─── Resolvable 유틸리티 타입 ────────────────────────────────

/**
 * IDE 자동완성용 `(string & {})` escape hatch를 제거합니다.
 * - 순수 `string` 타입(= `string & {}`)이면 `never`로 치환
 * - 리터럴 타입 또는 `keyof` 제약 타입이면 그대로 유지
 *
 * 함수형 반환 타입에 적용하여, 직접 값에서는 허용되는 임의 string이
 * 함수 반환에서는 엄격하게 검증되도록 합니다.
 */
type _StrictOf<T> =
  T extends string
    ? string extends T
      ? never  // 순수 string (= string & {}) → 제거
      : T      // 리터럴 / keyof 제약 → 유지
    : T        // 비string 타입 → 그대로

/** 유니온 멤버별 분산 적용: escape 제거 후 never이면 원본 멤버 유지 */
type _ReturnOf<T> = T extends any
  ? _StrictOf<T> extends never ? T : _StrictOf<T>
  : never

/**
 * 단일 값 T, 또는 vars를 받아 T를 반환하는 함수.
 * cmd 속성에 정적 값 대신 동적 함수를 허용합니다.
 *
 * - **직접 값**: T 전체 허용 (IDE 자동완성용 `string & {}` escape 포함)
 * - **함수 반환값**: `_ReturnOf<T>` 적용 → escape 제거, 리터럴/keyof만 허용
 *
 * @example
 * ```ts
 * // 정적 값 (임의 string도 허용)
 * { type: 'character', name: 'arisiero' }
 * // 동적 함수 (config에 정의된 key만 허용)
 * { type: 'character', name: ({ likeability }) => likeability >= 10 ? 'arisiero' : 'hero' }
 * ```
 */
export type Resolvable<T, TVars = any, TLocalVars = any> =
  T | ((vars: TVars & TLocalVars) => _ReturnOf<T>)

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
 * ## 반환값
 * - `true` / `false` / `void` / `'handled'`: 즉시 결과 결정
 * - `() => SimpleCommandResult` (**TickFn**): do-while 루프 방식
 *   - 반환 즉시 1회 실행됨
 *   - 이후 사용자 입력마다 재호출됨
 *   - `true` 반환 시 루프 종료 뒤 다음 스텝
 *
 * @example 이전 방식 (단순 결과)
 * ```ts
 * export const myHandler = defineCmd<{ message: string }>((cmd, ctx) => {
 *   ctx.callbacks.onDialogue(undefined, cmd.message)
 *   return false
 * })
 * ```
 *
 * @example TickFn 방식 (여러 줄 대사 클릭마다 다음줄)
 * ```ts
 * export const multiLineHandler = defineCmd<{ lines: string[] }>((cmd, ctx) => {
 *   let index = 0
 *   return () => {
 *     ctx.callbacks.onDialogue(undefined, cmd.lines[index])
 *     index++
 *     return index >= cmd.lines.length // 마지막 줄이면 true → 다음 스텝
 *   }
 * })
 * ```
 */
import type { CustomCmdHandler } from '../types/config'

export function defineCmd<TCmd>(
  handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult
): CustomCmdHandler<Omit<TCmd, 'type'>, any, any> {
  return (rawParams, ctx) => {
    const resolved = resolveParams(rawParams, ctx)
    return handler(resolved as Omit<TCmd, 'type'>, ctx)
  }
}
