import type { ResolvableProps } from '../define/defineCmd'
import type { NovelModule } from '../define/defineCmdUI'

type Compute<T> = { [K in keyof T]: T[K] } & {}

type _WithType<T, K extends string, TVars, TLocalVars> =
  T extends any ? Compute<{ type: K } & ResolvableProps<T, TVars, TLocalVars>> : never

export type TestUnion =
  | _WithType<{ text: string }, 'dialogue', any, any>
  | _WithType<{ choices: string[] }, 'choice', any, any>

type _WithSkip<T> = T extends any ? Compute<T & { skip?: boolean }> : never

export type TestEntry = _WithSkip<TestUnion>

const a: TestEntry = {
  type: 'dialogue',
  text: 'hello'
}
