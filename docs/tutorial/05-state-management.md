# 5. 호감도와 변수

## 개요 (Overview)
게임에서 플레이어의 행동을 기억하는 것은 매우 중요합니다.

선택에 따라 캐릭터의 호감도가 오르고,  
나중에 이 호감도 수치에 따라 숨겨진 대사를 보여주는 방법을 알아봅니다.

엔진의 `var` 속성과 `condition` 예약어를 사용합니다.

## 사전 준비 (Prerequisites)
* 이전 장에서 만든 선택지 코드가 필요합니다.  

---

## 핵심 예제 (Main Example): 호감도 시스템

`scene-start.ts`의 선택지 부분을 수정하여, 첫 번째 선택지를 고르면  
`affection`(호감도) 전역 변수 점수를 10점 올려보겠습니다.  

### 1단계: `novel.config.ts`에 전역 변수 등록하기

엔진이 변수와 그 타입을 추적할 수 있도록 먼저 설정 파일에 초기값을 등록해 주어야 합니다.  
`variables` 속성을 추가하고 사용할 변수 이름과 초기값을 적어줍니다.  

```typescript
// novel.config.ts (일부)
export default defineNovelConfig({
  width: 1280,
  height: 720,
  scenes: ['scene-start'],
  // 사용할 전역 변수들과 그 초기값을 정의합니다
  variables: {
    affection: 0 // 호감도는 0부터 시작합니다
  },
  // ... 생략 ...
})
```

### 2단계: 선택지에서 변수 변경하기 (`var` 속성)

`choices` 객체 내부에 `var` 속성을 넣으면, 해당 버튼을 눌렀을 때 엔진에 등록된 변수값이 변경됩니다.  

```typescript
// scenes/scene-start.ts (일부)

  // 플레이어에게 선택지를 보여줍니다
  {
    type: 'choices',
    choices: [
      {
        text: '아주 재밌을 것 같아!',
        next: { scene: 'scene-good', preserve: true },
        // 이 버튼을 누르면 'affection' 변수를 10으로 설정합니다. 그리고 이후 scene-good으로 이동합니다.
        var: { affection: 10 }
      },
      {
        text: '벌써부터 피곤한걸...',
        next: { scene: 'scene-bad', preserve: true }
      }
    ]
  }
```

### 3단계: 변수값에 따라 다른 결과 보여주기 (`condition` 예약어)

이제 `scene-good.ts`로 넘어가서, 점수에 따라 다른 대사가 나오도록 만들어봅시다.  
`defineScene`의 콜백 함수에서 제공하는 `condition` 예약어를 사용해 `if`문처럼 분기를 나눕니다.  

```typescript
// scenes/scene-good.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

// 콜백 매개변수에서 condition 예약어를 꺼내옵니다
export default defineScene({ config })(({ condition }) => [
  { type: 'dialogue', speaker: 'fumika', text: '정말? 나도 그렇게 생각해!' },

  // condition(조건함수, 참일때_실행할_배열, 거짓일때_실행할_배열)
  condition(
    // 1. 현재 변수 상태를 받아와 조건을 검사합니다 (호감도가 10 이상인가?)
    ({ affection }) => affection >= 10,

    // 2. 조건이 참(True)일 때 실행되는 명령어들
    [
      { type: 'character', action: 'show', name: 'fumika', image: 'idle:smile' },
      { type: 'dialogue', speaker: 'fumika', text: '(앗, 왠지 너랑은 금방 친해질 수 있을 것 같아.)' }
    ],

    // 3. 조건이 거짓(False)일 때 실행되는 명령어들 (여기선 비워둡니다)
    []
  )
])
```

코드를 실행하고 첫 번째 선택지를 골라보세요.  
버튼을 누르는 순간 내부적으로 `affection`이 10이 되고,  
다음 씬에서 이 변수를 읽어 추가로 덧붙인 비밀 대사를 보여주게 됩니다!  

---

## 주의 사항 (Edge Cases)

* **배열 내부의 조건문**  
  `() => [ ... ]` 처럼 대괄호 배열 안에서 자바스크립트 기본 문법인 `if`문을 직접 쓰면 엔진이 정상적으로 해석하지 못합니다.  
  반드시 `defineScene`이 제공하는 `condition` 예약어를 사용해 흐름을 제어해야 합니다.

* **현재 변수 상태 읽기**  
  `condition`의 첫 번째 인자로 들어가는 람다 함수 `({ affection }) => ...` 에는  
  게임이 이 명령어 위치에 도달했을 시점의 가장 최신 변수 상태가 자동으로 주입됩니다.

---

이제 여러분의 게임은 플레이어의 행동을 기억하게 되었습니다.  
마지막으로, 이렇게 보이지 않게 저장된 호감도를 게임 화면 위에 항상 띄워둘 수 있다면 더 좋겠죠?  

다음 장에서는 화면 위에 나만의 커스텀 디자인을 올리는 UI 제작법을 알아봅니다.  

👉 **[다음 장: 6. 나만의 UI 만들기](./06-custom-ui.md)**  
