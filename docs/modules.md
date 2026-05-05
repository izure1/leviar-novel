# 🧩 Custom Module Development Guide

본 문서는 `fumika` 엔진의 고도화된 모듈화 아키텍처를 이해하고, 개발자가 직접 새로운 시나리오 명령어와 기능을 확장하는 방법을 안내합니다.  

---

## 1. 모듈의 기본 구조 (Core Structure) <a id="core-structure"></a>

`fumika` 엔진의 모든 기능은 독립적인 모듈 단위로 설계되어 있습니다.  
새로운 기능을 추가하려는 개발자께서는 아래의 핵심 생명주기 인터페이스를 준수하여 구현해 주시기 바랍니다.  

| 메서드 식별자 | 실행 시점 | 주요 역할 및 책임 |
| :--- | :--- | :--- |
| **`onBoot`** | 엔진 라이프사이클 초기화 시 | 시각 요소 생성, Canvas 레이어 할당 등 기초 환경을 구성합니다. |
| **`onUpdate`** | 엔진의 매 프레임 업데이트 시 | 실시간 데이터 동기화 및 캔버스 렌더링을 갱신합니다. |
| **`onCleanup`** | 씬 전환 또는 엔진 종료 시 | 할당된 메모리를 해제하고 사용 중인 리소스를 안전하게 소거합니다. |

---

## 2. 시나리오 명령어 등록 (`defineCommand`) <a id="define-command"></a>

엔진의 기능은 `define` 함수를 통해 생성된 모듈 객체에 `defineCommand`를 연결하여 시나리오 스크립트에서 사용할 수 있는 새로운 커맨드를 추가합니다.

모듈을 정의할 때 `define` 함수는 세 가지 제네릭 타입을 받습니다:
1. **Command**: 사용자가 시나리오 스크립트에서 호출할 커맨드의 속성 구조입니다 (`type` 속성 필수).
2. **State**: 세이브 데이터에 직렬화되어 보존될 모듈 고유의 내부 상태 구조입니다.
3. **Hook**: (선택) 모듈이 엔진의 훅 시스템을 통해 발행하고 수신할 커스텀 이벤트의 구조입니다.

```typescript
import { define } from 'fumika'

// 1. 모듈에서 사용할 타입들을 명시적으로 정의합니다.
export interface MyModuleCommand {
  type: 'custom'
  value: number
}

export interface MyModuleState {
  count: number
}

export interface MyModuleHook {
  // 예: 'custom:event' 발생 시 넘겨줄 데이터와 반환받을 데이터 타입. 반드시 동일한 타입을 반환해야 합니다.
  'custom:event': (value: number) => number 
}

// 2. 정의한 타입과 초기 상태(Initial State)를 주입하여 모듈을 생성합니다.
const myModule = define<MyModuleCommand, MyModuleState, MyModuleHook>({ count: 0 })

// 3. 해당 모듈의 커맨드 핸들러를 등록합니다.
myModule.defineCommand(function* (cmd, ctx, state, setState) {
  // 엔진 컨텍스트(ctx)와 모듈 상태를 활용하여 제너레이터 기반의 내부 로직을 수행합니다.
  console.log('[System] 커스텀 연출 실행:', cmd.value)
  
  // 상태 업데이트
  setState({ count: state.count + 1 })
  
  return true // 즉시 다음 커맨드로 넘어갑니다.
})

export default myModule
```

---

## 3. UI 인터페이스 확장 (`defineView`) <a id="define-view"></a>

화면 내에 지속적으로 남아있는 인터페이스(대사창, 선택지 버튼 등)를 구축할 때 `defineView`를 활용합니다. 엔진의 UI 레지스트리에 등록되어 가시성 상태(`show`, `hide`)를 정교하게 제어받으며, 저장된 상태에 기반하여 즉시 화면을 렌더링할 수 있습니다.

