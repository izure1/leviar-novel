# 🪝 Audio Hooks

`audio` 모듈의 재생 시작, 일시정지, 정지 완료 및 반복/종료 이벤트를 감지할 수 있는 훅 목록입니다.

---

## 1. 개요 (Overview)

| 훅 이름 | 페이로드 타입 | 호출 시점 | 설명 |
| :--- | :--- | :--- | :--- |
| `audio:play` | `AudioPlayCmd` | **즉시** | 오디오 재생이 시작되는 즉시 호출됩니다. (`duration` 무관) |
| `audio:pause` | `AudioPauseCmd` | **완료 후** | 페이드아웃(`duration`)이 끝나고 일시정지되었을 때 호출됩니다. |
| `audio:stop` | `AudioStopCmd` | **완료 후** | 페이드아웃(`duration`)이 끝나고 트랙이 정지/삭제되었을 때 호출됩니다. |
| `audio:end` | `AudioEventPayload` | **완료 시** | 재생이 자연 종료되거나 지정된 `end` 시간에 도달했을 때 호출됩니다. |
| `audio:repeat` | `AudioEventPayload` | **루프 시** | 루프 재생 설정에 의해 오디오가 다시 처음부터 시작될 때 호출됩니다. |

---

## 2. 훅 상세 (Reference)

### 2.1. `audio:play` / `audio:pause` / `audio:stop`
오디오 트랙의 상태 변화가 발생했을 때 호출됩니다.

* **Payload**: `AudioPlayCmd` | `AudioPauseCmd` | `AudioStopCmd`
* **Return**: 동일 타입 (반환값은 실행 로직에 영향을 주지 않는 **이벤트 알림** 성격입니다)

```ts
// 예시: BGM 재생 시 로그 기록
novel.hooker.onAfter('audio:play', (cmd) => {
  if (cmd.name === 'bgm') {
    console.log(`[Audio] BGM 재생 시작: ${cmd.src}`)
  }
  return cmd
})
```

### 2.2. `audio:end` / `audio:repeat`
오디오 재생의 흐름이 끝에 도달했거나 반복될 때 호출됩니다.

* **Payload**: `AudioEventPayload` (`{ name: string, src: string }`)
* **Return**: `AudioEventPayload`

| 필드 | 설명 |
| :--- | :--- |
| **`name`** | 이벤트를 발생시킨 오디오 트랙의 식별자입니다. |
| **`src`** | 현재 재생 중인(또는 방금 종료된) 오디오 에셋의 키입니다. |

```ts
// 예시: 특정 효과음 재생 완료 후 다음 동작 수행
novel.hooker.onAfter('audio:end', (payload) => {
  if (payload.src === 'sfx_door_close') {
    console.log('문 닫는 소리가 끝났습니다.')
  }
  return payload
})
```

---

## 3. 관련 가이드

* [상세 가이드: Hooks 개념 및 릴레이 방식](../../concepts.md#hooks)
* [상세 가이드: defineHook (훅 정의 헬퍼)](../../defines/defineHook.md)

---

## 4. 주의 사항 (Edge Cases)

* **반환값 무시**: `audio` 모듈의 훅들은 동작이 이미 시작되었거나 완료된 시점에 호출되므로, 훅에서 반환하는 값으로 실제 오디오 동작을 변경할 수 없습니다. 데이터 로깅이나 연쇄적인 연출을 위한 용도로 사용하십시오.
* **Play 호출 시점**: `audio:play`는 페이드인 애니메이션이 완료되기를 기다리지 않고 재생 명령이 내려진 즉시 호출됩니다.
* **Repeat 감지**: `audio:repeat`는 `end` 속성에 의한 구간 반복뿐만 아니라, 오디오 파일 자체가 처음으로 되돌아가는 자연 루프 시점도 감지하여 호출됩니다.
