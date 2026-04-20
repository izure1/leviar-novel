// example/scenes/scene-intro.ts
import config from '../novel.config'
import { defineScene } from '../../src'

export default defineScene(config, {}, [
  // ─── 1. 적막한 도서관의 오후 ───
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 0 },
  { type: 'background', name: 'bg-library', duration: 0 },
  { type: 'mood', mood: 'day', intensity: 0.3, duration: 0 },
  { type: 'effect', action: 'add', effect: 'dust', src: 'dust', rate: 15, skip: true },
  { type: 'screen-fade', dir: 'in', preset: 'black', duration: 3000 },
  { type: 'test-cmd', message: 'Custom command works!' },

  {
    type: 'dialogue',
    text: [
      '오래된 종이 냄새는 언제나 마음을 차분하게 만든다.',
      '낡은 가죽 표지가 풍기는 쿰쿰한 향기, 그리고 정적.',
      '학교 도서관의 가장 깊숙한 곳은 나의 유일한 안식처였다.',
      '사람들의 발길이 닿지 않는 서가 구석에는 시간이 느리게 흐른다.',
      '나는 습관처럼 손가락을 책등 위에 올리고 천천히 훑어 내려갔다.',
      '거칠거칠한 질감이 손끝바닥을 타고 전해져 온다.',
      '오늘따라 햇살이 유난히도 깊숙이 서가 사이로 스며들고 있었다.',
      '공중에 떠다니는 먼지 입자들이 빛을 받아 보석처럼 반짝였다.',
      '나는 그 조용한 춤사위를 멍하니 바라보았다.',
      '아무도 없는 도서관. 오직 나만이 이 세계의 유일한 관찰자였다.',
      '하지만... 그 생각은 곧 깨지고 말았다.'
    ]
  },

  // ─── 2. 예기치 못한 조우 ───
  { type: 'camera-pan', position: '1/10', duration: 2500 },
  { type: 'dialogue', text: '서가 너머, 창가 자리에 누군가 앉아 있었다.' },

  { type: 'character', action: 'show', name: '아리시에로', position: 'right', image: 'normal', duration: 1500, focus: 'face', skip: true },
  {
    type: 'dialogue',
    text: [
      '하얀 셔츠 위로 쏟아지는 노란 햇살.',
      '그녀는 마치 그림 속에서 막 걸어 나온 것만 같은 비현실적인 분위기를 풍겼다.'
    ]
  },
  { type: 'camera-zoom', preset: 'close-up', duration: 1200 },
  {
    type: 'dialogue',
    text: [
      '그녀가 들고 있는 책의 제목을 확인하려 눈을 가늘게 떴다.',
      '그것은 내가 지난주부터 찾고 있었던 절판된 소설이었다.'
    ]
  },
  { type: 'camera-zoom', preset: 'reset', duration: 1000 },

  { type: 'dialogue', speaker: '아리시에로', text: '......' },
  {
    type: 'dialogue',
    text: [
      '그녀는 책장에 시선을 고정한 채 미동도 하지 않았다.',
      '페이지를 넘기는 소리만이 아주 가끔 정적을 깼다.',
      '나는 숨을 죽이고 그녀의 옆모습을 관찰했다.',
      '속눈썹이 햇빛에 반사되어 가느다란 그림자를 만들고 있었다.',
      '무언가 말을 걸어야 할까? 아니면 조용히 자리를 비켜줘야 할까?',
      '갈등하는 사이, 그녀의 손가락이 멈췄다.'
    ]
  },

  { type: 'dialogue', speaker: '아리시에로', text: '사랑은 말이야, 결국 상실을 견디기 위한 연습일지도 몰라.' },
  { type: 'camera-effect', preset: 'shake', duration: 400, skip: true },
  { type: 'dialogue', text: '그녀가 혼잣말처럼 중얼거렸다. 낮은 목소리가 공기를 진동시켰다.\n나는 나도 모르게 헉 하고 숨을 들이켰다.' },

  { type: 'character', action: 'show', name: '아리시에로', image: 'smile', duration: 800 },
  {
    type: 'dialogue',
    speaker: '아리시에로',
    text: [
      '아... 보고 계셨나요?',
      '인기척이 느껴졌는데, 역시 누군가 있었군요.'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '그녀가 고개를 돌려 나를 정면으로 바라보았다.',
      '눈이 마주친 순간, 심장 박동이 평소보다 두 배는 빨라진 것 같았다.'
    ]
  },

  // ─── 3. 긴 철학적 대화 ───
  { type: 'dialogue', speaker: '아리시에로', text: '이 책, 당신도 찾고 있었죠?' },
  { type: 'dialogue', text: '나는 당황하며 고개를 끄덕였다. 어떻게 알았느냐고 물었다.' },
  {
    type: 'dialogue',
    speaker: '아리시에로',
    text: [
      '눈빛을 보면 알 수 있어요. 갈구하는 무언가가 담긴 눈빛.',
      '전 이 책을 벌써 세 번째 읽고 있어요.',
      '읽을 때마다 새로운 의미가 발견되거든요.'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '그녀는 책장을 덮고 나에게 의자 하나를 가리켰다.',
      '나는 이끌리듯 그녀의 맞은편 자리에 앉았다.'
    ]
  },

  { type: 'dialogue', speaker: '아리시에로', text: '당신은 이 소설의 결말이 해피엔딩이라고 생각하나요?' },
  { type: 'dialogue', text: '나는 잠시 고민했다. 주인공이 죽었으니 새드엔딩이 아니냐고 대답했다.' },
  {
    type: 'dialogue',
    speaker: '아리시에로',
    text: [
      '글쎄요... 전 다르게 생각해요.',
      '죽음은 결말이 아니라, 완성일 수도 있잖아요.',
      '자신의 사랑을 영원히 변하지 않는 것으로 남기기 위한 선택.'
    ]
  },
  {
    type: 'dialogue',
    text: [
      '그녀의 논리는 독특하면서도 설득력이 있었다.',
      '우리는 그렇게 한참 동안 생과 사, 그리고 기억에 대해 이야기했다.',
      '도서관 창밖으로 구름이 흘러가고, 햇살의 각도가 조금씩 변해갔다.',
      '처음 보는 사람과 이렇게 깊은 대화를 나눌 수 있다는 사실이 놀라웠다.',
      '마치 아주 오래전부터 알고 지냈던 사이처럼 편안했다.'
    ]
  },

  { type: 'dialogue', speaker: '아리시에로', text: '이름이 뭐예요?' },
  {
    type: 'dialogue',
    text: [
      '그녀가 갑작스럽게 물었다.',
      '나는 이름을 말해줬다. 그러자 그녀가 입술을 달싹이며 내 이름을 나직이 읊조렸다.'
    ]
  },
  { type: 'dialogue', speaker: '아리시에로', text: '좋은 이름이네요. 따뜻한 빛이 느껴지는 이름이에요.' },
  { type: 'dialogue', text: '얼굴이 화끈거렸다. 창피해서 고개를 숙였다.' },

  // ─── 4. 노을의 시간 ───
  { type: 'control', action: 'disable', duration: 5000, skip: true },
  { type: 'mood', action: 'add', mood: 'sunset', intensity: 0.85, duration: 5000, skip: true },
  { type: 'mood', action: 'add', mood: 'ambient', duration: 3000, skip: true },
  { type: 'effect', action: 'add', effect: 'sakura', src: 'sakura', rate: 15, skip: true },
  {
    type: 'dialogue',
    text: [
      '어느덧 도서관 내부는 진한 오렌지빛으로 물들었다.',
      '창밖에서 날려 들어온 벚꽃 잎들이 바닥에 흩뿌려졌다.',
      '그녀의 머리카락 위에도 작은 꽃잎 하나가 내려앉았다.'
    ]
  },

  { type: 'camera-zoom', preset: 'close-up', duration: 1500 },
  {
    type: 'dialogue',
    speaker: '아리시에로',
    text: [
      '아름답네요... 이 순간.',
      '가끔은 시간이 이대로 멈춰버렸으면 좋겠다고 생각해요.',
      '내일이 오면 오늘의 우리는 다시는 존재하지 않게 될 테니까.'
    ]
  },
  { type: 'camera-zoom', preset: 'reset', duration: 1500 },

  {
    type: 'dialogue',
    text: [
      '그녀의 말에는 깊은 상실감이 서려 있었다.',
      '나는 그녀의 손을 잡고 싶다는 충동을 느꼈다.',
      '하지만 내 손은 책상 밑에서 가늘게 떨리고 있을 뿐이었다.',
      '적막 속에서 우리는 한동안 노을만을 바라보았다.'
    ]
  },

  { type: 'dialogue', speaker: '아리시에로', text: '이제 전 가봐야 해요. 통금 시간이 있거든요.' },
  { type: 'character', action: 'show', name: '아리시에로', image: 'normal', duration: 1000 },
  {
    type: 'dialogue',
    speaker: '아리시에로',
    text: [
      '이 책, 제가 빌린 거지만... 오늘만 당신에게 빌려드릴게요.',
      '다 읽고 나면, 그때 다시 이야기해요.'
    ]
  },
  { type: 'dialogue', text: '그녀가 가방을 챙겨 자리에서 일어났다.' },

  // ─── 5. 작별과 여운 ───
  {
    type: 'dialogue',
    text: [
      '그녀가 서가 사이로 천천히 멀어져 갔다.',
      '멀어지는 발소리가 심장 소리와 겹쳐 들렸다.',
      '나는 그 자리에 못 박힌 듯 서서 그녀의 뒷모습을 보았다.',
      '이대로 보내면 다시는 못 만날지도 모른다.',
      '가슴속에서 무언가 뜨거운 것이 울컥 치밀어 올랐다.'
    ]
  },

  { type: 'camera-effect', preset: 'shake', duration: 600 },
  {
    type: 'dialogue',
    text: [
      '나는 그녀를 부르기 위해 입을 열었다.',
      '도서관의 공기가 긴장감으로 팽팽하게 당겨졌다.',
      '어떤 말을 해야 그녀를 멈출 수 있을까?'
    ]
  },

  {
    type: 'choice',
    choices: [
      { text: '급히 그녀를 불러 세운다', next: 'scene-a', var: { likeability: 60 } },
      { text: '내일도 이곳에 오냐고 묻는다', next: 'scene-a', var: { likeability: 40 } },
      { text: '연락처를 정중히 물어본다', next: 'scene-a', var: { likeability: 30 } },
      { text: '아무 말도 하지 못한 채 배웅한다', next: 'scene-a', var: { likeability: 0 } },
    ],
  },

  // ─── 6. 그 후의 이야기 (만약 배웅했을 경우의 감성 묘사) ───
  {
    type: 'dialogue',
    text: [
      '그녀의 모습이 완전히 사라진 후에도, 도서관에는 그녀의 향기가 남아 있었다.',
      '손때 묻은 책만이 내 앞에 덩그러니 놓여 있었다.',
      '나는 떨리는 손으로 책장을 넘겼다.',
      '첫 페이지에는 그녀가 적어놓은 듯한 작은 메모가 있었다.',
      '"기다림은 희망의 다른 이름입니다."',
      '메모를 읽는 순간, 가슴 한구석이 환해지는 기분이 들었다.',
      '내일도, 그다음 날도. 나는 이곳에 오게 될 것이다.',
      '그녀를 다시 만나기 위해.',
      '나의 진심이 그녀에게 닿을 수 있기를 바라며.',
      '조용한 도서관에 밤이 찾아오고 있었다.'
    ]
  },

  { type: 'mood', mood: 'night', intensity: 0.9, duration: 4000 },
  { type: 'effect', action: 'remove', effect: 'sakura', duration: 2000 },
  { type: 'screen-fade', dir: 'out', preset: 'black', duration: 2000 },
  { type: 'dialogue', text: '첫 번째 에피소드가 끝났습니다.' },
])
