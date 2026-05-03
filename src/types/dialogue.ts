// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { ModulesOf, VariablesOf } from './config'
import type { ResolvableProps } from '../define/defineCmd'
import type { NovelModule } from '../define/defineCmdUI'

// 프리셋 타입들 import (필요시 export)
export type { MoodType, FlickerPreset } from '../modules/mood'
export type { EffectType } from '../modules/effect'
export type { OverlayPreset } from '../modules/overlay'
export type { ZoomPreset, PanPreset, CameraEffectPreset } from '../modules/camera'
export type { BackgroundFitPreset } from '../modules/background'
export type { FadeColorPreset, FlashPreset, WipePreset } from '../modules/screen'
export type { CharacterPositionPreset } from '../modules/character'

// 인터페이스 import
import type { DialogueCmd } from '../modules/dialogue'
import type { ChoiceCmd } from '../modules/choice'
import type { ConditionCmd } from '../modules/condition'
import type { VarCmd } from '../modules/var'
import type { LabelCmd } from '../modules/label'
import type { BackgroundCmd } from '../modules/background'
import type { MoodCmd } from '../modules/mood'
import type { EffectCmd } from '../modules/effect'
import type { OverlayTextCmd, OverlayImageCmd, OverlayEffectCmd } from '../modules/overlay'
import type { CharacterCmd, CharacterFocusCmd, CharacterHighlightCmd, CharacterEffectCmd } from '../modules/character'
import type { CameraZoomCmd, CameraPanCmd, CameraEffectCmd } from '../modules/camera'
import type { ScreenFadeCmd, ScreenFlashCmd, ScreenWipeCmd } from '../modules/screen'
import type { UICmd } from '../modules/ui'
import type { ControlCmd } from '../modules/control'
import type { AudioCmd } from '../modules/audio'
import type { DialogBoxCmd } from '../modules/dialogBox'
import type { InputCmd } from '../modules/input'
import type { SceneCallCmd } from '../modules/scene'

// 재수출
export type {
  DialogueCmd, ChoiceCmd, ConditionCmd, VarCmd, LabelCmd, BackgroundCmd,
  MoodCmd, EffectCmd, OverlayTextCmd, OverlayImageCmd, OverlayEffectCmd, CharacterCmd, CharacterFocusCmd, CharacterHighlightCmd, CharacterEffectCmd,
  CameraZoomCmd, CameraPanCmd, CameraEffectCmd, ScreenFadeCmd, ScreenFlashCmd, ScreenWipeCmd,
  UICmd, ControlCmd, AudioCmd, DialogBoxCmd, InputCmd, SceneCallCmd
}

// ─── 스텝 공통 필드 ──────────────────────────────────────────

/** 모든 DialogueEntry에 공통으로 붙는 메타 필드 */
interface _StepBase {
  /** true일 경우, 사용자 입력을 기다리지 않고 즉시 다음 스텝으로 넘어갑니다. */
  skip?: boolean
}

// ─── 빌트인 명령어 룩업 테이블 ───────────────────────────────

/**
 * `type` 문자열 → Cmd 인터페이스 매핑 테이블.
 * 새 빌트인 명령어 추가 시 여기에 한 줄 추가하면 됩니다.
 */
type BuiltinCmdMap<TConfig, TVars, TLocalVars> = {
  'dialogue': DialogueCmd<TConfig>
  'choice': ChoiceCmd<TConfig, TLocalVars>
  'condition': ConditionCmd<TConfig, TVars, TLocalVars>
  'var': VarCmd<TVars, TLocalVars>
  'label': LabelCmd
  'background': BackgroundCmd<TConfig>
  'mood': MoodCmd
  'effect': EffectCmd<TConfig>
  'overlay-text': OverlayTextCmd
  'overlay-image': OverlayImageCmd<TConfig>
  'overlay-effect': OverlayEffectCmd
  'character': CharacterCmd<TConfig>
  'character-focus': CharacterFocusCmd<TConfig>
  'character-highlight': CharacterHighlightCmd<TConfig>
  'character-effect': CharacterEffectCmd<TConfig>
  'camera-zoom': CameraZoomCmd
  'camera-pan': CameraPanCmd
  'camera-effect': CameraEffectCmd
  'screen-fade': ScreenFadeCmd
  'screen-flash': ScreenFlashCmd
  'screen-wipe': ScreenWipeCmd
  'ui': UICmd<TConfig>
  'control': ControlCmd
  'audio': AudioCmd<TConfig>
  'dialogBox': DialogBoxCmd<TConfig>
  'input': InputCmd<TConfig, TLocalVars>
  'scene': SceneCallCmd
}

// ─── 유니온 생성 ─────────────────────────────────────────────

/**
 * 빌트인 명령어 유니온.
 * `BuiltinCmdMap`의 각 엔트리에 `{ type: K } & _StepBase`를 합치고
 * `ResolvableProps`로 감싸 **단일 mapped type**으로 만듭니다.
 *
 * intersection(`A & MappedType`)이 아닌 단일 mapped type이므로
 * IDE가 모든 속성을 eager하게 열거할 수 있습니다.
 */
type _BuiltinEntryUnion<TConfig, TVars, TLocalVars> = {
  [K in keyof BuiltinCmdMap<TConfig, TVars, TLocalVars>]:
    ResolvableProps<
      BuiltinCmdMap<TConfig, TVars, TLocalVars>[K] & { type: K } & _StepBase,
      TVars,
      TLocalVars
    >
}[keyof BuiltinCmdMap<TConfig, TVars, TLocalVars>]

/**
 * 사용자 정의 모듈 명령어 유니온.
 * `config.modules`에 등록된 각 모듈의 TCmd 스키마로부터 생성됩니다.
 */
export type CustomCmd<TConfig, TVars = any, TLocalVars = any> = {
  [K in keyof ModulesOf<TConfig> & string]:
    ModulesOf<TConfig>[K] extends NovelModule<infer TSchema>
      ? ResolvableProps<TSchema & { type: K } & _StepBase, TVars, TLocalVars>
      : never
}[keyof ModulesOf<TConfig> & string]

// ─── 최종 타입 ───────────────────────────────────────────────

export type DialogueEntry<TConfig, TVars, TLocalVars> =
  | _BuiltinEntryUnion<TConfig, TVars, TLocalVars>
  | CustomCmd<TConfig, TVars, TLocalVars>

export type DialogueStep<TConfig, TLocalVars = Record<never, never>, TVars = VariablesOf<TConfig>> =
  DialogueEntry<TConfig, TVars, TLocalVars>

// ─── Fallback 룰 ─────────────────────────────────────────────

/** 모듈 스키마를 기반으로 폴백 규칙의 타입을 추론하는 제네릭입니다. */
export type FallbackRuleOf<
  TModules extends Record<string, NovelModule<any>> = Record<never, never>
> = _BuiltinEntryUnion<
  { modules?: TModules },
  any,
  any
> extends infer E
  ? E extends { type: infer Type }
  ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
  : never
  : never
