import { watch, FSWatcher } from 'chokidar'
import path from 'path'
import { promises as fs } from 'fs'

const WATCH_FOLDERS = [
  'assets',
  'scenes',
  'characters',
  'modules'
]

export class ProjectWatcher {
  private watcher: FSWatcher | null = null
  private projectPath: string = ''

  /**
   * 프로젝트 디렉토리 감시를 시작합니다.
   */
  public async start(projectPath: string) {
    this.stop()
    this.projectPath = projectPath

    const watchPaths = WATCH_FOLDERS.map((folder) => path.join(projectPath, folder))

    this.watcher = watch(watchPaths, {
      ignored: /(^|[\\/])\\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: false
    })

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath))
      .on('unlink', (filePath) => this.handleFileChange(filePath))
      // on 'change', the declaration doesn't need to change unless the export changes,
      // but usually the export structure remains the same, so we only watch add/unlink
  }

  /**
   * 프로젝트 디렉토리 감시를 중지합니다.
   */
  public stop() {
    if (this.watcher) {
      this.watcher.close()
      this.watcher = null
    }
  }

  private async handleFileChange(filePath: string) {
    try {
      const relativePath = path.relative(this.projectPath, filePath)
      const folder = relativePath.split(path.sep)[0]

      if (WATCH_FOLDERS.includes(folder)) {
        await this.generateDeclaration(folder)
      }
    } catch (e) {
      console.error('File change handling error:', e)
    }
  }

  private async generateDeclaration(folder: string) {
    const folderPath = path.join(this.projectPath, folder)
    const declPath = path.join(this.projectPath, 'declarations', `${folder}.ts`)

    try {
      try {
        await fs.access(folderPath)
      } catch {
        return
      }

      const getFilesRecursively = async (dir: string, relativeRoot: string = ''): Promise<{ name: string; path: string; rel: string }[]> => {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        let result: { name: string; path: string; rel: string }[] = []
        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue
          
          const relativeEntryPath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name
          const fullPath = path.join(dir, entry.name)

          if (entry.isDirectory()) {
            result = result.concat(await getFilesRecursively(fullPath, relativeEntryPath))
          } else {
            result.push({
              name: entry.name,
              path: fullPath,
              rel: relativeEntryPath
            })
          }
        }
        return result
      }

      const files = await getFilesRecursively(folderPath)

      let imports = ''
      let exports = 'export default {\n'

      for (const file of files) {
        // file.rel is like "ch1/intro.ts" or "intro.ts"
        const parsed = path.parse(file.rel)
        const baseName = parsed.name
        
        if (file.name.endsWith('.ts')) {
          // e.g. "ch1_intro" or just "intro"
          // We use the full relative path without extension to generate a unique import name
          const relativePathNoExt = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name
          const importName = '_' + relativePathNoExt.replace(/[^a-zA-Z0-9_]/g, '_')
          
          imports += `import ${importName} from '../${folder}/${relativePathNoExt}'\n`
          
          // if it's deeply nested, should the key be just the basename?
          // To prevent collision, it's safer to use the basename, but what if there are duplicates?
          // For now, let's export it as baseName but prefix it with dir name if needed?
          // The user usually wants the filename to be the key. Let's use basename as before.
          exports += `  ...${importName},\n`
        } else {
          // assets (png, wav, etc)
          const relativePathForwardSlash = file.rel.replace(/\\/g, '/')
          // 중첩된 폴더 구조를 고려하여 key 생성 (예: ch1/bg.png -> ch1/bg)
          const relativePathNoExt = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name
          const assetKey = relativePathNoExt.replace(/\\/g, '/')
          exports += `  '${assetKey}': './${folder}/${relativePathForwardSlash}',\n`
        }
      }

      exports += '} as const\n'

      const content = `${imports}\n${exports}`
      
      await fs.mkdir(path.dirname(declPath), { recursive: true })
      await fs.writeFile(declPath, content, 'utf-8')
      console.log(`[IDE] Generated declaration: ${declPath}`)
    } catch (e) {
      console.error(`[IDE] Failed to generate declaration for ${folder}:`, e)
    }
  }
}
