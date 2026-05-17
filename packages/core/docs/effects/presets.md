# 🎭 이펙트 프리셋 (Effect Presets)

`camera-effect` 및 `character-effect` 명령어에서 `effect` 속성에 들어가는 효과 이름들의 목록과 세부 조절 방법입니다.  

## 핵심 예제 (Main Example)

캐릭터를 흔들거나 튕기는 연출 예제입니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 화면 전체에 강한 진동을 줍니다
  { type: 'camera-effect', effect: 'shake' },

  // 특정 캐릭터가 깜짝 놀라며 튀어오릅니다
  { type: 'character-effect', name: 'fumika', effect: 'jolt' }
])
```

## 프리셋 목록 (Presets)

명령어의 `effect` 속성에 문자로 입력할 수 있는 효과들입니다.  

| 이름 | 지속 시간 | 기본 강도 | 설명 |
| :--- | :--- | :--- | :--- |
| **`shake`** | 500ms | 10 | 화면이나 캐릭터가 상하좌우로 무작위로 떨립니다. |
| **`shake-x`** | 500ms | 15 | 좌우로만 강하게 떨립니다. |
| **`shake-y`** | 500ms | 15 | 상하로만 강하게 떨립니다. |
| **`jolt`** | 200ms | 30 | 순간적으로 강하게 튀어오릅니다. (깜짝 놀람, 타격 등) |
| **`bounce`** | 600ms | 15 | 공처럼 통통 위아래로 뜁니다. |
| **`pulse`** | 600ms | 1.1 | 크기가 커졌다 작아지며 심장 박동처럼 뜁니다. |
| **`nod`** | 400ms | 10 | 고개를 끄덕이듯이 아래로 부드럽게 숙였다가 올라옵니다. |
| **`fall`** | 800ms | 15 | 아래로 떨어집니다. |
| **`wave`** | 1000ms | 20 | 물결치듯 둥글게 흔들립니다. |
| **`float`** | 2000ms | 10 | 무중력 상태처럼 위아래로 느리고 둥둥 떠다닙니다. |
| **`spin`** | 1000ms | 360 | 제자리에서 회전합니다. |
| **`spin-x`** | 1000ms | 360 | 좌우로 뒤집어지며 회전합니다. |
| **`spin-y`** | 1000ms | 360 | 위아래로 뒤집어지며 회전합니다. |
| **`reset`** | - | - | 진행 중인 모든 효과를 즉시 멈추고 원래 상태로 돌아갑니다. |

## 정밀 조절 (Advanced Timing)

프리셋 효과를 사용할 때 추가 속성을 넣어서 연출을 미세하게 조정할 수 있습니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  {
    type: 'character-effect',
    name: 'fumika',
    effect: 'pulse',
    // 연출 강도 (pulse의 경우 배율, shake의 경우 픽셀 이동 거리입니다)
    intensity: 1.5,
    // 1000ms (1초) 동안 진행합니다
    duration: 1000,
    // -1을 주면 reset 명령어를 쓸 때까지 무한 반복합니다
    repeat: -1
  }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 및 해결 방법 |
| :--- | :--- |
| **무한 반복 멈추기** | `repeat: -1`로 효과를 무한히 주고 있다면, 해당 캐릭터(또는 카메라)에 `effect: 'reset'` 명령어를 주어 효과를 명시적으로 해제해야 합니다. |
