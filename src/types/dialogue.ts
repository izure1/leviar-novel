// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { CharDefs, BgDefs } from './config'

// ─── 프리셋 타입 ────────────────────────────────────────────

export type MoodType =
  | 'day' | 'night' | 'dawn' | 'sunset'
  | 'foggy' | 'sepia' | 'cold' | 'noir'
  | 'horror' | 'flashback' | 'dream' | 'danger' | 'none'
  | 'spot' | 'ambient' | 'warm'

export type FlickerPreset = 'candle' | 'flicker' | 'strobe'
export type OverlayPreset = 'caption' | 'title' | 'whisper'
export type EffectType = 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies'
export type ZoomPreset = 'close-up' | 'medium' | 'wide' | 'reset' | 'inherit'
export type PanPreset = 'left' | 'right' | 'up' | 'down' | 'center' | 'inherit' | (string & {})
export type CameraEffectPreset = 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall' | 'reset'
export type BackgroundFitPreset = 'stretch' | 'contain' | 'cover' | 'inherit'
export type FadeColorPreset = 'black' | 'white' | 'red' | 'dream' | 'sepia' | 'inherit'
export type FlashPreset = 'white' | 'red' | 'yellow' | 'inherit'
export type WipePreset = 'left' | 'right' | 'up' | 'down' | 'inherit'

/** 캐릭터 위치: 프리셋 또는 'n/m' 분수 형식. 'inherit' = 현재 위치 유지 */
export type CharacterPositionPreset =
  | 'far-left' | 'left' | 'center' | 'right' | 'far-right' | 'inherit'
  | (string & {})

// ─── 스토리 흐름 커맨드 ───────────────────────────────────────

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
  /** 명령어 타입. 항상 'dialogue'입니다. */
  type: 'dialogue'
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

/** 
 * 선택지를 표시하고 분기한다 
 * 
 * @example
 * ```ts
 * {
 *   type: 'choice',
 *   choices: [
 *     { text: '싸운다', next: 'battle_scene', var: { courage: 10 } },
 *     { text: '도망친다', goto: 'run_away_label' }
 *   ]
 * }
 * ```
 */
export interface ChoiceCmd<TVars, TScenes extends readonly string[]> {
  /** 명령어 타입. 항상 'choice'입니다. */
  type: 'choice'
  /** 사용자에게 제공될 선택지 목록입니다. */
  choices: {
    /** 선택지 버튼에 표시될 텍스트입니다. */
    text: string
    /** 해당 선택지를 골랐을 때 이동할 씬(Scene)의 이름입니다. */
    next?: TScenes[number]
    /** 해당 선택지를 골랐을 때 이동할 현재 씬 내의 라벨(Label) 이름입니다. */
    goto?: string
    /** 해당 선택지를 골랐을 때 변경할 전역 변수들의 키-값 쌍입니다. */
    var?: Partial<Record<keyof TVars, any>>
  }[]
}

/** 
 * 변수 조건에 따라 분기한다 
 * 
 * @example
 * ```ts
 * {
 *   type: 'condition',
 *   if: 'courage >= 10 and hasSword',
 *   next: 'boss_battle',
 *   else: 'bad_ending'
 * }
 * ```
 */
export interface ConditionCmd<TVars, TScenes extends readonly string[]> {
  /** 명령어 타입. 항상 'condition'입니다. */
  type: 'condition'
  /**
   * 평가할 조건식 문자열입니다.
   * - 단순 비교: `'likeability >= 10'`
   * - 불리언 체크: `'metCharacterA'`
   * - 복합: `'likeability >= 10 and metCharacterA'`
   * - 지원 연산자: `=`, `==`, `===`, `!=`, `>`, `>=`, `<`, `<=`, `and`, `or`, `&&`, `||`
   */
  if: string
  /** 조건 충족 시(true) 이동할 씬 이름입니다. */
  next?: TScenes[number]
  /** 조건 충족 시(true) 이동할 현재 씬 내의 라벨 이름입니다. */
  goto?: string
  /**
   * 조건 미충족 시(false) 이동할 라벨 이름 또는 씬 이름입니다.
   * 현재 씬의 라벨 이름으로 먼저 검색하고, 없으면 씬 이름으로 처리합니다.
   */
  else?: string
  /** 
   * 조건 미충족 시(false) 명시적으로 이동할 씬 이름입니다. 
   * (라벨 이동과 씬 이동을 명확히 구분해야 할 때 사용합니다)
   */
  'else-next'?: TScenes[number]
}

