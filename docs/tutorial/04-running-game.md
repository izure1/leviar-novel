# 04. 엔진 구동 및 화면 확인 (Execution) 🚀

작성한 설정과 시나리오를 웹 브라우저에 띄우는 마지막 관문입니다. `Novel` 클래스가 모든 오케스트레이션을 담당합니다.

---

## 메인 진입점 (`main.ts`) 작성

엔진 인스턴스를 생성하고 초기화 로직을 구성합니다.

```ts
import { Novel } from 'fumika'
import config from './novel.config'
import sceneIntro from './scenes/scene-intro'

const init = async () => {
  const novel = new Novel(config, {
    // 1. 렌더링할 캔버스 지정
    canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
    // 2. 사용할 씬들을 맵 형태로 전달
    scenes: {
      'scene-intro': sceneIntro,
    }
  })

  // 3. 에셋 로드 (이미지 등을 메모리에 올림)
  await novel.load()
  
  // 4. 모듈 부팅 (내장 UI 등을 활성화)
  await novel.boot()
  
  // 5. 첫 번째 씬 시작
  novel.start('scene-intro')
}

init()
```

## 핵심 개념: 엔진의 준비 과정

게임이 시작되기 전, 엔진은 두 번의 준비 과정을 거칩니다.

1.  **`novel.load()`**: 이미지와 사운드 파일을 메모리에 올리는 과정입니다.
2.  **`novel.boot()`**: 대사창이나 캐릭터 모듈이 화면에 나타날 준비를 마치는 과정입니다.

이 두 함수는 반드시 `await`를 사용하여 완료될 때까지 기다려야 하며, 그 후에 `novel.start()`를 호출해야 정상적으로 화면이 나타납니다.

엔진은 지정된 캔버스를 `fumika-container`라는 새로운 `<div>` 엘리먼트로 감쌉니다. 이는 대사창 같은 HTML UI 요소들을 캔버스 위에 정확한 위치에 띄우기 위함입니다. 스타일링이 필요하다면 이 컨테이너의 클래스를 활용할 수 있습니다.

---

[⬅️ 이전 단계: 03. 시나리오](./03-writing-scenario.md) | [다음 단계: 05. 상호작용 및 변수 ➡️](./05-interaction.md)
