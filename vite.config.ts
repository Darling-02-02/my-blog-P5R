import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/my-blog-P5R/',
  cacheDir: '.vite-cache',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'router-vendor': ['react-router-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
