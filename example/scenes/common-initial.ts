import config from '../novel.config'
import { defineInitial } from '../../src'

export const commonInitial = defineInitial(config, {
  'dialogue': {
    bg: {
      gradientType: 'linear',
      gradient: '0deg, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%',
      height: 168,
    },
    speaker: {
      fontSize: 27,
      fontWeight: 'bold',
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
      color: '#daacffff',
      // borderWidth: 2,
      // borderColor: 'rgb(255,255,255)',
      textShadowOffsetX: 2,
      textShadowOffsetY: 2,
      textShadowBlur: 0,
      textShadowColor: 'rgb(0,0,0)',
    },
    text: {
      fontSize: 18,
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
      color: '#f0f0f0',
      lineHeight: 1.65,
      textShadowOffsetX: 1,
      textShadowOffsetY: 1,
      textShadowBlur: 0,
      textShadowColor: 'rgb(0,0,0)',
    },
  },
  'choice': {
    layout: {
      buttonMinWidth: 600,
      buttonMaxWidth: 600,
    },
    button: {
      color: undefined,
      borderWidth: undefined,
      borderColor: undefined,
      gradientType: 'linear',
      gradient: '90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%',
    },
    buttonHover: {
      gradient: '90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 20%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0) 100%',
    },
    text: {
      color: 'rgb(255,255,255)',
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
    },
    textHover: {
      color: '#fff0b3', // 노란빛 호버 텍스트 예시
      textShadowBlur: 4,
      textShadowColor: 'rgba(255,255,255,0.8)',
    }
  },
})
