import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['unmammalian-giovani-nonpestilential.ngrok-free.dev'],
  },
})