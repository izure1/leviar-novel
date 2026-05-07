import type { Style } from 'leviar'
import type { Resolvable } from '../define/defineCmd'
import type { SceneNextTarget, VariablesOf } from '../types/config'
import type { VarResolvable } from '../types/utils'
import { resolveVarResolvable } from '../types/utils'
import { define } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'

// ─── 선택지 UI 스타일 + 런타임 상태 스키마 ────────────────────

/**
 * 선택지 UI 내부 간격 레이아웃 설정.
 * `defineInitial` 또는 커맨드의 `layout` 필드로 씬/커맨드별 지정 가능.
 */
export interface ChoiceLayout {
  /**
   * 선택지 버튼 간 세로 간격(px).
   * @default 12
   */
  gap?: number
  /**
   * 버튼 내부 좌측 패딩(px).
   * @default 32
   */
  buttonPaddingLeft?: number
  /**
   * 버튼 내부 우측 패딩(px).
   * @default 32
   */
  buttonPaddingRight?: number
  /**
   * 버튼 내부 상단 패딩(px).
   * @default 12
   */
  buttonPaddingTop?: number
  /**
   * 버튼 내부 하단 패딩(px).
   * @default 12
   */
  buttonPaddingBottom?: number
}

/** choiceModule이 공유하는 데이터 스키마 */
export interface ChoiceSchema {
  /** 선택지 전체 배경(컨테이너) 스타일 */
  bg?: Partial<Style>
  /** 선택지 버튼(배경) 스타일 */
  button?: Partial<Style>
  /** 선택지 버튼 호버 스타일 */
  buttonHover?: Partial<Style>
  /** 선택지 텍스트 스타일 */
  text?: Partial<Style>
  /** 선택지 텍스트 호버 스타일 */
  textHover?: Partial<Style>
  /** 내부 간격 레이아웃. `defineInitial`로 씬 전체에 적용 가능 */
  layout?: ChoiceLayout
  /** @internal 커스텀 UI 태그 */
  _uiTags?: string[]
  /** @internal 커스텀 UI 숨김 태그 */
  _hideTags?: string[]
}

// ─── 기본값 ──────────────────────────────────────────────────

