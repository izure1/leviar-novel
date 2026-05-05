# 🎨 defineInitial

본 문서는 여러 장면(Scene)에서 공통적으로 사용되는 시스템 모듈의 초기 상태(`initial`) 설정을 통합 관리하고 재사용하기 위한 `defineInitial` 유틸리티 함수에 대해 기술합니다.  

---

## 1. 개요 (Overview)

`defineInitial`은 프로젝트 전반에 걸쳐 일관된 시각적 테마와 시스템 환경을 유지하기 위해 설계되었습니다.  
반복되는 초기화 설정(예: 특정 구역 전용 대화창 스타일, 공통 UI 레이아웃 등)을 독립된 상수로 선언함으로써, 시나리오 파일의 가독성을 높이고 설정 오류를 방지하며 유지보수 효율성을 극대화합니다.  

---

## 2. 사용 방법 (Usage)

`defineInitial`은 현재의 `config` 객체를 주입받아, 해당 프로젝트의 모듈 구조에 최적화된 타입 추론을 제공하는 커리 형식의 인터페이스를 가지고 있습니다.  

```ts
import { defineInitial } from 'fumika'
import config from './novel.config'

/** 
 * 특정 연출 분위기(예: 긴박한 상황)를 위한 공통 초기 설정 정의 예시입니다.  
 */
export const intenseInitial = defineInitial(config)({
  mood: { mood: 'alert', intensity: 0.7 },
  dialogue: { bg: { color: 'rgba(30, 0, 0, 0.9)', borderColor: '#ff0000' } },
  choices: { button: { color: 'rgba(100, 0, 0, 0.5)' } }
})
```

---

## 3. 씬(Scene) 연동 및 활용

정의된 공통 설정 객체는 `defineScene`의 `initial` 속성에 직접 할당하여 사용할 수 있습니다.  

```ts
import { intenseInitial } from './common/initials'

export default defineScene({
  config,
  initial: intenseInitial // 사전에 정의된 공통 테마를 즉시 적용합니다.  
})(() => [
  { type: 'dialogue', text: '공기가 평소와는 다르게 차갑고 무겁습니다.' }
])
```

---

## 4. 부분 확장 및 오버라이드 (Override)

공통 테마를 기본으로 사용하되, 특정 장면에서만 세부 속성을 미세 조정하고 싶다면 JavaScript의 스프레드 연산자(`...`)를 활용하여 안전하게 확장할 수 있습니다.  

```ts
export default defineScene({
  config,
  initial: {
    ...intenseInitial,
    // 공통 설정의 다른 부분은 유지하면서, 특정 속성의 강도만 강화합니다.  
    mood: { ...intenseInitial.mood, intensity: 1.0 } 
  }
})(() => [ ... ])
```

---

## 5. 관련 참조 문서

*   **[defineScene 상세 가이드](./defineScene.md)**: 장면 구성의 기초와 고급 설정법을 안내합니다.  
*   **[Configuration 중앙 설정 가이드](../config.md)**: 엔진 전역 설정 및 에셋 관리 방법을 다룹니다.  
