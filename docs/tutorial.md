# 📖 Fumika Engine Tutorial

`fumika` 엔진을 사용하여 첫 번째 비주얼 노벨을 만드는 과정을 처음부터 끝까지 안내합니다. 이 튜토리얼은 단계별로 진행되며, 각 장은 이전 장의 지식을 바탕으로 구성됩니다.

---

## 목차 (Table of Contents)
1. [01. 환경 구축 및 설치](#step-01)
2. [02. 프로젝트 설정](#step-02)
3. [03. 캐릭터 정의 및 시나리오](#step-03)
4. [04. 엔진 구동 및 확인](#step-04)
5. [05. 플레이어 상호작용](#step-05)
6. [06. 연출 효과 더하기](#step-06)
7. [07. 장면 전환과 마무리](#step-07)
8. [08. 고급 설계 가이드](#step-08)
9. [09. 중첩 씬과 커스텀 UI](#step-09)

---

## <a id="step-01"></a>01. 환경 구축 및 설치 (Installation) 🛠️

`fumika` 엔진을 사용하여 게임을 만들기 위한 첫 번째 단계입니다.

### 프로젝트 초기화
```bash
mkdir my-novel-game
cd my-novel-game
npm init -y
npm install fumika
```

### 왜 TypeScript와 VS Code인가요?
`fumika`는 강력한 **타입 시스템**을 제공합니다. 캐릭터 이름 오타 등을 실행 전(컴파일 타임)에 즉시 빨간 줄로 알려주어 개발 효율을 극대화합니다.

---

## <a id="step-02"></a>02. 프로젝트 설정 (Configuration) ⚙️

모든 프로젝트의 중심에는 `novel.config.ts` 설계도가 있습니다.

```ts
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1280,
  height: 720,
  variables: { score: 0 },
  scenes: ['scene-intro'],
  assets: {
    aris_normal: './assets/aris.png',
    bg_school: './assets/school.jpg'
  },
  backgrounds: {
    school: { src: 'bg_school' }
  }
})
```

---

## <a id="step-03"></a>03. 캐릭터 정의 및 시나리오 작성 (Scenario) 🎭

### 캐릭터 정의
신체(`bases`)와 표정(`emotions`) 파트를 분리하여 정의함으로써 다양한 조합을 효율적으로 관리할 수 있습니다.

```ts
characters: {
  heroine: {
    name: '아리스',
    bases: {
      normal: { 
        src: 'aris_base_normal', 
        width: 560,
        points: { face: { x: 0.5, y: 0.2 } }
      }
    },
    emotions: {
      normal: { face: 'aris_face_normal' },
      smile:  { face: 'aris_face_smile' }
    }
  }
}
```

### 시나리오 (`defineScene`) 작성
```ts
export default defineScene({ config })([
  { type: 'background', name: 'school' },
  { type: 'character', name: 'heroine', action: 'show', image: 'normal:normal' },
  { type: 'dialogue', speaker: 'heroine', text: '안녕! Fumika의 세계에 온 걸 환영해.' }
])
```

---

## <a id="step-04"></a>04. 엔진 구동 및 화면 확인 (Execution) 🚀

`Novel` 클래스가 모든 오케스트레이션을 담당합니다.

```ts
const novel = new Novel(config, {
  element: document.getElementById('game-container'),
  scenes: { 'scene-intro': sceneIntro }
})

await novel.load() // 에셋 로드
await novel.boot() // 모듈 부팅
novel.start('scene-intro') // 첫 씬 시작
```

---

## <a id="step-05"></a>05. 플레이어의 선택 (Interaction) 🤝

선택지를 추가하고 데이터를 조작해 봅니다.

```ts
{ 
  type: 'choice', 
  choices: [
    { 
      text: '도서관에 가서 공부한다', 
      var: ({ score }) => ({ score: score + 10 }),
      goto: 'label-study'
    },
    { text: '집에 간다', next: 'scene-home' }
  ]
},
{ type: 'label', name: 'label-study' },
{ type: 'dialogue', text: '지식이 상승했다. (현재: {{score}})' }
```

---

## <a id="step-06"></a>06. 멋진 연출 더하기 (Effects) 🎬

카메라 연출과 파티클 효과를 추가합니다.

```ts
// 아리스의 얼굴로 2초간 포커스 이동
{ type: 'character-focus', name: 'heroine', point: 'face', duration: 2000 },
// 벚꽃 효과 추가
{ type: 'effect', action: 'add', effect: 'sakura', src: 'sakura_petal' },
// 다시 전체 화면으로
{ type: 'camera-zoom', scale: 1, duration: 1000 }
```

---

## <a id="step-07"></a>07. 장소 이동과 마무리 (Transitions) 🌓

새로운 씬으로 이동할 때는 `config`에 씬을 등록하고, 이전 씬의 `next` 속성에 이름을 지정합니다.

```ts
// scenes/scene-intro.ts
export default defineScene({ 
  config, 
  next: 'scene-home' 
})([...])
```

---

## <a id="step-08"></a>08. 고급 설계 가이드 (Advanced) 🚀

대규모 프로젝트를 위한 관리 기법입니다.

1. **캐릭터 리소스 분리**: `defineCharacter`를 사용해 캐릭터별 파일을 독립시킵니다.
2. **모듈 상태 초기화**: `defineInitial`로 씬 시작 시 UI 레이아웃을 미리 설정합니다.
3. **공통 로직 자동화**: `defineHook`을 통해 모든 대사 넘김 시 효과음 재생 등을 구현합니다.

---

## <a id="step-09"></a>09. 중첩 씬 호출과 커스텀 UI (Nested Scenes) 🪆

환경설정이나 인벤토리처럼 '불러왔다가 다시 돌아가야 하는' 시스템을 구현할 때 사용합니다.

```ts
// 서브씬 호출. 원래 상태로 완벽히 되돌아옵니다.
{ type: 'scene', call: 'scene-sub', preserve: true, restore: true }
```

> [!WARNING]
> **메모리 누수 주의**: 서브씬에서 호출자 씬으로 직접 전환(`next`)하지 마세요. 반드시 자연스럽게 종료(Return)되어 콜 스택이 정리되도록 해야 합니다.

---

[⬅️ 홈으로 돌아가기](./README.md) | [명령어 레퍼런스 확인 ➡️](./commands.md)
