// =============================================================
// Scene.ts — DialogueScene / ExploreScene 실행기
// =============================================================

import type { Renderer, RendererState } from './Renderer'
import type { SceneDefinition } from '../define/defineScene'
import type { ExploreSceneDefinition, ExploreObject } from '../define/defineExploreScene'
import type {
  DialogueEntry, DialogueStep,
  MoodType, EffectType, LightPreset, FlickerPreset, OverlayPreset,
  ZoomPreset, PanPreset, CameraEffectPreset,
  BackgroundFitPreset, FadeColorPreset, FlashPreset, WipePreset,
} from '../types/dialogue'
import type { CharDefs, BgDefs } from '../types/config'

// =============================================================
// condition.if 파서
// =============================================================

/**
 * 조건식 문자열을 평가합니다.
 * - 지원 연산자: `=`, `==`, `===`, `!=`, `!==`, `>`, `>=`, `<`, `<=`
 * - 복합 연산자: `and`, `&&`, `or`, `||`
 * - 단독 변수: truthy 체크 (ex: `'metCharacterA'`)
 */
function evaluateCondition(expr: string, vars: Record<string, any>): boolean {
  const trimmed = expr.trim()

  // or 분기 (낮은 우선순위)
  // 'a or b' → split on first 'or' (단어 경계 필요)
  const orParts = splitByLogicalOp(trimmed, ['or', '||'])
  if (orParts.length > 1) {
    return orParts.some(part => evaluateCondition(part, vars))
  }

  // and 분기 (높은 우선순위)
  const andParts = splitByLogicalOp(trimmed, ['and', '&&'])
  if (andParts.length > 1) {
    return andParts.every(part => evaluateCondition(part, vars))
  }

  // 단일 조건 평가
  return evaluateAtom(trimmed, vars)
}

/** or / and / && / || 로 분리 (단어 경계 처리) */
function splitByLogicalOp(expr: string, ops: string[]): string[] {
  for (const op of ops) {
    // 단어 구분자가 있는 경우에만 분리
    const escaped = op.replace(/[|&]/g, '\\$&')
    const re = new RegExp(`\\s+${escaped}\\s+`, 'i')
    const parts = expr.split(re)
    if (parts.length > 1) return parts.map(p => p.trim())
  }
  return [expr]
}

/** 단일 비교 표현식 평가 (ex: 'likeability >= 10', 'metCharacterA') */
function evaluateAtom(expr: string, vars: Record<string, any>): boolean {
  // 비교 연산자 순서 중요: 긴 것부터 (>= before >)
  const OPS = ['===', '!==', '>=', '<=', '!=', '==', '>', '<', '='] as const

  for (const op of OPS) {
    const idx = expr.indexOf(op)
    if (idx === -1) continue

    const lhs = expr.slice(0, idx).trim()
    const rhs = expr.slice(idx + op.length).trim()

    const lhsVal = resolveValue(lhs, vars)
    const rhsVal = parseRhs(rhs)

    switch (op) {
      case '===': return lhsVal === rhsVal
      case '!==': return lhsVal !== rhsVal
      case '>=':  return Number(lhsVal) >= Number(rhsVal)
      case '<=':  return Number(lhsVal) <= Number(rhsVal)
      case '!=':  return lhsVal != rhsVal   // eslint-disable-line eqeqeq
      case '==':  return lhsVal == rhsVal   // eslint-disable-line eqeqeq
      case '>':   return Number(lhsVal) >  Number(rhsVal)
      case '<':   return Number(lhsVal) <  Number(rhsVal)
      case '=':   return lhsVal == rhsVal   // eslint-disable-line eqeqeq
    }
  }

  // 연산자 없음 → truthy 체크
  return Boolean(resolveValue(expr.trim(), vars))
}

/** 변수명 또는 숫자/문자열 리터럴을 변수 맵에서 resolve */
function resolveValue(token: string, vars: Record<string, any>): any {
  if (token in vars) return vars[token]
  return parseRhs(token)
}

/** RHS 문자열을 JS 값으로 파싱 */
function parseRhs(raw: string): any {
  if (raw === 'true')  return true
  if (raw === 'false') return false
  if (raw === 'null')  return null
  if (!isNaN(Number(raw))) return Number(raw)
  // 따옴표 제거
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1)
  }
  return raw
}

// =============================================================
// Scene 콜백 인터페이스 (Novel 과의 통신)
// =============================================================

