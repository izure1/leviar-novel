import { define } from '../define/defineCmdUI'

/** 사용자의 입력을 제어한다 */
export interface ControlCmd {
  action: 'disable'
  duration: number
}

export interface ControlSchema {
  expireAt: number
}

const controlModule = define<ControlCmd, ControlSchema>({ expireAt: 0 })

controlModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))

controlModule.defineCommand(function* (cmd, ctx, data) {
  if (cmd.action === 'disable' && typeof cmd.duration === 'number') {
    const expireAt = data.expireAt > Date.now() ? data.expireAt : Date.now() + cmd.duration

    if (data.expireAt <= Date.now()) {
      data.expireAt = expireAt
      ctx.callbacks.disableInput(cmd.duration)
    }

    while (Date.now() < expireAt) {
      yield false
    }
    
    data.expireAt = 0
    return true
  }
  return true
})

export default controlModule

/** @internal */
export const controlHandler = (p: any, ctx: any) => controlModule.__handler!(p, ctx)
