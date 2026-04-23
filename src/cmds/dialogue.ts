import type { Style } from 'leviar'
import type { CharDefs } from '../types/config'
import { define } from '../define/defineCmdUI'

// ─── 대화 UI 스타일 + 런타임 상태 스키마 ──────────────────────

/** dialogueUISetup이 공유하는 데이터 스키마 */
export interface DialogueSchema {
  /** 대화창 배경 패널 스타일 */
  bg?:        Partial<Style> & { height?: number }
  /** 화자(캐릭터 이름) 텍스트 스타일 */
  speaker?:   Partial<Style>
  /** 대사 텍스트 스타일 */
  text?:      Partial<Style>
  // ─── 런타임 상태 ───────────────────────────────────────────
  /** 현재 텍스트 서브 인덱스 */
  subIndex:   number
  /** 현재 대사 줄 목록 */
  lines:      string[]
  /** 현재 화자 키 */
  speakerKey: string | undefined
  /** 현재 타이핑 속도(ms). dialogueHandler가 설정합니다 */
  speed:      number | undefined
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

// ─── define(schema) 팩토리 ───────────────────────────────────

const { defineCmd, defineUI } = define<DialogueSchema>({
  bg:         undefined,
  speaker:    undefined,
  text:       undefined,
  subIndex:   0,
  lines:      [],
  speakerKey: undefined,
  speed:      undefined,
})

// ─── dialogueUISetup ─────────────────────────────────────────

/**
 * 대화 UI(배경/화자/텍스트)를 생성하고 레지스트리에 등록하는 셋업 핸들러.
 * `novel.config`의 `ui: { 'dialogue': dialogueUISetup }` 형태로 등록합니다.
 *
 * @example
 * ```ts
 * // novel.config.ts
 * ui: { 'dialogue': dialogueUISetup }
 *
 * // scene (initial 사용)
 * defineScene({ config, initial: { 'dialogue': { bg: { height: 168 } } } }, [...])
 * ```
 */
export const dialogueUISetup = defineUI(
  (data, ctx) => {
    const cam = ctx.world.camera as any
    const w   = ctx.renderer.width
    const h   = ctx.renderer.height

    const toLocal = (cx: number, cy: number) =>
      (cam && typeof cam.canvasToLocal === 'function')
        ? cam.canvasToLocal(cx, cy)
        : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

    // 스타일 병합
    const bgCfg  = { ...DEFAULT_BG,      ...(data.bg      ?? {}) } as any
    const spkCfg = { ...DEFAULT_SPEAKER, ...(data.speaker ?? {}) } as any
    const txtCfg = { ...DEFAULT_TEXT,    ...(data.text    ?? {}) } as any

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

    const charDefs = ctx.renderer.config.characters as any

    // 타이핑 상태
    let _isTyping    = false
    let _fullText    = ''
    let _activeTx: any = null
    // 반응형 중복 렌더 방지: 이전 lines 참조를 추적
    let _prevLines: string[] | null = null

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
    if (data.lines?.length) {
      _prevLines = data.lines
      const txt = data.lines[data.subIndex ?? 0] as string
      const spkName = resolveSpeaker(data.speakerKey, charDefs)
      _renderText(spkName, txt, undefined, true)
    }

    return {
      show:    (dur?: number) => _show(dur),
      hide:    (dur?: number) => _hide(dur),
      isTyping:       () => _isTyping,
      completeTyping: () => {
        if (!_isTyping) return
        _isTyping = false
        _activeTx?.stop?.()
        _activeTx = null
        ;(textObj as any).attribute.text = _fullText
        ;(textObj as any).style.opacity  = 1
      },
      /**
       * data가 변경될 때 Proxy가 자동으로 호출합니다.
       * - lines가 바뀐 경우: 텍스트 재렌더
       * - bg/speaker/text 스타일이 바뀐 경우: 캔버스 오브젝트 스타일 갱신
       */
      update: (d: DialogueSchema) => {
        // 스타일 갱신
        const newBgCfg  = { ...DEFAULT_BG,      ...(d.bg      ?? {}) } as any
        const newSpkCfg = { ...DEFAULT_SPEAKER, ...(d.speaker ?? {}) } as any
        const newTxtCfg = { ...DEFAULT_TEXT,    ...(d.text    ?? {}) } as any
        Object.assign((bgObj      as any).style, newBgCfg)
        Object.assign((speakerObj as any).style, newSpkCfg)
        Object.assign((textObj    as any).style, newTxtCfg)

        // 텍스트 갱신: lines 참조가 바뀐 경우에만 렌더 (중복 방지)
        if (d.lines && d.lines !== _prevLines && d.lines.length > 0) {
          _prevLines = d.lines
          const txt     = d.lines[d.subIndex ?? 0] as string
          const spkName = resolveSpeaker(d.speakerKey, charDefs)
          _renderText(spkName, txt, d.speed)
        }
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

export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx, data) => {
  // 단일 문자열이든 배열이든 통일하여 처리
  const textArray = Array.isArray(cmd.text) ? cmd.text : [cmd.text]
  const lines = textArray.map(t => ctx.scene.interpolateText(t))
  let index = 0

  return () => {
    const ui = ctx.ui.get('dialogue') as any
    
    // 타이핑 중이면 즉시 완료 후 대기 유지
    if (ui && typeof ui.isTyping === 'function' && ui.isTyping()) {
      ui.completeTyping?.()
      return false
    }

    // 대사 출력이 끝났으면 다음 커맨드로 진행
    if (index >= lines.length) {
      return true
    }

    // Proxy 트랩 및 렌더링 갱신을 위해 속도, 화자를 먼저 설정
    data.speed      = cmd.speed
    data.speakerKey = cmd.speaker as string | undefined
    data.subIndex   = index
    
    // 배열 참조를 갱신하여 update 내부의 lines !== _prevLines 체크를 통과시킴
    data.lines      = [...lines]
    
    ctx.cmdState.set('dialogue', { ...data })
    index++
    
    return false
  }
})