export interface SceneCallbacks {
  getGlobalVars():                                                    Record<string, any>
  setGlobalVar(name: string, value: any):                             void
  loadScene(name: string):                                            void
  captureRenderer():                                                  RendererState
  onDialogue(speaker: string | undefined, text: string):              void
  onChoice(choices: { text: string; next?: string; goto?: string }[]): void
}

// =============================================================
// DialogueScene 실행기
// =============================================================

export class DialogueScene {
  private readonly renderer:   Renderer
  private readonly callbacks:  SceneCallbacks
  private readonly definition: SceneDefinition<any, any, any, any, any>

  /** 지역 변수. 씬 시작 시 localVars 초깃값으로 초기화 */
  private localVars: Record<string, any>

  /** 현재 커서 (dialogues 배열 인덱스) */
  private cursor: number = 0

  /** label name → 인덱스 맵 */
  private labelIndex: Map<string, number> = new Map()

  /** 사용자 입력 대기 중 여부 */
  private _waitingInput: boolean = false

  /** 씬 종료 여부 */
  private _ended: boolean = false

  constructor(
    renderer:   Renderer,
    callbacks:  SceneCallbacks,
    definition: SceneDefinition<any, any, any, any, any>
  ) {
    this.renderer   = renderer
    this.callbacks  = callbacks
    this.definition = definition
    this.localVars  = { ...(definition.localVars ?? {}) }

    // label 인덱싱: 씬 시작 전 전체 순회
    this._buildLabelIndex()
  }

  private _buildLabelIndex(): void {
    const steps = this.definition.dialogues as DialogueStep<any, any, any, any>[]
    steps.forEach((step, i) => {
      if (!Array.isArray(step) && (step as DialogueEntry<any, any, any, any>).type === 'label') {
        const cmd = step as { type: 'label'; name: string }
        this.labelIndex.set(cmd.name, i)
      }
    })
  }

  /** 통합 변수 맵 (지역 우선) */
  private get _vars(): Record<string, any> {
    return { ...this.callbacks.getGlobalVars(), ...this.localVars }
  }

  /** 씬 실행 시작 */
  start(): void {
    this.cursor = 0
    this._executeNext()
  }

  /**
   * 사용자 입력(클릭/엔터)을 받아 다음 스텝으로 진행합니다.
   * Novel이 호출합니다.
   */
  advance(): void {
    if (!this._waitingInput || this._ended) return
    this._waitingInput = false
    this.cursor++
    this._executeNext()
  }

  private _executeNext(): void {
    if (this._ended) return

    const steps = this.definition.dialogues as DialogueStep<any, any, any, any>[]
    if (this.cursor >= steps.length) {
      // 씬 종료 (더 이상 step 없음)
      this._ended = true
      return
    }

    const step = steps[this.cursor]

    // ── 배열 스텝: 동시 실행 + 자동 진행 ───────────────────
    if (Array.isArray(step)) {
      step.forEach(cmd => this._executeCmd(cmd))
      this.cursor++
      this._executeNext()
      return
    }

    // ── 단일 스텝 ────────────────────────────────────────────
    const cmd = step as DialogueEntry<any, any, any, any>

    // 흐름 제어 커맨드: 실행 후 커서 이동 (입력 대기 없음)
    if (cmd.type === 'label') {
      this.cursor++
      this._executeNext()
      return
    }

    if (cmd.type === 'condition') {
      this._handleCondition(cmd as any)
      return
    }

    // 기타 모든 커맨드: 실행 후 입력 대기
    this._executeCmd(cmd)

    // choice는 내부에서 씬 전환 또는 goto를 처리하므로 advance를 막는다
    if (cmd.type === 'choice') return

    this._waitingInput = true
  }

  private _handleCondition(cmd: {
    type: 'condition'
    if: string
    next?: string
    goto?: string
    else?: string
    'else-next'?: string
  }): void {
    const result = evaluateCondition(cmd.if, this._vars)

    if (result) {
      if (cmd.goto) {
        this._jumpToLabel(cmd.goto)
      } else if (cmd.next) {
        this._ended = true
        this.callbacks.loadScene(cmd.next)
      } else {
        // 조건 충족이지만 이동 없음 → 다음 스텝으로
        this.cursor++
        this._executeNext()
      }
    } else {
      if (cmd.else) {
        // else는 label 이름을 먼저, 없으면 씬 이름으로 처리
        if (this.labelIndex.has(cmd.else)) {
          this._jumpToLabel(cmd.else)
        } else {
          this._ended = true
          this.callbacks.loadScene(cmd.else)
        }
      } else if (cmd['else-next']) {
        this._ended = true
        this.callbacks.loadScene(cmd['else-next'])
      } else {
        this.cursor++
        this._executeNext()
      }
    }
  }

