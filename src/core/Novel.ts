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
import type { NovelConfig, NovelOption, NovelUIOption } from '../types/config'

// =============================================================
// 내부 타입
// =============================================================

type AnySceneDef =
  | SceneDefinition<any, any, any, any, any>
  | ExploreSceneDefinition<any, any>

type ActiveScene = DialogueScene | ExploreScene

type InputMode = 'dialogue' | 'choice' | 'none'

/** novel.save()가 반환하는 세이브 데이터 */
export interface SaveData {
  /** 저장 시점의 씬 이름 */
  sceneName:     string
  /** 저장 시점의 dialogues 배열 인덱스 */
  cursor:        number
  /** dialogues 요소가 text 배열일 경우, 서브 인덱스 */
  textSubIndex?: number
  /** 전역 변수 스냅샷 */
  globalVars:    Record<string, any>
  /** 지역 변수 스냅샷 */
  localVars:     Record<string, any>
  /** 렌더러 상태 (배경, 캐릭터, 카메라 등) 스냅샷 */
  rendererState: RendererState
}

// ─── UI 기본값 ────────────────────────────────────────────────

const UI_DEFAULT_BG: Record<string, any> = {
  color: 'rgba(0,0,0,0.82)',
}

const UI_DEFAULT_SPEAKER: Record<string, any> = {
  fontSize: 18, fontWeight: 'bold', color: '#ffe066',
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
}

const UI_DEFAULT_DIALOGUE: Record<string, any> = {
  fontSize: 20, color: '#ffffff', lineHeight: 1.6,
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
}

const UI_DEFAULT_CHOICE = {
  fontSize: 18, color: '#fff',
  background: 'rgba(30,30,60,0.85)', borderColor: 'rgba(255,255,255,0.3)',
  hoverBackground: 'rgba(80,80,180,0.9)', hoverBorderColor: 'rgba(255,255,255,0.7)',
  borderRadius: 8, minWidth: 260,
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
}

// =============================================================
// Novel 클래스
// =============================================================

export class Novel<TConfig extends NovelConfig<any, readonly string[], any, any>> {
  /** 전역 변수. 씬 전환에도 유지됩니다 */
  readonly vars: TConfig['vars']

  private readonly _config:   TConfig
  private readonly _option:   { canvas: HTMLCanvasElement; width: number; height: number; depth: number }
  private readonly _ui:       NovelUIOption
  private readonly _world:    World
  private readonly _renderer: Renderer
  private readonly _scenes:   Map<string, AnySceneDef> = new Map()

  private _currentScene:    ActiveScene | null    = null
  private _currentSceneDef: AnySceneDef | null    = null
  private _inputMode:       InputMode              = 'none'
  private _isSkipping:      boolean               = false
  /** 텍스트 타이핑(transition) 진행 중 여부 */
  private _isTextTyping:    boolean               = false
  /** 현재 출력 중인 전체 대사 텍스트 (즉시 완성에 사용) */
  private _currentTypingText: string              = ''
  /** 현재 실행 중인 TextTransition 객체 */
  private _activeTextTransition: any              = null
  /** 사용자 입력 무시 만료 시간 (ms) */
  private _inputDisabledUntil: number             = 0

  /** 대화창 배경 (Leviar Rectangle, 카메라 자식) */
  private _dialogueBgObj:   any = null
  /** 화자 이름창 (Leviar Text, 카메라 자식) */
  private _speakerTextObj:  any = null
  /** 대사 텍스트창 (Leviar Text, 카메라 자식) */
  private _dialogueTextObj: any = null
  /** 선택지 컨테이너 (HTML) */
  private _choicesEl:       HTMLDivElement | null  = null

