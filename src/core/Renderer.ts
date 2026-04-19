// =============================================================
// Renderer.ts — Leviar World 렌더 어댑터
// Visualnovel.ts의 렌더 메서드를 config-driven 구조로 이식한 파일입니다.
// =============================================================

import { World, Animation } from 'leviar'
import type { LeviarObject, EasingType } from 'leviar'
import type { NovelConfig, CharDefs, BgDefs, NovelUIOption } from '../types/config'
import type {
  MoodType, FlickerPreset, OverlayPreset,
  EffectType, ZoomPreset, PanPreset, CameraEffectPreset,
  BackgroundFitPreset, FadeColorPreset, FlashPreset, WipePreset,
  CharacterPositionPreset,
} from '../types/dialogue'

// =============================================================
// 내부 프리셋 룩업 테이블
// =============================================================

const Z_INDEX = {
  BACKGROUND: -1,
  CHARACTER_NORMAL: 10,
  CHARACTER_HIGHLIGHT: 100,
  MOOD: 100,
  LIGHT: 200,
  UI_BASE: 300,
  OVERLAY_WHISPER: 400,
  OVERLAY_CAPTION: 410,
  OVERLAY_TITLE: 420,
  CHARACTER_CUTIN: 500,
  TRANSITION: 999,
} as const

const CHARACTER_X_RATIO: Record<string, number> = {
  'far-left': 0.1,
  'left': 0.25,
  'center': 0.5,
  'right': 0.75,
  'far-right': 0.9,
}

const ZOOM_PRESETS: Record<Exclude<ZoomPreset, 'inherit'>, { scale: number; duration: number }> = {
  'close-up': { scale: 1.5, duration: 800 },
  'medium': { scale: 1.2, duration: 600 },
  'wide': { scale: 0.8, duration: 800 },
  'reset': { scale: 1.0, duration: 600 },
}

const PAN_PRESETS: Record<Exclude<PanPreset, 'inherit'>, { x: number; y: number; duration: number }> = {
  left: { x: -200, y: 0, duration: 1000 },
  right: { x: 200, y: 0, duration: 1000 },
  up: { x: 0, y: 200, duration: 1000 },
  down: { x: 0, y: -200, duration: 1000 },
  center: { x: 0, y: 0, duration: 1000 },
}

const CAMERA_EFFECT_PRESETS: Record<Exclude<CameraEffectPreset, 'reset'>, { intensity: number; duration: number }> = {
  shake: { intensity: 10, duration: 500 },
  bounce: { intensity: 15, duration: 600 },
  wave: { intensity: 20, duration: 1000 },
  nod: { intensity: 10, duration: 400 },
  'shake-x': { intensity: 15, duration: 500 },
  fall: { intensity: 15, duration: 800 },
}

const FADE_PRESETS: Record<Exclude<FadeColorPreset, 'inherit'>, { color: string; easing: EasingType }> = {
  black: { color: 'rgba(0,0,0,1)', easing: 'linear' },
  white: { color: 'rgba(255,255,255,1)', easing: 'linear' },
  red: { color: 'rgba(200,0,0,1)', easing: 'easeIn' },
  dream: { color: 'rgba(200,180,255,1)', easing: 'easeInOut' },
  sepia: { color: 'rgba(150,100,50,1)', easing: 'easeIn' },
}

const FLASH_PRESETS: Record<Exclude<FlashPreset, 'inherit'>, { color: string; duration: number }> = {
  white: { color: 'rgba(255,255,255,1)', duration: 300 },
  red: { color: 'rgba(255,0,0,1)', duration: 300 },
  yellow: { color: 'rgba(255,220,0,1)', duration: 250 },
}

const WIPE_PRESETS: Record<Exclude<WipePreset, 'inherit'>, { x: number; y: number }> = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: 1 },
  down: { x: 0, y: -1 },
}

const MOOD_PRESETS: Record<MoodType, { color: string; vignette?: string; blendMode?: string; defaultIntensity?: number }> = {
  day: { color: 'rgba(255,230,180,0.1)', vignette: 'transparent 70%, rgba(255,200,100,0.15) 100%', blendMode: 'screen' },
  night: { color: 'rgba(10,15,60,0.5)', vignette: 'transparent 50%, rgba(0,5,25,0.6) 100%', blendMode: 'multiply' },
  dawn: { color: 'rgba(25,35,70,0.4)', vignette: 'transparent 50%, rgba(65,122,164,0.6) 100%', blendMode: 'multiply' },
  sunset: { color: 'rgba(255,120,50,0.25)', vignette: 'transparent 50%, rgba(255,100,50,0.4) 100%', blendMode: 'screen' },
  foggy: { color: 'rgba(200,210,220,0.4)', vignette: 'rgba(255,255,255,0.05) 0%, rgba(150,160,170,0.4) 100%', blendMode: 'screen' },
  sepia: { color: 'rgba(160,110,50,0.3)', vignette: 'transparent 60%, rgba(80,50,20,0.5) 100%', blendMode: 'multiply' },
  cold: { color: 'rgba(80,130,220,0.25)', vignette: 'transparent 50%, rgba(20,40,100,0.4) 100%', blendMode: 'hard-light' },
  noir: { color: 'rgba(0,0,0,0.1)', vignette: 'transparent 50%, rgba(0,0,0,0.6) 100%', blendMode: 'luminosity' },
  horror: { color: 'rgba(150,0,0,0.3)', vignette: 'transparent 40%, rgba(0,0,0,0.7) 100%', blendMode: 'multiply' },
  flashback: { color: 'rgba(200,200,200,0.2)', vignette: 'transparent 60%, rgba(255,255,255,0.5) 100%', blendMode: 'screen' },
  dream: { color: 'rgba(180,150,255,0.2)', vignette: 'transparent 60%, rgba(255,200,255,0.4) 100%', blendMode: 'screen' },
  danger: { color: 'rgba(255,0,0,0.1)', vignette: 'transparent 50%, rgba(200,0,0,0.5) 100%', blendMode: 'color-burn' },
  none: { color: 'transparent' },
  spot: { color: 'radial-gradient(circle,rgba(255,240,180,0.8) 0%,transparent 70%)', blendMode: 'screen', defaultIntensity: 0.6 },
  ambient: { color: 'rgba(255,230,150,1)', blendMode: 'screen', defaultIntensity: 0.15 },
  warm: { color: 'rgba(255,160,50,1)', blendMode: 'screen', defaultIntensity: 0.25 },
}

