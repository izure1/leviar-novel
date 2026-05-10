# 🧩 커스텀 모듈 개발 (Custom Modules)

## 개요 (Overview)

`fumika` 엔진은 새로운 연출 명령어와 기능을 확장할 수 있는 모듈 시스템을 제공합니다.  
모듈 개발 시 반드시 정의해야 하는 3가지 핵심 요소는 다음과 같습니다.  

| 요소 | 인터페이스 명칭 | 설명 |
| :--- | :--- | :--- |
| **명령어 (Command)** | `Command` | 시나리오 스크립트에서 이 모듈을 호출할 때 사용할 명령어의 구조와 속성값들입니다. |
| **상태 (State)** | `State` | 모듈이 세이브 파일에 영구적으로 보존해야 할 내부 상태 데이터 구조입니다. |
| **이벤트 (Hook)** | `Hook` | 이 모듈이 엔진 내부 시스템이나 다른 모듈과 주고받을 이벤트 훅의 스키마입니다. |

모듈은 위의 데이터 구조와 시나리오 명령어 로직(`defineCommand`), 그리고 화면에 렌더링되는 UI(`defineView`)를 하나의 파일로 묶어 관리합니다.  

## 사전 준비 (Prerequisites)

모듈에서 사용할 타입(명령어, 세이브에 저장될 상태, 주고받을 훅 이벤트)을 먼저 정의해야 합니다.  

## 핵심 예제 (Main Example)

아래는 카운터를 화면에 띄우고 숫자를 더하는 간단한 커스텀 모듈 예제입니다.  

### 1. 타입 정의 및 모듈 생성

명령어 속성, 저장될 상태, 그리고 사용할 이벤트를 정의합니다.  

```typescript
import { define } from 'fumika'

// 1. 시나리오에서 사용할 커맨드의 속성 타입입니다
export interface MyModuleCommand {
  type: 'custom'
  value: number
}

// 2. 세이브 데이터에 영구 저장될 모듈의 내부 상태입니다
export interface MyModuleState {
  count: number
}

// 3. 엔진 내부 시스템과 주고받을 이벤트 훅입니다
export interface MyModuleHook {
  // 예: 'custom:event' 발생 시 넘겨줄 데이터와 반환받을 데이터 타입. 반드시 동일한 타입을 반환해야 합니다.
  'custom:event': (value: number) => number 
}

// 초기 상태(0)를 주입하여 모듈 인스턴스를 생성합니다
const myModule = define<MyModuleCommand, MyModuleState, MyModuleHook>({ count: 0 })
```

### 2. 명령어 로직 구현 (`defineCommand`)

시나리오 진행 중 해당 명령어를 만났을 때 실행될 로직을 제너레이터 함수로 작성합니다. 콜백 함수의 매개변수는 다음과 같습니다.

| 매개변수 | 설명 |
| :--- | :--- |
| **`cmd`** | 명령어 호출 시 사용했던 속성값들입니다. |
| **`ctx`** | 명령어를 호출했던 씬(Scene)의 정보를 담고 있는 컨텍스트입니다. |
| **`state`** | 현재 모듈에 저장된 상태 데이터입니다. |
| **`setState`** | 모듈의 상태를 갱신하는 함수로, 호출 시 화면 UI와 동기화됩니다. |

```typescript
myModule.defineCommand(function* (cmd, ctx, state, setState) {
  // 모듈의 상태를 갱신합니다 (상태 갱신 시 화면이 자동으로 연동됨)
  setState({ count: state.count + cmd.value })
  
  // true를 반환하면 엔진이 대기하지 않고 즉시 다음 시나리오 명령어를 실행합니다
  return true 
})
```

### 3. 화면 UI 구현 (`defineView`)

명령어나 상태가 바뀌면 화면을 다시 그릴 수 있도록 뷰(View)를 정의합니다. 초기화 콜백 함수의 매개변수는 다음과 같습니다.

| 매개변수 | 설명 |
| :--- | :--- |
| **`ctx`** | 명령어를 호출했던 씬(Scene)의 정보를 담고 있는 컨텍스트입니다. |
| **`state`** | 렌더링에 사용할 모듈의 초기 상태 데이터입니다. |
| **`setState`** | 내부 인터랙션 등에 의해 상태를 갱신해야 할 때 사용하는 함수입니다. |

```typescript
myModule.defineView((ctx, state, setState) => {
  // 1. 화면에 띄울 뼈대 객체를 만듭니다
  const uiElement = document.createElement('div')
  document.body.appendChild(uiElement)

  return {
    show: () => { uiElement.style.display = 'block' },
    hide: () => { uiElement.style.display = 'none' },
    
    // 상태가 변경될 때마다 자동으로 호출되어 텍스트를 최신화합니다
    onUpdate: (_ctx, newState) => { 
      uiElement.innerText = `Count: ${newState.count}` 
    },
    
    // 씬이 끝날 때 엘리먼트를 지워 메모리 누수를 막습니다
    onCleanup: () => { uiElement.remove() }
  }
})

export default myModule
```

## 옵션 상세 (Lifecycle)

`defineView`가 반환해야 하는 라이프사이클 메서드입니다.  

| 메서드 명칭 | 호출 시점 및 주요 역할 |
| :--- | :--- |
| **`show(duration?)`** | UI가 화면에 나타날 때 호출됩니다. 페이드인 효과 등을 처리합니다. |
| **`hide(duration?)`** | UI가 화면에서 사라질 때 호출됩니다. 페이드아웃 효과 등을 처리합니다. |
| **`onUpdate(newState)`** | 뷰 최초 생성 직후 1회 호출되며, 이후 `setState`로 상태가 바뀔 때마다 자동 호출됩니다. 화면을 최신 상태로 동기화합니다. |
| **`onCleanup()`** | 씬이 완전히 전환될 때 호출됩니다. 생성한 DOM이나 렌더 객체를 명시적으로 파괴하여 누수를 방지해야 합니다. |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **세이브 파일 로드 에러** | `setState()`로 저장하는 데이터 안에는 함수, DOM 객체, 렌더링 파트 객체가 포함되면 안 됩니다. 오직 순수한 JSON 데이터(문자열, 숫자, 배열, 일반 객체)만 넣어야 세이브가 깨지지 않습니다. |
| **화면 UI 텍스트 미갱신** | 렌더링할 객체의 텍스트나 디자인이 바뀌지 않는다면, 객체 자체를 직접 수정하지 말고 `setState()` 함수를 통해 상태를 변경했는지 확인하세요. `setState`가 호출되어야 렌더링을 담당하는 `onUpdate`가 트리거됩니다. |
