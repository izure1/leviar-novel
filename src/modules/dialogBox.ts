import type { Style } from 'leviar'
import type { VarsOf } from '../types/config'
import { define } from '../define/defineCmdUI'

// ─── DialogBoxSchema ──────────────────────────────────────────

/**
 * dialogBoxModule이 공유하는 데이터 스키마.
 * 스타일 필드는 `defineInitial`로 씬별 커스터마이징 가능.
 */
export interface DialogBoxSchema {
  /** 전체 화면 오버레이(반투명 배경) 스타일 */
  overlay?: Partial<Style>
  /** 대화상자 패널 스타일 */
  panel?: Partial<Style> & { width?: number; minWidth?: number; maxWidth?: number; height?: number }
  /** 제목 텍스트 스타일 */
  titleStyle?: Partial<Style>
  /** 본문 텍스트 스타일 */
  contentStyle?: Partial<Style>
  /** 버튼 기본 스타일 */
  button?: Partial<Style> & { width?: number; minWidth?: number; maxWidth?: number }
  /** 버튼 호버 스타일 */
  buttonHover?: Partial<Style>
  /** 버튼 텍스트 스타일 */
  buttonText?: Partial<Style>
  /** 버튼 텍스트 호버 스타일 */
  buttonTextHover?: Partial<Style>

  // ─── 런타임 상태 ──────────────────────────────────────────
  /** 현재 표시할 제목 */
  _title: string
  /** 현재 표시할 본문 */
  _content: string
  /** 현재 버튼 목록 */
  _buttons: { text: string; var?: () => void }[]
  /** 버튼 선택 완료 시 호출되는 resolve 콜백 */
  _resolve: ((index: number) => void) | null
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_DIALOG: Required<Pick<
  DialogBoxSchema,
  'overlay' | 'panel' | 'titleStyle' | 'contentStyle' | 'button' | 'buttonHover' | 'buttonText' | 'buttonTextHover'
>> = {
  // 어두운 반투명 오버레이 — 배경을 흐리게 가림
  overlay: {
    color: 'rgba(0,0,0,0.45)',
  },
  // Glassmorphism 패널 — 밝은 반투명 + 흰색 테두리
  panel: {
    color: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderRadius: 16,
    width: 480,
    height: undefined,
  },
  titleStyle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
    textShadowBlur: 8,
    textShadowColor: 'rgba(150,200,255,0.6)',
    textShadowOffsetX: 0,
    textShadowOffsetY: 0,
  },
  contentStyle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 1.65,
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
  },
  // 버튼 — 유리 질감 반투명 흰색
  button: {
    color: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 120,
  },
  // 버튼 호버 — 더 밝고 선명한 유리
  buttonHover: {
    color: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.70)',
  },
  buttonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  buttonTextHover: {
    color: '#ffffff',
  },
}

// ─── DialogBoxCmd 타입 ────────────────────────────────────────

/**
 * 커스텀 버튼 대화상자를 표시합니다.
 *
 * @example
 * ```ts
 * // alert
 * { type: 'dialogBox', title: '알림', content: '저장되었습니다.', buttons: [{ text: '확인' }] }
 *
 * // confirm (var 콜백으로 분기)
 * {
 *   type: 'dialogBox',
 *   title: '확인',
 *   content: '정말 포기하시겠습니까?',
 *   buttons: [
 *     { text: '예', var: () => ({ giveUp: true }) },
 *     { text: '아니오' },
 *   ]
 * }
 * ```
 */
