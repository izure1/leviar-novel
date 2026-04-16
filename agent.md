# leviar-novel 구현 가이드라인

## 프로젝트 개요

비주얼노벨 제작을 위한 TypeScript 엔진 라이브러리.
사용자는 `defineScene()` 내부의 dialogues 배열만 편집하며, 모든 타입 힌트는 자동으로 제공되어야 한다.

---

## 디렉토리 구조

```
leviar-novel/
├── src/
│   ├── core/
│   │   ├── Novel.ts
│   │   ├── Scene.ts
│   │   └── Renderer.ts
│   ├── types/
│   │   ├── config.ts
│   │   ├── dialogue.ts
│   │   └── index.ts
│   ├── define/
│   │   ├── defineNovelConfig.ts
│   │   └── defineScene.ts
│   └── index.ts
```

---

## 씬 타입

씬은 두 종류만 존재한다.

- `DialogueScene` — 텍스트/대화/선택지가 순서대로 진행되는 씬
- `ExploreScene` — 화면 위 오브젝트를 클릭해서 선택하는 씬 (지도, 조사 등)

---

## 사용자 워크플로우

### 1. 최초 설정 (한 번만)

```ts
// novel.config.ts
export default defineNovelConfig({
  vars: {
    likeability: 0,
    metCharacterA: false,
  },
  scenes: ['scene-a', 'scene-b', 'scene-c'] as const,
  characters: {
    characterA: {
      normal: { src: './assets/characters/a_normal.png', width: 500 },
      happy:  { src: './assets/characters/a_happy.png',  width: 500, points: { face: { x: 0.5, y: 0.2 } } }
    },
    characterB: {
      normal: { src: './assets/characters/b_normal.png', width: 500 },
    }
  },
  backgrounds: {
    'bg-classroom': { src: './assets/bg/classroom.png', parallax: true },
    'bg-rooftop':   { src: './assets/bg/rooftop.png',   parallax: false },
  },
})
```

### 2. 씬 작성 (사용자가 실제로 건드리는 파일)

기본적으로 배열 내부에 있는 것들은, 넘기기(마우스 클릭이라던가, 키보드 누르기)를 해야 다음으로 넘어간다.
하지만 배열로 묶여있는 것들은, 넘기기를 하지 않아도 자동으로 넘어간다.

```ts
// scenes/scene-a.ts
import { defineScene } from 'leviar-novel'

export default defineScene('scene-a', [

  // 배경 설정
  { type: 'background', name: 'bg-classroom' },

  // 무드 설정
  { type: 'mood', mood: 'day' },

  // 캐릭터 등장과 동시에 대사 출력 (배열로 묶음)
  [
    { type: 'character', action: 'show', name: 'characterA', position: 'left', image: 'normal' },
    { type: 'dialogue', speaker: 'characterA', text: '안녕!' },
  ],

  // 선택지
  {
    type: 'choice',
    choices: [
      { text: '친절하게 대답한다', next: 'scene-b', var: { likeability: 20 } },
      { text: '무시한다',          next: 'scene-c', var: { likeability: -10 } },
    ],
  },

  // 루프
  { type: 'label', name: 'loop-start' },
  { type: 'dialogue', speaker: 'characterA', text: '다시 말해봐' },
  {
    type: 'condition',
    if: 'likeability >= 10',
    goto: 'end',
    else: 'loop-start',
  },
  { type: 'label', name: 'end' },

])
```

---

## Dialogue 타입 전체 명세

### 스토리 흐름

#### `dialogue`
대사 또는 나레이션 출력.
```ts
{
  type: 'dialogue',
  speaker?: string,   // config의 characters 키. 생략 시 나레이션으로 처리
  text: string,
}
```

#### `choice`
선택지를 표시하고 분기한다.
```ts
{
  type: 'choice',
  choices: {
    text: string,
    next?: string,                          // 이동할 씬 이름 (config scenes 키)
    goto?: string,                          // 같은 씬 내 label 이름
    var?: Partial<Record<keyof Vars, any>>, // 선택 시 변수 설정
  }[]
}
```

#### `condition`
변수 조건에 따라 분기한다.
```ts
{
  type: 'condition',
  if: string,     // 조건식 문자열. ex) 'likeability >= 10', 'metCharacterA'
  next?: string,  // 조건 충족 시 이동할 씬 이름
  goto?: string,  // 조건 충족 시 이동할 label 이름
  else?: string,  // 조건 미충족 시 이동 (next/goto와 동일한 형태)
}
```

