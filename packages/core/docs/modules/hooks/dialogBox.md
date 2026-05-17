# 🪝 알림창 훅 (DialogBox Hooks)

## 개요 (Overview)

시스템 대화상자(`dialogBox`)가 화면에 뜨기 전 제목과 옵션을 조작하거나, 사용자가 버튼을 클릭해 창을 닫았을 때 발생하는 이벤트를 제어합니다.  

## 훅 이벤트 목록 (Events)

| 훅 이름 | 페이로드 타입 | 실행 시점 |
| :--- | :--- | :--- |
| **`dialogBox:show`** | `DialogBoxCmd` | 창이 화면에 그려지기 직전 |
| **`dialogBox:select`** | `{ index: number, selected?: ButtonObject }` | 버튼을 누르거나 바탕화면을 클릭해 창이 닫힌 직후 |

## 핵심 예제 (Main Example)

### 1. 출력 전 동적 속성 조작 (`show`)

```typescript
// 특정 상황에서 모든 알림창을 강제 선택 모드로 바꾸고 제목을 변경합니다
novel.hooker.onBefore('dialogBox:show', (cmd, ctx) => {
  if (novel.variables.isUrgent) {
    return { ...cmd, persist: true, title: `[긴급] ${cmd.title}` }
  }
  return cmd
})
```

### 2. 종료 및 선택 감지 (`select`)

```typescript
// 창이 어떻게 닫혔는지 판별하여 처리합니다
novel.hooker.onAfter('dialogBox:select', (state, ctx) => {
  if (state.index === -1) {
    console.log('창 바깥쪽 바탕을 눌러서 닫았습니다')
  } else {
    console.log(`선택한 버튼 텍스트: ${state.selected?.text}`)
  }
  return state
})
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **배경 클릭 인덱스(-1)** | 버튼이 하나도 없고 `persist: false`일 때만 바탕화면 여백을 클릭해 창을 닫을 수 있습니다. 이때만 유일하게 `index`가 `-1`로 들어옵니다. 버튼이 존재하면 바탕 화면 클릭이 무시되므로 `-1`은 나오지 않습니다. |
