/**
 * Visualnovel.ts — Typed Visual Novel scene manager
 *
 * Usage:
 *   const vn = Visualnovel.create()
 *     .defineCharacter({
 *       heroine: { images: { normal: 'girl_normal', happy: 'girl_happy' }, focusPoint: { x: 0.5, y: 0.2 } }
 *     })
 *     .defineBackground({
 *       library: { src: 'bg_library', parallax: true },
 *       rooftop: { src: 'bg_rooftop', parallax: false }
 *     })
 *     .build(world, { width: 800, height: 600, depth: 500 })
 *
 *   vn.showCharacter('heroine', 'center', 'normal')
 *   vn.setBackground('library', 'cover', 1000)
 */

import type { World, LeviarObject, EasingType, LeviarObjectOptions, LeviarObjectEvents } from '../src'
import type { SpriteClipOptions } from '../src/SpriteManager'
import type { ParticleOptions } from '../src/objects/Particle'
import type { RectangleOptions } from '../src/objects/Rectangle'

// =============================================================
// Public Types
// =============================================================

export interface VisualnovelOption {
  width: number
  height: number
  depth: number
}

/** Single character image variant definition */
export interface CharImageDef {
  /** Source asset key or path (if omitted, imageKey is used as src) */
  src?: string
  /** Character's base width in pixels */
  width?: number
  /** Focus points (0~1 normalized). x: left→right, y: top→bottom. */
  points?: Record<string, { x: number, y: number }>
}

/** Single character definition: mapping of imageKey to its details */
export type CharDef = Record<string, CharImageDef>

/** Single background definition */
export interface BgDef {
  src: string
  /**
   * Parallax mode. Default: true
   * - true : placed at world Z-depth, extra padding for camera movement
   * - false: attached as camera child (always screen-fixed)
   */
  parallax?: boolean
}

export type CharDefs = Record<string, CharDef>
export type BgDefs = Record<string, BgDef>

export type ZoomPreset = 'close-up' | 'medium' | 'wide' | 'reset'

export type UiNodeType = 'rectangle' | 'ellipse' | 'text' | 'image' | 'video' | 'sprite' | 'particle'

/** Single UI definition */
export interface UiDef {
  type: UiNodeType
  children?: Record<string, UiDef>
  make: LeviarObjectOptions<{ text?: string; src?: string; sprite?: Omit<SpriteClipOptions, 'name' | 'src'> }>
  on?: Partial<{
    [K in keyof LeviarObjectEvents]: (...args: LeviarObjectEvents[K]) => void
  }> & Record<string, (...args: any[]) => void>
}

export type UiDefs = Record<string, UiDef>
export type PanPreset = 'left' | 'right' | 'up' | 'down' | 'center'
export type CameraEffectPreset = 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall'
export type CharacterPositionPreset = 'far-left' | 'left' | 'center' | 'right' | 'far-right' | string
export type BackgroundFitPreset = 'stretch' | 'contain' | 'cover'
export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia'
export type FlashPreset = 'white' | 'red' | 'yellow'
export type WipePreset = 'left' | 'right' | 'up' | 'down'
export type MoodType = 'day' | 'night' | 'dawn' | 'sunset' | 'foggy' | 'sepia' | 'cold' | 'noir' | 'horror' | 'flashback' | 'dream' | 'danger' | 'none'
export type LightPreset = 'spot' | 'ambient' | 'warm' | 'cold'
export type FlickerPreset = 'candle' | 'flicker' | 'strobe'
export type OverlayPreset = 'caption' | 'title' | 'whisper'
export type EffectType = 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies'

// =============================================================
// Preset Lookup Tables
// =============================================================

export const Z_INDEX = {
  // World Layer
  BACKGROUND: -1,
  CHARACTER_NORMAL: 10,
  CHARACTER_HIGHLIGHT: 100,

  // UI Layer (post-render)
  MOOD: 100,
  LIGHT: 200,
  UI_BASE: 300,
  OVERLAY_WHISPER: 400,
  OVERLAY_CAPTION: 410,
  OVERLAY_TITLE: 420,
  CHARACTER_CUTIN: 500,
  TRANSITION: 999
}

const CHARACTER_X_RATIO: Record<string, number> = {
  'far-left': 0.1,
  'left': 0.25,
  'center': 0.5,
  'right': 0.75,
  'far-right': 0.9
}

const ZOOM_PRESETS: Record<ZoomPreset, { scale: number, duration: number }> = {
  'close-up': { scale: 1.5, duration: 800 },
  'medium': { scale: 1.2, duration: 600 },
  'wide': { scale: 0.8, duration: 800 },
  'reset': { scale: 1.0, duration: 600 }
}

const PAN_PRESETS: Record<PanPreset, { x: number, y: number, duration: number }> = {
  left: { x: -200, y: 0, duration: 1000 },
  right: { x: 200, y: 0, duration: 1000 },
  up: { x: 0, y: 200, duration: 1000 },
  down: { x: 0, y: -200, duration: 1000 },
  center: { x: 0, y: 0, duration: 1000 }
}

const CAMERA_EFFECT_PRESETS: Record<CameraEffectPreset, { intensity: number, duration: number }> = {
  shake: { intensity: 10, duration: 500 },
  bounce: { intensity: 15, duration: 600 },
  wave: { intensity: 20, duration: 1000 },
  nod: { intensity: 10, duration: 400 },
  'shake-x': { intensity: 15, duration: 500 },
  fall: { intensity: 15, duration: 800 }
}

const FADE_PRESETS: Record<FadeColorPreset, { color: string, easing: EasingType }> = {
  black: { color: 'rgba(0,0,0,1)', easing: 'linear' },
  white: { color: 'rgba(255,255,255,1)', easing: 'linear' },
  red: { color: 'rgba(200,0,0,1)', easing: 'easeIn' },
  dream: { color: 'rgba(200,180,255,1)', easing: 'easeInOut' },
  sepia: { color: 'rgba(150,100,50,1)', easing: 'easeIn' }
}

const FLASH_PRESETS: Record<FlashPreset, { color: string, duration: number }> = {
  white: { color: 'rgba(255,255,255,1)', duration: 300 },
  red: { color: 'rgba(255,0,0,1)', duration: 300 },
  yellow: { color: 'rgba(255,220,0,1)', duration: 250 }
}

const WIPE_PRESETS: Record<WipePreset, { x: number, y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 }
}

