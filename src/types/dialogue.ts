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
export type ZoomPreset   = 'close-up' | 'medium' | 'wide' | 'reset' | 'inherit'
export type PanPreset    = 'left' | 'right' | 'up' | 'down' | 'center' | 'inherit'
export type CameraEffectPreset = 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall' | 'reset'
export type BackgroundFitPreset = 'stretch' | 'contain' | 'cover' | 'inherit'
export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia' | 'inherit'
export type FlashPreset  = 'white' | 'red' | 'yellow' | 'inherit'
export type WipePreset   = 'left' | 'right' | 'up' | 'down' | 'inherit'

/** 캐릭터 위치: 프리셋 또는 'n/m' 분수 형식. 'inherit' = 현재 위치 유지 */
export type CharacterPositionPreset =
  | 'far-left' | 'left' | 'center' | 'right' | 'far-right' | 'inherit'
  | (string & {})

// ─── 스토리 흐름 커맨드 ───────────────────────────────────────

/** 대사 또는 나레이션 출력 */
export interface DialogueCmd<TCharacters extends CharDefs> {
  type: 'dialogue'
  /** config characters 키. 생략 시 나레이션으로 처리 */
  speaker?: keyof TCharacters & string
  text: string | string[]
  /** 텍스트 출력 속도 (ms). 기본값: 설정된 속도 또는 30 */
  speed?: number
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
  /** 트랜지션 시간(ms) */
  duration?: number
  /**
   * 등장과 동시에 카메라 포커스를 수행할지 여부.
   * `true`일 경우 기본 포인트를 사용하며, 문자열 지정 시 해당 포인트에 포커스합니다.
   * 이는 `{ type: 'character-focus' }` 를 연달아 사용하는 것과 같은 효과입니다.
   */
  focus?: boolean | PointsOf<TCharacters, TName> | (string & {})
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

/**
 * TName 캐릭터의 모든 이미지에 걸친 points 키 합집합을 추출한다.
 * 예: { normal: { points: { face, chest } }, smile: { points: { face } } } → 'face' | 'chest'
 */
type PointsOf<TCharacters extends CharDefs, TName extends keyof TCharacters> = {
  [IK in keyof TCharacters[TName]]: TCharacters[TName][IK] extends { points?: infer P }
    ? P extends Record<string, any> ? keyof P & string : never
    : never
}[keyof TCharacters[TName]]

/** 카메라를 캐릭터에 포커스한다 */
export interface CharacterFocusCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string = keyof TCharacters & string> {
  type: 'character-focus'
  name: TName
  /** characters[name][*].points 키. novel.config에서 정의된 값으로 자동완성됩니다. */
  point?: PointsOf<TCharacters, TName> | (string & {})
  zoom?: ZoomPreset
  /** 기본값: 800 */
  duration?: number
}

/** 캐릭터를 컷인(전면) 레이어로 올리거나 복원한다 */
export interface CharacterHighlightCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string = keyof TCharacters & string> {
  type: 'character-highlight'
  name: TName
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
  /** 지정된 횟수만큼 반복. 음수일 경우 무한반복. 기본값은 1 */
  repeat?: number
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
  | { [K in keyof TCharacters & string]: CharacterFocusCmd<TCharacters, K> }[keyof TCharacters & string]
  | { [K in keyof TCharacters & string]: CharacterHighlightCmd<TCharacters, K> }[keyof TCharacters & string]
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

// ─── Fallback 룰 ─────────────────────────────────────────────

/**
 * novel.config `fallback` 배열의 항목 타입.
 *
 * `type` 필드가 discriminant 역할을 합니다.
 * `type` 및 기타 커맨드 필드는 **매칭 조건**이 되고,
 * `defaults` 필드에 채워 넣을 기본값을 지정합니다.
 *
 * 구체적인 규칙(필드가 많은 것)을 배열 앞에, 범용 규칙을 뒤에 두세요.
 * (위에 있을수록 우선순위가 높습니다.)
 *
 * @example
 * ```ts
 * fallback: [
 *   { type: 'character', action: 'show', position: 'left', defaults: { duration: 800 } },
 *   { type: 'character', action: 'show',                   defaults: { duration: 1000, image: 'normal' } },
 *   { type: 'character', action: 'remove',                 defaults: { duration: 800 } },
 *   { type: 'background',                                  defaults: { duration: 1000 } },
 * ]
 * ```
 */
type _AnyCmd = _DialogueEntryUnion<any, readonly string[], any, any>

export type FallbackRule = _AnyCmd extends infer E
  ? E extends { type: infer Type }
    ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
    : never
  : never