export const DEFAULT_CHOICE_STYLE: ChoiceSchema = {
  bg: {
    color: 'rgba(0,0,0,0.1)',
  },
  button: {
    color: 'rgba(30,30,60,0.85)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  buttonHover: {
    color: 'rgba(80,80,180,0.9)',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  text: {
    fontSize: 18,
    fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
    color: '#fff',
  },
  textHover: {
    color: '#ffffaa', // 기본 호버 텍스트 색상 (약간 노란빛)
  },
}

export const DEFAULT_CHOICE_LAYOUT: Required<ChoiceLayout> = {
  gap: 12,
  buttonPaddingLeft: 32,
  buttonPaddingRight: 32,
  buttonPaddingTop: 12,
  buttonPaddingBottom: 12,
}

// ─── ChoiceCmd 타입 ──────────────────────────────────────────

/**
 * 선택지를 표시하고 분기한다
 *
 * @example
 * {
 *   type: 'choices',
 *   choices: [
 *     { text: '싸운다', next: 'battle_scene', var: { courage: 10 } },
 *     { text: ({ courage }) => `싸운다 (용기: ${courage})`, next: 'battle_scene' },
 *     { text: '도망친다', goto: 'run_away_label' }
 *   ]
 * }
 */
export interface ChoiceCmd<TConfig = any, TLocalVars = any> {
  /** 사용자에게 제공될 선택지 목록입니다. */
  choices: {
    /** 선택지 버튼에 표시될 텍스트입니다. 함수를 사용하면 변수를 참조할 수 있습니다. */
    text: Resolvable<string, VariablesOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 씬. 문자열 또는 { scene, preserve } 객체. */
    next?: Resolvable<SceneNextTarget<TConfig>, VariablesOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: Resolvable<string, VariablesOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: VarResolvable<TConfig, TLocalVars>
  }[]
  /** UI 억제 시스템을 위한 태그 목록. 없으면 기본값(['choice', 'default-ui']) 사용 */
  uiTags?: string[]
  /** 해당 UI 활성화 시 억제(숨김)할 대상 태그 목록. 없으면 기본값(['default-ui']) 사용 */
  hideTags?: string[]
}

// ─── ChoiceHook 타입 ───────────────────────────────────────────

export type ResolvedChoiceItem = Omit<ChoiceCmd<any, any>['choices'][number], 'text'> & { text: string }

export interface ChoiceHook {
  'choice:show': (value: { choices: ResolvedChoiceItem[] }) => { choices: ResolvedChoiceItem[] }
  'choice:select': (value: { index: number, selected: ResolvedChoiceItem }) => { index: number, selected: ResolvedChoiceItem }
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 선택지 모듈. `novel.config`의 `modules: { 'choices': choiceModule }` 형태로 등록합니다.
 */
const choiceModule = define<ChoiceCmd<any, any>, ChoiceSchema, ChoiceHook>({
  bg: DEFAULT_CHOICE_STYLE.bg,
  button: DEFAULT_CHOICE_STYLE.button,
  buttonHover: DEFAULT_CHOICE_STYLE.buttonHover,
  text: DEFAULT_CHOICE_STYLE.text,
  textHover: DEFAULT_CHOICE_STYLE.textHover,
  layout: DEFAULT_CHOICE_LAYOUT,
})

choiceModule.defineView((ctx, data, setState) => {
  const cfg = { ...data }

  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // 전체 화면을 덮는 반투명 배경 패널 (이벤트 차단 용도 겸용)
  const defaultBgStyle = (cfg.bg ?? DEFAULT_CHOICE_STYLE.bg) as Partial<Style>

  const bgObj = ctx.world.createRectangle({
    style: {
      ...defaultBgStyle,
      width: w,
      height: h,
      zIndex: Z_INDEX.UI_HELPERS,
      display: 'none',
      pointerEvents: true,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(bgObj)
  bgObj.fadeOut(0)

  let _btnObjs: any[] = []

  const _clearButtons = () => {
    _btnObjs.forEach(obj => {
      obj.remove({ child: true })
    })
    _btnObjs = []
  }

  const _hide = (duration: number) => {
    bgObj.fadeOut(duration, 'easeIn')
    _clearButtons()
  }

  return {
    show: (duration) => {
      if (_btnObjs.length > 0) bgObj.fadeIn(duration, 'easeOut')
    },
    hide: (duration) => {
      if (_btnObjs.length > 0) bgObj.fadeOut(duration, 'easeIn')
    },

    // ─── 입력 역할 선언 ─────────────────────────────────
    uiTags: data._uiTags ?? ['choice', 'default-ui'],
    hideTags: data._hideTags ?? ['default-ui'],

    /** 씬 전환 시 오브젝트 즉시 제거 */
    onCleanup: () => {
      _clearButtons()
      bgObj.remove({ child: true })
    },

    // ─── 모듈 내부 전용 ─────────────────────────────────
    _onChoices: (choices: ResolvedChoiceItem[], onSelect: (i: number) => void) => {
      bgObj.fadeIn(250, 'easeOut')
      _clearButtons()

      const defaultBtnStyle = (cfg.button ?? DEFAULT_CHOICE_STYLE.button) as Partial<Style>
      const defaultHoverStyle = (cfg.buttonHover ?? DEFAULT_CHOICE_STYLE.buttonHover) as Partial<Style>
      const defaultTextStyle = (cfg.text ?? DEFAULT_CHOICE_STYLE.text) as Partial<Style>
      const defaultTextHoverStyle = (cfg.textHover ?? DEFAULT_CHOICE_STYLE.textHover) as Partial<Style>

      // 레이아웃: schema layout > DEFAULT_CHOICE_LAYOUT
      const layoutCfg: Required<ChoiceLayout> = { ...DEFAULT_CHOICE_LAYOUT, ...(cfg.layout ?? {}) }

      const fSize = defaultTextStyle.fontSize ?? 18
      const lineH = (defaultTextStyle.lineHeight as number | undefined) ?? 1.5
      const gap = layoutCfg.gap
      const BTN_PAD_Y_SUM = layoutCfg.buttonPaddingTop + layoutCfg.buttonPaddingBottom
      const BTN_PAD_X_SUM = layoutCfg.buttonPaddingLeft + layoutCfg.buttonPaddingRight

      // ─── 버튼별 너비·높이 사전 계산 ─────────────────────────────
      const resolvedMinW = (defaultBtnStyle.minWidth as number) ?? 260
      const resolvedMaxW = (defaultBtnStyle.maxWidth as number) ?? Infinity

      type BtnDim = { w: number; h: number; lines: number }
      const dims: BtnDim[] = choices.map((choice: ResolvedChoiceItem) => {
        const textStr = String(choice.text)
        const estimatedTextW = textStr.length * fSize * 0.8
        // 너비: 기본 너비 또는 텍스트 기반 너비를 minWidth와 maxWidth 사이로 클램프
        const rawW = (defaultBtnStyle.width as number) ?? (estimatedTextW + BTN_PAD_X_SUM)
        const btnW = Math.min(resolvedMaxW, Math.max(resolvedMinW, rawW))
        // 텍스트 가용 너비 = btnW - BTN_PAD_X_SUM
        const textAvailW = btnW - BTN_PAD_X_SUM
        const lineCount = textAvailW > 0
          ? Math.ceil(estimatedTextW / textAvailW)
          : 1
        const btnH = fSize * lineH * lineCount + BTN_PAD_Y_SUM
        return { w: btnW, h: btnH, lines: lineCount }
      })

      const totalHeight = dims.reduce((acc, d, i) => acc + d.h + (i > 0 ? gap : 0), 0)
      let startY = h / 2 - totalHeight / 2 + dims[0].h / 2

      choices.forEach((choice: ResolvedChoiceItem, i: number) => {
        if (i > 0) startY += dims[i - 1].h / 2 + gap + dims[i].h / 2
        const cy = startY
        const textStr = String(choice.text)
        const { w: btnW, h: btnH } = dims[i]

        const btnStyle: Partial<Style> = {
          ...defaultBtnStyle,
          width: btnW,
          height: btnH,
          zIndex: defaultBtnStyle.zIndex ?? 501,
          pointerEvents: true,
          cursor: 'pointer',
          opacity: defaultBtnStyle.opacity ?? 1,
        }

        const btnObj = ctx.world.createRectangle({
          style: btnStyle,
          transform: { position: { x: 0, y: -(cy - h / 2), z: 0 } }
        })

        const textStyle: Partial<Style> = {
          ...defaultTextStyle,
          // 너비 제한 시 텍스트가 btnW 내에서 래핑되도록 width 지정
          width: btnW - BTN_PAD_X_SUM,
          textAlign: defaultTextStyle.textAlign ?? 'center',
          zIndex: defaultTextStyle.zIndex ?? 502,
          pointerEvents: false,
        }

        const txtObj = ctx.world.createText({
          attribute: { text: textStr },
          style: textStyle,
          transform: { position: { x: 0, y: 0, z: 0 } }
        })

        const hoverBtnStyle = { ...defaultHoverStyle }
        const hoverTxtStyle = { ...defaultTextHoverStyle }

        // hover에서 변경한 키만 원본값으로 복원
        const normalStyleProps = Object.fromEntries(
          Object.keys(hoverBtnStyle).map(key => [key, (btnStyle as any)[key]])
        )
        const normalTextProps = Object.fromEntries(
          Object.keys(hoverTxtStyle).map(key => [key, (textStyle as any)[key]])
        )

        btnObj.on('mouseover', () => {
          btnObj.animate({ style: hoverBtnStyle as any }, 150)
          txtObj.animate({ style: hoverTxtStyle as any }, 150)
        })
        btnObj.on('mouseout', () => {
          btnObj.animate({ style: normalStyleProps as any }, 150)
          txtObj.animate({ style: normalTextProps as any }, 150)
        })
        btnObj.on('click', (e: MouseEvent) => {
          e.stopPropagation()
          e.stopImmediatePropagation()
          onSelect(i)
        })

        btnObj.addChild(txtObj)
        bgObj.addChild(btnObj)
        _btnObjs.push(btnObj)
      })
    },
    onUpdate: (_ctx, state, _setState) => {
      Object.assign(cfg, state)
    },
    _hide,
  }
})

choiceModule.defineCommand(function* (cmd, ctx, state, setState) {
  const entry = ctx.ui.get(choiceModule.__key!) as any

  setState({
    _uiTags: cmd.uiTags ?? state._uiTags ?? ['choice', 'default-ui'],
    _hideTags: cmd.hideTags ?? state._hideTags ?? ['default-ui']
  })

  if (!entry) {
    console.warn('[fumika] choices UI entry not found in registry. Ensure it is defined in novel.config.ts modules.')
  }

  // 텍스트(resolvable) 평가
  const resolvedChoices: ResolvedChoiceItem[] = cmd.choices.map((c) => {
    const textStr = typeof c.text === 'function' ? c.text(ctx.scene.getVars()) : c.text
    return { ...c, text: ctx.scene.interpolateText(textStr) }
  })

  // 'choice:show' 훅 방출
  const showData = choiceModule.hooker.trigger(
    'choice:show',
    { choices: resolvedChoices },
    (value) => value
  )

  console.log('[fumika] choiceHandler: opening choices', showData.choices)

  let selected: ResolvedChoiceItem | null = null

  entry?._onChoices?.(showData.choices, (i: number) => {
    // 'choice:select' 훅 방출
    const selectData = choiceModule.hooker.trigger(
      'choice:select',
      { index: i, selected: showData.choices[i] },
      (value) => value
    )
    selected = selectData.selected ?? null
    ctx.callbacks.advance()
  })

  // 선택 완료까지 block
  while (selected === null) {
    yield false
  }

  const item = selected as ResolvedChoiceItem

  // 선택지 숨기기
  entry?._hide(250)

  // var 설정
  if (item.var) {
    const vars = resolveVarResolvable(item.var, ctx.scene.getVars())
    if (vars) {
      for (const [key, value] of Object.entries(vars)) {
        ctx.scene.setGlobalVar(key, value)
      }
    }
  }

  // 분기
  if (item.next) {
    const nextVal = typeof item.next === 'function' ? item.next(ctx.scene.getVars()) : item.next
    ctx.scene.loadScene(nextVal)
  } else if (item.goto) {
    const gotoVal = typeof item.goto === 'function' ? item.goto(ctx.scene.getVars()) : item.goto
    ctx.scene.jumpToLabel(gotoVal)
  } else {
    ctx.scene.end()
  }

  return true
})

export default choiceModule
