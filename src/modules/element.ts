import type { Style, EasingType, LeviarObject } from 'leviar'
import type { AssetKeysOf } from '../types/config'
import type { SceneContext } from '../core/SceneContext'
import type { SetStateFn } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

// ─── 타입 정의 ───────────────────────────────────────────────

export type ElementKind = 'rect' | 'ellipse' | 'text' | 'image'
export type ElementPosition = { x?: number; y?: number }
export type ElementPivot = { x?: number; y?: number }
export type ElementScale = number | { x?: number; y?: number; z?: number }

export interface ElementChildBase<TConfig = any> {
  /** 요소 고유 식별자 */
  id: string
  /** 부모 기준 픽셀 오프셋 위치 */
  position?: ElementPosition
  /** 기본 스타일 (Leviar Style) */
  style?: Partial<Style>
  /** 호버 시 스타일 (기본 스타일에 merge, mouseout 시 복귀) */
  hoverStyle?: Partial<Style>
  /** 피벗 (0~1 정규화). 기본 { x: 0.5, y: 0.5 } */
  pivot?: ElementPivot
  /** 스케일 배율. number면 x/y에 같은 값을 적용 */
  scale?: ElementScale
  /** 회전 각도 (degree) */
  rotation?: number
  /**
   * 이 요소에 바인딩할 behavior 이름 목록.
   * `defineScene`의 `actions`에 정의된 콜백을 참조합니다.
   */
  behaviors?: string[]
  /** 자식 요소 배열 */
  children?: ElementChild<TConfig>[]
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type ElementChild<TConfig = any> =
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'rect' }>
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'ellipse' }>
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'text'; /** 텍스트 내용 */ text: string }>
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'image'; /** 이미지 에셋 키 */ image: AssetKeysOf<TConfig> }>

/**
 * 범용 UI 요소를 화면에 배치한다.
 *
 * - `kind: 'rect'` — 사각형 (패널, 버튼 배경 등)
 * - `kind: 'text'` — 텍스트
 * - `kind: 'image'` — 이미지
 *
 * `children`으로 계층 구조를 구성하며, `behaviors`로 씬 액션을 바인딩합니다.
 *
 * @example
 * {
 *   type: 'element',
 *   action: 'show',
 *   id: 'panel',
 *   kind: 'rect',
 *   position: { x: 1748, y: 540 },
 *   style: { width: 120, height: 300, background: 'rgba(0,0,0,0.5)' },
 *   children: [
 *     {
 *       id: 'btn_save',
 *       kind: 'rect',
 *       position: { x: 0, y: 60 },
 *       style: { width: 100, height: 36, background: 'rgba(255,255,255,0.1)' },
 *       behaviors: ['saveButton', 'hoverGlow'],
 *       children: [
 *         { id: 'btn_save_text', kind: 'text', text: '💾 저장', style: { fontSize: 14, color: '#fff' } }
 *       ]
 *     }
 *   ]
 * }
 */
export interface ElementCmdBase<TConfig = any> {
  /** 요소 고유 식별자 */
  id: string
  /**
   * 화면 내 위치.
   * - parent 없음 (루트): 픽셀 좌표. { x: 0, y: 0 } = 캔버스 좌상단
   * - parent 있음 (자식): 부모 중심 기준 픽셀(Leviar 좌표계) 오프셋
   */
  position?: ElementPosition
  /** 기본 스타일 (Leviar Style) */
  style?: Partial<Style>
  /** 호버 시 스타일 (기본 스타일에 merge, mouseout 시 복귀) */
  hoverStyle?: Partial<Style>
  /** 피벗 (0~1 정규화) */
  pivot?: ElementPivot
  /** 스케일 배율. number면 x/y에 같은 값을 적용 */
  scale?: ElementScale
  /** 회전 각도 (degree) */
  rotation?: number
  /**
   * 이 요소에 바인딩할 behavior 이름 목록.
   * `defineScene`의 `actions`에 정의된 콜백을 참조합니다.
   */
  behaviors?: string[]
  /** 자식 요소 배열 */
  children?: ElementChild<TConfig>[]
  /** show/hide 페이드 시간(ms). 기본 200 */
  duration?: number
  /** 애니메이션의 이징 함수 이름입니다. */
  ease?: EasingType
  /** UI 억제 시스템을 위한 태그 목록. 없으면 빈 배열([]) */
  uiTags?: string[]
  /** 해당 UI 활성화 시 억제(숨김)할 대상 태그 목록. 없으면 빈 배열([]) */
  hideTags?: string[]
}

