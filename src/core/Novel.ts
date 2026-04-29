// =============================================================
// Novel.ts — 전역 vars 관리 + 씬 로딩 오케스트레이터
// =============================================================

import { World } from 'leviar'
import { Renderer } from './Renderer'
import { DialogueScene, ExploreScene } from './Scene'
import type { SceneCallbacks } from './Scene'
import type { RendererState } from './Renderer'
import type { SceneDefinition } from '../define/defineScene'
export type { SceneDefinition }
import type { ExploreSceneDefinition } from '../define/defineExploreScene'
import type { NovelConfig, NovelOption } from '../types/config'
import type { UIRuntimeEntry } from './UIRegistry'
import type { SceneContext } from './SceneContext'
import type { NovelModule, DefaultHook } from '../define/defineCmdUI'
import type { IHookallSync } from 'hookall'
import { useHookallSync } from 'hookall'

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
  sceneName: string
  /** 저장 시점의 dialogues 배열 인덱스 */
  cursor: number
  /** 전역 변수 스냅샷 */
  globalVars: Record<string, any>
  /** 지역 변수 스냅샷 */
  localVars: Record<string, any>
  /** 렌더러 상태 (배경, 캐릭터, 카메라 등) 스냅샷 */
  rendererState: RendererState
  /**
   * 각 모듈이 저장하는 상태 스냅샷.
   * 'dialogue' → { subIndex, lines, speaker }
   * 'background' → { key, fit } 등
   */
  states: Record<string, any>
}

// ─── NovelHook 타입 ──────────────────────────────────────────

/**
 * Novel 인스턴스가 방출하는 훅 이벤트 목록.
 * `useHookallSync(novel.hooker)` 또는 `ctx.novel.hooker`로 구독합니다.
 *
 * @example
 * ```ts
 * useHookallSync<NovelHook>(novel.hooker)
 *   .onBefore('novel:next', (value) => {
 *     console.log('next called')
 *     return value
 *   })
 * ```
 */
export interface NovelHook {
  /** novel.save() 호출 시 방출. initialValue = 저장될 SaveData */
  'novel:save': (value: SaveData) => SaveData
  /** novel.loadSave() 호출 시 방출. initialValue = 복원될 SaveData */
  'novel:load': (value: SaveData) => SaveData
  /** novel.next() 호출 시 방출. initialValue = 진행 가능 여부 */
  'novel:next': (value: boolean) => boolean
  /** novel.start() / loadScene() 호출 시 방출. initialValue = 씬 이름 */
  'novel:scene': (value: string) => string
}

// =============================================================
// AllModuleHooksOf — config.modules 훅 유니온 추출
// =============================================================

/** @internal 유니온 타입을 인터섹션으로 변환 */
type UnionToIntersectionLocal<U> =
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never

/**
 * `NovelConfig`의 `modules`에서 각 모듈의 `THook` 타입을 합친 인터섹션 타입.
 * `novel.hooker`의 타입 매개변수로 사용됩니다.
 */
export type AllModuleHooksOf<TConfig> =
  TConfig extends NovelConfig<any, any, any, any, any, any, infer TMods>
  ? UnionToIntersectionLocal<{
      [K in keyof TMods]: TMods[K] extends NovelModule<any, any, infer THook> ? THook : DefaultHook
    }[keyof TMods]>
  : DefaultHook



// =============================================================
// Novel 클래스
// =============================================================

export class Novel<TConfig extends NovelConfig<any, any, any, any, any, any, any>> {
  /** 전역 변수. 씬 전환에도 유지됩니다 */
  readonly vars: TConfig['vars']

  private readonly _config: TConfig
  private readonly _option: { canvas: HTMLCanvasElement; width: number; height: number }
  private readonly _world: World
  private readonly _renderer: Renderer
  private readonly _scenes: Map<string, AnySceneDef> = new Map()

  /** State — 씬 전환 후에도 유지, 세이브/로드 대상 */
  private readonly _stateStore: Map<string, any> = new Map()

