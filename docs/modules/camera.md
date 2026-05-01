# 🎥 Camera Module

---

## 1. 개요 (Overview)

`camera` 시스템은 게임 화면의 시점을 제어하여 연출의 몰입감을 높이는 역할을 합니다. 특정 위치를 조준하는 **패닝(Pan)**, 화면을 확대하거나 축소하는 **줌(Zoom)**, 그리고 긴박한 상황을 연출하는 **이펙트(Effect)** 기능으로 구성됩니다.

### 주요 특징
* **독립적 제어**: 줌, 패닝, 이펙트가 각각 별도의 커맨드로 분리되어 있어 정교한 복합 연출이 가능합니다.
* **프리셋 시스템**: `close-up`, `wide`, `shake` 등 미리 정의된 설정을 통해 복잡한 수치 입력 없이 즉시 연출을 적용할 수 있습니다.
* **부드러운 전환**: 모든 시점 변화는 보간(Interpolation) 애니메이션을 통해 부드럽게 연결됩니다.

---

## 2. 하위 커맨드 (Sub Commands)

카메라 시스템은 다음 세 가지 핵심 커맨드로 나뉩니다.

### 2.1. 카메라 줌 (`camera-zoom`)

화면의 배율을 조정하여 특정 대상을 강조하거나 전경을 보여줍니다.

```ts
{ type: 'camera-zoom', preset: 'close-up', duration: 800 }
```
* [상세 문서 보기 (camera-zoom)](./camera-zoom.md)

### 2.2. 카메라 패닝 (`camera-pan`)

카메라의 시점을 특정 위치로 이동시킵니다.

```ts
{ type: 'camera-pan', position: 'left', duration: 1000 }
```
* [상세 문서 보기 (camera-pan)](./camera-pan.md)

### 2.3. 카메라 효과 (`camera-effect`)

화면 전체를 흔드는 등 역동적인 물리 효과를 적용합니다.

```ts
{ type: 'camera-effect', preset: 'shake', intensity: 5, repeat: 3 }
```
* [상세 문서 보기 (camera-effect)](./camera-effect.md)

---

## 3. 주의 사항 (Edge Cases)

* **상태 유지**: 줌과 패닝 상태는 별도의 명령으로 해제(`reset`)하거나 새로운 값을 설정하기 전까지 유지되며, 엔진 내부 상태에 보존됩니다.
* **좌표계**: 카메라 좌표는 캔버스의 중앙을 `(0, 0)`으로 하는 상대 좌표계를 사용합니다.
