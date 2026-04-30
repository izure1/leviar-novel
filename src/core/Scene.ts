import type { Renderer, RendererState } from './Renderer'
import type { SceneDefinition } from '../define/defineScene'
import type { DialogueEntry, DialogueStep } from '../types/dialogue'
import type { SceneContext, CommandResult } from './SceneContext'
import type { UIRuntimeEntry } from './UIRegistry'
import dialogueModule from '../modules/dialogue'
import choiceModule from '../modules/choice'
import conditionModule from '../modules/condition'
import varModule from '../modules/var'
import labelModule from '../modules/label'
import backgroundModule from '../modules/background'
import moodModule from '../modules/mood'
import effectModule from '../modules/effect'
import { overlayTextModule, overlayImageModule } from '../modules/overlay'
import characterModule, { characterFocusModule, characterHighlightModule } from '../modules/character'
import { cameraZoomModule, cameraPanModule, cameraEffectModule } from '../modules/camera'
import { screenFadeModule, screenFlashModule, screenWipeModule } from '../modules/screen'
import uiModule from '../modules/ui'
import controlModule from '../modules/control'
import audioModule from '../modules/audio'
import { setBackground } from '../modules/background'
import type { NovelModule } from '../define/defineCmdUI'

// 내장 모듈 핸들러 테이블
const BUILTIN_HANDLERS: Record<string, (cmd: any, ctx: SceneContext) => Generator<CommandResult, CommandResult, any>> = {
  'dialogue': (p, c) => dialogueModule.__handler!(p, c),
  'choice': (p, c) => choiceModule.__handler!(p, c),
  'condition': (p, c) => conditionModule.__handler!(p, c),
  'var': (p, c) => varModule.__handler!(p, c),
  'label': (p, c) => labelModule.__handler!(p, c),
  'background': (p, c) => backgroundModule.__handler!(p, c),
  'mood': (p, c) => moodModule.__handler!(p, c),
  'effect': (p, c) => effectModule.__handler!(p, c),
  'overlay-text': (p, c) => overlayTextModule.__handler!(p, c),
  'overlay-image': (p, c) => overlayImageModule.__handler!(p, c),
  'character': (p, c) => characterModule.__handler!(p, c),
  'character-focus': (p, c) => characterFocusModule.__handler!(p, c),
  'character-highlight': (p, c) => characterHighlightModule.__handler!(p, c),
  'camera-zoom': (p, c) => cameraZoomModule.__handler!(p, c),
  'camera-pan': (p, c) => cameraPanModule.__handler!(p, c),
  'camera-effect': (p, c) => cameraEffectModule.__handler!(p, c),
  'screen-fade': (p, c) => screenFadeModule.__handler!(p, c),
  'screen-flash': (p, c) => screenFlashModule.__handler!(p, c),
  'screen-wipe': (p, c) => screenWipeModule.__handler!(p, c),
  'ui': (p, c) => uiModule.__handler!(p, c),
  'control': (p, c) => controlModule.__handler!(p, c),
  'audio': (p, c) => audioModule.__handler!(p, c),
}

// =============================================================
// Scene 콜백 인터페이스 (Novel 과의 통신)
// =============================================================

/**
 * 씬(Scene) 내부에서 Novel 엔진 본체(상위 컴포넌트)와 통신하기 위해 사용하는 콜백 인터페이스.
 * 전역 변수 조작, 씬 전환, UI 업데이트 등을 엔진에 요청할 때 사용됩니다.
 */
