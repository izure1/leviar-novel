# 🛠️ defineCharacter

---

## 1. 개요 (Overview)

`defineCharacter`는 캐릭터의 정보(이름, 이미지, 포인트 좌표 등)를 정의할 때 사용하는 헬퍼 함수입니다. 프로젝트의 규모가 커짐에 따라 모든 캐릭터 설정을 하나의 설정 파일(`novel.config.ts`)에 작성하는 대신, 캐릭터별로 파일을 분리하여 관리할 수 있게 도와줍니다.

### 주요 이점
* **모듈화**: 캐릭터별로 독립된 파일을 생성하여 유지보수가 용이해집니다.
* **타입 추론**: 이미지 키와 포인트 키 등을 TypeScript가 정확히 추론하여 씬 작성 시 강력한 자동완성을 제공합니다.
* **가독성**: 복잡한 포인트 좌표 데이터를 개별 파일로 격리하여 최상위 설정 파일을 깔끔하게 유지합니다.

---

## 2. 사용법 (Usage)

### 2.1. 캐릭터 파일 생성

`defineCharacter`를 사용하여 캐릭터 개별 모듈을 작성합니다.

```ts
// src/characters/fumika.ts
import { defineCharacter } from 'fumika'

export const fumika = defineCharacter({
  name: 'Fumika', // 대사창 등에 표시될 이름
  images: {
    normal: {
      src: 'char_fumika_normal', // novel.config.ts의 assets에 등록된 키
      width: 400,
      points: {
        face: { x: 0.5, y: 0.2 },
        heart: { x: 0.5, y: 0.45 }
      }
    },
    happy: {
      src: 'char_fumika_happy'
    }
  }
})
```

### 2.2. 최상위 설정에 등록

생성한 캐릭터 모듈을 `novel.config.ts`의 `characters` 섹션에 등록합니다.

```ts
// novel.config.ts
import { defineNovelConfig } from 'fumika'
import { fumika } from './characters/fumika'

export default defineNovelConfig({
  assets: {
    'char_fumika_normal': 'assets/char/fumika_normal.png',
    'char_fumika_happy': 'assets/char/fumika_happy.png'
  },
  characters: {
    'fumika': fumika // 이제 씬에서 'fumika' 키로 접근 가능합니다.
  }
})
```

---

## 3. 속성 상세 참조 (Property Reference)

#### 캐릭터 정의 (`CharDef`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `name` | `string` | 캐릭터의 실명 또는 표시 이름입니다. |
| `images` | `Record<string, CharImageDef>` | 캐릭터의 상태별 이미지 룩업 테이블입니다. |

#### 이미지 설정 (`CharImageDef`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `src` | `string` | **에셋 키**: `assets` 섹션에 등록된 키입니다. 직접적인 파일 경로가 아님에 주의하십시오. |
| `width` | `number` | 캐릭터의 기본 렌더링 너비(px)입니다. |
| `height` | `number` | 캐릭터의 기본 렌더링 높이(px)입니다. 로딩 전 높이 계산 등에 사용됩니다. |
| `points` | `Record<string, Point>` | 카메라 포커싱용 좌표 데이터입니다. |

#### 좌표 설정 (`Point`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `x` | `number` | 이미지 가로 비율 (0.0 ~ 1.0) 입니다. |
| `y` | `number` | 이미지 세로 비율 (0.0 ~ 1.0) 입니다. |

---

## 4. 주의 사항 (Edge Cases)

* **에셋 동기화**: `defineCharacter`에서 사용한 `src` 키는 반드시 `novel.config.ts`의 `assets` 섹션에 정의되어 있어야 엔진이 리소스를 로드할 수 있습니다.
* **타입 보존**: `defineCharacter`는 입력받은 객체의 리터럴 타입을 그대로 반환하므로, 씬 작성 시 잘못된 이미지 키나 포인트 키를 사용하면 컴파일 단계에서 오류를 잡아낼 수 있습니다.
