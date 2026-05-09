# 4. 선택지와 분기

## 개요 (Overview)
지금까지 우리는 하나의 선형적인 이야기를 만들었습니다.  
이제 플레이어에게 선택권을 주어, 어떤 대답을 하느냐에 따라 서로 다른 장면(Scene)으로 넘어가도록  
이야기의 흐름을 쪼개는 방법을 알아봅시다. 엔진의 `choices` 모듈을 사용합니다.  

## 사전 준비 (Prerequisites)
* 앞선 장들에서 만든 `scene-start.ts` 파일이 작동하는 상태여야 합니다.  
* `index.ts` 파일의 `scenes` 설정에 분기할 대상 씬들이 미리 등록되어 있어야 합니다.  

---

## 씬(Scene) 나누기

분기를 만들기 위해서는 먼저 "어디로" 이동할지 목적지가 필요합니다.  
우선 `scenes` 폴더에 두 개의 새로운 파일을 만듭니다.  

1. **`scene-good.ts`**: 좋은 선택을 했을 때 이동할 장면  
2. **`scene-bad.ts`**: 나쁜 선택을 했을 때 이동할 장면  

```typescript
// scenes/scene-good.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', speaker: 'fumika', text: '정말? 나도 그렇게 생각해!' }
])
```

```typescript
// scenes/scene-bad.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })(() => [
  { type: 'dialogue', speaker: 'fumika', text: '음... 난 좀 생각이 다른걸.' }
])
```

### `index.ts`에 씬 등록하기 (매우 중요)
새로 만든 씬들이 동작하려면 반드시 `index.ts`의 `new Novel` 생성자에 등록해야 합니다.  

```typescript
// index.ts (일부)
import sceneGood from './scenes/scene-good'
import sceneBad from './scenes/scene-bad'

const novel = new Novel(config, {
  element: document.getElementById('app') as HTMLElement,
  scenes: {
    'scene-start': sceneStart,
    'scene-good': sceneGood,   // 새로 만든 씬 등록
    'scene-bad': sceneBad      // 새로 만든 씬 등록
  }
})
```

## 핵심 예제 (Main Example): 선택지 제공과 이동

이제 `scene-start.ts`로 돌아와서 이야기의 끝에 선택지를 넣어봅시다.  
`choices` 명령어를 사용하며, `next` 속성에 우리가 등록한 씬 이름을 적어줍니다.  

```typescript
// scenes/scene-start.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })(() => [
  // ... 이전 장의 코드 생략 ...
  { type: 'dialogue', speaker: 'fumika', text: '앞으로 잘 부탁해! 넌 학교 생활이 어떨 것 같아?' },

  // 플레이어에게 선택지를 보여줍니다
  {
    type: 'choices',
    choices: [
      {
        text: '아주 재밌을 것 같아!', // 화면에 보이는 버튼 텍스트
        // next에 객체를 전달해 씬을 넘어갈 때 화면(배경, 캐릭터)을 초기화하지 않고 그대로 유지합니다
        next: { scene: 'scene-good', preserve: true }
      },
      {
        text: '벌써부터 피곤한걸...',
        next: { scene: 'scene-bad', preserve: true }
      }
    ]
  }
])
```

코드를 저장하고 확인해 보세요.  
대사가 모두 끝나면 두 개의 버튼이 화면에 나타납니다.  
버튼을 누르면 우리가 방금 만든 각기 다른 씬으로 스토리가 넘어가는 것을 볼 수 있습니다.  

---

## 주의 사항 (Edge Cases)

* **씬 전환 시 화면 초기화 (`preserve` 옵션)**  
  만약 `next: 'scene-good'`처럼 문자열로만 씬을 이동한다면, 엔진은 새로운 씬이 시작될 때 배경과 캐릭터 등 모든 요소를 지우고 **화면을 완전히 초기화**합니다.  
  이전 씬의 배경과 후미카를 화면에 그대로 유지한 채 스토리만 자연스럽게 넘어가게 하려면, 반드시 위 예제처럼 `next: { scene: '목적지', preserve: true }` 옵션을 사용해야 합니다.

* **입력 차단**  
  선택지가 화면에 떠 있는 동안에는 마우스를 아무리 클릭해도 다음 텍스트로 넘어가지 않습니다.  
  반드시 버튼 중 하나를 클릭해야만 게임 진행이 풀립니다.

* **씬 이름 일치**  
  버튼의 `next`에 적은 씬 이름은 반드시 `index.ts`와 `novel.config.ts`에 등록한 이름과 똑같아야만 정상적으로 점프합니다.

---

이제 멀티 엔딩을 가진 게임의 기초가 완성되었습니다!

그런데, 이렇게 매번 씬을 이동시키는 방식 말고 "플레이어의 선택을 점수처럼 어딘가에 저장해 두었다가  
나중에 한 번에 결과를 보여주고 싶다면" 어떻게 해야 할까요?  

다음 장에서는 변수를 사용해 게임의 상태(State)를 관리하는 방법을 알아보겠습니다.  

👉 **[다음 장: 5. 호감도와 변수](./05-state-management.md)**  
