import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    
    // We expect the router to bounce unauthenticated users back to login
    await expect(page).toHaveURL(/.*login/)
  })
})
