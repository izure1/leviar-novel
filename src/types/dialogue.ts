// =============================================================
// dialogue.ts — 모든 DialogueEntry 유니온 타입 정의
// =============================================================

import type { CharDefs, BgDefs, CustomCmdHandler } from './config'

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

export type CustomCmd<TCmds extends Record<string, CustomCmdHandler<any, any, any>>> = {
  [K in keyof TCmds & string]: { type: K } & Parameters<TCmds[K]>[0]
}[keyof TCmds & string]

type _WithType<T, K extends string> = T extends any ? { type: K } & T : never

type _DialogueEntryUnion<
  TVars,
  TLocalVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TCmds extends Record<string, CustomCmdHandler<any, any, any>> = Record<never, never>,
> =
  | _WithType<DialogueCmd<TCharacters>, 'dialogue'>
  | _WithType<ChoiceCmd<TVars, TScenes>, 'choice'>
  | _WithType<ConditionCmd<TVars, TLocalVars, TScenes>, 'condition'>
  | _WithType<VarCmd<TVars, TLocalVars>, 'var'>
  | _WithType<LabelCmd, 'label'>
  | _WithType<BackgroundCmd<TBackgrounds>, 'background'>
  | _WithType<MoodCmd, 'mood'>
  | _WithType<EffectCmd<TAssets>, 'effect'>
  | _WithType<OverlayCmd, 'overlay'>
  | _WithType<CharacterCmd<TCharacters>, 'character'>
  | _WithType<CharacterFocusCmd<TCharacters>, 'character-focus'>
  | _WithType<CharacterHighlightCmd<TCharacters>, 'character-highlight'>
  | _WithType<CameraZoomCmd, 'camera-zoom'>
  | _WithType<CameraPanCmd, 'camera-pan'>
  | _WithType<CameraEffectCmd, 'camera-effect'>
  | _WithType<ScreenFadeCmd, 'screen-fade'>
  | _WithType<ScreenFlashCmd, 'screen-flash'>
  | _WithType<ScreenWipeCmd, 'screen-wipe'>
  | _WithType<UICmd, 'ui'>
  | _WithType<ControlCmd, 'control'>
  | CustomCmd<TCmds>

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

export type FallbackRule = _AnyCmd extends infer E
  ? E extends { type: infer Type }
  ? { type: Type } & Partial<Omit<E, 'type' | 'skip'>> & { defaults?: Partial<Omit<E, 'skip'>> }
  : never
  : never
