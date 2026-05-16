import { promises as fs } from 'fs'
import path from 'path'
import { execFile } from 'child_process'

const DEFAULT_FOLDERS = [
  'assets',
  'scenes',
  'characters',
  'modules',
  'declarations',
  'backgrounds',
  'effects',
  'fallbacks'
]

import { getNovelConfigContent, MAIN_TS_CONTENT, getIndexHtmlContent, getDeclarationTemplate } from '../../shared/templates'

export interface ProjectOptions {
  gameName: string
  projectId: string
  processName: string
  width: number
  height: number
}

const EFFECT_TYPES = ['dust', 'rain', 'snow', 'sakura', 'sparkle', 'fog', 'leaves', 'fireflies'] as const;
type EffectType = typeof EFFECT_TYPES[number];

const EFFECT_PARTICLE_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { attribute: { frictionAir: 0, gravityScale: 0.001 }, style: { width: 10, height: 10, blendMode: 'lighter' } },
  rain: { attribute: { gravityScale: 1.5 }, style: { width: 25, height: 100, opacity: 1, blendMode: 'screen' } },
  snow: { attribute: { gravityScale: 0.01, frictionAir: 0 }, style: { width: 15, height: 15, blendMode: 'lighter' } },
  sakura: { attribute: { gravityScale: 0.02, frictionAir: 0 }, style: { width: 16, height: 20, opacity: 0.8 } },
  sparkle: { attribute: { gravityScale: 0.1 }, style: { width: 16, height: 16, opacity: 0.8 } },
  fog: { attribute: { frictionAir: 0, gravityScale: 0.003 }, style: { width: 120, height: 120, blendMode: 'screen' } },
  leaves: { attribute: { gravityScale: 0.1, frictionAir: 0.05, strictPhysics: true }, style: { width: 20, height: 20, opacity: 0.9 } },
  fireflies: { attribute: { gravityScale: -0.02, frictionAir: 0.05, strictPhysics: true }, style: { width: 8, height: 8, opacity: 0.8, blendMode: 'lighter' } },
}

const EFFECT_CLIP_PRESETS: Record<EffectType, Record<string, any>> = {
  dust: { impulse: 0.05, lifespan: 10000, interval: 250, size: [[0.5, 1], [0, 0.5]], opacity: [[0, 0], [1, 1], [0, 0]], loop: true },
  rain: { impulse: 0, lifespan: 3000, interval: 40, size: [[0.1, 0.3], [0.1, 0.3]], opacity: [[1, 1], [1, 1]], loop: true },
  snow: { impulse: 0.01, lifespan: 10000, interval: 100, size: [[0.3, 0.8], [0, 0]], opacity: [[1, 1], [0, 0]], loop: true, angularImpulse: 0.001 },
  sakura: { impulse: 0.02, lifespan: 6000, interval: 300, size: [[0.5, 0.8], [0.3, 0.5]], loop: true, angularImpulse: 0.001 },
  sparkle: { impulse: 0.02, lifespan: 1500, interval: 150, size: [[0.5, 1], [0, 0.1]], loop: true },
  fog: { impulse: 0.01, lifespan: 15000, interval: 800, size: [[2, 2], [5, 10]], opacity: [[0, 0], [0.1, 0.2], [0, 0]], loop: true, angularImpulse: 0.0001 },
  leaves: { impulse: 0.08, lifespan: 7000, interval: 350, size: [[0.8, 1.2], [0.8, 1.2]], loop: true, angularImpulse: 0.05 },
  fireflies: { impulse: 0.03, lifespan: 5000, interval: 300, size: [[0.5, 1.5], [0, 0.5]], loop: true },
}

