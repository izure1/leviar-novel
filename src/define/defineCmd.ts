// =============================================================
// defineCmd.ts — 커맨드 핸들러 정의 헬퍼
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

/**
 * 커맨드 핸들러를 정의합니다
 * @example
 * ```ts
 * export const myHandler = defineCmd<{ message: string }>((cmd, ctx) => {
 *   ctx.callbacks.onDialogue(cmd.speaker, cmd.text)
 *   return false
 * })
 * ```
 */
export function defineCmd<TCmd>(
  handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult
): (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult {
  return handler
}
