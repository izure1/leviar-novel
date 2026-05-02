# 🎨 DialogBox State & Layout

`dialogBox` 모듈의 시각적 디자인과 요소 간의 간격을 설정하는 가이드입니다.

---

## 1. 개요 (Overview)

| 속성 그룹 | 설명 |
| :--- | :--- |
| **`overlay`** | 배경 전체를 덮는 반투명 오버레이 스타일 |
| **`panel`** | 메인 상자 컨테이너 스타일 |
| **`titleStyle`** | 제목 텍스트 스타일 |
| **`contentStyle`** | 본문 텍스트 스타일 |
| **`button`** | 버튼 기본 배경 스타일 |
| **`buttonText`** | 버튼 내부 텍스트 스타일 |
| **`layout`** | 내부 여백 및 간격 설정 |

---

## 2. 레이아웃 설정 (`DialogBoxLayout`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| `panelPaddingLeft` | `number` | `28` | 패널 내부 좌측 여백(px). |
| `panelPaddingRight` | `number` | `28` | 패널 내부 우측 여백(px). |
| `panelPaddingTop` | `number` | `28` | 패널 내부 상단 여백(px). |
| `panelPaddingBottom` | `number` | `28` | 패널 내부 하단 여백(px). |
| `buttonPaddingLeft` | `number` | `24` | 버튼 내부 좌측 패딩(px). |
| `buttonPaddingRight` | `number` | `24` | 버튼 내부 우측 패딩(px). |
| `buttonPaddingTop` | `number` | `10` | 버튼 내부 상단 패딩(px). |
| `buttonPaddingBottom` | `number` | `10` | 버튼 내부 하단 패딩(px). |
| `titleContentGap` | `number` | `12` | 제목과 본문 사이 간격(px). |
| `contentButtonGap` | `number` | `30` | 본문과 버튼 영역 사이 간격(px). |
| `buttonRowGap` | `number` | `10` | 버튼 행 사이의 수직 간격(px). |
| `buttonColumnGap` | `number` | `8` | 같은 행 내 버튼 간의 가로 간격(px). |

---

## 3. 스타일링 예시

### 3.1. 경고창 느낌의 붉은색 테두리 디자인

```ts
export default defineScene({
  config,
  initial: {
    dialogBox: {
      panel: {
        color: '#2c3e50',
        borderColor: '#e74c3c',
        borderWidth: 3,
        borderRadius: 8
      },
      titleStyle: {
        color: '#e74c3c',
        fontSize: 28
      }
    }
  }
}, [ ... ])
```

---

## 4. 상세 스키마 (`DialogBoxSchema`)

### `button` & `buttonHover`
모든 버튼에 적용되는 기본 스타일입니다. `hover` 시의 색상 변화를 통해 상호작용 효과를 줄 수 있습니다.

### `panel.height`
기본적으로 패널의 높이는 내부 콘텐츠(제목+본문+버튼) 양에 따라 **자동으로 계산**됩니다. 명시적으로 `height`를 지정할 수도 있지만, 콘텐츠가 잘릴 수 있으므로 주의해야 합니다.

---

## 5. 주의 사항 (Edge Cases)

*   **자동 너비 추정**: 버튼의 너비를 명시하지 않으면 텍스트 길이에 따라 자동으로 너비가 계산됩니다.
*   **그리디(Greedy) 배치**: 버튼들을 최대한 한 행에 배치하려 시도하며, 설정된 패널 너비를 초과할 때만 다음 행으로 넘깁니다.
