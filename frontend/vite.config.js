import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Load .env from the project root (one level above frontend/)
  envDir: '../',
  server: {
    host: '0.0.0.0',           // Bind to all interfaces inside Docker
    allowedHosts: ['naannow.ksdev.me'],  // Allow Cloudflare tunnel domain
  },
})
