# 📜 Command Reference Index

`fumika` 엔진에서 사용할 수 있는 모든 내장 명령어들의 인덱스입니다. 각 명령어의 상세한 속성 정의와 활용 예시는 연결된 **상세 모듈 문서**를 참조하십시오.

---

## 💎 명령어 요약 (Quick Reference)

| 카테고리 | 명령어 (`type`) | 상세 문서 |
| :--- | :--- | :--- |
| **기본 연출** | `dialogue`, `character`, `background` | [Core Rendering](#1-기본-연출-core-rendering) |
| **카메라** | `camera-zoom`, `camera-pan`, `camera-effect`, `character-focus`, `character-effect` | [Camera Control](#2-카메라-제어-camera-control) |
| **화면 효과** | `screen-fade`, `screen-flash`, `screen-wipe`, `mood`, `effect`, `overlay-*` | [Visual Effects](#3-화면-효과-visual-effects) |
| **사운드** | `audio` | [Audio](#4-사운드-audio) |
| **로직/제어** | `choices`, `condition`, `var`, `label`, `control` | [Logic & Flow](#5-로직-및-흐름-제어-logic--flow) |
| **시스템** | `ui`, `dialogBox`, `input` | [System & Misc](#6-시스템-및-기타-system--misc) |

---

## 🎭 1. 기본 연출 (Core Rendering)

비주얼 노벨의 가장 핵심적인 연출 요소들을 제어합니다.

*   [`dialogue`](./modules/dialogue.md): 대사 및 나레이션 출력
*   [`character`](./modules/character.md): 캐릭터 등장, 퇴장, 이미지 및 위치 변경
*   [`background`](./modules/background.md): 배경 이미지 전환 및 비디오 배경 설정

---

## 📸 2. 카메라 제어 (Camera Control)

화면의 시점을 조작하여 연출의 역동성을 더합니다. 상세 내용은 [카메라 허브 문서](./modules/camera.md)를 참조하십시오.

*   [`camera-zoom`](./modules/camera-zoom.md): 화면 확대 및 축소
*   [`camera-pan`](./modules/camera-pan.md): 카메라 위치 이동 (패닝)
*   [`camera-effect`](./modules/camera-effect.md): 화면 흔들림(Shake) 등 물리 효과
*   [`character-focus`](./modules/character-focus.md): 특정 캐릭터 부위 자동 포커싱
*   [`character-effect`](./modules/character-effect.md): 개별 캐릭터 객체에 대한 물리 효과

---

## ✨ 3. 화면 효과 (Visual Effects)

전체적인 화면의 분위기와 특수 효과를 관리합니다.

*   **화면 전환**: [Screen 허브 문서](./modules/screen.md) (`screen-fade`, `screen-flash`, `screen-wipe`)
*   [`mood`](./modules/mood.md): 색조 필터 및 조명 깜빡임 효과
*   [`effect`](./modules/effect.md): 파티클 시스템 (비, 눈, 벚꽃 등)
*   [`overlay`](./modules/overlay.md): 텍스트 및 이미지 오버레이 제어 (`overlay-text`, `overlay-image`, `overlay-effect`)

---

## 🎵 4. 사운드 (Audio)

*   [`audio`](./modules/audio.md): BGM 및 SE 재생, 정지, 크로스페이드 제어

---

## ⚙️ 5. 로직 및 흐름 제어 (Logic & Flow)

게임의 진행 방향과 상태를 관리합니다.

*   [`scene`](./tutorial/09-nested-scenes.md): 다른 씬으로 이동하거나 서브씬으로 호출 (Stack-based)
*   [`choices`](./modules/choices.md): 사용자 선택지 분기
*   [`condition`](./modules/condition.md): 변수 상태에 따른 자동 조건 분기
*   [`var`](./concepts/variables.md): 전역/지역 변수 값 변경 및 조작
*   [`label`](./modules/label.md): 시나리오 내 점프 위치 표시
*   [`control`](./modules/control.md): 사용자 입력 차단 및 스킵 방지

> [!TIP]
> `scene` 커맨드의 `call` 속성을 사용하면 함수처럼 씬을 호출하고 복귀하는 **중첩 씬(Nested Scenes)** 기능을 사용할 수 있습니다. 자세한 연출 기법은 [튜토리얼 09](./tutorial/09-nested-scenes.md)를 참조하십시오.

---

## 🛠️ 6. 시스템 및 기타 (System & Misc)

*   [`dialogBox`](./modules/dialogBox.md): 시스템 알림 및 확인 대화상자
*   [`input`](./modules/input.md): 사용자 텍스트 입력 수집
*   [`ui`](./modules/ui.md): 특정 모듈 UI의 표시/숨김 제어

---

## 🚀 고급 가이드

*   [동적 속성 (Resolvable 함수)](./concepts/resolvable.md): 변수에 따라 실시간으로 변하는 속성 설정법
*   [텍스트 보간 (Interpolation)](./concepts/variables.md#interpolation): 대사 내 변수 출력 문법 (`{{var}}`)
