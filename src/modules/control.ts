import { define } from '../define/defineCmdUI'

/** 사용자의 입력을 제어한다 */
export interface ControlCmd {
  /** 제어할 액션의 종류입니다. (현재 'disable'만 지원) */
  action: 'disable'
  /** 입력 제어를 유지할 시간(ms)입니다. */
  duration: number
  /** duration이 완료된 후 자동으로 넘어갈지 여부입니다. 기본값은 true 입니다. */
  autoAdvance?: boolean
}

export interface ControlSchema {
}

const controlModule = define<ControlCmd, ControlSchema>({})

controlModule.defineView((_ctx, _data, _setState) => ({ show: () => { }, hide: () => { }, onCleanup: () => { } }))

controlModule.defineCommand(function* (cmd, ctx, state, setState) {
  const now = Date.now() + cmd.duration
  const autoAdvance = cmd.autoAdvance ?? true

  if (autoAdvance) {
    setTimeout(() => ctx.callbacks.advance(), cmd.duration)
  }

  while (Date.now() < now) {
    yield false
  }

  return autoAdvance
})

export default controlModule

/** @internal */
export const controlHandler = (p: any, ctx: any) => controlModule.__handler!(p, ctx)
