import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface ControlCmd {
  action: 'disable'
  duration: number
}

export const controlHandler = defineCmd<ControlCmd>((cmd, ctx) => {
  if (cmd.action === 'disable' && typeof cmd.duration === 'number') {
    ctx.callbacks.disableInput(cmd.duration)
  }
  return false
})
