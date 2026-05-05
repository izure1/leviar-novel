# 🎯 캐릭터 포커스 (Character Focus)

## 개요 (Overview)

`character-focus` 모듈은 카메라가 특정 캐릭터의 지정된 신체 부위(얼굴, 손 등)를 따라가며 자동으로 클로즈업하는 기능입니다.  
캐릭터가 화면 왼쪽 끝에 있든 오른쪽 끝에 있든, 엔진이 좌표를 자동 계산하여 조준합니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'character-focus'` | 필수 | 커맨드 타입 |
| **`name`** | `string` | 필수 | 포커스를 맞출 캐릭터의 식별자 이름 |
| **`point`** | `string` | `'center'` | 포커스를 맞출 캐릭터 내부의 앵커 위치. (`novel.config.ts`의 캐릭터 `points` 객체 키) |
| **`zoom`** | `string` | `'close-up'` | 적용할 [카메라 줌 프리셋](./camera-zoom.md) 이름 |
| **`duration`** | `number` | 프리셋 기본값 | 카메라가 목적지까지 이동하는 데 걸리는 시간(ms) |

## 핵심 예제 (Main Example)

### 얼굴 클로즈업

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // heroine 캐릭터의 face 좌표로 카메라를 부드럽게 이동시키며 클로즈업합니다
  { type: 'character-focus', name: 'heroine', point: 'face', zoom: 'close-up', duration: 800 }
])
```

### 포커스 해제

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 포커싱을 풀고 원래 전체 화면 시점으로 복귀합니다
  { type: 'character-focus', name: 'heroine', zoom: 'reset', duration: 500 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **포인트 정보 누락** | `point` 속성에 넣은 키(예: `face`)가 `novel.config.ts`의 캐릭터 `points` 목록에 없다면, 기본적으로 이미지의 한가운데를 비춥니다. |
| **캐릭터 등장 시 바로 포커스** | 캐릭터를 화면에 등장시키는 `character` 명령어 내부에도 `focus` 옵션이 존재합니다. 등장과 동시에 포커스를 잡고 싶다면 그쪽을 사용하는 것이 코드가 더 간결합니다. |
