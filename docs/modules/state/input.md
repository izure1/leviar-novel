# 🎨 Input State & Layout

`input` 모듈의 시각적 요소(오버레이, 패널, 커서, 버튼)와 레이아웃을 설정하는 가이드입니다.

---

## 1. 개요 (Overview)

| 속성 그룹 | 설명 |
| :--- | :--- |
| **`overlay`** | 입력창 뒤쪽의 전체 화면 반투명 배경 스타일 |
| **`panel`** | 입력창 메인 컨테이너 패널 스타일 |
| **`labelStyle`** | 상단 안내 문구(레이블) 스타일 |
| **`inputTextStyle`** | 기입 중인 텍스트의 스타일 |
| **`cursorStyle`** | 깜빡이는 커서(`\|`)의 스타일 |
| **`button`** | 확인/취소 버튼들의 기본 스타일 |
| **`layout`** | 패널 내부 여백 및 간격 설정 |

---

## 2. 레이아웃 설정 (`InputLayout`)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| `paddingX` | `number` | `32` | 패널 내부 좌우 여백(px). |
| `paddingY` | `number` | `24` | 패널 내부 상하 여백(px). |
| `labelInputGap` | `number` | `12` | 레이블과 입력창 사이의 간격(px). |
| `inputButtonGap` | `number` | `20` | 입력창과 버튼들 사이의 수직 간격(px). |
| `buttonGap` | `number` | `8` | 버튼과 버튼 사이의 가로 간격(px). |

---

## 3. 스타일링 예시

### 3.1. 모던한 다크 모드 입력창

```ts
export default defineScene({
  config,
  initial: {
    input: {
      panel: {
        color: '#1a1a1a',
        borderColor: '#3498db',
        borderWidth: 2,
        borderRadius: 12,
        minWidth: 500
      },
      inputTextStyle: {
        fontSize: 24,
        color: '#3498db',
        fontWeight: 'bold'
      },
      button: {
        color: '#3498db',
        borderRadius: 6
      }
    }
  }
}, [ ... ])
```

---

## 4. 상세 스키마 (`InputSchema`)

### `overlay`
입력창 활성화 시 뒷배경을 어둡게 처리하여 집중도를 높입니다.
* **`color`**: 배경색 (예: `rgba(0,0,0,0.5)`)

### `cursorStyle`
가상 커서(`|`)의 스타일을 지정합니다.
* 주로 **`color`**와 **`fontSize`**를 입력 텍스트 스타일에 맞춰 조정합니다.

### `button` & `buttonHover`
하단 버튼들의 공통 스타일을 지정합니다. 각 버튼별로 커맨드 레벨에서 오버라이드할 수도 있습니다.

---

## 5. 주의 사항 (Edge Cases)

*   **최소 너비(`minWidth`)**: 입력 패널은 내부 콘텐츠에 따라 높이가 가변적이지만, 너비는 기본적으로 `420px` 이상의 최소 너비를 유지하도록 설정되어 있습니다.
*   **반응형 위치**: 입력 패널은 항상 화면 중앙(`toLocal(w/2, h/2)`)에 정렬됩니다.
