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
      // Ensure folder exists
      try {
        await fs.access(folderPath)
      } catch {
        return // Folder doesn't exist yet, do nothing
      }

      const files = await fs.readdir(folderPath)

      let imports = ''
      let exports = 'export default {\n'

      for (const file of files) {
        if (file.startsWith('.')) continue // 숨김 파일 무시

        if (file.endsWith('.ts')) {
          const baseName = path.basename(file, '.ts')
          // 변수명으로 안전하게 사용할 수 있도록 변환
          const importName = baseName.replace(/[^a-zA-Z0-9_]/g, '_')
          imports += `import ${importName} from '../${folder}/${baseName}'\n`
          exports += `  ...${importName},\n`
        } else {
          // 미디어 파일(png, wav, mp3 등)의 경우 파일 경로를 직접 매핑
          const baseName = path.parse(file).name
          // 파일명에 특수문자가 있을 수 있으므로 따옴표로 감쌈
          exports += `  '${baseName}': './${folder}/${file}',\n`
        }
      }

      exports += '}\n'

      const content = `${imports}\n${exports}`
      
      // Ensure declarations folder exists
      await fs.mkdir(path.dirname(declPath), { recursive: true })
      await fs.writeFile(declPath, content, 'utf-8')
      console.log(`[IDE] Generated declaration: ${declPath}`)
    } catch (e) {
      console.error(`[IDE] Failed to generate declaration for ${folder}:`, e)
    }
  }
}
