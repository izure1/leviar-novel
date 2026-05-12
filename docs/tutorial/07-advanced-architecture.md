# 7. 효율적인 씬 설계: 부모-자식 구조

당신은 이제 기본적인 연출을 넘어 더 큰 그림을 설계할 수 있습니다.  
하지만 복잡한 프로젝트일수록 코드를 효율적으로 관리할 구조적 설계 전략이 필요하죠.  
이 페이지에서는 부모-자식 구조를 활용해 `Fumika` 엔진의 아키텍처를 구축하는 방법을 배웁니다.

## 동기

수십 개의 장면을 만든다고 상상해 보십시오.  
매 파일마다 [`UI`](../modules/element.md) 코드를 반복해서 작성한다면 단순히 시간만 낭비하는 게 아닙니다.  
유지보수가 어려운 코드는 프로젝트가 커질수록 관리가 더욱 힘들어지기 때문이죠.

```typescript
// ❌ 비효율적인 방식: 모든 파일에 UI 중복 작성
export default defineScene({ config })(() => [
  { type: 'element', id: 'ui-panel' }, 

  { type: 'background', name: 'bg-room' },
  { 
    type: 'dialogue', 
    text: '50번째 씬입니다. 수정하기 너무 힘들군요.' 
  }
])
```

위치를 10픽셀만 옮겨도 수십 개의 파일을 함께 수정해야 한다면 작업 효율이 크게 떨어집니다.  
게다가 단순 반복 작업은 실수까지 유발하죠.  
구조적인 해결책을 도입해 이 문제를 해결해 보세요.

## 기본 사용법

먼저 공통 `UI`를 담당하는 **부모 씬(Parent Scene)**을 생성합니다.

기본 틀을 한 곳에 모아두면, 시나리오는 각 씬에서 간결하게 작성할 수 있게 됩니다.  
`scene-ui.ts`를 정의하면서 어떻게 동작하는지 살펴보겠습니다.

```typescript
// ✅ 효율적인 방식: UI 전용 부모 씬 (scenes/scene-ui.ts)
export default defineScene({ config })(({ call, label, goto }) => [
  { 
    type: 'element', 
    action: 'show', 
    id: 'ui-panel',
    kind: 'rect'
  },

  label('loop'),
  // preserve로 UI를 유지한 채 자식 씬을 호출합니다
  call('scene-start', { preserve: true, restore: true }),
  
  // 시나리오 종료 후 부모로 돌아오는 흐름이 정석입니다  
  call('scene-chapter-1', { preserve: true, restore: true }),
  
  goto('loop')
])
```

[`label`](../reserved/index.md)과 [`goto`](../reserved/index.md) 명령으로 루프를 만들어 게임의 전체 흐름을 구성합니다.  
여기서 핵심은 [`call`](../reserved/index.md) 명령의 [`preserve`](../reserved/index.md): true 옵션입니다.  
이 옵션이 있어야 자식 씬이 실행되는 동안에도 부모의 `UI`가 안전하게 유지되기 때문이죠.

> [!WARNING]
> `preserve` 옵션을 누락하면 자식 씬 진입 시 모든 `UI`가 삭제되니 주의하십시오.  
> 설계 단계에서 이 옵션을 챙기면 안정적인 연출이 가능합니다.

## 점진적 심화

구조화 전략을 도입하면 시나리오 작성이 간결해지고 코드의 가독성도 향상됩니다.  
그 결과, 연출의 본질에만 집중할 수 있게 되죠.

자식 씬인 `scene-start.ts`가 얼마나 깔끔해지는지 직접 확인해 보세요.

```typescript
// scenes/scene-start.ts (자식 씬)
export default defineScene({ config })(() => [
  { type: 'background', name: 'bg-room' },
  { type: 'character', name: 'fumika', image: 'idle:normal' },
  { 
    type: 'dialogue', 
    text: '순수하게 연출에만 집중합니다.' 
  }
])
```

자식 씬에는 `UI` 코드가 전혀 없지만, 화면에는 패널이 정상적으로 표시됩니다.  
이는 부모 씬이 중심을 잡고 있기에 가능한 연출이죠.  
[`restore`](../reserved/index.md): true 옵션 덕분에 자식의 작업이 끝나면 곧바로 부모의 실행 지점으로 돌아옵니다.

> [!TIP]
> `restore` 기능을 적극적으로 활용하십시오.  
> 복잡한 분기에서도 실행 위치를 유지하여 매끄러운 전개가 가능합니다.

## 다음 단계

아키텍처 기초를 마스터했다면 이제 작품에 청각 효과를 더할 차례입니다.  
다음 장에서는 사운드 설계 기법을 배워보겠습니다.

* **[8. 청각적 몰입: 사운드 레이어링](./08-audio-layering.md)**
* **[명령어 참조: call](../reserved/index.md)**
