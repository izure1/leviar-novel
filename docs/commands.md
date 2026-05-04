# 📜 Command Reference Index

본 문서는 `fumika` 엔진에서 시나리오 연출을 위해 제공되는 모든 내장 명령어들의 통합 인덱스를 기술합니다.  
각 명령어의 상세한 속성 정의와 활용 예시는 연결된 **개별 모듈 문서**를 참조해 주시기 바랍니다.  

---

## 💎 명령어 요약 (Quick Reference)

연출 및 시스템 제어를 위한 명령어들을 카테고리별로 분류하였습니다.  

| 카테고리 명칭 | 명령어 식별자 (`type`) | 상세 가이드 링크 |
| :--- | :--- | :--- |
| **핵심 렌더링** | `dialogue`, `character`, `background` | [Core Rendering](#core-rendering) |
| **카메라 제어** | `camera-zoom`, `camera-pan`, `camera-effect`, `character-focus`, `character-effect` | [Camera Control](#camera-control) |
| **시각 특수 효과** | `screen-fade`, `screen-flash`, `screen-wipe`, `mood`, `effect`, `overlay-*` | [Visual Effects](#visual-effects) |
| **사운드 시스템** | `audio` | [Audio](#audio) |
| **로직 및 흐름** | `choices`, `condition`, `var`, `label`, `control` | [Logic & Flow](#logic-flow) |
| **시스템 상호작용** | `ui`, `dialogBox`, `input` | [System & Misc](#system-misc) |

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

## ⚙️ 5. 로직 및 흐름 제어 (Logic & Flow) <a id="logic-flow"></a>

시나리오의 진행 방향과 게임 내 데이터 상태를 동적으로 관리합니다.  

*   **[`scene`](./modules/scene.md)**: 다른 장면으로 이동하거나 서브 시퀀스로 호출(Stack-based)합니다.  
*   **[`choices`](./modules/choices.md)**: 플레이어의 의사 결정을 위한 선택지 분기를 생성합니다.  
*   **[`condition`](./modules/condition.md)**: 변수 상태에 따른 지능적인 자동 분기 로직을 실행합니다.  
*   **[`var`](./modules/var.md)**: 전역 및 지역 변수의 값을 변경하고 동적으로 조작합니다.  
*   **[`label`](./modules/label.md)**: 시나리오 내에서 점프 가능한 마커 지점을 설정합니다.  
*   **[`control`](./modules/control.md)**: 사용자의 입력을 일시 제한하거나 스킵 기능을 통제합니다.  

> [!TIP]
> `scene` 커맨드의 호출 기능을 활용하면 프로그래밍의 함수 호출과 유사한 **중첩 씬(Nested Scenes)** 연출이 가능합니다.  
> 자세한 구현 기법은 **[튜토리얼: 중첩 씬 활용](./tutorial.md#step-07)** 문서를 참조해 주시기 바랍니다.  

---

## 🛠️ 6. 시스템 및 기타 상호작용 (System & Misc) <a id="system-misc"></a>

*   **[`dialogBox`](./modules/dialogBox.md)**: 시스템 공지 및 확인을 위한 범용 대화상자를 노출합니다.  
*   **[`input`](./modules/input.md)**: 플레이어로부터 텍스트 입력을 직접 수집하여 변수에 기록합니다.  
*   **[`ui`](./modules/ui.md)**: 특정 모듈의 UI 가시성 상태를 시나리오 상에서 직접 제어합니다.  

---

## 🚀 고급 개발자 가이드

*   **[Resolvable 지능형 속성](./concepts.md#resolvable)**: 변수 상태에 따라 실시간으로 변동하는 속성 설정법을 안내합니다.  
*   **[텍스트 변수 보간](./concepts.md#variables)**: 대사 텍스트 내에 변수 값을 삽입하는 구문(`{{var}}`) 활용법을 기술합니다.  
