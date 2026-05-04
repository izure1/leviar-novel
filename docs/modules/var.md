# 🔢 Variable Module (`var`)

---

## 1. 개요 (Overview)

`var` 모듈은 게임 내에서 사용되는 변수의 값을 동적으로 변경할 때 사용합니다. Fumika 엔진은 **전역 변수(Global)**와 **지역 변수(Local)**라는 두 가지 스코프를 지원하며, 변수 이름의 접두사를 통해 이를 구분합니다.

*   **전역 변수**: 모든 씬에서 공유되며, 세이브 파일에 영구적으로 보존됩니다.
*   **지역 변수 (`_` 접두사)**: 현재 씬 내에서만 유효하며, 씬이 전환되면 초기화됩니다.

---

## 2. 커맨드 상세 (Command Reference)

### Variable 설정 (`VarCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'var'` | ✅ | 커맨드 타입을 명시합니다. |
| `name` | `string` | ✅ | 변경할 변수의 이름입니다. `_`로 시작하면 지역 변수로 취급됩니다. |
| `value` | `any` | ✅ | 설정할 값입니다. 숫자, 문자열, 불리언 등을 지원합니다. |

---

## 3. 활용 예시 (Examples)

### 3.1. 전역 변수 설정 (호감도, 진행도 등)
```ts
[
  { type: 'var', name: 'affection', value: 50 },
  { type: 'var', name: 'has_item_key', value: true },
  { type: 'dialogue', text: '호감도가 상승했습니다.' }
]
```

### 3.2. 지역 변수 설정 (씬 내부 상태 관리)
```ts
[
  // 씬 내에서만 사용하는 카운터
  { type: 'var', name: '_check_count', value: 1 },
  { type: 'dialogue', text: '주변을 조사했다.' }
]
```

---

## 4. 고급 활용: Resolvable을 이용한 연산

`value` 필드에 단순한 값이 아닌 **함수(Resolvable)**를 전달하여, 현재 변수들의 상태를 기반으로 한 복잡한 로직을 수행할 수 있습니다. 함수는 현재 엔진에 등록된 모든 변수(전역 + 지역)를 포함한 객체를 인자로 받습니다.

### 4.1. 수치 가감 및 클램핑 (HP, 골드 등)
단순 할당이 아닌 현재 값을 기준으로 증가시키거나 감소시킬 때 유용합니다.

```ts
{
  type: 'var',
  name: 'hp',
  // 현재 HP가 100을 넘지 않도록 제한하며 20 회복
  value: ({ hp }) => Math.min(100, hp + 20)
}
```

### 4.2. 토글(Toggle) 및 논리 연산
플래그 변수의 상태를 반전시키거나 복합 조건을 계산합니다.

```ts
{
  type: 'var',
  name: 'is_night',
  // 현재 상태 반전 (true -> false, false -> true)
  value: ({ is_night }) => !is_night
}
```

### 4.3. 복합 변수 참조 및 조건부 할당
여러 변수의 값을 조합하여 결과를 도출할 수 있습니다.

```ts
{
  type: 'var',
  name: 'luck_factor',
  // 지력(int)과 행운(luk)의 평균값에 지역 변수인 가중치를 더함
  value: ({ int, luk, _bonus }) => ((int + luk) / 2) + _bonus
}
```

---

## 5. 주의 사항 (Edge Cases)

*   **타입 유연성**: `value`에는 모든 자바스크립트 기본 타입을 사용할 수 있으나, 가급적 `defineNovelConfig`의 `variables` 섹션에 정의된 타입을 따르는 것을 권장합니다.
*   **자동 보존**: 전역 변수는 `novel:save` 훅 발생 시 자동으로 포함되어 영구 저장됩니다.

---

## 📚 상세 개념 (Deep Dive)

Fumika 엔진의 변수 스코프 판별 로직과 생명주기에 대한 더 상세한 이론적 배경은 [변수 시스템 개념 가이드](../concepts.md#3-변수-시스템-variables)를 참조하십시오.
