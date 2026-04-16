import { World } from '../../src'
import { Visualnovel } from '../../helpers/Visualnovel'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const world = new World({ canvas })

// 테스트용 에셋을 먼저 로드합니다 (실제 이미지 경로 대신 로고 등을 돌려씁니다)
await world.loader.load({
  'girl_before': '../asset/image/transition_before.png',
  'girl_after': '../asset/image/transition_after.png',
  'bg_library': '../asset/image/bg_library.png',
  'bg_floor': '../asset/image/bg_floor.png',
  'bg_park': '../asset/image/bg_park.png',
  'dust': '../asset/image/star.png',
  'sakura': '../asset/image/sakura.png',
  'rain': '../asset/image/rain.png',
  'snow': '../asset/image/snow.png',
  'fog': '../asset/image/fog.png',
})

// =============================================================
// 빌더 패턴으로 Visualnovel 인스턴스 생성 + 타입 추론
// =============================================================
const vn = Visualnovel.create()
  .defineCharacter({
    heroine: {
      normal: {
        src: 'girl_before',
        width: 400,
        points: {
          face: { x: 0.5, y: 0.15 },
          chest: { x: 0.5, y: 0.35 },
          legs: { x: 0.5, y: 0.8 }
        }
      },
      after: {
        src: 'girl_after',
        width: 400,
        points: {
          face: { x: 0.5, y: 0.15 },
          chest: { x: 0.5, y: 0.35 },
          legs: { x: 0.5, y: 0.8 }
        }
      }
    }
  })
  .defineBackground({
    library: { src: 'bg_library', parallax: true }, // 패럴럭스 O
    floor: { src: 'bg_floor', parallax: false },  // 패럴럭스 X (카메라 고정),
    park: { src: 'bg_park', parallax: true },  // 패럴럭스 O
  })
  .defineUI({
    dialogueBox: {
      type: 'rectangle',
      make: {
        style: {
          width: 800,
          height: 200,
          color: 'rgba(0, 0, 0, 0)',
          gradientType: 'linear',
          gradient: '180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 102, 255, 0.75) 100%'
        },
        transform: {
          position: { y: 250 }
        }
      }
    }
  })
  .build(world, {
    width: canvas.width,
    height: canvas.height,
    depth: 500
  })

console.log(vn)

// 초기 오버레이
vn.addOverlay("클릭 또는 엔터로 진행 (step 1~17)", 'caption')

let step = 0
let isWiping = false

