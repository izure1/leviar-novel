import type { CharDef, CharBaseDef } from '../types/config'

type UnionPointsOf<TBases extends Record<string, CharBaseDef>> = {
  [K in keyof TBases]: keyof NonNullable<TBases[K]['points']>
}[keyof TBases] & string

/**
 * T가 Shape의 허용 키만 가지면 T, 아니면 never.
 * 허용 외 키 사용 시 타입 오류를 유발합니다.
 */
type Exact<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
  ? T
  : never
  : never

/**
 * 캐릭터를 정의하는 헬퍼 함수입니다.
 *
 * ```ts
 * defineCharacter(def)
 * ```
 *
 * - `emotions` 키: `bases.*.points` 키에서 추론, 허용 외 키 → 타입 오류
 * - `emotions` 값: `string`
 *
 * @example
 * ```ts
 * export default defineCharacter({
 *   name: '후미카',
 *   bases: {
 *     normal: { src: '...', width: 560, points: { face: { x: 0.5, y: 0.18 } } }
 *   },
 *   emotions: {
 *     normal: { face: 'fumika_emotion_base_normal' },  // ✅
 *     smile:  { face: '...', invalid: '...' },         // ❌ 타입 오류
 *   }
 * })
 * ```
 */
export function defineCharacter<
  const TBases extends Record<string, CharBaseDef>,
  const TEmotions extends Record<string, Record<string, string>>,
  const TName extends string | undefined = undefined
>(def: {
  name?: TName
  bases: TBases
  emotions: {
    [EKey in keyof TEmotions]: Exact<
      TEmotions[EKey],
      Partial<Record<UnionPointsOf<TBases>, string>>
    >
  }
}): { name?: TName; bases: TBases; emotions: TEmotions } {
  return def as unknown as { name?: TName; bases: TBases; emotions: TEmotions }
}
