// example/scenes/explore-map.ts
// 테스트: defineExploreScene, 클릭으로 씬 전환
import config from '../novel.config'
import { defineExploreScene } from '../../src'

export default defineExploreScene(config, 'explore-map', {
  background: 'bg-rooftop',
  objects: [
    {
      name:     'door-to-intro',
      position: { x: 180, y: 300 },
      src:      'door',
      next:     'scene-intro',
      width:    90,
      height:   160,
    },
    {
      name:     'window-to-effects',
      position: { x: 520, y: 280 },
      src:      'window-obj',
      next:     'scene-effects',
      width:    110,
      height:   130,
    },
  ],
})
