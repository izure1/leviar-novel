import type { BgDef, EffectDef } from '../types/config'
import type { EffectType, FallbackRuleOf } from '../types/dialogue'
import type { NovelModule } from './defineCmdUI'

// ─── 내부 유틸 타입 ───────────────────────────────────────────

type AssetKey<TAssets extends Record<string, string>> = keyof TAssets & string

type BgDefOf<TAssets extends Record<string, string>> =
  Omit<BgDef, 'src'> & { src: AssetKey<TAssets> }

type BgDefsOf<TAssets extends Record<string, string>> =
  Record<string, BgDefOf<TAssets>>

// ─── defineAssets ─────────────────────────────────────────────

/**
 * 에셋 맵을 정의합니다. 리터럴 타입을 보존하여 다른 헬퍼의 타입추론 기반이 됩니다.
 *
 * @example
 * const assets = defineAssets({
 *   bg_floor: './assets/bg_floor.png',
 *   fumika_base: './assets/fumika_base.png',
 * })
 */
export function defineAssets<T extends Record<string, string>>(assets: T): T {
  return assets
}

// ─── defineBackgrounds ────────────────────────────────────────

/**
 * 배경 맵을 정의합니다. `src` 필드가 `defineAssets`로 생성한 에셋 키로 제한됩니다.
 *
 * @example
 * const backgrounds = defineBackgrounds(assets)({
 *   floor: { src: 'bg_floor', parallax: true },
 * })
 */
export function defineBackgrounds<TAssets extends Record<string, string>>(assets: TAssets) {
  return <K extends string>(backgrounds: Record<K, BgDefOf<TAssets>>): Record<K, BgDefOf<TAssets>> => backgrounds
}

// ─── defineAudios ─────────────────────────────────────────────

/**
 * 오디오 맵을 정의합니다.
 *
 * @example
 * const audios = defineAudios({
 *   bgm_main: './assets/bgm_main.mp3',
 * })
 */
export function defineAudios<T extends Record<string, string>>(audios: T): T {
  return audios
}

// ─── defineEffects ────────────────────────────────────────────

/**
 * 이펙트 설정 맵을 정의합니다. `EffectType` 키와 `EffectDef` 값을 타입 검증합니다.
 *
 * @example
 * const effects = defineEffects({
 *   sakura: { clip: { size: [[1.0, 2.0]] } },
 * })
 */
export function defineEffects<T extends Partial<Record<EffectType, EffectDef>>>(effects: T): T {
  return effects
}

// ─── defineFallback ───────────────────────────────────────────

/**
 * 폴백 규칙 목록을 정의합니다. 모듈 맵을 전달하면 커스텀 모듈 커맨드도 타입 추론됩니다.
 *
 * @example
 * const fallback = defineFallback(modules)([
 *   { type: 'character', action: 'show', defaults: { duration: 300 } },
 *   { type: 'my-cmd', message: '...', defaults: {} },
 * ])
 */
export function defineFallback<TModules extends Record<string, NovelModule<any>>>(
  modules: TModules
) {
  return (rules: FallbackRuleOf<TModules>[]): FallbackRuleOf<TModules>[] => rules
}

// ─── defineCustomModules ──────────────────────────────────────

/**
 * 커스텀 모듈 맵을 정의합니다.
 *
 * @example
 * const modules = defineCustomModules({
 *   'test-cmd': testModule,
 * })
 */
export function defineCustomModules<T extends Record<string, NovelModule<any>>>(modules: T): T {
  return modules
}
