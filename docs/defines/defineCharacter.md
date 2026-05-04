# 🛠️ defineCharacter

본 문서는 `defineCharacter` 헬퍼 함수를 사용하여 캐릭터의 외형, 감정 표현 및 앵커 좌표를 정교하게 정의하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`defineCharacter`는 캐릭터의 이름, 신체 이미지, 표정 파트 및 카메라 포커싱을 위한 좌표 정보를 단일 구조로 통합 관리하는 고수준 헬퍼 함수입니다.  
신체(`bases`)와 표정(`emotions`) 파트를 독립적으로 분리하여 정의함으로써, 메모리 효율성을 극대화하고 강력한 타입 추론을 통한 개발 생산성 향상을 제공합니다.  

### 주요 이점
*   **체계적인 모듈화**: 캐릭터별로 독립된 파일 구성을 지원하여 대규모 프로젝트에서도 유지보수가 용이합니다.  
*   **강력한 타입 안전성**: `emotions` 정의 시, 반드시 `bases`에서 선언한 `points` 식별자만을 사용하도록 TypeScript 수준에서 엄격하게 검증합니다.  
*   **자원 최적화**: 하나의 신체 이미지(`base`)에 다양한 표정 에셋(`emotions`)을 조합하는 아키텍처를 통해 GPU 메모리 점유율을 최소화합니다.  

---

## 2. 사용 방법 (Usage)

### 2.1. 캐릭터 정의 모듈 생성
캐릭터의 모든 물리적 속성을 단일 객체 인자로 전달하여 정의합니다.  

```ts
// src/characters/fumika.ts
import { defineCharacter } from 'fumika'

export default defineCharacter({
  name: '후미카',
  bases: {
    normal: {
      src: 'fumika_base_normal',
      width: 560,
      naturalWidth: 1120, // 원본 이미지의 실제 너비 (파트 정렬 스케일 계산에 활용됩니다)
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

### 2.2. 최상위 엔진 설정에 등록
정의된 캐릭터 모듈을 `novel.config.ts`의 `characters` 섹션에 연결하여 엔진이 인식하도록 합니다.  

```ts
// novel.config.ts
import { defineNovelConfig } from 'fumika'
import fumika from './characters/fumika'

export default defineNovelConfig({
  assets: {
    'fumika_base_normal': 'assets/char/fumika_base.png',
    'fumika_emotion_normal': 'assets/char/fumika_face_normal.png',
    // ... 기타 에셋 매핑
  },
  characters: {
    'fumika': fumika
  }
})
```

---

## 3. 속성 상세 명세 (Property Reference)

### 3.1. 기본 식별 정보
| 속성 명칭 | 데이터 타입 | 상세 설명 |
| :--- | :--- | :--- |
| **`name`** | `string` | 캐릭터의 실명 또는 화면에 출력될 이름입니다.  (대화창 화자 영역에 표시됩니다) |
| **`bases`** | `object` | 캐릭터의 기본적인 신체 형태와 기준 좌표계(Points)를 정의합니다. |
| **`emotions`** | `object` | 특정 상황에서의 감정 표현과 앵커 포인트별 이미지 매핑 정보입니다. |

#### `bases` (신체 및 기준 좌표 정의)
| 속성 명칭 | 데이터 타입 | 상세 설명 |
| :--- | :--- | :--- |
| **`src`** | `string` | 신체 원본 이미지의 에셋 식별자입니다. |
| **`width`** | `number` | 캐릭터의 표준 렌더링 너비(px)입니다.  파트 크기 산정의 기준점이 됩니다. |
| **`naturalWidth`**| `number` | **[필수 권장]** 이미지 파일의 실제 너비입니다.  파트 이미지와의 정밀한 스케일 동기화에 사용됩니다. |
| **`points`** | `object` | 표정 파트가 배치될 위치 및 카메라가 집중할 앵커 좌표 목록입니다. |

---

## 4. 좌표 시스템 설계 (`Point`)

캐릭터의 특정 부위를 식별하고 파트를 배치하기 위한 기하학적 설정입니다.  

| 속성 명칭 | 데이터 타입 | 상세 설명 |
| :--- | :--- | :--- |
| **`x`** | `number` | 이미지 전체 너비에 대한 가로 비율 (0.0 ~ 1.0)입니다.  0.5는 중앙을 의미합니다. |
| **`y`** | `number` | 이미지 전체 높이에 대한 세로 비율 (0.0 ~ 1.0)입니다.  0.0은 최상단입니다. |
| **`width`** | `number` | (선택 사항) 해당 포인트에 배치될 이미지 파트의 강제 렌더링 너비(px)입니다. |

---

## 5. 주의 사항 (Edge Cases)

*   **타입 무결성 검증**: `emotions` 섹션에서 `bases`에 존재하지 않는 `points` 키를 사용할 경우, TypeScript 컴파일러가 이를 즉시 감지하여 오류로 처리합니다.  
*   **naturalWidth의 중요성**: 표정 파트 이미지와 신체 이미지의 원본 캔버스 크기가 상이할 경우, 정교한 정렬을 위해 반드시 `naturalWidth`를 명시해 주시기 바랍니다.  
*   **에셋 연동**: 정의된 모든 `src` 및 `emotions` 값은 `novel.config.ts`의 `assets` 테이블에 사전에 등록되어 있어야 엔진이 정상적으로 로드할 수 있습니다.  
