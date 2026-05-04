# 🪝 Choices Hooks

본 문서는 `choices` 모듈에서 발생하는 이벤트를 가로채거나, 런타임에 선택지 데이터를 정교하게 변형할 수 있는 훅(Hooks) 명세를 기술합니다.  

---

## 1. 개요 (Overview)

선택지 모듈의 훅을 활용하면 사용자의 선택 프로세스 전반에 개입하여 데이터를 제어하거나 상호작용 결과를 기록할 수 있습니다.  
엔진의 훅 시스템 작동 원리와 데이터 흐름에 대한 전반적인 이해는 [Hooks 시스템 기초 개념](../../concepts.md#hooks) 문서를 참고해 주십시오.  

안전하고 체계적인 훅 관리를 위해 [defineHook 헬퍼](../../defines/defineHook.md)를 사용하시는 것을 적극 권장합니다.  

| 훅 이름 | 상세 기능 | 호출 시점 |
| :--- | :--- | :--- |
| `choice:show` | 표시될 선택지 목록의 동적 변형 | 선택지 UI가 화면에 구성되기 직전 |
| `choice:select` | 선택된 항목 정보의 기록 및 조작 | 사용자가 특정 항목을 클릭한 직후 |

---

## 2. 훅 상세 명세 (Reference)

### 2.1. `choice:show`
선택지 커맨드가 해석되어 화면에 버튼 객체들이 생성되기 직전에 호출됩니다.  
특정 조건에 따라 선택지를 동적으로 필터링하거나, 출력될 문구를 최종적으로 보정하는 작업이 가능합니다.  

*   **Payload**: `{ choices: ResolvedChoiceItem[] }`  
*   **Return**: 변형된 `{ choices: ResolvedChoiceItem[] }` 객체를 반환합니다.  

```ts
// 구현 예시: 모든 선택지 문구 끝에 시스템 확인 표식을 추가합니다.  
novel.hooker.onBefore('choice:show', (state) => {
  return {
    ...state,
    choices: state.choices.map(c => ({ ...c, text: c.text + ' [확인됨]' }))
  };
})
```

### 2.2. `choice:select`
사용자가 화면에 표시된 특정 버튼을 클릭했을 때 호출됩니다.  
선택된 항목의 인덱스나 데이터를 분석하여 시나리오 로그를 생성하거나, 필요에 따라 선택 결과를 강제로 변경할 수 있습니다.  

*   **Payload**: `{ index: number, selected: ResolvedChoiceItem }`  
*   **Return**: 처리된 `{ index: number, selected: ResolvedChoiceItem }` 객체를 반환합니다.  

| 필드 명칭 | 설명 |
| :--- | :--- |
| **`index`** | 클릭된 항목의 배열 인덱스 번호입니다. |
| **`selected`** | 선택된 항목의 상세 속성 정보를 담은 객체입니다. |

```ts
// 구현 예시: 사용자의 선택 내역을 로그 시스템에 기록합니다.  
novel.hooker.onBefore('choice:select', (state) => {
  console.log(`[Interaction Log] 사용자 선택 항목: ${state.selected.text}`);
  return { ...state };
})
```

---

## 3. 주의 사항 (Edge Cases)

*   **데이터 상태 판별**: 훅으로 전달되는 데이터는 이미 변수 보간(`{{ }}`) 및 Resolvable 함수의 평가가 모두 완료되어 **최종 문자열로 확정된 상태**입니다.  
*   **실행 성능 고려**: 훅은 엔진의 메인 시나리오 루프 내에서 동기(Synchronous) 방식으로 실행됩니다.  지나치게 복잡하거나 무거운 연산은 시각적 끊김을 유발할 수 있으므로 주의해 주시기 바랍니다.  
*   **선택 지연**: 훅 내부 로직이 완료된 이후에야 후속 씬 전환이나 변수 업데이트가 진행되므로, 응답성이 중요한 연출에서는 효율적인 로직 작성이 요구됩니다.  