#### `var`
변수 값을 설정한다.
```ts
{
  type: 'var',
  name: keyof Vars,  // config vars 키
  value: any,
}
```

#### `label`
루프 또는 goto 이동을 위한 마커.
```ts
{
  type: 'label',
  name: string,
}
```

---

### 렌더 제어

#### `background`
배경을 전환한다. 대응 메서드: `setBackground()`
```ts
{
  type: 'background',
  name: string,                                        // config backgrounds 키
  fit?: 'stretch' | 'contain' | 'cover',              // 기본값: 'stretch'
  duration?: number,                                   // 크로스페이드 시간(ms). 기본값: 1000
  isVideo?: boolean,                                   // 배경을 video로 처리. 기본값: false
}
```

#### `mood`
화면 분위기 오버레이를 설정한다. 대응 메서드: `setMood()`
```ts
{
  type: 'mood',
  mood: 'day' | 'night' | 'dawn' | 'sunset' | 'foggy' | 'sepia'
      | 'cold' | 'noir' | 'horror' | 'flashback' | 'dream' | 'danger' | 'none',
  intensity?: number,  // 불투명도 (0~1). 기본값: 1
  duration?: number,   // 전환 시간(ms). 기본값: 800
}
```

#### `effect`
파티클 이펙트를 추가하거나 제거한다. 대응 메서드: `addEffect()` / `removeEffect()`
```ts
{
  type: 'effect',
  action: 'add' | 'remove',
  effect: 'dust' | 'rain' | 'snow' | 'sakura' | 'sparkle' | 'fog' | 'leaves' | 'fireflies',
  rate?: number,      // 파티클 생성 속도. action: 'add' 일 때만 유효
  duration?: number,  // 제거 시 페이드아웃 시간(ms). action: 'remove' 일 때만 유효
}
```

#### `light`
조명 이펙트를 추가하거나 제거한다. 대응 메서드: `addLight()` / `removeLight()`
```ts
{
  type: 'light',
  action: 'add' | 'remove',
  preset: 'spot' | 'ambient' | 'warm' | 'cold',
  duration?: number,  // 제거 시 페이드아웃 시간(ms). action: 'remove' 일 때만 유효
}
```

#### `flicker`
조명에 깜빡임 효과를 적용한다. 대응 메서드: `setFlicker()`
```ts
{
  type: 'flicker',
  light: 'spot' | 'ambient' | 'warm' | 'cold',
  flicker: 'candle' | 'flicker' | 'strobe',
}
```

#### `overlay`
텍스트 오버레이를 추가, 제거, 전체 제거한다. 대응 메서드: `addOverlay()` / `removeOverlay()` / `clearOverlay()`
```ts
{
  type: 'overlay',
  action: 'add' | 'remove' | 'clear',
  text?: string,                              // action: 'add' 일 때 필수
  preset?: 'caption' | 'title' | 'whisper',  // 기본값: 'caption'
  duration?: number,                          // 제거 시 페이드아웃 시간(ms)
}
```

---

### 캐릭터 제어

#### `character`
캐릭터를 등장, 이동, 표정 변경, 퇴장시킨다. 대응 메서드: `showCharacter()` / `removeCharacter()`
```ts
{
  type: 'character',
  action: 'show' | 'remove',
  name: string,      // config characters 키
  // action: 'show' 일 때
  position?: 'far-left' | 'left' | 'center' | 'right' | 'far-right' | string, // 기본값: 'center'
  image?: string,    // characters[name]의 이미지 키. 생략 시 첫 번째 이미지
  // action: 'remove' 일 때
  duration?: number, // 페이드아웃 시간(ms). 기본값: 600
}
```

#### `character-focus`
카메라를 캐릭터에 포커스한다. 대응 메서드: `focusCharacter()`
```ts
{
  type: 'character-focus',
  name: string,                                        // config characters 키
  point?: string,                                      // characters[name][image].points 키
  zoom?: 'close-up' | 'medium' | 'wide' | 'reset',   // 기본값: 'close-up'
  duration?: number,                                   // 기본값: 800
}
```

#### `character-highlight`
캐릭터를 컷인(전면) 레이어로 올리거나 원래 위치로 복원한다. 대응 메서드: `highlightCharacter()` / `unhighlightCharacter()`
```ts
{
  type: 'character-highlight',
  name: string,           // config characters 키
  action: 'on' | 'off',
}
```

---

### 카메라 제어

#### `camera-zoom`
카메라를 줌한다. 대응 메서드: `zoomCamera()`
```ts
{
  type: 'camera-zoom',
  preset: 'close-up' | 'medium' | 'wide' | 'reset',
  duration?: number,
}
```

