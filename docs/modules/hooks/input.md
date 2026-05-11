# 🪝 입력 훅 (Input Hooks)

## 개요 (Overview)

`input` 모듈 창이 화면에 뜨기 전 제목을 동적으로 조작하거나, 플레이어가 입력값을 저장하려 할 때 텍스트를 검증하고 차단할 수 있는 훅입니다.  

## 훅 이벤트 목록 (Events)

| 훅 이름 | 페이로드 타입 | 실행 시점 |
| :--- | :--- | :--- |
| **`input:open`** | `{ label: string, multiline: boolean }` | 입력창이 화면에 그려지기 직전 |
| **`input:submit`** | `{ varName, text, buttonIndex, cancelled }` | 데이터가 제출되거나 취소 버튼이 눌렸을 때 |

## 핵심 예제 (Main Example)

### 1. 입력창 안내 문구 조작 (`open`)

```typescript
// 플레이어 방문 여부에 따라 입력 안내 문구를 다르게 띄웁니다
novel.hooker.onBefore('input:open', (state, ctx) => {
  const label = novel.variables.isFirstVisit 
    ? '성함을 입력해 주십시오.' 
    : '성함을 다시 한번 확인해 주십시오.'
    
  return { ...state, label }
})
```

### 2. 텍스트 유효성 검사 및 보정 (`submit`)

```typescript
// 입력된 데이터의 양쪽 공백을 지우고, 너무 짧으면 엔진 변수에 저장을 막습니다
novel.hooker.onBefore('input:submit', (state, ctx) => {
  if (state.cancelled) return state

  const processedText = state.text.trim()

  if (processedText.length < 2) {
    alert('두 글자 이상 입력해 주십시오.')
    
    // cancelled를 true로 덮어쓰면 엔진 변수에 값이 반영되지 않습니다
    return { ...state, cancelled: true } 
  }

  return { ...state, text: processedText }
})
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **흐름 차단 한계** | 훅에서 `cancelled: true`로 페이로드를 덮어쓰면 **변수에 저장이 안 될 뿐**, 입력 창이 닫히고 시나리오가 다음 줄로 넘어가는 것 자체를 멈출 수는 없습니다. |
