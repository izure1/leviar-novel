import type { Style } from 'leviar'
import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

const UI_BUTTON_STYLE: Partial<Style> = {
  fontSize: 22,
  fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
  color: 'rgba(255, 255, 255, 0.6)',
  textAlign: 'center',
  textShadowBlur: 1,
  textShadowOffsetX: 1,
  textShadowOffsetY: 1,
  textShadowColor: 'rgba(0, 0, 0, 1)',
  cursor: 'pointer',
}

export default defineScene({
  config,
  initial: commonInitial,
})(({ call }) => [
  {
    type: 'dialogBox',
    title: '음성 제어',
    content: '히로인의 음성 합성 기능을 사용하시겠습니까?',
    buttons: [
      {
        text: '예',
        var: { useHeroineVoice: true }
      },
      {
        text: '아니오',
        var: { useHeroineVoice: false }
      }
    ]
  },
  call('scene-ui', { preserve: true, restore: true })
])
