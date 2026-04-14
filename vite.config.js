// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { tenantIndexSeoPlugin } from './vite-plugin-tenant-index-seo.mjs'

export default defineConfig({
  plugins: [react(), tenantIndexSeoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
