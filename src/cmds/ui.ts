import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface UICmd {
  type: 'ui'
  name: string
  action: 'show' | 'hide'
  duration?: number
}

export const uiHandler = defineCmd<UICmd>((_cmd, _ctx) => {
  return false
})