#### `camera-pan`
카메라를 패닝한다. 대응 메서드: `panCamera()`
```ts
{
  type: 'camera-pan',
  preset: 'left' | 'right' | 'up' | 'down' | 'center',
  duration?: number,
}
```

#### `camera-effect`
카메라 흔들림 등 연출 효과를 재생한다. 대응 메서드: `cameraEffect()`
```ts
{
  type: 'camera-effect',
  preset: 'shake' | 'bounce' | 'wave' | 'nod' | 'shake-x' | 'fall',
  duration?: number,
  intensity?: number,
}
```

---

### 화면 전환

#### `screen-fade`
화면을 페이드인/아웃한다. 대응 메서드: `screenFade()` / `fadeIn()` / `fadeOut()`
```ts
{
  type: 'screen-fade',
  dir: 'in' | 'out',
  preset?: 'black' | 'white' | 'red' | 'dream' | 'sepia',  // 기본값: 'black'
  duration?: number,                                          // 기본값: 600
}
```

#### `screen-flash`
화면을 순간 플래시한다. 대응 메서드: `screenFlash()`
```ts
{
  type: 'screen-flash',
  preset?: 'white' | 'red' | 'yellow',  // 기본값: 'white'
}
```

#### `screen-wipe`
화면을 와이프 전환한다. 대응 메서드: `screenWipe()`
```ts
{
  type: 'screen-wipe',
  dir: 'in' | 'out',
  preset?: 'left' | 'right' | 'up' | 'down',  // 기본값: 'left'
  duration?: number,                             // 기본값: 800
}
```

---

### UI 제어

#### `ui`
정의된 UI 요소를 페이드인/아웃한다. 대응 메서드: `fadeInUI()` / `fadeOutUI()`
```ts
{
  type: 'ui',
  name: string,            // config ui 키
  action: 'show' | 'hide',
  duration?: number,       // 기본값: 800
}
```

---

## 타입 추론 설계

핵심: **제네릭으로 config의 리터럴 타입을 씬까지 전달**한다.

```ts
// defineNovelConfig는 as const로 받아서 타입을 보존
function defineNovelConfig<
  TVars        extends Record<string, any>,
  TScenes      extends readonly string[],
  TCharacters  extends Record<string, CharDef>,
  TBackgrounds extends Record<string, BgDef>,
>(config: NovelConfig<TVars, TScenes, TCharacters, TBackgrounds>)

// defineScene은 config에서 타입을 가져와 dialogue 배열에 힌트 제공
function defineScene<TSceneName extends TScenes[number]>(
  name: TSceneName,
  dialogues: DialogueEntry<TScenes, TCharacters, TBackgrounds, TVars>[]
)
```

| 항목 | 추론 방식 |
|---|---|
| character 이름 | `keyof TCharacters` |
| character 이미지 키 | `keyof TCharacters[name]` |
| character point 키 | `keyof TCharacters[name][image]['points']` |
| background 이름 | `keyof TBackgrounds` |
| vars 키 | `keyof TVars` |
| scene 이름 | `TScenes[number]` |
| label 이름 | `string` (같은 배열 내 추론은 TS 한계) |

---

## 렌더 상태 관리

- **렌더 상태** (현재 배경, 캐릭터 위치/표정, 무드, 조명 등) — 씬 전환 시 엔진이 자동으로 이어받음. 새 씬에서 명시적으로 바꾸기 전까지 유지.
- **게임 변수** (`vars`) — `Novel` 인스턴스가 전역으로 보관. 씬 전환에도 유지됨.

---

## ExploreScene

```ts
// scenes/explore-map.ts
export default defineExploreScene('explore-map', {
  background: 'bg-rooftop',
  objects: [
    {
      name: 'door',
      position: { x: 200, y: 300 },
      src: './assets/objects/door.png',
      next: 'scene-b',   // 클릭 시 씬 이동
    },
    {
      name: 'window',
      position: { x: 500, y: 200 },
      src: './assets/objects/window.png',
      next: 'scene-c',
    },
  ]
})
```

---

## 구현 우선순위

1. `defineNovelConfig` — config 타입 추출
2. `DialogueScene` 타입 시스템 — 제네릭 추론 구조
3. `defineScene` — 헬퍼 함수
4. `Renderer` — dialogues 순회 및 실행 엔진 (Visualnovel.ts 메서드와 연결)
5. 변수 시스템 — `set`, `condition` 처리
6. 루프/라벨 시스템
7. `ExploreScene`
8. 씬 전환 시 렌더 상태 이어받기
