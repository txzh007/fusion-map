import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import nodePlugin from 'eslint-plugin-node';
import promisePlugin from 'eslint-plugin-promise';
import globals from 'globals';

export default [
  // JavaScript 配置
  js.configs.recommended,
  
  // TypeScript 配置
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
      'node': nodePlugin,
      'promise': promisePlugin
    },
    rules: {
      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-interface': 'warn',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/ban-types': 'off',
      
      // Import 规则
      'import/no-unresolved': 'off',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      'import/no-duplicates': 'warn',
      
      // Node 规则
      'node/no-missing-import': 'off',
      'node/no-unpublished-import': 'off',
      
      // Promise 规则
      'promise/always-return': 'warn',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'warn',
      
      // 基础规则
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-empty': 'warn',
      'no-duplicate-imports': 'error',
      'no-prototype-builtins': 'off',
      
      // 代码风格
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'never'],
      'max-len': ['warn', { code: 120, ignoreComments: true }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      
      // 最佳实践
      'eqeqeq': 'error',
      'curly': 'error',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-else-return': 'warn',
      'no-multi-spaces': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }]
    }
  },
  
  // 测试文件配置
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      'no-undef': 'off'
    }
  },
  
  // 配置文件配置
  {
    files: ['**/*.config.ts', '**/*.config.js', 'eslint.config.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },
  
  // 忽略文件
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.d.ts',
      '**/*.js.map',
      '**/*.mjs',
      'examples/**',
      'packages/core/node_modules/**',
      'packages/core/dist/**'
    ]
  }
];
