# 📦 알림창 (DialogBox)

## 개요 (Overview)

`dialogBox` 모듈은 플레이어에게 시스템 정보를 알리거나 확인을 받는 팝업 대화상자를 띄웁니다.  
단순한 텍스트 알림부터, 버튼을 눌러 아이템을 구매하거나 변수를 변경해야만 창이 닫히는 강제 선택창으로 활용할 수 있습니다.  

## 옵션 상세 (Properties)

### 1. DialogBox 명령

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'dialogBox'` | 필수 | 커맨드 타입 |
| **`title`** | `string` | 필수 | 상단 영역에 표시될 제목 텍스트 |
| **`content`** | `string` | 필수 | 중앙 영역에 표시될 본문 상세 내용 |
| **`buttons`** | `object[]` | 필수 | 하단에 배치할 버튼들의 구성 객체 목록 |
| **`persist`** | `boolean` | `false` | `true`면 창 밖의 여백을 클릭해도 창이 닫히지 않고 강제 선택을 요구함 |
| **`duration`** | `number` | `300` | 창이 나타나고 사라지는 페이드 애니메이션 시간(ms) |

### 2. Buttons 객체 구성

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`text`** | `string` | 필수 | 버튼에 표시될 텍스트 |
| **`var`** | `Object \| Function` | (없음) | 해당 버튼을 클릭했을 때 실행할 변수 갱신 로직 |

## 핵심 예제 (Main Example)

### 일반 알림 및 강제 확인창

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ 
  config,
  variables: { _gold: 500, _potion: 0 }
})(() => [
  // 1. 단순 시스템 알림창
  { 
    type: 'dialogBox', 
    title: '데이터 보존 완료', 
    content: '게임 데이터가 안전하게 기록되었습니다.',
    buttons: [{ text: '확인' }]
  },

  // 2. 변수 조작이 들어간 강제 선택창
  {
    type: 'dialogBox',
    title: '상점',
    content: '회복 포션을 구매하시겠습니까? (100G가 소모됩니다)',
    persist: true, // 바탕화면 클릭으로 창 닫기를 막습니다
    buttons: [
      { 
        text: '구매하기', 
        var: ({ _gold, _potion }) => ({ _gold: _gold - 100, _potion: _potion + 1 })
      },
      { text: '취소' }
    ]
  }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **자동 강제 선택(persist) 처리** | `buttons` 목록 안에 버튼이 한 개라도 들어있으면 엔진이 안전을 위해 자동으로 `persist: true` 상태로 동작합니다. 즉, 버튼을 눌러야만 창이 닫힙니다. 버튼이 하나도 없는 빈 알림창일 때만 바깥쪽을 눌러 창을 닫을 수 있습니다. |
| **시나리오 일시 정지** | 이 팝업창이 화면에 떠 있는 동안에는 시나리오가 진행되지 않고 스킵과 화면 터치가 모두 차단됩니다. |

## 관련 참조 문서

*   **[알림창 상태 (DialogBox State)](./state/dialogBox.md)**: 알림창 배경 및 버튼 레이아웃 제어
*   **[알림창 훅 (DialogBox Hooks)](./hooks/dialogBox.md)**: 알림창 렌더링 전 제목 수정 및 클릭 이벤트 제어
*   **[UI 태그 및 억제 시스템](../ui-tags.md)**: 알림창 노출 시 주변 UI를 숨기는 자동화 설정
