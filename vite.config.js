import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {

      '/api': {
        target: 'https://mechanic-setu-backend.vercel.app',
        changeOrigin: true,
        secure: true,
      },
      
      '/ws': {
        target: 'wss://mechanic-setu.onrender.com',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
