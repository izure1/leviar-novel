// =============================================================
// defineScene.ts — DialogueScene 정의 헬퍼
// =============================================================

import type { LeviarObject } from 'leviar'
import type { NovelConfig, CharDefs, BgDefs, SceneNextTarget, EnvironmentsOf } from '../types/config'
import type { NovelModule } from '../define/defineCmdUI'
import type { SceneHookDescriptor } from '../define/defineCmdUI'
import type { DialogueStep } from '../types/dialogue'
import type { SceneContext } from '../core/SceneContext'

// ─── UI initial 타입 헬퍼 ────────────────────────────────────

/**
 * `config.modules` 타입에서 `initial` 허용 값 구조를 추출합니다.
 * key: `keyof TModules`, value: 해당 `NovelModule`의 스키마(`TSchema`)의 `Partial`
 */
export type InitialOf<TModules> = {
  [K in keyof TModules]?: TModules[K] extends NovelModule<any, infer TSchema> ? Partial<TSchema> : never
}

/**
 * `defineScene` 외부에서 `initial` 데이터를 공통 모듈로 분리할 때 사용하는 타입 추론 헬퍼입니다.
 * 
 * @example
 * import config from '../novel.config'
 * import { defineInitial } from 'fumika'
 * 
 * export const commonInitial = defineInitial(config)({
 *   dialogue: { text: { fontSize: 18 } }
 * })
 */
export function defineInitial<
  TConfig extends NovelConfig<any, any, any, any, any> & { modules?: Record<string, NovelModule<any>> }
>(
  config: TConfig
): <
  TInitial extends ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>)
>(
  initial: TInitial & (
    [TConfig['modules']] extends [undefined]
    ? unknown
    : { [K in keyof TInitial]: K extends keyof NonNullable<TConfig['modules']> ? unknown : never }
  )
) => typeof initial {
  return (initial) => initial
}

/** 씬 정의 결과물. Scene 실행기가 소비합니다. */
export interface SceneDefinition<
  TVars,
  TScenes extends readonly string[],
  TCharacters extends CharDefs,
  TBackgrounds extends BgDefs,
  TAssets extends Record<string, string> = Record<string, string>,
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
> {
  readonly kind: 'dialogue'
  name?: string
  readonly dialogues: DialogueStep<any>[]
  readonly localVars?: TLocalVars
  /** 씬 종료 시 자동으로 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
  readonly nextScene?: string | { scene: string; preserve: boolean }
  /**
   * 씬 시작 시 자동으로 초기화할 모듈 데이터.
   * `novel.config`의 `modules` 키를 기반으로 타입이 추론됩니다.
   */
  readonly initial?: Record<string, unknown>
  /**
   * 씬 스코프 훅 디스크립터.
   * `defineHook()`의 반환값을 전달하면 씬 시작 시 자동 등록, 씬 종료 시 자동 해제됩니다.
   */
  readonly hooks?: SceneHookDescriptor
  /**
   * 씬 스코프 액션 맵.
   * `element` 명령어의 `behaviors`에서 이름으로 참조하여 호출됩니다.
   * 각 콜백은 요소가 생성될 때 호출되며, 이벤트 리스너 등을 등록합니다.
   */
  readonly actions?: Record<string, (element: LeviarObject, ctx: SceneContext, vars: Record<string, any>) => void>
}

// ─── SceneBuilders 타입 ──────────────────────────────────────

import type { SceneNamesOf } from '../types/config'

/**
 * defineScene의 builder 함수에 주입되는 흐름제어 예약어 헬퍼.
 * 이 함수들은 빌드타임에 flat 배열로 컴파일되는 마커 객체를 반환합니다.
 */
