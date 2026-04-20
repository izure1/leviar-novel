// =============================================================
// defineCmd.ts — 커맨드 핸들러 정의 헬퍼
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

/**
 * 커맨드 핸들러를 정의합니다.
 * 제네릭으로 커맨드 타입을 전달하면 `type` 필드가 자동으로 제거된
 * 파라미터 타입으로 핸들러가 정의됩니다.
 *
 * @example
 * ```ts
 * export const myHandler = defineCmd<MyCmd>((cmd, ctx) => {
 *   ctx.callbacks.onDialogue(cmd.speaker, cmd.text)
 *   return false
 * })
 * ```
 */
export function defineCmd<TCmd extends { type: string }>(
  handler: (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult
): (cmd: Omit<TCmd, 'type'>, ctx: SceneContext) => CommandResult {
  return handler
}
