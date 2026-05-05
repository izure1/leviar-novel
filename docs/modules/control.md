# 🎮 시스템 제어 (Control)

## 개요 (Overview)

`control` 모듈은 연출의 몰입감을 위해 플레이어의 입력을 잠시 차단하는 기능입니다.  
중요한 연출 중에 플레이어가 실수로 마우스를 눌러 다음 씬으로 넘어가거나 스킵(빠른 감기)하는 것을 막아줍니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'control'` | 필수 | 커맨드 타입 |
| **`action`** | `'disable'` | 필수 | 수행할 제어 동작 (`disable`: 입력 차단) |
| **`duration`** | `number` | 필수 | 입력을 차단하고 시나리오를 정지시킬 대기 시간(ms) |

## 핵심 예제 (Main Example)

### 입력을 잠시 막고 대기

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', text: '잠시 후 거대한 폭발이 일어납니다!' },
  
  // 2초(2000ms) 동안 마우스 클릭과 스킵을 모두 강제로 막고 연출을 보여줍니다
  { type: 'control', action: 'disable', duration: 2000 },
  
  { type: 'dialogue', text: '천만다행으로 큰 피해는 없었습니다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 및 해결 방법 |
| :--- | :--- |
| **시각 연출과 섞어 쓸 때의 배치 순서** | `control` 명령어는 시나리오 진행을 완전히 멈춥니다(Blocking). 만약 배경 전환이나 카메라 흔들림과 "동시에" 대기시키려면 시각적 명령어를 `control` 명령어보다 먼저 작성해야 합니다. |
| **스킵 모드 무시** | 플레이어가 우측 상단의 스킵(Skip) 기능을 켜 두었더라도, `control` 명령어를 만나면 설정한 시간 동안 강제로 멈춰 연출을 보호합니다. |
