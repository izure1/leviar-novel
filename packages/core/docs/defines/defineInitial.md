# 🎨 초기 상태 빌더 (defineInitial)

## 개요 (Overview)

`defineInitial`은 여러 씬(Scene)에서 공통으로 사용할 모듈의 초기 상태(initial)를 미리 정의해 두는 함수입니다.  
과거 회상 씬의 세피아 필터나 긴박한 상황의 붉은 대화창 등, 반복해서 쓰이는 씬 설정을 밖으로 빼서 재사용할 때 사용합니다.  

## 사전 준비 (Prerequisites)

`novel.config.ts` 파일의 설정 객체(`config`)를 불러와야 합니다.  

## 핵심 예제 (Main Example)

특정 분위기(예: 긴박한 상황)를 위한 공통 초기 설정을 정의하고 씬에 적용하는 예제입니다.  

```typescript
// 1. 공통 설정 정의 (initials.ts 등 별도 파일)
import { defineInitial } from 'fumika'
import config from './novel.config'

export const intenseInitial = defineInitial(config)({
  // 화면 전체를 붉게 물들입니다
  mood: { mood: 'alert', intensity: 0.7 },
  // 대화창을 어두운 붉은색으로 바꿉니다
  dialogue: { bg: { background: 'rgba(30, 0, 0, 0.9)', borderColor: '#ff0000' } },
  // 선택지 버튼 색상을 붉은색으로 바꿉니다
  choices: { button: { background: 'rgba(100, 0, 0, 0.5)' } }
})
```

```typescript
// 2. 씬에 적용 (scene-battle.ts)
import { defineScene } from 'fumika'
import config from './novel.config'
import { intenseInitial } from './initials'

export default defineScene({
  config,
  // 만들어둔 공통 설정을 그대로 씬의 initial에 넣습니다
  initial: intenseInitial
})(() => [
  { type: 'dialogue', text: '공기가 평소와는 다르게 차갑고 무겁습니다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 및 해결 방법 |
| :--- | :--- |
| **일부 속성만 덮어쓰기 (Override)** | 만들어둔 공통 테마를 기본으로 쓰되, 이 씬에서만 속성을 살짝 바꾸고 싶다면 자바스크립트의 스프레드 연산자(`...`)를 사용해 확장하세요. |

### 오버라이드 활용 예제

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'
import { intenseInitial } from './initials'

export default defineScene({
  config,
  initial: {
    ...intenseInitial,
    // 공통 설정의 다른 부분은 유지하면서, 특정 속성의 강도만 덮어씁니다
    mood: { ...intenseInitial.mood, intensity: 1.0 } 
  }
})(() => [
  { type: 'dialogue', text: '위험합니다!' }
])
```
