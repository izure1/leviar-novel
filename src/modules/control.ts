import { define } from '../define/defineCmdUI'

/** 사용자의 입력을 제어한다 */
export interface ControlCmd {
  /** 제어할 액션의 종류입니다. (현재 'disable'만 지원) */
  action: 'disable'
  /** 입력 제어를 유지할 시간(ms)입니다. */
  duration: number
}

export interface ControlSchema {
  expireAt: number
}

const controlModule = define<ControlCmd, ControlSchema>({ expireAt: 0 })

controlModule.defineView((_ctx, _data, _setState) => ({ show: () => {}, hide: () => {} }))

controlModule.defineCommand(function* (cmd, ctx, state, setState) {
  if (cmd.action === 'disable' && typeof cmd.duration === 'number') {
    const expireAt = state.expireAt > Date.now() ? state.expireAt : Date.now() + cmd.duration

    if (state.expireAt <= Date.now()) {
      setState({ expireAt })
      ctx.callbacks.disableInput(cmd.duration)
    }

    while (Date.now() < expireAt) {
      yield false
    }
    
    setState({ expireAt: 0 })
    return true
  }
  return true
})

export default controlModule

/** @internal */
export const controlHandler = (p: any, ctx: any) => controlModule.__handler!(p, ctx)
