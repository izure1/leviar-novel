# 🎬 defineScene

---

## 1. 개요 (Overview)

`defineScene`은 `fumika` 엔진에서 독립적인 이야기의 단위인 **씬(Scene)**을 정의하는 핵심 헬퍼 함수입니다. 이 함수를 통해 해당 장면에서 사용될 지역 변수, 모듈의 초기 상태, 씬 전용 훅, 그리고 실행될 시나리오 커맨드 배열을 구성합니다.

---

## 2. 기본 사용법 (Usage)

`defineScene`은 두 가지 호출 방식을 지원합니다. IDE의 타입 추론과 자동완성 기능을 최대한 활용하기 위해 **Curried 형식**을 권장합니다.

### 2.1. Curried 형식 (권장)
설정 객체를 먼저 전달하고, 반환된 함수에 커맨드 배열을 전달합니다. 이 방식은 커맨드 배열 내에서 타입 추론이 가장 정확하게 이루어집니다.

```ts
import config from './novel.config'
import { defineScene } from 'fumika'

export default defineScene({ 
  config,
  variables: { _localGold: 0 } // 지역 변수 정의
})([
  { type: 'dialogue', text: '새로운 씬이 시작되었습니다.' },
  { type: 'var', name: '_localGold', value: 100 }
])
```

### 2.2. 2-arg 형식
설정 객체와 커맨드 배열을 한 번에 전달합니다.

```ts
export default defineScene({ config }, [
  { type: 'dialogue', text: '간단한 씬 정의입니다.' }
])
```

---

## 3. 설정 옵션 (`SceneOptions`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `config` | `NovelConfig` | ✅ | `novel.config.ts`에서 정의한 설정 객체입니다. |
| `variables` | `Object` | - | 씬 내에서만 유효한 **지역 변수**입니다. 반드시 `_` 접두사를 사용해야 합니다. |
| `initial` | `Object` | - | 씬 시작 시 특정 모듈의 상태를 강제로 초기화합니다. |
| `next` | `string \| Object` | - | 시나리오 종료 후 자동으로 이동할 씬 이름 또는 설정 객체입니다. |
| `hooks` | `HookDescriptor` | - | 씬 전용 라이프사이클 훅입니다. ([defineHook](./defineHook.md) 참조) |

---

## 4. 상세 기능

### 4.1. 지역 변수 (`variables`)
씬 내부에서만 쓰이고 씬 종료 시 소멸되는 변수입니다. 전역 변수와 충돌을 피하기 위해 반드시 키 이름이 `_`로 시작해야 합니다.

```ts
variables: {
  _isDoorLocked: true,
  _tryCount: 0
}
```

### 4.2. 모듈 상태 초기화 (`initial`)
대사창의 크기나 선택지의 스타일 등을 해당 씬에서만 다르게 보여주고 싶을 때 사용합니다. `config.modules`에 등록된 키를 기반으로 타입이 자동 완성됩니다.

```ts
initial: {
  dialogue: { 
    bg: { color: 'rgba(0, 0, 50, 0.5)' } // 이 씬에서만 대사창을 파란색으로
  }
}
```

### 4.3. 다음 씬 자동 이동 (`next`)
시나리오 배열의 마지막 커맨드가 끝나면 자동으로 지정된 씬으로 이동합니다. `preserve: true`를 사용하면 현재의 캐릭터나 배경 상태를 유지하며 전환됩니다.

```ts
next: { scene: 'chapter_2', preserve: true }
```

---

## 5. 유틸리티: `defineInitial`

여러 씬에서 공통으로 사용할 `initial` 설정을 별도 파일로 분리할 때 사용합니다. 

* [⚓ defineInitial 상세 가이드](./defineInitial.md)

```ts
import { defineInitial } from 'fumika'
import config from './novel.config'

export const spookyInitial = defineInitial(config)({
  dialogue: { bg: { color: '#000000', height: 168 } },
  choices:  { background: 'rgba(20,20,50,0.90)', minWidth: 280 },
})

// 실제 씬에서 사용
defineScene({ config, initial: spookyInitial })([ ... ])
```

---

**관련 문서:**
* [Scene 개념 가이드](../concepts/scenes.md)
* [Configuration 설정 가이드](../config.md)
