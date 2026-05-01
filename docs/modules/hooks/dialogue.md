# 🪝 Dialogue Hooks

`dialogue` 모듈에서 발생하는 이벤트를 가로채어 텍스트를 변형하거나 보이스 재생 등의 부가 로직을 실행할 수 있습니다.

---

## 1. 개요 (Overview)

| 훅 이름 | 설명 | 권장 활용 |
| :--- | :--- | :--- |
| `dialogue:text-render` | 텍스트가 화면에 그려질 때마다 발생 | 다국어 번역, 텍스트 효과 필터링 |
| `dialogue:text-run` | 커맨드 실행 시 1회 발생 | 캐릭터 보이스 재생, 로그 기록 |

---

## 2. 훅 상세 (Reference)

### 2.1. `dialogue:text-render`
리렌더링 시마다 호출됩니다. (예: 윈도우 크기 조절, 세이브 로드, 언어 변경 등) 시각적으로 보여지는 텍스트의 최종 형태를 결정하는 데 적합합니다.

* **Payload**: `{ speaker: string | undefined, text: string }`
* **Return**: `{ speaker: string | undefined, text: string }`

```ts
// 예시: 모든 대사를 대문자로 변환 (번역 등)
novel.hooker.onBefore('dialogue:text-render', (state) => {
  return {
    ...state,
    text: state.text.toUpperCase()
  }
})
```

### 2.2. `dialogue:text-run`
명령어가 처음 실행될 때(또는 여러 줄 대사 중 다음 줄로 넘어갈 때) 한 번만 호출됩니다. 리렌더링과 무관하게 **액션이 한 번만 실행되어야 하는 경우**에 사용합니다.

* **Payload**: `{ speaker: string | undefined, text: string }`
* **Return**: `{ speaker: string | undefined, text: string }`

```ts
// 예시: 대사가 시작될 때 보이스 재생
novel.hooker.onBefore('dialogue:text-run', (state) => {
  if (state.speaker === '내이름') {
    voicePlayer.play('my_voice.mp3')
  }
  return state
})
```

---

## 3. 관련 가이드

* [상세 가이드: Hooks 개념 및 릴레이 방식](../../concepts/hooks.md)
* [상세 가이드: defineHook (훅 정의 헬퍼)](../../defines/defineHook.md)

---

## 4. 주의 사항 (Edge Cases)

*   **실행 순서**: `text-run`이 먼저 호출되어 논리적인 액션을 처리한 후, 실제 화면에 그리기 직전에 `text-render`가 호출됩니다.
*   **성능**: `text-render`는 자주 호출될 수 있으므로, 내부에서 복잡한 연산을 수행할 경우 프레임 드랍이 발생할 수 있습니다. 캐싱 로직을 권장합니다.
