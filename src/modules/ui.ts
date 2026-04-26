import type { ModuleKeysOf } from '../types/config'
import { define } from '../define/defineCmdUI'

/** UI 모듈을 show/hide 한다 */
export interface UICmd<TConfig = any> {
  /** 조작할 모듈의 이름(modules의 key)입니다. */
  name: ModuleKeysOf<TConfig>
  /** 수행할 동작(보이기/숨기기)입니다. */
  action: 'show' | 'hide'
  /** 전환 애니메이션의 지속 시간(ms)입니다. */
  duration?: number
}

const uiModule = define<UICmd<any>>({})

uiModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))

uiModule.defineCommand(function* (cmd, ctx) {
  if (cmd.action === 'show') {
    ctx.ui.show(cmd.name, cmd.duration)
  } else {
    ctx.ui.hide(cmd.name, cmd.duration)
  }
  return true
})

export default uiModule

/** @internal */
export const uiHandler = (p: any, ctx: any) => uiModule.__handler!(p, ctx)
