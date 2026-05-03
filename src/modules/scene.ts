// =============================================================
// scene.ts — { type: 'scene', call } 핸들러
// =============================================================

import type { SceneContext, CommandResult } from '../core/SceneContext'

export interface SceneCallCmd {
  type: 'scene'
  /** 호출할 씬 이름 */
  call: string
  /**
   * 서브씬 시작 시 현재 씬의 렌더러·모듈 state·오디오 상태를 이어받습니다.
   * 서브씬의 `initial`이 있으면 이어받은 state 위에 덮어씁니다.
   * 기본값: false
   */
  preserve?: boolean
  /**
   * 서브씬 종료 후 호출자 씬의 렌더러·state를 완전 복원합니다.
   * `preserve: true`일 때만 유효합니다.
   * - false (기본값): 커서·지역변수만 복원, 화면/오디오는 서브씬 상태 그대로 이어감
   * - true: caller 시점의 렌더러·stateStore 완전 복원
   */
  restore?: boolean
}

export function* sceneCallHandler(
  params: Omit<SceneCallCmd, 'type'>,
  ctx: SceneContext
): Generator<CommandResult, CommandResult, any> {
  ctx.scene.callScene(params.call, params.preserve, params.restore)
  return false
}
