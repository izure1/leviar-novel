import type { SceneContext } from './SceneContext'

export type MotionEffectPreset =
  | 'shake'
  | 'shake-x'
  | 'shake-y'
  | 'bounce'
  | 'wave'
  | 'nod'
  | 'fall'
  | 'pulse'
  | 'spin'
  | 'spin-x'
  | 'spin-y'
  | 'spin-z'
  | 'float'
  | 'jolt'
  | 'reset'

export interface MotionEffectConfig {
  intensity: number
  duration: number
}

export const MOTION_EFFECT_PRESETS: Record<Exclude<MotionEffectPreset, 'reset'>, MotionEffectConfig> = {
  shake: { intensity: 10, duration: 500 },
  'shake-x': { intensity: 15, duration: 500 },
  'shake-y': { intensity: 15, duration: 500 },
  bounce: { intensity: 15, duration: 600 },
  wave: { intensity: 20, duration: 1000 },
  nod: { intensity: 10, duration: 400 },
  fall: { intensity: 15, duration: 800 },
  pulse: { intensity: 1.1, duration: 600 },
  spin: { intensity: 360, duration: 1000 },
  'spin-x': { intensity: 360, duration: 1000 },
  'spin-y': { intensity: 360, duration: 1000 },
  'spin-z': { intensity: 360, duration: 1000 },
  float: { intensity: 10, duration: 2000 },
  jolt: { intensity: 30, duration: 200 },
}

export function playMotionEffect(
  ctx: SceneContext,
  obj: any,
  preset: MotionEffectPreset,
  duration?: number,
  intensity?: number,
  repeat: number = 1,
  stateKey: string = '__activeMotionStop',
  callbacks?: {
    /** 한 사이클 완료마다 호출됩니다. remaining은 남은 반복 횟수입니다. */
    onRepeat?: (remaining: number) => void
    /** 효과가 자연 종료되었을 때 호출됩니다. 외부 stop() 시에는 호출되지 않습니다. */
    onEnd?: () => void
  }
) {
  if (!obj) return

  if (preset === 'reset') {
    const stopFn = obj[stateKey]
    if (stopFn) stopFn()
    return
  }

  const stopFn = obj[stateKey]
  if (stopFn) stopFn()

  const cfg = MOTION_EFFECT_PRESETS[preset as Exclude<MotionEffectPreset, 'reset'>]
  if (!cfg) return

  const finalIntensity = intensity ?? cfg.intensity
  const finalDuration = ctx.renderer.dur(duration ?? cfg.duration)
  if (finalDuration <= 0) return

  let active = true
  let frame = 0

  const originX = obj.transform?.position?.x ?? 0
  const originY = obj.transform?.position?.y ?? 0
  const originScaleX = obj.transform?.scale?.x ?? 1
  const originScaleY = obj.transform?.scale?.y ?? 1
  const originXRotation = obj.transform?.rotation?.x ?? 0
  const originYRotation = obj.transform?.rotation?.y ?? 0
  const originZRotation = obj.transform?.rotation?.z ?? 0

  const stop = () => {
    active = false
    obj[stateKey] = null
    if (obj.transform?.position) {
      obj.transform.position.x = originX
      obj.transform.position.y = originY
    }
    if (obj.transform?.scale) {
      obj.transform.scale.x = originScaleX
      obj.transform.scale.y = originScaleY
    }
    if (obj.transform?.rotation) {
      obj.transform.rotation.x = originXRotation
      obj.transform.rotation.y = originYRotation
      obj.transform.rotation.z = originZRotation
    }
  }
  obj[stateKey] = stop

  const loop = () => {
    if (!active) return
    if (repeat >= 0 && frame++ >= repeat) {
      stop()
      callbacks?.onEnd?.()
      return
    }
    // 남은 반복 횟수를 콜백으로 전달합니다.
    if (repeat >= 0) {
      callbacks?.onRepeat?.(repeat - frame)
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
      let dx = 0, dy = 0, dz = 0, ds = 0, dRotX = 0, dRotY = 0

      switch (preset) {
        case 'shake':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          dy = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'shake-x':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'shake-y':
          dy = (Math.random() - 0.5) * finalIntensity * (1 - progress)
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
        case 'pulse':
          // Scale based on sine wave, intensity is the max scale (e.g., 1.1)
          ds = Math.sin(progress * Math.PI) * (finalIntensity - 1)
          break
        case 'spin-x':
          dRotX = progress * finalIntensity
          break
        case 'spin-y':
          dRotY = progress * finalIntensity
          break
        case 'spin':
        case 'spin-z':
          dz = progress * finalIntensity
          break
        case 'float':
          dy = Math.sin(progress * Math.PI * 2) * finalIntensity
          break
        case 'jolt':
          dx = (Math.random() - 0.5) * finalIntensity * Math.exp(-progress * 5)
          dy = (Math.random() - 0.5) * finalIntensity * Math.exp(-progress * 5)
          break
      }

      if (obj.transform?.position) {
        obj.transform.position.x = originX + dx
        obj.transform.position.y = originY + dy
      }
      if (obj.transform?.scale && preset === 'pulse') {
        obj.transform.scale.x = originScaleX + ds
        obj.transform.scale.y = originScaleY + ds
      }
      if (obj.transform?.rotation) {
        obj.transform.rotation.x = originXRotation + dRotX
        obj.transform.rotation.y = originYRotation + dRotY
        obj.transform.rotation.z = originZRotation + dz
      }

      setTimeout(tick, stepTime)
    }
    tick()
  }
  loop()
}
