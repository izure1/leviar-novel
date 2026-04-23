import { defineCmd } from '../define/defineCmd'
import type { UiKeysOf } from '../types/config'

/** 정의된 UI 요소를 페이드인/아웃한다 */
export interface UICmd<TConfig = any> {
  /** 조작할 UI 요소의 이름(아이디)입니다. */
  name: UiKeysOf<TConfig>
  /** 'show'는 UI를 표시하고, 'hide'는 숨깁니다. */
  action: 'show' | 'hide'
  /** UI 표시/숨김 시 적용되는 페이드 시간(ms 단위)입니다. (기본값: 800) */
  duration?: number
}

export const uiHandler = defineCmd<UICmd>((cmd, ctx) => {
  if (cmd.action === 'show') {
    ctx.ui.show(cmd.name, cmd.duration)
  } else {
    ctx.ui.hide(cmd.name, cmd.duration)
  }
  return true
})
