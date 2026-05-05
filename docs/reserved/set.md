# 🔢 변수 조작 (Set)

## 개요 (Overview)

`set` 예약어는 시나리오 진행 중 게임 내 변수(전역 변수, 지역 변수)의 상태를 동적으로 제어하고 관리하는 기능입니다.  

## 옵션 상세 (Properties)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`name`** | `string` | 변경하고자 하는 변수의 식별자 이름. 전역 변수이거나 현재 씬의 지역 변수여야 합니다. |
| **`value`** | `any \| Function` | 설정할 새로운 값. 값 자체를 넣거나, 기존 상태를 받아 동적으로 연산하는 함수(Resolvable)를 넣을 수 있습니다. |

## 핵심 예제 (Main Example)

### 전역 및 지역 변수 업데이트

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  variables: { _investigation_count: 0 } // _로 시작하는 지역 변수를 선언합니다
})(({ set }) => [
  // 1. 단순한 전역 변수 값 업데이트
  set('affection', 50),
  set('has_item_key', true),
  
  // 2. 지역 변수 업데이트 (이 지역 변수는 씬이 끝나면 자동으로 소멸됩니다)
  set('_investigation_count', 1),
  { type: 'dialogue', text: '주변을 세밀하게 조사하였습니다.' },

  // 3. 기존 상태를 참조하는 동적 업데이트 (Resolvable 연산)
  // 현재 HP 상태를 참조하여 최대치(100)를 초과하지 않도록 20만큼 회복시킵니다
  set('hp', ({ hp }) => Math.min(100, hp + 20))
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **저장 불가능한 데이터 에러** | 엔진의 모든 변수는 게임 저장 시 텍스트(JSON)로 직렬화되어 보존됩니다. 따라서 함수, DOM 엘리먼트 등 직렬화할 수 없는 객체를 변수에 담으면 세이브 에러가 발생하여 게임이 고장납니다. |
| **스코프 자동 격리** | 지역 변수명은 반드시 `_`(언더스코어)로 시작해야 합니다. 이 지역 변수는 다른 씬으로 넘어가면 메모리 확보를 위해 자동으로 영구 삭제되므로, 다른 씬에서도 써야 할 데이터라면 전역 변수를 쓰십시오. |
