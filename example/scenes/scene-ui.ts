import type { Style } from 'leviar'
import config from '../novel.config'
import { defineHook, defineScene } from '../../src'
import { save, load } from '../main'

const UI_BUTTON_STYLE: Partial<Style> = {
  minWidth: 100,
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
  variables: {
    _test: 0,
  },
  actions: {
    save: (element, ctx, vars) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        save(ctx.novel)
      })
    },
    load: (element, ctx, vars) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        load(ctx.novel)
      })
    },
    fullscreen: (element, ctx, vars) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        ctx.novel.toggleFullscreen()
      })
    },
    log: (element, ctx, vars) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        ctx.localVars._test += 1
        console.log(ctx, vars)
      })
      setInterval(() => {
        element.attribute.text = `<style color="rgb(255, 0, 0)">♥</style> ${vars.likeability}`
      }, 1000)
    },
    hoverWhite: (element) => {
      element.on('mouseover', () => {
        element.animate({ style: { color: 'rgba(255, 255, 255, 1)' } }, 150)
      })
      element.on('mouseout', () => {
        element.animate({ style: { color: 'rgba(255, 255, 255, 0.6)' } }, 150)
      })
    },
  },
})(({ label, goto, call }) => [
  // ── 하단 패널 (우측 하단) ─────────────────────────────
  {
    type: 'element',
    action: 'show',
    id: 'panel',
    kind: 'rect',
    position: { x: 1090, y: 684 },
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
        behaviors: ['save', 'hoverWhite'],
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
        behaviors: ['load', 'hoverWhite'],
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
        behaviors: ['fullscreen', 'hoverWhite'],
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
    position: { x: 1080, y: 0 },
    pivot: { x: 0, y: 0 },
    style: {
      width: 200,
      height: 600,
    },
    children: [
      {
        kind: 'text',
        action: 'show',
        id: 'text_like',
        text: '<style color="rgb(255, 0, 0)">♥</style> 0',
        position: { x: 50, y: -50 },
        style: {
          ...UI_BUTTON_STYLE,
          color: 'rgb(255, 255, 255)'
        },
        behaviors: ['log', 'hoverWhite'],
      },
    ]
  },

  label('start'),
  call('scene-start', { preserve: true, restore: true }),
  call('scene-outside', { preserve: true, restore: true }),
  call('scene-ending', { preserve: true, restore: true }),
  goto('start')
])
