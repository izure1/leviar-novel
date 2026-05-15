import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ideDir = path.resolve(__dirname, '..')
const coreDir = path.resolve(ideDir, '../core')

const targetDir = path.resolve(ideDir, 'resources/core-template')

async function copyCore() {
  console.log('[IDE Build] Copying fumika core to resources/core-template...')
  
  // Ensure target exists and is clean
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
  }
  fs.mkdirSync(targetDir, { recursive: true })

  // Build core if dist doesn't exist?
  const coreDist = path.join(coreDir, 'dist')
  if (!fs.existsSync(coreDist)) {
    console.warn('[IDE Build] Warning: core/dist not found. Did you build packages/core?')
    // Wait, let's just rely on the user or monorepo to build core.
  } else {
    fs.cpSync(coreDist, path.join(targetDir, 'dist'), { recursive: true })
  }

  // Copy package.json
  const pkgJsonPath = path.join(coreDir, 'package.json')
  if (fs.existsSync(pkgJsonPath)) {
    fs.copyFileSync(pkgJsonPath, path.join(targetDir, 'package.json'))
  }

  // Copy types if separated? core/dist usually contains types. Let's copy everything needed.
  console.log('[IDE Build] Successfully copied core to resources.')
}

copyCore().catch(console.error)
