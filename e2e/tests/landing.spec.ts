import { test, expect } from '@playwright/test'

test('landing page loads and displays hero', async ({ page }) => {
  await page.goto('/')
  
  // Verify the hero text exists
  await expect(page.getByText('The OS for Nigerian Students')).toBeVisible()
  
  // Verify waitlist input exists
  await expect(page.getByPlaceholder('Enter your student email')).toBeVisible()
})
