import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Two suites.
 *  - tests/unit: pure modules (mode, cookies, CSRF, session clock, reason
 *    validation, middleware against a mock backend). No build needed.
 *  - tests/integration: the production build under `next start`, in basic and
 *    individual mode, against the contract mock in tests/support. Needs
 *    `npm run build` first; `npm run test:integration` does both.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // The real package throws outside a React Server Components build.
      'server-only': fileURLToPath(new URL('./tests/support/server-only.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