export type ElementCmd<TConfig = any> =
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'rect' }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'ellipse' }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'text'; /** 텍스트 내용 */ text: string }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'image'; /** 이미지 에셋 키 */ image: AssetKeysOf<TConfig> }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'hide' }>

// ─── 내부 엔트리 (직렬화 가능한 상태) ─────────────────────────

export interface ElementEntry {
  id: string
  kind: ElementKind
  text?: string
  image?: string
  position: ElementPosition
  parent?: string
  style?: Partial<Style>
  hoverStyle?: Partial<Style>
  pivot?: ElementPivot
  scale?: ElementScale
  rotation?: number
  /** 이 요소에 바인딩된 behavior 이름 목록 */
  behaviors?: string[]
  /** 이 요소의 UI 억제 태그 목록 */
  uiTags?: string[]
  /** 이 요소 활성화 시 숨길 UI 태그 목록 */
  hideTags?: string[]
  /** @internal 이 요소를 선언한 씬 이름 (actions 바인딩 추적용) */
  _sceneName?: string
}

export interface ElementSchema {
  _elements: Record<string, ElementEntry>
  _lastDuration?: number
  _lastEase?: string
}

// ─── children → flat 변환 ─────────────────────────────────────

function flattenChildren(
  parentId: string,
  children: ElementChild[] | undefined,
  out: Record<string, ElementEntry>,
  sceneName?: string
): void {
  if (!children) return
  for (const child of children) {
    if (out[child.id]) continue

    out[child.id] = {
      id: child.id,
      kind: child.kind,
      text: 'text' in child ? child.text : undefined,
      image: 'image' in child ? child.image : undefined,
      position: child.position ?? { x: 0, y: 0 },
      parent: parentId,
      style: child.style,
      hoverStyle: child.hoverStyle,
      pivot: child.pivot,
      scale: child.scale,
      rotation: child.rotation,
      behaviors: child.behaviors,
      _sceneName: sceneName,
    }
    flattenChildren(child.id, child.children, out, sceneName)
  }
}

/** 지정 id + 모든 자손 id를 수집 */
function collectDescendants(
  id: string,
  elements: Record<string, ElementEntry>
): Set<string> {
  const result = new Set<string>([id])
  let changed = true
  while (changed) {
    changed = false
    for (const [eid, entry] of Object.entries(elements)) {
      if (entry.parent && result.has(entry.parent) && !result.has(eid)) {
        result.add(eid)
        changed = true
      }
    }
  }
  return result
}

// ─── 토폴로지 정렬 (parent 먼저 생성 보장) ────────────────────

function topoSort(entries: ElementEntry[]): ElementEntry[] {
  const byId = new Map(entries.map(e => [e.id, e]))
  const sorted: ElementEntry[] = []
  const visited = new Set<string>()

  const visit = (entry: ElementEntry) => {
    if (visited.has(entry.id)) return
    if (entry.parent && byId.has(entry.parent)) {
      visit(byId.get(entry.parent)!)
    }
    visited.add(entry.id)
    sorted.push(entry)
  }

  for (const entry of entries) visit(entry)
  return sorted
}

function mergePoint<T extends ElementPosition | ElementPivot>(
  previous: T | undefined,
  next: T | undefined,
  fallback: Required<T>
): Required<T> {
  return {
    x: next?.x ?? previous?.x ?? fallback.x,
    y: next?.y ?? previous?.y ?? fallback.y,
  } as Required<T>
}

