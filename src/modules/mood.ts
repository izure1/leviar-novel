import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type MoodType =
  | 'none' | 'day' | 'night' | 'dawn' | 'sunset' | 'foggy'
  | 'sepia' | 'cold' | 'noir' | 'horror' | 'flashback' | 'dream'
  | 'danger' | 'spot' | 'ambient' | 'warm'

export type FlickerPreset = 'candle' | 'flicker' | 'strobe'

/** 
 * 화면 분위기 오버레이(무드, 조명)를 추가하거나 제거한다 
 */
export type MoodCmd =
  | {
    action?: 'add'
    mood: MoodType
    intensity?: number
    flicker?: FlickerPreset
    duration?: number
  }
  | {
    action: 'remove'
    mood: MoodType
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

// ─── 스키마 ──────────────────────────────────────────────────

export interface MoodSchema {
  /** mood → intensity 맵 */
  activeMoods: Record<string, number>
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 무드 모듈. `novel.config`의 `modules: { 'mood': moodModule }` 형태로 등록합니다.
 */
const moodModule = define<MoodCmd, MoodSchema>({
  activeMoods: {},
})

moodModule.defineView((data, ctx) => {
  // 내부 canvas 오브젝트 맵
  const _moodObjs: Record<string, any> = {}

  const _addMoodObj = (mood: MoodType, intensity: number, duration: number, immediate = false) => {
    if (mood === 'none') {
      for (const m of Object.keys(_moodObjs)) {
        _removeMoodObj(m as MoodType, duration, immediate)
      }
      return
    }

    const { color, vignette, blendMode, defaultIntensity } = MOOD_PRESETS[mood]
    const finalIntensity = intensity ?? defaultIntensity ?? 1
    const dur = immediate ? 0 : ctx.renderer.dur(duration)

    const cam = ctx.renderer.world.camera
    const focalLength = cam?.attribute?.focalLength ?? 100
    const exactW = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(focalLength, ctx.renderer.width) : ctx.renderer.width
    const exactH = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(focalLength, ctx.renderer.height) : ctx.renderer.height

    const existing = _moodObjs[mood]
    if (existing) {
      ctx.renderer.animate(existing, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
      return
    }

    const rectOpts: any = {
      style: {
        color, opacity: dur > 0 ? 0 : finalIntensity,
        width: exactW, height: exactH,
        zIndex: Z_INDEX.MOOD,
        pointerEvents: false,
        blendMode,
      },
      transform: { position: { x: 0, y: 0, z: focalLength - (cam?.transform.position.z ?? 0) } },
    }
    if (vignette) {
      rectOpts.style.gradient = vignette
      rectOpts.style.gradientType = 'circular'
    }

    const rect = ctx.renderer.world.createRectangle(rectOpts)
    ctx.renderer.track(rect)
    ctx.renderer.world.camera?.addChild(rect)
    ;(rect as any)._currentMood = mood
    _moodObjs[mood] = rect

    if (dur > 0) {
      ctx.renderer.animate(rect, { style: { opacity: finalIntensity } }, dur, 'easeInOutQuad')
    }
  }

  const _removeMoodObj = (mood: MoodType, duration: number, immediate = false) => {
    const obj = _moodObjs[mood]
    if (obj) {
      delete _moodObjs[mood]
      const dur = immediate ? 0 : ctx.renderer.dur(duration)
      if (dur > 0) {
        ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, 'easeInOutQuad', () => {
          obj.remove()
          ctx.renderer.untrack(obj)
        })
      } else {
        obj.remove()
        ctx.renderer.untrack(obj)
      }
    }
  }

  // 복원: 저장된 무드들 즉시 렌더
  for (const [mood, intensity] of Object.entries(data.activeMoods)) {
    _addMoodObj(mood as MoodType, intensity, 800, true)
  }

  return {
    show: () => {},
    hide: () => {
      for (const obj of Object.values(_moodObjs)) {
        obj?.fadeOut?.(300, 'easeIn')
      }
    },
    // flicker용 오브젝트 접근
    getObj: (mood: string) => _moodObjs[mood],
    update: (d: MoodSchema) => {
      const newMoods = new Set(Object.keys(d.activeMoods))
      // 제거된 무드
      for (const mood of Object.keys(_moodObjs)) {
        if (!newMoods.has(mood)) {
          _removeMoodObj(mood as MoodType, 800)
        }
      }
      // 추가/변경된 무드
      for (const [mood, intensity] of Object.entries(d.activeMoods)) {
        _addMoodObj(mood as MoodType, intensity, 800)
      }
    },
  }
})

moodModule.defineCommand((cmd, ctx, data) => {
  const newMoods = { ...data.activeMoods }

  if (cmd.action === 'remove') {
    delete newMoods[cmd.mood]
  } else {
    const addCmd = cmd as Extract<MoodCmd, { action?: 'add' }>
    if (addCmd.mood === 'none') {
      // 전체 제거
      for (const k of Object.keys(newMoods)) delete newMoods[k]
    } else {
      const preset = MOOD_PRESETS[addCmd.mood]
      newMoods[addCmd.mood] = addCmd.intensity ?? preset?.defaultIntensity ?? 1
    }

    // flicker 처리
    if (addCmd.flicker) {
      // flicker는 view에 직접 접근
      const entry = ctx.ui.get('mood') as any
      const obj = entry?.getObj?.(addCmd.mood)
      if (obj) {
        _setFlicker(ctx, obj, addCmd.mood, data.activeMoods[addCmd.mood] ?? 1, addCmd.flicker)
      }
    }
  }

  data.activeMoods = newMoods
  return true
})

function _setFlicker(ctx: any, target: any, mood: string, baseOpacity: number, flickerPreset: FlickerPreset) {
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

export default moodModule

/** @internal */
export function addMood(ctx: any, mood: MoodType, intensity?: number, duration: number = 800) {
  moodModule.__handler?.({ action: 'add', mood, intensity, duration }, ctx)
}
