# 📜 명령어 참조 (Command Reference)

이 문서는 시나리오 연출을 위해 제공되는 명령어들의 통합 인덱스입니다.  
원하시는 연출을 찾아 코드를 복사하여 사용하세요.  

---

## 💡 명령어 작성의 기본 형태

모든 명령어는 `defineScene` 내부에서 배열의 요소로 선언됩니다.  
명령어는 객체 형태로 작성하며, `type` 속성으로 종류를 지정합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(({ set, condition }) => [
  // 변수 조작 등의 논리 흐름 제어 (예약어)
  set('friendship', 50),

  // 시각적/청각적 연출 (명령어)
  {
    type: 'dialogue',
    character: 'fumika',
    text: '이것이 연출을 담당하는 명령어 객체입니다.'
  }
])
```

---

## 💎 명령어 요약 (Quick Reference)

아래 카테고리에서 원하는 기능을 클릭하여 상세 가이드 및 예제를 확인하세요.  

### 🎭 1. 기본 연출 (Core Rendering)

비주얼 노벨의 가장 핵심적인 연출 요소들을 제어합니다.  

*   **[`dialogue`](./modules/dialogue.md)**: 대사 출력 및 나레이션 연출.  
*   **[`character`](./modules/character.md)**: 캐릭터의 등장, 퇴장, 이미지 전환.  
*   **[`background`](./modules/background.md)**: 배경 이미지 전환.  

### 📸 2. 카메라 제어 (Camera Control)

*   **[`camera-zoom`](./modules/camera-zoom.md)**: 화면 확대 및 축소.  
*   **[`camera-pan`](./modules/camera-pan.md)**: 화면 시점 이동.  
*   **[`camera-effect`](./modules/camera-effect.md)**: 화면 흔들림 효과.  
*   **[`character-focus`](./modules/character-focus.md)**: 특정 인물에게 시점 집중.  
*   **[`character-effect`](./modules/character-effect.md)**: 특정 캐릭터만 흔들리는 효과.  

### ✨ 3. 화면 효과 (Visual Effects)

*   **[`screen-fade`](./modules/screen.md)**: 화면 어두워짐(페이드).  
*   **[`screen-flash`](./modules/screen.md)**: 화면 번쩍임.  
*   **[`mood`](./modules/mood.md)**: 색조 필터 및 분위기 전환.  
*   **[`effect`](./modules/effect.md)**: 비, 눈, 벚꽃 등 파티클 효과.  
*   **[`overlay`](./modules/overlay.md)**: 이미지나 텍스트를 화면 위에 띄움.  

### 🎵 4. 사운드 시스템 (Audio)

*   **[`audio`](./modules/audio.md)**: 배경음악(BGM) 및 효과음 재생, 정지.  

### ⚙️ 5. 로직 및 제어 커맨드 (Logic & Control)

*   **[`choices`](./modules/choices.md)**: 플레이어 선택지 생성.  
*   **[`control`](./modules/control.md)**: 플레이어 입력 제한 및 스킵 제어.  

### 🛠️ 6. 시스템 상호작용 (System & Misc)

*   **[`dialogBox`](./modules/dialogBox.md)**: 확인/취소 등의 시스템 알림창 노출.  
*   **[`input`](./modules/input.md)**: 플레이어의 텍스트 입력을 받아 변수에 저장.  
*   **[`ui`](./modules/ui.md)**: UI 숨기기/보이기 제어.  

---

## 🔗 시나리오 흐름 제어 (Flow Control)

`defineScene` 안에서만 사용할 수 있는 전용 함수들입니다.  
장면을 이동하거나 조건에 따라 다른 명령어를 실행할 때 사용합니다.  

*   **[`label`](./reserved/index.md)**: 이동할 목적지 이름 지정.  
*   **[`goto`](./reserved/index.md)**: 특정 `label` 위치로 점프.  
*   **[`condition`](./reserved/index.md)**: 조건에 따라 다르게 동작 (if문 역할).  
*   **[`next`](./reserved/index.md)**: 완전히 다른 씬으로 넘어감.  
*   **[`call`](./reserved/index.md)**: 다른 씬을 잠시 실행하고 돌아옴 (중첩 씬).  
*   **[`set`](./reserved/set.md)**: 변수 값을 변경함.  

---

본 문서에서 찾으시는 명령어가 없다면 [커스텀 모듈 만들기](./modules.md)를 참고하여 직접 제작하실 수 있습니다.  
