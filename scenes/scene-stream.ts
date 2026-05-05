import config from '../novel.config'
import { defineScene } from '../../src'
import { commonInitial } from './common-initial'

export default defineScene({
  config,
  initial: commonInitial,
  next: 'scene-outside',
})(({ label, goto }) => [
  {
    type: 'mood',
    mood: 'night',
    action: 'remove',
    duration: 3000,
  },
  {
    type: 'mood',
    mood: 'dawn',
    action: 'add',
    duration: 3000,
    disable: true,
  },
  {
    type: 'dialogue',
    text: [
      '어둑한 침실 문틈 사이로 불빛이 새어 나오고 있었다.',
      '나는 소파에 편하게 기대어 누워있었다.',
      '배달 음식을 기다리며 유튜브를 보던 후미카가 갑자기 마이크 선을 건드렸다.',
      '그녀의 손가락이 의도치 않게 카메라 전원 버튼을 스치고 지나갔다.'
    ]
  },
  { type: 'camera-effect', preset: 'shake', duration: 500 },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '앗, 잠깐!'
  },
  {
    type: 'dialogue',
    text: '후미카의 손놀림이 다급해졌다. 마우스를 마구 클릭하는 소리가 방 안을 채운다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '이거 방송 켜진 거 아니야?!'
  },
  {
    type: 'dialogue',
    text: '방송 프로그램 화면에 빨간 불이 들어온 것을 확인하자, 그녀의 동공이 지진을 일으켰다.'
  },
  {
    type: 'dialogue',
    text: '놀랍게도, 그 당황함은 단 1초 만에 흔적도 없이 사라졌다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '하이룽~ 트수들!'
  },
  {
    type: 'dialogue',
    text: '목소리 톤이 두 옥타브는 족히 올라갔다. 평소의 걸걸한 목소리는 온데간데없다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '방송 안 켠다고 해놓고 실수로 켜버렸다!'
  },
  {
    type: 'dialogue',
    text: '1초 만에 텐션이 180도 바뀌었다. 인터넷 방송인의 직업병인가.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: [
      '<style color="rgb(150,150,150)">[ 앗 기습 뱅온 ㄷㄷ ]</style>',
      '<style color="rgb(150,150,150)">[ 오늘 휴방이라며! 휴방이라며! ]</style>',
      '<style color="rgb(150,150,150)">[ 헐레벌떡 들어왔습니다 후미카님 ]</style>',
    ],
    speed: 10,
  },
  {
    type: 'dialogue',
    text: '화면 옆에 띄워진 채팅창이 순식간에 시청자들의 반응으로 가득 찼다.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: '<style color="rgb(150,150,150)">[ 쌩얼 방송인가요? ]</style>',
    speed: 10,
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '아니야~ 방금 세수하고 와서 완전 쌩얼이긴 한데,'
  },
  {
    type: 'dialogue',
    text: '방금 전까지 게임에서 억까당했다며 샷건을 치던 그 인간이 맞나?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '우리 트수들 보고 싶어서 잠깐 켰지~'
  },
  {
    type: 'dialogue',
    text: '그녀는 카메라를 향해 능숙하게 손하트를 날렸다.'
  },
  {
    type: 'dialogue',
    text: '자연스럽게 내 존재는 완벽하게 투명인간 취급을 당하고 있었다.'
  },
  {
    type: 'choice',
    choices: [
      { text: '카메라 밖에서 조용히 손을 흔들어준다', goto: 'wave' },
      { text: '"야, 내 찜닭은 언제 와?" 라고 소리친다', goto: 'troll' },
    ]
  },

  label('wave'),
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '오늘 야식은 찜닭 시켰어용~'
  },
  {
    type: 'dialogue',
    text: '내 돈으로 시켜놓고 본인 야식인 것처럼 자연스럽게 포장한다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '혼자 먹기엔 좀 많지만 남으면 낼 먹어야지!'
  },
  {
    type: 'dialogue',
    text: '거짓말이 술술 나오는 꼴을 보니 가만히 있을 수가 없다.'
  },
  {
    type: 'dialogue',
    text: '나는 카메라 사각지대에서 장난스럽게 팔을 뻗었다.'
  },
  {
    type: 'dialogue',
    text: '화면 구석에 내 손가락이 1초쯤 잡혔다.'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    text: '순간, 미친 듯이 올라가던 채팅창이 일순간 얼어붙었다.'
  },
  {
    type: 'dialogue',
    text: '그리고 매서운 속도로 다시 도배되기 시작했다.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: [
      '<style color="rgb(150,150,150)">[ ??? ]</style>',
      '<style color="rgb(150,150,150)">[ 방금 남자 손 아님? ]</style>',
      '<style color="rgb(150,150,150)">[ 재미업뗘 재미업뗘 재미업뗘 재미업뗘 재미업뗘 재미업뗘 ]</style>',
      '<style color="rgb(150,150,150)">[ 유니콘 뿔 다 부러지는 소리 들리네 ]</style>',
      '<style color="rgb(150,150,150)">[ 나 까매져,,, ]</style>',
    ],
    speed: 10,
  },
  { type: 'character-effect', name: 'fumika', preset: 'shake', intensity: 30, duration: 500, repeat: -1 },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed', duration: 300 },
  {
    type: 'dialogue',
    text: '후미카의 얼굴이 사색이 되었다. 그녀는 마이크를 황급히 가렸다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '<style fontSize="14">미쳤어?! 손 치워!</style>'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '<style fontSize="14">나 육수 우려서 먹고사는 심해 방송이란 말이야!</style>'
  },
  {
    type: 'dialogue',
    text: '후미카는 다시 마이크에서 손을 떼고 억지웃음을 지었다.'
  },
  { type: 'character-effect', name: 'fumika', preset: 'reset' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '아, 여러분! 방금 그거 제 손이에요!'
  },
  {
    type: 'dialogue',
    text: '말도 안 되는 변명이다. 누가 봐도 두툼한 남자 손이었는데.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: [
      '남자 손 같죠?',
      '제가 뼈대 굵은 거 아시잖아요? 하하하!'
    ]
  },
  {
    type: 'dialogue',
    text: '어설픈 해명이 화를 불렀다.'
  },
  {
    type: 'dialogue',
    text: '채팅창은 뿔이 부러진 유니콘 대신 다른 부류의 시청자들로 폭주하기 시작했다.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: [
      '<style color="rgb(150,150,150)">[ 형님 조직으로 돌아오십쇼 ]</style>',
      '<style color="rgb(150,150,150)">[ 전완근 시발 ㅋㅋㅋ ]</style>',
      '<style color="rgb(150,150,150)">[ 오빠 나 쥬지됐어 ]</style>',
    ],
    speed: 10,
  },
  { type: 'character-effect', name: 'fumika', preset: 'shake', intensity: 30, duration: 500, repeat: -1 },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed' },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '아니야! 형 아니라고!'
  },
  {
    type: 'dialogue',
    text: '그녀가 필사적으로 항변했지만, 채팅창의 흐름은 막을 수 없었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: [
      '민방위 안 끝났냐니 선 넘네 진짜!',
      '거근...?',
      '그건 또 무슨 미친 소리야 그런 게 왜 달려있어!',
    ]
  },
  {
    type: 'dialogue',
    text: '화가 머리끝까지 난 후미카가 마침내 이성을 놓아버렸다.'
  },
  { type: 'camera-effect', preset: 'shake-y', intensity: 100, duration: 500, repeat: -1 },
  { type: 'character-effect', name: 'fumika', preset: 'reset' },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '<style fontSize="50">야, 너 때문에 채팅창 창났잖아!</style>'
  },
  {
    type: 'dialogue',
    text: '후미카가 내 멱살을 잡고 흔드는 장면까지...'
  },
  {
    type: 'dialogue',
    text: '캠 화면을 통해 고스란히 송출되고 말았다.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: [
      '<style color="rgb(150,150,150)">[ ㅋㅋㅋㅋ 피지컬 ]</style>',
      '<style color="rgb(150,150,150)">[ 멱살잡이 합방 폼 미쳤다 ]</style>',
      '<style color="rgb(150,150,150)">[ 도파민 터지네 ]</style>',
      '<style color="rgb(150,150,150)">[ 재미뗘 재미뗘 재미뗘 재미뗘 재미뗘 재미뗘 ]</style>'
    ],
    speed: 10,
  },
  { type: 'camera-effect', preset: 'reset' },
  goto('stream-end'),

  label('troll'),
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '오늘 야식은 찜닭 시켰어용~'
  },
  {
    type: 'dialogue',
    text: '방금 전까지 분노조절장애를 보이던 사람이 맞나 싶을 정도로 앙증맞은 목소리다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '외롭게 혼자 먹방 할 예정이니까 다들 끝까지 봐줘야 해?'
  },
  { type: 'camera-effect', preset: 'shake', duration: 300 },
  {
    type: 'dialogue',
    text: '뻔뻔한 멘트를 듣자마자 나도 모르게 입이 먼저 움직였다.'
  },
  {
    type: 'dialogue',
    text: '"야, 내 찜닭은 언제 와?"'
  },
  {
    type: 'dialogue',
    text: '내가 뒤에서 쩌렁쩌렁하게 외치자, 방 안의 공기가 싸늘하게 식었다.'
  },
  {
    type: 'dialogue',
    text: '그리고 1초의 정적 후, 채팅창이 순식간에 불타오르기 시작했다.'
  },
  {
    type: 'dialogue',
    speaker: 'chat',
    text: [
      '<style color="rgb(150,150,150)">[ ???????? ]</style>',
      '<style color="rgb(150,150,150)">[ 방금 남자 목소리 뭐냐 ]</style>',
      '<style color="rgb(150,150,150)">[ ㅋㅋㅋㅋ 동거남 찜닭은 중대사항이지 ]</style>',
      '<style color="rgb(150,150,150)">[ 채팅창 까매지는 거 보소 ]</style>',
      '<style color="rgb(150,150,150)">[ 뿔 다 갈려서 가루 되는 중 ]</style>',
    ],
    speed: 10,
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed', duration: 300 },
  {
    type: 'dialogue',
    text: '후미카의 얼굴에서 영업용 미소가 완전히 증발했다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '악! 야! 너 지금 뭐 하는 거야?!'
  },
  {
    type: 'dialogue',
    text: '그녀가 내 쪽을 홱 노려보며 사자후를 내질렀다.'
  },
  {
    type: 'dialogue',
    text: '하지만 이미 엎질러진 물이다. 채팅창의 폭주는 멈출 기미가 보이지 않았다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 300 },
  {
    type: 'dialogue',
    text: '후미카는 황급히 다시 억지 미소를 장착했다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '...아, 여러분. 방금 그건 제 GPT입니다.'
  },
  {
    type: 'dialogue',
    text: 'GPT가 찜닭을 찾냐.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '배달 알림 기능이 좀 리얼하죠? 땀땀...'
  },
  {
    type: 'dialogue',
    text: '아무도 믿지 않을 변명을 던지고는, 그녀가 다급하게 마우스를 쥐었다.'
  },
  goto('stream-end'),

  label('stream-end'),
  { type: 'camera-effect', preset: 'reset', duration: 500 },
  { type: 'character-effect', name: 'fumika', preset: 'reset', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '오늘 방송은 3분 만에 방종하겠습니다!!'
  },
  {
    type: 'dialogue',
    text: '다급한 인사와 함께 화면이 꺼졌다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 300 },
  {
    type: 'dialogue',
    text: '방송 종료 버튼을 누르자마자 후미카는...'
  },
  {
    type: 'dialogue',
    text: '다시 영혼 없는, 텅 빈 눈동자로 돌아왔다.'
  },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 1500 },
])
