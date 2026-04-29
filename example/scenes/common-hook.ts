import config from '../novel.config'
import { defineHook } from '../../src'

export const commonHooks = defineHook(config, {
  'dialogue:text': (state) => {
    return state
  }
})