  /**
   * 모듈 레지스트리 — Novel 생성 시 config.modules에서 자동 수집.
   * key: 모듈 이름, value: NovelModule 객체
   */
  private readonly _modules: Map<string, NovelModule<any>> = new Map()

  /** UI 런타임 레지스트리 — scene 실행 중 view 빌더가 등록 */
  private readonly _uiRegistry: Map<string, UIRuntimeEntry> = new Map()

  /** Novel 전용 훅 시스템 (novel:* 이벤트 전용) */
  private readonly _novelHooker: IHookallSync<NovelHook> = useHookallSync<NovelHook>({})

  /**
   * 통합 훅 프록시. `novel:*` 키 는 내부 Novel 훅으로, 구모듈 훅은 해당 모듈의 `hooker`로 라우팅합니다.
   * 
   * @example
   * ```ts
   * // novel 레벨 훅
   * novel.hooker.onBefore('novel:next', (v) => v)
   * // 모듈 훅 (dialogue모듈의 DialogueHook)
   * novel.hooker.onBefore('dialogue:text', (v) => v)
   * ```
   */
  // @ts-ignore — AllModuleHooksOf<TConfig>는 조건부 타입이라 ListenerSignature<M> 제약을 TS가 검증 불가. 런타임 정상.
  readonly hooker!: IHookallSync<NovelHook & AllModuleHooksOf<TConfig>>

  private _currentScene: ActiveScene | null = null
  private _currentSceneDef: AnySceneDef | null = null
  private _inputMode: InputMode = 'none'
  private _isSkipping: boolean = false
  /** 사용자 입력 무시 만료 시간 (ms) */
  private _inputDisabledUntil: number = 0