/** 
 * 변수 값을 설정한다 
 * 
 * @example
 * ```ts
 * { type: 'var', name: 'score', value: 100, scope: 'global' }
 * ```
 */
export interface VarCmd<TVars> {
  /** 명령어 타입. 항상 'var'입니다. */
  type: 'var'
  /** 값을 변경할 변수의 이름입니다. (전역 변수 키 또는 지역 변수 이름) */
  name: keyof TVars | (string & {})
  /** 변수에 설정할 값입니다. */
  value: any
  /**
   * 변수가 유지되는 범위(Scope)입니다.
   * - 'global': Novel 인스턴스 전체 라이프사이클 동안 유지됩니다 (기본값).
   * - 'local': 현재 씬(Scene)에서만 유효하며, 씬이 전환될 때 초기화됩니다.
   */
  scope?: 'global' | 'local'
}

/** 
 * 루프 또는 goto 이동을 위한 마커 
 * 
 * @example
 * ```ts
 * { type: 'label', name: 'chapter1_start' }
 * ```
 */
export interface LabelCmd {
  /** 명령어 타입. 항상 'label'입니다. */
  type: 'label'
  /** 마커의 고유 이름입니다. `goto` 명령어 등에서 식별자로 사용됩니다. */
  name: string
}

// ─── 렌더 제어 커맨드 ────────────────────────────────────────

/** 
 * 배경을 전환한다 
 * 
 * @example
 * ```ts
 * { type: 'background', name: 'classroom', duration: 1500, fit: 'cover' }
 * ```
 */
export interface BackgroundCmd<TBackgrounds extends BgDefs> {
  /** 명령어 타입. 항상 'background'입니다. */
  type: 'background'
  /** 전환할 배경 이미지의 에셋 키(config.backgrounds에 정의됨)입니다. */
  name: keyof TBackgrounds & string
  /** 배경 이미지의 화면 맞춤 방식(stretch, cover 등)입니다. */
  fit?: BackgroundFitPreset
  /** 배경 전환 시 크로스페이드(Fade)되는 시간(ms 단위)입니다. (기본값: 1000) */
  duration?: number
  /** 대상 에셋을 비디오(video)로 처리할지 여부입니다. (기본값: false) */
  isVideo?: boolean
}

/** 
 * 화면 분위기 오버레이(무드, 조명)를 추가하거나 제거한다 
 * 
 * @example
 * ```ts
 * // 무드 추가
 * { type: 'mood', action: 'add', mood: 'sunset', intensity: 0.8, duration: 1000 }
 * // 무드 제거
 * { type: 'mood', action: 'remove', mood: 'sunset' }
 * // action이 없을 경우 모든 무드를 제거하고 현재 지정된 값으로 덮어쓰기
 * { type: 'mood', mood: 'sunset', intensity: 0.9 }
 * ```
 */
