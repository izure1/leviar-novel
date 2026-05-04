# 📖 Fumika Documentation Portal

**Fumika** 공식 문서 포털에 방문해 주셔서 진심으로 감사드립니다.  
본 문서는 개발자분들이 엔진의 설계 철학을 명확히 이해하고, 이를 프로젝트에 효과적으로 적용하실 수 있도록 체계적인 가이드와 상세 레퍼런스를 제공합니다.  

---

## 🏁 빠른 시작 안내 (Quick Navigation)

엔진을 처음 도입하시는 경우, 아래의 핵심 가이드를 통해 기본적인 사용법을 신속하게 습득해 보시기 바랍니다.  

*   **[📖 활용 가이드 (Step-by-Step Tutorial)](./tutorial.md)**: 설치부터 프로젝트 완성까지의 전 과정을 정중하게 안내합니다.  
*   **[💡 핵심 아키텍처 (Core Concepts)](./concepts.md)**: 엔진의 설계 철학과 내부 작동 원리를 깊이 있게 기술합니다.  
*   **[📜 명령어 참조 (Command Reference)](./commands.md)**: 모든 내장 명령어의 상세 명세와 활용법을 제공합니다.  

---

## 🚀 카테고리별 기술 문서 개요

| 카테고리 명칭 | 주요 학습 내용 | 관련 문서 링크 |
| :--- | :--- | :--- |
| **🏁 시작하기 (Get Started)** | 엔진 설치, 초기 환경 설정 및 구동 프로세스 최적화 | [Tutorial](./tutorial.md) / [Quick Start](./quick-start.md) |
| **💡 핵심 개념 (Concepts)** | MVC 아키텍처, 변수 시스템, 영속성 보존 정책 | [Architecture Concepts](./concepts.md) |
| **📜 명령어 참조 (Commands)** | 시나리오 구성을 위한 전용 명령어의 상세 명세서 | [Command Index](./commands.md) |
| **🧩 시스템 확장 (Extensions)** | 커스텀 모듈 제작 및 파이프라인 훅을 통한 기능 확장 | [Custom Module](./modules.md) / [Hooks 시스템](./concepts.md#hooks) |

---

## 📂 세부 문서 상세 안내

### 1. 시스템 설계 및 로직 제어
*   **[핵심 아키텍처 개요](./concepts.md#overview)**: 엔진의 단방향 데이터 흐름과 모듈화 구조를 기술합니다.  
*   **[장면 시스템 및 전환](./concepts.md#scenes)**: 독립적인 실행 컨텍스트로서의 씬 관리 전략을 다룹니다.  
*   **[변수 스코핑 및 영속성](./concepts.md#variables)**: 직렬화 가능한 데이터 관리 및 세이브 데이터 무결성을 보장합니다.  
*   **[동적 속성 평가 (Resolvable)](./concepts.md#resolvable)**: 런타임 상태에 따라 결정되는 유연한 속성 정의 패턴을 설명합니다.  
*   **[훅 파이프라인 및 제어](./concepts.md#hooks)**: 엔진의 실행 흐름을 인터셉트하고 기능을 확장하는 방법을 안내합니다.  
*   **[시각적 레이아웃 디버깅](./concepts.md#debug-mode)**: 명시적 객체 추적 시스템과 디버그 모드 활용법을 기술합니다.  

### 2. 프로젝트 구성 및 자원 관리
*   **[전역 설정 가이드 (Configuration)](./config.md)**: `novel.config.ts`의 모든 속성과 구성 방법을 상세히 다룹니다.  
*   **[커스텀 모듈 개발 방법](./modules.md)**: 엔진의 기능을 확장하기 위한 새로운 모듈 제작 절차를 안내합니다.  

### 3. 단계별 튜토리얼 네비게이션
*   **튜토리얼 학습 단계**:
    * [01. 설치](./tutorial.md#step-01) / [02. 설정](./tutorial.md#step-02) / [03. 리소스](./tutorial.md#step-03)
    * [04. 구동](./tutorial.md#step-04) / [05. 상호작용](./tutorial.md#step-05) / [06. 연출효과](./tutorial.md#step-06)
    * [07. 중첩씬](./tutorial.md#step-07)
*   **레퍼런스 확인**: **[전체 명령어 인덱스](./commands.md)**를 참조해 주십시오.  

---

본 문서에서 충분한 정보를 확보하지 못하셨거나 개선 사항이 있으신 경우, [GitHub Issues](https://github.com/izure1/fumika/issues)를 통해 소중한 의견을 남겨주시기 바랍니다.  
개발자분들의 피드백을 엔진 발전에 적극적으로 반영하도록 노력하겠습니다.  
