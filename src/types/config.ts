// =============================================================
// config.ts — Novel config 기반 타입 정의
// =============================================================

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
  canvas: HTMLCanvasElement
  /** 씬 논리 너비 (px). 기본값: canvas.width */
  width?: number
  /** 씬 논리 높이 (px). 기본값: canvas.height */
  height?: number
  /** 씬 깊이 (px). 기본값: 500 */
  depth?: number
}
