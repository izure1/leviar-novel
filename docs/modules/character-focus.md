# 🎯 Character Focus Module

---

## 1. 개요 (Overview)

`character-focus` 모듈은 활성화된 캐릭터의 특정 부위로 카메라를 이동시키고 확대하는 연출을 담당합니다. 캐릭터 설정 시 정의된 좌표(`points`)를 기반으로 복잡한 계산 없이 인상적인 클로즈업 연출을 구현할 수 있습니다.

### 주요 특징
* **좌표 기반 자동화**: `face`, `chest` 등 미리 정의된 포인트 키만으로 카메라를 정확히 조준합니다.
* **지능형 확대**: 캐릭터의 크기와 렌더링 상태를 고려하여 최적의 줌 배율을 적용합니다.
* **유연한 전환**: 이동 속도(`duration`)와 줌 프리셋(`zoom`)을 자유롭게 조정할 수 있습니다.

---

## 2. 사전 준비 (Prerequisites)

이 기능을 사용하려면 캐릭터 정의 시 이미지별로 `points` 좌표가 설정되어 있어야 합니다.

```ts
// src/characters/fumika.ts
export const fumika = defineCharacter({
  images: {
    normal: {
      src: 'char_fumika_normal',
      points: {
        face: { x: 0.5, y: 0.2 }, // 얼굴 위치 (상대 좌표 0.0 ~ 1.0)
        hand: { x: 0.3, y: 0.6 }  // 손 위치
      }
    }
  }
})
```

---

## 3. 커맨드 상세 (Command Reference)

### Character Focus 명령 (`CharacterFocusCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'character-focus'` | ✅ | 커맨드 타입을 명시합니다. |
| `name` | `CharacterKeysOf<Config>` | ✅ | 포커스할 캐릭터의 고유 키입니다. |
| `point` | `PointsOf<Config, Name>` | - | 포커스할 포인트의 키입니다. (캐릭터 설정에 정의된 값) |
| `zoom` | `ZoomPreset` | - | 확대 배율입니다. (`close-up`, `medium`, `wide`, `reset`, `inherit`) |
| `duration` | `number` | - | 카메라 이동에 걸리는 시간(ms)입니다. |

### 활용 예시

```ts
// 1. 얼굴 클로즈업 (800ms 이동)
{ type: 'character-focus', name: 'heroine', point: 'face', zoom: 'close-up', duration: 800 }

// 2. 포커스 해제 (기본 상태로 복귀)
{ type: 'character-focus', name: 'heroine', zoom: 'reset', duration: 500 }
```

---

## 4. 주의 사항 (Edge Cases)

* **로딩 동기화**: 이미지가 아직 로드되지 않아 크기를 측정할 수 없는 경우, 로딩이 완료될 때까지 명령 실행이 대기(Wait)됩니다.
* **기본값**: `point`를 생략하거나 잘못된 키를 입력하면 캐릭터 이미지의 정중앙(0.5, 0.5)을 조준합니다.
* **등장 시 자동 포커스**: 별도의 커맨드 없이 `character` 커맨드의 `focus` 속성을 통해서도 동일한 효과를 낼 수 있습니다.
