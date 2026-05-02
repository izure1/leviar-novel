// =============================================================
// UIRegistry.ts — UI 런타임 엔트리 인터페이스
// =============================================================

import type { SceneContext } from './SceneContext'
import type { SetStateFn } from '../define/defineCmdUI'

/**
 * UI 요소의 런타임 제어 인터페이스.
 * defineUI로 등록된 각 UI가 이 인터페이스를 구현합니다.
 */
export interface UIRuntimeEntry<TSchema = any> {
  /** UI 요소를 페이드인하여 표시합니다 */
  show(duration?: number): void
  /** UI 요소를 페이드아웃하여 숨깁니다 */
  hide(duration?: number): void
  /**
   * 공유 data가 변경될 때 반응형으로 호출됩니다.
   * 스타일 적용, 텍스트 재렌더 등 UI 갱신 로직을 구현하세요.
   */
  onUpdate?(ctx: SceneContext, state: Readonly<TSchema>, setState: SetStateFn<TSchema>): void
  /**
   * 씬 전환/로드 시 이 엔트리를 정리해야 할 때 호출됩니다.
   * 버튼 제거, 애니메이션 중단 등 즉시 정리 로직을 구현하세요.
   */
  onCleanup?(): void

  // ─── 입력 역할 선언 ──────────────────────────────────────

  /**
   * 이 UI 엔트리의 그룹 식별자.
   * 다른 엔트리의 `hideGroups`에 이 값이 포함되면 `hide()`가 호출됩니다.
   * @example 'dialogue'
   */
  uiGroup?: string
  /**
   * 이 엔트리의 step이 활성화될 때 숨길 다른 엔트리들의 `uiGroup` 목록.
   * Novel 코어가 해당 group의 엔트리에 `hide()`를 직접 호출합니다.
   * @example ['dialogue']
   */
  hideGroups?: string[]

  /**
   * `novel.next()` 호출 시 진행 가능 여부를 판단합니다.
   * - `true` : 진행 가능
   * - `false`: 타이핑 완성 등 "완료 처리 후 재대기" (next() 중단)
   */
  canAdvance?(): boolean
}
