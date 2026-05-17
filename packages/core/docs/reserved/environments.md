# 🌍 환경변수 (Environments)

## 개요 (Overview)

환경변수는 게임의 **모든 세이브 슬롯에서 공유**되는 슈퍼 전역 변수입니다.  
일반 전역변수(`variables`)가 세이브 슬롯마다 독립적으로 존재하는 반면, 환경변수는 게임 전체에서 하나만 존재합니다.  
사용자 설정(텍스트 속도, 볼륨, CG 회수 여부 등)을 저장하는 데 적합합니다.

## 변수 스코프 계층 (Scope Hierarchy)

| 접두사 | 스코프 | 생명주기 | 세이브 대상 |
| :--- | :--- | :--- | :--- |
| `$` | **환경변수** | 게임 전체 (모든 세이브 공유) | `novel.saveEnv()` 수동 저장 |
| _(없음)_ | **전역변수** | 세이브 슬롯 단위 | `novel.save()` 자동 포함 |
| `_` | **지역변수** | 현재 씬 내 | `novel.save()` 자동 포함 |

### 접두사 충돌 방지 규칙

각 변수 종류는 다른 종류의 접두사를 사용할 수 없습니다.  

| 변수 종류 | 금지 접두사 |
| :--- | :--- |
| 전역변수 | `$`, `_` |
| 지역변수 | `$` |
| 환경변수 | `_` |

## 사전 준비 (Prerequisites)

`defineNovelConfig`의 `environments` 필드에 `$` 접두사로 시작하는 키와 초기값을 선언합니다.  

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  // ... 기본 설정 생략
  variables: {
    gold: 100,
  },
  environments: {
    $textSpeed: 'normal',
    $seenEnding: false,
    $bgmVolume: 0.8,
  }
})
```

## 핵심 예제 (Main Example)

### 씬에서 환경변수 읽기/쓰기

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(({ set, condition }) => [
  // 환경변수 읽기: condition에서 $접두사 변수에 접근
  condition(
    ({ $seenEnding }) => $seenEnding === true,
    [
      { type: 'dialogue', text: '다시 오셨군요. 이전 엔딩을 기억하고 있습니다.' }
    ],
    [
      { type: 'dialogue', text: '처음 오신 것을 환영합니다.' }
    ]
  ),

  // 환경변수 쓰기: set으로 $ 접두사 변수를 업데이트
  set('$seenEnding', true),

  // Resolvable 패턴: 기존 값을 참조하여 연산
  set('$bgmVolume', ({ $bgmVolume }) => Math.min(1.0, $bgmVolume + 0.1)),

  // 텍스트 보간: {{$변수명}}으로 환경변수 값을 텍스트에 삽입
  { type: 'dialogue', text: '현재 텍스트 속도: {{$textSpeed}}' },
])
```

### 수동 저장/불러오기

환경변수는 `novel.save()`의 `SaveData`에 **포함되지 않습니다**.  
별도의 수동 API로 관리합니다.  

```typescript
// 저장
const envData = novel.saveEnv()
localStorage.setItem('fumika-env', JSON.stringify(envData))

// 불러오기
const raw = localStorage.getItem('fumika-env')
if (raw) {
  novel.loadEnv(JSON.parse(raw))
}
```

## 텍스트 보간 우선순위 (Interpolation Priority)

`{{표현식}}` 문법에서 동일한 이름의 변수가 여러 스코프에 존재할 경우, 좁은 스코프가 우선합니다.  

1. **지역변수** `_name` (최우선)
2. **전역변수** `name`
3. **환경변수** `$name` (최하위)

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **세이브에 환경변수가 없음** | 환경변수는 설계상 `SaveData`에 포함되지 않습니다. `novel.saveEnv()` / `novel.loadEnv()`로 별도 관리하십시오. |
| **`$` 없이 environments에 키 선언** | `defineNovelConfig`의 `environments` 타입이 `` Record<`$${string}`, any> ``로 제약되어 있어 `$` 접두사가 없으면 빌드타임 타입 에러가 발생합니다. |
| **직렬화 불가능한 데이터** | 전역변수와 동일하게, 환경변수에도 함수나 DOM 엘리먼트 등 직렬화할 수 없는 객체를 담으면 `saveEnv()` 호출 시 JSON 파싱 에러가 발생합니다. |
