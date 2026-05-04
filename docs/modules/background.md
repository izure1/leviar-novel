# 🖼️ Background Module

본 문서는 `background` 모듈을 사용하여 게임의 무대가 되는 배경을 관리하고 연출하는 방법을 기술합니다.  

---

## 1. 개요 (Overview)

`background` 모듈은 게임의 배경 이미지를 관리하는 핵심 구성 요소입니다.  
단순한 이미지 출력 외에도 비디오 배경, 화면 맞춤(Fit), 카메라와 연동된 패럴랙스(Parallax) 효과 등 고품질 배경 연출 기능을 제공합니다.  

### 주요 특징
*   **다양한 미디어 지원**: 정지 이미지뿐만 아니라 MP4 등 비디오 에셋을 모두 배경으로 활용할 수 있습니다.  
*   **지능형 레이아웃**: `cover`, `contain` 등 웹 표준에 맞춘 화면 맞춤 옵션을 통해 다양한 해상도에 대응합니다.  
*   **패럴랙스 연동**: 월드 공간의 깊이(Z-depth)를 활용하여 카메라 이동 시 입체적인 공간감을 부여합니다.  

---

## 2. 배경 설정 (Configuration)

### 2.1. 사전 준비

배경 에셋을 `assets` 섹션에 등록한 뒤, `backgrounds` 속성에서 세부 설정을 진행할 수 있습니다.  

```ts
import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  assets: {
    'img_classroom': 'assets/bg/classroom.jpg',
    'vid_opening': 'assets/video/opening.mp4'
  },
  backgrounds: {
    'classroom': { src: 'img_classroom', parallax: true },
    'opening': { src: 'vid_opening' }
  }
})
```

### 2.2. 속성 상세 참조 (BgDef)

| 속성 | 타입 | 기본값 | 설명 |
| :--- | :--- | :---: | :--- |
| `src` | `string` | - | **에셋 키**: `assets` 섹션에 등록된 키를 지정합니다. |
| `parallax` | `boolean` | `true` | 활성화 시 카메라 이동에 따른 원근감이 적용됩니다. |

---

## 3. 커맨드 상세 (Command Reference)

### Background 명령 (`BackgroundCmd`)

| 속성 | 타입 | 필수 | 기본값 | 설명 |
| :--- | :--- | :---: | :---: | :--- |
| `type` | `'background'` | ✅ | - | 커맨드 타입을 명시합니다. |
| `name` | `string` | ✅ | - | 등록된 배경 에셋의 키입니다. |
| `fit` | `string` | - | `'cover'` | 화면 맞춤 방식입니다. (`cover`, `contain`, `stretch`) |
| `duration` | `number` | - | `1000` | 전환(Fade) 지속 시간(ms)입니다. |
| `isVideo` | `boolean` | - | `false` | 대상 에셋이 비디오인 경우 `true`로 설정하십시오. |

### 활용 예시

```ts
// 1. 기본 배경 전환 (1초 페이드)
{ type: 'background', name: 'classroom', duration: 1000 }

// 2. 비디오 배경 재생
{ type: 'background', name: 'opening', isVideo: true, fit: 'cover' }
```

---

## 4. 주의 사항 (Edge Cases)

*   **패럴랙스 설정**: 특정 배경에서 카메라 이동에 따른 원근 효과를 제어하고 싶다면 `parallax` 속성을 조정하십시오.  이 기능을 끄면 배경은 카메라와 동일하게 움직입니다.  
*   **비디오 재생 정책**: 브라우저 보안 정책상 소리가 포함된 비디오는 사용자의 첫 클릭 이전에 재생이 제한될 수 있습니다.  가급적 배경 비디오는 무음 처리를 권장합니다.  
*   **상태 자동 보존**: `background` 커맨드를 통해 변경된 배경 정보는 엔진의 영속성 시스템에 의해 세이브 데이터로 안전하게 관리됩니다.  
