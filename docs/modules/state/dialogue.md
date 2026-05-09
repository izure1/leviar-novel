# 🎨 대화창 상태 (Dialogue State)

## 개요 (Overview)

`dialogue` 모듈의 시각적 요소(배경 패널, 화자 식별자, 대사 텍스트)와 배치 레이아웃을 결정하는 `DialogueSchema` 구조입니다.  

## 상태 상세 명세 (Properties)

| 속성 명칭 | 상세 설명 |
| :--- | :--- |
| **`bg`** | 대화창 전체를 구성하는 배경 패널 형태 및 색상 (`height` 설정 가능) |
| **`speaker`** | 캐릭터 이름이 표시되는 텍스트 서체 및 설정 |
| **`text`** | 실제 대사가 출력되는 영역 텍스트 레이아웃 및 스타일 |
| **`layout`** | 창 내부 요소 간 여백 및 수직적 배치를 정의하는 레이아웃 객체 |

### 레이아웃 상세 (`DialogueLayout`)

| 속성 | 기본값 | 설명 |
| :--- | :---: | :--- |
| **`panelPadding(Left/Right)`** | `48` | 대화창 패널 좌우 여백(px) |
| **`panelPadding(Top/Bottom)`** | `24` | 대화창 패널 상하 여백 |
| **`speakerTextGap`** | `8` | 화자 이름 영역과 대사 영역 사이 수직 간격 |

## 핵심 예제 (Main Example)

### 감성적 반투명 대화창 디자인

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  initial: {
    dialogue: {
      bg: { 
        height: 200, 
        background: 'rgba(20, 20, 40, 0.85)',
        borderRadius: 16
      },
      text: { 
        fontSize: 22,
        lineHeight: 1.8,
        color: '#f8f9fa'
      }
    }
  }
})(() => [
  { type: 'dialogue', text: '대화창이 반투명한 푸른빛으로 빛납니다.' }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **레이어 높이 지정** | `bg`에 `height` 속성이 없으면 엔진이 화면 전체 높이의 약 28%로 자동 할당합니다. |
| **Z-Index 계층** | 대화창의 기본 `zIndex`는 환경 요소들보다 상단인 `400`으로 고정되어 있습니다. |