export interface SceneCallbacks {
  /** Novel 인스턴스를 반환합니다. */
  getNovel(): any
  /** 전역 변수 전체 객체를 반환합니다. */
  getGlobalVars(): Record<string, any>
  /** 특정 전역 변수의 값을 설정합니다. */
  setGlobalVar(name: string, value: any): void
  /** 지정된 이름의 새로운 씬을 로드하고 현재 씬을 종료합니다. */
  loadScene(target: string | { scene: string; preserve: boolean }): void
  /** 세이브 저장을 위해 현재 렌더러 상태를 캡처하여 반환합니다. */
  captureRenderer(): RendererState
  /** 현재 스킵 모드 활성화 여부를 반환합니다. */
  isSkipping(): boolean
  /** 지정된 시간(ms) 동안 사용자의 입력(클릭/엔터 등)을 무시하도록 처리합니다. */
  disableInput(duration: number): void
  /** State store 참조 (state 네임스페이스용) */
  getStateStore(): Map<string, any>
  /** UIRegistry 참조 (ui 네임스페이스용) */
  getUIRegistry(): Map<string, UIRuntimeEntry>
  /** UI 상태 동기화 (입력 모드 갱신 등)를 엔진에 요청합니다. */
  syncUIState(): void
  /**
   * 현재 대기 중인 커맨드를 강제로 진행합니다.
   * 애니메이션 onEnd 콜백 등에서 호출하여 yield false 상태를 resume 시킵니다.
   */
  advance(): void
}

// =============================================================
// DialogueScene 실행기
// =============================================================

/**
 * 대화형 씬(Dialogue Scene)을 순차적으로 실행하고 관리하는 핵심 실행기(Runner) 클래스.
 * 설정된 스크립트(dialogues)를 읽어 커맨드 핸들러를 호출하고 진행 상태를 관리합니다.
 */
export class DialogueScene {
  private readonly renderer: Renderer
  private readonly callbacks: SceneCallbacks
  readonly definition: SceneDefinition<any, any, any, any, any>

  /** 지역 변수. 씬 시작 시 localVars 초깃값으로 초기화 */
  private localVars: Record<string, any>

  /** 현재 커서 (dialogues 배열 인덱스) */
  private cursor: number = 0

  /** text 배열의 현재 표시 인덱스 */
  private textSubIndex: number = 0

  /** label name → 인덱스 맵 */
  private labelIndex: Map<string, number> = new Map()

  /** 사용자 입력 대기 중 여부 */
  private _waitingInput: boolean = false

  /** 현재 실행 중인 커맨드 제너레이터 */
  private _activeGenerator: Generator<CommandResult, CommandResult, any> | null = null

  /** 씬 종료 여부 */
  private _ended: boolean = false

  constructor(
    renderer: Renderer,
    callbacks: SceneCallbacks,
    definition: SceneDefinition<any, any, any, any, any>
  ) {
    this.renderer = renderer
    this.callbacks = callbacks
    this.definition = definition
    this.localVars = { ...(definition.localVars ?? {}) }

    this._buildLabelIndex()
  }

  private _buildLabelIndex(): void {
    const steps = this.definition.dialogues as DialogueStep<any>[]
    steps.forEach((step, i) => {
      if (step.type === 'label') {
        const cmd = step as { type: 'label'; name: string }
        this.labelIndex.set(cmd.name, i)
      }
    })
  }

  /** 통합 변수 맵. 지역변수 키에 `_` 포함되어 있으므로 직접 spread */
  private get _vars(): Record<string, any> {
    return { ...this.callbacks.getGlobalVars(), ...this.localVars }
  }

  private _interpolateText(text: string): string {
    return text.replace(/\{\{(.*?)\}\}/g, (_, expr) => {
      try {
        const vars = this._vars
        const keys = Object.keys(vars)
        const values = Object.values(vars)
        const func = new Function(...keys, `return (${expr});`)
        return String(func(...values))
      } catch (e) {
        console.warn(`[kotonoha] Template interpolation failed for expression: ${expr}`, e)
        return ''
      }
    })
  }

  /** 씬 실행 시작 */
  start(preserve: boolean = false): void {
    this.cursor = 0
    this.textSubIndex = 0
    if (!preserve) {
      this._runInitial()
    }
    this._executeNext()
  }

