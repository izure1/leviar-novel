# 🎨 알림창 상태 (DialogBox State)

## 개요 (Overview)

`dialogBox` 모듈의 시각적 디자인과 구성 요소 간 배치를 결정하는 `DialogBoxSchema` 데이터 구조입니다.  

## 상태 상세 명세 (Properties)

| 속성 명칭 | 상세 설명 |
| :--- | :--- |
| **`overlay`** | 창 활성화 시 배경 전체를 덮는 반투명 레이어 스타일 |
| **`panel`** | 메시지가 담기는 메인 컨테이너 박스 기본 스타일 |
| **`titleStyle`** | 상단에 표시되는 제목 텍스트 서체 및 색상 |
| **`contentStyle`** | 중앙 본문 영역 텍스트 레이아웃 및 서체 |
| **`button`** | 하단 버튼들의 공통 배경 스타일 |
| **`buttonText`** | 버튼 내부 텍스트 시각적 설정 |
| **`layout`** | 구성 요소 간 간격과 여백을 정의하는 레이아웃 객체 |

### 레이아웃 상세 (`DialogBoxLayout`)

| 속성 | 기본값 | 설명 |
| :--- | :---: | :--- |
| **`panelPadding(Left/Right/Top/Bottom)`** | `28` | 메인 패널 내부 상하좌우 여백(px) |
| **`buttonPadding(Left/Right)`** | `24` | 각 버튼 내부 좌우 패딩 |
| **`buttonPadding(Top/Bottom)`** | `10` | 각 버튼 내부 상하 패딩 |
| **`titleContentGap`** | `12` | 제목과 본문 사이 수직 간격 |
| **`contentButtonGap`** | `30` | 본문 하단과 버튼 영역 사이 공간 |
| **`buttonRowGap`** | `10` | 버튼이 여러 행일 때 행간 여백 |
| **`buttonColumnGap`** | `8` | 동일 행 내 버튼 사이 가로 간격 |

## 핵심 예제 (Main Example)

### 긴급 경고 디자인 설정

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  initial: {
    dialogBox: {
      panel: {
        background: '#2c3e50',
        borderColor: '#e74c3c',
        borderWidth: 3,
        borderRadius: 8
      },
      titleStyle: {
        color: '#e74c3c',
        fontSize: 28,
        fontWeight: 'bold'
      }
    }
  }
})(() => [
  { type: 'dialogBox', title: '경고', content: '위험합니다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **자동 크기 조절** | 패널 높이는 내부 내용에 따라 자동 산출됩니다. 너비 또한 텍스트 길이에 맞춰 자동 할당되며, 여유 공간 초과 시에만 다음 행으로 개행됩니다. |
