// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { CharDefs, BgDefs } from './config'

// ─── 프리셋 타입 ────────────────────────────────────────────

export type MoodType =
  | 'day' | 'night' | 'dawn' | 'sunset'
  | 'foggy' | 'sepia' | 'cold' | 'noir'
  | 'horror' | 'flashback' | 'dream' | 'danger' | 'none'

export type LightPreset  = 'spot' | 'ambient' | 'warm' | 'cold'
export type FlickerPreset = 'candle' | 'flicker' | 'strobe'
export type OverlayPreset = 'caption' | 'title' | 'whisper'
export type EffectType   = 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies'
export type ZoomPreset   = 'close-up' | 'medium' | 'wide' | 'reset'
export type PanPreset    = 'left' | 'right' | 'up' | 'down' | 'center'
export type CameraEffectPreset = 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall'
export type BackgroundFitPreset = 'stretch' | 'contain' | 'cover'
export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia'
export type FlashPreset  = 'white' | 'red' | 'yellow'
export type WipePreset   = 'left' | 'right' | 'up' | 'down'

/** 캐릭터 위치: 프리셋 또는 'n/m' 분수 형식 */
export type CharacterPositionPreset =
  | 'far-left' | 'left' | 'center' | 'right' | 'far-right'
  | (string & {})

// ─── 스토리 흐름 커맨드 ───────────────────────────────────────

/** 대사 또는 나레이션 출력 */
export interface DialogueCmd<TCharacters extends CharDefs> {
  type: 'dialogue'
  /** config characters 키. 생략 시 나레이션으로 처리 */
  speaker?: keyof TCharacters & string
  text: string
}

/** 선택지를 표시하고 분기한다 */
export interface ChoiceCmd<TVars, TScenes extends readonly string[]> {
  type: 'choice'
  choices: {
    text: string
    /** 이동할 씬 이름 */
    next?: TScenes[number]
    /** 같은 씬 내 label 이름 */
    goto?: string
    /** 선택 시 전역 변수 설정 */
    var?: Partial<Record<keyof TVars, any>>
  }[]
}

/** 변수 조건에 따라 분기한다 */
export interface ConditionCmd<TVars, TScenes extends readonly string[]> {
  type: 'condition'
  /**
   * 조건식 문자열.
   * - 단순 비교: `'likeability >= 10'`
   * - 불리언 체크: `'metCharacterA'`
   * - 복합: `'likeability >= 10 and metCharacterA'`
   * - 지원 연산자: `=`, `==`, `===`, `!=`, `>`, `>=`, `<`, `<=`, `and`, `or`, `&&`, `||`
   */
  if: string
  /** 조건 충족 시 이동할 씬 이름 */
  next?: TScenes[number]
  /** 조건 충족 시 이동할 label 이름 */
  goto?: string
  /**
   * 조건 미충족 시 이동할 label 이름 또는 씬 이름.
   * label 이름으로 먼저 찾고, 없으면 씬 이름으로 처리합니다.
   */
  else?: string
  /** 조건 미충족 시 이동할 씬 이름 (elsegoto와 구분) */
  'else-next'?: TScenes[number]
}

/** 변수 값을 설정한다 */
export interface VarCmd<TVars> {
  type: 'var'
  /** config vars 키 (전역) 또는 지역변수 이름 */
  name: keyof TVars | (string & {})
  value: any
  /**
   * 변수 범위.
   * - 'global': Novel 인스턴스 전체에 유지 (기본값)
   * - 'local': 현재 씬에서만 유효. 씬 전환 시 초기화
   */
  scope?: 'global' | 'local'
}

/** 루프 또는 goto 이동을 위한 마커 */
export interface LabelCmd {
  type: 'label'
  name: string
}

// ─── 렌더 제어 커맨드 ────────────────────────────────────────

/** 배경을 전환한다 */
export interface BackgroundCmd<TBackgrounds extends BgDefs> {
  type: 'background'
  name: keyof TBackgrounds & string
  fit?: BackgroundFitPreset
  /** 크로스페이드 시간(ms). 기본값: 1000 */
  duration?: number
  /** 배경을 video로 처리. 기본값: false */
  isVideo?: boolean
}

/** 화면 분위기 오버레이를 설정한다 */
export interface MoodCmd {
  type: 'mood'
  mood: MoodType
  /** 불투명도 (0~1). 기본값: 1 */
  intensity?: number
  /** 전환 시간(ms). 기본값: 800 */
  duration?: number
}

/** 파티클 이펙트를 추가하거나 제거한다 */
export interface EffectCmd {
  type: 'effect'
  action: 'add' | 'remove'
  effect: EffectType
  /** 파티클 생성 속도. action: 'add' 일 때만 유효 */
  rate?: number
  /** 제거 시 페이드아웃 시간(ms). action: 'remove' 일 때만 유효 */
  duration?: number
}