export type MoodCmd =
  | {
    /** 명령어 타입. 항상 'mood'입니다. */
    type: 'mood'
    /** 'remove'는 현재 활성화된 무드 효과를 제거합니다. */
    action: 'remove'
    /** 제거할 무드의 타입입니다. */
    mood: MoodType
    /** 효과가 제거되면서 페이드아웃 되는 시간(ms 단위)입니다. (기본값: 800) */
    duration?: number
  }
  | {
    /** 명령어 타입. 항상 'mood'입니다. */
    type: 'mood'
    /** 'add'는 새로운 무드 효과를 추가합니다. */
    action?: 'add'
    /** 추가할 무드의 타입입니다. */
    mood: MoodType
    /** 무드 레이어의 불투명도(0~1)입니다. (기본값: 1) */
    intensity?: number
    /** 효과가 추가되면서 페이드인 되는 시간(ms 단위)입니다. (기본값: 800) */
    duration?: number
    /** 무드 레이어에 깜빡임(flicker) 애니메이션을 적용할 프리셋입니다. */
    flicker?: FlickerPreset
  }

/** 
 * 파티클 이펙트를 추가하거나 제거한다 
 * 
 * @example
 * ```ts
 * { type: 'effect', action: 'add', effect: 'rain', src: 'raindrop', rate: 10 }
 * // 또는 제거
 * { type: 'effect', action: 'remove', effect: 'rain', duration: 500 }
 * ```
 */
export type EffectCmd<TAssets extends Record<string, string> = Record<string, string>> =
  | {
    /** 명령어 타입. 항상 'effect'입니다. */
    type: 'effect'
    /** 'add'는 화면에 새로운 파티클 효과를 추가합니다. */
    action: 'add'
    /** 추가할 이펙트의 프리셋 종류(눈, 비 등)입니다. */
    effect: EffectType
    /** 파티클로 렌더링 할 에셋의 키 (config.assets에 정의된 키)입니다. */
    src: keyof TAssets & string
    /** 파티클의 생성 빈도(속도) 배율입니다. 높을수록 많이 생성됩니다. */
    rate?: number
  }
  | {
    /** 명령어 타입. 항상 'effect'입니다. */
    type: 'effect'
    /** 'remove'는 현재 활성화된 파티클 효과를 중단하고 제거합니다. */
    action: 'remove'
    /** 제거할 이펙트의 프리셋 종류입니다. */
    effect: EffectType
    /** 이펙트가 서서히 사라지는 페이드아웃 시간(ms 단위)입니다. */
    duration?: number
  }



/** 텍스트 오버레이를 추가, 제거, 전체 제거한다 */
export interface OverlayCmd {
  /** 명령어 타입. 항상 'overlay'입니다. */
  type: 'overlay'
  /** 수행할 동작: 'add'(추가), 'remove'(지정 항목 제거), 'clear'(모두 제거). */
  action: 'add' | 'remove' | 'clear'
  /** 화면에 표시할 텍스트입니다. (action이 'add'일 때 필수) */
  text?: string
  /** 텍스트 오버레이의 스타일 프리셋(캡션, 타이틀 등)입니다. */
  preset?: OverlayPreset
  /** 'remove' 또는 'clear' 시 텍스트가 페이드아웃 되는 시간(ms 단위)입니다. */
  duration?: number
}

// ─── 캐릭터 제어 커맨드 ─────────────────────────────────────

/** 
 * 캐릭터를 등장 또는 이동시킨다 
 * 
 * @example
 * ```ts
 * { type: 'character', action: 'show', name: 'hero', position: 'center', image: 'smile', duration: 500 }
 * ```
 */
export interface CharacterShowCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string> {
  /** 명령어 타입. 항상 'character'입니다. */
  type: 'character'
  /** 'show'는 캐릭터를 화면에 등장시키거나 속성을 변경합니다. */
  action: 'show'
  /** 조작할 캐릭터의 이름(config.characters의 키)입니다. */
  name: TName
  /** 화면 내 캐릭터의 가로 위치입니다. (프리셋 또는 'n/m' 분수) */
  position?: CharacterPositionPreset
  /** 렌더링 할 캐릭터의 이미지 키(config.characters[name]에 정의된 키)입니다. */
  image?: keyof TCharacters[TName] & string
  /** 캐릭터가 등장하거나 이동할 때 적용되는 애니메이션 시간(ms 단위)입니다. */
  duration?: number
  /**
   * 등장과 동시에 카메라 포커스를 수행할지 여부입니다.
   * `true`일 경우 기본 포인트를 사용하며, 문자열 지정 시 해당 포인트에 카메라를 맞춥니다.
   */
  focus?: boolean | PointsOf<TCharacters, TName> | (string & {})
}

