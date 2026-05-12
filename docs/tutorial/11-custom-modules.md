# 11. 엔진의 무한한 확장: 커스텀 모듈

이제 Fumika 엔진의 기본 기능을 모두 살펴보았습니다.  
하지만 때로는 엔진의 기본 기능만으로는 당신의 구상을 온전히 담기 어려울 때도 있죠.  
그럴 때를 대비해 엔진의 한계를 확장하는 고급 기법을 배워보겠습니다.

## 동기

복잡한 캐릭터 상태창이나 미니게임을 넣고 싶다고 가정해 보십시오.  
`element` 명령어만으로 이를 구현하려면 코드가 매우 복잡해집니다.  
수많은 UI 요소를 일일이 관리하는 것은 매우 비효율적인 작업이기 때문이죠.

```typescript
// ❌ 비효율: 기본 명령어 중복 사용
export default defineScene({ config })(({ label }) => [
  { type: 'element', id: 'stat-bg', kind: 'rect' },
  { type: 'element', id: 'stat-name', kind: 'text' },
  // ... 수백 줄의 코드가 당신을 괴롭힐지도 모릅니다 ...
])
```

커스텀 모듈을 사용하면 이 복잡한 로직을 단 한 줄의 명령어로 해결할 수 있습니다.  
코드를 재사용 가능한 모듈로 만들어 두면 언제든 다시 불러와 사용할 수 있기 때문이죠.  
이것이 효율적인 개발 방식입니다.

## 기본 사용법

모듈 제작은 설계, 동작 정의, 렌더링 순서로 진행됩니다.  
본격적인 개발에 앞서 명확한 데이터 설계가 선행되어야 합니다.  
먼저 모듈이 사용할 데이터의 구조와 상태부터 정의해 보겠습니다.

### 1. 타입과 상태 정의

데이터 구조를 정의하는 것은 모듈의 방향을 정하는 중요한 첫걸음입니다.

```typescript
import { define } from 'fumika'

interface StatusCmd { type: 'status', action: 'show' | 'hide' }
interface StatusState { isOpen: boolean }

const statusModule = define<StatusCmd, StatusState>({ isOpen: false })
```

> [!DANGER]
> `state` 객체 내부에 함수를 저장하지 마세요.  
> 순수한 데이터만 사용해야 엔진의 상태 관리가 안전하게 동작합니다.

### 2. 명령어 로직 구현

타입을 정의했다면, `defineCommand`로 명령어의 동작 방식을 구현합니다.

```typescript
statusModule.defineCommand(function* (cmd, ctx, state, setState) {
  if (cmd.action === 'show') {
    setState({ isOpen: true })
  } else {
    setState({ isOpen: false })
  }
  return true 
})
```

## 점진적 심화

이제 상태 변화에 따라 화면이 움직이도록 만들어 보겠습니다.  
`defineView`를 사용하면 브라우저의 DOM을 직접 제어할 수 있습니다.  
이를 통해 인터랙티브한 요소를 추가할 수 있게 됩니다.

```typescript
statusModule.defineView((ctx, state, setState) => {
  const el = document.createElement('div')
  // ... 스타일 및 속성 설정 ...
  return {
    show: () => { el.style.display = 'block' },
    onCleanup: () => el.remove()
  }
})
```

직접 만든 명령어로 정보를 표시해 보세요.  
당신이 작성한 코드는 엔진이 안전하게 관리하므로 걱정하지 않아도 됩니다.

> [!WARNING]
> `onCleanup` 함수를 구현하는 것을 절대 잊지 마십시오.  
> 이를 생략하면 장면이 바뀐 후에도 이전 UI가 화면에 남게 됩니다.

## 튜토리얼을 마치며

Fumika 엔진 튜토리얼을 모두 마치셨습니다.  
이제 원하는 기능을 직접 구현하고 확장할 수 있는 수준에 도달했습니다.  
앞으로 만들어낼 작품이 기대됩니다. 궁금한 점은 언제든 레퍼런스를 참조해 보세요.

* **[커스텀 모듈 상세 레퍼런스](../modules.md)**
* **[전체 명령어 인덱스](../commands.md)**
