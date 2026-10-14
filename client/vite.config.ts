import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: "/pool_/",
  plugins: [react()],
  server: {
    port: ,
    proxy: {
      '/api': {
        target: 'https://pool-funds-server.onrender.com/',
        changeOrigin: true,
      },
    },
  },
});

