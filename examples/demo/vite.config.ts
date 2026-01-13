import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  // 必须开启 decorator 支持的 esbuild 配置 (Vite 默认使用 esbuild)
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true
      }
    }
  }
});
