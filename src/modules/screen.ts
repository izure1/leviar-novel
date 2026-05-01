import type { EasingType } from 'leviar'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia' | 'inherit'
export type FlashPreset = 'white' | 'red' | 'yellow' | 'inherit'
export type WipePreset = 'left' | 'right' | 'up' | 'down' | 'inherit'

/** 화면을 페이드인/아웃한다 */
export interface ScreenFadeCmd {
  /** 페이드의 방향입니다. ('in': 화면이 나타남, 'out': 화면이 덮임) */
  dir: 'in' | 'out'
  /** 페이드 색상 프리셋입니다. */
  preset?: FadeColorPreset
  /** 전환 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
  /** 애니메이션 진행 중 사용자 입력을 차단할지 여부입니다. */
  disable?: boolean
}

/** 화면을 순간 플래시한다 */
export interface ScreenFlashCmd {
  /** 플래시 색상 프리셋입니다. */
  preset?: FlashPreset
  /** 한 번의 플래시 애니메이션 지속 시간(ms)입니다. */
  duration?: number
  /** 플래시 효과를 반복할 횟수입니다. */
  repeat?: number
}

/** 화면을 와이프 전환한다 */
export interface ScreenWipeCmd {
  /** 와이프의 방향입니다. ('in': 화면이 나타남, 'out': 화면이 덮임) */
  dir: 'in' | 'out'
  /** 와이프 애니메이션의 진행 방향 프리셋입니다. */
  preset?: WipePreset
  /** 전환 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
  /** 애니메이션 진행 중 사용자 입력을 차단할지 여부입니다. */
  disable?: boolean
}

// ─── 프리셋 테이블 ───────────────────────────────────────────

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

// ─── screen-fade 모듈 ────────────────────────────────────────

export interface ScreenFadeSchema {
  _lastPreset: string
  _isCovered: boolean
  _coveredColor: string
}

const screenFadeModule = define<ScreenFadeCmd, ScreenFadeSchema>({
  _lastPreset: 'black',
  _isCovered: false,
  _coveredColor: 'rgba(0,0,0,1)'
})

screenFadeModule.defineView((data, ctx) => {
  let rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) {
    const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
    const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
    rect = ctx.renderer.world.createRectangle({
      style: {
        gradientType: 'linear',
        gradient: '0deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 100%',
        width: w, height: h,
        opacity: 0, zIndex: Z_INDEX.TRANSITION, pointerEvents: false,
      },
      transform: { position: { x: 0, y: 0, z: 10 } },
    })
    ctx.renderer.world.camera?.addChild(rect)
    ctx.renderer.track(rect)
    ctx.renderer.state.set('_transitionObj', rect)
  }

  if (data._isCovered) {
    rect.style.gradientType = 'linear'
    rect.style.gradient = `0deg, ${data._coveredColor} 0%, ${data._coveredColor} 100%`
    rect.style.opacity = 1
    rect.transform.position.x = 0
    rect.transform.position.y = 0
  } else {
    rect.style.opacity = 0
  }

  return {
    show: () => { },
    hide: () => { },
    onUpdate: () => { },
  }
})

screenFadeModule.defineCommand(function* (cmd, ctx, state, setState) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? state._lastPreset
    : cmd.preset

  const cfg = FADE_PRESETS[resolvedPreset as Exclude<FadeColorPreset, 'inherit'>]
  if (!cfg) return true

  setState({
    _lastPreset: resolvedPreset,
    _isCovered: cmd.dir === 'out',
    _coveredColor: cfg.color
  })

  const rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) return true

  rect.style.gradientType = 'linear'
  rect.style.gradient = `0deg, ${cfg.color} 0%, ${cfg.color} 100%`
  rect.transform.position.x = 0
  rect.transform.position.y = 0

  const startOpacity = cmd.dir === 'in' ? 1 : 0
  const endOpacity = cmd.dir === 'in' ? 0 : 1
  rect.style.opacity = startOpacity

  const dur = ctx.renderer.dur(cmd.duration ?? 600)

  const onAnimEnd = () => {
    ctx.callbacks.advance()
  }

  ctx.renderer.animate(rect, { style: { opacity: endOpacity } }, dur, cfg.easing, onAnimEnd)

  if (dur === 0) return true

  if (cmd.disable) {
    ctx.execute({ type: 'control', action: 'disable', duration: dur })
  }

  yield false

  return true
})

export { screenFadeModule }

// ─── screen-flash 모듈 ───────────────────────────────────────

export interface ScreenFlashSchema {
  _lastPreset: string
}

const screenFlashModule = define<ScreenFlashCmd, ScreenFlashSchema>({ _lastPreset: 'white' })

screenFlashModule.defineView((_data, ctx) => {
  let rect = ctx.renderer.state.get('_flashObj')
  if (!rect) {
    const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
    const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
    rect = ctx.renderer.world.createRectangle({
      style: {
        color: 'rgba(255,255,255,1)', width: w * 2, height: h * 2,
        opacity: 0, zIndex: Z_INDEX.TRANSITION + 1, pointerEvents: false,
      },
      transform: { position: { x: 0, y: 0, z: 10 } },
    })
    ctx.renderer.world.camera?.addChild(rect)
    ctx.renderer.track(rect)
    ctx.renderer.state.set('_flashObj', rect)
  }

  rect.style.opacity = 0

  return {
    show: () => { },
    hide: () => { },
    onUpdate: () => { }
  }
})

