// =============================================================
// Renderer.ts — Leviar World 렌더 어댑터 (범용 버전)
// =============================================================

import { World, Animation } from 'leviar'
import type { LeviarObject, EasingType } from 'leviar'
import type { NovelConfig, NovelUIOption } from '../types/config'

// ─── 내부 헬퍼 ─────────────────────────────────────────────────

/**
 * props 객체로부터 추적 키 목록을 추출한다.
 * ex) { transform: { position: {x,y} }, style: {opacity} }
 *   → ['transform.position', 'style']
 */
function _extractPropKeys(props: any): string[] {
  const keys: string[] = []
  if (props.style) keys.push('style')
  if (props.transform?.position) keys.push('transform.position')
  if (props.transform?.scale) keys.push('transform.scale')
  if (props.transform?.rotation) keys.push('transform.rotation')
  if (keys.length === 0) keys.push('__default__')
  return keys
}

/** props를 obj에 즉시 적용 (duration=0 또는 snap 시) */
function _applyPropsImmediate(obj: any, props: any): void {
  if (props.style) Object.assign(obj.style, props.style)
  if (props.transform?.position) Object.assign(obj.transform.position, props.transform.position)
  if (props.transform?.scale) Object.assign(obj.transform.scale, props.transform.scale)
  if (props.transform?.rotation) Object.assign(obj.transform.rotation, props.transform.rotation)
}

/** 세이브/복원용 카메라 상태 */
export interface CameraState {
  x: number
  y: number
  z: number
}

export interface RendererState {
  cameraState: CameraState
  pluginState: Record<string, any>
  /** @deprecated 하위 호환성용 */
  flicker?: any
  backgroundKey?: string | null
  activeMoods?: any
  activeEffects?: any
  characters?: any
  transitionState?: any
}

export interface RendererOption {
  width: number
  height: number
  depth: number
  ui?: NovelUIOption
}

export class Renderer {
  readonly world: World
  public readonly config: NovelConfig<any, any, any, any, any, any>
  public readonly width: number
  public readonly height: number
  public readonly depth: number
  public readonly ui: NovelUIOption | undefined

  private _objects: Set<LeviarObject> = new Set()
  private _isSkipping: boolean = false

  // 커스텀 명령어들이 저장할 범용 상태 저장소
  public state: Map<string, any> = new Map()

  // ─── 카메라 변환 합성용 ─────────────────────────────────────
  public camBaseObj: LeviarObject | null = null
  public camOffsetObj: LeviarObject | null = null
  private _camSyncRafId: number | null = null

  constructor(world: World, config: NovelConfig<any, any, any, any, any, any>, option: RendererOption) {
    this.world = world
    this.config = config
    this.width = option.width
    this.height = option.height
    this.depth = option.depth
    this.ui = option.ui

    if (!this.world.camera) {
      this.world.camera = (this.world as any).createCamera()
    }
    this.world.camera!.transform.position.z = 0

    this._initCameraSync()
  }

  private _initCameraSync(): void {
    this.camBaseObj = this.world.createRectangle({
      style: { width: 1, height: 1, opacity: 0.01, pointerEvents: false } as any,
      transform: { position: { x: 0, y: 0, z: 0 } }
    })
    this.camOffsetObj = this.world.createRectangle({
      style: { width: 1, height: 1, opacity: 0.01, pointerEvents: false } as any,
      transform: { position: { x: 0, y: 0, z: 0 }, rotation: { z: 0 } }
    })
    this.world.camera?.addChild(this.camBaseObj as any)
    this.world.camera?.addChild(this.camOffsetObj as any)

    const syncLoop = () => {
      if (this.world.camera && this.camBaseObj && this.camOffsetObj) {
        this.world.camera.transform.position.x = this.camBaseObj.transform.position.x + this.camOffsetObj.transform.position.x
        this.world.camera.transform.position.y = this.camBaseObj.transform.position.y + this.camOffsetObj.transform.position.y
        this.world.camera.transform.position.z = this.camBaseObj.transform.position.z + this.camOffsetObj.transform.position.z
        if (this.world.camera.transform.rotation && this.camOffsetObj.transform.rotation) {
          this.world.camera.transform.rotation.z = this.camOffsetObj.transform.rotation.z
        }
      }
      this._camSyncRafId = requestAnimationFrame(syncLoop)
    }
    this._camSyncRafId = requestAnimationFrame(syncLoop)
  }

