// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { ModulesOf, VarsOf } from './config'
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

// 재수출
export type {
  DialogueCmd, ChoiceCmd, ConditionCmd, VarCmd, LabelCmd, BackgroundCmd,
  MoodCmd, EffectCmd, OverlayTextCmd, OverlayImageCmd, OverlayEffectCmd, CharacterCmd, CharacterFocusCmd, CharacterHighlightCmd, CharacterEffectCmd,
  CameraZoomCmd, CameraPanCmd, CameraEffectCmd, ScreenFadeCmd, ScreenFlashCmd, ScreenWipeCmd,
  UICmd, ControlCmd, AudioCmd, DialogBoxCmd
}

export type CustomCmd<TConfig, TVars = any, TLocalVars = any> = {
  [K in keyof ModulesOf<TConfig> & string]:
  ModulesOf<TConfig>[K] extends NovelModule<infer TSchema>
  ? { type: K } & ResolvableProps<TSchema, TVars, TLocalVars>
  : never
}[keyof ModulesOf<TConfig> & string]

/**
 * T를 ResolvableProps로 감싼 뒤 type 키를 붙이는 헬퍼.
 * T가 유니온이면 분산(distributive)되어 각 멤버에 개별 적용됩니다.
 */
type _WithType<T, K extends string, TVars, TLocalVars> =
  T extends any ? { type: K } & ResolvableProps<T, TVars, TLocalVars> : never

type _DialogueEntryUnion<TConfig, TVars, TLocalVars> =
  | _WithType<DialogueCmd<TConfig>, 'dialogue', TVars, TLocalVars>
  | _WithType<ChoiceCmd<TConfig, TLocalVars>, 'choice', TVars, TLocalVars>
  | _WithType<ConditionCmd<TConfig, TLocalVars>, 'condition', TVars, TLocalVars>
  | _WithType<VarCmd<TVars, TLocalVars>, 'var', TVars, TLocalVars>
  | _WithType<LabelCmd, 'label', TVars, TLocalVars>
  | _WithType<BackgroundCmd<TConfig>, 'background', TVars, TLocalVars>
  | _WithType<MoodCmd, 'mood', TVars, TLocalVars>
  | _WithType<EffectCmd<TConfig>, 'effect', TVars, TLocalVars>
  | _WithType<OverlayTextCmd, 'overlay-text', TVars, TLocalVars>
  | _WithType<OverlayImageCmd<TConfig>, 'overlay-image', TVars, TLocalVars>
  | _WithType<OverlayEffectCmd, 'overlay-effect', TVars, TLocalVars>
  | _WithType<CharacterCmd<TConfig>, 'character', TVars, TLocalVars>
  | _WithType<CharacterFocusCmd<TConfig>, 'character-focus', TVars, TLocalVars>
  | _WithType<CharacterHighlightCmd<TConfig>, 'character-highlight', TVars, TLocalVars>
  | _WithType<CharacterEffectCmd<TConfig>, 'character-effect', TVars, TLocalVars>
  | _WithType<CameraZoomCmd, 'camera-zoom', TVars, TLocalVars>
  | _WithType<CameraPanCmd, 'camera-pan', TVars, TLocalVars>
  | _WithType<CameraEffectCmd, 'camera-effect', TVars, TLocalVars>
  | _WithType<ScreenFadeCmd, 'screen-fade', TVars, TLocalVars>
  | _WithType<ScreenFlashCmd, 'screen-flash', TVars, TLocalVars>
  | _WithType<ScreenWipeCmd, 'screen-wipe', TVars, TLocalVars>
  | _WithType<UICmd<TConfig>, 'ui', TVars, TLocalVars>
  | _WithType<ControlCmd, 'control', TVars, TLocalVars>
  | _WithType<AudioCmd<TConfig>, 'audio', TVars, TLocalVars>
  | _WithType<DialogBoxCmd<TConfig>, 'dialogBox', TVars, TLocalVars>
  | CustomCmd<TConfig, TVars, TLocalVars>

type _WithSkip<T> = T extends any ? T & {
  /** true일 경우, 사용자 입력을 기다리지 않고 즉시 다음 스텝으로 넘어갑니다. */
  skip?: boolean
} : never

export type DialogueEntry<TConfig, TVars, TLocalVars> =
  _WithSkip<_DialogueEntryUnion<TConfig, TVars, TLocalVars>>

export type DialogueStep<TConfig, TLocalVars = Record<never, never>> =
  DialogueEntry<TConfig, VarsOf<TConfig>, TLocalVars>

// ─── Fallback 룰 ─────────────────────────────────────────────

/** 모듈 스키마를 기반으로 폴백 규칙의 타입을 추론하는 제네릭입니다. */
export type FallbackRuleOf<
  TModules extends Record<string, NovelModule<any>> = Record<never, never>
> = _DialogueEntryUnion<
  { modules?: TModules },
  any,
  any
> extends infer E
  ? E extends { type: infer Type }
  ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
  : never
  : never
