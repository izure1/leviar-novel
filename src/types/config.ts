// =============================================================
// config.ts — Novel config 기반 타입 정의
// =============================================================

import type { World, Style, Attribute } from 'leviar'
import type { FallbackRule, FallbackRuleOf, EffectType } from './dialogue'
import type { SceneContext, CommandResult } from '../core/SceneContext'

/** 
 * 단일 캐릭터 이미지 변형 정의 
 * 
 * @example
 * ```ts
 * const heroNormal: CharImageDef = {
 *   src: 'hero_normal_img',
 *   width: 400,
 *   points: { head: { x: 0.5, y: 0.1 }, center: { x: 0.5, y: 0.5 } }
 * }
 * ```
 */
export interface CharImageDef {
  /** 
   * 캐릭터 이미지의 에셋 키 또는 파일 경로입니다. 
   */
  src?: string
  /** 
   * 캐릭터의 기본 렌더링 너비(px 단위)입니다. 
   */
  width?: number
  /** 
   * 캐릭터의 포커스 포인트 목록입니다. (0~1 사이 정규화된 값). 
   * x는 좌에서 우로, y는 위에서 아래로의 위치를 나타냅니다. 
   */
  points?: Record<string, { x: number; y: number }>
}

/** 
 * 단일 캐릭터 정의: imageKey → CharImageDef 매핑 
 * 
 * @example
 * ```ts
 * const heroDef: CharDef = {
 *   normal: { src: 'hero_normal' },
 *   angry: { src: 'hero_angry' }
 * }
 * ```
 */
export interface CharDef {
  /** 캐릭터의 표시용 이름 (대사창 등에 사용) */
  name?: string
  /** 캐릭터의 각 표정/상태별 이미지 정의 */
  points: Record<string, CharImageDef>
}
/** 캐릭터 목록 정의: charKey → CharDef 매핑 */
export type CharDefs = Record<string, CharDef>

/** 
 * 단일 배경 이미지 정의 
 * 
 * @example
 * ```ts
 * const skyBg: BgDef = {
 *   src: 'sky_img',
 *   parallax: true // 카메라 이동 시 원근감 적용
 * }
 * ```
 */
export interface BgDef {
  /** 
   * 배경 이미지의 에셋 키 또는 파일 경로입니다. 
   */
  src: string
  /**
   * 패럴럭스 스크롤 효과 활성화 여부입니다. 기본값은 `true`입니다.
   * - `true`  : 배경이 월드 좌표의 Z-depth에 배치되어, 카메라 이동 시 원근감에 따라 약간 느리게 움직입니다.
   * - `false` : 배경이 카메라의 자식 요소로 부착되어, 항상 화면에 고정된 상태로 표시됩니다.
   */
  parallax?: boolean
}
/** 배경 목록 정의: bgKey → BgDef 매핑 */
export type BgDefs = Record<string, BgDef>

// ─── UI 스타일 타입 ──────────────────────────────────────────

/** 선택지 버튼의 스타일 정의 (HTML 엘리먼트 기반 렌더링에 사용됩니다) */
export interface UIChoiceStyle {
  /** 선택지 텍스트의 폰트 크기(px 단위)입니다. */
  fontSize?:         number
  /** 선택지 텍스트의 폰트 종류(font-family)입니다. */
  fontFamily?:       string
  /** 선택지 텍스트의 색상(CSS 색상 값)입니다. */
  color?:            string
  /** 선택지 버튼의 기본 배경색(CSS 색상 값)입니다. */
  background?:       string
  /** 선택지 버튼의 기본 테두리 색상(CSS 색상 값)입니다. */
  borderColor?:      string
  /** 선택지 버튼에 마우스 호버 시 배경색(CSS 색상 값)입니다. */
  hoverBackground?:  string
  /** 선택지 버튼에 마우스 호버 시 테두리 색상(CSS 색상 값)입니다. */
  hoverBorderColor?: string
  /** 선택지 버튼의 테두리 둥글기(px 단위)입니다. */
  borderRadius?:     number
  /** 선택지 버튼의 최소 너비(px 단위)입니다. */
  minWidth?:         number
}

