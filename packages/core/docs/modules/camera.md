# 🎥 카메라 (Camera)

## 개요 (Overview)

카메라 모듈은 화면의 줌(Zoom), 위치(Pan), 그리고 흔들림(Effect)을 조합하여 시나리오 연출의 몰입감을 높입니다.  
세 가지 하위 커맨드가 각각 독립적으로 동작하므로 섞어서 사용할 수 있습니다.  

## 하위 커맨드 목록

카메라를 제어하는 하위 커맨드들의 인덱스입니다.  

| 커맨드 타입 | 설명 |
| :--- | :--- |
| **[`camera-zoom`](./camera-zoom.md)** | 화면을 확대하거나 축소합니다. |
| **[`camera-pan`](./camera-pan.md)** | 카메라 시점을 좌우, 상하로 이동합니다. |
| **[`camera-effect`](./camera-effect.md)** | 화면 전체에 흔들림이나 물리적 충격을 줍니다. |

## 핵심 예제 (Main Example)

카메라의 줌, 패닝, 이펙트를 동시에 섞어 쓰는 복합 연출 예제입니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 화면을 1.5배 확대하면서 동시에 오른쪽으로 이동하고, 화면 전체를 흔듭니다
  { type: 'camera-zoom', preset: 'close-up', duration: 1000, skip: true },
  { type: 'camera-pan', position: 'right', duration: 1000, skip: true },
  { type: 'camera-effect', preset: 'shake', duration: 1000 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **상태 유지** | `camera-zoom`과 `camera-pan`으로 변경된 카메라의 상태는 명시적으로 `reset`하기 전까지 유지됩니다. |
