# 🚀 Quick Start: 5분 만에 첫 게임 만들기

이 가이드는 **Fumika** 엔진을 사용하여 가장 빠르게 비주얼 노벨을 구현하고 실행하는 방법을 안내합니다.

---

## 1. 설치 (Installation)

비어 있는 폴더에서 프로젝트를 초기화하고 엔진을 설치합니다.

```bash
mkdir my-novel-game
cd my-novel-game
npm init -y
npm install fumika
```

---

## 2. 최소 보일러플레이트 (Boilerplate)

Fumika 프로젝트는 크게 **설정(`config`)**, **시나리오(`scene`)**, **진입점(`main`)** 세 부분으로 나뉩니다. 아래 코드들을 복사하여 파일을 생성하세요.

### ⚙️ novel.config.ts
게임의 해상도와 캐릭터, 사용할 에셋을 정의합니다.

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1280,
  height: 720,
  variables: {}, // 전역 변수
  scenes: ['scene-intro'], // 사용할 씬 목록
  assets: {
    aris_normal: './assets/aris.png',
    bg_room: './assets/room.jpg'
  },
  characters: {
    heroine: {
      name: '아리스',
      images: {
        normal: { src: 'aris_normal', width: 400 }
      }
    }
  },
  backgrounds: {
    room: { src: 'bg_room' }
  }
})
```

### 🎭 scenes/scene-intro.ts
실제 게임의 흐름과 대사를 작성합니다.

```typescript
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })([
  { type: 'background', name: 'room' },
  { type: 'character', name: 'heroine', action: 'show' },
  { type: 'dialogue', speaker: 'heroine', text: '안녕! Fumika의 세계에 온 걸 환영해.' },
  { type: 'dialogue', text: '이 코드를 복사했다면 이미 게임을 만들 준비가 된 거야.' }
])
```

### 🚀 main.ts
엔진을 초기화하고 게임을 시작합니다.

```typescript
import { Novel } from 'fumika'
import config from './novel.config'
import sceneIntro from './scenes/scene-intro'

const init = async () => {
  const novel = new Novel(config, {
    element: document.getElementById('game-container') as HTMLElement,
    scenes: {
      'scene-intro': sceneIntro
    }
  })

  await novel.load() // 에셋 로드
  await novel.boot() // 모듈 초기화
  novel.start('scene-intro') // 게임 시작
}

init().catch(console.error)
```

---

## 3. 실행 및 확인

`index.html` 파일에 게임이 마운트될 엘리먼트를 추가하고 `main.ts`를 로드하세요.

```html
<div id="game-container"></div>
<script type="module" src="./main.ts"></script>
```

브라우저에서 확인하면 배경 위에 캐릭터가 나타나고 대사가 출력되는 것을 볼 수 있습니다.

---

## 💡 핵심 팁 (Key Tips)

- **Canvas 기반**: Fumika는 고성능 렌더링을 위해 Canvas를 사용합니다. `novel.load()`를 통해 에셋이 메모리에 올라갔는지 반드시 확인하세요.
- **선언적 DSL**: 모든 연출은 JSON 형태의 객체 배열로 작성됩니다. 오타 방지를 위해 IDE의 **자동완성(IntelliSense)** 기능을 적극 활용하세요.
- **타입 안전성**: `defineScene`과 `defineNovelConfig`는 설정된 캐릭터 이름이나 에셋 키를 엄격하게 체크하여 실수를 방지합니다.

---

## 📚 다음 단계 (Next Steps)

더 깊이 있는 연출과 시스템이 궁금하다면 아래 문서를 참조하세요.

- **[입체적인 연출을 위한 10분 가이드 (Step-by-Step Tutorial)](./tutorial/01-installation.md)**
- **[모든 명령어 레퍼런스 (Command Reference)](./commands.md)**
- **[엔진 설정 가이드 (Configuration Guide)](./config.md)**
