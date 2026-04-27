import type { SceneContext } from '../core/SceneContext'
import { define } from '../define/defineCmdUI'
import { playMotionEffect, type MotionEffectPreset } from '../core/motion'

export type ZoomPreset = 'close-up' | 'medium' | 'wide' | 'reset' | 'inherit'
export type PanPreset = 'left' | 'right' | 'up' | 'down' | 'center' | 'inherit' | (string & {})
export type CameraEffectPreset = MotionEffectPreset

/** 카메라를 줌한다 */
export interface CameraZoomCmd {
  /** 줌 배율 프리셋입니다. ('inherit'일 경우 이전 상태 유지) */
  preset: ZoomPreset
  /** 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
}

/** 카메라를 패닝한다 */
export interface CameraPanCmd {
  /** 패닝 위치 프리셋입니다. ('inherit'일 경우 이전 상태 유지) */
  position: PanPreset
  /** 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
  /** 커스텀 X 좌표입니다. */
  x?: number
  /** 커스텀 Y 좌표입니다. */
  y?: number
}

/**
 * 카메라 흔들림 등 연출 효과를 재생한다
 *
 * @example
 * ```ts
 * { type: 'camera-effect', preset: 'shake', duration: 500, intensity: 5, repeat: 3 }
 * ```
 */
export interface CameraEffectCmd {
  /** 연출 효과의 프리셋 이름입니다. */
  preset: CameraEffectPreset
  /** 효과의 전체 지속 시간(ms)입니다. */
  duration?: number
  /** 효과의 강도입니다. 프리셋의 기본값을 덮어씁니다. */
  intensity?: number
  /** 효과를 반복할 횟수입니다. (기본값: 1) */
  repeat?: number
}

// ─── 프리셋 테이블 ───────────────────────────────────────────

const ZOOM_PRESETS: Record<Exclude<ZoomPreset, 'inherit'>, { scale: number; duration: number }> = {
  'close-up': { scale: 1.5, duration: 800 },
  'medium': { scale: 1.2, duration: 600 },
  'wide': { scale: 0.92, duration: 800 },
  'reset': { scale: 1.0, duration: 600 },
}

const PAN_PRESETS: Record<Exclude<PanPreset, 'inherit'>, { x: number; y: number; duration: number }> = {
  left: { x: -200, y: 0, duration: 1000 },
  right: { x: 200, y: 0, duration: 1000 },
  up: { x: 0, y: 200, duration: 1000 },
  down: { x: 0, y: -200, duration: 1000 },
  center: { x: 0, y: 0, duration: 1000 },
}

export { MOTION_EFFECT_PRESETS as CAMERA_EFFECT_PRESETS } from '../core/motion'

// ─── 공유 헬퍼 ───────────────────────────────────────────────

export function zoomCamera(ctx: SceneContext, preset: ZoomPreset, duration?: number) {
  const resolvedPreset = preset === 'inherit' ? ctx.renderer.state.get('_lastZoomPreset') ?? 'reset' : preset
  ctx.renderer.state.set('_lastZoomPreset', resolvedPreset)
  const cfg = ZOOM_PRESETS[resolvedPreset as Exclude<ZoomPreset, 'inherit'>]
  if (!cfg) return

  const focalLength = (ctx.renderer.world.camera as any)?.attribute?.focalLength ?? 100
  const targetZ = focalLength * (1 - 1 / cfg.scale)

  if (ctx.renderer.camBaseObj) {
    const dur = ctx.renderer.dur(duration ?? cfg.duration)
    ctx.renderer.animate(ctx.renderer.camBaseObj, { transform: { position: { z: targetZ } } }, dur, 'easeInOutQuad')
  }
}

export function panCamera(ctx: SceneContext, position: PanPreset, duration?: number, customX?: number, customY?: number) {
  if (position === 'inherit') return

  const resolvedPreset = position
  ctx.renderer.state.set('_lastPanPreset', resolvedPreset)
  const cfg = PAN_PRESETS[resolvedPreset as Exclude<PanPreset, 'inherit'>]

  let targetX = customX ?? 0
  let targetY = customY ?? 0
  let finalDur = duration ?? 1000

  if (cfg && customX === undefined && customY === undefined) {
    targetX = cfg.x
    targetY = cfg.y
    if (duration === undefined) finalDur = cfg.duration
  } else if (typeof resolvedPreset === 'string' && customX === undefined) {
    let ratio = 0.5
    const m = resolvedPreset.match(/^(\d+)\/(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      const d = parseInt(m[2], 10)
      if (d > 0) ratio = n / (d + 1)
    }
    targetX = ctx.renderer.width * (ratio - 0.5)
    targetY = 0
  }

  if (ctx.renderer.camBaseObj) {
    const dur = ctx.renderer.dur(finalDur)
    ctx.renderer.animate(ctx.renderer.camBaseObj, {
      transform: { position: { x: targetX, y: targetY } }
    }, dur, 'easeInOutQuad')
  }
}

function cameraEffect(ctx: SceneContext, preset: CameraEffectPreset, duration?: number, intensity?: number, repeat: number = 1) {
  const offsetObj = ctx.renderer.camOffsetObj
  if (!offsetObj) return
  
  // renderer state 기반의 stateKey 동작 모방
  const objWrapper = {
    transform: offsetObj.transform,
    get _activeCamEffectStop() { return ctx.renderer.state.get('_activeCamEffectStop') },
    set _activeCamEffectStop(val) { ctx.renderer.state.set('_activeCamEffectStop', val) }
  }

  playMotionEffect(ctx, objWrapper, preset, duration, intensity, repeat, '_activeCamEffectStop')
}

// ─── camera-zoom 모듈 ────────────────────────────────────────

export interface CameraZoomSchema { lastPreset: string }

const cameraZoomModule = define<CameraZoomCmd, CameraZoomSchema>({ lastPreset: 'reset' })

cameraZoomModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraZoomModule.defineCommand(function* (cmd, ctx, state, setState) {
  const resolved = cmd.preset === 'inherit' ? state.lastPreset : cmd.preset
  setState({ lastPreset: resolved as string })
  zoomCamera(ctx, resolved as ZoomPreset, cmd.duration)
  return true
})

export { cameraZoomModule }

// ─── camera-pan 모듈 ────────────────────────────────────────

export interface CameraPanSchema { lastPreset: string }

const cameraPanModule = define<CameraPanCmd, CameraPanSchema>({ lastPreset: 'center' })

cameraPanModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraPanModule.defineCommand(function* (cmd, ctx, state, setState) {
  const resolved = cmd.position === 'inherit' ? state.lastPreset : cmd.position
  setState({ lastPreset: resolved as string })
  panCamera(ctx, resolved as PanPreset, cmd.duration, cmd.x, cmd.y)
  return true
})

export { cameraPanModule }

// ─── camera-effect 모듈 ─────────────────────────────────────

export interface CameraEffectSchema { lastPreset: string }

const cameraEffectModule = define<CameraEffectCmd, CameraEffectSchema>({ lastPreset: 'shake' })

cameraEffectModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraEffectModule.defineCommand(function* (cmd, ctx, state, setState) {
  setState({ lastPreset: cmd.preset })
  cameraEffect(ctx, cmd.preset, cmd.duration, cmd.intensity, cmd.repeat)
  return true
})

export { cameraEffectModule }

// ─── @internal 하위 호환 aliases ─────────────────────────────

export const cameraZoomHandler = (p: any, ctx: any) => cameraZoomModule.__handler!(p, ctx)
export const cameraPanHandler = (p: any, ctx: any) => cameraPanModule.__handler!(p, ctx)
export const cameraEffectHandler = (p: any, ctx: any) => cameraEffectModule.__handler!(p, ctx)
