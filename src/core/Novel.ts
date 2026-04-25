// =============================================================
// Novel.ts — 전역 vars 관리 + 씬 로딩 오케스트레이터
// =============================================================

import { World } from 'leviar'
import { Renderer }         from './Renderer'
import { DialogueScene, ExploreScene } from './Scene'
import type { SceneCallbacks }         from './Scene'
import type { RendererState }          from './Renderer'
import type { SceneDefinition }        from '../define/defineScene'
export type { SceneDefinition }
import type { ExploreSceneDefinition } from '../define/defineExploreScene'
import type { NovelConfig, NovelOption } from '../types/config'
import type { UIRuntimeEntry } from './UIRegistry'
import type { SceneContext } from './SceneContext'
import type { NovelModule } from '../define/defineCmdUI'

// =============================================================
// 내부 타입
// =============================================================

type AnySceneDef =
  | SceneDefinition<any, any, any, any, any, any>
  | ExploreSceneDefinition<any, any>

type ActiveScene = DialogueScene | ExploreScene

type InputMode = 'dialogue' | 'choice' | 'none'

/** novel.save()가 반환하는 세이브 데이터 */
export interface SaveData {
  /** 저장 시점의 씬 이름 */
  sceneName:     string
  /** 저장 시점의 dialogues 배열 인덱스 */
  cursor:        number
  /** 전역 변수 스냅샷 */
  globalVars:    Record<string, any>
  /** 지역 변수 스냅샷 */
  localVars:     Record<string, any>
  /** 렌더러 상태 (배경, 캐릭터, 카메라 등) 스냅샷 */
  rendererState: RendererState
  /**
   * 각 모듈이 저장하는 상태 스냅샷.
   * 'dialogue' → { subIndex, lines, speaker }
   * 'background' → { key, fit } 등
   */
  states:     Record<string, any>
}

// =============================================================
// Novel 클래스
// =============================================================

export class Novel<TConfig extends NovelConfig<any, readonly string[], any, any>> {
  /** 전역 변수. 씬 전환에도 유지됩니다 */
  readonly vars: TConfig['vars']

  private readonly _config:   TConfig
  private readonly _option:   { canvas: HTMLCanvasElement; width: number; height: number; depth: number }
  private readonly _world:    World
  private readonly _renderer: Renderer
  private readonly _scenes:   Map<string, AnySceneDef> = new Map()

  /** State — 씬 전환 후에도 유지, 세이브/로드 대상 */
  private readonly _stateStore: Map<string, any> = new Map()

  /**
   * 모듈 레지스트리 — Novel 생성 시 config.modules에서 자동 수집.
   * key: 모듈 이름, value: NovelModule 객체
   */
  private readonly _modules: Map<string, NovelModule<any>> = new Map()

  /** UI 런타임 레지스트리 — scene 실행 중 view 빌더가 등록 */
  private readonly _uiRegistry: Map<string, UIRuntimeEntry> = new Map()

  private _currentScene:    ActiveScene | null    = null
  private _currentSceneDef: AnySceneDef | null    = null
  private _inputMode:       InputMode              = 'none'
  private _isSkipping:      boolean               = false
  /** 사용자 입력 무시 만료 시간 (ms) */
  private _inputDisabledUntil: number             = 0

  constructor(
    config: TConfig,
    option: NovelOption & { scenes: Record<TConfig['scenes'][number], AnySceneDef> }
  ) {
    this._config = config

    const canvas = option.canvas
    this._option = {
      canvas,
      width:  config.width  ?? canvas.width,
      height: config.height ?? canvas.height,
      depth:  config.depth  ?? 500,
    }

    this._world = new World({ canvas })
    this._renderer = new Renderer(this._world, config, {
      width:  this._option.width,
      height: this._option.height,
      depth:  this._option.depth,
    })

    this.vars = { ...(config.vars as object) } as TConfig['vars']

    // config.modules 수집 및 key 주입
    this._collectModules(config.modules)

    this._world.start()

    for (const [name, scene] of Object.entries(option.scenes) as [string, AnySceneDef][]) {
      scene.name = name
      this._scenes.set(name, scene)
    }
  }

  /**
   * config.modules를 순회하며 모듈을 _modules에 등록하고 key를 주입합니다.
   */
  private _collectModules(modules?: Record<string, NovelModule<any>>): void {
    if (!modules) return
    for (const [key, module] of Object.entries(modules)) {
      if (module && typeof module.__setKey === 'function') {
        module.__setKey(key)
        this._modules.set(key, module)
      }
    }
  }

  // ─── 에셋 로딩 ───────────────────────────────────────────────

  async load(): Promise<void> {
    if (this._config.assets) {
      await this._world.loader.load(this._config.assets)
    }
  }

  /** config.assets 외 추가 에셋을 로드합니다 (SVG 인라인 등 런타임 생성 에셋). */
  async loadAssets(assets: Record<string, string>): Promise<void> {
    await this._world.loader.load(assets)
  }

