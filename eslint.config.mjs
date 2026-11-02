import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  {
    files: ['src/main/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@?electron([-/]|$)',
              message:
                'The core runs without Electron; it gets what it needs through its environment.'
            },
            {
              regex: '(^|/)(gui|api)(/|$)',
              message: 'The core knows neither the GUI nor the API above it.'
            },
            {
              regex: String.raw`^\.\.?(/\.\.)*/?(index)?$`,
              message: 'Inside the core, import the module itself, not the core index.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/main/gui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)core/',
              message: 'The GUI imports the core only through its index.'
            },
            { regex: '(^|/)api(/|$)', message: 'The GUI and the API do not know each other.' }
          ]
        }
      ]
    }
  },
  {
    files: ['src/main/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '(^|/)core/',
              message: 'Outside the core, import it only through its index.'
            }
          ]
        }
      ]
    }
  },
  eslintConfigPrettier
)
