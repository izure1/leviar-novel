# 11. 커스텀 모듈: 엔진 기능 확장하기

이 페이지에서는 새로운 명령어를 정의하여 엔진의 기능을 확장하는 방법을 다룹니다.  
기본 제공되는 명령어만으로는 구현하기 까다로운 복잡한 동작을 하나의 모듈로 캡슐화할 수 있습니다.

## 동기

체력바나 복잡한 상태 표시 UI를 만든다고 가정해 볼까요?  
만약 기본 `element` 명령어만 사용해서 화면에 여러 UI 요소들을 띄우려 한다면 코드가 굉장히 지저분해집니다.

```typescript
// ❌ 이렇게 하면 안 됩니다
export default defineScene({ config })(({ label }) => [
  { type: 'element', id: 'stat-bg', kind: 'rect' },
  { type: 'element', id: 'stat-name', kind: 'text' },
  { type: 'element', id: 'stat-hp', kind: 'text' }
])
```

복잡한 상호작용이 필요한 인터페이스는 별도의 모듈로 분리하는 것이 훨씬 좋습니다.  
직접 명령어를 설계하면, 단 한 줄의 코드로 여러 동작을 묶어 처리할 수 있답니다.

## 기본 사용법: 모듈의 3요소 (Schema, Command, View)

Fumika 엔진의 커스텀 모듈은 철저하게 데이터와 화면이 분리된 MVC 구조를 가집니다.  
모듈을 만들기 위해서는 **상태 스키마(Schema)**, **명령어 로직(Command)**, **렌더링(View)** 세 가지를 정의해야 합니다.

### 1. 상태 스키마 (State Schema) 정의

가장 먼저 엔진이 추적하고 저장할 데이터의 타입과 초기 상태를 정의합니다.  
이 상태 데이터는 세이브 파일에 그대로 기록되며, 렌더링의 기준이 됩니다.

```typescript
// ✅ 이렇게 하세요
import { define } from 'fumika'

// 1. 명령어의 구조 (씬에서 작성할 타입)
interface StatusCmd { type: 'status', action: 'show' | 'hide', hp?: number }
// 2. 엔진이 추적할 모듈의 상태 스키마
interface StatusState { isOpen: boolean, currentHp: number }

// 3. 모듈을 선언하고 초기 상태값을 부여합니다
const statusModule = define<StatusCmd, StatusState>({ isOpen: false, currentHp: 100 })
```

> [!DANGER]
> 상태 객체 `StatusState` 내부에는 함수나 DOM 요소 등을 절대 넣지 마세요.  
> 엔진의 세이브/로드 기능이 정상적으로 동작하려면 직렬화 가능한 순수한 데이터 구조만 포함해야 합니다.

### 2. 명령어 로직 (Command) 구현

이제 씬 코드에서 호출될 명령어가 어떻게 상태를 변경할지 `defineCommand`로 정의합니다.  
여기서는 절대로 화면(DOM)을 직접 조작하지 않고, 오직 상태(`state`)만 갱신합니다.

```typescript
// ✅ 이렇게 하세요
statusModule.defineCommand(function* (cmd, ctx, state, setState) {
  // 명령어의 action에 따라 상태를 변경합니다
  if (cmd.action === 'show') {
    setState({ isOpen: true, currentHp: cmd.hp ?? state.currentHp })
  } else {
    setState({ isOpen: false })
  }
  
  // 명령어 처리가 완료되었음을 알립니다 (true 반환 시 다음 명령어로 넘어감)
  return true 
})
```

> [!NOTE]
> `setState` 함수로 상태를 변경하면 이 변경 사항이 엔진의 히스토리에 안전하게 기록됩니다.  
> `setState`가 호출되는 즉시 뒤이어 설명할 View의 `onUpdate`가 연쇄적으로 실행됩니다.

## 점진적 심화 1: 제너레이터(Generator)를 통한 실행 흐름 제어

`defineCommand`에 전달하는 함수는 일반 함수가 아닌 **제너레이터(`function*`)** 입니다.  
엔진의 `novel.next()`가 호출될 때마다, 내부적으로는 현재 실행 중인 명령어의 `iterator.next()`가 호출되어 실행 흐름을 평가합니다.

실제 엔진의 `control` 모듈이 씬의 진행을 멈추고 시간을 제어하는 방식을 살펴봅시다.

```typescript
// ✅ 이렇게 하세요
// src/modules/control.ts
controlModule.defineCommand(function* (cmd, ctx, state, setState) {
  const now = Date.now() + cmd.duration

  // 지정된 시간(duration)이 지날 때까지 루프를 돌며 대기합니다
  while (Date.now() < now) {
    // yield false를 반환하면 씬의 진행이 멈추고 다음 명령어로 넘어가지 않습니다
    yield false
  }

  // 루프를 빠져나와 true를 반환하면 비로소 다음 명령어로 진행됩니다
  return true
})
```

