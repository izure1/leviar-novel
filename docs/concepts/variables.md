# 💎 Variables (변수 시스템)

---

## 1. 개요 (Overview)

`fumika` 엔진의 변수 시스템은 게임의 상태를 저장하고 흐름을 제어하는 핵심 요소입니다. 변수는 크게 게임 전체에서 유지되는 **전역 변수**와, 현재 씬 내에서만 임시로 사용되는 **지역 변수**로 나뉩니다.

### 주요 특징
* **자동 스코프 관리**: 변수 이름의 접두사(`_`) 유무에 따라 스코프가 자동으로 결정됩니다.
* **데이터 보존**: 모든 변수(전역/지역)는 세이브 데이터에 저장됩니다.
* **유연한 접근**: 대사 텍스트 내에서 직접 출력하거나, 함수형 값(Resolvable)을 통해 로직에 활용할 수 있습니다.

## 2. 변수 정의 (Definition)

### 2.1. 전역 변수 (Global Variables)
게임 전체 세이브 데이터에 포함되며 모든 씬에서 공유되는 변수입니다.
* **정의 위치**: `novel.config.ts`의 `vars` 속성
* **명명 규칙**: `_` 접두사를 **사용하지 않습니다.**

```ts
// novel.config.ts
export default defineNovelConfig({
  variables: {
    gold: 1000,      // 전역 변수
    playerName: ''   // 전역 변수
  }
})
```

### 2.2. 씬 지역 변수 (Local Variables)
현재 씬에서만 유효하며, 세이브 데이터에 저장됩니다.
* **정의 위치**: `defineScene`의 `variables` 속성
* **명명 규칙**: 반드시 `_` 접두사를 **사용해야 합니다.**

```ts
// scene-start.ts
export default defineScene({
  config,
  variables: {
    _tempCount: 0,   // 지역 변수 (반드시 _ 시작)
    _isTalking: true // 지역 변수 (반드시 _ 시작)
  }
}, [ ... ])
```

---

## 3. 변수 조작 (Manipulation)

변수는 커맨드 내의 `var` 속성을 통해 값을 할당하거나 연산할 수 있습니다. `Resolvable` 함수를 사용하면 현재 변수 상태를 참조하여 동적으로 값을 계산할 수 있습니다.

```ts
{
  type: 'choices',
  choices: [
    { 
      text: '물건을 산다 (100G)', 
      var: ({ gold, _tempCount }) => ({ 
        gold: gold - 100,      // 전역 변수 차감
        _tempCount: _tempCount + 1 // 지역 변수 가산
      }) 
    }
  ]
}
```

---

## 4. 변수 활용 (Usage)

### 4.1. 대사 내 출력 (Interpolation)
대사 텍스트(`text`) 내부에서 `{{변수명}}` 형식을 사용하여 실시간 변수 값을 출력할 수 있습니다. `{{ }}` 내부에는 단순 변수명뿐만 아니라 간단한 JavaScript 표현식도 사용할 수 있습니다.

```ts
{ 
  type: 'dialogue', 
  text: '현재 소지금은 {{gold}}G 입니다. (내일은 {{gold + 100}}G)' 
}
```

### 4.2. 조건 분기 활용 (`condition`)
변수 상태에 따라 시나리오의 흐름을 바꿀 수 있습니다.

```ts
{ 
  type: 'condition', 
  if: ({ _try_count }) => _try_count > 3, 
  goto: 'fail_label' 
}
```

---

## 5. 주의 사항 (Edge Cases)

*   **이름 충돌**: 전역 변수와 지역 변수의 이름이 같을 경우(예: `gold`와 `_gold`), 접두사로 인해 서로 다른 변수로 취급되므로 혼동하지 않도록 주의하십시오.
*   **초기화 시점**: `initial.variables`에 정의된 값은 씬이 로드되는 시점에 적용됩니다. 씬 전환 시 `preserve` 옵션이 켜져 있다면 이전 씬의 변수 상태가 유지될 수도 있습니다.
*   **타입 안전성**: TypeScript를 사용한다면 `defineNovelConfig`에서 전역 변수의 타입을 미리 정의하여 자동완성과 타입 체크 혜택을 누릴 수 있습니다.
