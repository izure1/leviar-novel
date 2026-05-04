# 08. 고급 설계 가이드 (Advanced) 🚀

대규모 프로젝트의 유지보수성을 높이고 엔진의 심화 기능을 활용하는 아키텍처 가이드입니다.

---

## 1. 캐릭터 리소스 분리 (`defineCharacter`)

**`defineCharacter`**는 캐릭터의 이름과 이미지 정보를 별도의 파일로 독립시켜 정의하는 헬퍼 함수입니다. 

*   **왜 사용하나요?**  
    프로젝트 규모가 커질 때 메인 설정 파일(`novel.config.ts`)이 비대해지는 것을 막고, 캐릭터별 데이터(이미지 키, 포커스 좌표 등)를 **집중적으로 관리**하기 위해 사용합니다.

```ts
// src/defines/characters.ts
import { defineCharacter } from 'fumika'

export const heroine = defineCharacter({
  name: '히로인',
  bases: {
    normal: {
      src: 'char_heroine_base',
      width: 560,
      points: {
        face: { x: 0.5, y: 0.2 }
      }
    }
  },
  emotions: {
    normal: { face: 'char_heroine_face_normal' },
    happy:  { face: 'char_heroine_face_happy' }
  }
})
```

> [!TIP]
> `defineCharacter`를 사용하면 이미지 좌표(`points`) 설정 시 IDE의 강력한 **자동완성 도움**을 받을 수 있습니다.

---

## 2. 모듈 상태(State)와 초기화 (`defineInitial`)

**모듈 상태(State)**는 각 모듈(대사창, 캐릭터 등)이 화면을 그리기 위해 내부적으로 보유한 핵심 데이터의 집합입니다. 

*   **왜 중요할까요?**  
    엔진은 데이터의 변화를 감지해 화면을 자동으로 다시 그립니다. 개발자는 복잡한 렌더링 로직 대신 **데이터 조작**에만 집중하여 연출 효율을 높일 수 있습니다.

**`defineInitial`**은 이러한 모듈 상태가 씬 시작 시점에 가질 **'태초의 값'**을 정의하는 도구입니다. 씬의 분위기에 맞춰 대사창의 높이를 조절하거나 UI의 투명도를 변경하는 등, 각 장면에 최적화된 화면 구성을 미리 세팅하기 위해 사용합니다.

```ts
// src/defines/initials.ts
export const slimDialogue = defineInitial(config)({
  dialogue: { 
    style: { height: 120 } 
  }
})

// 적용: 씬의 'initial' 옵션에 주입
export default defineScene({ 
  config, 
  initial: slimDialogue 
})([ ... ])
```

---

## 3. 공통 로직 자동화 (`defineHook`)

**`defineHook`**은 대사 넘김이나 씬 전환 등 엔진의 주요 동작 시점에 실행될 커스텀 로직을 등록하는 시스템입니다. 

*   **언제 사용하나요?**  
    대사가 넘어갈 때마다 효과음을 재생하거나 진행 상황을 로그로 기록하는 등, 여러 장소에서 반복되는 **공통 기능**을 한 곳에서 자동화하기 위해 사용합니다.

```ts
// src/defines/hooks.ts
export const commonHooks = defineHook(config)({
  // 대사가 넘어갈 때마다 실행 (value: 진행 가능 여부)
  'novel:next': (value) => {
    // 효과음 재생 등의 로직 실행
    return value // 중요: 파이프라인 유지를 위해 반드시 반환
  }
})
```

> [!IMPORTANT]
> 훅 핸들러는 반드시 인자로 받은 **`value`를 반환**해야 합니다. 반환하지 않으면 엔진의 후속 동작이 차단될 수 있습니다.

---

[⬅️ 07. 씬 전환](./07-transitions.md) | [09. 중첩 씬 ➡️](./09-nested-scenes.md) | [📚 전체 문서](../README.md)
