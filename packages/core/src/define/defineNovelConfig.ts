import type { CharDefs, BgDefs, NovelConfig, FallbackRuleOf, EffectDef } from '../types/config'
import type { NovelModule } from '../define/defineCmdUI'
import type { EffectType } from '../types/dialogue'
import dialogueModule from '../modules/dialogue'
import choiceModule from '../modules/choice'
import backgroundModule from '../modules/background'
import characterModule, { characterFocusModule, characterHighlightModule, characterEffectModule } from '../modules/character'
import moodModule from '../modules/mood'
import effectModule from '../modules/effect'
import { overlayTextModule, overlayImageModule, overlayEffectModule } from '../modules/overlay'
import { screenFadeModule, screenFlashModule, screenWipeModule } from '../modules/screen'
import { cameraZoomModule, cameraPanModule, cameraEffectModule } from '../modules/camera'
import uiModule from '../modules/ui'
import controlModule from '../modules/control'
import audioModule from '../modules/audio'
import dialogBoxModule from '../modules/dialogBox'
import inputModule from '../modules/input'
import elementModule from '../modules/element'

// ─── 내장 모듈 맵 ────────────────────────────────────────────

/**
 * 엔진이 자동으로 포함하는 내장 모듈 목록.
 * `defineNovelConfig`의 `modules`에 명시하지 않아도 자동으로 등록됩니다.
 */
export const BUILTIN_MODULES = {
  'dialogue': dialogueModule,
  'choice': choiceModule,
  'background': backgroundModule,
  'character': characterModule,
  'character-focus': characterFocusModule,
  'character-highlight': characterHighlightModule,
  'character-effect': characterEffectModule,
  'mood': moodModule,
  'effect': effectModule,
  'overlay-text': overlayTextModule,
  'overlay-image': overlayImageModule,
  'overlay-effect': overlayEffectModule,
  'screen-fade': screenFadeModule,
  'screen-flash': screenFlashModule,
  'screen-wipe': screenWipeModule,
  'camera-zoom': cameraZoomModule,
  'camera-pan': cameraPanModule,
  'camera-effect': cameraEffectModule,
  'ui': uiModule,
  'control': controlModule,
  'audio': audioModule,
  'dialogBox': dialogBoxModule,
  'input': inputModule,
  'element': elementModule,
} as const

/** 내장 모듈 타입 */
export type BuiltinModules = typeof BUILTIN_MODULES

// ─── defineNovelConfig ───────────────────────────────────────

/**
 * Novel config를 정의합니다. 제네릭으로 리터럴 타입을 보존하여
 * defineScene에서 타입 힌트를 자동으로 제공합니다.
 *
 * 내장 모듈(dialogue, choice, background 등)은 `modules`에 명시하지 않아도
 * 자동으로 등록됩니다. 커스텀 모듈만 `modules`에 추가하면 됩니다.
 *
 * @example
 * export default defineNovelConfig({
 *   width: ..., // default: canvas width
 *   height: ..., // default: canvas height
 *   variables: { likeability: 0, metCharacterA: false },
 *   scenes: ['scene-a', 'scene-b'],
 *   assets: { ... },
 *   characters: { ... },
 *   backgrounds: { ... },
 *   // 커스텀 모듈만 추가
 *   modules: {
 *     'test-cmd': testModule,
 *   },
 * })
 */
export function defineNovelConfig<
  TVars extends Record<string, any>,
  const TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TAudios extends Record<string, string> = Record<string, string>,
  TModules extends Record<string, NovelModule<any>> = Record<never, never>,
  TEnvs extends Record<`$${string}`, any> = Record<never, never>,
>(
  config: {
    width?: number
    height?: number
    variables: TVars & { [K in keyof TVars]: K extends `$${string}` | `_${string}` ? never : TVars[K] }
    scenes: TScenes
    characters: TCharacters
    backgrounds: TBackgrounds
    effects?: Partial<Record<EffectType, EffectDef>>
    assets?: TAssets
    audios?: TAudios
    fallback?: FallbackRuleOf<TModules>[]
    modules?: TModules
    environments?: TEnvs & { [K in keyof TEnvs]: K extends `$${string}` ? TEnvs[K] : never }
  }
): NovelConfig<TVars, TScenes, TCharacters, TBackgrounds, TAssets, TAudios, BuiltinModules & TModules, TEnvs> {
  // 내장 모듈 + 유저 모듈 merge (유저 모듈이 덮어쓸 수 있음)
  const mergedModules = { ...BUILTIN_MODULES, ...(config.modules ?? {}) }
  return { ...config, modules: mergedModules } as any
}
