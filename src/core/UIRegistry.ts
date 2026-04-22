// =============================================================
// UIRegistry.ts — UI 런타임 엔트리 인터페이스
// =============================================================

/**
 * defineUI 생성 시 전달하는 UI 동작 옵션.
 */
export interface UIEntryOptions {
  /**
   * novel.hideUI() / novel.showUI() 호출 시 이 엔트리가 영향을 받는지 여부.
   * - `true` (기본값): 우클릭 UI 숨기기 등에 반응
   * - `false`: mood, background 등 항상 표시되어야 하는 요소
   */
  hideable?: boolean
  /**
   * 이 요소가 카메라에 부착되어 화면 고정되는지 여부 (문서/메타 힌트).
   * 실제 부착은 빌더에서 camera.addChild()로 처리합니다.
   * @default true
   */
  attachToCamera?: boolean
}

/**
 * UI 요소의 런타임 제어 인터페이스.
 * defineUI로 등록된 각 UI가 이 인터페이스를 구현합니다.
 */
export interface UIRuntimeEntry {
  /** 이 엔트리의 동작 옵션 */
  options?: UIEntryOptions
  /** UI 요소를 페이드인하여 표시합니다 */
  show(duration?: number): void
  /** UI 요소를 페이드아웃하여 숨깁니다 */
  hide(duration?: number): void
  /** 텍스트 타이핑(전환 효과) 중인지 여부 */
  isTyping?(): boolean
  /** 타이핑 효과를 즉시 완성합니다 */
  completeTyping?(): void
  /**
   * 대사 텍스트를 출력합니다 (dialogue cmd 전용).
   */
  onDialogue?(speaker: string | undefined, text: string, speed?: number): void
  /**
   * 선택지 버튼을 렌더링합니다 (choice cmd 전용).
   */
  onChoices?(choices: any[], onSelect: (index: number) => void): void
}