  private _jumpToLabel(label: string): void {
    const idx = this.labelIndex.get(label)
    if (idx === undefined) {
      console.warn(`[leviar-novel] label '${label}' not found in scene '${this.definition.name}'`)
      this.cursor++
      this._executeNext()
      return
    }
    this.cursor = idx
    this._executeNext()
  }

  /** 단일 커맨드를 Renderer 메서드에 매핑하여 실행 */
  private _executeCmd(cmd: DialogueEntry<any, any, any, any>): void {
    const r = this.renderer

    switch (cmd.type) {
      // ── 스토리 흐름 ─────────────────────────────────────────
      case 'dialogue':
        this.callbacks.onDialogue(cmd.speaker as string | undefined, cmd.text)
        break

      case 'var': {
        const isLocal = cmd.scope === 'local' || (cmd.name in this.localVars)
        if (isLocal) {
          this.localVars[cmd.name as string] = cmd.value
        } else {
          this.callbacks.setGlobalVar(cmd.name as string, cmd.value)
        }
        break
      }

      case 'choice':
        this.callbacks.onChoice(cmd.choices)
        break

      // ── 배경 ─────────────────────────────────────────────────
      case 'background':
        r.setBackground(
          cmd.name,
          cmd.fit  as BackgroundFitPreset ?? 'stretch',
          cmd.duration ?? 1000,
          cmd.isVideo ?? false,
        )
        break

      // ── 무드 ─────────────────────────────────────────────────
      case 'mood':
        r.setMood(
          cmd.mood      as MoodType,
          cmd.intensity ?? 1,
          cmd.duration  ?? 800,
        )
        break

      // ── 이펙트 ───────────────────────────────────────────────
      case 'effect':
        if (cmd.action === 'add') {
          r.addEffect(cmd.effect as EffectType, cmd.rate)
        } else {
          r.removeEffect(cmd.effect as EffectType, cmd.duration)
        }
        break

      // ── 조명 ─────────────────────────────────────────────────
      case 'light':
        if (cmd.action === 'add') {
          r.addLight(cmd.preset as LightPreset)
        } else {
          r.removeLight(cmd.preset as LightPreset, cmd.duration)
        }
        break

      // ── 플리커 ───────────────────────────────────────────────
      case 'flicker':
        r.setFlicker(
          cmd.light     as LightPreset,
          cmd.flicker   as FlickerPreset,
        )
        break

      // ── 오버레이 ─────────────────────────────────────────────
      case 'overlay':
        if (cmd.action === 'add') {
          if (cmd.text) r.addOverlay(cmd.text, (cmd.preset ?? 'caption') as OverlayPreset)
        } else if (cmd.action === 'remove') {
          r.removeOverlay((cmd.preset ?? 'caption') as OverlayPreset, cmd.duration)
        } else if (cmd.action === 'clear') {
          r.clearOverlay(cmd.duration)
        }
        break

      // ── 캐릭터 ───────────────────────────────────────────────
      case 'character':
        if (cmd.action === 'show') {
          r.showCharacter(cmd.name as string, cmd.position, cmd.image as string | undefined)
        } else {
          r.removeCharacter(cmd.name as string, cmd.duration)
        }
        break

      case 'character-focus':
        r.focusCharacter(
          cmd.name as string,
          cmd.point,
          (cmd.zoom ?? 'close-up') as ZoomPreset,
          cmd.duration ?? 800,
        )
        break

      case 'character-highlight':
        if (cmd.action === 'on') {
          r.highlightCharacter(cmd.name as string)
        } else {
          r.unhighlightCharacter(cmd.name as string)
        }
        break

      // ── 카메라 ───────────────────────────────────────────────
      case 'camera-zoom':
        r.zoomCamera(
          cmd.preset   as ZoomPreset,
          cmd.duration,
        )
        break

      case 'camera-pan':
        r.panCamera(
          cmd.preset   as PanPreset,
          cmd.duration,
        )
        break

      case 'camera-effect':
        r.cameraEffect(
          cmd.preset   as CameraEffectPreset,
          cmd.duration,
          cmd.intensity,
        )
        break

      // ── 화면 전환 ────────────────────────────────────────────
      case 'screen-fade':
        r.screenFade(
          cmd.dir,
          (cmd.preset ?? 'black') as FadeColorPreset,
          cmd.duration ?? 600,
        )
        break

      case 'screen-flash':
        r.screenFlash((cmd.preset ?? 'white') as FlashPreset)
        break

      case 'screen-wipe':
        r.screenWipe(
          cmd.dir,
          (cmd.preset ?? 'left') as WipePreset,
          cmd.duration ?? 800,
        )
        break

      // ── UI ───────────────────────────────────────────────────
      case 'ui':
        // 추후 Novel UI 오브젝트 show/hide 연동
        break

      default:
        console.warn(`[leviar-novel] 알 수 없는 커맨드 타입:`, (cmd as any).type)
    }
  }

