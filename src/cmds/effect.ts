import type { SceneContext } from '../core/SceneContext'
import type { AssetKeysOf } from '../types/config'
import { defineCmd } from '../define/defineCmd'

export type EffectType = 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies'

/** 
 * 파티클 이펙트를 추가하거나 제거한다 
 * 
 * @example
 * ```ts
 * { type: 'effect', action: 'add', effect: 'rain', src: 'raindrop', rate: 10 }
 * // 또는 제거
 * { type: 'effect', action: 'remove', effect: 'rain', duration: 500 }
 * ```
 */
export type EffectCmd<TConfig = any> =
  | {
    /** 'add'는 화면에 새로운 파티클 효과를 추가합니다. */
    action: 'add'
    /** 추가할 이펙트의 프리셋 종류(눈, 비 등)입니다. */
    effect: EffectType
    /** 파티클로 렌더링 할 에셋의 키 (config.assets에 정의된 키)입니다. */
    src: AssetKeysOf<TConfig>
    /** 파티클의 생성 빈도(속도) 배율입니다. 높을수록 많이 생성됩니다. */
    rate?: number
  }
  | {
    /** 'remove'는 현재 활성화된 파티클 효과를 중단하고 제거합니다. */
    action: 'remove'
    /** 제거할 이펙트의 프리셋 종류입니다. */
    effect: EffectType
    /** 이펙트가 서서히 사라지는 페이드아웃 시간(ms 단위)입니다. */
    duration?: number
  }

const EFFECT_PARTICLE_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { attribute: { frictionAir: 0, gravityScale: 0.001 }, style: { width: 10, height: 10, blendMode: 'lighter' } },
  rain: { attribute: { gravityScale: 1.5 }, style: { width: 25, height: 100, opacity: 1, blendMode: 'screen' } },
  snow: { attribute: { gravityScale: 0.01, frictionAir: 0 }, style: { width: 15, height: 15, blendMode: 'lighter' } },
  sakura: { attribute: { gravityScale: 0.02, frictionAir: 0 }, style: { width: 16, height: 20, opacity: 0.8 } },
  sparkle: { attribute: { gravityScale: 0.1 }, style: { width: 16, height: 16, opacity: 0.8 } },
  fog: { attribute: { frictionAir: 0, gravityScale: 0.003 }, style: { width: 120, height: 120, blendMode: 'screen' } },
  leaves: { attribute: { gravityScale: 0.1, frictionAir: 0.05, strictPhysics: true }, style: { width: 20, height: 20, opacity: 0.9 } },
  fireflies: { attribute: { gravityScale: -0.02, frictionAir: 0.05, strictPhysics: true }, style: { width: 8, height: 8, opacity: 0.8, blendMode: 'lighter' } },
}

const EFFECT_CLIP_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { impulse: 0.05, lifespan: 10000, interval: 250, size: [[0.5, 1], [0, 0.5]], opacity: [[0, 0], [1, 1], [0, 0]], loop: true },
  rain: { impulse: 0, lifespan: 3000, interval: 40, size: [[0.1, 0.3], [0.1, 0.3]], opacity: [[1, 1], [1, 1]], loop: true },
  snow: { impulse: 0.01, lifespan: 10000, interval: 100, size: [[0.3, 0.8], [0, 0]], opacity: [[1, 1], [0, 0]], loop: true, angularImpulse: 0.001 },
  sakura: { impulse: 0.02, lifespan: 6000, interval: 300, size: [[0.5, 0.8], [0.3, 0.5]], loop: true, angularImpulse: 0.001 },
  sparkle: { impulse: 0.02, lifespan: 1500, interval: 150, size: [[0.5, 1], [0, 0.1]], loop: true },
  fog: { impulse: 0.01, lifespan: 15000, interval: 800, size: [[2, 2], [5, 10]], opacity: [[0, 0], [0.1, 0.2], [0, 0]], loop: true, angularImpulse: 0.0001 },
  leaves: { impulse: 0.08, lifespan: 7000, interval: 350, size: [[0.8, 1.2], [0.8, 1.2]], loop: true, angularImpulse: 0.05 },
  fireflies: { impulse: 0.03, lifespan: 5000, interval: 300, size: [[0.5, 1.5], [0, 0.5]], loop: true },
}