```typescript
myModule.defineView((ctx, state, setState) => {
  const uiElement = document.createElement('div')
  uiElement.innerText = `Count: ${state.count}`

  return {
    show: () => { uiElement.style.display = 'block' },
    hide: () => { uiElement.style.display = 'none' },
    onCleanup: () => { uiElement.remove() }
  }
})
```

---

## 4. 엔진 컨텍스트 (`Context`) 자원 활용 <a id="context"></a>

모듈 내부에서는 전달받은 `ctx` 객체를 통해 엔진의 핵심 서브시스템에 안전하게 접근할 수 있습니다.  

*   **`ctx.renderer`**: Canvas 기반의 그래픽 렌더링 엔진에 직접 접근하여 물리 객체를 제어합니다.  
*   **`ctx.variables`**: 엔진의 상태 저장소에 접근하여 전역 및 지역 변수를 조회하거나 수정합니다.  
*   **`ctx.audio`**: 오디오 시스템을 제어하여 사운드 재생 및 믹싱 작업을 수행합니다.  
*   **`ctx.hooker`**: 엔진의 이벤트 라이프사이클에 개입하여 커스텀 훅을 실행합니다.  

---

## 5. 모듈 상태 보존 및 복원 (Module State Persistence) <a id="state-persistence"></a>

Fumika 엔진은 비주얼 노벨의 특성상 완벽한 세이브/로드를 지원해야 하므로, 커스텀 모듈 내부에 존재하는 고유한 상태(예: 미니게임 점수, 진행 중인 애니메이션 단계 등) 역시 엔진의 상태 관리 파이프라인에 편입되어야 합니다.

이를 위해 엔진은 모듈 개발 시 `define` 함수에 **초기 상태(Initial State)**를 주입하게 하며, 핸들러에서 제공하는 `state`와 `setState` 파라미터를 통해 상태를 조작하게 합니다. 이 상태 객체는 `novel.save()` 호출 시 자동으로 직렬화되어 세이브 파일(`SaveData.states`)에 포함됩니다.

### 5.1. 상태 업데이트 및 반응형 렌더링 (`setState`)

모듈의 내부 상태가 변경되어 진행 상황을 보존해야 할 때마다, 핸들러가 제공하는 `setState()`를 호출하여 상태를 기록하십시오. `setState`는 기존 상태 객체를 안전하게 병합하며, **React나 Vue의 상태 관리처럼 동작**합니다.

즉, `setState()`가 호출되어 상태가 변경되면, `defineView`에서 반환한 `onUpdate` 훅이 자동으로 호출되어 화면을 새로운 상태에 맞게 동기화합니다.

```typescript
myModule.defineCommand(function* (cmd, ctx, state, setState) {
  // 1. 미니게임 로직 수행 후 상태 변경
  const currentScore = cmd.score
  
  // 2. 모듈 고유의 상태를 엔진에 저장
  // 이 순간 state가 병합 저장되고, View의 onUpdate가 자동 트리거됩니다.
  setState({ score: currentScore, isPlaying: true })
  
  return true // 즉시 다음 커맨드로 넘어갑니다.
})
```

### 5.2. 상태 복원 및 View 동기화 (`defineView`)

플레이어가 세이브 파일을 로드하면 엔진은 저장된 데이터를 바탕으로 상태를 복원하고 뷰를 갱신합니다. 모듈 개발자는 핸들러와 뷰 빌더에 주입되는 `state` 파라미터를 사용하여 즉각적으로 화면과 로직을 일치시켜야 합니다.

1. **명령어 로직 복원**: `defineCommand` 제너레이터 내부에서 주입되는 `state` 파라미터를 통해 직전 상태를 읽고 로직을 재개합니다.
2. **UI 및 시각 요소 복원 (`defineView` 및 `onUpdate`)**: 씬에 진입하거나 세이브 데이터를 로드할 때 엔진이 `defineView`를 실행하여 뷰 객체를 초기화한 뒤, 일관성을 위해 **즉시 `onUpdate` 훅을 1회 강제 실행**합니다. 이후에는 `setState`로 상태가 변경될 때마다 `onUpdate`만 자동으로 반복 호출됩니다.

