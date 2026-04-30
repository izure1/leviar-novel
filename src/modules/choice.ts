import type { Resolvable } from '../define/defineCmd'
import type { SceneNextTarget, VarsOf } from '../types/config'
import type { VarResolvable } from '../types/utils'
import { resolveVarResolvable } from '../types/utils'
import { define } from '../define/defineCmdUI'
import type { Style } from 'leviar'

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
   * 버튼 내부 좌우(X) 패딩 합산(px). 주어진 텍스트너비 + paddingX 로 버튼 너비 추정.
   * `button.width` 를 직접 지정하면 무시.
   * @default 64
   */
  paddingX?: number
  /**
   * 버튼 내부 상하(Y) 패딩 합산(px). 버튼 높이 = fontSize * lineHeight * lines + paddingY.
   * @default 24
   */
  paddingY?: number
  /**
   * 버튼 최소 너비(px). 텍스트가 짧아도 이 값 이상 유지.
   * @default 260
   */
  buttonMinWidth?: number
  /**
   * 버튼 최대 너비(px). 지정 시 텍스트가 길어도 이 너비로 고정되며,
   * 텍스트가 여러 줄로 자동 래핑됩니다.
   */
  buttonMaxWidth?: number
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
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_CHOICE: ChoiceSchema = {
  bg: {
    color: 'rgba(0,0,0,0.6)',
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

const DEFAULT_LAYOUT: Required<ChoiceLayout> = {
  gap: 12,
  paddingX: 64,
  paddingY: 24,
  buttonMinWidth: 260,
  buttonMaxWidth: Infinity,
}

// ─── ChoiceCmd 타입 ──────────────────────────────────────────

/**
 * 선택지를 표시하고 분기한다
 *
 * @example
 * ```ts
 * {
 *   type: 'choices',
 *   choices: [
 *     { text: '싸운다', next: 'battle_scene', var: { courage: 10 } },
 *     { text: ({ courage }) => `싸운다 (용기: ${courage})`, next: 'battle_scene' },
 *     { text: '도망친다', goto: 'run_away_label' }
 *   ]
 * }
 * ```
 */
export interface ChoiceCmd<TConfig = any, TLocalVars = any> {
  /** 사용자에게 제공될 선택지 목록입니다. */
  choices: {
    /** 선택지 버튼에 표시될 텍스트입니다. 함수를 사용하면 변수를 참조할 수 있습니다. */
    text: Resolvable<string, VarsOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 씬. 문자열 또는 { scene, preserve } 객체. */
    next?: Resolvable<SceneNextTarget<TConfig>, VarsOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: Resolvable<string, VarsOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: VarResolvable<TConfig, TLocalVars>
  }[]
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
  bg: undefined,
  button: undefined,
  buttonHover: undefined,
  text: undefined,
  textHover: undefined,
  layout: undefined,
})

choiceModule.defineView((data, ctx) => {
  const cfg = { ...data }

  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // 전체 화면을 덮는 반투명 배경 패널 (이벤트 차단 용도 겸용)
  const defaultBgStyle = (cfg.bg ?? DEFAULT_CHOICE.bg) as Partial<Style>

  const bgObj = ctx.world.createRectangle({
    style: {
      ...defaultBgStyle,
      width: w,
      height: h,
      zIndex: 500,
      opacity: 0,
      pointerEvents: true,
    },
    transform: { position: toLocal(w / 2, h / 2) },
  })
  ctx.world.camera?.addChild(bgObj)
  ctx.renderer.track(bgObj)

  let _btnObjs: any[] = []

  const _clearButtons = () => {
    _btnObjs.forEach(obj => {
      obj.remove({ child: true })
    })
    _btnObjs = []
  }

  return {
    show: () => { bgObj.fadeIn(200, 'easeOut') },
    hide: () => {
      bgObj.fadeOut(200, 'easeIn')
      _clearButtons()
    },

    // ─── 입력 역할 선언 ─────────────────────────────────
    hideGroups: ['dialogue'],

    /** 씬 전환 시 버튼 즉시 제거 */
    onCleanup: () => { _clearButtons() },

    // ─── 모듈 내부 전용 ─────────────────────────────────
    _onChoices: (choices: ResolvedChoiceItem[], onSelect: (i: number) => void) => {
      bgObj.fadeIn(200, 'easeOut')
      _clearButtons()

      const defaultBtnStyle = (cfg.button ?? DEFAULT_CHOICE.button) as Partial<Style>
      const defaultHoverStyle = (cfg.buttonHover ?? DEFAULT_CHOICE.buttonHover) as Partial<Style>
      const defaultTextStyle = (cfg.text ?? DEFAULT_CHOICE.text) as Partial<Style>
      const defaultTextHoverStyle = (cfg.textHover ?? DEFAULT_CHOICE.textHover) as Partial<Style>

      // 레이아웃: schema layout > DEFAULT_LAYOUT
      const layoutCfg: Required<ChoiceLayout> = { ...DEFAULT_LAYOUT, ...(cfg.layout ?? {}) }

      const fSize = defaultTextStyle.fontSize ?? 18
      const lineH = (defaultTextStyle.lineHeight as number | undefined) ?? 1.5
      const gap = layoutCfg.gap
      const paddingY = layoutCfg.paddingY / 2   // 단방향(상 or 하) 패딩

      // ─── 버튼별 너비·높이 사전 계산 ─────────────────────────────
      const resolvedMinW = layoutCfg.buttonMinWidth
      const resolvedMaxW = layoutCfg.buttonMaxWidth

      type BtnDim = { w: number; h: number; lines: number }
      const dims: BtnDim[] = choices.map((choice: ResolvedChoiceItem) => {
        const textStr = String(choice.text)
        const estimatedTextW = textStr.length * fSize * 0.8
        // 너비: minWidth 이상, maxWidth 이하
        const rawW = estimatedTextW + layoutCfg.paddingX
        const btnW = Math.min(resolvedMaxW, Math.max(resolvedMinW, rawW))
        // 텍스트 가용 너비 = btnW - paddingX
        const textAvailW = btnW - layoutCfg.paddingX
        const lineCount = textAvailW > 0
          ? Math.ceil(estimatedTextW / textAvailW)
          : 1
        const btnH = fSize * lineH * lineCount + paddingY * 2
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
          opacity: defaultBtnStyle.opacity ?? 1,
        }

        const btnObj = ctx.world.createRectangle({
          style: btnStyle,
          transform: { position: toLocal(w / 2, cy) }
        })

        const textStyle: Partial<Style> = {
          ...defaultTextStyle,
          // 너비 제한 시 텍스트가 btnW 내에서 래핑되도록 width 지정
          width: btnW - layoutCfg.paddingX,
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
        btnObj.on('click', () => {
          onSelect(i)
        })

        btnObj.addChild(txtObj)
        ctx.world.camera?.addChild(btnObj)
        ctx.renderer.track(btnObj)
        ctx.renderer.track(txtObj)
        _btnObjs.push(btnObj)
      })
    },
    onUpdate: (d: ChoiceSchema) => {
      Object.assign(cfg, d)
    },
  }
})

choiceModule.defineCommand(function* (cmd, ctx) {
  const entry = ctx.ui.get(choiceModule.__key!) as any

  if (!entry) {
    console.warn('[leviar-novel] choices UI entry not found in registry. Ensure it is defined in novel.config.ts modules.')
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

  console.log('[leviar-novel] choiceHandler: opening choices', showData.choices)

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
  entry?.hide?.()

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
