# 👥 Character Module

---

## 1. 개요 (Overview)

`character` 모듈은 게임 내 캐릭터의 등장, 퇴장 및 상태 변화를 제어합니다. 위치 배치, 표정 전환, 부드러운 이동 등 캐릭터 연출의 가장 기본이 되는 기능을 제공합니다.

### 주요 특징
* **다목적 `show` 액션**: 캐릭터의 첫 등장뿐만 아니라 이미 등장한 캐릭터의 표정 교체, 위치 이동, 포커스 업데이트 시에도 동일하게 사용됩니다.
* **유연한 위치 시스템**: `left`, `center` 등 직관적인 프리셋과 `"1/2"`, `"2/3"` 같은 분수 표현식을 모두 지원합니다.
* **강력한 타입 추론**: `defineCharacter`를 통해 별도 파일로 관리할 때 코드 자동완성과 타입 체크를 완벽하게 지원합니다.

---

## 2. 캐릭터 설정 (Configuration)

### 2.1. 기본 등록 방식

`config.characters`에 직접 정보를 입력합니다.

```ts
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  assets: {
    'char_heroine_normal': 'assets/char/heroine_normal.png',
    'char_heroine_smile': 'assets/char/heroine_smile.png'
  },
  characters: {
    'heroine': {
      name: '히로인',
      bases: {
        'normal': { src: 'char_heroine_base', width: 560, points: { 'face': { x: 0.5, y: 0.2 } } }
      },
      emotions: {
        'normal': { 'face': 'char_heroine_face_normal' },
        'smile': { 'face': 'char_heroine_face_smile' }
      }
    }
  }
})
```

### 2.2. 캐릭터 개별 관리 (`defineCharacter`)

프로젝트 규모가 커지면 캐릭터별로 파일을 분리하여 관리하는 것이 좋습니다. `defineCharacter`를 사용하면 다음과 같이 깔끔하게 캐릭터를 정의할 수 있습니다.

```ts
import { defineCharacter } from 'fumika'

export const fumika = defineCharacter({
  name: '후미카',
  bases: {
    normal: { src: 'char_fumika_base', width: 560, points: { face: { x: 0.5, y: 0.2 } } }
  },
  emotions: {
    normal: { face: 'char_fumika_face_normal' }
  }
})
```

더 자세한 사용법과 속성 정의는 아래 문서를 참조하십시오.

* [캐릭터 정의 가이드 (defineCharacter)](../defines/defineCharacter.md)

---

## 4. 커맨드 상세 (Command Reference)

### 4.1. Character 명령 (`CharacterCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `action` | `'show' \| 'remove'` | ✅ | **show**: 등장/갱신 동작<br>**remove**: 퇴장 동작 |
| `name` | `CharacterKeysOf<Config>` | ✅ | 캐릭터 식별자입니다. |
| `position` | `CharacterPositionPreset` | - | 배치 위치입니다. (`left`, `center`, `"1/3"` 등) |
| `image` | `ImageKeysOf<Config, Name>` | - | 표시할 이미지(표정) 키입니다. (`base:emotion` 형식) |
| `focus` | `boolean \| PointsOf<Config, Name>` | - | 특정 부위 포커싱 여부입니다. |
| `duration` | `number` | - | 애니메이션 지속 시간(ms)입니다. |

### 4.2. 활용 예시

```ts
// 1. 첫 등장: 중앙에 'normal' 베이스의 'normal' 표정으로 800ms간 페이드인
{ type: 'character', action: 'show', name: 'heroine', position: 'center', image: 'normal:normal', duration: 800 }

// 2. 표정 교체: 'normal' 베이스의 'smile' 표정으로 500ms간 변경
{ type: 'character', action: 'show', name: 'heroine', image: 'normal:smile', duration: 500 }

// 3. 퇴장: 500ms간 페이드아웃 후 제거
{ type: 'character', action: 'remove', name: 'heroine', duration: 500 }
```

---

## 4. 주의 사항 (Edge Cases)

* **상태 갱신**: 이미 등장한 캐릭터의 위치나 이미지를 바꿀 때도 `action: 'show'`를 사용하며, 이때 변경된 정보는 엔진 내부 상태에 자동으로 반영됩니다.
* **분수 위치 표현 (`n/d`)**: `"1/2"`, `"2/3"` 등 분수 형태의 문자열을 `position`에 사용할 수 있습니다. (`n / (d + 1)` 비율로 계산됨)
* **이미지 미지정**: `show` 시 `image`를 생략하면 이미지 목록 중 첫 번째가 자동으로 선택됩니다.

---

## 6. 관련 커맨드 (Related Commands)

캐릭터의 연출을 더욱 풍부하게 해주는 확장 커맨드들입니다.

### 6.1. 캐릭터 포커스 (`character-focus`)

특정 부위를 클로즈업하거나 카메라를 이동시킵니다.

```ts
{ type: 'character-focus', name: 'heroine', point: 'face', zoom: 'close-up' }
```
* [상세 문서 보기 (character-focus)](./character-focus.md)

### 6.2. 캐릭터 효과 (`character-effect`)

흔들림, 튀기 등 캐릭터 전용 연출 효과를 적용합니다.

```ts
{ type: 'character-effect', name: 'heroine', preset: 'shake', intensity: 1.5 }
```
* [상세 문서 보기 (character-effect)](./character-effect.md)
