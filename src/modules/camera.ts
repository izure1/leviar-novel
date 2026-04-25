import type { SceneContext } from '../core/SceneContext'
import { define } from '../define/defineCmdUI'

export type ZoomPreset = 'close-up' | 'medium' | 'wide' | 'reset' | 'inherit'
export type PanPreset = 'left' | 'right' | 'up' | 'down' | 'center' | 'inherit' | (string & {})
export type CameraEffectPreset = 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall' | 'reset'

/** 카메라를 줌한다 */
export interface CameraZoomCmd {
  preset: ZoomPreset
  duration?: number
}

/** 카메라를 패닝한다 */
export interface CameraPanCmd {
  position: PanPreset
  duration?: number
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
  preset: CameraEffectPreset
  duration?: number
  intensity?: number
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

const CAMERA_EFFECT_PRESETS: Record<Exclude<CameraEffectPreset, 'reset'>, { intensity: number; duration: number }> = {
  shake: { intensity: 10, duration: 500 },
  bounce: { intensity: 15, duration: 600 },
  wave: { intensity: 20, duration: 1000 },
  nod: { intensity: 10, duration: 400 },
  'shake-x': { intensity: 15, duration: 500 },
  fall: { intensity: 15, duration: 800 },
}

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
  if (preset === 'reset') {
    const stopFn = ctx.renderer.state.get('_activeCamEffectStop')
    if (stopFn) stopFn()
    return
  }

  const stopFn = ctx.renderer.state.get('_activeCamEffectStop')
  if (stopFn) stopFn()

  const cfg = CAMERA_EFFECT_PRESETS[preset]
  if (!cfg) return

  const finalIntensity = intensity ?? cfg.intensity
  const finalDuration = ctx.renderer.dur(duration ?? cfg.duration)
  if (finalDuration <= 0) return

  const offsetObj = ctx.renderer.camOffsetObj
  if (!offsetObj) return

  let active = true
  let frame = 0

  const stop = () => {
    active = false
    ctx.renderer.state.set('_activeCamEffectStop', null)
    offsetObj.transform.position.x = 0
    offsetObj.transform.position.y = 0
    if (offsetObj.transform.rotation) offsetObj.transform.rotation.z = 0
  }
  ctx.renderer.state.set('_activeCamEffectStop', stop)

  const loop = () => {
    if (!active || frame++ >= repeat) {
      stop()
      return
    }

    let elapsed = 0
    const stepTime = 16
    const tick = () => {
      if (!active) return
      elapsed += stepTime
      if (elapsed > finalDuration) {
        loop()
        return
      }
      const progress = elapsed / finalDuration
      let dx = 0, dy = 0, dz = 0

      switch (preset) {
        case 'shake':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          dy = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'shake-x':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'bounce':
          dy = Math.sin(progress * Math.PI) * finalIntensity
          break
        case 'wave':
          dx = Math.sin(progress * Math.PI * 2) * finalIntensity
          dy = Math.cos(progress * Math.PI * 2) * (finalIntensity / 2)
          break
        case 'nod':
          dy = Math.sin(progress * Math.PI) * finalIntensity
          break
        case 'fall':
          dy = Math.pow(progress, 2) * finalIntensity * 5
          break
      }

      offsetObj.transform.position.x = dx
      offsetObj.transform.position.y = dy
      if (offsetObj.transform.rotation) offsetObj.transform.rotation.z = dz

      setTimeout(tick, stepTime)
    }
    tick()
  }
  loop()
}

// ─── camera-zoom 모듈 ────────────────────────────────────────

export interface CameraZoomSchema { lastPreset: string }

const cameraZoomModule = define<CameraZoomCmd, CameraZoomSchema>({ lastPreset: 'reset' })

cameraZoomModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraZoomModule.defineCommand(function* (cmd, ctx, data) {
  const resolved = cmd.preset === 'inherit' ? data.lastPreset : cmd.preset
  data.lastPreset = resolved
  zoomCamera(ctx, resolved as ZoomPreset, cmd.duration)
  return true
})

export { cameraZoomModule }

// ─── camera-pan 모듈 ────────────────────────────────────────

export interface CameraPanSchema { lastPreset: string }

const cameraPanModule = define<CameraPanCmd, CameraPanSchema>({ lastPreset: 'center' })

cameraPanModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraPanModule.defineCommand(function* (cmd, ctx, data) {
  const resolved = cmd.position === 'inherit' ? data.lastPreset : cmd.position
  data.lastPreset = resolved
  panCamera(ctx, resolved as PanPreset, cmd.duration)
  return true
})

export { cameraPanModule }

// ─── camera-effect 모듈 ─────────────────────────────────────

export interface CameraEffectSchema { lastPreset: string }

const cameraEffectModule = define<CameraEffectCmd, CameraEffectSchema>({ lastPreset: 'shake' })

cameraEffectModule.defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))

cameraEffectModule.defineCommand(function* (cmd, ctx, data) {
  data.lastPreset = cmd.preset
  cameraEffect(ctx, cmd.preset, cmd.duration, cmd.intensity, cmd.repeat)
  return true
})

export { cameraEffectModule }

// ─── @internal 하위 호환 aliases ─────────────────────────────

export const cameraZoomHandler = (p: any, ctx: any) => cameraZoomModule.__handler!(p, ctx)
export const cameraPanHandler = (p: any, ctx: any) => cameraPanModule.__handler!(p, ctx)
export const cameraEffectHandler = (p: any, ctx: any) => cameraEffectModule.__handler!(p, ctx)
