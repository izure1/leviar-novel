import { define } from '../define/defineCmdUI'

/**
 * 루프 또는 goto 이동을 위한 마커
 *
 * @example
 * ```ts
 * { type: 'label', name: 'chapter1_start' }
 * ```
 */
export interface LabelCmd {
  name: string
}

const labelModule = define<Record<never, never>>({})

labelModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))

labelModule.defineCommand<LabelCmd>((_cmd, _ctx) => {
  return true
})

export default labelModule

/** @internal */
export const labelHandler = (p: any, ctx: any) => labelModule.__handler!(p, ctx)
