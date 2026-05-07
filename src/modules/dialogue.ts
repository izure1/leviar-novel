import type { Style } from 'leviar'
import type { CharDefs, CharacterKeysOf } from '../types/config'
import { define } from '../define/defineCmdUI'
import { Z_INDEX } from '../constants/render'

// ─── 대화 UI 스타일 + 런타임 상태 스키마 ──────────────────────

export interface DialogueHook {
  'dialogue:text-render': (
    s: { speaker: string | undefined, text: string }
  ) => {
    speaker: string | undefined
    text: string
  },
  'dialogue:text-run': (
    s: { speaker: string | undefined, text: string }
  ) => {
    speaker: string | undefined
    text: string
  }
}

/**
 * 대화창 내부 간격 레이아웃 설정.
 * `defineInitial` 또는 커맨드의 `layout` 필드로 씬/커맨드별 지정 가능.
 */
export interface DialogueLayout {
  /**
   * 패널 내부 좌측 여백(px).
   * @default 48
   */
  panelPaddingLeft?: number
  /**
   * 패널 내부 우측 여백(px).
   * @default 48
   */
  panelPaddingRight?: number
  /**
   * 대화창 상단(패널 안쪽 위)에서 화자명 상단까지의 거리(px).
   * @default 24
   */
  panelPaddingTop?: number
  /**
   * 대화창 하단 패딩(px).
   * @default 24
   */
  panelPaddingBottom?: number
  /**
   * 화자명과 대사 텍스트 사이 간격(px).
   * @default 8
   */
  speakerTextGap?: number
}

/** dialogueModule이 공유하는 데이터 스키마 */
export interface DialogueSchema {
  /** 대화창 전체 패널 스타일 (권장) */
  style?: Partial<Style> & { height?: number }
  /** 대화창 배경 패널 스타일 */
  bg?: Partial<Style> & { height?: number }
  /** 화자(캐릭터 이름) 텍스트 스타일 */
  speaker?: Partial<Style>
  /** 대사 텍스트 스타일 */
  text?: Partial<Style>
  /** 내부 간격 레이아웃. `defineInitial`로 씬 전체에 적용 가능 */
  layout?: DialogueLayout
  // ─── 런타임 상태 ───────────────────────────────────────────
  /** @internal 현재 텍스트 서브 인덱스 */
  _subIndex: number
  /** @internal 현재 대사 줄 목록 */
  _lines: string[]
  /** @internal 현재 화자 키 */
  _speakerKey: string | undefined
  /** @internal 현재 타이핑 속도(ms) */
  _speed: number | undefined
}

// ─── 기본값 ──────────────────────────────────────────────────

export const DEFAULT_DIALOGUE_BG: Partial<Style> = {
  color: 'rgba(0,0,0,0.82)',
}

export const DEFAULT_DIALOGUE_SPEAKER: Partial<Style> = {
  fontSize: 18, fontWeight: 'bold', color: '#ffe066',
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
}

export const DEFAULT_DIALOGUE_TEXT: Partial<Style> = {
  fontSize: 20, color: '#ffffff', lineHeight: 1.6,
  fontFamily: '"Noto Sans KR","Malgun Gothic",sans-serif',
  textAlign: 'left',
  textShadowBlur: 1, textShadowColor: '#000000', textShadowOffsetX: 1, textShadowOffsetY: 1,
}

export const DEFAULT_DIALOGUE_LAYOUT: Required<DialogueLayout> = {
  panelPaddingLeft: 48,
  panelPaddingRight: 48,
  panelPaddingTop: 24,
  panelPaddingBottom: 24,
  speakerTextGap: 8,
}

// ─── 화자 이름 해석 헬퍼 ────────────────────────────────────

function resolveSpeaker(speakerKey: string | undefined, charDefs: CharDefs): string | undefined {
  if (!speakerKey) return undefined
  return charDefs?.[speakerKey]?.name ?? speakerKey
}

// ─── DialogueCmd 타입 ─────────────────────────────────────

