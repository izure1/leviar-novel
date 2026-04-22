// =============================================================
// UIRegistry.ts — UI 런타임 엔트리 인터페이스
// =============================================================

/**
 * UI 요소의 런타임 제어 인터페이스.
 * defineUI로 등록된 각 UI가 이 인터페이스를 구현합니다.
 */
export interface UIRuntimeEntry {
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
   * dialogueUISetup 빌더에서 구현합니다.
   */
  onDialogue?(speaker: string | undefined, text: string, speed?: number): void
  /**
   * 선택지 버튼을 렌더링합니다 (choice cmd 전용).
   * choiceUISetup 빌더에서 구현합니다.
   */
  onChoices?(choices: any[], onSelect: (index: number) => void): void
}