```typescript
myModule.defineView((ctx, state, setState) => {
  // 1. 최초 1회 leviar 렌더 객체(뼈대)를 생성합니다.
  const scoreTextObj = ctx.world.createText({
    attribute: { text: '' }, // 텍스트는 onUpdate에서 주입됨
    style: { fontSize: 24, color: '#ffffff', opacity: 0 },
    transform: { position: { x: 0, y: 0, z: 0 } }
  })
  
  // 카메라 자식으로 부착합니다.
  ctx.world.camera?.addChild(scoreTextObj)

  return {
    show: (duration = 200) => { scoreTextObj.fadeIn(duration) },
    hide: (duration = 200) => { scoreTextObj.fadeOut(duration) },
    
    // 2. 씬 전환 시 명시적으로 객체를 제거하여 메모리 누수를 방지합니다.
    onCleanup: () => {
      scoreTextObj.remove({ child: true })
    },
    
    // 3. 초기 렌더링(1회 강제 실행) 및 상태 변경 시 자동 호출됩니다.
    // 이 곳에 시각 요소를 최신 데이터로 동기화하는 로직을 일원화하십시오.
    onUpdate: (_ctx, newState) => { 
      scoreTextObj.attribute.text = `Score: ${newState.score}` 
    },
    
    onCleanup: () => { scoreTextObj.remove({ child: true }) }
  }
})
```

### 5.3. 뷰 라이프사이클 메서드 (View Lifecycle)

`defineView` 콜백이 반환하는 객체는 엔진의 UI 매니저에 등록되며, 상황에 맞게 각 메서드가 자동으로 호출됩니다.

| 메서드 식별자 | 호출 시점 및 주요 역할 |
| :--- | :--- |
| **`show(duration?)`** | 모듈의 시각 요소가 화면에 나타나야 할 때 호출됩니다. 파라미터로 전달된 `duration`(ms)을 바탕으로 `fadeIn` 등의 등장 애니메이션을 처리해야 합니다. |
| **`hide(duration?)`** | 모듈의 시각 요소가 화면에서 사라져야 할 때 호출됩니다. `duration`을 바탕으로 `fadeOut` 등의 퇴장 애니메이션을 처리합니다. |
| **`onUpdate(newState)`** | 모듈의 상태가 `setState`에 의해 변경될 때 즉각 호출됩니다. 반환된 최신 상태를 바탕으로 렌더 객체의 텍스트, 색상, 위치 등을 갱신하여 화면을 최신화합니다. (뷰 최초 생성 직후 1회 자동 호출됩니다) |
| **`onCleanup()`** | 씬이 종료되거나 전환될 때 호출됩니다. 이곳에서 명시적으로 객체를 제거하거나 해제하여 메모리 누수를 방지해야 합니다. |

### ⚠️ 주의 사항 (Edge Cases)

*   **직렬화 가능성 (Serializable)**: `setState()`로 전달하는 상태 내부에는 함수(Function)나 렌더링 관련 시각 객체, 그리고 서로를 참조하는 순환 참조 객체를 절대 포함해서는 안 됩니다. 오직 JSON으로 변환 가능한 일반 순수 객체만 저장해야 세이브/로드 시 치명적인 에러가 발생하지 않습니다.
*   **엔진의 호출 라이프사이클**: `defineView`는 씬 진입 시와 세이브 로드 시 엔진에 의해 단 한 번 호출되어 View 객체를 구성합니다. 이 안에서 동적 상태를 엮기 위해서는 내부에 클로저 변수를 유지하거나, `onUpdate` 훅 등을 통해 상태와 화면을 동기화해야 합니다.

---

## 6. 결론 및 참조 <a id="conclusion"></a>

모듈화 설계를 통해 `fumika` 엔진의 가능성을 무한히 확장해 보시기 바랍니다.  
구체적인 API 명세와 내부 구현 원리에 대한 추가 정보는 소스 코드 내의 기술 주석 및 **[Core Concepts](./concepts.md)** 문서를 참조해 주십시오.  