  /** 현재 대기 중인 choice 커맨드를 반환 */
  getCurrentChoice(): { type: 'choice'; choices: any[] } | null {
    if (this._ended) return null
    const steps   = this.definition.dialogues as DialogueStep<any, any, any, any>[]
    const current = steps[this.cursor]
    if (!Array.isArray(current) && (current as any)?.type === 'choice') {
      return current as any
    }
    return null
  }

  /** 현재 대기 중인 dialogue 커맨드를 반환 */
  getCurrentDialogue(): { type: 'dialogue'; speaker?: string; text: string } | null {
    if (this._ended) return null
    const steps   = this.definition.dialogues as DialogueStep<any, any, any, any>[]
    const current = steps[this.cursor]
    if (!Array.isArray(current) && (current as any)?.type === 'dialogue') {
      return current as any
    }
    return null
  }

  /** 선택지 선택 시 Novel이 호출합니다 */
  selectChoice(index: number): void {
    const choice = this.getCurrentChoice()
    if (!choice) return

    const selected = choice.choices[index]
    if (!selected) return

    // 변수 적용
    if (selected.var) {
      for (const [key, value] of Object.entries(selected.var)) {
        this.callbacks.setGlobalVar(key, value)
      }
    }

    // 씬 이동 또는 label jump
    if (selected.next) {
      this._ended = true
      this.callbacks.loadScene(selected.next)
    } else if (selected.goto) {
      this._jumpToLabel(selected.goto)
    } else {
      this.cursor++
      this._executeNext()
    }
  }

  get isEnded(): boolean { return this._ended }
  get isWaitingInput(): boolean { return this._waitingInput }
}

// =============================================================
// ExploreScene 실행기
// =============================================================

export class ExploreScene {
  private readonly renderer:   Renderer
  private readonly callbacks:  SceneCallbacks
  private readonly definition: ExploreSceneDefinition<any, any>
  private _clickHandlers:      Array<{ obj: any; handler: () => void }> = []
  private _ended:              boolean = false

  constructor(
    renderer:   Renderer,
    callbacks:  SceneCallbacks,
    definition: ExploreSceneDefinition<any, any>
  ) {
    this.renderer   = renderer
    this.callbacks  = callbacks
    this.definition = definition
  }

  start(): void {
    const { background, objects } = this.definition.options
    this.renderer.setBackground(background, 'stretch', 1000)
    this._spawnObjects(objects)
  }

  private _spawnObjects(objects: ExploreObject<any>[]): void {
    objects.forEach(objDef => {
      const world = this.renderer.world
      const img   = world.createImage({
        attribute: { src: objDef.src } as any,
        style:     { width: objDef.width ?? 100, height: objDef.height ?? 100, zIndex: 10 } as any,
        transform: { position: { x: objDef.position.x - (this.renderer as any).width / 2, y: objDef.position.y - (this.renderer as any).height / 2, z: 0 } },
      })

      const handler = () => {
        if (this._ended) return
        this._ended = true
        this.callbacks.loadScene(objDef.next)
      }
      img.on('click', handler as any)
      this._clickHandlers.push({ obj: img, handler })
    })
  }

  cleanup(): void {
    this._clickHandlers.forEach(({ obj, handler }) => {
      obj.off?.('click', handler)
      obj.remove?.()
    })
    this._clickHandlers = []
  }

  /** ExploreScene은 사용자 입력(advance)을 처리하지 않는다 */
  advance(): void { /* no-op */ }

  get isEnded(): boolean { return this._ended }
}
