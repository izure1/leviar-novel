import type { CharDefs } from '../types/config'
import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

export interface DialogueCmd<TCharacters extends CharDefs> {
  speaker?: keyof TCharacters & string
  text: string | string[]
  speed?: number
}

export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx) => {
  const txt = Array.isArray(cmd.text) ? cmd.text[ctx.scene.getTextSubIndex()] : cmd.text
  const interpolated = ctx.scene.interpolateText(txt)
  ctx.callbacks.onDialogue(cmd.speaker as string | undefined, interpolated, cmd.speed)
  return false
})
