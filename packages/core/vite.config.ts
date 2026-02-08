import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/public-api.ts'),
      name: 'FusionMap',
      fileName: (format) => {
        // 保持原有的文件名
        return 'index.' + (format === 'es' ? 'mjs' : 'umd.js');
      }
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ['maplibre-gl', 'gcoord', 'rxjs'],
      output: {
        globals: {
          'maplibre-gl': 'maplibregl',
          'gcoord': 'gcoord',
          'rxjs': 'rxjs'
        }
      }
    }
  },
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
      entryRoot: resolve(__dirname, 'src'),
      // 只包含需要的类型
      include: ['src/public-api.ts', 'src/FusionMap.ts'],
      // 排除内部实现
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.ts',
        'src/di/**',
        'src/services/**',
        'src/decorators/**'
      ]
    })
  ]
});
