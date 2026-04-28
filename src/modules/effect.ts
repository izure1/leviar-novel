import type { AssetKeysOf } from '../types/config'
import { define } from '../define/defineCmdUI'

export type EffectType = 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies'

/** 
 * 파티클 이펙트를 추가하거나 제거한다 
 */
export type EffectCmd<TConfig = any> =
  | {
    /** 수행할 동작입니다. ('add': 효과 추가) */
    action: 'add'
    /** 추가할 이펙트의 종류입니다. */
    effect: EffectType
    /** 이펙트에 사용할 에셋(이미지 등)의 키입니다. */
    src: AssetKeysOf<TConfig>
    /** 파티클 생성 속도(빈도)입니다. */
    rate?: number
  }
  | {
    /** 수행할 동작입니다. ('remove': 효과 제거) */
    action: 'remove'
    /** 제거할 이펙트의 종류입니다. */
    effect: EffectType
    /** 사라지는 애니메이션의 지속 시간(ms)입니다. */
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

// ─── 스키마 ──────────────────────────────────────────────────

export interface EffectSchema {
  /** @internal effect → { rate, srcKey } 맵 */
  _activeEffects: Record<string, { rate?: number; srcKey?: string }>
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 이펙트 모듈. `novel.config`의 `modules: { 'effect': effectModule }` 형태로 등록합니다.
 */
const effectModule = define<EffectCmd<any>, EffectSchema>({
  _activeEffects: {},
})

effectModule.defineView((data, ctx) => {
  const _effectObjs: Record<string, any> = {}

  const _addEffect = (
    type: EffectType,
    rate?: number,
    srcKey?: string,
    immediate = false
  ) => {
    const configEffect = ctx.renderer.config.effects?.[type]
    const preset = {
      attribute: { ...EFFECT_PARTICLE_PRESETS[type]?.attribute, ...configEffect?.particle?.attribute },
      style: { ...EFFECT_PARTICLE_PRESETS[type]?.style, ...configEffect?.particle?.style },
    }
    const finalRate = rate ?? DEFAULT_EFFECT_RATES[type] ?? 10
    const clipName = `${type}_rate_${finalRate}_${srcKey ?? 'default'}`
    const particleZ = 250

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

    if (_effectObjs[type]) return

    const particle = ctx.renderer.world.createParticle({
      attribute: { ...preset.attribute, src: clipName },
      style: { ...preset.style },
      transform: { position: { x: 0, y: 0, z: particleZ } },
    })
    _effectObjs[type] = particle
    ctx.renderer.track(particle)
    particle.play()
  }

  const _removeEffect = (type: EffectType, duration: number, immediate = false) => {
    const effect = _effectObjs[type]
    if (effect) {
      delete _effectObjs[type]
      const dur = immediate ? 0 : ctx.renderer.dur(duration)
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

  // 복원: 저장된 이펙트들 즉시 렌더
  for (const [type, info] of Object.entries(data._activeEffects)) {
    _addEffect(type as EffectType, info.rate, info.srcKey, true)
  }

  return {
    show: () => { },
    hide: () => {
      for (const obj of Object.values(_effectObjs)) {
        obj?.fadeOut?.(300, 'easeIn')
      }
    },
    update: (d: EffectSchema) => {
      const newTypes = new Set(Object.keys(d._activeEffects))
      for (const type of Object.keys(_effectObjs)) {
        if (!newTypes.has(type)) _removeEffect(type as EffectType, 600)
      }
      for (const [type, info] of Object.entries(d._activeEffects)) {
        if (!_effectObjs[type]) {
          _addEffect(type as EffectType, info.rate, info.srcKey)
        }
      }
    },
  }
})

effectModule.defineCommand(function* (rawCmd, ctx, state, setState) {
  const cmd = rawCmd as any
  const newEffects = { ...state._activeEffects }

  if (cmd.action === 'add') {
    newEffects[cmd.effect] = { rate: cmd.rate, srcKey: cmd.src as string }
  } else {
    delete newEffects[cmd.effect]
  }

  setState({ _activeEffects: newEffects })
  return true
})

export default effectModule

/** @internal */
export function addEffect(ctx: any, type: EffectType = 'dust', rate?: number, _overrides?: any, srcKey?: string) {
  effectModule.__handler?.({ action: 'add', effect: type, rate, src: srcKey ?? type }, ctx)
}
