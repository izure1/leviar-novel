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
 * // 정적 값 (임의 string도 허용)
 * { type: 'character', name: 'arisiero' }
 * // 동적 함수 (config에 정의된 key만 허용)
 * { type: 'character', name: ({ likeability }) => likeability >= 10 ? 'arisiero' : 'hero' }
 */
export type Resolvable<T, TVars = any, TLocalVars = any> =
  T | ((variables: TVars & TLocalVars) => _ReturnOf<T>)

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
 */
export type ResolvableProps<TCmd, TVars = any, TLocalVars = any> = TCmd extends any ? {
  [K in keyof TCmd]: K extends 'type' | 'skip'
  ? TCmd[K]
  : Resolvable<TCmd[K], TVars, TLocalVars>
} : never

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
 * - `true`: 즉시 완료. 다음 스텝으로 자동 진행
 * - `false` / `void`: 사용자 입력 대기. 입력 시 해당 커맨드가 **다시 실행**됨
 *
 * @example 단순 완료
 * export const myHandler = defineCmd<{ message: string }>((cmd, ctx) => {
 *   ctx.callbacks.onDialogue(undefined, cmd.message)
 *   return false // 입력 대기
 * })
 *
 * @example 여러 줄 대사 (재실행 방식)
 * export const multiLineHandler = defineCmd<{ lines: string[] }>((cmd, ctx) => {
 *   const index = ctx.scene.getTextSubIndex()
 *   if (index >= cmd.lines.length) return true // 완료
 *   showLine(cmd.lines[index])
 *   ctx.scene.setTextSubIndex(index + 1)
 *   return false // 다음 입력 시 재실행 → 다음 줄
 * })
 *
 * @example ctx.execute로 다른 커맨드 실행
 * export const showCharacterHandler = defineCmd<{ name: string }>((cmd, ctx) => {
 *   ctx.execute({ type: 'character', name: cmd.name, image: 'normal', position: 'center' })
 *   return ctx.execute({ type: 'dialogue', text: `${cmd.name} 등장!` })
 * })
 */
export function defineCmd<TCmd>(
  handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult
): (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult {
  return (rawParams, ctx) => {
    const resolved = resolveParams(rawParams, ctx)
    return handler(resolved as Omit<TCmd, 'type'>, ctx)
  }
}
