import type { CharDefs, BgDefs, NovelConfig, FallbackRule, EffectDef } from '../types/config'
import type { NovelModule } from '../define/defineCmdUI'
import type { EffectType } from '../types/dialogue'

/**
 * Novel config를 정의합니다. 제네릭으로 리터럴 타입을 보존하여
 * defineScene에서 타입 힌트를 자동으로 제공합니다.
 *
 * @example
 * ```ts
 * export default defineNovelConfig({
 *   vars: { likeability: 0, metCharacterA: false },
 *   scenes: ['scene-a', 'scene-b'],
 *   characters: { ... },
 *   backgrounds: { ... },
 *   modules: {
 *     'dialogue': dialogueModule,
 *     'choices':  choiceModule,
 *     'background': backgroundModule,
 *   },
 * })
 * ```
 */
export function defineNovelConfig<
  TVars extends Record<string, any>,
  const TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string>,
  TModules extends Record<string, NovelModule<any>> = Record<never, never>,
>(
  config: {
    vars: TVars
    scenes: TScenes
    characters: TCharacters
    backgrounds: TBackgrounds
    effects?: Partial<Record<EffectType, EffectDef>>
    assets?: TAssets
    fallback?: FallbackRule[]
    modules?: TModules
  }
): NovelConfig<TVars, TScenes, TCharacters, TBackgrounds, TAssets, TModules> {
  return config as any
}
