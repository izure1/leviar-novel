// =============================================================
// defineScene.ts — DialogueScene 정의 헬퍼
// =============================================================

import type { NovelConfig, CharDefs, BgDefs } from '../types/config'
import type { DialogueStep } from '../types/dialogue'

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
}

/**
 * DialogueScene을 정의합니다.
 *
 * - 두 번째 인자로 씬 **지역변수** 초깃값 객체를 전달합니다.
 *   키 이름에 `_` 접두사를 **반드시** 붙여야 합니다. (ex: `{ _tries: 0 }`)
 *   `_` 접두사가 없는 키를 전달하면 타입 에러가 발생합니다.
 * - 지역변수가 없는 씬은 `{}` 를 전달합니다.
 * - 씬 전환 시 지역변수는 초기화됩니다.
 *
 * @example 지역변수 없음
 * ```ts
 * export default defineScene(config, {}, [
 *   { type: 'background', name: 'bg-classroom' },
 *   { type: 'dialogue', speaker: 'characterA', text: '안녕!' },
 * ])
 * ```
 *
 * @example 지역변수 사용 (_ 접두사 필수)
 * ```ts
 * export default defineScene(config, { _tries: 0 }, [
 *   { type: 'var', name: '_tries', value: 0 },
 *   { type: 'condition', if: '_tries >= 3', goto: 'end' },
 * ], { next: 'scene-b' })
 * ```
 */
export function defineScene<
  TConfig extends NovelConfig<any, readonly string[], any, any, any, any>,
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
>(
  config: TConfig,
  localVars: TLocalVars,
  dialogues: DialogueStep<
    TConfig['vars'],
    TLocalVars,
    TConfig['scenes'],
    TConfig['characters'],
    TConfig['backgrounds'],
    [TConfig['assets']] extends [undefined] ? Record<string, string> : NonNullable<TConfig['assets']>,
    [TConfig['cmds']] extends [undefined] ? Record<never, never> : NonNullable<TConfig['cmds']>
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
    localVars: localVars,
    nextScene: options?.next as string | undefined,
  }
}
