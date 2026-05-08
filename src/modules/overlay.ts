import type { Style, EasingType } from 'leviar'
import type { AssetKeysOf } from '../types/config'
import type { CameraEffectPreset } from './camera'
import { playMotionEffect } from '../core/motion'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'
import type { SetStateFn } from '../define/defineCmdUI'
import type { SceneContext } from '../core/SceneContext'

export type OverlayPreset = 'caption' | 'title' | 'whisper'

// ─── 오버레이 항목 타입 ───────────────────────────────────────

/** 텍스트 오버레이 항목 */
export interface OverlayTextEntry {
  kind: 'text'
  /** 오버레이 고유 이름 */
  name: string
  text: string
  preset: OverlayPreset
}

/** 이미지 오버레이 항목 */
export interface OverlayImageEntry {
  kind: 'image'
  /** 오버레이 고유 이름 */
  name: string
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

/** 텍스트 오버레이를 표시하거나 숨긴다 */
export type OverlayTextCmd =
  | {
    /** 수행할 동작입니다. (표시) */
    action: 'show'
    /** 오버레이 고유 이름. 중복된 name은 transition 처리됩니다. */
    name: string
    /** 화면에 표시할 텍스트입니다. */
    text: string
    /**
     * 텍스트 오버레이의 스타일 프리셋입니다.
     * 기본값: 'caption'
     */
    preset?: OverlayPreset
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
    /** 애니메이션의 이징 함수 이름입니다. */
    ease?: EasingType
  }
  | {
    /** 수행할 동작입니다. (숨기기) */
    action: 'hide'
    /** 오버레이 고유 이름. */
    name: string
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
    /** 애니메이션의 이징 함수 이름입니다. */
    ease?: EasingType
  }

/** 이미지 오버레이를 표시하거나 숨긴다 */
export type OverlayImageCmd<TConfig = any> =
  | {
    /** 수행할 동작입니다. (표시) */
    action: 'show'
    /** 오버레이 고유 이름. 중복된 name은 transition 처리됩니다. */
    name: string
    /** 화면에 표시할 이미지 에셋 키입니다. */
    src: AssetKeysOf<TConfig>
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
    /** 애니메이션의 이징 함수 이름입니다. */
    ease?: EasingType
  }
  | {
    /** 수행할 동작입니다. (숨기기) */
    action: 'hide'
    /** 오버레이 고유 이름. */
    name: string
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
    /** 애니메이션의 이징 함수 이름입니다. */
    ease?: EasingType
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
  caption: { fontSize: 24, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_CAPTION, y: 'bottom' },
  title: { fontSize: 48, color: '#ffffff', opacity: 1, zIndex: Z_INDEX.OVERLAY_TITLE, y: 'center' },
  whisper: { fontSize: 18, color: '#cccccc', opacity: 0.7, zIndex: Z_INDEX.OVERLAY_WHISPER, y: 'bottom' },
}

// ─── 스키마 ──────────────────────────────────────────────────

export interface OverlaySchema {
  /** @internal name → 오버레이 항목 맵 */
  _overlays: Record<string, OverlayEntry>
  /** @internal 최근 전환 애니메이션 지속 시간 (ms) */
  _lastDuration?: number
  /** @internal 최근 전환 애니메이션 이징 함수 이름 */
  _lastEase?: string

