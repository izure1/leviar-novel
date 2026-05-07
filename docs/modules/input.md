# ⌨️ 입력 (Input)

## 개요 (Overview)

`input` 모듈은 사용자로부터 텍스트 입력을 받아 엔진의 내부 변수에 저장하는 기능입니다.  
주인공의 이름을 짓거나 암호, 메모 등을 입력받을 때 사용합니다.  

## 옵션 상세 (Properties)

### 1. Input 명령

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'input'` | 필수 | 커맨드 타입 |
| **`to`** | `string` | 필수 | 입력된 텍스트를 저장할 변수 이름 (예: `playerName`, `_memo`) |
| **`label`** | `string` | (없음) | 입력창 바로 위에 띄워줄 안내 문구 |
| **`multiline`** | `boolean` | `false` | 여러 줄을 입력할 수 있게 텍스트 영역을 키울지 여부 |
| **`buttons`** | `InputButton[]` | (없음) | 입력창 하단에 배치할 버튼들의 구성 객체 목록 |
| **`uiTags`** | `string[]` | `['input', 'default-ui']` | 이 모듈의 UI 태그 목록입니다. |
| **`hideTags`** | `string[]` | `['default-ui']` | 입력창 활성화 시 함께 숨길 대상 태그 목록입니다. |

### 2. InputButton 객체 구성

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`text`** | `string` | 필수 | 버튼에 표시될 텍스트 |
| **`cancel`** | `boolean` | `false` | `true`면 저장하지 않고 창을 닫음 |

## 핵심 예제 (Main Example)

### 이름 입력받기

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', text: '내 이름이 뭐더라...?' },

  // 입력된 이름을 전역 변수 playerName에 저장합니다
  { 
    type: 'input', 
    to: 'playerName', 
    label: '이름을 입력해 주십시오.' 
  },

  { type: 'dialogue', text: '아, 맞아. 내 이름은 {{playerName}}이었어.' }
])
```

### 메모 입력 및 취소 버튼 

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ 
  config,
  variables: { _memo: '' } // 씬 안에서만 쓰이는 지역 변수 선언
})(() => [
  {
    type: 'input',
    to: '_memo', 
    label: '메모를 작성해 주십시오.',
    multiline: true,
    buttons: [
      { text: '저장' },
      { text: '취소', cancel: true } // 이 버튼을 누르면 변수에 저장되지 않고 넘어갑니다
    ]
  }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **엔터 키 동작** | `multiline: false`일 때 사용자가 엔터를 치면, 첫 번째 버튼을 클릭한 것과 동일하게 취급되어 즉시 저장되고 창이 닫힙니다. |
| **취소 시 변수 상태 유지** | `cancel: true` 버튼을 누르면 이전에 변수에 저장되어 있던 원래 데이터가 지워지거나 훼손되지 않고 그대로 유지됩니다. |

## 관련 참조 문서

*   **[입력창 상태 (Input State)](./state/input.md)**: 입력창 배경, 커서 및 폰트 스타일 제어
*   **[입력 훅 (Input Hooks)](./hooks/input.md)**: 사용자가 입력한 텍스트의 유효성 검사 및 보정
*   **[UI 태그 및 억제 시스템](../ui-tags.md)**: 입력창 활성화 시 주변 UI를 자동으로 가리는 방법
