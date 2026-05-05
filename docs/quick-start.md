# 🚀 Quick Start Guide

**Fumika** 엔진을 사용하여 첫 번째 비주얼 노벨 프로젝트를 시작하시는 것을 진심으로 환영합니다.  
본 문서는 엔진을 신속하게 설치하고 최소한의 구동 환경을 구축하는 방법을 정중히 안내해 드립니다.  

---

## 1. 패키지 설치 및 초기화 (Installation) <a id="installation"></a>

엔진은 표준 npm 패키지 매니저를 통해 간편하게 설치하실 수 있습니다.  
적절한 개발 디렉토리 내에서 아래의 명령어를 실행하여 라이브러리를 확보해 주십시오.  

```bash
npm install fumika
```

---

## 2. 프로젝트 설정 작성 (Configuration) <a id="configuration"></a>

엔진의 모든 시스템 동작은 `novel.config.ts` 설정 파일을 중심으로 수행됩니다.  
프로젝트 루트 디렉토리에 다음과 같이 기초적인 환경 설정을 정의해 주십시오.  

```typescript
import { defineNovelConfig } from 'fumika';

export default defineNovelConfig({
  width: 1280,
  height: 720,
  // 게임 내에서 실시간으로 조작될 전역 변수들을 정의합니다.  
  variables: {
    playerName: '여행자'
  },
  // 시나리오에서 참조할 에셋 식별자와 실제 경로를 매핑합니다.  
  assets: {
    'bg-school': './assets/bg_school.jpg'
  }
});
```

---

## 3. 시나리오 스크립트 작성 (Scripting) <a id="scripting"></a>

`defineScene` 헬퍼 함수를 활용하여 게임의 구체적인 연출 흐름을 설계합니다.  

```typescript
import { defineScene } from 'fumika';
import config from './novel.config';

export default defineScene({ config })(() => [
  // 배경 이미지를 화면에 노출합니다.  
  { type: 'background', name: 'bg-school' },
  
  // 대사창을 통해 텍스트 메시지를 플레이어에게 전달합니다.  
  { type: 'dialogue', text: 'Fumika 엔진의 세계에 오신 것을 진심으로 환영합니다!' }
]);
```

---

## 4. 엔진 인스턴스 구동 및 마운트 (Bootstrapping) <a id="bootstrapping"></a>

최종적으로 `Novel` 인스턴스를 생성하고 시나리오의 첫 번째 장면을 실행합니다.  

```typescript
import { Novel } from 'fumika';
import config from './novel.config';
import sceneStart from './scene-start';

const novel = new Novel(config, {
  // 엔진이 렌더링될 DOM 요소를 지정합니다.  
  element: document.getElementById('app') as HTMLElement,
  // 프로젝트에서 사용할 씬 목록을 등록합니다.  
  scenes: { 'scene-start': () => sceneStart }
});

// 라이프사이클 절차에 따라 에셋 로드 완료 후 게임을 개시합니다.  
await novel.load(); // 모든 리소스를 비동기적으로 프리로딩합니다.  
await novel.boot(); // 시스템 모듈을 초기화합니다.  
novel.start('scene-start'); // 지정된 씬부터 시나리오를 시작합니다.  
```

---

## 🔍 후속 학습 안내

축하드립니다! 이제 기본적인 구동 환경 구축이 완료되었습니다.  
엔진의 더욱 깊이 있는 고급 기능들을 탐구하시려면 아래의 상세 가이드를 참조해 주시기 바랍니다.  

*   **[📖 활용 가이드 (Tutorial)](./tutorial.md)**: 단계별 학습을 통해 풍부한 연출 기법을 습득하실 수 있습니다.  
*   **[💡 엔진 아키텍처 개요 (Concepts)](./concepts.md)**: MVC 패턴과 변수 시스템의 핵심 작동 원리를 안내합니다.  
*   **[📜 명령어 참조 인덱스 (Commands)](./commands.md)**: 모든 내장 명령어의 상세 명세를 확인하실 수 있습니다.  

귀하의 창의적인 프로젝트가 순조롭게 진행되기를 진심으로 기원하겠습니다.  
