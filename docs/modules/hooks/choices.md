# 🪝 선택지 훅 (Choices Hooks)

## 개요 (Overview)

`choices` 모듈의 버튼들이 화면에 나타나기 직전이나, 플레이어가 특정 선택지를 클릭했을 때 이벤트를 가로채 데이터를 조작하는 훅입니다.  

## 훅 이벤트 목록 (Events)

| 훅 이름 | 페이로드 타입 | 실행 시점 |
| :--- | :--- | :--- |
| **`choice:show`** | `{ choices: ResolvedChoiceItem[] }` | 선택지가 화면에 나타나기 직전 |
| **`choice:select`** | `{ index: number, selected: ResolvedChoiceItem }` | 사용자가 버튼을 클릭한 직후 |

## 핵심 예제 (Main Example)

### 1. 출력 직전 텍스트 조작 (`choice:show`)

선택지 텍스트들이 확정된 상태에서 최종적으로 화면에 렌더링되기 전에 문구를 보정합니다.  

```typescript
// 모든 선택지 텍스트 끝에 확인 표식을 붙입니다
novel.hooker.onBefore('choice:show', (state, ctx) => {
  return {
    ...state,
    choices: state.choices.map(c => ({ ...c, text: c.text + ' [확인됨]' }))
  }
})
```

### 2. 클릭 시점 감지 (`choice:select`)

```typescript
// 플레이어가 어떤 버튼을 골랐는지 로그 시스템에 기록합니다
novel.hooker.onBefore('choice:select', (state, ctx) => {
  console.log(`사용자가 선택한 항목: ${state.selected.text}`)
  return { ...state }
})
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **최종 문자열 전달** | 훅으로 전달된 텍스트 데이터는 `{{_gold}}` 같은 변수가 이미 엔진에 의해 다 계산되어 최종 문자열로 바뀐 상태입니다. |
| **선택 지연 현상** | 훅 로직 처리가 끝나야만 엔진이 다음 씬으로 넘어가거나 변수를 업데이트합니다. 훅 내부에서 무거운 처리를 하면 화면 갱신이 버벅일 수 있습니다. |
