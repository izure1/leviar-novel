# ⚙️ 프로젝트 설정 (Configuration)

이 문서는 프로젝트의 해상도, 변수, 캐릭터, 에셋 등을 중앙에서 관리하는 설정 파일의 작성법을 안내합니다.  

---

## 1. 기본 환경 설정 (Base Options)

화면 크기와 초기 전역 변수, 그리고 게임에 사용할 이미지나 사운드 파일의 경로를 등록합니다.  

### 핵심 예제 (Main Example)

```typescript
// assets.ts
// 에셋을 한 곳에서 중앙 관리합니다
import { defineAssets } from 'fumika'

export default defineAssets({
  'bg-room': './assets/room.webp',
  'char-aris-body': './assets/aris_body.png',
  'char-aris-smile': './assets/aris_smile.png'
})
```

```typescript
// novel.config.ts
import { defineNovelConfig, defineBackgrounds } from 'fumika'
import assets from './assets'

// 배경을 등록합니다. 에셋의 키만 사용할 수 있도록 타입이 강제됩니다.
const backgrounds = defineBackgrounds(assets)({
  room: { src: 'bg-room', parallax: true }
})

export default defineNovelConfig({
  // 기준 해상도입니다
  width: 1280,
  height: 720,
  
  // 게임이 시작될 때 설정되는 초기 전역 변수입니다
  variables: {
    gold: 100,
    playerName: '여행자'
  },
  
  assets,
  backgrounds,
  // ... 생략
})
```

---

## 2. 캐릭터 설정 (Characters)

화면에 출력할 캐릭터의 몸체와 표정을 조합할 수 있도록 구조를 미리 등록합니다.  

### 핵심 예제 (Main Example)

```typescript
// characters/aris.ts
import { defineCharacter } from 'fumika'
import assets from '../assets'

// assets를 전달하여 표정에 사용될 이미지 키를 안전하게 추론합니다
export default defineCharacter(assets)({
  name: '아리스',
  // 기본 몸체 이미지입니다
  bases: {
    normal: {
      src: 'char-aris-body', 
      width: 600, 
      // 캐릭터의 머리, 눈, 입의 위치를 설정합니다 (0.0 ~ 1.0)
      points: { face: { x: 0.5, y: 0.2 } }
    }
  },
  // 몸체 위에 덧씌워질 표정 이미지입니다
  emotions: {
    smile: { face: 'char-aris-smile' }
  }
})
```

```typescript
// novel.config.ts
import { defineNovelConfig } from 'fumika'
import aris from './characters/aris'

export default defineNovelConfig({
  // ... 생략
  characters: {
    aris
  }
})
```

---

## 3. 고급 설정 (Fallback, Modules, Audios, Effects)

게임의 기본 폴백 액션, 커스텀 모듈, 오디오, 이펙트 등도 중앙에서 관리합니다.
타입 추론을 돕기 위해 제공되는 헬퍼 함수들을 조합하여 구성해 보세요.

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig, defineCustomModules, defineFallback, defineAudios, defineEffects } from 'fumika'

// 커스텀 모듈을 정의합니다
const modules = defineCustomModules({
  'my-cmd': myModule,
})

// 폴백 규칙을 정의합니다. (모듈 정보를 넘겨 타입 추론을 받습니다)
const fallback = defineFallback(modules)([
  { type: 'character', action: 'show', defaults: { duration: 300 } }
])

// 오디오와 이펙트를 정의합니다
const audios = defineAudios({
  'bgm_main': './assets/bgm_main.mp3'
})
const effects = defineEffects({
  sakura: { clip: { size: [[1.0, 2.0]] } }
})

export default defineNovelConfig({
  // ... 기본 설정 생략
  modules,
  fallback,
  audios,
  effects
})
```

---

설정을 마치셨다면 **[튜토리얼](./tutorial.md)**을 통해 본격적인 시나리오를 작성해 보세요.  

---

## 4. 환경변수 (Environments)

모든 세이브 슬롯에서 공유되는 변수입니다.  
사용자 설정(텍스트 속도, 볼륨, CG 회수 여부 등)을 저장하는 데 적합합니다.  
키는 반드시 `$`로 시작해야 합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  // ... 기본 설정 생략
  environments: {
    $textSpeed: 'normal',
    $seenEnding: false,
    $bgmVolume: 0.8,
  }
})
```

자세한 사용법은 **[환경변수 문서](./reserved/environments.md)**를 참조하세요.  
