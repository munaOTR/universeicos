import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Unit tests only — Playwright e2e is run separately via `pnpm test:e2e`
  'packages/ui/vitest.config.ts',
  'apps/web/vitest.config.ts',
  'apps/admin/vitest.config.ts',
])
