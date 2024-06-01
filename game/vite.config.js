import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
      },
    }
  },
  build: {
    outDir: '../dist/game',
    emptyOutDir: true
  },
})
