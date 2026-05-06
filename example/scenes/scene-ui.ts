import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene({
  config
})(() => [
  { type: 'overlay-text', action: 'show', name: 'test', preset: 'caption', text: '테스트입니다' },
])
