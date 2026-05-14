import { createServer, ViteDevServer, InlineConfig } from 'vite'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export class PreviewService {
  private server: ViteDevServer | null = null
  private port: number = 5173

  public async start(projectPath: string): Promise<string> {
    await this.stop()

    try {
      // IDE 내부에 설치된 fumika 엔진의 경로를 찾아서 Alias로 주입
      // 이렇게 하면 사용자가 별도로 패키지를 설치하지 않아도 됨
      let fumikaPath = ''
      try {
        fumikaPath = require.resolve('fumika')
      } catch (e) {
        console.warn('Could not resolve fumika package directly. Falling back.')
      }

      const alias: Record<string, string> = fumikaPath ? { 'fumika': fumikaPath } : {}

      const config: InlineConfig = {
        root: projectPath,
        server: {
          port: this.port,
          strictPort: false,
        },
        resolve: {
          alias
        },
        optimizeDeps: {
          include: fumikaPath ? ['fumika'] : []
        }
      }

      this.server = await createServer(config)

      await this.server.listen()
      
      const address = this.server.httpServer?.address()
      if (address && typeof address === 'object') {
        const url = `http://localhost:${address.port}`
        console.log(`[Preview] Server started at ${url}`)
        return url
      }
      return `http://localhost:${this.port}`
    } catch (e) {
      console.error('[Preview] Failed to start vite server:', e)
      throw e
    }
  }

  public async stop(): Promise<void> {
    if (this.server) {
      await this.server.close()
      this.server = null
      console.log('[Preview] Server stopped')
    }
  }
}
