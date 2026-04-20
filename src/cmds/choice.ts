import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface ChoiceCmd<TVars, TScenes extends readonly string[]> {
  choices: {
    text: string
    next?: TScenes[number]
    goto?: string
    var?: Partial<Record<keyof TVars, any>>
  }[]
}

export const choiceHandler = defineCmd<ChoiceCmd<any, any>>((cmd, ctx) => {
  ctx.callbacks.onChoice(cmd.choices)
  return 'handled'
})
