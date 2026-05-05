// example/novel.config.ts
import { defineNovelConfig, define } from '../src'
import chat from './characters/chat'
import fumika from './characters/fumika'

const testModule = define<{ message: string }>()
testModule
  .onBoot(async (world) => {
    console.log('booting...')
  })
  .defineView((_ctx, _data, _setState) => ({ show: () => { }, hide: () => { }, onCleanup: () => { } }))
  .defineCommand(function* (cmd, ctx) {
    console.log('[test-cmd]', cmd.message, ctx.globalVars)
    return true
  })

const debugModule = define<{
  on: boolean
}, {
  on: boolean
}>({ on: false })
debugModule
  .defineView((_ctx, _state, _setState) => ({
    show: () => { },
    hide: () => { },
    onCleanup: () => { },
    onUpdate: (ctx, state, setState) => {
      ctx.world.debugMode = state.on
    }
  }))
  .defineCommand(function* (cmd, ctx, state, setState) {
    setState({ on: !state.on })
    return true
  })

export default defineNovelConfig({
  width: 1280,
  height: 720,
  variables: {
    likeability: 0,
    metHeroine: false,
    endingReached: false,
    useHeroineVoice: true,
    username: '',
  },
  modules: {
    'test-cmd': testModule,
    'debug': debugModule,
  },
  scenes: [
    'scene-start',
    'scene-game',
    'scene-food',
    'scene-stream',
    'scene-outside',
    'scene-bug',
    'scene-sub',
    'scene-ending',
  ],
  characters: {
    'chat': chat,
    'fumika': fumika,
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
    // 캐릭터 베이스
    fumika_base_normal: './assets/fumika_base_normal.png',

    // 캐릭터 표정
    fumika_emotion_base_normal: './assets/fumika_emotion_base_normal.png',
    fumika_emotion_base_angry: './assets/fumika_emotion_base_angry.png',
    fumika_emotion_base_smile: './assets/fumika_emotion_base_smile.png',
    fumika_emotion_base_embarrassed: './assets/fumika_emotion_base_embarrassed.png',

    img_card_heroine: './assets/img_card_hero.png',
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

