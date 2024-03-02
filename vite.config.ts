import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [],
  base: '/crypto-pulse/',
  server: { port: 3000 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ss: 'test.html',
      },
    },
  },
})
