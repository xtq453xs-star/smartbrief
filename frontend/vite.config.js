import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    allowedHosts: [
      'smartbrief.jp', 
      'api.smartbrief.jp', 
      'n8n.smartbrief.jp', 
    ],
    
    proxy: {
      '/api': {
        // ★★★ 修正箇所：localhost を Docker サービス名に変更 ★★★
        target: 'http://billing-api:8080', // コンテナ名で指定する
        changeOrigin: true,              
        secure: false,                   
      },
    },
  },
});