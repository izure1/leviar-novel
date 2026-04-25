import type { Resolvable } from '../define/defineCmd'
import type { SceneNamesOf, VarsOf } from '../types/config'
import { define } from '../define/defineCmdUI'

// ─── 선택지 UI 스타일 + 런타임 상태 스키마 ────────────────────

/** choiceModule이 공유하는 데이터 스키마 */
export interface ChoiceSchema {
  fontSize?: number
  fontFamily?: string
  color?: string
  background?: string
  borderColor?: string
  hoverBackground?: string
  hoverBorderColor?: string
  borderRadius?: number
  minWidth?: number
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_CHOICE: Required<ChoiceSchema> = {
  fontSize: 18,
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  color: '#fff',
  background: 'rgba(30,30,60,0.85)',
  borderColor: 'rgba(255,255,255,0.3)',
  hoverBackground: 'rgba(80,80,180,0.9)',
  hoverBorderColor: 'rgba(255,255,255,0.7)',
  borderRadius: 8,
  minWidth: 260,
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
    /** 해당 선택지를 골랐을 때 이동할 씬(Scene)의 이름입니다. */
    next?: Resolvable<SceneNamesOf<TConfig>, VarsOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: Resolvable<string, VarsOf<TConfig>, TLocalVars>
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: Resolvable<Partial<Record<keyof VarsOf<TConfig>, any>>, VarsOf<TConfig>, TLocalVars>
  }[]
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 선택지 모듈. `novel.config`의 `modules: { 'choices': choiceModule }` 형태로 등록합니다.
 */
const choiceModule = define<ChoiceCmd<any, any>, ChoiceSchema>({
  fontSize: undefined,
  fontFamily: undefined,
  color: undefined,
  background: undefined,
  borderColor: undefined,
  hoverBackground: undefined,
  hoverBorderColor: undefined,
  borderRadius: undefined,
  minWidth: undefined,
})

choiceModule.defineView((data, ctx) => {
  const cfg = { ...DEFAULT_CHOICE, ...data } as Required<ChoiceSchema>

  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // 전체 화면을 덮는 반투명 배경 패널 (이벤트 차단 용도 겸용)
  const bgObj = ctx.world.createRectangle({
    style: {
      color: 'rgba(0,0,0,0.6)',
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
    onChoices: (choices: any[], onSelect: (i: number) => void) => {
      bgObj.fadeIn(200, 'easeOut')
      _clearButtons()

      const fSize = cfg.fontSize ?? DEFAULT_CHOICE.fontSize
      const mWidth = cfg.minWidth ?? DEFAULT_CHOICE.minWidth
      const gap = 12
      const paddingY = 12
      const btnH = fSize * 1.5 + paddingY * 2
      const totalHeight = choices.length * btnH + Math.max(0, choices.length - 1) * gap
      const startY = h / 2 - totalHeight / 2 + btnH / 2

      choices.forEach((choice: any, i: number) => {
        const cy = startY + i * (btnH + gap)
        const textStr = String(choice.text)
        const estimatedTextW = textStr.length * fSize * 0.8
        const btnW = Math.max(mWidth, estimatedTextW + 64)

        const btnObj = ctx.world.createRectangle({
          style: {
            color: cfg.background ?? DEFAULT_CHOICE.background,
            borderColor: cfg.borderColor ?? DEFAULT_CHOICE.borderColor,
            borderWidth: 1.5,
            borderRadius: cfg.borderRadius ?? DEFAULT_CHOICE.borderRadius,
            width: btnW,
            height: btnH,
            zIndex: 501,
            pointerEvents: true,
            opacity: 1
          },
          transform: { position: toLocal(w / 2, cy) }
        })

        const txtObj = ctx.world.createText({
          attribute: { text: textStr },
          style: {
            fontSize: fSize,
            fontFamily: cfg.fontFamily ?? DEFAULT_CHOICE.fontFamily,
            color: cfg.color ?? DEFAULT_CHOICE.color,
            textAlign: 'center',
            zIndex: 502,
            pointerEvents: false
          },
          transform: { position: { x: 0, y: 0, z: 0 } }
        })

        btnObj.on('mouseover', () => {
          btnObj.animate({ style: { color: cfg.hoverBackground, borderColor: cfg.hoverBorderColor } }, 150)
        })
        btnObj.on('mouseout', () => {
          btnObj.animate({ style: { color: cfg.background, borderColor: cfg.borderColor } }, 150)
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
    update: (d: ChoiceSchema) => {
      Object.assign(cfg, DEFAULT_CHOICE, d)
    },
  }
})

choiceModule.defineCommand(function* (cmd, ctx) {
  const entry = ctx.ui.get('choice')

  if (!entry) {
    console.warn('[leviar-novel] choices UI entry not found in registry. Ensure it is defined in novel.config.ts modules.')
  }

  // 대화창 숨김
  ctx.ui.get('dialogue')?.hide?.()

  // 텍스트(resolvable) 평가
  const resolvedChoices = cmd.choices.map((c: any) => {
    const textStr = typeof c.text === 'function' ? c.text(ctx.scene.getVars()) : c.text
    return { ...c, text: ctx.scene.interpolateText(textStr) }
  })

  console.log('[leviar-novel] choiceHandler: opening choices', resolvedChoices)

  entry?.onChoices?.(resolvedChoices, (i: number) => {
    const selected = (cmd.choices as any[])[i]
    if (!selected) return

    // var 설정
    if (selected.var) {
      for (const [key, value] of Object.entries(selected.var as Record<string, any>)) {
        ctx.scene.setGlobalVar(key, value)
      }
    }

    // 선택지 숨기기
    entry.hide?.()

    // 분기
    if (selected.next) {
      ctx.scene.loadScene(selected.next)
    } else if (selected.goto) {
      ctx.scene.jumpToLabel(selected.goto)
    } else {
      ctx.scene.end()
    }
  })

  return 'handled'
})

export default choiceModule
