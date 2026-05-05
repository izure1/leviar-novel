# 👥 캐릭터 (Character)

## 개요 (Overview)

`character` 모듈은 게임 화면에 캐릭터를 등장시키고, 위치를 옮기거나, 표정을 바꾸고, 퇴장시키는 핵심 기능입니다.  

## 옵션 상세 (Properties)

명령어 객체에 사용할 수 있는 모든 속성들의 목록입니다.  

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`type`** | `'character'` | 필수 | 커맨드 타입 |
| **`action`** | `'show' \| 'remove'` | 필수 | `show`: 등장(혹은 상태 갱신), `remove`: 퇴장 |
| **`name`** | `string` | 필수 | 설정(`novel.config.ts` 등)에 등록한 캐릭터의 식별자 키 |
| **`position`** | `string` | `'center'` | 캐릭터가 서 있을 위치 (`left`, `center`, `right`, `"1/3"` 등) |
| **`image`** | `string` | (첫 이미지) | 표시할 이미지 키 (`base:emotion` 형식) |
| **`focus`** | `boolean \| object` | `false` | 등장 시 카메라 포커스 연출 동시 적용 여부 |
| **`duration`** | `number` | `0` | 등장, 퇴장, 상태 변경 시 페이드/애니메이션에 걸리는 시간(ms) |

## 핵심 예제 (Main Example)

### 1. 캐릭터 기본 등장 및 퇴장

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 화면 중앙에 'normal' 베이스의 'normal' 표정으로 800ms 동안 부드럽게 나타납니다
  { type: 'character', action: 'show', name: 'heroine', position: 'center', image: 'normal:normal', duration: 800 },

  { type: 'dialogue', text: '안녕하세요!' },

  // 500ms 동안 페이드아웃 되며 화면에서 사라집니다
  { type: 'character', action: 'remove', name: 'heroine', duration: 500 }
])
```

### 2. 이미 등장한 캐릭터의 상태(위치/표정) 갱신

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'character', action: 'show', name: 'heroine', position: 'left', image: 'normal:normal' },

  // 이미 화면에 있는 캐릭터라도 action: 'show'를 사용하여 표정을 smile로 덮어씌웁니다
  { type: 'character', action: 'show', name: 'heroine', image: 'normal:smile', duration: 500 },

  // 위치만 중앙으로 다시 부드럽게 이동시킵니다
  { type: 'character', action: 'show', name: 'heroine', position: 'center', duration: 1000 }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **상태 갱신 방법** | 옷이나 표정을 바꾸고 싶을 때 `remove`로 삭제했다가 다시 부르지 마십시오. 곧바로 `action: 'show'` 명령어를 던져 바꿀 속성만 전달하면 엔진이 자연스럽게 보간합니다. |
| **초기 이미지 생략** | 처음 등장할 때 `image` 속성을 생략하면, `defineCharacter`에서 설정한 첫 번째 기본 이미지가 자동으로 불려옵니다. |
