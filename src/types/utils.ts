// =============================================================
// types/utils.ts — 커맨드 공통 유틸리티 타입 & 헬퍼
// =============================================================

import type { VariablesOf } from './config'

/**
 * 전역/지역 변수 설정값 타입.
 *
 * 정적 객체 또는 전역+지역 변수를 받아 반환하는 함수를 모두 허용합니다.
 * 반환 객체의 키가 `_` 접두사이면 지역 변수, 아니면 전역 변수로 처리됩니다.
 *
 * @example
 * // 정적 객체 (값 타입 검사됨)
 * var: { useHeroineVoice: true }
 *
 * // 함수 — 전역+지역 변수 참조 가능
 * var: ({ likeability, _isAnnoyed }) => ({
 *   likeability: likeability + (_isAnnoyed ? -5 : 5),
 *   _isAnnoyed: false,
 * })
 */
export type VarResolvable<TConfig, TLocalVars = Record<never, never>> =
  | Partial<VariablesOf<TConfig> & TLocalVars>
  | ((vars: VariablesOf<TConfig> & TLocalVars) => Partial<VariablesOf<TConfig> & TLocalVars>)

/**
 * `VarResolvable` 값을 런타임에 resolve합니다.
 *
 * - 함수이면 현재 vars를 주입하여 호출합니다.
 * - 정적 객체이면 그대로 반환합니다.
 * - `undefined`이면 `undefined`를 반환합니다.
 *
 * @example
 * const varVal = resolveVarResolvable(selected.var, ctx.scene.getVars())
 * if (varVal) {
 *   for (const [key, value] of Object.entries(varVal)) {
 *     if (key.startsWith('_')) ctx.scene.setLocalVar(key, value)
 *     else ctx.scene.setGlobalVar(key, value)
 *   }
 * }
 */
export function resolveVarResolvable(
  val: VarResolvable<any, any> | undefined,
  vars: Record<string, any>,
): Record<string, any> | undefined {
  if (val === undefined || val === null) return undefined
  if (typeof val === 'function') return val(vars)
  return val as Record<string, any>
}
