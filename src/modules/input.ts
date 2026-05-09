import type { Style } from 'leviar'
import type { VariablesOf } from '../types/config'
import { define } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'

// ─── InputLayout ─────────────────────────────────────────────

/**
 * input 모듈 내부 간격·배치 레이아웃.
 * `defineInitial` 또는 커맨드의 `layout` 필드로 씬/커맨드별 지정 가능.
 */
export interface InputLayout {
  /**
   * 패널 내부 좌측 패딩 (px).
   * @default 32
   */
  panelPaddingLeft?: number
  /**
   * 패널 내부 우측 패딩 (px).
   * @default 32
   */
  panelPaddingRight?: number
  /**
   * 패널 내부 상단 패딩 (px).
   * @default 24
   */
  panelPaddingTop?: number
  /**
   * 패널 내부 하단 패딩 (px).
   * @default 24
   */
  panelPaddingBottom?: number
  /**
   * 레이블과 입력 텍스트 사이 간격 (px).
   * @default 12
   */
  labelInputGap?: number
  /**
   * 입력 영역과 버튼 사이 간격 (px).
   * @default 20
   */
  inputButtonGap?: number
  /**
   * 버튼 간 가로 간격 (px).
   * @default 8
   */
  buttonGap?: number
  /**
   * 버튼 내부 좌측 패딩 (px).
   * @default 20
   */
  buttonPaddingLeft?: number
  /**
   * 버튼 내부 우측 패딩 (px).
   * @default 20
   */
  buttonPaddingRight?: number
  /**
   * 버튼 내부 상단 패딩 (px).
   * @default 8
   */
  buttonPaddingTop?: number
  /**
   * 버튼 내부 하단 패딩 (px).
   * @default 8
   */
  buttonPaddingBottom?: number
}

// ─── InputButton ─────────────────────────────────────────────

/**
 * 입력 완료 버튼 정의.
 * choice/dialogBox의 버튼 방식과 동일하게 상세 디자인 가능.
 */
export interface InputButton {
  /** 버튼에 표시될 텍스트 */
  text: string
  /**
   * true이면 취소 버튼으로 동작합니다.
   * 클릭 시 입력 내용을 변수에 저장하지 않고 커맨드를 종료합니다.
   * @default false
   */
  cancel?: boolean
  /** 버튼 배경 스타일 오버라이드 */
  style?: Partial<Style>
  /** 버튼 호버 스타일 오버라이드 */
  hoverStyle?: Partial<Style>
  /** 버튼 텍스트 스타일 오버라이드 */
  textStyle?: Partial<Style>
  /** 버튼 텍스트 호버 스타일 오버라이드 */
  textHoverStyle?: Partial<Style>
}

// ─── InputSchema ─────────────────────────────────────────────

/** inputModule이 공유하는 데이터 스키마 */
export interface InputSchema {
  /** 전체 화면 반투명 배경 오버레이 스타일 */
  overlay?: Partial<Style>
  /** 입력 패널 스타일 */
  panel?: Partial<Style>
  /** 레이블 텍스트 스타일 */
  labelStyle?: Partial<Style>
  /** 입력 텍스트(가상) 스타일 */
  inputTextStyle?: Partial<Style>
  /** 커서 스타일 */
  cursorStyle?: Partial<Style>
  /** 버튼 기본 스타일 */
  button?: Partial<Style>
  /** 버튼 호버 스타일 */
  buttonHover?: Partial<Style>
  /** 버튼 텍스트 스타일 */
  buttonText?: Partial<Style>
  /** 버튼 텍스트 호버 스타일 */
  buttonTextHover?: Partial<Style>
  /** 레이아웃 설정 */
  layout?: InputLayout

  // ─── 런타임 상태 ────────────────────────────────────────────
  /** @internal 현재 입력 값 */
  _value: string
  /** @internal 레이블 텍스트 */
  _label: string
  /** @internal 멀티라인 여부 */
  _multiline: boolean
  /** @internal 완료 버튼 목록 */
  _buttons: InputButton[]
  /** @internal 완료 콜백 (value: 입력값, buttonIndex: 클릭된 버튼 인덱스) */
  _resolve: ((value: string, buttonIndex: number) => void) | null

}

// ─── 기본값 ──────────────────────────────────────────────────

