# 03. 캐릭터 정의 및 시나리오 작성 (Scenario) 🎭

리소스 설정이 끝났다면 이제 이야기를 구성할 차례입니다. `fumika`는 캐릭터의 표정 변화와 대사 흐름을 매우 직관적으로 제어할 수 있게 설계되었습니다.

---

## 캐릭터 정의: 배우의 외형 설정하기

단순한 이미지를 넘어, 게임 내에서 '배우' 역할을 할 캐릭터를 정의합니다. 신체(`bases`)와 표정(`emotions`) 파트를 분리하여 정의함으로써 다양한 조합을 효율적으로 관리할 수 있습니다.

```ts
// novel.config.ts의 characters 필드에 추가
characters: {
  heroine: {
    name: '아리스', // 대사창에 표시될 이름
    bases: {
      // 캐릭터의 기본 신체 이미지입니다.
      normal: { 
        src: 'aris_base_normal', 
        width: 560,
        // 감정 파트가 배치될 좌표(points)를 정의합니다.
        points: {
          face: { x: 0.5, y: 0.2 } 
        }
      }
    },
    emotions: {
      // 정의된 포인트(face)에 올라갈 표정 이미지들을 조합합니다.
      normal: { face: 'aris_face_normal' },
      smile:  { face: 'aris_face_smile' }
    }
  }
}
```

### 💡 이미지 키는 어떻게 사용하나요?
캐릭터의 이미지는 **`신체:표정`** 형식을 조합하여 호출합니다.

**예를 들어**, `normal` 신체에 `smile` 표정을 보여주고 싶다면 시나리오에서 **`image: 'normal:smile'`**이라고 적으면 됩니다. 이렇게 이름을 붙여두면 복잡한 파일 경로를 기억할 필요 없이, 사람이 이해하기 쉬운 단어 조합만으로 캐릭터의 상태를 자유롭게 바꿀 수 있습니다.

## 첫 번째 시나리오 (`defineScene`) 작성

`scenes/scene-intro.ts` 파일을 생성합니다. 이곳이 실제 연출이 일어나는 무대입니다.

```ts
import { defineScene } from 'fumika'
import config from '../novel.config'

export default defineScene({ config })([
  // 1. 배경을 먼저 깝니다.
  { type: 'background', name: 'school' },
  
  // 2. 캐릭터를 화면에 등장시킵니다.
  { type: 'character', name: 'heroine', action: 'show', image: 'normal:normal' },
  
  // 3. 대사를 출력합니다.
  { type: 'dialogue', speaker: 'heroine', text: '안녕! Fumika의 세계에 온 걸 환영해.' },
  { type: 'dialogue', text: '이 엔진은 정말 강력하고 유연해.' }
])
```

## 💡 깊이 알아보기: `defineScene`의 마법

`defineScene`은 단순히 함수가 아니라, **타입 가이드** 역할을 합니다. 

**예를 들어**, `characters` 설정에 없는 이름을 `name: 'unknown'`과 같이 적으면 코드가 실행되기도 전에 빨간색 밑줄로 에러를 알려줍니다. 이는 수만 줄의 시나리오를 작성할 때 발생할 수 있는 사소한 실수들을 완벽하게 잡아줍니다.

## 💡 명령의 순서와 레이어 (Z-Index)

`fumika` 엔진은 매우 똑똑한 레이어 시스템을 가지고 있습니다.

1.  **자동 레이어링**: 배경, 캐릭터, 대사창 등은 각각 정해진 층(`zIndex`)이 있습니다. 따라서 배경 명령을 나중에 쓰더라도 캐릭터가 배경 뒤로 숨는 일은 발생하지 않습니다.
2.  **시간적 순서**: 시나리오 배열의 순서는 시각적인 층위가 아니라 **"어떤 일이 먼저 일어나는가"**를 결정합니다. 

**예를 들어**, 배경을 먼저 깔고 캐릭터를 등장시키고 싶다면 그 순서대로 명령을 적어야 합니다. 만약 반대로 적는다면 캐릭터가 허공에 먼저 나타난 뒤에 배경이 뒤늦게 나타나는 어색한 연출이 될 수 있습니다. 즉, **코드를 위에서 아래로 읽으며 영화를 감독하듯이 순서를 배치**하면 됩니다.

---

[⬅️ 이전 단계: 02. 설정](./02-configuration.md) | [다음 단계: 04. 엔진 구동 ➡️](./04-running-game.md)