  // ─── defineInitial로 커스텀 가능한 스타일 ────────────────
  /** 텍스트 오버레이 기본 스타일 오버라이드 */
  textStyle?: Partial<Style>
  /** 이미지 오버레이 기본 스타일 오버라이드 */
  imageStyle?: Partial<Style>
}

// ─── 엔트리 변경 감지 헬퍼 ──────────────────────────────────

function _isSameEntry(a: OverlayEntry, b: OverlayEntry): boolean {
  if (a.kind !== b.kind || a.name !== b.name) return false
  if (a.kind === 'text' && b.kind === 'text') {
    return a.text === b.text && a.preset === b.preset
  }
  if (a.kind === 'image' && b.kind === 'image') {
    return (
      a.src === b.src &&
      a.x === b.x &&
      a.y === b.y &&
      a.width === b.width &&
      a.height === b.height &&
      a.fit === b.fit &&
      a.zIndex === b.zIndex &&
      a.opacity === b.opacity
    )
  }
  return false
}

// ─── 뷰 헬퍼 (text/image 공용) ───────────────────────────────

/**
 * overlay-text, overlay-image 두 모듈이 공유하는 뷰 팩토리.
 * 내부적으로 `_overlayObjs` 맵을 공유합니다.
 */
function buildOverlayView(ctx: SceneContext, data: OverlaySchema, setState: SetStateFn<OverlaySchema>) {
  const _overlayObjs: Record<string, any> = {}
  /** 현재 렌더 중인 엔트리 스냅샷 (변경 감지용) */
  const _overlayEntries: Record<string, OverlayEntry> = {}

  // ─── 텍스트 preset Y 위치 계산 ───────────────────────────
  const _resolvePresetPos = (y: 'top' | 'center' | 'bottom') => {
    const cam = ctx.renderer.world.camera
    const yMap: Record<string, number> = {
      top: ctx.renderer.height * 0.1,
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
    const cx = ctx.renderer.width * nx
    const cy = ctx.renderer.height * ny
    return cam && typeof cam.canvasToLocal === 'function'
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - ctx.renderer.width / 2, y: -(cy - ctx.renderer.height / 2), z: 100 }
  }

  // ─── 텍스트 추가 ─────────────────────────────────────────
  const _addTextOverlay = (entry: OverlayTextEntry, immediate = false, duration?: number, ease: EasingType = 'easeOut') => {
    const { name, preset, text } = entry
    const defaults = OVERLAY_PRESETS[preset]
    if (!defaults) return

    // 동명 오버레이 존재 → 텍스트만 업데이트 (preset 변경 시는 제거 후 재생성)
    const existing = _overlayObjs[name]
    if (existing) {
      const prevEntry = _overlayEntries[name] as OverlayTextEntry | undefined
      if (prevEntry?.preset === preset) {
        // 같은 preset → 텍스트만 교체
        if (existing.attribute) existing.attribute.text = text
        _overlayEntries[name] = entry
        return
      }
      // preset 변경 → 제거 후 재생성
      _removeOverlay(name, 0, true)
    }

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
    _overlayObjs[name] = textObj
    _overlayEntries[name] = entry

    if (!immediate) textObj.fadeIn(duration ?? 300, ease)
  }

  // ─── 이미지 추가 (0~1 정규화 좌표) ───────────────────────
  const _addImageOverlay = (entry: OverlayImageEntry, immediate = false, duration?: number, ease: EasingType = 'easeOut') => {
    const { name, src, x, y, width, height, fit = 'contain', zIndex, opacity = 1 } = entry

    // 동명 오버레이 존재 → transition() 호출
    const existing = _overlayObjs[name]
    if (existing) {
      const dur = immediate ? 0 : (duration ?? 300)
      if (dur > 0 && typeof existing.transition === 'function') {
        existing.transition(src, dur)
      } else {
        if (existing.attribute) existing.attribute.src = src
      }
      _overlayEntries[name] = entry
      return
    }

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
    _overlayObjs[name] = imgObj
    _overlayEntries[name] = entry

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
      ctx.renderer.animate(imgObj, { style: { opacity } }, duration ?? 300, ease)
    }
  }

  // ─── 제거 ────────────────────────────────────────────────
  const _removeOverlay = (key: string, duration: number, immediate = false, ease: EasingType = 'easeInOutQuad') => {
    const obj = _overlayObjs[key]
    if (obj) {
      delete _overlayObjs[key]
      delete _overlayEntries[key]
      const dur = immediate ? 0 : ctx.renderer.dur(duration)
      if (dur > 0) {
        ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, ease, () => {
          obj.remove()
        })
      } else {
        obj.remove()
      }
    }
  }

  // ─── 오버레이 디스패치 ───────────────────────────────────
  const _addOverlay = (entry: OverlayEntry, immediate = false, duration?: number, ease: EasingType = 'easeOut') => {
    if (entry.kind === 'text') {
      _addTextOverlay(entry, immediate, duration, ease)
    } else {
      _addImageOverlay(entry, immediate, duration, ease)
    }
  }

  // 복원: 저장된 오버레이들 즉시 렌더
  for (const entry of Object.values(data._overlays)) {
    _addOverlay(entry, true)
  }

  return {
    show: () => { },
    hide: () => { },
    onCleanup: () => {
      for (const obj of Object.values(_overlayObjs)) {
        obj.remove()
      }
      Object.keys(_overlayObjs).forEach(k => delete _overlayObjs[k])
      Object.keys(_overlayEntries).forEach(k => delete _overlayEntries[k])
    },
    getObj: (name: string) => _overlayObjs[name] as any | undefined,
    onUpdate: (_ctx: SceneContext, state: OverlaySchema, _setState: SetStateFn<OverlaySchema>) => {
      const dur = state._lastDuration
      const ease = (state._lastEase ?? 'easeInOutQuad') as EasingType
      const newKeys = new Set(Object.keys(state._overlays))
      // 제거된 항목
      for (const key of Object.keys(_overlayObjs)) {
        if (!newKeys.has(key)) _removeOverlay(key, dur ?? 600, false, ease)
      }
      for (const [key, entry] of Object.entries(state._overlays)) {
        const prev = _overlayEntries[key]
        if (!_overlayObjs[key]) {
          // 신규 추가
          _addOverlay(entry, false, dur, (state._lastEase ?? 'easeOut') as EasingType)
        } else if (prev && !_isSameEntry(prev, entry)) {
          // 엔트리 변경 → transition
          _addOverlay(entry, false, dur, (state._lastEase ?? 'easeOut') as EasingType)
        }
      }
    },
  }
}

// ─── overlay-text 모듈 ───────────────────────────────────────

/**
 * 텍스트 오버레이 모듈.
 *
 * @example
 * // 텍스트 표시 (name 필수)
 * { type: 'overlay-text', action: 'show', name: 'chapter', text: '제 1장', preset: 'title' }
 *
 * // 동명 오버레이 재호출 → 자동 transition
 * { type: 'overlay-text', action: 'show', name: 'chapter', text: '제 2장', preset: 'title' }
 *
 * // 숨기기
 * { type: 'overlay-text', action: 'hide', name: 'chapter' }
 */
