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
          paths: [
            {
              name: 'electron',
              importNames: [
                'BrowserWindow',
                'dialog',
                'globalShortcut',
                'ipcMain',
                'Menu',
                'nativeImage',
                'nativeTheme',
                'Notification',
                'screen',
                'Tray',
                'webContents'
              ],
              message: 'The core knows no GUI; it belongs to src/main/gui/.'
            }
          ],
          patterns: [
            {
              regex: '(^|/)(gui|api)(/|$)',
              message: 'The core knows neither the GUI nor the API above it.'
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
              regex: '(^|/)core/db(/|$)',
              message: 'The GUI uses the domain and app modules, never the database directly.'
            },
            { regex: '(^|/)api(/|$)', message: 'The GUI and the API do not know each other.' }
          ]
        }
      ]
    }
  },
  eslintConfigPrettier
)
