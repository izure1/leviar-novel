# 07. 장소 이동과 마무리 (Transitions) 🌓

이제 마지막 단계입니다! 학교를 떠나 '집'으로 이동하는 장면을 만들고, 지금까지의 진행 상황을 저장하는 방법을 알아보겠습니다.

---

## 1단계: 새로운 씬 파일 만들기

새로운 파일 `scenes/scene-home.ts`를 만들고 집에서의 대화를 작성합니다.

```ts
// scenes/scene-home.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })([
  { type: 'background', name: 'home' }, 
  { type: 'dialogue', text: '무사히 집에 도착했다.' },
  { type: 'dialogue', text: '오늘 하루도 정말 즐거웠어.' }
])
```

## 2단계: 설정 파일(`config`) 업데이트

엔진에게 새로운 씬이 추가되었음을 알려줘야 합니다. `novel.config.ts`의 `scenes` 배열에 이름을 추가합니다.

```ts
// novel.config.ts
export default defineNovelConfig({
  // ...
  scenes: ['scene-intro', 'scene-home'], // 'scene-home' 추가
  // ...
})
```

## 3단계: 메인 진입점(`main.ts`) 업데이트

이제 실제 씬 파일(`scene-home.ts`)을 엔진 인스턴스에 연결합니다.

```ts
// main.ts
import sceneIntro from './scenes/scene-intro'
import sceneHome from './scenes/scene-home' // 추가

const novel = new Novel(config, {
  element: ...,
  scenes: {
    'scene-intro': sceneIntro,
    'scene-home': sceneHome, // 추가
  }
})
```

## 4단계: 자동 전환(`next`) 설정하기

모든 등록이 끝났습니다! 이제 `scene-intro.ts`에서 대사가 끝나면 자동으로 집으로 가도록 설정합니다.

```ts
// scenes/scene-intro.ts
export default defineScene({ 
  config, 
  next: 'scene-home' // 이제 엔진이 이 이름을 인식할 수 있습니다!
})([
  // ... (기존 코드)
  { type: 'dialogue', text: '이제 집으로 돌아갈 시간이야.' }
])
```

---

## 💡 축하합니다! 모든 튜토리얼을 마쳤습니다.

이제 당신은 아래 기능이 모두 포함된 **진짜 게임**을 하나 완성했습니다!
1. 캐릭터와 배경이 나타나는 연출
2. 캐릭터 포커싱과 벚꽃 흩날림 효과
3. 플레이어의 선택에 따른 점수 변화 및 자동 씬 전환

## 🏁 다음은 무엇을 공부할까요?

*   **[🚀 더 높은 곳으로 (Advanced Guide)](./08-advanced-guide.md)**: 대규모 프로젝트를 깔끔하게 관리하는 구조 설계법.
*   **[📚 문서 포털로 돌아가기](../README.md)**: 전체 명령어 레퍼런스 확인하기.

멋진 이야기를 Fumika로 들려주시길 기대하겠습니다! 🌌
