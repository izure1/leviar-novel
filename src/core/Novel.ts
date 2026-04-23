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
import { setBackground } from '../cmds/background'
import { showCharacter } from '../cmds/character'
import { addMood } from '../cmds/mood'
import { addEffect } from '../cmds/effect'
import { addOverlay } from '../cmds/overlay'
import type { OverlayPreset } from '../cmds/overlay'

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
   * 각 cmd가 저장하는 상태 스냅샷.
   * 'dialogue' → { subIndex, lines, speaker }
   * 'setup-dialogue' → { bg, speaker, text } 등
   */
  cmdStates:     Record<string, any>
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

  /** CmdState — 씬 전환 후에도 유지, 세이브/로드 대상 */
  private readonly _cmdStateStore: Map<string, any> = new Map()

  /**
   * UI 정의 레지스트리 — Novel 생성 시 config.cmds에서 자동 수집.
   * rebuildUI 시 여기서 빌더를 꺼내 UI 오브젝트를 재생성합니다.
   */
  private readonly _uiDefinitions: Map<string, (style: any, ctx: SceneContext) => UIRuntimeEntry> = new Map()

  /** UI 런타임 레지스트리 — scene 실행 중 setup-* 커맨드가 등록 */
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
      width:  option.width  ?? canvas.width,
      height: option.height ?? canvas.height,
      depth:  option.depth  ?? 500,
    }

    this._world = new World({ canvas })
    this._renderer = new Renderer(this._world, config, {
      width:  this._option.width,
      height: this._option.height,
      depth:  this._option.depth,
    })

    this.vars = { ...(config.vars as object) } as TConfig['vars']

    // config.cmds에서 UIHandler 자동 감지 → _uiDefinitions 등록
    this._collectUIDefinitions(config.cmds)

    this._world.start()

    for (const [name, scene] of Object.entries(option.scenes) as [string, AnySceneDef][]) {
      scene.name = name
      this._scenes.set(name, scene)
    }
  }

  /**
   * config.ui 및 config.cmds를 순회하며 UIHandler를 _uiDefinitions에 등록합니다.
   * config.ui 우선, 이후 config.cmds에서 __uiName 메타 부착 항목 수집 (하위 호환).
   */
  private _collectUIDefinitions(cmds?: Record<string, any>): void {
    const config = this._config as any

    // 1. config.ui: { 'dialogue': dialogueUISetup, ... }
    const uiDefs = config.ui as Record<string, any> | undefined
    if (uiDefs) {
      for (const [uiKey, handler] of Object.entries(uiDefs)) {
        const h = handler as any
        if (typeof h === 'function' && h.__isUIHandler) {
          this._uiDefinitions.set(uiKey, h.__uiBuilder)
          if (h.__uiOptions) {
            ;(this._uiDefinitions as any)[`__opts_${uiKey}`] = h.__uiOptions
          }
        }
      }
    }

    // 2. config.cmds: 하위 호환 (__uiName 메타 부착 핸들러)
    if (!cmds) return
    for (const handler of Object.values(cmds)) {
      const h = handler as any
      if (h.__uiName && typeof h.__uiBuilder === 'function') {
        this._uiDefinitions.set(h.__uiName, h.__uiBuilder)
        if (h.__uiOptions) {
          ;(this._uiDefinitions as any)[`__opts_${h.__uiName}`] = h.__uiOptions
        }
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

    // UI 레지스트리 초기화 (새 씬에서 setup-* 명령어가 재등록)
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
   * 우클릭 UI 숨김 기능 등에 활용합니다.
   */
  hideUI(duration?: number): void {
    for (const entry of this._uiRegistry.values()) {
      if (entry.options?.hideable !== false) {
        entry.hide(duration)
      }
    }
  }

  /**
   * hideUI()로 숨겼던 UI 요소를 다시 표시합니다.
   */
  showUI(duration?: number): void {
    for (const entry of this._uiRegistry.values()) {
      if (entry.options?.hideable !== false) {
        entry.show(duration)
      }
    }
  }

  // ─── 세이브 / 로드 ───────────────────────────────────────────

  /**
   * 현재 진행 상태를 SaveData로 반환합니다.
   * 반환된 객체를 JSON.stringify() 하여 localStorage 등에 저장하세요.
   * @throws 대화 씬이 진행 중이지 않을 때 오류 발생
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
      cmdStates:     Object.fromEntries(this._cmdStateStore),
    }
  }

  /**
   * SaveData로부터 진행 상태를 복원합니다.
   * 렌더러 상태(배경/캐릭터/카메라)와 변수를 모두 복원한 뒤 cursor 위치에서 재개합니다.
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

    // CmdState 복원
    this._cmdStateStore.clear()
    for (const [k, v] of Object.entries(data.cmdStates ?? {})) {
      this._cmdStateStore.set(k, v)
    }

    // 렌더러 초기화 + 상태 복원
    this._uiRegistry.clear()
    this._renderer.clear()
    this._renderer.restoreState(data.rendererState)
    this._renderer.rebuildFromState()

    // UI 재생성 (cmdState에서 스타일 읽어 빌더 실행)
    this._rebuildUI()

    // 새 씬 인스턴스 생성 (start() 호출 없이)
    const callbacks = this._buildCallbacks()
    const scene = new DialogueScene(this._renderer, callbacks, def as SceneDefinition<any,any,any,any,any>)

    // 지역 변수 + cursor 복원
    const subIndex = (data.cmdStates?.['dialogue'] as any)?.subIndex ?? 0
    scene.restoreState(data.cursor, data.localVars, subIndex)

    this._currentScene    = scene
    this._currentSceneDef = def
    this._inputMode       = 'none'
    this._syncUIState()
  }

  /**
   * _uiDefinitions를 순회하며 저장된 스타일(cmdState)로 UI를 재생성합니다.
   * loadSave() 호출 후 실행됩니다.
   */
  private _rebuildUI(): void {
    const ctx = this._makeRebuildCtx()

    // 1. 배경 복원
    const bgState = this._cmdStateStore.get('background') as { key: string; fit: string } | undefined
    if (bgState?.key) {
      setBackground(ctx, bgState.key, bgState.fit as any, 0)
    }

    // 2. 캠릭터 복원
    const charState = this._cmdStateStore.get('characters') as Record<string, { position: string; imageKey: string }> | undefined
    if (charState) {
      for (const [name, info] of Object.entries(charState)) {
        showCharacter(ctx, name, info.position as any, info.imageKey, 0)
      }
    }

    // 3. 무드 복원
    const moodState = this._cmdStateStore.get('mood') as Record<string, number> | undefined
    if (moodState) {
      for (const [mood, intensity] of Object.entries(moodState)) {
        addMood(ctx, mood as any, intensity, 0)
      }
    }

    // 4. 이펙트 복원
    const effectState = this._cmdStateStore.get('effect') as Record<string, { rate?: number; srcKey?: string }> | undefined
    if (effectState) {
      for (const [type, info] of Object.entries(effectState)) {
        addEffect(ctx, type as any, info.rate, undefined, info.srcKey)
      }
    }

    // 5. 오버레이 복원
    const overlayState = this._cmdStateStore.get('overlay') as Record<string, string> | undefined
    if (overlayState) {
      for (const [preset, text] of Object.entries(overlayState)) {
        addOverlay(ctx, text, preset as OverlayPreset)
      }
    }

    // 6. config.ui 빌더 실행 (dialogue, choice 등)
    for (const [name, builder] of this._uiDefinitions) {
      // ui의 룰타임 데이터는 해당 커맨드의 cmdState 키에 저장됨
      const style = this._cmdStateStore.get(name) ?? {}
      const entry = builder(style, ctx)
      const opts = (this._uiDefinitions as any)[`__opts_${name}`]
      if (opts) entry.options = { ...opts, ...entry.options }
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
      getCmdStateStore: ()            => this._cmdStateStore,
      getUIRegistry:    ()            => this._uiRegistry,
      syncUIState:      ()            => { this._syncUIState() },
    }
  }

  // ─── 사용자 입력 ─────────────────────────────────────────────

  /**
   * 대화를 한 단계 진행합니다.
   * - 텍스트 타이핑 중이면 즉시 완성
   * - 대기 중이면 다음 대사/단계로 이동
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
    const cmdStateStore = this._cmdStateStore
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
        getCmdStateStore: () => cmdStateStore,
        getUIRegistry:    () => uiRegistry,
        syncUIState:      noop,
      },
      cmdState: {
        set: (name, data) => { cmdStateStore.set(name, data) },
        get: (name)       => cmdStateStore.get(name),
      },
      ui: {
        register: (name, entry) => { uiRegistry.set(name, entry) },
        get:      (name)        => uiRegistry.get(name),
        show:     (name, dur)   => uiRegistry.get(name)?.show(dur),
        hide:     (name, dur)   => uiRegistry.get(name)?.hide(dur),
      },
      scene: {
        getTextSubIndex: () => 0,
        interpolateText: (t: string) => t,
        jumpToLabel: noop as any,
        hasLabel: () => false,
        getVars: () => ({}),
        setGlobalVar: noop as any,
        setLocalVar: noop as any,
        loadScene: noop as any,
        end: noop,
      },
    }
  }
}
