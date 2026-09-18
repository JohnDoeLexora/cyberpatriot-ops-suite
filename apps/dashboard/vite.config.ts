import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { cpOpsApiPlugin } from './vite-plugin-api.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
const repo = path.resolve(root, '../..')

export default defineConfig({
  plugins: [react(), tailwindcss(), cpOpsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@cyberpatriot/ops-catalog': path.resolve(repo, 'packages/ops-catalog/src/index.ts'),
      '@cyberpatriot/ops-engine/demo': path.resolve(repo, 'packages/ops-engine/src/demo/browser.ts'),
    },
  },
  ssr: {
    external: ['express', 'cors'],
  },
})
