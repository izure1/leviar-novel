// =============================================================
// defineScene.ts — DialogueScene 정의 헬퍼
// =============================================================

import type { NovelConfig, CharDefs, BgDefs, SceneNextTarget } from '../types/config'
import type { NovelModule } from '../define/defineCmdUI'
import type { SceneHookDescriptor } from '../define/defineCmdUI'
import type { DialogueStep } from '../types/dialogue'

// ─── UI initial 타입 헬퍼 ────────────────────────────────────

/**
 * `config.modules` 타입에서 `initial` 허용 값 구조를 추출합니다.
 * key: `keyof TModules`, value: 해당 `NovelModule`의 스키마(`TSchema`)의 `Partial`
 */
export type InitialOf<TModules> = {
  [K in keyof TModules]?: TModules[K] extends NovelModule<any, infer TSchema> ? Partial<TSchema> : never
}

/**
 * `defineScene` 외부에서 `initial` 데이터를 공통 모듈로 분리할 때 사용하는 타입 추론 헬퍼입니다.
 * 
 * @example
 * ```ts
 * import config from '../novel.config'
 * import { defineInitial } from 'fumika'
 * 
 * export const commonInitial = defineInitial(config, {
 *   dialogue: { text: { fontSize: 18 } }
 * })
 * ```
 */
export function defineInitial<
  TConfig extends NovelConfig<any, any, any, any, any> & { modules?: Record<string, NovelModule<any>> },
  TInitial extends ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>)
>(
  config: TConfig,
  initial: TInitial & (
    [TConfig['modules']] extends [undefined]
    ? unknown
    : { [K in keyof TInitial]: K extends keyof NonNullable<TConfig['modules']> ? unknown : never }
  )
): typeof initial {
  return initial
}

/** 씬 정의 결과물. Scene 실행기가 소비합니다. */
export interface SceneDefinition<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
> {
  readonly kind: 'dialogue'
  name?: string
  readonly dialogues: DialogueStep<any>[]
  readonly localVars?: TLocalVars
  /** 씬 종료 시 자동으로 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
  readonly nextScene?: string | { scene: string; preserve: boolean }
  /**
   * 씬 시작 시 자동으로 초기화할 모듈 데이터.
   * `novel.config`의 `modules` 키를 기반으로 타입이 추론됩니다.
   */
  readonly initial?: Record<string, unknown>
  /**
   * 씬 스코프 훅 디스크립터.
   * `defineHook()`의 반환값을 전달하면 씬 시작 시 자동 등록, 씬 종료 시 자동 해제됩니다.
   */
  readonly hooks?: SceneHookDescriptor
}

/**
 * DialogueScene을 정의합니다.
 *
 * - `variables`에 씬 **지역변수** 초깃값을 전달합니다 (키에 `_` 접두사 필수).
 * - `initial`에 씬 시작 시 적용할 모듈 초기 데이터를 전달합니다 (optional).
 *   `novel.config`의 `modules` 키를 기반으로 키/값 타입이 추론됩니다.
 *
 * @example 지역변수 없음
 * ```ts
 * export default defineScene({ config }, [
 *   { type: 'background', name: 'bg-classroom' },
 *   { type: 'dialogue', speaker: 'characterA', text: '안녕!' },
 * ])
 * ```
 *
 * @example initial 사용
 * ```ts
 * export default defineScene({
 *   config,
 *   initial: {
 *     'dialogue': { bg: { color: '#00000000', height: 168 } },
 *     'choices':  { background: 'rgba(20,20,50,0.90)', minWidth: 280 },
 *   },
 * }, [
 *   { type: 'dialogue', text: '...' },
 * ])
 * ```
 *
 * @example 지역변수 사용 (_ 접두사 필수)
 * ```ts
 * export default defineScene({ config, variables: { _tries: 0 } }, [
 *   { type: 'var', name: '_tries', value: 0 },
 *   { type: 'condition', if: '_tries >= 3', goto: 'end' },
 * ], { next: 'scene-b' })
 * ```
 */
export function defineScene<
  TVars extends Record<string, any>,
  TConfig extends NovelConfig<TVars, readonly string[], any, any, any> & { modules?: Record<string, NovelModule<any>> },
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
  TInitial extends ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>) = ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>)
>(
  {
    config,
    variables = {} as any,
    initial,
    next,
    hooks,
  }: {
    config: TConfig & { vars: TVars }
    variables?: keyof TLocalVars extends `_${string}` ? TLocalVars : never
    /** 씬 시작 시 적용할 모듈 초기 데이터 (optional). config.modules 키/값 타입 추론. */
    initial?: TInitial & (
      [TConfig['modules']] extends [undefined]
      ? unknown
      : { [K in keyof TInitial]: K extends keyof NonNullable<TConfig['modules']> ? unknown : never }
    )
    /** 씬 종료 시 자동으로 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
    next?: SceneNextTarget<TConfig>
    /**
     * 씬 스코프 훅 디스크립터. `defineHook(config, { ... })`의 반환값.
     * 씬 시작 시 자동으로 훅이 등록되고, 씬 종료/전환 시 자동으로 해제됩니다.
     */
    hooks?: SceneHookDescriptor
  },
  dialogues: DialogueStep<TConfig, TLocalVars, TVars>[]
): SceneDefinition<
  TConfig['vars'],
  TConfig['scenes'],
  TConfig['characters'],
  TConfig['backgrounds'],
  [TConfig['assets']] extends [undefined] ? Record<string, string> : NonNullable<TConfig['assets']>,
  TLocalVars
> {
  return {
    kind: 'dialogue',
    dialogues: dialogues as any,
    localVars: variables,
    nextScene: next as string | { scene: string; preserve: boolean } | undefined,
    initial: initial as Record<string, unknown> | undefined,
    hooks,
  }
}