/**
 * 대사 또는 나레이션 출력
 *
 * @example
 * { type: 'dialogue', speaker: 'hero', text: 'Hello world!', speed: 50 }
 * // 또는 나레이션
 * { type: 'dialogue', text: ['첫 번째 줄', '두 번째 줄'] }
 */
export interface DialogueCmd<TConfig = any> {
  /**
   * 화자의 이름 (config.characters의 키).
   * 생략할 경우 화자 이름 없이 나레이션으로 처리됩니다.
   */
  speaker?: CharacterKeysOf<TConfig> | (string & {})
  /** 화면에 출력할 텍스트입니다. 배열일 경우 여러 줄로 출력될 수 있습니다. */
  text: string | string[]
  /**
   * 텍스트가 한 글자씩 출력되는 속도(ms 단위)입니다.
   * 미지정 시 시스템 설정 속도 또는 기본값(예: 30ms)이 사용됩니다.
   */
  speed?: number
}

// ─── 모듈 정의 ───────────────────────────────────────────────

/**
 * 대화 모듈. `novel.config`의 `modules: { 'dialogue': dialogueModule }` 형태로 등록합니다.
 *
 * @example
 * // novel.config.ts
 * modules: { 'dialogue': dialogueModule }
 *
 * // scene (initial 사용)
 * defineScene({ config, initial: { 'dialogue': { bg: { height: 168 } } } }, [...])
 */
const dialogueModule = define<DialogueCmd<any>, DialogueSchema, DialogueHook>({
  style: undefined,
  bg: DEFAULT_DIALOGUE_BG,
  speaker: DEFAULT_DIALOGUE_SPEAKER,
  text: DEFAULT_DIALOGUE_TEXT,
  layout: DEFAULT_DIALOGUE_LAYOUT,
  _subIndex: 0,
  _lines: [],
  _speakerKey: undefined,
  _speed: undefined,
})

