# 🔊 오디오 (Audio)

## 개요 (Overview)

`audio` 모듈은 게임의 배경음악(BGM)과 효과음(SFX)을 재생하고 멈추는 데 사용합니다.  
같은 트랙(`name`)에서 다른 음악을 틀면, 기존 음악은 자연스럽게 줄어들고 새 음악이 커지는 **크로스페이드**가 자동으로 적용됩니다.  

## 사전 준비 (Prerequisites)

`novel.config.ts` 파일의 `audios` 항목에 에셋 ID와 파일 경로가 등록되어 있어야 합니다.  

## 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 1초(1000ms) 동안 페이드인하며 배경음을 반복 재생합니다
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-main', duration: 1000, repeat: true },

  { type: 'dialogue', text: '음악이 재생 중입니다.' },

  // 2. 다른 배경음으로 2초간 크로스페이드(자연스러운 전환) 합니다
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-battle', duration: 2000 },

  // 3. 효과음을 한 번만 짧게 재생합니다
  { type: 'audio', action: 'play', name: 'sfx', src: 'sfx-click' },

  { type: 'dialogue', text: '전투가 끝났습니다.' },

  // 4. 배경음을 1초 동안 페이드아웃하며 정지합니다
  { type: 'audio', action: 'stop', name: 'bgm', duration: 1000 }
])
```

## 옵션 상세

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| **`action`** | `'play' \| 'pause' \| 'stop'` | `play` | 재생, 일시정지, 정지 여부 선택 |
| **`name`** | `string` | 필수 | 오디오 트랙의 이름 (예: `bgm`, `sfx`) |
| **`src`** | `string` | 필수 (`play`) | 재생할 에셋의 ID |
| **`volume`** | `number` | `1` | 볼륨 크기 (`0.0` ~ `1.0`) |
| **`duration`** | `number` | `0` | 페이드인/아웃, 또는 크로스페이드에 걸리는 시간(ms) |
| **`repeat`** | `boolean` | `false` | 반복 재생 여부 |
| **`speed`** | `number` | `1` | 재생 속도 |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **씬 전환 후에도 음악이 계속 나옴** | 오디오는 씬의 렌더링 상태와 독립적으로 동작하므로 씬이 전환되어도 자동으로 멈추지 않습니다. 음악을 완전히 멈추고 싶다면 씬 내부에서 명시적으로 `action: 'stop'`을 호출해야 합니다. |
| **브라우저 자동재생 차단** | 사용자가 화면을 클릭하기 전에는 브라우저 보안 정책상 소리가 나지 않을 수 있습니다. 엔진 내부적으로 첫 클릭 시 멈춰있던 소리를 자동 복구하도록 처리되어 있습니다. |

## 관련 참조 문서

*   **[오디오 훅 (Audio Hooks)](./hooks/audio.md)**: 오디오 상태 변화 이벤트를 감지하고 제어하는 방법
