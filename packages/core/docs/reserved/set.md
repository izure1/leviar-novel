# 🔢 변수 조작 (Set)

## 개요 (Overview)

`set` 예약어는 시나리오 진행 중 게임 내 변수의 상태를 동적으로 제어하고 관리하는 기능입니다.  
이름의 **접두사**에 따라 환경변수, 전역변수, 지역변수 세 가지 스코프를 구분합니다.  

## 변수 스코프 (Scope)

| 접두사 | 스코프 | 생명주기 | 세이브 방식 |
| :--- | :--- | :--- | :--- |
| `$` | **환경변수** | 게임 전체 (모든 세이브 공유) | `novel.saveEnv()` 수동 저장 |
| _(없음)_ | **전역변수** | 세이브 슬롯 단위 | `novel.save()` 자동 포함 |
| `_` | **지역변수** | 현재 씬 내 | `novel.save()` 자동 포함 |

## 옵션 상세 (Properties)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`name`** | `string` | 변경할 변수의 이름. 접두사(`$`, `_`, 없음)로 스코프가 결정됩니다. |
| **`value`** | `any \| Function` | 설정할 새로운 값. 값 자체를 넣거나, 현재 변수 상태를 받아 연산하는 함수(Resolvable)를 넣을 수 있습니다. Resolvable에는 세 스코프의 변수가 모두 전달됩니다. |

## 핵심 예제 (Main Example)

### 세 가지 스코프 모두 사용

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  variables: { _tries: 0 }
})(({ set, condition }) => [
  // 1. 환경변수 ($): 모든 세이브에서 공유. novel.saveEnv()로 수동 저장.
  set('$seenEnding', true),

  // 2. 전역변수: 현재 세이브 슬롯에 저장.
  set('affection', 50),

  // 3. 지역변수 (_): 씬이 끝나면 자동으로 소멸.
  set('_tries', 1),
  { type: 'dialogue', text: '조사 횟수: {{_tries}}' },

  // 4. Resolvable — 콜백에 세 스코프 변수가 모두 전달됩니다.
  set('affection', ({ affection, _tries, $seenEnding }) =>
    $seenEnding ? affection + 10 : affection + _tries
  ),
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **저장 불가능한 데이터 에러** | 모든 변수는 JSON으로 직렬화됩니다. 함수, DOM 엘리먼트 등 직렬화할 수 없는 객체를 담으면 세이브 에러가 발생합니다. |
| **지역변수 스코프 자동 격리** | `_` 접두사 지역변수는 씬을 벗어나는 순간 영구 삭제됩니다. 다른 씬에서도 써야 할 데이터는 전역변수를 사용하십시오. |
| **환경변수 수동 저장 필요** | `$` 접두사 환경변수는 `novel.save()`에 포함되지 않습니다. 별도로 `novel.saveEnv()`를 호출하여 저장하십시오. 자세한 내용은 [환경변수 문서](./environments.md)를 참조하세요. |
