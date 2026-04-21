import type { CharDefs } from '../types/config'
import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

/** 
 * 대사 또는 나레이션 출력 
 * 
 * @example
 * ```ts
 * { type: 'dialogue', speaker: 'hero', text: 'Hello world!', speed: 50 }
 * // 또는 나레이션
 * { type: 'dialogue', text: ['첫 번째 줄', '두 번째 줄'] }
 * ```
 */
export interface DialogueCmd<TCharacters extends CharDefs> {
  /** 
   * 화자의 이름 (config.characters의 키). 
   * 생략할 경우 화자 이름 없이 나레이션으로 처리됩니다.
   */
  speaker?: keyof TCharacters & string
  /** 화면에 출력할 텍스트입니다. 배열일 경우 여러 줄로 출력될 수 있습니다. */
  text: string | string[]
  /** 
   * 텍스트가 한 글자씩 출력되는 속도(ms 단위)입니다. 
   * 미지정 시 시스템 설정 속도 또는 기본값(예: 30ms)이 사용됩니다.
   */
  speed?: number
}

export const dialogueHandler = defineCmd<DialogueCmd<any>>((cmd, ctx) => {
  const txt = Array.isArray(cmd.text) ? cmd.text[ctx.scene.getTextSubIndex()] : cmd.text
  const interpolated = ctx.scene.interpolateText(txt)
  
  let speakerName = cmd.speaker as string | undefined
  if (speakerName) {
    const charDefs = ctx.renderer.config.characters as any
    const def = charDefs?.[speakerName]
    if (def?.name) {
      speakerName = def.name
    }
  }

  ctx.callbacks.onDialogue(speakerName, interpolated, cmd.speed)
  return false
})
