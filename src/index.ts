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
  FallbackRuleOf,
  // config 유틸리티 타입
  CharacterKeysOf,
  ImageKeysOf,
  AssetKeysOf,
  BackgroundKeysOf,
  SceneNamesOf,
  SceneNextTarget,
  VarsOf,
  PointsOf,
  // modules 유틸리티 타입
  ModulesOf,
  ModuleKeysOf,
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
  OverlayTextCmd,
  OverlayImageCmd,
  OverlayEffectCmd,
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
export { defineNovelConfig, BUILTIN_MODULES } from './define/defineNovelConfig'
export type { BuiltinModules } from './define/defineNovelConfig'
export { defineExploreScene } from './define/defineExploreScene'
export { defineCharacter } from './define/defineCharacter'
export { defineScene, defineInitial } from './define/defineScene'
export type { SceneDefinition } from './define/defineScene'
export type { ExploreSceneDefinition, ExploreSceneOptions, ExploreObject } from './define/defineExploreScene'

// ─── 모듈 팩토리 ─────────────────────────────────────────────
export { define } from './define/defineCmdUI'
export type { NovelModule, NovelModuleMeta, BootCallback } from './define/defineCmdUI'

// ─── UI 시스템 ───────────────────────────────────────────────
export type { UIRuntimeEntry } from './core/UIRegistry'
export type { DialogueSchema } from './modules/dialogue'
export type { ChoiceSchema } from './modules/choice'

// ─── 내장 모듈 ───────────────────────────────────────────────
export { default as dialogueModule } from './modules/dialogue'
export { default as choiceModule } from './modules/choice'
export { default as backgroundModule } from './modules/background'
export { default as characterModule, characterFocusModule, characterHighlightModule } from './modules/character'
export { default as moodModule } from './modules/mood'
export { default as effectModule } from './modules/effect'
export { overlayTextModule, overlayImageModule, overlayEffectModule } from './modules/overlay'
export { screenFadeModule, screenFlashModule, screenWipeModule } from './modules/screen'
export { cameraZoomModule, cameraPanModule, cameraEffectModule } from './modules/camera'
export { default as conditionModule } from './modules/condition'
export { default as varModule } from './modules/var'
export { default as labelModule } from './modules/label'
export { default as uiModule } from './modules/ui'
export { default as controlModule } from './modules/control'

// ─── 코어 클래스 ─────────────────────────────────────────────
export { Novel } from './core/Novel'
export type { SaveData } from './core/Novel'
export { Renderer } from './core/Renderer'
export type { RendererOption, RendererState, CameraState } from './core/Renderer'