/** 조명 이펙트를 추가하거나 제거한다 */
export interface LightCmd {
  type: 'light'
  action: 'add' | 'remove'
  preset: LightPreset
  /** 제거 시 페이드아웃 시간(ms). action: 'remove' 일 때만 유효 */
  duration?: number
}

/** 조명에 깜빡임 효과를 적용한다 */
export interface FlickerCmd {
  type: 'flicker'
  light: LightPreset
  flicker: FlickerPreset
}

/** 텍스트 오버레이를 추가, 제거, 전체 제거한다 */
export interface OverlayCmd {
  type: 'overlay'
  action: 'add' | 'remove' | 'clear'
  /** action: 'add' 일 때 필수 */
  text?: string
  preset?: OverlayPreset
  /** 제거 시 페이드아웃 시간(ms) */
  duration?: number
}

// ─── 캐릭터 제어 커맨드 ─────────────────────────────────────

/** 캐릭터를 등장 또는 이동시킨다 */
export interface CharacterShowCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string> {
  type: 'character'
  action: 'show'
  name: TName
  position?: CharacterPositionPreset
  image?: keyof TCharacters[TName] & string
}

/** 캐릭터를 퇴장시킨다 */
export interface CharacterRemoveCmd<TCharacters extends CharDefs> {
  type: 'character'
  action: 'remove'
  name: keyof TCharacters & string
  /** 페이드아웃 시간(ms). 기본값: 600 */
  duration?: number
}

export type CharacterCmd<TCharacters extends CharDefs> =
  | { [K in keyof TCharacters & string]: CharacterShowCmd<TCharacters, K> }[keyof TCharacters & string]
  | CharacterRemoveCmd<TCharacters>

/** 카메라를 캐릭터에 포커스한다 */
export interface CharacterFocusCmd<TCharacters extends CharDefs> {
  type: 'character-focus'
  name: keyof TCharacters & string
  /** characters[name][image].points 키 */
  point?: string
  zoom?: ZoomPreset
  /** 기본값: 800 */
  duration?: number
}

/** 캐릭터를 컷인(전면) 레이어로 올리거나 복원한다 */
export interface CharacterHighlightCmd<TCharacters extends CharDefs> {
  type: 'character-highlight'
  name: keyof TCharacters & string
  action: 'on' | 'off'
}

// ─── 카메라 제어 커맨드 ─────────────────────────────────────

/** 카메라를 줌한다 */
export interface CameraZoomCmd {
  type: 'camera-zoom'
  preset: ZoomPreset
  duration?: number
}

/** 카메라를 패닝한다 */
export interface CameraPanCmd {
  type: 'camera-pan'
  preset: PanPreset
  duration?: number
}

/** 카메라 흔들림 등 연출 효과를 재생한다 */
export interface CameraEffectCmd {
  type: 'camera-effect'
  preset: CameraEffectPreset
  duration?: number
  intensity?: number
}

// ─── 화면 전환 커맨드 ────────────────────────────────────────

/** 화면을 페이드인/아웃한다 */
export interface ScreenFadeCmd {
  type: 'screen-fade'
  dir: 'in' | 'out'
  preset?: FadeColorPreset
  /** 기본값: 600 */
  duration?: number
}

/** 화면을 순간 플래시한다 */
export interface ScreenFlashCmd {
  type: 'screen-flash'
  preset?: FlashPreset
}

/** 화면을 와이프 전환한다 */
export interface ScreenWipeCmd {
  type: 'screen-wipe'
  dir: 'in' | 'out'
  preset?: WipePreset
  /** 기본값: 800 */
  duration?: number
}

// ─── UI 제어 커맨드 ─────────────────────────────────────────

/** 정의된 UI 요소를 페이드인/아웃한다 */
export interface UICmd {
  type: 'ui'
  name: string
  action: 'show' | 'hide'
  /** 기본값: 800 */
  duration?: number
}

// ─── 전체 DialogueEntry 유니온 ─────────────────────────────

type _DialogueEntryUnion<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
> =
  | DialogueCmd<TCharacters>
  | ChoiceCmd<TVars, TScenes>
  | ConditionCmd<TVars, TScenes>
  | VarCmd<TVars>
  | LabelCmd
  | BackgroundCmd<TBackgrounds>
  | MoodCmd
  | EffectCmd
  | LightCmd
  | FlickerCmd
  | OverlayCmd
  | CharacterCmd<TCharacters>
  | CharacterFocusCmd<TCharacters>
  | CharacterHighlightCmd<TCharacters>
  | CameraZoomCmd
  | CameraPanCmd
  | CameraEffectCmd
  | ScreenFadeCmd
  | ScreenFlashCmd
  | ScreenWipeCmd
  | UICmd

export type DialogueEntry<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
> = _DialogueEntryUnion<TVars, TScenes, TCharacters, TBackgrounds> & {
  /** true일 경우, 사용자 입력을 기다리지 않고 즉시 다음 스텝으로 넘어갑니다. */
  skip?: boolean
}

export type DialogueStep<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
> = DialogueEntry<TVars, TScenes, TCharacters, TBackgrounds>
