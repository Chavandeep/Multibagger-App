import { build } from 'esbuild'
import { readdirSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const functionsDir = path.resolve('netlify/functions')
const outDir = path.resolve('netlify-functions-bundled')

mkdirSync(outDir, { recursive: true })

const entryFiles = readdirSync(functionsDir)
  .filter((f) => f.endsWith('.js') && !f.startsWith('_'))
  .map((f) => path.join(functionsDir, f))

console.log('Bundling functions:', entryFiles.map((f) => path.basename(f)))

await build({
  entryPoints: entryFiles,
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outdir: outDir,
  external: [], // bundle everything — self-contained, no node_modules needed at deploy time
  logLevel: 'info',
})

// Root package.json has "type": "module" (needed for the Vite frontend),
// which would otherwise make Node treat these .js files as ES modules and
// silently break `exports.handler`. This local override fixes that for
// just this folder.
writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'commonjs' }, null, 2))

console.log('Done. Bundled functions in', outDir)
