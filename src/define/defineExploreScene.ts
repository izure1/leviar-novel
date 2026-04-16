// =============================================================
// defineExploreScene.ts — ExploreScene 정의 헬퍼
// =============================================================

import type { NovelConfig, BgDefs } from '../types/config'

/** ExploreScene 내 클릭 가능 오브젝트 정의 */
export interface ExploreObject<TScenes extends readonly string[]> {
  /** 오브젝트 식별자 */
  name: string
  /** 화면 내 위치 (px, 좌상단 기준) */
  position: { x: number; y: number }
  /** 이미지 에셋 키 또는 경로 */
  src: string
  /** 클릭 시 이동할 씬 이름 */
  next: TScenes[number]
  /** 오브젝트 너비 (px). 기본값: 100 */
  width?: number
  /** 오브젝트 높이 (px). 기본값: 100 */
  height?: number
}

/** ExploreScene 옵션 */
export interface ExploreSceneOptions<
  TScenes      extends readonly string[],
  TBackgrounds extends BgDefs,
> {
  /** 배경 이름 (config backgrounds 키) */
  background: keyof TBackgrounds & string
  /** 화면에 배치할 클릭 가능 오브젝트 목록 */
  objects: ExploreObject<TScenes>[]
}

/** ExploreScene 정의 결과물. Scene 실행기가 소비합니다. */
export interface ExploreSceneDefinition<
  TScenes      extends readonly string[],
  TBackgrounds extends BgDefs,
> {
  readonly kind:    'explore'
  readonly name:    TScenes[number]
  readonly options: ExploreSceneOptions<TScenes, TBackgrounds>
}

/**
 * ExploreScene을 정의합니다.
 * 화면 위 오브젝트를 클릭하여 씬을 이동하는 씬입니다 (지도, 조사 등).
 *
 * @example
 * ```ts
 * import config from './novel.config'
 * import { defineExploreScene } from 'leviar-novel'
 *
 * export default defineExploreScene(config, 'explore-map', {
 *   background: 'bg-rooftop',
 *   objects: [
 *     {
 *       name: 'door',
 *       position: { x: 200, y: 300 },
 *       src: './assets/objects/door.png',
 *       next: 'scene-b',
 *     },
 *   ],
 * })
 * ```
 */
export function defineExploreScene<
  TConfig extends NovelConfig<any, readonly string[], any, any>,
>(
  config:  TConfig,
  name:    TConfig['scenes'][number],
  options: ExploreSceneOptions<TConfig['scenes'], TConfig['backgrounds']>
): ExploreSceneDefinition<TConfig['scenes'], TConfig['backgrounds']> {
  return {
    kind: 'explore',
    name,
    options,
  }
}