function mergeScale(
  previous: ElementScale | undefined,
  next: ElementScale | undefined
): ElementScale | undefined {
  if (next === undefined) return previous
  if (typeof next === 'number') return next

  const previousObject = typeof previous === 'number'
    ? { x: previous, y: previous, z: 1 }
    : previous

  return {
    x: next.x ?? previousObject?.x ?? 1,
    y: next.y ?? previousObject?.y ?? 1,
    z: next.z ?? previousObject?.z ?? 1,
  }
}

function mergeElementEntry(
  previous: ElementEntry | undefined,
  next: ElementEntry
): ElementEntry {
  if (!previous) return next

  return {
    ...previous,
    kind: next.kind,
    text: next.text ?? previous.text,
    image: next.image ?? previous.image,
    position: mergePoint(previous.position, next.position, { x: 0.5, y: 0.5 }),
    style: next.style ? { ...previous.style, ...next.style } : previous.style,
    hoverStyle: next.hoverStyle ? { ...previous.hoverStyle, ...next.hoverStyle } : previous.hoverStyle,
    pivot: next.pivot ? mergePoint(previous.pivot, next.pivot, { x: 0.5, y: 0.5 }) : previous.pivot,
    scale: mergeScale(previous.scale, next.scale),
    rotation: next.rotation ?? previous.rotation,
    behaviors: next.behaviors ?? previous.behaviors,
    uiTags: next.uiTags ?? previous.uiTags,
    hideTags: next.hideTags ?? previous.hideTags,
    _sceneName: next._sceneName ?? previous._sceneName,
  }
}

// ─── 모듈 정의 ───────────────────────────────────────────────

const elementModule = define<ElementCmd<any>, ElementSchema>({
  _elements: {},
})

