import type { Resolvable } from '../define/defineCmd'
import { define } from '../define/defineCmdUI'

// ─── 선택지 UI 스타일 + 런타임 상태 스키마 ────────────────────

/** choiceUISetup이 공유하는 데이터 스키마 */
export interface ChoiceSchema {
  fontSize?:         number
  fontFamily?:       string
  color?:            string
  background?:       string
  borderColor?:      string
  hoverBackground?:  string
  hoverBorderColor?: string
  borderRadius?:     number
  minWidth?:         number
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_CHOICE: Required<ChoiceSchema> = {
  fontSize:         18,
  fontFamily:       '"Noto Sans KR","Malgun Gothic",sans-serif',
  color:            '#fff',
  background:       'rgba(30,30,60,0.85)',
  borderColor:      'rgba(255,255,255,0.3)',
  hoverBackground:  'rgba(80,80,180,0.9)',
  hoverBorderColor: 'rgba(255,255,255,0.7)',
  borderRadius:     8,
  minWidth:         260,
}

// ─── define(schema) 팩토리 ───────────────────────────────────

const { defineCmd, defineUI } = define<ChoiceSchema>({
  fontSize:         undefined,
  fontFamily:       undefined,
  color:            undefined,
  background:       undefined,
  borderColor:      undefined,
  hoverBackground:  undefined,
  hoverBorderColor: undefined,
  borderRadius:     undefined,
  minWidth:         undefined,
})

// ─── choiceUISetup ───────────────────────────────────────────

/**
 * 선택지 UI(HTML 컨테이너)를 생성하고 레지스트리에 등록하는 셋업 핸들러.
 * `novel.config`의 `ui: { 'choices': choiceUISetup }` 형태로 등록합니다.
 *
 * @example
 * ```ts
 * // novel.config.ts
 * ui: { 'choices': choiceUISetup }
 *
 * // scene (initial 사용)
 * defineScene({ config, initial: { 'choices': { background: 'rgba(20,20,50,0.90)', minWidth: 280 } } }, [...])
 * ```
 */
export const choiceUISetup = defineUI(
  (data, ctx) => {
    const cfg = { ...DEFAULT_CHOICE, ...data } as Required<ChoiceSchema>

    const canvas = ctx.renderer.world.canvas as HTMLCanvasElement
    const parent = canvas.parentElement ?? document.body

    const el = document.createElement('div')
    el.style.cssText = [
      'position:absolute', 'top:0', 'left:0', 'right:0', 'bottom:0',
      'display:none',
      'flex-direction:column', 'justify-content:center', 'align-items:center',
      'gap:12px',
      'background:rgba(0,0,0,0.6)',
      'pointer-events:auto',
      `font-family:${cfg.fontFamily}`,
    ].join(';')
    parent.style.position = 'relative'
    parent.appendChild(el)

    // 씬 종료(clear) 시 DOM도 제거
    ;(el as any).__novelRemove = () => { el.remove() }

    return {
      show: () => { el.style.display = 'flex' },
      hide: () => { el.style.display = 'none'; el.innerHTML = '' },
      onChoices: (choices, onSelect) => {
        el.style.display = 'flex'
        el.innerHTML = ''

        choices.forEach((choice: any, i: number) => {
          const btn = document.createElement('button')
          btn.textContent = choice.text
          btn.style.cssText = [
            'padding:12px 32px',
            `font-size:${cfg.fontSize}px`,
            `font-family:${cfg.fontFamily}`,
            `color:${cfg.color}`,
            `background:${cfg.background}`,
            `border:1.5px solid ${cfg.borderColor}`,
            `border-radius:${cfg.borderRadius}px`,
            'cursor:pointer',
            'transition:background 0.15s,border-color 0.15s',
            `min-width:${cfg.minWidth}px`,
            'text-align:center',
          ].join(';')
          btn.addEventListener('mouseenter', () => {
            btn.style.background  = cfg.hoverBackground
            btn.style.borderColor = cfg.hoverBorderColor
          })
          btn.addEventListener('mouseleave', () => {
            btn.style.background  = cfg.background
            btn.style.borderColor = cfg.borderColor
          })
          btn.addEventListener('click', (e) => {
            e.stopPropagation()
            onSelect(i)
          })
          el.appendChild(btn)
        })
      },
      /** data 변경 시 내부 cfg를 갱신합니다. 이후 onChoices 호출 시 새 스타일이 적용됩니다. */
      update: (d: ChoiceSchema) => {
        Object.assign(cfg, DEFAULT_CHOICE, d)
      },
    }
  },
  { hideable: true, attachToCamera: true }
)

// ─── choice 커맨드 타입 ──────────────────────────────────────

/**
 * 선택지를 표시하고 분기한다
 *
 * @example
 * ```ts
 * {
 *   type: 'choice',
 *   choices: [
 *     { text: '싸운다', next: 'battle_scene', var: { courage: 10 } },
 *     { text: ({ courage }) => `싸운다 (용기: ${courage})`, next: 'battle_scene' },
 *     { text: '도망친다', goto: 'run_away_label' }
 *   ]
 * }
 * ```
 */
export interface ChoiceCmd<TVars, TLocalVars, TScenes extends readonly string[]> {
  /** 사용자에게 제공될 선택지 목록입니다. */
  choices: {
    /** 선택지 버튼에 표시될 텍스트입니다. 함수를 사용하면 변수를 참조할 수 있습니다. */
    text: Resolvable<string, TVars, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 씬(Scene)의 이름입니다. */
    next?: Resolvable<TScenes[number], TVars, TLocalVars>
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: Resolvable<string, TVars, TLocalVars>
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: Resolvable<Partial<Record<keyof TVars, any>>, TVars, TLocalVars>
  }[]
}

export const choiceHandler = defineCmd<ChoiceCmd<any, any, any>>((cmd, ctx, _data) => {
  const entry = ctx.ui.get('choices')

  // 대화창 숨김
  ctx.ui.get('dialogue')?.hide?.()

  entry?.onChoices?.(cmd.choices as any, (i: number) => {
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
      // goto/next 없으면 다음 스텝 (Scene.advance 없이 직접 처리 불가 — 기존 방식 유지)
    }
  })

  return 'handled'
})