  // ─── 씬 등록 ─────────────────────────────────────────────────

  register(scene: AnySceneDef): this {
    this._scenes.set(scene.name as string, scene)
    return this
  }

  // ─── 씬 시작/전환 ────────────────────────────────────────────

  start(name: TConfig['scenes'][number]): void {
    this.loadScene(name as string)
  }

  loadScene(name: string): void {
    const def = this._scenes.get(name)
    if (!def) {
      console.error(`[leviar-novel] 씬 '${name}'이 등록되어 있지 않습니다.`)
      return
    }

    const prevState: RendererState | null = this._currentScene
      ? this._renderer.captureState()
      : null

    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    // 씬 전환 시 choice UI DOM 정리
    this._cleanupChoiceUI()
    this._currentScene = null

    this._renderer.clear()
    if (prevState) {
      this._renderer.restoreState(prevState)
    }

    // UI 레지스트리 초기화 (새 씬에서 view 빌더가 재등록)
    this._uiRegistry.clear()

    const callbacks = this._buildCallbacks()
    const scene = def.kind === 'dialogue'
      ? new DialogueScene(this._renderer, callbacks, def)
      : new ExploreScene(this._renderer, callbacks, def)

    this._currentScene    = scene
    this._currentSceneDef = def
    this._inputMode       = 'none'
    scene.start()
    this._syncUIState()
  }

  /** 씬 전환 시 choice HTML 컨테이너 정리 */
  private _cleanupChoiceUI(): void {
    const choiceEntry = this._uiRegistry.get('choices') as any
    if (choiceEntry?.__novelRemove) {
      choiceEntry.__novelRemove()
    }
  }

  // ─── 스킵 기능 ───────────────────────────────────────────────

  /** 현재 스킵(빠른 감기) 중인지 여부 */
  get isSkipping(): boolean { return this._isSkipping }

  /** 빠른 감기를 시작합니다. 선택지 또는 씬 종료 시 자동 중지됩니다. */
  skip(): void {
    if (this._isSkipping) return
    this._isSkipping = true
    this._renderer.setSkipping(true)
    this._tickSkip()
  }

  /** 빠른 감기를 중지합니다. */
  stopSkip(): void {
    this._isSkipping = false
    this._renderer.setSkipping(false)
  }

  private _tickSkip(): void {
    if (!this._isSkipping) return

    if (!this._currentScene || this._currentScene.isEnded) {
      this.stopSkip()
      return
    }
    if (!(this._currentScene instanceof DialogueScene)) {
      this.stopSkip()
      return
    }

    if (this._currentScene.getCurrentChoice()) {
      this.stopSkip()
      return
    }

    if (this._currentScene.isWaitingInput) {
      this._currentScene.advance()
      this._syncUIState()
    }

    if (this._isSkipping) {
      setTimeout(() => this._tickSkip(), 0)
    }
  }

  /**
   * hideable:true 로 등록된 모든 UI 요소를 숨깁니다.
   */
  hideUI(duration?: number): void {
    for (const entry of this._uiRegistry.values()) {
      entry.hide(duration)
    }
  }

  /**
   * hideUI()로 숨겼던 UI 요소를 다시 표시합니다.
   */
  showUI(duration?: number): void {
    for (const entry of this._uiRegistry.values()) {
      entry.show(duration)
    }
  }

  // ─── 세이브 / 로드 ───────────────────────────────────────────

  /**
   * 현재 진행 상태를 SaveData로 반환합니다.
   */
  save(): SaveData {
    if (
      !this._currentScene ||
      !(this._currentScene instanceof DialogueScene) ||
      !this._currentSceneDef
    ) {
      throw new Error('[leviar-novel] save()는 DialogueScene 진행 중에만 호출할 수 있습니다.')
    }

    return {
      sceneName:     this._currentSceneDef.name as string,
      cursor:        this._currentScene.getCursor(),
      globalVars:    { ...this.vars as object },
      localVars:     this._currentScene.getLocalVars(),
      rendererState: this._renderer.captureState(),
      states:     Object.fromEntries(this._stateStore),
    }
  }

  /**
   * SaveData로부터 진행 상태를 복원합니다.
   */
  loadSave(data: SaveData): void {
    const def = this._scenes.get(data.sceneName)
    if (!def || def.kind !== 'dialogue') {
      console.error(`[leviar-novel] load() 실패: 씬 '${data.sceneName}'을 찾을 수 없습니다.`)
      return
    }

    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    this._cleanupChoiceUI()
    this.stopSkip()

    // 전역 변수 복원
    Object.assign(this.vars as object, data.globalVars)

    // State 복원
    this._stateStore.clear()
    for (const [k, v] of Object.entries(data.states ?? {})) {
      this._stateStore.set(k, v)
    }

    // 렌더러 초기화 + 상태 복원
    this._uiRegistry.clear()
    this._renderer.clear()
    this._renderer.restoreState(data.rendererState)
    this._renderer.rebuildFromState()

    // 모듈 View 재생성 (state에서 스키마 읽어 빌더 실행)
    this._rebuildModuleViews()

    // 새 씬 인스턴스 생성 (start() 호출 없이)
    const callbacks = this._buildCallbacks()
    const scene = new DialogueScene(this._renderer, callbacks, def as SceneDefinition<any,any,any,any,any>)

    // 지역 변수 + cursor 복원
    const subIndex = (data.states?.['dialogue'] as any)?.subIndex ?? 0
    scene.restoreState(data.cursor, data.localVars, subIndex)

    this._currentScene    = scene
    this._currentSceneDef = def
    this._inputMode       = 'none'
    this._syncUIState()
  }