  setSkipping(flag: boolean): void { this._isSkipping = flag }

  public dur(d: number): number { return this._isSkipping ? 0 : d }

  public animate(
    obj: any,
    props: any,
    duration: number,
    easing: EasingType = 'linear',
    onEnd?: () => void,
  ): Animation | null {
    const d = this.dur(duration)

    // prop 경로 키 추출 (ex: 'transform.position', 'style')
    const propKeys = _extractPropKeys(props)

    // 이전 anim 중단 → 목표값 snap
    if (!obj.__activeAnims) obj.__activeAnims = new Map<string, { anim: Animation | null; target: any }>()
    for (const key of propKeys) {
      const existing = obj.__activeAnims.get(key)
      if (existing?.anim) {
        existing.anim.stop?.()
        _applyPropsImmediate(obj, existing.target)
      }
    }

    if (d === 0) {
      _applyPropsImmediate(obj, props)
      for (const key of propKeys) obj.__activeAnims.delete(key)
      onEnd?.()
      return null
    }

    const anim = (obj as any).animate(props, d, easing)
    // 새 anim 등록
    const entry = { anim, target: props }
    for (const key of propKeys) obj.__activeAnims.set(key, entry)
    const cleanup = () => {
      for (const key of propKeys) {
        if (obj.__activeAnims?.get(key) === entry) obj.__activeAnims.delete(key)
      }
    }
    anim.on('end', cleanup)
    if (onEnd) anim.on('end', onEnd)
    return anim
  }

  public track<T extends LeviarObject>(obj: T): T {
    this._objects.add(obj)
    return obj
  }

  public untrack(obj: LeviarObject): void {
    this._objects.delete(obj)
  }

  captureState(): RendererState {
    const cam = this.world.camera
    return {
      cameraState: {
        x: this.camBaseObj?.transform.position.x ?? cam?.transform.position.x ?? 0,
        y: this.camBaseObj?.transform.position.y ?? cam?.transform.position.y ?? 0,
        z: this.camBaseObj?.transform.position.z ?? cam?.transform.position.z ?? 0,
      },
      pluginState: Object.fromEntries(this.state)
    }
  }

  restoreState(state: RendererState): void {
    const cam = this.world.camera
    if (cam && state.cameraState) {
      if (this.camBaseObj) {
        this.camBaseObj.transform.position.x = state.cameraState.x
        this.camBaseObj.transform.position.y = state.cameraState.y
        this.camBaseObj.transform.position.z = state.cameraState.z
      }
      if (this.camOffsetObj) {
        this.camOffsetObj.transform.position.x = 0
        this.camOffsetObj.transform.position.y = 0
        this.camOffsetObj.transform.position.z = 0
        if (this.camOffsetObj.transform.rotation) this.camOffsetObj.transform.rotation.z = 0
      }
      cam.transform.position.x = state.cameraState.x
      cam.transform.position.y = state.cameraState.y
      cam.transform.position.z = state.cameraState.z
    }
    this.state = new Map(Object.entries(state.pluginState || {}))
  }

  clear(): void {
    this._objects.forEach(obj => (obj as any).remove?.())
    this._objects.clear()
    this.state.clear()
    if (this.camOffsetObj) {
      this.camOffsetObj.transform.position.x = 0
      this.camOffsetObj.transform.position.y = 0
      this.camOffsetObj.transform.position.z = 0
      if (this.camOffsetObj.transform.rotation) this.camOffsetObj.transform.rotation.z = 0
    }
  }
}