const MOOD_PRESETS: Record<MoodType, { color: string, vignette?: string, blendMode?: string }> = {
  day: { color: 'rgba(255, 230, 180, 0.1)', vignette: 'transparent 70%, rgba(255, 200, 100, 0.15) 100%', blendMode: 'screen' },
  night: { color: 'rgba(10, 15, 60, 0.5)', vignette: 'transparent 50%, rgba(0, 5, 25, 0.6) 100%', blendMode: 'multiply' },
  dawn: { color: 'rgba(25, 35, 70, 0.4)', vignette: 'transparent 50%, rgba(65, 122, 164, 0.6) 100%', blendMode: 'multiply' },
  sunset: { color: 'rgba(255, 120, 50, 0.25)', vignette: 'transparent 50%, rgba(255, 100, 50, 0.4) 100%', blendMode: 'screen' },
  foggy: { color: 'rgba(200, 210, 220, 0.4)', vignette: 'rgba(255,255,255,0.05) 0%, rgba(150, 160, 170, 0.4) 100%', blendMode: 'screen' },
  sepia: { color: 'rgba(160, 110, 50, 0.3)', vignette: 'transparent 60%, rgba(80, 50, 20, 0.5) 100%', blendMode: 'multiply' },
  cold: { color: 'rgba(80, 130, 220, 0.25)', vignette: 'transparent 50%, rgba(20, 40, 100, 0.4) 100%', blendMode: 'hard-light' },
  noir: { color: 'rgba(0, 0, 0, 0.1)', vignette: 'transparent 50%, rgba(0, 0, 0, 0.6) 100%', blendMode: 'luminosity' },
  horror: { color: 'rgba(150, 0, 0, 0.3)', vignette: 'transparent 40%, rgba(0, 0, 0, 0.7) 100%', blendMode: 'multiply' },
  flashback: { color: 'rgba(200, 200, 200, 0.2)', vignette: 'transparent 60%, rgba(255, 255, 255, 0.5) 100%', blendMode: 'screen' },
  dream: { color: 'rgba(180, 150, 255, 0.2)', vignette: 'transparent 60%, rgba(255, 200, 255, 0.4) 100%', blendMode: 'screen' },
  danger: { color: 'rgba(255, 0, 0, 0.1)', vignette: 'transparent 50%, rgba(200, 0, 0, 0.5) 100%', blendMode: 'color-burn' },
  none: { color: 'transparent' }
}

const LIGHT_PRESETS: Record<LightPreset, { color: string, opacity: number }> = {
  spot: { color: 'radial-gradient(circle,rgba(255,240,180,0.8) 0%,transparent 70%)', opacity: 0.6 },
  ambient: { color: 'rgba(255,230,150,1)', opacity: 0.15 },
  warm: { color: 'rgba(255,160,50,1)', opacity: 0.25 },
  cold: { color: 'rgba(100,160,255,1)', opacity: 0.2 }
}

