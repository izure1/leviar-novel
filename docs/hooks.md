# Hook 시스템 (Hooks)

Leviar Novel의 Hook 시스템은 엔진의 핵심 동작이나 각 모듈의 실행 과정을 가로채어
데이터를 수정하거나 특정 로직을 삽입할 수 있는 강력한 메커니즘입니다. 모든 훅은
동기(Synchronous) 방식으로 동작하며, `hookall` 라이브러리를 기반으로 합니다.

## 개요 (Overview)

| 속성                | 설명                                                   |
| :------------------ | :----------------------------------------------------- |
| **기반 라이브러리** | `hookall` (Sync)                                       |
| **주요 목적**       | 엔진 상태 변경 모니터링, 데이터 변조, 커스텀 로직 삽입 |
| **범위(Scope)**     | 전역(Global) 및 씬(Scene) 스코프 지원                  |
| **타입 지원**       | TypeScript를 통한 완전한 타입 추론 및 검사             |

---

## 훅의 종류 (Hook Types)

### 1. Novel 레벨 훅 (`novel:*`)

엔진의 핵심 라이프사이클과 관련된 훅입니다.

- **`novel:save`**: 세이브 데이터가 생성될 때 발생합니다. 저장될 데이터를 수정할
  수 있습니다.
- **`novel:load`**: 세이브 데이터를 불러올 때 발생합니다. 불러온 데이터를 수정할
  수 있습니다.
- **`novel:next`**: 다음 대화로 진행(`novel.next()`)할 때 발생합니다. `false`를
  반환하면 진행을 차단할 수 있습니다.
- **`novel:scene`**: 씬이 전환될 때 발생합니다. 대상 씬 이름을 변경할 수
  있습니다.

### 2. 모듈 레벨 훅 (`moduleKey:*`)

각 모듈(dialogue, choice, dialogBox 등) 고유의 동작과 관련된 훅입니다. 접두사로
모듈의 키를 사용합니다.

- **`dialogue:text-render`**: 대화 텍스트가 출력되기 직전에 발생합니다. 출력될
  텍스트나 화자 이름을 수정(치환)할 수 있습니다.
- **`dialogue:text-run`**: 대화 텍스트 출력이 시작될 때 발생합니다. 효과음 재생,
  외부 연동 등에 활용할 수 있습니다.
- **`choice:show`**: 선택지가 화면에 표시되기 직전에 발생합니다. 목록이나
  레이아웃 설정을 동적으로 변경할 수 있습니다.
- **`choice:select`**: 선택지가 클릭된 직후 발생합니다. 이동 분기나 변수 수정이
  적용되기 전에 가로챌 수 있습니다.
- **`dialogBox:show`**: 대화상자(알림 팝업 등)가 표시되기 직전에 발생합니다.
  제목, 내용, 버튼 텍스트를 수정할 수 있습니다.
- **`dialogBox:select`**: 대화상자의 버튼을 클릭하거나 외부 클릭으로 닫힐 때
  발생합니다.

---

## 훅 등록 방법 (Registration)

### 1. 전역 훅 (Global Hooks)

`novel.hooker`를 통해 등록하며, 등록된 이후 모든 과정에서 계속 유지됩니다.

```typescript
novel.hooker.onBefore("dialogue:text", (value) => {
  console.log("대화 출력 직전:", value.text);
  return value; // 반드시 값을 반환해야 합니다.
});
```

### 2. 씬 스코프 훅 (Scene-Scoped Hooks)

`defineHook`을 사용하여 특정 씬에서만 유효한 훅을 등록할 수 있습니다. 자세한
정의 방법은 [🎬 Scenes 가이드](./scenes.md)를 참조하십시오. 이 훅들은 **씬이
시작될 때 등록되고, 씬이 종료되거나 다른 씬으로 전환될 때 자동으로 해제**되어
메모리 누수와 의도치 않은 부작용을 방지합니다.

`defineHook`은 훅 이벤트를 키로 사용하고, 그 내부에 `hookall` 라이프사이클
메서드(`onBefore`, `onAfter`, `onceBefore`, `onceAfter`)를 지정하여 동작합니다.

```typescript
import { defineHook, defineScene } from "fumika";
import config from "./novel.config";

export default defineScene({
  config,
  hooks: defineHook(config, {
    "dialogue:text-render": {
      // 이 씬에서만 모든 대화를 대문자로 변경 (출력 직전 가로채기)
      onBefore: (value) => {
        return { ...value, text: value.text.toUpperCase() };
      },
    },
    "novel:save": {
      // 이 씬에서는 세이브 금지
      onBefore: (data) => {
        throw "이 씬에서는 저장할 수 없습니다.";
      },
    },
    "novel:next": {
      // 다음 진행 시 한 번만 실행되는 후처리
      onceAfter: (value) => {
        console.log("진행 후 한 번 호출됨");
        return value;
      },
    },
  }),
}, [
  { type: "dialogue", text: "hello world" },
]);
```

---

## 주요 API (Reference)

### `novel.hooker`

엔진의 모든 훅을 관리하는 통합 프록시 객체입니다. `novel:*` 이벤트와
`config.modules`에 등록된 모든 모듈의 이벤트를 한곳에서 구독할 수 있습니다.

| 메서드                      | 설명                                       |
| :-------------------------- | :----------------------------------------- |
| `onBefore(key, callback)`   | 로직 실행 전 호출 (데이터 수정 가능)       |
| `onAfter(key, callback)`    | 로직 실행 후 호출                          |
| `onceBefore(key, callback)` | 로직 실행 전 1회만 호출 (데이터 수정 가능) |
| `onceAfter(key, callback)`  | 로직 실행 후 1회만 호출                    |
| `offBefore(key, callback)`  | 등록된 Before 훅 해제                      |
| `offAfter(key, callback)`   | 등록된 After 훅 해제                       |

### `defineHook(config, hookMap)`

`defineScene`의 `hooks` 필드에 전달할 디스크립터를 생성합니다.

- **`config`**: `defineNovelConfig`로 생성된 설정 객체입니다. (타입 추론용)
- **`hookMap`**: 이벤트 키를 기준으로 그룹핑되며, 내부에 `onBefore`, `onAfter`,
  `onceBefore`, `onceAfter` 메서드를 포함하는 객체 맵입니다.

---

## 주의 사항 (Edge Cases)

> [!IMPORTANT]
> **반드시 값을 반환하십시오.** 모든 `onBefore` 훅 콜백은 첫 번째 인자로 받은
> `value`를 (수정 후) 다시 반환해야 합니다. 반환하지 않거나 `undefined`를
> 반환하면 엔진의 데이터가 유실될 수 있습니다.

> [!TIP]
> **타입 안전성** `defineHook`을 사용할 때 `config`를 인자로 전달하면, 해당
> 프로젝트에서 사용 중인 모듈과 `novel.config`의 정의에 따라 훅 이름과 데이터
> 타입이 자동으로 완성됩니다.
