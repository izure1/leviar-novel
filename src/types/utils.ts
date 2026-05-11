// =============================================================
// types/utils.ts — 커맨드 공통 유틸리티 타입 & 헬퍼
// =============================================================

import type { EnvironmentsOf, VariablesOf } from './config'

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
  | Partial<VariablesOf<TConfig> & TLocalVars & EnvironmentsOf<TConfig>>
  | ((vars: VariablesOf<TConfig> & TLocalVars & EnvironmentsOf<TConfig>) => Partial<VariablesOf<TConfig> & TLocalVars & EnvironmentsOf<TConfig>>)

export interface VarAssignmentContext {
  callbacks: {
    setEnvironment: (name: string, value: any) => void
  }
  scene: {
    getVars: () => Record<string, any>
    setGlobalVar: (key: string, value: any) => void
    setLocalVar: (key: string, value: any) => void
  }
}

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

export function setScopedVar(ctx: VarAssignmentContext, key: string, value: any): void {
  if (key.startsWith('$')) {
    ctx.callbacks.setEnvironment(key, value)
  } else if (key.startsWith('_')) {
    ctx.scene.setLocalVar(key, value)
  } else {
    ctx.scene.setGlobalVar(key, value)
  }
}

export function applyVarResolvable(
  val: VarResolvable<any, any> | undefined,
  ctx: VarAssignmentContext,
): void {
  const vars = resolveVarResolvable(val, ctx.scene.getVars())
  if (!vars) return

  for (const [key, value] of Object.entries(vars)) {
    setScopedVar(ctx, key, value)
  }
}

export function createVarSetterProxy<T extends Record<string, any>>(
  getTarget: () => T,
  setValue: (name: string, value: any) => void,
): T {
  return new Proxy({} as T, {
    get: (_target, property) => {
      return getTarget()[property as keyof T]
    },
    set: (_target, property, value) => {
      setValue(String(property), value)
      return true
    },
    deleteProperty: (_target, property) => {
      setValue(String(property), undefined)
      return true
    },
    has: (_target, property) => property in getTarget(),
    ownKeys: () => Reflect.ownKeys(getTarget()),
    getOwnPropertyDescriptor: (_target, property) => {
      const target = getTarget()
      if (!(property in target)) return undefined

      return {
        enumerable: true,
        configurable: true,
        writable: true,
        value: target[property as keyof T],
      }
    },
  })
}
