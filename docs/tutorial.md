# 📖 튜토리얼 (Tutorial)

이 문서는 빈 화면에 배경과 캐릭터를 띄우고, 대사를 출력하는 기초적인 시나리오 작성법을 안내합니다.  

---

## 1. 에셋 및 캐릭터 준비하기

화면에 띄울 배경과 캐릭터 이미지를 `novel.config.ts`에 등록해야 합니다.  
ID(문자열)를 키값으로 설정하여 나중에 시나리오에서 쉽게 불러올 수 있습니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1280,
  height: 720,
  assets: {
    'bg-classroom': './assets/classroom.jpg',
    'char-fumika-base': './assets/fumika_base.png',
    'char-fumika-smile': './assets/fumika_smile.png'
  },
  // 사용할 캐릭터의 몸체와 표정을 정의합니다
  characters: {
    fumika: {
      name: '후미카',
      bases: {
        default: { src: 'char-fumika-base', width: 400 }
      },
      emotions: {
        smile: { face: 'char-fumika-smile' }
      }
    }
  }
})
```

---

## 2. 장면 구성하기 (Scene Definition)

이제 작성해둔 `scene-start.ts` 파일을 열어서 배경을 깔고 캐릭터를 등장시킵니다.  
모든 연출은 배열 안에 객체를 순서대로 나열하는 방식입니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  // 1. 배경을 출력합니다
  { type: 'background', name: 'bg-classroom' },

  // 2. 캐릭터를 출력합니다
  { type: 'character', name: 'fumika', base: 'default', position: 'center' },

  // 3. 대사를 출력합니다
  { type: 'dialogue', character: 'fumika', text: '안녕, 오늘부터 잘 부탁해.' },

  // 4. 캐릭터의 표정을 바꿉니다
  { type: 'character', name: 'fumika', emotion: 'smile' },
  { type: 'dialogue', character: 'fumika', text: '앞으로 재미있는 일이 많을 거야.' }
])
```

---

## 3. 병렬 실행과 연출 (Skip)

위의 코드는 배경 전환 -> 캐릭터 등장 -> 대사 출력이 순차적으로 진행됩니다.  
만약 캐릭터 등장과 동시에 대사를 출력하고 싶다면 `skip: true` 속성을 추가합니다.  

### 핵심 예제 (Main Example)

```typescript
import { defineScene } from 'fumika'
import config from './novel.config'

export default defineScene({ config })(() => [
  { type: 'background', name: 'bg-classroom' },

  // skip: true가 있으면 멈추지 않고 즉시 다음 명령어와 동시에 실행됩니다
  { type: 'character', name: 'fumika', emotion: 'smile', skip: true },
  { type: 'dialogue', character: 'fumika', text: '안녕, 이렇게 나타남과 동시에 말할 수도 있어.' }
])
```

---

튜토리얼을 무사히 마쳤습니다.  
더 다양한 연출 명령어가 궁금하시다면 **[명령어 참조](./commands.md)**를 확인하시고,  
변수나 조건 분기 같은 로직이 필요하시다면 **[핵심 개념](./concepts.md)**을 읽어보시기 바랍니다.  
