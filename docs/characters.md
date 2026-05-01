# 🎭 Characters Reference

`defineCharacter`를 통해 캐릭터의 메타데이터와 연출용 포인트를 정의합니다. 캐릭터 정보는 단순한 이미지가 아닌, 카메라 연출의 논리적 대상이 됩니다.

---

## 💎 캐릭터 정의 항목 요약

| 속성명 | 필수 | 타입 | 비고 |
| :--- | :---: | :--- | :--- |
| **`name`** | - | `string` | 대사창에 표시될 발화자 이름 정의 |
| **`images`** | O | `object` | 표정별 이미지 및 전용 포커스 포인트 설정 |

---

## 🔄 상세 설정 명세

### 1. 이미지 상세 정의 (`CharImageDef`)

**사용 예시:**
```typescript
const fumika = defineCharacter({
  name: '후미카',
  images: {
    smile: {
      src: 'fumika_smile_img',
      width: 400,
      points: { face: { x: 0.5, y: 0.2 } }
    }
  }
})
```

---

### 2. 포커스 포인트 (`points`)

| 속성명 | 범위 | 비고 |
| :--- | :--- | :--- |
| **`x`, `y`** | `0.0 ~ 1.0` | 이미지 해상도 변화에도 깨지지 않는 고정 구도 확보 |

**상세 설명:**
픽셀 좌표 대신 **상대 좌표(Normalized Coordinates) 시스템**을 사용합니다. 캐릭터 이미지를 고해상도로 교체하거나 크기를 조정하더라도 `0.5`가 항상 캐릭터의 중앙을 가리키도록 보장하므로, 에셋 업데이트 시 시나리오 코드를 수정할 필요가 없습니다.

**사용 예시:**

```typescript
defineCharacter({
  images: {
    normal: {
      src: '...',
      points: {
        face: { x: 0.5, y: 0.18 }, // 얼굴 위치 고정
        hand: { x: 0.7, y: 0.6 }   // 손 위치 고정
      }
    }
  }
})
```

---

## 🏃 캐릭터 연출 커맨드

캐릭터 정의를 활용한 실제 연출 예시입니다.

**사용 예시 (in defineScene):**

```typescript
defineScene({ config }, [
  // 후미카의 얼굴('face') 포인트로 클로즈업 줌인
  { 
    type: 'character-focus', 
    name: 'fumika', 
    point: 'face', 
    zoom: 'close-up', 
    duration: 800 
  }
])
```
