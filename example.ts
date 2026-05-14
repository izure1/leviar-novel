interface Assets {
  [key: string]: string
}

interface Backgrounds<T extends Assets> {
  [key: string]: {
    src: keyof T
    parallax?: boolean
  }
}

interface Audios<T extends Assets> {
  [key: string]: {
    src: keyof T
  }
}

interface CharacterBase<T extends Assets> {
  [key: string]: {
    src: keyof T
    width: number
    points: {
      [key: string]: {
        x: number
        y: number
      }
    }
  }
}

interface CharacterEmotion<T extends Assets, U extends CharacterBase<T>> {
  [key: string]: {
    [key in keyof U[keyof U]['points']]: keyof T
  }
}


interface Character<T extends Assets, U extends CharacterBase<T>, V extends CharacterEmotion<T, U>> {
  name: string
  bases: U
  emotions: V
}


function defineAssets<T extends Assets>(assets: T): T {
  return assets
}

function defineBackgrounds<T extends Assets>(assets: T) {
  return <U extends Backgrounds<T>>(backgrounds: U) => backgrounds
}

function defineAudios<T extends Assets>(assets: T) {
  return <U extends Audios<T>>(audios: U) => audios
}

function defineCharacter<T extends Assets>(assets: T) {
  return <N extends string, U extends CharacterBase<T>, V extends CharacterEmotion<T, U>>(
    name: N,
    bases: U,
    emotions: V
  ) => ({
    name,
    bases,
    emotions
  })
}

const assets = defineAssets({
  'test': '123.mp3',
  'test2': '1234.mp3',
})

const backgrounds = defineBackgrounds(assets)({
  'bg_floor': {
    src: 'test',
  },
  'asdf': {
    src: 'test2'
  }
})

const characterA = defineCharacter(assets)('후미카', {
  idle: {
    src: 'test',
    width: 560,
    points: {
      face: { x: 0.5, y: 0.1 },
      chest: { x: 0.5, y: 0.25 },
    }
  }
}, {
  normal: {
    face: 'test',
    chest: 'test2',
  }
})

const characterB = defineCharacter(assets)('나', {
  fight: {
    src: 'test',
    width: 500,
    points: {
      hair: { x: 0.5, y: 0.5 },
      legs: { x: 0.5, y: 0.5 },
    }
  }
}, {
  normal: {
    hair: 'test',
    legs: 'test2'
  }
})
