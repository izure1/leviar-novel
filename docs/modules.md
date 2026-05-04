# 🧩 Custom Module Development Guide

본 문서는 `fumika` 엔진의 고도화된 모듈화 아키텍처를 이해하고, 개발자가 직접 새로운 시나리오 명령어와 기능을 확장하는 방법을 안내합니다.  

---

## 1. 모듈의 기본 구조 (Core Structure) <a id="core-structure"></a>

`fumika` 엔진의 모든 기능은 독립적인 모듈 단위로 설계되어 있습니다.  
새로운 기능을 추가하려는 개발자께서는 아래의 핵심 생명주기 인터페이스를 준수하여 구현해 주시기 바랍니다.  

| 메서드 식별자 | 실행 시점 | 주요 역할 및 책임 |
| :--- | :--- | :--- |
| **`onBoot`** | 엔진 라이프사이클 초기화 시 | DOM 객체 생성, Canvas 레이어 할당 등 기초 환경을 구성합니다. |
| **`onUpdate`** | 엔진의 매 프레임 업데이트 시 | 실시간 데이터 동기화 및 캔버스 렌더링을 갱신합니다. |
| **`onCleanup`** | 씬 전환 또는 엔진 종료 시 | 할당된 메모리를 해제하고 사용 중인 리소스를 안전하게 소거합니다. |

---

## 2. 시나리오 명령어 등록 (`defineCmd`) <a id="define-command"></a>

시나리오 스크립트에서 호출할 수 있는 고유한 `type`을 가진 커맨드를 정의합니다.  
이 과정을 통해 복잡한 연출 로직을 하나의 선언적인 명령어로 캡슐화할 수 있습니다.  

```typescript
import { defineCmd } from 'fumika';

/**
 * 사용자 정의 효과 커맨드 구현 예시입니다.  
 */
export const myCommand = defineCmd({
  type: 'custom-effect',
  execute: async (ctx, props) => {
    // 엔진 컨텍스트(ctx)를 활용하여 내부 로직을 수행합니다.  
    console.log('[System] 커스텀 연출 실행:', props.value);
    return true; // 실행 완료를 엔진에 알립니다.  
  }
});
```

---

## 3. UI 인터페이스 확장 (`defineView`) <a id="define-view"></a>

Canvas 렌더링 외에 직접적인 DOM 상호작용이 필요한 인터페이스(대사창, 선택지 버튼 등)를 구축할 때 활용합니다.  
엔진의 UI 레지스트리에 등록되어 가시성 상태(`show`, `hide`)를 정교하게 제어받게 됩니다.  

---

## 4. 엔진 컨텍스트 (`Context`) 자원 활용 <a id="context"></a>

모듈 내부에서는 전달받은 `ctx` 객체를 통해 엔진의 핵심 서브시스템에 안전하게 접근할 수 있습니다.  

*   **`ctx.renderer`**: Canvas 기반의 그래픽 렌더링 엔진에 직접 접근하여 물리 객체를 제어합니다.  
*   **`ctx.variables`**: 엔진의 상태 저장소에 접근하여 전역 및 지역 변수를 조회하거나 수정합니다.  
*   **`ctx.audio`**: 오디오 시스템을 제어하여 사운드 재생 및 믹싱 작업을 수행합니다.  
*   **`ctx.hooker`**: 엔진의 이벤트 라이프사이클에 개입하여 커스텀 훅을 실행합니다.  

---

## 5. 결론 및 참조 <a id="conclusion"></a>

모듈화 설계를 통해 `fumika` 엔진의 가능성을 무한히 확장해 보시기 바랍니다.  
구체적인 API 명세와 내부 구현 원리에 대한 추가 정보는 소스 코드 내의 기술 주석 및 **[Core Concepts](./concepts.md)** 문서를 참조해 주십시오.  