  /**
   * `definition.initial`에 정의된 데이터로 등록된 모듈의 View를 만듭니다.
   * `novel.config.modules`에 등록된 모듈의 `__viewBuilder`를 키로 찾아 호출합니다.
   */
  private _runInitial(): void {
    const initial = this.definition.initial || {}

    const r = this.renderer
    const modules = (r.config as any).modules as Record<string, NovelModule<any>> | undefined
    if (!modules) return

    const stateStore = this.callbacks.getStateStore()
    const uiRegistry = this.callbacks.getUIRegistry()

    const ctx: SceneContext = {
      novel: this.callbacks.getNovel(),
      world: r.world,
      globalVars: this.callbacks.getGlobalVars(),
      localVars: this.localVars,
      renderer: r,
      callbacks: this.callbacks,
      state: {
        set: (name, data) => { stateStore.set(name, data) },
        get: (name) => stateStore.get(name),
      },
      ui: {
        register: (name, entry) => { uiRegistry.set(name, entry) },
        get: (name) => uiRegistry.get(name),
        show: (name, dur) => uiRegistry.get(name)?.show(dur),
        hide: (name, dur) => uiRegistry.get(name)?.hide(dur),
      },
      scene: {
        getTextSubIndex: () => this.textSubIndex,
        setTextSubIndex: (idx: number) => { this.textSubIndex = idx },
        interpolateText: (text: string) => this._interpolateText(text),
        jumpToLabel: (label: string) => this._jumpToLabel(label),
        hasLabel: (label: string) => this.labelIndex.has(label),
        getVars: () => this._vars,
        setGlobalVar: (key: string, value: any) => this.callbacks.setGlobalVar(key, value),
        setLocalVar: (key: string, value: any) => { this.localVars[key] = value },
        loadScene: (target: string | { scene: string; preserve: boolean }) => {
          this._ended = true
          this.callbacks.loadScene(target)
        },
        end: () => {
          this._ended = true
          this.callbacks.syncUIState()
        }
      },
      execute: (cmd) => this._executeCmd(cmd as any),
    }

    for (const [moduleKey, module] of Object.entries(modules)) {
      if (typeof module.__viewBuilder !== 'function') continue
      const initialData = initial[moduleKey]
      // schema 기본값 + 전달된 initial 데이터로 mergedData 준비
      const mergedData = Object.assign({}, module.__schemaDefault, initialData ?? {})
      const entry = module.__viewBuilder(mergedData, ctx)
      uiRegistry.set(moduleKey, entry)
    }
  }

  /** 캐릭터 키를 실제 이름으로 변환 */
  private _getSpeakerName(speakerKey: string | undefined): string | undefined {
    if (!speakerKey) return undefined
    const charDefs = this.renderer.config.characters as any
    const def = charDefs?.[speakerKey]
    return def?.name ?? speakerKey
  }

  /**
   * 사용자 입력(클릭/엔터)을 받아 다음 스텝으로 진행합니다.
   * Novel이 호출합니다.
   */
  advance(): void {
    if (!this._waitingInput || this._ended) return

    // false / void 반환 시 _waitingInput이 풀리며 동일 제너레이터의 next()를 호출
    this._waitingInput = false
    this._executeNext()
  }

  private _executeNext(): void {
    if (this._ended) return

    const steps = this.definition.dialogues as DialogueStep<any>[]
    if (this.cursor >= steps.length) {
      this._ended = true
      this.callbacks.syncUIState()
      return
    }

    const step = steps[this.cursor]
    const cmd = step as DialogueEntry<any, any, any>
    const cursorBefore = this.cursor

    if (!this._activeGenerator) {
      this._activeGenerator = this._executeCmd(cmd)
    }

    const currentGen = this._activeGenerator
    const nextVal = currentGen.next()

    // cursor 변화(jumpToLabel) 또는 씬 종료(loadScene/end) 감지
    if (this._ended || this.cursor !== cursorBefore) {
      if (this._activeGenerator === currentGen) {
        this._activeGenerator = null
      }
      if (!this._ended) {
        this._executeNext()
      } else {
        this.callbacks.syncUIState()
      }
      return
    }

    if (nextVal.value === true || nextVal.done || cmd.skip) {
      if (this._activeGenerator === currentGen) {
        this._activeGenerator = null
      }
      this.cursor++
      this.textSubIndex = 0
      this._executeNext()
    } else {
      // false / void: 입력 대기. advance() 시 _executeNext() 재호출 -> _activeGenerator.next() 진행
      this._waitingInput = true
      this.callbacks.syncUIState()
    }
  }


