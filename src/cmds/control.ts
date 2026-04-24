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
    const saved = ctx.cmdState.get('control')
    const expireAt = saved?.expireAt ?? Date.now() + cmd.duration

    if (!saved?.expireAt) {
      ctx.cmdState.set('control', { expireAt })
      ctx.callbacks.disableInput(cmd.duration)
    }

    // 만료됐으면 완료, 아직이면 대기(재실행 시 재확인)
    if (Date.now() >= expireAt) {
      ctx.cmdState.set('control', {})
      return true
    }
    return false
  }
  return true
})