const OVERLAY_PRESETS: Record<OverlayPreset, { fontSize: number; color: string; opacity: number; zIndex: number; y: 'top' | 'center' | 'bottom' }> = {
  caption: { fontSize: 24, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title: { fontSize: 48, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' },
}

const EFFECT_PARTICLE_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { attribute: { frictionAir: 0, gravityScale: 0.001 }, style: { width: 10, height: 10, blendMode: 'lighter' } },
  rain: { attribute: { gravityScale: 1 }, style: { width: 30, height: 60, opacity: 1, blendMode: 'screen' } },
  snow: { attribute: { gravityScale: 0.01, frictionAir: 0 }, style: { width: 15, height: 15, blendMode: 'lighter' } },
  sakura: { attribute: { gravityScale: 0.02, frictionAir: 0 }, style: { width: 16, height: 20, opacity: 0.8 } },
  sparkle: { attribute: { gravityScale: 0.1 }, style: { width: 16, height: 16, opacity: 0.8 } },
  fog: { attribute: { frictionAir: 0, gravityScale: 0.003 }, style: { width: 120, height: 120, blendMode: 'screen' } },
  leaves: { attribute: { gravityScale: 0.1, frictionAir: 0.05, strictPhysics: true }, style: { width: 20, height: 20, opacity: 0.9 } },
  fireflies: { attribute: { gravityScale: -0.02, frictionAir: 0.05, strictPhysics: true }, style: { width: 8, height: 8, opacity: 0.8, blendMode: 'lighter' } },
}

const EFFECT_CLIP_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { impulse: 0.05, lifespan: 10000, interval: 250, size: [[0.5, 1], [0, 0.5]], opacity: [[0, 0], [1, 1], [0, 0]], loop: true },
  rain: { impulse: 0, lifespan: 3000, interval: 40, size: [[0.1, 0.3], [0.1, 0.3]], opacity: [[1, 1], [1, 1]], loop: true },
  snow: { impulse: 0.01, lifespan: 10000, interval: 100, size: [[0.3, 0.8], [0, 0]], opacity: [[1, 1], [0, 0]], loop: true, angularImpulse: 0.001 },
  sakura: { impulse: 0.02, lifespan: 6000, interval: 300, size: [[0.5, 0.8], [0.3, 0.5]], loop: true, angularImpulse: 0.001 },
  sparkle: { impulse: 0.02, lifespan: 1500, interval: 150, size: [[0.5, 1], [0, 0.1]], loop: true },
  fog: { impulse: 0.01, lifespan: 15000, interval: 800, size: [[2, 2], [5, 10]], opacity: [[0, 0], [0.1, 0.2], [0, 0]], loop: true, angularImpulse: 0.0001 },
  leaves: { impulse: 0.08, lifespan: 7000, interval: 350, size: [[0.8, 1.2], [0.8, 1.2]], loop: true, angularImpulse: 0.05 },
  fireflies: { impulse: 0.03, lifespan: 5000, interval: 300, size: [[0.5, 1.5], [0, 0.5]], loop: true },
}

const DEFAULT_EFFECT_RATES: Partial<Record<EffectType, number>> = {
  dust: 5, rain: 200, snow: 8, sakura: 8, sparkle: 10, fog: 4, leaves: 5, fireflies: 5,
}

// =============================================================
// 렌더 상태 스냅샷 (씬 전환 시 이어받기)
// =============================================================

/** 세이브/복원용 카메라 상태 */
export interface CameraState {
  x: number
  y: number
  z: number
}

export interface RendererState {
  backgroundKey: string | null
  backgroundParallax: boolean
  activeMoods: Array<{ mood: MoodType; intensity: number }>
  activeEffects: Array<{ type: EffectType; rate?: number; overrides?: Record<string, any>; srcKey?: string }>
  characters: Record<string, { position: string; imageKey: string }>
  /** 카메라 위치/줌 상태 */
  cameraState: CameraState
  /** 플리커 상태 (null = 비활성) */
  flicker: { mood: MoodType; preset: FlickerPreset } | null
}

// =============================================================
// RendererOption
// =============================================================

export interface RendererOption {
  width: number
  height: number
  depth: number
  /** UI 스타일 커스터마이징 */
  ui?: NovelUIOption
}

// =============================================================
// Renderer 클래스
// =============================================================

export class Renderer {
  readonly world: World
  public readonly config: NovelConfig<any, any, any, any>
  protected readonly width: number
  protected readonly height: number
  protected readonly depth: number
  protected readonly _ui: NovelUIOption | undefined

  private _objects: Set<LeviarObject> = new Set()
  private _characters: Map<string, LeviarObject> = new Map()
  private _effects: Map<string, LeviarObject> = new Map()
  private _backgroundObj: LeviarObject | null = null
  private _backgroundIsParallax: boolean = true
  private _backgroundKey: string | null = null
  private _moodObjs: Map<MoodType, LeviarObject> = new Map()
  private _activeMoods: Map<MoodType, number> = new Map()
  private _transitionObj: LeviarObject | null = null
  private _overlayObjs: Map<string, LeviarObject> = new Map()
  private _flickerObj: LeviarObject | null = null
  private _flickerState: { mood: MoodType; preset: FlickerPreset } | null = null
  private _characterStates: Map<string, { position: string; imageKey: string }> = new Map()
  private _activeEffects: Map<EffectType, { rate?: number; overrides?: Record<string, any>; srcKey?: string }> = new Map()
  /** 스킵 모드 플래그. true 시 모든 animate duration을 0으로 처리 */
  private _isSkipping: boolean = false

