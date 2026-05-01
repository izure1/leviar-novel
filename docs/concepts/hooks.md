# 🪝 Hooks (훅 시스템)

`fumika` 엔진의 훅 시스템은 프레임워크 내부의 데이터 흐름에 개입하여 값을 변경하거나 특정 시점에 사용자 정의 로직을 실행할 수 있게 해주는 이벤트 인터셉터 메커니즘입니다.

---

## 1. 개요 (Overview)

| 항목 | 설명 |
| :--- | :--- |
| **목적** | 엔진/모듈의 핵심 로직 수정 없이 동작 커스터마이징 |
| **방식** | 데이터가 처리되기 전(`Before`) 또는 후(`After`)에 콜백 실행 |
| **종류** | 모듈 전용 훅 (예: `dialogue:`, `choice:`) 및 엔진 전역 훅 (`novel:`) |

---

## 2. 훅의 유형 (Hook Types)

### 2.1. `onBefore` (변형)
핵심 로직이 실행되기 **전**에 호출됩니다. 전달받은 데이터를 수정하여 반환하면, 엔진은 그 수정된 데이터를 바탕으로 로직을 진행합니다.
* **사용 사례**: 텍스트 필터링, 이미지 경로 강제 변경, 조건부 선택지 숨김 등.

### 2.2. `onAfter` (관찰)
로직이 실행된 **후**에 호출됩니다. 이미 처리가 끝난 최종 상태를 확인하는 용도로 주로 사용됩니다.
* **사용 사례**: 로그 기록, 업적 체크, 오디오 재생 상태 추적 등.

---

## 3. 작동 원리: 릴레이(Relay) 방식

여러 개의 훅이 등록되어 있을 때, 엔진은 이를 **릴레이 경주**처럼 처리합니다. 즉, **첫 번째 훅이 수정한 결과값이 두 번째 훅의 입력값으로 전달**됩니다.

### 3.1. 단계별 예시
`dialogue:text` 훅이 2개 등록되어 있다고 가정해 봅시다. (원본 텍스트: `"hello"`)

1.  **훅 A (머리말 추가)**: `"hello"`를 받아서 `"[알림] hello"`로 바꿔서 넘겨줍니다.
2.  **훅 B (대문자 변환)**: 앞사람에게 받은 `"[알림] hello"`를 전체 대문자로 바꿔서 `"[알림] HELLO"`로 최종 반환합니다.
3.  **최종 결과**: 화면에는 훅 A와 B가 모두 적용된 `"[알림] HELLO"`가 출력됩니다.

이처럼 앞선 훅의 작업 결과가 뒤쪽 훅으로 계속 이어지기 때문에, 등록 순서가 결과에 영향을 줄 수 있습니다.

---

## 4. 엔진 전역 훅 (`novel:`)

모듈과 무관하게 엔진 전체의 상태 변화를 추적하는 훅입니다.

*   `novel:scene`: 새로운 씬이 로드될 때 (씬 이름 변경 가능)
*   `novel:next`: `novel.next()`가 호출되어 다음 단계로 넘어갈 때 (진행 차단 가능)
*   `novel:save` / `novel:load`: 세이브 데이터를 저장하거나 불러올 때

---

## 5. 관리 가이드 (Management)

### 5.1. `defineHook` 사용 권장
전역적으로 등록된 훅은 수동으로 해제하지 않으면 메모리 누수나 의도치 않은 동작을 유발할 수 있습니다. 씬 단위의 로직은 반드시 `defineHook`을 통해 관리하십시오.

* [상세 가이드: defineHook (훅 정의 헬퍼)](../defines/defineHook.md)

### 5.2. 불변성 (Immutability)
훅 콜백 내부에서 인자로 받은 객체를 직접 수정하는 대신, 스프레드 연산자(`...`)를 사용하여 새로운 객체를 반환하는 것이 안전합니다.

---

## 6. 활용 사례 (Use Cases)

훅 시스템을 활용하면 엔진의 코드를 건드리지 않고도 강력한 확장 기능을 구현할 수 있습니다.

### 6.1. 다국어 번역 시스템 (i18n)
`onBefore` 훅을 사용하여 출력될 텍스트를 실시간으로 번역된 문자열로 교체할 수 있습니다. `text-render` 훅은 텍스트가 화면에 그려질 때마다 호출되므로 실시간 언어 변경 등에 대응하기 좋습니다.

```ts
novel.hooker.onBefore('dialogue:text-render', (state) => {
  // 번역 라이브러리(예: i18next)를 사용하여 텍스트 변환
  const translatedText = i18n.t(state.text)
  return { ...state, text: translatedText }
})
```

### 6.2. 캐릭터 보이스 재생
대사가 시작되는 시점에 맞춰 보이스를 재생합니다. `text-run` 훅은 명령어 실행 시 단 한 번만 호출되므로, 리렌더링 시 보이스가 중복 재생되는 것을 방지할 수 있습니다.

```ts
novel.hooker.onBefore('dialogue:text-run', (state) => {
  const { speaker, text } = state
  if (speaker === 'heroine') {
    // 명령어 실행 시점에 보이스 재생
    voicePlayer.play('voice_01.mp3')
  }
  return state
})
```

### 6.3. 플레이어 선택 로그 기록 (Analytics)
사용자가 어떤 선택지를 클릭했는지 추적하여 분석 서버로 전송하거나 로그를 남길 수 있습니다.

```ts
novel.hooker.onAfter('choice:select', (state) => {
  // 선택된 텍스트와 인덱스를 로그로 전송
  analytics.send('choice_made', {
    choiceText: state.selected.text,
    choiceIndex: state.index
  })
  return state
})
```

### 6.4. 자동 변수 보정 (Cheats/Debugging)
특정 씬에 진입할 때마다 필요한 능력치를 자동으로 보정하는 기능을 구현할 수 있습니다.

```ts
novel.hooker.onBefore('novel:scene', (sceneName) => {
  if (sceneName === 'boss_battle') {
    // 보스전 진입 시 체력 완전 회복 (치트 기능 등)
    novel.variables.hp = 100
  }
  return sceneName
})
```
