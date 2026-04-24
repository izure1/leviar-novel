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
  // config 유틸리티 타입
  CharacterKeysOf,
  ImageKeysOf,
  AssetKeysOf,
  BackgroundKeysOf,
  SceneNamesOf,
  VarsOf,
  PointsOf,
  // modules 유틸리티 타입
  ModulesOf,
  ModuleKeysOf,
  /** @deprecated CmdsOf → ModulesOf 사용 */
  CmdsOf,
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
export { defineExploreScene } from './define/defineExploreScene'
export { defineCharacter } from './define/defineCharacter'
export { defineScene, defineInitial } from './define/defineScene'
export type { SceneDefinition } from './define/defineScene'
export type { ExploreSceneDefinition, ExploreSceneOptions, ExploreObject } from './define/defineExploreScene'

// ─── 모듈 팩토리 ─────────────────────────────────────────────
export { define } from './define/defineCmdUI'
export type { NovelModule, NovelModuleMeta } from './define/defineCmdUI'
/** @deprecated UIHandler → NovelModule 사용 */
export type { UIHandler, UIHandlerMeta } from './define/defineCmdUI'

// ─── UI 시스템 ───────────────────────────────────────────────
export type { UIRuntimeEntry } from './core/UIRegistry'
export type { DialogueSchema } from './cmds/dialogue'
export type { ChoiceSchema } from './cmds/choice'

// ─── 내장 모듈 ───────────────────────────────────────────────
export { default as dialogueModule } from './cmds/dialogue'
export { default as choiceModule } from './cmds/choice'
export { default as backgroundModule } from './cmds/background'
export { default as characterModule, characterFocusModule, characterHighlightModule } from './cmds/character'
export { default as moodModule } from './cmds/mood'
export { default as effectModule } from './cmds/effect'
export { default as overlayModule } from './cmds/overlay'
export { screenFadeModule, screenFlashModule, screenWipeModule } from './cmds/screen'
export { cameraZoomModule, cameraPanModule, cameraEffectModule } from './cmds/camera'
export { default as conditionModule } from './cmds/condition'
export { default as varModule } from './cmds/var'
export { default as labelModule } from './cmds/label'
export { default as uiModule } from './cmds/ui'
export { default as controlModule } from './cmds/control'

// ─── 코어 클래스 ─────────────────────────────────────────────
export { Novel } from './core/Novel'
export type { SaveData } from './core/Novel'
export { Renderer } from './core/Renderer'
export type { RendererOption, RendererState, CameraState } from './core/Renderer'