/**
 * Novel 설정의 UI 관련 옵션입니다.
 * dialogueBg, speaker, dialogue, overlay 등의 항목은 내부 엔진(Leviar)의 Style 속성을 직접 사용합니다.
 * 모든 필드는 선택적이며, 미지정 시 엔진 기본값이 사용됩니다.
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
   * 대화창 배경 패널의 스타일 설정입니다. (Leviar Style 속성 사용)
   * `height` 속성 미지정 시 캔버스 높이의 28%가 기본 적용됩니다.
   */
  dialogueBg?: Partial<Style>
  /** 화자(캐릭터 이름) 텍스트의 스타일 설정입니다. (Leviar Style 속성 사용) */
  speaker?:    Partial<Style>
  /** 대사 텍스트의 스타일 설정입니다. (Leviar Style 속성 사용) */
  dialogue?:   Partial<Style>
  /** 
   * 화면에 표시되는 선택지 버튼의 스타일 설정입니다. 
   * 캔버스 외부의 HTML/CSS로 렌더링 되므로 별도 스타일 인터페이스를 사용합니다.
   */
  choice?:     UIChoiceStyle
  /** 오버레이 텍스트(화면 전체 캡션, 타이틀, 귓속말 등)의 스타일 설정입니다. */
  overlay?: {
    /** 캡션 텍스트의 스타일 설정입니다. (Leviar Style 속성 사용) */
    caption?: Partial<Style>
    /** 타이틀 텍스트의 스타일 설정입니다. (Leviar Style 속성 사용) */
    title?:   Partial<Style>
    /** 귓속말 텍스트의 스타일 설정입니다. (Leviar Style 속성 사용) */
    whisper?: Partial<Style>
  }
}

/** 
 * 특수 효과(날씨, 파티클 등)의 상세 속성 정의입니다. 미지정 속성은 Renderer 내부 폴백 값을 따릅니다. 
 * 
 * @example
 * ```ts
 * const rainEffect: EffectDef = {
 *   clip: { interval: 2, lifespan: 60, size: [[2, 2], [2, 2]] },
 *   particle: { attribute: { src: 'raindrop', strictPhysics: true } }
 * }
 * ```
 */
export interface EffectDef {
  /** 
   * 파티클 매니저가 파티클을 방출할 때 사용하는 설정입니다. 
   * 클립(Clip) 객체의 속성으로 매핑됩니다.
   */
  clip?: Partial<{
    /** 방출 시 파티클에 가해지는 초기 물리 충격량(속도)입니다. */
    impulse: number
    /** 파티클의 생존 시간(프레임 단위)입니다. */
    lifespan: number
    /** 파티클 방출 주기(프레임 단위)입니다. 값이 작을수록 자주 방출됩니다. */
    interval: number
    /** 파티클 크기의 변화 범위입니다. (시작 크기부터 끝 크기까지 배열 형태) */
    size: [number, number][]
    /** 파티클 불투명도의 변화 범위입니다. (시작 불투명도부터 끝 불투명도까지 배열 형태) */
    opacity: [number, number][]
    /** 파티클 애니메이션 루프 여부입니다. */
    loop: boolean
    /** 방출 시 파티클에 가해지는 초기 회전 충격량(각속도)입니다. */
    angularImpulse: number
  }>
  /** 방출되어 화면에 렌더링 되는 개별 파티클 객체의 스타일 및 속성 설정입니다. */
  particle?: {
    /** 파티클 객체의 물리, 이미지 소스, 질량 등 기본 속성 설정입니다. */
    attribute?: Partial<Attribute & { src?: string; strictPhysics?: boolean }>
    /** 파티클 객체의 크기, 색상, 정렬 등 시각적 스타일 설정입니다. */
    style?: Partial<Style>
  }
}

/** 
 * 커스텀/내장 명령어 실행 시 제공되는 컨텍스트 객체 
 */
export interface CustomCmdContext<TVars = any, TLocalVars = any> {
  /** Leviar 엔진의 World 인스턴스 */
  world: World
  /** 게임의 전역 변수 목록 */
  globalVars: TVars
  /** 현재 진행 중인 씬의 지역 변수 목록 */
  localVars: TLocalVars
}