export const DEFAULT_INPUT_STYLE: Required<Pick<
  InputSchema,
  'overlay' | 'panel' | 'labelStyle' | 'inputTextStyle' | 'cursorStyle' | 'button' | 'buttonHover' | 'buttonText' | 'buttonTextHover'
>> = {
  overlay: { background: 'rgba(0,0,0,0.5)' },
  panel: {
    background: 'rgba(20,20,40,0.92)',
    borderColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderRadius: '3%',
    minWidth: 420,
  },
  labelStyle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
  },
  inputTextStyle: {
    fontSize: 22,
    color: '#ffffff',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'left',
    textShadowBlur: 0,
    textShadowColor: '#000',
    textShadowOffsetX: 1,
    textShadowOffsetY: 1,
  },
  cursorStyle: {
    background: 'rgba(255,255,255,0.85)',
  },
  button: {
    background: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderRadius: '10%',
  },
  buttonHover: {
    background: 'rgba(255,255,255,0.26)',
    borderColor: 'rgba(255,255,255,0.65)',
  },
  buttonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonTextHover: { color: '#ffffff' },
}

export const DEFAULT_INPUT_LAYOUT: Required<InputLayout> = {
  panelPaddingLeft: 32,
  panelPaddingRight: 32,
  panelPaddingTop: 24,
  panelPaddingBottom: 24,
  labelInputGap: 12,
  inputButtonGap: 20,
  buttonGap: 8,
  buttonPaddingLeft: 20,
  buttonPaddingRight: 20,
  buttonPaddingTop: 8,
  buttonPaddingBottom: 8,
}

// ─── InputCmd ─────────────────────────────────────────────────

/**
 * 텍스트 기입 입력창을 표시하고 변수에 저장합니다.
 *
 * @example
 * // 단일 줄 입력 (엔터로 완료)
 * { type: 'input', to: 'playerName', label: '이름을 입력하세요' }
 *
 * // 여러 줄 입력 + 완료 버튼
 * {
 *   type: 'input',
 *   to: 'memo',
 *   multiline: true,
 *   label: '메모를 입력하세요',
 *   buttons: [{ text: '완료' }, { text: '취소' }]
 * }
 */
export interface InputCmd<TConfig = any, _TLocalVars = any> {
  /**
   * 입력 결과를 저장할 변수 이름.
   * `_`로 시작하면 지역 변수, 그 외에는 전역 변수에 저장됩니다.
   */
  to: keyof VariablesOf<TConfig> & string | (string & {})
  /**
   * 입력창 상단에 표시할 레이블 텍스트.
   * 생략 시 레이블을 표시하지 않습니다.
   */
  label?: string
  /**
   * true이면 여러 줄 입력 가능 (textarea).
   * false(기본)이면 단일 줄 입력이며, 엔터 키로 완료됩니다.
   * @default false
   */
  multiline?: boolean
  /**
   * 입력 완료 버튼 목록.
   * 생략 시 `[{ text: '확인' }]`이 기본으로 표시됩니다.
   * multiline=false이면 엔터 키도 첫 번째 버튼과 동일한 효과입니다.
   */
  buttons?: InputButton[]

}

// ─── InputHook ────────────────────────────────────────────────

import type { SceneContext } from '../core/SceneContext'

export interface InputHook {
  'input:open': (value: { label: string; multiline: boolean }, ctx: SceneContext, vars: Record<string, any>) => { label: string; multiline: boolean }
  /**
   * 입력 완료/취소 시 방출됩니다.
   * - `cancelled: true`이면 취소 버튼이 클릭된 것입니다.
   * - cancelled인 경우 `text`는 빈 문자열이며, varName에 저장되지 않습니다.
   */
  'input:submit': (value: { varName: string; text: string; buttonIndex: number; cancelled: boolean }, ctx: SceneContext, vars: Record<string, any>) => { varName: string; text: string; buttonIndex: number; cancelled: boolean }
}

// ─── 모듈 정의 ───────────────────────────────────────────────

const inputModule = define<InputCmd<any, any>, InputSchema, InputHook>({
  overlay: DEFAULT_INPUT_STYLE.overlay,
  panel: DEFAULT_INPUT_STYLE.panel,
  labelStyle: DEFAULT_INPUT_STYLE.labelStyle,
  inputTextStyle: DEFAULT_INPUT_STYLE.inputTextStyle,
  cursorStyle: DEFAULT_INPUT_STYLE.cursorStyle,
  button: DEFAULT_INPUT_STYLE.button,
  buttonHover: DEFAULT_INPUT_STYLE.buttonHover,
  buttonText: DEFAULT_INPUT_STYLE.buttonText,
  buttonTextHover: DEFAULT_INPUT_STYLE.buttonTextHover,
  layout: DEFAULT_INPUT_LAYOUT,
  _value: '',
  _label: '',
  _multiline: false,
  _buttons: [],
  _resolve: null,
})

