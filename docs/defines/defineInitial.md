# 🎨 defineInitial

---

## 1. 개요 (Overview)

`defineInitial`은 여러 씬에서 공통적으로 사용되는 모듈의 초기 상태(`initial`) 설정을 별도의 상수로 정의하여 재사용할 수 있게 해주는 유틸리티 함수입니다. 

이를 통해 프로젝트 전반에 걸쳐 일관된 시각적 테마(예: 특정 구역에서의 대사창 스타일, UI 레이아웃 등)를 유지하고 시나리오 파일의 중복 코드를 방지할 수 있습니다.

---

## 2. 사용법 (Usage)

`defineInitial`은 `config` 객체를 인자로 받아 해당 프로젝트의 모듈 스키마에 맞는 타입 추론을 제공합니다.

```ts
import { defineInitial } from 'fumika'
import config from './novel.config'

/** 
 * 특정 연출(예: 호러 분위기)을 위한 공통 초기 설정 정의
 */
export const horrorInitial = defineInitial(config, {
  mood: { mood: 'horror', intensity: 0.8 },
  dialogue: { bg: { color: 'rgba(50, 0, 0, 0.9)' } },
  choices: { buttonStyle: { fontColor: '#ff0000' } }
})
```

---

## 3. 씬에서 활용하기

정의된 초기 설정은 `defineScene`의 `initial` 속성에 그대로 전달할 수 있습니다.

```ts
import { horrorInitial } from './common/initials'

export default defineScene({
  config,
  initial: horrorInitial // 공통 설정 적용
})([
  { type: 'dialogue', text: '이곳의 분위기는 매우 무겁습니다.' }
])
```

---

## 4. 부분 확장 (Override)

공통 설정을 적용하면서 특정 씬에서만 일부 값을 다르게 설정하고 싶다면, 스프레드 연산자(`...`)를 사용하여 확장할 수 있습니다.

```ts
export default defineScene({
  config,
  initial: {
    ...horrorInitial,
    mood: { ...horrorInitial.mood, intensity: 1.0 } // 강도만 더 높임
  }
})([ ... ])
```

---

**관련 문서:**
* [defineScene 정의 가이드](./defineScene.md)
* [Configuration 설정 가이드](../config.md)
