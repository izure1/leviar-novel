import type { Style } from 'leviar'
import type { CharDefs } from '../types/config'
import { defineCmd } from '../define/defineCmd'
import { defineUI } from '../define/defineUI'

// ─── 대화 UI 스타일 타입 ─────────────────────────────────────

/** dialogueUISetup 커맨드에 전달하는 UI 스타일 설정 */
export interface DialogueUIStyle {
  /** 대화창 배경 패널 스타일 (Leviar Style) */
  bg?:      Partial<Style> & { height?: number }
  /** 화자(캐릭터 이름) 텍스트 스타일 (Leviar Style) */
  speaker?: Partial<Style>
  /** 대사 텍스트 스타일 (Leviar Style) */
  text?:    Partial<Style>
}

// ─── 기본값 ──────────────────────────────────────────────────

const DEFAULT_BG: Record<string, any> = {
  color: 'rgba(0,0,0,0.82)',
}

const DEFAULT_SPEAKER: Record<string, any> = {
  fontSize: 18, fontWeight: 'bold', color: '#ffe066',
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
}

const DEFAULT_TEXT: Record<string, any> = {
  fontSize: 20, color: '#ffffff', lineHeight: 1.6,
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
}

// ─── 화자 이름 해석 헬퍼 ────────────────────────────────────

function resolveSpeaker(speakerKey: string | undefined, charDefs: any): string | undefined {
  if (!speakerKey) return undefined
  return charDefs?.[speakerKey]?.name ?? speakerKey
}

// ─── dialogueUISetup — defineUI로 생성 ──────────────────────

/**
 * 대화 UI(배경/화자/텍스트)를 생성하고 레지스트리에 등록하는 셋업 커맨드 핸들러.
 *
 * @example
 * ```ts
 * // novel.config.ts
 * cmds: { 'setup-dialogue': dialogueUISetup }
 *
 * // scene
 * { type: 'setup-dialogue', bg: { height: 168 }, text: { fontSize: 18, color: '#f0f0f0' } }
 * ```
 */
