# 🏷️ UI 태그 및 억제 시스템 (UI Tags & Suppression System)

## 개요 (Overview)

Fumika 엔진은 복수의 UI 모듈이 화면에 공존할 때 발생하는 시각적 간섭을 제어하기 위해 **태그 기반 억제(Suppression) 시스템**을 사용합니다.  
이 시스템은 특정 UI가 활성화될 때(예: 선택지 창이 뜰 때) 기존에 떠 있던 다른 UI(예: 대화창)를 자동으로 숨기고, 작업이 끝나면 다시 복구하는 과정을 자동화합니다.

## 핵심 메커니즘 (Core Mechanism)

이 시스템은 크게 두 가지 속성으로 동작합니다.

### 1. `uiTags` (UI 소속 태그)
각 UI 요소가 어떤 그룹에 속하는지를 정의하는 문자열 배열입니다. CSS의 클래스(Class)와 유사한 역할을 합니다.
*   **고정 태그 (기본 모듈)**: `dialogue`, `choices` 등 엔진 기본 모듈은 효율적인 관리를 위해 내부적으로 태그가 고정되어 있습니다.
*   **커스텀 태그 (element)**: `element` 모듈을 통해 생성되는 요소들은 각 **인스턴스마다** 고유한 태그를 부여받아 정교한 제어가 가능합니다.
*   **범용 태그**: `default-ui` 태그는 엔진에서 대화창, 선택지, 입력창 등을 일괄 제어하기 위한 표준 태그로 사용됩니다.

### 2. `hideTags` (억제 대상 태그)
현재 UI가 화면에 나타날 때, **화면에서 숨겨야 할 대상 태그 목록**을 지정합니다.
*   **동작 방식**: `hideTags`에 지정된 태그 중 하나라도 `uiTags`에 가지고 있는 UI 모듈들은 자동으로 `hide()` 처리가 되어 화면에서 사라집니다.
*   **자동 복구**: 명령어가 종료(Resolve)되거나 해당 요소가 제거될 때, 억제되었던 UI들은 원래 보였던 상태라면 자동으로 다시 나타납니다.

---

## 핵심 예제 (Main Example)

### element 요소별 개별 태그 제어

`element` 명령을 사용하여 특정 연출용 UI를 띄울 때 대화창만 선택적으로 숨기고 싶은 경우의 예제입니다.

```typescript
export default defineScene({ config })(() => [
  { type: 'dialogue', text: '지금부터 특수 인터페이스를 기동합니다.' },

  {
    type: 'element',
    action: 'show',
    id: 'special_hud',
    kind: 'rect',
    // 이 인스턴스에만 'custom-hud' 태그를 부여합니다.
    uiTags: ['custom-hud'],
    // 이 HUD가 떠 있는 동안 'dialogue' 태그를 가진 모든 UI를 숨깁니다.
    hideTags: ['dialogue'],
    position: { x: 0.5, y: 0.5 },
    style: { width: 400, height: 200, color: 'blue' }
  },

  { type: 'dialogue', text: 'HUD가 켜져 있는 동안 대화창은 잠시 숨겨졌다가, HUD가 사라지면 다시 나타납니다.' },

  // HUD 제거 시 해당 인스턴스의 억제 설정이 해제되어 대화창이 자동 복구됩니다.
  { type: 'element', action: 'hide', id: 'special_hud' }
])
```

---

## 기본 모듈별 태그 설정 (Default Settings)

기본 UI 모듈들은 명령어 파라미터(`uiTags`, `hideTags`)를 지원하지 않으며, 아래의 고정된 규칙에 따라 동작합니다.

| 모듈명 | 고정 `uiTags` | 고정 `hideTags` | 설명 |
| :--- | :--- | :--- | :--- |
| **`dialogue`** | `['dialogue', 'default-ui']` | `[]` | 일반 대화창. 다른 UI를 숨기지 않음. |
| **`choices`** | `['choice', 'default-ui']` | `['default-ui']` | 선택지 창. 다른 모든 기본 UI를 숨김. |
| **`dialogBox`** | `['dialogBox', 'default-ui']` | `['default-ui']` | 시스템 알림창. 다른 모든 기본 UI를 숨김. |
| **`input`** | `['input', 'default-ui']` | `['default-ui']` | 입력창. 다른 모든 기본 UI를 숨김. |
| **`element`** | (인스턴스별 지정) | (인스턴스별 지정) | 범용 요소. `show` 명령어 시점에 직접 지정 가능. |

---

## 주의 사항 (Edge Cases)

### 1. 자기 자신 숨김 방지 (Self-Suppression Protection)
엔진은 UI가 `hideTags`를 통해 자기 자신을 숨기는 상황을 방지합니다. 현재 활성화되어 명령을 수행 중인 UI 모듈은 `hideTags` 조건에 부합하더라도 억제 대상에서 자동으로 제외됩니다.

### 2. 중첩 억제
UI A가 UI B를 숨기고, UI B가 UI C를 숨기는 형태의 계층적 억제도 지원됩니다. 각 단계에서 억제 상태가 추적되어, 상위 UI가 사라질 때 하위 UI들이 순차적으로 복구됩니다.

### 3. 수동 제어와의 차이
`type: 'ui', action: 'hide'` 커맨드는 UI를 명시적으로 비활성화(Off)하는 것이지만, 억제 시스템은 **조건부 일시 숨김**입니다. 상태값이 유지되므로 연출 흐름이 훨씬 자연스럽습니다.
