# ⚙️ Configuration (novel.config.ts)

---

## 1. 개요 (Overview)

`novel.config.ts`는 `fumika` 엔진의 모든 동작과 데이터를 정의하는 최상위 설정 파일입니다. 게임의 해상도, 전역 변수 초기값, 캐릭터 및 배경 정의, 에셋 경로, 그리고 각종 모듈의 물리적/시각적 기본값을 이곳에서 관리합니다.

**관련 문서:**
* [엔진 아키텍처 개요](./concepts/overview.md)
* [동적 설정값 (Resolvable) 활용](./concepts/resolvable.md)

---

## 2. 기본 해상도 (Resolution)

게임이 렌더링될 논리적인 크기를 결정합니다. 실제 브라우저 창 크기에 상관없이 엔진 내부의 좌표계는 이 해상도를 기준으로 계산됩니다.

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `width` | `number` | `element.clientWidth` | 게임 화면의 논리적 가로 너비 (px) |
| `height` | `number` | `element.clientHeight` | 게임 화면의 논리적 세로 높이 (px) |

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
* [Variable 모듈 (변수 조작)](./modules/var.md)
* [Condition 모듈 (변수 활용 분기)](./modules/condition.md)
* [변수 시스템 상세 가이드](./concepts/variables.md)

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
* [defineScene 정의 상세](./defines/defineScene.md)
* [공통 초기값 정의 (defineInitial)](./defines/defineInitial.md)

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
* [캐릭터 포커스 (character-focus)](./modules/character-focus.md)
* [캐릭터 특수효과 (character-effect)](./modules/character-effect.md)
* [defineCharacter 정의 상세](./defines/defineCharacter.md)

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

`effect` 모듈에서 사용하는 파티클(비, 눈, 벚꽃 등) 프리셋의 물리 및 시각 속성을 전역적으로 재정의합니다. 엔진에 내장된 기본 프리셋이 존재하지만, 프로젝트의 분위기에 맞춰 입자의 크기, 속도, 수명 등을 세밀하게 조정할 수 있습니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `effects` | `Record<EffectType, EffectDef>` | 이펙트 종류별 상세 설정 맵 |

### 7.1. 지원되는 이펙트 종류 (EffectType)
`dust` (먼지), `rain` (비), `snow` (눈), `sakura` (벚꽃), `sparkle` (반짝임), `fog` (안개), `leaves` (낙엽), `fireflies` (반딧불이)

### 7.2. 상세 속성 정의 (EffectDef)

`EffectDef`는 파티클의 생성 및 물리 법칙을 담당하는 **`clip`**과 개별 입자의 시각적 외형을 담당하는 **`particle`**로 나뉩니다.

#### **A. 클립 설정 (`clip`)**
파티클 시스템의 방출 규칙과 물리적 생명 주기를 정의합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `impulse` | `number` | 방출 시 가해지는 초기 속도(물리 충격량)입니다. |
| `lifespan` | `number` | 입자가 화면에 머무는 시간(프레임 단위)입니다. |
| `interval` | `number` | 입자가 방출되는 주기입니다. 값이 낮을수록 입자가 더 자주, 촘촘하게 생성됩니다. |
| `size` | `[number, number][]` | 입자 크기의 단계별 변화 범위입니다. `[[Min, Max], [Min, Max], ...]` 형태로, 각 단계마다 해당 범위 내에서 랜덤하게 결정된 값을 사용해 보간됩니다. |
| `opacity` | `[number, number][]` | 입자 투명도의 단계별 변화 범위입니다. `[[Min, Max], [Min, Max], ...]` 형태로, 생존 기간 동안 투명도가 해당 범위 내에서 랜덤하게 결정되며 변화합니다. |
| `angularImpulse` | `number` | 생성 시 입자에 가해지는 회전력(각속도)입니다. |
| `loop` | `boolean` | 파티클 애니메이션의 반복 여부입니다. |

#### **B. 파티클 설정 (`particle`)**
화면에 렌더링되는 개별 입자 객체의 속성을 정의합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `attribute` | `Object` | 입자의 물리적 성질 및 이미지 소스 설정 (아래 상세 참조) |
| `style` | `Object` | 입자의 크기, 불투명도, 합성 모드 등 시각적 스타일 (아래 상세 참조) |

---

### 7.3. 입자 속성 및 스타일 상세

#### **particle.attribute**
| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `src` | `string` | 입자에 사용할 에셋 키 또는 이미지 경로입니다. |
| `gravityScale` | `number` | 해당 입자에 적용될 중력의 배율입니다. |
| `frictionAir` | `number` | 공기 저항 계수입니다. 값이 클수록 입자가 금방 멈춥니다. |
| `strictPhysics` | `boolean` | 물리 엔진의 엄격한 적용 여부입니다. |

#### **particle.style**
| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `width` / `height` | `number` | 입자의 논리적 크기(px)입니다. |
| `opacity` | `number` | 입자의 기본 불투명도입니다. |
| `blendMode` | `string` | `'lighter'`, `'screen'`, `'multiply'` 등 레이어 합성 방식입니다. |

---

### 7.4. 설정 예시

다음은 벚꽃(`sakura`) 효과를 예로 들어, 입자가 **서서히 나타났다가(Fade-in) 사라지며(Fade-out)**, 크기가 **작은 상태에서 랜덤하게 커졌다가 줄어드는** 복합적인 설정을 보여줍니다.