export async function ensureEffectsFiles(targetDir: string) {
  const effectsDir = path.join(targetDir, 'effects')
  try {
    await fs.access(effectsDir)
  } catch {
    await fs.mkdir(effectsDir, { recursive: true })
  }

  for (const effectType of EFFECT_TYPES) {
    const filePath = path.join(effectsDir, `${effectType}.ts`)
    try {
      await fs.access(filePath)
    } catch {
      const particlePreset = JSON.stringify(EFFECT_PARTICLE_PRESETS[effectType], null, 2)
      const clipPreset = JSON.stringify(EFFECT_CLIP_PRESETS[effectType], null, 2)
      
      const content = `import type { EffectDef } from 'fumika'\n\nexport const effectDef: EffectDef = {\n  particle: ${particlePreset.replace(/"([^"]+)":/g, '$1:')},\n  clip: ${clipPreset.replace(/"([^"]+)":/g, '$1:')}\n}\n`
      await fs.writeFile(filePath, content, 'utf-8')
    }
  }
}


export async function ensureProjectDependencies(targetDir: string, processName?: string, forceUpdate = false): Promise<void> {
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
      name: processName || path.basename(targetDir).replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'fumika-project',
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
        paths: {
          '@/*': ['./*']
        },
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

  if (needsInstall || forceUpdate) {
    console.log('[IDE] Installing fumika and vite from npm to', targetDir)
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    
    await new Promise<void>((resolve, reject) => {
      execFile(npmCmd, ['install', 'fumika'], { cwd: targetDir, shell: true }, (err, _stdout, stderr) => {
        if (err) {
          console.error('[IDE] npm install fumika failed:', stderr)
          reject(err)
        } else {
          execFile(npmCmd, ['install', '--save-dev', 'vite'], { cwd: targetDir, shell: true }, (err, _stdout, stderr) => {
            if (err) {
              console.error('[IDE] npm install vite failed:', stderr)
              reject(err)
            } else {
              console.log('[IDE] Dependencies installed from npm')
              resolve()
            }
          })
        }
      })
    })
  }
}

export async function updateProject(targetDir: string): Promise<void> {
  // Force update by passing true
  await ensureProjectDependencies(targetDir, undefined, true)
}

/**
 * 스캐폴딩: 대상 디렉토리에 빈 프로젝트 구조를 생성합니다.
 */
export async function scaffoldProject(targetDir: string, options: ProjectOptions): Promise<void> {
  // 1. 디렉토리 생성
  for (const folder of DEFAULT_FOLDERS) {
    const dirPath = path.join(targetDir, folder)
    await fs.mkdir(dirPath, { recursive: true })
  }

  // 2. declarations 하위 파일 기본 생성
  const declareFiles = ['assets', 'scenes', 'characters', 'modules', 'backgrounds', 'effects', 'fallbacks', 'audios']
  for (const file of declareFiles) {
    const filePath = path.join(targetDir, 'declarations', `${file}.ts`)
    try {
      await fs.access(filePath)
    } catch {
      await fs.writeFile(filePath, getDeclarationTemplate(file as any), 'utf-8')
    }
  }

  // types.d.ts: FallbackItem 전역 선언 (declare global)
  const typesDeclPath = path.join(targetDir, 'declarations', 'types.d.ts')
  try {
    await fs.access(typesDeclPath)
  } catch {
    await fs.writeFile(typesDeclPath, getDeclarationTemplate('types'), 'utf-8')
  }

  // 3. 기본 설정 파일 생성
  const configPath = path.join(targetDir, 'novel.config.ts')
  const mainPath = path.join(targetDir, 'main.ts')

  try {
    await fs.access(configPath)
  } catch {
    await fs.writeFile(configPath, getNovelConfigContent(options.width, options.height), 'utf-8')
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
    await fs.writeFile(indexPath, getIndexHtmlContent(options.gameName), 'utf-8')
  }

  const licensePath = path.join(targetDir, 'LICENSE')
  try {
    await fs.access(licensePath)
  } catch {
    const MIT_LICENSE = `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
    await fs.writeFile(licensePath, MIT_LICENSE, 'utf-8')
  }

  await ensureProjectDependencies(targetDir, options.processName)
}