const overlayTextModule = define<OverlayTextCmd, OverlaySchema>({
  _overlays: {},
  textStyle: undefined,
  imageStyle: undefined,
})

overlayTextModule.defineView(buildOverlayView)

overlayTextModule.defineCommand(function* (cmd, _ctx, state, setState) {
  const newOverlays = { ...state._overlays }

  if (cmd.action === 'show') {
    const preset: OverlayPreset = cmd.preset ?? 'caption'
    newOverlays[cmd.name] = {
      kind: 'text',
      name: cmd.name,
      text: cmd.text,
      preset,
    } satisfies OverlayTextEntry
  } else {
    // hide
    delete newOverlays[cmd.name]
  }

  setState({ _overlays: newOverlays, _lastDuration: cmd.duration, _lastEase: cmd.ease })
  return true
})

// ─── overlay-image 모듈 ──────────────────────────────────────

/**
 * 이미지 오버레이 모듈.
 *
 * @example
 * // 이미지 표시 (name, src 필수)
 * { type: 'overlay-image', action: 'show', name: 'logo', src: 'cg-logo', x: 0.5, y: 0.3, width: 400 }
 *
 * // 동명 오버레이 재호출 → 자동 transition
 * { type: 'overlay-image', action: 'show', name: 'logo', src: 'cg-logo2', x: 0.5, y: 0.3 }
 *
 * // 숨기기
 * { type: 'overlay-image', action: 'hide', name: 'logo' }
 */
const overlayImageModule = define<OverlayImageCmd<any>, OverlaySchema>({
  _overlays: {},
  textStyle: undefined,
  imageStyle: undefined,
})

overlayImageModule.defineView(buildOverlayView)

overlayImageModule.defineCommand(function* (cmd, _ctx, state, setState) {
  const newOverlays = { ...state._overlays }

  if (cmd.action === 'show') {
    newOverlays[cmd.name] = {
      kind: 'image',
      name: cmd.name,
      src: cmd.src as string,
      x: cmd.x ?? 0.5,
      y: cmd.y ?? 0.5,
      width: cmd.width,
      height: cmd.height,
      fit: cmd.fit,
      zIndex: cmd.zIndex,
      opacity: cmd.opacity,
    } satisfies OverlayImageEntry
  } else {
    // hide
    delete newOverlays[cmd.name]
  }

  setState({ _overlays: newOverlays, _lastDuration: cmd.duration, _lastEase: cmd.ease })
  return true
})

export { overlayTextModule, overlayImageModule }

/** @internal */
export function addOverlay(ctx: any, text: string, preset: OverlayPreset = 'caption') {
  overlayTextModule.__handler?.({ action: 'show', name: preset, text, preset }, ctx)
}

// ─── overlay-effect 모듈 ─────────────────────────────────────

/**
 * 오버레이 오브젝트에 흔들림 등 연출 효과를 재생한다.
 *
 * @example
 * { type: 'overlay-effect', name: 'logo', preset: 'shake', duration: 500, intensity: 5, repeat: 3 }
 * { type: 'overlay-effect', name: 'logo', preset: 'reset' }
 */
export interface OverlayEffectCmd {
  /** 효과를 적용할 오버레이의 name입니다. */
  name: string
  /** 연출 효과의 프리셋 이름입니다. */
  preset: CameraEffectPreset
  /** 효과의 전체 지속 시간(ms)입니다. */
  duration?: number
  /** 효과의 강도입니다. 프리셋의 기본값을 덮어씁니다. */
  intensity?: number
  /** 효과를 반복할 횟수입니다. (기본값: 1, 음수일 경우 무한반복) */
  repeat?: number
}

interface OverlayViewEntry {
  show: () => void
  hide: () => void
  getObj: (name: string) => (Record<string, any> & { __activeOverlayEffectStop?: (() => void) | null }) | undefined
}

export interface OverlayEffectSchema { _unused: undefined }

const overlayEffectModule = define<OverlayEffectCmd, OverlayEffectSchema>({ _unused: undefined })

overlayEffectModule.defineView((_ctx, _data, _setState) => ({
  show: () => { },
  hide: () => { },
  onCleanup: () => { },
}))

overlayEffectModule.defineCommand(function* (cmd, ctx) {
  // overlay-text, overlay-image 양쪽 모두에서 찾기
  const textEntry = ctx.ui.get('overlay-text') as OverlayViewEntry | undefined
  const imageEntry = ctx.ui.get('overlay-image') as OverlayViewEntry | undefined
  const overlayObj = textEntry?.getObj(cmd.name) ?? imageEntry?.getObj(cmd.name)

  if (!overlayObj) return true

  playMotionEffect(
    ctx,
    overlayObj,
    cmd.preset,
    cmd.duration,
    cmd.intensity,
    cmd.repeat,
    '__activeOverlayEffectStop'
  )

  return true
})

export { overlayEffectModule }
