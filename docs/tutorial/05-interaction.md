# 05. 플레이어의 선택 (Interaction) 🤝

이제 03단계에서 만든 시나리오에 플레이어의 선택지를 추가하여 이야기에 생명을 불어넣어 보겠습니다.

---

## 시나리오에 선택지 추가하기

`scenes/scene-intro.ts` 파일을 열고, 대사 뒤에 아래의 `choice` 커맨드를 추가해 보세요.

```ts
// scenes/scene-intro.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })([
  { type: 'background', name: 'school' },
  { type: 'character', name: 'heroine', action: 'show' },
  { type: 'dialogue', speaker: 'heroine', text: '안녕! Fumika의 세계에 온 걸 환영해.' },

  // --- 여기서부터 추가 ---
  { 
    type: 'choice', 
    choices: [
      { 
        text: '도서관에 가서 공부한다', 
        var: ({ score }) => ({ score: score + 10 }), // 점수 10점 추가
        goto: 'label-study'                          // 아래의 'label-study'로 이동
      },
      { 
        text: '오늘은 이만 집에 간다', 
        next: 'scene-home'                            // 07단계에서 만들 다른 씬으로 이동
      }
    ]
  },

  { type: 'label', name: 'label-study' },
  { type: 'dialogue', text: '나는 도서관으로 향했다. (현재 지식: {{score}})' }
])
```

## 💡 이것만은 기억하세요!

*   **`goto`**: 현재 파일 안에서 점프하고 싶을 때 사용합니다. 반드시 목적지에 `{ type: 'label', name: '...' }`이 있어야 합니다.
*   **`var`**: 플레이어의 선택에 따라 점수(`score`)를 올리는 등 데이터를 바꿀 때 사용합니다.
*   **`{{score}}`**: 대사 창에 현재 점수를 실시간으로 보여주고 싶을 때 중괄호 두 개를 사용합니다.

---

[⬅️ 이전 단계: 04. 구동](./04-running-game.md) | [다음 단계: 06. 멋진 연출 더하기 ➡️](./06-effects.md)
