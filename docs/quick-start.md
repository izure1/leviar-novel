# 🚀 빠른 시작 (Quick Start)

이 문서는 최소한의 코드로 엔진을 구동하는 핵심 과정을 안내합니다.  

---

## 1. 패키지 설치

프로젝트 터미널에서 아래 명령어를 실행하여 엔진 패키지를 설치합니다.  

```bash
npm install fumika
```

---

## 2. 프로젝트 설정 (novel.config.ts)

루트 디렉토리에 `novel.config.ts` 파일을 생성하고 화면 크기와 변수, 에셋을 등록합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1280,
  height: 720,
  variables: {
    playerName: '여행자'
  },
  assets: {
    'bg-school': './assets/bg_school.jpg'
  }
})
```

---

## 3. 첫 시나리오 작성 (scene-start.ts)

게임 화면에 무엇을 보여줄지 결정하는 씬(Scene) 파일을 작성합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'background', name: 'bg-school' },
  { type: 'dialogue', text: '엔진이 정상적으로 구동되었습니다.' }
])
```

---

## 4. 엔진 구동 (index.ts)

엔진 인스턴스를 생성하고 방금 만든 씬을 실행하여 게임을 시작합니다.  

### 핵심 예제 (Main Example)

```typescript
import { Novel } from 'fumika'
import config from './novel.config'
import sceneStart from './scene-start'

const novel = new Novel(config, {
  element: document.getElementById('app') as HTMLElement,
  scenes: { 'scene-start': () => sceneStart }
})

// 리소스를 비동기로 불러온 후 첫 씬을 시작합니다
await novel.load()
await novel.boot()
novel.start('scene-start')
```

---

화면에 대사가 정상적으로 출력되었다면 모든 준비가 끝났습니다.  
더 다양한 연출 방법은 **[튜토리얼](./tutorial.md)**에서 이어집니다.  
