import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  build: {
    rollupOptions: {
      output: {
        // bibliotecas em arquivos próprios: o navegador guarda em cache e a primeira tela baixa menos
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules\/(recharts|d3-|victory-vendor|decimal\.js|internmap|es-toolkit|immer|reselect|redux|@reduxjs)/.test(id)) return 'graficos'
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'react'
          if (/node_modules\/(@radix-ui|cmdk|vaul|sonner|motion|framer-motion|motion-dom|motion-utils|@floating-ui)/.test(id)) return 'interface'
        },
      },
    },
  },
})
