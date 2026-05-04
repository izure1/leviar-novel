# 🪝 Input Hooks

본 문서는 `input` 모듈에서 입력창이 활성화되거나 사용자가 데이터를 제출하는 시점에 실행되는 훅(Hooks) 명세를 기술합니다.  
입력값의 유효성 검사, 데이터 필터링 및 변환 로직을 구현할 때 활용할 수 있습니다.  

---

## 1. 개요 (Overview)

사용자 입력 프로세스의 주요 단계에서 개입할 수 있는 훅 목록입니다.  

| 훅 이름 | 상세 기능 | 권장 활용 사례 |
| :--- | :--- | :--- |
| `input:open` | 입력창 노출 직전 발생 | 상황에 따른 안내 문구(Label)의 동적 변경 |
| `input:submit` | 데이터 제출 시 발생 | 입력값 유효성 검증, 금칙어 필터링, 데이터 변형 저장 |

---

## 2. 훅 상세 명세 (Reference)

### 2.1. `input:open`
입력 패널이 화면에 생성되기 직전에 호출됩니다.  
플레이어의 상태나 이전 시나리오의 결과에 따라 입력창의 제목을 보정하거나, 입력 모드를 강제로 전환하는 등의 작업이 가능합니다.  

*   **Payload**: `{ label: string, multiline: boolean }`  
*   **Return**: 보정된 데이터를 담은 객체를 반환합니다.  

```ts
// 구현 예시: 플레이어의 방문 횟수에 따라 안내 문구를 정중하게 변경합니다.  
novel.hooker.onBefore('input:open', (state) => {
  const label = novel.variables.isFirstVisit 
    ? '처음 뵙겠습니다.  귀하의 성함을 입력해 주십시오.' 
    : '다시 뵙게 되어 반갑습니다.  성함을 다시 한번 확인해 주십시오.';
    
  return { ...state, label };
})
```

### 2.2. `input:submit`
사용자가 제출 버튼을 클릭하거나 엔터 키를 입력했을 때 호출됩니다.  
전달된 텍스트의 무결성을 검증하고, 필요에 따라 저장을 취소하거나 데이터를 보정할 수 있습니다.  

*   **Payload**: `{ varName: string, text: string, buttonIndex: number, cancelled: boolean }`  
*   **Return**: 최종적으로 확정된 데이터를 반환합니다.  

| 필드 명칭 | 설명 |
| :--- | :--- |
| **`varName`** | 데이터가 최종적으로 할당될 대상 변수 식별자입니다. |
| **`text`** | 사용자가 실제로 입력한 원본 텍스트 데이터입니다. |
| **`buttonIndex`** | 클릭된 버튼의 배열 인덱스 번호입니다. |
| **`cancelled`** | `true` 반환 시 변수 업데이트 프로세스가 무시됩니다. |

```ts
// 구현 예시: 입력된 이름의 길이를 검증하고 불필요한 공백을 제거합니다.  
novel.hooker.onBefore('input:submit', (state) => {
  if (state.cancelled) return state; // 이미 취소 처리된 경우 로직을 건너뜁니다.  

  const processedText = state.text.trim();

  // 유효성 검사: 성명이 너무 짧을 경우 저장을 차단합니다.  
  if (processedText.length < 2) {
    alert('성명이 너무 짧습니다.  두 글자 이상 입력해 주십시오.');
    return { ...state, cancelled: true }; 
  }

  return { ...state, text: processedText };
})
```

---

## 3. 주의 사항 (Edge Cases)

*   **흐름 제어의 한계**: `input:submit` 훅은 입력 행위 자체의 완료 시점에 실행됩니다.  따라서 `cancelled: true`를 통해 **데이터의 변수 저장을 차단할 수는 있으나, 입력창이 닫히고 다음 시나리오 커맨드로 진행되는 흐름 자체를 막을 수는 없습니다.**  
*   **엄격한 유효성 검사 권장**: 입력값이 올바르지 않을 때 사용자가 반드시 올바른 값을 입력하도록 창을 유지해야 한다면, `input` 커맨드와 `condition` 루프를 조합한 시나리오 레벨의 설계를 권장합니다.  
*   **동적 대상 변수 변경**: 훅 내부에서 `varName` 속성을 수정하여, 입력 데이터가 저장될 타겟 변수를 실시간으로 변경하는 고급 기법을 사용하실 수 있습니다.  
*   **동기식 데이터 처리**: 훅은 데이터의 영속성 계층(Persistence)에 도달하기 전의 마지막 검증 단계이므로, 안정적인 데이터 처리를 위해 예외 처리에 유의해 주시기 바랍니다.  

---

## 4. 관련 참조 문서

*   **[Hooks 시스템 기초 개념](../../concepts.md#hooks)**: 엔진의 이벤트 처리 방식에 대한 전반적인 이해를 돕습니다.  
*   **[입력 모듈 활용 가이드](../input.md)**: `input` 커맨드의 기본 속성과 활용법을 기술합니다.  
