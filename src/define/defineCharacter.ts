import type { CharDef } from '../types/config'

/**
 * 캐릭터 설정 객체를 정의할 때 타입 추론 및 자동완성을 돕는 헬퍼 함수입니다.
 * 별도의 모듈에서 캐릭터를 정의하고, `novel.config.ts`의 `characters`에 쉽게 추가할 수 있도록 돕습니다.
 *
 * @example
 * ```ts
 * // example/characters/my-character.ts
 * export const myCharacter = defineCharacter({
 *   name: 'my-character',
 *   images: {
 *     normal: {
 *       src: 'my-character-normal',
 *       width: 350,
 *       points: { face: { x: 0.5, y: 0.18 }, chest: { x: 0.5, y: 0.45 } }
 *     }
 *   }
 * });
 *
 * // example/novel.config.ts
 * characters: {
 *   'my-character-key': myCharacter
 * }
 * ```
 */
export function defineCharacter<const T extends CharDef>(def: T): T {
  return def
}
