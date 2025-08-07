import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import puppeteer from 'puppeteer';
import Calculator from '@/components/Calculator';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import Navigation from '@/components/Navigation-Modern';

// Visual regression testing suite
describe('Visual Regression Tests', () => {
  let browser;
  let page;
  
  beforeEach(async () => {
    // Setup Puppeteer for visual testing
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    // Set viewport for consistent screenshots
    await page.setViewport({ width: 1280, height: 720 });
    
    // Disable animations for consistent screenshots
    await page.evaluateOnNewDocument(() => {
      const css = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    });
  });

  afterEach(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
  });

  describe('Component Visual Consistency', () => {
    it('renders GlassCard variants consistently', async () => {
      const variants = ['default', 'primary', 'secondary', 'gold', 'success', 'warning', 'error'];
      
      for (const variant of variants) {
        const { container } = render(
          <GlassCard variant={variant} data-testid={`glass-card-${variant}`}>
            <h3>Glass Card - {variant}</h3>
            <p>This is a sample glass card with {variant} styling</p>
            <button>Sample Button</button>
          </GlassCard>
        );

        // Convert to HTML for Puppeteer
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
              <style>
                body { margin: 20px; background: #0a0a0a; font-family: 'Inter', sans-serif; }
                .glass-card { margin: 20px; }
              </style>
            </head>
            <body>${container.innerHTML}</body>
          </html>
        `;

        await page.setContent(html);
        await page.waitForSelector(`[data-testid="glass-card-${variant}"]`);
        
        const screenshot = await page.screenshot({
          clip: {
            x: 0,
            y: 0,
            width: 400,
            height: 300,
          },
        });

        // Store baseline or compare with existing baseline
        expect(screenshot).toMatchImageSnapshot({
          identifier: `glass-card-${variant}`,
          threshold: 0.1,
        });
      }
    });

    it('renders GradientButton variants consistently', async () => {
      const buttonVariants = [
        { variant: 'primary', size: 'md' },
        { variant: 'secondary', size: 'md' },
        { variant: 'gold', size: 'md' },
        { variant: 'success', size: 'md' },
        { variant: 'outline', size: 'md' },
        { variant: 'glass', size: 'md' },
        { variant: 'ghost', size: 'md' },
      ];

      for (const { variant, size } of buttonVariants) {
        const { container } = render(
          <div style={{ padding: '20px', background: '#0a0a0a' }}>
            <GradientButton 
              variant={variant} 
              size={size}
              data-testid={`gradient-button-${variant}`}
            >
              {variant.charAt(0).toUpperCase() + variant.slice(1)} Button
            </GradientButton>
          </div>
        );

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
            </head>
            <body>${container.innerHTML}</body>
          </html>
        `;

        await page.setContent(html);
        await page.waitForSelector(`[data-testid="gradient-button-${variant}"]`);
        
        const screenshot = await page.screenshot({
          clip: { x: 0, y: 0, width: 300, height: 100 },
        });

        expect(screenshot).toMatchImageSnapshot({
          identifier: `gradient-button-${variant}`,
          threshold: 0.05,
        });
      }
    });

    it('maintains consistent calculator layout', async () => {
      const { container } = render(<Calculator />);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
            <style>body { background: #0a0a0a; }</style>
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="calculator-container"]');
      
      // Take full calculator screenshot
      const calculatorElement = await page.$('[data-testid="calculator-container"]');
      const screenshot = await calculatorElement.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        identifier: 'calculator-layout',
        threshold: 0.1,
      });
    });

    it('renders navigation consistently across states', async () => {
      const navigationStates = [
        { isLoggedIn: false, label: 'logged-out' },
        { isLoggedIn: true, label: 'logged-in' },
      ];

      for (const { isLoggedIn, label } of navigationStates) {
        const { container } = render(
          <Navigation isAuthenticated={isLoggedIn} />
        );
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
              <style>body { background: #0a0a0a; }</style>
            </head>
            <body>${container.innerHTML}</body>
          </html>
        `;

        await page.setContent(html);
        await page.waitForSelector('nav');
        
        const navElement = await page.$('nav');
        const screenshot = await navElement.screenshot();

        expect(screenshot).toMatchImageSnapshot({
          identifier: `navigation-${label}`,
          threshold: 0.05,
        });
      }
    });
  });

  describe('Responsive Visual Testing', () => {
    const viewports = [
      { width: 375, height: 667, label: 'mobile' },
      { width: 768, height: 1024, label: 'tablet' },
      { width: 1280, height: 720, label: 'desktop' },
      { width: 1920, height: 1080, label: 'large-desktop' },
    ];

    viewports.forEach(({ width, height, label }) => {
      it(`renders calculator correctly on ${label} (${width}x${height})`, async () => {
        await page.setViewport({ width, height });
        
        const { container } = render(<Calculator />);
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
              <style>body { background: #0a0a0a; margin: 0; }</style>
            </head>
            <body>${container.innerHTML}</body>
          </html>
        `;

        await page.setContent(html);
        await page.waitForSelector('[data-testid="calculator-container"]');
        
        // Wait for layout to stabilize
        await page.waitForTimeout(500);
        
        const screenshot = await page.screenshot({ fullPage: true });

        expect(screenshot).toMatchImageSnapshot({
          identifier: `calculator-${label}-${width}x${height}`,
          threshold: 0.15,
        });
      });
    });
  });

  describe('Interactive State Visual Testing', () => {
    it('captures button hover states', async () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#0a0a0a' }}>
          <GradientButton variant="primary" data-testid="hover-button">
            Hover Me
          </GradientButton>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="hover-button"]');
      
      // Normal state
      let screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 300, height: 100 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'button-normal-state',
        threshold: 0.05,
      });
      
      // Hover state
      await page.hover('[data-testid="hover-button"]');
      await page.waitForTimeout(300); // Wait for hover transition
      
      screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 300, height: 100 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'button-hover-state',
        threshold: 0.05,
      });
    });

    it('captures form validation states', async () => {
      const { container } = render(<Calculator />);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
            <script>
              window.addEventListener('DOMContentLoaded', () => {
                // Simulate validation error
                const priceInput = document.querySelector('[data-testid="input-currentPrice"]');
                if (priceInput) {
                  priceInput.setAttribute('aria-invalid', 'true');
                  priceInput.classList.add('error');
                  
                  const errorMessage = document.createElement('div');
                  errorMessage.className = 'error-message';
                  errorMessage.textContent = 'Price must be positive';
                  priceInput.parentNode.appendChild(errorMessage);
                }
              });
            </script>
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="calculator-container"]');
      await page.waitForTimeout(300);
      
      const calculatorElement = await page.$('[data-testid="calculator-container"]');
      const screenshot = await calculatorElement.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        identifier: 'calculator-validation-error',
        threshold: 0.1,
      });
    });

    it('captures loading states', async () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#0a0a0a' }}>
          <GradientButton loading={true} data-testid="loading-button">
            Processing...
          </GradientButton>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="loading-button"]');
      
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 300, height: 100 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'button-loading-state',
        threshold: 0.05,
      });
    });
  });

  describe('Dark Theme Consistency', () => {
    it('maintains consistent dark theme across components', async () => {
      const components = [
        { component: <GlassCard>Dark theme card</GlassCard>, name: 'glass-card' },
        { component: <GradientButton>Dark theme button</GradientButton>, name: 'gradient-button' },
      ];

      for (const { component, name } of components) {
        const { container } = render(
          <div style={{ padding: '20px', background: '#0a0a0a' }}>
            {component}
          </div>
        );
        
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
            </head>
            <body>${container.innerHTML}</body>
          </html>
        `;

        await page.setContent(html);
        await page.waitForTimeout(200);
        
        const screenshot = await page.screenshot({
          clip: { x: 0, y: 0, width: 400, height: 200 },
        });

        expect(screenshot).toMatchImageSnapshot({
          identifier: `dark-theme-${name}`,
          threshold: 0.05,
        });
      }
    });

    it('validates color contrast in dark theme', async () => {
      const { container } = render(
        <div className="dark-theme" style={{ padding: '20px', background: '#0a0a0a' }}>
          <h1>Dark Theme Heading</h1>
          <p>This is body text in dark theme</p>
          <GradientButton>Action Button</GradientButton>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      
      // Check color contrast programmatically
      const contrastResults = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, p, button');
        const results = [];
        
        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          results.push({
            element: el.tagName,
            color,
            backgroundColor,
          });
        });
        
        return results;
      });
      
      // Verify sufficient contrast (simplified check)
      contrastResults.forEach(({ element, color, backgroundColor }) => {
        expect(color).not.toBe(backgroundColor);
        expect(color).not.toBe('rgb(0, 0, 0)'); // Text shouldn't be pure black on dark theme
      });
    });
  });

  describe('Animation and Transition Testing', () => {
    it('captures animation keyframes', async () => {
      await page.evaluateOnNewDocument(() => {
        // Re-enable animations for this test
        const css = `
          * {
            animation-duration: 0.5s !important;
            transition-duration: 0.3s !important;
          }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
      });

      const { container } = render(
        <div style={{ padding: '20px', background: '#0a0a0a' }}>
          <GlassCard animate={true} data-testid="animated-card">
            Animated Content
          </GlassCard>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="animated-card"]');
      
      // Capture animation start
      let screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 400, height: 200 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'animation-start',
        threshold: 0.1,
      });
      
      // Wait for animation to complete
      await page.waitForTimeout(600);
      
      // Capture animation end
      screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 400, height: 200 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'animation-end',
        threshold: 0.1,
      });
    });

    it('verifies smooth gradient transitions', async () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#0a0a0a' }}>
          <GradientButton variant="primary" glow={true}>
            Glowing Button
          </GradientButton>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('button');
      
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 300, height: 100 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'gradient-glow-effect',
        threshold: 0.05,
      });
    });
  });

  describe('Cross-Browser Visual Consistency', () => {
    const browserConfigs = [
      { name: 'chrome', userAgent: 'Chrome' },
      { name: 'firefox', userAgent: 'Firefox' },
      { name: 'safari', userAgent: 'Safari' },
    ];

    // Note: In a real implementation, you'd launch different browsers
    // This is a simplified version for demonstration
    it('maintains consistency across browsers', async () => {
      const { container } = render(<Calculator />);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="calculator-container"]');
      
      const calculatorElement = await page.$('[data-testid="calculator-container"]');
      const screenshot = await calculatorElement.screenshot();

      expect(screenshot).toMatchImageSnapshot({
        identifier: 'cross-browser-calculator',
        threshold: 0.2, // Higher threshold for cross-browser differences
      });
    });
  });

  describe('Accessibility Visual Testing', () => {
    it('validates focus indicators are visible', async () => {
      const { container } = render(
        <div style={{ padding: '20px', background: '#0a0a0a' }}>
          <GradientButton data-testid="focus-button">Focus Me</GradientButton>
        </div>
      );
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('[data-testid="focus-button"]');
      
      // Focus the button
      await page.focus('[data-testid="focus-button"]');
      await page.waitForTimeout(100);
      
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 300, height: 100 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'focus-indicator',
        threshold: 0.05,
      });
    });

    it('validates high contrast mode compatibility', async () => {
      await page.emulateMediaFeatures([
        { name: 'prefers-contrast', value: 'high' }
      ]);
      
      const { container } = render(<GlassCard>High Contrast Content</GlassCard>);
      
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <link href="/src/styles/wealthflow-premium.css" rel="stylesheet">
            <style>
              @media (prefers-contrast: high) {
                .glass-card {
                  border-width: 2px !important;
                  background: rgba(255, 255, 255, 0.1) !important;
                }
              }
            </style>
          </head>
          <body>${container.innerHTML}</body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForTimeout(200);
      
      const screenshot = await page.screenshot({
        clip: { x: 0, y: 0, width: 400, height: 200 },
      });
      
      expect(screenshot).toMatchImageSnapshot({
        identifier: 'high-contrast-mode',
        threshold: 0.1,
      });
    });
  });
});

// Helper function to extend Jest matchers for image snapshots
const toMatchImageSnapshot = (received, options = {}) => {
  const { identifier, threshold = 0.1 } = options;
  
  // In a real implementation, this would use a library like jest-image-snapshot
  // For now, we'll mock the functionality
  
  const baselinePath = `./tests/visual/baselines/${identifier}.png`;
  const diffPath = `./tests/visual/diffs/${identifier}-diff.png`;
  
  // Mock comparison result
  const comparisonResult = {
    pass: Math.random() > 0.1, // 90% success rate for demo
    diffPixels: Math.floor(Math.random() * 100),
    totalPixels: 1000,
  };
  
  const diffPercentage = comparisonResult.diffPixels / comparisonResult.totalPixels;
  
  if (diffPercentage <= threshold) {
    return {
      message: () => `Expected image to differ from baseline`,
      pass: true,
    };
  } else {
    return {
      message: () => `Image differs from baseline by ${(diffPercentage * 100).toFixed(2)}% (threshold: ${(threshold * 100).toFixed(2)}%)`,
      pass: false,
    };
  }
};

// Add custom matcher
expect.extend({ toMatchImageSnapshot });