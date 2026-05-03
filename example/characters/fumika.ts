import { defineCharacter } from '../../src'

export default defineCharacter({ name: '후미카' })({
  bases: {
    normal: {
      src: 'fumika_base_normal',
      width: 560,
      points: {
        face: { x: 0.445, y: 0.06 },
        chest: { x: 0.5, y: 0.45 },
      }
    }
  },
  emotions: {
    normal: { face: 'fumika_emotion_base_normal' },
    smile: { face: 'fumika_emotion_base_smile' },
    angry: { face: 'fumika_emotion_base_angry' },
    embarrassed: { face: 'fumika_emotion_base_embarrassed' },
  }
})
