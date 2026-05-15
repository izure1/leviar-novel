import { defineAssets } from 'fumika'

/**
 * 게임에서 사용하는 모든 에셋의 키-경로 맵입니다.
 * `defineCharacter`, `defineBackgrounds` 등에서 타입추론 기반으로 사용됩니다.
 */
export default defineAssets({
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
  // 기타 이미지
  img_card_heroine: './assets/img_card_hero.png',
  // 파티클
  dust: './assets/particle_dust.png',
  rain: './assets/particle_rain.png',
  snow: './assets/particle_snow.png',
  sakura: './assets/particle_sakura.png',
  fog: './assets/particle_fog.png',
})
