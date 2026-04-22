import type { SceneContext } from '../core/SceneContext'
import { defineCmd } from '../define/defineCmd'

/** 사용자의 입력을 제어한다 (예: 일정 시간 동안 진행 무시) */
export interface ControlCmd {
  /** 'disable'은 일정 시간 동안 사용자의 클릭 등 입력을 차단합니다. */
  action: 'disable'
  /** 입력을 차단할 시간(ms 단위)입니다. */
  duration: number
}

export const controlHandler = defineCmd<ControlCmd>((cmd, ctx) => {
  if (cmd.action === 'disable' && typeof cmd.duration === 'number') {
    ctx.callbacks.disableInput(cmd.duration)
    const expireAt = Date.now() + cmd.duration
    // TickFn: 차단 시간 만료 전까지 입력 무시, 만료 후 다음 스텝
    return () => Date.now() >= expireAt
  }
  return true
})
