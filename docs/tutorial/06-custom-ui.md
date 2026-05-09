# 6. 나만의 UI 만들기

## 개요 (Overview)
기본적인 대화창 외에도, 게임 화면에 체력바, 호감도 수치 등 나만의 시각 요소(UI)를 띄워야 할 때가 있습니다.

이 장에서는 `element` 명령어를 사용해 화면에 커스텀 UI를 만들고,  
앞서 배운 변수 보간 기법을 결합하는 방법을 배웁니다.  

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

export default defineScene({ config })(() => [
  // 1. 커스텀 UI 요소 띄우기
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
        // 이중 중괄호를 사용하면 변수값을 텍스트 안에 자동으로 치환해 보여줍니다
        text: '현재 호감도: {{affection}}',
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

### 변수 보간 문법 (Interpolation)
주목할 점은 `text: '현재 호감도: {{affection}}'` 부분입니다.

엔진은 문자열 내부에 `{{변수명}}`이 있으면 이를 현재 저장된 변수 값으로 자동 치환합니다.  
나중에 선택지를 통해 `affection` 값이 바뀌어도 이 기능 덕분에 손쉽게 수치를 텍스트로 갱신해 보여줄 수 있습니다.  

---

## 주의 사항 (Edge Cases)

* **씬 전환 시 UI 파기**  
  `element`로 띄운 UI는 씬(Scene)이 넘어가면 자동으로 완전히 지워집니다.  
  만약 다음 씬에서도 동일한 UI를 계속 유지하고 싶다면, 씬을 이동할 때 `{ scene: '다음씬이름', preserve: true }` 옵션을 사용해야 합니다.  
  같은 씬 내에서 더 이상 필요 없어져 지우고 싶다면 `{ type: 'element', action: 'hide', id: 'ui-panel' }` 명령어를 사용해 명시적으로 삭제할 수 있습니다.

---

🎉 **튜토리얼 수료를 축하합니다!** 🎉

이제 여러분은 빈 프로젝트에서 시작해, 배경과 캐릭터를 띄우고,  
플레이어의 선택을 받아 분기를 나누며, 그 상태를 화면에 띄우는 완전한 형태의 미니 게임을 만들 수 있게 되었습니다.  

여기서 멈추지 않고 더 많은 연출 방법이 궁금하시다면,  
**[명령어 참조 (Commands)](../commands.md)**를 통해 다양한 기능들을 살펴보세요!  
