// =============================================================
// defineCmdUI.ts — NovelModule 팩토리 (MVC 통합)
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'
import type { UIRuntimeEntry } from '../core/UIRegistry'

// ─── 내부 resolve 헬퍼 ──────────────────────────────────────

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

// ─── 상태 변경 함수 타입 ─────────────────────────────────────

export type SetStateFn<TSchema> = (
  partial: Partial<TSchema> | ((prev: Readonly<TSchema>) => Partial<TSchema>)
) => void

// ─── NovelModule 타입 ────────────────────────────────────────

/**
 * NovelModule의 내부 메타데이터.
 * Novel 엔진이 이 메타를 읽어 명령 실행 및 View 재생성에 활용합니다.
 */
export interface NovelModuleMeta<TSchema extends Record<string, any> = any> {
  readonly __isModule: true
  /** 스키마 기본값 (타입 추론 전용, 런타임 미사용) */
  readonly __schemaDefault: TSchema
  /** defineCommand로 등록된 커맨드 핸들러 (없으면 null) */
  readonly __handler: ((params: any, ctx: SceneContext) => Generator<CommandResult, CommandResult, any>) | null
  /** defineView로 등록된 View 빌더 (없으면 null) */
  readonly __viewBuilder: ((data: TSchema, ctx: SceneContext) => UIRuntimeEntry) | null
  /** Novel 엔진이 등록 시 key를 주입합니다 */
  __setKey(key: string): void
}

/**
 * `define()`이 반환하는 모듈 객체 타입.
 *
 * - `defineCommand`: 커맨드 핸들러 등록 (Controller)
 * - `defineView`: View 빌더 등록 (View)
 * - schema: 공유 상태 (Model)
 */
export type NovelModule<TCmd = any, TSchema extends Record<string, any> = any> =
  NovelModuleMeta<TSchema> & {
    /**
     * 커맨드 핸들러를 등록합니다.
     * - `cmd`: `{ type: 'key', ...TCmd }` 에서 type을 제외한 커맨드 속성
     * - `ctx`: SceneContext
     * - `state`: 현재 공유 상태 (Readonly)
     * - `setState`: 부분적으로 상태를 병합하고 뷰를 갱신하는 함수
     */
    defineCommand(
      handler: (cmd: TCmd, ctx: SceneContext, state: Readonly<TSchema>, setState: SetStateFn<TSchema>) => Generator<CommandResult, CommandResult, any>
    ): NovelModule<TCmd, TSchema>
    defineView(
      builder: (data: Readonly<TSchema>, ctx: SceneContext) => UIRuntimeEntry
    ): NovelModule<TCmd, TSchema>
  }

// ─── define() 팩토리 ─────────────────────────────────────────

/**
 * MVC 구조의 Novel 모듈을 정의하는 팩토리입니다.
 *
 * - `schema`: 공유 상태 초깃값 (Model)
 * - `.defineCommand(handler)`: 커맨드 핸들러 등록 (Controller). 핸들러 내부에서 setState() 호출 시 _onUpdate() 자동 호출.
 * - `.defineView(builder)`: View 빌더 등록.
 */
export function define<TCmd, TSchema extends Record<string, any> = Record<string, any>>(schema?: TSchema): NovelModule<TCmd, TSchema> {
  let _onUpdate: ((data: TSchema) => void) | null = null
  let _moduleKey: string | null = null

  // 공유 상태 객체 (순수 객체, 더 이상 Proxy를 사용하지 않음)
  const data: TSchema = { ...(schema ?? {}) } as TSchema

  // 상태 변경 함수. 한 번에 여러 속성을 병합 업데이트하고 즉시 뷰를 동기화함.
  const setState: SetStateFn<TSchema> = (partial) => {
    const updates = typeof partial === 'function' ? partial(data) : partial
    Object.assign(data, updates)
    _onUpdate?.(data)
  }

  // ─── 내부 핸들러 참조 ─────────────────────────────────────
  let _handlerFn: ((params: any, ctx: SceneContext) => Generator<CommandResult, CommandResult, any>) | null = null
  let _viewBuilderFn: ((data: TSchema, ctx: SceneContext) => UIRuntimeEntry) | null = null

  // ─── 모듈 객체 ───────────────────────────────────────────
  const module: NovelModule<TCmd, TSchema> = {
    __isModule: true as const,
    __schemaDefault: (schema ?? {}) as TSchema,

    get __handler() { return _handlerFn },
    get __viewBuilder() { return _viewBuilderFn },

    __setKey(key: string) {
      _moduleKey = key
    },

    defineCommand(
      handler: (cmd: TCmd, ctx: SceneContext, state: Readonly<TSchema>, setState: SetStateFn<TSchema>) => Generator<CommandResult, CommandResult, any>
    ): NovelModule<TCmd, TSchema> {
      _handlerFn = function* (rawParams: any, ctx: SceneContext) {
        const resolved = resolveParams(rawParams, ctx)
        const gen = handler(resolved as TCmd, ctx, data, setState)
        let res = gen.next()
        while (!res.done) {
          if (_moduleKey) {
            ctx.state.set(_moduleKey, { ...data })
          }
          yield res.value
          res = gen.next()
        }
        if (_moduleKey) {
          ctx.state.set(_moduleKey, { ...data })
        }
        return res.value
      }
      return module
    },

    defineView(
      builder: (data: Readonly<TSchema>, ctx: SceneContext) => UIRuntimeEntry
    ): NovelModule<TCmd, TSchema> {
      /**
       * `__viewBuilder`: Novel 엔진이 씬 시작 / 세이브 로드 시 직접 호출.
       */
      _viewBuilderFn = (mergedData: TSchema, ctx: SceneContext): UIRuntimeEntry => {
        // 저장된 state 또는 initial 데이터를 병합
        Object.assign(data, mergedData)

        const entry = builder(data, ctx)
        _onUpdate = (d) => entry.update?.(d)

        return entry
      }
      return module
    },
  }

  return module
}

