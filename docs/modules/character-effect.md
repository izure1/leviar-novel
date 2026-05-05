# ⚡ 캐릭터 이펙트 (Character Effect)

## 개요 (Overview)

`character-effect` 모듈은 화면 전체가 아닌 **특정 캐릭터 하나만** 흔들리거나 튀어오르게 만드는 기능입니다.  
캐릭터가 화를 내거나 깜짝 놀랐을 때 등 감정을 물리적으로 표현할 때 유용합니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'character-effect'` | 필수 | 커맨드 타입 |
| **`name`** | `string` | 필수 | 효과를 줄 대상 캐릭터의 식별자 이름 |
| **`preset`** | `string` | 필수 | 적용할 [이펙트 프리셋](../effects/presets.md) 이름 (예: `shake`, `bounce`) |
| **`duration`** | `number` | 프리셋 기본값 | 연출 효과 1회가 끝나는 데 걸리는 시간(ms) |
| **`intensity`** | `number` | 프리셋 기본값 | 연출 효과의 강도 배율 |
| **`repeat`** | `number` | `1` | 효과의 반복 횟수. `-1`이면 무한 반복합니다. |

## 핵심 예제 (Main Example)

### 당황 & 놀람 연출

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 깜짝 놀라서 한 번 위로 튀어오릅니다
  { type: 'character-effect', name: 'heroine', preset: 'bounce', duration: 400 },

  // 2. 당황하여 짧고 강하게 좌우로 흔들립니다
  { type: 'character-effect', name: 'heroine', preset: 'shake-x', duration: 300, intensity: 2 }
])
```

### 무한 반복 (Pulse)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 심장 박동처럼 커졌다 작아지기를 무한히 반복합니다
  { type: 'character-effect', name: 'heroine', preset: 'pulse', duration: 800, repeat: -1 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **화면 전체를 흔들고 싶을 때** | 특정 캐릭터만 흔들리는 것이 아니라 배경까지 다 흔들리게 하려면 `camera-effect`를 사용해야 합니다. |
| **효과 무한 반복 멈추기** | `repeat: -1`로 무한 반복 효과를 줬다면, 나중에 해당 캐릭터에 `preset: 'reset'` 효과를 줘야 원래 크기와 위치로 돌아옵니다. |
| **에러 무시** | 대상 캐릭터가 아직 화면에 등장하지 않았거나 지워졌다면 해당 효과 명령어는 아무 일 없이 조용히 무시됩니다. |
