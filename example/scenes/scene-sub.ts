import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene({
  config,
  variables: {},
  // 서브씬의 initial: preserve=true일 때 호출자 씬의 상태(preservedState) 위에 덮어씌워집니다.
  initial: {
    dialogue: {
      bg: { color: 'rgba(50, 0, 0, 0.8)' } // 서브씬 진입 시 대화창 배경색을 붉은색으로 변경
    }
  }
})([
  { type: 'dialogue', text: '─── 서브씬 진입 ───' },
  { type: 'dialogue', text: '현재 preserve: true 로 서브씬에 진입했습니다.\n서브씬의 initial 설정으로 인해 대화창 배경이 붉은색으로 덮어씌워졌습니다.' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:angry', position: 'right', duration: 500 },
  { type: 'dialogue', speaker: 'fumika', text: '잠깐, 나 휴대폰 좀 볼게.' },
  { type: 'audio', action: 'pause', name: 'bgm', duration: 500 },
  { type: 'background', name: 'room', duration: 500 },
  { type: 'dialogue', text: '후미카는 휴대폰을 꺼내 무언가를 확인했다.\n(서브씬 내에서 배경이 바뀌고 BGM이 일시정지되었습니다)' },
  { type: 'dialogue', speaker: 'fumika', text: '아... 또 빌드 실패했어.' },
  { type: 'dialogue', text: '─── 서브씬 종료, 복귀합니다 ───\n(restore: true 이므로 호출자의 원래 렌더링, 오디오, 상태로 완전 복원됩니다)' },
])
