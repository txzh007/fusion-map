import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'fusion-map',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/__tests__/',
        '**/*.d.ts',
        '**/*.config.ts'
      ]
    }
  }
});