const OVERLAY_PRESETS: Record<OverlayPreset, { fontSize: number, color: string, opacity: number, zIndex: number, y: 'top' | 'center' | 'bottom' }> = {
  caption: { fontSize: 24, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title: { fontSize: 48, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' }
}

const EFFECT_PRESETS: Record<EffectType, Partial<ParticleOptions>> = {
  dust: {
    attribute: { src: 'dust', frictionAir: 0, gravityScale: 0.001 },
    style: { width: 10, height: 10, blendMode: 'lighter' }
  },
  rain: {
    attribute: { src: 'rain', gravityScale: 1 },
    style: { width: 3, height: 6, opacity: 0.3, blendMode: 'screen' }
  },
  snow: {
    attribute: { src: 'snow', gravityScale: 0.01, frictionAir: 0 },
    style: { width: 15, height: 15, blendMode: 'lighter' }
  },
  sakura: {
    attribute: { src: 'sakura', gravityScale: 0.02, frictionAir: 0 },
    style: { width: 16, height: 20, opacity: 0.8 }
  },
  sparkle: {
    attribute: { src: 'sparkle', gravityScale: 0.1 },
    style: { width: 16, height: 16, opacity: 0.8 }
  },
  fog: {
    attribute: { src: 'fog', frictionAir: 0, gravityScale: 0.003 },
    style: { width: 120, height: 120, blendMode: 'screen' }
  },
  leaves: {
    attribute: { src: 'leaves', gravityScale: 0.1, frictionAir: 0.05, strictPhysics: true },
    style: { width: 20, height: 20, opacity: 0.9 }
  },
  fireflies: {
    attribute: { src: 'fireflies', gravityScale: -0.02, frictionAir: 0.05, strictPhysics: true },
    style: { width: 8, height: 8, opacity: 0.8, blendMode: 'lighter' }
  }
}

const EFFECT_CLIP_PRESETS: Record<EffectType, object> = {
  dust: {
    impulse: 0.05,
    lifespan: 10000,
    interval: 250,
    size: [[0.5, 1], [0, 0.5]],
    opacity: [[0, 0], [1, 1], [0, 0]],
    loop: true
  },
  rain: {
    impulse: 0,
    lifespan: 3000,
    interval: 40,
    size: [[0.1, 0.3], [0.1, 0.3]],
    opacity: [[1, 1], [1, 1]],
    loop: true
  },
  snow: {
    impulse: 0.01,
    angularImpulse: 0.001,
    lifespan: 10000,
    interval: 100,
    size: [[0.3, 0.8], [0.0, 0.0]],
    opacity: [[1, 1], [0, 0]],
    loop: true
  },
  sakura: {
    impulse: 0.02,
    angularImpulse: 0.001,
    lifespan: 6000,
    interval: 300,
    size: [[0.5, 0.8], [0.3, 0.5]],
    loop: true
  },
  sparkle: {
    impulse: 0.02,
    lifespan: 1500,
    interval: 150,
    size: [[0.5, 1], [0, 0.1]],
    loop: true
  },
  fog: {
    impulse: 0.01,
    angularImpulse: 0.0001,
    lifespan: 15000,
    interval: 800,
    size: [[2, 2], [5, 10]],
    opacity: [[0, 0], [0.1, 0.2], [0, 0]],
    loop: true
  },
  leaves: {
    impulse: 0.08,
    angularImpulse: 0.05,
    lifespan: 7000,
    interval: 350,
    size: [[0.8, 1.2], [0.8, 1.2]],
    loop: true
  },
  fireflies: {
    impulse: 0.03,
    lifespan: 5000,
    interval: 300,
    size: [[0.5, 1.5], [0, 0.5]],
    loop: true
  }
}

const DEFAULT_RATES: Partial<Record<EffectType, number>> = {
  dust: 5, rain: 200, snow: 8, sakura: 8, sparkle: 10, fog: 4, leaves: 5, fireflies: 5
}

// =============================================================
// Utils
// =============================================================

/**
 * 객체 병합 유틸리티 함수 (optional default 적용)
 * target의 속성을 유지하되, 정의되지 않은(undefined) 속성은 defaultObj의 값으로 재귀적으로 채워넣습니다.
 */
export function applyDefaults<T extends Record<string, any>>(
  target: T | undefined | null,
  defaultObj: Partial<T>
): T {
  if (!target) return { ...defaultObj } as T
  const result = { ...target } as Record<string, any>
  for (const key in defaultObj) {
    if (result[key] === undefined) {
      result[key] = defaultObj[key]
    } else if (
      typeof result[key] === 'object' && result[key] !== null && !Array.isArray(result[key]) &&
      typeof defaultObj[key] === 'object' && defaultObj[key] !== null && !Array.isArray(defaultObj[key])
    ) {
      result[key] = applyDefaults(result[key], defaultObj[key] as any)
    }
  }
  return result as T
}

// =============================================================
// VisualnovelBuilder
// =============================================================

/**
 * Typed builder that accumulates character/background definitions
 * and constructs a fully-typed Visualnovel instance.
 */
export class VisualnovelBuilder<
  TC extends CharDefs = Record<never, never>,
  TB extends BgDefs = Record<never, never>,
  TU extends UiDefs = Record<never, never>
> {
  private readonly _c: TC
  private readonly _b: TB
  private readonly _u: TU

  constructor(c: TC, b: TB, u: TU) {
    this._c = c
    this._b = b
    this._u = u
  }

  /**
   * Define character assets. Keys become type-safe identifiers.
   * @example
   * .defineCharacter({
   *   heroine: { images: { normal: 'girl_normal', happy: 'girl_happy' }, focusPoint: { x:0.5, y:0.2 } }
   * })
   */
  defineCharacter<C extends CharDefs>(defs: C): VisualnovelBuilder<C, TB, TU> {
    return new VisualnovelBuilder(defs, this._b, this._u)
  }

  /**
   * Define backgrounds. Keys become type-safe identifiers.
   * @example
   * .defineBackground({
   *   library: { src: 'bg_library', parallax: true },
   *   rooftop: { src: 'bg_roof',    parallax: false }
   * })
   */
  defineBackground<B extends BgDefs>(defs: B): VisualnovelBuilder<TC, B, TU> {
    return new VisualnovelBuilder(this._c, defs, this._u)
  }

  /**
   * Define UI layouts. Keys become type-safe identifiers.
   */
  defineUI<U extends UiDefs>(defs: U): VisualnovelBuilder<TC, TB, U> {
    return new VisualnovelBuilder(this._c, this._b, defs)
  }

  /** Instantiate the Visualnovel engine. */
  build(world: World, option: VisualnovelOption): Visualnovel<TC, TB, TU> {
    return new Visualnovel(world, option, this._c, this._b, this._u)
  }
}

// =============================================================
// Visualnovel (generic)
// =============================================================

export class Visualnovel<
  TC extends CharDefs = Record<never, never>,
  TB extends BgDefs = Record<never, never>,
  TU extends UiDefs = Record<never, never>
> {
  protected readonly world: World
  protected readonly width: number
  protected readonly height: number
  protected readonly depth: number
  /** Max camera X displacement (world units). Used to calculate background padding. */
  protected readonly maxCameraX: number
  /** Max camera Y displacement (world units). Used to calculate background padding. */
  protected readonly maxCameraY: number

  private readonly _charDefs: TC
  private readonly _bgDefs: TB
  private readonly _uiDefs: TU

  private _objects: Set<LeviarObject> = new Set()
  private _characters: Map<string, LeviarObject> = new Map()
  private _effects: Map<string, LeviarObject> = new Map()
  private _backgroundObj: LeviarObject | null = null
  private _backgroundIsParallax: boolean = true
  private _moodObj: LeviarObject | null = null
  private _transitionObj: LeviarObject | null = null
  private _overlayObjs: Map<string, LeviarObject> = new Map()
  private _lightObjs: Map<string, LeviarObject> = new Map()
  private _uiObjs: Map<string, LeviarObject> = new Map()
  private _flickerObj: LeviarObject | null = null
  private _initialCamZ: number = 0

  // -----------------------------------------------------------
  // Static entry point
  // -----------------------------------------------------------

  /** Returns a new builder. */
  static create(): VisualnovelBuilder {
    return new VisualnovelBuilder(
      {} as Record<never, never>,
      {} as Record<never, never>,
      {} as Record<never, never>
    )
  }

  // -----------------------------------------------------------
  // Constructor (internal; use Visualnovel.create()...build())
  // -----------------------------------------------------------

  constructor(world: World, option: VisualnovelOption, charDefs: TC, bgDefs: TB, uiDefs: TU) {
    this.world = world
    this.width = option.width
    this.height = option.height
    this.depth = option.depth
    this._charDefs = charDefs
    this._bgDefs = bgDefs
    this._uiDefs = uiDefs

    if (!this.world.camera) {
      this.world.camera = this.world.createCamera()
    }
    // 정정된 물리 공간 설계: 카메라는 0, 캐릭터는 focalLength 에 배치됩니다.
    this.world.camera!.transform.position.z = 0
    this._initialCamZ = 0

    // Compute maxCamera values based on actual scene geometry
    // (engine focal=100 → objects at depth/2 have much larger world units than canvas pixels)
    const cam = this.world.camera as any
    const calcRatio = typeof cam?.calcDepthRatio === 'function'
      ? (z: number, s: number) => cam.calcDepthRatio(z, s) as number
      : (_z: number, s: number) => s
    const charW = 500
    this.maxCameraX = Math.ceil(this.width * 0.4 + charW * 0.5)
    this.maxCameraY = Math.ceil(charW * 1.0 + this.height * 0.1)

    // UI 요소 자동 생성 및 카메라 추가 (월드 생성 시 자동 렌더링)
    for (const [key, def] of Object.entries(this._uiDefs)) {
      const uiObj = this._track(this._buildUINode(def as UiDef, key))
      this.world.camera?.addChild(uiObj)
      this._uiObjs.set(key, uiObj)
    }
  }

  // -----------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------

  private get _characterPlaneLocalZ(): number {
    const cam = this.world.camera
    const focalLength = cam?.attribute?.focalLength ?? 100
    // 캐릭터 평면(Z=focalLength)과 카메라 사이의 Local Z 거리
    return focalLength - (cam?.transform.position.z ?? 0)
  }

  /**
   * Resolve a position string to a 0~1 x-ratio.
   * 1) Preset name lookup
   * 2) "n/m" fraction → xRatio = n / (m+1)
   * 3) Fallback 0.5
   */
  private _resolvePositionX(position: string): number {
    if (CHARACTER_X_RATIO[position] !== undefined) return CHARACTER_X_RATIO[position]
    const m = position.match(/^(\d+)\/(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      const d = parseInt(m[2], 10)
      if (d > 0) return n / (d + 1)
    }
    return 0.5
  }

  private _track<T extends LeviarObject>(obj: T): T {
    this._objects.add(obj)
    return obj
  }

  private _getTransitionRect(color: string): LeviarObject {
    if (!this._transitionObj) {
      const w = this.world.canvas ? Math.max((this.world.canvas as any).width, this.width) : this.width
      const h = this.world.canvas ? Math.max((this.world.canvas as any).height, this.height) : this.height
      const rect = this.world.createRectangle({
        style: { color, width: w * 2, height: h * 2, opacity: 0, zIndex: Z_INDEX.TRANSITION, pointerEvents: false },
        transform: { position: { x: 0, y: 0, z: 10 } }
      })
      this.world.camera?.addChild(rect)
      this._transitionObj = rect
    } else {
      this._transitionObj.style.color = color
      this._transitionObj.transform.position.x = 0
      this._transitionObj.transform.position.y = 0
    }
    return this._transitionObj
  }

  // -----------------------------------------------------------
  // Scene management
  // -----------------------------------------------------------

  /** Remove all scene objects (characters, effects, background, mood, overlays, lights). */
  clear(resetUI: boolean = true): this {
    if (!resetUI) {
      this._objects.forEach(obj => {
        let isUI = false;
        for (const uiObj of this._uiObjs.values()) {
          if (uiObj === obj) {
            isUI = true;
            break;
          }
        }
        if (!isUI) obj.remove();
      })
      const uiVals = Array.from(this._uiObjs.values());
      this._objects.clear();
      uiVals.forEach(ui => this._objects.add(ui));
    } else {
      this._objects.forEach(obj => obj.remove())
      this._objects.clear()
      this._uiObjs.clear()
    }

    this._characters.clear()
    this._effects.clear()
    this._backgroundObj = null
    if (this._moodObj) { this._moodObj.remove(); this._moodObj = null }
    this._overlayObjs.forEach(obj => obj.remove()); this._overlayObjs.clear()
    this._lightObjs.forEach(obj => obj.remove()); this._lightObjs.clear()
    this._flickerObj = null

    if (resetUI) {
      for (const [key, def] of Object.entries(this._uiDefs)) {
        const uiObj = this._track(this._buildUINode(def as any, key))
        this.world.camera?.addChild(uiObj)
        this._uiObjs.set(key, uiObj)
      }
    }

    return this
  }

  // -----------------------------------------------------------
  // Environment effects
  // -----------------------------------------------------------

  /**
   * Add a particle effect. The effect type is also its identifier (one per type).
   * @param type   Effect preset name
   * @param rate   Particles per interval
   * @param overrides Fine-grained option overrides
   */
  addEffect(type: EffectType = 'dust', rate?: number, overrides?: Partial<ParticleOptions>): this {
    const preset = EFFECT_PRESETS[type] ?? EFFECT_PRESETS.dust
    const finalRate = rate ?? DEFAULT_RATES[type] ?? 10

    if (this._effects.has(type)) this.removeEffect(type)

    const clipName = `${type}_rate_${finalRate}`
    const particleZ = this.depth / 2
    if (!this.world.particleManager.get(clipName)) {
      const clipBase = EFFECT_CLIP_PRESETS[type] ?? EFFECT_CLIP_PRESETS.dust
      const customSrc = overrides?.attribute?.src ?? (preset.attribute as any)?.src ?? type

      // 파티클을 카메라와 배경(depth)의 딱 중간 평면(depth / 2)에 띄웁니다.
      const ratio = this.world.camera?.calcDepthRatio(particleZ, 1) ?? 1

      // 배경과 동일하게, X/Y축 카메라 최대 패닝 범위에 맞도록 최적 여백을 더합니다.
      const maxPanX = this.width * 0.4
      const maxPanY = this.height * 0.5
      const spanW = this.width + maxPanX * 2
      const spanH = this.height + maxPanY * 2

      this.world.particleManager.create({
        name: clipName, src: customSrc,
        ...(clipBase as any),
        rate: finalRate,
        spawnX: spanW * ratio,
        spawnY: spanH * ratio,
        spawnZ: particleZ
      })
    }

    const particle = this._track(this.world.createParticle({
      attribute: { ...(preset.attribute as any), src: clipName, ...overrides?.attribute },
      style: { ...(preset.style as any), ...overrides?.style },
      transform: { position: { x: 0, y: 0, z: particleZ }, ...overrides?.transform },
      ...(overrides as any)
    }))
    this._effects.set(type, particle)
    particle.play()
    return this
  }

  /** Remove a particle effect. */
  removeEffect(type: EffectType, duration: number = 600): this {
    const effect = this._effects.get(type)
    if (effect) {
      this._effects.delete(type)
      if (duration > 0 && typeof effect.fadeOut === 'function') {
        effect.fadeOut(duration)
        setTimeout(() => { effect.remove(); this._objects.delete(effect) }, duration)
      } else {
        effect.remove(); this._objects.delete(effect)
      }
    }
    return this
  }

  // -----------------------------------------------------------
  // Background
  // -----------------------------------------------------------

  /**
   * Set the background using a key from defineBackground.
   * @param key       Background key (type-safe)
   * @param fit       Fit mode
   * @param duration  Crossfade duration (0 = instant)
   * @param isVideo   Treat src as video
   */
  setBackground<K extends keyof TB & string>(
    key: K,
    fit: BackgroundFitPreset = 'stretch',
    duration: number = 1000,
    isVideo: boolean = false,
    options?: any
  ): this {
    const def = this._bgDefs[key]
    if (!def) return this

    const finalSrc = def.src
    const useParallax = def.parallax ?? true

    // Same parallax mode → crossfade in place
    if (this._backgroundObj && duration > 0
      && this._backgroundIsParallax === useParallax
      && typeof (this._backgroundObj as any).transition === 'function') {
      ; (this._backgroundObj as any).transition(finalSrc, duration)
      return this
    }

    if (this._backgroundObj) {
      this._backgroundObj.remove()
      this._objects.delete(this._backgroundObj)
      this._backgroundObj = null
    }

    this._backgroundIsParallax = useParallax
    const zPos = options?.transform?.position?.z ?? this.depth

    const cam = this.world.camera as any
    const ratio = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(zPos, 1) : 1

    // 패닝에 대비한 화면 여백 수학적 계산 (캐릭터 far-right가 width * 0.4 에 위치함. focus 시 약간 더 이동 가능)
    const maxCameraX = this.width * 0.4
    // Y 포커스의 최대 편차 고려 (위아래 0.5)
    const maxCameraY = this.height * 0.5

    const exactViewW = this.width + maxCameraX * 2
    const exactViewH = this.height + maxCameraY * 2

    // [핵심 변경] depth 깊이(예: 2000)가 클 경우, width 자체를 무지막지하게 키우면 
    // HTML/Canvas 텍스처 할당 시 끔찍한 OOM(Out of Memory) 렉이 발생합니다.
    // 따라서 원본 base resolution을 유지한 채 렌더러의 transform.scale 로 스케일링합니다.

    const bgOpts = {
      attribute: { src: finalSrc, ...options?.attribute },
      style: { width: exactViewW, height: exactViewH, zIndex: Z_INDEX.BACKGROUND, ...options?.style },
      transform: {
        position: { x: 0, y: 0, z: zPos },
        scale: { x: ratio, y: ratio, z: 1 },
        ...options?.transform
      },
      ...options
    }

    const bg = isVideo
      ? (() => { const v = this.world.createVideo(bgOpts as any); v.play(); return v })()
      : this.world.createImage(bgOpts as any)

    if (useParallax) {
      if (duration > 0 && typeof (bg as any).fadeIn === 'function') (bg as any).fadeIn(duration)
      this._backgroundObj = this._track(bg)
    } else {
      this.world.camera?.addChild(bg)
      if (duration > 0 && typeof (bg as any).fadeIn === 'function') (bg as any).fadeIn(duration)
      this._backgroundObj = this._track(bg)
    }
    return this
  }

  // -----------------------------------------------------------
  // Mood
  // -----------------------------------------------------------

  /** Apply a mood colour/vignette overlay on the character plane. */
  setMood(mood: MoodType = 'none', intensity: number = 1, duration: number = 800, overrides?: Partial<RectangleOptions>): this {
    if (this._moodObj) {
      if ((this._moodObj as any)._currentMood === mood) {
        // 동일 무드, intensity만 변경
        if (duration > 0) {
          this._moodObj.animate({ style: { opacity: intensity } }, duration, 'easeInOutQuad')
        } else {
          this._moodObj.style.opacity = intensity
        }
        return this
      } else {
        const oldObj = this._moodObj
        if (duration > 0) {
          oldObj.animate({ style: { opacity: 0 } }, duration, 'easeOut')
            .on('end', () => { oldObj.remove(); this._objects.delete(oldObj) })
        } else {
          oldObj.remove()
          this._objects.delete(oldObj)
        }
        this._moodObj = null
      }
    }
    if (mood === 'none') return this

    const { color, vignette, blendMode } = MOOD_PRESETS[mood]
    const focalLength = this.world.camera?.attribute?.focalLength ?? 100
    const exactW = this.world.camera!.calcDepthRatio(focalLength, this.width)
    const exactH = this.world.camera!.calcDepthRatio(focalLength, this.height)

    const rect = this._track(this.world.createRectangle({
      attribute: overrides?.attribute,
      style: {
        color,
        opacity: 0, // 생성 시 투명
        gradient: vignette, gradientType: 'circular',
        // 카메라의 자식 객체이므로 X, Y 패닝 이동 시 화면에서 절대 벗어나지 않음.
        width: exactW,
        height: exactH,
        zIndex: Z_INDEX.MOOD,
        pointerEvents: false,
        blendMode: blendMode as any,
        ...overrides?.style
      },
      transform: { position: { x: 0, y: 0, z: this._characterPlaneLocalZ }, ...overrides?.transform },
      ...overrides
    }))
    this.world.camera?.addChild(rect)

      ; (rect as any)._currentMood = mood
    this._moodObj = rect

    if (duration > 0) {
      rect.animate({ style: { opacity: intensity } }, duration, 'easeInOutQuad')
    } else {
      rect.style.opacity = intensity
    }
    return this
  }

  // -----------------------------------------------------------
  // Characters
  // -----------------------------------------------------------

  /**
   * Show a character at the given position.
   * - **New character**: creates and fades in.
   * - **Existing character (same key)**: animates to the new position;
   *   if `imageKey` differs from current, crossfades the image.
   *
   * @param key      Character key (from defineCharacter — type-safe)
   * @param position Position preset or 'n/m' fraction
   * @param imageKey Image variant (from the character's images map — type-safe). Defaults to first image.
   */
  showCharacter<K extends keyof TC & string>(
    key: K,
    position: CharacterPositionPreset = 'center',
    imageKey?: keyof TC[K] & string
  ): this {
    const def = this._charDefs[key]
    if (!def) return this

    const resolvedKey = imageKey ?? (Object.keys(def)[0] as string)
    const imageDef = def[resolvedKey]
    const src = imageDef.src ?? resolvedKey
    const xPos = this.width * (this._resolvePositionX(position) - 0.5)
    // 캐릭터 생성 기준 평면을 focalLength 로 고정합니다.
    const zPos = this.world.camera?.attribute?.focalLength ?? 100

    const existing = this._characters.get(key)
    if (existing) {
      // Move to new x position
      existing.animate({ transform: { position: { x: xPos } } }, 400, 'easeInOutQuad')
      // Change image if specified
      if (imageKey) {
        if (typeof (existing as any).transition === 'function') {
          ; (existing as any).transition(src, 300)
        } else if ((existing as any).attribute) {
          ; (existing as any).attribute.src = src
        }
      }
      ;(existing as any)._currentImageKey = resolvedKey
    } else {
      const targetW = imageDef.width ?? 500
      const img = this._track(this.world.createImage({
        attribute: { src },
        style: { width: targetW, zIndex: Z_INDEX.CHARACTER_NORMAL },
        transform: { position: { x: xPos, y: 0, z: zPos } }
      }))
      if (typeof (img as any).fadeIn === 'function') (img as any).fadeIn(400)
      ;(img as any)._currentImageKey = resolvedKey
      this._characters.set(key, img)
    }
    return this
  }

  /** Remove a character with fade-out. */
  removeCharacter<K extends keyof TC & string>(key: K, duration: number = 600): this {
    const obj = this._characters.get(key)
    if (obj) {
      this._characters.delete(key)
      if (duration > 0 && typeof obj.fadeOut === 'function') {
        obj.fadeOut(duration)
        setTimeout(() => { obj.remove(); this._objects.delete(obj) }, duration)
      } else {
        obj.remove(); this._objects.delete(obj)
      }
    }
    return this
  }

  /**
   * Pan + zoom the camera to focus on a specific character.
   * Uses the character's `points` from defineCharacter.
   */
  focusCharacter<K extends keyof TC & string>(
    key: K,
    pointKey?: string,
    zoomPreset: ZoomPreset = 'close-up',
    duration: number = 800
  ): this {
    const target = this._characters.get(key)
    if (!target) return this

    const def = this._charDefs[key]
    const activeImageKey = (target as any)._currentImageKey ?? Object.keys(def)[0]
    const imageDef = def[activeImageKey as keyof typeof def]

    const fp = (pointKey && imageDef?.points) ? imageDef.points[pointKey] : { x: 0.5, y: 0.5 }

    const targetX = (target as any).transform?.position?.x ?? 0
    const targetZ = (target as any).transform?.position?.z ?? (this.world.camera?.attribute?.focalLength ?? 100)
    const charW = (target as any).style?.width ?? 500
    const renderedH = (target as any).__renderedSize?.h
    const charH = (renderedH && renderedH > 0) ? renderedH : (charW * 2)

    const panX = targetX + charW * (fp.x - 0.5)
    const panY = charH * (0.5 - fp.y)

    this.panCamera('custom', duration, panX, panY)
    this.zoomCamera(zoomPreset, duration)
    return this
  }

  /** Brings character to front UI layer as a cut-in */
  highlightCharacter<K extends keyof TC & string>(key: K): this {
    const target = this._characters.get(key)
    if (!target) return this

    // 이미 하이라이트 된 상태인지 확인
    if ((target as any)._originalTransform) return this

      // 기존 월드 좌표 및 부모 복원을 위한 백업
      ; (target as any)._originalTransform = {
        x: target.transform.position.x,
        y: target.transform.position.y,
        z: target.transform.position.z,
        zIndex: target.style.zIndex
      }

    // Camera 자식(UI 객체)으로 편입 (addChild 시 자동 이전 parent에서 해제됨)
    this.world.camera?.addChild(target)

    target.style.zIndex = Z_INDEX.CHARACTER_CUTIN
    return this
  }

  /** Restores character from cut-in to normal world plane */
  unhighlightCharacter<K extends keyof TC & string>(key: K): this {
    const target = this._characters.get(key)
    if (!target) return this

    const orig = (target as any)._originalTransform
    if (!orig) return this

    // Camera 자식에서 해제 (parent = null이 되며 월드 루트 객체로 환원됨)
    this.world.camera?.removeChild(target)

    target.transform.position.x = orig.x
    target.transform.position.y = orig.y
    target.transform.position.z = orig.z
    target.style.zIndex = orig.zIndex

    delete (target as any)._originalTransform
    return this
  }

  // -----------------------------------------------------------
  // Lighting
  // -----------------------------------------------------------

  /** Add a light effect. Identified by preset (one active light per preset). */
  addLight(preset: LightPreset = 'ambient', overrides?: Partial<RectangleOptions>): this {
    const p = LIGHT_PRESETS[preset]
    if (this._lightObjs.has(preset)) this.removeLight(preset)

    const focalLength = this.world.camera?.attribute?.focalLength ?? 100
    const exactW = this.world.camera!.calcDepthRatio(focalLength, this.width)
    const exactH = this.world.camera!.calcDepthRatio(focalLength, this.height)

    const rect = this._track(this.world.createRectangle({
      attribute: overrides?.attribute,
      style: {
        color: p.color,
        width: exactW,
        height: exactH,
        opacity: p.opacity, zIndex: Z_INDEX.LIGHT, pointerEvents: false, blendMode: 'screen',
        ...overrides?.style
      },
      transform: { position: { x: 0, y: 0, z: this._characterPlaneLocalZ }, ...overrides?.transform },
      ...overrides
    }))
    this.world.camera?.addChild(rect)
    this._lightObjs.set(preset, rect)
    return this
  }

  /** Remove a light by its preset key. */
  removeLight(preset: LightPreset, duration: number = 600): this {
    const obj = this._lightObjs.get(preset)
    if (obj) {
      this._lightObjs.delete(preset)
      if (duration > 0 && typeof obj.fadeOut === 'function') {
        obj.fadeOut(duration)
        setTimeout(() => { obj.remove(); this._objects.delete(obj) }, duration)
      } else {
        obj.remove(); this._objects.delete(obj)
      }
    }
    return this
  }

  /**
   * Apply a flickering effect to a light.
   * @param lightPreset   Which light (its addLight preset key)
   * @param flickerPreset Flicker style
   */
  setFlicker(lightPreset: LightPreset, flickerPreset: FlickerPreset = 'candle'): this {
    const target = this._lightObjs.get(lightPreset) ?? Array.from(this._lightObjs.values()).pop()
    if (!target) return this

    this._flickerObj = null
    const baseOpacity = (target as any)._flickerBaseOpacity ?? target.style.opacity ?? 1
      ; (target as any)._flickerBaseOpacity = baseOpacity

    const configs: Record<FlickerPreset, { interval: number, range: [number, number] }> = {
      candle: { interval: 120, range: [0.6, 1.0] },
      flicker: { interval: 80, range: [0.3, 1.0] },
      strobe: { interval: 60, range: [0.0, 1.0] }
    }
    const cfg = configs[flickerPreset]
    this._flickerObj = target

    const step = () => {
      if (this._flickerObj !== target) {
        target.animate({ style: { opacity: baseOpacity } }, 300, 'easeInOutQuad')
        return
      }
      const [min, max] = cfg.range
      const next = baseOpacity * (min + Math.random() * (max - min))
      target.animate({ style: { opacity: next } }, cfg.interval, 'linear').on('end', step)
    }
    step()
    return this
  }

  // -----------------------------------------------------------
  // Text overlays
  // -----------------------------------------------------------

  /** Add a text overlay (one per preset). */
  addOverlay(text: string, preset: OverlayPreset = 'caption', overrides?: any): this {
    const p = OVERLAY_PRESETS[preset]
    if (this._overlayObjs.has(preset)) this.removeOverlay(preset)

    const yMap: Record<'top' | 'center' | 'bottom', number> = {
      top: this.height * 0.1,
      center: this.height * 0.5,
      bottom: this.height * 0.85
    }
    const cam = this.world.camera as any
    const pos = cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(this.width / 2, yMap[p.y])
      : { x: 0, y: 0, z: 100 }

    const textObj = this._track(this.world.createText({
      attribute: { text, ...overrides?.attribute },
      style: {
        fontSize: p.fontSize, color: p.color, opacity: p.opacity,
        zIndex: p.zIndex, pointerEvents: false,
        ...overrides?.style
      },
      transform: { position: pos, ...overrides?.transform },
      ...overrides
    }))
    this.world.camera?.addChild(textObj)
    this._overlayObjs.set(preset, textObj)
    return this
  }

  /** Remove a text overlay by preset key. */
  removeOverlay(preset: OverlayPreset, duration: number = 600): this {
    const obj = this._overlayObjs.get(preset)
    if (obj) {
      this._overlayObjs.delete(preset)
      if (duration > 0 && typeof obj.fadeOut === 'function') {
        obj.fadeOut(duration)
        setTimeout(() => { obj.remove(); this._objects.delete(obj) }, duration)
      } else {
        obj.remove(); this._objects.delete(obj)
      }
    }
    return this
  }

  /** Remove all text overlays. */
  clearOverlay(duration: number = 400): this {
    const keys = Array.from(this._overlayObjs.keys()) as OverlayPreset[]
    keys.forEach(k => this.removeOverlay(k, duration))
    return this
  }

  // -----------------------------------------------------------
  // Camera
  // -----------------------------------------------------------

  /** Zoom camera using a preset or custom scale. */
  zoomCamera(preset: ZoomPreset = 'reset', duration?: number, overrideScale?: number): this {
    const cam = this.world.camera
    if (!cam) return this
    const { scale, duration: pd } = ZOOM_PRESETS[preset]
    const finalScale = overrideScale ?? scale
    const finalDur = duration ?? pd
    const baseDist = cam.attribute?.focalLength ?? 100
    const charAreaZ = baseDist

    // 카메라의 새로운 Z축 위치 = 캐릭터 위치(charAreaZ) - 줄어든 거리(baseDist / finalScale)
    const newZ = charAreaZ - (baseDist / finalScale)

    cam.animate({ transform: { position: { z: newZ } } }, finalDur, 'easeInOutQuad')

    // 무드 등 UI 패널이 함께 이동하지 않도록 캐릭터 Z평면에 묶어두는 역동기화 거리
    const localZ = charAreaZ - newZ

    // 도착 시점(새로운 Z)에서의 정확한 면적 사전 계산
    // cam.calcDepthRatio는 '현재' 카메라 Z를 기준으로 하므로, 미리 미래 시점의 depth 계산
    const depthAtDest = charAreaZ - newZ
    const scaleAtDest = baseDist / depthAtDest
    const exactW = this.width / scaleAtDest
    const exactH = this.height / scaleAtDest

    if (this._moodObj) {
      this._moodObj.animate({
        transform: { position: { z: localZ } },
        style: { width: exactW, height: exactH }
      }, finalDur, 'easeInOutQuad')
    }
    for (const light of this._lightObjs.values()) {
      light.animate({
        transform: { position: { z: localZ } },
        style: { width: exactW, height: exactH }
      }, finalDur, 'easeInOutQuad')
    }

    return this
  }

  /** Pan camera to a preset position or custom world coordinates. */
  panCamera(preset: PanPreset | 'custom', duration?: number, customX?: number, customY?: number): this {
    const cam = this.world.camera
    if (!cam) return this
    let x: number, y: number, dur: number
    if (preset === 'custom') {
      x = customX ?? 0; y = customY ?? 0; dur = duration ?? 800
    } else {
      const p = PAN_PRESETS[preset]
      x = customX ?? p.x; y = customY ?? p.y; dur = duration ?? p.duration
    }
    cam.animate({ transform: { position: { x, y } } }, dur, 'easeInOutQuad')
    return this
  }

  /** Apply a camera effect using predefined presets. */
  cameraEffect(preset: CameraEffectPreset = 'shake', duration?: number, intensity?: number): this {
    const cam = this.world.camera
    if (!cam) return this
    const { intensity: pi, duration: pd } = CAMERA_EFFECT_PRESETS[preset]
    const finalIntensity = intensity ?? pi
    const finalDuration = duration ?? pd
    const baseX = cam.transform.position.x
    const baseY = cam.transform.position.y
    const baseZ = cam.transform.position.z

    if (preset === 'shake') {
      const steps = Math.floor(finalDuration / 50)
      let i = 0
      const run = () => {
        if (i >= steps) { cam.animate({ transform: { position: { x: baseX, y: baseY } } }, 100, 'easeOut'); return }
        const dx = (Math.random() - 0.5) * finalIntensity * 2
        const dy = (Math.random() - 0.5) * finalIntensity * 2
        cam.animate({ transform: { position: { x: baseX + dx, y: baseY + dy } } }, 50, 'linear').on('end', run)
        i++
      }
      run()
    } else if (preset === 'bounce') {
      const steps = Math.floor(finalDuration / 100)
      let i = 0
      const run = () => {
        if (i >= steps) { cam.animate({ transform: { position: { y: baseY } } }, 100, 'easeOut'); return }
        const dy = i % 2 === 0 ? finalIntensity : 0
        cam.animate({ transform: { position: { y: baseY + dy } } }, 100, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'wave') {
      const steps = Math.floor(finalDuration / 50)
      let i = 0
      const run = () => {
        if (i >= steps) { cam.animate({ transform: { position: { x: baseX, y: baseY } } }, 100, 'easeOut'); return }
        const t = (i / steps) * Math.PI * 4 // 2 waves
        const dx = Math.sin(t) * finalIntensity
        const dy = Math.cos(t) * finalIntensity * 0.5
        cam.animate({ transform: { position: { x: baseX + dx, y: baseY + dy } } }, 50, 'linear').on('end', run)
        i++
      }
      run()
    } else if (preset === 'nod') {
      const steps = 4
      let i = 0
      const run = () => {
        if (i >= steps) { cam.animate({ transform: { position: { y: baseY } } }, 100, 'easeOut'); return }
        const dy = i % 2 === 0 ? -finalIntensity : 0
        cam.animate({ transform: { position: { y: baseY + dy } } }, finalDuration / steps, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'shake-x') {
      const steps = 4
      let i = 0
      const run = () => {
        if (i >= steps) { cam.animate({ transform: { position: { x: baseX } } }, 100, 'easeOut'); return }
        const dx = (i % 2 === 0) ? finalIntensity : -finalIntensity
        cam.animate({ transform: { position: { x: baseX + dx } } }, finalDuration / steps, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'fall') {
      const dropY = finalIntensity * 3
      cam.animate({ transform: { position: { y: baseY - dropY }, rotation: { z: finalIntensity } } }, finalDuration * 0.6, 'easeOutElastic')
        .on('end', () => {
          setTimeout(() => {
            cam.animate({ transform: { position: { y: baseY }, rotation: { z: 0 } } }, finalDuration * 0.4, 'easeInOutQuad')
          }, 300)
        })
    }
    return this
  }

  // -----------------------------------------------------------
  // Screen transitions
  // -----------------------------------------------------------

  /** Fade in or out. */
  screenFade(dir: 'in' | 'out', preset: FadeColorPreset = 'black', duration: number = 600): this {
    const { color, easing } = FADE_PRESETS[preset]
    const rect = this._getTransitionRect(color)
    rect.animate({ style: { opacity: dir === 'out' ? 1 : 0 } }, duration, easing)
    return this
  }

  /** Quick flash. */
  screenFlash(preset: FlashPreset = 'white'): this {
    const { color, duration } = FLASH_PRESETS[preset]
    const rect = this._getTransitionRect(color)
    rect.animate({ style: { opacity: 1 } }, duration / 2, 'easeOut')
      .on('end', () => rect.animate({ style: { opacity: 0 } }, duration / 2, 'easeIn'))
    return this
  }

  /** Wipe transition. */
  screenWipe(dir: 'in' | 'out', preset: WipePreset = 'left', duration: number = 800): this {
    const rect = this._getTransitionRect('rgba(0,0,0,1)')
    const w = this.world.canvas ? Math.max((this.world.canvas as any).width, this.width) : this.width
    const h = this.world.canvas ? Math.max((this.world.canvas as any).height, this.height) : this.height

    // 화면을 정확히 덮는 1배수 계산 (여백 배수 삭제)
    if (this.world.camera) {
      rect.style.width = this.world.camera.calcDepthRatio(10, w)
      rect.style.height = this.world.camera.calcDepthRatio(10, h)
      rect.transform.position.z = 10
    }
    const { x: dx, y: dy } = WIPE_PRESETS[preset]
    if (dir === 'out') {
      rect.transform.position.x = dx * w * 2
      rect.transform.position.y = dy * h * 2
      rect.style.opacity = 1
      rect.animate({ transform: { position: { x: 0, y: 0 } } }, duration, 'easeInOutQuad')
    } else {
      rect.transform.position.x = 0
      rect.transform.position.y = 0
      rect.style.opacity = 1
      rect.animate({ transform: { position: { x: dx * w * 2, y: dy * h * 2 } } }, duration, 'easeInOutQuad')
        .on('end', () => { rect.style.opacity = 0 })
    }
    return this
  }

  /** Convenience: fade from black to scene. */
  fadeIn(duration: number = 800): this {
    const rect = this._getTransitionRect('rgba(0,0,0,1)')
    rect.style.opacity = 1
    rect.animate({ style: { opacity: 0 } }, duration, 'easeInOut')
    return this
  }

  /** Convenience: fade scene to black. */
  fadeOut(duration: number = 800): this {
    const rect = this._getTransitionRect('rgba(0,0,0,1)')
    rect.style.opacity = 0
    rect.animate({ style: { opacity: 1 } }, duration, 'easeInOut')
    return this
  }

  // -----------------------------------------------------------
  // UI
  // -----------------------------------------------------------

  private _buildUINode(def: UiDef, id: string): LeviarObject {
    const nodeType = def.type ?? 'rectangle'

    const mergedMake = applyDefaults(def.make, {
      style: {
        color: nodeType === 'rectangle' ? 'transparent' : undefined,
        zIndex: Z_INDEX.UI_BASE, // 자동 배치 기본값
      },
      transform: {
        pivot: { x: 0, y: 0 },
        position: { x: 0, y: 0, z: 100 } // UI의 기본 Z-depth 및 x,y
      }
    }) as any

    if (mergedMake.transform?.position && this.world.camera && typeof (this.world.camera as any).canvasToLocal === 'function') {
      const pos = mergedMake.transform.position
      const px = pos.x ?? 0
      const py = pos.y ?? 0
      const pz = pos.z ?? 100

      const localPos = (this.world.camera as any).canvasToLocal(px, py, pz)
      mergedMake.transform.position = {
        x: localPos.x,
        y: localPos.y,
        z: localPos.z
      }
    }

    let uiNode: LeviarObject

    switch (nodeType) {
      case 'text':
        uiNode = this.world.createText(mergedMake)
        break
      case 'image':
        uiNode = this.world.createImage(mergedMake)
        break
      case 'video':
        uiNode = this.world.createVideo(mergedMake)
        break
      case 'sprite': {
        const spriteData = mergedMake.attribute?.sprite
        if (spriteData) {
          const clipName = `ui_auto_${id}`
          if (!this.world.spriteManager.get(clipName)) {
            this.world.spriteManager.create({
              name: clipName,
              src: mergedMake.attribute?.src ?? '',
              ...spriteData
            })
          }
          if (mergedMake.attribute) {
            mergedMake.attribute.src = clipName
          }
        }
        uiNode = this.world.createSprite(mergedMake)
        break
      }
      case 'particle': {
        uiNode = this.world.createParticle(mergedMake as any)
        break
      }
      case 'ellipse':
        uiNode = this.world.createEllipse(mergedMake)
        break
      case 'rectangle':
        uiNode = this.world.createRectangle(mergedMake)
        break
      default:
        throw new Error(`UI type "${nodeType}" is not supported.`)
    }

    if (def.on) {
      for (const [evtName, handler] of Object.entries(def.on)) {
        uiNode.on(evtName, handler)
      }
    }

    if (def.children) {
      for (const [childId, childDef] of Object.entries(def.children)) {
        const childNode = this._buildUINode(childDef, childId)
        uiNode.addChild(childNode)
      }
    }

    return uiNode
  }

  /** UI 요소를 페이드인 시킵니다. */
  fadeInUI<K extends keyof TU & string>(key: K, duration: number = 800): this {
    const obj = this._uiObjs.get(key)
    if (obj && typeof (obj as any).fadeIn === 'function') {
      ; (obj as any).fadeIn(duration)
    }
    return this
  }

  /** UI 요소를 페이드아웃 시킵니다 (제거하지 않음). 제거를 원한다면 removeUI를 사용하거나, fadeOut 메서드 콜백을 쓰십시오. */
  fadeOutUI<K extends keyof TU & string>(key: K, duration: number = 800): this {
    const obj = this._uiObjs.get(key)
    if (obj && typeof (obj as any).fadeOut === 'function') {
      ; (obj as any).fadeOut(duration)
    }
    return this
  }
}
