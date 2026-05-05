# 💬 대화 (Dialogue)

## 개요 (Overview)

`dialogue` 모듈은 대사나 나레이션을 대화창에 출력하는 가장 기본적인 기능입니다.  
글자가 하나씩 쳐지는 타이핑 효과와, 엔진의 변수 내용을 실시간으로 대사에 섞어 출력하는 문자열 보간(`{{var}}`) 기능을 지원합니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'dialogue'` | 필수 | 커맨드 타입 |
| **`text`** | `string \| string[]` | 필수 | 출력할 텍스트 대사. 배열로 넣으면 줄 단위로 클릭 대기가 걸림 |
| **`speaker`** | `string` | (없음) | 화자의 식별자 키. 누락 시 이름창이 지워지며 나레이션 처리됨 |
| **`speed`** | `number` | `30` | 글자가 한 글자씩 쳐지는 속도(ms). 값이 0이면 한 번에 즉시 출력됨 |

## 핵심 예제 (Main Example)

### 기본 대화 및 나레이션 처리

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 화자가 지정된 일반 대화입니다
  { type: 'dialogue', speaker: 'heroine', text: '안녕! 오늘 날씨가 정말 좋다.' },

  // 2. speaker가 없으면 이름창이 사라지며 나레이션으로 출력됩니다
  { type: 'dialogue', text: '그녀는 밝게 웃으며 나에게 인사를 건넸다.' },

  // 3. 텍스트를 배열로 넘기면 클릭할 때마다 다음 줄이 이어집니다
  { 
    type: 'dialogue', 
    speaker: 'heroine', 
    text: [
      '있잖아, 사실 할 말이 있어...',
      '나랑 같이 축제에 가지 않을래?'
    ],
    speed: 50 // 속도를 느리게 조절합니다
  }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **클릭 시 스킵 처리** | 글자가 타이핑되는 도중 마우스를 클릭하면, 대기하지 않고 남은 글자 전체가 즉시 화면에 한 번에 표시됩니다. 다시 클릭해야 다음 명령어로 넘어갑니다. |
| **대사에 변수 삽입** | `{{_playerName}}`처럼 대사 문자열 내부에 중괄호를 두 번 넣으면, 해당 이름의 엔진 변수값으로 자동 치환되어 출력됩니다. |

## 관련 참조 문서

*   **[대화창 상태 (Dialogue State)](./state/dialogue.md)**: 대화창의 시각적 디자인 및 여백 레이아웃 커스텀
*   **[대화 훅 (Dialogue Hooks)](./hooks/dialogue.md)**: 대사 출력 중 보이스 재생 및 실시간 텍스트 가로채기