  /**
   * 모든 등록된 모듈의 View 빌더를 실행하여 UI를 재생성합니다.
   * loadSave() 호출 후 실행됩니다.
   * 저장된 state를 각 모듈의 View에 주입하여 상태를 복원합니다.
   */
  private _rebuildModuleViews(): void {
    const ctx = this._makeRebuildCtx()

    for (const [name, module] of this._modules) {
      if (!module.__viewBuilder) continue
      const savedState = this._stateStore.get(name) ?? {}
      const entry = module.__viewBuilder(savedState, ctx)
      this._uiRegistry.set(name, entry)
    }
  }

  // ─── 콜백 팩토리 ─────────────────────────────────────────────

  private _buildCallbacks(): SceneCallbacks {
    return {
      getGlobalVars:   ()             => ({ ...this.vars as object }),
      setGlobalVar:    (name, value)  => { (this.vars as any)[name] = value },
      loadScene:       (name)         => { this.loadScene(name) },
      captureRenderer: ()             => this._renderer.captureState(),
      isSkipping:      ()             => this._isSkipping,
      disableInput:    (duration)     => { this._inputDisabledUntil = Date.now() + duration },
      getStateStore: ()            => this._stateStore,
      getUIRegistry:    ()            => this._uiRegistry,
      syncUIState:      ()            => { this._syncUIState() },
    }
  }

  // ─── 사용자 입력 ─────────────────────────────────────────────

  /**
   * 대화를 한 단계 진행합니다.
   */
  next(): void {
    if (Date.now() < this._inputDisabledUntil) return
    if (this._inputMode !== 'dialogue') return
    if (!this._currentScene || this._currentScene.isEnded) return

    // 타이핑 중이면 즉시 완성 (advance 하지 않음)
    const dialogueEntry = this._uiRegistry.get('dialogue')
    if (dialogueEntry?.isTyping?.()) {
      dialogueEntry.completeTyping?.()
      return
    }

    this._currentScene.advance()
    this._syncUIState()
  }

  private _syncUIState(): void {
    if (!this._currentScene || this._currentScene.isEnded) {
      this._inputMode = 'none'
      if (this._currentScene?.isEnded && this._currentSceneDef?.kind === 'dialogue') {
        const next = (this._currentSceneDef as SceneDefinition<any,any,any,any,any>).nextScene
        if (next) { this.loadScene(next); return }
      }
      return
    }
    if (!(this._currentScene instanceof DialogueScene)) return

    const choice = this._currentScene.getCurrentChoice()
    if (choice) {
      this._inputMode = 'choice'
      return
    }

    if (this._currentScene.isWaitingInput) {
      this._inputMode = 'dialogue'
      return
    }

    this._inputMode = 'none'
  }

  // ─── rebuild용 SceneContext stub ────────────────────────────

  private _makeRebuildCtx(): SceneContext {
    const noop = () => { /* no-op */ }
    const stateStore = this._stateStore
    const uiRegistry    = this._uiRegistry
    return {
      world:      this._world,
      renderer:   this._renderer,
      globalVars: {},
      localVars:  {},
      callbacks: {
        getGlobalVars:    () => ({}),
        setGlobalVar:     noop as any,
        loadScene:        noop as any,
        captureRenderer:  () => this._renderer.captureState(),
        isSkipping:       () => true,
        disableInput:     noop as any,
        getStateStore: () => stateStore,
        getUIRegistry:    () => uiRegistry,
        syncUIState:      noop,
      },
      state: {
        set: (name, data) => { stateStore.set(name, data) },
        get: (name)       => stateStore.get(name),
      },
      ui: {
        register: (name, entry) => { uiRegistry.set(name, entry) },
        get:      (name)        => uiRegistry.get(name),
        show:     (name, dur)   => uiRegistry.get(name)?.show(dur),
        hide:     (name, dur)   => uiRegistry.get(name)?.hide(dur),
      },
      scene: {
        getTextSubIndex: () => 0,
        setTextSubIndex: noop as any,
        interpolateText: (t: string) => t,
        jumpToLabel: noop as any,
        hasLabel: () => false,
        getVars: () => ({}),
        setGlobalVar: noop as any,
        setLocalVar: noop as any,
        loadScene: noop as any,
        end: noop,
      },
      execute: function* () { return false },
    }
  }
}
