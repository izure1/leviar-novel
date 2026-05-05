# 📜 Command Reference Index

본 문서는 `fumika` 엔진에서 시나리오 연출을 위해 제공되는 모든 내장 명령어들의 통합 인덱스를 기술합니다.  
각 명령어의 상세한 속성 정의와 활용 예시는 연결된 **개별 모듈 문서**를 참조해 주시기 바랍니다.  

## 💡 명령어(Command) vs 예약어(Reserved Word)

Fumika 엔진의 시나리오 스크립트는 크게 **명령어**와 **예약어** 두 가지 요소로 구성됩니다.  
이 둘은 동작 방식과 목적이 완전히 다릅니다.

| 구분 | 목적 | 형태 | 실행 대상 |
| :--- | :--- | :--- | :--- |
| **명령어 (Commands)** | 대사, 이미지, 효과음 등 화면과 소리의 **시각적/청각적 연출** | `{ type: '...', 속성: 값 }` 형태의 객체 | 렌더러 (Renderer) 및 UI 모듈 |
| **예약어 (Reserved Words)** | 분기, 변수 할당, 씬 이동 등 시나리오의 **논리 흐름 제어** | 콜백 인자로 제공되는 제어 함수 | 엔진 코어 제어기 (Controller) |

### 📝 핵심 사용 예제

```typescript
import { defineScene } from 'fumika'

export default defineScene({
  // 씬의 초기화 및 기본 환경 설정 영역
})(({ set, condition, goto, label }) => [
  // [예약어] 제어 함수를 호출하여 배열 요소로 삽입합니다.
  set('friendship', 50),

  // [명령어] 순수한 객체 리터럴 형태로 선언되어 렌더링에 사용됩니다.
  {
    type: 'dialogue',
    character: 'fumika',
    text: '이것이 연출을 담당하는 명령어 객체입니다.'
  },

  // [예약어] 시나리오의 흐름을 제어하기 위한 조건부 분기입니다.
  condition(
    (ctx) => ctx.var.friendship >= 50,
    [
      // 조건 만족 시 실행될 내부 시나리오 배열
      {
        type: 'dialogue',
        text: '호감도가 충분히 높습니다!'
      },
      goto('good-route') // [예약어] 다른 라벨로 점프
    ]
  ),

  // [예약어] 분기의 목적지가 되는 라벨을 선언합니다.
  label('good-route')
])
```

---

## 💎 요약 (Quick Reference)

### 📌 명령어 요약 (Commands)
연출 및 시스템 제어를 위한 명령어들을 카테고리별로 분류하였습니다.  

