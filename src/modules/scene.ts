// =============================================================
// scene.ts — { type: 'scene', call } 핸들러
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

export interface SceneCallCmd {
  type: 'scene'
  /** 호출할 씬 이름 */
  call: string
}

export function* sceneCallHandler(
  params: Omit<SceneCallCmd, 'type'>,
  ctx: SceneContext
): Generator<CommandResult, CommandResult, any> {
  ctx.scene.callScene(params.call)
  return false
}
