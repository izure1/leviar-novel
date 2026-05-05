# 🪝 오디오 훅 (Audio Hooks)

## 개요 (Overview)

`audio` 모듈에서 발생하는 재생, 정지, 반복, 종료 이벤트를 감지하여 부가적인 연출을 실행하거나 시스템 로그를 남길 수 있는 훅입니다.  

## 훅 이벤트 목록 (Events)

| 훅 이름 | 페이로드 타입 | 실행 시점 |
| :--- | :--- | :--- |
| **`audio:play`** | `AudioPlayCmd` | 재생 명령이 하달된 직후 (즉시) |
| **`audio:pause`** | `AudioPauseCmd` | 페이드아웃 후 일시정지 완료 시 |
| **`audio:stop`** | `AudioStopCmd` | 완전히 정지되고 트랙이 지워진 직후 |
| **`audio:end`** | `AudioEventPayload` | 자연적으로 종료되거나 끝부분에 도달 시 |
| **`audio:repeat`** | `AudioEventPayload` | 루프 설정에 의해 처음부터 다시 시작될 때 |

## 핵심 예제 (Main Example)

### 상태 제어 감지 (`play` / `pause` / `stop`)

```typescript
// 특정 BGM 재생 시 로그를 기록하고 이펙트를 실행합니다
novel.hooker.onAfter('audio:play', (cmd) => {
  if (cmd.name === 'bgm') {
    console.log(`배경음 재생 시작: ${cmd.src}`)
  }
  return cmd
})
```

### 재생 완료 감지 (`end` / `repeat`)

`AudioEventPayload`는 `{ name: string, src: string }` 구조를 가집니다.  

```typescript
// 문 닫히는 효과음이 끝나면 다음 로직을 동기화합니다
novel.hooker.onAfter('audio:end', (payload) => {
  if (payload.src === 'sfx_door_close') {
    console.log('문이 닫혔습니다')
  }
  return payload
})
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **물리적 제어 불가** | 오디오 훅은 모듈이 이미 실행된 직후나 끝난 시점에 호출됩니다. 따라서 훅 내부에서 값을 바꿔 반환한다고 해도 오디오 자체가 멈추거나 동작이 변하지는 않습니다. |
