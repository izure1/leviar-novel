import { createServer, ViteDevServer, InlineConfig } from 'vite'

export class PreviewService {
  private server: ViteDevServer | null = null
  private port: number = 5173

  public async start(projectPath: string): Promise<string> {
    await this.stop()

    try {
      const config: InlineConfig = {
        root: projectPath,
        server: {
          port: this.port,
          strictPort: false,
        },
        plugins: [
          {
            name: 'fumika-debug-injector',
            transform(code, id) {
              if (id.endsWith('main.ts') || id.endsWith('main.js')) {
                // inject debugMode = true after Novel instance is created
                return code.replace(/(const novel = new Novel\(.*?\))/g, '$1\n  Novel.debugMode = true\n')
              }
              return null
            }
          }
        ]
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