/** 캐릭터를 퇴장시킨다 */
export interface CharacterRemoveCmd<TCharacters extends CharDefs> {
  /** 명령어 타입. 항상 'character'입니다. */
  type: 'character'
  /** 'remove'는 화면에서 캐릭터를 퇴장시킵니다. */
  action: 'remove'
  /** 퇴장시킬 캐릭터의 이름(config.characters의 키)입니다. */
  name: keyof TCharacters & string
  /** 캐릭터가 페이드아웃 하며 퇴장하는 시간(ms 단위)입니다. (기본값: 600) */
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

/** 
 * 카메라를 캐릭터에 포커스한다 
 * 
 * @example
 * ```ts
 * { type: 'character-focus', name: 'hero', point: 'face', zoom: 'close-up', duration: 600 }
 * ```
 */
export interface CharacterFocusCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string = keyof TCharacters & string> {
  /** 명령어 타입. 항상 'character-focus'입니다. */
  type: 'character-focus'
  /** 포커스 할 캐릭터의 이름입니다. */
  name: TName
  /** 맞출 카메라 초점 포인트입니다. (config의 points 키로 자동완성됩니다) */
  point?: PointsOf<TCharacters, TName> | (string & {})
  /** 포커스 시 적용될 화면 줌(Zoom) 수준입니다. */
  zoom?: ZoomPreset
  /** 카메라 이동에 걸리는 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

/** 캐릭터를 컷인(전면) 레이어로 올리거나 복원한다 */
export interface CharacterHighlightCmd<TCharacters extends CharDefs, TName extends keyof TCharacters & string = keyof TCharacters & string> {
  /** 명령어 타입. 항상 'character-highlight'입니다. */
  type: 'character-highlight'
  /** 하이라이트 할 캐릭터의 이름입니다. */
  name: TName
  /** 'on'은 캐릭터를 전경으로 올리고, 'off'는 원래 뎁스로 복구합니다. */
  action: 'on' | 'off'
}

// ─── 카메라 제어 커맨드 ─────────────────────────────────────

/** 카메라를 줌한다 */
export interface CameraZoomCmd {
  /** 명령어 타입. 항상 'camera-zoom'입니다. */
  type: 'camera-zoom'
  /** 목표 줌 레벨 프리셋(close-up, wide 등)입니다. */
  preset: ZoomPreset
  /** 줌 애니메이션에 걸리는 시간(ms 단위)입니다. */
  duration?: number
}

/** 카메라를 패닝한다 */
export interface CameraPanCmd {
  /** 명령어 타입. 항상 'camera-pan'입니다. */
  type: 'camera-pan'
  /** 목표 패닝 방향/위치 프리셋(left, center 등)입니다. */
  position: PanPreset
  /** 패닝 애니메이션에 걸리는 시간(ms 단위)입니다. */
  duration?: number
}

/** 
 * 카메라 흔들림 등 연출 효과를 재생한다 
 * 
 * @example
 * ```ts
 * { type: 'camera-effect', preset: 'shake', duration: 500, intensity: 5, repeat: 3 }
 * ```
 */
export interface CameraEffectCmd {
  /** 명령어 타입. 항상 'camera-effect'입니다. */
  type: 'camera-effect'
  /** 재생할 카메라 효과 프리셋(흔들림, 반동 등)입니다. */
  preset: CameraEffectPreset
  /** 효과가 한 번 재생되는 데 걸리는 시간(ms 단위)입니다. */
  duration?: number
  /** 효과의 강도/진폭입니다. 클수록 크게 요동칩니다. */
  intensity?: number
  /** 효과를 반복할 횟수입니다. 음수일 경우 무한히 반복됩니다. (기본값: 1) */
  repeat?: number
}

// ─── 화면 전환 커맨드 ────────────────────────────────────────

/** 화면을 페이드인/아웃한다 */
export interface ScreenFadeCmd {
  /** 명령어 타입. 항상 'screen-fade'입니다. */
  type: 'screen-fade'
  /** 'in'은 화면이 밝아지는 것, 'out'은 화면이 지정된 색으로 덮이는 것을 의미합니다. */
  dir: 'in' | 'out'
  /** 페이드에 사용될 색상 프리셋(black, white 등)입니다. */
  preset?: FadeColorPreset
  /** 페이드 애니메이션 시간(ms 단위)입니다. (기본값: 600) */
  duration?: number
}

/** 화면을 순간 플래시한다 */
export interface ScreenFlashCmd {
  /** 명령어 타입. 항상 'screen-flash'입니다. */
  type: 'screen-flash'
  /** 플래시 효과에 사용될 색상 프리셋입니다. */
  preset?: FlashPreset
}

/** 화면을 와이프 전환한다 */
export interface ScreenWipeCmd {
  /** 명령어 타입. 항상 'screen-wipe'입니다. */
  type: 'screen-wipe'
  /** 'in'은 새 화면이 덮는 것, 'out'은 현재 화면이 벗겨지는 것을 의미합니다. */
  dir: 'in' | 'out'
  /** 와이프 애니메이션 방향 프리셋(left, up 등)입니다. */
  preset?: WipePreset
  /** 와이프 애니메이션 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

// ─── UI 제어 커맨드 ─────────────────────────────────────────

/** 정의된 UI 요소를 페이드인/아웃한다 */
export interface UICmd {
  /** 명령어 타입. 항상 'ui'입니다. */
  type: 'ui'
  /** 조작할 UI 요소의 이름(아이디)입니다. */
  name: string
  /** 'show'는 UI를 표시하고, 'hide'는 숨깁니다. */
  action: 'show' | 'hide'
  /** UI 표시/숨김 시 적용되는 페이드 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

// ─── 입력 제어 커맨드 ───────────────────────────────────────

/** 사용자의 입력을 제어한다 (예: 일정 시간 동안 진행 무시) */
export interface ControlCmd {
  /** 명령어 타입. 항상 'control'입니다. */
  type: 'control'
  /** 'disable'은 일정 시간 동안 사용자의 클릭 등 입력을 차단합니다. */
  action: 'disable'
  /** 입력을 차단할 시간(ms 단위)입니다. */
  duration: number
}

// ─── 전체 DialogueEntry 유니온 ─────────────────────────────

type _DialogueEntryUnion<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
> =
  | DialogueCmd<TCharacters>
  | ChoiceCmd<TVars, TScenes>
  | ConditionCmd<TVars, TScenes>
  | VarCmd<TVars>
  | LabelCmd
  | BackgroundCmd<TBackgrounds>
  | MoodCmd
  | EffectCmd<TAssets>
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
  | ControlCmd

export type DialogueEntry<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
> = _DialogueEntryUnion<TVars, TScenes, TCharacters, TBackgrounds, TAssets> & {
  /** true일 경우, 사용자 입력을 기다리지 않고 즉시 다음 스텝으로 넘어갑니다. */
  skip?: boolean
}

export type DialogueStep<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
> = DialogueEntry<TVars, TScenes, TCharacters, TBackgrounds, TAssets>

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
type _AnyCmd = _DialogueEntryUnion<any, readonly string[], any, any, any>

export type FallbackRule = _AnyCmd extends infer E
  ? E extends { type: infer Type }
  ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
  : never
  : never
