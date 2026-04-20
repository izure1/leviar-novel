import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface LabelCmd {
  name: string
}

export const labelHandler = defineCmd<LabelCmd>((_cmd, _ctx) => {
  return true
})
