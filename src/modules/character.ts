import type { CharDefs, CharacterKeysOf, ImageKeysOf, PointsOf } from '../types/config'
import type { ZoomPreset, CameraPanCmd, CameraZoomCmd, CameraEffectPreset } from './camera'
import { CAMERA_EFFECT_PRESETS } from './camera'
import type { LeviarObject } from 'leviar'
import type { CommandResult } from '../core/SceneContext'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

export type CharacterPositionPreset = 'inherit' | 'far-left' | 'left' | 'center' | 'right' | 'far-right' | (string & {})

/** 
 * 캐릭터를 등장 또는 이동시키거나 퇴장시킨다 
 */
export type CharacterCmd<TConfig = any> = {
  [Name in CharacterKeysOf<TConfig>]: {
    /** 캐릭터에 수행할 동작(보이기/숨기기)입니다. */
    action: 'show' | 'remove'
    /** 조작할 캐릭터의 이름(키)입니다. */
    name: Name
    /** 캐릭터의 위치 프리셋입니다. */
    position?: CharacterPositionPreset
    /** 표시할 캐릭터 이미지의 키입니다. */
    image?: ImageKeysOf<TConfig, Name> | (string & {})
    /** 캐릭터 등장 시 카메라를 해당 캐릭터에 포커스할지 여부입니다. */
    focus?: boolean | PointsOf<TConfig, Name> | (string & {})
    /** 등장/퇴장 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
  }
}[CharacterKeysOf<TConfig>]

/** 카메라를 캐릭터에 포커스한다 */
export type CharacterFocusCmd<TConfig = any> = {
  [Name in CharacterKeysOf<TConfig>]: {
    /** 포커스할 캐릭터의 이름입니다. */
    name: Name
    /** 포커스할 포인트(부위)의 키 또는 'inherit'입니다. */
    point?: PointsOf<TConfig, Name> | 'inherit' | (string & {})
    /** 줌 배율 프리셋입니다. */
    zoom?: ZoomPreset
    /** 포커스 이동 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
  }
}[CharacterKeysOf<TConfig>]

/** 캐릭터를 컷인(전면) 레이어로 올리거나 복원한다 */
export type CharacterHighlightCmd<TConfig = any> = {
  [Name in CharacterKeysOf<TConfig>]: {
    /** 하이라이트할 캐릭터의 이름입니다. */
    name: Name
    /** 하이라이트 효과를 켜거나 끕니다. */
    action: 'on' | 'off'
    /** 전환 애니메이션의 지속 시간(ms)입니다. */
    duration?: number
  }
}[CharacterKeysOf<TConfig>]

/** 캐릭터 효과(흔들림 등)를 재생한다 */
export interface CharacterEffectCmd<TConfig = any> {
  /** 효과를 적용할 캐릭터의 이름입니다. */
  name: CharacterKeysOf<TConfig>
  /** 연출 효과의 프리셋 이름입니다. */
  preset: CameraEffectPreset
  /** 효과의 전체 지속 시간(ms)입니다. */
  duration?: number
  /** 효과의 강도입니다. 프리셋의 기본값을 덮어씁니다. */
  intensity?: number
  /** 효과를 반복할 횟수입니다. (기본값: 1, 음수일 경우 무한반복) */
  repeat?: number
}

// ─── 스키마 ──────────────────────────────────────────────────

export interface CharacterSchema {
  /** name → { position, imageKey } 맵 */
  characters: Record<string, { position: string; imageKey: string }>
  /** 최근 전환 애니메이션 지속 시간 (ms) */
  lastDuration?: number
}

// ─── 위치/포커스 헬퍼 ────────────────────────────────────────

const CHARACTER_X_RATIO: Record<string, number> = {
  'far-left': 0.1,
  'left': 0.25,
  'center': 0.5,
  'right': 0.75,
  'far-right': 0.9,
}

function resolvePositionX(position: string): number {
  if (CHARACTER_X_RATIO[position] !== undefined) return CHARACTER_X_RATIO[position]
  const m = position.match(/^(\d+)\/(\d+)$/)
  if (m) {
    const n = parseInt(m[1], 10)
    const d = parseInt(m[2], 10)
    if (d > 0) return n / (d + 1)
  }
  return 0.5
}

// ─── 모듈 정의 ───────────────────────────────────────────────

export interface CharacterRenderObj extends LeviarObject<Record<string, any>, Record<string, any>> {
  _currentImageKey?: string
  transition?: (src: string, dur: number) => void
  __activeCharEffectStop?: (() => void) | null
}

interface CharacterViewEntry {
  show: () => void
  hide: () => void
  getObj: (name: string) => CharacterRenderObj | undefined
  update: (d: CharacterSchema) => void
}

/**
 * 캐릭터 모듈. `novel.config`의 `modules: { 'character': characterModule }` 형태로 등록합니다.
 */
const characterModule = define<CharacterCmd<any>, CharacterSchema>({
  characters: {},
})

characterModule.defineView((data, ctx) => {
  // 내부 canvas 오브젝트 맵
  const _charObjs: Record<string, CharacterRenderObj> = {}

  const _showCharacter = (
    name: string,
    position: string,
    imageKey: string,
    duration?: number,
    immediate = false
  ) => {
    const charDefs = ctx.renderer.config.characters as CharDefs
    const def = charDefs[name]
    if (!def) return

    const resolvedKey = imageKey || Object.keys(def.images)[0]
    const imageDef = def.images[resolvedKey]
    if (!imageDef) return

    const src = imageDef.src ?? resolvedKey
    const xPos = ctx.renderer.width * (resolvePositionX(position) - 0.5)
    const zPos = (ctx.renderer.world.camera)?.attribute?.focalLength ?? 100
    const dur = immediate ? 0 : ctx.renderer.dur(duration ?? 400)

    const existing = _charObjs[name]
    if (existing) {
      ctx.renderer.animate(existing, { transform: { position: { x: xPos } } }, dur, 'easeInOutQuad')
      if (imageKey && imageKey !== existing._currentImageKey) {
        if (dur > 0 && typeof existing.transition === 'function') {
          existing.transition(src, dur)
        } else {
          if (existing.attribute) existing.attribute.src = src
        }
      }
      existing._currentImageKey = resolvedKey
      return
    }

    const obj = ctx.renderer.world.createImage({
      attribute: { src },
      style: {
        width: imageDef.width ?? 500,
        opacity: dur > 0 ? 0 : 1,
        zIndex: Z_INDEX.CHARACTER_NORMAL,
      },
      transform: { position: { x: xPos, y: 0, z: zPos } }
    }) as CharacterRenderObj
    ctx.renderer.track(obj)
    obj._currentImageKey = resolvedKey
    _charObjs[name] = obj

    if (dur > 0) {
      ctx.renderer.animate(obj, { style: { opacity: 1 } }, dur)
    }
  }

  const _removeCharacter = (name: string, duration?: number) => {
    const obj = _charObjs[name]
    if (obj) {
      delete _charObjs[name]
      const dur = ctx.renderer.dur(duration ?? 400)
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

  // 복원: 저장된 캐릭터들 즉시 렌더
  for (const [name, info] of Object.entries(data.characters)) {
    _showCharacter(name, info.position, info.imageKey, undefined, true)
  }

  return {
    show: () => { /* 개별 캐릭터는 _charObjs 관리 */ },
    hide: () => {
      for (const obj of Object.values(_charObjs)) {
        obj?.fadeOut?.(300, 'easeIn')
      }
    },
    // 외부에서 캐릭터 오브젝트 접근 (character-focus 등에서 사용)
    getObj: (name: string) => _charObjs[name],
    update: (d: CharacterSchema) => {
      const dur = d.lastDuration
      const newNames = new Set(Object.keys(d.characters))
      // 제거된 캐릭터
      for (const name of Object.keys(_charObjs)) {
        if (!newNames.has(name)) {
          _removeCharacter(name, dur)
        }
      }
      // 추가/변경된 캐릭터
      for (const [name, info] of Object.entries(d.characters)) {
        _showCharacter(name, info.position, info.imageKey, dur)
      }
    },
  }
})

characterModule.defineCommand(function* (cmd, ctx, state, setState) {
  const newChars = { ...state.characters }

  if (cmd.action === 'show') {
    const showCmd = cmd
    const charDefs = ctx.renderer.config.characters as CharDefs
    const def = charDefs[showCmd.name]
    if (!def) return true

    const existingState = newChars[showCmd.name]
    const resolvedPosition = (!showCmd.position || showCmd.position === 'inherit')
      ? (existingState?.position ?? 'center')
      : showCmd.position
    const resolvedKey = showCmd.image ?? Object.keys(def.images)[0]

    newChars[showCmd.name] = { position: resolvedPosition, imageKey: resolvedKey as string }
    setState({ characters: newChars, lastDuration: cmd.duration })

    // focus 처리 (view의 getObj 사용)
    // state.characters 변경 → proxy microtask로 update() 예약됨
    // → 동기 호출 시 _charObjs 미갱신 → Promise.resolve().then()으로 연기
    if (showCmd.focus) {
      const focusType = typeof showCmd.focus === 'string' ? showCmd.focus : undefined
      const focusDuration = showCmd.duration ?? 800

      const entry = ctx.ui.get('character') as CharacterViewEntry | undefined
      const charObj = entry?.getObj(showCmd.name)
      if (charObj) {
        if (!charObj.__renderedSize || charObj.__renderedSize.h <= 0) {
          const checkSize = () => {
            if (charObj.__renderedSize && charObj.__renderedSize.h > 0) {
              ctx.callbacks.advance()
            } else {
              requestAnimationFrame(checkSize)
            }
          }
          requestAnimationFrame(checkSize)
          yield false
        }
        const cmds = _calcFocusCommands(showCmd.name, charObj, def, focusType, 'inherit', focusDuration)
        for (const c of cmds) {
          const res = ctx.execute(c)
          if (res && typeof (res as Generator).next === 'function') {
            yield* (res as Generator<CommandResult, CommandResult, unknown>)
          }
        }
      }
    }
  } else {
    delete newChars[cmd.name]
    setState({ characters: newChars, lastDuration: cmd.duration })
  }

  return true
})

export default characterModule

// ─── character-focus 모듈 ────────────────────────────────────

function _calcFocusCommands(
  name: string,
  target: CharacterRenderObj | undefined | null,
  def: { images: Record<string, { points?: Record<string, { x: number; y: number }>; height?: number; width?: number }> },
  focusType?: string,
  fit: ZoomPreset = 'inherit',
  duration: number = 800
): [(CameraPanCmd & { type: 'camera-pan' }), (CameraZoomCmd & { type: 'camera-zoom' })] | [] {
  if (!target) return []
  const activeImgKey = target._currentImageKey ?? Object.keys(def.images)[0]
  const imageDef = def.images[activeImgKey]
  const fp = (focusType && imageDef?.points) ? imageDef.points[focusType] : { x: 0.5, y: 0.5 }

  const targetX = target.transform?.position?.x ?? 0
  const charW = target.style?.width ?? 500
  const rendH = target.__renderedSize?.h
  const charH = imageDef?.height ?? ((rendH && rendH > 0) ? rendH : charW * 2)

  const panX = targetX + charW * (fp.x - 0.5)
  const panY = charH * (0.5 - fp.y)

  return [
    { type: 'camera-pan', position: 'center', duration, x: panX, y: panY },
    { type: 'camera-zoom', preset: fit, duration }
  ]
}

export interface CharacterFocusSchema { _unused: undefined }

const characterFocusModule = define<CharacterFocusCmd<any>, CharacterFocusSchema>({ _unused: undefined })

characterFocusModule.defineView((_data, _ctx) => ({
  show: () => { },
  hide: () => { },
}))

characterFocusModule.defineCommand(function* (cmd, ctx) {
  const entry = ctx.ui.get('character') as CharacterViewEntry | undefined
  const charObj = entry?.getObj(cmd.name)
  if (!charObj) return true

  const charDefs = ctx.renderer.config.characters as CharDefs
  const def = charDefs[cmd.name]
  if (!def) return true

  if (!charObj.__renderedSize || charObj.__renderedSize.h <= 0) {
    const checkSize = () => {
      if (charObj.__renderedSize && charObj.__renderedSize.h > 0) {
        ctx.callbacks.advance()
      } else {
        requestAnimationFrame(checkSize)
      }
    }
    requestAnimationFrame(checkSize)
    yield false
  }
  const cmds = _calcFocusCommands(cmd.name, charObj, def, cmd.point, cmd.zoom ?? 'inherit', cmd.duration ?? 800)
  for (const c of cmds) {
    const res = ctx.execute(c)
    if (res && typeof (res as Generator).next === 'function') {
      yield* (res as Generator<CommandResult, CommandResult, unknown>)
    }
  }
  return true
})

export { characterFocusModule }

// ─── character-highlight 모듈 ────────────────────────────────

export interface CharacterHighlightSchema { _unused: undefined }

const characterHighlightModule = define<CharacterHighlightCmd<any>, CharacterHighlightSchema>({ _unused: undefined })

characterHighlightModule.defineView((_data, _ctx) => ({
  show: () => { },
  hide: () => { },
}))

characterHighlightModule.defineCommand(function* (_cmd, _ctx) {
  // 구현 미완, skip
  return true
})

export { characterHighlightModule }

// ─── character-effect 모듈 ───────────────────────────────────

export interface CharacterEffectSchema { _unused: undefined }

const characterEffectModule = define<CharacterEffectCmd<any>, CharacterEffectSchema>({ _unused: undefined })

characterEffectModule.defineView((_data, _ctx) => ({
  show: () => { },
  hide: () => { },
}))

characterEffectModule.defineCommand(function* (cmd, ctx) {
  const entry = ctx.ui.get('character') as CharacterViewEntry | undefined
  const charObj = entry?.getObj(cmd.name)
  if (!charObj) return true

  if (cmd.preset === 'reset') {
    const stopFn = charObj.__activeCharEffectStop
    if (stopFn) stopFn()
    return true
  }

  const stopFn = charObj.__activeCharEffectStop
  if (stopFn) stopFn()

  const cfg = CAMERA_EFFECT_PRESETS[cmd.preset as Exclude<CameraEffectPreset, 'reset'>]
  if (!cfg) return true

  const finalIntensity = cmd.intensity ?? cfg.intensity
  const finalDuration = ctx.renderer.dur(cmd.duration ?? cfg.duration)
  if (finalDuration <= 0) return true

  let active = true
  let frame = 0
  const repeat = cmd.repeat ?? 1

  const originX = charObj.transform?.position?.x ?? 0
  const originY = charObj.transform?.position?.y ?? 0
  const originZRotation = charObj.transform?.rotation?.z ?? 0

  const stop = () => {
    active = false
    charObj.__activeCharEffectStop = null
    if (charObj.transform?.position) {
      charObj.transform.position.x = originX
      charObj.transform.position.y = originY
    }
    if (charObj.transform?.rotation) {
      charObj.transform.rotation.z = originZRotation
    }
  }
  charObj.__activeCharEffectStop = stop

  const loop = () => {
    if (!active || (repeat >= 0 && frame++ >= repeat)) {
      stop()
      return
    }

    let elapsed = 0
    const stepTime = 16
    const tick = () => {
      if (!active) return
      elapsed += stepTime
      if (elapsed > finalDuration) {
        loop()
        return
      }
      const progress = elapsed / finalDuration
      let dx = 0, dy = 0, dz = 0

      switch (cmd.preset) {
        case 'shake':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          dy = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'shake-x':
          dx = (Math.random() - 0.5) * finalIntensity * (1 - progress)
          break
        case 'bounce':
          dy = Math.sin(progress * Math.PI) * finalIntensity
          break
        case 'wave':
          dx = Math.sin(progress * Math.PI * 2) * finalIntensity
          dy = Math.cos(progress * Math.PI * 2) * (finalIntensity / 2)
          break
        case 'nod':
          dy = Math.sin(progress * Math.PI) * finalIntensity
          break
        case 'fall':
          dy = Math.pow(progress, 2) * finalIntensity * 5
          break
      }

      if (charObj.transform?.position) {
        charObj.transform.position.x = originX + dx
        charObj.transform.position.y = originY + dy
      }
      if (charObj.transform?.rotation) {
        charObj.transform.rotation.z = originZRotation + dz
      }

      setTimeout(tick, stepTime)
    }
    tick()
  }
  loop()

  return true
})

export { characterEffectModule }

// ─── 하위 호환 헬퍼 ──────────────────────────────────────────

/** @internal Novel.ts rebuildUI 하위 호환용 */
export function showCharacter(ctx: unknown, name: string, position?: CharacterPositionPreset, imageKey?: string, duration?: number) {
  characterModule.__handler?.({ action: 'show', name, position, image: imageKey, duration } as CharacterCmd, ctx as never)
}
