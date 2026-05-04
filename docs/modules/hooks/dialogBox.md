# 🪝 DialogBox Hooks

본 문서는 `dialogBox` 모듈의 활성화 지점과 사용자의 선택 시점에 개입하여 데이터를 제어하거나 기록할 수 있는 훅(Hooks) 명세를 기술합니다.  

---

## 1. 개요 (Overview)

시스템 대화상자의 라이프사이클을 추적하고 제어할 수 있는 핵심 훅 목록입니다.  

| 훅 이름 | 상세 기능 | 권장 활용 사례 |
| :--- | :--- | :--- |
| `dialogBox:show` | 대화상자 노출 직전의 데이터 변형 | 제목 및 본문의 동적 수정, 강제 영속성(Persist) 설정 등 |
| `dialogBox:select` | 버튼 클릭 또는 창 닫힘 이벤트 감지 | 사용자 선택 내역 기록, 선택에 따른 부가 연출 실행 등 |

---

## 2. 훅 상세 명세 (Reference)

### 2.1. `dialogBox:show`
커맨드 데이터가 UI 렌더러에 전달되어 화면에 그려지기 직전에 호출됩니다.  
시나리오상의 고정된 문구를 게임 내 변수 상태에 따라 실시간으로 보정하거나, 특수 상황에서 강제로 상호작용을 제약하는 등의 고도화된 제어가 가능합니다.  

*   **Payload**: `DialogBoxCmd` (`title`, `content`, `buttons`, `persist`, `duration`)  
*   **Return**: 보정된 `DialogBoxCmd` 객체를 반환합니다.  

```ts
// 구현 예시: 긴급 상황 시 모든 대화상자의 제목을 보정하고 배경 클릭을 차단합니다.  
novel.hooker.onBefore('dialogBox:show', (cmd) => {
  if (novel.variables.isUrgent) {
    return { ...cmd, persist: true, title: `[긴급 상황] ${cmd.title}` };
  }
  return cmd;
})
```

### 2.2. `dialogBox:select`
사용자가 버튼을 클릭하거나, 특정 설정에 의해 배경을 클릭하여 창을 닫았을 때 호출됩니다.  

*   **Payload**: `{ index: number, selected?: ButtonObject }`  
*   **Return**: 처리된 데이터를 반환합니다.  

| 필드 명칭 | 설명 |
| :--- | :--- |
| **`index`** | 클릭된 버튼의 배열 인덱스 번호입니다.  **배경 클릭으로 닫힌 경우에는 `-1`**이 할당됩니다. |
| **`selected`** | 클릭된 버튼의 속성 객체입니다.  (배경 클릭으로 인한 종료 시에는 `undefined`입니다) |

```ts
// 구현 예시: 플레이어의 선택 결과를 분석하여 시스템 로그에 기록합니다.  
novel.hooker.onAfter('dialogBox:select', (state) => {
  if (state.index === -1) {
    console.log('[System Log] 대화상자가 응답 없이 소거되었습니다.');
  } else {
    console.log(`[System Log] 사용자 선택 버튼: ${state.selected?.text}`);
  }
  return state;
})
```

---

## 3. 주의 사항 (Edge Cases)

*   **배경 클릭 인덱스(-1)의 발생 조건**: `persist` 설정이 `false`이고 버튼이 전혀 정의되지 않은 특수한 상황에서만 배경 클릭을 통한 창 닫기가 가능하며, 이때 인덱스 `-1`이 발생합니다.  **버튼이 하나 이상 존재하는 경우 보안을 위해 배경 클릭이 자동 차단되므로 이 인덱스는 발생하지 않습니다.**  
*   **데이터 불변성 권장**: `selected` 객체의 내부 속성을 훅에서 직접 수정하는 행위는 이미 실행 로직이 결정된 시점일 수 있으므로 권장되지 않습니다.  주로 인덱스 값을 통한 상태 판별이나 외부 로깅 용도로 활용해 주시기 바랍니다.  
*   **동기식 처리**: 훅 로직이 지연될 경우 전체적인 시스템 응답성에 영향을 줄 수 있으므로, 가급적 가벼운 비즈니스 로직 위주로 구성해 주십시오.  

---

## 4. 관련 참조 문서

*   **[Hooks 시스템 기초 개념](../../concepts.md#hooks)**: 엔진의 이벤트 릴레이 방식에 대한 상세 정보를 제공합니다.  
*   **[범용 대화상자 가이드](../dialogBox.md)**: `dialogBox` 커맨드의 상세 속성과 활용법을 기술합니다.  