inputModule.defineView((ctx, data, setState) => {
  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // ─── 숨겨진 실제 input / textarea DOM 요소 ───────────────

  let _hiddenEl: HTMLInputElement | HTMLTextAreaElement | null = null
  // blur 시 재포커스 핸들러 (폴링 인터벌 대신 사용)
  let _blurHandler: (() => void) | null = null
  let _cursorBlink: ReturnType<typeof setInterval> | null = null
  let _cursorVisible = true
  let _isActive = false
  let _isComposing = false
  // 게임 엔진의 document 캡처 단계 키보드 이벤트 간섭을 차단하는 핸들러
  let _captureKeydownHandler: ((e: Event) => void) | null = null

  const _createHiddenInput = (multiline: boolean): HTMLInputElement | HTMLTextAreaElement => {
    const el = document.createElement(multiline ? 'textarea' : 'input') as HTMLInputElement | HTMLTextAreaElement
    el.style.cssText = [
      'position:fixed',
      'top:-9999px',
      'left:-9999px',
      'width:1000px', // 폭이 좁으면 브라우저가 스크롤 연산 중 커서를 0으로 튕겨내는 버그 발생
      'height:100px',
      'opacity:0',
      'z-index:-1',
      'font-size:24px', // 모바일 브라우저 줌 방지
      'background:transparent',
      'color:transparent',
      'border:none',
      'outline:none'
    ].join(';')
    // Novel 엔진이 자체 관리하는 컨테이너(Wrapper)에 추가하여
    // 전체화면 상태에서도 안전하게 포커스가 유지되도록 합니다.
    const container = (ctx as any).novel?.container ?? document.fullscreenElement ?? document.body
    container.appendChild(el)

    // VirtualKeyboard API — overlaysContent = true 설정
    const nav = navigator as any
    if (nav.virtualKeyboard) {
      nav.virtualKeyboard.overlaysContent = true
    }

    return el
  }

  const _destroyHiddenInput = () => {
    if (_hiddenEl) {
      _hiddenEl.removeEventListener('input', _onInput)
      if (_blurHandler) {
        _hiddenEl.removeEventListener('blur', _blurHandler)
        _blurHandler = null
      }
      // parentElement를 통해 제거 (전체화면 시에는 body가 아닌 다른 컨테이너에 추가되어 있음)
      _hiddenEl.parentElement?.removeChild(_hiddenEl)
      _hiddenEl = null
    }
    if (_captureKeydownHandler) {
      document.removeEventListener('keydown', _captureKeydownHandler, true)
      _captureKeydownHandler = null
    }
    if (_cursorBlink !== null) {
      clearInterval(_cursorBlink)
      _cursorBlink = null
    }
    _isActive = false
  }

  // ─── 오버레이·패널 생성 ───────────────────────────────────

  const overlayCfg = data.overlay ?? DEFAULT_INPUT_STYLE.overlay
  const overlayObj = ctx.world.createRectangle({
    style: {
      ...overlayCfg,
      width: w,
      height: h,
      zIndex: Z_INDEX.DIALOG_BOX,
      opacity: 1,
      display: 'none',
      pointerEvents: true,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(overlayObj)

  overlayObj.fadeOut(0).stop()

  const panelCfgInit = data.panel ?? DEFAULT_INPUT_STYLE.panel
  const _initMinW = (panelCfgInit.minWidth as number) ?? 420
  const _initMaxW = (panelCfgInit.maxWidth as number) ?? Infinity
  const _initW = (panelCfgInit.width as number) ?? 420
  const INIT_PANEL_W = Math.max(_initMinW, Math.min(_initW, _initMaxW))

  const panelObj = ctx.world.createRectangle({
    style: {
      ...panelCfgInit,
      width: INIT_PANEL_W,
      zIndex: Z_INDEX.DIALOG_BOX + 1,
      pointerEvents: true,
    },
    transform: { position: { x: 0, y: 0, z: 0 } },
  })
  overlayObj.addChild(panelObj)


  // ─── 동적 자식 오브젝트 목록 ─────────────────────────────

  let _dynamicObjs: any[] = []
  const _clearDynamic = () => {
    _dynamicObjs.forEach(obj => obj.remove({ child: true }))
    _dynamicObjs = []
  }

  // 현재 렌더 상태 참조
  let _currentResolve: ((value: string, buttonIndex: number) => void) | null = null
  let _textObj: any = null        // 가상 텍스트 오브젝트 (커서문자 포함)

  // 현재 표시 값을 갱신하는 헬퍼
  const _updateDisplay = () => {
    if (!_textObj) return
    const val = _hiddenEl?.value ?? ''
    _textObj.attribute.text = val + (_cursorVisible ? '|' : '') || ' '
  }

  // ─── 실시간 텍스트 동기화 ────────────────────────────────

  const _onInput = () => {
    if (!_hiddenEl) return

    // 입력 직후에도 커서가 맨 뒤가 아니라면 강제 이동 (키보드 자동완성 등)
    if (!_isComposing) {
      const len = _hiddenEl.value.length
      if (_hiddenEl.selectionStart !== len || _hiddenEl.selectionEnd !== len) {
        _hiddenEl.setSelectionRange(len, len)
      }
    }

    _updateDisplay()
  }

  const _onKeydown = (e: Event) => {
    const ke = e as KeyboardEvent
    // multiline=false: 엔터 → 인덱스 0 버튼(완료) 효과
    if (ke.key === 'Enter' && !((_hiddenEl as any)?.tagName === 'TEXTAREA') && _currentResolve) {
      e.preventDefault()
      const val = _hiddenEl?.value ?? ''
      _currentResolve(val, 0)
      return
    }

    // 글자 입력 직전 커서 맨 뒤로 강제
    // (모바일 브라우저나 가상 키보드가 임의로 커서를 맨 앞으로 보냈을 때 방어)
    if (_hiddenEl && !_isComposing) {
      const len = _hiddenEl.value.length
      if (_hiddenEl.selectionStart !== len || _hiddenEl.selectionEnd !== len) {
        _hiddenEl.setSelectionRange(len, len)
      }
    }
  }

  // ─── _render: 커맨드 실행 시 UI 구성 ─────────────────────

  const _render = (
    label: string,
    multiline: boolean,
    buttons: InputButton[],
    resolve: (value: string, buttonIndex: number) => void,
    cfg: InputSchema,
  ) => {
    _currentResolve = resolve
    _clearDynamic()

    const layoutCfg: Required<InputLayout> = { ...DEFAULT_INPUT_LAYOUT, ...(cfg.layout ?? {}) }
    const labelCfgR = cfg.labelStyle ?? DEFAULT_INPUT_STYLE.labelStyle
    const inputTxtCfg = cfg.inputTextStyle ?? DEFAULT_INPUT_STYLE.inputTextStyle
    const cursorCfg = cfg.cursorStyle ?? DEFAULT_INPUT_STYLE.cursorStyle
    const btnCfg = cfg.button ?? DEFAULT_INPUT_STYLE.button
    const btnHoverCfg = cfg.buttonHover ?? DEFAULT_INPUT_STYLE.buttonHover
    const btnTxtCfg = cfg.buttonText ?? DEFAULT_INPUT_STYLE.buttonText
    const btnTxtHoverCfg = cfg.buttonTextHover ?? DEFAULT_INPUT_STYLE.buttonTextHover

    const panelCfg = cfg.panel ?? DEFAULT_INPUT_STYLE.panel
    const _minW = (panelCfg.minWidth as number) ?? 420
    const _maxW = (panelCfg.maxWidth as number) ?? Infinity
    const _w = (panelCfg.width as number) ?? 420
    const PANEL_W = Math.max(_minW, Math.min(_w, _maxW))

    panelObj.style.width = panelCfg.width ?? PANEL_W
    if (panelCfg.minWidth !== undefined) panelObj.style.minWidth = panelCfg.minWidth
    if (panelCfg.maxWidth !== undefined) panelObj.style.maxWidth = panelCfg.maxWidth

    const PADDING_L = layoutCfg.panelPaddingLeft
    const PADDING_R = layoutCfg.panelPaddingRight
    const PADDING_T = layoutCfg.panelPaddingTop
    const PADDING_B = layoutCfg.panelPaddingBottom
    const LBL_INP_GAP = layoutCfg.labelInputGap
    const INP_BTN_GAP = layoutCfg.inputButtonGap
    const BTN_GAP = layoutCfg.buttonGap
    const BTN_PAD_Y_SUM = layoutCfg.buttonPaddingTop + layoutCfg.buttonPaddingBottom
    const BTN_PAD_X_SUM = layoutCfg.buttonPaddingLeft + layoutCfg.buttonPaddingRight
    const AVAILABLE_W = PANEL_W - PADDING_L - PADDING_R

    const LABEL_FS = (labelCfgR.fontSize as number) ?? 16
    const INPUT_FS = (inputTxtCfg.fontSize as number) ?? 22
    const BTN_FS = (btnTxtCfg.fontSize as number) ?? 15

    const LABEL_H = label ? LABEL_FS * 1.6 : 0
    const INPUT_H = multiline ? INPUT_FS * 1.5 * 4 : INPUT_FS * 1.8   // 멀티라인=4줄 높이
    const BTN_H = BTN_FS * 1.2 + BTN_PAD_Y_SUM

    // 버튼 너비 계산
    const btnWidths = buttons.map(btn => {
      const estimated = btn.text.length * BTN_FS * 0.9
      return Math.max(100, estimated + BTN_PAD_X_SUM)
    })
    const totalBtnW = btnWidths.reduce((acc, bw, i) => acc + bw + (i > 0 ? BTN_GAP : 0), 0)

    const PANEL_H = PADDING_T
      + LABEL_H
      + (label ? LBL_INP_GAP : 0)
      + INPUT_H
      + INP_BTN_GAP
      + BTN_H
      + PADDING_B

    panelObj.style.height = PANEL_H

    // panel-local 좌표: y 위=+, 아래=-, 원점=패널 중심
    let cursorY = PANEL_H / 2 - PADDING_T

    // ─── 레이블 ────────────────────────────────────────────
    if (label) {
      cursorY -= LABEL_H / 2
      const labelObj = ctx.world.createText({
        attribute: { text: label },
        style: { ...labelCfgR, width: AVAILABLE_W, zIndex: Z_INDEX.DIALOG_BOX + 2, pointerEvents: false },
        transform: { position: { x: (PADDING_L - PADDING_R) / 2, y: cursorY, z: 0 } },
      })
      panelObj.addChild(labelObj)

      _dynamicObjs.push(labelObj)
      cursorY -= LABEL_H / 2 + LBL_INP_GAP
    }

    // ─── 입력 텍스트 박스 배경 ─────────────────────────────
    cursorY -= INPUT_H / 2
    const inputBgObj = ctx.world.createRectangle({
      style: {
        width: AVAILABLE_W,
        height: INPUT_H,
        background: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.35)',
        borderWidth: 1,
        borderRadius: '2%',
        zIndex: Z_INDEX.DIALOG_BOX + 2,
        pointerEvents: true,
        cursor: 'text'
      },
      transform: { position: { x: (PADDING_L - PADDING_R) / 2, y: cursorY, z: 0 } },
    })
    // 입력 영역 클릭 시 포커스 복귀
    inputBgObj.on('click', (e: MouseEvent) => {
      if (_hiddenEl && _isActive) {
        _hiddenEl.focus({ preventScroll: true })
        const len = _hiddenEl.value.length
        _hiddenEl.setSelectionRange(len, len)
      }
    })
    panelObj.addChild(inputBgObj)

    _dynamicObjs.push(inputBgObj)

    // 가상 텍스트 오브젝트 (실시간 동기화)
    const TEXT_PAD = 10
    _textObj = ctx.world.createText({
      attribute: { text: ' ' },
      style: {
        ...inputTxtCfg,
        width: AVAILABLE_W - TEXT_PAD * 2,
        height: INPUT_H - TEXT_PAD * 2,
        zIndex: Z_INDEX.DIALOG_BOX + 3,
        pointerEvents: false,
        textAlign: 'left',
      },
      transform: {
        position: { x: -AVAILABLE_W / 2 + TEXT_PAD, y: INPUT_H / 2 - TEXT_PAD, z: 0 },
        pivot: { x: 0, y: 0 },
      },
    })
    inputBgObj.addChild(_textObj)

    _dynamicObjs.push(_textObj)

    // 커서는 _textObj 텍스트 끝에 '|'를 덧붙여 자동 추적
    // (별도 cursorObj 불필요)

    cursorY -= INPUT_H / 2 + INP_BTN_GAP

    // ─── 버튼 ─────────────────────────────────────────────
    cursorY -= BTN_H / 2
    let btnX = -totalBtnW / 2 + (PADDING_L - PADDING_R) / 2

    buttons.forEach((btn, i) => {
      const bw = btnWidths[i]
      const btnLocalX = btnX + bw / 2
      btnX += bw + BTN_GAP

      const btnStyleDef: Partial<Style> = {
        ...btnCfg,
        ...(btn.style ?? {}),
        width: bw,
        height: BTN_H,
        zIndex: Z_INDEX.DIALOG_BOX + 3,
        pointerEvents: true,
        cursor: 'pointer',
      }
      const btnHoverStyleDef: Partial<Style> = { ...btnHoverCfg, ...(btn.hoverStyle ?? {}) }
      const txtStyleDef: Partial<Style> = { ...btnTxtCfg, ...(btn.textStyle ?? {}), zIndex: Z_INDEX.DIALOG_BOX + 4, pointerEvents: false }
      const txtHoverStyleDef: Partial<Style> = { ...btnTxtHoverCfg, ...(btn.textHoverStyle ?? {}) }

      const btnObj = ctx.world.createRectangle({
        style: btnStyleDef,
        transform: { position: { x: btnLocalX, y: cursorY, z: 0 } },
      })
      const txtObj = ctx.world.createText({
        attribute: { text: btn.text },
        style: txtStyleDef,
        transform: { position: { x: 0, y: 0, z: 0 } },
      })

      const normalBtnProps = Object.fromEntries(
        Object.keys(btnHoverStyleDef).map(key => [key, (btnStyleDef as any)[key]])
      )
      const normalTxtProps = Object.fromEntries(
        Object.keys(txtHoverStyleDef).map(key => [key, (txtStyleDef as any)[key]])
      )

      btnObj.on('mouseover', () => {
        btnObj.animate({ style: btnHoverStyleDef as any }, 150)
        txtObj.animate({ style: txtHoverStyleDef as any }, 150)
      })
      btnObj.on('mouseout', () => {
        btnObj.animate({ style: normalBtnProps as any }, 150)
        txtObj.animate({ style: normalTxtProps as any }, 150)
      })
      btnObj.on('click', (e: MouseEvent) => {
        if (_currentResolve && _hiddenEl) {
          _currentResolve(_hiddenEl.value, i)
        }
      })

      btnObj.addChild(txtObj)
      panelObj.addChild(btnObj)

      _dynamicObjs.push(btnObj)
    })

    // ─── 숨겨진 input/textarea 생성 및 포커스 유지 ────────

    _destroyHiddenInput()
    _hiddenEl = _createHiddenInput(multiline)
    _hiddenEl.value = ''
    _hiddenEl.addEventListener('input', _onInput)

    // IME 한글 입력 중 커서 이동 간섭 방지
    _hiddenEl.addEventListener('compositionstart', () => { _isComposing = true })
    _hiddenEl.addEventListener('compositionend', () => { _isComposing = false })

    // 포커스 수신 시 커서 끝으로 강제 (브라우저의 자동 전체선택 방지)
    _hiddenEl.addEventListener('focus', () => {
      if (_hiddenEl && !_isComposing) {
        const len = _hiddenEl.value.length
        _hiddenEl.setSelectionRange(len, len)
        // 모바일 브라우저의 지연 덮어쓰기 대응
        setTimeout(() => {
          if (_hiddenEl && !_isComposing) {
            const len2 = _hiddenEl.value.length
            _hiddenEl.setSelectionRange(len2, len2)
          }
        }, 10)
      }
    })

    _isActive = true

    // document 캡처 단계 keydown 인터셉 차단
    // 엔진이 document/canvas에 등록한 전역 키보드 리스너가 preventDefault()를
    // 호출하면 hidden input의 Backspace 등이 작동하지 않아 차단이 필요
    _captureKeydownHandler = (e: Event) => {
      if (_isActive && document.activeElement === _hiddenEl) {
        _onKeydown(e)
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', _captureKeydownHandler, true)

    // blur 발생 시 재포커스 (인터벌 폴링 대신)
    _blurHandler = () => {
      if (!_isActive || !_hiddenEl) return
      // 약간의 지연 후 재포커스 (클릭 이벤트가 정리될 시간 확보)
      setTimeout(() => {
        if (!_isActive || !_hiddenEl) return
        if (document.activeElement !== _hiddenEl) {
          _hiddenEl.focus({ preventScroll: true })
          // focus 이벤트 리스너가 커서를 끝으로 옮겨줍니다.
        }
      }, 50)
    }
    _hiddenEl.addEventListener('blur', _blurHandler)

    // 커서 깨백임: 500ms 주기 (_textObj 텍스트에 '|' 토글)
    _cursorVisible = true
    _cursorBlink = setInterval(() => {
      _cursorVisible = !_cursorVisible
      _updateDisplay()
    }, 500)

    // 실시간 완성: 커서가 포함된 초기 텍스트 표시
    _updateDisplay()

    // 렌더링 직후 포커스 부여
    _hiddenEl.focus({ preventScroll: true })
    requestAnimationFrame(() => {
      if (_isActive && _hiddenEl && document.activeElement !== _hiddenEl) {
        _hiddenEl.focus({ preventScroll: true })
      }
    })

    overlayObj.fadeIn(250, 'easeOut')
  }

  const _hide = (duration = 250) => {
    _currentResolve = null
    _destroyHiddenInput()
    _textObj = null
    overlayObj.fadeOut(duration, 'easeIn')
  }

  return {
    show: (duration) => {
      if (_isActive) overlayObj.fadeIn(duration, 'easeOut')
    },
    hide: (duration) => {
      if (_isActive) overlayObj.fadeOut(duration, 'easeIn')
    },

    // ─── 입력 역할 선언 ─────────────────────────────────
    uiTags: ['input', 'default-ui'],
    hideTags: ['default-ui'],

    onCleanup: () => {
      _destroyHiddenInput()
      _clearDynamic()
      overlayObj.remove({ child: true })
    },

    onUpdate: (_ctx, state, _setState) => {
      if (!state._resolve || state._buttons.length === 0) return

      if (_hiddenEl) {
        // 이미 렌더링된 상태: hidden input이 살아있으므로 _render 재호출 금지
        // resolve 참조만 최신 상태로 갱신
        _currentResolve = state._resolve
      } else {
        // 처음 활성화: UI 전체 구성
        _render(state._label, state._multiline, state._buttons, state._resolve, state)
      }
    },

    // ─── 모듈 내부 전용 ─────────────────────────────────
    _render,
    _hide,
  }
})

inputModule.defineCommand(function* (cmd, ctx, _state, setState) {
  const entry = ctx.ui.get(inputModule.__key!) as any

  if (!entry) {
    console.warn('[fumika] input UI entry not found. Ensure it is defined in novel.config.ts modules.')
    return true
  }

  // 'input:open' 훅 방출
  const openData = inputModule.hooker.trigger(
    'input:open',
    { label: cmd.label ?? '', multiline: cmd.multiline ?? false },
    (v) => v,
    ctx,
    ctx.scene.getVars()
  )

  const buttons: InputButton[] = cmd.buttons?.length
    ? cmd.buttons
    : [{ text: '확인' }]

  let _resolved = false

  const resolve = (value: string, buttonIndex: number) => {
    if (_resolved) return
    _resolved = true
    entry._hide?.(200)

    const isCancelled = buttons[buttonIndex]?.cancel === true

    // 'input:submit' 훅 방출
    const submitData = inputModule.hooker.trigger(
      'input:submit',
      { varName: cmd.to as string, text: value, buttonIndex, cancelled: isCancelled },
      (v) => v,
      ctx,
      ctx.scene.getVars()
    )

    // 취소가 아닌 경우에만 변수에 저장
    if (!submitData.cancelled) {
      const finalText = submitData.text
      const finalVarName = submitData.varName
      if (finalVarName.startsWith('_')) {
        ctx.scene.setLocalVar(finalVarName, finalText)
      } else {
        ctx.scene.setGlobalVar(finalVarName, finalText)
      }
    }

    ctx.callbacks.advance()
  }

  setState({
    _label: openData.label,
    _multiline: openData.multiline,
    _buttons: buttons,
    _resolve: resolve,
    _value: '',

  })

  while (!_resolved) {
    yield false
  }

  setState({ _resolve: null, _buttons: [], _value: '', _label: '' })

  return true
})

export default inputModule
