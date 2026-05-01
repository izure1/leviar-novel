# 🔀 Condition Module

---

## 1. 개요 (Overview)

`condition` 모듈은 게임 내 변수의 상태나 특정 조건에 따라 시나리오의 흐름을 분기(Branching)하는 기능을 제공합니다. `if-else` 구조를 통해 조건이 참(True)일 때와 거짓(False)일 때 각각 다른 라벨이나 씬으로 이동할 수 있습니다.

### 주요 특징
*   **조건부 분기**: JavaScript 논리 연산자를 사용하여 복잡한 조건을 평가할 수 있습니다.
*   **라벨 및 씬 이동**: 현재 씬 내의 특정 위치(`goto`)로 점프하거나, 아예 새로운 씬(`next`)을 로드할 수 있습니다.
*   **유연한 Else 처리**: 조건이 맞지 않을 때의 동작을 상세하게 지정할 수 있으며, `else` 하나로 라벨/씬을 자동 판별하여 이동할 수도 있습니다.

---

## 2. 핵심 예제 (Main Example)

### 기본 변수 조건 분기

```ts
[
  {
    type: 'condition',
    // 전역 변수 courage가 10 이상인 경우
    if: ({ vars }) => vars.courage >= 10,
    next: 'boss_battle', // 참이면 boss_battle 씬으로 이동
    'else-next': 'bad_ending' // 거짓이면 bad_ending 씬으로 이동
  },
  {
    type: 'condition',
    // 지역 변수 _hasKey가 true인 경우
    if: ({ localVars }) => localVars._hasKey,
    goto: 'open_door',       // 참이면 현재 씬의 'open_door' 라벨로 이동
    'else-goto': 'locked_door' // 거짓이면 현재 씬의 'locked_door' 라벨로 이동
  }
]
```


---

## 3. 커맨드 상세 (Command Reference)

### Condition 명령 (`ConditionCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'condition'` | ✅ | 조건 분기 커맨드임을 명시합니다. |
| `if` | `boolean` | ✅ | 분기를 결정할 조건입니다. 스크립트 작성 시에는 보통 `({ vars, localVars }) => boolean` 형태의 함수를 전달하여 실시간으로 평가합니다. |
| `next` | `string \| object` | - | 조건이 **참**일 때 이동할 **다음 씬**입니다. `{ scene: string, preserve: boolean }` 객체를 사용하여 상태 유지 여부를 결정할 수 있습니다. |
| `goto` | `string` | - | 조건이 **참**일 때 이동할 **현재 씬 내의 라벨(Label)** 이름입니다. |
| `else` | `string` | - | 조건이 **거짓**일 때 이동할 대상입니다. 해당 이름의 라벨이 존재하면 `jumpToLabel`을, 없으면 `loadScene`을 수행합니다. |
| `else-goto` | `string` | - | 조건이 **거짓**일 때 이동할 **현재 씬 내의 라벨** 이름입니다. |
| `else-next` | `string \| object` | - | 조건이 **거짓**일 때 이동할 **다음 씬**입니다. |

---

## 4. 활용 사례 (Use Cases)

### If 패턴 (단일 조건문)
특정 조건이 참일 때만 실행하고, 거짓이면 건너뛰는 구조입니다.

```ts
[
  {
    type: 'condition',
    if: ({ vars }) => vars.has_item,
    // 거짓일 때 블록 끝으로 점프
    'else-goto': 'end_if'
  },
  // --- If Block Start ---
  { type: 'dialogue', text: '아이템을 가지고 있군요!' },
  // --- If Block End ---
  { type: 'label', name: 'end_if' }
]
```

### If-Else 패턴 (양갈래 분기)
참일 때와 거짓일 때 각각 다른 연출을 보여주고 다시 합쳐지는 구조입니다.

```ts
[
  {
    type: 'condition',
    if: ({ vars }) => vars.score > 50,
    // 거짓일 때 else 블록으로 점프
    'else-goto': 'else_block'
  },
  // --- If Block Start ---
  { type: 'dialogue', text: '성적이 우수합니다!' },
  { type: 'condition', goto: 'after_if' }, // 중요: 참 블록 실행 후 else 블록을 건너뜀
  // --- If Block End ---

  { type: 'label', name: 'else_block' },
  // --- Else Block Start ---
  { type: 'dialogue', text: '조금 더 노력이 필요합니다.' },
  // --- Else Block End ---

  { type: 'label', name: 'after_if' }
]
```

### 반복문 (Loop) 패턴
`condition`과 `label`을 조합하여 특정 연출을 반복하는 구조입니다.

```ts
[
  // 1. 카운터 초기화 (지역 변수 사용)
  { type: 'var', var: { _count: 0 } },

  // 2. 루프 시작 지점 라벨
  { type: 'label', name: 'loop_start' },

  { type: 'dialogue', text: '반복 횟수: {{_count + 1}}' },

  // 3. 카운터 증가
  { type: 'var', var: ({ _count }) => ({ _count: _count + 1 }) },

  // 4. 조건 체크 및 루프
  {
    type: 'condition',
    if: ({ localVars }) => localVars._count < 3,
    goto: 'loop_start',
    'else-goto': 'loop_end'
  },

  { type: 'label', name: 'loop_end' }
]
```

---

## 5. 주의 사항 (Edge Cases)

*   **우선순위**: `if`가 참일 때 `goto`와 `next`가 모두 있다면 **`goto`가 우선**됩니다. 거짓일 때는 `else-goto` > `else-next` > `else` 순으로 우선순위가 적용됩니다.
*   **else의 자동 판별**: `else` 속성은 먼저 현재 씬에서 해당 이름의 라벨을 찾고, 없을 경우에만 씬 이름으로 간주하여 로드합니다. 명확한 동작을 원한다면 `else-goto`나 `else-next`를 사용하는 것이 권장됩니다.
*   **즉시 실행**: 이 커맨드는 UI를 표시하지 않으며, 조건을 평가한 즉시 지정된 위치로 실행 흐름을 옮깁니다.
