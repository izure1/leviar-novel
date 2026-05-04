# 🪝 Dialogue Hooks

본 문서는 `dialogue` 모듈에서 발생하는 텍스트 출력 이벤트를 가로채어, 내용을 변형하거나 보이스 재생 등 부가적인 시나리오 로직을 실행할 수 있는 훅(Hooks) 명세를 기술합니다.  

---

## 1. 개요 (Overview)

대화 시스템의 실행 시점과 렌더링 시점을 정교하게 제어할 수 있는 훅 목록입니다.  

| 훅 이름 | 상세 기능 | 권장 활용 사례 |
| :--- | :--- | :--- |
| `dialogue:text-render` | 텍스트가 화면에 그려질 때마다 호출 | 다국어 실시간 번역, 텍스트 스타일 필터링 적용 등 |
| `dialogue:text-run` | 대사 커맨드가 처음 개시될 때 1회 호출 | 캐릭터 보이스 재생 연동, 시나리오 텍스트 로그 기록 등 |

---

## 2. 훅 상세 명세 (Reference)

### 2.1. `dialogue:text-render`
화면의 리렌더링이 발생할 때마다 호출됩니다.  (예: 윈도우 크기 변경, 세이브 데이터 로드, 언어 설정 전환 등)  
플레이어에게 시각적으로 노출되는 최종적인 텍스트 형태를 결정하는 데 가장 적합한 훅입니다.  

*   **Payload**: `{ speaker: string | undefined, text: string }`  
*   **Return**: 변형된 데이터를 담은 객체를 반환합니다.  

```ts
// 구현 예시: 특정 언어 환경에 맞춰 대사 내용을 실시간으로 번역하여 출력합니다.  
novel.hooker.onBefore('dialogue:text-render', (state) => {
  return {
    ...state,
    text: i18n.translate(state.text)
  };
})
```

### 2.2. `dialogue:text-run`
대사 명령어가 처음 실행되거나, 다중 라인 대사 중 다음 문장으로 전환되는 시점에 단 한 번만 호출됩니다.  
화면 갱신 여부와 관계없이 **단발성 액션(Action)**이 필요한 경우에 최적화되어 있습니다.  

*   **Payload**: `{ speaker: string | undefined, text: string }`  
*   **Return**: 처리된 데이터를 반환합니다.  

```ts
// 구현 예시: 대사가 시작되는 시점에 해당 캐릭터의 음성 파일을 재생합니다.  
novel.hooker.onBefore('dialogue:text-run', (state) => {
  if (state.speaker === 'heroine') {
    voiceManager.play('voice_heroine_01.mp3');
  }
  return state;
})
```

---

## 3. 주의 사항 (Edge Cases)

*   **실행 우선순위 및 순서**: 엔진은 먼저 `text-run` 훅을 실행하여 논리적인 사전 처리를 완료한 후, 실제 화면에 렌더링하기 직전 단계에서 `text-render` 훅을 호출합니다.  
*   **성능 최적화 권장**: `text-render` 훅은 화면 갱신 주기에 따라 매우 빈번하게 호출될 수 있습니다.  복잡한 연산이나 외부 API 호출을 포함할 경우 성능 저하가 발생할 수 있으므로, 가급적 가벼운 로직 위주로 구성하거나 캐싱 기법을 도입하시기 바랍니다.  
*   **보간 처리 순서**: 텍스트 내부의 변수 보간(`{{ }}`) 작업은 훅이 실행되기 전 단계에서 이미 완료되어 전달됩니다.  

---

## 4. 관련 참조 문서

*   **[Hooks 시스템 기초 개념](../../concepts.md#hooks)**: 훅의 실행 메커니즘과 데이터 흐름에 대한 전반적인 정보를 제공합니다.  
*   **[대화 모듈 연출 가이드](../dialogue.md)**: 대사 커맨드의 기본 속성과 활용법을 기술합니다.  
