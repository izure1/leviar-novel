# 🔍 카메라 줌 (Camera Zoom)

## 개요 (Overview)

`camera-zoom` 명령어는 화면을 확대하거나 축소하는 기능을 담당합니다.  
특정 인물이나 객체를 클로즈업하여 긴장감을 주거나, 화각을 넓혀 배경을 강조할 때 사용합니다.  

## 핵심 예제 (Main Example)

### 인물 클로즈업

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 화면을 1.5배 확대하여 클로즈업합니다
  { type: 'camera-zoom', preset: 'close-up', duration: 800 }
])
```

### 시점 초기화 (Reset)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 확대되었던 카메라 배율을 기본값(1.0)으로 원래대로 되돌립니다
  { type: 'camera-zoom', preset: 'reset', duration: 400 }
])
```

## 옵션 상세

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'camera-zoom'` | 필수 | 커맨드 타입 |
| **`preset`** | `string` | 필수 | 줌 배율 프리셋 (`close-up`, `medium`, `wide`, `reset`) |
| **`duration`** | `number` | 프리셋 기본값 | 확대/축소에 걸리는 시간(ms) |
| **`ease`** | `string` | `'easeInOutQuad'` | 애니메이션의 [이징 함수 목록](../easing.md) 이름 |

### 줌 프리셋 상세 (`ZoomPreset`)

| 이름 | 배율 (Scale) | 기본 시간 | 설명 |
| :--- | :---: | :---: | :--- |
| `close-up` | `1.5` | `800ms` | 대상을 강하게 확대하여 강조합니다. |
| `medium` | `1.2` | `600ms` | 상반신 위주의 적절한 거리감으로 다가갑니다. |
| `wide` | `0.92` | `800ms` | 화각을 약간 넓혀 배경이 더 잘 보이게 합니다. |
| `reset` | `1.0` | `600ms` | 확대/축소 상태를 지우고 기본 상태로 돌아갑니다. |
| `inherit` | - | - | 이전 씬에서 사용했던 줌 상태를 그대로 물려받습니다. |

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **상태의 유지 보존** | 줌 배율은 명시적으로 `reset`하기 전까지 유지됩니다. 씬이 넘어가도 계속 유지하고 싶다면 `preset: 'inherit'`을 쓰거나 씬 이동 시 `preserve: true` 옵션을 주어야 합니다. |
