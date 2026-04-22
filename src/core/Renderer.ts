// =============================================================
// Renderer.ts — Leviar World 렌더 어댑터 (범용 버전)
// =============================================================

import { World, Animation } from 'leviar'
import type { LeviarObject, EasingType } from 'leviar'
import type { NovelConfig } from '../types/config'
import type { SceneContext } from './SceneContext'
import { setBackground } from '../cmds/background'
import { showCharacter } from '../cmds/character'
import { addMood } from '../cmds/mood'
import { addEffect } from '../cmds/effect'
import { rebuildOverlays } from '../cmds/overlay'

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
}

export class Renderer {
  readonly world: World
  public readonly config: NovelConfig<any, any, any, any, any, any>
  public readonly width: number
  public readonly height: number
  public readonly depth: number

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

  /**
   * 스킵 모드 상태를 설정합니다. 스킵 모드일 경우 애니메이션 시간이 0으로 처리됩니다.
   * @param flag 스킵 활성화 여부
   */
  setSkipping(flag: boolean): void { this._isSkipping = flag }

  /**
   * 스킵 모드 상태를 고려하여 실제 적용할 애니메이션 소요 시간(ms)을 반환합니다.
   * @param d 원본 소요 시간(ms)
   * @returns 스킵 중이면 0, 아니면 원본 시간
   */
  public dur(d: number): number { return this._isSkipping ? 0 : d }

  /**
   * 객체에 애니메이션을 적용합니다. 
   * 이전에 진행 중이던 동일 속성의 애니메이션이 있다면 중단하고 즉시 목표값으로 스냅시킵니다.
   * 스킵 모드이거나 duration이 0인 경우 애니메이션 없이 즉시 속성을 적용합니다.
   * 
   * @param obj 애니메이션을 적용할 대상 객체
   * @param props 변경할 속성 객체 (예: { transform: { position: { x: 100 } } })
   * @param duration 애니메이션 소요 시간(ms)
   * @param easing 애니메이션 이징 함수
   * @param onEnd 애니메이션 종료 시 호출될 콜백 함수
   * @returns 생성된 애니메이션 인스턴스 (즉시 적용 시 null)
   */
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

  /**
   * 렌더러가 관리할 객체를 추적 목록에 추가합니다.
   * 씬(Scene) 종료 시 추적된 객체들은 자동으로 화면에서 제거(clear)됩니다.
   * @param obj 추적할 객체
   */
  public track<T extends LeviarObject>(obj: T): T {
    this._objects.add(obj)
    return obj
  }

  /**
   * 지정된 객체를 추적 목록에서 제거합니다.
   * 더 이상 렌더러의 일괄 삭제 관리를 받지 않게 됩니다.
   * @param obj 추적 해제할 객체
   */
  public untrack(obj: LeviarObject): void {
    this._objects.delete(obj)
  }

  /**
   * 세이브 저장을 위해 현재 렌더러의 뷰포트/카메라 상태와 커스텀 플러그인 상태를 캡처하여 반환합니다.
   */
  captureState(): RendererState {
    const cam = this.world.camera
    return {
      cameraState: {
        x: this.camBaseObj?.transform.position.x ?? cam?.transform.position.x ?? 0,
        y: this.camBaseObj?.transform.position.y ?? cam?.transform.position.y ?? 0,
        z: this.camBaseObj?.transform.position.z ?? cam?.transform.position.z ?? 0,
      },
      pluginState: Object.fromEntries(
        Array.from(this.state.entries()).filter(([key, value]) => {
          // _ prefix 키는 런타임 내부 참조(LeviarObject 등) → 무조건 제외
          if (key.startsWith('_')) return false
          // 직렬화 가능 여부 검사: 순환 참조 객체는 stringify 시 throw → 제외
          try { JSON.stringify(value); return true } catch { return false }
        })
      )
    }
  }

  /**
   * 로드 시 저장된 상태(state)를 기반으로 렌더러의 카메라 위치 및 커스텀 플러그인 상태를 복원합니다.
   */
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

  /**
   * pluginState 데이터를 기반으로 배경, 캐릭터, 무드, 이펙트를 화면에 재생성합니다.
   * restoreState() 이후 호출하여 실제 렌더링을 복원합니다.
   */
  rebuildFromState(): void {
    const ctx = _makeRestoreCtx(this)

    // 배경 복원
    const bgKey = this.state.get('backgroundKey')
    if (bgKey) {
      setBackground(ctx, bgKey, 'inherit', 0)
    }

    // 캐릭터 복원
    const characters = this.state.get('characters') as Record<string, { position: string; imageKey: string }> | undefined
    if (characters) {
      for (const [name, info] of Object.entries(characters)) {
        showCharacter(ctx, name, info.position, info.imageKey, 0)
      }
    }

    // 무드 복원
    const activeMoods = this.state.get('activeMoods') as Record<string, number> | undefined
    if (activeMoods) {
      for (const [mood, intensity] of Object.entries(activeMoods)) {
        addMood(ctx, mood as any, intensity, 0)
      }
    }

    // 이펙트(파티클) 복원
    const activeEffects = this.state.get('activeEffects') as Record<string, { rate?: number; srcKey?: string }> | undefined
    if (activeEffects) {
      for (const [type, info] of Object.entries(activeEffects)) {
        addEffect(ctx, type as any, info.rate, undefined, info.srcKey)
      }
    }

    // 오버레이 텍스트 복원
    rebuildOverlays(ctx)
  }

  /**
   * 렌더러가 화면에 그린 모든 추적 객체를 제거하고, 커스텀 플러그인 상태 및 카메라 오프셋을 초기화합니다.
   * 주로 씬(Scene) 전환이나 종료 시 호출됩니다.
   */
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

// ─── 복원용 SceneContext stub ────────────────────────────────

function _makeRestoreCtx(renderer: Renderer): SceneContext {
  const noop = () => { /* no-op */ }
  return {
    world: renderer.world,
    renderer,
    globalVars: {},
    localVars: {},
    callbacks: {
      getGlobalVars: () => ({}),
      setGlobalVar: noop as any,
      loadScene: noop as any,
      captureRenderer: () => renderer.captureState(),
      isSkipping: () => true,
      disableInput: noop as any,
      getCmdStateStore: () => new Map(),
      getUIRegistry: () => new Map(),
    },
    cmdState: {
      set: noop as any,
      get: () => undefined,
    },
    ui: {
      register: noop as any,
      get: () => undefined,
      show: noop as any,
      hide: noop as any,
    },
    scene: {
      getTextSubIndex: () => 0,
      interpolateText: (t: string) => t,
      jumpToLabel: noop as any,
      hasLabel: () => false,
      getVars: () => ({}),
      setGlobalVar: noop as any,
      setLocalVar: noop as any,
      loadScene: noop as any,
      end: noop,
    },
  }
}
