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
  TLocalVars extends Record<string, any> = Record<never, never>,
> {
  readonly kind:       'dialogue'
  name?:               string
  readonly dialogues:  DialogueStep<TVars, TScenes, TCharacters, TBackgrounds>[]
  readonly localVars?: TLocalVars
  /** 씬 종료 시 자동으로 이동할 다음 씬 이름 */
  readonly nextScene?: string
}

/**
 * DialogueScene을 정의합니다.
 *
 * - 사용자는 `dialogues` 배열 내부만 편집합니다.
 * - `config`를 첫 인자로 받아 캐릭터/배경/씬/변수 이름의 타입 힌트를 제공합니다.
 * - 씬 지역변수는 `options.localVars`에 초깃값을 설정합니다.
 *   씬 전환 시 초기화되며, 전역변수와 이름이 중복될 수 없습니다.
 *
 * @example
 * ```ts
 * import config from './novel.config'
 * import { defineScene } from 'leviar-novel'
 *
 * export default defineScene(config, [
 *   { type: 'background', name: 'bg-classroom' },
 *   { type: 'dialogue', speaker: 'characterA', text: '안녕!' },
 * ])
 * ```
 *
 * @example 지역변수 사용
 * ```ts
 * export default defineScene(config, [
 *   { type: 'var', name: 'tries', value: 0, scope: 'local' },
 * ], { localVars: { tries: 0 } })
 * ```
 */
export function defineScene<
  TConfig    extends NovelConfig<any, readonly string[], any, any>,
  TLocalVars extends Record<string, any> = Record<never, never>,
>(
  config:    TConfig,
  dialogues: DialogueStep<
    TConfig['vars'],
    TConfig['scenes'],
    TConfig['characters'],
    TConfig['backgrounds']
  >[],
  options?: {
    localVars?: TLocalVars
    /** 씬 종료 시 자동으로 이동할 다음 씬 이름 */
    next?: TConfig['scenes'][number]
  }
): SceneDefinition<
  TConfig['vars'],
  TConfig['scenes'],
  TConfig['characters'],
  TConfig['backgrounds'],
  TLocalVars
> {
  return {
    kind:      'dialogue',
    dialogues,
    localVars:  options?.localVars,
    nextScene:  options?.next as string | undefined,
  }
}
