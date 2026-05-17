# 💾 세이브와 로드 (Save & Load)

## 개요 (Overview)

Fumika 엔진은 플레이어가 게임을 저장할 때, 현재 화면에 보이는 모든 상태와 진행 포인터를 자동으로 스냅샷 기록합니다.  
본 문서는 엔진이 세이브 데이터를 관리하는 원리와, 시나리오 작성 시 데이터가 손상되지 않도록 지켜야 할 사항을 안내합니다.  

## 엔진 자동 저장 내역 (Properties)

플레이어가 게임을 저장할 때 엔진 시스템이 자동으로 수집하고 직렬화하는 항목들의 목록입니다.  

| 속성명 (`SaveData`) | 상세 설명 |
| :--- | :--- |
| **`sceneName`** | 현재 진행 중인 씬(`Scene`)의 이름(식별자)입니다. |
| **`cursor`** | 현재 씬의 스크립트 중 어느 명령어 스텝 위치에 멈춰있는지를 나타내는 배열 인덱스입니다. |
| **`globalVars`** | 게임 진행 중 조작한 모든 전역 변수(`novel.variables`)의 스냅샷 데이터입니다. |
| **`localVars`** | 현재 활성화된 씬의 지역 변수 스냅샷 데이터입니다. |
| **`rendererState`** | 화면에 렌더링된 배경, 캐릭터, 오버레이 및 카메라 상태 등에 대한 스냅샷입니다. |
| **`states`** | 각 시스템 및 커스텀 모듈이 영구 보존을 위해 기록해둔 내부 상태 스냅샷(예: 대화창 표시 여부, BGM 재생 상태)입니다. |
| **`callStack`** | `call` 명령어 등을 통해 서브 씬에 진입했을 경우, 종료 후 이전 씬으로 완벽하게 복귀하기 위해 기록된 호출자 씬의 상태(커서, 변수, 렌더러 정보 등) 프레임 목록입니다. |

> [!NOTE]
> **환경변수(`$` 접두사)는 SaveData에 포함되지 않습니다.**  
> 환경변수는 모든 세이브 슬롯에서 공유되는 별도 스토리지에 저장됩니다.  
> `novel.saveEnv()` / `novel.loadEnv()`로 수동 관리하십시오.
>
> ```typescript
> // 환경변수 저장 (별도 키 사용)
> localStorage.setItem('fumika-env', JSON.stringify(novel.saveEnv()))
>
> // 환경변수 불러오기
> const raw = localStorage.getItem('fumika-env')
> if (raw) novel.loadEnv(JSON.parse(raw))
> ```

## 핵심 예제 (Main Example)

### 안전한 세이브 데이터 구조

세이브 파일은 최종적으로 JSON 텍스트 형태로 변환되어 기기에 보존됩니다.  
따라서 엔진 변수에는 반드시 아래와 같은 순수한 직렬화 데이터만 담아야 합니다.  

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ 
  config,
  variables: {
    // 안전한 데이터 형식들 (숫자, 문자열, 불리언, 순수 객체 및 배열)
    _hero_name: '아서',
    _health: 100,
    _is_poisoned: false,
    _inventory: ['sword', 'potion'],
    _coords: { x: 10, y: 20 }
  }
})(({ set }) => [
  { type: 'dialogue', text: '데이터 보존이 문제없이 가능한 안전한 상태입니다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **치명적인 세이브 에러 유발** | 변수나 상태 내부에 화면 요소(DOM), 실행 가능한 코드(Function), 혹은 무한 참조 객체(A가 B를 품고 B가 A를 품음)를 넣으면 세이브 생성 시 JSON 파싱 에러가 나면서 시스템이 멈춥니다. |
| **지역 변수의 자동 소거 정책** | `variables` 블록에서 `_`(언더스코어)로 시작하는 이름으로 선언된 변수는, 해당 씬을 완전히 벗어나는 순간 쓰레기 수집기에 의해 삭제되어 세이브 파일 용량을 줄여줍니다. 유지할 정보는 전역 변수를 쓰십시오. |
