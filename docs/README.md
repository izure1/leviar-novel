# 📖 Fumika Documentation Portal

**Fumika** 문서 시스템에 오신 것을 환영합니다. 이 문서는 엔진의 기본 사용법부터 고난도 모듈 확장까지 모든 정보를 담고 있습니다.

---

## 🏁 어디서부터 시작할까요?

엔진을 처음 사용하신다면 아래의 **통합 가이드**를 따라 첫 번째 프로젝트를 만들어보세요.

*   **[🚀 단계별 통합 튜토리얼 (Step-by-Step Tutorial)](./tutorial.md)**: 설치부터 고급 기법까지 한 번에 배우기.
*   **[💡 핵심 개념 레퍼런스 (Core Concepts)](./concepts.md)**: 엔진의 동작 원리와 설계 철학 이해하기.

---

## 🚀 카테고리별 가이드

| 카테고리 | 주요 내용 | 관련 문서 |
| :--- | :--- | :--- |
| **🏁 입문 (Get Started)** | 엔진 설치, 환경 설정 및 첫 번째 게임 루프 구동 방법 | [Tutorial](./tutorial.md) / [Quick Start](./quick-start.md) |
| **💡 핵심 개념 (Concepts)** | 엔진 철학, 변수 시스템, 씬 생명 주기 및 디버깅 등 | [Core Concepts](./concepts.md) |
| **📜 명령어 (Commands)** | 시나리오 작성을 위한 모든 내장 명령어 상세 레퍼런스 | [Command List](./commands.md) |
| **🧩 확장 (Extensions)** | 커스텀 모듈 제작 및 엔진 내부 이벤트를 제어하는 방법 | [Custom Module](./modules.md) / [Hooks 시스템](./concepts.md#5-훅-시스템-hooks) |

---

## 📂 상세 문서 상세 안내 (Detailed Reference)

### 1. 설계 및 흐름 (Flow & Logic)
*   **[Core Concepts Overview](./concepts.md#1-핵심-메커니즘-개요-overview)**: 엔진의 MVC 구조와 렌더링 파이프라인.
*   **[Scenes & Transitions](./concepts.md#2-장면-시스템-scenes)**: 씬 전환, 지역 변수 및 초기화 전략.
*   **[Variables & Scoping](./concepts.md#3-변수-시스템-variables)**: 전역/지역 변수 스코핑 및 템플릿 보간법.
*   **[Resolvable Patterns](./concepts.md#4-동적-속성-resolvable)**: 정적 값 대신 함수를 사용하여 동적인 연출 구현하기.
*   **[Hooks & Lifecycle](./concepts.md#5-훅-시스템-hooks)**: 엔진 및 모듈의 라이프사이클 가로채기.
*   **[Debug Mode](./concepts.md#6-디버그-모드-debug-mode)**: 레이아웃 시각화 및 디버깅 가이드.

### 2. 설정 및 리소스 (Setup & Assets)
*   **[Configuration Guide](./config.md)**: `novel.config.ts`의 모든 속성과 폴백 규칙.
*   **[defineScene](../src/define/defineScene.ts)**: 타입 안전한 씬 정의 방법.
*   **[defineCharacter](../src/define/defineCharacter.ts)**: 캐릭터 이미지 및 포커스 포인트 설정.
*   **[defineInitial](../src/define/defineInitial.ts)**: 여러 씬에서 공유할 모듈 초기 상태 관리.

### 3. 내장 모듈 및 튜토리얼 (Modules & Tutorials)
*   **튜토리얼 단계별 이동**:
    * [01. 설치](#01-환경-구축-및-설치-installation) / [02. 설정](#02-프로젝트-설정-configuration) / [03. 시나리오](#03-캐릭터-정의-및-시나리오-작성-scenario)
    * [04. 구동](#04-엔진-구동-및-화면-확인-execution) / [05. 상호작용](#05-플레이어의-선택-interaction) / [06. 연출효과](#06-멋진-연출-더하기-effects)
    * [07. 씬 전환](#07-장소-이동과-마무리-transitions) / [08. 고급설계](#08-고급-설계-가이드-advanced) / [09. 중첩씬](#09-중첩-씬-호출과-커스텀-ui-nested-scenes)
*   **명령어 레퍼런스**: [전체 커맨드 목록](./commands.md)

---

**도움이 필요하신가요?**
설명되지 않은 기능이나 버그를 발견하신 경우 [GitHub Issues](https://github.com/izure1/fumika/issues)를 통해 제보해 주시기 바랍니다.
