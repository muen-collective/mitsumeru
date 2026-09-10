import { defineConfig } from 'electron-vite'
import { builtinModules } from 'node:module'
import { resolve } from 'node:path'

// Everything here is explicit on purpose — no reliance on electron-vite's
// defaults, which vary with the node/npm on PATH (a conda shell failed entry
// inference with "An entry point is required in the electron vite main config").
//
// - input: the entry files, stated outright.
// - external: electron + node builtins. electron-vite sets ssr.noExternal=true
//   for the main process, so without this list electron's own index.js gets
//   inlined and the app dies at startup with
//   "Electron failed to install correctly" (getElectronPath).
// - cjs + entryFileNames: sandbox:true preloads must be CommonJS, and
//   package.json "main" points at out/main/index.js.
const external = ['electron', /^electron\/.+/, ...builtinModules.flatMap((m) => [m, `node:${m}`])]

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external,
        input: { index: resolve('src/main/index.ts') },
        output: { format: 'cjs', entryFileNames: 'index.js' }
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        external,
        input: { index: resolve('src/preload/index.ts') },
        output: { format: 'cjs', entryFileNames: 'index.js' }
      }
    }
  },
  renderer: {
    root: resolve('src/renderer'),
    build: {
      outDir: resolve('out/renderer'),
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    }
  }
})
