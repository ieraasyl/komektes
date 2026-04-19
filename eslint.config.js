import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default defineConfig(
  {
    ignores: ['dist', '.wrangler', 'src/routeTree.gen.ts', 'worker-configuration.d.ts', 'drizzle'],
  },

  eslint.configs.recommended,
  tseslint.configs.recommended,

  {
    ...reactPlugin.configs.flat['jsx-runtime'],
    files: ['**/*.{ts,tsx}'],
  },

  {
    ...reactHooks.configs.flat.recommended,
    files: ['**/*.{ts,tsx}'],
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-refresh': reactRefresh,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',
    },
  },

  prettierConfig,

  {
    files: ['src/routes/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
