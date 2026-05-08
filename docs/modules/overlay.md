# 🖼️ 오버레이 (Overlay)

## 개요 (Overview)

`overlay` 모듈은 캐릭터나 배경 맨 위에 텍스트(제목, 안내문)나 작은 이미지(로고)를 별도로 띄우는 기능입니다.  
텍스트를 띄우는 `overlay-text`와 이미지를 띄우는 `overlay-image`, 그리고 이들에게 효과를 주는 `overlay-effect` 명령어 세 개로 구성됩니다.  

## 옵션 상세 (Properties)

### 1. 텍스트 오버레이 (`overlay-text`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'overlay-text'` | 필수 | 커맨드 타입 |
| **`action`** | `'show' \| 'hide'` | 필수 | 텍스트 표시 여부 |
| **`name`** | `string` | 필수 | 조작할 오버레이의 고유 이름 |
| **`text`** | `string` | 필수 | 화면에 보여줄 글자 내용 |
| **`preset`** | `string` | `'caption'` | 폰트 스타일 (`title`: 중앙 큰 제목, `caption`: 하단 안내문, `whisper`: 작게 속삭임) |
| **`duration`** | `number` | 프리셋 기본값 | 나타나거나 지워질 때 걸리는 시간(ms) |
| **`ease`** | `string` | `'easeOut'` | 애니메이션의 [이징 함수 목록](../easing.md) 이름 |

### 2. 이미지 오버레이 (`overlay-image`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'overlay-image'` | 필수 | 커맨드 타입 |
| **`action`** | `'show' \| 'hide'` | 필수 | 이미지 표시 여부 |
| **`name`** | `string` | 필수 | 조작할 오버레이의 고유 이름 |
| **`src`** | `string` | 필수 | 보여줄 에셋 이미지 키 |
| **`x`, `y`** | `number` | `0.5` | 위치 비율 좌표 (`0.0` ~ `1.0`. `0.5`면 화면 한가운데를 뜻함) |
| **`width`, `height`** | `number` | 원본 크기 | 이미지를 출력할 강제 크기(px) |
| **`duration`** | `number` | `300` | 전환 애니메이션의 지속 시간(ms)입니다. |
| **`ease`** | `string` | `'easeOut'` | 애니메이션의 [이징 함수 목록](../easing.md) 이름 |

## 핵심 예제 (Main Example)

### 타이틀 텍스트 및 로고 이미지 노출

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 커다란 타이틀 텍스트를 화면 한가운데 띄웁니다
  { 
    type: 'overlay-text', 
    action: 'show', 
    name: 'chapter1', 
    text: '제 1장: 시작', 
    preset: 'title' 
  },

  // 2. 화면 상단(y: 0.3)에 작게 로고 이미지를 띄웁니다
  { 
    type: 'overlay-image', 
    action: 'show', 
    name: 'logo', 
    src: 'logo-img', 
    x: 0.5, y: 0.3, 
    width: 200 
  },

  { type: 'wait', duration: 2000 },

  // 3. 타이틀 텍스트를 지웁니다
  { type: 'overlay-text', action: 'hide', name: 'chapter1', duration: 1000 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **이름 중복 시 교체** | 이미 화면에 떠 있는 오버레이와 동일한 `name`으로 다시 커맨드를 실행하면, 이전 객체는 즉시 삭제되고 새로운 내용으로 덮어씌워집니다. |
| **씬 전환 보존 정책** | 오버레이 객체들은 일반 씬 렌더링 계층과 분리되어 있어, 명시적으로 `action: 'hide'` 하거나 전체 클리어(`clear`)를 호출하지 않으면 씬이 넘어가도 계속 화면에 남습니다. |

## 관련 참조 문서

*   **[오버레이 상태 (Overlay State)](./state/overlay.md)**: 텍스트 및 이미지 오버레이의 전역 기본 스타일 정의
