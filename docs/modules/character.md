# 👥 Character Module

본 문서는 `character` 모듈을 사용하여 게임 내 캐릭터의 등장, 퇴장 및 다양한 상태 변화를 제어하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`character` 모듈은 비주얼 노벨의 핵심인 캐릭터 연출을 담당합니다.  
캐릭터의 배치, 표정 전환, 부드러운 이동 등 기본적인 등장 형태부터 복합적인 애니메이션까지 정교하게 제어할 수 있는 기능을 제공합니다.  

### 주요 특징
*   **다목적 `show` 액션**: 캐릭터의 첫 등장뿐만 아니라 이미 등장한 캐릭터의 표정 교체, 위치 이동, 포커스 업데이트 시에도 일관되게 사용됩니다.  
*   **유연한 위치 시스템**: `left`, `center` 등 직관적인 프리셋과 `"1/2"`, `"2/3"` 같은 분수 표현식을 모두 지원하여 정교한 배치가 가능합니다.  
*   **타입 안전성 확보**: `defineCharacter`를 통해 별도 파일로 관리할 때, IDE의 자동 완성 기능과 타입 체크를 완벽하게 활용하실 수 있습니다.  

---

## 2. 캐릭터 설정 (Configuration)

### 2.1. 기본 등록 방식

`novel.config.ts`의 `characters` 속성에 캐릭터 정보를 직접 정의할 수 있습니다.  

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

프로젝트 규모가 커질 경우 캐릭터별로 파일을 분리하여 관리하는 방식을 권장합니다.  

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

더 자세한 속성 정의는 [캐릭터 정의 가이드 (defineCharacter)](../defines/defineCharacter.md) 문서를 참조해 주십시오.  

---

## 3. 커맨드 상세 (Command Reference)

### 3.1. Character 명령 (`CharacterCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `action` | `'show' \| 'remove'` | ✅ | **show**: 등장 및 상태 갱신<br>**remove**: 퇴장 및 자원 해제 |
| `name` | `string` | ✅ | 캐릭터 식별자입니다. |
| `position` | `string` | - | 배치 위치입니다. (`left`, `center`, `"1/3"` 등) |
| `image` | `string` | - | 표시할 이미지 키입니다. (`base:emotion` 형식) |
| `focus` | `boolean \| object` | - | 특정 부위 포커싱 여부입니다. |
| `duration` | `number` | - | 애니메이션 지속 시간(ms)입니다. |

### 3.2. 활용 예시

```ts
// 1. 첫 등장: 중앙에 'normal' 베이스의 'normal' 표정으로 800ms간 페이드인
{ type: 'character', action: 'show', name: 'heroine', position: 'center', image: 'normal:normal', duration: 800 }

// 2. 표정 교체: 'normal' 베이스의 'smile' 표정으로 500ms간 변경
{ type: 'character', action: 'show', name: 'heroine', image: 'normal:smile', duration: 500 }

// 3. 퇴장: 500ms간 페이드아웃 후 화면에서 제거
{ type: 'character', action: 'remove', name: 'heroine', duration: 500 }
```

---

## 4. 주의 사항 (Edge Cases)

*   **상태 갱신 원리**: 이미 화면에 존재하는 캐릭터의 위치나 이미지를 변경할 때도 `action: 'show'`를 사용하십시오.  이때 변경된 수치는 엔진 내부 상태에 즉시 반영됩니다.  
*   **분수 위치 계산**: `"1/2"`, `"2/3"` 등 분수 형태의 문자열을 `position`에 활용하여 화면을 논리적 구역으로 나누어 배치할 수 있습니다.  
*   **기본 이미지 선택**: `show` 액션 실행 시 `image` 속성을 생략하면, 캐릭터 설정에 정의된 첫 번째 이미지가 자동으로 선택됩니다.  

---

## 5. 관련 연출 커맨드 (Related Commands)

*   **[캐릭터 포커스 (character-focus)](./character-focus.md)**: 특정 부위를 클로즈업하거나 카메라 시점을 이동시킵니다.  
*   **[캐릭터 효과 (character-effect)](./character-effect.md)**: 흔들림이나 튀어오름 등 캐릭터 개별 객체에 물리 효과를 적용합니다.  
