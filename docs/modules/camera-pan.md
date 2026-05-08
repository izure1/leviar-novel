# 🎞️ 카메라 패닝 (Camera Pan)

## 개요 (Overview)

`camera-pan` 명령어는 카메라의 시점을 상하좌우로 이동시키는 기능입니다.  
배경의 다른 부분을 비추거나 연출상 시선을 유도할 때 사용합니다.  

## 핵심 예제 (Main Example)

### 프리셋을 활용한 시점 이동

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 카메라 시점을 왼쪽으로 부드럽게 1초 동안 이동합니다
  { type: 'camera-pan', position: 'left', duration: 1000 }
])
```

### 정밀한 좌표 기반 이동

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 화면 중앙에서 X축으로 300px, Y축으로 100px 떨어진 곳을 비춥니다
  { type: 'camera-pan', position: 'center', x: 300, y: 100, duration: 1500 }
])
```

## 옵션 상세

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'camera-pan'` | 필수 | 커맨드 타입 |
| **`position`** | `string` | 필수 | 기준이 될 위치 프리셋 (`center`, `left`, `right`, `up`, `down`) |
| **`x`** | `number` | `0` | 기준 위치에서의 X축 추가 이동 거리(px) |
| **`y`** | `number` | `0` | 기준 위치에서의 Y축 추가 이동 거리(px) |
| **`duration`** | `number` | `1000` | 카메라 이동에 걸리는 시간(ms) |
| **`ease`** | `string` | `'easeInOutQuad'` | 애니메이션의 [이징 함수 목록](../easing.md) 이름 |

## 주의 사항 (Edge Cases)

| 상황 | 설명 및 해결 방법 |
| :--- | :--- |
| **좌표 체계 혼동** | 엔진의 Y축은 위로 올라갈수록 값이 커집니다. 카메라를 위로 올리려면 `y`에 양수를 넣어야 합니다. |
| **특정 캐릭터를 비추고 싶을 때** | 수동으로 좌표를 계산하지 말고, 캐릭터를 쫓아가는 [캐릭터 포커스](./character-focus.md) 명령어를 사용하세요. |
