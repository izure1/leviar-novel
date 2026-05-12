# 6. 나만의 UI 만들기

## 개요 (Overview)
기본적인 대화창 외에도, 게임 화면에 체력바, 호감도 수치 등 나만의 시각 요소(UI)를 띄워야 할 때가 있습니다.

이 장에서는 `element` 명령어를 사용해 화면에 커스텀 UI를 만들고,  
`behaviors` 속성을 사용해 UI에 동적인 동작을 연결하는 방법을 배웁니다.  

## 사전 준비 (Prerequisites)
* 이전 장에서 만든 `affection` 호감도 전역 변수가 동작해야 합니다.  

---

## Element 명령어란?

Fumika 엔진에서는 `element` 명령어를 통해 화면 위에 자유롭게 요소(텍스트, 이미지, 사각형 등)를 렌더링할 수 있습니다.  
복잡한 프로그래밍 없이도 위치와 스타일을 간단하게 지정해 즉석 UI를 띄울 수 있습니다.  

## 핵심 예제 (Main Example): 화면 상단에 호감도 표시하기

`scene-start.ts`의 맨 처음에 화면 우측 상단에 현재 호감도를 보여주는 UI 패널을 띄워보겠습니다.  

```typescript
// scenes/scene-start.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({
  config,
  // 1. UI의 동작(behavior)을 정의합니다
  actions: {
    updateAffection: (element, ctx) => {
      // 텍스트를 현재 호감도로 초기화합니다.
      element.attribute.text = `현재 호감도: ${ctx.globalVars.affection ?? 0}`
      
      // 변수가 변경될 때 텍스트를 갱신하도록 이벤트를 연결합니다.
      ctx.novel.hooker.on('novel:var', (data) => {
        if (data.key === 'affection') {
          element.attribute.text = `현재 호감도: ${ctx.globalVars.affection ?? 0}`
        }
        return data
      })
    }
  }
})(() => [
  // 2. 커스텀 UI 요소 띄우기
  {
    type: 'element',
    action: 'show',
    id: 'ui-panel', // 나중에 숨기거나 수정하기 위한 고유 ID
    kind: 'rect',   // 루트 요소를 사각형(패널)으로 지정
    // CSS와 유사한 style 속성을 통해 우측 상단에 배치합니다
    position: {
      x: 1080,
      y: 50
    },
    style: {
      width: 200,
      height: 50,
      background: 'rgba(0, 0, 0, 0.5)' // 반투명 검은색 배경
    },
    children: [
      {
        id: 'ui-text',
        kind: 'text',
        text: '현재 호감도: 0',
        // 정의해둔 액션을 behaviors로 연결합니다
        behaviors: ['updateAffection'],
        // 부모 사각형의 중심을 기준으로 한 픽셀 오프셋 지정
        position: { x: 0, y: 0 },
        style: {
          color: 'rgb(255, 255, 255)',
          fontSize: 18
        }
      }
    ]
  },

  // ... 기존 배경 및 대사 연출 ...
  { type: 'background', name: 'bg-room' },
  { type: 'character', action: 'show', name: 'fumika', image: 'idle:normal', position: 'center' },
  // ... 생략 ...
])
```

### Behaviors (동작 연결)
주목할 점은 `defineScene` 내부의 `actions` 객체와 요소의 `behaviors: ['updateAffection']` 속성입니다.

UI의 동작을 `actions`로 정의하고 `behaviors`로 주입하는 방식을 사용합니다.  
이를 통해 재사용성이 높아지고, 자바스크립트의 모든 기능(이벤트 핸들러, 타이머, 엔진 훅 등)을 활용해 자유롭게 UI를 제어할 수 있습니다.  

---

## 주의 사항 (Edge Cases)

* **씬 전환 시 UI 파기**  
  `element`로 띄운 UI는 씬(Scene)이 넘어가면 자동으로 완전히 지워집니다.  
  만약 다음 씬에서도 동일한 UI를 계속 유지하고 싶다면, 씬을 이동할 때 `{ scene: '다음씬이름', preserve: true }` 옵션을 사용해야 합니다.  
  같은 씬 내에서 더 이상 필요 없어져 지우고 싶다면 `{ type: 'element', action: 'hide', id: 'ui-panel' }` 명령어를 사용해 명시적으로 삭제할 수 있습니다.

---

🎉 **기본 튜토리얼 수료를 축하합니다!** 🎉

이제 여러분은 빈 프로젝트에서 시작해 배경과 캐릭터를 띄우고, 선택지를 통해 분기를 나누며, 나만의 UI를 설계하는 모든 기본 과정을 마쳤습니다.

여기서 한 걸음 더 나아가, 대규모 프로젝트를 위한 전문적인 설계 기법을 배우고 싶다면 다음 문서를 확인하세요.

👉 **[07. 좀 더 나아가기 (Advanced Patterns)](./07-going-further.md)**