function nextStep() {
  if (isWiping) return
  step++

  switch (step) {
    // ---- 1. 기본 씬: 배경 + 무드 + 파티클 + 캐릭터 3명 균등 배치 ----
    case 1:
      vn.clear()
      vn.setBackground('library', 'cover', 1000)
      vn.setMood('day', 0.5)
      // 분수 위치: 3명 배치 (1/3=좌, 2/3=중앙, 3/3=우)
      vn.showCharacter('heroine', '1/3', 'normal')   // 정의된 캐릭터 키 + 이미지 키 모두 타입 추론
      // 미정의 → 문자열을 src로 사용 (타입 미추론)
      vn.addEffect('dust', 15)
      vn.addOverlay("테스트: 배경·무드·파티클·캐릭터 배치 (분수 위치 '1/3')", 'caption')
      vn.screenFade('in', 'white', 1000)
      break

    // ---- 2. focusCharacter — defineCharacter의 focusPoint(얼굴) 기준 ----
    case 2:
      vn.clearOverlay()
      vn.addOverlay("테스트: focusCharacter — 얼굴 포커스 (defineCharacter focusPoint 적용)", 'caption')
      vn.focusCharacter('heroine', 'face', 'close-up', 800)
      break

    // ---- 3. focusCharacter — 가슴 부위 오버라이드 ----
    case 3:
      vn.clearOverlay()
      vn.addOverlay("테스트: focusCharacter — 가슴 포커스 (런타임 오버라이드)", 'caption')
      vn.focusCharacter('heroine', 'chest', 'close-up', 800)
      break

    // ---- 4. focusCharacter — 다리 포커스 ----
    case 4:
      vn.clearOverlay()
      vn.addOverlay("테스트: focusCharacter — 다리 포커스", 'caption')
      vn.focusCharacter('heroine', 'legs', 'medium', 800)
      break

    // ---- 5. 카메라 리셋 + 이미지 변경 ----
    case 5:
      vn.clearOverlay()
      vn.addOverlay("테스트: 카메라 리셋 + 이미지 변경 (showCharacter imageKey)", 'caption')
      vn.panCamera('center', 800)
      vn.zoomCamera('reset', 600)
      // 같은 키 → 위치 유지 + 이미지 교체 (after 이미지로)
      vn.showCharacter('heroine', '1/3', 'after')
      break

    // ---- 6. showCharacter 위치 이동 ----
    case 6:
      vn.clearOverlay()
      vn.addOverlay("테스트: showCharacter 위치 이동 (center로 animate)", 'caption')
      vn.focusCharacter('heroine', 'face', 'reset')
      // vn.showCharacter('heroine', 'center', 'normal')
      break

    // ---- 7. 무드 변경 + 셰이크 + 플래시 ----
    case 7:
      vn.clearOverlay()
      vn.addOverlay("테스트: 무드(night) + cameraEffect('shake', 800, 20) + screenFlash", 'caption')
      vn.setMood('night')
      vn.cameraEffect('shake', 800, 20)
      vn.screenFlash('white')
      break

    // ---- 8. 카메라 이펙트 (bounce) ----
    case 8:
      vn.clearOverlay()
      vn.addOverlay("테스트: cameraEffect('bounce') - 매개변수 적용", 'caption')
      vn.cameraEffect('bounce', 1000, 30)
      break

    // ---- 9. 카메라 이펙트 (wave) ----
    case 9:
      vn.clearOverlay()
      vn.addOverlay("테스트: cameraEffect('wave')", 'caption')
      vn.cameraEffect('wave')
      break

    // ---- 10. 카메라 이펙트 (nod) ----
    case 10:
      vn.clearOverlay()
      vn.addOverlay("테스트: cameraEffect('nod') - 끄덕", 'caption')
      vn.cameraEffect('nod')
      break

    // ---- 11. 카메라 이펙트 (shake-x) ----
    case 11:
      vn.clearOverlay()
      vn.addOverlay("테스트: cameraEffect('shake-x') - 도리도리", 'caption')
      vn.cameraEffect('shake-x')
      break

    // ---- 12. 카메라 이펙트 (fall) ----
    case 12:
      vn.clearOverlay()
      vn.addOverlay("테스트: cameraEffect('fall') - 쿵 (회전하며 쓰러짐)", 'caption')
      vn.cameraEffect('fall')
      break

    // ---- 13. highlightCharacter ----
    case 13:
      vn.clearOverlay()
      vn.addOverlay("테스트: highlightCharacter (UI계층 Cut-in 방식 앞단 렌더링)", 'caption')
      vn.panCamera('center', 800)
      vn.zoomCamera('reset')
      vn.highlightCharacter('heroine')
      break

    // ---- 14. unhighlightCharacter ----
    case 14:
      vn.clearOverlay()
      vn.addOverlay("테스트: unhighlightCharacter (원본 월드 위치로 환원)", 'caption')
      vn.unhighlightCharacter('heroine')
      break

    // ---- 15. 배경 전환 — 무패럴럭스(floor) ----
    case 15:
      vn.clearOverlay()
      vn.addEffect('sakura', 20)
      vn.addOverlay("테스트: 배경 전환 → floor (parallax: false, 카메라 고정)", 'caption')
      vn.setMood('dawn', 1, 1000)
      vn.setBackground('floor', 'cover', 1500)
      vn.focusCharacter('heroine', 'chest', 'reset')
      break

    // ---- 16. addLight + setFlicker ----
    case 16: {
      vn.clearOverlay()
      vn.setMood('day', 1, 2000)
      vn.setBackground('park', 'cover', 1500)
      vn.addOverlay("테스트: addLight(spot) + setFlicker(spot, candle)", 'caption')
      vn.removeEffect('dust')
      vn.addEffect('fireflies', 8)
      vn.addLight('spot', { style: { width: 600, height: 600 } })
      vn.setFlicker('spot', 'candle')
      break
    }

    // ---- 17. screenWipe + 씬 리셋 ----
    case 17:
      vn.clearOverlay()
      vn.addOverlay("테스트: screenWipe(out) → 씬 초기화", 'caption')
      isWiping = true
      vn.screenWipe('out', 'left', 800)
      setTimeout(() => {
        vn.clear()
        vn.addOverlay("완료! 처음부터 다시 클릭하세요.", 'title')
        vn.screenWipe('in', 'left', 800)
        isWiping = false
        step = 0
      }, 900)
      break

    default:
      step = 0
  }
}

document.addEventListener('click', nextStep)
document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') nextStep() })

world.start()
