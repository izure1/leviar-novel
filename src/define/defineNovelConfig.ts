// =============================================================
// defineNovelConfig.ts — Novel config 헬퍼 함수
// =============================================================

import type { CharDefs, BgDefs, NovelConfig } from '../types/config'

/**
 * Novel config를 정의합니다. 제네릭으로 리터럴 타입을 보존하여
 * defineScene에서 타입 힌트를 자동으로 제공합니다.
 *
 * @example
 * ```ts
 * export default defineNovelConfig({
 *   vars: { likeability: 0, metCharacterA: false },
 *   scenes: ['scene-a', 'scene-b'] as const,
 *   characters: {
 *     characterA: {
 *       normal: { src: './assets/a_normal.png', width: 500 }
 *     }
 *   },
 *   backgrounds: {
 *     'bg-classroom': { src: './assets/bg/classroom.png', parallax: true }
 *   },
 * })
 * ```
 */
export function defineNovelConfig<
  TVars        extends Record<string, any>,
  TScenes      extends readonly string[],
  TCharacters  extends CharDefs,
  TBackgrounds extends BgDefs,
>(
  config: NovelConfig<TVars, TScenes, TCharacters, TBackgrounds>
): NovelConfig<TVars, TScenes, TCharacters, TBackgrounds> {
  return config
}