  // ─── 카메라 애니메이션 추적 (중단/snap 처리용) ──────────────
  private _activeCamPanAnim: Animation | null = null
  private _activeCamPanTarget: { x: number; y: number } | null = null
  private _activeCamZoomAnim: Animation | null = null
  private _activeCamZoomTarget: { z: number } | null = null
  private _activeCamEffectStop: (() => void) | null = null

  // ─── 카메라 변환 합성용 ─────────────────────────────────────
  private _camBaseObj: LeviarObject | null = null
  private _camOffsetObj: LeviarObject | null = null
  private _camSyncRafId: number | null = null

  // ─── inherit 처리를 위한 last-state 트래킹 ────────────────
  private _lastBackgroundFit: Exclude<BackgroundFitPreset, 'inherit'> = 'stretch'
  private _lastZoomPreset: Exclude<ZoomPreset, 'inherit'> = 'reset'
  private _lastPanPreset: Exclude<PanPreset, 'inherit'> = 'center'
  private _lastFadePreset: Exclude<FadeColorPreset, 'inherit'> = 'black'
  private _lastFlashPreset: Exclude<FlashPreset, 'inherit'> = 'white'
  private _lastWipePreset: Exclude<WipePreset, 'inherit'> = 'left'

  constructor(world: World, config: NovelConfig<any, any, any, any>, option: RendererOption) {
    this.world = world
    this.config = config
    this.width = option.width
    this.height = option.height
    this.depth = option.depth
    this._ui = option.ui

    if (!this.world.camera) {
      this.world.camera = (this.world as any).createCamera()
    }
    this.world.camera!.transform.position.z = 0

    this._initCameraSync()
  }

  private _initCameraSync(): void {
    this._camBaseObj = this.world.createRectangle({
      style: { width: 0, height: 0, opacity: 0, pointerEvents: false } as any,
      transform: { position: { x: 0, y: 0, z: 0 } }
    })
    this._camOffsetObj = this.world.createRectangle({
      style: { width: 0, height: 0, opacity: 0, pointerEvents: false } as any,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { z: 0 } }
    })
    // Dummy 객체도 틱 업데이트를 받도록 카메라에 추가
    this.world.camera?.addChild(this._camBaseObj as any)
    this.world.camera?.addChild(this._camOffsetObj as any)

