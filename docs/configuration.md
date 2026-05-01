# ⚙️ Configuration Reference

`defineNovelConfig` 함수를 통해 프로젝트의 전역 환경을 설정합니다. 리소스 관리부터 연출의 기본값까지 엔진의 모든 동작 원리가 이곳에서 정의됩니다.

---

## 💎 최상위 설정 항목 요약

| 속성명 | 필수 | 타입 | 도입 이유 (Why) |
| :--- | :---: | :--- | :--- |
| **`vars`** | O | `object` | 전역 상태 중앙 관리 및 세이브 데이터 규격 정의 |
| **`scenes`** | O | `string[]` | 엔진에 등록할 씬 목록 정의 및 이동 경로 확보 |
| **`assets`** | - | `object` | 리소스 경로 별칭 부여를 통한 유지보수성 향상 |
| **`fallback`** | - | `array` | 반복되는 연출 기본값을 전역 설정하여 시나리오 코드 간소화 |
| **`effects`** | - | `object` | 일관된 시각적 테마를 위한 물리 엔진 파라미터 고정 |

---

## 📦 상세 설정 명세

### 1. 전역 변수 (`vars`)

**상세 설명:**
게임 전반에서 사용되는 주인공 이름, 호감도, 진행도 등을 정의합니다. 여기에 정의된 변수들은 엔진의 세이브 시스템에 의해 자동으로 추적 및 저장되므로, 별도의 직렬화 로직 없이도 완벽한 이어하기를 보장합니다.

**사용 예시:**

```typescript
defineNovelConfig({
  variables: {
    playerName: '주인공',
    gold: 500,
    metHeroine: false
  },
  // ... 기타 설정
})
```

---

### 2. 에셋 관리 (`assets`)

**상세 설명:**
긴 파일 경로를 시나리오에서 직접 사용하는 대신 별칭(Alias)을 부여합니다. 파일의 실제 위치가 변경되어도 설정 파일 한 곳만 수정하면 되며, 엔진 초기화 시점에 리소스를 미리 로드하여 런타임 성능을 최적화합니다.

**사용 예시:**

```typescript
defineNovelConfig({
  assets: {
    'bg_main': './assets/images/background/main_hall.png',
    'se_click': './assets/audio/se/system_click.mp3'
  },
  // ... 기타 설정
})
```

---

## 🔄 중첩 속성 상세 (Recursive Details)

### 3. 특수 효과 설정 (`effects`)

`effect` 커맨드에서 사용되는 파티클 시스템의 세부 수치를 정의합니다.

#### 📄 `clip` 상세 (물리/수명 주기)

| 속성명 | 타입 | 도입 이유 (Why) |
| :--- | :--- | :--- |
| **`interval`** | `number` | 생성 주기(프레임) 조절을 통한 파티클 밀도 최적화 |
| **`lifespan`** | `number` | 생존 시간 설정을 통한 메모리 관리 및 연출 조절 |
| **`size`** | `number[][]` | 시작/끝 크기 범위 지정을 통한 입체적 원근감 연출 |
| **`opacity`** | `number[][]` | 부드러운 페이드인/아웃 처리를 통한 시각적 완성도 |

**사용 예시:**

```typescript
defineNovelConfig({
  effects: {
    snow: {
      clip: {
        interval: 100,
        size: [[0.5, 0.5], [0.1, 0.1]], // 점점 작아짐
        opacity: [[1, 1], [0, 0]]      // 사라짐
      }
    }
  }
})
```

---

### 4. 폴백 규칙 (`fallback`)

**상세 설명:**
모든 `character-show` 커맨드마다 `duration: 300`을 적는 반복 작업을 제거합니다. 특정 조건에 맞는 명령어에 대해 전역 기본값(Default)을 주입하여 시나리오 연출가가 핵심 연출에만 집중할 수 있게 합니다.

| 속성명 | 필수 | 설명 |
| :--- | :---: | :--- |
| **`type`** | O | 규칙을 적용할 명령어 타입 (예: `character`) |
| **`action`** | - | 특정 액션에만 적용할 경우 지정 (예: `show`) |
| **`defaults`** | O | 값이 누락되었을 때 적용할 기본값 객체 |

**사용 예시:**
```typescript
defineNovelConfig({
  fallback: [
    // 모든 캐릭터 등장/이동 시 기본 duration을 400ms로 설정
    { type: 'character', defaults: { duration: 400 } },
    // 모든 대화의 타이핑 속도를 50ms로 설정
    { type: 'dialogue', defaults: { speed: 50 } }
  ]
})
```
