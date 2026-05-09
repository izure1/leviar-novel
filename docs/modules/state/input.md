# 🎨 입력창 상태 (Input State)

## 개요 (Overview)

`input` 모듈의 배경 레이어, 패널, 커서, 버튼 스타일과 배치를 결정하는 `InputSchema` 구조입니다.  

## 상태 상세 명세 (Properties)

| 속성 명칭 | 상세 설명 |
| :--- | :--- |
| **`overlay`** | 입력창 활성화 시 뒷배경 전체를 덮는 반투명 레이어 |
| **`panel`** | 입력 필드와 버튼이 담기는 컨테이너 패널 스타일 |
| **`labelStyle`** | 패널 상단 안내 문구(Label) 서체 및 색상 |
| **`inputTextStyle`** | 플레이어가 입력하는 텍스트 영역 폰트 스타일 |
| **`cursorStyle`** | 깜빡이는 가상 입력 커서(`|`) 형태 |
| **`button`** | 하단 확인 및 취소 버튼들의 공통 배경 스타일 |
| **`layout`** | 패널 내부 여백과 간격을 정의하는 레이아웃 객체 |

### 레이아웃 상세 (`InputLayout`)

| 속성 | 기본값 | 설명 |
| :--- | :---: | :--- |
| **`panelPadding(Left/Right)`** | `32` | 패널 내부 좌우 여백(px) |
| **`panelPadding(Top/Bottom)`** | `24` | 패널 내부 상하 여백 |
| **`buttonPadding(Left/Right)`** | `20` | 각 버튼 내부 수평 여백 |
| **`buttonPadding(Top/Bottom)`** | `8` | 각 버튼 내부 수직 여백 |
| **`labelInputGap`** | `12` | 안내 문구와 입력 필드 사이 수직 간격 |
| **`inputButtonGap`** | `20` | 입력 필드 하단과 버튼 영역 사이 공간 |
| **`buttonGap`** | `8` | 버튼과 버튼 사이 가로 여백 |

## 핵심 예제 (Main Example)

### 다크 모드 테마 적용

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  initial: {
    input: {
      panel: {
        background: '#1a1a1a',
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
        background: '#3498db',
        borderRadius: 6
      }
    }
  }
})(() => [
  { type: 'input', varName: 'player_name', label: '이름을 입력하세요.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **자동 크기 및 정렬** | 패널의 최소 너비는 레이아웃 붕괴 방지를 위해 `420px`로 유지되며, 창 크기와 상관없이 항상 화면 정중앙에 자동으로 정렬됩니다. |
