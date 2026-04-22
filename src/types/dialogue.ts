// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { CharDefs, BgDefs, CustomCmdHandler } from './config'
import type { ResolvableProps } from '../define/defineCmd'

// 프리셋 타입들 import (필요시 export)
export type { MoodType, FlickerPreset } from '../cmds/mood'
export type { EffectType } from '../cmds/effect'
export type { OverlayPreset } from '../cmds/overlay'
export type { ZoomPreset, PanPreset, CameraEffectPreset } from '../cmds/camera'
export type { BackgroundFitPreset } from '../cmds/background'
export type { FadeColorPreset, FlashPreset, WipePreset } from '../cmds/screen'
export type { CharacterPositionPreset } from '../cmds/character'

// 인터페이스 import
import type { DialogueCmd } from '../cmds/dialogue'
import type { ChoiceCmd } from '../cmds/choice'
import type { ConditionCmd } from '../cmds/condition'
import type { VarCmd } from '../cmds/var'
import type { LabelCmd } from '../cmds/label'
import type { BackgroundCmd } from '../cmds/background'
import type { MoodCmd } from '../cmds/mood'
import type { EffectCmd } from '../cmds/effect'
import type { OverlayCmd } from '../cmds/overlay'
import type { CharacterCmd, CharacterFocusCmd, CharacterHighlightCmd } from '../cmds/character'
import type { CameraZoomCmd, CameraPanCmd, CameraEffectCmd } from '../cmds/camera'
import type { ScreenFadeCmd, ScreenFlashCmd, ScreenWipeCmd } from '../cmds/screen'
import type { UICmd } from '../cmds/ui'
import type { ControlCmd } from '../cmds/control'

// 재수출
export type {
  DialogueCmd, ChoiceCmd, ConditionCmd, VarCmd, LabelCmd, BackgroundCmd,
  MoodCmd, EffectCmd, OverlayCmd, CharacterCmd, CharacterFocusCmd, CharacterHighlightCmd,
  CameraZoomCmd, CameraPanCmd, CameraEffectCmd, ScreenFadeCmd, ScreenFlashCmd, ScreenWipeCmd,
  UICmd, ControlCmd
}

export type CustomCmd<
  TCmds extends Record<string, CustomCmdHandler<any, any, any>>,
  TVars = any,
  TLocalVars = any,
> = {
  [K in keyof TCmds & string]: { type: K } & ResolvableProps<Parameters<TCmds[K]>[0], TVars, TLocalVars>
}[keyof TCmds & string]

/**
 * T를 ResolvableProps로 감싼 뒤 type 키를 붙이는 헬퍼.
 * T가 유니온이면 분산(distributive)되어 각 멤버에 개별 적용됩니다.
 */
type _WithType<T, K extends string, TVars, TLocalVars> =
  T extends any ? { type: K } & ResolvableProps<T, TVars, TLocalVars> : never

type _DialogueEntryUnion<
  TVars,
  TLocalVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TCmds extends Record<string, CustomCmdHandler<any, any, any>> = Record<never, never>,
> =
  | _WithType<DialogueCmd<TCharacters>, 'dialogue', TVars, TLocalVars>
  | _WithType<ChoiceCmd<TVars, TLocalVars, TScenes>, 'choice', TVars, TLocalVars>
  | _WithType<ConditionCmd<TVars, TLocalVars, TScenes>, 'condition', TVars, TLocalVars>
  | _WithType<VarCmd<TVars, TLocalVars>, 'var', TVars, TLocalVars>
  | _WithType<LabelCmd, 'label', TVars, TLocalVars>
  | _WithType<BackgroundCmd<TBackgrounds>, 'background', TVars, TLocalVars>
  | _WithType<MoodCmd, 'mood', TVars, TLocalVars>
  | _WithType<EffectCmd<TAssets>, 'effect', TVars, TLocalVars>
  | _WithType<OverlayCmd, 'overlay', TVars, TLocalVars>
  | _WithType<CharacterCmd<TCharacters>, 'character', TVars, TLocalVars>
  | _WithType<CharacterFocusCmd<TCharacters>, 'character-focus', TVars, TLocalVars>
  | _WithType<CharacterHighlightCmd<TCharacters>, 'character-highlight', TVars, TLocalVars>
  | _WithType<CameraZoomCmd, 'camera-zoom', TVars, TLocalVars>
  | _WithType<CameraPanCmd, 'camera-pan', TVars, TLocalVars>
  | _WithType<CameraEffectCmd, 'camera-effect', TVars, TLocalVars>
  | _WithType<ScreenFadeCmd, 'screen-fade', TVars, TLocalVars>
  | _WithType<ScreenFlashCmd, 'screen-flash', TVars, TLocalVars>
  | _WithType<ScreenWipeCmd, 'screen-wipe', TVars, TLocalVars>
  | _WithType<UICmd, 'ui', TVars, TLocalVars>
  | _WithType<ControlCmd, 'control', TVars, TLocalVars>
  | CustomCmd<TCmds, TVars, TLocalVars>

type _WithSkip<T> = T extends any ? T & {
  /** true일 경우, 사용자 입력을 기다리지 않고 즉시 다음 스텝으로 넘어갑니다. */
  skip?: boolean
} : never

export type DialogueEntry<
  TVars,
  TLocalVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TCmds extends Record<string, CustomCmdHandler<any, any, any>> = Record<never, never>,
> = _WithSkip<_DialogueEntryUnion<TVars, TLocalVars, TScenes, TCharacters, TBackgrounds, TAssets, TCmds>>

export type DialogueStep<
  TVars,
  TLocalVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TCmds extends Record<string, CustomCmdHandler<any, any, any>> = Record<never, never>,
> = DialogueEntry<TVars, TLocalVars, TScenes, TCharacters, TBackgrounds, TAssets, TCmds>

// ─── Fallback 룰 ─────────────────────────────────────────────

type _AnyCmd = _DialogueEntryUnion<any, any, readonly string[], any, any, any, any>

/** TCmds를 인식하는 제네릭 FallbackRule. custom cmd 타입도 추론됩니다. */
export type FallbackRuleOf<
  TCmds extends Record<string, CustomCmdHandler<any, any, any>> = Record<never, never>
> = _DialogueEntryUnion<any, any, readonly string[], any, any, any, TCmds> extends infer E
  ? E extends { type: infer Type }
  ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
  : never
  : never

/** @deprecated FallbackRuleOf<TCmds>를 사용하세요. custom cmd 타입이 추론되지 않습니다. */
export type FallbackRule = FallbackRuleOf<Record<never, never>>