  private _jumpToLabel(label: string): void {
    this._activeGenerator = null
    const idx = this.labelIndex.get(label)
    if (idx === undefined) {
      console.warn(`[kotonoha] label '${label}' not found in scene '${this.definition.name}'`)
      this.cursor++
      this.textSubIndex = 0
      // cursor 변화를 감지하여 outer _executeNext가 처리
      return
    }
    this.cursor = idx
    this.textSubIndex = 0
    // cursor 변화를 감지하여 outer _executeNext가 처리
  }

  private _isFallbackMatch(cmd: any, rule: any): boolean {
    if (!cmd || typeof cmd !== 'object') return false
    for (const key in rule) {
      if (key === 'defaults') continue
      const ruleVal = rule[key]
      if (ruleVal !== undefined && cmd[key] !== ruleVal) return false
    }
    return true
  }

  /** 단일 커맨드를 실행 */
  private _executeCmd(originalCmd: DialogueEntry<any, any, any>): Generator<CommandResult, CommandResult, any> {
    const r = this.renderer
    let cmd = originalCmd

    // Fallback 적용
    const fallbacks = r.config.fallback
    if (fallbacks && fallbacks.length > 0) {
      const defaultsToApply: Record<string, any> = {}
      for (let i = fallbacks.length - 1; i >= 0; i--) {
        const rule = fallbacks[i] as any
        if (this._isFallbackMatch(originalCmd, rule)) {
          Object.assign(defaultsToApply, rule.defaults)
        }
      }

      cmd = { ...defaultsToApply } as any
      for (const key in originalCmd) {
        if ((originalCmd as any)[key] !== undefined) {
          (cmd as any)[key] = (originalCmd as any)[key]
        }
      }
    }

    const { type, skip, ...params } = cmd as any

    const stateStore = this.callbacks.getStateStore()
    const uiRegistry = this.callbacks.getUIRegistry()

    const ctx: SceneContext = {
      novel: this.callbacks.getNovel(),
      world: r.world,
      globalVars: this.callbacks.getGlobalVars(),
      localVars: this.localVars,
      renderer: r,
      callbacks: this.callbacks,
      state: {
        set: (name, data) => { stateStore.set(name, data) },
        get: (name) => stateStore.get(name),
      },
      ui: {
        register: (name, entry) => { uiRegistry.set(name, entry) },
        get: (name) => uiRegistry.get(name),
        show: (name, dur) => uiRegistry.get(name)?.show(dur),
        hide: (name, dur) => uiRegistry.get(name)?.hide(dur),
      },
      scene: {
        getTextSubIndex: () => this.textSubIndex,
        setTextSubIndex: (idx: number) => { this.textSubIndex = idx },
        interpolateText: (text: string) => this._interpolateText(text),
        jumpToLabel: (label: string) => this._jumpToLabel(label),
        hasLabel: (label: string) => this.labelIndex.has(label),
        getVars: () => this._vars,
        setGlobalVar: (key: string, value: any) => this.callbacks.setGlobalVar(key, value),
        setLocalVar: (key: string, value: any) => { this.localVars[key] = value },
        loadScene: (target: string | { scene: string; preserve: boolean }) => {
          this._ended = true
          this.callbacks.loadScene(target)
        },
        end: () => {
          this._ended = true
          this.callbacks.syncUIState()
        }
      },
      execute: (cmd) => this._executeCmd(cmd as any),
    }

    // config.modules 우선 확인
    const modules = r.config.modules as Record<string, NovelModule<any>> | undefined
    if (modules && typeof modules[type]?.__handler === 'function') {
      return modules[type].__handler!(params, ctx)
    }

    if (BUILTIN_HANDLERS[type]) {
      return BUILTIN_HANDLERS[type](params, ctx)
    }

    console.warn(`[kotonoha] 알 수 없는 커맨드 타입:`, type)
    return (function* () { return false })()
  }

  /** 현재 대기 중인 choice 커맨드를 반환 */
  getCurrentChoice(): { type: 'choice'; choices: any[] } | null {
    if (this._ended) return null
    const steps = this.definition.dialogues as DialogueStep<any>[]
    const current = steps[this.cursor]
    if (current?.type === 'choice') {
      return current as any
    }
    return null
  }

