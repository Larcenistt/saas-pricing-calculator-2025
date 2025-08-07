import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    setupNodeEvents(on, config) {
      // Lighthouse audit plugin
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--no-sandbox');
          return launchOptions;
        }
      });

      // Percy visual testing
      if (config.env.percy) {
        require('@percy/cypress/task')(on);
      }

      // Code coverage
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },

    env: {
      coverage: true,
      codeCoverageTasksRegistered: true,
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },

  // Mobile configuration
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  
  retries: {
    runMode: 2,
    openMode: 0,
  },

  experimentalStudio: true,
  experimentalMemoryManagement: true,
});