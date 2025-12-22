import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'EasyMap',
      fileName: 'index'
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['maplibre-gl', 'gcoord'],
      output: {
        globals: {
          'maplibre-gl': 'maplibregl',
          'gcoord': 'gcoord'
        }
      }
    }
  },
  plugins: [dts({ rollupTypes: true })]
});
