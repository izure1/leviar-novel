import config from '../novel.config'
import { defineInitial } from '../../src'

export const commonInitial = defineInitial(config, {
  'dialogue': {
    bg: {
      color: '#00000000',
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
    },
  },
  'choice': {
    button: {
      color: 'rgba(20,20,50,0.90)',
      borderColor: 'rgba(255,255,255,0.25)',
      borderRadius: 10,
      minWidth: 280,
    },
    buttonHover: {
      color: 'rgba(80,60,180,0.92)',
      borderColor: 'rgba(200,180,255,0.8)',
    },
    textHover: {
      color: '#fff0b3', // 노란빛 호버 텍스트 예시
      textShadowBlur: 4,
      textShadowColor: 'rgba(255,255,255,0.8)',
    }
  },
})
