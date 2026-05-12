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

let likeabilityInterval: ReturnType<typeof setInterval> | undefined

export default defineScene({
  config,
  variables: {
    _test: 0,
  },
  actions: {
    save: (element, ctx) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        save(ctx.novel)
      })
    },
    load: (element, ctx) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        load(ctx.novel)
      })
    },
    fullscreen: (element, ctx) => {
      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        ctx.novel.toggleFullscreen()
      })
    },
    likeability: (element, ctx) => {
      console.log(123, ctx, element)
      element.attribute.text = `<style color="rgb(255, 0, 0)">♥</style>: ${ctx.globalVars.likeability}`

      element.on('click', (e: MouseEvent) => {
        e.stopPropagation()
        ctx.localVars._test += 1
      })

      ctx.novel.hooker.onBefore('novel:var', (payload, ctx) => {
        if (payload.name === 'likeability') {
          const value = payload.newValue
          const gap = payload.newValue - payload.oldValue
          element.attribute.text = `<style color="rgb(255, 0, 0)">♥</style>: ${value}`

          const clone = <T>(t: T) => JSON.parse(JSON.stringify(t)) as T
          const gapText = gap > 0 ? '+' : ''

          const shadow = ctx.world.createText({
            attribute: { ...clone(element.attribute), text: gapText + gap.toString() },
            style: { ...clone(element.style), display: 'block' },
            transform: { ...clone(element.transform) },
            dataset: { ...clone(element.dataset) },
          })

          element.parent?.addChild(shadow)

          shadow.fadeOut(1000)
          shadow.animate({
            transform: {
              position: { y: '+=20' }
            }
          }, 1000, 'easeOutBack').on('end', () => shadow.remove())
        }
        return payload
      })
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
        text: '<style color="rgb(255, 0, 0)">♥</style>: -',
        position: { x: 50, y: -50 },
        style: {
          ...UI_BUTTON_STYLE,
          color: 'rgb(255, 255, 255)'
        },
        behaviors: ['likeability', 'hoverWhite'],
      }
    ]
  },

  label('start'),
  call('scene-start', { preserve: true, restore: true }),
  call('scene-outside', { preserve: true, restore: true }),
  call('scene-ending', { preserve: true, restore: true }),
  goto('start')
])
