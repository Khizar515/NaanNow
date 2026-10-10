import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all interfaces (required for Docker + mobile access)
    proxy: {
      '/api': {
        target: 'http://backend:5000', // Docker service name resolves internally
        changeOrigin: true,
      },
    },
  },
})
