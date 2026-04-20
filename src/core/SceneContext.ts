import type { World } from 'leviar'
import type { Renderer } from './Renderer'
import type { SceneCallbacks } from './Scene'
import type { CustomCmdContext } from '../types/config'

export interface SceneContext<TVars = any, TLocalVars = any> extends CustomCmdContext<TVars, TLocalVars> {
  renderer: Renderer
  callbacks: SceneCallbacks
  scene: {
    getTextSubIndex: () => number
    interpolateText: (text: string) => string
    jumpToLabel: (label: string) => void
    hasLabel: (label: string) => boolean
    getVars: () => TVars & TLocalVars
    setGlobalVar: (key: string, value: any) => void
    setLocalVar: (key: string, value: any) => void
    loadScene: (name: string) => void
    end: () => void
  }
}

export type CommandResult = boolean | 'handled' | void
