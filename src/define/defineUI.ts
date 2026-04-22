// =============================================================
// defineUI.ts — UI 셋업 커맨드 헬퍼
// =============================================================

import type { SceneContext } from '../core/SceneContext'
import type { UIRuntimeEntry, UIEntryOptions } from '../core/UIRegistry'
import type { CustomCmdHandler } from '../types/config'

/**
 * defineUI가 반환하는 핸들러에 부착되는 메타데이터.
 * Novel 생성자가 이 메타를 감지하여 _uiDefinitions에 빌더를 자동 등록합니다.
 */
export interface UIHandlerMeta {
  /** UIRegistry 등록 키 */
  __uiName: string
  /** UI 오브젝트를 생성하는 빌더 함수 */
  __uiBuilder: (style: any, ctx: SceneContext) => UIRuntimeEntry
  /** UI 동작 옵션 */
  __uiOptions?: UIEntryOptions
}

/**
 * defineUI가 반환하는 핸들러 타입 (CustomCmdHandler + 메타 부착)
 */
export type UIHandler<TStyle> =
  CustomCmdHandler<Partial<TStyle>> & UIHandlerMeta

/**
 * UI 셋업 커맨드 핸들러를 정의합니다.
 *
 * `defineCmd`와 동일한 패턴으로 사용하되, 씬에서 실행 시 UI 오브젝트를 생성하고
 * UIRegistry에 등록합니다. 스타일 데이터는 CmdState에 저장되어 세이브/로드에
 * 자동으로 포함됩니다.
 *
 * @param name   UIRegistry 등록 키 (예: 'dialogue', 'choices')
 * @param builder 스타일과 컨텍스트를 받아 UIRuntimeEntry를 반환하는 빌더 함수
 *
 * @example
 * ```ts
 * export const dialogueUISetup = defineUI<DialogueUIStyle>(
 *   'dialogue',
 *   (style, ctx) => {
 *     const bgObj = ctx.world.createRectangle({ ... })
 *     ctx.renderer.track(bgObj)
 *     return {
 *       show: (dur = 250) => { ... },
 *       hide: (dur = 300) => { ... },
 *       onDialogue: (speaker, text, speed) => { ... },
 *     }
 *   }
 * )
 * // novel.config.ts
 * cmds: { 'setup-dialogue': dialogueUISetup }
 * // scene
 * { type: 'setup-dialogue', bg: { height: 168 } }
 * ```
 */
export function defineUI<TStyle>(
  name: string,
  builder: (style: Partial<TStyle>, ctx: SceneContext) => UIRuntimeEntry,
  options?: UIEntryOptions
): UIHandler<TStyle> {
  const handler: CustomCmdHandler<Partial<TStyle>> = (rawStyle, ctx) => {
    // 1. 스타일을 CmdState에 저장 (세이브/로드용)
    ctx.cmdState.set(`setup-${name}`, rawStyle as Record<string, any>)

    // 2. 빌더로 UI 생성 (엔트리에 options 주입)
    const entry = builder(rawStyle as Partial<TStyle>, ctx)
    if (options) entry.options = { ...options, ...entry.options }

    // 3. UIRegistry에 등록
    ctx.ui.register(name, entry)
    return true
  }

  ;(handler as any).__uiName    = name
  ;(handler as any).__uiBuilder = builder
  ;(handler as any).__uiOptions = options

  return handler as UIHandler<TStyle>
}
