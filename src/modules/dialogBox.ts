import type { Style } from 'leviar'
import type { VarResolvable } from '../types/utils'
import { resolveVarResolvable } from '../types/utils'
import { define } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'

// ─── DialogBoxSchema ──────────────────────────────────────────

/**
 * 대화상자 내부 간격 레이아웃 설정.
 * `defineInitial` 또는 커맨드의 `layout` 필드로 씬/커맨드별 지정 가능.
 */
export interface DialogBoxLayout {
  /**
   * 패널 내부 좌우(수평) 패딩 (px).
   * title/content/button 영역의 좌우 여백 및 버튼 가용 너비(PANEL_W - paddingX*2)에 사용.
   * @default 28
   */
  paddingX?: number
  /**
   * 패널 내부 상하(수직) 패딩 (px).
   * 패널 총 높이 = paddingY + 콘텐츠 + paddingY로 계산.
   * @default 28
   */
  paddingY?: number
  /**
   * title과 content 사이 간격 (px). title/content 모두 있을 때만 적용.
   * @default 12
   */
  titleContentGap?: number
  /**
   * content 영역과 버튼 영역 사이 간격 (px).
   * @default 30
   */
  contentButtonGap?: number
  /**
   * 버튼 행 간 세로 간격 (px).
   * @default 10
   */
  buttonRowGap?: number
  /**
   * 같은 행 버튼 간 가로 간격 (px).
   * @default 8
   */
  buttonColumnGap?: number
  /**
   * 버튼 내부 좌우 패딩 합산 (px). 버튼 너비 추정 시 사용.
   * (estimatedTextWidth + buttonPaddingX)로 자동 계산되며, `button.width`를 직접 지정하면 무시.
   * @default 48
   */
  buttonPaddingX?: number
  /**
   * 버튼 내부 상하 패딩 합산 (px). 버튼 높이 계산 시 사용.
   * (btnFontSize * 1.2 + buttonPaddingY)
   * @default 20
   */
  buttonPaddingY?: number
}

/**
 * dialogBoxModule이 공유하는 데이터 스키마.
 * 스타일 필드는 `defineInitial`로 씬별 커스터마이징 가능.
 */
export interface DialogBoxSchema {
  /** 전체 화면 오버레이(반투명 배경) 스타일 */
  overlay?: Partial<Style>
  /** 대화상자 패널 스타일 */
  panel?: Partial<Style>
  /** 제목 텍스트 스타일 */
  titleStyle?: Partial<Style>
  /** 본문 텍스트 스타일 */
  contentStyle?: Partial<Style>
  /** 버튼 기본 스타일 */
  button?: Partial<Style>
  /** 버튼 호버 스타일 */
  buttonHover?: Partial<Style>
  /** 버튼 텍스트 스타일 */
  buttonText?: Partial<Style>
  /** 버튼 텍스트 호버 스타일 */
  buttonTextHover?: Partial<Style>
  /** 내부 간격 레이아웃. `defineInitial`로 씬 전체에 적용 가능 */
  layout?: DialogBoxLayout

