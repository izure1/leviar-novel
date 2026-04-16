// example/main.ts — 모든 기능 테스트 진입점
import { Novel }    from '../src'
import config       from './novel.config'
import sceneIntro   from './scenes/scene-intro'
import sceneA       from './scenes/scene-a'
import sceneCond    from './scenes/scene-condition'
import sceneEffects from './scenes/scene-effects'
import exploreMap   from './scenes/explore-map'

// =============================================================
// 인라인 SVG 에셋 생성 유틸
// =============================================================

const svg = (body: string, w: number, h: number): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`
  )}`

// =============================================================
// 에셋 정의
// =============================================================

const CHARS = {
  // ── 히로인 (일반)
  'char-normal': svg(`
    <rect x="75" y="220" width="150" height="400" fill="#7799ff" rx="15"/>
    <ellipse cx="150" cy="145" rx="88" ry="100" fill="#ffddc9"/>
    <ellipse cx="150" cy="65"  rx="93" ry="63"  fill="#6633aa"/>
    <ellipse cx="112" cy="145" rx="17" ry="21"  fill="#3366dd"/>
    <ellipse cx="188" cy="145" rx="17" ry="21"  fill="#3366dd"/>
    <ellipse cx="112" cy="143" rx="9"  ry="12"  fill="#11224f"/>
    <ellipse cx="188" cy="143" rx="9"  ry="12"  fill="#11224f"/>
    <circle  cx="116" cy="138" r="4"            fill="#ffffff"/>
    <circle  cx="192" cy="138" r="4"            fill="#ffffff"/>
    <path d="M 125 183 Q 150 193 175 183" stroke="#cc6677" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 108 218 L 150 248 L 192 218" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
  `, 300, 600),

  // ── 히로인 (기쁨)
  'char-happy': svg(`
    <rect x="75" y="220" width="150" height="400" fill="#ff7799" rx="15"/>
    <ellipse cx="150" cy="145" rx="88" ry="100" fill="#ffddc9"/>
    <ellipse cx="150" cy="65"  rx="93" ry="63"  fill="#cc3388"/>
    <ellipse cx="112" cy="142" rx="18" ry="16"  fill="#cc3366"/>
    <ellipse cx="188" cy="142" rx="18" ry="16"  fill="#cc3366"/>
    <ellipse cx="112" cy="140" rx="10" ry="9"   fill="#11224f"/>
    <ellipse cx="188" cy="140" rx="10" ry="9"   fill="#11224f"/>
    <circle  cx="116" cy="135" r="4"            fill="#ffffff"/>
    <circle  cx="192" cy="135" r="4"            fill="#ffffff"/>
    <ellipse cx="96"  cy="165" rx="22" ry="10"  fill="#ffaaaa" opacity="0.6"/>
    <ellipse cx="204" cy="165" rx="22" ry="10"  fill="#ffaaaa" opacity="0.6"/>
    <path d="M 120 180 Q 150 204 180 180" stroke="#cc3355" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M 108 218 L 150 248 L 192 218" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round"/>
  `, 300, 600),
}

const BG = {
  // ── 교실 배경
  'bg-room': svg(`
    <rect width="800" height="600" fill="#e8dcc8"/>
    <rect width="800" height="260" fill="#cce0ee"/>
    <rect y="460" width="800" height="140" fill="#b8a890"/>
    <rect x="80"  y="35"  width="400" height="145" fill="#2d6048" rx="4"/>
    <text x="280" y="118" text-anchor="middle" fill="#a0c090" font-size="22" font-family="serif">칠판</text>
    <rect x="570" y="55"  width="190" height="230" fill="#88ccff" stroke="#bbb" stroke-width="4" rx="4"/>
    <line x1="665" y1="55" x2="665" y2="285" stroke="#bbb" stroke-width="2"/>
    <line x1="570" y1="170" x2="760" y2="170" stroke="#bbb" stroke-width="2"/>
    <rect y="448" width="800" height="18" fill="#998877"/>
    <line x1="0" y1="510" x2="800" y2="510" stroke="#c8b89a" stroke-width="3"/>
    <line x1="0" y1="545" x2="800" y2="545" stroke="#c8b89a" stroke-width="2"/>
    <rect x="20"  y="440" width="120" height="50" fill="#ccbbaa" rx="4"/>
    <rect x="200" y="440" width="120" height="50" fill="#ccbbaa" rx="4"/>
    <rect x="500" y="440" width="120" height="50" fill="#ccbbaa" rx="4"/>
    <rect x="660" y="440" width="120" height="50" fill="#ccbbaa" rx="4"/>
  `, 800, 600),

  // ── 옥상 배경
  'bg-rooftop': svg(`
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#667ecc"/>
        <stop offset="100%" stop-color="#c8d8ff"/>
      </linearGradient>
    </defs>
    <rect width="800" height="420" fill="url(#sky)"/>
    <ellipse cx="130" cy="110" rx="80" ry="50" fill="#fff" opacity="0.75"/>
    <ellipse cx="660" cy="85"  rx="100" ry="60" fill="#fff" opacity="0.65"/>
    <rect x="45"  y="310" width="55"  height="110" fill="#556677"/>
    <rect x="155" y="270" width="75"  height="150" fill="#445566"/>
    <rect x="600" y="295" width="65"  height="125" fill="#556677"/>
    <rect x="705" y="325" width="55"  height="95"  fill="#445566"/>
    <rect y="400" width="800" height="22" fill="#bbbccc"/>
    <rect y="420" width="800" height="180" fill="#80808f"/>
    <rect x="0"   y="395" width="800" height="28" fill="#aaaabc" rx="4"/>
    <line x1="0" y1="420" x2="800" y2="420" stroke="#ccc" stroke-width="2" stroke-dasharray="6,10"/>
  `, 800, 600),
}

