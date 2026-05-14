import esbuild from 'esbuild';

async function build() {
  try {
    console.log('Starting build...');

    await Promise.all([
      esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outfile: 'dist/index.cjs',
        format: 'cjs',
        platform: 'browser',
        target: 'esnext'
      }),
      esbuild.build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outfile: 'dist/index.mjs',
        format: 'esm',
        platform: 'browser',
        target: 'esnext'
      })
    ]);
    console.log('✓ JS build complete.');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
