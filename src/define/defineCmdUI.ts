// =============================================================
// defineCmdUI.ts — NovelModule 팩토리 (MVC 통합)
// =============================================================

import type { World } from 'leviar'
import type { SceneContext, CommandResult } from '../core/SceneContext'
import type { UIRuntimeEntry } from '../core/UIRegistry'
import type { IHookallSync } from 'hookall'
import { useHookallSync } from 'hookall'

// ─── onBoot 콜백 타입 ────────────────────────────────────────

/** `module.onBoot()`에 등록하는 비동기 초기화 콜백 */
export type BootCallback = (world: World) => Promise<void>

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

// ─── hookall 리스너 서명 타입 ─────────────────────────────────

/** hookall이 요구하는 리스너 서명 제약 */
export type ListenerSignature<M> = {
  [K in keyof M]: (...args: any) => any
}

/** 훅 맵이 없는 경우의 기본 타입 */
export type DefaultHook = Record<never, never>

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
  /** onBoot()로 등록된 비동기 초기화 콜백 (없으면 null) */
  readonly __bootFn: BootCallback | null
  /** Novel 엔진이 등록 시 key를 주입합니다 */
  __setKey(key: string): void
}

/**
 * `define()`이 반환하는 모듈 객체 타입.
 *
 * - `defineCommand`: 커맨드 핸들러 등록 (Controller)
 * - `defineView`: View 빌더 등록 (View)
 * - `hooker`: 모듈 고유의 훅 시스템 (`IHookallSync<THook>`)
 * - schema: 공유 상태 (Model)
 */
export type NovelModule<TCmd = any, TSchema extends Record<string, any> = any, THook extends ListenerSignature<THook> = DefaultHook> =
  NovelModuleMeta<TSchema> & {
    /** 이 모듈에 등록된 훅 시스템. `useHookallSync(module.hooker)` 형태로 사용합니다. */
    readonly hooker: IHookallSync<THook>
    /**
     * 커맨드 핸들러를 등록합니다.
     * - `cmd`: `{ type: 'key', ...TCmd }` 에서 type을 제외한 커맨드 속성
     * - `ctx`: SceneContext
     * - `state`: 현재 공유 상태 (Readonly)
     * - `setState`: 부분적으로 상태를 병합하고 뷰를 갱신하는 함수
     */
    defineCommand(
      handler: (cmd: TCmd, ctx: SceneContext, state: Readonly<TSchema>, setState: SetStateFn<TSchema>) => Generator<CommandResult, CommandResult, any>
    ): NovelModule<TCmd, TSchema, THook>
    defineView(
      builder: (data: Readonly<TSchema>, ctx: SceneContext) => UIRuntimeEntry
    ): NovelModule<TCmd, TSchema, THook>
    /**
     * 모듈이 Novel world에 등록될 때 딱 한 번 호출되는 비동기 초기화 콜백을 등록합니다.
     * `novel.boot()` 호출 시 실행됩니다.
     *
     * @example
     * ```ts
     * myModule.onBoot(async (world) => {
     *   await world.loader.load({ myAsset: '/path/to/asset.png' })
     *   world.particleManager.create('explosion', { ... })
     * })
     * ```
     */
    onBoot(callback: BootCallback): NovelModule<TCmd, TSchema, THook>
  }

// ─── define() 팩토리 ─────────────────────────────────────────

/**
 * MVC 구조의 Novel 모듈을 정의하는 팩토리입니다.
 *
 * - `schema`: 공유 상태 초깃값 (Model)
 * - `.defineCommand(handler)`: 커맨드 핸들러 등록 (Controller). 핸들러 내부에서 setState() 호출 시 _onUpdate() 자동 호출.
 * - `.defineView(builder)`: View 빌더 등록.
 * - `.hooker`: 이 모듈의 훅 시스템 (`IHookallSync<THook>`).
 *
 * @example
 * ```ts
 * // 모듈 정의
 * const myModule = define<MyCmd, MySchema, MyHook>({ ... })
 *
 * // 훅 방출 (모듈 내부)
 * myModule.hooker.trigger('my:event', initialValue, (val) => val, ...params)
 *
 * // 훅 구독 (외부)
 * defineHook(config, { 'my:event': (val, ...params) => val })
 * ```
 */
