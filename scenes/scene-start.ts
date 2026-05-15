import config from '../novel.config'
import { defineScene } from 'fumika'

export default defineScene({
  config,
  variables: {
    _isAnnoyed: false,
    _inputRepeatCount: 0,
  },
  next: {
    scene: 'scene-game',
    preserve: true,
  },
})(({ label, goto, call, condition, set }) => [
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'floor', duration: 0 },
  { type: 'mood', mood: 'day', intensity: 0.5, duration: 0 },
  { type: 'effect', action: 'add', effect: 'dust', src: 'dust', rate: 25 },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 1000 },
  { type: 'test-cmd', message: 'hello' },

  {
    type: 'dialogue',
    text: '주말 오후의 카페. 창밖으로 내리쬐는 햇살이 평화롭다.'
  },
  { type: 'audio', action: 'play', name: 'bgm', src: 'am223', repeat: true, duration: 3000, volume: 0.1 },
  {
    type: 'dialogue',
    text: '향긋한 커피 향과 사람들의 웅성거림 사이로...'
  },
  {
    type: 'dialogue',
    text: '구석 자리에서 유독 이질적인 살기가 느껴졌다.'
  },
  {
    type: 'dialogue',
    text: '그곳에는 마치 세상 모든 짐을 짊어진 듯한 표정의 소녀가 있었다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', position: 'center', focus: 'face', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '아... 인생 진짜 로그아웃하고 싶다.'
  },
  {
    type: 'dialogue',
    text: '소녀는 금방이라도 모니터를 부술 듯한 기세였다.'
  },
  {
    type: 'dialogue',
    text: '그녀는 앞에 놓인 노트북을 죽일 듯이 노려보고 있었다.'
  },
  {
    type: 'dialogue',
    text: '내가 힐끔 쳐다보자, 살벌한 눈빛과 딱 마주쳤다.'
  },
  { type: 'camera-zoom', preset: 'close-up' },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '혹시 내 얼굴에 "나 오늘 갓생 살 거다"라고 쓰여있어?'
  },
  {
    type: 'dialogue',
    text: '초면에 다짜고짜 시비다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '왜 하필 내 앞에서 그렇게 해맑게 커피를 마시는 거야?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '자비 좀 베풀어줘.'
  },
  { type: 'character-focus', name: 'fumika', point: 'face', zoom: 'reset' },

  {
    type: 'choice',
    choices: [
      {
        text: '"무슨 일 하세요?"라고 묻는다',
        goto: 'ask-job',
      },
      {
        text: '"노트북에 버그 났나요?"라고 묻는다',
        goto: 'ask-bug',
        var: ({ likeability }) => ({ likeability: likeability - 10 })
      },
      {
        text: '조용히 자리를 피한다',
        goto: 'escape',
        var: ({ likeability }) => ({ likeability: likeability + 10 })
      },
    ]
  },

  // ─── 분기: 일 질문 ───
  label('ask-job'),
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '일? 하, 비즈니스 토크 금지야. 지금 내 두뇌는 404 Error 상태라고.'
  },
  {
    type: 'dialogue',
    text: '대체 무슨 일을 하길래 상태 코드를 입에 달고 사는 걸까.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '그냥... 세상의 모든 코드를 삭제하고 평화로운 자연인으로 살고 싶을 뿐이야.'
  },
  {
    type: 'dialogue',
    text: '확실히 제정신은 아닌 것 같다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:smile', duration: 500 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '근데 너 커피 맛있어 보인다. 한 입만?'
  },
  {
    type: 'dialogue',
    text: '내 커피잔을 향해 손을 뻗는 폼이 심상치 않다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '농담임.'
  },
  goto('common-end'),

  // ─── 분기: 버그 질문 ───
  label('ask-bug'),
  { type: 'camera-effect', preset: 'shake', duration: 400 },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '버그?! 너, 지금 금기어 썼어.'
  },
  {
    type: 'dialogue',
    text: '발작 스위치를 누른 모양이다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '내 인생 자체가 거대한 버그인데 무슨 소릴 하는 거야?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '세미콜론 하나 때문에 내 주말이 통째로 날아갔다고! 이건 인권 침해야!'
  },
  {
    type: 'dialogue',
    text: '그녀는 허공에 대고 주먹질을 해댔다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '...근데 너 개발자야? 아니면 그냥 훈수 두는 하청 업자야?'
  },
  {
    type: 'dialogue',
    text: '의심스러운 눈초리로 위아래를 훑어본다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '말투가 딱 트위치 채팅창인데.'
  },
  goto('common-end'),

  // ─── 분기: 도망 ───
  label('escape'),
  {
    type: 'dialogue',
    text: '똥이 무서워서 피하나. 나는 슬그머니 자리에서 일어났다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:angry', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '어? 어딜 도망가?'
  },
  {
    type: 'dialogue',
    text: '번개같이 손목을 붙잡혔다. 악력이 장난이 아니다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '지금 내 기분이 떡락 중인데 관객도 없이 혼자 화나 있으라고?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '너, 앉아.'
  },
  {
    type: 'dialogue',
    text: '나는 얌전히 다시 자리에 앉았다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '방금 나랑 눈 마주쳤으니까 이제 우린 구독과 좋아요 관계야. 도망 못 가.'
  },
  goto('common-end'),

  // ─── 공통 엔딩 ───
  label('common-end'),
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:normal', duration: 800 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '하... 모르겠다. 갓생은 내일부터 살지 뭐.'
  },
  {
    type: 'dialogue',
    text: '그녀는 미련 없이 노트북 화면을 절전 모드로 돌렸다.'
  },
  {
    type: 'dialogue',
    text: '잠시 후 그녀가 고개를 들며 나를 쳐다보았다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '어이, 너 이름이 뭐야?'
  },
  {
    type: 'dialogue',
    text: [
      '그녀가 내 이름을 물어보았다.',
      '확실히 그녀의 이름은 후미카였지...',
      '내 이름은...'
    ]
  },

  // 입력
  label('input-username'),
  {
    type: 'input',
    to: 'username',
    label: '당신의 이름을 입력하세요',
    multiline: false,
    buttons: [
      { text: '저장' },
      { text: '취소', cancel: true },
    ],
  },
  {
    type: 'dialogue',
    text: [
      '"내 이름은 {{ username }}이야."',
      '나는 그녀에게 대답했다.',
    ]
  },

  // 빈 이름일 때 반복 분기로
  condition(
    ({ username }) => (username as string).replaceAll(' ', '') === '',
    [
      // ─── 분기: 빈 이름 ───
      set('_inputRepeatCount', ({ _inputRepeatCount }) => _inputRepeatCount + 1),
      set('likeability', ({ likeability }) => likeability - 5),
      {
        type: 'dialogue',
        text: '후미카의 표정이 썩어들어간다.'
      },
      condition(
        ({ _inputRepeatCount }) => _inputRepeatCount >= 3,
        [
          {
            type: 'dialogue',
            speaker: 'fumika',
            text: '죽고 싶어?'
          },
          {
            type: 'dialogue',
            text: [
              '"죄송합니다."',
              '역시 3번이나 놀리는 건 안되나보다.',
              '난 대충 둘러댔다.',
            ]
          },
          goto('choice-game'),
        ]
      ),
      {
        type: 'dialogue',
        speaker: 'fumika',
        text: [
          '이름이 공백인 건, "둘이 합쳐서 『  』" 뭐 그런 드립을 치려는거야?',
          '한참 지난 애니메이션드립인건 알지?',
          '아니면.. 입력하는 법을 모르는 거야?',
        ]
      },
      {
        type: 'dialogue',
        text: [
          '입력하는 법을 모르냐니, 대체 무슨 소리를 하는걸까?',
          '게임인 줄 아나보네.',
          '아무튼 이름을 입력해야 한다.'
        ]
      },
      goto('input-username'),
    ], [
    // 이름이 후미카일 경우 특수 분기로
    condition(
      ({ username }) => username === '후미카',
      [
        {
          type: 'dialogue',
          text: [
            '그녀는 잠시 나를 쳐다보았고',
            '잠시 후 이상한 표정으로 물어보았다.'
          ]
        },
        {
          type: 'dialogue',
          speaker: 'fumika',
          text: '장난치는게 아니고?'
        },
        {
          type: 'dialogue',
          text: [
            '아무래도 이름이 같으니 의심스러운 눈초리를 거둘 수 없다.',
            '나는 학생증을 꺼내 보여주었다.'
          ]
        },
        {
          type: 'overlay-image',
          action: 'show',
          name: 'id_card',
          src: 'img_card_heroine',
        },
        {
          type: 'dialogue',
          text: '그녀는 내 학생증을 보고 어리둥절한 표정을 지었다.'
        },
        {
          type: 'dialogue',
          speaker: 'fumika',
          text: '진짜 이름이 나랑 같네.'
        },

        set('likeability', ({ likeability }) => likeability + 30),

        {
          type: 'dialogue',
          text: '확실히 신기한 우연이다.'
        },
        {
          type: 'overlay-effect',
          name: 'id_card',
          preset: 'fall'
        },
        {
          type: 'overlay-image',
          action: 'hide',
          name: 'id_card',
        },
      ]
    )
  ]),

  // ─── 공통 분기: 전화 수신 ───
  label('choice-game'),
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '너, 나랑 게임이나 한 판 때릴래?'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '요즘 유행하는 그 똥겜 있어. 버그 덩어리인 거.'
  },
  {
    type: 'dialogue',
    text: '방금 전까지 버그 때문에 화내지 않았나?'
  },
  {
    type: 'dialogue',
    text: '내가 어이없다는 표정을 짓고 있을 때, 갑자기 경쾌한 벨소리가 울렸다.'
  },
  { type: 'character', action: 'show', name: 'fumika', image: 'normal:embarrassed', duration: 300 },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '어? 잠깐만. 지금 몇 시야?'
  },
  {
    type: 'dialogue',
    text: '후미카는 허겁지겁 스마트폰을 꺼내 들었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '미친, 벌써 성적 공지 떴을 시간이잖아. 나 잠깐 폰 좀 볼게. 절대 말 걸지 마.'
  },
  call('scene-sub', { preserve: true, restore: true }),
  {
    type: 'dialogue',
    text: '잠시 후, 스마트폰을 내려놓는 그녀의 눈동자에는 초점이 없었다.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '미안... 나 오늘 좀 혼자 있고 싶어.'
  },
  {
    type: 'dialogue',
    speaker: 'fumika',
    text: '교수님... 분명히 출석 다 채우고 과제도 냈는데 어떻게 C+을...'
  },
  {
    type: 'dialogue',
    text: '그녀는 대답도 듣지 않고 노트북을 조용히 닫았다.'
  },
  {
    type: 'dialogue',
    text: '그리고 가방에서 몬스터 에너지 드링크를 꺼내 원샷을 때린 후, 터덜터덜 카페를 나섰다.'
  },
  {
    type: 'dialogue',
    text: '이것이 나와 후미카의 안타까운 첫 만남이었다.'
  },
  { type: 'screen-wipe', dir: 'out', preset: 'left', duration: 3000, disable: true },
])