const DEFAULT_EFFECT_RATES: Partial<Record<EffectType, number>> = {
  dust: 5, rain: 200, snow: 8, sakura: 8, sparkle: 10, fog: 4, leaves: 5, fireflies: 5,
}

function getEffectObjs(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_effectObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_effectObjs', objs)
  }
  return objs
}

function getActiveEffects(ctx: SceneContext) {
  let states = ctx.renderer.state.get('activeEffects')
  if (!states) {
    states = {}
    ctx.renderer.state.set('activeEffects', states)
  }
  return states
}

export function addEffect(ctx: SceneContext, type: EffectType = 'dust', rate?: number, overrides?: Record<string, any>, srcKey?: string) {
  const configEffect = ctx.renderer.config.effects?.[type]
  const preset = {
    attribute: { ...EFFECT_PARTICLE_PRESETS[type]?.attribute, ...configEffect?.particle?.attribute },
    style: { ...EFFECT_PARTICLE_PRESETS[type]?.style, ...configEffect?.particle?.style },
  }
  const finalRate = rate ?? DEFAULT_EFFECT_RATES[type] ?? 10
  const clipName = `${type}_rate_${finalRate}_${srcKey ?? 'default'}`
  const particleZ = ctx.renderer.depth / 2

  if (!ctx.renderer.world.particleManager.get(clipName)) {
    const clipBase = { ...EFFECT_CLIP_PRESETS[type], ...configEffect?.clip }
    const cam = ctx.renderer.world.camera
    const ratio = cam && typeof cam.calcDepthRatio === 'function' ? cam.calcDepthRatio(particleZ, 1) : 1
    const maxPanX = ctx.renderer.width * 0.4
    const maxPanY = ctx.renderer.height * 0.5
    const spanW = (ctx.renderer.width + maxPanX * 2) * ratio
    const spanH = (ctx.renderer.height + maxPanY * 2) * ratio

    ctx.renderer.world.particleManager.create({
      name: clipName, src: srcKey ?? type,
      ...clipBase,
      rate: finalRate,
      spawnX: spanW, spawnY: spanH, spawnZ: particleZ,
    } as any)
  }

  const objs = getEffectObjs(ctx)
  const activeEffects = getActiveEffects(ctx)
  const existing = objs[type]

  if (existing) {
    if (rate !== undefined || srcKey !== undefined) {
      existing.attribute.src = clipName
    }
    if (overrides?.style) {
      Object.assign(existing.style, overrides.style)
    }
    return
  }

  activeEffects[type] = { rate, overrides, srcKey }
  // cmdState 동기화
  ctx.cmdState.set('effect', { ...activeEffects })

  const particle = ctx.renderer.world.createParticle({
    attribute: { ...preset.attribute, src: clipName, ...overrides?.attribute },
    style: { ...preset.style, ...overrides?.style },
    transform: { position: { x: 0, y: 0, z: particleZ }, ...overrides?.transform },
  })

  objs[type] = particle
  ctx.renderer.track(particle)
  particle.play()
}

function removeEffect(ctx: SceneContext, type: EffectType, duration: number = 600) {
  const objs = getEffectObjs(ctx)
  const activeEffects = getActiveEffects(ctx)
  const effect = objs[type]

  delete activeEffects[type]
  // cmdState 동기화
  ctx.cmdState.set('effect', { ...activeEffects })

  if (effect) {
    delete objs[type]
    const dur = ctx.renderer.dur(duration)
    if (dur > 0) {
      ctx.renderer.animate(effect, { style: { opacity: 0 } }, dur, 'easeInOutQuad', () => {
        effect.remove()
        ctx.renderer.untrack(effect)
      })
    } else {
      effect.remove()
      ctx.renderer.untrack(effect)
    }
  }
}

export const effectHandler = defineCmd<EffectCmd<any>>((cmd, ctx) => {
  if (cmd.action === 'add') {
    const addCmd = cmd as Extract<EffectCmd<any>, { action: 'add' }>
    addEffect(ctx, addCmd.effect, addCmd.rate, undefined, addCmd.src)
  } else {
    const rmCmd = cmd as Extract<EffectCmd<any>, { action: 'remove' }>
    removeEffect(ctx, rmCmd.effect, rmCmd.duration)
  }
  return true
})