export function define<TCmd, TSchema extends Record<string, any> = Record<string, any>, THook extends ListenerSignature<THook> = DefaultHook>(schema?: TSchema): NovelModule<TCmd, TSchema, THook> {
  let _onUpdate: ((data: TSchema) => void) | null = null
  let _moduleKey: string | null = null

  // 이 모듈 전용 훅 시스템 (target 객체 기반 로컬 훅)
  const _hookerTarget = {}
  const _hooker = useHookallSync<THook>(_hookerTarget)

  // 공유 상태 객체
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
  let _bootFn: BootCallback | null = null

  // ─── 모듈 객체 ───────────────────────────────────────────
  const module: NovelModule<TCmd, TSchema, THook> = {
    __isModule: true as const,
    __schemaDefault: (schema ?? {}) as TSchema,

    get __handler() { return _handlerFn },
    get __viewBuilder() { return _viewBuilderFn },
    get __bootFn() { return _bootFn },
    get hooker() { return _hooker },

    __setKey(key: string) {
      _moduleKey = key
    },

    defineCommand(
      handler: (cmd: TCmd, ctx: SceneContext, state: Readonly<TSchema>, setState: SetStateFn<TSchema>) => Generator<CommandResult, CommandResult, any>
    ): NovelModule<TCmd, TSchema, THook> {
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
    ): NovelModule<TCmd, TSchema, THook> {
      /**
       * `__viewBuilder`: Novel 엔진이 씬 시작 / 세이브 로드 시 직접 호출.
       */
      _viewBuilderFn = (mergedData: TSchema, ctx: SceneContext): UIRuntimeEntry => {
        // 기존 상태(data)를 스키마 기본값으로 초기화하여 이전 씬/세이브의 잔여 상태를 제거합니다.
        for (const key of Object.keys(data)) {
          delete (data as any)[key]
        }
        Object.assign(data, schema ?? {})

        // 저장된 state 또는 initial 데이터를 병합
        Object.assign(data, mergedData)

        // 초기화된 data를 stateStore에 동기화하여 세이브 데이터에 포함되도록 보장합니다.
        if (_moduleKey) {
          ctx.state.set(_moduleKey, { ...data })
        }

        const entry = builder(data, ctx)
        _onUpdate = (d) => entry.update?.(d)

        // 초기 렌더링 정합성을 위해 즉시 update 1회 호출
        entry.update?.(data)

        return entry
      }
      return module
    },

    onBoot(callback: BootCallback): NovelModule<TCmd, TSchema, THook> {
      _bootFn = callback
      return module
    },
  }

  return module
}

// ─── defineHook 헬퍼 ─────────────────────────────────────────

/**
 * 모듈의 훅 이벤트를 구독하는 헬퍼 함수입니다.
 * hookMap의 각 키/콜백 타입은 `THook`에서 자동으로 추론됩니다.
 *
 * @example
 * ```ts
 * defineHook(dialogueModule, {
 *   'dialogue:text': (value, { speaker, text }) => {
 *     console.log(speaker, text)
 *     return value
 *   }
 * })
 * ```
 *
 * @param module - `define()`으로 생성된 NovelModule 인스턴스
 * @param hookMap - 구독할 훅 키와 콜백의 맵. `onBefore` 방식으로 등록됩니다.
 */
export function defineHook<
  THook extends ListenerSignature<THook>
>(
  module: NovelModule<any, any, THook>,
  hookMap: {
    [K in keyof THook]?: (
      value: ReturnType<THook[K]>,
      ...params: THook[K] extends (first: any, ...rest: infer R) => any ? R : never
    ) => ReturnType<THook[K]>
  }
): void {
  // module.hooker는 이미 공유된 HookallSync 인스턴스 — 직접 onBefore 등록
  const hooker = module.hooker
  for (const key of Object.keys(hookMap) as (keyof THook & string)[]) {
    const cb = hookMap[key]
    if (cb) {
      hooker.onBefore(key, cb as any)
    }
  }
}

