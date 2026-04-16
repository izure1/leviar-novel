// =============================================================
// Novel.ts — 전역 vars 관리 + 씬 로딩 오케스트레이터
// World를 내부적으로 생성하고, 씬 전환 및 사용자 입력을 총괄합니다.
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

// =============================================================
// 내부 타입
// =============================================================

type AnySceneDef =
  | SceneDefinition<any, any, any, any, any>
  | ExploreSceneDefinition<any, any>

type ActiveScene = DialogueScene | ExploreScene

/** 현재 입력 모드 */
type InputMode = 'dialogue' | 'choice' | 'none'

// =============================================================
// Novel 클래스
// =============================================================

export class Novel<TConfig extends NovelConfig<any, readonly string[], any, any>> {
  /** 전역 변수. 씨 전환에도 유지됩니다 */
  readonly vars: TConfig['vars']

  private readonly _config:   TConfig
  private readonly _option:   Required<NovelOption>
  private readonly _world:    World
  private readonly _renderer: Renderer
  private readonly _scenes:   Map<string, AnySceneDef> = new Map()

  private _currentScene:    ActiveScene | null    = null
  private _currentSceneDef: AnySceneDef | null    = null
  private _inputMode:       InputMode              = 'none'
  private _inputBound:      (() => void) | null    = null

  /** 대화창 배경 (Leviar Rectangle, 카메라 자식) */
  private _dialogueBgObj:   any = null
  /** 화자 이름 (Leviar Text, 카메라 자식) */
  private _speakerTextObj:  any = null
  /** 대사 텍스트 (Leviar Text, 카메라 자식) */
  private _dialogueTextObj: any = null
  /** 선택지 컨테이너 (HTML — 클릭 이벤트 처리) */
  private _choicesEl:       HTMLDivElement | null  = null

  constructor(config: TConfig, option: NovelOption) {
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

    // vars는 config의 복사본으로 초기화 (런타임에서 변경 가능)
    this.vars = { ...(config.vars as object) } as TConfig['vars']

    this._setupBuiltinUI()
    this._setupInput()
    this._world.start()
  }

  // ─── 에셋 로딩 ───────────────────────────────────────────────

  /**
   * 에셋을 로드합니다.
   * ```ts
   * await novel.load({
   *   'girl_normal': './assets/girl_normal.png',
   *   'bg_classroom': './assets/bg/classroom.png',
   * })
   * ```
   */
  async load(assets: Record<string, string>): Promise<void> {
    await this._world.loader.load(assets)
  }

  // ─── 씬 등록 ─────────────────────────────────────────────────

  /**
   * 씬을 등록합니다. `start()` 전에 모든 씬을 등록해야 합니다.
   * ```ts
   * novel.register(sceneA)
   * novel.register(sceneB)
   * ```
   */
  register(scene: AnySceneDef): this {
    this._scenes.set(scene.name as string, scene)
    return this
  }

  // ─── 씬 시작/전환 ────────────────────────────────────────────

  /**
   * 지정한 씬으로 시작합니다.
   * @param name config scenes 배열에 정의된 씬 이름
   */
  start(name: TConfig['scenes'][number]): void {
    this.loadScene(name as string)
  }

