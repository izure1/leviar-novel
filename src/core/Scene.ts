// =============================================================
// Scene.ts — DialogueScene / ExploreScene 실행기
// =============================================================

import type { Renderer, RendererState } from './Renderer'
import type { SceneDefinition } from '../define/defineScene'
import type { ExploreSceneDefinition, ExploreObject } from '../define/defineExploreScene'
import type { DialogueEntry, DialogueStep } from '../types/dialogue'
import { dialogueHandler } from '../cmds/dialogue'
import { choiceHandler } from '../cmds/choice'
import { conditionHandler } from '../cmds/condition'
import { varHandler } from '../cmds/var'
import { labelHandler } from '../cmds/label'
import { backgroundHandler } from '../cmds/background'
import { moodHandler } from '../cmds/mood'
import { effectHandler } from '../cmds/effect'
import { overlayHandler } from '../cmds/overlay'
import { characterHandler, characterFocusHandler, characterHighlightHandler } from '../cmds/character'
import { cameraZoomHandler, cameraPanHandler, cameraEffectHandler } from '../cmds/camera'
import { screenFadeHandler, screenFlashHandler, screenWipeHandler } from '../cmds/screen'
import { uiHandler } from '../cmds/ui'
import { controlHandler } from '../cmds/control'
import type { SceneContext, CommandResult } from './SceneContext'
import { setBackground } from '../cmds/background'

const BUILTIN_CMDS: Record<string, (cmd: any, ctx: SceneContext) => CommandResult> = {
  'dialogue': dialogueHandler,
  'choice': choiceHandler,
  'condition': conditionHandler,
  'var': varHandler,
  'label': labelHandler,
  'background': backgroundHandler,
  'mood': moodHandler,
  'effect': effectHandler,
  'overlay': overlayHandler,
  'character': characterHandler,
  'character-focus': characterFocusHandler,
  'character-highlight': characterHighlightHandler,
  'camera-zoom': cameraZoomHandler,
  'camera-pan': cameraPanHandler,
  'camera-effect': cameraEffectHandler,
  'screen-fade': screenFadeHandler,
  'screen-flash': screenFlashHandler,
  'screen-wipe': screenWipeHandler,
  'ui': uiHandler,
  'control': controlHandler,
}

// =============================================================
// Scene 콜백 인터페이스 (Novel 과의 통신)
// =============================================================

export interface SceneCallbacks {
  getGlobalVars(): Record<string, any>
  setGlobalVar(name: string, value: any): void
  loadScene(name: string): void
  captureRenderer(): RendererState
  onDialogue(speaker: string | undefined, text: string, speed?: number): void
  onChoice(choices: { text: string; next?: string; goto?: string }[]): void
  /** 현재 스킵 모드 여부 */
  isSkipping(): boolean
  /** 지정된 시간(ms) 동안 사용자 입력을 무시합니다 */
  disableInput(duration: number): void
}

