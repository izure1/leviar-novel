# ⚙️ 엔진 코어 훅 (Novel Hooks)

## 개요 (Overview)

엔진의 핵심 로직(변수 변경, 씬 전환, 세이브/로드)이 발생할 때 이를 가로채거나 조작할 수 있는 훅입니다.  
모든 엔진 훅은 이름 앞에 `novel:` 접두사가 붙습니다.

| 훅 이름 | 페이로드 타입 | 설명 |
| :--- | :--- | :--- |
| **`novel:var`** | `NovelVarHookPayload` | 변수(전역, 지역, 환경) 값이 변경될 때 호출됩니다. 값을 수정할 수 있습니다. |
| **`novel:next`** | `boolean` | 다음 대사로 진행하려고 할 때 호출됩니다. `false`를 반환하면 진행을 차단합니다. |
| **`novel:scene`** | `string` | 새로운 씬이 로드될 때 호출됩니다. 반환값을 통해 로드될 씬의 이름을 바꿀 수 있습니다. |
| **`novel:save`** | `SaveData` | 세이브 데이터가 생성될 때 호출됩니다. 저장될 데이터를 최종적으로 가공할 수 있습니다. |
| **`novel:load`** | `SaveData` | 세이브 데이터를 불러올 때 호출됩니다. 복원될 데이터를 수정할 수 있습니다. |

---

## 핵심 예제 (Main Example)

### 1. 변수 변경 감지 및 수정 (`novel:var`)

변수가 특정 조건을 만족할 때 값을 강제로 고정하거나, 로그를 남기는 데 유용합니다.

```typescript
import { defineHook } from 'fumika'
import config from './novel.config'

export const myHook = defineHook(config)({
  'novel:var': {
    onBefore: (payload, ctx, vars) => {
      console.log(`변수 변경: ${payload.name} (${payload.oldValue} -> ${payload.newValue})`)
      
      // vars나 payload를 사용하여 조건을 검사합니다
      // 특정 변수의 값이 음수가 되지 않도록 방어 로직을 넣을 수 있습니다
      if (payload.name === 'gold' && payload.newValue < 0) {
        return { ...payload, newValue: 0 }
      }
      
      return payload
    }
  }
})
```

### 2. 진행 차단 (`novel:next`)

특정 연출이 끝나기 전까지 사용자의 '다음' 입력을 무시하고 싶을 때 사용합니다.

```typescript
novel.hooker.onBefore('novel:next', (canAdvance, ctx, vars) => {
  // 현재 긴 애니메이션이 재생 중이라면 진행을 막습니다
  if (myAnimation.isBusy()) {
    return false
  }
  return canAdvance
})
```

---

## 상세 설명 (Explanation)

### NovelVarHookPayload

`novel:var` 훅에서 전달되는 데이터의 구조입니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`name`** | `string` | 변경된 변수의 이름입니다. (예: `gold`, `_temp`, `$volume`) |
| **`oldValue`** | `any` | 변경되기 전의 원래 값입니다. |
| **`newValue`** | `any` | 변경될 새로운 값입니다. |

---

## 🔗 관련 훅 리스트 (Related Hooks)

각 모듈별로 제공되는 특수 훅들은 아래 링크에서 확인할 수 있습니다.

*   **[🔊 오디오 훅 (Audio)](./audio.md)**: 소리 재생, 중지, 볼륨 조절 관련 이벤트
*   **[💬 대화 훅 (Dialogue)](./dialogue.md)**: 대사 출력, 타이핑, 화자 변경 관련 이벤트
*   **[🗂️ 선택지 훅 (Choices)](./choices.md)**: 선택지 출력 및 선택 관련 이벤트
*   **[📥 입력 훅 (Input)](./input.md)**: 사용자 텍스트 입력 관련 이벤트
*   **[📦 대화창 훅 (DialogBox)](./dialogBox.md)**: 대화창 가시성 및 스타일 관련 이벤트

---

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **무한 루프 주의** | `novel:var` 훅 내부에서 다시 변수를 수정하는 함수를 호출하면 무한 루프에 빠질 수 있습니다. 반드시 전달받은 `payload`의 `newValue`를 수정하여 반환하는 방식을 권장합니다. |
| **동기적 실행** | 모든 훅은 동기(Synchronous) 방식으로 작동합니다. 훅 내부에서 `Promise`를 기다리거나 비동기 작업을 수행하면 엔진 흐름이 깨질 수 있습니다. |
