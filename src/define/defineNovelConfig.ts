import type { CharDefs, CharDefsWithPoints, BgDefs, NovelConfig, FallbackRuleOf, EffectDef, CustomCmdHandler } from '../types/config'
import type { UIHandler } from '../define/defineCmdUI'
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
 *   points: ['face', 'chest'],
 *   characters: { ... },
 *   backgrounds: { ... },
 *   ui: {
 *     'dialogue': dialogueUISetup,
 *     'choices':  choiceUISetup,
 *   },
 *   cmds: {
 *     'my-cmd': (cmd, ctx) => { ctx.world; return false }
 *   },
 * })
 * ```
 */
export function defineNovelConfig<
  TVars        extends Record<string, any>,
  const TScenes extends readonly string[],
  const TPoints extends readonly string[],
  TCharacters  extends CharDefsWithPoints<TPoints>,
  TBackgrounds extends BgDefs,
  TAssets      extends Record<string, string>,
  TCmds        extends Record<string, CustomCmdHandler<any, TVars, any>> = Record<never, never>,
  TUi          extends Record<string, UIHandler<any>> = Record<never, never>,
>(
  config: {
    vars: TVars
    scenes: TScenes
    /** 캐릭터 이미지에서 사용 가능한 포커스 포인트 이름 목록 */
    points: TPoints
    characters: NoInfer<TCharacters>
    backgrounds: TBackgrounds
    effects?: Partial<Record<EffectType, EffectDef>>
    assets?: TAssets
    fallback?: NoInfer<[FallbackRuleOf<TCmds>] extends [infer T] ? T[] : never>
    cmds?: TCmds
    ui?: TUi
  }
): NovelConfig<TVars, TScenes, TCharacters & CharDefs, TBackgrounds, TAssets, TCmds, TUi, TPoints> {
  return config as any
}