// =============================================================
// DialogueScene 실행기
// =============================================================

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
    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
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
        console.warn(`[leviar-novel] Template interpolation failed for expression: ${expr}`, e)
        return ''
      }
    })
  }

  /** 씬 실행 시작 */
  start(): void {
    this.cursor = 0
    this.textSubIndex = 0
    this._executeNext()
  }

  /**
   * 사용자 입력(클릭/엔터)을 받아 다음 스텝으로 진행합니다.
   * Novel이 호출합니다.
   */
  advance(): void {
    if (!this._waitingInput || this._ended) return

    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
    const step = steps[this.cursor] as any

    if (step.type === 'dialogue' && Array.isArray(step.text)) {
      if (this.textSubIndex < step.text.length - 1) {
        this.textSubIndex++
        const txt = step.text[this.textSubIndex]
        const interpolated = this._interpolateText(txt)
        this.callbacks.onDialogue(step.speaker as string | undefined, interpolated, step.speed)
        return
      }
    }

    this._waitingInput = false
    this.cursor++
    this.textSubIndex = 0
    this._executeNext()
  }

  private _executeNext(): void {
    if (this._ended) return

    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
    if (this.cursor >= steps.length) {
      this._ended = true
      return
    }

    const step = steps[this.cursor]
    const cmd = step as DialogueEntry<any, any, any, any, any, any, any>

    const result = this._executeCmd(cmd)

    if (result === 'handled') return

    if (result === true || cmd.skip) {
      this.cursor++
      this.textSubIndex = 0
      this._executeNext()
    } else {
      this._waitingInput = true
    }
  }


  private _jumpToLabel(label: string): void {
    const idx = this.labelIndex.get(label)
    if (idx === undefined) {
      console.warn(`[leviar-novel] label '${label}' not found in scene '${this.definition.name}'`)
      this.cursor++
      this.textSubIndex = 0
      this._executeNext()
      return
    }
    this.cursor = idx
    this.textSubIndex = 0
    this._executeNext()
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
  private _executeCmd(originalCmd: DialogueEntry<any, any, any, any, any, any, any>): CommandResult {
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

    const ctx: SceneContext = {
      world: r.world,
      globalVars: this.callbacks.getGlobalVars(),
      localVars: this.localVars,
      renderer: r,
      callbacks: this.callbacks,
      scene: {
        getTextSubIndex: () => this.textSubIndex,
        interpolateText: (text: string) => this._interpolateText(text),
        jumpToLabel: (label: string) => this._jumpToLabel(label),
        hasLabel: (label: string) => this.labelIndex.has(label),
        getVars: () => this._vars,
        setGlobalVar: (key: string, value: any) => this.callbacks.setGlobalVar(key, value),
        setLocalVar: (key: string, value: any) => { this.localVars[key] = value },
        loadScene: (name: string) => this.callbacks.loadScene(name),
        end: () => { this._ended = true }
      }
    }

    if (BUILTIN_CMDS[type]) {
      return BUILTIN_CMDS[type](params, ctx)
    }

    const cmds = r.config.cmds
    if (cmds && typeof cmds[type] === 'function') {
      const customSkip = cmds[type](params, ctx)
      return customSkip === true ? true : false
    }

    console.warn(`[leviar-novel] 알 수 없는 커맨드 타입:`, type)
    return false
  }

  /** 현재 대기 중인 choice 커맨드를 반환 */
  getCurrentChoice(): { type: 'choice'; choices: any[] } | null {
    if (this._ended) return null
    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
    const current = steps[this.cursor]
    if (current?.type === 'choice') {
      return current as any
    }
    return null
  }

  /** 현재 대기 중인 dialogue 커맨드를 반환 */
  getCurrentDialogue(): { type: 'dialogue'; speaker?: string; text: string } | null {
    if (this._ended) return null
    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
    const current = steps[this.cursor]
    if (current?.type === 'dialogue') {
      const cmd = current as any
      const txt = Array.isArray(cmd.text) ? cmd.text[this.textSubIndex] : cmd.text
      const interpolated = this._interpolateText(txt)
      return { ...cmd, text: interpolated } as any
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
    // cursor 위치의 대화/선택지를 재표시
    this._redisplayCurrentStep()
  }

  /**
   * 현재 cursor 위치의 step을 다시 표시합니다.
   * 로드 후 화면에 현재 상태를 복원할 때 사용합니다.
   */
  private _redisplayCurrentStep(): void {
    const steps = this.definition.dialogues as DialogueStep<any, any, any, any, any, any, any>[]
    const step = steps[this.cursor]
    if (!step) return

    const cmd = step as DialogueEntry<any, any, any, any, any, any, any>
    if (cmd.type === 'dialogue') {
      const dCmd = cmd as any
      const txt = Array.isArray(dCmd.text) ? dCmd.text[this.textSubIndex] : dCmd.text
      const interpolated = this._interpolateText(txt)
      this.callbacks.onDialogue(dCmd.speaker as string | undefined, interpolated, dCmd.speed)
      this._waitingInput = true
    } else if (cmd.type === 'choice') {
      this.callbacks.onChoice((cmd as any).choices)
    } else {
      if (!cmd.skip) {
        this._waitingInput = true
      }
    }
  }

  get isEnded(): boolean { return this._ended }
  get isWaitingInput(): boolean { return this._waitingInput }
}

// =============================================================
// ExploreScene 실행기
// =============================================================

export class ExploreScene {
  private readonly renderer: Renderer
  private readonly callbacks: SceneCallbacks
  private readonly definition: ExploreSceneDefinition<any, any>
  private _clickHandlers: Array<{ obj: any; handler: () => void }> = []
  private _ended: boolean = false

  constructor(
    renderer: Renderer,
    callbacks: SceneCallbacks,
    definition: ExploreSceneDefinition<any, any>
  ) {
    this.renderer = renderer
    this.callbacks = callbacks
    this.definition = definition
  }

  start(): void {
    const { background, objects } = this.definition.options
    setBackground(
      { renderer: this.renderer } as any,
      background,
      'stretch',
      1000
    )
    this._spawnObjects(objects)
  }

  private _spawnObjects(objects: ExploreObject<any>[]): void {
    objects.forEach(objDef => {
      const world = this.renderer.world
      const img = world.createImage({
        attribute: {
          src: objDef.src
        } as any,
        style: {
          width: objDef.width ?? 100,
          height: objDef.height ?? 100,
          zIndex: 10,
        } as any,
        transform: {
          position: {
            x: objDef.position.x - (this.renderer as any).width / 2,
            y: objDef.position.y - (this.renderer as any).height / 2,
            z: 0
          }
        },
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

  advance(): void { /* no-op */ }

  get isEnded(): boolean { return this._ended }
}