elementModule.defineView((ctx, data, setState) => {
  const _elementObjs: Record<string, any> = {}
  const _elementEntries: Record<string, ElementEntry> = {}

  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  // 루트 요소: 픽셀 좌표 → 월드 좌표
  const toLocal = (px: number, py: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(px, py)
      : { x: px - w / 2, y: -(py - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  const resolvePosition = (entry: ElementEntry) =>
    entry.parent
      ? { x: entry.position.x ?? 0, y: entry.position.y ?? 0, z: 0 }
      : toLocal(entry.position.x ?? w / 2, entry.position.y ?? h / 2)

  const resolvePivot = (pivot: ElementEntry['pivot']) => {
    if (pivot === undefined) return undefined
    return { x: pivot.x ?? 0.5, y: pivot.y ?? 0.5 }
  }

  const resolveScale = (scale: ElementEntry['scale']) => {
    if (scale === undefined) return undefined
    if (typeof scale === 'number') return { x: scale, y: scale, z: 1 }
    return { x: scale.x ?? 1, y: scale.y ?? 1, z: scale.z ?? 1 }
  }

  // ─── 요소 생성 ─────────────────────────────────────────────

  const KIND_CREATORS: Record<ElementKind, (entry: ElementEntry) => any> = {
    rect: (entry) => ctx.world.createRectangle({
      style: {
        zIndex: Z_INDEX.ELEMENT,
        pointerEvents: true,
        ...entry.style,
      },
      transform: {
        position: resolvePosition(entry),
        ...(entry.pivot ? { pivot: resolvePivot(entry.pivot) } : {}),
        ...(entry.scale !== undefined ? { scale: resolveScale(entry.scale) } : {}),
        ...(entry.rotation !== undefined ? { rotation: { z: entry.rotation } } : {}),
      },
    }),
    ellipse: (entry) => ctx.world.createEllipse({
      style: {
        zIndex: Z_INDEX.ELEMENT,
        pointerEvents: true,
        ...entry.style,
      },
      transform: {
        position: resolvePosition(entry),
        ...(entry.pivot ? { pivot: resolvePivot(entry.pivot) } : {}),
        ...(entry.scale !== undefined ? { scale: resolveScale(entry.scale) } : {}),
        ...(entry.rotation !== undefined ? { rotation: { z: entry.rotation } } : {}),
      },
    }),
    text: (entry) => ctx.world.createText({
      attribute: { text: entry.text ?? '' },
      style: {
        zIndex: Z_INDEX.ELEMENT + 1,
        pointerEvents: true,
        ...entry.style,
      },
      transform: {
        position: resolvePosition(entry),
        ...(entry.pivot ? { pivot: resolvePivot(entry.pivot) } : {}),
        ...(entry.scale !== undefined ? { scale: resolveScale(entry.scale) } : {}),
        ...(entry.rotation !== undefined ? { rotation: { z: entry.rotation } } : {}),
      },
    }),
    image: (entry) => ctx.world.createImage({
      attribute: { src: entry.image ?? '' },
      style: {
        zIndex: Z_INDEX.ELEMENT,
        pointerEvents: true,
        ...entry.style,
      },
      transform: {
        position: resolvePosition(entry),
        ...(entry.pivot ? { pivot: resolvePivot(entry.pivot) } : {}),
        ...(entry.scale !== undefined ? { scale: resolveScale(entry.scale) } : {}),
        ...(entry.rotation !== undefined ? { rotation: { z: entry.rotation } } : {}),
      },
    }),
  }

  const _registerRootElement = (entry: ElementEntry) => {
    if (entry.parent) return

    const obj = _elementObjs[entry.id]
    if (!obj) return

    ctx.ui.register(`element:${entry.id}`, {
      uiTags: entry.uiTags ?? [],
      hideTags: entry.hideTags ?? [],
      show: (dur) => obj.fadeIn(dur, 'easeOut'),
      hide: (dur) => obj.fadeOut(dur, 'easeIn'),
      onCleanup: () => { },
    })
  }

  const _addElement = (entry: ElementEntry, immediate = false, duration?: number, ease: EasingType = 'easeOut', actionCtx?: SceneContext) => {
    const effectiveCtx = actionCtx ?? ctx
    if (_elementObjs[entry.id]) return // 이미 존재

    const creator = KIND_CREATORS[entry.kind]
    if (!creator) return

    const obj = creator(entry)

    // 계층 구조
    if (entry.parent && _elementObjs[entry.parent]) {
      _elementObjs[entry.parent].addChild(obj)
    } else {
      cam?.addChild(obj)
    }

    // hover 이벤트 바인딩
    if (entry.hoverStyle) {
      const mergedHoverStyle = { ...entry.hoverStyle }
      // mouseout 시 복귀할 원본 값 (hover에서 변경하는 키만)
      const normalStyleProps = Object.fromEntries(
        Object.keys(mergedHoverStyle).map(key => [key, (entry.style as any)?.[key]])
      )

      obj.on('mouseover', () => {
        obj.animate({ style: mergedHoverStyle as any }, 150)
      })
      obj.on('mouseout', () => {
        obj.animate({ style: normalStyleProps as any }, 150)
      })
    }

    // behaviors 바인딩 — 요소를 선언한 씬(entry._sceneName)의 actions에서 조회
    if (entry.behaviors && entry.behaviors.length > 0) {
      const sceneName = entry._sceneName
      for (const behaviorName of entry.behaviors) {
        const action = sceneName
          ? ctx.callbacks.getSceneActions(sceneName, behaviorName)
          : effectiveCtx.actions.get(behaviorName)
        if (action) {
          // behavior 호출 시점에 선언 씬의 localVars를 동적으로 조회하여 fresh ctx 구성
          const localVars = sceneName
            ? ctx.callbacks.getSceneLocalVars(sceneName)
            : effectiveCtx.localVars
          const globalVars = ctx.callbacks.getGlobalVars()
          const environments = ctx.callbacks.getEnvironments()
          const behaviorCtx: SceneContext = {
            ...ctx,
            localVars,
            globalVars,
            environments,
            scene: {
              ...ctx.scene,
              getVars: () => ({
                ...ctx.callbacks.getEnvironments(),
                ...ctx.callbacks.getGlobalVars(),
                ...localVars,
              }),
            },
          }
          action(obj as LeviarObject, behaviorCtx, behaviorCtx.scene.getVars())
        } else {
          console.warn(`[fumika] element behavior: action '${behaviorName}' not found in scene '${sceneName ?? 'unknown'}'`)
        }
      }
    }

    _elementObjs[entry.id] = obj
    _elementEntries[entry.id] = entry
    // 루트 요소만 공유 참조에 저장 (defineCommand에서 UIRuntimeEntry 등록 용도)
    _registerRootElement(entry)

    if (!immediate) {
      obj.style.opacity = 0
      ctx.renderer.animate(obj, { style: { opacity: entry.style?.opacity ?? 1 } }, duration ?? 200, ease)
    }
  }

  const _removeElement = (id: string, duration?: number, immediate = false, ease: EasingType = 'easeIn') => {
    const obj = _elementObjs[id]
    if (!obj) return
    delete _elementObjs[id]
    delete _elementEntries[id]

    const dur = immediate ? 0 : ctx.renderer.dur(duration ?? 200)
    if (dur > 0) {
      ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, ease, () => {
        obj.remove({ child: true })
      })
    } else {
      obj.remove({ child: true })
    }
  }

  const _updateElement = (entry: ElementEntry, duration?: number, ease: EasingType = 'easeInOutQuad') => {
    const obj = _elementObjs[entry.id]
    const previous = _elementEntries[entry.id]
    if (!obj || !previous) return

    if (previous.kind !== entry.kind || previous.parent !== entry.parent) {
      _removeElement(entry.id, duration)
      _addElement(entry, false, duration)
      return
    }

    const dur = ctx.renderer.dur(duration ?? 200)
    const transform: Record<string, any> = {
      position: resolvePosition(entry),
    }

    if (entry.rotation !== undefined) transform.rotation = { z: entry.rotation }
    if (entry.scale !== undefined) transform.scale = resolveScale(entry.scale)
    if (entry.pivot && obj.transform?.pivot) Object.assign(obj.transform.pivot, resolvePivot(entry.pivot))

    if (entry.kind === 'text' && obj.attribute && obj.attribute.text !== entry.text) {
      obj.attribute.text = entry.text ?? ''
    }

    if (entry.kind === 'image' && obj.attribute && obj.attribute.src !== entry.image) {
      if (dur > 0 && typeof obj.transition === 'function') {
        obj.transition(entry.image ?? '', dur)
      } else {
        obj.attribute.src = entry.image ?? ''
      }
    }

    ctx.renderer.animate(
      obj,
      {
        ...(entry.style ? { style: entry.style } : {}),
        transform,
      },
      dur,
      ease
    )

    _elementEntries[entry.id] = entry
    _registerRootElement(entry)
  }

  // ─── 초기 복원 (세이브 로드 시) ─────────────────────────────

  const sorted = topoSort(Object.values(data._elements))
  for (const entry of sorted) {
    _addElement(entry, true)
  }

  return {
    // 모듈 레벨 entry는 태그 없음 — 억제는 per-element entry가 담당
    uiTags: [],
    hideTags: [],
    show: (duration) => {
      for (const [id, entry] of Object.entries(_elementEntries)) {
        if (!entry.parent && _elementObjs[id]) {
          _elementObjs[id].fadeIn(duration, 'easeOut')
        }
      }
    },
    hide: (duration) => {
      for (const [id, entry] of Object.entries(_elementEntries)) {
        if (!entry.parent && _elementObjs[id]) {
          _elementObjs[id].fadeOut(duration, 'easeIn')
        }
      }
    },
    onCleanup: () => {
      for (const obj of Object.values(_elementObjs)) {
        obj.remove({ child: true })
      }
      for (const key of Object.keys(_elementObjs)) delete _elementObjs[key]
      for (const key of Object.keys(_elementEntries)) delete _elementEntries[key]
    },
    onUpdate: (cmdCtx: SceneContext, state: ElementSchema, _setState: SetStateFn<ElementSchema>) => {
      const dur = state._lastDuration
      const ease = (state._lastEase ?? 'easeIn') as EasingType
      const newKeys = new Set(Object.keys(state._elements))

      // 제거된 항목
      for (const key of Object.keys(_elementObjs)) {
        if (!newKeys.has(key)) _removeElement(key, dur, false, ease)
      }

      // 추가된 항목 (토폴로지 순)
      const toUpdate = Object.values(state._elements).filter(e => _elementObjs[e.id])
      for (const entry of topoSort(toUpdate)) {
        _updateElement(entry, dur, ease ?? 'easeInOutQuad')
      }

      const toAdd = Object.values(state._elements).filter(e => !_elementObjs[e.id])
      const sortedAdd = topoSort(toAdd)
      for (const entry of sortedAdd) {
        _addElement(entry, false, dur, ease ?? 'easeOut', cmdCtx)
      }
    },
  }
})

/** cmd + children에서 behaviors 이름을 재귀적으로 확인하여 action 부재 시 경고 */
function warnIfActionsMissing(
  cmd: { behaviors?: string[]; children?: ElementChild[] },
  ctx: SceneContext
): void {
  if (cmd.behaviors) {
    for (const name of cmd.behaviors) {
      if (!ctx.callbacks.getActiveActions(name)) {
        console.warn(`[fumika] element: behavior '${name}' not found in current scene`)
      }
    }
  }
  if (cmd.children) {
    for (const child of cmd.children) {
      warnIfActionsMissing(child, ctx)
    }
  }
}

elementModule.defineCommand(function* (cmd, ctx, state, setState) {
  const newElements = { ...state._elements }

  if (cmd.action === 'show') {
    warnIfActionsMissing(cmd, ctx)

    const previous = newElements[cmd.id]
    const sceneName = ctx.callbacks.getCurrentSceneName()
    const nextEntry: ElementEntry = {
      id: cmd.id,
      kind: cmd.kind!,
      text: 'text' in cmd ? cmd.text : undefined,
      image: 'image' in cmd ? (cmd.image as string | undefined) : undefined,
      position: cmd.position ?? previous?.position ?? {},
      style: cmd.style,
      hoverStyle: cmd.hoverStyle,
      pivot: cmd.pivot,
      scale: cmd.scale,
      rotation: cmd.rotation,
      behaviors: cmd.behaviors,
      uiTags: cmd.uiTags,
      hideTags: cmd.hideTags,
      _sceneName: sceneName,
    }
    newElements[cmd.id] = mergeElementEntry(previous, nextEntry)
    flattenChildren(cmd.id, cmd.children, newElements, sceneName)
  } else {
    // hide: 해당 id + 자식 연쇄 삭제 + per-element entry 비활성화
    const toRemove = collectDescendants(cmd.id, newElements)
    for (const id of toRemove) {
      if (!newElements[id]?.parent) {
        // 루트 요소의 entry를 태그 없는 tombstone으로 덮어씌워 억제 시스템에서 제외
        ctx.ui.register(`element:${id}`, {
          uiTags: [],
          hideTags: [],
          show: () => { },
          hide: () => { },
          onCleanup: () => { },
        })
      }
      delete newElements[id]
    }
  }

  setState({ _elements: newElements, _lastDuration: cmd.duration, _lastEase: cmd.ease })

  // show 후 per-element UIRuntimeEntry 등록
  // setState → onUpdate → _addElement 순으로 동기 실행되므로
  // 이 시점에 _sharedElementObjs에 obj가 존재합니다.
  return true
})

export default elementModule
