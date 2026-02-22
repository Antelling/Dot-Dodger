import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'esnext',
    outDir: 'docs',
    sourcemap: true
  },
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: false
    }
  }
})
