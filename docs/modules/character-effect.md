# ⚡ Character Effect Module

---

## 1. 개요 (Overview)

`character-effect` 모듈은 화면의 캐릭터 객체에만 독립적인 물리적 연출 효과를 적용합니다. 캐릭터를 흔들거나 튀게 하는 등의 효과를 통해 감정 상태(당황, 분노 등)나 상황의 역동성을 시각적으로 극대화할 수 있습니다.

### 주요 특징
* **개별 적용**: 화면 전체가 아닌 특정 캐릭터만 선택적으로 효과를 줄 수 있습니다.
* **프리셋 기반**: `shake`, `bounce`, `pulse` 등 미리 정의된 고품질 연출 효과를 즉시 사용합니다.
* **커스텀 강도**: 지속 시간, 강도, 반복 횟수를 조절하여 세밀한 연출이 가능합니다.

---

## 2. 커맨드 상세 (Command Reference)

### Character Effect 명령 (`CharacterEffectCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'character-effect'` | ✅ | 커맨드 타입을 명시합니다. |
| `name` | `CharacterKeysOf<Config>` | ✅ | 효과를 적용할 캐릭터의 고유 키입니다. |
| `preset` | `CameraEffectPreset` | ✅ | 연출 효과 프리셋입니다. (하단 표 참조) |
| `duration` | `number` | - | 효과의 전체 지속 시간(ms)입니다. |
| `intensity` | `number` | - | 효과의 세기입니다. (프리셋 기본값을 배수로 덮어씀) |
| `repeat` | `number` | - | 효과 반복 횟수입니다. (`-1`은 무한 반복) |

#### 효과 프리셋 (`preset`)

사용 가능한 모든 효과 프리셋과 상세 설명은 아래 공용 문서를 참조하십시오.

```ts
// 캐릭터가 심장 박동처럼 커졌다 작아짐
{ type: 'character-effect', name: 'heroine', preset: 'pulse', duration: 800, repeat: -1 }
```
* [모션 효과 프리셋 목록 가이드](../effects/presets.md)

### 활용 예시

```ts
// 1. 당황한 연출: 짧고 강하게 흔들기
{ type: 'character-effect', name: 'heroine', preset: 'shake', duration: 300, intensity: 2 }

// 2. 깜짝 놀란 연출: 위로 한 번 튀어오름
{ type: 'character-effect', name: 'heroine', preset: 'bounce', duration: 400 }

// 3. 심장 박동: 지속적으로 커졌다 작아짐
{ type: 'character-effect', name: 'heroine', preset: 'pulse', duration: 800, repeat: -1 }
```

---

## 3. 주의 사항 (Edge Cases)

* **오브젝트 상태**: 캐릭터가 화면에서 `remove`되었거나 아직 `show`되지 않은 상태에서는 효과가 무시됩니다.
* **효과 교체**: 동일한 캐릭터에게 새로운 `character-effect`를 호출하면 이전 효과는 즉시 중단되고 새 효과가 덮어씌워집니다.
* **카메라 효과와의 구분**: `camera-effect`는 화면 전체(배경 포함)를 제어하며, `character-effect`는 특정 캐릭터 레이어만 제어합니다.
