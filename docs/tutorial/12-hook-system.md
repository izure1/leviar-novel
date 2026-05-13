# 12. 이벤트 훅 시스템: 생명주기 제어

이 페이지에서는 `defineHook`을 사용하여 엔진 내부에서 발생하는 이벤트를 가로채거나 구독하는 방법을 다룹니다.  
이벤트 훅을 활용하면 핵심 로직을 분리하여 코드를 훨씬 깔끔하게 유지할 수 있습니다.

## 동기

특정 체력 변수(`hp`)가 0이 될 때마다 게임 오버 화면으로 이동시키고 싶다고 가정해 볼까요?  
만약 훅(Hook) 시스템이 없다면, 체력이 깎일 수 있는 모든 씬에 조건 분기 명령어를 수동으로 끼워넣어야 합니다.

```typescript
// ❌ 이렇게 하면 안 됩니다
export default defineScene({ config })(({ condition, goto, label }) => [
  { type: 'var', name: 'hp', value: 0 },
  condition(
    ({ hp }) => hp <= 0,
    [{ type: 'next', scene: 'scene-game-over' }]
  ),
  { type: 'dialogue', text: '전투가 계속됩니다.' }
])
```

이런 반복적인 로직은 엔진의 이벤트를 구독하여 전역적으로 한 곳에서 처리하는 것이 훨씬 안전하죠.

## 기본 사용법

씬을 정의할 때 `hooks` 속성에 `defineHook`의 결과를 전달하면, 해당 씬이 실행되는 동안 발생하는 이벤트를 감지할 수 있습니다.  
어렵게 생각하지 마세요. `novel:var` 이벤트를 구독해 변수 변경을 감지하는 단순한 작업부터 시작해 봅시다.

```typescript
// ✅ 이렇게 하세요
import { defineScene, defineHook } from 'fumika'

export default defineScene({ 
  config,
  hooks: defineHook(config)({
    'novel:var': {
      onAfter: (payload, ctx) => {
        // hp 변수가 0 이하로 떨어지면 게임 오버 씬으로 전환
        if (payload.name === 'hp' && payload.newValue <= 0) {
          ctx.novel.loadScene('scene-game-over')
        }
        return payload
      }
    }
  })
})(({ label }) => [
  { type: 'var', name: 'hp', value: 0 },
  { type: 'dialogue', text: '이 대사는 출력되지 않습니다.' }
])
```

> [!TIP]
> 씬 스코프 훅은 해당 씬이 시작될 때 자동으로 등록되고, 씬이 종료되거나 다른 씬으로 넘어갈 때 자동으로 해제됩니다.  
> 직접 해제할 필요가 없으니 안심하세요!

## 점진적 심화

훅 시스템은 단순히 값을 읽는 것을 넘어, 커맨드의 실행을 가로채어 데이터를 변조할 수도 있습니다.  
`onBefore`를 사용해 명령어가 실제로 화면에 렌더링되기 직전에 파라미터를 원하는 대로 수정할 수 있습니다.

```typescript
// ✅ 이렇게 하세요
export default defineScene({ 
  config,
  hooks: defineHook(config)({
    'dialogue:text-render': {
      onBefore: (payload) => {
        return {
          ...payload,
          text: `[시스템] ${payload.text}`
        }
      }
    }
  })
})(({ label }) => [
  { type: 'dialogue', text: '경고가 발생했습니다.' } 
])
```

> [!WARNING]
> `onBefore`나 `onAfter` 콜백에서는 반드시 전달받은 페이로드(cmd 또는 payload)를 다시 반환(`return`)해야 합니다.  
> 반환하지 않으면 파라미터가 유실되어 엔진이 멈출 수 있으니 주의해 주세요.

## 다음 단계

엔진의 이벤트를 제어할 수 있게 되었다면, 이제 게임 진행 상황을 영구적으로 보존할 차례입니다.  
다음 장에서는 세이브/로드 화면을 직접 구현하는 방법을 다룹니다.

* **[13. 세이브/로드 화면 구현](./13-save-load.md)**
