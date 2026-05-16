import { createServer, ViteDevServer, InlineConfig } from 'vite'

export class PreviewService {
  private server: ViteDevServer | null = null
  private port: number = 5173

  public async start(projectPath: string, targetScene?: string): Promise<string> {
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
                // inject debugMode = true before novel.load()
                let newCode = code.replace(/await novel\.load\(\)/g, 'novel.debugMode = true;\n  await novel.load()')
                if (targetScene) {
                  // as any 같은 TS 문법을 브라우저 런타임에 주입하면 Syntax Error가 발생할 수 있으므로 제거
                  newCode = newCode.replace(/novel\.start\([^)]+\)/, `novel.start('${targetScene}')`)
                }
                console.log('[Preview] Transformed main.ts:', newCode)
                return newCode
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
