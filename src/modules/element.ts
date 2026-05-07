import type { Style } from 'leviar'
import type { AssetKeysOf } from '../types/config'
import type { SceneContext } from '../core/SceneContext'
import type { SetStateFn } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'
import { define } from '../define/defineCmdUI'

// ─── 타입 정의 ───────────────────────────────────────────────

export type ElementKind = 'rect' | 'text' | 'image'

export interface ElementChildBase<TConfig = any> {
  /** 요소 고유 식별자 */
  id: string
  /** 부모 기준 픽셀 오프셋 위치 */
  position?: { x: number; y: number }
  /** 기본 스타일 (Leviar Style) */
  style?: Partial<Style>
  /** 호버 시 스타일 (기본 스타일에 merge, mouseout 시 복귀) */
  hoverStyle?: Partial<Style>
  /** 피벗 (0~1 정규화). 기본 { x: 0.5, y: 0.5 } */
  pivot?: { x: number; y: number }
  /** 회전 각도 (degree) */
  rotation?: number
  /** 클릭 시 실행할 액션 이름 (defineScene의 actions에서 조회) */
  onClick?: string
  /** 자식 요소 배열 */
  children?: ElementChild<TConfig>[]
}

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

export type ElementChild<TConfig = any> =
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'rect' }>
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'text'; /** 텍스트 내용 */ text: string }>
  | Expand<ElementChildBase<TConfig> & { /** 요소 종류 */ kind: 'image'; /** 이미지 에셋 키 */ image: AssetKeysOf<TConfig> }>

/**
 * 범용 UI 요소를 화면에 배치한다.
 *
 * - `kind: 'rect'` — 사각형 (패널, 버튼 배경 등)
 * - `kind: 'text'` — 텍스트
 * - `kind: 'image'` — 이미지
 *
 * `children`으로 계층 구조를 구성하며, `onClick`으로 씬 액션을 바인딩합니다.
 *
 * @example
 * {
 *   type: 'element',
 *   action: 'show',
 *   id: 'panel',
 *   kind: 'rect',
 *   position: { x: 0.92, y: 0.5 },
 *   style: { width: 120, height: 300, color: 'rgba(0,0,0,0.5)' },
 *   children: [
 *     {
 *       id: 'btn_save',
 *       kind: 'rect',
 *       position: { x: 0, y: 60 },
 *       style: { width: 100, height: 36, color: 'rgba(255,255,255,0.1)' },
 *       hoverStyle: { color: 'rgba(255,255,255,0.3)' },
 *       onClick: 'save',
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
   * - parent 없음 (루트): 0~1 정규화 좌표. { x: 0, y: 0 } = 좌상단
   * - parent 있음 (자식): 부모 중심 기준 정규화/픽셀(Leviar 좌표계) 오프셋
   */
  position?: { x: number; y: number }
  /** 기본 스타일 (Leviar Style) */
  style?: Partial<Style>
  /** 호버 시 스타일 (기본 스타일에 merge, mouseout 시 복귀) */
  hoverStyle?: Partial<Style>
  /** 피벗 (0~1 정규화) */
  pivot?: { x: number; y: number }
  /** 회전 각도 (degree) */
  rotation?: number
  /** 클릭 시 실행할 액션 이름 (defineScene의 actions에서 조회) */
  onClick?: string
  /** 자식 요소 배열 */
  children?: ElementChild<TConfig>[]
  /** show/hide 페이드 시간(ms). 기본 200 */
  duration?: number
}

export type ElementCmd<TConfig = any> =
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'rect' }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'text'; /** 텍스트 내용 */ text: string }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'show'; /** 요소 종류 */ kind: 'image'; /** 이미지 에셋 키 */ image: AssetKeysOf<TConfig> }>
  | Expand<ElementCmdBase<TConfig> & { /** 수행할 동작 */ action: 'hide' }>

// ─── 내부 엔트리 (직렬화 가능한 상태) ─────────────────────────

export interface ElementEntry {
  id: string
  kind: ElementKind
  text?: string
  image?: string
  position: { x: number; y: number }
  parent?: string
  style?: Partial<Style>
  hoverStyle?: Partial<Style>
  pivot?: { x: number; y: number }
  rotation?: number
  onClick?: string
}

export interface ElementSchema {
  _elements: Record<string, ElementEntry>
  _lastDuration?: number
}

// ─── children → flat 변환 ─────────────────────────────────────

