# 🔀 예약어 및 흐름 제어 (Reserved Words & Flow Control)

이 문서는 Fumika 엔진에서 제공하는 **흐름 제어 예약어(Flow Control Builders)**의 개념과 사용법을 설명합니다. (Reference & Explanation)

---

## 1. 예약어(Reserved Words)란?

Fumika 엔진에서 **예약어**란, 시나리오의 흐름을 직접적으로 제어하기 위해 엔진 코어에서 특별히 취급하는 식별자 및 함수들을 의미합니다.  
일반적인 시나리오 커맨드(예: `dialogue`, `character`)는 각 모듈에 의해 순차적으로 실행되지만, 예약어는 이와 다릅니다.

### 예약어의 특징
*   **컴파일 타임 안전성**: 예약어는 `defineScene` 빌더(Builder) API의 매개변수로 직접 주입되어, 타입스크립트의 강력한 타입 체크를 받습니다.
*   **실행 파이프라인 우회**: 모듈 실행기(`ctx.execute`)를 거치지 않고 엔진의 씬 매니저에서 직접 호출되므로, 비동기 연출 중간에 씬이 전환되거나 종료되는 등의 복잡한 상태 변이를 안전하게 처리합니다.
*   **모듈 내 호출 불가**: 예약어는 철저히 시나리오 작성자를 위한 흐름 제어 도구이므로, 커스텀 모듈의 핸들러 내부에서 임의로 호출할 수 없도록 격리되어 있습니다.

---

## 2. 사전 준비 (Prerequisites)

*   `defineScene`을 사용할 때 배열 대신 **빌더 함수(Curried function) 방식**을 사용해야 흐름 제어 예약어를 주입받을 수 있습니다.

---

## 3. 핵심 예제 (Main Example)

빌더 함수를 통해 주입받은 흐름 제어 예약어를 사용하는 표준적인 구현 패턴입니다.

```typescript
import config from '../novel.config'
import { defineScene } from 'fumika'

export default defineScene({
  config,
  variables: {
    _tries: 0,
  }
})(({ label, goto, next, call, condition, set }) => [
  label('start'),
  
  { type: 'dialogue', text: '문을 열려고 시도했다.' },
  set('_tries', ({ _tries }) => _tries + 1),

  // 조건 분기: 지역 변수 _tries를 기반으로 평가
  condition(
    ({ _tries }) => _tries >= 3,
    [
      // 참(True)일 때 실행되는 스텝들 (ifSteps)
      { type: 'dialogue', text: '문이 마침내 부서졌다!' },
      call('scene-treasure-room', { preserve: true, restore: true }),
      goto('end'),
    ],
    [
      // 거짓(False)일 때 실행되는 스텝들 (elseSteps, 생략 가능)
      { type: 'dialogue', text: '문은 꿈쩍도 하지 않는다.' },
      goto('start'),
    ]
  ),

  label('end'),
  next('scene-corridor'),
])
```

---

## 4. 예약어 목록 (Command Reference)

### `label(name: string)`
시나리오 내부의 특정 위치를 식별하는 마커를 생성합니다.
*   **name**: 라벨의 고유 식별자.

### `goto(name: string)`
지정된 라벨 위치로 실행 흐름을 즉시 이동시킵니다.
*   **name**: 이동할 대상 라벨의 이름.

### `next(scene: string, opts?: { preserve?: boolean })`
현재 씬을 종료하고 지정된 다른 씬으로 완전히 전환합니다.
*   **scene**: 대상 씬의 식별자.
*   **preserve**: `true`일 경우 현재 씬의 오디오 및 렌더링 상태를 파괴하지 않고 유지합니다.

### `call(scene: string, opts?: { preserve?: boolean; restore?: boolean })`
다른 씬을 서브루틴(Sub-routine)으로 호출합니다. 호출된 씬이 종료되면 다시 원래 씬의 다음 스텝으로 돌아옵니다.
*   **scene**: 호출할 씬의 식별자.
*   **preserve**: `true`일 경우 현재 씬의 렌더링 상태를 유지한 채 대상 씬을 위에 덧그립니다.
*   **restore**: `true`일 경우 서브 씬 종료 후 호출자 씬의 상태(배경, 캐릭터 등)를 강제로 복구합니다.

### `set(name: string, value: any | ((vars) => any))`
변수의 값을 설정합니다. [상세 사용법은 set 문서](./set.md)를 확인하세요.
*   **name**: 변수명. `novel.config.ts`에 정의된 전역 변수이거나, 현재 씬(`defineScene`)의 `variables` 블록에 선언된 지역 변수여야 합니다. (지역 변수명은 반드시 `_`로 시작해야 합니다.)
*   **value**: 설정할 값. 정적 값 또는 현재 변수 상태를 인자로 받는 함수를 허용합니다.

### `condition(fn, ifSteps, elseSteps?)`
조건 함수 평가 결과에 따라 중첩된 스텝들을 분기 처리합니다.
*   **fn**: `((vars) => boolean) | boolean`. `vars`에는 전역 변수와 씬 지역 변수가 병합되어 전달됩니다.
*   **ifSteps**: 조건이 참일 때 실행될 `DialogueStep` 배열.
*   **elseSteps**: (선택) 조건이 거짓일 때 실행될 `DialogueStep` 배열. 생략 시 거짓이면 바로 조건문을 빠져나갑니다.

---

## 5. 주의 사항 (Edge Cases)

*   **동적 조건 배열 수정 불가**: `condition` 내부의 스텝 배열을 런타임에 동적으로 조작(`push`, `pop` 등)하려는 시도는 에러를 발생시킬 수 있으므로 지양해야 합니다.
*   **중첩 씬 메모리 누수**: `call`을 통해 씬을 호출한 후 명시적으로 종료하지 않고 내부에서 계속 `next`나 새로운 `call`을 반복하면, 호출 스택(Call Stack)이 누적되어 **메모리 누수(Memory Leak)**가 발생합니다. 서브 씬은 반드시 자연스럽게 종료(배열의 끝 도달)되어야 합니다.
*   **`ctx.execute` 사용 불가**: 이 흐름 제어 구문들은 커스텀 모듈(`NovelModule`) 내부에서 `ctx.execute()`를 통해 동적으로 실행할 수 없습니다. 타 모듈에서 흐름을 제어해야 할 경우 `ctx.scene.jumpToLabel()`, `ctx.scene.loadScene()` 등 엔진 코어 API를 직접 호출해야 합니다.
