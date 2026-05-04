# 🔀 Condition Module

본 문서는 `condition` 모듈을 사용하여 게임 내 변수 상태나 특정 로직에 따라 시나리오의 흐름을 분기(Branching)하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`condition` 모듈은 비주얼 노벨의 선형적인 흐름에 지능적인 분기를 부여하는 핵심 구성 요소입니다.  
`if-else` 구조를 통해 특정 조건의 참(True)과 거짓(False) 여부를 판별하며, 그 결과에 따라 현재 장면 내의 특정 지점으로 점프하거나 완전히 새로운 장면을 로드할 수 있습니다.  

### 주요 특징
*   **유연한 조건 판별**: JavaScript의 논리 연산자를 그대로 활용하여 복잡하고 정교한 조건을 실시간으로 평가할 수 있습니다.  
*   **장면 및 라벨 제어**: 현재 실행 중인 씬 내의 특정 라벨(`goto`)로 이동하거나, 아예 다른 시나리오 파일(`next`)로 전환하는 강력한 흐름 제어를 지원합니다.  
*   **지능형 대체(Else) 처리**: 조건이 만족되지 않을 경우의 동작을 상세히 지정할 수 있으며, 라벨과 씬 이름을 자동으로 판별하여 이동하는 편의성을 제공합니다.  

---

## 2. 핵심 예제 (Main Example)

### 변수 기반의 시나리오 분기 구현

```ts
[
  {
    type: 'condition',
    // 전역 변수 courage가 10 이상인지 판별합니다.  
    if: ({ vars }) => vars.courage >= 10,
    next: 'boss_battle', // 참일 경우 boss_battle 씬으로 전환합니다.  
    'else-next': 'bad_ending' // 거짓일 경우 bad_ending 씬으로 전환합니다.  
  },
  {
    type: 'condition',
    // 지역 변수 _hasKey의 상태를 확인합니다.  
    if: ({ localVars }) => localVars._hasKey,
    goto: 'open_door',      // 참일 경우 현재 씬의 'open_door' 라벨로 점프합니다.  
    'else-goto': 'locked_door' // 거짓일 경우 'locked_door' 라벨로 점프합니다.  
  }
]
```

---

## 3. 커맨드 상세 (Command Reference)

### Condition 명령 (`ConditionCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'condition'` | ✅ | 조건 분기 커맨드임을 명시합니다. |
| `if` | `boolean \| Function` | ✅ | 분기를 결정할 기준 조건입니다.  실시간 평가를 위해 주로 함수형을 권장합니다. |
| `next` | `string \| object` | - | 조건이 **참**일 때 이동할 대상 씬입니다.  설정 객체를 통해 상태 보존 여부를 지정할 수 있습니다. |
| `goto` | `string` | - | 조건이 **참**일 때 이동할 현재 씬 내의 **라벨(Label)** 이름입니다. |
| `else` | `string` | - | 조건이 **거짓**일 때 이동할 대상입니다.  라벨 존재 여부를 먼저 확인한 후 씬으로 간주합니다. |
| `else-goto` | `string` | - | 조건이 **거짓**일 때 이동할 현재 씬 내의 **라벨** 이름입니다. |
| `else-next` | `string \| object` | - | 조건이 **거짓**일 때 이동할 대상 **씬**입니다. |

---

## 4. 활용 사례 가이드

### 단일 조건 분기 패턴 (If Pattern)
특정 조건이 만족될 때만 연출을 실행하고, 그렇지 않으면 다음 단계로 넘어가는 구조입니다.  

```ts
[
  {
    type: 'condition',
    if: ({ vars }) => vars.has_item,
    'else-goto': 'end_if' // 거짓일 경우 블록 끝으로 즉시 건너뜁니다.  
  },
  { type: 'dialogue', text: '중요한 아이템을 소지하고 계시는군요!' },
  { type: 'label', name: 'end_if' }
]
```

### 복합 루프 패턴 (Loop Pattern)
`condition`과 `label`을 결합하여 특정 시나리오를 반복 재생하는 고도화된 연출 기법입니다.  

```ts
[
  { type: 'var', var: { _count: 0 } }, // 반복 횟수 초기화
  { type: 'label', name: 'loop_start' },
  { type: 'dialogue', text: '현재 반복 횟수: {{_count + 1}}' },
  { type: 'var', var: ({ _count }) => ({ _count: _count + 1 }) }, // 카운트 증가
  {
    type: 'condition',
    if: ({ localVars }) => localVars._count < 3,
    goto: 'loop_start', // 조건 만족 시 시작 지점으로 다시 점프합니다.  
    'else-goto': 'loop_end'
  },
  { type: 'label', name: 'loop_end' }
]
```

---

## 5. 주의 사항 (Edge Cases)

*   **동작 우선순위**: 참(True) 판정 시 `goto`가 `next`보다 높은 우선순위를 가집니다.  거짓(False) 판정 시에는 `else-goto`, `else-next`, `else` 순으로 평가됩니다.  
*   **지능형 대상 판별**: `else` 속성은 라벨 탐색을 우선적으로 수행하며, 일치하는 라벨이 없을 경우에만 새로운 씬 로드 시퀀스로 진입합니다.  명확한 의도 전달을 위해 가급적 전용 속성 사용을 권장합니다.  
*   **즉시 실행 특성**: 이 커맨드는 시각적 요소를 포함하지 않으며, 조건 평가 즉시 실행 흐름을 제어하므로 연출 간의 끊김 없는 연결이 가능합니다.  