    const syncLoop = () => {
      if (this.world.camera && this._camBaseObj && this._camOffsetObj) {
        this.world.camera.transform.position.x = this._camBaseObj.transform.position.x + this._camOffsetObj.transform.position.x
        this.world.camera.transform.position.y = this._camBaseObj.transform.position.y + this._camOffsetObj.transform.position.y
        this.world.camera.transform.position.z = this._camBaseObj.transform.position.z + this._camOffsetObj.transform.position.z
        if (this.world.camera.transform.rotation && this._camOffsetObj.transform.rotation) {
          this.world.camera.transform.rotation.z = this._camOffsetObj.transform.rotation.z
        }
      }
      this._camSyncRafId = requestAnimationFrame(syncLoop)
    }
    this._camSyncRafId = requestAnimationFrame(syncLoop)
  }

  // ─── 스킵 모드 ──────────────────────────────────────────────

  setSkipping(flag: boolean): void { this._isSkipping = flag }

  /**
   * 스킵 중이면 0, 아니면 원래 duration 반환.
   * animate 호출 시 반드시 이 메서드를 통해 duration을 결정합니다.
   */
  private _dur(d: number): number { return this._isSkipping ? 0 : d }

  /**
   * duration이 0일 때 animate 대신 직접 속성을 적용합니다.
   * animate 체이닝(.on('end'))이 필요한 경우 onEnd 콜백을 전달합니다.
   */
  private _animate(
    obj: any,
    props: any,
    duration: number,
    easing: EasingType = 'linear',
    onEnd?: () => void,
  ): Animation | null {
    const d = this._dur(duration)
    if (d === 0) {
      if (props.style) Object.assign(obj.style, props.style)
      if (props.transform?.position) Object.assign(obj.transform.position, props.transform.position)
      if (props.transform?.scale) Object.assign(obj.transform.scale, props.transform.scale)
      if (props.transform?.rotation) Object.assign(obj.transform.rotation, props.transform.rotation)
      onEnd?.()
      return null
    }
    const anim = (obj as any).animate(props, d, easing)
    if (onEnd) anim.on('end', onEnd)
    return anim
  }

  // ─── 내부 유틸 ──────────────────────────────────────────────

  private get _characterPlaneLocalZ(): number {
    const cam = this.world.camera
    const focalLength = (cam as any)?.attribute?.focalLength ?? 100
    return focalLength - (cam?.transform.position.z ?? 0)
  }

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
      const w = (this.world.canvas as any)?.width ?? this.width
      const h = (this.world.canvas as any)?.height ?? this.height
      const rect = this.world.createRectangle({
        style: {
          color, width: w * 2, height: h * 2,
          opacity: 0, zIndex: Z_INDEX.TRANSITION, pointerEvents: false,
        } as any,
        transform: { position: { x: 0, y: 0, z: 10 } },
      })
      this.world.camera?.addChild(rect)
      this._transitionObj = rect
    } else {
      (this._transitionObj as any).style.color = color
      this._transitionObj.transform.position.x = 0
      this._transitionObj.transform.position.y = 0
    }
    return this._transitionObj
  }

  // ─── 씬 전환 상태 스냅샷 / 복원 ────────────────────────────

  captureState(): RendererState {
    const cam = this.world.camera
    const activeMoodsArr = Array.from(this._activeMoods.entries()).map(([mood, intensity]) => ({ mood, intensity }))
    return {
      backgroundKey: this._backgroundKey,
      backgroundParallax: this._backgroundIsParallax,
      activeMoods: activeMoodsArr,
      activeEffects: Array.from(this._activeEffects.entries()).map(([type, data]) => ({ type, ...data })),
      characters: Object.fromEntries(this._characterStates),
      cameraState: {
        x: this._camBaseObj?.transform.position.x ?? cam?.transform.position.x ?? 0,
        y: this._camBaseObj?.transform.position.y ?? cam?.transform.position.y ?? 0,
        z: this._camBaseObj?.transform.position.z ?? cam?.transform.position.z ?? 0,
      },
      flicker: this._flickerState ? { ...this._flickerState } : null,
    }
  }

  restoreState(state: RendererState): void {
    if (state.backgroundKey) {
      this.setBackground(state.backgroundKey, 'stretch', 0)
    }

    // 하위 호환성 (과거 세이브 데이터)
    const oldState = state as any
    if (oldState.moodType && oldState.moodType !== 'none') {
      this.addMood(oldState.moodType, oldState.moodIntensity, 0)
    }
    if (oldState.activeLights) {
      oldState.activeLights.forEach((l: any) => this.addMood(l, undefined, 0))
    }

    if (state.activeMoods) {
      state.activeMoods.forEach(({ mood, intensity }) => this.addMood(mood, intensity, 0))
    }

    state.activeEffects.forEach((e: any) => {
      if (typeof e === 'string') {
        this.addEffect(e as EffectType)
      } else {
        this.addEffect(e.type as EffectType, e.rate, e.overrides, e.srcKey)
      }
    })
    if (state.characters) {
      Object.entries(state.characters).forEach(([name, { position, imageKey }]) => {
        this.showCharacter(name, position, imageKey)
      })
    }
    // 카메라 위치/줌 즉시 복원
    const cam = this.world.camera
    if (cam && state.cameraState) {
      if (this._camBaseObj) {
        this._camBaseObj.transform.position.x = state.cameraState.x
        this._camBaseObj.transform.position.y = state.cameraState.y
        this._camBaseObj.transform.position.z = state.cameraState.z
      }
      if (this._camOffsetObj) {
        this._camOffsetObj.transform.position.x = 0
        this._camOffsetObj.transform.position.y = 0
        this._camOffsetObj.transform.position.z = 0
        if (this._camOffsetObj.transform.rotation) this._camOffsetObj.transform.rotation.z = 0
      }
      cam.transform.position.x = state.cameraState.x
      cam.transform.position.y = state.cameraState.y
      cam.transform.position.z = state.cameraState.z
    }
    // 플리커 복원 (무드 복원 후 실행)
    if (state.flicker) {
      const moodKey = state.flicker.mood || (state.flicker as any).light
      this.setFlicker(moodKey, state.flicker.preset)
    }
  }

  /** 모든 씬 오브젝트를 제거한다 */
  clear(): void {
    this._objects.forEach(obj => (obj as any).remove?.())
    this._objects.clear()
    this._characters.clear()
    this._characterStates.clear()
    this._effects.clear()
    this._activeEffects.clear()
    this._backgroundObj = null
    this._backgroundKey = null
    this._moodObjs.forEach(o => { (o as any).remove?.(); this._objects.delete(o) })
    this._moodObjs.clear()
    this._activeMoods.clear()
    this._overlayObjs.forEach(o => { (o as any).remove?.(); this._objects.delete(o) })
    this._overlayObjs.clear()
    this._flickerObj = null
    this._flickerState = null
    if (this._camOffsetObj) {
      this._camOffsetObj.transform.position.x = 0
      this._camOffsetObj.transform.position.y = 0
      this._camOffsetObj.transform.position.z = 0
      if (this._camOffsetObj.transform.rotation) this._camOffsetObj.transform.rotation.z = 0
    }
  }

  // ─── 배경 ───────────────────────────────────────────────────

  setBackground(
    key: string,
    fit: BackgroundFitPreset = 'inherit',
    duration: number = 1000,
    isVideo: boolean = false,
  ): void {
    const resolvedFit = fit === 'inherit' ? this._lastBackgroundFit : fit
    this._lastBackgroundFit = resolvedFit
    const bgDefs = this.config.backgrounds as BgDefs
    const def = bgDefs[key]
    if (!def) return

    const useParallax = def.parallax ?? true
    this._backgroundKey = key
    const dur = this._dur(duration)

    // 동일 패럴낙스 모드 → 크로스페이드
    if (
      this._backgroundObj && dur > 0 &&
      this._backgroundIsParallax === useParallax &&
      typeof (this._backgroundObj as any).transition === 'function'
    ) {
      ; (this._backgroundObj as any).transition(def.src, dur)
      return
    }

    if (this._backgroundObj) {
      (this._backgroundObj as any).remove?.()
      this._objects.delete(this._backgroundObj)
      this._backgroundObj = null
    }

    this._backgroundIsParallax = useParallax
    const zPos = this.depth
    const cam = this.world.camera as any
    const ratio = cam && typeof cam.calcDepthRatio === 'function'
      ? cam.calcDepthRatio(zPos, 1)
      : 1

    const maxCamX = this.width * 0.4
    const maxCamY = this.height * 0.5
    const exactViewW = this.width + maxCamX * 2
    const exactViewH = this.height + maxCamY * 2

    const bgOpts = {
      attribute: { src: def.src },
      style: { width: exactViewW, height: exactViewH, zIndex: Z_INDEX.BACKGROUND } as any,
      transform: {
        position: { x: 0, y: 0, z: zPos },
        scale: { x: ratio, y: ratio, z: 1 },
      },
    }

    const bg = isVideo
      ? (() => { const v = this.world.createVideo(bgOpts as any); (v as any).play?.(); return v })()
      : this.world.createImage(bgOpts as any)

    if (!useParallax) this.world.camera?.addChild(bg as any)
    if (dur > 0 && typeof (bg as any).fadeIn === 'function') (bg as any).fadeIn(dur)
    this._backgroundObj = this._track(bg as any)
  }

  // ─── 무드 ───────────────────────────────────────────────────

  addMood(mood: MoodType, intensity?: number, duration: number = 800): void {
    if (mood === 'none') {
      this.clearMoods(duration)
      return
    }

    const { color, vignette, blendMode, defaultIntensity } = MOOD_PRESETS[mood]
    const finalIntensity = intensity ?? defaultIntensity ?? 1
    const dur = this._dur(duration)

    const existing = this._moodObjs.get(mood)
    if (existing) {
      if (this._flickerState && this._flickerState.mood === mood) {
        (existing as any)._flickerBaseOpacity = finalIntensity
      } else {
        this._animate(existing, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
      }
      this._activeMoods.set(mood, finalIntensity)
      return
    }

    const cam = this.world.camera as any
    const focalLength = cam?.attribute?.focalLength ?? 100
    const exactW = cam && typeof cam.calcDepthRatio === 'function'
      ? cam.calcDepthRatio(focalLength, this.width) : this.width
    const exactH = cam && typeof cam.calcDepthRatio === 'function'
      ? cam.calcDepthRatio(focalLength, this.height) : this.height

    const rectOpts: any = {
      style: {
        color, opacity: dur > 0 ? 0 : finalIntensity,
        width: exactW, height: exactH,
        zIndex: Z_INDEX.MOOD,
        pointerEvents: false,
        blendMode: blendMode as any,
      },
      transform: { position: { x: 0, y: 0, z: this._characterPlaneLocalZ } },
    }
    if (vignette) {
      rectOpts.style.gradient = vignette
      rectOpts.style.gradientType = 'circular'
    }

    const rect = this._track(this.world.createRectangle(rectOpts))
    this.world.camera?.addChild(rect as any)
      ; (rect as any)._currentMood = mood
    this._moodObjs.set(mood, rect as any)
    this._activeMoods.set(mood, finalIntensity)

    if (dur > 0) {
      this._animate(rect, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
    }
  }

  removeMood(mood: MoodType, duration: number = 800): void {
    const obj = this._moodObjs.get(mood)
    this._activeMoods.delete(mood)
    if (obj) {
      this._moodObjs.delete(mood)
      const dur = this._dur(duration)
      if (dur > 0 && typeof (obj as any).fadeOut === 'function') {
        (obj as any).fadeOut(dur)
        setTimeout(() => { (obj as any).remove?.(); this._objects.delete(obj) }, dur)
      } else {
        (obj as any).remove?.(); this._objects.delete(obj)
      }
    }
  }

  clearMoods(duration: number = 800): void {
    const moods = Array.from(this._moodObjs.keys())
    moods.forEach(m => this.removeMood(m, duration))
  }

  // ─── 이펙트 ─────────────────────────────────────────────────

  addEffect(type: EffectType = 'dust', rate?: number, overrides?: Record<string, any>, srcKey?: string): void {
    const preset = EFFECT_PARTICLE_PRESETS[type]
    const finalRate = rate ?? DEFAULT_EFFECT_RATES[type] ?? 10
    const clipName = `${type}_rate_${finalRate}_${srcKey ?? 'default'}`
    const particleZ = this.depth / 2

    if (!(this.world as any).particleManager.get(clipName)) {
      const clipBase = EFFECT_CLIP_PRESETS[type]
      const cam = this.world.camera as any
      const ratio = cam && typeof cam.calcDepthRatio === 'function'
        ? cam.calcDepthRatio(particleZ, 1) : 1
      const maxPanX = this.width * 0.4
      const maxPanY = this.height * 0.5
      const spanW = (this.width + maxPanX * 2) * ratio
      const spanH = (this.height + maxPanY * 2) * ratio

        ; (this.world as any).particleManager.create({
          name: clipName, src: srcKey ?? type,
          ...clipBase,
          rate: finalRate,
          spawnX: spanW, spawnY: spanH, spawnZ: particleZ,
        })
    }

    const existing = this._effects.get(type)
    if (existing) {
      if (rate !== undefined || srcKey !== undefined) {
        (existing as any).attribute.src = clipName
      }
      if (overrides?.style) {
        Object.assign((existing as any).style, overrides.style)
      }
      return
    }

    this._activeEffects.set(type, { rate, overrides, srcKey })

    const particle = this._track(this.world.createParticle({
      attribute: { ...preset.attribute, src: clipName, ...overrides?.attribute },
      style: { ...preset.style, ...overrides?.style },
      transform: { position: { x: 0, y: 0, z: particleZ }, ...overrides?.transform },
    } as any))
    this._effects.set(type, particle as any)
      ; (particle as any).play?.()
  }

  removeEffect(type: EffectType, duration: number = 600): void {
    const effect = this._effects.get(type)
    this._activeEffects.delete(type)
    if (effect) {
      this._effects.delete(type)
      if (duration > 0 && typeof (effect as any).fadeOut === 'function') {
        (effect as any).fadeOut(duration)
        setTimeout(() => { (effect as any).remove?.(); this._objects.delete(effect) }, duration)
      } else {
        (effect as any).remove?.(); this._objects.delete(effect)
      }
    }
  }

  // ─── 조명 ───────────────────────────────────────────────────

  setFlicker(mood: MoodType, flickerPreset: FlickerPreset = 'candle'): void {
    const target = this._moodObjs.get(mood)
    if (!target) return

    this._flickerObj = null
    const finalIntensity = this._activeMoods.get(mood) ?? 1
    const baseOpacity = finalIntensity
      ; (target as any)._flickerBaseOpacity = baseOpacity

    const configs: Record<FlickerPreset, { interval: number; range: [number, number] }> = {
      candle: { interval: 120, range: [0.6, 1.0] },
      flicker: { interval: 80, range: [0.3, 1.0] },
      strobe: { interval: 60, range: [0.0, 1.0] },
    }
    const cfg = configs[flickerPreset]
    this._flickerObj = target
    this._flickerState = { mood, preset: flickerPreset }

    const step = () => {
      if (this._flickerObj !== target) {
        (target as any).animate({ style: { opacity: baseOpacity } }, 300, 'easeInOutQuad')
        return
      }
      const [min, max] = cfg.range
      const next = baseOpacity * (min + Math.random() * (max - min))
        ; (target as any).animate({ style: { opacity: next } }, cfg.interval, 'linear').on('end', step)
    }
    step()
  }

  // ─── 오버레이 ────────────────────────────────────────────────

  addOverlay(text: string, preset: OverlayPreset = 'caption'): void {
    const defaults = OVERLAY_PRESETS[preset]
    // NovelUIOption.overlay 설정으로 오버라이드
    const uiOv = this._ui?.overlay?.[preset] ?? {}
    const p = {
      fontSize: uiOv.fontSize ?? defaults.fontSize,
      color: uiOv.color ?? defaults.color,
      opacity: uiOv.opacity ?? defaults.opacity,
      zIndex: defaults.zIndex,
      y: defaults.y,
      fontWeight: (uiOv as any).fontWeight,
      fontFamily: (uiOv as any).fontFamily,
      lineHeight: (uiOv as any).lineHeight,
    }
    if (this._overlayObjs.has(preset)) this.removeOverlay(preset)

    const yMap: Record<string, number> = {
      top: this.height * 0.1,
      center: this.height * 0.5,
      bottom: this.height * 0.85,
    }
    const cam = this.world.camera as any
    const pos = cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(this.width / 2, yMap[p.y])
      : { x: 0, y: 0, z: 100 }

    const textObj = this._track(this.world.createText({
      attribute: { text } as any,
      style: {
        fontSize: p.fontSize,
        fontWeight: p.fontWeight,
        fontFamily: p.fontFamily,
        lineHeight: p.lineHeight,
        color: p.color,
        opacity: p.opacity,
        zIndex: p.zIndex,
        pointerEvents: false,
      } as any,
      transform: { position: pos },
    }))
    this.world.camera?.addChild(textObj as any)
    this._overlayObjs.set(preset, textObj as any)
  }

  removeOverlay(preset: OverlayPreset, duration: number = 600): void {
    const obj = this._overlayObjs.get(preset)
    if (obj) {
      this._overlayObjs.delete(preset)
      if (duration > 0 && typeof (obj as any).fadeOut === 'function') {
        (obj as any).fadeOut(duration)
        setTimeout(() => { (obj as any).remove?.(); this._objects.delete(obj) }, duration)
      } else {
        (obj as any).remove?.(); this._objects.delete(obj)
      }
    }
  }

  clearOverlay(duration: number = 400): void {
    Array.from(this._overlayObjs.keys()).forEach(k => this.removeOverlay(k as OverlayPreset, duration))
  }

  // ─── 캐릭터 ─────────────────────────────────────────────────

  showCharacter(name: string, position?: CharacterPositionPreset, imageKey?: string, duration?: number): void {
    const charDefs = this.config.characters as CharDefs
    const def = charDefs[name]
    if (!def) return

    const resolvedKey = imageKey ?? Object.keys(def)[0]
    const imageDef = def[resolvedKey]
    if (!imageDef) return

    // 'inherit' 또는 미지정 → 기존 _characterStates 위치 상속. 신규 캐릭터면 'center' fallback
    const existingState = this._characterStates.get(name)
    const resolvedPosition = (!position || position === 'inherit')
      ? (existingState?.position ?? 'center')
      : position

    const src = imageDef.src ?? resolvedKey
    const xPos = this.width * (this._resolvePositionX(resolvedPosition) - 0.5)
    const zPos = (this.world.camera as any)?.attribute?.focalLength ?? 100

    this._characterStates.set(name, { position: resolvedPosition, imageKey: resolvedKey })

    const existing = this._characters.get(name)
    if (existing) {
      this._animate(existing, { transform: { position: { x: xPos } } }, this._dur(duration ?? 400), 'easeInOutQuad')
      if (imageKey) {
        this._dur(duration ?? 300) > 0 && typeof (existing as any).transition === 'function'
          ? (existing as any).transition(src, this._dur(duration ?? 300))
          : ((existing as any).attribute && ((existing as any).attribute.src = src))
      }
      ; (existing as any)._currentImageKey = resolvedKey
    } else {
      const targetW = imageDef.width ?? 500
      const img = this._track(this.world.createImage({
        attribute: { src } as any,
        style: { width: targetW, zIndex: Z_INDEX.CHARACTER_NORMAL } as any,
        transform: { position: { x: xPos, y: 0, z: zPos } },
      }))
      const fadeDur = this._dur(duration ?? 400)
      if (fadeDur > 0 && typeof (img as any).fadeIn === 'function') {
        (img as any).fadeIn(fadeDur)
      } else {
        (img as any).style.opacity = 1
      }
      ; (img as any)._currentImageKey = resolvedKey
      this._characters.set(name, img as any)
    }
  }

  removeCharacter(name: string, duration: number = 600): void {
    const obj = this._characters.get(name)
    this._characterStates.delete(name)
    if (obj) {
      this._characters.delete(name)
      const dur = this._dur(duration)
      if (dur > 0 && typeof (obj as any).fadeOut === 'function') {
        (obj as any).fadeOut(dur)
        setTimeout(() => { (obj as any).remove?.(); this._objects.delete(obj) }, dur)
      } else {
        (obj as any).remove?.(); this._objects.delete(obj)
      }
    }
  }

  focusCharacter(name: string, pointKey?: string, zoomPreset: ZoomPreset = 'close-up', duration: number = 800): void {
    const target = this._characters.get(name)
    if (!target) return

    const charDefs = this.config.characters as CharDefs
    const def = charDefs[name]
    const activeImgKey = (target as any)._currentImageKey ?? Object.keys(def)[0]
    const imageDef = def[activeImgKey]
    const fp = (pointKey && imageDef?.points) ? imageDef.points[pointKey] : { x: 0.5, y: 0.5 }

    const targetX = (target as any).transform?.position?.x ?? 0
    const charW = (target as any).style?.width ?? 500
    const rendH = (target as any).__renderedSize?.h
    const charH = (rendH && rendH > 0) ? rendH : charW * 2

    const panX = targetX + charW * (fp.x - 0.5)
    const panY = charH * (0.5 - fp.y)

    this.panCamera('custom', duration, panX, panY)
    this.zoomCamera(zoomPreset, duration)
  }

  highlightCharacter(name: string): void {
    const target = this._characters.get(name)
    if (!target || (target as any)._originalTransform) return

      ; (target as any)._originalTransform = {
        x: target.transform.position.x,
        y: target.transform.position.y,
        z: target.transform.position.z,
        zIndex: (target as any).style?.zIndex,
      }
    this.world.camera?.addChild(target as any)
      ; (target as any).style.zIndex = Z_INDEX.CHARACTER_CUTIN
  }

  unhighlightCharacter(name: string): void {
    const target = this._characters.get(name)
    if (!target) return
    const orig = (target as any)._originalTransform
    if (!orig) return

    this.world.camera?.removeChild(target as any)
    target.transform.position.x = orig.x
    target.transform.position.y = orig.y
    target.transform.position.z = orig.z
      ; (target as any).style.zIndex = orig.zIndex
    delete (target as any)._originalTransform
  }

  // ─── 카메라 ─────────────────────────────────────────────────

  zoomCamera(preset: ZoomPreset = 'inherit', duration?: number, overrideScale?: number): void {
    const cam = this.world.camera
    if (!cam || !this._camBaseObj) return

    // 기존 zoom anim 중단 → 목표값으로 즉시 snap
    if (this._activeCamZoomAnim) {
      this._activeCamZoomAnim.stop()
      this._activeCamZoomAnim = null
      if (this._activeCamZoomTarget) {
        this._camBaseObj.transform.position.z = this._activeCamZoomTarget.z
        this._activeCamZoomTarget = null
      }
    }

    const resolvedPreset = preset === 'inherit' ? this._lastZoomPreset : preset
    this._lastZoomPreset = resolvedPreset
    const { scale, duration: pd } = ZOOM_PRESETS[resolvedPreset]
    const finalScale = overrideScale ?? scale
    const finalDur = this._dur(duration ?? pd)
    const baseDist = (cam as any).attribute?.focalLength ?? 100
    const newZ = baseDist - (baseDist / finalScale)

    this._activeCamZoomTarget = { z: newZ }
    this._activeCamZoomAnim = this._animate(this._camBaseObj, { transform: { position: { z: newZ } } }, finalDur, 'easeInOutQuad')
    this._activeCamZoomAnim?.on('end', () => {
      this._activeCamZoomAnim = null
      this._activeCamZoomTarget = null
    })

    const localZ = baseDist - newZ
    const scaleAtDst = baseDist / (baseDist - newZ)
    const exactW = this.width / scaleAtDst
    const exactH = this.height / scaleAtDst

    this._moodObjs.forEach(moodObj => {
      this._animate(moodObj, {
        transform: { position: { z: localZ } },
        style: { width: exactW, height: exactH },
      }, finalDur, 'easeInOutQuad')
    })
  }

  panCamera(preset: PanPreset | 'custom', duration?: number, customX?: number, customY?: number): void {
    const cam = this.world.camera
    if (!cam || !this._camBaseObj) return

    // 'inherit' → 현재 카메라 위치 유지 (no-op)
    if (preset === 'inherit') return

    // 기존 pan anim 중단 → 목표값으로 즉시 snap
    if (this._activeCamPanAnim) {
      this._activeCamPanAnim.stop()
      this._activeCamPanAnim = null
      if (this._activeCamPanTarget) {
        this._camBaseObj.transform.position.x = this._activeCamPanTarget.x
        this._camBaseObj.transform.position.y = this._activeCamPanTarget.y
        this._activeCamPanTarget = null
      }
    }

    let x: number, y: number, dur: number
    if (preset === 'custom') {
      x = customX ?? 0; y = customY ?? 0; dur = this._dur(duration ?? 800)
    } else {
      this._lastPanPreset = preset
      const p = PAN_PRESETS[preset]
      x = customX ?? p.x; y = customY ?? p.y; dur = this._dur(duration ?? p.duration)
    }

    this._activeCamPanTarget = { x, y }
    this._activeCamPanAnim = this._animate(this._camBaseObj, { transform: { position: { x, y } } }, dur, 'easeInOutQuad')
    this._activeCamPanAnim?.on('end', () => {
      this._activeCamPanAnim = null
      this._activeCamPanTarget = null
    })
  }

  cameraEffect(preset: CameraEffectPreset = 'shake', duration?: number, intensity?: number, repeat: number = 1): void {
    // 스킵 중에는 원래 위치로 즉시 복원
    if (this._isSkipping) return
    const cam = this.world.camera
    if (!cam || !this._camOffsetObj) return

    if (this._activeCamEffectStop) {
      this._activeCamEffectStop()
      this._activeCamEffectStop = null
    }

    if (preset === 'reset') {
      this._camOffsetObj.animate({ transform: { position: { x: 0, y: 0 }, rotation: { z: 0 } } } as any, 100, 'easeOut')
      return
    }

    const { intensity: pi, duration: pd } = CAMERA_EFFECT_PRESETS[preset as Exclude<CameraEffectPreset, 'reset'>]
    const fi = intensity ?? pi
    const fd = duration ?? pd
    const offsetObj = this._camOffsetObj

    let stopped = false
    this._activeCamEffectStop = () => {
      stopped = true
      offsetObj.animate({ transform: { position: { x: 0, y: 0 }, rotation: { z: 0 } } } as any, 100, 'easeOut')
    }

    let remainingRepeat = repeat

    if (preset === 'shake') {
      const steps = Math.floor(fd / 50)
      let i = 0
      const run = () => {
        if (stopped) return
        if (i >= steps) {
          if (remainingRepeat < 0 || --remainingRepeat > 0) {
            i = 0; run(); return
          }
          this._activeCamEffectStop = null
          offsetObj.animate({ transform: { position: { x: 0, y: 0 } } } as any, 100, 'easeOut')
          return
        }
        offsetObj.animate({ transform: { position: { x: (Math.random() - 0.5) * fi * 2, y: (Math.random() - 0.5) * fi * 2 } } } as any, 50, 'linear').on('end', run)
        i++
      }
      run()
    } else if (preset === 'bounce') {
      const steps = Math.floor(fd / 100); let i = 0
      const run = () => {
        if (stopped) return
        if (i >= steps) {
          if (remainingRepeat < 0 || --remainingRepeat > 0) {
            i = 0; run(); return
          }
          this._activeCamEffectStop = null
          offsetObj.animate({ transform: { position: { y: 0 } } } as any, 100, 'easeOut')
          return
        }
        offsetObj.animate({ transform: { position: { y: (i % 2 === 0 ? fi : 0) } } } as any, 100, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'wave') {
      const steps = Math.floor(fd / 50); let i = 0
      const run = () => {
        if (stopped) return
        if (i >= steps) {
          if (remainingRepeat < 0 || --remainingRepeat > 0) {
            i = 0; run(); return
          }
          this._activeCamEffectStop = null
          offsetObj.animate({ transform: { position: { x: 0, y: 0 } } } as any, 100, 'easeOut')
          return
        }
        const t = (i / steps) * Math.PI * 4
        offsetObj.animate({ transform: { position: { x: Math.sin(t) * fi, y: Math.cos(t) * fi * 0.5 } } } as any, 50, 'linear').on('end', run)
        i++
      }
      run()
    } else if (preset === 'nod') {
      const steps = 4; let i = 0
      const run = () => {
        if (stopped) return
        if (i >= steps) {
          if (remainingRepeat < 0 || --remainingRepeat > 0) {
            i = 0; run(); return
          }
          this._activeCamEffectStop = null
          offsetObj.animate({ transform: { position: { y: 0 } } } as any, 100, 'easeOut')
          return
        }
        offsetObj.animate({ transform: { position: { y: (i % 2 === 0 ? -fi : 0) } } } as any, fd / steps, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'shake-x') {
      const steps = 4; let i = 0
      const run = () => {
        if (stopped) return
        if (i >= steps) {
          if (remainingRepeat < 0 || --remainingRepeat > 0) {
            i = 0; run(); return
          }
          this._activeCamEffectStop = null
          offsetObj.animate({ transform: { position: { x: 0 } } } as any, 100, 'easeOut')
          return
        }
        offsetObj.animate({ transform: { position: { x: (i % 2 === 0 ? fi : -fi) } } } as any, fd / steps, 'easeInOutQuad').on('end', run)
        i++
      }
      run()
    } else if (preset === 'fall') {
      const run = () => {
        if (stopped) return
        offsetObj.animate({ transform: { position: { y: -fi * 3 }, rotation: { z: fi } } } as any, fd * 0.6, 'easeOutElastic')
          .on('end', () => {
            if (stopped) return
            setTimeout(() => {
              if (stopped) return
              offsetObj.animate({ transform: { position: { y: 0 }, rotation: { z: 0 } } } as any, fd * 0.4, 'easeInOutQuad')
                .on('end', () => {
                  if (stopped) return
                  if (remainingRepeat < 0 || --remainingRepeat > 0) {
                    run()
                  } else {
                    this._activeCamEffectStop = null
                  }
                })
            }, 300)
          })
      }
      run()
    }
  }

  // ─── 화면 전환 ──────────────────────────────────────────────

  screenFade(dir: 'in' | 'out', preset: FadeColorPreset = 'inherit', duration: number = 600): void {
    const resolvedPreset = preset === 'inherit' ? this._lastFadePreset : preset
    this._lastFadePreset = resolvedPreset
    const { color, easing } = FADE_PRESETS[resolvedPreset]
    const rect = this._getTransitionRect(color)
      ; (rect as any).animate({ style: { opacity: dir === 'out' ? 1 : 0 } }, duration, easing)
  }

  screenFlash(preset: FlashPreset = 'inherit'): void {
    const resolvedPreset = preset === 'inherit' ? this._lastFlashPreset : preset
    this._lastFlashPreset = resolvedPreset
    const { color, duration } = FLASH_PRESETS[resolvedPreset]
    const rect = this._getTransitionRect(color)
      ; (rect as any).animate({ style: { opacity: 1 } }, duration / 2, 'easeOut')
        .on('end', () => (rect as any).animate({ style: { opacity: 0 } }, duration / 2, 'easeIn'))
  }

  screenWipe(dir: 'in' | 'out', preset: WipePreset = 'inherit', duration: number = 800): void {
    const resolvedPreset = preset === 'inherit' ? this._lastWipePreset : preset
    this._lastWipePreset = resolvedPreset
    const rect = this._getTransitionRect('rgba(0,0,0,1)')
    const w = (this.world.canvas as any)?.width ?? this.width
    const h = (this.world.canvas as any)?.height ?? this.height
    const cam = this.world.camera as any

    if (cam) {
      (rect as any).style.width = cam.calcDepthRatio ? cam.calcDepthRatio(10, w) : w
        (rect as any).style.height = cam.calcDepthRatio ? cam.calcDepthRatio(10, h) : h
      rect.transform.position.z = 10
    }

    const { x: dx, y: dy } = WIPE_PRESETS[resolvedPreset]
    if (dir === 'out') {
      rect.transform.position.x = dx * w * 2
      rect.transform.position.y = dy * h * 2
        ; (rect as any).style.opacity = 1
        ; (rect as any).animate({ transform: { position: { x: 0, y: 0 } } }, duration, 'easeInOutQuad')
    } else {
      rect.transform.position.x = 0
      rect.transform.position.y = 0
        ; (rect as any).style.opacity = 1
        ; (rect as any).animate({ transform: { position: { x: dx * w * 2, y: dy * h * 2 } } }, duration, 'easeInOutQuad')
          .on('end', () => { ; (rect as any).style.opacity = 0 })
    }
  }

  fadeIn(duration: number = 800): void { this.screenFade('in', 'black', duration) }
  fadeOut(duration: number = 800): void { this.screenFade('out', 'black', duration) }
}
