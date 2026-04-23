// =============================================================
// defineScene.ts — DialogueScene 정의 헬퍼
// =============================================================

import type { NovelConfig, CharDefs, BgDefs } from '../types/config'
import type { UIHandler } from '../define/defineCmdUI'
import type { DialogueStep } from '../types/dialogue'

// ─── UI initial 타입 헬퍼 ────────────────────────────────────

/**
 * `config.ui` 타입에서 `initial` 허용 값 구조를 추출합니다.
 * key: `keyof TUi`, value: 해당 `UIHandler`의 스키마(`TSchema`)의 `Partial`
 */
export type InitialOf<TUi> = {
  [K in keyof TUi]?: TUi[K] extends UIHandler<infer TSchema> ? Partial<TSchema> : never
}

/**
 * `defineScene` 외부에서 `initial` 데이터를 공통 모듈로 분리할 때 사용하는 타입 추론 헬퍼입니다.
 * 
 * @example
 * ```ts
 * import config from '../novel.config'
 * import { defineInitial } from 'leviar-novel'
 * 
 * export const commonInitial = defineInitial(config, {
 *   dialogue: { text: { fontSize: 18 } }
 * })
 * ```
 */
export function defineInitial<
  TConfig extends NovelConfig<any, any, any, any, any, any> & { ui?: Record<string, UIHandler<any>> }
>(
  config: TConfig,
  initial: [TConfig['ui']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['ui']>>
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
  readonly dialogues: DialogueStep<TVars, TLocalVars, TScenes, TCharacters, TBackgrounds, TAssets>[]
  readonly localVars?: TLocalVars
  /** 씬 종료 시 자동으로 이동할 다음 씬 이름 */
  readonly nextScene?: string
  /**
   * 씬 시작 시 자동으로 초기화할 UI 설정.
   * `novel.config`의 `ui` 키를 기반으로 타입이 추론됩니다.
   * `setup-*` 커맨드를 씬 스크립트에 추가하는 대신 이 옵션을 사용하세요.
   */
  readonly initial?: Record<string, unknown>
}

/**
 * DialogueScene을 정의합니다.
 *
 * - `variables`에 씬 **지역변수** 초깃값을 전달합니다 (키에 `_` 접두사 필수).
 * - `initial`에 씬 시작 시 적용할 UI 초기 데이터를 전달합니다 (optional).
 *   `novel.config`의 `ui` 키를 기반으로 키/값 타입이 추론됩니다.
 *
 * @example 지역변수 없음
 * ```ts
 * export default defineScene({ config }, [
 *   { type: 'background', name: 'bg-classroom' },
 *   { type: 'dialogue', speaker: 'characterA', text: '안녕!' },
 * ])
 * ```
 *
 * @example initial 사용 (setup-* 커맨드 대체)
 * ```ts
 * export default defineScene({
 *   config,
 *   initial: {
 *     'dialogue': { bg: { color: '#00000000', height: 168 }, text: { fontSize: 18 } },
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
  TConfig extends NovelConfig<any, readonly string[], any, any, any, any> & { ui?: Record<string, UIHandler<any>> },
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
>(
  {
    config,
    variables = {} as any,
    initial,
  }: {
    config: TConfig
    variables?: keyof TLocalVars extends `_${string}` ? TLocalVars : never
    /** 씬 시작 시 적용할 UI 초기 데이터 (optional). config.ui 키/값 타입 추론. */
    initial?: [TConfig['ui']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['ui']>>
  },
  dialogues: DialogueStep<
    TConfig['vars'],
    TLocalVars,
    TConfig['scenes'],
    TConfig['characters'],
    TConfig['backgrounds'],
    [TConfig['assets']] extends [undefined] ? Record<string, string> : NonNullable<TConfig['assets']>,
    [TConfig['cmds']] extends [undefined] ? Record<never, never> : NonNullable<TConfig['cmds']>,
    [TConfig['points']] extends [undefined] ? readonly string[] : NonNullable<TConfig['points']>
  >[],
  options?: {
    /** 씬 종료 시 자동으로 이동할 다음 씬 이름 */
    next?: TConfig['scenes'][number]
  }
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
    nextScene: options?.next as string | undefined,
    initial: initial as Record<string, unknown> | undefined,
  }
}
