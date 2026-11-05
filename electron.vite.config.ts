import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const alias = { '@': resolve('src') }

export default defineConfig({
  main: {
    resolve: { alias },
    build: {
      externalizeDeps: { exclude: ['conf'] }
    }
  },
  preload: {
    resolve: { alias }
  },
  renderer: {
    resolve: { alias },
    plugins: [react(), tailwindcss()]
  }
})
