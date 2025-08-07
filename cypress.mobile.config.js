import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/mobile/**/*.cy.{js,jsx,ts,tsx}',
    
    // Mobile device configurations
    viewportWidth: 375,
    viewportHeight: 667,
    
    setupNodeEvents(on, config) {
      // Mobile-specific setup
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          // Simulate mobile device
          launchOptions.args.push('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          return launchOptions;
        }
      });

      return config;
    },
  },

  // Different mobile viewports for testing
  viewportPresets: {
    'iphone-se': { width: 375, height: 667 },
    'iphone-12': { width: 390, height: 844 },
    'iphone-12-pro-max': { width: 428, height: 926 },
    'samsung-galaxy-s20': { width: 360, height: 800 },
    'ipad': { width: 768, height: 1024 },
    'ipad-pro': { width: 1024, height: 1366 },
  },
});