import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/core/db/schema/index.ts',
  out: './src/main/core/db/migrations',
  casing: 'snake_case'
})
