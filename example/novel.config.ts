// example/novel.config.ts
import { defineNovelConfig, define } from '../src'
import chat from './characters/chat'
import zena from './characters/zena'

const testModule = define<{ message: string, $callback: (now: number) => void }>()
testModule
  .onBoot(async (world) => {
    console.log('booting...')
  })
  .defineView((_data, _ctx) => ({ show: () => { }, hide: () => { } }))
  .defineCommand(function* (cmd, ctx) {
    cmd.$callback(Date.now())
    console.log('[test-cmd]', cmd.message, ctx.globalVars)
    return true
  })

const forModule = define<{
  start: number
  end: number
  acc?: number
}, {
  start: number
  end: number
  acc: number
}>({ start: 0, end: 0, acc: 1 })
forModule
  .defineView(() => ({ show: () => { }, hide: () => { } }))
  .defineCommand(function* (cmd, ctx, state) {
    for (let i = cmd.start; i < cmd.end; i += (cmd.acc ?? 1)) {
      yield* ctx.execute({ type: 'dialogue', text: () => `dialog ${i}` })
    }
    return true
  })

export default defineNovelConfig({
  width: 800,
  height: 450,
  vars: {
    likeability: 0,
    metHeroine: false,
    endingReached: false,
    useHeroineVoice: true,
    username: '',
  },
  modules: {
    'test-cmd': testModule,
    'for': forModule,
  },
  scenes: [
    'scene-zena',
    'scene-zena-game',
    'scene-zena-food',
    'scene-zena-stream',
    'scene-zena-outside',
    'scene-zena-bug',
    'scene-zena-ending',
  ],
  characters: {
    'chat': chat,
    'zena': zena,
  },
  backgrounds: {
    'floor': { src: 'bg_floor', parallax: true },
    'room': { src: 'bg_room', parallax: true },
    'park': { src: 'bg_park', parallax: true },
  },
  audios: {
    'am223': './assets/bgm_am223.mp3',
    'daytime': './assets/bgm_daytime.mp3',
  },
  assets: {
    // 배경
    bg_floor: './assets/bg_floor.png',
    bg_room: './assets/bg_room.png',
    bg_park: './assets/bg_park.png',
    // 캐릭터
    girl_normal: './assets/girl_normal.png',
    girl_smile: './assets/girl_smile.png',
    girl_embarrassed: './assets/girl_embarrassed.png',
    girl_angry: './assets/girl_angry.png',
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
  effects: {
    sakura: {
      clip: {
        size: [
          [1.0, 2.0],
        ]
      }
    }
  }
})

