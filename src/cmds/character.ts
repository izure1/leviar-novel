import type { SceneContext } from '../core/SceneContext'
import type { CharDefs } from '../types/config'
import type { ZoomPreset } from './camera'
import { Z_INDEX } from '../constants/render'
import { panCamera, zoomCamera } from './camera'
import { defineCmd } from '../define/defineCmd'

export type CharacterPositionPreset = 'inherit' | 'far-left' | 'left' | 'center' | 'right' | 'far-right' | (string & {})

/** 모든 캐릭터의 모든 이미지 키를 추출 */
type _AllImageKeys<TCharacters extends CharDefs> = {
  [K in keyof TCharacters]: keyof TCharacters[K]['points'] & string
}[keyof TCharacters]

/** 모든 캐릭터의 모든 points 키를 추출 */
type _AllPointKeys<TCharacters extends CharDefs> = {
  [K in keyof TCharacters]: {
    [IK in keyof TCharacters[K]['points']]: TCharacters[K]['points'][IK] extends { points?: Record<string, any> }
    ? keyof NonNullable<TCharacters[K]['points'][IK]['points']> & string
    : never
  }[keyof TCharacters[K]['points']]
}[keyof TCharacters]

/** 
 * 캐릭터를 등장 또는 이동시키거나 퇴장시킨다 
 * 
 * @example
 * ```ts
 * { type: 'character', action: 'show', name: 'hero', position: 'center', image: 'smile', duration: 500 }
 * ```
 */
export interface CharacterCmd<TCharacters extends CharDefs> {
  /** 'show'는 캐릭터를 등장/이동, 'remove'는 퇴장시킵니다. */
  action: 'show' | 'remove'
  /** 조작할 캐릭터의 이름(config.characters의 키)입니다. */
  name: keyof TCharacters & string
  /** 화면 내 캐릭터의 가로 위치입니다. (프리셋 또는 'n/m' 분수) */
  position?: CharacterPositionPreset
  /** 렌더링 할 캐릭터의 이미지 키(config.characters[name]에 정의된 키)입니다. */
  image?: _AllImageKeys<TCharacters> | (string & {})
  /**
   * 등장과 동시에 카메라 포커스를 수행할지 여부입니다.
   * `true`일 경우 기본 포인트를 사용하며, 문자열 지정 시 해당 포인트에 카메라를 맞춥니다.
   */
  focus?: boolean | string
  /** 애니메이션 적용 시간(ms 단위)입니다. */
  duration?: number
}

/** 
 * 카메라를 캐릭터에 포커스한다 
 * 
 * @example
 * ```ts
 * { type: 'character-focus', name: 'hero', point: 'face', zoom: 'close-up', duration: 600 }
 * ```
 */