```ts
effects: {
  sakura: {
    clip: {
      impulse: 0.02,
      lifespan: 6000,
      interval: 300,
      // [Min, Max][] - 3단계 크기 변화
      size: [
        [0.1, 0.2], // 1단계: 생성 시 (매우 작음)
        [1.0, 1.5], // 2단계: 생존 중간 (본래 크기보다 커질 수 있음)
        [0.5, 0.8]  // 3단계: 소멸 시 (중간 크기로 감소)
      ],
      // [Min, Max][] - 3단계 투명도 변화 (페이드 인/아웃)
      opacity: [
        [0, 0],     // 1단계: 생성 시 (완전 투명)
        [0.8, 1.0], // 2단계: 생존 중간 (선명함)
        [0, 0]      // 3단계: 소멸 시 (완전 투명)
      ],
      angularImpulse: 0.02,
      loop: true
    },
    particle: {
      style: {
        width: 20,
        height: 20,
        blendMode: 'normal'
      }
    }
  }
}
```

**💡 동작 원리 상세:**
*   **단계별 보간**: 위 예시처럼 `opacity`가 3개인 경우, 생존 시간(`lifespan`)의 0% 지점에서 1단계를, 50% 지점에서 2단계를, 100% 지점에서 3단계를 기준으로 삼아 그 사이 값을 부드럽게 계산(Interpolation)합니다.
*   **랜담 범위 적용**: 각 단계의 값은 고정값이 아닌 `[Min, Max]` 범위 내에서 입자마다 독립적으로 결정됩니다. 예를 들어 위 예제의 2단계 `size`는 입자마다 `1.0`에서 `1.5` 사이의 서로 다른 최대 크기를 갖게 됩니다.

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
* [Audio 모듈 가이드 (BGM/SFX)](./modules/audio.md)
* [에셋 로딩 및 관리 시스템](./concepts/overview.md#에셋-시스템)

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
* [모듈 시스템 아키텍처](./modules.md)
* [UI 모듈 가이드 (Visibility 제어)](./modules/ui.md)
* [커스텀 훅 시스템 (Hooks)](./concepts/hooks.md)
* [defineHook 정의 상세](./defines/defineHook.md)

---

## 10. 폴백 규칙 (Fallback)

`fallback` 옵션은 시나리오를 작성할 때 반복되는 속성들을 생략하고 **기본값을 전역적으로 관리**할 수 있게 해주는 시스템입니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `fallback` | `FallbackRule[]` | 적용할 폴백 규칙들의 배열 (맨 위에 정의된 규칙이 가장 높은 우선순위를 가짐) |

---

### 10.1. 설정 예시

**상단에는 특정 조건에서 발동할 세부 규칙**을, 하단에는 광범위한 공통 규칙을 정의합니다 (위에 있을수록 아래를 덮어씁니다).

```ts
fallback: [
  // 1. 특정 캐릭터('heroine')에게만 별도 적용 - 높은 우선순위 (하단 규칙을 덮어씀)
  { 
    type: 'character', 
    name: 'heroine', 
    defaults: { duration: 200, position: 'center' } 
  },

  // 2. 모든 캐릭터에 공통 적용 (기본 등장 속도 및 이미지) - 낮은 우선순위
  { 
    type: 'character', 
    defaults: { duration: 500, image: 'normal' } 
  },

  // 3. 대사 모듈의 기본 텍스트 출력 속도
  { 
    type: 'dialogue', 
    defaults: { speed: 30, wait: true } 
  }
]
```

### 10.2. 실제 동작 예시

위 설정이 적용된 상태에서 시나리오를 작성할 경우의 변화입니다.

```ts
// [시나리오 정의]
{ type: 'character', name: 'heroine' }

// [엔진 내부에서 폴백 적용 후 실제 실행되는 값]
{ 
  type: 'character', 
  name: 'heroine', 
  duration: 200,     // 1번 규칙이 2번의 500ms를 덮어씀 (더 위에 정의됨)
  position: 'center', // 1번 규칙에서 주입
  image: 'normal'    // 2번 규칙에서 상속 (1번에 해당 필드가 없으므로 유지)
}
```

---

### 10.3. 폴백 규칙 상세 구조 (FallbackRule)

각 규칙은 **매칭 조건**과 적용할 **기본값(`defaults`)**으로 구성됩니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `type` | `string` | **(필수)** 적용 대상 커맨드 타입 (예: `'character'`, `'dialogue'`) |
| `[prop: string]` | `any` | 특정 속성 값이 일치할 때만 규칙을 적용하도록 하는 필터 조건입니다. |
| `defaults` | `Object` | 매칭 성공 시 커맨드에 주입될 기본값 객체입니다. |

#### **A. 매칭 조건 및 우선순위 로직**
*   **복합 매칭**: `type` 외의 속성을 추가하면 해당 값까지 일치해야 폴백이 적용됩니다. (예: `name`, `action` 등)
*   **우선순위**: `직접 입력한 값` > `맨 위 폴백` > `맨 아래 폴백` 순서로 값이 적용됩니다. 즉, 배열의 인덱스가 작을수록 우선순위가 높습니다. (Firewall 규칙과 유사한 방식)

**💡 활용 팁:**
*   자주 사용하는 캐릭터의 기본 연출이나 대사 출력 속도 등을 폴백으로 관리하면 시나리오 가독성이 획기적으로 좋아집니다.

**관련 문서:**
* [Dialogue 모듈 가이드 (Fallback 활용 사례)](./modules/dialogue.md)
* [명령어 시스템 개요](./commands.md)
