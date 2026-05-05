# 🎬 화면 전환 (Screen)

## 개요 (Overview)

`screen` 모듈은 화면 전체를 까맣게 덮거나 특정 방향으로 닦아내는(와이프) 극적인 전환 연출을 할 때 사용합니다.  

## 옵션 상세 (Properties)

### 1. 화면 페이드 (`screen-fade`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'screen-fade'` | 필수 | 커맨드 타입 |
| **`dir`** | `'in' \| 'out'` | 필수 | 방향 (`out`: 색상으로 화면을 덮음, `in`: 색상을 치우고 화면을 드러냄) |
| **`preset`** | `string` | `'black'` | 가려질 색상 (`black`, `white`, `red` 등) |
| **`duration`** | `number` | 프리셋 기본값 | 연출에 걸리는 시간(ms) |

### 2. 화면 플래시 (`screen-flash`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'screen-flash'` | 필수 | 커맨드 타입 |
| **`preset`** | `string` | `'white'` | 번쩍일 빛의 색상 (`white`, `red` 등) |
| **`duration`** | `number` | 프리셋 기본값 | 한 번 번쩍이는 데 걸리는 시간(ms) |
| **`repeat`** | `number` | `1` | 번쩍이는 횟수 |

### 3. 화면 와이프 (`screen-wipe`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'screen-wipe'` | 필수 | 커맨드 타입 |
| **`dir`** | `'in' \| 'out'` | 필수 | 방향 (`out`: 화면을 덮음, `in`: 화면을 드러냄) |
| **`preset`** | `string` | `'left'` | 닦아내는 방향 (`left`, `right`, `up`, `down`) |
| **`duration`** | `number` | 프리셋 기본값 | 연출에 걸리는 시간(ms) |

## 핵심 예제 (Main Example)

### 암전 후 와이프로 드러나기 (교차 연출)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 검은색으로 부드럽게 화면을 덮습니다
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1000 },
  
  { type: 'dialogue', text: '잠시 후...' },

  // 2. 검게 덮여있던 화면이 오른쪽에서 왼쪽 방향으로 스윽 닦이면서 다시 원래 화면이 드러납니다
  { type: 'screen-wipe', dir: 'in', preset: 'left', duration: 800 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **화면이 가려지지 않는 경우** | 화면 전환 효과는 대화창이나 선택지보다 뒤쪽 레이어에 깔립니다. 따라서 화면을 까맣게 덮어도 대화창 텍스트는 그대로 보입니다. 대화창도 같이 가리고 싶다면 `ui` 명령어로 대화창을 직접 숨겨야 합니다. |
| **색상 계승 유지** | 페이드 `out` 할 때 색상을 `black`으로 덮어뒀다면, 나중에 `in`을 할 때는 색상을 따로 지정하지 않아도 자동으로 기존의 `black`이 유지됩니다. |
