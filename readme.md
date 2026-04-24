# 개선 사항

## 1. defineCmd, defineUI 병합. 이제 따로 이용할 수 없음. define 모듈에서만 접근 허용.

일부 함수 개명이 필요함.

defineCmd → defineCommand
defineUI → defineView

```typescript
const myModule = define<DialogueSchema>({
  bg: undefined,
  speaker: undefined,
  text: undefined,
  subIndex: 0,
  lines: [],
  speakerKey: undefined,
  speed: undefined,
})

myModule.defineCommand(((cmd, ctx, data) => { ... })
myModule.defineView((data, ctx) => {
  return {
    show: ...,
    hide: ...,
  }
})

export default myModule
```

## 2. config.cmds, ui 제거. 대신 config.modules 추가.

## 3. config.modules에 모듈을 key-value로 추가.

```typescript
// dialogue.ts

const myModule = define<DialogueSchema>({
  bg: undefined,
  speaker: undefined,
  text: undefined,
  subIndex: 0,
  lines: [],
  speakerKey: undefined,
  speed: undefined,
})

myModule.defineCommand(((cmd, ctx, data) => { ... })
myModule.defineView((data, ctx) => {
  return {
    show: ...,
    hide: ...,
    update: ...,
  }
})

export default myModule
```

```typescript
// novel.ts
import myModule from './dialogue'

export const novel = defineNovel({
  modules: {
    'my-module': myModule,
  },
})
```

이로써 이제 `{ type: 'my-module' }` 등을 사용할 수 있게 됨.

## 4. 기존의 모든 cmds는 이제 위 사양을 따라야만 함

일부 cmd (mood, effect, character, screen 등)은 현재 위 구조를 따르지 않음. 따라서 해당 사항을 수정해야함.

- define으로 사용된 state는 반드시 게임 저장 시 상태가 저장되어야 함.
- 모든 세이브 데이터는 state로만 관리될 것. 복원 또한 state, defineView를 통해 이루어짐.
- screen 모듈의 경우, 저장할 필요가 없어서 state 자체는 필요하지 않음. 하지만 defineView를 사용하도록 강제해야 함.
- 마찬가지로 character 모듈의 경우에는 현재 별도의 저장 구조를 가지고 있는 것으로 파악됨. 따라서 해당 사항도 확인 필요.
- mood 모듈의 경우에는 여러 오브젝트가 동시에 렌더링되어야 하는 특수 경우가 있지만, 상태 정의를 통해 해결 가능.