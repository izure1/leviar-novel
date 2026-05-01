# 🪝 Choices Hooks (선택지 훅)

`choices` 모듈에서 발생하는 이벤트를 가로채거나 데이터를 변형할 수 있는 훅 목록입니다.

---

## 1. 개요 (Overview)

선택지 모듈의 훅을 사용하면 런타임에 선택지 데이터를 변경하거나 사용자 선택을 추적할 수 있습니다. 훅의 작동 원리와 데이터 흐름에 대한 자세한 내용은 [Hooks 개념 문서](../../concepts/hooks.md)를 참고하십시오.

씬 단위로 훅을 안전하게 관리하려면 `defineHook` 헬퍼를 사용하는 것이 권장됩니다.

* [상세 가이드: Hooks (훅 시스템)](../../concepts/hooks.md)
* [상세 가이드: defineHook (훅 정의 헬퍼)](../../defines/defineHook.md)

| 훅 이름 | 설명 | 시점 |
| :--- | :--- | :--- |
| `choice:show` | 표시될 선택지 목록 변형 | 선택지 UI가 나타나기 직전 |
| `choice:select` | 선택된 항목 정보 변형/기록 | 사용자가 버튼을 클릭한 직후 |

---

## 2. 훅 상세 (Reference)

### 2.1. `choice:show`
선택지 커맨드가 실행되어 화면에 버튼들이 그려지기 직전에 호출됩니다. 조건에 따라 특정 선택지를 숨기거나, 텍스트를 강제로 변경하는 등의 작업이 가능합니다.

* **Payload**: `{ choices: ResolvedChoiceItem[] }`
* **Return**: `{ choices: ResolvedChoiceItem[] }`

```ts
// 예시: 모든 선택지 텍스트 뒤에 [확인됨] 표시 추가
novel.hooker.onBefore('choice:show', (state) => {
  return {
    ...state,
    choices: state.choices.map(c => ({ ...c, text: c.text + ' [확인됨]' }))
  }
})
```

### 2.2. `choice:select`
사용자가 특정 선택지를 클릭했을 때 호출됩니다. 어떤 인덱스의 항목이 선택되었는지 기록하거나, 선택 결과를 강제로 변경할 수 있습니다.

* **Payload**: `{ index: number, selected: ResolvedChoiceItem }`
* **Return**: `{ index: number, selected: ResolvedChoiceItem }`

```ts
// 예시: 사용자가 선택한 로그 기록
novel.hooker.onBefore('choice:select', (state) => {
  console.log(`선택됨: ${state.selected.text}`)
  return { ...state }
})
```

---

## 3. 주의 사항 (Edge Cases)

* **Resolved 데이터**: 훅으로 전달되는 `choices` 항목들은 이미 변수 보간(`{{ }}`)과 Resolvable 함수 평가가 완료된 **문자열 상태**의 `text`를 가지고 있습니다.
* **동기 실행**: 훅은 엔진의 메인 로직 흐름 내에서 동기적으로 실행되므로, 너무 무거운 연산은 프레임 드랍을 유발할 수 있습니다.
