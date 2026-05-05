# 🪝 대화 훅 (Dialogue Hooks)

## 개요 (Overview)

대사가 타이핑될 때 보이스를 재생하거나, 화면에 문자가 렌더링되어 찍히기 직전에 다국어 번역을 입히는 등 텍스트 이벤트를 가로채는 훅입니다.  

## 훅 이벤트 목록 (Events)

| 훅 이름 | 페이로드 타입 | 실행 시점 |
| :--- | :--- | :--- |
| **`dialogue:text-run`** | `{ speaker, text }` | 대사 커맨드가 처음 시작될 때 단 한 번 호출 |
| **`dialogue:text-render`** | `{ speaker, text }` | 화면 리렌더링(창 조절, 상태 변경 등)이 발생할 때마다 계속 호출 |

## 핵심 예제 (Main Example)

### 1. 단발성 액션 로직 (`text-run`)

대사가 시작될 때 단 한 번만 실행되므로 사운드나 보이스 재생에 가장 적합합니다.  

```typescript
// 특정 캐릭터가 대사를 시작할 때 음성 파일을 틀어줍니다
novel.hooker.onBefore('dialogue:text-run', (state) => {
  if (state.speaker === 'heroine') {
    voiceManager.play('voice_heroine_01')
  }
  return state
})
```

### 2. 렌더링 텍스트 변환 (`text-render`)

화면에 글자가 갱신되어 그려질 때마다 불리므로 실시간 텍스트 조작 등에 사용합니다.  

```typescript
// 대사를 화면에 띄우기 전 외국어 번역 플러그인을 적용합니다
novel.hooker.onBefore('dialogue:text-render', (state) => {
  return {
    ...state,
    text: i18n.translate(state.text)
  }
})
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **변수 보간 완료 데이터** | `{{_name}}` 같은 변수 보간은 훅이 불리기 전에 이미 파서에 의해 다 계산되어 최종 결과물 텍스트로 들어옵니다. |
| **렌더 훅 최적화 필수** | `text-render`는 화면 갱신마다 호출될 수 있습니다. 여기서 무거운 처리를 하면 프레임 드랍이나 치명적인 렉이 걸리므로 캐싱을 쓰거나 가볍게 유지해야 합니다. |
