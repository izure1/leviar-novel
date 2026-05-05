# ⚙️ 오버레이 상태 (Overlay State)

## 개요 (Overview)

`overlay` 모듈에서 텍스트(`overlay-text`) 및 이미지(`overlay-image`) 오버레이 생성 시 적용되는 전역적인 기본 스타일 구조인 `OverlaySchema`입니다.  

## 상태 상세 명세 (Properties)

| 속성 명칭 | 데이터 타입 | 상세 설명 |
| :--- | :--- | :--- |
| **`textStyle`** | `Partial<Style>` | 모든 텍스트 오버레이 객체에 적용될 기본 스타일 |
| **`imageStyle`** | `Partial<Style>` | 모든 이미지 오버레이 객체에 적용될 기본 스타일 |

## 핵심 예제 (Main Example)

### 씬 진입 시 전역 테마 세팅

`defineScene`의 `initial` 속성을 통해 오버레이 생성 전 기본 테마를 세팅합니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  initial: {
    overlay: {
      // 텍스트 오버레이에 일괄 적용될 테마
      textStyle: { fontSize: 32, color: '#ffd700', fontWeight: 'bold' },
      // 이미지 오버레이에 일괄 적용될 테마
      imageStyle: { opacity: 0.8, borderRadius: 10 }
    }
  }
})(() => [
  // 지정된 기본 스타일로 렌더링됩니다
  { type: 'overlay-text', id: 'title', text: '제 1장' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **스타일 오버라이드 덮어쓰기** | `overlay-text`나 `overlay-image` 명령어 자체에 직접 명시한 개별 스타일 속성이 전역 상태 스타일보다 무조건 우선합니다. |
| **실시간 병합 및 상속** | 중간에 `ui` 커맨드로 상태를 변경하면, 그 시점 이후 새로 생성되는 오버레이들부터 변경된 스타일을 상속받습니다. |
