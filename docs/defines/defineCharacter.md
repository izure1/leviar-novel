# 🛠️ defineCharacter

---

## 1. 개요 (Overview)

`defineCharacter`는 캐릭터의 정보(이름, 이미지, 포인트 좌표 등)를 정의할 때 사용하는 헬퍼 함수입니다. 

캐릭터의 메타 정보와 세부 리소스를 단일 객체로 정의하며, 신체(`bases`)와 표정(`emotions`) 파트를 독립적으로 구성하여 리소스 재사용성을 극대화하고 강력한 타입 추론을 제공합니다.

### 주요 이점
* **모듈화**: 캐릭터별로 독립된 파일을 생성하여 유지보수가 용이해집니다.
* **강력한 타입 체크**: `emotions` 정의 시 `bases`에서 정의한 `points` 키만 사용할 수 있도록 TypeScript가 강제합니다.
* **리소스 효율성**: 하나의 신체 이미지(`base`)에 여러 표정 파트(`emotions`)를 조합하는 구조를 완벽하게 지원합니다.

---

## 2. 사용법 (Usage)

### 2.1. 캐릭터 파일 생성

`defineCharacter`는 캐릭터의 모든 속성을 단일 객체로 입력받습니다.

```ts
// src/characters/fumika.ts
import { defineCharacter } from 'fumika'

export default defineCharacter({
  name: '후미카',
  bases: {
    normal: {
      src: 'fumika_base_normal',
      width: 560,
      naturalWidth: 1120, // 원본 이미지 너비 (파트 스케일 계산용)
      points: {
        face: { x: 0.445, y: 0.202 },
        chest: { x: 0.5, y: 0.45 }
      }
    }
  },
  emotions: {
    normal: { face: 'fumika_emotion_normal' },
    smile:  { face: 'fumika_emotion_smile' },
    angry:  { face: 'fumika_emotion_angry' }
  }
})
```

### 2.2. 최상위 설정에 등록

생성한 캐릭터 모듈을 `novel.config.ts`의 `characters` 섹션에 등록합니다.

```ts
// novel.config.ts
import { defineNovelConfig } from 'fumika'
import fumika from './characters/fumika'

export default defineNovelConfig({
  assets: {
    'fumika_base_normal': 'assets/char/fumika_base.png',
    'fumika_emotion_normal': 'assets/char/fumika_face_normal.png',
    // ... 기타 에셋들
  },
  characters: {
    'fumika': fumika
  }
})
```

---

## 3. 속성 상세 참조 (Property Reference)

### 3.1. 정의 상세 (Definition)
`defineCharacter`에 전달되는 객체의 주요 속성들입니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `name` | `string` | 캐릭터의 실명 또는 표시 이름입니다. (대사창 등에 표시) |
| `bases` | `Record<string, CharBaseDef>` | 캐릭터의 기본 신체 구조를 정의합니다. |
| `emotions` | `Record<string, Record<string, string>>` | 신체 좌표에 결합할 표정 이미지 매핑입니다. |

#### `bases` (신체/기본 이미지)
캐릭터의 기본 신체 구조를 정의합니다.

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `src` | `string` | 베이스 이미지 에셋 키입니다. |
| `width` | `number` | 캐릭터의 기본 렌더링 너비(px)입니다. 파트 스케일 계산의 기준이 됩니다. |
| `height` | `number` | 캐릭터의 기본 렌더링 높이(px)입니다. |
| `naturalWidth`| `number` | **중요**: 원본 이미지의 실제 너비입니다. `width / naturalWidth` 비율로 파트 이미지 크기를 자동 조절합니다. |
| `points` | `Record<string, Point>` | 파트를 배치할 앵커 좌표 및 포커싱 좌표입니다. |

#### `emotions` (감정/파트 이미지)
`bases`에서 정의한 `points`에 올릴 파트 이미지들을 조합합니다.

* **구조**: `Record<EmotionKey, Record<PointKey, AssetKey>>`
* **타입 제약**: `PointKey`는 반드시 `bases` 내부의 `points`에 정의된 키 중 하나여야 합니다.

---

## 4. 좌표 설정 (`Point`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `x` | `number` | 이미지 가로 비율 (0.0 ~ 1.0). 0.5가 가로 중앙입니다. |
| `y` | `number` | 이미지 세로 비율 (0.0 ~ 1.0). 0.0이 최상단입니다. |
| `width` | `number` | (선택) 해당 포인트에 배치될 파트의 강제 렌더링 너비(px)입니다. 미지정 시 배율에 따라 자동 계산됩니다. |

---

## 5. 주의 사항 (Edge Cases)

* **타입 오류**: `emotions`에서 `bases`에 존재하지 않는 `point` 키를 사용하면 TypeScript 오류가 발생합니다.
* **naturalWidth 권장**: 파트 이미지가 신체 이미지와 동일한 캔버스 크기를 공유하지 않는 경우, 정확한 정렬을 위해 `naturalWidth`를 명시하는 것을 강력히 권장합니다.
* **에셋 등록**: 모든 `src` 및 `emotions`의 값은 `novel.config.ts`의 `assets`에 등록되어 있어야 합니다.

