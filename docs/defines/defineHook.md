# ⚓ defineHook (훅 정의 헬퍼)

`defineHook`은 특정 씬 내에서 모듈 또는 엔진의 이벤트를 가로채기 위한 훅을 정의하는 헬퍼 함수입니다. 이 함수를 통해 정의된 훅은 씬 시작 시 자동으로 등록되고, 씬 종료 시 안전하게 해제됩니다.

---

## 1. 개요 (Overview)

| 항목 | 내용 |
| :--- | :--- |
| **목적** | 씬 스코프의 이벤트 리스너 등록 및 생명주기 관리 |
| **대상** | `novel.config.ts`에 등록된 모듈 훅 및 `novel:` 엔진 훅 |
| **장점** | 수동으로 `off`를 호출할 필요 없이 메모리 누수 방지 |

* [상세 가이드: Hooks (훅 시스템)](../concepts.md#hooks)

---

## 2. 사용법 (Usage)

`defineHook`은 `config` 인스턴스를 받아 훅 맵(Hook Map)을 인자로 받는 함수를 반환합니다. 훅 맵은 사용할 훅 키(예: `'dialogue:text'`)를 키로, 객체를 값으로 가지며, 객체 내부에는 라이프사이클 메서드(`onBefore`, `onAfter`, `onceBefore`, `onceAfter`)와 콜백 함수를 정의합니다.

### 2.1. 기본 예제

```ts
// scene-forest.ts
import config from '../novel.config'
import { defineScene, defineHook } from 'fumika'

export default defineScene({
  config,
  // 씬 시작 시 훅 등록, 종료 시 해제
  hooks: defineHook(config)({
    // 1. 모듈 전용 훅
    'dialogue:text-run': {
      onBefore: (state) => {
        console.log(`현재 출력될 텍스트: ${state.text}`)
        return state
      }
    },
    // 2. 엔진 전역 훅
    'novel:next': {
      onceAfter: (value) => {
        console.log('다음 단계로 넘어갔습니다.')
        return value
      }
    }
  })
}, [ ... ])
```

---

## 3. 훅 메서드 (Methods)

각 훅 키 내에서 다음과 같은 메서드를 사용할 수 있습니다.

| 메서드 | 설명 |
| :--- | :--- |
| **`onBefore`** | 로직 실행 전 호출. 데이터를 가로채서 수정 가능. |
| **`onAfter`** | 로직 실행 후 호출. 최종 결과 확인 가능. |
| **`onceBefore`** | 단 한 번만 실행되는 `onBefore`. |
| **`onceAfter`** | 단 한 번만 실행되는 `onAfter`. |

---

## 4. 작동 원리 (How it works)

1. **자동 등록**: `defineScene`에 전달된 `hooks`는 엔진이 해당 씬을 로드할 때 내부적으로 `_register()` 메서드를 호출하여 구독을 시작합니다.
2. **자동 해제**: 씬이 종료되거나 다른 씬으로 전환될 때, 엔진은 `_unregister()`를 호출하여 등록된 모든 콜백을 제거합니다.
3. **스코프 격리**: `defineHook`을 통해 등록된 훅은 해당 씬 내부에서만 유효하므로, 다른 씬의 로직에 영향을 주지 않습니다.

---

## 5. 주의 사항 (Edge Cases)

* **중복 등록**: 동일한 훅 키에 대해 여러 개의 리스너를 등록할 수 있으며, 등록된 순서대로 실행됩니다.
* **불변성 유지**: `onBefore`에서 반환하는 값은 반드시 전달받은 `state`와 동일한 구조를 가져야 합니다.
* **엔진 훅 접두사**: 엔진 자체 훅(예: `next`, `scene-load` 등)을 구독할 때는 반드시 `novel:` 접두사를 붙여야 합니다.