const EFFECTS = {
  'dust':      svg(`<circle cx="5" cy="5" r="4" fill="#ffd080"/>`, 10, 10),
  'sakura':    svg(`
    <ellipse cx="10" cy="10" rx="9" ry="5" fill="#ffb3c8" transform="rotate(40,10,10)"/>
    <ellipse cx="10" cy="10" rx="9" ry="5" fill="#ffd0dc" transform="rotate(-40,10,10)"/>
    <circle  cx="10" cy="10" r="2" fill="#ffeeaa"/>
  `, 20, 20),
  'rain':      svg(`<rect width="3" height="12" fill="#99ccff" opacity="0.7"/>`, 3, 12),
  'snow':      svg(`
    <circle cx="7.5" cy="7.5" r="6" fill="#ddeeff"/>
    <line x1="7.5" y1="1" x2="7.5" y2="14" stroke="#aac" stroke-width="1.5"/>
    <line x1="1" y1="7.5" x2="14" y2="7.5" stroke="#aac" stroke-width="1.5"/>
  `, 15, 15),
  'fog':       svg(`<ellipse cx="60" cy="40" rx="58" ry="38" fill="rgba(200,210,220,0.25)"/>`, 120, 80),
  'sparkle':   svg(`<polygon points="8,1 10,6 15,6 11,9 13,14 8,11 3,14 5,9 1,6 6,6" fill="#ffee44"/>`, 16, 16),
  'leaves':    svg(`<ellipse cx="10" cy="12" rx="8" ry="5" fill="#55aa44" transform="rotate(-30,10,10)"/>`, 20, 20),
  'fireflies': svg(`<circle cx="4" cy="4" r="3" fill="#aaff44"/>`, 8, 8),
}

const OBJECTS = {
  'door': svg(`
    <rect width="90" height="160" fill="#8B4513" rx="6"/>
    <rect x="8" y="8" width="74" height="144" fill="#A0522D" rx="4"/>
    <rect x="8" y="8" width="74" height="68"  fill="#9b4f28" rx="4"/>
    <circle cx="68" cy="84" r="6" fill="#FFD700"/>
    <line x1="12" y1="80" x2="78" y2="80" stroke="#7a3a10" stroke-width="2"/>
    <text x="45" y="130" text-anchor="middle" fill="#ffd0a0" font-size="11" font-family="sans-serif">처음으로</text>
  `, 90, 160),

  'window-obj': svg(`
    <rect width="110" height="130" fill="#aaa" rx="4"/>
    <rect x="5" y="5" width="100" height="120" fill="#99ccff" rx="3"/>
    <line x1="55" y1="5"  x2="55" y2="125" stroke="#aaa" stroke-width="5"/>
    <line x1="5"  y1="65" x2="105" y2="65" stroke="#aaa" stroke-width="5"/>
    <text x="55" y="115" text-anchor="middle" fill="#336" font-size="11" font-family="sans-serif">효과 씬</text>
  `, 110, 130),
}

// =============================================================
// Novel 초기화
// =============================================================

async function main() {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement

  const novel = new Novel(config, {
    canvas,
    width:  800,
    height: 600,
    depth:  500,
  })

  // ── 씬 등록
  novel.register(sceneIntro)
  novel.register(sceneA)
  novel.register(sceneCond)
  novel.register(sceneEffects)
  novel.register(exploreMap)

  // ── 에셋 로드 (SVG 인라인 data URI)
  await novel.load({
    ...CHARS,
    ...BG,
    ...EFFECTS,
    ...OBJECTS,
  })

  // ── 시작
  novel.start('scene-intro')
}

main().catch(console.error)
