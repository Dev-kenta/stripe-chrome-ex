const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

const isWatch = process.argv.includes('--watch')

const sharedOptions = {
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
}

async function build() {
  fs.mkdirSync('dist', { recursive: true })

  // Copy static files
  fs.copyFileSync('src/manifest.json', 'dist/manifest.json')
  fs.copyFileSync('src/popup/index.html', 'dist/popup.html')

  // Copy icons
  const iconsDir = 'icons'
  if (fs.existsSync(iconsDir)) {
    for (const file of fs.readdirSync(iconsDir)) {
      fs.copyFileSync(path.join(iconsDir, file), path.join('dist', file))
    }
  }

  const entryPoints = [
    { in: 'src/popup/popup.ts', out: 'dist/popup' },
    { in: 'src/background/service-worker.ts', out: 'dist/service-worker' },
  ]

  if (isWatch) {
    const contexts = await Promise.all(
      entryPoints.map(({ in: entryPoint, out: outfile }) =>
        esbuild.context({ ...sharedOptions, entryPoints: [entryPoint], outfile: outfile + '.js' })
      )
    )
    await Promise.all(contexts.map(ctx => ctx.watch()))
    console.log('Watching for changes...')
  } else {
    await Promise.all(
      entryPoints.map(({ in: entryPoint, out: outfile }) =>
        esbuild.build({ ...sharedOptions, entryPoints: [entryPoint], outfile: outfile + '.js' })
      )
    )
    console.log('Build complete!')
  }
}

build().catch(err => {
  console.error(err)
  process.exit(1)
})