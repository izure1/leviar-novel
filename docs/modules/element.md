# 🧩 범용 UI 요소 (Element)

## 개요 (Overview)

`element` 모듈은 사각형(패널/버튼 배경), 텍스트, 이미지 등의 범용 UI 요소를 씬 내에서 직접 선언적으로 배치하고 계층 구조를 구성할 수 있게 해주는 기능입니다.  
복잡한 UI 모듈을 직접 개발하지 않고도, 씬 내부에서 즉석으로 버튼이나 알림창 같은 커스텀 UI를 화면에 띄울 수 있습니다.

## 사전 준비 (Prerequisites)

- `defineScene`의 `actions`에 클릭 시 실행할 로직(콜백)이 정의되어 있어야 `onClick` 이벤트를 정상적으로 처리할 수 있습니다.
- 이미지 요소를 띄울 경우, `novel.config.ts`의 `assets`에 해당 이미지가 미리 정의되어 있어야 합니다.

## 핵심 예제 (Main Example)

화면 중앙 우측에 세이브 버튼이 포함된 패널을 띄우고, 클릭 시 이벤트를 처리하는 예제입니다.

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({
  config,
  // onClick 이벤트에서 호출할 액션들을 정의합니다.
  actions: {
    save: (ctx) => {
      console.log('세이브 버튼이 클릭되었습니다!')
      // 필요한 경우 ctx.execute(...)를 호출하여 추가 연출 실행 가능
    }
  }
})(({ label }) => [
  {
    type: 'element',
    action: 'show',
    id: 'panel_main',
    kind: 'rect',
    // 화면 우측 중앙 배치 (0~1 정규화 좌표)
    position: { x: 0.92, y: 0.5 },
    // 배경 패널 스타일
    style: { width: 120, height: 300, color: 'rgba(0,0,0,0.5)' },
    children: [
      {
        id: 'btn_save',
        kind: 'rect',
        // 부모(panel_main)의 중앙을 기준으로 한 픽셀 오프셋
        position: { x: 0, y: 60 },
        style: { width: 100, height: 36, color: 'rgba(255,255,255,0.1)' },
        // 호버 시 색상이 약간 밝아짐
        hoverStyle: { color: 'rgba(255,255,255,0.3)' },
        // 클릭 시 actions의 'save'를 실행
        onClick: 'save',
        // 버튼 내 텍스트
        children: [
          {
            id: 'btn_save_text',
            kind: 'text',
            text: '💾 저장',
            style: { fontSize: 14, color: '#fff' }
          }
        ]
      }
    ]
  },
  
  // 요소 숨기기 (hide를 호출하면 해당 id와 모든 자식 요소들이 일괄 삭제됩니다)
  // { type: 'element', action: 'hide', id: 'panel_main' }
])
```

## 속성 상세 (Properties)

### 기본 명령 속성 (`type: 'element'`)

| 속성명 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`action`** | `'show' \| 'hide'` | 요소를 표시할지 삭제할지 결정합니다. |
| **`id`** | `string` | 요소의 고유 식별자입니다. 숨길 때 이 식별자가 필요합니다. |
| **`kind`** | `'rect' \| 'text' \| 'image'` | (`show` 시 필수) 요소의 형태를 지정합니다. |
| **`text`** | `string` | (`kind: 'text'` 전용) 표시할 문자열입니다. |
| **`image`** | `string` | (`kind: 'image'` 전용) 에셋에 등록된 이미지 키값입니다. |
| **`duration`** | `number` | 페이드인/아웃 애니메이션 시간(ms)입니다. 기본값 200. |
| **`uiTags`** | `string[]` | 이 요소 모듈에 부여할 태그 목록입니다. 억제 시스템에서 식별자로 사용됩니다. |
| **`hideTags`** | `string[]` | 이 요소가 활성화될 때 함께 숨길 대상 태그 목록입니다. |

### 공통 배치/스타일 속성 (루트 요소 및 자식 요소 공통)

모든 요소(`children` 포함)가 공통적으로 가지는 스타일 및 제어 속성입니다.

| 속성명 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`position`** | `{ x: number, y: number }` | 루트 요소는 **0~1 사이의 화면 정규화 비율 좌표**입니다.<br>자식 요소(`children`)는 **부모 중심점 기준 픽셀(px) 오프셋**입니다. |
| **`pivot`** | `{ x: number, y: number }` | 요소의 기준점(0~1 정규화)입니다. 기본값 `{ x: 0.5, y: 0.5 }`(중앙 기준). |
| **`rotation`** | `number` | 요소의 회전 각도(도 단위)입니다. |
| **`style`** | `Style` | 너비(`width`), 높이(`height`), 색상(`color`), 폰트크기(`fontSize`) 등의 기본 렌더링 스타일입니다. |
| **`hoverStyle`** | `Style` | 마우스를 올렸을 때 기본 스타일에 병합(Merge)되는 스타일입니다. 마우스가 벗어나면 원상 복구됩니다. |
| **`onClick`** | `string` | 클릭 시 호출될 액션 이름입니다. 씬의 `actions` 필드에 동일한 이름이 있어야 합니다. |
| **`children`** | `ElementChild[]` | 이 요소 내부에 들어갈 자식 요소들의 배열입니다. 무한하게 중첩할 수 있습니다. |

## 주의 사항 (Edge Cases)

| 상황 | 원인 및 해결 방법 |
| :--- | :--- |
| **액션을 찾을 수 없다는 경고 발생** | `onClick`에 지정한 이름이 `defineScene({ actions: { ... } })` 블록 내부에 제대로 선언되었는지 확인하세요. |
| **자식 요소가 보이지 않음** | 자식 요소의 `position`은 화면 비율(0.5 등)이 아니라 부모 중심을 기준으로 한 **픽셀 단위** 오프셋입니다. 숫자를 너무 작거나 크게 주지 않았는지 확인하세요. |
| **텍스트/이미지 속성 오류** | 타입 스크립트 기반으로 설계되어 있습니다. `kind`가 `'rect'`일 때는 `text`나 `image` 속성을 쓸 수 없고, `'text'`일 때만 `text` 속성을 쓸 수 있습니다. |
| **태그 기반 숨김 제어** | `uiTags`와 `hideTags`를 사용해 다른 UI와의 가시성을 조절하려면 **[UI 태그 시스템](../ui-tags.md)** 문서를 참고하세요. |
