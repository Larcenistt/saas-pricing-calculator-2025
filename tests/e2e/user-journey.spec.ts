import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('User Journey - Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('New visitor completes full journey from landing to purchase', async ({ page }) => {
    // Step 1: Land on homepage
    await expect(page).toHaveTitle(/SaaS Pricing Calculator/);
    await expect(page.locator('h1')).toContainText(/Optimize Your SaaS Pricing/);

    // Step 2: Navigate to calculator
    await page.click('text=Try Calculator');
    await page.waitForURL('**/calculator');

    // Step 3: Fill calculator inputs
    await page.fill('[data-testid="input-currentPrice"]', '99');
    await page.fill('[data-testid="input-customers"]', '500');
    await page.fill('[data-testid="input-churnRate"]', '5');
    await page.fill('[data-testid="input-competitorPrice"]', '120');
    await page.fill('[data-testid="input-cac"]', '300');

    // Step 4: Calculate pricing
    await page.click('button:has-text("Calculate Optimal Pricing")');
    
    // Wait for results
    await page.waitForSelector('[data-testid="results-section"]');
    
    // Verify results are displayed
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();

    // Step 5: Export to PDF
    await page.click('button:has-text("Export to PDF")');
    
    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export to PDF")')
    ]);
    
    expect(download.suggestedFilename()).toContain('pricing-analysis');

    // Step 6: Navigate to pricing page
    await page.click('nav >> text=Pricing');
    await page.waitForURL('**/pricing');

    // Step 7: Click buy button
    await page.click('button:has-text("Get Instant Access - $99")');
    
    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com|buy\.stripe\.com/, { timeout: 10000 });
  });

  test('Registered user workflow', async ({ page }) => {
    // Step 1: Navigate to login
    await page.click('text=Sign In');
    await page.waitForURL('**/login');

    // Step 2: Register new account
    await page.click('text=Sign up for free');
    await page.waitForURL('**/register');

    const testEmail = `test${Date.now()}@example.com`;
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');
    await page.check('[name="agreeToTerms"]');
    
    await page.click('button:has-text("Create Account")');
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back');

    // Step 3: Create and save calculation
    await page.click('text=New Calculation');
    await page.waitForURL('**/calculator');

    await page.fill('[data-testid="input-currentPrice"]', '149');
    await page.fill('[data-testid="input-customers"]', '1000');
    await page.fill('[data-testid="input-churnRate"]', '3');
    await page.fill('[data-testid="input-competitorPrice"]', '199');
    await page.fill('[data-testid="input-cac"]', '500');

    await page.click('button:has-text("Calculate")');
    await page.waitForSelector('[data-testid="results-section"]');

    // Save calculation
    await page.click('button:has-text("Save Calculation")');
    await page.fill('[placeholder="Enter calculation name"]', 'Q1 2025 Pricing Strategy');
    await page.click('button:has-text("Save")');

    // Verify saved
    await expect(page.locator('text=Calculation saved successfully')).toBeVisible();

    // Step 4: View saved calculations
    await page.click('nav >> text=Dashboard');
    await page.waitForURL('**/dashboard');
    
    await expect(page.locator('text=Q1 2025 Pricing Strategy')).toBeVisible();

    // Step 5: Share calculation
    await page.click('button[aria-label="Share calculation"]');
    await expect(page.locator('text=Share link copied')).toBeVisible();
  });

  test('Mobile responsive experience', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);

    // Check mobile menu
    await page.click('[aria-label="Open menu"]');
    await expect(page.locator('.mobile-menu')).toBeVisible();

    // Navigate to calculator
    await page.click('.mobile-menu >> text=Calculator');
    await page.waitForURL('**/calculator');

    // Check mobile layout
    await expect(page.locator('.mobile-layout')).toBeVisible();

    // Fill form on mobile
    await page.fill('[data-testid="input-currentPrice"]', '79');
    await page.fill('[data-testid="input-customers"]', '200');
    await page.fill('[data-testid="input-churnRate"]', '8');
    
    // Scroll to see more fields
    await page.evaluate(() => window.scrollBy(0, 300));
    
    await page.fill('[data-testid="input-competitorPrice"]', '99');
    await page.fill('[data-testid="input-cac"]', '250');

    // Calculate
    await page.click('button:has-text("Calculate")');
    
    // Check results are visible on mobile
    await page.waitForSelector('[data-testid="results-section"]');
    await expect(page.locator('.mobile-card')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('Login with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'WrongPassword');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('Password reset flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.click('text=Forgot password?');
    await page.waitForURL('**/forgot-password');

    await page.fill('[name="email"]', 'user@example.com');
    await page.click('button:has-text("Send Reset Link")');

    await expect(page.locator('text=Reset instructions sent')).toBeVisible();
  });

  test('Protected route redirect', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('h2')).toContainText('Welcome Back');
  });
});

