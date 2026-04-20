import type { SceneContext } from '../core/SceneContext'
import { Z_INDEX } from '../constants/render'
import { defineCmd } from '../define/defineCmd'

export type OverlayPreset = 'caption' | 'title' | 'whisper'

/** 텍스트 오버레이를 추가, 제거, 전체 제거한다 */
export interface OverlayCmd {
  /** 수행할 동작: 'add'(추가), 'remove'(지정 항목 제거), 'clear'(모두 제거). */
  action: 'add' | 'remove' | 'clear'
  /** 화면에 표시할 텍스트입니다. (action이 'add'일 때 필수) */
  text?: string
  /** 텍스트 오버레이의 스타일 프리셋(캡션, 타이틀 등)입니다. */
  preset?: OverlayPreset
  /** 'remove' 또는 'clear' 시 텍스트가 페이드아웃 되는 시간(ms 단위)입니다. */
  duration?: number
}

const OVERLAY_PRESETS: Record<OverlayPreset, { fontSize: number; color: string; opacity: number; zIndex: number; y: 'top' | 'center' | 'bottom' }> = {
  caption: { fontSize: 24, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title: { fontSize: 48, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' },
}

function getOverlayObjs(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_overlayObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_overlayObjs', objs)
  }
  return objs
}

function addOverlay(ctx: SceneContext, text: string, preset: OverlayPreset = 'caption') {
  const defaults = OVERLAY_PRESETS[preset]
  const uiOv = ctx.renderer.ui?.overlay?.[preset] ?? {}
  const p = {
    fontSize: uiOv.fontSize ?? defaults.fontSize,
    color: uiOv.color ?? defaults.color,
    opacity: uiOv.opacity ?? defaults.opacity,
    zIndex: defaults.zIndex,
    y: defaults.y,
    fontWeight: (uiOv as any).fontWeight,
    fontFamily: (uiOv as any).fontFamily,
    lineHeight: (uiOv as any).lineHeight,
  }

  const objs = getOverlayObjs(ctx)
  if (objs[preset]) removeOverlay(ctx, preset)

  const yMap: Record<string, number> = {
    top: ctx.renderer.height * 0.1,
    center: ctx.renderer.height * 0.5,
    bottom: ctx.renderer.height * 0.85,
  }

  const cam = ctx.renderer.world.camera as any
  const pos = cam && typeof cam.canvasToLocal === 'function'
    ? cam.canvasToLocal(ctx.renderer.width / 2, yMap[p.y])
    : { x: 0, y: 0, z: 100 }

  const textObj = ctx.renderer.world.createText({
    attribute: { text } as any,
    style: {
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      fontFamily: p.fontFamily,
      lineHeight: p.lineHeight,
      color: p.color,
      opacity: p.opacity,
      zIndex: p.zIndex,
      pointerEvents: false,
    } as any,
    transform: { position: pos },
  })

  ctx.renderer.world.camera?.addChild(textObj as any)
  ctx.renderer.track(textObj as any)
  objs[preset] = textObj
}

function removeOverlay(ctx: SceneContext, preset: OverlayPreset, duration: number = 600) {
  const objs = getOverlayObjs(ctx)
  const obj = objs[preset]
  if (obj) {
    delete objs[preset]
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

function clearOverlay(ctx: SceneContext, duration: number = 400) {
  const objs = getOverlayObjs(ctx)
  Object.keys(objs).forEach(k => removeOverlay(ctx, k as OverlayPreset, duration))
}

export const overlayHandler = defineCmd<OverlayCmd>((cmd, ctx) => {
  if (cmd.action === 'add') {
    if (cmd.text) addOverlay(ctx, cmd.text, cmd.preset ?? 'caption')
  } else if (cmd.action === 'remove') {
    removeOverlay(ctx, cmd.preset ?? 'caption', cmd.duration)
  } else if (cmd.action === 'clear') {
    clearOverlay(ctx, cmd.duration)
  }
  return false
})
