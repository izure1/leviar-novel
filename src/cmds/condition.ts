import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface ConditionCmd<TVars, TLocalVars, TScenes extends readonly string[]> {
  if: (vars: TVars & TLocalVars) => boolean
  next?: TScenes[number]
  goto?: string
  else?: string
  'else-next'?: TScenes[number]
}

export const conditionHandler = defineCmd<ConditionCmd<any, any, any>>((cmd, ctx) => {
  const result = cmd.if(ctx.scene.getVars())

  if (result) {
    if (cmd.goto) {
      ctx.scene.jumpToLabel(cmd.goto)
      return 'handled'
    } else if (cmd.next) {
      ctx.scene.end()
      ctx.scene.loadScene(cmd.next)
      return 'handled'
    } else {
      return true
    }
  } else {
    if (cmd.else) {
      if (ctx.scene.hasLabel(cmd.else)) {
        ctx.scene.jumpToLabel(cmd.else)
      } else {
        ctx.scene.end()
        ctx.scene.loadScene(cmd.else)
      }
      return 'handled'
    } else if (cmd['else-next']) {
      ctx.scene.end()
      ctx.scene.loadScene(cmd['else-next'])
      return 'handled'
    } else {
      return true
    }
  }
})
