# 🗳️ Choices Module

---

## 1. 개요 (Overview)

`choices` 모듈은 게임 진행 중 사용자에게 여러 선택지를 제시하고, 선택 결과에 따라 시나리오를 분기하거나 변수를 조작하는 기능을 담당합니다. 세련된 애니메이션 효과와 함께 커스텀 스타일링 및 레이아웃 설정을 지원합니다.

### 주요 특징
* **시나리오 분기**: 선택에 따라 다른 씬(`next`)으로 이동하거나 현재 씬 내의 특정 라벨(`goto`)로 점프할 수 있습니다.
* **변수 조작**: 선택 즉시 전역/지역 변수의 값을 변경하여 이후의 연출이나 분기에 영향을 줄 수 있습니다.
* **유연한 텍스트**: 함수 형태의 텍스트를 지원하여 변수 값에 따라 선택지의 내용이 동적으로 변하게 할 수 있습니다.

---

## 2. 핵심 예제 (Main Example)

### 기본 분기 및 변수 조작
선택에 따라 다른 라벨로 이동하며 호감도 변수를 증가시킵니다.

```ts
{
  type: 'choices',
  choices: [
    { text: '용기를 내어 말을 건다', goto: 'talk_to_her', var: { likeability: 5 } },
    { text: '조용히 지나간다', goto: 'pass_by' }
  ]
}
```

### 동적 텍스트 및 씬 전환
변수 상태를 반영한 텍스트를 보여주고 다른 씬으로 전환합니다.

```ts
{
  type: 'choices',
  choices: [
    { 
      text: ({ gold }) => `뇌물을 준다 (소지 금화: ${gold})`, 
      next: 'bribe_success_scene',
      var: ({ gold }) => ({ gold: gold - 100 })
    },
    { text: '정면 돌파한다', next: 'battle_scene' }
  ]
}
```

---

## 3. 커맨드 상세 (Command Reference)

### Choices 명령 (`ChoiceCmd`)

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `type` | `'choices'` | ✅ | 선택지 커맨드임을 명시합니다. |
| `choices` | `ChoiceItem[]` | ✅ | 제시할 선택지 객체들의 배열입니다. |

#### ChoiceItem 객체

| 속성 | 타입 | 필수 | 설명 |
| :--- | :--- | :---: | :--- |
| `text` | `string \| Function` | ✅ | 버튼에 표시될 텍스트입니다. |
| `next` | `string \| Object` | - | 선택 시 이동할 다음 씬 이름 또는 객체입니다. |
| `goto` | `string` | - | 현재 씬 내에서 이동할 라벨 이름입니다. |
| `var` | `Object \| Function` | - | 선택 시 업데이트할 변수들입니다. 함수형 객체를 사용해 동적 연산을 수행할 수 있습니다. |

#### 동적 변수 조작 (Resolvable)

기존 변수 값을 참조하여 가산하거나 조건부로 변경할 수 있습니다.

```ts
// 기존 호감도에 10을 더함
var: ({ heart }) => ({ heart: heart + 10 })
```
* [상세 가이드: Resolvable (함수형 값)](../concepts/resolvable.md)
* [상세 가이드: Variables (변수 시스템)](../concepts/variables.md)

---

## 4. 상태 및 레이아웃 (State & Layout)

선택지 버튼의 색상, 둥글기, 텍스트 크기 및 간격 등 모듈의 상태를 자유롭게 설정할 수 있습니다.

```ts
// 씬 시작 시 초기 상태 설정 예시
export default defineScene({
  initial: {
    choices: {
      button: { color: '#2c3e50', borderRadius: 12 },
      layout: { gap: 16 }
    }
  }
})
```
* [상세 가이드: Choices 상태 및 레이아웃](./state/choices.md)

---

## 5. 훅 (Hooks)

`choices` 모듈의 동작 전후에 개입할 수 있는 훅을 제공합니다.

| 키 | 인자 타입 | 설명 |
| :--- | :--- | :--- |
| `choice:show` | `{ choices: ResolvedChoiceItem[] }` | 선택지가 화면에 표시되기 직전에 호출됩니다. |
| `choice:select` | `{ index: number, selected: ResolvedChoiceItem }` | 사용자가 특정 항목을 선택했을 때 호출됩니다. |

---

## 6. 주의 사항 (Edge Cases)

* **입력 차단**: 선택지 커맨드가 실행되는 동안 다른 입력(대사 진행 등)은 자동으로 차단되며, 다른 UI 그룹(대사창 등)은 숨겨집니다.
* **씬 전환**: `next`를 지정한 경우 현재 씬은 즉시 종료되고 새로운 씬이 로드됩니다.
* **함수형 텍스트**: `text` 속성에 함수를 사용할 경우, 실시간 변수 상태를 반영하여 동적인 문구를 생성할 수 있습니다.
