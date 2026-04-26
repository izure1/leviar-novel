import { defineCharacter } from '../../src'

export default defineCharacter({
  name: '제나',
  images: {
    normal: {
      src: 'girl_normal',
      width: 350,
      points: {
        face: { x: 0.5, y: 0.18 },
        chest: { x: 0.5, y: 0.45 },
        legs: { x: 0.5, y: 0.55 },
      },
    },
    smile: {
      src: 'girl_smile',
      width: 350,
      points: {
        face: { x: 0.5, y: 0.18 },
        chest: { x: 0.5, y: 0.45 },
      },
    },
    angry: {
      src: 'girl_angry',
      width: 350,
      points: {
        face: { x: 0.5, y: 0.18 },
        chest: { x: 0.5, y: 0.45 },
      },
    },
    embarrassed: {
      src: 'girl_embarrassed',
      width: 350,
      points: {
        face: { x: 0.5, y: 0.18 },
        chest: { x: 0.5, y: 0.45 },
      },
    },
  }
})