dialogueModule.defineView((ctx, data, setState) => {
  const cam = ctx.world.camera
  const w = ctx.renderer.width
  const h = ctx.renderer.height

  const toLocal = (cx: number, cy: number) =>
    (cam && typeof cam.canvasToLocal === 'function')
      ? cam.canvasToLocal(cx, cy)
      : { x: cx - w / 2, y: -(cy - h / 2), z: cam?.attribute?.focalLength ?? 100 }

  // 스타일 병합
  const bgCfg = (data.style ?? data.bg ?? DEFAULT_DIALOGUE_BG) as Style
  const spkCfg = (data.speaker ?? DEFAULT_DIALOGUE_SPEAKER) as Style
  const txtCfg = (data.text ?? DEFAULT_DIALOGUE_TEXT) as Style

  // 레이아웃 병합
  const layoutCfg: Required<DialogueLayout> = { ...DEFAULT_DIALOGUE_LAYOUT, ...(data.layout ?? {}) }

  const BOX_H = typeof bgCfg.height === 'number' ? bgCfg.height : h * 0.28
  const BOX_CY = h - BOX_H / 2
  const TEXT_W = w - layoutCfg.panelPaddingLeft - layoutCfg.panelPaddingRight
  const baseX = w / 2 + (layoutCfg.panelPaddingLeft - layoutCfg.panelPaddingRight) / 2

  // 대화창 배경
  const bgObj = ctx.world.createRectangle({
    style: {
      ...bgCfg,
      width: bgCfg.width ?? w,
      height: BOX_H,
      zIndex: bgCfg.zIndex ?? Z_INDEX.UI_BASE,
      opacity: 1,
      display: 'none',
      pointerEvents: false,
    },
    transform: { position: toLocal(w / 2, BOX_CY) },
  })
  ctx.world.camera?.addChild(bgObj)

  // 화자 이름창
  const spkY = h - BOX_H + layoutCfg.panelPaddingTop
  const speakerObj = ctx.world.createText({
    attribute: { text: '' },
    style: {
      ...spkCfg,
      width: spkCfg.width ?? TEXT_W,
      zIndex: spkCfg.zIndex ?? Z_INDEX.UI_BASE + 1,
      opacity: 1,
      display: 'none',
      pointerEvents: false,
    },
    transform: {
      pivot: { x: 0.5, y: 0 },
      position: toLocal(baseX, spkY)
    },
  })
  ctx.world.camera?.addChild(speakerObj)

  // 대사 텍스트창
  const spkH = (spkCfg.fontSize ?? 18) * 1.5
  const textObj = ctx.world.createText({
    attribute: { text: '' },
    style: {
      ...txtCfg,
      width: txtCfg.width ?? TEXT_W,
      zIndex: txtCfg.zIndex ?? Z_INDEX.UI_BASE + 1,
      opacity: 1,
      display: 'none',
      pointerEvents: false,
    },
    transform: {
      pivot: { x: 0.5, y: 0 },
      position: toLocal(baseX, spkY + spkH + layoutCfg.speakerTextGap)
    },
  })
  ctx.world.camera?.addChild(textObj)

  const charDefs = ctx.renderer.config.characters

  // 타이핑 상태
  let _isTyping = false
  let _fullText = ''
  let _activeTx: any = null
  // 반응형 중복 렌더 방지: 이전 lines 참조 및 서브 인덱스를 추적
  let _prevLines: string[] | null = null
  let _prevSubIndex: number = -1
  let _isActive = false

  const _renderText = (
    speaker: string | undefined,
    text: string,
    speed?: number,
    immediate = false
  ) => {
    // 'dialogue:text' 훅 방출 — 외부에서 speaker/text 변환 가능
    const resolved = dialogueModule.hooker.trigger(
      'dialogue:text-render',
      { speaker, text },
      (value) => value
    )
    const resolvedSpeaker = resolved.speaker
    const resolvedText = resolved.text
    _isActive = true

    // 배경 페이드인
    bgObj.fadeIn(200, 'easeOut')

    // 화자
    speakerObj.attribute.text = resolvedSpeaker ?? ''
    speakerObj.fadeIn(200, 'easeOut')

    // 대사 — 즉시 or 타이핑
    if (immediate || speed === 0) {
      _isTyping = false
      _fullText = resolvedText
      _activeTx?.stop?.()
      _activeTx = null
      textObj.attribute.text = resolvedText
      textObj.fadeIn(200, 'easeOut')
    } else {
      const spd = speed ?? 30
      _isTyping = true
      _fullText = resolvedText
      if (_activeTx) {
        _activeTx.stop();
        _activeTx = null
      }
      const anim = textObj.transition(resolvedText, spd)
      _activeTx = anim
      textObj.fadeIn(200, 'easeOut')
      if (anim && typeof anim.on === 'function') {
        anim.on('end', () => {
          _isTyping = false
          _activeTx = null
        })
      }
    }
  }

  // 복원: 로드 시 저장된 대사 즉시 렌더링
  if (data._lines?.length) {
    _prevLines = data._lines
    _prevSubIndex = data._subIndex ?? 0
    const txt = data._lines[data._subIndex ?? 0] as string
    const spkName = resolveSpeaker(data._speakerKey, charDefs)
    _renderText(spkName, txt, undefined, true)
  }

  return {
    show: (dur = 250) => {
      if (_isActive) {
        bgObj.fadeIn(dur, 'easeOut')
        speakerObj.fadeIn(dur, 'easeOut')
        textObj.fadeIn(dur, 'easeOut')
      }
    },
    onCleanup: () => {
      _isActive = false
      _activeTx?.stop?.()
      _activeTx = null
      bgObj.remove({ child: true })
      speakerObj.remove({ child: true })
      textObj.remove({ child: true })
    },
    hide: (dur = 300) => {
      if (_isActive) {
        bgObj.fadeOut(dur, 'easeIn')
        speakerObj.fadeOut(dur, 'easeIn')
        textObj.fadeOut(dur, 'easeIn')
      }
    },

    // ─── 입력 역할 선언 ─────────────────────────────────
    uiGroup: 'dialogue',

    /**
     * novel.next() 호출 시 타이핑 완성 여부 판단.
     * - 타이핑 중: 즉시 완성 후 false 반환 (next() 중단)
     * - 타이핑 완료: true 반환 (진행 가능)
     */
    canAdvance: () => {
      if (_isTyping) {
        _isTyping = false
        _activeTx?.stop?.()
        _activeTx = null
        textObj.attribute.text = _fullText
        textObj.style.opacity = 1
        return false
      }
      return true
    },

    /**
     * setState를 통해 data가 변경될 때 엔진이 자동으로 호출합니다.
     */
    onUpdate: (_ctx, state, _setState) => {
      // 스타일 갱신
      const newBgCfg = (state.style ?? state.bg ?? DEFAULT_DIALOGUE_BG) as Style
      const newSpkCfg = (state.speaker ?? DEFAULT_DIALOGUE_SPEAKER) as Style
      const newTxtCfg = (state.text ?? DEFAULT_DIALOGUE_TEXT) as Style
      const newLayoutCfg: Required<DialogueLayout> = { ...DEFAULT_DIALOGUE_LAYOUT, ...(state.layout ?? {}) }
      const newTextW = w - newLayoutCfg.panelPaddingLeft - newLayoutCfg.panelPaddingRight

      Object.assign(bgObj.style, newBgCfg)
      Object.assign(speakerObj.style, { ...newSpkCfg, width: newSpkCfg.width ?? newTextW })
      Object.assign(textObj.style, { ...newTxtCfg, width: newTxtCfg.width ?? newTextW })

      // 동적 레이아웃 위치 갱신
      const newBoxH = typeof newBgCfg.height === 'number' ? newBgCfg.height : h * 0.28
      const newBoxCY = h - newBoxH / 2
      const newSpkY = h - newBoxH + newLayoutCfg.panelPaddingTop
      const newSpkH = (newSpkCfg.fontSize ?? 18) * 1.5
      const baseX = w / 2 + (newLayoutCfg.panelPaddingLeft - newLayoutCfg.panelPaddingRight) / 2

      bgObj.style.height = newBoxH
      const bgPos = toLocal(w / 2, newBoxCY)
      bgObj.transform.position.x = bgPos.x
      bgObj.transform.position.y = bgPos.y

      const spkPos = toLocal(baseX, newSpkY)
      speakerObj.transform.position.x = spkPos.x
      speakerObj.transform.position.y = spkPos.y

      const txtPos = toLocal(baseX, newSpkY + newSpkH + newLayoutCfg.speakerTextGap)
      textObj.transform.position.x = txtPos.x
      textObj.transform.position.y = txtPos.y

      // 텍스트 갱신: _lines 참조 또는 _subIndex가 바뀐 경우에만 렌더 (중복 방지)
      if (state._lines && state._lines.length > 0 && (state._lines !== _prevLines || state._subIndex !== _prevSubIndex)) {
        _prevLines = state._lines
        _prevSubIndex = state._subIndex ?? 0
        const txt = state._lines[state._subIndex ?? 0] as string
        const spkName = resolveSpeaker(state._speakerKey, charDefs)
        _renderText(spkName, txt, state._speed)
      }
    },
  }
})

dialogueModule.defineCommand(function* (cmd, ctx, state, setState) {
  const textArray = Array.isArray(cmd.text) ? cmd.text : [cmd.text]
  const lines = textArray.map(t => ctx.scene.interpolateText(t))
  const charDefs = ctx.renderer.config.characters

  for (let index = 0; index < lines.length; index++) {
    const speaker = resolveSpeaker(cmd.speaker as string | undefined, charDefs)
    const text = lines[index] as string
    setState({
      _speed: cmd.speed,
      _speakerKey: cmd.speaker as string | undefined,
      _subIndex: index,
      _lines: [...lines],
    })

    // 'dialogue:text-run' 훅 방출
    dialogueModule.hooker.trigger('dialogue:text-run', { speaker, text }, (value) => value)

    ctx.scene.setTextSubIndex(index + 1)

    // 타이핑 완료 또는 사용자 입력 대기
    // 타이핑 중 클릭 시 canAdvance()에서 자동 처리
    yield false
  }

  return true
})

export default dialogueModule
