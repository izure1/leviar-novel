# 13. 세이브와 로드: 진행 상황 보존

이 페이지에서는 튜토리얼의 마지막 단계로, `novel.save()`와 `novel.loadSave()`를 사용하여 실제 게임의 세이브 및 로드 기능을 구현하는 방법을 다룹니다.  
이 기능을 통해 플레이어가 원할 때 언제든 진행 상황을 저장하고 나중에 다시 이어서 할 수 있도록 만들 수 있습니다.

## 기본 사용법

엔진의 `novel` 인스턴스는 현재 화면의 배경, 캐릭터, 오디오, 그리고 모든 변수를 직렬화(Serialize)하여 반환하는 `save()` 메서드를 제공합니다.  
걱정하지 마세요. 복잡한 직렬화 과정은 엔진이 모두 알아서 처리해 줍니다.  
가장 단순한 형태의 세이브/로드 버튼을 직접 구현해 보기만 하면 됩니다.

```typescript
// ✅ 이렇게 하세요
export default defineScene({ 
  config, 
  actions: {
    // 세이브 버튼 전용 동작
    save: (element, ctx) => {
      element.on('click', () => {
        const saveData = ctx.novel.save()
        localStorage.setItem('slot_1', JSON.stringify(saveData))
      })
    },
    // 로드 버튼 전용 동작
    load: (element, ctx) => {
      element.on('click', () => {
        const rawData = localStorage.getItem('slot_1')
        if (rawData) {
          try {
            const saveData = JSON.parse(rawData)
            ctx.novel.loadSave(saveData)
          } catch (e) {
            console.error('세이브 데이터가 손상되었습니다.', e)
          }
        }
      })
    }
  } 
})(() => [
  { type: 'element', action: 'show', id: 'btn_save', kind: 'text', text: '저장', behaviors: ['save'] },
  { type: 'element', action: 'show', id: 'btn_load', kind: 'text', text: '불러오기', behaviors: ['load'] }
])
```

> [!TIP]
> `novel.save()`는 엔진 내부의 상태만 스냅샷으로 만듭니다.  
> 만들어진 데이터를 `localStorage`나 서버의 DB 등 원하는 곳에 실제로 저장하는 것은 온전히 개발자의 몫입니다.

## 점진적 심화

실제 게임에서는 세이브 데이터를 저장할 때, 세이브 화면에 표시할 썸네일 이미지나 현재 시간 등의 메타데이터가 필요하겠죠?  
`captureRenderer()`를 사용해 현재 화면을 즉시 캡처하여 메타데이터와 함께 묶어서 저장할 수 있습니다.

```typescript
// ✅ 이렇게 하세요
export default defineScene({ 
  config, 
  actions: {
    saveSlot: (element, ctx) => {
      element.on('click', () => {
        // 1. 엔진 상태 직렬화
        const saveData = ctx.novel.save()
        
        // 2. 화면 썸네일 캡처 (Base64 문자열)
        // 엔진의 container 내부에 있는 canvas 요소에서 이미지를 추출합니다.
        const canvas = ctx.novel.container.querySelector('canvas')
        const thumbnail = canvas?.toDataURL('image/jpeg', 0.5)
        
        // 3. 커스텀 메타데이터와 결합하여 객체 생성
        const slotData = {
          date: new Date().toLocaleString(),
          thumbnail: thumbnail,
          core: saveData
        }
        
        localStorage.setItem('slot_1', JSON.stringify(slotData))
      })
    }
  }
})(() => [
  { type: 'element', action: 'show', id: 'btn_save_slot', kind: 'rect', behaviors: ['saveSlot'] }
])
```

> [!WARNING]
> 콜스택(`call`) 내부에서 서브 씬을 실행 중일 때 저장하면, 부모 씬의 지역 변수들까지 모두 포함하여 직렬화됩니다.  
> 세이브 데이터의 크기가 다소 커질 수 있으므로, 브라우저의 `localStorage` 용량 한계(약 5MB)를 초과하지 않도록 주의해 주세요.

## 튜토리얼을 마치며

축하합니다! 이 문서를 끝으로 Fumika 엔진의 모든 핵심 가이드를 마쳤습니다.  
이제 직접 코드를 작성하며 멋진 작품을 만들어 보세요.

* **[전체 명령어 인덱스](../commands.md)**
* **[커스텀 모듈 레퍼런스](../modules.md)**
