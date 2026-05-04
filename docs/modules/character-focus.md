# 🎯 Character Focus Module

본 문서는 `character-focus` 모듈을 사용하여 화면 내 캐릭터의 특정 부위를 정교하게 조준하고 클로즈업하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`character-focus` 모듈은 활성화된 캐릭터의 특정 신체 부위로 카메라를 자동 이동시키고 확대하는 연출을 전담합니다.  
캐릭터 설정 시 사전에 정의된 좌표 데이터(`points`)를 활용하므로, 복잡한 픽셀 계산 없이도 인물 중심의 입체적인 시각 연출을 구현할 수 있습니다.  

### 주요 특징
*   **포인트 기반 자동 조준**: `face`, `chest`, `hand` 등 명명된 포인트 키를 사용하여 카메라 시점을 정확하게 고정합니다.  
*   **지능형 배율 계산**: 캐릭터의 실제 크기와 현재 화면 렌더링 상태를 분석하여, 최적의 줌 배율을 자동으로 적용합니다.  
*   **부드러운 시점 전환**: 이동 속도(`duration`)와 확대 수준(`zoom`)을 자유롭게 조합하여 상황에 맞는 연출이 가능합니다.  

---

## 2. 사전 준비 (Prerequisites)

이 기능을 원활하게 사용하기 위해서는 캐릭터를 정의할 때 각 이미지별로 유효한 `points` 좌표 데이터가 포함되어 있어야 합니다.  

```ts
import { defineCharacter } from 'fumika'

export const fumika = defineCharacter({
  name: '후미카',
  bases: {
    normal: {
      src: 'char_fumika_base',
      width: 560,
      points: {
        face: { x: 0.5, y: 0.2 }, // 얼굴 위치 지정 (상대 좌표 0.0 ~ 1.0)
        hand: { x: 0.3, y: 0.6 }  // 특정 소품이나 손의 위치 지정
      }
    }
  },
  emotions: {
    normal: { face: 'char_fumika_face_normal' }
  }
})
```

---

## 3. 커맨드 상세 (Command Reference)

### Character Focus 명령 (`CharacterFocusCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'character-focus'` | ✅ | 커맨드 타입을 명시합니다. |
| `name` | `string` | ✅ | 포커싱을 수행할 대상 캐릭터의 고유 키입니다. |
| `point` | `string` | - | 포커스할 포인트의 키 이름입니다.  (캐릭터 설정 데이터 기반) |
| `zoom` | `string` | - | 확대 배율 프리셋입니다.  (`close-up`, `medium`, `wide`, `reset`, `inherit`) |
| `duration` | `number` | - | 카메라가 목표 지점까지 이동하는 시간(ms)입니다. |

### 활용 예시

```ts
// 1. 인물의 얼굴을 정밀하게 클로즈업 (800ms간 이동)
{ type: 'character-focus', name: 'heroine', point: 'face', zoom: 'close-up', duration: 800 }

// 2. 포커스를 해제하고 전체 화면 시점으로 복귀
{ type: 'character-focus', name: 'heroine', zoom: 'reset', duration: 500 }
```

---

## 4. 주의 사항 (Edge Cases)

*   **에셋 로딩 동기화**: 대상 캐릭터의 이미지가 아직 로딩되지 않아 정확한 크기 측정이 불가능한 경우, 엔진은 로딩이 완료될 때까지 명령의 최종 실행을 안전하게 대기시킵니다.  
*   **좌표값 폴백(Fallback)**: `point` 속성을 생략하거나 정의되지 않은 키를 입력할 경우, 엔진은 캐릭터 이미지의 기하학적 정중앙(0.5, 0.5)을 조준하도록 설계되어 있습니다.  
*   **통합 연출 편의성**: `character` 커맨드 내부의 `focus` 속성을 통해서도 동일한 효과를 거둘 수 있으므로, 등장과 동시에 포커싱을 수행하려는 경우 이를 적극 활용하시기 바랍니다.  