export interface CharacterFocusCmd<TCharacters extends CharDefs> {
  /** 포커스 할 캐릭터의 이름입니다. */
  name: keyof TCharacters & string
  /** 맞출 카메라 초점 포인트입니다. (config의 points 키로 자동완성됩니다) */
  point?: _AllPointKeys<TCharacters> | 'inherit' | (string & {})
  /** 포커스 시 적용될 화면 줌(Zoom) 수준입니다. */
  zoom?: ZoomPreset
  /** 카메라 이동에 걸리는 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

/** 캐릭터를 컷인(전면) 레이어로 올리거나 복원한다 */
export interface CharacterHighlightCmd<TCharacters extends CharDefs> {
  /** 하이라이트 할 캐릭터의 이름입니다. */
  name: keyof TCharacters & string
  /** 'on'은 캐릭터를 전경으로 올리고, 'off'는 원래 뎁스로 복구합니다. */
  action: 'on' | 'off'
  /** 전환 시 적용되는 애니메이션 시간(ms 단위)입니다. */
  duration?: number
}

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

function getCharStates(ctx: SceneContext) {
  let states = ctx.renderer.state.get('characters')
  if (!states) {
    states = {}
    ctx.renderer.state.set('characters', states)
  }
  return states
}

function getCharObjects(ctx: SceneContext) {
  let objs = ctx.renderer.state.get('_charObjs')
  if (!objs) {
    objs = {}
    ctx.renderer.state.set('_charObjs', objs)
  }
  return objs
}

export function showCharacter(ctx: SceneContext, name: string, position?: CharacterPositionPreset, imageKey?: string, duration?: number) {
  const charDefs = ctx.renderer.config.characters as CharDefs
  const def = charDefs[name]
  if (!def) return

  const resolvedKey = imageKey ?? Object.keys(def.points)[0]
  const imageDef = def.points[resolvedKey]
  if (!imageDef) return

  const states = getCharStates(ctx)
  const objs = getCharObjects(ctx)

  const existingState = states[name]
  const resolvedPosition = (!position || position === 'inherit')
    ? (existingState?.position ?? 'center')
    : position

  const src = imageDef.src ?? resolvedKey
  const xPos = ctx.renderer.width * (resolvePositionX(resolvedPosition) - 0.5)
  const zPos = (ctx.renderer.world.camera as any)?.attribute?.focalLength ?? 100

  states[name] = { position: resolvedPosition, imageKey: resolvedKey }
  // cmdState 동기화 (세이브/로드 일관성)
  ctx.cmdState.set('characters', { ...states })

  const existing = objs[name]
  if (existing) {
    ctx.renderer.animate(existing, { transform: { position: { x: xPos } } }, ctx.renderer.dur(duration ?? 400), 'easeInOutQuad')
    if (imageKey) {
      if (ctx.renderer.dur(duration ?? 300) > 0 && typeof existing.transition === 'function') {
        existing.transition(src, ctx.renderer.dur(duration ?? 300))
      } else {
        if (existing.attribute) existing.attribute.src = src
      }
    }
    existing._currentImageKey = resolvedKey
    return
  }

  const obj = ctx.renderer.world.createImage({
    attribute: { src } as any,
    style: {
      width: (imageDef as any).width ?? 500,
      opacity: ctx.renderer.dur(duration ?? 400) > 0 ? 0 : 1,
      zIndex: Z_INDEX.CHARACTER_NORMAL,
      anchor: { x: 0.5, y: 1 }
    } as any,
    transform: {
      position: { x: xPos, y: 0, z: zPos }
    }
  })

  ctx.renderer.track(obj)
    ; (obj as any)._currentImageKey = resolvedKey
  objs[name] = obj

  if (ctx.renderer.dur(duration ?? 400) > 0) {
    ctx.renderer.animate(obj, { style: { opacity: 1 } }, duration ?? 400)
  }
}

function removeCharacter(ctx: SceneContext, name: string, duration?: number) {
  const objs = getCharObjects(ctx)
  const states = getCharStates(ctx)
  const obj = objs[name]
  if (obj) {
    delete objs[name]
    delete states[name]
    // cmdState 동기화
    ctx.cmdState.set('characters', { ...states })
    const dur = ctx.renderer.dur(duration ?? 400)
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

function focusCharacter(ctx: SceneContext, name: string, focusType?: string, fit: string = 'inherit', duration: number = 800) {
  const objs = getCharObjects(ctx)
  const target = objs[name]
  if (!target) return

  const charDefs = ctx.renderer.config.characters
  const def = charDefs[name]
  if (!def) return

  const activeImgKey = target._currentImageKey ?? Object.keys(def.points)[0]
  const imageDef = def.points[activeImgKey]
  const fp = (focusType && imageDef?.points) ? imageDef.points[focusType] : { x: 0.5, y: 0.5 }

  const targetX = target.transform?.position?.x ?? 0
  const charW = target.style?.width ?? 500
  const rendH = (target as any).__renderedSize?.h
  const charH = (rendH && rendH > 0) ? rendH : charW * 2

  const panX = targetX + charW * (fp.x - 0.5)
  const panY = charH * (0.5 - fp.y)

  panCamera(ctx, 'center', duration, panX, panY)
  zoomCamera(ctx, fit as any, duration)
}

export const characterHandler = defineCmd<CharacterCmd<any>>((cmd, ctx) => {
  if (cmd.action === 'show') {
    const showCmd = cmd as any
    showCharacter(ctx, showCmd.name as string, showCmd.position, showCmd.image as string | undefined, showCmd.duration)
    if (showCmd.focus) {
      focusCharacter(ctx, showCmd.name as string, typeof showCmd.focus === 'string' ? showCmd.focus : undefined, 'inherit', showCmd.duration ?? 800)
    }
  } else {
    removeCharacter(ctx, cmd.name as string, cmd.duration)
  }
  return false
})

export const characterFocusHandler = defineCmd<CharacterFocusCmd<any>>((cmd, ctx) => {
  focusCharacter(ctx, cmd.name as string, cmd.point, cmd.zoom ?? 'inherit', cmd.duration ?? 800)
  return false
})

export const characterHighlightHandler = defineCmd<CharacterHighlightCmd<any>>((_cmd, _ctx) => {
  // highlight 기능은 현재 구현 미완, skip 처리
  return false
})
