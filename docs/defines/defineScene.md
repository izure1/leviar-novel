# 🎬 장면 빌더 (defineScene)

## 개요 (Overview)

`defineScene`은 게임의 한 장면(Scene)을 구성하는 함수입니다.  
이 함수 안에서 지역 변수, 다음 씬 이동 정보 등을 설정하고, 화면에 나타낼 연출 명령어들을 배열로 나열하여 시나리오를 작성합니다.  

## 사전 준비 (Prerequisites)

프로젝트 루트에 작성해둔 `novel.config.ts` 파일의 설정 객체(`config`)를 불러와야 합니다.  

## 핵심 예제 (Main Example)

가장 기본적이고 자주 쓰이는 작성 패턴입니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ 
  // 1. 설정 객체를 주입합니다
  config,
  
  // 2. 현재 씬에서만 쓸 지역 변수를 사전 정의합니다 (반드시 _로 시작)
  variables: { _isDoorOpened: false },
  
  // 3. 씬 시작 시 대화창 색상을 바꾸는 등 모듈의 상태를 덮어씌웁니다
  initial: {
    dialogue: { bg: { color: 'rgba(0, 0, 50, 0.8)' } }
  },
  
  // 4. 이 씬의 명령어 배열이 끝난 뒤 이동할 다음 씬을 명시합니다
  next: { scene: 'chapter_02', preserve: true }
})(({ set, goto, label }) => [
  // 5. 시각적 연출 명령어들을 순서대로 나열합니다
  { type: 'dialogue', text: '굳게 닫힌 문 앞에 도착했습니다.' },
  
  // 6. 제공되는 예약어를 사용해 지역 변수를 조작하거나 흐름을 제어합니다
  set('_isDoorOpened', true)
])
```

## 옵션 상세

설정 객체(`defineScene({ ... })` 부분)에 들어가는 속성들입니다.  

| 속성 명칭 | 데이터 타입 | 필수 여부 | 설명 |
| :--- | :--- | :---: | :--- |
| **`config`** | `NovelConfig` | ✅ | `novel.config.ts`의 설정 인스턴스 |
| **`variables`** | `object` | ❌ | 현재 씬 내부에서만 유효한 지역 변수 목록을 선언 |
| **`initial`** | `object` | ❌ | 씬 진입 시 강제로 덮어씌울 모듈의 초기 상태 |
| **`next`** | `string \| object` | ❌ | 시나리오 배열이 끝난 뒤 자동으로 이동할 목적지 씬 |
| **`hooks`** | `HookDescriptor` | ❌ | 이 씬 내부에서만 동작할 이벤트 훅 |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **지역 변수 명명 에러** | `variables`에 정의하는 지역 변수는 전역 변수와의 충돌을 막기 위해 반드시 언더바(`_`) 접두사로 시작해야 합니다. |
| **지역 변수 미선언 에러** | 지역 변수는 반드시 설정 객체의 `variables`에 초기값과 함께 미리 선언해야 합니다. |
| **서브 씬에서의 `next` 사용** | `call` 예약어로 불러온 서브루틴 씬 내부에서 `next`를 정의하면, 원래 씬으로 돌아가지 못하고 영원히 고립되는 메모리 누수가 발생할 수 있습니다. |
