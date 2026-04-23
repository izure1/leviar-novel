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

// ─── 런타임 오브젝트 참조 (직렬화 불가 → `_` prefix) ──────────

function getOverlayObjs(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_overlayObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_overlayObjs', objs)
  }
  return objs
}

// ─── 직렬화 가능한 텍스트 데이터 (세이브 포함) ───────────────

/**
 * 현재 화면에 표시 중인 오버레이 텍스트 데이터.
 * `renderer.state['overlayTexts']`에 저장 → pluginState → SaveData에 포함됨.
 */
function getOverlayTexts(ctx: SceneContext): Record<string, string> {
  let texts = ctx.renderer.state.get('overlayTexts') as Record<string, string> | undefined
  if (!texts) {
    texts = {}
    ctx.renderer.state.set('overlayTexts', texts)
  }
  return texts
}

// ─── 핵심 로직 ───────────────────────────────────────────────

export function addOverlay(ctx: SceneContext, text: string, preset: OverlayPreset = 'caption') {
  const defaults = OVERLAY_PRESETS[preset]
  const p = {
    fontSize: defaults.fontSize,
    color: defaults.color,
    opacity: defaults.opacity,
    zIndex: defaults.zIndex,
    y: defaults.y,
    fontWeight: undefined,
    fontFamily: undefined,
    lineHeight: undefined,
  }

  const objs = getOverlayObjs(ctx)
  if (objs[preset]) removeOverlay(ctx, preset, 0)

  const yMap: Record<string, number> = {
    top: ctx.renderer.height * 0.1,
    center: ctx.renderer.height * 0.5,
    bottom: ctx.renderer.height * 0.85,
  }

  const cam = ctx.renderer.world.camera
  const pos = cam && typeof cam.canvasToLocal === 'function'
    ? cam.canvasToLocal(ctx.renderer.width / 2, yMap[p.y])
    : { x: 0, y: 0, z: 100 }

  const textObj = ctx.renderer.world.createText({
    attribute: { text },
    style: {
      fontSize: p.fontSize,
      fontWeight: p.fontWeight,
      fontFamily: p.fontFamily,
      lineHeight: p.lineHeight,
      color: p.color,
      opacity: p.opacity,
      zIndex: p.zIndex,
      pointerEvents: false,
    },
    transform: { position: pos },
  })

  ctx.renderer.world.camera?.addChild(textObj)
  ctx.renderer.track(textObj)
  objs[preset] = textObj

  // 텍스트 데이터 저장 (cmdState — 세이브/로드 일관성)
  const curTexts = ctx.cmdState.get('overlay') ?? {}
  ctx.cmdState.set('overlay', { ...curTexts, [preset]: text })
  // renderer.state 동기도 유지 (rebuildOverlays 헬퍼 호환)
  getOverlayTexts(ctx)[preset] = text
}

function removeOverlay(ctx: SceneContext, preset: OverlayPreset, duration: number = 600) {
  const objs = getOverlayObjs(ctx)
  const texts = getOverlayTexts(ctx)
  const obj = objs[preset]
  if (obj) {
    delete objs[preset]
    delete texts[preset]
    // cmdState 동기화
    const curTexts = ctx.cmdState.get('overlay') ?? {}
    const newTexts = { ...curTexts }
    delete newTexts[preset]
    ctx.cmdState.set('overlay', newTexts)
    const dur = ctx.renderer.dur(duration)
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

// ─── rebuildFromState 연동용 헬퍼 (Renderer에서 호출) ─────────

/**
 * 세이브에서 복원 시 저장된 overlayTexts 데이터를 이용해 오버레이를 재생성합니다.
 * Renderer.rebuildFromState()에서 호출됩니다.
 */
export function rebuildOverlays(ctx: SceneContext): void {
  const texts = ctx.renderer.state.get('overlayTexts') as Record<string, string> | undefined
  if (!texts) return
  for (const [preset, text] of Object.entries(texts)) {
    addOverlay(ctx, text, preset as OverlayPreset)
  }
}
