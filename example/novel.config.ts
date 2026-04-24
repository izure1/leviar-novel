// example/novel.config.ts
import { defineNovelConfig, define } from '../src'
import chat from './characters/chat'
import zena from './characters/zena'

const testModule = define<{ message?: string }>({ message: undefined })
testModule.defineView((_data, _ctx) => ({ show: () => {}, hide: () => {} }))
testModule.defineCommand<{ message: string }>((cmd, ctx) => {
  console.log('[test-cmd]', cmd.message, ctx.globalVars)
  return true
})

export default defineNovelConfig({
  vars: {
    likeability: 0,
    metHeroine: false,
    endingReached: false,
  },
  modules: {
    'test-cmd': testModule,
  },
  scenes: [
    'scene-zena',
    'scene-zena-game',
    'scene-zena-food',
    'scene-zena-stream',
    'scene-zena-outside',
    'scene-zena-bug',
    'scene-zena-ending',
  ] as const,
  characters: {
    'chat': chat,
    'zena': zena,
  },
  backgrounds: {
    'bg-floor': { src: 'bg_floor', parallax: true },
    'bg-library': { src: 'bg_library', parallax: true },
    'bg-park': { src: 'bg_park', parallax: true },
  },
  assets: {
    // 배경
    bg_floor: './assets/bg_floor.png',
    bg_library: './assets/bg_library.png',
    bg_park: './assets/bg_park.png',
    // 캐릭터
    girl_normal: './assets/girl_normal.png',
    girl_smile: './assets/girl_smile.png',
    // 파티클
    dust: './assets/particle_dust.png',
    rain: './assets/particle_rain.png',
    snow: './assets/particle_snow.png',
    sakura: './assets/particle_sakura.png',
    fog: './assets/particle_fog.png',
  },
  fallback: [
    { type: 'character', action: 'show', defaults: { duration: 300 } },
    { type: 'character', action: 'remove', defaults: { duration: 1000 } },
  ],
})

