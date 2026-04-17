// =============================================================
// config.ts — Novel config 기반 타입 정의
// =============================================================

import type { Style } from 'leviar'

/** 단일 캐릭터 이미지 변형 정의 */
export interface CharImageDef {
  /** 에셋 키 또는 경로 */
  src?: string
  /** 캐릭터 기본 너비 (px) */
  width?: number
  /** 포커스 포인트 (0~1 정규화). x: 좌→우, y: 위→아래 */
  points?: Record<string, { x: number; y: number }>
}

/** 단일 캐릭터 정의: imageKey → CharImageDef 매핑 */
export type CharDef = Record<string, CharImageDef>
export type CharDefs = Record<string, CharDef>

/** 단일 배경 정의 */
export interface BgDef {
  src: string
  /**
   * 패럴럭스 모드. 기본값: true
   * - true  : 월드 Z-depth에 배치. 카메라 이동 시 약간 느리게 따라움직임
   * - false : 카메라의 자식으로 부착 (항상 화면 고정)
   */
  parallax?: boolean
}
export type BgDefs = Record<string, BgDef>

// ─── UI 스타일 타입 ──────────────────────────────────────────

/** 선택지 버튼 스타일 (HTML 기반이라 별도 관리) */
export interface UIChoiceStyle {
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

/**
 * NovelOption.ui에서 설정 가능한 전체 UI 스타일.
 * dialogueBg / speaker / dialogue / overlay 는 Leviar의 Style 속성을 직접 사용합니다.
 * 각 필드는 선택적(optional)이며, 미지정 시 기본값이 사용됩니다.
 *
 * @example
 * ```ts
 * new Novel(config, {
 *   ui: {
 *     dialogueBg: { color: 'rgba(8,8,20,0.88)', height: 168 },
 *     speaker:    { fontSize: 17, fontWeight: 'bold', color: '#ffd966' },
 *     dialogue:   { fontSize: 18, color: '#f0f0f0', lineHeight: 1.65 },
 *   }
 * })
 * ```
 */
export interface NovelUIOption {
  /**
   * 대화창 배경 패널 — Leviar Style 속성.
   * `height` 미지정 시 캔버스 높이의 28%가 사용됩니다.
   */
  dialogueBg?: Partial<Style>
  /** 화자 이름창 텍스트 — Leviar Style 속성 */
  speaker?:    Partial<Style>
  /** 대사 텍스트창 — Leviar Style 속성 */
  dialogue?:   Partial<Style>
  /** 선택지 버튼 (HTML 기반) */
  choice?:     UIChoiceStyle
  /** 오버레이 텍스트 (caption / title / whisper) — Leviar Style 속성 */
  overlay?: {
    caption?: Partial<Style>
    title?:   Partial<Style>
    whisper?: Partial<Style>
  }
}

// ─── Novel 최상위 config 타입 ────────────────────────────────

/** Novel 최상위 config 타입 */
export interface NovelConfig<
  TVars        extends Record<string, any>,
  TScenes      extends readonly string[],
  TCharacters  extends CharDefs,
  TBackgrounds extends BgDefs,
> {
  vars:        TVars
  scenes:      TScenes
  characters:  TCharacters
  backgrounds: TBackgrounds
}

/** Novel 초기화 옵션 */
export interface NovelOption {
  /** 렌더링에 사용할 캔버스 엘리먼트 */
  canvas:  HTMLCanvasElement
  /** 씬 논리 너비 (px). 기본값: canvas.width */
  width?:  number
  /** 씬 논리 높이 (px). 기본값: canvas.height */
  height?: number
  /** 씬 깊이 (px). 기본값: 500 */
  depth?:  number
  /** UI 스타일 커스터마이징. 미지정 필드는 기본값 사용 */
  ui?:     NovelUIOption
}
