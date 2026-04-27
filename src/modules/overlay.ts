import type { Style } from 'leviar'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type OverlayPreset = 'caption' | 'title' | 'whisper'

// ─── 오버레이 항목 타입 ───────────────────────────────────────

/** 텍스트 오버레이 항목 */
export interface OverlayTextEntry {
  kind: 'text'
  text: string
  preset: OverlayPreset
}

/** 이미지 오버레이 항목 */
export interface OverlayImageEntry {
  kind: 'image'
  /** 등록 ID (overlays 맵의 key로 사용) */
  id: string
  /** 에셋 키 또는 파일 경로 */
  src: string
  /**
   * 화면 내 가로 위치 (0~1, 0=좌, 0.5=중앙, 1=우).
   * `canvasToLocal`을 통해 월드 좌표로 변환됩니다.
   */
  x: number
  /**
   * 화면 내 세로 위치 (0~1, 0=상, 0.5=중앙, 1=하).
   * `canvasToLocal`을 통해 월드 좌표로 변환됩니다.
   */
  y: number
  /** 이미지 너비(px). 미지정 시 화면 너비의 50% */
  width?: number
  /** 이미지 높이(px). 미지정 시 자동 */
  height?: number
  /** 화면 맞춤 방식 (cover | contain | stretch). 기본값: 'contain' */
  fit?: 'cover' | 'contain' | 'stretch'
  /** z-index. 미지정 시 Z_INDEX.OVERLAY_CAPTION */
  zIndex?: number
  /** 불투명도 (0~1). 기본값: 1 */
  opacity?: number
}

export type OverlayEntry = OverlayTextEntry | OverlayImageEntry

// ─── 커맨드 타입 ─────────────────────────────────────────────

/** 텍스트/이미지 오버레이를 추가, 제거, 전체 제거한다 */
export interface OverlayCmd {
  /** 수행할 동작입니다. (추가, 제거, 모두 지우기) */
  action: 'add' | 'remove' | 'clear'
  /** 화면에 표시할 텍스트입니다. (text 모드) */
  text?: string
  /** 화면에 표시할 이미지 에셋 키 또는 파일 경로입니다. (image 모드) */
  image?: string
  /**
   * 텍스트 오버레이의 스타일 프리셋입니다. (text 전용)
   * image 모드에서는 무시됩니다.
   */
  preset?: OverlayPreset
  /**
   * 이미지 오버레이의 고유 ID. (image 전용)
   * remove 시에도 이 값으로 대상을 지정합니다.
   * 미지정 시 `image` 값(에셋 키)이 ID로 사용됩니다.
   */
  id?: string
  /**
   * 이미지 가로 위치 (0~1). (image 전용)
   * 기본값: 0.5 (중앙)
   */
  x?: number
  /**
   * 이미지 세로 위치 (0~1). (image 전용)
   * 기본값: 0.5 (중앙)
   */
  y?: number
  /** 이미지 너비(px) */
  width?: number
  /** 이미지 높이(px) */
  height?: number
  /** 이미지 화면 맞춤 방식 (기본값: 'contain') */
  fit?: 'cover' | 'contain' | 'stretch'
  /** 이미지 z-index */
  zIndex?: number
  /** 이미지 불투명도 (0~1). 기본값: 1 */
  opacity?: number
  /** 전환 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
}

// ─── 텍스트 프리셋 기본값 ────────────────────────────────────

interface TextPresetDefaults {
  fontSize: number
  color: string
  opacity: number
  zIndex: number
  y: 'top' | 'center' | 'bottom'
}

const OVERLAY_PRESETS: Record<OverlayPreset, TextPresetDefaults> = {
  caption: { fontSize: 24, color: '#ffffff', opacity: 1,   zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title:   { fontSize: 48, color: '#ffffff', opacity: 1,   zIndex: Z_INDEX.OVERLAY_TITLE,   y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' },
}

// ─── 스키마 ──────────────────────────────────────────────────

export interface OverlaySchema {
  /** preset key → 오버레이 항목 맵 */
  overlays: Record<string, OverlayEntry>

