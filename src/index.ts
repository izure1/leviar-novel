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
  // UI 스타일
  UITextStyle,
  UIBgStyle,
  UIChoiceStyle,
  NovelUIOption,
} from './types/config'

export type {
  // dialogue 프리셋 타입
  MoodType,
  LightPreset,
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
  LightCmd,
  FlickerCmd,
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
export { defineNovelConfig }            from './define/defineNovelConfig'
export { defineScene }                  from './define/defineScene'
export { defineExploreScene }           from './define/defineExploreScene'
export type { SceneDefinition }         from './define/defineScene'
export type { ExploreSceneDefinition, ExploreSceneOptions, ExploreObject } from './define/defineExploreScene'

// ─── 코어 클래스 ─────────────────────────────────────────────
export { Novel }                        from './core/Novel'
export type { SaveData }                from './core/Novel'
export { Renderer }                     from './core/Renderer'
export type { RendererOption, RendererState, CameraState } from './core/Renderer'
