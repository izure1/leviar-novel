# 🗳️ 선택지 (Choices)

## 개요 (Overview)

`choices` 모듈은 사용자에게 버튼 형태의 선택지를 제시하고, 그 선택 결과에 따라 씬을 분기하거나 엔진의 변수 상태를 조작하는 인터랙티브 기능입니다.  

## 옵션 상세 (Properties)

### 1. Choices 상위 명령

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'choices'` | 필수 | 커맨드 타입 |
| **`choices`** | `ChoiceItem[]` | 필수 | 화면에 제시할 선택지들의 객체 배열 |

### 2. ChoiceItem 요소 상세

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`text`** | `string \| Function` | 필수 | 버튼에 표시될 텍스트. (함수 형태로 넣어 실시간 변수 보간 가능) |
| **`next`** | `string` | - | 해당 항목 선택 시 즉시 이동할 다른 씬(Scene)의 식별자 이름 |
| **`goto`** | `string` | - | 해당 항목 선택 시 즉시 이동할 현재 씬 내부의 라벨(Label) 이름 |
| **`var`** | `Object \| Function` | - | 해당 항목 선택 시 값을 변경하거나 연산할 엔진 내부 변수 조작 객체 |

## 핵심 예제 (Main Example)

### 일반적인 분기 및 변수 갱신점

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  // 씬에서 사용할 지역 변수는 _ 언더바 접두사로 선언합니다
  variables: { _heart: 0 }
})(({ set }) => [
  { type: 'dialogue', text: '눈앞에 갈림길이 나타났다. 어디로 갈까?' },

  {
    type: 'choices',
    choices: [
      { 
        text: '왼쪽으로 간다', 
        next: 'scene-left', // scene-left 파일로 완전히 넘어갑니다
        var: { _heart: 1 } // 호감도를 1로 설정합니다
      },
      { 
        text: '오른쪽으로 간다', 
        goto: 'right-path', // 현재 씬 아래의 'right-path' 라벨로 점프합니다
        var: ({ _heart }) => ({ _heart: _heart - 1 }) // 기존 호감도 값에서 1을 뺍니다
      }
    ]
  },

  { type: 'label', name: 'right-path' },
  { type: 'dialogue', text: '오른쪽 길은 어둡고 축축하다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **입력 차단 정책** | 선택지가 화면에 떠 있는 동안에는 클릭해도 다음 시나리오 대사로 넘어가지 않으며, 반드시 버튼 중 하나를 클릭해야만 진행이 풀립니다. |
| **동적 버튼 텍스트** | `text`에 람다 함수 `({ _gold }) => "금화 지불 (" + _gold + ") "` 를 넣으면 현재 유저의 변수 상태에 맞춰 버튼 글씨가 동적으로 바뀝니다. |

## 관련 참조 문서

*   **[선택지 상태 (Choices State)](./state/choices.md)**: 선택지 버튼의 레이아웃과 디자인 변경 방법
*   **[선택지 훅 (Choices Hooks)](./hooks/choices.md)**: 선택 이벤트 발생 시 텍스트 조작 및 로깅 기법
*   **[UI 태그 및 억제 시스템](../ui-tags.md)**: 선택지 활성화 시 다른 UI를 숨기는 메커니즘 상세
