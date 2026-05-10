import type { World, LeviarObject } from 'leviar'
import type { Renderer } from './Renderer'
import type { SceneCallbacks } from './Scene'
import type { CustomCmdContext } from '../types/config'
import type { UIRuntimeEntry } from './UIRegistry'
import type { DialogueEntry } from '../types/dialogue'

/**
 * 커맨드 핸들러 실행 시 제공되는 씬(Scene)의 컨텍스트 정보
 */
export interface SceneContext<
  TVars = any,
  TLocalVars = any,
  TEnvs = Record<string, any>,
> extends CustomCmdContext<TVars, TLocalVars, TEnvs> {
  /** Fumika 렌더러 인스턴스 (화면 렌더링 담당) */
  renderer: Renderer
  /** 환경변수 (모든 세이브 공유). CustomCmdContext에서 상속됨. */
  /** Novel 엔진 본체와의 통신을 위한 콜백 함수들 */
  callbacks: SceneCallbacks
  /** 현재 실행 중인 씬을 조작하기 위한 메서드 모음 */
  scene: {
    /** 텍스트 배열 사용 시 현재 출력 중인 텍스트의 내부 인덱스 반환 */
    getTextSubIndex: () => number
    /** 현재 텍스트 서브 인덱스를 설정합니다 */
    setTextSubIndex: (idx: number) => void
    /** 텍스트 내의 `{{변수}}` 템플릿 문법을 실제 변수 값으로 치환하여 반환하는 헬퍼 함수 */
    interpolateText: (text: string) => string
    /** 지정된 라벨(label) 위치로 실행 커서 점프 */
    jumpToLabel: (label: string) => void
    /** 현재 씬에 지정된 라벨이 존재하는지 여부 확인 */
    hasLabel: (label: string) => boolean
    /** 전역 변수와 현재 씬의 지역 변수가 병합된 객체 반환 */
    getVars: () => TVars & TLocalVars
    /** 전역 변수 설정 (모든 씬에서 유지됨) */
    setGlobalVar: (key: string, value: any) => void
    /** 지역 변수 설정 (현재 씬 안에서만 유지됨) */
    setLocalVar: (key: string, value: any) => void
    /** 지정된 이름의 새로운 씬으로 전환 (현재 씬 종료). 문자열 또는 { scene, preserve } 객체. */
    loadScene: (target: string | { scene: string; preserve: boolean }) => void
    /** 현재 씬의 진행을 즉시 종료 */
    end: () => void
    /**
     * 지정된 씬을 서브루틴으로 호출합니다.
     * 서브씬이 완전히 종료(nextScene 없음)되면 현재 위치로 복귀합니다.
     *
     * @param name     - 호출할 씬 이름
     * @param preserve - true: 현재 렌더러·state·오디오 상태를 서브씬이 이어받음 (기본값: false)
     * @param restore  - true: 서브씬 종료 후 caller 상태 완전 복원. preserve=true일 때만 유효. (기본값: false)
     */
    callScene: (name: string, preserve?: boolean, restore?: boolean) => void
  }
  /**
   * 씬 전환에도 유지되는 cmd 상태 저장소.
   * 세이브/로드 시 SaveData.states에 자동 포함됩니다.
   *
   * @example
   * // 저장
   * ctx.state.set('dialogue', { subIndex: 2, lines: [...] })
   * // 읽기 (로드 후 복원 시에도 사용)
   * const saved = ctx.state.get('dialogue')
   */
  state: {
    /** 이름으로 직렬화 가능한 데이터를 저장합니다 */
    set(name: string, data: Record<string, any>): void
    /** 이름으로 저장된 데이터를 읽습니다 */
    get(name: string): Record<string, any> | undefined
  }
  /**
   * UI 레지스트리 접근 네임스페이스.
   * defineUI로 생성된 UI 요소를 등록하거나 제어합니다.
   */
  ui: {
    /** 이름으로 UIRuntimeEntry를 등록합니다 (이미 있으면 덮어쓰기) */
    register(name: string, entry: UIRuntimeEntry): void
    /** 이름으로 UIRuntimeEntry를 조회합니다 */
    get(name: string): UIRuntimeEntry | undefined
    /** 등록된 UI를 페이드인하여 표시합니다 */
    show(name: string, duration: number): void
    /** 등록된 UI를 페이드아웃하여 숨깁니다 */
    hide(name: string, duration: number): void
  }
  /**
   * 현재 ctx 컨텍스트 위에서 다른 커맨드를 즉시 실행합니다.
   * builtin 커맨드와 커스텀 커맨드 모두 실행 가능합니다.
   * fallback 규칙도 동일하게 적용됩니다.
   *
   * ## 반환값 (`CommandResult`)
   * - `true` : 해당 cmd 즉시 완료
   * - `false` / `void` : 해당 cmd가 입력 대기 상태. 사용자 입력 시 해당 cmd 재실행됨
   *
   * 반환값을 caller가 그대로 `return`하면 해당 cmd의 실행 흐름이 Scene으로 전파됩니다.
   * 무시하고 caller가 별도의 값을 반환해도 됩니다.
   *
   * @example side-effect 목적 (반환값 무시)
   * export const myHandler = defineCmd<{ name: string }>((cmd, ctx) => {
   *   ctx.execute({ type: 'character', name: cmd.name, image: 'normal', position: 'center' })
   *   ctx.execute({ type: 'screen-flash', color: '#ffffff', duration: 200 })
   *   return true // caller 자신은 즉시 완료
   * })
   *
   * @example 반환값 전파
   * export const myHandler = defineCmd<{ text: string }>((cmd, ctx) => {
   *   return ctx.execute({ type: 'dialogue', text: `${cmd.name} 등장!` })
   * })
   */
  execute: (cmd: DialogueEntry<any, any, any>) => Generator<CommandResult, CommandResult, any>
  /**
   * 씬에 등록된 액션을 이름으로 조회합니다.
   * `defineScene({ actions: { ... } })`로 선언된 콜백을 반환합니다.
   */
  actions: {
    /** 이름으로 액션 콜백을 조회합니다 */
    get(name: string): ((element: LeviarObject, ctx: SceneContext, vars: Record<string, any>) => void) | undefined
  }
}

/**
 * 커맨드 핸들러의 실행 결과 반환값 (제너레이터가 yield 또는 return 하는 값)
 * - `true`: 커맨드 즉시 완료, 대기 없이 다음 스텝 자동 진행
 * - `false` | `void`: 커맨드 실행 후 멈춤, 사용자 입력(클릭/엔터 등) 대기.
 *   입력 시 제너레이터의 next()가 호출됩니다.
 */
export type CommandResult = boolean | void
