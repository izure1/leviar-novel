import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene({
  config,
  actions: {
    save: (ctx, vars) => {
      try {
        const data = ctx.novel.save()
        localStorage.setItem('fumika-save', JSON.stringify(data))
        console.log('[scene-ui] 저장 완료')
      } catch (e) {
        console.warn('[scene-ui] 저장 실패:', e)
      }
      ctx.execute({ type: 'should be error' })
    },
    load: (ctx) => {
      try {
        const raw = localStorage.getItem('fumika-save')
        if (raw) {
          ctx.novel.loadSave(JSON.parse(raw))
          console.log('[scene-ui] 로드 완료')
        } else {
          console.warn('[scene-ui] 저장 데이터 없음')
        }
      } catch (e) {
        console.warn('[scene-ui] 로드 실패:', e)
      }
    },
  },
})(() => [
  // ── 사이드 패널 ──────────────────────────────────────
  {
    type: 'element',
    action: 'show',
    id: 'panel',
    kind: 'rect',
    position: { x: 0.95, y: 0.15 },
    style: {
      width: 80,
      height: 120,
      color: 'rgba(0, 0, 0, 0.4)',
      borderRadius: 8,
    },
    children: [
      // 저장 버튼
      {
        id: 'btn_save',
        kind: 'rect',
        position: { x: 0, y: 25 },
        style: {
          width: 60,
          height: 28,
          color: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
        },
        hoverStyle: { color: 'rgba(100, 140, 255, 0.5)' },
        onClick: 'save',
        children: [
          {
            id: 'btn_save_text',
            kind: 'text',
            text: '💾 저장',
            style: { fontSize: 13, color: '#ffffff' },
          }
        ]
      },
      // 로드 버튼
      {
        id: 'btn_load',
        kind: 'rect',
        position: { x: 0, y: -15 },
        style: {
          width: 60,
          height: 28,
          color: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
        },
        hoverStyle: { color: 'rgba(100, 255, 140, 0.5)' },
        onClick: 'load',
        children: [
          {
            id: 'btn_load_text',
            kind: 'text',
            text: '📂 로드',
            style: { fontSize: 13, color: '#ffffff' },
          }
        ]
      },
    ]
  },
])
