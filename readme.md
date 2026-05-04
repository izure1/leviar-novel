# 🌌 Fumika

**Fumika**은 웹 기반의 강력하고 유연한 모듈형 비주얼 노벨 엔진입니다.

## 💡 왜 Fumika인가?

기존의 웹 기반 노벨 엔진들은 DOM 조작의 한계로 인해 복잡한 카메라 연출이나
고성능 파티클 효과를 구현하는 데 성능적 제약이 있었습니다. `fumika`은 **Canvas
기반의 고성능 렌더러**와 **반응형 상태 관리(MVC)**를 결합하여, 웹 환경에서도
고품질 게임에 버금가는 입체적인 연출을 쉽고 직관적인 코드로 구현하기 위해
탄생했습니다.

[데모 플레이](https://izure1.github.io/fumika/)

---

## ✨ 핵심 기능 요약

| 기능            | 설명                                | 비고                                    |
| :-------------- | :---------------------------------- | :-------------------------------------- |
| **모듈형 MVC**  | 모든 기능이 독립 모듈로 구성        | 기능 간 간섭 최소화 및 무한한 확장성    |
| **선언적 DSL**  | JSON 객체 배열 형태의 시나리오 작성 | 프로그래밍 지식 없이도 고수준 연출 가능 |
| **타입 안전성** | TypeScript 기반의 자동 완성 지원    | 오타 방지 및 개발 생산성 극대화         |
| **시스템 내장** | 세이브/로드, 스킵, 변수 시스템 포함 | 게임의 핵심 기능을 즉시 사용 가능       |

---

## 🏗️ 프로젝트 구조

| 폴더/파일          | 역할             | 비고                           |
| :----------------- | :--------------- | :----------------------------- |
| **`src/core/`**    | 엔진 핵심 로직   | Novel, Renderer, Context 관리  |
| **`src/modules/`** | 내장 기능 모듈   | Dialogue, Character, Camera 등 |
| **`docs/`**        | 상세 가이드 문서 | 각 기능의 심층 명세            |

---

## 📖 가이드 문서 목록

엔진의 설계 철학과 세부 기능을 파악하기 위해 아래 문서를 참조하십시오.

*   **[📚 Documentation Portal (전체 가이드)](./docs/README.md)** - 모든 문서의 통합 인덱스
*   **[🚀 Step-by-Step Tutorial (입문 가이드)](./docs/tutorial.md#step-01)** - 10분 만에 첫 게임 만들기

| 상세 문서 | 주요 내용 |
| :--- | :--- |
| **[⚙️ Configuration](./docs/config.md)** | 프로젝트 전역 설정 및 폴백 규칙 명세 |
| **[💡 Core Concepts](./docs/concepts.md#overview)** | Resolvable, Skip, MVC 등 엔진 작동 철학 해설 |
| **[🎬 Scenes](./docs/concepts.md#scenes)** | 씬 구성, 지역 변수 및 초기 상태 주입 방법 |
| **[📜 Command Reference](./docs/commands.md)** | 모든 내장 시나리오 명령어의 속성 레퍼런스 |
| **[⚓ Hooks](./docs/concepts.md#hooks)** | 엔진 및 모듈의 라이프사이클 이벤트를 제어하는 Hook 가이드 |

---

## 🚀 빠른 시작 (Quick Start)
> 더욱 상세한 단계별 설정 방법은 **[Quick Start 가이드](./docs/quick-start.md)**를 참조하세요.

### 1. 설치 (Installation)

```bash
npm install fumika
```

### 2. 최소 구동 예제

```typescript
import { Novel } from "fumika";
import config from "./novel.config";
import sceneIntro from "./scenes/scene-intro";

const init = async () => {
  const novel = new Novel(config, {
    element: document.getElementById("game-container") as HTMLElement,
    scenes: { "scene-intro": sceneIntro },
  });

  await novel.load();
  novel.start("scene-intro");
};

init().catch(console.error);
```
