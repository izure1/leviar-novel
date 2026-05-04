# 🪝 Input Hooks

`input` 모듈에서 입력창이 열리거나 사용자가 데이터를 제출할 때 실행되는 훅 목록입니다. 입력값 필터링이나 유효성 검사에 활용할 수 있습니다.

---

## 1. 개요 (Overview)

| 훅 이름 | 설명 | 권장 활용 |
| :--- | :--- | :--- |
| `input:open` | 입력창이 화면에 나타나기 직전 발생 | 레이블 텍스트 동적 변경 |
| `input:submit` | 사용자가 버튼을 클릭하여 제출할 때 발생 | 유효성 검사, 금칙어 필터링, 데이터 변형 |

---

## 2. 훅 상세 (Reference)

### 2.1. `input:open`
입력창이 생성되기 직전에 호출됩니다. 상황에 따라 입력창의 제목(Label)을 동적으로 바꾸거나 멀티라인 여부를 강제할 수 있습니다.

* **Payload**: `{ label: string, multiline: boolean }`
* **Return**: `{ label: string, multiline: boolean }`

```ts
// 예시: 변수 값에 따라 레이블 변경
novel.hooker.onBefore('input:open', (state) => {
  return {
    ...state,
    label: novel.variables.isFirstTime ? '처음 뵙겠습니다. 이름이?' : '다시 이름을 알려주세요.'
  }
})
```

### 2.2. `input:submit`
사용자가 버튼을 클릭했을 때 호출됩니다. 입력된 텍스트를 검증하거나, 특정 조건에서 저장을 취소할 수 있습니다.

* **Payload**: `{ varName: string, text: string, buttonIndex: number, cancelled: boolean }`
* **Return**: `{ varName: string, text: string, buttonIndex: number, cancelled: boolean }`

| 필드 | 설명 |
| :--- | :--- |
| **`varName`** | 데이터가 저장될 변수 이름 (`InputCmd`의 `to` 값) |
| **`text`** | 사용자가 입력한 텍스트 내용 |
| **`buttonIndex`** | 클릭된 버튼의 인덱스 (0부터 시작) |
| **`cancelled`** | 취소 여부. `true`로 반환하면 변수 저장이 무시됩니다. |

```ts
// 예시: 이름 입력 검증 및 취소 처리
novel.hooker.onBefore('input:submit', (state) => {
  // 1. 이미 취소 버튼(cancel: true)이 눌린 경우 그대로 진행
  if (state.cancelled) return state

  // 2. 입력값 필터링
  const filteredText = state.text.trim()

  // 3. 유효성 검사: 이름이 너무 짧으면 저장 차단
  if (filteredText.length < 2) {
    alert('이름이 너무 짧습니다!')
    return { ...state, cancelled: true } // 저장을 막음
  }

  return { ...state, text: filteredText }
})
```

---

## 3. 관련 가이드

* [상세 가이드: Hooks 개념 및 릴레이 방식](../../concepts.md#hooks)
* [상세 가이드: defineHook (훅 정의 헬퍼)](../../defines/defineHook.md)

---

## 4. 주의 사항 (Edge Cases)

*   **진행 차단 불가 (Technical Limit)**: `input:submit` 훅이 실행되는 시점은 이미 입력 프로세스가 완료된 이후입니다. 따라서 훅에서 `cancelled: true`를 반환하여 **변수 저장을 막을 수는 있지만, 입력창이 닫히거나 다음 커맨드로 진행되는 것을 막을 수는 없습니다.**
*   **유효성 검사 권장**: 입력값이 올바르지 않을 때 창을 계속 유지해야 한다면, 현재의 훅 시스템보다는 씬 로직 상에서 `input` 커맨드와 `condition` 커맨드를 조합한 루프 구성을 권장합니다.
*   **변수명 변경**: 훅 내부에서 `varName`을 수정하여 데이터가 저장될 타겟 변수를 동적으로 바꿀 수 있습니다.
