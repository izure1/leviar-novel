import { defineCmd } from '../define/defineCmd'

/** 
 * 루프 또는 goto 이동을 위한 마커 
 * 
 * @example
 * ```ts
 * { type: 'label', name: 'chapter1_start' }
 * ```
 */
export interface LabelCmd {
  /** 마커의 고유 이름입니다. `goto` 명령어 등에서 식별자로 사용됩니다. */
  name: string
}

export const labelHandler = defineCmd<LabelCmd>((_cmd, _ctx) => {
  return true
})
