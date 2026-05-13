# 10. 프로젝트 빌드와 폴백 설정

이 페이지에서는 `novel.config.ts` 파일의 기능 중 폴백(Fallback) 시스템을 다룹니다.  
또한 작업이 끝난 후 게임을 배포하기 위해 빌드하는 방법을 알아봅니다.

## 동기

여러 씬을 만들다 보면 동일한 명령어 옵션을 반복해서 작성하게 됩니다.  
예를 들어 모든 대사 명령어에 속도를 50으로 맞추거나, 모든 오디오의 볼륨을 조절하는 상황이 생깁니다.

```typescript
// ❌ 비효율: 수작업으로 반복되는 설정들
export default defineScene({ config })(() => [
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-room', volume: 0.8 },
  { type: 'dialogue', text: '안녕!', speed: 50 }
  // ... 모든 씬마다 0.8과 50을 반복해서 적고 있다면?
])
```

설정값이 변경될 때마다 모든 씬 파일을 일일이 열어 수정할 수는 없습니다.  
특정 명령어의 기본값을 한 곳에서 통제할 수 있는 시스템이 필요하죠.

## 기본 사용법: 폴백(Fallback)의 전략적 활용

`fallback` 배열에 규칙을 등록하면, 해당 타입의 명령어가 실행될 때 지정한 기본값이 자동으로 주입됩니다.  
배열의 위쪽에 선언된 규칙일수록 높은 우선순위를 가집니다.

```typescript
// ✅ novel.config.ts: 우선순위에 따른 폴백 처리
fallback: [
  // (A) 특정 조건: 후미카의 대사 속도는 20
  {
    type: 'dialogue',
    speaker: 'fumika',
    defaults: { speed: 20 }
  },
  // (B) 일반 조건: 모든 대사 속도는 40
  {
    type: 'dialogue',
    defaults: { speed: 40, visible: true }
  }
]
```

명령어가 실행될 때 엔진은 이 규칙들을 순서대로 검사합니다.
일반 대사의 경우 (B) 규칙만 일치하므로 `speed: 40`이 적용됩니다.  
`speaker`가 'fumika'인 대사의 경우 (A)와 (B) 모두 일치하게 되죠.  
이때 더 우선순위가 높은 (A)의 `speed: 20`이 적용되고, (B)에 있는 `visible: true`가 하나로 병합됩니다.

> [!TIP]
> 범용적인 규칙은 배열 아래쪽에 두고, 특수한 규칙은 위쪽에 배치해 보세요.  
> 이렇게 하면 일반적인 상황을 처리하면서 예외 상황만 따로 덮어쓸 수 있습니다.

폴백 설정을 활용하면 실제 씬 코드를 아래와 같이 깔끔하게 작성할 수 있습니다.

```typescript
// ✅ 폴백 적용 후: 간결해진 씬 코드
export default defineScene({ config })(() => [
  // volume이나 speed 옵션을 직접 적지 않아도 자동으로 적용됩니다
  { type: 'audio', action: 'play', name: 'bgm', src: 'bgm-room' },
  { type: 'dialogue', text: '안녕!' },

  // 'fumika'의 대사이므로 speed: 20 규칙이 적용됩니다
  { type: 'dialogue', speaker: 'fumika', text: '여어, 반가워!' }
])
```

## 점진적 심화: 완성된 프로젝트 설정

이제 프로젝트 설정 파일인 `novel.config.ts`를 완성하고, 실제 구동 가능한 파일로 빌드해 봅시다.

```typescript
// ✅ novel.config.ts 최종 완성본
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: 1920,
  height: 1080,

  // 리소스 매핑 및 기본 정의
  assets: { 'char-body': './assets/images/fumika.webp' },
  audios: { 'bgm-room': './assets/audio/room.mp3' },
  characters: { fumika: { bases: { normal: { src: 'char-body', width: 600 } } } },

  // 공통 규칙 설정
  fallback: [
    { type: 'audio', defaults: { volume: 0.8 } },
    { type: 'dialogue', defaults: { speed: 50 } }
  ],

  // 전역 공유 변수
  environments: { $textSpeed: 50, $masterVolume: 0.8 }
})
```

### 빌드와 배포

개발이 끝났다면 터미널에서 아래 명령어를 실행하여 배포용 파일을 생성하세요.

```bash
npm run build
```

명령어가 완료되면 프로젝트 루트에 `dist` 폴더가 만들어집니다.  
이 폴더 내부의 파일들을 웹 서버에 업로드하면 바로 게임을 서비스할 수 있습니다.

> [!NOTE]
> `dist` 폴더 내의 `index.html`을 브라우저에서 직접 열면 보안 정책 문제로 로드되지 않습니다.  
> 반드시 `http://` 또는 `https://` 프로토콜을 사용하는 로컬 서버 환경에서 테스트하세요.

## 다음 단계

Fumika 엔진의 기본 사용법과 배포 과정까지 모두 살펴보았습니다.  
마지막으로 엔진이 제공하는 기능을 넘어 자신만의 명령어를 만드는 방법을 다룹니다.

* **[11. 커스텀 모듈: 엔진 기능 확장하기](./11-custom-modules.md)**
* **[프로젝트 설정 상세 참조](../config.md)**