이처럼 `yield false`를 사용하면 명령어의 실행을 일시 정지시킬 수 있습니다.  
애니메이션이 끝날 때까지 기다리거나 플레이어의 특정 입력을 요구할 때 이 제너레이터 패턴을 활용하여 다음 명령어로 넘어가는 시점을 완벽하게 통제할 수 있습니다.

## 점진적 심화 2: 렌더링 뷰 (View) 구현

데이터 상태를 관리하게 되었으니 이제 화면에 보일 모습을 구현할 차례입니다.  
`defineView` 함수는 씬(Scene)이 시작될 때 **단 한 번 호출되어** 엔진의 그래픽 객체(`LeviarObject`)를 초기 생성하는 역할을 맡습니다.

초기 생성이 끝난 후, `defineView`는 씬의 생명주기와 동기화될 객체(`UIRuntimeEntry`)를 엔진에 반환해야 합니다.  
반환하는 객체의 구조(Shape)는 다음과 같습니다.

| 속성명 | 타입 | 설명 |
|---|---|---|
| `onUpdate` | `(ctx, state, setState) => void` | `setState`가 호출될 때마다 실행되어 데이터와 화면을 동기화합니다. |
| `onCleanup` | `() => void` | 씬이 종료되거나 화면이 지워질 때 호출되어 DOM 요소 등을 정리합니다. |
| `show` | `(duration: number) => void` | (선택) UI가 화면에 나타날 때 호출되는 페이드인 연출을 정의합니다. |
| `hide` | `(duration: number) => void` | (선택) UI가 화면에서 사라질 때 호출되는 페이드아웃 연출을 정의합니다. |
| `canAdvance` | `() => boolean` | (선택) `false` 반환 시 타이핑/애니메이션 진행 중으로 간주하여 `novel.next()` 흐름을 차단합니다. |

이 구조를 바탕으로 실제 뷰를 구현해 봅시다.

```typescript
// ✅ 이렇게 하세요
statusModule.defineView((ctx, state, setState) => {
  // 1. 초기 생성 영역 (씬 시작 시 단 한 번 실행됨)
  // DOM 대신 엔진의 월드 객체를 이용해 텍스트 요소를 생성합니다.
  const hpText = ctx.world.createText({
    attribute: { text: `현재 체력: ${state.currentHp}` },
    style: {
      fontSize: 24,
      color: '#ffffff',
      display: 'none' // 초기에는 숨김
    },
    transform: { position: { x: 50, y: -50 } }
  })
  
  // 생성한 요소를 UI처럼 동작하게 하려면 화면(카메라)에 부착합니다.
  ctx.world.camera?.addChild(hpText)
  
  // 2. 생명주기 관리 객체 반환
  return {
    onUpdate: (ctx, state, setState) => {
      // 상태(state) 값을 읽어 화면에 반영합니다
      hpText.style.display = state.isOpen ? 'block' : 'none'
      hpText.attribute.text = `현재 체력: ${state.currentHp}`
    },
    
    onCleanup: () => { 
      // 씬 종료 시 불필요해진 그래픽 요소를 씬 그래프에서 완전히 삭제합니다
      hpText.remove({ child: true }) 
    }
  }
})
```

화면을 갱신하는 복잡한 로직은 오직 `onUpdate` 내부에만 작성하면 됩니다.  
명령어(`defineCommand`)에서 `setState`를 호출하면 엔진이 자동으로 `onUpdate`를 실행해 주므로, 데이터와 화면이 항상 일치하게 유지됩니다.

> [!WARNING]
> `defineView`의 반환 객체에 `onCleanup` 함수를 반드시 구현해 주세요.  
> 씬이 전환되거나 종료될 때 이 함수가 호출되어야 이전 UI가 화면에 지워지지 않고 남는 버그를 방지할 수 있습니다.

이제 씬 코드에서 직접 정의한 `type: 'status'` 명령어를 자유롭게 사용할 수 있습니다.  
아래처럼 호출하면 화면에 직접 만든 UI가 렌더링되고 체력이 갱신됩니다.

```typescript
// ✅ 이렇게 하세요: 씬 코드에서 커스텀 명령어 호출
export default defineScene({ config })(() => [
  { type: 'status', action: 'show', hp: 100 },
  { type: 'dialogue', text: '화면에 상태창이 나타났습니다.' },
  
  // 상태(state)만 갱신하면 View(onUpdate)가 알아서 화면을 바꿔줍니다
  { type: 'status', action: 'show', hp: 50 },
  { type: 'dialogue', text: '함정에 빠져 체력이 반으로 줄었습니다!' }
])
```

이처럼 커스텀 모듈을 활용하면 원하는 모든 기능을 엔진에 안전하고 유연하게 추가할 수 있습니다.

## 다음 단계

커스텀 모듈 작성을 마쳤다면, 이제 엔진의 생명주기 이벤트를 가로채고 제어하는 방법을 알아볼 차례입니다.  
다음 장에서는 훅(Hook) 시스템을 다룹니다.

* **[12. 이벤트 훅 시스템: 생명주기 제어](./12-hook-system.md)**
