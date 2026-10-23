import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const parentEnv = loadEnv(mode, '../', '');
  const apiBase = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || parentEnv.VITE_API_BASE_URL || '';

  return {
    plugins: [react()],
    // Load .env from the project root (one level above frontend/)
    envDir: '../',
    server: {
      host: '0.0.0.0',           // Bind to all interfaces inside Docker
      allowedHosts: ['naannow.ksdev.me', '.ksdev.me', 'localhost'],  // Allow Cloudflare tunnel domains
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBase)
    }
  }
})