function flattenChildren(
  parentId: string,
  children: ElementChild[] | undefined,
  out: Record<string, ElementEntry>
): void {
  if (!children) return
  for (const child of children) {
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
      rotation: child.rotation,
      onClick: child.onClick,
    }
    flattenChildren(child.id, child.children, out)
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

// ─── 모듈 레벨 액션 캐시 (view 재빌드 후에도 유지) ────────────

const _actionCache = new Map<string, (ctx: SceneContext, vars: Record<string, any>) => void>()

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

  // 루트 요소: 0~1 정규화 → 월드 좌표
  const toLocal = (nx: number, ny: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(nx * w, ny * h)
      : { x: nx * w - w / 2, y: -(ny * h - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // ─── 요소 생성 ─────────────────────────────────────────────

  const KIND_CREATORS: Record<ElementKind, (entry: ElementEntry) => any> = {
    rect: (entry) => ctx.world.createRectangle({
      style: {
        zIndex: Z_INDEX.ELEMENT,
        pointerEvents: true,
        ...entry.style,
      },
      transform: {
        position: entry.parent
          ? { x: entry.position.x, y: entry.position.y, z: 0 }
          : toLocal(entry.position.x, entry.position.y),
        ...(entry.pivot ? { pivot: entry.pivot } : {}),
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
        position: entry.parent
          ? { x: entry.position.x, y: entry.position.y, z: 0 }
          : toLocal(entry.position.x, entry.position.y),
        ...(entry.pivot ? { pivot: entry.pivot } : {}),
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
        position: entry.parent
          ? { x: entry.position.x, y: entry.position.y, z: 0 }
          : toLocal(entry.position.x, entry.position.y),
        ...(entry.pivot ? { pivot: entry.pivot } : {}),
        ...(entry.rotation !== undefined ? { rotation: { z: entry.rotation } } : {}),
      },
    }),
  }

  const _addElement = (entry: ElementEntry, immediate = false, duration?: number) => {
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

    // click 이벤트 바인딩 — 모듈 레벨 캐시에서 조회
    if (entry.onClick) {
      const actionName = entry.onClick
      obj.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        e.stopImmediatePropagation()
        const action = _actionCache.get(actionName)
        if (action) {
          // action 내부에서 ctx.execute()가 Generator를 소비하도록
          // execute를 래핑한 ctx를 전달
          const wrappedCtx: SceneContext = {
            ...ctx,
            execute: (cmd) => {
              const gen = ctx.execute(cmd)
              // Generator body를 즉시 실행 (첫 번째 yield/return까지)
              gen.next()
              return gen
            },
          }
          action(wrappedCtx, ctx.scene.getVars())
        } else {
          console.warn(`[fumika] element onClick: action '${actionName}' not found`)
        }
      })
    }

    _elementObjs[entry.id] = obj
    _elementEntries[entry.id] = entry

    if (!immediate) {
      obj.style.opacity = 0
      ctx.renderer.animate(obj, { style: { opacity: entry.style?.opacity ?? 1 } }, duration ?? 200, 'easeOut')
    }
  }

  const _removeElement = (id: string, duration?: number, immediate = false) => {
    const obj = _elementObjs[id]
    if (!obj) return
    delete _elementObjs[id]
    delete _elementEntries[id]

    const dur = immediate ? 0 : ctx.renderer.dur(duration ?? 200)
    if (dur > 0) {
      ctx.renderer.animate(obj, { style: { opacity: 0 } }, dur, 'easeIn', () => {
        obj.remove({ child: true })
      })
    } else {
      obj.remove({ child: true })
    }
  }

  // ─── 초기 복원 (세이브 로드 시) ─────────────────────────────

  const sorted = topoSort(Object.values(data._elements))
  for (const entry of sorted) {
    _addElement(entry, true)
  }

  return {
    uiTags: ['element', 'default-ui'],
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
    onUpdate: (_ctx: SceneContext, state: ElementSchema, _setState: SetStateFn<ElementSchema>) => {
      const dur = state._lastDuration
      const newKeys = new Set(Object.keys(state._elements))

      // 제거된 항목
      for (const key of Object.keys(_elementObjs)) {
        if (!newKeys.has(key)) _removeElement(key, dur)
      }

      // 추가된 항목 (토폴로지 순)
      const toAdd = Object.values(state._elements).filter(e => !_elementObjs[e.id])
      const sortedAdd = topoSort(toAdd)
      for (const entry of sortedAdd) {
        _addElement(entry, false, dur)
      }
    },
  }
})

/** cmd + children에서 onClick 이름을 재귀적으로 수집하여 캐시에 저장 */
function cacheOnClickActions(
  cmd: { onClick?: string; children?: ElementChild[] },
  ctx: SceneContext
): void {
  if (cmd.onClick) {
    const action = ctx.actions.get(cmd.onClick)
    if (action) _actionCache.set(cmd.onClick, action)
  }
  if (cmd.children) {
    for (const child of cmd.children) {
      cacheOnClickActions(child, ctx)
    }
  }
}

elementModule.defineCommand(function* (cmd, ctx, state, setState) {
  const newElements = { ...state._elements }

  if (cmd.action === 'show') {
    // onClick actions를 캐시에 저장 (command ctx는 올바른 scene actions 보유)
    cacheOnClickActions(cmd, ctx)

    // 루트 요소 등록
    newElements[cmd.id] = {
      id: cmd.id,
      kind: cmd.kind!,
      text: 'text' in cmd ? cmd.text : undefined,
      image: 'image' in cmd ? (cmd.image as string | undefined) : undefined,
      position: cmd.position ?? { x: 0.5, y: 0.5 },
      style: cmd.style,
      hoverStyle: cmd.hoverStyle,
      pivot: cmd.pivot,
      rotation: cmd.rotation,
      onClick: cmd.onClick,
    }
    // children flat 변환
    flattenChildren(cmd.id, cmd.children, newElements)
  } else {
    // hide: 해당 id + 자식 연쇄 삭제
    const toRemove = collectDescendants(cmd.id, newElements)
    for (const id of toRemove) delete newElements[id]
  }

  setState({ _elements: newElements, _lastDuration: cmd.duration })
  return true // 항상 즉시 완료 (블로킹 안 함)
})

export default elementModule
