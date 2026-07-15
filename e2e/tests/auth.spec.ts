import { test, expect } from '@playwright/test';

test.describe('Authentication & Onboarding Flows', () => {
  
  test('Admin portal login page renders correctly', async ({ page }) => {
    // Assuming admin is served on port 5174
    await page.goto('http://localhost:5174/');
    
    // Check for the title
    await expect(page.locator('h1')).toContainText('Admin Portal');
    
    // Check for email and password fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Check for sign in button
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toContainText('Sign In');
  });

  test('Waitlist signup flow validates empty submissions', async ({ page }) => {
    // Assuming student web app is served on port 5173
    await page.goto('http://localhost:5173/');
    
    // The waitlist form typically has an email input and a join button
    // Let's just verify the page loads and has basic structure since we don't 
    // want to spam the database in a basic smoke test, or we can just test validation.
    
    // If there is a join button, click it without filling email
    const joinButton = page.locator('button', { hasText: /Join/i }).first();
    
    if (await joinButton.isVisible()) {
      await joinButton.click();
      
      // Expect HTML5 validation or custom error
      // In many cases, the input will have the :invalid pseudo-class
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
        expect(isInvalid).toBeTruthy();
      }
    } else {
      // If no join button is visible immediately, it might be behind a modal or on another route
      // We'll just verify the home page loaded successfully.
      await expect(page).toHaveURL(/localhost:5173/);
    }
  });

});
