import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: "3000",
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
      },
    },
  },
  plugins: [react(), svgr()],
  resolve: {
    alias: {
        '@api': path.resolve(__dirname, './src/api'),
        '@config': path.resolve(__dirname, './src/config'),
        '@components': path.resolve(__dirname, './src/components'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@state': path.resolve(__dirname, './src/state'),
        '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
