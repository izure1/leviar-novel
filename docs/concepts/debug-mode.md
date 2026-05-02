# 🛠️ 디버그 모드 (Debug Mode)

디버그 모드는 시나리오 상에 배치된 캐릭터, 대화창, 선택지 등 모든 UI 요소의 **실제 영역(Hitbox)과 레이아웃 경계**를 시각화하여 개발자가 정확한 위치를 파악할 수 있도록 돕는 도구입니다.

---

## 1. 개요 (Overview)

비주얼 노벨 연출 과정에서 캐릭터의 미세한 위치 조정이나 대화창 내부의 패딩(Padding) 값을 설정할 때, 육안만으로는 정확한 픽셀 위치를 가늠하기 어렵습니다. 

Fumika의 디버그 모드를 활성화하면 다음과 같은 시각적 보조 도구가 화면에 나타납니다:
*   **영역 외곽선 (Outlines)**: 모든 객체의 물리적인 크기와 경계를 표시합니다.
*   **레이아웃 가이드**: 투명하거나 겹쳐진 요소들도 외곽선으로 표시되어 숨겨진 객체를 쉽게 찾을 수 있습니다.

---

## 2. 활성화 방법 (How to Enable)

디버그 모드는 `Novel` 인스턴스의 속성을 통해 실시간으로 켜고 끌 수 있습니다.

### API를 통한 직접 제어
엔진 인스턴스가 생성된 후 `debugMode` 값을 `true`로 설정합니다.

```typescript
const novel = new Novel(config, { ... })

// 디버그 모드 활성화
novel.debugMode = true
```

### 커스텀 모듈을 통한 토글 (추천)
개발 중에 특정 키를 누르거나 시나리오 도중에 디버그 모드를 토글하고 싶다면, 아래와 같이 간단한 디버그 모듈을 만들어 사용할 수 있습니다.

#### 1. 모듈 정의
```typescript
// src/modules/debug.ts
import { define } from 'fumika'

// { on: boolean } 형태의 커맨드 인자를 받도록 정의합니다.
export const debugModule = define<{ on: boolean }, { on: boolean }>({ on: false })

debugModule.defineView((ctx, state) => ({
  show: () => {},
  hide: () => {},
  onUpdate: (ctx, state) => {
    // 상태 변경 시 엔진의 debugMode를 동기화합니다.
    ctx.novel.debugMode = state.on
  }
}))

debugModule.defineCommand(function* (cmd, ctx, state, setState) {
  // 커맨드에서 전달받은 on 값으로 상태를 설정합니다.
  setState({ on: cmd.on })
  return true
})
```

#### 2. 엔진에 모듈 등록
`novel.config.ts`의 `modules` 필드에 해당 모듈을 등록합니다. 이때 사용한 키값이 시나리오에서 사용할 `type` 이름이 됩니다.

```typescript
// novel.config.ts
import { defineNovelConfig } from 'fumika'
import { debugModule } from './modules/debug'

export default defineNovelConfig({
  // ... 생략
  modules: {
    'debug': debugModule // 'debug'라는 이름으로 등록
  }
})
```

#### 3. 시나리오에서 사용
등록된 이름을 `type`으로 지정하고 `on` 속성을 통해 디버그 모드를 켜거나 끌 수 있습니다.

```typescript
// scenes/scene-intro.ts
export default defineScene({ config })([
  { type: 'background', name: 'room' },
  { type: 'debug', on: true }, // 디버그 외곽선을 켭니다.
  { type: 'character', name: 'heroine', action: 'show' },
  { type: 'dialogue', text: '지금 화면에 보이는 외곽선이 디버그 모드야.' },
  { type: 'debug', on: false }, // 디버그 모드를 끕니다.
])
```

---

## 3. 활용 사례 (Use Cases)

### 캐릭터 위치 미세 조정
캐릭터 이미지의 투명한 영역 때문에 실제 클릭 범위나 렌더링 시작점을 파악하기 힘들 때 사용합니다. 외곽선을 통해 캐릭터가 정확히 `center` 또는 지정된 좌표에 위치해 있는지 확인할 수 있습니다.

### UI 레이아웃 검증
`dialogue` 모듈이나 `input` 모듈에서 설정한 `panelPadding` 값이 의도한 대로 텍스트 영역을 감싸고 있는지 확인합니다. 대사 텍스트가 대화창 경계를 벗어나는지, 혹은 너무 좁게 배치되었는지 즉시 파악이 가능합니다.

### 레이어 간섭 확인
특정 UI가 다른 UI를 가리고 있어 클릭이 작동하지 않는 경우, 디버그 모드를 켜면 투명한 레이어가 어디까지 덮고 있는지 시각적으로 드러납니다.

---

## 💡 팁
- 디버그 모드는 성능에 큰 영향을 주지 않으므로 개발 단계에서는 상시 켜두어도 무방합니다.
- 최종 배포(Production) 시에는 반드시 `false`로 설정하거나 관련 코드를 제거하십시오.
