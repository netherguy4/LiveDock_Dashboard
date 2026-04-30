import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    // Playwright owns tests/e2e — vitest must not try to load them, otherwise
    // `test.describe` from @playwright/test blows up under vitest's runner.
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist', '.nuxt', '.output', 'tests/e2e/**'],
  },
})
