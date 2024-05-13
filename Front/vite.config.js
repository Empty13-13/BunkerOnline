import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
  export default defineConfig({
    VUE_PROD_DEVTOOLS: JSON.stringify(true),
  plugins: [
    VueDevTools(),
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
})
