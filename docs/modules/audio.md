# 🔊 Audio Module

---

## 1. 개요 (Overview)

`audio` 모듈은 게임 내 배경음(BGM)과 효과음(SFX)의 재생 및 관리를 담당합니다. 단순 재생을 넘어 트랙 간 **자동 크로스페이드(Crossfade)**와 페이드 인/아웃, 구간 반복 등 전문적인 오디오 연출 기능을 제공합니다.

### 주요 특징
* **트랙 기반 관리**: `name` 속성을 사용하여 여러 오디오를 독립적인 트랙으로 동시 제어할 수 있습니다.
* **지능형 전환**: 동일한 트랙(`name`)에서 다른 곡을 재생할 경우, 이전 곡은 페이드아웃되고 새 곡은 페이드인되는 크로스페이드가 자동으로 적용됩니다.
* **상태 동기화**: 재생 중인 모든 오디오의 상태(곡명, 볼륨, 시간 등)는 엔진 상태에 보존되어 세이브/로드 시 완벽하게 복원됩니다.

---

## 2. 사전 준비 (Prerequisites)

오디오 기능을 사용하기 위해 `novel.config.ts`의 `audios` 섹션에 에셋 키와 경로를 등록해야 합니다.

```ts
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  audios: {
    'bgm_main': 'assets/audio/main_theme.mp3',
    'sfx_click': 'assets/audio/click.wav'
  }
})
```

---

## 3. 커맨드 상세 (Command Reference)

`audio` 커맨드는 `action` 속성에 따라 세 가지 동작을 수행합니다.

### 3.1. Play Action (`AudioPlayCmd`)

| 속성 | 타입 | 필수 | 기본값 | 설명 |
| :--- | :--- | :---: | :---: | :--- |
| `action` | `'play'` | ✅ | - | 오디오를 재생하거나 기존 설정을 변경합니다. |
| `name` | `string` | ✅ | - | 오디오 트랙 식별자입니다. (예: `bgm`, `sfx`, `ambient`) |
| `src` | `AudioKeysOf<Config>` | ✅ | - | `config.audios`에 등록된 에셋 키입니다. |
| `volume` | `number` | - | `1` | 볼륨 크기 (0.0 ~ 1.0) 입니다. |
| `duration` | `number` | - | `0` | 페이드 인/전환 지속 시간(ms)입니다. |
| `repeat` | `boolean` | - | `false` | 반복 재생 여부입니다. |
| `speed` | `number` | - | `1` | 재생 속도(Playback Rate)입니다. |
| `start` | `number` | - | `0` | 재생 시작 시점(초)입니다. |
| `end` | `number` | - | `0` | 재생 종료 시점(초)입니다. |

### 3.2. Pause & Stop Action

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `action` | `'pause' \| 'stop'` | ✅ | **pause**: 일시정지<br>**stop**: 정지 및 트랙 제거 |
| `name` | `string` | ✅ | 정지할 트랙의 식별자입니다. |
| `duration` | `number` | - | 페이드아웃 지속 시간(ms)입니다. |

### 활용 예시

```ts
// 1. 배경음 1초간 페이드인 재생
{ type: 'audio', action: 'play', name: 'bgm', src: 'bgm_main', duration: 1000, repeat: true }

// 2. 다른 배경음으로 2초간 크로스페이드 전환
{ type: 'audio', action: 'play', name: 'bgm', src: 'bgm_battle', duration: 2000 }

// 3. 배경음 1초간 페이드아웃 후 정지
{ type: 'audio', action: 'stop', name: 'bgm', duration: 1000 }
```

---

## 4. 주의 사항 (Edge Cases)

* **브라우저 정책**: 사용자의 상호작용(클릭) 이전에 재생을 시도하면 차단될 수 있으며, 엔진이 상호작용 발생 시 자동으로 재생을 재개합니다.
* **메모리 관리**: `stop` 액션을 사용하면 해당 오디오 객체는 풀(Pool)에서 제거됩니다. 씬 전환 시에는 자동으로 1초간 페이드아웃 후 정리됩니다.
* **중복 호출**: 동일 트랙에 연속적인 `play` 요청 시 마지막 요청의 페이드 효과가 우선권을 가집니다.