export interface DialogBoxCmd<TConfig = any> {
  /** 대화상자 제목 */
  title: string
  /** 대화상자 본문 내용 */
  content: string
  /**
   * 버튼 목록. 1개 이상 필수.
   * - `text`: 버튼 레이블
   * - `var`: 버튼 클릭 시 설정할 전역 변수를 반환하는 콜백 (선택)
   */
  buttons: {
    /** 버튼에 표시될 텍스트 */
    text: string
    /**
     * 버튼 클릭 시 적용할 전역 변수 변경.
     * 반환값의 각 키-값 쌍이 `ctx.scene.setGlobalVar`로 적용됩니다.
     */
    var?: () => Partial<VarsOf<TConfig>>
  }[]
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 대화상자 모듈.
 * `novel.config`의 `modules: { 'dialogBox': dialogBoxModule }` 형태로 등록합니다.
 *
 * @example
 * ```ts
 * // novel.config.ts
 * modules: { 'dialogBox': dialogBoxModule }
 *
 * // 씬에서 사용
 * { type: 'dialogBox', title: '알림', content: '진행하시겠습니까?', buttons: [{ text: '확인' }] }
 *
 * // defineInitial로 스타일 커스터마이징
 * defineScene({ config, initial: { dialogBox: { panel: { color: 'rgba(40,10,10,0.95)' } } } }, [...])
 * ```
 */
const dialogBoxModule = define<DialogBoxCmd<any>, DialogBoxSchema>({
  overlay: undefined,
  panel: undefined,
  titleStyle: undefined,
  contentStyle: undefined,
  button: undefined,
  buttonHover: undefined,
  buttonText: undefined,
  buttonTextHover: undefined,
  _title: '',
  _content: '',
  _buttons: [],
  _resolve: null,
})

dialogBoxModule.defineView((data, ctx) => {
  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // ─── 스타일 병합 헬퍼 ──────────────────────────────────────
  const mergeStyle = <T extends object>(def: T, override?: Partial<T>): T =>
    ({ ...def, ...(override ?? {}) } as T)

  // ─── 오버레이 (클릭 차단) ──────────────────────────────────
  const overlayCfg = mergeStyle(DEFAULT_DIALOG.overlay, data.overlay)
  const overlayObj = ctx.world.createRectangle({
    style: {
      ...overlayCfg,
      width: w,
      height: h,
      zIndex: 600,
      opacity: 0,
      display: 'none',
      pointerEvents: true,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(overlayObj)
  ctx.renderer.track(overlayObj)

  // ─── 패널 ─────────────────────────────────────────────────
  const panelCfg = mergeStyle(DEFAULT_DIALOG.panel, data.panel)
  // width → minWidth/maxWidth 순서로 clamp
  const PANEL_W = Math.min(
    panelCfg.maxWidth ?? Infinity,
    Math.max(panelCfg.minWidth ?? 0, panelCfg.width ?? 480)
  )

  // 패널은 높이를 동적 계산하므로 초기에는 더미 높이로 생성
  const panelObj = ctx.world.createRectangle({
    style: {
      ...panelCfg,
      width: PANEL_W,
      height: panelCfg.height ?? 200,
      zIndex: 601,
      opacity: 0,
      display: 'none',
      pointerEvents: false,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(panelObj)
  ctx.renderer.track(panelObj)

  // ─── 제목 텍스트 ──────────────────────────────────────────
  const titleCfg = mergeStyle(DEFAULT_DIALOG.titleStyle, data.titleStyle)
  const titleObj = ctx.world.createText({
    attribute: { text: '' },
    style: {
      ...titleCfg,
      width: PANEL_W - 48,
      zIndex: 602,
      opacity: 0,
      display: 'none',
      pointerEvents: false,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(titleObj)
  ctx.renderer.track(titleObj)

  // ─── 본문 텍스트 ──────────────────────────────────────────
  const contentCfg = mergeStyle(DEFAULT_DIALOG.contentStyle, data.contentStyle)
  const contentObj = ctx.world.createText({
    attribute: { text: '' },
    style: {
      ...contentCfg,
      width: PANEL_W - 48,
      zIndex: 602,
      opacity: 0,
      display: 'none',
      pointerEvents: false,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(contentObj)
  ctx.renderer.track(contentObj)

  // ─── 버튼 목록 (동적 생성) ────────────────────────────────
  let _btnObjs: { btn: any; txt: any }[] = []

  const _clearButtons = () => {
    _btnObjs.forEach(({ btn, txt }) => {
      txt.remove({ child: true })
      btn.remove({ child: true })
    })
    _btnObjs = []
  }

  // ─── 레이아웃 계산 & 렌더 ─────────────────────────────────
  const _render = (
    title: string,
    content: string,
    buttons: { text: string; var?: () => void }[],
    resolve: (i: number) => void,
    cfg: DialogBoxSchema,
  ) => {
    const btnCfg = mergeStyle(DEFAULT_DIALOG.button, cfg.button)
    const btnHoverCfg = mergeStyle(DEFAULT_DIALOG.buttonHover, cfg.buttonHover)
    const btnTxtCfg = mergeStyle(DEFAULT_DIALOG.buttonText, cfg.buttonText)
    const btnTxtHoverCfg = mergeStyle(DEFAULT_DIALOG.buttonTextHover, cfg.buttonTextHover)
    const titleCfgR = mergeStyle(DEFAULT_DIALOG.titleStyle, cfg.titleStyle)
    const contentCfgR = mergeStyle(DEFAULT_DIALOG.contentStyle, cfg.contentStyle)

    const titleFontSize = (titleCfgR.fontSize as number) ?? 22
    const contentFontSize = (contentCfgR.fontSize as number) ?? 18
    const btnFontSize = (btnTxtCfg.fontSize as number) ?? 16

    // 높이 계산
    const PADDING = 28
    const TITLE_H = title ? titleFontSize * 1.6 : 0
    const CONTENT_H = content ? contentFontSize * 2.4 : 0
    const BTN_H = btnFontSize * 1.5 + 20
    const BTN_GAP = 10
    const TOTAL_BTN_H = buttons.length * BTN_H + Math.max(0, buttons.length - 1) * BTN_GAP
    const PANEL_H = PADDING + TITLE_H + (title && content ? 12 : 0) + CONTENT_H + 20 + TOTAL_BTN_H + PADDING

    // 패널 높이 업데이트 + 위치 이동 (position은 read-only이므로 animate 사용)
    panelObj.style.height = PANEL_H
    panelObj.animate({ transform: { position: toLocal(w / 2, h / 2) } }, 0)

    // 제목 위치: 패널 상단 기준
    const titleCanvasY = h / 2 - PANEL_H / 2 + PADDING + TITLE_H / 2
    titleObj.attribute.text = title
    titleObj.animate({ transform: { position: toLocal(w / 2, titleCanvasY) } }, 0)

    // 본문 위치: 제목 아래
    const contentCanvasY = titleCanvasY + TITLE_H / 2 + 12 + CONTENT_H / 2
    contentObj.attribute.text = content
    contentObj.animate({ transform: { position: toLocal(w / 2, contentCanvasY) } }, 0)

    // 버튼들 위치: 본문 아래
    const btnStartY = h / 2 - PANEL_H / 2 + PADDING + TITLE_H + (title && content ? 12 : 0) + CONTENT_H + 20 + BTN_H / 2

    _clearButtons()

    buttons.forEach((buttonDef, i) => {
      const btnCanvasY = btnStartY + i * (BTN_H + BTN_GAP)
      const estimatedW = buttonDef.text.length * btnFontSize * 0.8
      // width 고정 → 없으면 auto 계산 후 minWidth/maxWidth clamp
      const btnW = btnCfg.width
        ? btnCfg.width
        : Math.min(
            (btnCfg.maxWidth as number) ?? Infinity,
            Math.max((btnCfg.minWidth as number) ?? 120, estimatedW + 48)
          )

      const btnStyle: Partial<Style> = {
        ...btnCfg,
        width: btnW,
        height: BTN_H,
        zIndex: 603,
        pointerEvents: true,
      }

      const btnObj = ctx.world.createRectangle({
        style: btnStyle,
        transform: { position: toLocal(w / 2, btnCanvasY) },
      })

      const txtStyle: Partial<Style> = {
        ...btnTxtCfg,
        zIndex: 604,
        pointerEvents: false,
      }

      const txtObj = ctx.world.createText({
        attribute: { text: buttonDef.text },
        style: txtStyle,
        transform: { position: { x: 0, y: 0, z: 0 } },
      })

      // 호버
      const normalBtnProps = { color: btnStyle.color, borderColor: btnStyle.borderColor }
      const normalTxtProps = { color: txtStyle.color }

      btnObj.on('mouseover', () => {
        btnObj.animate({ style: btnHoverCfg as any }, 150)
        txtObj.animate({ style: btnTxtHoverCfg as any }, 150)
      })
      btnObj.on('mouseout', () => {
        btnObj.animate({ style: normalBtnProps as any }, 150)
        txtObj.animate({ style: normalTxtProps as any }, 150)
      })
      btnObj.on('click', () => {
        resolve(i)
      })

      btnObj.addChild(txtObj)
      ctx.world.camera?.addChild(btnObj)
      ctx.renderer.track(btnObj)
      ctx.renderer.track(txtObj)
      _btnObjs.push({ btn: btnObj, txt: txtObj })
    })

    // 페이드인
    overlayObj.fadeIn(200, 'easeOut')
    panelObj.fadeIn(200, 'easeOut')
    titleObj.fadeIn(200, 'easeOut')
    contentObj.fadeIn(200, 'easeOut')
    _btnObjs.forEach(({ btn }) => btn.fadeIn(200, 'easeOut'))
  }

  const _hide = () => {
    overlayObj.fadeOut(200, 'easeIn')
    panelObj.fadeOut(200, 'easeIn')
    titleObj.fadeOut(200, 'easeIn')
    contentObj.fadeOut(200, 'easeIn')
    _clearButtons()
  }

  return {
    show: () => { overlayObj.fadeIn(200, 'easeOut') },
    hide: _hide,
    /**
     * setState를 통해 `_resolve`가 설정되면 엔진이 update()를 호출합니다.
     * resolve가 있는 경우 대화상자를 렌더링합니다.
     */
    update: (d: DialogBoxSchema) => {
      if (d._resolve && d._buttons.length > 0) {
        _render(d._title, d._content, d._buttons, d._resolve, d)
      }
    },
  }
})

dialogBoxModule.defineCommand(function* (cmd, ctx, _state, setState) {
  const entry = ctx.ui.get('dialogBox')

  if (!entry) {
    console.warn('[leviar-novel] dialogBox UI entry not found. Ensure it is defined in novel.config.ts modules.')
    return true
  }

  // 대화창 숨김
  ctx.ui.get('dialogue')?.hide?.()

  let _selectedIndex = -1
  let _resolved = false

  const resolve = (i: number) => {
    if (_resolved) return
    _resolved = true
    _selectedIndex = i
    // 선택 후 즉시 숨기기
    entry.hide?.()
    // var 처리
    const selected = cmd.buttons[i]
    if (selected?.var) {
      const vars = selected.var()
      if (vars) {
        for (const [key, value] of Object.entries(vars)) {
          ctx.scene.setGlobalVar(key, value)
        }
      }
    }
  }

  setState({
    _title: cmd.title,
    _content: cmd.content,
    _buttons: cmd.buttons.map(b => ({ text: b.text, var: b.var as (() => void) | undefined })),
    _resolve: resolve,
  })

  // 버튼 클릭까지 블록킹
  yield 'handled'

  // 클릭 후 상태 초기화
  setState({ _resolve: null, _buttons: [], _title: '', _content: '' })

  return true
})

export default dialogBoxModule
