import type { SceneContext } from '../core/SceneContext'
import type { CharDefs } from '../types/config'
import type { ZoomPreset } from './camera'
import { Z_INDEX } from '../constants/render'
import { panCamera, zoomCamera } from './camera'
import { defineCmd } from '../define/defineCmd'

export type CharacterPositionPreset = 'inherit' | 'far-left' | 'left' | 'center' | 'right' | 'far-right' | (string & {})

/** 모든 캐릭터의 모든 이미지 키를 추출 */
type _AllImageKeys<TCharacters extends CharDefs> = {
  [K in keyof TCharacters]: keyof TCharacters[K] & string
}[keyof TCharacters]

/** 모든 캐릭터의 모든 points 키를 추출 */
type _AllPointKeys<TCharacters extends CharDefs> = {
  [K in keyof TCharacters]: {
    [IK in keyof TCharacters[K]]: TCharacters[K][IK] extends { points?: Record<string, any> }
      ? keyof NonNullable<TCharacters[K][IK]['points']> & string
      : never
  }[keyof TCharacters[K]]
}[keyof TCharacters]

export interface CharacterCmd<TCharacters extends CharDefs> {
  type: 'character'
  action: 'show' | 'remove'
  name: keyof TCharacters & string | (string & {})
  position?: CharacterPositionPreset
  image?: _AllImageKeys<TCharacters> | (string & {})
  focus?: boolean | string
  duration?: number
}

export interface CharacterFocusCmd<TCharacters extends CharDefs> {
  type: 'character-focus'
  name: keyof TCharacters & string | (string & {})
  point?: _AllPointKeys<TCharacters> | 'inherit' | (string & {})
  zoom?: ZoomPreset
  duration?: number
}

export interface CharacterHighlightCmd<TCharacters extends CharDefs> {
  type: 'character-highlight'
  name: keyof TCharacters & string | (string & {})
  action: 'on' | 'off'
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

function showCharacter(ctx: SceneContext, name: string, position?: CharacterPositionPreset, imageKey?: string, duration?: number) {
  const charDefs = ctx.renderer.config.characters as CharDefs
  const def = charDefs[name]
  if (!def) return

  const resolvedKey = imageKey ?? Object.keys(def)[0]
  const imageDef = def[resolvedKey]
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
  ;(obj as any)._currentImageKey = resolvedKey
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
  
  const activeImgKey = target._currentImageKey ?? Object.keys(def)[0]
  const imageDef = def[activeImgKey]
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
