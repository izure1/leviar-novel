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
    background: 'rgba(20,20,50,0.90)',
    borderColor: 'rgba(255,255,255,0.25)',
    hoverBackground: 'rgba(80,60,180,0.92)',
    hoverBorderColor: 'rgba(200,180,255,0.8)',
    borderRadius: 10,
    minWidth: 280,
  },
})
