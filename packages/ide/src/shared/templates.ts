// =============================================================
// templates.ts — 프로젝트 스캐폴딩 템플릿 문자열 모음
// =============================================================

// ─── 최상위 설정 파일 ─────────────────────────────────────────

export const NOVEL_CONFIG_CONTENT = `import Assets from './declarations/assets'
import Scenes from './declarations/scenes'
import Characters from './declarations/characters'
import Modules from './declarations/modules'
import Backgrounds from './declarations/backgrounds'
import Audios from './declarations/audios'
import Effects from './declarations/effects'
import Fallbacks from './declarations/fallbacks'

import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  assets: Assets,
  scenes: Scenes,
  characters: Characters,
  modules: Modules,
  backgrounds: Backgrounds,
  audios: Audios,
  effects: Effects,
  fallback: Fallbacks,
})
`

export const MAIN_TS_CONTENT = `// Fumika Engine Entry Point
import { createEngine } from 'fumika'
import config from './novel.config'

const engine = createEngine(config)
engine.mount('#app')
`

export const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fumika Visual Novel</title>
    <style>
      body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; }
      #app { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.ts"></script>
  </body>
</html>
`

// ─── declarations/ 초기 파일 템플릿 ──────────────────────────

export type DeclarationFolder =
  | 'assets'
  | 'scenes'
  | 'characters'
  | 'modules'
  | 'backgrounds'
  | 'effects'
  | 'fallbacks'
  | 'audios'
  | 'types'

const DECLARATION_TEMPLATES: Partial<Record<DeclarationFolder, string>> = {
  assets: `import { defineAssets } from 'fumika'\n\nexport default defineAssets({\n\n})\n`,
  scenes: `export default {}\n`,
  characters: `export default {} as const\n`,
  modules: `import { defineCustomModules } from 'fumika'\n\nexport default defineCustomModules({\n\n})\n`,
  backgrounds: `import { defineBackgrounds } from 'fumika'\nimport assets from './assets'\n\nexport default defineBackgrounds(assets)({\n\n})\n`,
  effects: `import { defineEffects } from 'fumika'\n\nexport default defineEffects({\n\n})\n`,
  fallbacks: `import { defineFallback } from 'fumika'\nimport modules from './modules'\n\nexport default defineFallback(modules)([\n\n] satisfies FallbackItem[])\n`,
  audios: `import { defineAudios } from 'fumika'\nimport Assets from './assets'\n\nexport default defineAudios({\n\n})\n`,
  types: `import type { FallbackRuleOf } from 'fumika'\nimport type Modules from './modules'\n\ndeclare global {\n  type FallbackItem = FallbackRuleOf<typeof Modules>\n}\n`,
}

export function getDeclarationTemplate(type: DeclarationFolder | string): string {
  return DECLARATION_TEMPLATES[type as DeclarationFolder] ?? `export default {}\n`
}

// ─── watcher가 동적으로 생성하는 선언 파일의 헤더/푸터 ─────────

/**
 * watcher.ts의 generateDeclaration()에서 사용하는 헤더/푸터 조각.
 * 파일 항목은 watcher가 직접 삽입하고, 앞뒤 틀은 여기서 관리합니다.
 */
export type WatcherDeclSection = {
  header: string   // import 라인들 + 선언 시작
  footer: string   // 선언 닫기
}

export const WATCHER_DECL: Partial<Record<string, WatcherDeclSection>> = {
  assets: {
    header: `import { defineAssets } from 'fumika'\n\nexport default defineAssets({\n`,
    footer: `})\n`,
  },
  audios: {
    header: `import { defineAudios } from 'fumika'\nimport Assets from './assets'\n\nexport default defineAudios({\n`,
    footer: `})\n`,
  },
  backgrounds: {
    header: `import { defineBackgrounds } from 'fumika'\nimport assets from './assets'\n\nexport default defineBackgrounds(assets)({\n`,
    footer: `})\n`,
  },
  effects: {
    header: `import { defineEffects } from 'fumika'\n\nexport default defineEffects({\n`,
    footer: `})\n`,
  },
  modules: {
    header: `import { defineCustomModules } from 'fumika'\n`,
    // 항목이 있을 때: 각 import + 객체 → footer에서 닫음
    // 항목이 없을 때: 바로 빈 객체
    footer: `})\n`,
  },
  fallbacks: {
    header: `import { defineFallback } from 'fumika'\nimport modules from './modules'\n\nexport default defineFallback(modules)([\n`,
    footer: `] satisfies FallbackItem[])\n`,
  },
}

// ─── IDE에서 새 파일 생성 시 사용하는 파일 내용 템플릿 ──────────

const FILE_TEMPLATE_GENERATORS: Partial<
  Record<DeclarationFolder, (safeName: string, relativeDots: string) => string>
> = {
  scenes: (_, relativeDots) =>
    `import { defineScene } from 'fumika'\nimport config from '${relativeDots}/novel.config'\n\nexport default defineScene({ config })(({ label, next }) => [\n  label('start'),\n  { type: 'dialogue', text: '새로운 씬입니다.' },\n])\n`,

  characters: (safeName, relativeDots) =>
    `import { defineCharacter } from 'fumika'\nimport assets from '${relativeDots}/declarations/assets'\n\nexport default defineCharacter(assets)({\n  name: '${safeName}',\n  bases: {\n    normal: { src: '', width: 560, points: {} }\n  },\n  emotions: {\n    normal: {}\n  }\n})\n`,

  modules: (safeName) =>
    `import { define } from 'fumika'\n\ninterface MyCmd {\n  type: '${safeName}'\n}\n\ninterface MySchema {\n  count: number\n}\n\ninterface MyHook {\n  '${safeName}:event': (val: number) => void\n}\n\nexport default define<MyCmd, MySchema, MyHook>({\n  count: 0\n})\n  .defineCommand(function* (cmd, ctx, state, setState) {\n    // 커맨드 구현\n  })\n  .defineView((ctx, state, setState) => {\n    // 뷰 구현\n    return null\n  })\n`,

  backgrounds: (_, relativeDots) =>
    `import type Assets from '${relativeDots}/declarations/assets'\n\nexport const src: keyof typeof Assets = ''\nexport const parallax: boolean = false\n`,

  effects: () =>
    `import type { EffectDef } from 'fumika'\n\nexport const effectDef: EffectDef = {}\n`,

  fallbacks: () =>
    `export default {\n  type: 'dialogue',\n  defaults: {}\n} as const\n`,
}

export function getFileTemplate(
  rootType: DeclarationFolder | string,
  safeName: string,
  relativeDots: string
): string {
  const generator = FILE_TEMPLATE_GENERATORS[rootType as DeclarationFolder]
  return generator ? generator(safeName, relativeDots) : `// New file`
}
