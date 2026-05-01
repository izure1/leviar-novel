# 🎨 Dialogue State & Layout

`dialogue` 모듈의 시각적 요소(배경 패널, 화자 텍스트, 대사 텍스트)와 배치 레이아웃을 설정하는 가이드입니다.

---

## 1. 개요 (Overview)

| 속성 그룹 | 설명 |
| :--- | :--- |
| **`bg`** | 대화창 전체의 배경 패널 스타일 |
| **`speaker`** | 캐릭터 이름이 표시되는 텍스트 스타일 |
| **`text`** | 실제 대사가 표시되는 텍스트 스타일 |
| **`layout`** | 창 내부의 여백 및 요소 간 간격 |

---

## 2. 레이아웃 설정 (`DialogueLayout`)

대화창 내부의 간격을 조정합니다. `defineScene`의 `initial` 또는 커맨드 레벨에서 설정할 수 있습니다.

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| `paddingX` | `number` | `0.05` | 대화창 좌우 여백 비율 (0~1). |
| `paddingTop` | `number` | `24` | 창 상단에서 화자 이름까지의 거리(px). |
| `speakerTextGap` | `number` | `8` | 화자 이름과 대사 텍스트 사이의 수직 간격(px). |

---

## 3. 스타일링 예시

### 3.1. 대화창 높이 및 투명도 조정

```ts
export default defineScene({
  config,
  initial: {
    dialogue: {
      // 배경 스타일
      bg: { 
        height: 200, 
        color: 'rgba(20, 20, 40, 0.9)',
        borderRadius: 16
      },
      // 대사 텍스트 스타일
      text: { 
        fontSize: 22,
        lineHeight: 1.8,
        color: '#f0f0f0'
      }
    }
  }
}, [ ... ])
```

---

## 4. 상세 스키마 (`DialogueSchema`)

### `style` (또는 `bg`)
대화창의 전체적인 외관을 결정합니다.
* **`height`**: 대화창의 높이(px). (기본값: 화면 높이의 28%)
* 기타 `leviar.Style` 속성 (color, opacity, borderRadius, border 등) 지원.

### `speaker` & `text`
텍스트 오브젝트의 스타일을 결정합니다.
* **`fontSize`**, **`color`**, **`fontWeight`**, **`fontFamily`** 등 지원.
* **`textShadow`** 속성을 통해 가독성을 높일 수 있습니다.

---

## 5. 주의 사항 (Edge Cases)

*   **Z-Index**: 대화창의 기본 zIndex는 `300` 내외로 설정되어 있습니다. 다른 UI 모듈과 겹칠 경우 이를 조정해야 할 수 있습니다.
*   **반응형 여백**: `paddingX`는 캔버스 너비에 대한 비율이므로, 해상도가 바뀌어도 텍스트 너비가 적절히 유지됩니다.
