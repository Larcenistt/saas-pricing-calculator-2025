describe('Premium Onboarding Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.viewport(1280, 720);
  });

  context('First-time User Experience', () => {
    it('completes full onboarding tutorial', () => {
      // Landing page should show onboarding prompt
      cy.getByTestId('onboarding-start-button').should('be.visible').click();
      
      // Step 1: Welcome
      cy.getByTestId('onboarding-modal').should('be.visible');
      cy.contains('Welcome to WealthFlow Pricing Calculator').should('be.visible');
      cy.getByTestId('onboarding-next').click();
      
      // Step 2: Industry selection
      cy.contains('Choose Your Industry').should('be.visible');
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      
      // Step 3: Company size
      cy.contains('Company Stage').should('be.visible');
      cy.getByTestId('stage-startup').click();
      cy.getByTestId('onboarding-next').click();
      
      // Step 4: Goals
      cy.contains('What are your pricing goals?').should('be.visible');
      cy.getByTestId('goal-optimize-revenue').click();
      cy.getByTestId('goal-competitive-analysis').click();
      cy.getByTestId('onboarding-next').click();
      
      // Step 5: Feature tour
      cy.contains('Key Features').should('be.visible');
      cy.getByTestId('feature-ai-insights').should('be.visible');
      cy.getByTestId('feature-collaboration').should('be.visible');
      cy.getByTestId('onboarding-next').click();
      
      // Final step: Get started
      cy.contains('Ready to optimize your pricing?').should('be.visible');
      cy.getByTestId('onboarding-complete').click();
      
      // Should redirect to calculator with pre-filled data
      cy.url().should('include', '/calculator');
      cy.getByTestId('input-currentPrice').should('have.value', '99'); // B2B SaaS default
      cy.getByTestId('onboarding-tooltip').should('be.visible');
    });

    it('allows skipping onboarding', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('onboarding-skip').click();
      
      cy.url().should('include', '/calculator');
      cy.getByTestId('input-currentPrice').should('have.value', ''); // No pre-filled data
    });

    it('saves onboarding progress', () => {
      // Start onboarding
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      
      // Refresh page mid-onboarding
      cy.reload();
      
      // Should resume from where left off
      cy.contains('Company Stage').should('be.visible');
      cy.getByTestId('stage-startup').should('be.visible');
    });
  });

  context('Interactive Tutorial', () => {
    it('provides contextual help throughout calculator', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('onboarding-skip').click();
      
      // Enable tutorial mode
      cy.getByTestId('help-toggle').click();
      
      // Input field tooltips
      cy.getByTestId('input-currentPrice').click();
      cy.getByTestId('tooltip-currentPrice').should('be.visible')
        .and('contain', 'Your current monthly subscription price');
      
      cy.getByTestId('input-customers').click();
      cy.getByTestId('tooltip-customers').should('be.visible')
        .and('contain', 'Number of paying customers');
      
      cy.getByTestId('input-churnRate').click();
      cy.getByTestId('tooltip-churnRate').should('be.visible')
        .and('contain', 'Percentage of customers who cancel monthly');
    });

    it('shows progressive feature discovery', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // First calculation shows basic results tooltip
      cy.getByTestId('results-tooltip').should('be.visible')
        .and('contain', 'Your pricing analysis is ready');
      
      // AI insights discovery
      cy.waitForAIInsights();
      cy.getByTestId('ai-discovery-tooltip').should('be.visible')
        .and('contain', 'AI-powered insights');
      
      // Export feature discovery
      cy.getByTestId('export-discovery-tooltip').should('be.visible')
        .and('contain', 'Export professional reports');
    });

    it('guides users through advanced features', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Advanced options discovery
      cy.getByTestId('advanced-discovery-pulse').should('be.visible');
      cy.toggleAdvancedOptions();
      
      cy.getByTestId('advanced-tooltip').should('be.visible')
        .and('contain', 'Fine-tune your analysis');
      
      // Collaboration feature discovery
      cy.getByTestId('collaboration-discovery-tooltip').should('be.visible')
        .and('contain', 'Invite team members');
    });
  });

  context('Mobile Onboarding', () => {
    it('adapts onboarding for mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      cy.getByTestId('onboarding-start-button').should('be.visible').click();
      
      // Mobile-optimized layout
      cy.getByTestId('onboarding-modal').should('have.class', 'mobile-optimized');
      
      // Swipe navigation
      cy.swipeLeft('[data-testid="onboarding-content"]');
      cy.contains('Choose Your Industry').should('be.visible');
      
      // Touch-friendly industry selection
      cy.getByTestId('industry-card-b2b-saas').should('have.class', 'touch-target');
      cy.getByTestId('industry-card-b2b-saas').click();
      
      cy.swipeLeft('[data-testid="onboarding-content"]');
      cy.contains('Company Stage').should('be.visible');
    });

    it('maintains progress indicator on mobile', () => {
      cy.viewport(375, 667);
      cy.getByTestId('onboarding-start-button').click();
      
      cy.getByTestId('progress-indicator').should('be.visible');
      cy.getByTestId('progress-step-1').should('have.class', 'active');
      
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      
      cy.getByTestId('progress-step-2').should('have.class', 'active');
    });
  });

  context('Personalization', () => {
    it('customizes experience based on industry selection', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('industry-card-e-commerce').click();
      cy.getByTestId('onboarding-next').click();
      
      // Should show e-commerce specific stages
      cy.getByTestId('stage-online-store').should('be.visible');
      cy.getByTestId('stage-marketplace').should('be.visible');
      
      cy.getByTestId('stage-online-store').click();
      cy.getByTestId('onboarding-next').click();
      
      // Goals should be e-commerce specific
      cy.getByTestId('goal-conversion-optimization').should('be.visible');
      cy.getByTestId('goal-cart-abandonment').should('be.visible');
    });

    it('provides role-based recommendations', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      cy.getByTestId('stage-growth').click();
      cy.getByTestId('onboarding-next').click();
      
      // Role selection
      cy.contains('What is your role?').should('be.visible');
      cy.getByTestId('role-founder').click();
      cy.getByTestId('onboarding-next').click();
      
      // Should show founder-specific features
      cy.getByTestId('feature-investor-reports').should('be.visible');
      cy.getByTestId('feature-funding-metrics').should('be.visible');
    });

    it('saves user preferences for future sessions', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      cy.getByTestId('stage-startup').click();
      cy.getByTestId('onboarding-complete').click();
      
      // Clear session and revisit
      cy.clearLocalStorage();
      cy.visit('/');
      
      // Should remember preferences
      cy.get('[data-testid="industry-template-selector"]')
        .should('have.value', 'b2b-saas');
    });
  });

  context('Accessibility', () => {
    it('supports keyboard navigation through onboarding', () => {
      cy.getByTestId('onboarding-start-button').click();
      
      // Tab through onboarding elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'onboarding-next');
      
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'onboarding-skip');
      
      // Arrow key navigation for options
      cy.get('body').type('{downArrow}');
      cy.focused().should('have.attr', 'data-testid', 'industry-card-b2b-saas');
      
      cy.get('body').type('{downArrow}');
      cy.focused().should('have.attr', 'data-testid', 'industry-card-e-commerce');
      
      cy.get('body').type('{enter}');
      cy.contains('Company Stage').should('be.visible');
    });

    it('provides screen reader announcements', () => {
      cy.getByTestId('onboarding-start-button').click();
      
      // Check for ARIA live regions
      cy.get('[aria-live="polite"]').should('contain', 'Onboarding step 1 of 5');
      
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      
      cy.get('[aria-live="polite"]').should('contain', 'Onboarding step 2 of 5');
    });

    it('meets WCAG contrast requirements', () => {
      cy.getByTestId('onboarding-start-button').click();
      cy.injectAxe();
      cy.checkA11y('[data-testid="onboarding-modal"]', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });
  });

  context('Error Handling', () => {
    it('handles network errors during onboarding', () => {
      cy.intercept('POST', '/api/onboarding/save-preferences', {
        statusCode: 500,
        body: { error: 'Server error' }
      });
      
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('industry-card-b2b-saas').click();
      cy.getByTestId('onboarding-next').click();
      cy.getByTestId('stage-startup').click();
      cy.getByTestId('onboarding-complete').click();
      
      // Should show error but allow continuation
      cy.getByTestId('onboarding-error').should('be.visible')
        .and('contain', 'Unable to save preferences');
      cy.getByTestId('continue-anyway').click();
      
      cy.url().should('include', '/calculator');
    });

    it('recovers from interrupted onboarding', () => {
      cy.getByTestId('onboarding-start-button').click();
      
      // Simulate browser crash/refresh
      cy.window().then((win) => {
        win.location.reload();
      });
      
      // Should offer to resume
      cy.getByTestId('resume-onboarding').should('be.visible').click();
      cy.contains('Welcome back!').should('be.visible');
    });
  });

  context('Performance', () => {
    it('loads onboarding quickly', () => {
      cy.visit('/');
      cy.measurePageLoad();
      
      cy.getByTestId('onboarding-start-button').should('be.visible');
      
      // Onboarding should start within 500ms of click
      const startTime = Date.now();
      cy.getByTestId('onboarding-start-button').click();
      cy.getByTestId('onboarding-modal').should('be.visible').then(() => {
        expect(Date.now() - startTime).to.be.lessThan(500);
      });
    });

    it('preloads onboarding assets', () => {
      cy.visit('/');
      
      // Check that onboarding assets are preloaded
      cy.window().then((win) => {
        const preloadedImages = Array.from(win.document.querySelectorAll('link[rel="preload"][as="image"]'));
        expect(preloadedImages.length).to.be.greaterThan(0);
      });
    });
  });

  afterEach(() => {
    // Clean up any onboarding state
    cy.clearLocalStorage();
  });
});