# ⚙️ 선택지 상태 (Choices State)

## 개요 (Overview)

`choices` 모듈의 시각적 형태(Style)와 배치(Layout)를 결정하는 데이터 구조인 `ChoiceSchema`에 대해 기술합니다.  
`defineScene`의 `initial`로 씬 단위 기본값을 설정하거나, 런타임에 `ui` 커맨드로 동적 변경이 가능합니다.  

## 상태 상세 명세 (Properties)

| 속성 명칭 | 데이터 타입 | 상세 설명 |
| :--- | :--- | :--- |
| **`bg`** | `Partial<Style>` | 선택지 활성화 시 화면을 덮는 배경(오버레이) 스타일 |
| **`button`** | `Partial<Style>` | 선택지 버튼의 배경색, 테두리, 그림자 등 기본 스타일 |
| **`buttonHover`** | `Partial<Style>` | 버튼에 마우스를 올렸을 때 적용되는 강조 스타일 |
| **`text`** | `Partial<Style>` | 버튼 내부 텍스트의 폰트, 크기, 색상 |
| **`textHover`** | `Partial<Style>` | 호버 상태에서 텍스트 시각 변화 |
| **`layout`** | `ChoiceLayout` | 버튼 간 간격, 패딩 등 기하학적 배치 규칙 |

### 레이아웃 상세 (`ChoiceLayout`)

| 속성 | 기본값 | 설명 |
| :--- | :---: | :--- |
| **`gap`** | `12` | 선택지 버튼들 사이의 세로 여백(px) |
| **`buttonPaddingLeft`** | `32` | 버튼 내부 좌측 끝에서 텍스트까지의 여백 |
| **`buttonPaddingRight`** | `32` | 버튼 내부 우측 끝에서 텍스트까지의 여백 |
| **`buttonPaddingTop`** | `12` | 버튼 상단 테두리에서 텍스트까지의 여백 |
| **`buttonPaddingBottom`** | `12` | 버튼 하단 테두리에서 텍스트까지의 여백 |

## 핵심 예제 (Main Example)

### 씬 진입 시 초기 디자인 설정

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  initial: {
    choices: {
      button: { color: '#2c3e50', borderRadius: 20 },
      text: { fontSize: 22, color: '#ecf0f1' },
      layout: { gap: 20 }
    }
  }
})(() => [
  { type: 'choices', choices: [{ text: '옵션 1' }] }
])
```

## 주의 사항 (Edge Cases)

| 상황 | 설명 |
| :--- | :--- |
| **고정 너비 우선** | `button` 속성에 `width`를 직접 고정값으로 지정하면, 여백에 따른 자동 너비 계산보다 무조건 우선 적용됩니다. |
| **지능형 병합** | `ui` 커맨드로 중간에 상태를 바꿀 때 새로 지정한 속성만 바뀌고 나머지는 그대로 유지(병합)됩니다. 이 설정은 세이브 시에도 유지됩니다. |
