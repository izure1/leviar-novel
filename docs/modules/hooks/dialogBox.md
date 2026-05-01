# 🪝 DialogBox Hooks

`dialogBox` 모듈의 표시 시점과 사용자 선택 시점에 개입할 수 있는 훅 목록입니다.

---

## 1. 개요 (Overview)

| 훅 이름 | 설명 | 권장 활용 |
| :--- | :--- | :--- |
| `dialogBox:show` | 상자가 화면에 나타나기 직전 발생 | 제목/본문 텍스트 동적 수정, 강제 persist 설정 |
| `dialogBox:select` | 버튼이 클릭되거나 창이 닫힐 때 발생 | 선택 로그 기록, 특정 선택 시 부가 효과 발생 |

---

## 2. 훅 상세 (Reference)

### 2.1. `dialogBox:show`
커맨드 데이터가 UI에 전달되기 직전에 호출됩니다. 모든 커맨드 속성을 훅에서 동적으로 변경할 수 있습니다.

* **Payload**: `DialogBoxCmd` (title, content, buttons, persist, duration)
* **Return**: `DialogBoxCmd`

```ts
// 예시: 특정 변수 상태에 따라 모든 대화상자를 강제 종료 불가능(persist)하게 만들기
novel.hooker.onBefore('dialogBox:show', (cmd) => {
  if (novel.variables.isUrgent) {
    return { ...cmd, persist: true, title: `[긴급] ${cmd.title}` }
  }
  return cmd
})
```

### 2.2. `dialogBox:select`
사용자가 버튼을 클릭하거나, 배경을 클릭하여 창을 닫았을 때 호출됩니다.

* **Payload**: `{ index: number, selected?: ButtonObject }`
* **Return**: `{ index: number, selected?: ButtonObject }`

| 필드 | 설명 |
| :--- | :--- |
| **`index`** | 클릭된 버튼의 인덱스. **배경 클릭으로 닫힌 경우 `-1`**입니다. |
| **`selected`** | 클릭된 버튼 객체 본체입니다. (인덱스가 -1인 경우 `undefined`) |

```ts
// 예시: 선택 결과 로그 기록
novel.hooker.onAfter('dialogBox:select', (state) => {
  if (state.index === -1) {
    console.log('대화상자가 무시되었습니다.')
  } else {
    console.log(`사용자가 "${state.selected.text}" 버튼을 선택했습니다.`)
  }
  return state
})
```

---

## 3. 관련 가이드

* [상세 가이드: Hooks 개념 및 릴레이 방식](../../concepts/hooks.md)
* [상세 가이드: defineHook (훅 정의 헬퍼)](../../defines/defineHook.md)

---

## 4. 주의 사항 (Edge Cases)

*   **인덱스 -1**: `persist: false`이고 버튼이 없는 특수한 상황에서 배경을 클릭했을 때 발생하는 인덱스입니다. **버튼이 하나라도 있다면 `persist`가 자동으로 `true`가 되어 배경 클릭이 차단되므로, 이 인덱스는 발생하지 않습니다.**
*   **불변성 유지**: 훅에서 `selected` 객체를 직접 수정해도 이미 로직이 끝난 시점일 수 있으므로, 주로 `index`나 데이터를 읽는 용도로 활용하는 것이 좋습니다.
