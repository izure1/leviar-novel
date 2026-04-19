// example/novel.config.ts
import { defineNovelConfig } from '../src'

export default defineNovelConfig({
  vars: {
    likeability: 0,
    metHeroine: false,
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
    '아리시에로': {
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
        },
      },
    },
  },
  backgrounds: {
    'bg-floor': { src: 'bg_floor', parallax: true },
    'bg-library': { src: 'bg_library', parallax: true },
    'bg-park': { src: 'bg_park', parallax: true },
  },
  ui: {
    dialogueBg: { color: '#00000000', gradientType: 'linear', gradient: '0deg, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0) 100%', height: 168 },
    speaker: { fontSize: 27, fontWeight: 'bold', color: '#ffd966', borderWidth: 2, borderColor: 'rgb(255,255,255)' },
    dialogue: { fontSize: 18, color: '#f0f0f0', lineHeight: 1.65 },
    choice: {
      background: 'rgba(20,20,50,0.90)',
      borderColor: 'rgba(255,255,255,0.25)',
      hoverBackground: 'rgba(80,60,180,0.92)',
      hoverBorderColor: 'rgba(200,180,255,0.8)',
      borderRadius: 10,
      minWidth: 280,
    },
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
  effects: {
    rain: {
      clip: { impulse: 0 },
      particle: {
        attribute: { gravityScale: 1.5 },
        style: { width: 25, height: 100, blendMode: 'screen' }
      }
    }
  },
  fallback: [
    { type: 'character', action: 'show', defaults: { duration: 300 } },
    { type: 'character', action: 'remove', defaults: { duration: 1000 } },
    { type: 'dialogue', defaults: { speed: 60 } }
  ],
})
