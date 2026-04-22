// =============================================================
// src/index.ts — leviar-novel 공개 API
// =============================================================

// ─── 타입 정의 ───────────────────────────────────────────────
export type {
  // config
  CharImageDef,
  CharDef,
  CharDefs,
  BgDef,
  BgDefs,
  NovelConfig,
  NovelOption,
  FallbackRule,
  FallbackRuleOf,
} from './types/config'

export type {
  // dialogue 프리셋 타입
  MoodType,
  FlickerPreset,
  OverlayPreset,
  EffectType,
  ZoomPreset,
  PanPreset,
  CameraEffectPreset,
  BackgroundFitPreset,
  FadeColorPreset,
  FlashPreset,
  WipePreset,
  CharacterPositionPreset,
  // 커맨드 타입
  DialogueCmd,
  ChoiceCmd,
  ConditionCmd,
  VarCmd,
  LabelCmd,
  BackgroundCmd,
  MoodCmd,
  EffectCmd,
  OverlayCmd,
  CharacterCmd,
  CharacterFocusCmd,
  CharacterHighlightCmd,
  CameraZoomCmd,
  CameraPanCmd,
  CameraEffectCmd,
  ScreenFadeCmd,
  ScreenFlashCmd,
  ScreenWipeCmd,
  UICmd,
  DialogueEntry,
  DialogueStep,
} from './types/dialogue'

// ─── define 헬퍼 함수 ────────────────────────────────────────
export { defineNovelConfig } from './define/defineNovelConfig'
export { defineScene } from './define/defineScene'
export { defineExploreScene } from './define/defineExploreScene'
export { defineCmd } from './define/defineCmd'
export { defineUI } from './define/defineUI'
export { define } from './define/defineCmdUI'
export type { SceneDefinition } from './define/defineScene'
export type { ExploreSceneDefinition, ExploreSceneOptions, ExploreObject } from './define/defineExploreScene'
export type { UIHandler, UIHandlerMeta } from './define/defineCmdUI'

// ─── UI 시스템 ───────────────────────────────────────────────
export type { UIRuntimeEntry, UIEntryOptions } from './core/UIRegistry'
export type { DialogueSchema } from './cmds/dialogue'
export type { ChoiceSchema } from './cmds/choice'

// ─── 코어 클래스 ─────────────────────────────────────────────
export { Novel } from './core/Novel'
export type { SaveData } from './core/Novel'
export { Renderer } from './core/Renderer'
export type { RendererOption, RendererState, CameraState } from './core/Renderer'
