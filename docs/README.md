# 📖 Fumika Documentation Portal

**Fumika** 문서 시스템에 오신 것을 환영합니다. 이 문서는 엔진의 기본 사용법부터 고난도 모듈 확장까지 모든 정보를 담고 있습니다.

## 🏁 어디서부터 시작할까요?

엔진을 처음 사용하신다면 아래의 **단계별 가습 가이드**를 따라 첫 번째 프로젝트를 만들어보세요.

*   **[🚀 10분 만에 첫 게임 만들기 (Step-by-Step Tutorial)](./tutorial/01-installation.md)**

---

## 🚀 카테고리별 가이드

| 카테고리 | 주요 내용 | 관련 문서 |
| :--- | :--- | :--- |
| **🏁 입문 (Get Started)** | 엔진 설치, 환경 설정 및 첫 번째 게임 루프 구동 방법 | [Tutorial](./tutorial/01-installation.md) / [Quick Start](./quick-start.md) |
| **💡 핵심 개념 (Concepts)** | 엔진의 설계 철학, 변수 시스템, 씬의 생명 주기 및 디버깅 등 | [Architecture](./concepts/overview.md) / [Scenes](./concepts/scenes.md) / [Variables](./concepts/variables.md) / [Debug](./concepts/debug-mode.md) |
| **⚙️ 설정 및 정의 (Defines)** | 프로젝트 전역 설정 및 캐릭터, 배경 등의 리소스 정의 방법 | [Configuration](./config.md) / [defineCharacter](./defines/defineCharacter.md) / [defineInitial](./defines/defineInitial.md) |
| **📜 명령어 (Commands)** | 시나리오 작성을 위한 모든 내장 명령어 상세 레퍼런스 | [Command List](./commands.md) / [Dialogue](./modules/dialogue.md) / [Choices](./modules/choices.md) |
| **🧩 확장 (Extensions)** | 커스텀 모듈 제작 및 엔진 내부 이벤트를 제어하는 방법 | [Custom Module](./modules.md) / [Hooks 시스템](./concepts/hooks.md) |

---

## 📂 상세 문서 맵 (Detailed Map)

### 1. 설계 및 흐름 (Flow & Logic)
*   **[Concepts: Overview](./concepts/overview.md)**: 엔진의 MVC 구조와 렌더링 파이프라인.
*   **[Concepts: Scenes](./concepts/scenes.md)**: 씬 전환, 지역 변수 및 초기화 전략.
*   **[Concepts: Variables](./concepts/variables.md)**: 전역/지역 변수 스코핑 및 템플릿 보간법.
*   **[Concepts: Resolvable](./concepts/resolvable.md)**: 정적 값 대신 함수를 사용하여 동적인 연출 구현하기.
*   **[Concepts: Debug Mode](./concepts/debug-mode.md)**: 레이아웃 시각화 및 디버깅 가이드.

### 2. 설정 및 리소스 (Setup & Assets)
*   **[Configuration Guide](./config.md)**: `novel.config.ts`의 모든 속성과 폴백 규칙.
*   **[defineScene](./defines/defineScene.md)**: 타입 안전한 씬 정의 방법.
*   **[defineCharacter](./defines/defineCharacter.md)**: 캐릭터 이미지 및 포커스 포인트 설정.
*   **[defineInitial](./defines/defineInitial.md)**: 여러 씬에서 공유할 모듈 초기 상태 관리.

### 3. 내장 모듈 레퍼런스 (Built-in Modules)
*   **기본**: [Dialogue (대사)](./modules/dialogue.md) / [Choices (선택지)](./modules/choices.md) / [Input (사용자 입력)](./modules/input.md)
*   **연출**: [Camera (카메라)](./modules/camera.md) / [Effect (파티클)](./modules/effect.md) / [Mood (분위기)](./modules/mood.md)
*   **오브젝트**: [Character (캐릭터)](./modules/character.md) / [Background (배경)](./modules/background.md)
*   **시스템**: [Audio (사운드)](./modules/audio.md) / [Screen (화면 효과)](./modules/screen.md) / [Overlay (UI 오버레이)](./modules/overlay.md)

### 4. 고급 사용자용 (For Developers)
*   **[Custom Module Guide](./modules.md)**: `define()`을 사용한 신규 모듈 제작 가이드.
*   **[Hooks Reference](./concepts/hooks.md)**: 엔진 및 모듈의 라이프사이클 가로채기.
*   **[defineHook](./defines/defineHook.md)**: 씬 스코프 기반의 안전한 훅 등록 방법.

---

**도움이 필요하신가요?**
설명되지 않은 기능이나 버그를 발견하신 경우 [GitHub Issues](https://github.com/izure1/fumika/issues)를 통해 제보해 주시기 바랍니다.
