import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))
const repo = path.resolve(root, '../..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@cyberpatriot/ops-catalog': path.resolve(repo, 'packages/ops-catalog/src/index.ts'),
      '@cyberpatriot/ops-engine/demo': path.resolve(repo, 'packages/ops-engine/src/demo/browser.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
