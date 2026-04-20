import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export type VarCmd<TVars, TLocalVars> =
  | {
    type: 'var'
    name: keyof TVars & string
    value: TVars[keyof TVars] | ((vars: TVars & TLocalVars) => TVars[keyof TVars])
  }
  | {
    type: 'var'
    name: keyof TLocalVars & string
    value: TLocalVars[keyof TLocalVars] | ((vars: TVars & TLocalVars) => TLocalVars[keyof TLocalVars])
  }

export const varHandler = defineCmd<VarCmd<any, any>>((cmd, ctx) => {
  const nameStr = cmd.name as string
  let val = cmd.value
  
  if (typeof val === 'function') {
    val = (val as any)(ctx.scene.getVars())
  }

  if (nameStr.startsWith('_')) {
    ctx.scene.setLocalVar(nameStr, val)
  } else {
    ctx.scene.setGlobalVar(nameStr, val)
  }
  return true
})
