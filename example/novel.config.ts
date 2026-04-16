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
        src: 'char-normal',
        width: 300,
        points: {
          face:  { x: 0.5, y: 0.20 },
          chest: { x: 0.5, y: 0.45 },
        },
      },
      happy: {
        src: 'char-happy',
        width: 300,
        points: {
          face: { x: 0.5, y: 0.20 },
        },
      },
    },
  },
  backgrounds: {
    'bg-room':    { src: 'bg-room',    parallax: true  },
    'bg-rooftop': { src: 'bg-rooftop', parallax: false },
  },
})
