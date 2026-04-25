import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type OverlayPreset = 'caption' | 'title' | 'whisper'

/** 텍스트 오버레이를 추가, 제거, 전체 제거한다 */
export interface OverlayCmd {
  action: 'add' | 'remove' | 'clear'
  text?: string
  preset?: OverlayPreset
  duration?: number
}

const OVERLAY_PRESETS: Record<OverlayPreset, { fontSize: number; color: string; opacity: number; zIndex: number; y: 'top' | 'center' | 'bottom' }> = {
  caption: { fontSize: 24, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title: { fontSize: 48, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' },
}

// ─── 스키마 ──────────────────────────────────────────────────

export interface OverlaySchema {
  /** preset → text 맵 */
  overlays: Record<string, string>
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 오버레이 모듈. `novel.config`의 `modules: { 'overlay': overlayModule }` 형태로 등록합니다.
 */
const overlayModule = define<OverlayCmd, OverlaySchema>({
  overlays: {},
})

overlayModule.defineView((data, ctx) => {
  const _overlayObjs: Record<string, any> = {}

  const _addOverlay = (preset: OverlayPreset, text: string, immediate = false) => {
    const defaults = OVERLAY_PRESETS[preset]
    if (!defaults) return

    if (_overlayObjs[preset]) {
      _removeOverlay(preset, 0, true)
    }

    const yMap: Record<string, number> = {
      top: ctx.renderer.height * 0.1,
      center: ctx.renderer.height * 0.5,
      bottom: ctx.renderer.height * 0.85,
    }
    const cam = ctx.renderer.world.camera
    const pos = cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(ctx.renderer.width / 2, yMap[defaults.y])
      : { x: 0, y: 0, z: 100 }

    const textObj = ctx.renderer.world.createText({
      attribute: { text },
      style: {
        fontSize: defaults.fontSize,
        color: defaults.color,
        opacity: defaults.opacity,
        zIndex: defaults.zIndex,
        pointerEvents: false,
      },
      transform: { position: pos },
    })
    ctx.renderer.world.camera?.addChild(textObj)
    ctx.renderer.track(textObj)
    _overlayObjs[preset] = textObj
  }

  const _removeOverlay = (preset: OverlayPreset | string, duration: number, immediate = false) => {
    const obj = _overlayObjs[preset]
    if (obj) {
      delete _overlayObjs[preset]
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

  // 복원: 저장된 오버레이들 즉시 렌더
  for (const [preset, text] of Object.entries(data.overlays)) {
    _addOverlay(preset as OverlayPreset, text, true)
  }

  return {
    show: () => {},
    hide: () => {
      for (const obj of Object.values(_overlayObjs)) {
        obj?.fadeOut?.(300, 'easeIn')
      }
    },
    update: (d: OverlaySchema) => {
      const newPresets = new Set(Object.keys(d.overlays))
      for (const preset of Object.keys(_overlayObjs)) {
        if (!newPresets.has(preset)) _removeOverlay(preset, 600)
      }
      for (const [preset, text] of Object.entries(d.overlays)) {
        if (!_overlayObjs[preset]) {
          _addOverlay(preset as OverlayPreset, text)
        }
      }
    },
  }
})

overlayModule.defineCommand(function* (cmd, ctx, data) {
  const newOverlays = { ...data.overlays }

  if (cmd.action === 'add') {
    if (cmd.text) newOverlays[cmd.preset ?? 'caption'] = cmd.text
  } else if (cmd.action === 'remove') {
    delete newOverlays[cmd.preset ?? 'caption']
  } else if (cmd.action === 'clear') {
    for (const k of Object.keys(newOverlays)) delete newOverlays[k]
  }

  data.overlays = newOverlays
  return true
})

export default overlayModule

/** @internal */
export function addOverlay(ctx: any, text: string, preset: OverlayPreset = 'caption') {
  overlayModule.__handler?.({ action: 'add', text, preset }, ctx)
}
