# 💡 핵심 개념 (Concepts)

이 문서는 시나리오 코드를 작성할 때 마주치는 중요한 필수 개념과 실제 사용법을 설명합니다.  
엔진의 복잡한 원리보다는 **어떻게 사용하는가**에 초점을 맞추었습니다.  

---

## 1. 장면 (Scene)

게임의 모든 시나리오는 씬(Scene) 단위로 실행됩니다.  
각 씬은 독립된 파일로 작성되며, `defineScene` 빌더를 사용해 정의합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

// 'my-scene'이라는 이름의 씬을 정의합니다
export default defineScene({ config })(() => [
  {
    type: 'dialogue',
    text: '이곳은 새로운 씬입니다'
  }
])
```

---

## 2. 변수 시스템 (Variables)

게임 진행 상황(호감도, 분기점 등)을 저장하기 위해 변수를 사용합니다.  
전역 변수와 현재 씬에서만 유효한 지역 변수로 나뉩니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ 
  config,
  // 지역 변수를 쓰려면 반드시 여기에 초기값을 선언해야 합니다
  variables: { _hasMet: false }
})(({ set }) => [
  // 전역 변수 설정: 모든 씬에서 값이 유지됩니다
  set('likeability', 10),

  // 지역 변수 설정: 변수명 앞에 `_`를 붙이면 현재 씬에서만 유지됩니다
  set('_hasMet', true)
])
```

---

## 3. 동적 속성 (Resolvable)

명령어의 속성에 고정된 값뿐만 아니라, **변수 상태에 따라 결과가 달라지는 함수**를 넣을 수 있습니다.  
시나리오 내에서 복잡한 조건 분기(`condition` 커맨드 등)를 쓰는 대신, 속성 자체에서 판단을 내릴 수 있습니다.  

### 핵심 예제 (Main Example)

대사 텍스트를 호감도에 따라 다르게 출력하는 예제입니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  {
    type: 'dialogue',
    speaker: 'fumika',
    // 텍스트 속성에 함수를 넣어 변수(vars)를 참조합니다
    text: (vars) => vars.likeability > 50 ? '항상 고마워' : '무슨 일이야?'
  }
])
```

### 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **비동기 함수 사용 불가** | 렌더링 동기화를 위해 동기식(Synchronous) 함수만 사용할 수 있습니다.  `async/await`나 `Promise`를 반환하면 에러가 발생합니다. |
| **객체 참조** | 함수 내부에서 반환하는 객체는 렌더러가 그대로 사용하므로, 의도치 않은 객체 변형에 주의해야 합니다. |

---

## 4. 대사 내 변수 출력 (텍스트 보간)

대사 텍스트 중간에 변수의 값을 그대로 출력하고 싶을 때는 `{{변수명}}` 형태를 사용합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  {
    type: 'dialogue',
    speaker: 'fumika',
    // {{playerName}} 부분이 실제 변수 값으로 자동 치환되어 출력됩니다
    text: '안녕, {{playerName}}.  오늘 날씨가 참 좋네.'
  }
])
```

---

본 문서에서 충분한 정보를 얻지 못하셨다면 [명령어 참조](./commands.md)를 확인해 보세요.  
