# ⚙️ Configuration (novel.config.ts)

---

## 1. 개요 (Overview)

`novel.config.ts`는 `fumika` 엔진의 모든 동작과 데이터를 정의하는 최상위 설정 파일입니다. 게임의 해상도, 전역 변수 초기값, 캐릭터 및 배경 정의, 에셋 경로, 그리고 각종 모듈의 물리적/시각적 기본값을 이곳에서 관리합니다.

---

## 2. 기본 해상도 (Resolution)

게임이 렌더링될 논리적인 크기를 결정합니다. 실제 브라우저 창 크기에 상관없이 엔진 내부의 좌표계는 이 해상도를 기준으로 계산됩니다.

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `width` | `number` | `canvas.width` | 게임 화면의 논리적 가로 너비 (px) |
| `height` | `number` | `canvas.height` | 게임 화면의 논리적 세로 높이 (px) |

```ts
// 16:9 해상도 설정 예시
width: 1280,
height: 720,
```

---

## 3. 변수 시스템 (Variables)

게임 전체에서 공유되는 전역 변수의 초기값을 정의합니다. 이 변수들은 `condition` 모듈에서 분기 조건으로 사용되거나 `dialogue`에서 텍스트 보간(`{{var}}`)으로 출력될 수 있습니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `variables` | `Record<string, any>` | 변수명(Key)과 초기값(Value)의 쌍 |

```ts
variables: {
  username: '여행자',
  hp: 100,
  has_key: false,
  inventory: []
}
```

**관련 문서:**
* [Condition 모듈 (변수 활용 분기)](./modules/condition.md)

---

## 4. 시나리오 구성 (Scenes)

게임에 사용될 모든 씬(Scene) 파일의 식별자 목록입니다. 여기에 등록된 이름만 `loadScene`이나 `next`를 통해 접근할 수 있습니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `scenes` | `string[]` | 씬 이름들의 배열 |

```ts
scenes: ['prologue', 'chapter1', 'ending_good', 'ending_bad']
```

**관련 문서:**
* [Scene 개념 가이드](./concepts/scenes.md)

---

## 5. 캐릭터 정의 (Characters)

게임에 등장하는 인물들의 이름과 이미지 세트를 정의합니다. `speaker`로 지정될 때 표시될 이름과 `character` 커맨드에서 사용할 표정 이미지들을 매핑합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `name` | `string` | 대사창 등에 표시될 캐릭터의 실제 이름 |
| `images` | `Record<string, CharImageDef>` | 표정 키와 이미지 정보의 매핑 |

#### CharImageDef 상세
*   **`src`**: `config.assets`에 정의된 에셋 키
*   **`width` / `height`**: 기본 렌더링 크기
*   **`points`**: 캐릭터의 특정 부위(머리, 가슴 등)에 대한 좌표 정보 (`character-focus`에서 사용)

```ts
characters: {
  heroine: {
    name: '아리스',
    images: {
      normal: { 
        src: 'aris_normal', 
        width: 400,
        // 카메라 포커싱을 위한 주요 포인트 지정 (상대 좌표 0.0 ~ 1.0)
        points: {
          face: { x: 0.5, y: 0.2 },  // 얼굴 위치
          hand: { x: 0.3, y: 0.6 }   // 손 위치 (아이템 강조 등)
        }
      },
      smile: { src: 'aris_smile', width: 400 }
    }
  }
}
```

**💡 Points 활용 팁:**
등록된 포인트는 시나리오에서 `{ type: 'character-focus', name: 'heroine', point: 'face' }`와 같이 호출하여 카메라가 해당 부위를 클로즈업하게 하는 데 사용됩니다.

**관련 문서:**
* [Character 모듈 가이드](./modules/character.md)
* [defineCharacter 정의 가이드](./defines/defineCharacter.md)

---

## 6. 배경 정의 (Backgrounds)

게임 배경으로 사용할 이미지들을 정의합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `src` | `string` | `config.assets`에 정의된 에셋 키 |
| `parallax` | `boolean` | 카메라 이동 시 원근감 효과(Parallax) 적용 여부 (기본값: `true`) |

```ts
backgrounds: {
  school: { src: 'bg_school', parallax: true },
  room: { src: 'bg_room', parallax: false } // 고정 배경
}
```

**관련 문서:**
* [Background 모듈 가이드](./modules/background.md)

---

## 7. 파티클 효과 설정 (Effects)

`effect` 모듈에서 사용하는 파티클 프리셋의 물리/시각 속성을 재정의합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `clip` | `Object` | 파티클 생성 빈도, 수명, 초기 속도 등 물리 법칙 설정 |
| `particle` | `Object` | 개별 파티클의 중력Scale, 불투명도, 블렌드 모드 등 스타일 설정 |

```ts
effects: {
  snow: {
    clip: { interval: 50 }, // 더 눈이 많이 오도록 수정
    particle: { attribute: { gravityScale: 0.1 } } // 더 빨리 떨어지도록 수정
  }
}
```

**관련 문서:**
* [Effect 모듈 가이드](./modules/effect.md)

---

## 8. 에셋 관리 (Assets & Audios)

이미지 및 오디오 리소스의 실제 경로를 관리합니다. 엔진 부팅 시 이 목록을 바탕으로 리소스를 사전 로드(Preload)합니다.

```ts
assets: {
  bg_school: './assets/bg/school.png',
  aris_normal: './assets/char/aris_01.png'
},
audios: {
  main_theme: './assets/bgm/main.mp3',
  click_sound: './assets/sfx/click.wav'
}
```

**관련 문서:**
* [Audio 모듈 가이드](./modules/audio.md)

---

## 9. 모듈 시스템 (Modules)

엔진에 기본으로 포함되지 않은 커스텀 기능을 확장하거나, 기존 기능을 교체할 때 사용합니다. 등록된 모듈의 이름은 시나리오에서 `type` 값으로 사용됩니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `modules` | `Record<string, NovelModule>` | 모듈 식별자(Type)와 모듈 인스턴스의 매핑 |

```ts
import { myCustomModule } from './modules/myCustom'

modules: {
  // 이제 시나리오에서 { type: 'achieve', id: 'first_meet' } 처럼 사용 가능
  'achieve': myCustomModule 
}
```

**관련 문서:**
* [모듈 시스템 개요](./modules.md)

---

## 10. 폴백 규칙 (Fallback)

커맨드 작성 시 특정 속성을 반복해서 입력하지 않도록 기본값을 설정합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `type` | `string` | 적용할 커맨드 타입 (예: `'character'`) |
| `defaults` | `Object` | 해당 커맨드에 적용할 기본값들 |

```ts
fallback: [
  // 모든 캐릭터 등장/퇴장 시 기본적으로 500ms 동안 애니메이션 적용
  { type: 'character', defaults: { duration: 500 } },
  // 모든 대사의 출력 속도를 30ms로 고정
  { type: 'dialogue', defaults: { speed: 30 } }
]
```

**관련 문서:**
* [Dialogue 모듈 가이드](./modules/dialogue.md)
