// vite.config.ts (dev hot reload + proxy inside Docker)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiUrl = process.env.VITE_API_URL || 'http://api:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // 0.0.0.0
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true
      }
    }
  }
})
