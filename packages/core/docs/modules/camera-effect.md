# 💥 카메라 효과 (Camera Effect)

## 개요 (Overview)

`camera-effect` 모듈은 화면 전체에 흔들림이나 진동 같은 연출을 줍니다.  
폭발이나 지진처럼 배경과 캐릭터가 동시에 흔들려야 하는 거대한 물리적 충격을 표현할 때 사용합니다.  

## 핵심 예제 (Main Example)

### 강렬한 화면 흔들림 (Shake)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { 
    type: 'camera-effect', 
    preset: 'shake', 
    duration: 500, 
    intensity: 10, 
    repeat: 5 
  }
])
```

### 순간적인 충격 연출 (Jolt)

누군가에게 맞았거나 깜짝 놀란 연출입니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { 
    type: 'camera-effect', 
    preset: 'jolt', 
    duration: 200,
    intensity: 30
  }
])
```

## 옵션 상세

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'camera-effect'` | 필수 | 커맨드 타입 |
| **`preset`** | `string` | 필수 | 적용할 연출 프리셋 (예: `shake`, `jolt`) |
| **`duration`** | `number` | 프리셋 기본값 | 물리 효과가 지속될 전체 시간(ms) |
| **`intensity`** | `number` | 프리셋 기본값 | 효과의 세기(강도) 지정 |
| **`repeat`** | `number` | `1` | 지정된 효과의 반복 횟수 |

사용 가능한 프리셋의 전체 목록은 [이펙트 프리셋](../effects/presets.md)을 참고하세요.  

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **특정 캐릭터만 흔들고 싶을 때** | 화면 전체가 아닌 특정 캐릭터만 흔들고 싶다면 `character-effect` 명령어를 사용해야 합니다. |
| **효과 중단 및 덮어쓰기** | 연출 도중에 다른 `camera-effect`가 들어오면, 이전 효과는 즉시 취소되고 새로운 효과가 덮어씌워집니다. |