/** 
 * 명령어의 실행 로직을 정의하는 핸들러 함수입니다. 
 * true를 반환할 경우, 대사 진행 등을 대기하지 않고 다음 스텝으로 즉시 넘어갑니다 (skip).
 */
export type CustomCmdHandler<TParams = any, TVars = any, TLocalVars = any> = (
  params: TParams,
  context: SceneContext<TVars, TLocalVars>
) => CommandResult

/** 
 * Novel 시스템의 최상위 설정 객체 타입입니다.
 * 게임 내 모든 변수, 씬, 캐릭터, 배경, 효과, UI 스타일 및 폴백 규칙을 정의합니다.
 * 
 * @example
 * ```ts
 * const config: NovelConfig<MyVars, MyScenes, MyChars, MyBgs> = {
 *   vars: { score: 0, flags: [] },
 *   scenes: ['intro', 'chapter1'],
 *   characters: { hero: { normal: { src: 'hero_img' } } },
 *   backgrounds: { classroom: { src: 'class_img' } },
 *   assets: { hero_img: './assets/hero.png' }
 * }
 * ```
 */
export interface NovelConfig<
  TVars        extends Record<string, any>,
  TScenes      extends readonly string[],
  TCharacters  extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets      extends Record<string, string> = Record<string, string>,
  TCmds        extends Record<string, CustomCmdHandler<any, TVars, any>> = Record<string, CustomCmdHandler<any, TVars, any>>
> {
  /** 게임의 전역 변수 초기값 목록입니다. */
  vars:        TVars
  /** 게임에 포함된 모든 씬(Scene) 이름 목록입니다. */
  scenes:      TScenes
  /** 게임에 등장하는 모든 캐릭터의 정의 목록입니다. */
  characters:  TCharacters
  /** 게임에 사용되는 모든 배경 이미지 정의 목록입니다. */
  backgrounds: TBackgrounds
  /** 
   * 이펙트(비, 눈 등)의 상세 물리/시각적 설정 목록입니다. 
   * 미지정 시 렌더러(Renderer)의 기본값이 사용됩니다.
   */
  effects?:    Partial<Record<EffectType, EffectDef>>
  /** 
   * UI 구성요소(대화창, 선택지 등)의 스타일 설정 객체입니다. 
   * 미지정 필드는 엔진 기본값이 사용됩니다.
   */
  ui?:         NovelUIOption
  /** 
   * 에셋의 키와 경로 매핑 목록입니다. 
   * 엔진 초기화 시점에 이 경로를 바탕으로 에셋을 자동 로드합니다.
   */
  assets?:     TAssets
  /** 
   * 스크립트 실행 중 에셋이나 명령어가 누락되었을 때 적용할 기본값(폴백) 규칙 목록입니다. 
   * 배열의 첫 번째부터 순차적으로 매칭되어 적용됩니다.
   */
  fallback?:   FallbackRuleOf<TCmds>[]
  /**
   * 커스텀 명령어 핸들러 목록입니다.
   * 씬에서 지정한 `type`과 매칭되어 실행됩니다.
   */
  cmds?:       TCmds
}

export type { FallbackRule, FallbackRuleOf } from './dialogue'


/** 
 * Novel 인스턴스를 생성할 때 전달하는 초기화 옵션 객체입니다.
 * 
 * @example
 * ```ts
 * const option: NovelOption = {
 *   canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
 *   width: 1920,
 *   height: 1080
 * }
 * ```
 */
export interface NovelOption {
  /** 렌더링에 사용할 대상 캔버스(Canvas) HTML 엘리먼트입니다. */
  canvas:  HTMLCanvasElement
  /** 
   * 씬의 논리적 렌더링 너비(px 단위)입니다. 
   * 미지정 시 캔버스의 실제 크기(canvas.width)를 사용합니다.
   */
  width?:  number
  /** 
   * 씬의 논리적 렌더링 높이(px 단위)입니다. 
   * 미지정 시 캔버스의 실제 크기(canvas.height)를 사용합니다.
   */
  height?: number
  /** 
   * 씬의 Z-depth 최댓값(px 단위)입니다. 
   * 카메라와 오브젝트 간의 원근감 거리를 결정하며, 기본값은 500입니다.
   */
  depth?:  number
}
