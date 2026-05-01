import config from './example/novel.config'
import type { NovelModule } from './src'

type VarsFn<TVars, TLocal> = (vars: TVars & TLocal) => boolean

type CondStep<TVars, TLocal> = {
  type: 'condition'
  $if: VarsFn<TVars, TLocal>
}

type OtherStep<TVars, TLocal> = {
  type: 'dialogue'
  text: string | ((vars: TVars & TLocal) => string)
}

type Step<TVars, TLocal> = CondStep<TVars, TLocal> | OtherStep<TVars, TLocal>

// 실제 NovelConfig로 테스트
function defineScene2<
  TVars extends Record<string, any>,
  TConfig extends { vars: TVars; modules?: Record<string, NovelModule<any>> },
  TLocal extends Record<string, any> = Record<never, never>
>(
  opts: { config: TConfig & { vars: TVars } },
  dialogues: NoInfer<Step<TVars, TLocal>>[]
): void {}

// 실제 config 사용
defineScene2({ config }, [
  { type: 'condition', $if: ({ username }) => username !== '' }  // 에러?
])