| 카테고리 명칭 | 명령어 식별자 (`type`) | 상세 가이드 링크 |
| :--- | :--- | :--- |
| **핵심 렌더링** | `dialogue`, `character`, `background` | [Core Rendering](#core-rendering) |
| **카메라 제어** | `camera-zoom`, `camera-pan`, `camera-effect`, `character-focus`, `character-effect` | [Camera Control](#camera-control) |
| **시각 특수 효과** | `screen-fade`, `screen-flash`, `screen-wipe`, `mood`, `effect`, `overlay-*` | [Visual Effects](#visual-effects) |
| **사운드 시스템** | `audio` | [Audio](#audio) |
| **로직 및 제어** | `choices`, `control` | [Logic & Control](#logic-control) |
| **시스템 상호작용** | `ui`, `dialogBox`, `input` | [System & Misc](#system-misc) |

### 🔗 빌더 예약어 (Builder Reserved Words)
시나리오 흐름 제어를 위한 `defineScene` 체인 전용 예약어들입니다. 명령어 목록에 포함되지 않습니다.

| 기능 | 예약어 | 상세 가이드 링크 |
| :--- | :--- | :--- |
| **흐름 제어** | `label`, `goto`, `call`, `next`, `condition` | [Flow Control](#flow-control) |
| **상태 관리** | `set` | [State Management](#state-management) |

---

## 🎭 1. 기본 연출 (Core Rendering) <a id="core-rendering"></a>

비주얼 노벨의 가장 핵심적인 연출 요소들을 제어합니다.  

*   **[`dialogue`](./modules/dialogue.md)**: 대사 출력 및 나레이션 연출을 담당합니다.  
*   **[`character`](./modules/character.md)**: 캐릭터의 등장, 퇴장, 이미지 전환 및 위치 변경을 제어합니다.  
*   **[`background`](./modules/background.md)**: 배경 이미지 전환 및 비디오 배경 설정을 관리합니다.  

---

## 📸 2. 카메라 제어 (Camera Control) <a id="camera-control"></a>

화면의 시점을 조절하여 연출의 역동성과 공간감을 부여합니다.  
상세 내용은 **[카메라 허브 문서](./modules/camera.md)**를 참조해 주십시오.  

*   **[`camera-zoom`](./modules/camera-zoom.md)**: 화면의 확대 및 축소 연출을 수행합니다.  
*   **[`camera-pan`](./modules/camera-pan.md)**: 카메라의 시점을 특정 좌표로 부드럽게 이동시킵니다.  
*   **[`camera-effect`](./modules/camera-effect.md)**: 화면 흔들림(Shake) 등 물리적인 카메라 효과를 적용합니다.  
*   **[`character-focus`](./modules/character-focus.md)**: 특정 인물의 신체 부위로 시점을 자동 고정합니다.  
*   **[`character-effect`](./modules/character-effect.md)**: 개별 캐릭터 객체에 한정된 물리 효과를 부여합니다.  

---

## ✨ 3. 화면 효과 (Visual Effects) <a id="visual-effects"></a>

장면 전체의 분위기를 전환하거나 특수한 환경 효과를 삽입합니다.  

*   **화면 전환 연출**: **[Screen 허브 문서](./modules/screen.md)** (`screen-fade`, `screen-flash`, `screen-wipe`)  
*   **[`mood`](./modules/mood.md)**: 색조 필터 및 조명 깜빡임 등을 통한 분위기 조성 기능을 제공합니다.  
*   **[`effect`](./modules/effect.md)**: 비, 눈, 꽃잎 등 고성능 파티클 시스템을 구동합니다.  
*   **[`overlay`](./modules/overlay.md)**: 텍스트 및 이미지 오버레이를 독립적으로 관리합니다.  

---

## 🎵 4. 사운드 시스템 (Audio) <a id="audio"></a>

*   **[`audio`](./modules/audio.md)**: BGM 및 효과음의 재생, 정지, 크로스페이드 등 청각적 요소를 제어합니다.  

---

## ⚙️ 5. 로직 및 제어 커맨드 (Logic & Control) <a id="logic-control"></a>

시나리오의 진행 중 발생하는 제어 및 분기 커맨드입니다.  

*   **[`choices`](./modules/choices.md)**: 플레이어의 의사 결정을 위한 선택지 분기를 생성합니다.  
*   **[`control`](./modules/control.md)**: 사용자의 입력을 일시 제한하거나 스킵 기능을 통제합니다.  

---

## 🛠️ 6. 시스템 및 기타 상호작용 (System & Misc) <a id="system-misc"></a>

*   **[`dialogBox`](./modules/dialogBox.md)**: 시스템 공지 및 확인을 위한 범용 대화상자를 노출합니다.  
*   **[`input`](./modules/input.md)**: 플레이어로부터 텍스트 입력을 직접 수집하여 변수에 기록합니다.  
*   **[`ui`](./modules/ui.md)**: 특정 모듈의 UI 가시성 상태를 시나리오 상에서 직접 제어합니다.  

---

## 🔗 7. 시나리오 흐름 제어 예약어 (Flow Control) <a id="flow-control"></a>

`defineScene` 빌더 체인에서만 사용할 수 있는 전용 함수들입니다.  
일반적인 `type` 기반의 커맨드 객체와 다르게, 시나리오의 로직과 실행 흐름을 물리적으로 제어합니다.

*   **[흐름 제어 예약어](./reserved/index.md)**:
    *   `label`: 분기의 목적지가 되는 지점을 선언합니다.
    *   `goto`: 씬 내부의 특정 `label` 위치로 실행을 점프합니다.
    *   `next`: 다른 씬으로의 완전한 전환을 수행합니다.
    *   `call`: 다른 씬을 서브루틴(중첩 씬)으로 호출하며, 이전 씬의 상태를 보존할 수 있습니다.
    *   `condition`: 조건부 분기를 생성하여 특정 조건 하에서만 로직을 실행하도록 합니다.

> [!TIP]
> `call` 예약어의 기능을 활용하면 프로그래밍의 함수 호출과 유사한 **중첩 씬(Nested Scenes)** 연출이 가능합니다.  
> 자세한 구현 기법은 **[튜토리얼: 중첩 씬 활용](./tutorial.md#step-07)** 문서를 참조해 주시기 바랍니다.  

---

## 📦 8. 상태 관리 예약어 (State Management) <a id="state-management"></a>

*   **[`set`](./reserved/set.md)**: 전역 및 지역 상태 데이터의 값을 변경하고 동적으로 조작합니다.
*   **[세이브 데이터 (Save Data)](./save-data.md)**: 게임의 진행 상태와 변수들이 저장되는 구조와 주의사항을 확인합니다.

---

## 🚀 고급 개발자 가이드

*   **[Resolvable 지능형 속성](./concepts.md#resolvable)**: 변수 상태에 따라 실시간으로 변동하는 속성 설정법을 안내합니다.  
*   **[텍스트 변수 보간](./concepts.md#variables)**: 대사 텍스트 내에 변수 값을 삽입하는 구문(`{{var}}`) 활용법을 기술합니다.  
