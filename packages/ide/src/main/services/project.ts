import { promises as fs } from 'fs'
import path from 'path'

const DEFAULT_FOLDERS = [
  'assets',
  'scenes',
  'characters',
  'modules',
  'declarations'
]

const NOVEL_CONFIG_CONTENT = `import Assets from './declarations/assets'
import Scenes from './declarations/scenes'
import Characters from './declarations/characters'
import Modules from './modules'
import Backgrounds from './backgrounds'
import Audios from './audios'

import { defineNovelConfig } from 'fumika'

export default defineNovelConfig({
  assets: Assets,
  scenes: Scenes,
  characters: Characters,
  modules: Modules,
  backgrounds: Backgrounds,
  audios: Audios,
})
`

const MAIN_TS_CONTENT = `// Fumika Engine Entry Point
import { createEngine } from 'fumika'
import config from './novel.config'

const engine = createEngine(config)
engine.mount('#app')
`

const INDEX_HTML_CONTENT = `<!DOCTYPE html>
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

const DECLARATION_TEMPLATE = `export default {

}
`

const BACKGROUNDS_TEMPLATE = `import { defineBackgrounds } from 'fumika'
import assets from './declarations/assets'

export default defineBackgrounds(assets)({

})
`

const MODULES_TEMPLATE = `import { defineCustomModules } from 'fumika'
import modules from './declarations/modules'

export default defineCustomModules(modules)
`

const AUDIOS_TEMPLATE = `import { defineAudios } from 'fumika'
import assets from './declarations/assets'

export default defineAudios(assets)({

})
`

export async function ensureProjectDependencies(targetDir: string): Promise<void> {
  const { exec } = require('child_process')
  
  // Node.js 설치 여부 검사
  const isNodeInstalled = await new Promise((resolve) => {
    exec('npm -v', (err: any) => resolve(!err))
  })
  if (!isNodeInstalled) {
    throw new Error('Fumika IDE Requires Node.js.\n프로젝트를 생성/업데이트하려면 컴퓨터에 Node.js(및 npm)가 설치되어 있어야 합니다. https://nodejs.org 에서 먼저 설치해주세요.')
  }

  const packageJsonPath = path.join(targetDir, 'package.json')
  let needsInstall = false

  try {
    await fs.access(packageJsonPath)
    try {
      await fs.access(path.join(targetDir, 'node_modules', 'fumika'))
    } catch {
      needsInstall = true
    }
  } catch {
    needsInstall = true
    const pkg = {
      name: path.basename(targetDir).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'fumika-project',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite'
      }
    }
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf-8')
  }

  const tsconfigPath = path.join(targetDir, 'tsconfig.json')
  try {
    await fs.access(tsconfigPath)
  } catch {
    const tsconfig = {
      compilerOptions: {
        target: 'ESNext',
        useDefineForClassFields: true,
        module: 'ESNext',
        lib: ['ESNext', 'DOM'],
        moduleResolution: 'bundler',
        strict: true,
        resolveJsonModule: true,
        isolatedModules: true,
        esModuleInterop: true,
        noEmit: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: true
      },
      include: ['**/*.ts']
    }
    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf-8')
  }

  if (needsInstall) {
    const { exec } = require('child_process')
    return new Promise((resolve, reject) => {
      console.log('[IDE] Installing dependencies in', targetDir)
      exec('npm install fumika', { cwd: targetDir }, (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error('[IDE] npm install failed:', stderr)
          reject(error)
        } else {
          console.log('[IDE] npm install success:', stdout)
          resolve()
        }
      })
    })
  }
}

export async function updateProject(targetDir: string): Promise<void> {
  // Ensure basic files
  await ensureProjectDependencies(targetDir)

  // Force update fumika to latest
  const { exec } = require('child_process')
  return new Promise((resolve, reject) => {
    console.log('[IDE] Updating fumika in', targetDir)
    exec('npm install fumika@latest', { cwd: targetDir }, (error: any, stdout: string, stderr: string) => {
      if (error) {
        console.error('[IDE] npm update failed:', stderr)
        reject(error)
      } else {
        console.log('[IDE] npm update success:', stdout)
        resolve()
      }
    })
  })
}

/**
 * 스캐폴딩: 대상 디렉토리에 빈 프로젝트 구조를 생성합니다.
 */
export async function scaffoldProject(targetDir: string): Promise<void> {
  // 1. 디렉토리 생성
  for (const folder of DEFAULT_FOLDERS) {
    const dirPath = path.join(targetDir, folder)
    await fs.mkdir(dirPath, { recursive: true })
  }

  // 2. declarations 하위 파일 기본 생성
  const declareFiles = ['assets', 'scenes', 'characters', 'modules']
  for (const file of declareFiles) {
    const filePath = path.join(targetDir, 'declarations', `${file}.ts`)
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, DECLARATION_TEMPLATE, 'utf-8')
    }
  }

  // 3. 기본 설정 파일 생성
  const configPath = path.join(targetDir, 'novel.config.ts')
  const mainPath = path.join(targetDir, 'main.ts')

  try {
    await fs.access(configPath)
  } catch {
    await fs.writeFile(configPath, NOVEL_CONFIG_CONTENT, 'utf-8')
  }

  try {
    await fs.access(mainPath)
  } catch {
    await fs.writeFile(mainPath, MAIN_TS_CONTENT, 'utf-8')
  }

  const indexPath = path.join(targetDir, 'index.html')
  try {
    await fs.access(indexPath)
  } catch {
    await fs.writeFile(indexPath, INDEX_HTML_CONTENT, 'utf-8')
  }

  const bgPath = path.join(targetDir, 'backgrounds.ts')
  try {
    await fs.access(bgPath)
  } catch {
    await fs.writeFile(bgPath, BACKGROUNDS_TEMPLATE, 'utf-8')
  }

  const modulesPath = path.join(targetDir, 'modules.ts')
  try {
    await fs.access(modulesPath)
  } catch {
    await fs.writeFile(modulesPath, MODULES_TEMPLATE, 'utf-8')
  }

  const audioPath = path.join(targetDir, 'audios.ts')
  try {
    await fs.access(audioPath)
  } catch {
    await fs.writeFile(audioPath, AUDIOS_TEMPLATE, 'utf-8')
  }

  await ensureProjectDependencies(targetDir)
}
