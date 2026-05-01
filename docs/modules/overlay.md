# 🖼️ Overlay Module

---

## 1. 개요 (Overview)

`overlay` 모듈은 게임 화면 위에 독립적인 텍스트나 이미지를 띄워 연출을 강화하는 기능을 제공합니다. 챕터 제목, 장소 안내, 캐릭터의 독백(Whisper), 또는 화면 특정 위치에 고정되는 로고 이미지 등을 표시할 때 사용됩니다.

이 모듈은 기능에 따라 세 가지 세부 모듈로 나뉩니다:
1.  **`overlay-text`**: 텍스트 형태의 오버레이를 표시합니다.
2.  **`overlay-image`**: 이미지 형태의 오버레이를 표시합니다.
3.  **`overlay-effect`**: 표시된 오버레이에 흔들림 등의 연출 효과를 적용합니다.

---

## 2. 핵심 예제 (Main Example)

### 제목 및 로고 연출

```ts
[
  // 1. 텍스트 오버레이 (제목 프리셋 사용)
  { 
    type: 'overlay-text', 
    action: 'show', 
    name: 'chapter_title', 
    text: '제 1장: 새로운 시작', 
    preset: 'title' 
  },

  // 2. 이미지 오버레이 (중앙 상단 배치)
  { 
    type: 'overlay-image', 
    action: 'show', 
    name: 'main_logo', 
    src: 'logo_img', 
    x: 0.5, y: 0.3, 
    width: 400 
  },

  // 3. 로고에 흔들림 효과 적용
  { 
    type: 'overlay-effect', 
    name: 'main_logo', 
    preset: 'shake', 
    duration: 500 
  },

  // 4. 특정 오버레이 숨기기
  { type: 'overlay-text', action: 'hide', name: 'chapter_title', duration: 1000 }
]
```

### 실전 연출: 증거품 조사 (Investigation)
`screen-fade`로 배경을 어둡게 처리한 뒤, 오버레이를 사용하여 특정 아이템에 시선을 집중시키는 연출입니다.

```ts
[
  // 1. 화면을 검게 페이드 아웃 (몰입감 조성)
  { type: 'screen-fade', action: 'show', color: 'black', duration: 500 },

  // 2. 화면 중앙에 증거품(이미지) 표시
  { 
    type: 'overlay-image', 
    action: 'show', 
    name: 'evidence_key', 
    src: 'item_rusty_key', 
    x: 0.5, y: 0.45, // 중앙보다 약간 위
    width: 300 
  },

  // 3. 증거품 하단에 캡션(텍스트) 표시
  { 
    type: 'overlay-text', 
    action: 'show', 
    name: 'evidence_desc', 
    text: '오래된 창고의 열쇠: 붉은 녹이 슬어 있다.', 
    preset: 'caption' 
  },

  { type: 'dialogue', text: '이 열쇠가 사건의 실마리가 될지도 모른다.' },

  // 4. 연출 종료 후 오버레이 제거 및 화면 복구
  { type: 'overlay-image', action: 'hide', name: 'evidence_key' },
  { type: 'overlay-text', action: 'hide', name: 'evidence_desc' },
  { type: 'screen-fade', action: 'hide', duration: 500 }
]
```

---

## 3. 커맨드 상세 (Command Reference)

### Overlay Text (`overlay-text`)
| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `action` | `'show' \| 'hide'` | ✅ | 오버레이 표시 또는 숨기기 여부입니다. |
| `name` | `string` | ✅ | 오버레이의 고유 식별자입니다. |
| `text` | `string` | - | (`show` 전용) 표시할 내용입니다. |
| `preset` | `OverlayPreset` | - | 스타일 프리셋입니다. (`caption`, `title`, `whisper`) |
| `duration` | `number` | - | 전환 애니메이션 지속 시간(ms)입니다. |

### Overlay Image (`overlay-image`)
| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `action` | `'show' \| 'hide'` | ✅ | 오버레이 표시 또는 숨기기 여부입니다. |
| `name` | `string` | ✅ | 오버레이의 고유 식별자입니다. |
| `src` | `string` | - | (`show` 전용) 표시할 이미지의 에셋 키입니다. |
| `x`, `y` | `number` | - | 화면 내 위치 (0~1 범위, 0.5가 중앙)입니다. |
| `width`, `height` | `number` | - | 이미지의 크기(px)입니다. |
| `fit` | `string` | - | 화면 맞춤 방식입니다. (`contain`, `cover`, `stretch`) |

### Overlay Effect (`overlay-effect`)
| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `name` | `string` | ✅ | 효과를 적용할 오버레이의 이름입니다. |
| `preset` | `string` | ✅ | 연출 효과 프리셋입니다. (`shake`, `bounce`, `reset` 등) |
| `duration` | `number` | - | 효과의 지속 시간(ms)입니다. |
| `repeat` | `number` | - | 반복 횟수입니다. (-1은 무한 반복) |

---

## 4. 상태 및 레이아웃 (State & Layout)

오버레이의 전역 스타일 오버라이드 및 내부 데이터 구조에 대한 상세 내용은 다음 문서를 참조하십시오.

* [상세 가이드: Overlay 상태 및 레이아웃](./state/overlay.md)

---

## 5. 텍스트 프리셋 상세 (Text Presets)

| 프리셋 | 용도 | 기본 위치 | 주요 스타일 |
| :--- | :--- | :--- | :--- |
| `title` | 챕터 제목, 중요한 알림 | 중앙 | 큰 글씨, 강조 |
| `caption` | 장소 안내, 시간 설명 | 하단 | 표준 크기, 흰색 |
| `whisper` | 캐릭터의 속삭임, 독백 | 하단 | 작은 글씨, 낮은 투명도 |

---

## 5. 주의 사항 (Edge Cases)

*   **동일 이름 처리**: 이미 표시 중인 오버레이와 같은 `name`으로 `show`를 호출하면, 기존 오버레이가 새로운 내용으로 부드럽게 전환(Transition)됩니다.
*   **레이어 순서**: 오버레이는 일반적인 캐릭터나 배경보다 항상 위에 표시됩니다. 프리셋에 따라 `zIndex`가 다르게 설정되어 있어 `whisper` < `caption` < `title` 순으로 겹쳐 보일 수 있습니다.
*   **효과 적용**: `overlay-effect`는 해당 오버레이가 화면에 표시된 상태에서만 작동합니다.