  constructor(
    config: TConfig,
    option: NovelOption & { scenes: Record<TConfig['scenes'][number], AnySceneDef> }
  ) {
    this._config = config
    this._ui     = config.ui ?? {}

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
      ui:     this._ui,
    })

    this.vars = { ...(config.vars as object) } as TConfig['vars']

    this._setupBuiltinUI()
    this._world.start()

    // ── option.scenes 딕셔너리에서 씬 등록
    for (const [name, scene] of Object.entries(option.scenes) as [string, AnySceneDef][]) {
      scene.name = name
      this._scenes.set(name, scene)
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
    this._currentScene = null

    this._renderer.clear()
    if (prevState) {
      this._renderer.restoreState(prevState)
    }

    const callbacks = this._buildCallbacks()
    const scene = def.kind === 'dialogue'
      ? new DialogueScene(this._renderer, callbacks, def)
      : new ExploreScene(this._renderer, callbacks, def)

    this._currentScene    = scene
    this._currentSceneDef = def
    this._inputMode       = 'none'
    this._hideDialogueUI()
    scene.start()
    this._syncUIState()
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

    // 씬 종료 또는 ExploreScene이면 중지
    if (!this._currentScene || this._currentScene.isEnded) {
      this.stopSkip()
      return
    }
    if (!(this._currentScene instanceof DialogueScene)) {
      this.stopSkip()
      return
    }

    // 선택지 발생 시 중지
    if (this._currentScene.getCurrentChoice()) {
      this.stopSkip()
      return
    }

    // 입력 대기 중이면 즉시 advance
    if (this._currentScene.isWaitingInput) {
      this._currentScene.advance()
      this._syncUIState()
    }

    if (this._isSkipping) {
      setTimeout(() => this._tickSkip(), 0)
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
      textSubIndex:  this._currentScene.getTextSubIndex(),
      globalVars:    { ...this.vars as object },
      localVars:     this._currentScene.getLocalVars(),
      rendererState: this._renderer.captureState(),
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

    // 현재 씬 정리
    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    this.stopSkip()

    // 전역 변수 복원
    Object.assign(this.vars as object, data.globalVars)

    // 렌더러 초기화 + 상태 복원
    this._renderer.clear()
    this._renderer.restoreState(data.rendererState)

    // 새 씬 인스턴스 생성 (start() 호출 없이)
    const callbacks = this._buildCallbacks()
    const scene = new DialogueScene(this._renderer, callbacks, def as SceneDefinition<any,any,any,any,any>)

    // 지역 변수 + cursor 복원
    scene.restoreState(data.cursor, data.localVars, data.textSubIndex)

    this._currentScene    = scene
    this._currentSceneDef = def
    this._inputMode       = 'none'
    this._syncUIState()
  }

  // ─── 콜백 팩토리 ─────────────────────────────────────────────

  private _buildCallbacks(): SceneCallbacks {
    return {
      getGlobalVars:   ()             => ({ ...this.vars as object }),
      setGlobalVar:    (name, value)  => { (this.vars as any)[name] = value },
      loadScene:       (name)         => { this.loadScene(name) },
      captureRenderer: ()             => this._renderer.captureState(),
      onDialogue:      (speaker, text, speed) => { this._showDialogue(speaker, text, speed) },
      onChoice:        (choices)      => { this._showChoices(choices) },
      isSkipping:      ()             => this._isSkipping,
      disableInput:    (duration)     => { this._inputDisabledUntil = Date.now() + duration },
    }
  }

  // ─── 사용자 입력 ─────────────────────────────────────────────

  /**
   * 대화를 한 단계 진행합니다.
   * - 텍스트 타이핑 중이면 즉시 완성
   * - 대기 중이면 다음 대사/단계로 이동
   * main.ts 등 외부에서 click/keydown 이벤트에 연결하여 사용합니다.
   */
  next(): void {
    if (Date.now() < this._inputDisabledUntil) return
    if (this._inputMode !== 'dialogue') return
    if (!this._currentScene || this._currentScene.isEnded) return

    // 타이핑 중이면 즉시 완성 (advance 하지 않음)
    if (this._isTextTyping) {
      this._completeTyping()
      return
    }

    this._currentScene.advance()
    this._syncUIState()
  }

  /** transition 중단 후 현재 전체 텍스트를 즉시 표시합니다 */
  private _completeTyping(): void {
    this._isTextTyping = false
    if (!this._dialogueTextObj) return
    
    // transition 객체의 stop 호출
    if (this._activeTextTransition && typeof this._activeTextTransition.stop === 'function') {
      this._activeTextTransition.stop()
      this._activeTextTransition = null
    }

    // 전체 텍스트를 직접 지정
    ; (this._dialogueTextObj as any).attribute.text = this._currentTypingText
    ; (this._dialogueTextObj as any).style.opacity  = 1
  }

  private _syncUIState(): void {
    if (!this._currentScene || this._currentScene.isEnded) {
      this._inputMode = 'none'
      this._hideDialogueUI()
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

  // ─── 빌트인 대화 UI ──────────────────────────────────────────

  private _setupBuiltinUI(): void {
    const cam = this._world.camera as any
    const w   = this._option.width
    const h   = this._option.height
    const focalLength = cam?.attribute?.focalLength ?? 100

    const toLocal = (cx: number, cy: number) =>
      (cam && typeof cam.canvasToLocal === 'function')
        ? cam.canvasToLocal(cx, cy)
        : { x: cx - w / 2, y: -(cy - h / 2), z: focalLength }

    // ── UI 설정 병합 (기본값 + 사용자 Leviar Style)
    const bgCfg  = { ...UI_DEFAULT_BG,       ...(this._ui.dialogueBg ?? {}) } as any
    const spkCfg = { ...UI_DEFAULT_SPEAKER,   ...(this._ui.speaker    ?? {}) } as any
    const dlgCfg = { ...UI_DEFAULT_DIALOGUE,  ...(this._ui.dialogue   ?? {}) } as any

    // height 미지정 시 캔버스 높이의 28%
    const BOX_H = typeof bgCfg.height === 'number' ? bgCfg.height : h * 0.28
    const BOX_CY = h - (BOX_H / 2)   // 박스 중앙 y

    // ── 대화창 배경 (center 기준)
    const bgRect = this._world.createRectangle({
      style: {
        ...bgCfg,
        width:         bgCfg.width  ?? w,
        height:        BOX_H,
        zIndex:        bgCfg.zIndex ?? 300,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, BOX_CY) },
    })
    this._world.camera?.addChild(bgRect as any)
    this._dialogueBgObj = bgRect

    // ── 화자 이름창 (좌측 정렬)
    const spkY = h - BOX_H + 24
    const speakerText = this._world.createText({
      attribute: { text: '' } as any,
      style: {
        ...spkCfg,
        width:         w * 0.90,
        zIndex:        spkCfg.zIndex ?? 301,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, spkY) },
    })
    this._world.camera?.addChild(speakerText as any)
    this._speakerTextObj = speakerText

    // ── 대사 텍스트창 (이름창 아래)
    const spkH = (spkCfg.fontSize ?? 18) * 1.5
    const dialogueText = this._world.createText({
      attribute: { text: '' } as any,
      style: {
        ...dlgCfg,
        width:         dlgCfg.width ?? w * 0.90,
        zIndex:        dlgCfg.zIndex ?? 301,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, spkY + spkH + 8) },
    })
    this._world.camera?.addChild(dialogueText as any)
    this._dialogueTextObj = dialogueText

    // ── 선택지 컨테이너 (HTML)
    const canvas  = this._option.canvas
    const parent  = canvas.parentElement ?? document.body
    const choices = document.createElement('div')
    const chCfg   = { ...UI_DEFAULT_CHOICE, ...(this._ui.choice ?? {}) }
    choices.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:none',
      'flex-direction:column', 'justify-content:center', 'align-items:center',
      'gap:12px',
      'background:rgba(0,0,0,0.6)',
      'pointer-events:auto',
      `font-family:${chCfg.fontFamily}`,
    ].join(';')
    parent.style.position = 'relative'
    parent.appendChild(choices)
    this._choicesEl = choices
  }

  private _showDialogue(speaker: string | undefined, text: string, speed?: number): void {
    if (!this._dialogueBgObj || !this._speakerTextObj || !this._dialogueTextObj) return

    const skipping = this._isSkipping

    // 대화창 배경 페이드인
    if (!skipping) {
      ; (this._dialogueBgObj as any).animate({ style: { opacity: 1 } }, 250, 'easeOut')
    } else {
      ; (this._dialogueBgObj as any).style.opacity = 1
    }

    // ── 이름창: 항상 즉시 교체 (transition 없음)
    ; (this._speakerTextObj as any).attribute.text = speaker ?? ''
    ; (this._speakerTextObj as any).style.opacity  = speaker ? 1 : 0

    // ── 대사 텍스트: 스킵 중 즉시, 아니면 transition(타이핑 효과)
    if (skipping) {
      this._isTextTyping = false
      this._currentTypingText = text
      if (this._activeTextTransition) {
        this._activeTextTransition.stop?.()
        this._activeTextTransition = null
      }
      ; (this._dialogueTextObj as any).attribute.text = text
      ; (this._dialogueTextObj as any).style.opacity  = 1
    } else {
      const spd = speed ?? 30
      this._isTextTyping = true
      this._currentTypingText = text
      const anim = (this._dialogueTextObj as any).transition(text, spd)
      this._activeTextTransition = anim
      ; (this._dialogueTextObj as any).animate({ style: { opacity: 1 } }, 200, 'easeOut')
      // transition 완료 시 타이핑 플래그 해제
      if (anim && typeof anim.on === 'function') {
        anim.on('end', () => { 
          this._isTextTyping = false 
          this._activeTextTransition = null
        })
      }
    }

    if (this._choicesEl) {
      this._choicesEl.style.display = 'none'
      this._choicesEl.innerHTML     = ''
    }
  }

  private _showChoices(choices: { text: string; next?: string; goto?: string }[]): void {
    if (!this._choicesEl) return

    if (this._dialogueBgObj)   (this._dialogueBgObj   as any).animate({ style: { opacity: 0 } }, 200, 'easeIn')
    if (this._speakerTextObj)  (this._speakerTextObj  as any).style.opacity = 0
    if (this._dialogueTextObj) (this._dialogueTextObj as any).animate({ style: { opacity: 0 } }, 200, 'easeIn')

    this._choicesEl.style.display = 'flex'
    this._choicesEl.innerHTML     = ''
    this._inputMode               = 'choice'

    const chCfg = { ...UI_DEFAULT_CHOICE, ...(this._ui.choice ?? {}) }

    choices.forEach((choice, i) => {
      const btn = document.createElement('button')
      btn.textContent = choice.text
      btn.style.cssText = [
        `padding:12px 32px`,
        `font-size:${chCfg.fontSize}px`,
        `font-family:${chCfg.fontFamily}`,
        `color:${chCfg.color}`,
        `background:${chCfg.background}`,
        `border:1.5px solid ${chCfg.borderColor}`,
        `border-radius:${chCfg.borderRadius}px`,
        `cursor:pointer`,
        `transition:background 0.15s,border-color 0.15s`,
        `min-width:${chCfg.minWidth}px`,
        `text-align:center`,
      ].join(';')
      btn.addEventListener('mouseenter', () => {
        btn.style.background   = chCfg.hoverBackground
        btn.style.borderColor  = chCfg.hoverBorderColor
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background   = chCfg.background
        btn.style.borderColor  = chCfg.borderColor
      })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this._currentScene instanceof DialogueScene) {
          const prevScene = this._currentScene
          this._currentScene.selectChoice(i)
          if (this._currentScene === prevScene) {
            this._hideDialogueUI()
            this._syncUIState()
          }
        }
      })
      this._choicesEl!.appendChild(btn)
    })
  }

  private _hideDialogueUI(): void {
    if (this._dialogueBgObj)   (this._dialogueBgObj   as any).animate({ style: { opacity: 0 } }, 300, 'easeIn')
    if (this._speakerTextObj)  (this._speakerTextObj  as any).style.opacity = 0
    if (this._dialogueTextObj) (this._dialogueTextObj as any).animate({ style: { opacity: 0 } }, 300, 'easeIn')
    if (this._choicesEl) {
      this._choicesEl.style.display = 'none'
      this._choicesEl.innerHTML     = ''
    }
  }
}
