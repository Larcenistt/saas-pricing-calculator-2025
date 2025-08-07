// Import Cypress commands
import './commands';

// Import accessibility testing
import 'cypress-axe';

// Import real events for better mobile testing
import 'cypress-real-events';

// Import Percy for visual testing
import '@percy/cypress';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that might be expected in certain test scenarios
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Performance monitoring
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
  
  // Set up performance monitoring
  cy.window().then((win) => {
    win.performance.mark('test-start');
  });
});

afterEach(() => {
  // Measure performance after each test
  cy.window().then((win) => {
    win.performance.mark('test-end');
    win.performance.measure('test-duration', 'test-start', 'test-end');
    
    const measure = win.performance.getEntriesByName('test-duration')[0];
    if (measure && measure.duration > 5000) {
      cy.log(`⚠️ Slow test detected: ${measure.duration}ms`);
    }
  });
});

// Mobile-specific configurations
if (Cypress.config('viewportWidth') < 768) {
  // Mobile-specific hooks
  beforeEach(() => {
    cy.log('📱 Mobile testing mode enabled');
  });
}

// Accessibility testing configuration
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.injectAxe();
  cy.checkA11y(context, {
    rules: {
      'color-contrast': { enabled: true },
      'keyboard-navigation': { enabled: true },
      'focus-management': { enabled: true },
      ...options?.rules,
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    ...options,
  });
});

// Custom viewport commands for responsive testing
Cypress.Commands.add('testResponsive', (sizes = ['mobile', 'tablet', 'desktop']) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720],
  };

  sizes.forEach(size => {
    cy.viewport(...viewports[size]);
    cy.wait(500); // Allow time for responsive changes
    cy.log(`🔍 Testing ${size} viewport: ${viewports[size].join('x')}`);
  });
});

// Performance testing utilities
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const perfData = win.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    expect(pageLoadTime).to.be.lessThan(3000, 'Page should load in under 3 seconds');
    cy.log(`📊 Page load time: ${pageLoadTime}ms`);
  });
});

// Animation testing utilities
Cypress.Commands.add('waitForAnimations', (selector) => {
  if (selector) {
    cy.get(selector).should('not.have.class', 'animate-in');
  } else {
    cy.wait(1000); // Wait for common animation durations
  }
});

// API mocking utilities
Cypress.Commands.add('mockAPI', (endpoint, fixture) => {
  cy.intercept('POST', endpoint, { fixture }).as(`mock${endpoint.replace(/\W/g, '')}`);
});

// Error boundary testing
Cypress.Commands.add('triggerError', (errorType = 'generic') => {
  cy.window().then((win) => {
    if (errorType === 'network') {
      win.fetch = () => Promise.reject(new Error('Network error'));
    } else {
      throw new Error('Test error');
    }
  });
});