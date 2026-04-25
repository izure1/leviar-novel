import type { EasingType, Rectangle } from 'leviar'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia' | 'inherit'
export type FlashPreset = 'white' | 'red' | 'yellow' | 'inherit'
export type WipePreset = 'left' | 'right' | 'up' | 'down' | 'inherit'

/** 화면을 페이드인/아웃한다 */
export interface ScreenFadeCmd {
  dir: 'in' | 'out'
  preset?: FadeColorPreset
  duration?: number
}

/** 화면을 순간 플래시한다 */
export interface ScreenFlashCmd {
  preset?: FlashPreset
  duration?: number
  repeat?: number
}

/** 화면을 와이프 전환한다 */
export interface ScreenWipeCmd {
  dir: 'in' | 'out'
  preset?: WipePreset
  duration?: number
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
  lastPreset: string
  isCovered: boolean
  coveredColor: string
}

const screenFadeModule = define<ScreenFadeCmd, ScreenFadeSchema>({ 
  lastPreset: 'black',
  isCovered: false,
  coveredColor: 'rgba(0,0,0,1)'
})

screenFadeModule.defineView((data, ctx) => {
  let rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) {
    const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
    const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
    rect = ctx.renderer.world.createRectangle({
      style: {
        color: 'rgba(0,0,0,1)', width: w * 2, height: h * 2,
        opacity: 0, zIndex: Z_INDEX.TRANSITION, pointerEvents: false,
      },
      transform: { position: { x: 0, y: 0, z: 10 } },
    })
    ctx.renderer.world.camera?.addChild(rect)
    ctx.renderer.track(rect)
    ctx.renderer.state.set('_transitionObj', rect)
  }

  if (data.isCovered) {
    rect.style.color = data.coveredColor
    rect.style.opacity = 1
    rect.transform.position.x = 0
    rect.transform.position.y = 0
  } else {
    rect.style.opacity = 0
  }

  return {
    show: () => {},
    hide: () => {},
    update: () => {},
  }
})

screenFadeModule.defineCommand(function* (cmd, ctx, data) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? data.lastPreset
    : cmd.preset
  data.lastPreset = resolvedPreset

  const cfg = FADE_PRESETS[resolvedPreset as Exclude<FadeColorPreset, 'inherit'>]
  if (!cfg) return true

  data.isCovered = cmd.dir === 'out'
  data.coveredColor = cfg.color

  const rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) return true

  rect.style.color = cfg.color
  rect.transform.position.x = 0
  rect.transform.position.y = 0

  const startOpacity = cmd.dir === 'in' ? 1 : 0
  const endOpacity = cmd.dir === 'in' ? 0 : 1
  rect.style.opacity = startOpacity

  const dur = ctx.renderer.dur(cmd.duration ?? 600)
  ctx.renderer.animate(rect, { style: { opacity: endOpacity } }, dur, cfg.easing)

  return true
})

export { screenFadeModule }

// ─── screen-flash 모듈 ───────────────────────────────────────

export interface ScreenFlashSchema {
  lastPreset: string
}

const screenFlashModule = define<ScreenFlashCmd, ScreenFlashSchema>({ lastPreset: 'white' })

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
    update: () => { }
  }
})

screenFlashModule.defineCommand(function* (cmd, ctx, data) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? data.lastPreset
    : cmd.preset
  data.lastPreset = resolvedPreset

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
  lastPreset: string
  lastFadePreset: string
}

const screenWipeModule = define<ScreenWipeCmd, ScreenWipeSchema>({
  lastPreset: 'left',
  lastFadePreset: 'black'
})

screenWipeModule.defineView((_data, _ctx) => ({
  show: () => { },
  hide: () => { },
}))

screenWipeModule.defineCommand(function* (cmd, ctx, data) {
  const resolvedPreset = (cmd.preset === 'inherit' || !cmd.preset)
    ? data.lastPreset
    : cmd.preset
  data.lastPreset = resolvedPreset

  const cfg = WIPE_PRESETS[resolvedPreset as Exclude<WipePreset, 'inherit'>]
  if (!cfg) return true

  const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
  const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
  const dur = ctx.renderer.dur(cmd.duration ?? 800)

  const dx = cfg.x * w * 2
  const dy = cfg.y * h * 2

  // 페이드 색상은 screen-fade 모듈의 state에서 가져옴 (renderer.state 공유)
  const fadeState = ctx.state.get('screen-fade') as ScreenFadeSchema | undefined
  const colorPreset = fadeState?.lastPreset ?? data.lastFadePreset
  const color = FADE_PRESETS[colorPreset as Exclude<FadeColorPreset, 'inherit'>]?.color ?? 'rgba(0,0,0,1)'

  if (fadeState) {
    fadeState.isCovered = cmd.dir === 'out'
    fadeState.coveredColor = color
  }

  const rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) return true

  rect.style.opacity = 1

  let gradDir = ''
  if (cmd.dir === 'out') {
    if (cfg.x === -1) gradDir = 'to right'
    else if (cfg.x === 1) gradDir = 'to left'
    else if (cfg.y === -1) gradDir = 'to bottom'
    else if (cfg.y === 1) gradDir = 'to top'
  } else {
    if (cfg.x === -1) gradDir = 'to left'
    else if (cfg.x === 1) gradDir = 'to right'
    else if (cfg.y === -1) gradDir = 'to top'
    else if (cfg.y === 1) gradDir = 'to bottom'
  }

  let colorTransparent = 'transparent'
  if (color.startsWith('rgba(')) {
    colorTransparent = color.replace(/[\d.]+\)$/, '0)')
  }

  rect.style.color = `linear-gradient(${gradDir}, ${color} 95%, ${colorTransparent} 100%)`

  if (cmd.dir === 'out') {
    rect.transform.position.x = dx
    rect.transform.position.y = dy
    ctx.renderer.animate(rect, { transform: { position: { x: 0, y: 0 } } }, dur, 'linear')
  } else {
    rect.transform.position.x = 0
    rect.transform.position.y = 0
    ctx.renderer.animate(rect, { transform: { position: { x: dx, y: dy } } }, dur, 'linear')
  }

  return true
})

export { screenWipeModule }
