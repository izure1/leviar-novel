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
    /** 수행할 동작입니다. ('add': 무드 추가) */
    action?: 'add'
    /** 추가할 화면 무드의 종류입니다. */
    mood: MoodType
    /** 무드 이펙트의 강도(투명도)입니다. */
    intensity?: number
    /** 조명 깜빡임(플리커) 효과 프리셋입니다. */
    flicker?: FlickerPreset
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
    /** 애니메이션 진행 중 사용자 입력을 차단할지 여부입니다. */
    disable?: boolean
  }
  | {
    /** 수행할 동작입니다. ('remove': 무드 제거) */
    action: 'remove'
    /** 제거할 화면 무드의 종류입니다. */
    mood: MoodType
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
    /** 애니메이션 진행 중 사용자 입력을 차단할지 여부입니다. */
    disable?: boolean
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
  /** @internal mood → intensity 맵 */
  _activeMoods: Record<string, number>
  /** @internal mood → flicker 맵 */
  _flickers: Record<string, FlickerPreset>
  /** @internal 최근 전환 애니메이션 지속 시간 (ms) */
  _lastDuration?: number
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 무드 모듈. `novel.config`의 `modules: { 'mood': moodModule }` 형태로 등록합니다.
 */
const moodModule = define<MoodCmd, MoodSchema>({
  _activeMoods: {},
  _flickers: {},
  _lastDuration: 800,
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
  for (const [mood, intensity] of Object.entries(data._activeMoods)) {
    _addMoodObj(mood as MoodType, intensity, 800, true)
    if (data._flickers?.[mood]) {
      _setFlicker(ctx, _moodObjs[mood], mood, intensity, data._flickers[mood])
    }
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
    onUpdate: (d: MoodSchema) => {
      const dur = d._lastDuration ?? 800
      const newMoods = new Set(Object.keys(d._activeMoods))
      // 제거된 무드
      for (const mood of Object.keys(_moodObjs)) {
        if (!newMoods.has(mood)) {
          _removeMoodObj(mood as MoodType, dur)
        }
      }
      // 추가/변경된 무드
      for (const [mood, intensity] of Object.entries(d._activeMoods)) {
        _addMoodObj(mood as MoodType, intensity, dur)
        const preset = d._flickers?.[mood]
        const obj = _moodObjs[mood]
        if (preset && obj) {
          const currentState = ctx.renderer.state.get('_flickerState')
          if (currentState?.mood !== mood || currentState?.preset !== preset) {
            _setFlicker(ctx, obj, mood, intensity, preset)
          }
        }
      }
    },
  }
})

moodModule.defineCommand(function* (cmd, ctx, state, setState) {
  const newMoods = { ...state._activeMoods }
  const newFlickers = { ...(state._flickers || {}) }

  const targetDur = cmd.duration ?? 800

  if (cmd.action === 'remove') {
    delete newMoods[cmd.mood]
    delete newFlickers[cmd.mood]
  } else {
    const addCmd = cmd as Extract<MoodCmd, { action?: 'add' }>

    // action이 명시적으로 'add'가 아닐 경우(undefined) 덮어쓰기로 간주하여 기존 무드 초기화
    if (addCmd.action !== 'add') {
      for (const k of Object.keys(newMoods)) delete newMoods[k]
      for (const k of Object.keys(newFlickers)) delete newFlickers[k]
    }

    if (addCmd.mood !== 'none') {
      const preset = MOOD_PRESETS[addCmd.mood]
      newMoods[addCmd.mood] = addCmd.intensity ?? preset?.defaultIntensity ?? 1
      if (addCmd.flicker) {
        newFlickers[addCmd.mood] = addCmd.flicker
      } else {
        delete newFlickers[addCmd.mood]
      }
    }
  }

  setState({
    _lastDuration: targetDur,
    _activeMoods: newMoods,
    _flickers: newFlickers
  })

  // duration은 애니메이션 시간만 제어합니다.
  // disable: true일 때만 해당 시간동안 입력을 차단하고 대기합니다.
  if (cmd.disable) {
    const dur = ctx.renderer.dur(targetDur)
    if (dur > 0) {
      const timeoutId = setTimeout(() => {
        ctx.callbacks.advance()
      }, dur)

      ctx.execute({ type: 'control', action: 'disable', duration: dur })

      yield false
      clearTimeout(timeoutId)
    }
  }

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
  const loopToken = {}
  target._flickerToken = loopToken

  ctx.renderer.state.set('_flickerObj', target)
  ctx.renderer.state.set('_flickerState', { mood, preset: flickerPreset })

  const step = () => {
    if (ctx.renderer.state.get('_flickerObj') !== target || target._flickerToken !== loopToken) {
      if (ctx.renderer.state.get('_flickerObj') !== target) {
        ctx.renderer.animate(target, { style: { opacity: target._flickerBaseOpacity } }, 300, 'easeInOutQuad')
      }
      return
    }
    const [min, max] = cfg.range
    const next = baseOpacity * (min + Math.random() * (max - min))
    const d = ctx.renderer.dur(cfg.interval)
    if (d === 0) {
      ctx.renderer.animate(target, { style: { opacity: next } }, cfg.interval, 'linear')
      requestAnimationFrame(step)
    } else {
      ctx.renderer.animate(target, { style: { opacity: next } }, cfg.interval, 'linear', step)
    }
  }
  step()
}

export default moodModule

/** @internal */
export function addMood(ctx: any, mood: MoodType, intensity?: number, duration: number = 800) {
  moodModule.__handler?.({ action: 'add', mood, intensity, duration }, ctx)
}
