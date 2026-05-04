# 🎬 defineScene

본 문서는 `fumika` 엔진에서 독립적인 이야기의 실행 단위인 **장면(Scene)**을 설계하고 구성하기 위한 `defineScene` 헬퍼 함수에 대해 기술합니다.  

---

## 1. 개요 (Overview)

`defineScene`은 비주얼 노벨의 최소 서사 단위인 씬을 정의하는 가장 핵심적인 인터페이스입니다.  
이 함수를 통해 해당 장면 전용의 지역 변수, 모듈의 초기 상태, 라이프사이클 훅, 그리고 순차적으로 실행될 시나리오 커맨드 배열을 체계적으로 구성할 수 있습니다.  

---

## 2. 사용 방법 (Usage)

`defineScene`은 개발 환경에 따라 두 가지 호출 방식을 지원합니다.  IDE의 타입 추론 기능을 극대화하고 코드의 명확성을 확보하기 위해 **커리(Curried) 형식**의 사용을 강력히 권장합니다.  

### 2.1. 커리(Curried) 형식 (권장)
설정 객체를 먼저 주입하고, 반환된 함수에 커맨드 배열을 전달하는 방식입니다.  이 방식은 커맨드 내부의 속성들에 대해 가장 정밀한 타입 완성을 제공합니다.  

```ts
import config from './novel.config'
import { defineScene } from 'fumika'

export default defineScene({ 
  config,
  variables: { _isDoorOpened: false } // 씬 전용 지역 변수 정의
})([
  { type: 'dialogue', text: '굳게 닫힌 문 앞에 도착했습니다.' },
  { type: 'var', name: '_isDoorOpened', value: true }
])
```

### 2.2. 단일 호출(Two-Argument) 형식
설정 객체와 커맨드 배열을 동시에 인자로 전달하는 간결한 방식입니다.  

```ts
export default defineScene({ config }, [
  { type: 'dialogue', text: '간결한 씬 구성 방식입니다.' }
])
```

---

## 3. 설정 옵션 상세 (`SceneOptions`)

장면의 성격을 규정하는 주요 설정 항목들입니다.  

| 속성 명칭 | 데이터 타입 | 필수 여부 | 상세 설명 |
| :--- | :--- | :---: | :--- |
| **`config`** | `NovelConfig` | ✅ | `novel.config.ts`에서 정의한 전역 설정 인스턴스입니다. |
| **`variables`** | `object` | - | 씬 내부에서만 유효한 **지역 변수**입니다.  `_` 접두사 사용이 필수입니다. |
| **`initial`** | `object` | - | 씬 진입 시 특정 모듈의 상태를 강제로 초기화할 데이터입니다. |
| **`next`** | `string \| object` | - | 시나리오 종료 후 자동으로 전환될 씬 식별자 또는 설정입니다. |
| **`hooks`** | `HookDescriptor` | - | 씬 생명주기에 종속된 전용 훅 정의입니다.  ([defineHook](./defineHook.md) 참조) |

---

## 4. 주요 기능 상세 설명

### 4.1. 지역 변수 시스템 (`variables`)
특정 장면 내부의 로직 제어를 위해 일시적으로 사용되는 변수입니다.  
전역 변수와의 식별자 충돌을 방지하기 위해 반드시 `_` 접두사를 사용하여 명명해야 합니다.  
지역 변수는 씬이 종료되면 자동으로 소거되지만, **현재 씬이 진행 중인 동안에는 세이브 데이터에 안전하게 포함되어 복구가 보장됩니다.**  

### 4.2. 모듈 상태 초기화 (`initial`)
대화창의 디자인이나 선택지의 레이아웃 등을 특정 장면에서만 다르게 연출하고 싶을 때 활용합니다.  
`config`에 등록된 모듈 정보를 바탕으로 유효한 속성들이 자동 완성됩니다.  

```ts
initial: {
  dialogue: { 
    // 이 장면에서만 대화창을 깊은 남색으로 연출합니다.  
    bg: { color: 'rgba(0, 0, 50, 0.8)' } 
  }
}
```

### 4.3. 자동 장면 전환 (`next`)
시나리오 커맨드 배열의 실행이 모두 완료된 후, 다음 여정으로 이동할 지점을 명시합니다.  
`preserve: true` 설정을 추가하면 현재 화면에 배치된 캐릭터나 배경을 유지한 채 부드럽게 전환됩니다.  

```ts
next: { scene: 'chapter_02', preserve: true }
```

---

## 5. 관련 참조 문서

*   **[Scene 아키텍처 가이드](../concepts.md#scenes)**: 실행 컨텍스트로서의 장면 시스템에 대한 심층 정보를 제공합니다.  
*   **[Configuration 전역 설정](../config.md)**: 엔진의 기초 환경 및 에셋 관리 방법을 안내합니다.  
*   **[defineInitial 활용 가이드](./defineInitial.md)**: 공통 초기 상태를 재사용하는 최적의 패턴을 기술합니다.  
