import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene({
  config,
  variables: {},
})([
  { type: 'dialogue', text: '─── 서브씬 진입 ───' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:angry', position: 'right', duration: 500 },
  { type: 'dialogue', speaker: 'fumika', text: '잠깐, 나 휴대폰 좀 볼게.' },
  { type: 'audio', action: 'pause', name: 'bgm', duration: 500 },
  { type: 'dialogue', text: '후미카는 휴대폰을 꺼내 무언가를 확인했다.' },
  { type: 'dialogue', speaker: 'fumika', text: '아... 또 빌드 실패했어.' },
  { type: 'audio', action: 'play', name: 'bgm', src: 'am223', duration: 500 },
  { type: 'character', action: 'show', name: 'fumika', position: 'center', duration: 500 },
  { type: 'dialogue', text: '─── 서브씬 종료, 복귀합니다 ───' },
])
