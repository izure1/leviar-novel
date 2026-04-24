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
  }
})
