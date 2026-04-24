import type { BgDefs, BackgroundKeysOf } from '../types/config'
import type { SceneContext } from '../core/SceneContext'
import { Z_INDEX } from '../constants/render'
import { defineCmd } from '../define/defineCmd'

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

function getBgObjs(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_bgObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_bgObjs', objs)
  }
  return objs
}

export function setBackground(ctx: SceneContext, name: string, fit: BackgroundFitPreset, duration: number = 1000, isVideo: boolean = false) {
  const bgDefs = ctx.renderer.config.backgrounds as BgDefs
  const def = bgDefs[name]
  if (!def) return

  const src = def.src ?? name
  const useParallax = def.parallax ?? true
  const dur = ctx.renderer.dur(duration)
  ctx.renderer.state.set('backgroundKey', name)
  // cmdState 저장 (세이브/로드 일관성)
  ctx.cmdState.set('background', { key: name, fit: fit === 'inherit' ? 'cover' : fit })

  const objs = getBgObjs(ctx)
  const existing = objs['main']

  if (existing) {
    // parallax 모드가 같을 때만 crossfade; 다르면 제거 후 재생성
    const existingParallax = ctx.renderer.state.get('_bgParallax') ?? true
    if (existingParallax === useParallax) {
      if (dur > 0 && typeof existing.transition === 'function') {
        existing.transition(src, dur)
      } else {
        if (existing.attribute) existing.attribute.src = src
      }
      return
    }
    // parallax 모드 변경 → 기존 제거
    existing.remove()
    ctx.renderer.untrack(existing)
    delete objs['main']
  }

  ctx.renderer.state.set('_bgParallax', useParallax)

  const cam = ctx.renderer.world.camera as any
  const zPos = ctx.renderer.depth

  const baseW = ctx.renderer.width
  const baseH = ctx.renderer.height
  const maxPanX = baseW * 0.4
  const maxPanY = baseH * 0.5
  const ratio = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(zPos, 1) : 1

  const exactW = baseW + maxPanX * 2
  const exactH = baseH + maxPanY * 2

  const createFn = isVideo ? ctx.renderer.world.createVideo.bind(ctx.renderer.world) : ctx.renderer.world.createImage.bind(ctx.renderer.world)
  const obj = createFn({
    attribute: { src },
    style: {
      width: exactW, height: exactH,
      zIndex: Z_INDEX.BACKGROUND,
      opacity: dur > 0 ? 0 : 1,
      pointerEvents: false,
    },
    transform: { position: { x: 0, y: 0, z: zPos }, scale: { x: ratio, y: ratio, z: 1 } },
  })

  if (!useParallax) {
    ctx.renderer.world.camera?.addChild(obj)
  }

  ctx.renderer.track(obj)
  objs['main'] = obj

  if (dur > 0) {
    ctx.renderer.animate(obj, { style: { opacity: 1 } }, dur, 'easeInOutQuad')
  }
}

export const backgroundHandler = defineCmd<BackgroundCmd<any>>((cmd, ctx) => {
  setBackground(
    ctx,
    cmd.name as string,
    (cmd.fit ?? 'inherit') as BackgroundFitPreset,
    cmd.duration ?? 1000,
    cmd.isVideo ?? false,
  )
  return true
})
