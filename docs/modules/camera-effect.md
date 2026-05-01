# 💥 Camera Effect Module

---

## 1. 개요 (Overview)

`camera-effect` 모듈은 화면 전체에 흔들림이나 진동 같은 물리적인 연출 효과를 적용합니다. 폭발 상황, 캐릭터의 큰 놀람, 긴박한 추격전 등 극적인 연출을 표현할 때 유용하게 사용됩니다.

---

## 2. 핵심 예제 (Main Example)

### 강한 화면 흔들림 (Shake)
지진이나 폭발 효과를 줍니다.

```ts
{ 
  type: 'camera-effect', 
  preset: 'shake', 
  duration: 500, 
  intensity: 10, 
  repeat: 5 
}
```

### 순간적인 충격 (Jolt)
강한 타격이나 순간적인 놀람을 표현할 때 적합합니다.

```ts
{ 
  type: 'camera-effect', 
  preset: 'jolt', 
  duration: 200,
  intensity: 30
}
```

---

## 3. 커맨드 상세 (Command Reference)

### Camera Effect 명령 (`CameraEffectCmd`)

| 속성 | 타입 | 필수 | 기본값 | 설명 |
| :--- | :--- | :---: | :---: | :--- |
| `type` | `'camera-effect'` | ✅ | - | 커맨드 타입을 명시합니다. |
| `preset` | `CameraEffectPreset` | ✅ | - | 적용할 연출 효과 프리셋입니다. (하단 표 참조) |
| `duration` | `number` | - | 프리셋 기본값 | 효과의 전체 지속 시간(ms)입니다. |
| `intensity` | `number` | - | 프리셋 기본값 | 효과의 세기(강도)입니다. |
| `repeat` | `number` | - | `1` | 효과 반복 횟수입니다. |

### 3.2. 효과 프리셋 (`preset`)

사용 가능한 모든 효과 프리셋과 상세 설명은 아래 공용 문서를 참조하십시오.

```ts
// 화면 전체를 10픽셀 강도로 5번 흔들기
{ type: 'camera-effect', preset: 'shake', intensity: 10, repeat: 5 }
```
* [모션 효과 프리셋 목록 가이드](../effects/presets.md)

---

## 4. 주의 사항 (Edge Cases)

* **전체 화면 적용**: `character-effect`와 달리 `camera-effect`는 배경과 모든 오브젝트를 포함한 화면 전체를 흔듭니다.
* **효과 중첩**: 새로운 카메라 효과가 호출되면 기존에 진행 중이던 카메라는 즉시 중단되고 새로운 효과가 시작됩니다.
* **성능**: 강도가 매우 높거나 지속 시간이 긴 효과를 남발하면 시각적 피로감을 줄 수 있으므로 주의해야 합니다.
