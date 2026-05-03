import config from '../novel.config'
import {
  defineInitial,
  DEFAULT_DIALOG_BOX_STYLE,
  DEFAULT_DIALOGUE_LAYOUT,
  DEFAULT_CHOICE_LAYOUT,
  DEFAULT_INPUT_STYLE,
  DEFAULT_INPUT_LAYOUT
} from '../../src'

export const commonInitial = defineInitial(config)({
  'debug': {
    on: true
  },
  'dialogue': {
    bg: {
      gradientType: 'linear',
      gradient: '0deg, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%',
      height: 270,
    },
    speaker: {
      fontSize: 44,
      fontWeight: 'bold',
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
      color: '#daacffff',
      // borderWidth: 2,
      // borderColor: 'rgb(255,255,255)',
      textShadowOffsetX: 3,
      textShadowOffsetY: 3,
      textShadowBlur: 0,
      textShadowColor: 'rgb(0,0,0)',
    },
    text: {
      fontSize: 28,
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
      color: '#f0f0f0',
      lineHeight: 1.65,
      textShadowOffsetX: 2,
      textShadowOffsetY: 2,
      textShadowBlur: 0,
      textShadowColor: 'rgb(0,0,0)',
    },
    layout: {
      ...DEFAULT_DIALOGUE_LAYOUT,
      panelPaddingBottom: 0,
    }
  },
  'choice': {
    button: {
      minWidth: 960,
      maxWidth: 960,
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
      fontSize: 28,
      fontFamily: 'Google Sans Flex,Google Sans,Helvetica Neue,sans-serif',
    },
    textHover: {
      color: '#fff0b3',
      textShadowBlur: 6,
      textShadowColor: 'rgba(255,255,255,0.8)',
    },
    layout: {
      ...DEFAULT_CHOICE_LAYOUT,
      buttonPaddingBottom: 24,
      buttonPaddingTop: 24,
      gap: 24,
    }
  },
  'dialogBox': {
    panel: {
      ...DEFAULT_DIALOG_BOX_STYLE.panel,
      minWidth: 720,
      maxWidth: 720,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255, 0.5)',
    },
    titleStyle: {
      ...DEFAULT_DIALOG_BOX_STYLE.titleStyle,
      fontSize: DEFAULT_DIALOG_BOX_STYLE.titleStyle.fontSize! * 1.6,
    },
    contentStyle: {
      ...DEFAULT_DIALOG_BOX_STYLE.contentStyle,
      fontSize: DEFAULT_DIALOG_BOX_STYLE.contentStyle.fontSize! * 1.6,
    },
    buttonText: {
      ...DEFAULT_DIALOG_BOX_STYLE.buttonText,
      fontSize: DEFAULT_DIALOG_BOX_STYLE.buttonText.fontSize! * 1.6,
    },
    layout: {
      panelPaddingTop: 60,
      panelPaddingBottom: 60,
      contentButtonGap: 45,
      buttonColumnGap: 12,
    }
  },
  'input': {
    panel: {
      ...DEFAULT_INPUT_STYLE.panel,
      minWidth: 720,
      maxWidth: 720,
      minHeight: 240,
      maxHeight: 240,
    },
    labelStyle: {
      ...DEFAULT_INPUT_STYLE.labelStyle,
      fontSize: DEFAULT_INPUT_STYLE.labelStyle.fontSize! * 1.6,
    },
    inputTextStyle: {
      ...DEFAULT_INPUT_STYLE.inputTextStyle,
      fontSize: DEFAULT_INPUT_STYLE.inputTextStyle.fontSize! * 1.6,
    },
    buttonText: {
      ...DEFAULT_INPUT_STYLE.buttonText,
      fontSize: DEFAULT_INPUT_STYLE.buttonText.fontSize! * 1.6,
    },
    layout: {
      ...DEFAULT_INPUT_LAYOUT,
      inputPaddingTop: 60,
      inputPaddingBottom: 60,
      contentButtonGap: 45,
      buttonColumnGap: 12,
    }
  }
})