export const dialogueUISetup = defineUI<DialogueUIStyle>(
  'dialogue',
  (style, ctx) => {
    const cam = ctx.world.camera as any
    const w   = ctx.renderer.width
    const h   = ctx.renderer.height

    const toLocal = (cx: number, cy: number) =>
      (cam && typeof cam.canvasToLocal === 'function')
        ? cam.canvasToLocal(cx, cy)
        : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

    // 스타일 병합
    const bgCfg  = { ...DEFAULT_BG,      ...(style.bg      ?? {}) } as any
    const spkCfg = { ...DEFAULT_SPEAKER, ...(style.speaker ?? {}) } as any
    const txtCfg = { ...DEFAULT_TEXT,    ...(style.text    ?? {}) } as any

    const BOX_H  = typeof bgCfg.height === 'number' ? bgCfg.height : h * 0.28
    const BOX_CY = h - (BOX_H / 2)

    // 대화창 배경
    const bgObj = ctx.world.createRectangle({
      style: {
        ...bgCfg,
        width:         bgCfg.width ?? w,
        height:        BOX_H,
        zIndex:        bgCfg.zIndex ?? 300,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, BOX_CY) },
    })
    ctx.world.camera?.addChild(bgObj as any)
    ctx.renderer.track(bgObj)

    // 화자 이름창
    const spkY = h - BOX_H + 24
    const speakerObj = ctx.world.createText({
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
    ctx.world.camera?.addChild(speakerObj as any)
    ctx.renderer.track(speakerObj)

    // 대사 텍스트창
    const spkH = (spkCfg.fontSize ?? 18) * 1.5
    const textObj = ctx.world.createText({
      attribute: { text: '' } as any,
      style: {
        ...txtCfg,
        width:         txtCfg.width ?? w * 0.90,
        zIndex:        txtCfg.zIndex ?? 301,
        opacity:       0,
        pointerEvents: false,
      } as any,
      transform: { position: toLocal(w / 2, spkY + spkH + 8) },
    })
    ctx.world.camera?.addChild(textObj as any)
    ctx.renderer.track(textObj)

    // 타이핑 상태
    let _isTyping    = false
    let _fullText    = ''
    let _activeTx: any = null

    const _show = (dur = 250) => {
      ;(bgObj as any).animate({ style: { opacity: 1 } }, dur, 'easeOut')
    }

    const _hide = (dur = 300) => {
      ;(bgObj  as any).animate({ style: { opacity: 0 } }, dur, 'easeIn')
      ;(speakerObj as any).style.opacity = 0
      ;(textObj as any).animate({ style: { opacity: 0 } }, dur, 'easeIn')
    }

    const _renderText = (
      speaker: string | undefined,
      text: string,
      speed?: number,
      immediate = false
    ) => {
      _show()

      // 화자
      ;(speakerObj as any).attribute.text = speaker ?? ''
      ;(speakerObj as any).style.opacity  = speaker ? 1 : 0

      // 대사 — 즉시 or 타이핑
      if (immediate || speed === 0) {
        _isTyping  = false
        _fullText  = text
        _activeTx?.stop?.()
        _activeTx  = null
        ;(textObj as any).attribute.text = text
        ;(textObj as any).style.opacity  = 1
      } else {
        const spd = speed ?? 30
        _isTyping  = true
        _fullText  = text
        if (_activeTx) { _activeTx.stop?.(); _activeTx = null }
        const anim = (textObj as any).transition(text, spd)
        _activeTx  = anim
        ;(textObj as any).animate({ style: { opacity: 1 } }, 200, 'easeOut')
        if (anim && typeof anim.on === 'function') {
          anim.on('end', () => {
            _isTyping = false
            _activeTx = null
          })
        }
      }
    }

    // 복원: 로드 시 저장된 대사 즉시 렌더링
    const saved = ctx.cmdState.get('dialogue')
    if (saved?.lines?.length) {
      const txt = saved.lines[saved.subIndex ?? 0] as string
      const charDefs = ctx.renderer.config.characters as any
      const spkName  = resolveSpeaker(saved.speaker, charDefs)
      _renderText(spkName, txt, undefined, true)
    }

    return {
      show:    (dur?: number) => _show(dur),
      hide:    (dur?: number) => _hide(dur),
      isTyping:      () => _isTyping,
      completeTyping: () => {
        if (!_isTyping) return
        _isTyping = false
        _activeTx?.stop?.()
        _activeTx = null
        ;(textObj as any).attribute.text = _fullText
        ;(textObj as any).style.opacity  = 1
      },
      onDialogue: (speaker, text, speed) => {
        _renderText(speaker, text, speed)
      },
    }
  },
  { hideable: true, attachToCamera: true }
)

// ─── dialogueHandler ─────────────────────────────────────────

/** 
 * 대사 또는 나레이션 출력 
 * 
 * @example
 * ```ts
 * { type: 'dialogue', speaker: 'hero', text: 'Hello world!', speed: 50 }
 * // 또는 나레이션
 * { type: 'dialogue', text: ['첫 번째 줄', '두 번째 줄'] }
 * ```
 */
export interface DialogueCmd<TCharacters extends CharDefs> {
  /** 
   * 화자의 이름 (config.characters의 키). 
   * 생략할 경우 화자 이름 없이 나레이션으로 처리됩니다.
   */
  speaker?: keyof TCharacters & string
  /** 화면에 출력할 텍스트입니다. 배열일 경우 여러 줄로 출력될 수 있습니다. */
  text: string | string[]
  /** 
   * 텍스트가 한 글자씩 출력되는 속도(ms 단위)입니다. 
   * 미지정 시 시스템 설정 속도 또는 기본값(예: 30ms)이 사용됩니다.
   */
  speed?: number
}

export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx) => {
  const charDefs = ctx.renderer.config.characters as any
  const spkName  = resolveSpeaker(cmd.speaker as string | undefined, charDefs)
  const entry    = ctx.ui.get('dialogue')

  // 단일 문자열
  if (!Array.isArray(cmd.text)) {
    const text = ctx.scene.interpolateText(cmd.text)
    ctx.cmdState.set('dialogue', {
      subIndex: 0,
      lines:    [text],
      speaker:  cmd.speaker,
    })
    entry?.onDialogue?.(spkName, text, cmd.speed)
    return false
  }

  // 배열: TickFn — 클릭마다 다음 줄 출력
  const lines = cmd.text as string[]
  let index = 0

  return () => {
    const text = ctx.scene.interpolateText(lines[index])
    ctx.cmdState.set('dialogue', {
      subIndex: index,
      lines,
      speaker:  cmd.speaker,
    })
    entry?.onDialogue?.(spkName, text, cmd.speed)
    index++
    return index >= lines.length
  }
})
