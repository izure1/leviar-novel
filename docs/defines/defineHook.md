# ⚓ 훅 빌더 (defineHook)

## 개요 (Overview)

`defineHook`은 특정 씬(Scene)이 진행되는 동안에만 작동하는 이벤트(Hook)를 정의할 때 사용합니다.  
대사가 출력되기 직전에 글자를 바꾸거나, 다음 씬으로 넘어갈 때 특정 동작을 실행하는 등 엔진의 흐름에 개입할 수 있습니다.  

## 사전 준비 (Prerequisites)

이벤트를 등록할 대상 모듈들의 정보를 알기 위해 `novel.config.ts`의 설정 객체(`config`)를 불러와야 합니다.  

## 핵심 예제 (Main Example)

대사가 출력되기 직전에 콘솔 로그를 찍고, 씬 전환 이벤트에 개입하는 훅을 등록하는 예제입니다.  

```typescript
import { defineScene, defineHook } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  // hooks 속성에 defineHook을 사용하여 이벤트를 등록합니다
  hooks: defineHook(config)({
    // 대사가 화면에 그려지기 전(text-run)에 실행됩니다
    'dialogue:text-run': {
      onBefore: (state) => {
        console.log(`출력될 대사: ${state.text}`)
        // 수정한 상태를 반드시 반환해야 다음 단계로 정상 진행됩니다
        return state 
      }
    },
    // 엔진의 씬 전환(next) 직후에 한 번만 실행되는 훅입니다
    'novel:next': {
      onceAfter: (value) => {
        console.log('다음 씬으로 넘어갑니다.')
        return value
      }
    },
    // 변수 변경 시마다 실행되는 훅입니다
    'novel:var': {
      onBefore: (payload) => {
        console.log(`변수 ${payload.name} 변경 시도: ${payload.oldValue} -> ${payload.newValue}`)
        return payload
      }
    }
  })
})(({ set }) => [
  { type: 'dialogue', text: '이 대사가 출력되기 전에 로그가 먼저 찍힙니다.' }
])
```

## 옵션 상세

훅 이름 뒤에 객체로 정의할 수 있는 실행 시점 메서드들입니다.  

| 속성 명칭 | 설명 |
| :--- | :--- |
| **`onBefore`** | 명령어 내부 로직 실행 직전에 호출됩니다. 데이터를 수정하여 반환할 수 있습니다. |
| **`onAfter`** | 명령어 실행이 끝난 후에 호출됩니다. 최종 결과값을 확인하거나 추가 동작을 연결할 수 있습니다. |
| **`onceBefore`** | `onBefore`와 동일하게 작동하지만, 현재 씬 내에서 단 한 번만 실행된 후 사라집니다. |
| **`onceAfter`** | `onAfter`와 동일하게 작동하지만, 현재 씬 내에서 단 한 번의 실행 후 사라집니다. |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **엔진 정지 및 타입 에러** | `onBefore`나 `onAfter`에서 값을 가공했다면 반드시 원본과 동일한 형태의 객체(`state` 등)를 `return` 해야 엔진이 멈추지 않습니다. |
| **엔진 기본 이벤트 등록 실패** | 씬 전환(`next`) 등 모듈이 아닌 엔진 코어 자체의 이벤트를 잡으려면, 훅 이름 앞에 반드시 `novel:`을 붙여야 합니다. (예: `novel:next`) |
