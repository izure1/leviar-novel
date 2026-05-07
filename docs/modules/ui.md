# 🖥️ UI 제어 (UI Control)

## 개요 (Overview)

`ui` 모듈은 게임 화면의 대화창(`dialogue`), 오버레이 텍스트 등을 플레이어가 안 보이게 일시적으로 강제 숨김 처리하거나 다시 나타나게 만드는 명령어입니다.  
CG 연출 중에 대화창을 치워서 배경 그림을 깨끗하게 보여주고 싶을 때 주로 사용합니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'ui'` | 필수 | 커맨드 타입 |
| **`name`** | `string` | 필수 | 껐다 켤 대상 UI 모듈의 식별자 키 (예: `dialogue` 등 `config`에 등록된 모듈 키) |
| **`action`** | `'show' \| 'hide'` | 필수 | 화면에 나타낼지(`show`), 숨길지(`hide`) 여부 지정 |
| **`duration`** | `number` | 프리셋 기본값 | 나타나거나 사라질 때 걸리는 페이드 애니메이션 시간(ms) |

## 핵심 예제 (Main Example)

### 대화창 잠시 숨기고 풍경 감상하기

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', text: '이 풍경은 정말 아름답군.' },
  
  // 대화창 모듈(dialogue)을 0.5초 동안 서서히 숨깁니다
  { type: 'ui', name: 'dialogue', action: 'hide', duration: 500 },
  
  // 2초 동안 풍경을 감상합니다
  { type: 'wait', duration: 2000 },
  
  // 다시 대화창을 표시합니다
  { type: 'ui', name: 'dialogue', action: 'show', duration: 500 },
  
  { type: 'dialogue', text: '시간 가는 줄 몰랐어.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **모듈의 데이터 보존** | `ui` 커맨드로 숨겨진 대화창이나 요소들은 단순한 가시성만 사라질 뿐 내부 데이터가 삭제되지 않습니다. 나중에 다시 `show`를 호출하면 숨기기 직전의 텍스트와 레이아웃이 조금도 훼손되지 않고 그대로 보존되어 나타납니다. |
| **자동 억제 시스템** | 수동으로 UI를 껐다 켜는 대신, 특정 상황에서 자동으로 UI를 숨기려면 **[UI 태그 시스템](../ui-tags.md)**을 활용하세요. |