  loadScene(name: string): void {
    const def = this._scenes.get(name)
    if (!def) {
      console.error(`[leviar-novel] 씬 '${name}'이 등록되어 있지 않습니다. novel.register()로 먼저 등록하세요.`)
      return
    }

    // 현재 씬의 렌더 상태 스냅샷
    const prevState: RendererState | null = this._currentScene
      ? this._renderer.captureState()
      : null

    // 현재 씬 정리
    if (this._currentScene instanceof ExploreScene) {
      this._currentScene.cleanup()
    }
    this._currentScene = null

    // 렌더러 초기화 후 상태 복원
    this._renderer.clear()
    if (prevState) {
      this._renderer.restoreState(prevState)
    }

    // 새 씬 생성
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

  // ─── 콜백 팩토리 ─────────────────────────────────────────────

  private _buildCallbacks(): SceneCallbacks {
    return {
      getGlobalVars:  ()             => ({ ...this.vars as object }),
      setGlobalVar:   (name, value)  => { (this.vars as any)[name] = value },
      loadScene:      (name)         => { this.loadScene(name) },
      captureRenderer: ()           => this._renderer.captureState(),
      onDialogue:     (speaker, text) => { this._showDialogue(speaker, text) },
      onChoice:       (choices)      => { this._showChoices(choices) },
    }
  }

  // ─── 사용자 입력 ─────────────────────────────────────────────

  private _setupInput(): void {
    const handler = () => this._handleInput()
    this._inputBound = handler
    document.addEventListener('click',   handler)
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') handler()
    })
  }

  private _handleInput(): void {
    if (this._inputMode !== 'dialogue') return
    if (!this._currentScene || this._currentScene.isEnded) return
    this._currentScene.advance()
    this._syncUIState()
  }

  /** Scene 실행 후 현재 상태에 맞게 UI 갱신 */
  private _syncUIState(): void {
    if (!this._currentScene || this._currentScene.isEnded) {
      this._inputMode = 'none'
      this._hideDialogueUI()
      // 씨 종료 후 nextScene 자동 이동
      if (this._currentScene?.isEnded && this._currentSceneDef?.kind === 'dialogue') {
        const next = (this._currentSceneDef as SceneDefinition<any,any,any,any,any>).nextScene
        if (next) { this.loadScene(next); return }
      }
      return
    }
    if (!(this._currentScene instanceof DialogueScene)) return

    // choice 모드 (isWaitingInput이 false이므로 먼저 확인)
    const choice = this._currentScene.getCurrentChoice()
    if (choice) {
      this._inputMode = 'choice'
      return
    }

    // 배열 외 모든 단독 커맨드(렌더 커맨드 포함)에 대해 입력 대기
    if (this._currentScene.isWaitingInput) {
      this._inputMode = 'dialogue'
      return
    }

    this._inputMode = 'none'
  }

  // ─── 빌트인 대화 UI (Leviar 오브젝트 + HTML 선택지) ──────────────────

  private _setupBuiltinUI(): void {
    const cam = this._world.camera as any
    const w   = this._option.width
    const h   = this._option.height
    const focalLength = cam?.attribute?.focalLength ?? 100

    // canvas 픽셀 좌표 → 카메라-로컬 3D 좌표
    const toLocal = (cx: number, cy: number) =>
      (cam && typeof cam.canvasToLocal === 'function')
        ? cam.canvasToLocal(cx, cy)
        : { x: cx - w / 2, y: -(cy - h / 2), z: focalLength }

    const BOX_H  = h * 0.30
    const BOX_CY = h - BOX_H / 2

    // ── 대화창 배경 (Rectangle)
    const bgRect = this._world.createRectangle({
      style: {
        color:         'rgba(0,0,0,0.82)',
        width:         w,
        height:        BOX_H,
        zIndex:        300,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, BOX_CY) },
    })
    this._world.camera?.addChild(bgRect as any)
    this._dialogueBgObj = bgRect

    // ── 화자 이름 (Text)
    const speakerText = this._world.createText({
      attribute: { text: '' } as any,
      style: {
        fontSize:      18,
        fontWeight:    'bold' as any,
        color:         '#ffe066',
        zIndex:        301,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w * 0.05, h * 0.73) },
    })
    this._world.camera?.addChild(speakerText as any)
    this._speakerTextObj = speakerText

    // ── 대사 텍스트 (Text)
    const dialogueText = this._world.createText({
      attribute: { text: '' } as any,
      style: {
        fontSize:      20,
        color:         '#ffffff',
        width:         w * 0.90,
        lineHeight:    1.6 as any,
        zIndex:        301,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w * 0.05, h * 0.79) },
    })
    this._world.camera?.addChild(dialogueText as any)
    this._dialogueTextObj = dialogueText

    // ── 선택지 컨테이너 (HTML)
    const canvas  = this._option.canvas
    const parent  = canvas.parentElement ?? document.body
    const choices = document.createElement('div')
    choices.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:none',
      'flex-direction:column', 'justify-content:center', 'align-items:center',
      'gap:12px',
      'background:rgba(0,0,0,0.6)',
      'pointer-events:auto',
      'font-family:"Noto Sans KR","Malgun Gothic",sans-serif',
    ].join(';')
    parent.style.position = 'relative'
    parent.appendChild(choices)
    this._choicesEl = choices
  }

  private _showDialogue(speaker: string | undefined, text: string): void {
    if (!this._dialogueBgObj || !this._speakerTextObj || !this._dialogueTextObj) return

    // 대화창 배경 페이드인
    ; (this._dialogueBgObj as any).animate({ style: { opacity: 1 } }, 250, 'easeOut')

    // 화자 이름: transition 없이 즉시 교체 + opacity 애니메이션
    ; (this._speakerTextObj as any).attribute.text = speaker ?? ''
    ; (this._speakerTextObj as any).animate({ style: { opacity: speaker ? 1 : 0 } }, 150, 'easeOut')

    // 대사: transition(300ms)으로 부드럽게 전환
    ; (this._dialogueTextObj as any).transition(text, 300)
    ; (this._dialogueTextObj as any).animate({ style: { opacity: 1 } }, 200, 'easeOut')

    // 선택지 숨기기
    if (this._choicesEl) {
      this._choicesEl.style.display = 'none'
      this._choicesEl.innerHTML     = ''
    }
  }

  private _showChoices(choices: { text: string; next?: string; goto?: string }[]): void {
    if (!this._choicesEl) return

    // 대화창 페이드아웃
    if (this._dialogueBgObj)   (this._dialogueBgObj   as any).animate({ style: { opacity: 0 } }, 200, 'easeIn')
    if (this._speakerTextObj)  (this._speakerTextObj  as any).animate({ style: { opacity: 0 } }, 200, 'easeIn')
    if (this._dialogueTextObj) (this._dialogueTextObj as any).animate({ style: { opacity: 0 } }, 200, 'easeIn')

    this._choicesEl.style.display = 'flex'
    this._choicesEl.innerHTML     = ''
    this._inputMode               = 'choice'

    choices.forEach((choice, i) => {
      const btn = document.createElement('button')
      btn.textContent = choice.text
      btn.style.cssText = [
        'padding:12px 32px',
        'font-size:18px',
        'font-family:inherit',
        'color:#fff',
        'background:rgba(30,30,60,0.85)',
        'border:1.5px solid rgba(255,255,255,0.3)',
        'border-radius:8px',
        'cursor:pointer',
        'transition:background 0.15s,border-color 0.15s',
        'min-width:260px',
        'text-align:center',
      ].join(';')
      btn.addEventListener('mouseenter', () => {
        btn.style.background  = 'rgba(80,80,180,0.9)'
        btn.style.borderColor = 'rgba(255,255,255,0.7)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background  = 'rgba(30,30,60,0.85)'
        btn.style.borderColor = 'rgba(255,255,255,0.3)'
      })
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (this._currentScene instanceof DialogueScene) {
          const prevScene = this._currentScene
          this._currentScene.selectChoice(i)
          // 씨이 바뀌었다면 loadScene이 이미 UI를 처리함
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
    if (this._speakerTextObj)  (this._speakerTextObj  as any).animate({ style: { opacity: 0 } }, 300, 'easeIn')
    if (this._dialogueTextObj) (this._dialogueTextObj as any).animate({ style: { opacity: 0 } }, 300, 'easeIn')
    if (this._choicesEl) {
      this._choicesEl.style.display = 'none'
      this._choicesEl.innerHTML     = ''
    }
  }
}
