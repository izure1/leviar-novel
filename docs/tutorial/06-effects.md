# 06. 멋진 연출 더하기 (Effects) 🎬

단조로운 화면에 카메라 연출과 입자 효과를 더해 게임의 퀄리티를 높여봅시다. 05단계에서 만든 시나리오를 계속 수정해 나갑니다.

---

## 카메라 줌과 이펙트 적용하기

아리스가 환영 인사를 할 때 카메라를 얼굴 쪽으로 당기고, 화면에 벚꽃이 흩날리게 만들어 보겠습니다.

```ts
// scenes/scene-intro.ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })([
  { type: 'background', name: 'school' },
  
  // 1. 벚꽃 효과 추가 (사양에 맞게 effect 종류와 사용할 이미지 src를 지정합니다)
  { type: 'effect', action: 'add', effect: 'sakura', src: 'sakura_petal' },

  { type: 'character', name: 'heroine', action: 'show' },

  // 2. 아리스의 얼굴(face)로 2초간 카메라 포커스 이동
  // (03단계에서 캐릭터 정의 시 설정한 'face' 지점을 자동으로 찾아갑니다)
  { type: 'character-focus', name: 'heroine', point: 'face', duration: 2000 },

  { type: 'dialogue', speaker: 'heroine', text: '안녕! Fumika의 세계에 온 걸 환영해.' },

  // 3. 카메라를 다시 전체 화면으로 되돌립니다.
  { type: 'camera-zoom', scale: 1, duration: 1000 },

  // ... (이후 05단계의 선택지 코드)
])
```

## 💡 이것만은 기억하세요!

*   **`character-focus`**: 단순히 화면을 키우는 것을 넘어, 캐릭터의 특정 부위(얼굴 등)를 자동으로 추적하여 클로즈업합니다. 좌표를 일일이 계산할 필요 없이 `face`와 같은 이름으로 연출할 수 있어 매우 편리합니다.
*   **`effect`**: 게임의 분위기를 좌우하는 파티클(눈, 비, 꽃잎 등)을 추가(`action: 'add'`)하거나 제거(`action: 'remove'`)할 때 사용합니다. 효과를 추가할 때는 반드시 `src`에 사용할 이미지 키를 지정해야 합니다.
*   **`duration`**: 모든 연출 시간은 밀리초(ms) 단위를 사용합니다. (1000ms = 1초)

---

[⬅️ 이전 단계: 05. 상호작용](./05-interaction.md) | [다음 단계: 07. 장소 이동과 마무리 ➡️](./07-transitions.md)