export type SceneBuilders<TConfig, TLocalVars, TVars, TEnvs = Record<never, never>> = {
  /** 씬 내부 점프 위치를 정의합니다. */
  label: (name: string) => DialogueStep<TConfig, TLocalVars, TVars>
  /** 라벨 위치로 실행 커서를 이동합니다. */
  goto: (name: string) => DialogueStep<TConfig, TLocalVars, TVars>
  /** 다른 씬으로 전환합니다. */
  next: (
    scene: SceneNamesOf<TConfig>,
    opts?: { preserve?: boolean }
  ) => DialogueStep<TConfig, TLocalVars, TVars>
  /** 다른 씬을 서브루틴으로 호출합니다. */
  call: (
    scene: SceneNamesOf<TConfig>,
    opts?: { preserve?: boolean; restore?: boolean }
  ) => DialogueStep<TConfig, TLocalVars, TVars>
  /** 조건 분기. ifSteps / elseSteps 내부에 중첩 사용 가능. */
  condition: (
    fn: ((vars: TVars & TLocalVars & TEnvs) => boolean) | boolean,
    ifSteps: DialogueStep<TConfig, TLocalVars, TVars>[],
    elseSteps?: DialogueStep<TConfig, TLocalVars, TVars>[]
  ) => DialogueStep<TConfig, TLocalVars, TVars>
  /** 변수 값을 설정합니다. `$` 접두사는 환경변수, `_` 접두사는 지역변수, 그 외는 전역변수. */
  set: <K extends keyof (TVars & TLocalVars & TEnvs) & string>(
    name: K,
    value: (TVars & TLocalVars & TEnvs)[K] | ((vars: TVars & TLocalVars & TEnvs) => (TVars & TLocalVars & TEnvs)[K])
  ) => DialogueStep<TConfig, TLocalVars, TVars>
}

// ─── 빌드타임 평탄화 ─────────────────────────────────────────

/** @internal condition 평탄화용 고유 ID 카운터 */
let _conditionUid = 0

/** @internal 마커 식별용 심볼 */
const FLOW_MARKER = Symbol.for('fumika:flow')

interface _FlowMarker {
  [key: symbol]: true
  __flow: string
  [prop: string]: any
}

function _isFlowMarker(step: any): step is _FlowMarker {
  return step && step[FLOW_MARKER] === true
}

/**
 * builder가 반환한 마커 객체 + 중첩 condition을
 * flat한 DialogueStep[] 배열로 컴파일합니다.
 * @internal
 */
function _flattenSteps(steps: any[]): any[] {
  const result: any[] = []

  for (const step of steps) {
    if (!_isFlowMarker(step)) {
      result.push(step)
      continue
    }

    switch (step.__flow) {
      case 'label':
        result.push({ type: 'label', name: step.name })
        break
      case 'goto':
        result.push({ type: 'goto', label: step.label })
        break
      case 'next':
        result.push({ type: 'next', scene: step.scene, preserve: step.preserve })
        break
      case 'call':
        result.push({ type: 'call', scene: step.scene, preserve: step.preserve, restore: step.restore })
        break
      case 'set':
        result.push({ type: 'var', name: step.name, value: step.value })
        break
      case 'condition': {
        const id = _conditionUid++
        const elseLabel = `__cond_else_${id}`
        const endLabel = `__cond_end_${id}`
        const hasElse = step.elseSteps && step.elseSteps.length > 0

        // 조건 체크: false → else 또는 end 로 점프
        result.push({
          type: 'condition',
          if: step.if,
          elseGoto: hasElse ? elseLabel : endLabel,
        })

        // ifSteps (재귀 평탄화)
        result.push(..._flattenSteps(step.ifSteps ?? []))

        // if 분기 끝 → end 로 점프 (else가 있을 때만)
        if (hasElse) {
          result.push({ type: 'goto', label: endLabel })
          result.push({ type: 'label', name: elseLabel })
          result.push(..._flattenSteps(step.elseSteps))
        }

        // end 라벨
        result.push({ type: 'label', name: endLabel })
        break
      }
    }
  }

  return result
}

/**
 * builder 헬퍼 객체를 생성합니다.
 * @internal
 */
function _createBuilders(): SceneBuilders<any, any, any> {
  return {
    label: (name) => ({
      [FLOW_MARKER]: true, __flow: 'label', name,
    }) as any,
    goto: (name) => ({
      [FLOW_MARKER]: true, __flow: 'goto', label: name,
    }) as any,
    next: (scene, opts) => ({
      [FLOW_MARKER]: true, __flow: 'next', scene, ...opts,
    }) as any,
    call: (scene, opts) => ({
      [FLOW_MARKER]: true, __flow: 'call', scene, ...opts,
    }) as any,
    condition: (fn, ifSteps, elseSteps) => ({
      [FLOW_MARKER]: true, __flow: 'condition', if: fn, ifSteps, elseSteps,
    }) as any,
    set: (name, value) => ({
      [FLOW_MARKER]: true, __flow: 'set', name, value,
    }) as any,
  }
}

// ─── defineScene 내부 헬퍼 ────────────────────────────────────