test.describe('Calculator Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator`);
  });

  test('Advanced options toggle', async ({ page }) => {
    // Initially hidden
    await expect(page.locator('[data-testid="input-targetMargin"]')).not.toBeVisible();

    // Toggle advanced
    await page.click('button:has-text("Advanced Options")');
    
    // Now visible
    await expect(page.locator('[data-testid="input-targetMargin"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-marketGrowthRate"]')).toBeVisible();

    // Fill advanced fields
    await page.fill('[data-testid="input-targetMargin"]', '75');
    await page.fill('[data-testid="input-marketGrowthRate"]', '20');
  });

  test('Input validation messages', async ({ page }) => {
    // Try to calculate without inputs
    await page.click('button:has-text("Calculate")');
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();

    // Invalid price
    await page.fill('[data-testid="input-currentPrice"]', '-50');
    await page.click('button:has-text("Calculate")');
    await expect(page.locator('text=Price must be positive')).toBeVisible();

    // Invalid churn rate
    await page.fill('[data-testid="input-currentPrice"]', '99');
    await page.fill('[data-testid="input-churnRate"]', '150');
    await page.click('button:has-text("Calculate")');
    await expect(page.locator('text=Churn rate must be between 0 and 100')).toBeVisible();
  });

  test('Comparison mode', async ({ page }) => {
    // Fill first calculation
    await page.fill('[data-testid="input-currentPrice"]', '99');
    await page.fill('[data-testid="input-customers"]', '100');
    await page.fill('[data-testid="input-churnRate"]', '5');
    await page.fill('[data-testid="input-competitorPrice"]', '120');
    await page.fill('[data-testid="input-cac"]', '300');

    await page.click('button:has-text("Calculate")');
    await page.waitForSelector('[data-testid="results-section"]');

    // Enable comparison
    await page.click('button:has-text("Compare Scenarios")');
    
    // Fill second calculation
    await page.fill('[data-testid="input-currentPrice-2"]', '149');
    await page.fill('[data-testid="input-customers-2"]', '150');
    await page.fill('[data-testid="input-churnRate-2"]', '3');

    await page.click('button:has-text("Calculate Comparison")');
    
    // Check comparison results
    await expect(page.locator('text=Scenario 1')).toBeVisible();
    await expect(page.locator('text=Scenario 2')).toBeVisible();
    await expect(page.locator('text=% Difference')).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000); // Should load in under 3 seconds

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        LCP: performance.getEntriesByType('largest-contentful-paint').pop()?.startTime,
      };
    });

    expect(metrics.FCP).toBeLessThan(1800); // FCP under 1.8s
    expect(metrics.LCP).toBeLessThan(2500); // LCP under 2.5s
  });

  test('Calculator response time', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator`);

    // Fill inputs
    await page.fill('[data-testid="input-currentPrice"]', '99');
    await page.fill('[data-testid="input-customers"]', '1000');
    await page.fill('[data-testid="input-churnRate"]', '5');
    await page.fill('[data-testid="input-competitorPrice"]', '120');
    await page.fill('[data-testid="input-cac"]', '300');

    const startTime = Date.now();
    await page.click('button:has-text("Calculate")');
    await page.waitForSelector('[data-testid="results-section"]');
    const calcTime = Date.now() - startTime;

    expect(calcTime).toBeLessThan(500); // Calculation should complete in under 500ms
  });
});

test.describe('Accessibility Tests', () => {
  test('Keyboard navigation', async ({ page }) => {
    await page.goto(BASE_URL);

    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/features');

    // Navigate to calculator with Enter
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    await page.waitForURL('**/calculator');
  });

  test('Screen reader compatibility', async ({ page }) => {
    await page.goto(`${BASE_URL}/calculator`);

    // Check ARIA labels
    await expect(page.locator('form')).toHaveAttribute('aria-label', 'Pricing Calculator Form');
    await expect(page.locator('[data-testid="results-section"]')).toHaveAttribute('aria-live', 'polite');

    // Check form labels
    const priceInput = page.locator('[data-testid="input-currentPrice"]');
    const labelFor = await priceInput.getAttribute('id');
    await expect(page.locator(`label[for="${labelFor}"]`)).toBeVisible();
  });

  test('Color contrast compliance', async ({ page }) => {
    await page.goto(BASE_URL);

    // Inject axe-core for accessibility testing
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' });

    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run().then(results => resolve(results));
      });
    });

    // @ts-ignore
    const violations = results.violations.filter(v => v.id === 'color-contrast');
    expect(violations).toHaveLength(0);
  });
});

test.describe('Error Recovery', () => {
  test('Network error handling', async ({ page, context }) => {
    // Block API calls
    await context.route('**/api/**', route => route.abort());

    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'Password123');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('text=Network error')).toBeVisible();
    
    // Retry button should be available
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('Session expiry handling', async ({ page }) => {
    // Simulate expired session
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Clear localStorage to simulate expired token
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    });

    // Try to perform an action
    await page.reload();

    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.locator('text=Session expired')).toBeVisible();
  });
});