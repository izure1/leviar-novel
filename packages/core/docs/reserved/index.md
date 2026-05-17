# 🔀 예약어 및 흐름 제어 (Reserved Words)

## 개요 (Overview)

이 문서는 Fumika 엔진에서 시나리오의 흐름을 직접적으로 제어하기 위해 사용하는 예약어(Flow Control Builders)의 사용법을 기술합니다.  
예약어는 일반 모듈과 달리 시나리오 빌더(`defineScene`)에서 매개변수로 직접 주입받아 사용하며, 씬(Scene) 간의 이동이나 분기 등 엔진 코어 레벨의 제어를 담당합니다.  

## 예약어 상세 목록 (Properties)

| 예약어 | 인자 | 설명 |
| :--- | :--- | :--- |
| **`label`** | `name: string` | 시나리오 내부의 특정 위치를 식별하는 마커(이정표)를 생성합니다. |
| **`goto`** | `name: string` | 지정된 라벨 위치로 실행 흐름을 즉시 점프시킵니다. |
| **`next`** | `scene: string, opts?: { preserve?: boolean }` | 현재 씬을 완전히 종료하고 지정된 다른 씬으로 넘어갑니다. |
| **`call`** | `scene: string, opts?: { preserve?: boolean, restore?: boolean }` | 다른 씬을 서브루틴으로 호출합니다. 호출된 씬이 끝나면 원래 씬의 다음 줄로 되돌아옵니다. |
| **`set`** | `name: string, value: any` | [변수의 값을 직접 설정](./set.md)하거나 연산합니다. `$` 접두사는 [환경변수](./environments.md), `_` 접두사는 지역변수, 그 외는 전역변수를 조작합니다. |
| **`condition`** | `fn: Function, ifSteps: array, elseSteps?: array` | 조건 함수 평가 결과에 따라 내부 스텝들을 분기 처리합니다. 콜백에서 환경변수(`$`), 전역변수, 지역변수(`_`) 모두 접근 가능합니다. |

## 핵심 예제 (Main Example)

### 조건 분기 및 씬 이동

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  variables: { _tries: 0 }
})(({ label, goto, next, call, condition, set }) => [
  label('start'),
  
  { type: 'dialogue', text: '굳게 닫힌 문을 열려고 시도했다.' },
  set('_tries', ({ _tries }) => _tries + 1),

  // 조건 분기: 지역 변수 _tries를 평가합니다
  condition(
    ({ _tries }) => _tries >= 3,
    [
      // 참(True)일 때 실행되는 스텝들 (ifSteps)
      { type: 'dialogue', text: '문이 마침내 부서졌다!' },
      
      // 서브 씬 호출 후 원래 위치로 돌아옵니다
      call('scene-treasure-room', { preserve: true, restore: true }),
      goto('end')
    ],
    [
      // 거짓(False)일 때 실행되는 스텝들 (elseSteps)
      { type: 'dialogue', text: '문은 꿈쩍도 하지 않는다.' },
      goto('start')
    ]
  ),

  label('end'),
  next('scene-corridor')
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **동적 배열 수정 불가** | `condition` 내부에 전달한 배열을 런타임에 동적으로 조작(`push`, `pop` 등)하려는 시도는 파서 에러를 발생시킬 수 있으므로 금지됩니다. |
| **중첩 씬 메모리 누수** | `call`을 통해 씬을 호출한 뒤 배열의 끝에 도달하여 정상적으로 씬을 끝내지 않고, 내부에서 계속 `next`나 새로운 `call`을 남발하면 콜 스택(Call Stack)이 누적되어 메모리 누수가 발생합니다. |