type _SceneOptions<
  TVars extends Record<string, any>,
  TConfig extends NovelConfig<TVars, readonly string[], any, any, any> & { modules?: Record<string, NovelModule<any>> },
  TLocalVars extends Record<`_${string}`, any>,
  TInitial extends ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>),
> = {
  config: TConfig & { variables: TVars }
  variables?: keyof TLocalVars extends `_${string}` ? TLocalVars : never
  /** 씬 시작 시 적용할 모듈 초기 데이터 (optional). config.modules 키/값 타입 추론. */
  initial?: TInitial & (
    [TConfig['modules']] extends [undefined]
    ? unknown
    : { [K in keyof TInitial]: K extends keyof NonNullable<TConfig['modules']> ? unknown : never }
  )
  /** 씬 종료 시 자동으로 이동할 다음 씬. 문자열 또는 { scene, preserve } 객체. */
  next?: SceneNextTarget<TConfig>
  /**
   * 씬 스코프 훅 디스크립터. `defineHook(config)({ ... })`의 반환값.
   * 씬 시작 시 자동으로 훅이 등록되고, 씬 종료/전환 시 자동으로 해제됩니다.
   */
  hooks?: SceneHookDescriptor
  /**
   * 씬 스코프 액션 맵.
   * element의 behaviors에서 이름 문자열로 참조하여 호출됩니다.
   *
   * @example
   * actions: {
   *   saveButton: (element, ctx) => {
   *     element.on('click', () => {
   *       const data = ctx.novel.save()
   *       localStorage.setItem('save', JSON.stringify(data))
   *     })
   *   }
   * }
   */
  actions?: Record<string, (element: LeviarObject, ctx: SceneContext, vars: TVars & TLocalVars & EnvironmentsOf<TConfig>) => void>
}

type _SceneReturn<TConfig, TLocalVars> = SceneDefinition<
  TConfig extends { variables: infer V } ? V : any,
  TConfig extends { scenes: infer S extends readonly string[] } ? S : readonly string[],
  TConfig extends { characters: infer C extends CharDefs } ? C : CharDefs,
  TConfig extends { backgrounds: infer B extends BgDefs } ? B : BgDefs,
  TConfig extends { assets: infer A extends Record<string, string> } ? A : Record<string, string>,
  TLocalVars extends Record<`_${string}`, any> ? TLocalVars : Record<never, never>
>

/**
 * DialogueScene을 정의합니다.
 *
 * Curried builder 함수 형식을 사용합니다.
 * 두 번째 인자(함수)에 흐름제어 builder가 주입됩니다.
 *
 * @example
 * export default defineScene({ config, variables: { _tries: 0 } })(
 *   ({ label, goto, next, call, condition, set }) => [
 *     label('start'),
 *     { type: 'dialogue', text: '안녕!' },
 *     condition(
 *       ({ _tries }) => _tries >= 3,
 *       [goto('end')],
 *       [set('_tries', 1)]
 *     ),
 *     label('end'),
 *     next('scene-b'),
 *   ]
 * )
 */
export function defineScene<
  TVars extends Record<string, any>,
  TConfig extends NovelConfig<TVars, readonly string[], any, any, any> & { modules?: Record<string, NovelModule<any>> },
  TLocalVars extends Record<`_${string}`, any> = Record<never, never>,
  TInitial extends ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>) = ([TConfig['modules']] extends [undefined] ? Record<string, unknown> : InitialOf<NonNullable<TConfig['modules']>>)
>(
  options: _SceneOptions<TVars, TConfig, TLocalVars, TInitial>,
): (
  factory: (builders: SceneBuilders<TConfig, TLocalVars, TVars, EnvironmentsOf<TConfig>>) => DialogueStep<TConfig, TLocalVars, TVars>[]
) => _SceneReturn<TConfig, TLocalVars> {
  const {
    variables = {} as any,
    next,
    initial,
    hooks,
    actions,
  } = options

  return (factory) => {
    const builders = _createBuilders()
    const rawSteps = factory(builders as any)
    const flatSteps = _flattenSteps(rawSteps)

    return {
      kind: 'dialogue',
      dialogues: flatSteps,
      localVars: variables,
      nextScene: next as string | { scene: string; preserve: boolean } | undefined,
      initial: initial as Record<string, unknown> | undefined,
      hooks,
      actions,
    } as any
  }
}
