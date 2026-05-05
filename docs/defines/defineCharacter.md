# 🛠️ 캐릭터 빌더 (defineCharacter)

## 개요 (Overview)

`defineCharacter`는 화면에 출력될 캐릭터의 몸체(bases)와 표정(emotions) 구조를 정의하는 함수입니다.  
하나의 몸체 이미지 위에 여러 표정 이미지를 겹쳐서 출력할 때 사용합니다.  

## 사전 준비 (Prerequisites)

캐릭터에 사용할 몸체 이미지와 표정 이미지의 에셋 ID들이 `novel.config.ts`에 등록되어 있어야 합니다.  

## 핵심 예제 (Main Example)

```typescript
import { defineCharacter } from 'fumika'

export default defineCharacter({
  name: '후미카',
  // 캐릭터의 기본 몸체를 정의합니다
  bases: {
    normal: {
      src: 'char-fumika-base',
      width: 560,
      naturalWidth: 1120, // 원본 이미지 파일의 실제 가로 픽셀입니다
      // 표정이 합성될 위치(앵커)를 비율(0.0~1.0)로 지정합니다
      points: {
        face: { x: 0.445, y: 0.202 }
      }
    }
  },
  // 몸체의 앵커 포인트(face 등) 위에 덧씌워질 표정 이미지를 정의합니다
  emotions: {
    normal: { face: 'char-fumika-normal' },
    smile: { face: 'char-fumika-smile' }
  }
})
```

## 속성 상세

| 속성 명칭 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| **`name`** | `string` | 대화창 등에 출력될 캐릭터의 화면 표시 이름 |
| **`bases`** | `object` | 캐릭터의 기본적인 신체 형태와 좌표계(`points`) 정의 |
| **`emotions`** | `object` | 앵커 포인트에 겹쳐서 출력할 감정 표현 이미지 맵핑 |

### `bases` 속성

| 속성 명칭 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| **`src`** | `string` | 몸체 원본 이미지의 에셋 아이디 |
| **`width`** | `number` | 화면에 출력될 캐릭터의 기준 너비(px) |
| **`naturalWidth`** | `number` | 이미지 파일의 실제 너비(px).  표정 이미지의 정밀한 위치 계산에 사용됩니다. |
| **`points`** | `object` | 표정 파트가 합성될 기준 위치 지정 (`x`, `y` 비율 0~1.0) |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **에셋 미등록 오류** | `src`나 `face` 등에 적힌 에셋 ID는 반드시 `novel.config.ts`의 `assets`에 등록되어 있어야 화면에 나타납니다. |
| **타입 오류 (존재하지 않는 앵커)** | `emotions`에서 사용하는 부위(예: `face`)는 반드시 `bases`의 `points` 안에 미리 선언되어 있어야 에러가 발생하지 않습니다. |
