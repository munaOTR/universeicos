import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
  },
  resolve: {
    alias: {
      '@universe/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@universe/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@universe/constants': path.resolve(__dirname, '../../packages/constants/src'),
      '@universe/hooks': path.resolve(__dirname, '../../packages/hooks/src'),
      '@universe/types': path.resolve(__dirname, '../../packages/types/src'),
      '@universe/email': path.resolve(__dirname, '../../packages/email/src'),
      '@universe/validation': path.resolve(__dirname, '../../packages/validation/src'),
      '@universe/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
})
