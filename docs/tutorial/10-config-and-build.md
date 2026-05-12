# 10. 프로젝트의 완성: 설정과 배포

당신은 이제 완성된 게임을 세상에 내놓을 준비를 마쳤습니다.  
이 페이지에서는 수많은 씬의 설정을 한 곳에서 마법처럼 제어하는 **폴백(Fallback)** 시스템과 최종 빌드 과정을 배웁니다.

## 동기

리소스가 늘어날수록 씬 코드에는 비슷한 수치들이 반복해서 등장하기 마련입니다.  
모든 오디오 명령에 같은 볼륨을 적고, 모든 대사에 같은 속도를 적고 있지는 않나요?  
나중에 "볼륨을 조금만 줄여달라"는 요청이 들어오면 모든 파일을 뒤져야 하는 비극이 발생합니다.

```typescript
// ❌ 비효율: 수작업으로 반복되는 설정들
export default defineScene({ config })(() => [
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-room', volume: 0.8 },
  { type: 'dialogue', text: '안녕!', speed: 50 }
  // ... 모든 씬마다 0.8과 50을 반복해서 적고 있다면?
])
```

중앙 집중 관리의 이점을 이제 실제 설정 파일 작성을 통해 경험해 보겠습니다.

## 기본 사용법: 폴백(Fallback)의 전략적 활용

`novel.config.ts`의 `fallback`은 단순한 기본값 설정을 넘어, 엔진의 동작 방식을 결정하는 강력한 규칙 엔진입니다.  
이 시스템을 제대로 이해하려면 **우선순위**, **병합**, **매칭**이라는 세 가지 핵심 원리를 파악해야 합니다.

### 1. 우선순위와 병합 (Priority & Merge)

`fallback` 배열은 **위에 선언된 규칙일수록 높은 우선순위**를 가집니다.  
만약 한 명령어가 여러 규칙에 동시에 해당된다면, 엔진은 이 규칙들을 위에서부터 아래로 훑으며 속성들을 하나로 합칩니다(Merge).

```typescript
// ✅ novel.config.ts
fallback: [
  // (A) 가장 구체적인 규칙: 후미카의 대사만 특별 관리 (최고 우선순위)
  {
    type: 'dialogue',
    speaker: 'fumika',
    defaults: { speed: 20 } // 후미카는 말이 빠릅니다
  },
  // (B) 일반적인 규칙: 모든 대사에 공통 적용
  {
    type: 'dialogue',
    defaults: { speed: 40, visible: true }
  }
]
```

*   **일반 대사 실행 시**: (B) 규칙만 적용되어 `speed: 40`이 됩니다.
*   **후미카 대사 실행 시**: (A)와 (B)가 모두 매칭됩니다. 우선순위가 높은 (A)의 `speed: 20`이 (B)의 값을 덮어쓰고, (B)에만 있는 `visible: true`는 그대로 유지되어 최종적으로 두 값이 **병합**됩니다.

### 2. 정교한 매칭을 통한 범위 좁히기

`fallback` 규칙에 더 많은 속성을 적을수록 적용 범위가 정교해집니다.  
이를 활용하면 특정 상황에서만 발동하는 예외 규칙을 손쉽게 만들 수 있습니다.

```typescript
// ✅ novel.config.ts
fallback: [
  // 'se' 슬롯에서 재생되는 특정 효과음만 볼륨을 낮추고 싶을 때
  {
    type: 'audio',
    name: 'se',
    defaults: { volume: 0.2 }
  },
  // 그 외 모든 오디오의 기본 볼륨
  {
    type: 'audio',
    defaults: { volume: 0.8 }
  }
]
```

> [!TIP]
> 범용적인 규칙일수록 배열의 아래쪽에, 특수하고 구체적인 규칙일수록 위쪽에 배치하십시오.  
> 이것이 폴백 시스템을 다루는 가장 효율적인 서순입니다.

이처럼 영리하게 구성된 `fallback`은 당신의 씬 코드를 아래와 같이 비약적으로 개선합니다.

```typescript
// ✅ 폴백 적용 후: 수치 노이즈가 제거된 씬 코드
export default defineScene({ config })(() => [
  // volume: 0.8과 speed: 50이 폴백에 의해 자동 주입됩니다
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-room' },
  { type: 'dialogue', text: '안녕!' },

  // 후미카의 대사는 폴백 우선순위에 따라 speed: 80이 적용됩니다
  { type: 'dialogue', speaker: 'fumika', text: '여어, 반가워!' }
])
```

이제 당신은 수치 지옥에서 벗어나 오직 '이야기'에만 집중할 수 있게 되었습니다.

## 점진적 심화: 완성된 프로젝트 설정

이제 02장에서 배운 리소스 설정과 이번 장의 규칙들을 하나로 합쳐 프로젝트를 완성해 봅시다.

```typescript
// ✅ novel.config.ts 최종 완성본
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1920,
  height: 1080,

  // 1. 리소스 매핑 (02장 참조)
  assets: { 'char-body': './assets/images/fumika.webp' },
  audios: { 'bgm-room': './assets/audio/room.mp3' },

  // 2. 캐릭터 및 배경 정의 (02장 참조)
  characters: { fumika: { bases: { normal: { src: 'char-body', width: 600 } } } },

  // 3. 중앙 규칙 (이번 장의 핵심)
  fallback: [
    { type: 'audio', defaults: { volume: 0.8 } },
    { type: 'dialogue', defaults: { speed: 50 } }
  ],

  // 4. 전역 공유 변수 (옵션 등)
  environments: { $textSpeed: 50, $masterVolume: 0.8 }
})
```

### 빌드와 배포

작업이 끝났다면 실제 서비스가 가능한 형태로 빌드할 차례입니다.  
터미널에서 아래 명령어를 실행하면 최적화된 결과물이 담긴 `dist` 폴더가 생성됩니다.

```bash
npm run build
```

> [!NOTE]
> 빌드된 파일은 보안 정책상 웹 서버를 통해 실행해야 정상적으로 작동합니다.  
> 실제 서비스 환경과 동일한 조건에서 테스트하십시오.

## 다음 단계

축하합니다! 비주얼 노벨 개발의 모든 표준 과정을 완주하셨습니다.  
마지막 장에서는 엔진을 확장하여 당신만의 독창적인 기능을 만드는 방법을 다룹니다.

* **[11. 엔진의 무한한 확장: 커스텀 모듈](./11-custom-modules.md)**
* **[프로젝트 설정 상세 참조](../config.md)**
