import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {

      '/api': {
        target: 'http://localhost:3000',
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
