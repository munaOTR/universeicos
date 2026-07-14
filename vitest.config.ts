import { defineConfig } from 'vitest/config'

/**
 * Root Vitest configuration.
 * Unit tests are defined as projects pointing to individual app/package configs.
 * E2e tests are run separately via `pnpm test:e2e` using Playwright.
 */
export default defineConfig({
  test: {
    projects: [
      'packages/ui/vitest.config.ts',
      'apps/web/vitest.config.ts',
      'apps/admin/vitest.config.ts',
    ],
  },
})
