# 3. 대사와 동적인 연출

## 개요 (Overview)
게임 화면은 한 번에 하나씩 멈춰서 진행되는 것보다, 부드러운 애니메이션이 들어갈 때 더 생동감이 넘칩니다.  
Fumika 엔진은 캔버스 기반으로, 역동성이 강한 연출을 할 수 있습니다.

이 장에서는 캐릭터의 표정을 바꾸고, `duration`과 `ease` 속성을 이용해 부드럽게 등장하고 퇴장하는 애니메이션을 제어하는 방법을 배웁니다.  

## 사전 준비 (Prerequisites)
* 제공된 `docs/assets/` 폴더에서 웃는 표정 이미지(`fumika_emotion_base_smile.png`)를 여러분의 `assets/` 폴더에 복사해 주세요.

<div align="center">
  <img src="../assets/fumika_emotion_base_smile.png" height="150" />
</div>

---

## 핵심 예제 (Main Example): 부드러운 애니메이션과 표정 변화

### 1단계: 새로운 표정 등록하기
먼저 `novel.config.ts`에 웃는 얼굴을 등록해 봅시다.  

```typescript
// novel.config.ts (일부)
assets: {
  'bg-room': './assets/bg_room.png',
  'fumika-base': './assets/fumika_base_normal.png',
  'fumika-face': './assets/fumika_emotion_base_normal.png',
  'fumika-face-smile': './assets/fumika_emotion_base_smile.png' // 새로운 표정 이미지 추가
},
characters: {
  fumika: {
    // ... 기존 코드 ...
    emotions: {
      normal: { face: 'fumika-face' },
      smile: { face: 'fumika-face-smile' } // 'smile' 표정을 연결
    }
  }
}
```

### 2단계: 씬에 애니메이션과 표정 갱신 적용하기

`scenes/scene-start.ts`를 다음과 같이 수정합니다.  

```typescript
// scenes/scene-start.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })(() => [
  { type: 'background', name: 'bg-room' },

  // duration: 800을 주어 0.8초 동안 부드럽게(페이드인) 나타납니다.
  { 
    type: 'character', 
    action: 'show', 
    name: 'fumika', 
    position: 'center', 
    image: 'idle:normal',
    duration: 800,
    ease: 'easeInOutQuad' // 부드러운 이징(Easing) 함수 지정
  },
  { type: 'dialogue', speaker: 'fumika', text: '안녕! 여긴 내 방이야.' },

  // action: 'show'를 그대로 사용해 이미지 표정만 'smile'로 덮어씌웁니다.
  // 500ms에 걸쳐 표정이 자연스럽게 크로스페이드 됩니다.
  { 
    type: 'character', 
    action: 'show', 
    name: 'fumika', 
    image: 'idle:smile',
    duration: 500
  },
  { type: 'dialogue', speaker: 'fumika', text: '앞으로 잘 부탁해!' }
])
```

저장 후 브라우저를 확인하면:  
1. 후미카가 0.8초에 걸쳐 부드럽게 화면에 나타난 뒤 첫 번째 대사를 말합니다.  
2. 화면을 클릭하면 후미카의 표정이 0.5초에 걸쳐 웃는 얼굴로 자연스럽게 바뀐 뒤 두 번째 대사가 출력됩니다.  

---

## 주의 사항 (Edge Cases)

* **상태 갱신 방법의 오해**  
  캐릭터의 표정이나 위치를 바꿀 때, `action: 'remove'`로 지웠다가 다시 나타나게 하지 마세요.  
  이미 화면에 있는 캐릭터라도 `action: 'show'`를 사용해 바꿀 속성(위 예제에서는 `image`)만 넘기면  
  엔진이 알아서 기존 상태와 새로운 상태 사이를 자연스럽게 이어줍니다.

* **Ease 애니메이션 적용**  
  `ease` 속성에 `easeOutBounce` 같은 특이한 곡선을 주면  
  통통 튀는 등장 연출 등 고급스러운 연출이 가능합니다.  

---

이제 대화와 애니메이션이 제법 자연스러워졌습니다!

하지만 아직 정해진 이야기만 읽는 "전자책"에 불과합니다.  
다음 장에서는 플레이어에게 선택지를 주고 이야기의 흐름을 갈라보는 방법을 알아보겠습니다.  

👉 **[다음 장: 4. 선택지와 분기](./04-choices-and-branching.md)**  
