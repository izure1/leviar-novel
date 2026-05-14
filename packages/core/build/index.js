import esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

const sharedConfig = {
  bundle: true,
  platform: 'browser',
  target: 'esnext',
}

const configs = [
  { ...sharedConfig, entryPoints: ['src/index.ts'], outfile: 'dist/index.cjs', format: 'cjs' },
  { ...sharedConfig, entryPoints: ['src/index.ts'], outfile: 'dist/index.mjs', format: 'esm' },
]

async function build() {
  try {
    if (watch) {
      const contexts = await Promise.all(configs.map(c => esbuild.context(c)))
      await Promise.all(contexts.map(ctx => ctx.watch()))
      console.log('✓ Watching core for changes...')
    } else {
      console.log('Starting build...')
      await Promise.all(configs.map(c => esbuild.build(c)))
      console.log('✓ JS build complete.')
    }
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()
