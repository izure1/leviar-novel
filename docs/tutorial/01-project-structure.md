# 1. 프로젝트 구조와 첫 화면

## 개요 (Overview)
아무것도 없는 빈 프로젝트에서 시작해, 게임이 동작하기 위한 최소한의 뼈대를 만들어 봅니다.

이 장에서는 엔진 설정, 대본(Scene), 그리고 브라우저에 화면을 그리기 위한 구동 파일,  
게임을 실행하기 위한 세 가지 핵심 파일을 순서대로 만들고 화면에 첫 텍스트를 띄워 봅니다.  

## 사전 준비 (Prerequisites)
* Node.js가 설치되어 있고, 빈 폴더에서 기본 프로젝트(Vite 등)가 생성되어 있어야 합니다.  
* `index.html`에 `<div id="app"></div>` 같은 루트 요소가 존재해야 합니다.  

---

## 1단계: 엔진 설정 파일 만들기 (`novel.config.ts`)

Fumika 엔진이 게임을 화면에 그리기 위해서는 해상도 등 가장 기초적인 설정이 필요합니다.  
프로젝트 최상단에 `novel.config.ts` 파일을 만들고 아래 코드를 작성합니다.  

```typescript
// novel.config.ts
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1280,
  height: 720
})
```

이 파일은 앞으로 게임에 쓰일 이미지, 캐릭터 등을 엔진에 미리 등록하는 "창고" 역할을 합니다.  

## 2단계: 첫 번째 장면(Scene) 만들기 (`scene-start.ts`)

설정이 끝났으니 대본을 쓸 차례입니다.  
프로젝트에 `scenes` 폴더를 만들고, 그 안에 `scene-start.ts` 파일을 생성하세요.  

```typescript
// scenes/scene-start.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', text: '여기는 어디지? 주변이 온통 깜깜해.' },
  { type: 'dialogue', text: '아무것도 보이지 않는다...' }
])
```

## 3단계: 엔진 구동하기 (`index.ts`)

대본까지 완성했지만, 아직 브라우저 입장에서는 이 대본을 "언제, 어떻게" 실행해야 할지 모릅니다.  
진입점(Entry) 역할을 하는 `index.ts` 파일을 만들어 엔진을 부팅시켜 줍니다.  

```typescript
// index.ts
import { Novel } from 'fumika'
import config from './novel.config'
// 방금 만든 씬 파일을 불러옵니다
import sceneStart from './scenes/scene-start'

// 1. 엔진 인스턴스를 생성하고, 화면을 그릴 HTML 요소와 씬들을 등록합니다
const novel = new Novel(config, {
  element: document.getElementById('app') as HTMLElement,
  scenes: {
    // 씬의 고유 이름과 씬 객체를 매핑합니다
    'scene-start': sceneStart
  }
})

// 2. 엔진을 초기화하고 실행하는 비동기 함수
async function bootstrap() {
  await novel.load()  // 에셋과 씬 데이터를 미리 불러옵니다
  await novel.boot()  // 엔진 시스템을 부팅합니다
  
  // 모든 준비가 끝나면 'scene-start'라는 이름의 씬을 시작합니다
  novel.start('scene-start')
}

bootstrap()
```

위 3단계를 모두 작성하고 저장한 뒤, 개발 서버를 실행해 브라우저를 확인해 보세요.  
빈 화면의 대화창에 "여기는 어디지? 주변이 온통 깜깜해." 라는 텍스트가 출력됩니다!  

---

## 프로젝트 구조 요약

지금까지 만든 필수 파일들의 구조는 다음과 같습니다.  

```text
📁 my-fumika-project/
├── 📄 index.html         # 브라우저가 읽을 웹 페이지
├── 📄 novel.config.ts    # 1. 게임의 전체 설정
├── 📁 scenes/            
│   └── 📄 scene-start.ts # 2. 첫 번째 씬 파일
└── 📄 index.ts           # 3. 엔진 구동 파일
```

---

## 주의 사항 (Edge Cases)

* **DOM 요소 오류 (`getElementById`)**  
  `index.ts`에서 화면을 붙일 타겟으로 `document.getElementById('app')`을 찾고 있습니다.  
  반드시 여러분의 `index.html` 파일 내부에 `<div id="app"></div>` 요소가 있어야 합니다.
  
* **`novel.start`의 씬 이름 일치**  
  `novel.start('scene-start')`에 들어가는 문자열은, `new Novel`을 생성할 때  
  `scenes` 객체 안에 등록한 키값과 정확히 일치해야 합니다.  

---

축하합니다! 빈 캔버스 위에 성공적으로 게임 엔진을 구동시켰습니다.

다음 장에서는 검은 배경에서 벗어나 봅시다.  
아까 만든 `config` 파일에 배경과 캐릭터 이미지를 추가해 화면에 생기를 불어넣어 보겠습니다.  

👉 **[다음 장: 2. 에셋과 캐릭터의 등장](./02-assets-and-characters.md)**  
