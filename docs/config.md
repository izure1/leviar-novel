# ⚙️ 프로젝트 설정 (Configuration)

이 문서는 프로젝트의 해상도, 변수, 캐릭터, 에셋 등을 중앙에서 관리하는 설정 파일의 작성법을 안내합니다.  

---

## 1. 기본 환경 설정 (Base Options)

화면 크기와 초기 전역 변수, 그리고 게임에 사용할 이미지나 사운드 파일의 경로를 등록합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  // 기준 해상도입니다
  width: 1280,
  height: 720,
  
  // 게임이 시작될 때 설정되는 초기 전역 변수입니다
  variables: {
    gold: 100,
    playerName: '여행자'
  },
  
  // 게임에서 사용할 리소스(이미지, 소리)에 ID를 부여합니다
  assets: {
    'bg-room': './assets/room.webp',
    'char-aris-body': './assets/aris_body.png'
  }
})
```

---

## 2. 캐릭터 설정 (Characters)

화면에 출력할 캐릭터의 몸체와 표정을 조합할 수 있도록 구조를 미리 등록합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  // ... 기본 설정 생략
  characters: {
    heroine: {
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
      // 기본 몸체 위에 덧씌워질 표정 이미지입니다
      emotions: {
        smile: { face: 'aris_face_smile' }
      }
    }
  }
})
```

---

## 3. 모듈 초기 상태 (Initial State)

게임이 시작될 때 대화창이 미리 떠 있을지, 텍스트 출력 속도는 몇일지 등 모듈의 기본 상태를 지정합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  // ... 기본 설정 생략
  initial: {
    dialogue: {
      // 씬 시작 시 대화창을 기본적으로 노출시킵니다
      visible: true, 
      // 텍스트 타이핑 효과의 지연 시간(ms)입니다
      speed: 50      
    }
  }
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