screenFlashModule.defineCommand(function* (cmd, ctx, state, setState) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? state._lastPreset
    : cmd.preset
  setState({ _lastPreset: resolvedPreset })

  const cfg = FLASH_PRESETS[resolvedPreset as Exclude<FlashPreset, 'inherit'>]
  if (!cfg) return true

  const rect = ctx.renderer.state.get('_flashObj')
  if (!rect) return true

  rect.style.color = cfg.color
  rect.transform.position.x = 0
  rect.transform.position.y = 0

  const flashDuration = ctx.renderer.dur(cmd.duration ?? cfg.duration)
  const repeat = cmd.repeat ?? 1

  let count = 0
  const doFlash = () => {
    if (repeat >= 0 && count >= repeat) return
    count++
    rect.style.opacity = 1
    const anim = ctx.renderer.animate(rect, { style: { opacity: 0 } }, flashDuration, 'easeOut')
    if (anim) anim.on('end', doFlash)
  }
  doFlash()

  return true
})

export { screenFlashModule }

// ─── screen-wipe 모듈 ────────────────────────────────────────

export interface ScreenWipeSchema {
  _lastPreset: string
  _lastFadePreset: string
}

const screenWipeModule = define<ScreenWipeCmd, ScreenWipeSchema>({
  _lastPreset: 'left',
  _lastFadePreset: 'black'
})

screenWipeModule.defineView((_data, _ctx) => ({
  show: () => { },
  hide: () => { },
}))

screenWipeModule.defineCommand(function* (cmd, ctx, state, setState) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? state._lastPreset
    : cmd.preset
  setState({ _lastPreset: resolvedPreset })

  const cfg = WIPE_PRESETS[resolvedPreset as Exclude<WipePreset, 'inherit'>]
  if (!cfg) return true

  const dur = ctx.renderer.dur(cmd.duration ?? 800)

  // 페이드 색상은 screen-fade 모듈의 state에서 가져옴 (renderer.state 공유)
  const fadeState = ctx.state.get('screen-fade') as ScreenFadeSchema | undefined
  const colorPreset = fadeState?._lastPreset ?? state._lastFadePreset
  const color = FADE_PRESETS[colorPreset as Exclude<FadeColorPreset, 'inherit'>]?.color ?? 'rgba(0,0,0,1)'

  // fadeState 업데이트는 애니메이션 종료 후(onEnd) 수행하여, 
  // in 애니메이션 도중 opacity가 0으로 덮어씌워지는 문제를 방지합니다.

  const rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) return true

  rect.style.opacity = 1
  rect.transform.position.x = 0
  rect.transform.position.y = 0

  let gradDir = 0
  if (cfg.x === -1) gradDir = 90
  else if (cfg.x === 1) gradDir = 270
  else if (cfg.y === -1) gradDir = 180
  else if (cfg.y === 1) gradDir = 0

  let colorTransparent = 'transparent'
  if (color.startsWith('rgba(')) {
    colorTransparent = color.replace(/[\d.]+\)$/, '0)')
  }

  rect.style.gradientType = 'linear'

  let startGradient = ''
  let endGradient = ''

  if (cmd.dir === 'out') {
    startGradient = `${gradDir}deg, ${color} -20%, ${colorTransparent} 0%`
    endGradient = `${gradDir}deg, ${color} 100%, ${colorTransparent} 120%`
  } else {
    startGradient = `${gradDir}deg, ${color} 100%, ${colorTransparent} 120%`
    endGradient = `${gradDir}deg, ${color} -20%, ${colorTransparent} 0%`
  }

  rect.style.gradient = startGradient

  const onEnd = () => {
    if (fadeState) {
      fadeState._isCovered = cmd.dir === 'out'
      fadeState._coveredColor = color
    }
  }

  const onAnimEnd = () => {
    onEnd()
    ctx.callbacks.advance()
  }

  // 기존 anim stop (renderer.animate 내 snap이 시작 위치 덮어쓰는 문제 방지)
  const activeAnims = (rect as any).__activeAnims as Map<string, { anim: any }> | undefined
  if (activeAnims) {
    const existing = activeAnims.get('style.gradient')
    if (existing?.anim) {
      existing.anim.stop?.()
      activeAnims.delete('style.gradient')
    }
  }

  ctx.renderer.animate(rect, { style: { gradient: endGradient } }, dur, 'linear', onAnimEnd)

  // dur === 0이면 animate가 onAnimEnd를 이미 동기 호출했으므로 즉시 완료
  if (dur === 0) return true

  // 애니메이션 도중 사용자 클릭으로 조기 진행되지 않도록 입력 차단 (disable 옵션이 켜져있을 때만)
  if (cmd.disable) {
    ctx.execute({ type: 'control', action: 'disable', duration: dur })
  }

  yield false

  return true
})

export { screenWipeModule }
