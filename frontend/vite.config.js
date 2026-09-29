import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['jspdf', 'canvg', 'html2canvas', 'dompurify'],
  },
  build: {
    rollupOptions: {
      external: ['canvg', 'html2canvas', 'dompurify'],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    fileParallelism: false,
  },
})
