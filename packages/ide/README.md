# Fumika IDE

후미카 ide는 fumika 엔진을 기반으로 동작합니다.

## 프로젝트 구조

게임 프로젝트 구조는 다음과 같습니다

```bash
- 루트
  - novel.config.ts
  - main.ts

  - declarations:
    - assets.ts
    - scenes.ts
    - characters.ts
    - modules.ts
    - backgrounds.ts
    - audios.ts

  - assets:
    - [이름].asset.ts

  - scenes:
    - [이름].scene.ts

  - characters:
    - [이름].character.ts

  - modules:
    - [이름].module.ts

  - backgrounds:
    - [이름].background.ts

  - audios:
    - [이름].audio.ts
```

assets에 파일을 추가하면, `assets.ts`에 자동으로 반영됩니다.
scenes에 파일을 추가하면, `scenes.ts`에 자동으로 반영됩니다.
characters에 파일을 추가하면, `characters.ts`에 자동으로 반영됩니다.
modules에 파일을 추가하면, `modules.ts`에 자동으로 반영됩니다.
backgrounds에 파일을 추가하면, `backgrounds.ts`에 자동으로 반영됩니다.
audios에 파일을 추가하면, `audios.ts`에 자동으로 반영됩니다.

각 파일들은 자기 자신의 이름을 키로 가진 객체로 구성된 default export를 가집니다.
예를 들어 `assets/bg_floor.asset.ts` 파일은 다음과 같습니다.

```typescript
import { defineBackgrounds } from 'fumika'

export default {
  bg_floor: { src: 'assets/bg_floor.png', parallax: true },
})
```

이렇게 반영된 파일들을 `novel.config.ts`에서 가져와서 사용합니다.

```typescript
import Assets from './declarations/assets'
import Scenes from './declarations/scenes'
import Characters from './declarations/characters'
import Modules from './declarations/modules'
import Backgrounds from './declarations/backgrounds'
import Audios from './declarations/audios'

import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  assets: Assets,
  scenes: Scenes,
  characters: Characters,
  modules: Modules,
  backgrounds: Backgrounds,
  audios: Audios,
})
```

## 기본 세팅

프로젝트 생성 시 `Assets`, `Scenes`, `Characters`, `Modules`, `Backgrounds`, `Audios` 폴더와 함께 기본적으로 `assets.ts`, `scenes.ts`, `characters.ts`, `modules.ts`, `backgrounds.ts`, `audios.ts` 파일이 생성됩니다.

또한 `novel.config.ts`, `main.ts` 파일이 생성됩니다.