  constructor(
    config: TConfig,
    option: NovelOption & { scenes: Record<TConfig['scenes'][number], AnySceneDef> }
  ) {
    this._config = config

    const canvas = option.canvas
    this._option = {
      canvas,
      width: config.width ?? canvas.width,
      height: config.height ?? canvas.height,
    }

    this._world = new World({ canvas })
    this._renderer = new Renderer(this._world, config, {
      width: this._option.width,
      height: this._option.height,
    })

    this.vars = { ...(config.vars as object) } as TConfig['vars']

    // config.modules 수집 및 key 주입
    this._collectModules(config.modules)

    // 훅 프록시 초기화 (_modules 수집 후에 호출)
    ;(this as any).hooker = this._createHookerProxy()

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

  /**
   * novel:* 키는 _novelHooker로, 나머지 키는 접두사로 찾은 모듈의 hooker로
   * 자동 라우팅하는 IHookallSync 프록시를 생성합니다.
   */
  private _createHookerProxy(): IHookallSync<any> {
    const getHooker = (command: string): IHookallSync<any> => {
      if (command.startsWith('novel:')) return this._novelHooker
      const moduleKey = command.split(':')[0]
      const mod = this._modules.get(moduleKey)
      return (mod as any)?.hooker ?? this._novelHooker
    }

    const proxy: IHookallSync<any> = {
      onBefore:   (cmd, cb) => { getHooker(cmd).onBefore(cmd, cb);   return proxy },
      onAfter:    (cmd, cb) => { getHooker(cmd).onAfter(cmd, cb);    return proxy },
      onceBefore: (cmd, cb) => { getHooker(cmd).onceBefore(cmd, cb); return proxy },
      onceAfter:  (cmd, cb) => { getHooker(cmd).onceAfter(cmd, cb);  return proxy },
      offBefore:  (cmd, cb) => { getHooker(cmd).offBefore(cmd, cb);  return proxy },
      offAfter:   (cmd, cb) => { getHooker(cmd).offAfter(cmd, cb);   return proxy },
      trigger: (cmd, initialValue, callback, ...params) =>
        getHooker(cmd).trigger(cmd, initialValue, callback, ...params),
    }
    return proxy
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

  /**
   * 등록된 모든 모듈의 `onBoot` 콜백을 순차적으로 실행합니다.
   * `load()` 이후, `start()` 이전에 한 번 호출하십시오.
   *
   * @example
   * ```ts
   * await novel.load()
   * await novel.boot()
   * novel.start('scene-intro')
   * ```
   */
  async boot(): Promise<void> {
    for (const module of this._modules.values()) {
      if (module.__bootFn) {
        await module.__bootFn(this._world)
      }
    }
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

  loadScene(target: string | { scene: string; preserve: boolean }): void {
    const rawSceneName = typeof target === 'string' ? target : target.scene
    const preserve = typeof target === 'object' && target.preserve === true

    const sceneName = this._novelHooker.trigger(
      'novel:scene',
      rawSceneName,
      (name) => name
    )


    const def = this._scenes.get(sceneName)
    if (!def) {
      console.error(`[leviar-novel] 씬 '${sceneName}'이 등록되어 있지 않습니다.`)
      return
    }

    // 이전 씬의 훅 해제
    if (this._currentSceneDef?.kind === 'dialogue') {
      const prevHooks = (this._currentSceneDef as any).hooks
      prevHooks?._unregister(this)
    }

    const prevState: RendererState | null = (!preserve && this._currentScene)
      ? this._renderer.captureState()
      : null

    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    // 씬 전환 시 choice UI DOM 정리
    this._cleanupChoiceUI()
    this._currentScene = null

    if (!preserve) {
      this._renderer.clear()
      if (prevState) {
        this._renderer.restoreState(prevState)
      }
      // UI 레지스트리 초기화 (새 씬에서 view 빌더가 재등록)
      this._uiRegistry.clear()
    }
    // preserve=true 시: 추적 오브젝트, state 맵, UIRegistry 모두 유지

    const callbacks = this._buildCallbacks()
    const scene = def.kind === 'dialogue'
      ? new DialogueScene(this._renderer, callbacks, def)
      : new ExploreScene(this._renderer, callbacks, def)

    this._currentScene = scene
    this._currentSceneDef = def
    this._inputMode = 'none'

    // 새 씬의 훅 등록
    if (def.kind === 'dialogue') {
      const newHooks = (def as any).hooks
      newHooks?._register(this)
    }

    scene.start(preserve)
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

    const rawData: SaveData = {
      sceneName: this._currentSceneDef.name as string,
      cursor: this._currentScene.getCursor(),
      globalVars: { ...this.vars as object },
      localVars: this._currentScene.getLocalVars(),
      rendererState: this._renderer.captureState(),
      states: Object.fromEntries(this._stateStore),
    }

    return this._novelHooker.trigger(
      'novel:save',
      rawData,
      (data) => data
    )
  }

  /**
   * SaveData로부터 진행 상태를 복원합니다.
   */
  loadSave(data: SaveData): void {
    const resolvedData = this._novelHooker.trigger(
      'novel:load',
      data,
      (d) => d
    )

    const def = this._scenes.get(resolvedData.sceneName)
    if (!def || def.kind !== 'dialogue') {
      console.error(`[leviar-novel] load() 실패: 씬 '${resolvedData.sceneName}'을 찾을 수 없습니다.`)
      return
    }

    // 이전 씬 훅 해제
    if (this._currentSceneDef?.kind === 'dialogue') {
      const prevHooks = (this._currentSceneDef as any).hooks
      prevHooks?._unregister(this)
    }

    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    this._cleanupChoiceUI()
    this.stopSkip()

    // 전역 변수 복원
    Object.assign(this.vars as object, resolvedData.globalVars)

    // State 복원
    this._stateStore.clear()
    for (const [k, v] of Object.entries(resolvedData.states ?? {})) {
      this._stateStore.set(k, v)
    }

    // 렌더러 초기화 + 상태 복원
    this._uiRegistry.clear()
    this._renderer.clear()
    this._renderer.restoreState(resolvedData.rendererState)
    this._renderer.rebuildFromState()

    // 모듈 View 재생성 (state에서 스키마 읽어 빌더 실행)
    this._rebuildModuleViews()

    // 새 씬 인스턴스 생성 (start() 호출 없이)
    const callbacks = this._buildCallbacks()
    const scene = new DialogueScene(this._renderer, callbacks, def as SceneDefinition<any, any, any, any, any>)

    // 지역 변수 + cursor 복원
    const subIndex = (resolvedData.states?.['dialogue'] as any)?.subIndex ?? 0
    scene.restoreState(resolvedData.cursor, resolvedData.localVars, subIndex)

    this._currentScene = scene
    this._currentSceneDef = def
    this._inputMode = 'none'

    // 새 씬 훅 등록
    const newHooks = (def as any).hooks
    newHooks?._register(this)

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
      getNovel: () => this as any,
      getGlobalVars: () => ({ ...this.vars as object }),
      setGlobalVar: (name, value) => { (this.vars as any)[name] = value },
      loadScene: (target) => { this.loadScene(target) },
      captureRenderer: () => this._renderer.captureState(),
      isSkipping: () => this._isSkipping,
      disableInput: (duration) => { this._inputDisabledUntil = Date.now() + duration },
      getStateStore: () => this._stateStore,
      getUIRegistry: () => this._uiRegistry,
      syncUIState: () => { this._syncUIState() },
      advance: () => {
        const scene = this._currentScene
        if (scene instanceof DialogueScene && scene.isWaitingInput) {
          scene.advance()
          this._syncUIState()
        }
      },
    }
  }

  // ─── 사용자 입력 ─────────────────────────────────────────────

  /**
   * 대화를 한 단계 진행합니다.
   */
  next(): void {
    const canAdvance = this._novelHooker.trigger(
      'novel:next',
      true,
      (value) => value
    )
    if (!canAdvance) return

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
        const next = (this._currentSceneDef as SceneDefinition<any, any, any, any, any>).nextScene
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
      // dialogBox는 자체 버튼으로만 진행 가능 — novel.next() 차단
      const stepType = this._currentScene.getCurrentStepType()
      this._inputMode = stepType === 'dialogBox' ? 'none' : 'dialogue'
      return
    }

    this._inputMode = 'none'
  }

  // ─── 전체화면 ─────────────────────────────────────────────

  /** 현재 전체화면 모드인지 확인합니다. */
  get isFullscreen(): boolean {
    return document.fullscreenElement === this._option.canvas
  }

  /** 전체화면 모드로 전환합니다. */
  async requestFullscreen(): Promise<void> {
    if (!this.isFullscreen) {
      await this._option.canvas.requestFullscreen()
    }
  }

  /** 전체화면 모드를 해제합니다. */
  async exitFullscreen(): Promise<void> {
    if (this.isFullscreen) {
      await document.exitFullscreen()
    }
  }

  /** 전체화면 모드를 토글합니다. */
  async toggleFullscreen(): Promise<void> {
    if (this.isFullscreen) {
      await this.exitFullscreen()
    } else {
      await this.requestFullscreen()
    }
  }

  // ─── rebuild용 SceneContext stub ────────────────────────────

  private _makeRebuildCtx(): SceneContext {
    const noop = () => { /* no-op */ }
    const stateStore = this._stateStore
    const uiRegistry = this._uiRegistry
    return {
      novel: this as any,
      world: this._world,
      renderer: this._renderer,
      globalVars: {},
      localVars: {},
      callbacks: {
        getNovel: () => this as any,
        getGlobalVars: () => ({}),
        setGlobalVar: noop as any,
        loadScene: noop as any,
        captureRenderer: () => this._renderer.captureState(),
        isSkipping: () => true,
        disableInput: noop as any,
        getStateStore: () => stateStore,
        getUIRegistry: () => uiRegistry,
        syncUIState: noop,
        advance: noop,
      },
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
