# ⚙️ Overlay State & Layout

---

## 1. 개요 (Overview)

`overlay` 모듈의 상태(State) 설정입니다. `overlay-text`와 `overlay-image`의 기본 스타일을 전역적으로 관리하며, 내부적으로 현재 화면에 표시 중인 오버레이 항목들의 맵(`_overlays`)을 유지합니다.

---

## 2. 상태 상세 (`OverlaySchema`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| **`textStyle`** | `Partial<Style>` | 모든 텍스트 오버레이에 적용될 기본 스타일입니다. |
| **`imageStyle`** | `Partial<Style>` | 모든 이미지 오버레이에 적용될 기본 스타일입니다. |

---

## 3. 활용 예시 (Examples)

### 씬 시작 시 초기 스타일 지정
`defineInitial` 또는 `defineScene`의 `initial` 섹션에서 오버레이의 기본 테마를 설정합니다.

```ts
export const goldOverlayStyle = defineInitial(config, {
  overlay: {
    textStyle: { fontSize: 32, fontColor: '#ffd700', fontWeight: 'bold' },
    imageStyle: { opacity: 0.8, borderRadius: 10 }
  }
})
```

### 런타임 상태 변경 (`ui` 커맨드)
게임 진행 중에 오버레이의 기본 스타일을 동적으로 변경할 수 있습니다. (이후 생성되는 오버레이에 적용됩니다.)

```ts
{
  type: 'ui',
  name: 'overlay',
  data: {
    textStyle: { fontColor: '#ff0000' }
  }
}
```

---

## 4. 주의 사항 (Edge Cases)

*   **스타일 우선순위**: 커맨드에서 직접 지정한 스타일 속성이 `textStyle`이나 `imageStyle`보다 우선 적용됩니다.
