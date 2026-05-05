import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene({
  config,
  variables: {},
  initial: {
    dialogue: {
      bg: { color: 'rgba(0, 0, 50, 0.8)' } // 서브씬 진입 시 대화창 배경색을 푸른색으로 변경하여 연출
    }
  }
})(({}) => [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 300 },
  { type: 'audio', action: 'pause', name: 'bgm', duration: 500 },
  { type: 'dialogue', text: '후미카는 숨을 죽인 채 학교 포털 사이트에 접속했다.' },
  { type: 'dialogue', speaker: 'fumika', text: '제발... 전공 필수 제발...' },
  { type: 'camera-effect', preset: 'shake', duration: 150 },
  { type: 'dialogue', text: '로딩 창이 빙글빙글 돌 때마다 그녀의 다리도 초조하게 떨렸다.' },
  { type: 'dialogue', speaker: 'fumika', text: '...어?' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed', duration: 300 },
  { type: 'dialogue', speaker: 'fumika', text: '내가... C+?' },
  { type: 'dialogue', text: '후미카의 영혼이 빠져나가는 소리가 들리는 듯했다.' },
  { type: 'dialogue', text: '스마트폰 화면이 꺼지며, 그녀의 어깨도 함께 축 처졌다.' },
  { type: 'dialogue', speaker: 'fumika', text: '내 장학금이...' },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 500, disable: true },
])
