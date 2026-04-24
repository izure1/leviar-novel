import type { SceneContext } from '../core/SceneContext'
import type { EasingType, Rectangle } from 'leviar'
import { Z_INDEX } from '../constants/render'
import { defineCmd } from '../define/defineCmd'

export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia' | 'inherit'
export type FlashPreset = 'white' | 'red' | 'yellow' | 'inherit'
export type WipePreset = 'left' | 'right' | 'up' | 'down' | 'inherit'

/** 화면을 페이드인/아웃한다 */
export interface ScreenFadeCmd {
  /** 'in'은 화면이 밝아지는 것, 'out'은 화면이 지정된 색으로 덮이는 것을 의미합니다. */
  dir: 'in' | 'out'
  /** 페이드에 사용될 색상 프리셋(black, white 등)입니다. */
  preset?: FadeColorPreset
  /** 페이드 애니메이션 시간(ms 단위)입니다. (기본값: 600) */
  duration?: number
}

/** 화면을 순간 플래시한다 */
export interface ScreenFlashCmd {
  /** 플래시 효과에 사용될 색상 프리셋입니다. */
  preset?: FlashPreset
  /** 애니메이션 지속 시간(ms 단위)입니다. (기본값: 프리셋 설정값) */
  duration?: number
  /** 반복 횟수입니다. 음수일 경우 무한 반복합니다. (기본값: 1) */
  repeat?: number
}

/** 화면을 와이프 전환한다 */
export interface ScreenWipeCmd {
  /** 'in'은 새 화면이 덮는 것, 'out'은 현재 화면이 벗겨지는 것을 의미합니다. */
  dir: 'in' | 'out'
  /** 와이프 애니메이션 방향 프리셋(left, up 등)입니다. */
  preset?: WipePreset
  /** 와이프 애니메이션 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

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

function getTransitionRect(ctx: SceneContext, color: string): Rectangle<Record<string, any>> {
  let rect = ctx.renderer.state.get('_transitionObj')
  if (!rect) {
    const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
    const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
    rect = ctx.renderer.world.createRectangle({
      style: {
        color, width: w * 2, height: h * 2,
        opacity: 0, zIndex: Z_INDEX.TRANSITION, pointerEvents: false,
      },
      transform: { position: { x: 0, y: 0, z: 10 } },
    })
    ctx.renderer.world.camera?.addChild(rect)
    ctx.renderer.track(rect)
    ctx.renderer.state.set('_transitionObj', rect)
  } else {
    rect.style.color = color
    rect.transform.position.x = 0
    rect.transform.position.y = 0
  }
  return rect
}

function screenFade(ctx: SceneContext, dir: 'in' | 'out', preset: FadeColorPreset = 'inherit', duration: number = 600) {
  const resolvedPreset = preset === 'inherit' ? ctx.renderer.state.get('_lastFadePreset') ?? 'black' : preset
  ctx.renderer.state.set('_lastFadePreset', resolvedPreset)
  const cfg = FADE_PRESETS[resolvedPreset as Exclude<FadeColorPreset, 'inherit'>]

  if (!cfg) return

  const rect = getTransitionRect(ctx, cfg.color)
  const startOpacity = dir === 'in' ? 1 : 0
  const endOpacity = dir === 'in' ? 0 : 1
  rect.style.opacity = startOpacity

  ctx.renderer.animate(rect, { style: { opacity: endOpacity } }, duration, cfg.easing)
}

function screenFlash(ctx: SceneContext, preset: FlashPreset = 'inherit', duration?: number, repeat: number = 1) {
  const resolvedPreset = preset === 'inherit' ? ctx.renderer.state.get('_lastFlashPreset') ?? 'white' : preset
  ctx.renderer.state.set('_lastFlashPreset', resolvedPreset)
  const cfg = FLASH_PRESETS[resolvedPreset as Exclude<FlashPreset, 'inherit'>]
  if (!cfg) return

  const rect = getTransitionRect(ctx, cfg.color)
  const flashDuration = duration ?? cfg.duration

  let count = 0
  const doFlash = () => {
    if (repeat >= 0 && count >= repeat) return
    count++
    rect.style.opacity = 1
    const anim = ctx.renderer.animate(rect, { style: { opacity: 0 } }, flashDuration, 'easeOut')
    if (anim) {
      anim.on('end', doFlash)
    }
  }

  doFlash()
}

function screenWipe(ctx: SceneContext, dir: 'in' | 'out', preset: WipePreset = 'inherit', duration: number = 800) {
  const resolvedPreset = preset === 'inherit' ? ctx.renderer.state.get('_lastWipePreset') ?? 'left' : preset
  ctx.renderer.state.set('_lastWipePreset', resolvedPreset)
  const cfg = WIPE_PRESETS[resolvedPreset as Exclude<WipePreset, 'inherit'>]
  if (!cfg) return

  const w = (ctx.renderer.world.canvas)?.width ?? ctx.renderer.width
  const h = (ctx.renderer.world.canvas)?.height ?? ctx.renderer.height
  // .bak 기준: w*2 크기로 이동해야 완전히 화면 밖으로 나감
  const dx = cfg.x * w * 2
  const dy = cfg.y * h * 2

  const colorPreset = ctx.renderer.state.get('_lastFadePreset') ?? 'black'
  const color = FADE_PRESETS[colorPreset as Exclude<FadeColorPreset, 'inherit'>]?.color ?? 'rgba(0,0,0,1)'
  const rect = getTransitionRect(ctx, color)
  rect.style.opacity = 1

  if (dir === 'out') {
    // 바깥에서 시작해 중앙으로 → 화면 덮음
    rect.transform.position.x = dx
    rect.transform.position.y = dy
    ctx.renderer.animate(rect, { transform: { position: { x: 0, y: 0 } } }, duration, 'easeInOutQuad')
  } else {
    // 중앙에서 시작해 바깥으로 → 화면 벗겨냄
    rect.transform.position.x = 0
    rect.transform.position.y = 0
    ctx.renderer.animate(rect, { transform: { position: { x: dx, y: dy } } }, duration, 'easeInOutQuad')
  }
}

export const screenFadeHandler = defineCmd<ScreenFadeCmd>((cmd, ctx) => {
  screenFade(ctx, cmd.dir, cmd.preset ?? 'inherit', cmd.duration ?? 600)
  return true
})

export const screenFlashHandler = defineCmd<ScreenFlashCmd>((cmd, ctx) => {
  screenFlash(ctx, cmd.preset ?? 'inherit', cmd.duration, cmd.repeat ?? 1)
  return true
})

export const screenWipeHandler = defineCmd<ScreenWipeCmd>((cmd, ctx) => {
  screenWipe(ctx, cmd.dir, cmd.preset ?? 'inherit', cmd.duration ?? 800)
  return true
})
