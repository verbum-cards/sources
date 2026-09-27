import path from 'node:path';
import { fileURLToPath } from 'node:url';
import eslintReact from '@eslint-react/eslint-plugin';
import jsEslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import promisePlugin from 'eslint-plugin-promise';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      'apps/mobile/tests/__snapshots__/**',
      'data/**',
      'packages/tokens/tokens.json',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      '.env*',
      '!.env.example',
    ],
  },
  jsEslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tsEslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir },
    },
  },
  {
    languageOptions: { globals: { ...globals.node } },
    plugins: { promise: promisePlugin },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'prefer-template': 'warn',
      'no-console': 'warn',
      // async/await везде вместо .then()/.catch()/.finally().
      'promise/prefer-await-to-then': 'error',
      // Пустая строка перед return, если до него в блоке уже что-то было
      // (если return — первая строка блока, правило не требует ничего).
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
    },
  },
  // node:test: test(...) не награждает await на верхнем уровне — раннер сам
  // собирает зарегистрированные тесты, это не забытый await, а нормальный API.
  {
    files: ['**/tests/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  // Тестовые моки часто реализуют async-сигнатуру интерфейса (fetch, DbExecutor)
  // без внутреннего await — это форма, а не забытый await.
  {
    files: ['**/tests/**/*.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  // Служебные сборочные скрипты — консоль тут не диагностика, а ожидаемый вывод.
  {
    files: ['**/build.mjs', '**/scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  // apps/mobile — React Native (Expo): react-hooks + eslint-react, без react-refresh
  // (это плагин под Vite Fast Refresh; Metro в Expo делает Fast Refresh сам).
  {
    files: ['apps/mobile/**/*.{ts,tsx}'],
    plugins: {
      ...eslintReact.configs['recommended-typescript'].plugins,
      'react-hooks': reactHooksPlugin,
    },
    settings: eslintReact.configs['recommended-typescript'].settings,
    rules: {
      ...eslintReact.configs['recommended-typescript'].rules,
      ...reactHooksPlugin.configs['recommended-latest'].rules,
      'react-x/no-unescaped-entities': 'off', // тексты интерфейса всё равно только через i18n
      // Новое строгое правило из eslint-plugin-react-hooks@7: конфликтует с
      // обычным паттерном «загрузить данные в эффекте → setState» (useQuery и
      // все экраны, которые от него зависят). Не отключаем совсем — видно в
      // отчёте, но не блокирует CI, пока не решим переписывать эти места.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  prettier,
]);