  // ─── 런타임 상태 ────────────────────────────────────────────
  _title: string
  _content: string
  _buttons: { text: string }[]
  _resolve: ((index: number) => void) | null
  _duration: number
  _persist: boolean
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_DIALOG: Required<Pick<
  DialogBoxSchema,
  'overlay' | 'panel' | 'titleStyle' | 'contentStyle' | 'button' | 'buttonHover' | 'buttonText' | 'buttonTextHover'
>> = {
  overlay: { color: 'rgba(0,0,0,0.45)' },
  panel: {
    color: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderRadius: '4%',
    minWidth: 480,
    height: undefined,
  },
  titleStyle: {
    fontSize: 24,
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
    fontSize: 16,
    color: 'rgba(255,255,255,0.66)',
    lineHeight: 1.5,
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
    textShadowBlur: 0,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffsetX: 2,
    textShadowOffsetY: 2,
  },
  button: {
    color: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.30)',
    borderWidth: 1,
    borderRadius: '10%',
    minWidth: 120,
  },
  buttonHover: {
    color: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.70)',
  },
  buttonText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    textAlign: 'center',
    fontWeight: 'bold',
    textShadowBlur: 0,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffsetX: 2,
    textShadowOffsetY: 2,
  },
  buttonTextHover: { color: '#ffffff' },
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
 * // overlay 클릭으로 닫히지 않게
 * { type: 'dialogBox', title: '선택', content: '반드시 선택하세요.', persist: true, buttons: [...] }
 *
 * // 등장 시간 커스텀
 * { type: 'dialogBox', title: '..', duration: 500, buttons: [...] }
 * ```
 */
export interface DialogBoxCmd<TConfig = any, TLocalVars = Record<never, never>> {
  /** 대화상자 제목 */
  title: string
  /** 대화상자 본문 내용 */
  content: string
  /**
   * 등장/퇴장 fadeIn/fadeOut 시간(ms). 기본값 200.
   */
  duration?: number
  /**
   * true이면 오버레이 클릭으로 닫히지 않음.
   * false(기본)이면 오버레이 클릭 시 -1 인덱스로 resolve되고 닫힘.
   */
  persist?: boolean
  /**
   * 버튼 목록. 1개 이상 필수.
   * - `text`: 버튼 레이블
   * - `var`: 버튼 클릭 시 설정할 전역 변수를 반환하는 콜백 (선택)
   */
  buttons: {
    text: string
    var?: VarResolvable<TConfig, TLocalVars>
  }[]
}

// ─── DialogBoxHook 타입 ────────────────────────────────────────

export type ResolvedDialogBoxButton = DialogBoxCmd<any, any>['buttons'][number]

export interface DialogBoxHook {
  'dialogBox:show': (value: DialogBoxCmd<any, any>) => DialogBoxCmd<any, any>
  'dialogBox:select': (value: { index: number, selected?: ResolvedDialogBoxButton }) => { index: number, selected?: ResolvedDialogBoxButton }
}

// ─── 모듈 정의 ───────────────────────────────────────────────

// ─── 레이아웃 기본값 ─────────────────────────────────────────

const DEFAULT_LAYOUT: Required<DialogBoxLayout> = {
  paddingX: 28,
  paddingY: 28,
  titleContentGap: 12,
  contentButtonGap: 30,
  buttonRowGap: 10,
  buttonColumnGap: 8,
  buttonPaddingX: 48,
  buttonPaddingY: 20,
}

const dialogBoxModule = define<DialogBoxCmd<any, any>, DialogBoxSchema, DialogBoxHook>({
  overlay: undefined,
  panel: undefined,
  titleStyle: undefined,
  contentStyle: undefined,
  button: undefined,
  buttonHover: undefined,
  buttonText: undefined,
  buttonTextHover: undefined,
  layout: undefined,
  _title: '',
  _content: '',
  _buttons: [],
  _resolve: null,
  _duration: 200,
  _persist: false,
})

dialogBoxModule.defineView((data, ctx) => {
  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  const mergeStyle = <T extends object>(def: T, override?: Partial<T>): T =>
  ({ ...def, ...(override ?? {}) } as T)

  // ─── overlayObj: camera 직접 자식 ─────────────────────────
  // display:'none' → cascade로 자손 전체 숨김 (v1.0.6+)
  // fadeIn/fadeOut 하나로 전체 제어
  const overlayCfg = data.overlay ?? DEFAULT_DIALOG.overlay
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
  ctx.renderer.track(overlayObj)
  // __fadeOpacity 초기값=1이므로 첫 fadeIn이 1→1로 동작 안 함.
  // fadeOut(0).stop()으로 즉시 __fadeOpacity=0, display=none 초기화
  overlayObj.fadeOut(0).stop()

  // ─── panelObj: overlayObj 자식 ────────────────────────────
  const panelCfgInit = data.panel ?? DEFAULT_DIALOG.panel
  // 초기 PANEL_W: _render 시 갱신되므로 임시값으로 초기화
  const _initMinW = (panelCfgInit.minWidth as number) ?? 400
  const _initMaxW = (panelCfgInit.maxWidth as number) ?? Infinity
  const _initW = (panelCfgInit.width as number) ?? 480
  const INIT_PANEL_W = Math.max(_initMinW, Math.min(_initW, _initMaxW))

  const panelObj = ctx.world.createRectangle({
    style: {
      ...panelCfgInit,
      width: INIT_PANEL_W,
      height: 10,
      zIndex: Z_INDEX.DIALOG_BOX + 1,
      pointerEvents: true,
    },
    transform: { position: { x: 0, y: 0, z: 0 } },
  })
  overlayObj.addChild(panelObj)
  ctx.renderer.track(panelObj)

  // panel 클릭 시 overlay로 이벤트가 전파되지 않도록 차단
  panelObj.on('click', () => { /* stop propagation */ })

  // ─── 동적 자식 (매 _render마다 panelObj 자식으로 새로 생성) ─
  // - animate() 없이 생성 위치 = 최종 위치 → fadeIn 충돌 없음
  // - overlay cascade로 자동 숨김/표시
  let _dynamicObjs: any[] = []

  const _clearDynamic = () => {
    _dynamicObjs.forEach(obj => obj.remove({ child: true }))
    _dynamicObjs = []
  }

  // ─── overlay 클릭 핸들러 (persist 제어) ────────────────
  // _render마다 갱신되는 현재 resolve/persist 참조
  let _currentResolve: ((i: number) => void) | null = null
  let _currentPersist = false
  let _currentPanelW = INIT_PANEL_W
  let _currentPanelH = 0

  overlayObj.on('click', (e: any) => {
    if (!_currentPersist && _currentResolve) {
      // panel 영역 클릭이면 dismiss 차단
      // canvas 중앙기준 마우스 좌표 vs panel 반폭관 비교
      const canvasRect = (ctx.renderer as any)._world?._canvas?.getBoundingClientRect?.() ||
      { left: 0, top: 0, width: w, height: h }
      const mouseX = e.clientX - canvasRect.left - canvasRect.width / 2
      const mouseY = e.clientY - canvasRect.top - canvasRect.height / 2
      const inPanel = Math.abs(mouseX) <= _currentPanelW / 2 && Math.abs(mouseY) <= _currentPanelH / 2
      if (inPanel) return
      _currentResolve(-1)
    }
  })

  // ─── 레이아웃 계산 & 렌더 ─────────────────────────────────
  // panel-local 좌표: y축 위=+, 아래=-, 중심={0,0}
  const _render = (
    title: string,
    content: string,
    buttons: { text: string }[],
    resolve: (i: number) => void,
    duration: number,
    persist: boolean,
    cfg: DialogBoxSchema,
  ) => {
    _currentResolve = resolve
    _currentPersist = persist

    const btnCfg = cfg.button ?? DEFAULT_DIALOG.button
    const btnHoverCfg = cfg.buttonHover ?? DEFAULT_DIALOG.buttonHover
    const btnTxtCfg = cfg.buttonText ?? DEFAULT_DIALOG.buttonText
    const btnTxtHoverCfg = cfg.buttonTextHover ?? DEFAULT_DIALOG.buttonTextHover
    const titleCfgR = cfg.titleStyle ?? DEFAULT_DIALOG.titleStyle
    const contentCfgR = cfg.contentStyle ?? DEFAULT_DIALOG.contentStyle

    // ─── 패널 너비: _render마다 cfg 기반으로 재계산 ─────────
    const panelCfg = cfg.panel ?? DEFAULT_DIALOG.panel
    const _minW = (panelCfg.minWidth as number) ?? 400
    const _maxW = (panelCfg.maxWidth as number) ?? Infinity
    const _w = (panelCfg.width as number) ?? 480
    const PANEL_W = Math.max(_minW, Math.min(_w, _maxW))
    panelObj.style.width = panelCfg.width ?? PANEL_W
    if (panelCfg.minWidth !== undefined) panelObj.style.minWidth = panelCfg.minWidth
    if (panelCfg.maxWidth !== undefined) panelObj.style.maxWidth = panelCfg.maxWidth
    if (panelCfg.height !== undefined) panelObj.style.height = panelCfg.height
    _currentPanelW = PANEL_W

    const titleFontSize = (titleCfgR.fontSize as number) ?? 22
    const contentFontSize = (contentCfgR.fontSize as number) ?? 18
    const btnFontSize = (btnTxtCfg.fontSize as number) ?? 16

    // ─── 레이아웃 간격 (schema.layout > DEFAULT_LAYOUT) ─────
    const layoutCfg: Required<DialogBoxLayout> = { ...DEFAULT_LAYOUT, ...(cfg.layout ?? {}) }
    const PADDING_X = layoutCfg.paddingX
    const PADDING_Y = layoutCfg.paddingY
    const BTN_H_GAP = layoutCfg.buttonColumnGap
    const GAP = title && content ? layoutCfg.titleContentGap : 0
    const CONTENT_BTN_GAP = layoutCfg.contentButtonGap
    const TITLE_H = title ? titleFontSize * 1.6 : 0
    const CONTENT_H = content ? contentFontSize * 2.4 : 0
    const BTN_H = btnFontSize * 1.2 + layoutCfg.buttonPaddingY
    const BTN_ROW_GAP = layoutCfg.buttonRowGap
    const AVAILABLE_W = PANEL_W - PADDING_X * 2

    // ─── 버튼 너비 계산 ───────────────────────────────────────
    const btnWidths = buttons.map(buttonDef => {
      const estimatedW = buttonDef.text.length * btnFontSize * 0.8
      const rawW = (btnCfg.width as number) ?? (estimatedW + layoutCfg.buttonPaddingX)
      const minW = (btnCfg.minWidth as number) ?? 100
      const maxW = (btnCfg.maxWidth as number) ?? 400
      return Math.max(minW, Math.min(rawW, maxW))
    })

    // ─── greedy 행 분배 ───────────────────────────────────────
    // 버튼 너비 합 + BTN_H_GAP이 AVAILABLE_W 초과 시 다음 행
    type BtnRow = { indices: number[]; totalWidth: number }
    const rows: BtnRow[] = []
    let currentRow: BtnRow = { indices: [], totalWidth: 0 }

    buttons.forEach((_, i) => {
      const bw = btnWidths[i]
      const needed = currentRow.indices.length > 0
        ? currentRow.totalWidth + BTN_H_GAP + bw
        : bw
      if (needed <= AVAILABLE_W || currentRow.indices.length === 0) {
        currentRow.indices.push(i)
        currentRow.totalWidth = needed
      } else {
        rows.push(currentRow)
        currentRow = { indices: [i], totalWidth: bw }
      }
    })
    if (currentRow.indices.length > 0) rows.push(currentRow)

    const TOTAL_BTN_H = rows.length * BTN_H + Math.max(0, rows.length - 1) * BTN_ROW_GAP
    const PANEL_H = PADDING_Y + TITLE_H + GAP + CONTENT_H + CONTENT_BTN_GAP + TOTAL_BTN_H + PADDING_Y

    panelObj.style.height = PANEL_H
    _currentPanelH = PANEL_H

    _clearDynamic()

    // title (panel-local, 위=+)
    const titleLocalY = PANEL_H / 2 - PADDING_Y - TITLE_H / 2
    const titleObj = ctx.world.createText({
      attribute: { text: title },
      style: { ...titleCfgR, width: PANEL_W - PADDING_X * 2, zIndex: 602, pointerEvents: false },
      transform: { position: { x: 0, y: titleLocalY, z: 0 } },
    })
    panelObj.addChild(titleObj)
    ctx.renderer.track(titleObj)
    _dynamicObjs.push(titleObj)

    // content
    const contentLocalY = PANEL_H / 2 - PADDING_Y - TITLE_H - GAP - CONTENT_H / 2
    const contentObj = ctx.world.createText({
      attribute: { text: content },
      style: { ...contentCfgR, width: PANEL_W - PADDING_X * 2, zIndex: 602, pointerEvents: false },
      transform: { position: { x: 0, y: contentLocalY, z: 0 } },
    })
    panelObj.addChild(contentObj)
    ctx.renderer.track(contentObj)
    _dynamicObjs.push(contentObj)

    // ─── 버튼 배치 ────────────────────────────────────────────
    // 행 시작 y: content 아래 30px + BTN_H/2 (첫 행 center)
    const btnBaseLocalY = PANEL_H / 2 - PADDING_Y - TITLE_H - GAP - CONTENT_H - CONTENT_BTN_GAP - BTN_H / 2

    rows.forEach((row, rowIdx) => {
      const rowLocalY = btnBaseLocalY - rowIdx * (BTN_H + BTN_ROW_GAP)
      // 행을 패널 중앙 정렬: 시작 x = -totalWidth/2
      let xOffset = -row.totalWidth / 2

      row.indices.forEach(i => {
        const bw = btnWidths[i]
        const btnLocalX = xOffset + bw / 2
        xOffset += bw + BTN_H_GAP

        const btnStyle: Partial<Style> = {
          ...btnCfg,
          width: bw,
          height: BTN_H,
          zIndex: 603,
          pointerEvents: true,
        }

        const btnObj = ctx.world.createRectangle({
          style: btnStyle,
          transform: { position: { x: btnLocalX, y: rowLocalY, z: 0 } },
        })

        const txtObj = ctx.world.createText({
          attribute: { text: buttons[i].text },
          style: { ...btnTxtCfg, zIndex: 604, pointerEvents: false },
          transform: { position: { x: 0, y: 0, z: 0 } },
        })

        // hover에서 변경한 키만 원본값으로 복원
        const normalBtnProps = Object.fromEntries(
          Object.keys(btnHoverCfg).map(key => [key, (btnStyle as any)[key]])
        )
        const normalTxtProps = Object.fromEntries(
          Object.keys(btnTxtHoverCfg).map(key => [key, (btnTxtCfg as any)[key]])
        )

        btnObj.on('mouseover', () => {
          btnObj.animate({ style: btnHoverCfg as any }, 150)
          txtObj.animate({ style: btnTxtHoverCfg as any }, 150)
        })
        btnObj.on('mouseout', () => {
          btnObj.animate({ style: normalBtnProps as any }, 150)
          txtObj.animate({ style: normalTxtProps as any }, 150)
        })
        btnObj.on('click', () => { resolve(i) })

        btnObj.addChild(txtObj)
        panelObj.addChild(btnObj)
        ctx.renderer.track(btnObj)
        ctx.renderer.track(txtObj)
        _dynamicObjs.push(btnObj)
      })
    })

    // overlayObj.fadeIn 하나로 전체 표시 (cascade)
    overlayObj.fadeIn(duration, 'easeOut')
  }


  const _hide = (duration: number) => {
    _currentResolve = null
    overlayObj.fadeOut(duration, 'easeIn')
    // _clearDynamic은 다음 _render 시작 시 처리
  }

  return {
    show: (duration = 200) => { overlayObj.fadeIn(duration, 'easeOut') },
    hide: (duration = 200) => { _hide(duration) },

    // ─── 입력 역할 선언 ────────────────────────────────
    hideGroups: ['dialogue'],

    onUpdate: (d: DialogBoxSchema) => {
      if (d._resolve && d._buttons.length > 0) {
        _render(d._title, d._content, d._buttons, d._resolve, d._duration, d._persist, d)
      }
    },
  }
})

dialogBoxModule.defineCommand(function* (cmd, ctx, _state, setState) {
  const entry = ctx.ui.get(dialogBoxModule.__key!)

  if (!entry) {
    console.warn('[fumika] dialogBox UI entry not found. Ensure it is defined in novel.config.ts modules.')
    return true
  }

  // 대화창 숨김 — suppressRoles를 통해 onSuppress() 이벤트로 자동 처리됨

  // 'dialogBox:show' 훅 방출
  const finalCmd = dialogBoxModule.hooker.trigger('dialogBox:show', cmd, (value) => value)

  const duration = finalCmd.duration ?? 200
  const persist = finalCmd.buttons.length > 0 ? true : (finalCmd.persist ?? false)

  let _resolved = false

  const resolve = (i: number) => {
    if (_resolved) return
    _resolved = true
    entry.hide?.(duration)

    const selectedObj = i >= 0 ? finalCmd.buttons[i] : undefined

    // 'dialogBox:select' 훅 방출
    const selectData = dialogBoxModule.hooker.trigger(
      'dialogBox:select',
      { index: i, selected: selectedObj },
      (value) => value
    )

    const finalSelected = selectData.selected

    if (finalSelected?.var) {
      const vars = resolveVarResolvable(finalSelected.var, ctx.scene.getVars())
      if (vars) {
        for (const [key, value] of Object.entries(vars)) {
          if (key.startsWith('_')) {
            ctx.scene.setLocalVar(key, value)
          } else {
            ctx.scene.setGlobalVar(key, value)
          }
        }
      }
    }
    ctx.callbacks.advance()
  }

  // command 시작 즉시 blocking (애니메이션 중에도 novel.next 차단)
  setState({
    _title: finalCmd.title,
    _content: finalCmd.content,
    _buttons: finalCmd.buttons.map(b => ({ text: b.text })),
    _resolve: resolve,
    _duration: duration,
    _persist: persist,
  })

  while (_resolved === false) {
    yield false
  }

  setState({ _resolve: null, _buttons: [], _title: '', _content: '' })

  return true
})

export default dialogBoxModule
