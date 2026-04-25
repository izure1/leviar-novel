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
  readonly __handler: ((params: any, ctx: SceneContext) => CommandResult) | null
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
     * - `state`: define() schema 인수로부터 자동 추론된 공유 상태
     */
    defineCommand(
      handler: (cmd: TCmd, ctx: SceneContext, state: TSchema) => CommandResult
    ): NovelModule<TCmd, TSchema>
    defineView(
      builder: (data: TSchema, ctx: SceneContext) => UIRuntimeEntry
    ): NovelModule<TCmd, TSchema>
  }

// ─── 하위 호환 타입 alias ─────────────────────────────────────


// ─── define() 팩토리 ─────────────────────────────────────────

/**
 * MVC 구조의 Novel 모듈을 정의하는 팩토리입니다.
 *
 * - `schema`: 공유 상태 초깃값 (Model)
 * - `.defineCommand(handler)`: 커맨드 핸들러 등록 (Controller). 핸들러 실행 후 자동으로 state를 `ctx.state`에 저장합니다.
 * - `.defineView(builder)`: View 빌더 등록. `data` 변경 시 `entry.update(data)`가 자동 호출됩니다 (반응형).
 *
 * 반환된 모듈 객체를 `novel.config`의 `modules`에 key-value로 등록하면
 * `{ type: 'my-key' }` 커맨드로 사용할 수 있습니다.
 *
 * @example
 * ```ts
 * const dialogueModule = define<DialogueSchema>({
 *   lines: [], subIndex: 0, speakerKey: undefined, speed: undefined,
 * })
 *
 * dialogueModule.defineCommand<DialogueCmd>((cmd, ctx, data) => {
 *   data.lines = [cmd.text]  // → 자동으로 entry.update(data) 호출
 *   return false
 * })
 *
 * dialogueModule.defineView((data, ctx) => ({
 *   show: () => { ... },
 *   hide: () => { ... },
 *   update: (d) => { ... },
 * }))
 *
 * export default dialogueModule
 *
 * // novel.config.ts
 * modules: { 'dialogue': dialogueModule }
 * ```
 */
export function define<TCmd, TSchema extends Record<string, any> = Record<string, any>>(schema?: TSchema): NovelModule<TCmd, TSchema> {
  // ─── 반응형 구독자 ──────────────────────────────────────────
  let _onUpdate: ((data: TSchema) => void) | null = null
  /**
   * 버전 카운터: 빌더 초기화 중 발생한 set을 무시하기 위해 사용.
   * `__viewBuilder` 내부에서 ++_version하면 초기화 중 예약된 microtask들이 스킵됩니다.
   */
  let _version = 0
  let _moduleKey: string | null = null

  // ─── 공유 data (Proxy로 래핑) ─────────────────────────────
  const _raw: TSchema = { ...(schema ?? {}) } as TSchema

  const data = new Proxy(_raw, {
    set(target, key, value) {
      ; (target as any)[key] = value
      const v = ++_version
      // 동일 틱의 여러 set을 microtask로 배치 처리
      Promise.resolve().then(() => {
        if (_version === v) {
          _onUpdate?.(data)
        }
      })
      return true
    },
  })

  // ─── 내부 핸들러 참조 ─────────────────────────────────────
  let _handlerFn: ((params: any, ctx: SceneContext) => CommandResult) | null = null
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
      handler: (cmd: TCmd, ctx: SceneContext, state: TSchema) => CommandResult
    ): NovelModule<TCmd, TSchema> {
      _handlerFn = (rawParams: any, ctx: SceneContext) => {
        const resolved = resolveParams(rawParams, ctx)
        const result = handler(resolved as TCmd, ctx, data)
        // Auto-save: 핸들러 실행 후 _raw 스냅샷을 state에 저장
        if (_moduleKey) {
          ctx.state.set(_moduleKey, { ..._raw })
        }
        return result
      }
      return module
    },

    defineView(
      builder: (data: TSchema, ctx: SceneContext) => UIRuntimeEntry
    ): NovelModule<TCmd, TSchema> {
      /**
       * `__viewBuilder`: Novel 엔진이 씬 시작 / 세이브 로드 시 직접 호출.
       * 1) mergedData를 data proxy에 반영 (저장된 state 또는 initial 데이터)
       * 2) builder 실행 → UIRuntimeEntry 획득
       * 3) entry.update를 반응형 구독자로 등록
       * 4) 초기화 중 예약된 microtask 무효화 (버전 bump)
       */
      _viewBuilderFn = (mergedData: TSchema, ctx: SceneContext): UIRuntimeEntry => {
        // 저장된 state를 proxy data에 반영 (proxy set → microtask 예약됨)
        for (const key in mergedData) {
          if ((mergedData as any)[key] !== undefined) {
            ; (data as any)[key] = (mergedData as any)[key]
          }
        }

        const entry = builder(data, ctx)

        // 구독자 등록 후 버전 bump → 초기화 중 예약된 microtask 무효화
        _onUpdate = (d) => entry.update?.(d)
        ++_version

        return entry
      }
      return module
    },
  }

  return module
}
