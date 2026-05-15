// =============================================================
// templates.ts — 프로젝트 스캐폴딩 템플릿 문자열 모음
// =============================================================

// ─── 최상위 설정 파일 ─────────────────────────────────────────

export function getNovelConfigContent(width: number, height: number): string {
  return `import Assets from './declarations/assets'
import { sceneKeys } from './declarations/scenes'
import Characters from './declarations/characters'
import Modules from './declarations/modules'
import Backgrounds from './declarations/backgrounds'
import Audios from './declarations/audios'
import Effects from './declarations/effects'
import Fallbacks from './declarations/fallbacks'

import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  width: ${width},
  height: ${height},
  variables: {},
  environments: {},
  assets: Assets,
  scenes: sceneKeys,
  characters: Characters,
  modules: Modules,
  backgrounds: Backgrounds,
  audios: Audios,
  effects: Effects,
  fallback: Fallbacks,
})
`
}

export const MAIN_TS_CONTENT = `// Fumika Engine Entry Point
import { Novel } from 'fumika'
import config from './novel.config'
import Scenes from './declarations/scenes'

async function main() {
  const element = document.getElementById('app') as HTMLDivElement

  const novel = new Novel(config, {
    element,
    scenes: Scenes
  })

  await novel.load()
  await novel.boot()

  // 기본적으로 'start' 씬을 시작하되, 없으면 로드된 첫 번째 씬을 시작합니다.
  const availableScenes = Object.keys(Scenes)
  const startScene = availableScenes.includes('start') ? 'start' : availableScenes[0]
  if (startScene) {
    novel.start(startScene as any)
  }

  window.addEventListener('click', () => {
    novel.next()
  })
}

main().catch(console.error)
`

export function getIndexHtmlContent(gameName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${gameName}</title>
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
}

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
  | 'initials'
  | 'hooks'

const DECLARATION_TEMPLATES: Partial<Record<DeclarationFolder, string>> = {
  assets: `import { defineAssets } from 'fumika'\n\nexport default defineAssets({\n\n})\n`,
  scenes: `export const sceneKeys = [] as const;\n\nexport default {}\n`,
  characters: `export default {} as const\n`,
  modules: `import { defineCustomModules } from 'fumika'\n\nexport default defineCustomModules({\n\n})\n`,
  backgrounds: `import { defineBackgrounds } from 'fumika'\nimport assets from './assets'\n\nexport default defineBackgrounds(assets)({\n\n})\n`,
  effects: `import { defineEffects } from 'fumika'\n\nexport default defineEffects({\n\n})\n`,
  fallbacks: `import { defineFallback } from 'fumika'\nimport modules from './modules'\n\nexport default defineFallback(modules)([\n\n])\n`,
  audios: `import { defineAudios } from 'fumika'\n\nexport default defineAudios({\n\n})\n`,
  types: `import type { FallbackRuleOf } from 'fumika'\nimport type Modules from './modules'\n\ndeclare global {\n  type FallbackItem = FallbackRuleOf<typeof Modules>\n}\n`,
  initials: `export default {}\n`,
  hooks: `export default {}\n`,
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
    header: `import { defineAudios } from 'fumika'\n\nexport default defineAudios({\n`,
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
    footer: `])\n`,
  },
}

// ─── IDE에서 새 파일 생성 시 사용하는 파일 내용 템플릿 ──────────

const FILE_TEMPLATE_GENERATORS: Partial<
  Record<DeclarationFolder, (safeName: string, relativeDots: string) => string>
> = {
  scenes: (_, relativeDots) =>
    `import { defineScene } from 'fumika'\nimport config from '${relativeDots}/novel.config'\nimport Initials from '${relativeDots}/declarations/initials'\nimport Hooks from '${relativeDots}/declarations/hooks'\n\nexport default defineScene({\n  config,\n  variables: {},\n  // next: { scene: '', preserve: true },\n  // initial: Initials[''],\n  // hooks: Hooks['']\n})(({ label, goto, call, set, condition, next }) => [\n\n])\n`,

  characters: (safeName, relativeDots) =>
    `import { defineCharacter } from 'fumika'\nimport assets from '${relativeDots}/declarations/assets'\n\nexport default defineCharacter(assets)({\n  name: '${safeName}',\n  bases: {\n    idle: {\n      src: '',\n      width: 560,\n      points: {}\n    }\n  },\n  emotions: {\n    normal: {}\n  }\n})\n`,

  modules: (safeName) =>
    `import { define } from 'fumika'\n\ninterface MyCmd { }\n\ninterface MySchema { }\n\ninterface MyHook {\n  '${safeName}:event': (val: unknown) => unknown\n}\n\nexport default define<MyCmd, MySchema, MyHook>({ })\n  .defineCommand(function* (cmd, ctx, state, setState) {\n    // 커맨드 구현\n  })\n  .defineView((ctx, state, setState) => {\n    // 뷰 구현\n    return {\n      show: () => {},\n      hide: () => {},\n      onUpdate: () => {},\n      onCleanup: () => {}\n    }\n  })\n`,

  backgrounds: (_, relativeDots) =>
    `import type Assets from '${relativeDots}/declarations/assets'\n\nexport const src: keyof typeof Assets = ''\nexport const parallax: boolean = true\n`,

  effects: () =>
    `import type { EffectDef } from 'fumika'\n\nexport const effectDef: EffectDef = {}\n`,

  fallbacks: () =>
    `const fallback: FallbackItem = {\n  type: '',\n  defaults: {}\n}\n\nexport default fallback`,

  initials: (_, relativeDots) =>
    `import { defineInitial } from 'fumika'\nimport config from '${relativeDots}/novel.config'\n\nexport default defineInitial(config)({\n  \n})\n`,

  hooks: (_, relativeDots) =>
    `import { defineHook } from 'fumika'\nimport config from '${relativeDots}/novel.config'\n\nexport default defineHook(config)({\n  \n})\n`,
}

export function getFileTemplate(
  rootType: DeclarationFolder | string,
  safeName: string,
  relativeDots: string
): string {
  const generator = FILE_TEMPLATE_GENERATORS[rootType as DeclarationFolder]
  return generator ? generator(safeName, relativeDots) : `// New file`
}
