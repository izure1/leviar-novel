# ⚡ Character Effect Module

본 문서는 `character-effect` 모듈을 사용하여 화면 내 특정 캐릭터 객체에 독립적인 물리 연출 효과를 적용하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`character-effect` 모듈은 특정 캐릭터만을 대상으로 흔들림, 도약, 맥동 등 역동적인 시각 효과를 부여하는 기능을 담당합니다.  
인물의 감정 상태(당황, 분노, 공포 등)나 상황의 역동성을 전체 화면의 변화 없이 해당 캐릭터에게만 집중시켜 연출할 때 매우 효과적입니다.  

### 주요 특징
*   **개별 타겟팅 제어**: 배경이나 다른 캐릭터에게 영향을 주지 않고, 지정된 특정 캐릭터 레이어만 선택적으로 연출할 수 있습니다.  
*   **고품질 프리셋 시스템**: `shake`, `bounce`, `pulse` 등 검증된 물리 연출 프리셋을 통해 즉각적인 고품질 연출이 가능합니다.  
*   **정밀한 수치 조정**: 지속 시간, 강도 배율, 반복 횟수를 자유롭게 설정하여 상황에 걸맞은 세밀한 표현을 지원합니다.  

---

## 2. 커맨드 상세 (Command Reference)

### Character Effect 명령 (`CharacterEffectCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'character-effect'` | ✅ | 커맨드 타입을 명시합니다. |
| `name` | `string` | ✅ | 효과를 적용할 캐릭터의 식별자입니다. |
| `preset` | `string` | ✅ | 적용할 연출 효과 프리셋 이름입니다. |
| `duration` | `number` | - | 효과 시퀀스가 1회 진행되는 시간(ms)입니다. |
| `intensity` | `number` | - | 효과의 물리적 세기 배율입니다.  (기본값은 1.0입니다) |
| `repeat` | `number` | - | 효과의 반복 횟수입니다.  (`-1` 설정 시 정지 전까지 무한 반복됩니다) |

#### 효과 프리셋 활용 예시
사용 가능한 모든 프리셋에 대한 상세한 설명과 시각적 가이드는 [모션 효과 프리셋 목록 가이드](../effects/presets.md) 문서를 참조해 주십시오.  

```ts
// 캐릭터가 심장 박동처럼 커졌다 작아지는 연출을 무한히 반복합니다.  
{ type: 'character-effect', name: 'heroine', preset: 'pulse', duration: 800, repeat: -1 }
```

---

## 3. 활용 예시 (Usage Examples)

```ts
// 1. 당황한 연출: 짧고 강하게 수평으로 흔듭니다.  
{ type: 'character-effect', name: 'heroine', preset: 'shake', duration: 300, intensity: 2 }

// 2. 깜짝 놀란 연출: 위 방향으로 한 번 가볍게 튀어오릅니다.  
{ type: 'character-effect', name: 'heroine', preset: 'bounce', duration: 400 }

// 3. 존재감 강조: 지속적으로 크기가 완만하게 변하며 주의를 끕니다.  
{ type: 'character-effect', name: 'heroine', preset: 'pulse', duration: 1200, repeat: -1 }
```

---

## 4. 주의 사항 (Edge Cases)

*   **객체 활성화 상태 확인**: 대상 캐릭터가 화면에서 이미 제거(`remove`)되었거나 아직 등장(`show`)하지 않은 상태에서는 해당 명령이 무시됩니다.  
*   **효과 덮어쓰기 정책**: 동일한 캐릭터에게 새로운 물리 효과 명령이 하달되면, 기존에 실행 중이던 효과는 즉시 중단되고 새로운 연출이 최우선적으로 적용됩니다.  
*   **카메라 효과와의 차별점**: [카메라 효과 (camera-effect)](./camera-effect.md)는 배경을 포함한 모든 시각 요소를 동시에 조작하는 반면, 본 모듈은 오직 지정된 캐릭터 레이어의 변환 정보(Transform)만을 개별적으로 제어합니다.  
*   **좌표 복구 메커니즘**: 모든 효과가 종료되거나 정지되면, 캐릭터 객체는 효과 적용 전의 원래 위치와 크기로 정교하게 복귀합니다.  
