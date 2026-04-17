// example/novel.config.ts
import { defineNovelConfig } from '../src'

export default defineNovelConfig({
  vars: {
    likeability:   0,
    metHeroine:    false,
    endingReached: false,
  },
  scenes: [
    'scene-intro',
    'scene-a',
    'scene-condition',
    'scene-effects',
    'explore-map',
  ] as const,
  characters: {
    heroine: {
      normal: {
        src: 'girl_normal',
        width: 350,
        points: {
          face:  { x: 0.5, y: 0.18 },
          chest: { x: 0.5, y: 0.45 },
        },
      },
      smile: {
        src: 'girl_smile',
        width: 350,
        points: {
          face: { x: 0.5, y: 0.18 },
        },
      },
    },
  },
  backgrounds: {
    'bg-floor':   { src: 'bg_floor',   parallax: true  },
    'bg-library': { src: 'bg_library', parallax: true  },
    'bg-park':    { src: 'bg_park',    parallax: false },
  },
})
