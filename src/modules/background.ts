import type { BgDefs, BackgroundKeysOf } from '../types/config'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type BackgroundFitPreset = 'stretch' | 'contain' | 'cover' | 'inherit'

/** 
 * 배경을 전환한다 
 * 
 * @example
 * ```ts
 * { type: 'background', name: 'classroom', duration: 1500, fit: 'cover' }
 * ```
 */
export interface BackgroundCmd<TConfig = any> {
  /** 전환할 배경 이미지의 에셋 키(config.backgrounds에 정의됨)입니다. */
  name: BackgroundKeysOf<TConfig>
  /** 배경 이미지의 화면 맞춤 방식(stretch, cover 등)입니다. */
  fit?: BackgroundFitPreset
  /** 배경 전환 시 크로스페이드(Fade)되는 시간(ms 단위)입니다. (기본값: 1000) */
  duration?: number
  /** 대상 에셋을 비디오(video)로 처리할지 여부입니다. (기본값: false) */
  isVideo?: boolean
}

// ─── 스키마 ──────────────────────────────────────────────────

export interface BackgroundSchema {
  /** 현재 배경 키 */
  key: string | undefined
  /** 현재 fit 모드 */
  fit: string
  /** 최근 전환 시간 */
  duration: number
  /** parallax 여부 */
  parallax: boolean
  /** 비디오 여부 */
  isVideo: boolean
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 배경 모듈. `novel.config`의 `modules: { 'background': backgroundModule }` 형태로 등록합니다.
 */
const backgroundModule = define<BackgroundCmd<any>, BackgroundSchema>({
  key: undefined,
  fit: 'cover',
  duration: 1000,
  parallax: true,
  isVideo: false,
})

backgroundModule.defineView((data, ctx) => {
  // 배경 오브젝트 참조
  let _bgObj: any = null
  let _bgParallax: boolean | null = null

  const _createBg = (key: string, fit: string, parallax: boolean, isVideo: boolean, opacity = 1) => {
    const bgDefs = ctx.renderer.config.backgrounds as BgDefs
    const def = bgDefs[key]
    if (!def) return null

    const src = def.src ?? key
    const cam = ctx.renderer.world.camera as any
    const zPos = 2000 // 기존 ctx.renderer.depth(500) * 4
    const baseW = ctx.renderer.width
    const baseH = ctx.renderer.height
    const maxPanX = baseW * 0.08
    const maxPanY = baseH * 0.08
    const ratio = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(zPos, 1) : 1
    const exactW = baseW + maxPanX * 2
    const exactH = baseH + maxPanY * 2

    const createFn = isVideo
      ? ctx.renderer.world.createVideo.bind(ctx.renderer.world)
      : ctx.renderer.world.createImage.bind(ctx.renderer.world)

    const obj = createFn({
      attribute: { src },
      style: {
        width: exactW, height: exactH,
        zIndex: Z_INDEX.BACKGROUND,
        opacity,
        pointerEvents: false,
      },
      transform: { position: { x: 0, y: 0, z: zPos }, scale: { x: ratio, y: ratio, z: 1 } },
    })

    if (fit === 'cover' || fit === 'contain') {
      const checkFit = () => {
        const rw = (obj as any).__renderedSize?.w
        const rh = (obj as any).__renderedSize?.h
        if (rw > 0 && rh > 0) {
          const imgRatio = rw / rh
          const targetRatio = exactW / exactH
          if (fit === 'cover') {
            if (imgRatio > targetRatio) {
              obj.style.width = exactH * imgRatio
              obj.style.height = exactH
            } else {
              obj.style.width = exactW
              obj.style.height = exactW / imgRatio
            }
          } else if (fit === 'contain') {
            if (imgRatio > targetRatio) {
              obj.style.width = exactW
              obj.style.height = exactW / imgRatio
            } else {
              obj.style.width = exactH * imgRatio
              obj.style.height = exactH
            }
          }
        } else {
          requestAnimationFrame(checkFit)
        }
      }
      checkFit()
    }

    if (!parallax) {
      ctx.renderer.world.camera?.addChild(obj)
    }
    ctx.renderer.track(obj)
    return obj
  }

  // 복원: 저장된 배경이 있으면 즉시 렌더
  if (data.key) {
    _bgObj = _createBg(data.key, data.fit, data.parallax, data.isVideo)
    _bgParallax = data.parallax
  }

  return {
    show: (dur = 250) => { _bgObj?.fadeIn?.(dur, 'easeOut') },
    hide: (dur = 300) => { _bgObj?.fadeOut?.(dur, 'easeIn') },
    update: (d: BackgroundSchema) => {
      if (!d.key) return
      const bgDefs = ctx.renderer.config.backgrounds as BgDefs
      const def = bgDefs[d.key]
      if (!def) return

      const src = def.src ?? d.key
      const useParallax = def.parallax ?? true
      const dur = ctx.renderer.dur(d.duration)

      ctx.renderer.state.set('backgroundKey', d.key)

      if (_bgObj) {
        const sameParallax = _bgParallax === useParallax
        if (sameParallax) {
          if (dur > 0 && typeof _bgObj.transition === 'function') {
            _bgObj.transition(src, dur)
          } else {
            if (_bgObj.attribute) _bgObj.attribute.src = src
          }
          _bgParallax = useParallax
          return
        }
        // parallax 모드 변경 → 기존 제거
        _bgObj.remove()
        ctx.renderer.untrack(_bgObj)
        _bgObj = null
      }

      _bgParallax = useParallax
      _bgObj = _createBg(d.key, d.fit, useParallax, d.isVideo, dur > 0 ? 0 : 1)
      if (dur > 0 && _bgObj) {
        ctx.renderer.animate(_bgObj, { style: { opacity: 1 } }, dur, 'easeInOutQuad')
      }
    },
  }
})

backgroundModule.defineCommand(function* (cmd, ctx, state, setState) {
  const bgDefs = ctx.renderer.config.backgrounds as BgDefs
  const def = bgDefs[cmd.name as string]
  if (!def) return true

  const fit = cmd.fit === 'inherit' || !cmd.fit ? 'cover' : cmd.fit
  
  setState({
    key: cmd.name as string,
    fit,
    duration: cmd.duration ?? 1000,
    parallax: def.parallax ?? true,
    isVideo: cmd.isVideo ?? false
  })

  return true
})

export default backgroundModule

// ─── 하위 호환용 헬퍼 (Novel.ts rebuildUI에서 사용) ──────────

/** @internal */
export function setBackground(ctx: any, name: string, fit: BackgroundFitPreset, duration: number = 1000, isVideo: boolean = false) {
  // 모듈의 __handler를 직접 호출하여 호환성 유지
  backgroundModule.__handler?.({ name, fit, duration, isVideo }, ctx)
}
