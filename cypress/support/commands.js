// Custom Cypress commands for SaaS Pricing Calculator

// Authentication commands
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.session([email, password], () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/');
});

// Calculator-specific commands
Cypress.Commands.add('fillCalculatorForm', (data = {}) => {
  const defaultData = {
    currentPrice: '99',
    customers: '100',
    churnRate: '5',
    competitorPrice: '120',
    cac: '300',
  };
  
  const formData = { ...defaultData, ...data };
  
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid="input-${field}"]`).clear().type(value);
  });
});

Cypress.Commands.add('submitCalculation', () => {
  cy.get('[data-testid="calculate-button"]').click();
  cy.get('[data-testid="calculation-progress"]', { timeout: 10000 }).should('not.exist');
  cy.get('[data-testid="results-section"]').should('be.visible');
});

Cypress.Commands.add('waitForAIInsights', () => {
  cy.get('[data-testid="ai-loading"]', { timeout: 15000 }).should('not.exist');
  cy.get('[data-testid="ai-insights-section"]').should('be.visible');
});

Cypress.Commands.add('exportPDF', (template = 'professional') => {
  if (template !== 'professional') {
    cy.get('[data-testid="export-options-dropdown"]').click();
    cy.get(`[data-testid="template-${template}"]`).click();
  }
  cy.get('[data-testid="export-pdf-button"]').click();
  cy.get('[data-testid="export-success"]', { timeout: 10000 }).should('be.visible');
});

// Pricing tier commands
Cypress.Commands.add('selectPricingTier', (tier = 'professional') => {
  cy.get(`[data-testid="tier-${tier}"]`).click();
  cy.get('[data-testid="tier-details-modal"]').should('be.visible');
});

// Industry template commands
Cypress.Commands.add('selectIndustryTemplate', (industry = 'b2b-saas') => {
  cy.get('[data-testid="industry-template-selector"]').select(industry);
  cy.wait(500); // Wait for template to load
});

// Collaboration commands
Cypress.Commands.add('shareCalculation', (email = 'colleague@example.com') => {
  cy.get('[data-testid="share-button"]').click();
  cy.get('[data-testid="share-email-input"]').type(email);
  cy.get('[data-testid="send-share-button"]').click();
  cy.get('[data-testid="share-success"]').should('be.visible');
});

Cypress.Commands.add('joinCollaboration', (roomId) => {
  cy.visit(`/calculator/collaborate/${roomId}`);
  cy.get('[data-testid="collaboration-indicator"]').should('contain', 'Connected');
});

// Advanced options commands
Cypress.Commands.add('toggleAdvancedOptions', () => {
  cy.get('[data-testid="advanced-options-toggle"]').click();
  cy.get('[data-testid="advanced-fields"]').should('be.visible');
});

// Error handling commands
Cypress.Commands.add('expectError', (message) => {
  cy.get('[data-testid="error-message"]').should('contain', message);
});

Cypress.Commands.add('retryAction', (actionFn, maxAttempts = 3) => {
  const attempt = (attemptNum) => {
    if (attemptNum >= maxAttempts) {
      throw new Error(`Action failed after ${maxAttempts} attempts`);
    }
    
    try {
      actionFn();
    } catch (error) {
      cy.wait(1000);
      attempt(attemptNum + 1);
    }
  };
  
  attempt(0);
});

// Performance commands
Cypress.Commands.add('checkPagePerformance', (thresholds = {}) => {
  const defaultThresholds = {
    loadTime: 3000,
    fcp: 1500,
    lcp: 2500,
  };
  
  const finalThresholds = { ...defaultThresholds, ...thresholds };
  
  cy.window().then((win) => {
    const perfData = win.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    expect(loadTime).to.be.lessThan(finalThresholds.loadTime);
    
    // Check Core Web Vitals if available
    if (win.PerformanceObserver) {
      const observer = new win.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            expect(entry.startTime).to.be.lessThan(finalThresholds.fcp);
          }
          if (entry.name === 'largest-contentful-paint') {
            expect(entry.startTime).to.be.lessThan(finalThresholds.lcp);
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    }
  });
});

// Mobile-specific commands
Cypress.Commands.add('swipeLeft', (selector) => {
  cy.get(selector).trigger('touchstart', { touches: [{ clientX: 300, clientY: 300 }] });
  cy.get(selector).trigger('touchmove', { touches: [{ clientX: 100, clientY: 300 }] });
  cy.get(selector).trigger('touchend');
});

Cypress.Commands.add('swipeRight', (selector) => {
  cy.get(selector).trigger('touchstart', { touches: [{ clientX: 100, clientY: 300 }] });
  cy.get(selector).trigger('touchmove', { touches: [{ clientX: 300, clientY: 300 }] });
  cy.get(selector).trigger('touchend');
});

Cypress.Commands.add('checkMobileLayout', () => {
  cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
  cy.get('[data-testid="desktop-navigation"]').should('not.be.visible');
});

// Visual testing commands
Cypress.Commands.add('visualTest', (name, options = {}) => {
  // Percy visual testing
  if (Cypress.env('percy')) {
    cy.percySnapshot(name, options);
  }
});

// Accessibility commands
Cypress.Commands.add('checkKeyboardNavigation', (startSelector) => {
  cy.get(startSelector).focus();
  
  // Tab through focusable elements
  const tabSequence = [];
  let currentElement = startSelector;
  
  for (let i = 0; i < 10; i++) {
    cy.focused().then(($el) => {
      tabSequence.push($el[0].tagName + $el[0].className);
    });
    cy.focused().tab();
  }
  
  // Verify we can navigate back with Shift+Tab
  for (let i = 0; i < 5; i++) {
    cy.focused().tab({ shift: true });
  }
});

// Data persistence commands
Cypress.Commands.add('saveCalculation', (name = 'Test Calculation') => {
  cy.get('[data-testid="save-button"]').click();
  cy.get('[data-testid="calculation-name-input"]').type(name);
  cy.get('[data-testid="save-confirm-button"]').click();
  cy.get('[data-testid="save-success"]').should('be.visible');
});

Cypress.Commands.add('loadCalculation', (name) => {
  cy.get('[data-testid="load-button"]').click();
  cy.get(`[data-testid="saved-calculation-${name}"]`).click();
  cy.get('[data-testid="load-success"]').should('be.visible');
});

// WebSocket testing commands
Cypress.Commands.add('mockWebSocket', () => {
  cy.window().then((win) => {
    const mockSocket = {
      emit: cy.stub(),
      on: cy.stub(),
      off: cy.stub(),
      disconnect: cy.stub(),
      connected: true,
    };
    
    win.mockSocket = mockSocket;
    return mockSocket;
  });
});

// API testing commands
Cypress.Commands.add('interceptAPICall', (method, url, response) => {
  cy.intercept(method, url, response).as(`api${method}${url.replace(/\W/g, '')}`);
});

// Utility commands
Cypress.Commands.add('getByTestId', (testId) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('findByTestId', (testId) => {
  return cy.find(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('screenshot', (name, options = {}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  cy.screenshot(`${name}-${timestamp}`, options);
});