  // ─── defineInitial로 커스텀 가능한 스타일 ────────────────
  /** 텍스트 오버레이 기본 스타일 오버라이드 */
  textStyle?: Partial<Style>
  /** 이미지 오버레이 기본 스타일 오버라이드 */
  imageStyle?: Partial<Style>
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 오버레이 모듈. `novel.config`의 `modules: { 'overlay': overlayModule }` 형태로 등록합니다.
 *
 * @example
 * ```ts
 * // 텍스트 오버레이 (preset 기반 위치)
 * { type: 'overlay', action: 'add', preset: 'title', text: '제 1장' }
 *
 * // 이미지 오버레이 (0~1 정규화 좌표 기반 위치)
 * { type: 'overlay', action: 'add', image: 'cg-logo', x: 0.5, y: 0.3, width: 400 }
 *
 * // 이미지 제거 (id 미지정 시 image 키로 대상 특정)
 * { type: 'overlay', action: 'remove', image: 'cg-logo' }
 *
 * // defineInitial로 스타일 커스텀
 * defineScene({ config, initial: { overlay: { textStyle: { fontFamily: 'serif' } } } }, [...])
 * ```
 */
const overlayModule = define<OverlayCmd, OverlaySchema>({
  overlays: {},
  textStyle: undefined,
  imageStyle: undefined,
})

overlayModule.defineView((data, ctx) => {
  const _overlayObjs: Record<string, any> = {}

  // ─── 텍스트 preset Y 위치 계산 ───────────────────────────
  const _resolvePresetPos = (y: 'top' | 'center' | 'bottom') => {
    const cam = ctx.renderer.world.camera
    const yMap: Record<string, number> = {
      top:    ctx.renderer.height * 0.1,
      center: ctx.renderer.height * 0.5,
      bottom: ctx.renderer.height * 0.85,
    }
    return cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(ctx.renderer.width / 2, yMap[y])
      : { x: 0, y: 0, z: 100 }
  }

  // ─── 이미지 0~1 좌표 → 월드 좌표 변환 ────────────────────
  const _resolveNormPos = (nx: number, ny: number) => {
    const cam = ctx.renderer.world.camera
    const cx = ctx.renderer.width  * nx
    const cy = ctx.renderer.height * ny
    return cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - ctx.renderer.width / 2, y: -(cy - ctx.renderer.height / 2), z: 100 }
  }

  // ─── 텍스트 추가 ─────────────────────────────────────────
  const _addTextOverlay = (preset: OverlayPreset, text: string, immediate = false) => {
    const defaults = OVERLAY_PRESETS[preset]
    if (!defaults) return

    if (_overlayObjs[preset]) _removeOverlay(preset, 0, true)

    const pos = _resolvePresetPos(defaults.y)
    const mergedStyle: Partial<Style> = {
      fontSize: defaults.fontSize,
      color: defaults.color,
      opacity: defaults.opacity,
      zIndex: defaults.zIndex,
      pointerEvents: false,
      ...(data.textStyle ?? {}),
    }

    const textObj = ctx.renderer.world.createText({
      attribute: { text },
      style: mergedStyle as Style,
      transform: { position: pos },
    })
    ctx.renderer.world.camera?.addChild(textObj)
    ctx.renderer.track(textObj)
    _overlayObjs[preset] = textObj

    if (!immediate) textObj.fadeIn(300, 'easeOut')
  }

  // ─── 이미지 추가 (0~1 정규화 좌표) ───────────────────────
  const _addImageOverlay = (entry: OverlayImageEntry, immediate = false) => {
    const { id, src, x, y, width, height, fit = 'contain', zIndex, opacity = 1 } = entry

    if (_overlayObjs[id]) _removeOverlay(id, 0, true)

    const pos = _resolveNormPos(x, y)
    const imgW = width ?? ctx.renderer.width * 0.5
    const imgH = height ?? 0
    const targetZIndex = zIndex ?? Z_INDEX.OVERLAY_CAPTION

    const imgObj = ctx.renderer.world.createImage({
      attribute: { src },
      style: {
        width: imgW,
        ...(imgH > 0 ? { height: imgH } : {}),
        zIndex: targetZIndex,
        opacity: immediate ? opacity : 0,
        pointerEvents: false,
        ...(data.imageStyle ?? {}),
      } as Style,
      transform: { position: pos },
    })
    ctx.renderer.world.camera?.addChild(imgObj)
    ctx.renderer.track(imgObj)
    _overlayObjs[id] = imgObj

    // fit 처리: cover/contain 시 이미지 로드 후 크기 재계산
    if (fit !== 'stretch' && imgH === 0) {
      const checkFit = () => {
        const rw = (imgObj as any).__renderedSize?.w
        const rh = (imgObj as any).__renderedSize?.h
        if (rw > 0 && rh > 0) {
          const imgRatio = rw / rh
          if (fit === 'contain') {
            imgObj.style.height = imgW / imgRatio
          } else if (fit === 'cover') {
            const targetH = ctx.renderer.height
            imgObj.style.width = targetH * imgRatio
            imgObj.style.height = targetH
          }
        } else {
          requestAnimationFrame(checkFit)
        }
      }
      checkFit()
    }

    if (!immediate) {
      ctx.renderer.animate(imgObj, { style: { opacity } }, 300, 'easeOut')
    }
  }

  // ─── 제거 ────────────────────────────────────────────────
  const _removeOverlay = (key: string, duration: number, immediate = false) => {
    const obj = _overlayObjs[key]
    if (obj) {
      delete _overlayObjs[key]
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

  // ─── 오버레이 디스패치 ───────────────────────────────────
  const _addOverlay = (entry: OverlayEntry, immediate = false) => {
    if (entry.kind === 'text') {
      _addTextOverlay(entry.preset, entry.text, immediate)
    } else {
      _addImageOverlay(entry, immediate)
    }
  }

  // 복원: 저장된 오버레이들 즉시 렌더
  for (const entry of Object.values(data.overlays)) {
    _addOverlay(entry, true)
  }

  return {
    show: () => {},
    hide: () => {
      for (const obj of Object.values(_overlayObjs)) {
        obj?.fadeOut?.(300, 'easeIn')
      }
    },
    update: (d: OverlaySchema) => {
      const newKeys = new Set(Object.keys(d.overlays))
      for (const key of Object.keys(_overlayObjs)) {
        if (!newKeys.has(key)) _removeOverlay(key, 600)
      }
      for (const [key, entry] of Object.entries(d.overlays)) {
        if (!_overlayObjs[key]) {
          _addOverlay(entry)
        }
      }
    },
  }
})

overlayModule.defineCommand(function* (cmd, ctx, state, setState) {
  const newOverlays = { ...state.overlays }

  if (cmd.action === 'add') {
    if (cmd.image) {
      // 이미지 모드: id 미지정 시 image 값(에셋 키)을 key로 사용
      const id = cmd.id ?? cmd.image
      newOverlays[id] = {
        kind: 'image',
        id,
        src: cmd.image,
        x: cmd.x ?? 0.5,
        y: cmd.y ?? 0.5,
        width: cmd.width,
        height: cmd.height,
        fit: cmd.fit,
        zIndex: cmd.zIndex,
        opacity: cmd.opacity,
      } satisfies OverlayImageEntry
    } else if (cmd.text) {
      // 텍스트 모드: preset을 key로 사용
      const preset: OverlayPreset = cmd.preset ?? 'caption'
      newOverlays[preset] = {
        kind: 'text',
        text: cmd.text,
        preset,
      } satisfies OverlayTextEntry
    }
  } else if (cmd.action === 'remove') {
    // 이미지: id 또는 image 값, 텍스트: preset
    const key = cmd.id ?? cmd.image ?? cmd.preset ?? 'caption'
    delete newOverlays[key]
  } else if (cmd.action === 'clear') {
    for (const k of Object.keys(newOverlays)) delete newOverlays[k]
  }

  setState({ overlays: newOverlays })
  return true
})

export default overlayModule

/** @internal */
export function addOverlay(ctx: any, text: string, preset: OverlayPreset = 'caption') {
  overlayModule.__handler?.({ action: 'add', text, preset }, ctx)
}
