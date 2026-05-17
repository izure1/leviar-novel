# 🛠️ 캐릭터 빌더 (defineCharacter)

> **Reference 문서**입니다. 개념 학습이 필요하다면 [에셋과 캐릭터 가이드](../tutorial/02-assets-and-characters.md)를 먼저 확인해 보세요.

화면에 출력될 캐릭터의 몸체(bases)와 표정(emotions) 구조를 정의하는 함수입니다.

```typescript
function defineCharacter<TAssets>(assets: TAssets): (def: CharacterDef) => CharacterDef
```

## 세부 설명

Fumika 엔진은 성능 최적화를 위해 캐릭터를 하나의 거대한 이미지가 아니라, 몸체(Base) 위에 얼굴(Emotion)을 덧씌우는 형태로 관리합니다. `defineCharacter`는 이 합성 정보를 엔진에 알려주는 역할을 합니다.

`assets.ts`에서 정의한 에셋 맵을 첫 번째 인자로 전달하면, 표정이나 몸체에 사용되는 이미지 아이디의 오타를 컴파일 단계에서 방지할 수 있습니다.

## 파라미터

| 이름 | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `assets` | `Record<string, string>` | (필수) | `defineAssets`로 생성된 에셋 맵 객체 |
| `def` | `object` | (필수) | 캐릭터 정의 객체 |
| `def.name` | `string` | `undefined` | 대화창 등에 출력될 캐릭터의 표시 이름 |
| `def.bases` | `object` | (필수) | 캐릭터의 기본 몸체 및 앵커 포인트 정의 |
| `def.emotions` | `object` | (필수) | 몸체 위에 덧씌워질 감정 표현 이미지 맵핑 |

### `bases` 상세

| 속성 명칭 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| `src` | `string` | 몸체 원본 이미지의 에셋 아이디 (assets의 키값) |
| `width` | `number` | 화면에 출력될 캐릭터의 기준 너비(px) |
| `points` | `object` | 표정 파트가 합성될 기준 위치 지정 (`x`, `y` 비율 0~1.0) |

## 반환값

엔진이 내부적으로 사용할 수 있도록 타입 검증이 완료된 캐릭터 정의 객체를 반환합니다.

## 예시 코드

```typescript
// ❌ 이렇게 하면 안 됩니다 (에셋을 주입하지 않으면 오타 검출이 안 됨)
export default defineCharacter({})({
  name: '후미카',
  bases: {
    normal: { src: 'wrong-id', width: 560, points: { face: { x: 0.5, y: 0.5 } } }
  },
  emotions: {
    smile: { face: 'another-wrong-id' }
  }
})

// ✅ 이렇게 하세요
import { defineCharacter } from 'fumika'
import assets from '../assets' // defineAssets로 정의된 맵

export default defineCharacter(assets)({
  name: '후미카',
  bases: {
    normal: {
      src: 'char-fumika-base', // assets에 존재하는 키여야 함
      width: 560,
      points: {
        face: { x: 0.445, y: 0.202 }
      }
    }
  },
  emotions: {
    normal: { face: 'char-fumika-normal' }, // assets에 존재하는 키여야 함
    smile: { face: 'char-fumika-smile' }
  }
})
```

> [!WARNING]
> `emotions`에서 사용하는 부위(예: `face`)는 반드시 `bases`의 `points` 안에 미리 선언되어 있어야 정상적으로 렌더링됩니다.

## 관련 항목

- [에셋과 캐릭터 가이드](../tutorial/02-assets-and-characters.md)
