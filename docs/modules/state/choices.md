# ⚙️ Choices State & Layout

---

## 1. 개요 (Overview)

`choices` 모듈의 상태(State) 설정입니다. 외형(Style)과 배치(Layout) 정보를 포함하며, `defineInitial`을 통해 씬 전체의 기본 상태를 지정하거나 런타임에 `ui` 커맨드를 통해 동적으로 상태를 변경할 수 있습니다.

---

## 2. 상태 상세 (`ChoiceSchema`)

| 속성 | 타입 | 설명 |
| :--- | :--- | :--- |
| `bg` | `Partial<Style>` | 선택지 화면 전체의 배경(오버레이) 스타일입니다. |
| `button` | `Partial<Style>` | 선택지 버튼의 기본 스타일입니다. |
| `buttonHover` | `Partial<Style>` | 마우스 호버 시 버튼의 스타일입니다. |
| `text` | `Partial<Style>` | 버튼 내부 텍스트의 기본 스타일입니다. |
| `textHover` | `Partial<Style>` | 마우스 호버 시 텍스트의 스타일입니다. |
| `layout` | `ChoiceLayout` | 버튼 간격 및 패딩 등 배치 관련 설정입니다. |

---

## 3. 레이아웃 설정 (`ChoiceLayout`)

버튼의 크기와 간격을 정밀하게 제어합니다.

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| `gap` | `number` | `12` | 버튼 간의 세로 간격(px)입니다. |
| `paddingX` | `number` | `64` | 버튼 내부 좌우 패딩 합산(px)입니다. |
| `paddingY` | `number` | `24` | 버튼 내부 상하 패딩 합산(px)입니다. |

---

## 4. 활용 예시 (Examples)

### 씬 시작 시 초기 상태 지정
`defineScene`의 `initial` 섹션에서 선택지의 초기 상태를 설정합니다.

```ts
export default defineScene({
  initial: {
    choices: {
      button: { color: '#2c3e50', borderRadius: 20 },
      text: { fontSize: 22, color: '#ecf0f1' },
      layout: { gap: 20 }
    }
  }
})
```

### 런타임 상태 변경 (`ui` 커맨드)
게임 진행 중에 선택지의 상태를 동적으로 바꿉니다.

```ts
{
  type: 'ui',
  name: 'choices',
  data: {
    button: { color: 'rgba(255, 0, 0, 0.5)' }
  }
}
```

---

## 5. 주의 사항 (Edge Cases)

*   **상태 병합**: `ui` 커맨드로 상태를 변경할 경우, 명시한 속성만 덮어씌워지며 나머지는 기존 상태를 유지합니다.
*   **레이아웃 우선순위**: `button.width`를 직접 지정하면 `layout.paddingX` 설정은 무시되고 고정 너비가 적용됩니다.