  /** 현재 대기 중인 dialogue 커맨드를 반환 */
  getCurrentDialogue(): { type: 'dialogue'; speaker?: string; text: string } | null {
    if (this._ended) return null
    const steps = this.definition.dialogues as DialogueStep<any>[]
    const current = steps[this.cursor]
    if (current?.type === 'dialogue') {
      const cmd = current as any
      // textSubIndex는 "다음에 출력할 줄" 인덱스이므로 현재 표시 중인 줄은 -1
      const displayIndex = Math.max(0, this.textSubIndex - 1)
      const txt = Array.isArray(cmd.text) ? cmd.text[displayIndex] : cmd.text
      const interpolated = this._interpolateText(txt)
      const speakerName = this._getSpeakerName(cmd.speaker as string | undefined)
      return { ...cmd, text: interpolated, speaker: speakerName } as any
    }
    return null
  }

  /** 선택지 선택 시 Novel이 호출합니다 */
  selectChoice(index: number): void {
    const choice = this.getCurrentChoice()
    if (!choice) return

    const selected = choice.choices[index]
    if (!selected) return

    if (selected.var) {
      for (const [key, value] of Object.entries(selected.var)) {
        this.callbacks.setGlobalVar(key, value)
      }
    }

    if (selected.next) {
      this._ended = true
      this.callbacks.loadScene(selected.next)
    } else if (selected.goto) {
      this._jumpToLabel(selected.goto)
    } else {
      this.cursor++
      this.textSubIndex = 0
      this._executeNext()
    }
  }

  // ─── 세이브/로드용 메서드 ────────────────────────────────────

  /** 현재 커서 위치 반환 (세이브용) */
  getCursor(): number { return this.cursor }

  /** 현재 text 서브 인덱스 반환 (세이브용) */
  getTextSubIndex(): number { return this.textSubIndex }

  /** 현재 지역 변수 반환 (세이브용) */
  getLocalVars(): Record<string, any> { return { ...this.localVars } }

  /**
   * 커서와 지역변수를 복원합니다 (로드용).
   * start()를 호출하지 않고 직접 상태를 복원합니다.
   */
  restoreState(cursor: number, localVars: Record<string, any>, textSubIndex: number = 0): void {
    this.cursor = cursor
    this.textSubIndex = textSubIndex
    this.localVars = { ...localVars }
    this._ended = false
    this._activeGenerator = null
    // cursor 위치의 대화/선택지를 재표시
    this._redisplayCurrentStep()
  }

  /**
   * 현재 cursor 위치의 step을 다시 표시합니다.
   * 로드 후 화면에 현재 상태를 복원할 때 사용합니다.
   */
  private _redisplayCurrentStep(): void {
    const steps = this.definition.dialogues as DialogueStep<any>[]
    const step = steps[this.cursor]
    if (!step) return

    const cmd = step as DialogueEntry<any, any, any>
    const cursorBefore = this.cursor

    this._activeGenerator = this._executeCmd(cmd)
    const nextVal = this._activeGenerator.next()

    // cursor 변화(jumpToLabel) 또는 씬 종료(loadScene/end) 감지
    if (this._ended || this.cursor !== cursorBefore) {
      this._activeGenerator = null
      if (!this._ended) {
        this._executeNext()
      } else {
        this.callbacks.syncUIState()
      }
    } else if (nextVal.value === true || nextVal.done || cmd.skip) {
      this._activeGenerator = null
      this.cursor++
      this.textSubIndex = 0
      this._executeNext()
    } else {
      this._waitingInput = true
      this.callbacks.syncUIState()
    }
  }

  /** 현재 커서 위치의 step type을 반환 (예: 'dialogue', 'choice', 'dialogBox') */
  getCurrentStepType(): string | null {
    if (this._ended) return null
    const steps = this.definition.dialogues as DialogueStep<any>[]
    return (steps[this.cursor] as any)?.type ?? null
  }

  get isEnded(): boolean { return this._ended }
  get isWaitingInput(): boolean { return this._waitingInput }
}
