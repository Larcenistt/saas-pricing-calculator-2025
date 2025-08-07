describe('Calculation and Export Flow', () => {
  beforeEach(() => {
    cy.visit('/calculator');
    cy.viewport(1280, 720);
    
    // Mock AI service for consistent testing
    cy.intercept('POST', '/api/ai/insights', {
      statusCode: 200,
      fixture: 'ai-insights.json'
    }).as('getAIInsights');
    
    // Mock PDF export
    cy.intercept('POST', '/api/export/pdf', {
      statusCode: 200,
      body: { success: true, downloadUrl: '/exports/test-calculation.pdf' }
    }).as('exportPDF');
  });

  context('Premium Calculation Flow', () => {
    it('completes full calculation with AI insights', () => {
      // Fill form with comprehensive data
      cy.fillCalculatorForm({
        currentPrice: '149',
        customers: '250',
        churnRate: '4.5',
        competitorPrice: '199',
        cac: '450'
      });
      
      // Enable advanced options
      cy.toggleAdvancedOptions();
      cy.getByTestId('input-marketSize').type('1000000');
      cy.getByTestId('input-growthRate').type('15');
      
      // Submit calculation
      cy.submitCalculation();
      
      // Verify basic results
      cy.getByTestId('result-mrr').should('contain', '$37,250');
      cy.getByTestId('result-ltv').should('be.visible');
      cy.getByTestId('result-ltv-cac-ratio').should('be.visible');
      cy.getByTestId('result-payback-period').should('be.visible');
      
      // Verify AI insights load
      cy.wait('@getAIInsights');
      cy.waitForAIInsights();
      
      cy.getByTestId('ai-recommendation-0').should('be.visible');
      cy.getByTestId('ai-confidence-score').should('contain', '%');
      cy.getByTestId('competitive-analysis').should('be.visible');
    });

    it('handles pricing tier generation', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Should generate three pricing tiers
      cy.getByTestId('pricing-tiers-section').should('be.visible');
      cy.getByTestId('tier-starter').should('be.visible');
      cy.getByTestId('tier-professional').should('be.visible');
      cy.getByTestId('tier-enterprise').should('be.visible');
      
      // Each tier should have price and features
      cy.getByTestId('tier-starter-price').should('contain', '$');
      cy.getByTestId('tier-starter-features').should('be.visible');
      
      // Click tier for details
      cy.selectPricingTier('professional');
      cy.getByTestId('tier-feature-comparison').should('be.visible');
      cy.getByTestId('tier-revenue-impact').should('contain', 'Revenue Impact');
    });

    it('provides interactive charts and visualizations', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Revenue projection chart
      cy.getByTestId('revenue-projection-chart').should('be.visible');
      cy.getByTestId('chart-tooltip').should('not.be.visible');
      
      // Hover to show tooltip
      cy.getByTestId('revenue-projection-chart').trigger('mouseover', { x: 100, y: 100 });
      cy.getByTestId('chart-tooltip').should('be.visible');
      
      // LTV/CAC ratio chart
      cy.getByTestId('ltv-cac-chart').should('be.visible');
      
      // Payback period visualization
      cy.getByTestId('payback-period-chart').should('be.visible');
      
      // Competitive positioning chart
      cy.getByTestId('competitive-chart').should('be.visible');
    });

    it('supports scenario planning', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Open scenario planner
      cy.getByTestId('scenario-planner-button').click();
      cy.getByTestId('scenario-modal').should('be.visible');
      
      // Create price increase scenario
      cy.getByTestId('scenario-price-increase').click();
      cy.getByTestId('scenario-price-input').clear().type('179');
      cy.getByTestId('apply-scenario').click();
      
      // Should show before/after comparison
      cy.getByTestId('scenario-comparison').should('be.visible');
      cy.getByTestId('scenario-revenue-change').should('contain', '+');
      cy.getByTestId('scenario-risk-assessment').should('be.visible');
    });

    it('validates input constraints and provides feedback', () => {
      // Test price validation
      cy.getByTestId('input-currentPrice').clear().type('-50');
      cy.getByTestId('price-validation-error').should('be.visible')
        .and('contain', 'Price must be positive');
      
      // Test churn rate validation
      cy.getByTestId('input-churnRate').clear().type('150');
      cy.getByTestId('churn-validation-error').should('be.visible')
        .and('contain', 'Churn rate must be between 0 and 100');
      
      // Test realistic value warnings
      cy.getByTestId('input-currentPrice').clear().type('10000');
      cy.getByTestId('price-warning').should('be.visible')
        .and('contain', 'This price seems unusually high');
      
      // Clear warnings when corrected
      cy.getByTestId('input-currentPrice').clear().type('99');
      cy.getByTestId('price-warning').should('not.exist');
    });
  });

  context('Professional Export Features', () => {
    beforeEach(() => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      cy.waitForAIInsights();
    });

    it('exports professional PDF report', () => {
      cy.exportPDF('professional');
      
      cy.wait('@exportPDF').then((interception) => {
        expect(interception.request.body).to.include.keys([
          'calculations',
          'aiInsights',
          'template',
          'branding'
        ]);
        expect(interception.request.body.template).to.equal('professional');
      });
      
      cy.getByTestId('export-success').should('be.visible')
        .and('contain', 'Professional report generated');
    });

    it('exports executive summary', () => {
      cy.exportPDF('executive');
      
      cy.wait('@exportPDF').then((interception) => {
        expect(interception.request.body.template).to.equal('executive');
        expect(interception.request.body.includeCharts).to.be.true;
      });
    });

    it('exports technical analysis report', () => {
      cy.exportPDF('technical');
      
      cy.wait('@exportPDF').then((interception) => {
        expect(interception.request.body.template).to.equal('technical');
        expect(interception.request.body.includeMethodology).to.be.true;
      });
    });

    it('customizes export with branding options', () => {
      cy.getByTestId('export-options-dropdown').click();
      cy.getByTestId('export-customize').click();
      
      // Customization modal
      cy.getByTestId('branding-modal').should('be.visible');
      cy.getByTestId('company-name-input').type('Test Company');
      cy.getByTestId('company-logo-upload').selectFile('cypress/fixtures/logo.png');
      cy.getByTestId('brand-color-picker').click();
      cy.getByTestId('color-blue').click();
      
      cy.getByTestId('apply-branding').click();
      
      // Export with custom branding
      cy.getByTestId('export-pdf-button').click();
      
      cy.wait('@exportPDF').then((interception) => {
        expect(interception.request.body.branding).to.deep.include({
          companyName: 'Test Company',
          primaryColor: expect.any(String)
        });
      });
    });

    it('tracks export analytics', () => {
      cy.intercept('POST', '/api/analytics/track', { statusCode: 200 }).as('trackAnalytics');
      
      cy.exportPDF('professional');
      
      cy.wait('@trackAnalytics').then((interception) => {
        expect(interception.request.body.event).to.equal('pdf_export');
        expect(interception.request.body.properties).to.include.keys([
          'template',
          'hasAIInsights',
          'calculationComplexity'
        ]);
      });
    });

    it('handles export errors gracefully', () => {
      cy.intercept('POST', '/api/export/pdf', {
        statusCode: 500,
        body: { error: 'Export service unavailable' }
      }).as('exportError');
      
      cy.getByTestId('export-pdf-button').click();
      
      cy.wait('@exportError');
      cy.getByTestId('export-error').should('be.visible')
        .and('contain', 'Export failed');
      
      // Retry functionality
      cy.getByTestId('retry-export').click();
      cy.getByTestId('export-loading').should('be.visible');
    });

    it('supports bulk export of multiple scenarios', () => {
      // Create multiple scenarios
      cy.getByTestId('scenario-planner-button').click();
      
      // Scenario 1: Price increase
      cy.getByTestId('add-scenario').click();
      cy.getByTestId('scenario-name-input').type('Price Increase');
      cy.getByTestId('scenario-price-input').clear().type('179');
      cy.getByTestId('save-scenario').click();
      
      // Scenario 2: Customer growth
      cy.getByTestId('add-scenario').click();
      cy.getByTestId('scenario-name-input').type('Customer Growth');
      cy.getByTestId('scenario-customers-input').clear().type('300');
      cy.getByTestId('save-scenario').click();
      
      // Bulk export
      cy.getByTestId('export-all-scenarios').click();
      cy.getByTestId('bulk-export-modal').should('be.visible');
      cy.getByTestId('confirm-bulk-export').click();
      
      // Should show progress
      cy.getByTestId('bulk-export-progress').should('be.visible');
      cy.getByTestId('export-complete').should('be.visible');
    });
  });

  context('Real-time Features', () => {
    it('shows live calculation updates', () => {
      // Start typing in price field
      cy.getByTestId('input-currentPrice').clear().type('1');
      
      // Should not show results yet
      cy.getByTestId('live-preview').should('not.be.visible');
      
      // Complete reasonable value
      cy.getByTestId('input-currentPrice').type('49');
      cy.getByTestId('input-customers').type('100');
      
      // Should show live preview
      cy.getByTestId('live-preview').should('be.visible');
      cy.getByTestId('live-mrr').should('contain', '$14,900');
      
      // Update value to see live changes
      cy.getByTestId('input-currentPrice').clear().type('199');
      cy.getByTestId('live-mrr').should('contain', '$19,900');
    });

    it('provides input suggestions', () => {
      cy.getByTestId('input-currentPrice').focus();
      cy.getByTestId('price-suggestions').should('be.visible');
      
      // Industry-based suggestions
      cy.selectIndustryTemplate('b2b-saas');
      cy.getByTestId('suggested-price-99').should('be.visible').click();
      cy.getByTestId('input-currentPrice').should('have.value', '99');
      
      // Competitor-based suggestions
      cy.getByTestId('input-competitorPrice').type('149');
      cy.getByTestId('competitive-suggestion').should('be.visible')
        .and('contain', 'Consider pricing at $139 (7% below competitor)');
    });

    it('validates form completion in real-time', () => {
      // Initially incomplete
      cy.getByTestId('calculate-button').should('be.disabled');
      cy.getByTestId('completion-indicator').should('contain', '0%');
      
      // Add required fields progressively
      cy.getByTestId('input-currentPrice').type('99');
      cy.getByTestId('completion-indicator').should('contain', '20%');
      
      cy.getByTestId('input-customers').type('100');
      cy.getByTestId('completion-indicator').should('contain', '40%');
      
      cy.getByTestId('input-churnRate').type('5');
      cy.getByTestId('completion-indicator').should('contain', '60%');
      
      cy.getByTestId('input-competitorPrice').type('120');
      cy.getByTestId('completion-indicator').should('contain', '80%');
      
      cy.getByTestId('input-cac').type('300');
      cy.getByTestId('completion-indicator').should('contain', '100%');
      cy.getByTestId('calculate-button').should('not.be.disabled');
    });
  });

  context('Collaboration Features', () => {
    beforeEach(() => {
      cy.login();
    });

    it('shares calculation with team members', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      cy.shareCalculation('colleague@company.com');
      
      cy.getByTestId('share-link').should('be.visible');
      cy.getByTestId('share-success').should('contain', 'Shared with colleague@company.com');
      
      // Test shared link
      cy.getByTestId('share-link').invoke('text').then((link) => {
        cy.visit(link);
        cy.getByTestId('shared-calculation').should('be.visible');
        cy.getByTestId('results-section').should('be.visible');
      });
    });

    it('enables real-time collaboration', () => {
      cy.mockWebSocket();
      
      cy.fillCalculatorForm();
      cy.shareCalculation('team@company.com');
      
      // Simulate another user joining
      cy.window().then((win) => {
        win.mockSocket.on.args
          .find(args => args[0] === 'user-joined')[1]({
            userId: '123',
            userName: 'Team Member',
            avatar: '/avatars/team.jpg'
          });
      });
      
      cy.getByTestId('collaboration-indicator').should('contain', 'Team Member');
      
      // Simulate real-time changes from other user
      cy.window().then((win) => {
        win.mockSocket.on.args
          .find(args => args[0] === 'field-changed')[1]({
            field: 'currentPrice',
            value: '179',
            userId: '123',
            userName: 'Team Member'
          });
      });
      
      cy.getByTestId('input-currentPrice').should('have.value', '179');
      cy.getByTestId('field-change-indicator').should('contain', 'Team Member updated price');
    });

    it('manages collaboration permissions', () => {
      cy.fillCalculatorForm();
      cy.shareCalculation('viewer@company.com');
      
      cy.getByTestId('collaboration-settings').click();
      cy.getByTestId('permissions-modal').should('be.visible');
      
      // Set viewer permissions
      cy.getByTestId('user-viewer@company.com').within(() => {
        cy.getByTestId('permission-select').select('view-only');
      });
      
      cy.getByTestId('save-permissions').click();
      
      // Verify permissions are saved
      cy.getByTestId('shared-user-viewer@company.com').should('contain', 'View Only');
    });
  });

  context('Performance and Optimization', () => {
    it('calculates results quickly', () => {
      cy.fillCalculatorForm();
      
      const startTime = Date.now();
      cy.submitCalculation();
      
      cy.getByTestId('results-section').should('be.visible').then(() => {
        const calculationTime = Date.now() - startTime;
        expect(calculationTime).to.be.lessThan(2000); // Under 2 seconds
      });
    });

    it('handles large datasets efficiently', () => {
      // Test with high customer numbers
      cy.fillCalculatorForm({
        customers: '100000',
        currentPrice: '99'
      });
      
      cy.submitCalculation();
      
      // Should handle large numbers without performance issues
      cy.getByTestId('result-mrr').should('contain', '$9,900,000');
      cy.getByTestId('calculation-performance-warning').should('not.exist');
    });

    it('provides progress feedback for long operations', () => {
      // Mock slow AI service
      cy.intercept('POST', '/api/ai/insights', {
        delay: 3000,
        statusCode: 200,
        fixture: 'ai-insights.json'
      }).as('slowAIInsights');
      
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Should show progress for AI insights
      cy.getByTestId('ai-progress-bar').should('be.visible');
      cy.getByTestId('ai-progress-text').should('contain', 'Generating insights');
      
      cy.wait('@slowAIInsights');
      cy.getByTestId('ai-progress-bar').should('not.exist');
    });
  });

  context('Error Recovery', () => {
    it('recovers from calculation errors', () => {
      cy.intercept('POST', '/api/calculate', {
        statusCode: 500,
        body: { error: 'Calculation service unavailable' }
      }).as('calculationError');
      
      cy.fillCalculatorForm();
      cy.getByTestId('calculate-button').click();
      
      cy.wait('@calculationError');
      cy.getByTestId('calculation-error').should('be.visible')
        .and('contain', 'Unable to complete calculation');
      
      // Retry functionality
      cy.getByTestId('retry-calculation').click();
      cy.getByTestId('calculation-loading').should('be.visible');
    });

    it('handles network disconnection gracefully', () => {
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Simulate network disconnection
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          value: false,
          writable: true
        });
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.getByTestId('offline-indicator').should('be.visible');
      cy.getByTestId('export-pdf-button').should('be.disabled');
      
      // Reconnect
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          value: true,
          writable: true
        });
        win.dispatchEvent(new Event('online'));
      });
      
      cy.getByTestId('offline-indicator').should('not.exist');
      cy.getByTestId('export-pdf-button').should('not.be.disabled');
    });
  });

  afterEach(() => {
    // Clean up any shared calculations
    cy.window().then((win) => {
      win.localStorage.removeItem('shared-calculations');
    });
  });
});