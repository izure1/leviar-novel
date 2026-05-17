# 9. 시각 효과: 화면 흔들림과 필터

이 페이지에서는 화면 전체를 조작하는 시각 효과를 적용하는 방법을 다룹니다.  
텍스트 출력만으로는 표현하기 힘든 충격이나 주변 환경의 변화를 구현할 수 있습니다.

## 동기

단순히 캐릭터의 표정과 대사만 바꾸는 것으로는 갑작스러운 상황 변화를 온전히 표현하기 어렵습니다.  
무언가 터지거나 부서지는 상황에서 대화 창만 업데이트되면 상황의 심각성이 잘 전달되지 않죠.

```typescript
// ❌ 정적인 화면 처리
export default defineScene({ config })(() => [
  { type: 'character', name: 'fumika', image: 'normal:angry' },
  { 
    type: 'dialogue', 
    text: '내 주말이 날아갔다고?!' 
  }
])
```

이럴 때 `camera-effect`나 화면 필터를 사용하면 변화를 확실히 보여줄 수 있습니다.  
직접 화면을 조작하는 명령어들을 하나씩 살펴보겠습니다.

## 기본 사용법

화면을 흔드는 `shake` 효과는 `camera-effect` 명령어로 사용합니다.  
특정 시간 동안 화면 전체가 지정된 강도로 진동합니다.

```typescript
// ✅ 카메라 흔들림 효과
export default defineScene({ config })(() => [
  // 0.4초간 흔듭니다 (Non-blocking이므로 곧바로 다음 줄 실행)
  { 
    type: 'camera-effect', 
    preset: 'shake', 
    intensity: 15, 
    duration: 400 
  },
  { 
    type: 'dialogue', 
    text: '노트북을 부술 듯이 노려봅니다.' 
  }
])
```

`intensity` 값이 커질수록 화면이 흔들리는 폭이 넓어집니다.  
강한 진동이 필요하다면 이 값을 높여 보세요.

> [!TIP]
> 흔들림 효과와 효과음(`SE`)을 동시에 재생해 보세요.  
> 충돌이나 파괴 같은 이벤트를 훨씬 자연스럽게 표현할 수 있습니다.

## 점진적 심화

진동 외에도 화면 전체의 색상을 덮거나 순간적으로 번쩍이는 효과를 줄 수 있습니다.  
상황에 맞게 `screen-flash`와 `mood` 명령어를 활용해 봅시다.

### 1. 화면 섬광 효과

`screen-flash`는 화면 전체를 특정 색상으로 순간적으로 채웠다가 사라지게 만듭니다.  
번개나 플래시 같은 시각적 자극을 줄 때 적합합니다.

```typescript
// ✅ 화면 섬광 적용
export default defineScene({ config })(() => [
  { 
    type: 'dialogue', 
    text: '해결책이 번개처럼 당신의 뇌리를 스쳐 지나갔습니다!' 
  },

  // 0.1초간 번쩍입니다
  { type: 'screen-flash', preset: 'white', duration: 100 }
])
```

> [!WARNING]
> 너무 자주 화면을 번쩍이게 만들면 사용자가 피로감을 느낄 수 있습니다.  
> 꼭 필요한 순간에만 제한적으로 사용해 주세요.

### 2. 무드 필터 적용

`mood` 명령어는 화면 전체에 필터를 씌워 색조를 바꿉니다.  
밤이 되거나 주변이 어두워지는 상황을 손쉽게 구현할 수 있죠.

```typescript
// ✅ 필터 적용을 통한 분위기 전환
export default defineScene({ config })(() => [
  { 
    type: 'dialogue', 
    text: '주변이 어둡게 가라앉기 시작했습니다.' 
  },

  // 2초간 어둡게 변경합니다
  { 
    type: 'mood', 
    mood: 'night', 
    duration: 2000 
  }
])
```

> [!NOTE]
> 필터를 제거하고 원래 화면으로 돌아가려면 `mood: 'none'`을 사용하면 됩니다.

## 다음 단계

연출에 필요한 다양한 명령어들을 모두 알아보았습니다.  
다음 장에서는 지금까지 작성한 프로젝트를 빌드하고 전역 설정을 다루는 방법을 알아봅니다.

* **[10. 프로젝트 빌드와 폴백 설정](./10-config-and-build.md)**
* **[명령어 참조: camera-effect](../modules/camera-effect.md)**
