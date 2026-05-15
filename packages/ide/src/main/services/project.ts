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

import { NOVEL_CONFIG_CONTENT, MAIN_TS_CONTENT, INDEX_HTML_CONTENT, getDeclarationTemplate } from '../../shared/templates'


// installFumikaDependencies is removed as we now fetch from npm
export async function ensureProjectDependencies(targetDir: string, forceUpdate = false): Promise<void> {
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

  if (needsInstall || forceUpdate) {
    console.log('[IDE] Installing fumika and vite from npm to', targetDir)
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    
    await new Promise<void>((resolve, reject) => {
      execFile(npmCmd, ['install', '--save-dev', 'fumika', 'vite'], { cwd: targetDir, shell: true }, (err, stdout, stderr) => {
        if (err) {
          console.error('[IDE] npm install failed:', stderr)
          reject(err)
        } else {
          console.log('[IDE] Dependencies installed from npm:', stdout)
          resolve()
        }
      })
    })
  }
}

export async function updateProject(targetDir: string): Promise<void> {
  // Force update by passing true
  await ensureProjectDependencies(targetDir, true)
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



  await ensureProjectDependencies(targetDir)
}
