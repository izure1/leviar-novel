import type { SceneContext } from '../core/SceneContext'
import { Z_INDEX } from '../constants/render'
import { defineCmd } from '../define/defineCmd'

export type MoodType =
  | 'none' | 'day' | 'night' | 'dawn' | 'sunset' | 'foggy'
  | 'sepia' | 'cold' | 'noir' | 'horror' | 'flashback' | 'dream'
  | 'danger' | 'spot' | 'ambient' | 'warm'

export type FlickerPreset = 'candle' | 'flicker' | 'strobe'

/** 
 * 화면 분위기 오버레이(무드, 조명)를 추가하거나 제거한다 
 * 
 * @example
 * ```ts
 * // 무드 추가
 * { type: 'mood', action: 'add', mood: 'sunset', intensity: 0.8, duration: 1000 }
 * // 무드 제거
 * { type: 'mood', action: 'remove', mood: 'sunset' }
 * // action이 없을 경우 모든 무드를 제거하고 현재 지정된 값으로 덮어쓰기
 * { type: 'mood', mood: 'sunset', intensity: 0.9 }
 * ```
 */
export type MoodCmd =
  | { 
    /** 'add'는 새로운 무드 효과를 추가합니다. */
    action?: 'add'
    /** 추가할 무드의 타입입니다. */
    mood: MoodType
    /** 무드 레이어의 불투명도(0~1)입니다. (기본값: 1) */
    intensity?: number
    /** 무드 레이어에 깜빡임(flicker) 애니메이션을 적용할 프리셋입니다. */
    flicker?: FlickerPreset
    /** 효과가 추가되면서 페이드인 되는 시간(ms 단위)입니다. (기본값: 800) */
    duration?: number 
  }
  | { 
    /** 'remove'는 현재 활성화된 무드 효과를 제거합니다. */
    action: 'remove'
    /** 제거할 무드의 타입입니다. */
    mood: MoodType
    /** 효과가 제거되면서 페이드아웃 되는 시간(ms 단위)입니다. (기본값: 800) */
    duration?: number 
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

function getMoodObjs(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_moodObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_moodObjs', objs)
  }
  return objs
}

function getActiveMoods(ctx: SceneContext) {
  let moods = ctx.renderer.state.get('activeMoods')
  if (!moods) {
    moods = {}
    ctx.renderer.state.set('activeMoods', moods)
  }
  return moods
}

export function addMood(ctx: SceneContext, mood: MoodType, intensity?: number, duration: number = 800) {
  if (mood === 'none') {
    clearMoods(ctx, duration)
    return
  }

  const { color, vignette, blendMode, defaultIntensity } = MOOD_PRESETS[mood]
  const finalIntensity = intensity ?? defaultIntensity ?? 1
  const dur = ctx.renderer.dur(duration)

  const objs = getMoodObjs(ctx)
  const activeMoods = getActiveMoods(ctx)
  const existing = objs[mood]

  if (existing) {
    const flickerState = ctx.renderer.state.get('_flickerState')
    if (flickerState && flickerState.mood === mood) {
      existing._flickerBaseOpacity = finalIntensity
    } else {
      ctx.renderer.animate(existing, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
    }
    activeMoods[mood] = finalIntensity
    // cmdState 동기화
    ctx.cmdState.set('mood', { ...activeMoods })
    return
  }

  const cam = ctx.renderer.world.camera as any
  const focalLength = cam?.attribute?.focalLength ?? 100
  const exactW = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(focalLength, ctx.renderer.width) : ctx.renderer.width
  const exactH = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(focalLength, ctx.renderer.height) : ctx.renderer.height

  const rectOpts: any = {
    style: {
      color, opacity: dur > 0 ? 0 : finalIntensity,
      width: exactW, height: exactH,
      zIndex: Z_INDEX.MOOD,
      pointerEvents: false,
      blendMode: blendMode as any,
    },
    transform: { position: { x: 0, y: 0, z: focalLength - (cam?.transform.position.z ?? 0) } },
  }
  if (vignette) {
    rectOpts.style.gradient = vignette
    rectOpts.style.gradientType = 'circular'
  }

  const rect = ctx.renderer.world.createRectangle(rectOpts)
  ctx.renderer.track(rect as any)
  ctx.renderer.world.camera?.addChild(rect as any)
    ; (rect as any)._currentMood = mood

  objs[mood] = rect
  activeMoods[mood] = finalIntensity
  // cmdState 동기화
  ctx.cmdState.set('mood', { ...activeMoods })

  if (dur > 0) {
    ctx.renderer.animate(rect, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
  }
}

export function removeMood(ctx: SceneContext, mood: MoodType, duration: number = 800) {
  const objs = getMoodObjs(ctx)
  const activeMoods = getActiveMoods(ctx)
  const obj = objs[mood]

  delete activeMoods[mood]
  // cmdState 동기화
  ctx.cmdState.set('mood', { ...activeMoods })

  if (obj) {
    delete objs[mood]
    const dur = ctx.renderer.dur(duration)
    if (dur > 0) {
      ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, 'easeInOutQuad', () => {
        obj.remove?.()
        ctx.renderer.untrack(obj)
      })
    } else {
      obj.remove?.()
      ctx.renderer.untrack(obj)
    }
  }
}

export function clearMoods(ctx: SceneContext, duration: number = 800) {
  const objs = getMoodObjs(ctx)
  Object.keys(objs).forEach(m => removeMood(ctx, m as MoodType, duration))
}

export function setFlicker(ctx: SceneContext, mood: MoodType, flickerPreset: FlickerPreset = 'candle') {
  const objs = getMoodObjs(ctx)
  const activeMoods = getActiveMoods(ctx)
  const target = objs[mood]
  if (!target) return

  const finalIntensity = activeMoods[mood] ?? 1
  const baseOpacity = finalIntensity
  target._flickerBaseOpacity = baseOpacity

  const configs: Record<FlickerPreset, { interval: number; range: [number, number] }> = {
    candle: { interval: 120, range: [0.6, 1.0] },
    flicker: { interval: 80, range: [0.3, 1.0] },
    strobe: { interval: 60, range: [0.0, 1.0] },
  }
  const cfg = configs[flickerPreset]
  ctx.renderer.state.set('_flickerObj', target)
  ctx.renderer.state.set('_flickerState', { mood, preset: flickerPreset })

  const step = () => {
    if (ctx.renderer.state.get('_flickerObj') !== target) {
      ctx.renderer.animate(target, { style: { opacity: baseOpacity } }, 300, 'easeInOutQuad')
      return
    }
    const [min, max] = cfg.range
    const next = baseOpacity * (min + Math.random() * (max - min))
    ctx.renderer.animate(target, { style: { opacity: next } }, cfg.interval, 'linear', step)
  }
  step()
}

export const moodHandler = defineCmd<MoodCmd>((cmd, ctx) => {
  if (cmd.action === 'remove') {
    removeMood(ctx, cmd.mood, cmd.duration)
  } else {
    const addCmd = cmd as Extract<MoodCmd, { action?: 'add' }>
    addMood(ctx, addCmd.mood, addCmd.intensity, addCmd.duration ?? 800)
    if (addCmd.flicker) {
      setFlicker(ctx, addCmd.mood, addCmd.flicker)
    }
  }
  return false
})
