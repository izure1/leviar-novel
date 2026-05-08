import type { Style } from 'leviar'
import config from '../novel.config'
import { defineHook, defineScene } from '../../src'
import { save, load } from '../main'

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
  actions: {
    save: (ctx, vars) => {
      save(ctx.novel)
    },
    load: (ctx) => {
      load(ctx.novel)
    },
    fullscreen(ctx, vars) {
      ctx.novel.toggleFullscreen()
    },
    log(ctx, vars) {
      console.log(ctx, vars)
    }
  },
})(() => [
  // ── 하단 패널 (우측 하단) ─────────────────────────────
  {
    type: 'element',
    action: 'show',
    id: 'panel',
    kind: 'rect',
    position: { x: 0.85, y: 0.95 },
    style: {
      width: 180,
      height: 40,
      color: 'rgba(0, 0, 0, 0)', // 투명 컨테이너
    },
    children: [
      // 저장 버튼 (텍스트)
      {
        id: 'btn_save',
        kind: 'text',
        text: '저장하기',
        position: { x: -120, y: 0 },
        style: {
          ...UI_BUTTON_STYLE,
        },
        hoverStyle: { color: 'rgba(255, 255, 255, 1)' },
        onClick: 'save',
      },
      // 로드 버튼 (텍스트)
      {
        id: 'btn_load',
        kind: 'text',
        text: '불러오기',
        position: { x: 0, y: 0 },
        style: {
          ...UI_BUTTON_STYLE,
        },
        hoverStyle: { color: 'rgba(255, 255, 255, 1)' },
        onClick: 'load',
      },
      // 전체화면 버튼
      {
        id: 'btn_fullscreen',
        kind: 'text',
        text: '전체화면',
        position: { x: 120, y: 0 },
        style: {
          ...UI_BUTTON_STYLE,
        },
        hoverStyle: { color: 'rgba(255, 255, 255, 1)' },
        onClick: 'fullscreen',
      },
    ]
  },

  // 사이드바
  {
    type: 'element',
    action: 'show',
    id: 'sidebar',
    kind: 'rect',
    uiTags: ['default-ui'],
    position: { x: 0.9, y: 0.05 },
    style: {
      width: 200,
      height: 600,
    },
    children: [
      {
        kind: 'text',
        action: 'show',
        id: 'text_like',
        text: '<style color="rgb(255, 0, 0)">♥</style> {{ likeability }}',
        position: { x: 0, y: 0 },
        style: {
          ...UI_BUTTON_STYLE,
          color: 'rgb(255, 255, 255)'
        },
        hoverStyle: { color: 'rgba(255, 255, 255, 1)' },
        onClick: 'log',
      },
    ]
  }
])
