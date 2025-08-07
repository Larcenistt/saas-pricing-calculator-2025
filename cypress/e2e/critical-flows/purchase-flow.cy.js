describe('Premium Purchase Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.viewport(1280, 720);
    
    // Mock Stripe for testing
    cy.window().then((win) => {
      win.Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: cy.stub(),
            unmount: cy.stub(),
            on: cy.stub(),
          }),
        }),
        confirmPayment: cy.stub().resolves({ error: null, paymentIntent: { status: 'succeeded' } }),
        confirmSetup: cy.stub().resolves({ error: null }),
      });
    });
    
    // Mock payment processing
    cy.intercept('POST', '/api/payments/create-intent', {
      statusCode: 200,
      body: { 
        clientSecret: 'pi_test_1234_secret_test',
        paymentIntentId: 'pi_test_1234'
      }
    }).as('createPaymentIntent');
    
    cy.intercept('POST', '/api/payments/confirm', {
      statusCode: 200,
      body: { 
        success: true,
        subscriptionId: 'sub_test_1234',
        status: 'active'
      }
    }).as('confirmPayment');
  });

  context('Pricing Tier Selection', () => {
    it('displays all pricing tiers with features', () => {
      cy.visit('/pricing');
      
      // Verify all tiers are displayed
      cy.getByTestId('pricing-tier-starter').should('be.visible');
      cy.getByTestId('pricing-tier-professional').should('be.visible');
      cy.getByTestId('pricing-tier-enterprise').should('be.visible');
      
      // Check pricing information
      cy.getByTestId('tier-starter-price').should('contain', '$29');
      cy.getByTestId('tier-professional-price').should('contain', '$99');
      cy.getByTestId('tier-enterprise-price').should('contain', '$299');
      
      // Verify feature lists
      cy.getByTestId('tier-starter-features').within(() => {
        cy.contains('Basic pricing analysis').should('be.visible');
        cy.contains('PDF export').should('be.visible');
        cy.contains('Email support').should('be.visible');
      });
      
      cy.getByTestId('tier-professional-features').within(() => {
        cy.contains('AI-powered insights').should('be.visible');
        cy.contains('Team collaboration').should('be.visible');
        cy.contains('Priority support').should('be.visible');
      });
      
      cy.getByTestId('tier-enterprise-features').within(() => {
        cy.contains('White-label reports').should('be.visible');
        cy.contains('API access').should('be.visible');
        cy.contains('Dedicated support').should('be.visible');
      });
    });

    it('highlights recommended tier', () => {
      cy.visit('/pricing');
      
      cy.getByTestId('pricing-tier-professional')
        .should('have.class', 'recommended')
        .within(() => {
          cy.getByTestId('recommended-badge').should('be.visible')
            .and('contain', 'Most Popular');
        });
    });

    it('shows annual vs monthly pricing toggle', () => {
      cy.visit('/pricing');
      
      // Default to monthly
      cy.getByTestId('pricing-toggle-monthly').should('have.class', 'active');
      cy.getByTestId('tier-professional-price').should('contain', '$99/month');
      
      // Switch to annual
      cy.getByTestId('pricing-toggle-annual').click();
      cy.getByTestId('pricing-toggle-annual').should('have.class', 'active');
      cy.getByTestId('tier-professional-price').should('contain', '$990/year');
      cy.getByTestId('annual-savings').should('be.visible').and('contain', 'Save 16%');
    });

    it('provides feature comparison modal', () => {
      cy.visit('/pricing');
      
      cy.getByTestId('compare-features-button').click();
      cy.getByTestId('feature-comparison-modal').should('be.visible');
      
      // Check comparison table
      cy.getByTestId('feature-ai-insights').within(() => {
        cy.getByTestId('starter-feature').should('contain', '✗');
        cy.getByTestId('professional-feature').should('contain', '✓');
        cy.getByTestId('enterprise-feature').should('contain', '✓');
      });
      
      cy.getByTestId('feature-team-collaboration').within(() => {
        cy.getByTestId('starter-feature').should('contain', '✗');
        cy.getByTestId('professional-feature').should('contain', '5 users');
        cy.getByTestId('enterprise-feature').should('contain', 'Unlimited');
      });
    });
  });

  context('Checkout Process', () => {
    beforeEach(() => {
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
    });

    it('initiates checkout with selected plan', () => {
      cy.url().should('include', '/checkout');
      cy.getByTestId('checkout-plan-summary').should('contain', 'Professional Plan');
      cy.getByTestId('checkout-price').should('contain', '$99.00/month');
      cy.getByTestId('checkout-features').should('be.visible');
    });

    it('collects customer information', () => {
      cy.getByTestId('customer-email').type('customer@example.com');
      cy.getByTestId('customer-name').type('John Doe');
      cy.getByTestId('company-name').type('Acme Corp');
      cy.getByTestId('company-size').select('11-50');
      
      cy.getByTestId('billing-same-as-customer').uncheck();
      cy.getByTestId('billing-address').should('be.visible');
      cy.getByTestId('billing-street').type('123 Business St');
      cy.getByTestId('billing-city').type('San Francisco');
      cy.getByTestId('billing-state').type('CA');
      cy.getByTestId('billing-zip').type('94105');
      cy.getByTestId('billing-country').select('United States');
    });

    it('handles payment method input', () => {
      // Fill customer info first
      cy.getByTestId('customer-email').type('customer@example.com');
      cy.getByTestId('customer-name').type('John Doe');
      
      // Payment section should be enabled
      cy.getByTestId('payment-section').should('not.have.class', 'disabled');
      
      // Stripe Elements should be mounted
      cy.getByTestId('card-element').should('be.visible');
      
      // Mock successful card validation
      cy.window().then((win) => {
        const cardElement = { on: cy.stub() };
        win.mockCardElement = cardElement;
        
        // Simulate card input
        cardElement.on.withArgs('change').yields({
          complete: true,
          error: null
        });
      });
      
      cy.getByTestId('card-errors').should('not.be.visible');
    });

    it('applies discount codes', () => {
      cy.getByTestId('promo-code-toggle').click();
      cy.getByTestId('promo-code-input').should('be.visible');
      
      // Invalid code
      cy.intercept('POST', '/api/promo/validate', {
        statusCode: 400,
        body: { error: 'Invalid promo code' }
      });
      
      cy.getByTestId('promo-code-input').type('INVALID');
      cy.getByTestId('apply-promo').click();
      cy.getByTestId('promo-error').should('contain', 'Invalid promo code');
      
      // Valid code
      cy.intercept('POST', '/api/promo/validate', {
        statusCode: 200,
        body: { 
          discount: 20,
          code: 'LAUNCH20',
          type: 'percentage'
        }
      });
      
      cy.getByTestId('promo-code-input').clear().type('LAUNCH20');
      cy.getByTestId('apply-promo').click();
      cy.getByTestId('discount-applied').should('be.visible')
        .and('contain', '20% off');
      cy.getByTestId('checkout-total').should('contain', '$79.20');
    });

    it('shows order summary with tax calculation', () => {
      cy.getByTestId('customer-email').type('customer@example.com');
      cy.getByTestId('billing-state').select('CA');
      
      // Should calculate tax for CA
      cy.getByTestId('order-summary').within(() => {
        cy.getByTestId('subtotal').should('contain', '$99.00');
        cy.getByTestId('tax-amount').should('contain', '$8.91'); // 9% CA tax
        cy.getByTestId('total-amount').should('contain', '$107.91');
      });
    });
  });

  context('Payment Processing', () => {
    beforeEach(() => {
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      // Fill required fields
      cy.getByTestId('customer-email').type('customer@example.com');
      cy.getByTestId('customer-name').type('John Doe');
      cy.getByTestId('company-name').type('Acme Corp');
    });

    it('processes successful payment', () => {
      cy.getByTestId('submit-payment').click();
      
      cy.wait('@createPaymentIntent');
      cy.wait('@confirmPayment');
      
      // Should redirect to success page
      cy.url().should('include', '/success');
      cy.getByTestId('payment-success').should('be.visible');
      cy.getByTestId('subscription-details').should('contain', 'Professional Plan');
      cy.getByTestId('next-billing-date').should('be.visible');
    });

    it('handles payment failures gracefully', () => {
      cy.window().then((win) => {
        win.Stripe = () => ({
          elements: () => ({
            create: () => ({
              mount: cy.stub(),
              unmount: cy.stub(),
              on: cy.stub(),
            }),
          }),
          confirmPayment: cy.stub().resolves({ 
            error: { 
              message: 'Your card was declined.',
              type: 'card_error',
              code: 'card_declined'
            } 
          }),
        });
      });
      
      cy.getByTestId('submit-payment').click();
      
      cy.getByTestId('payment-error').should('be.visible')
        .and('contain', 'Your card was declined');
      
      // Should allow retry
      cy.getByTestId('retry-payment').should('be.visible');
    });

    it('handles 3D Secure authentication', () => {
      cy.window().then((win) => {
        win.Stripe = () => ({
          elements: () => ({
            create: () => ({
              mount: cy.stub(),
              unmount: cy.stub(),
              on: cy.stub(),
            }),
          }),
          confirmPayment: cy.stub().resolves({ 
            error: null,
            paymentIntent: { 
              status: 'requires_action',
              next_action: {
                type: 'use_stripe_sdk'
              }
            }
          }),
        });
      });
      
      cy.getByTestId('submit-payment').click();
      
      cy.getByTestId('authentication-modal').should('be.visible');
      cy.getByTestId('authentication-message').should('contain', 
        'Please complete authentication with your bank');
    });

    it('saves payment method for future use', () => {
      cy.getByTestId('save-payment-method').check();
      cy.getByTestId('submit-payment').click();
      
      cy.wait('@confirmPayment');
      
      // Should create setup intent for saved payment method
      cy.intercept('POST', '/api/payments/setup-intent').as('setupIntent');
      cy.wait('@setupIntent');
    });
  });

  context('Subscription Management', () => {
    beforeEach(() => {
      cy.login();
      cy.visit('/dashboard/billing');
    });

    it('displays current subscription details', () => {
      cy.getByTestId('current-plan').should('contain', 'Professional Plan');
      cy.getByTestId('subscription-status').should('contain', 'Active');
      cy.getByTestId('next-billing-date').should('be.visible');
      cy.getByTestId('billing-amount').should('contain', '$99.00');
    });

    it('allows plan upgrades', () => {
      cy.getByTestId('upgrade-plan').click();
      cy.getByTestId('plan-selection-modal').should('be.visible');
      
      cy.getByTestId('select-enterprise').click();
      cy.getByTestId('upgrade-preview').should('be.visible');
      cy.getByTestId('proration-amount').should('be.visible');
      
      cy.getByTestId('confirm-upgrade').click();
      
      cy.getByTestId('upgrade-success').should('be.visible');
      cy.getByTestId('current-plan').should('contain', 'Enterprise Plan');
    });

    it('allows plan downgrades', () => {
      cy.getByTestId('change-plan').click();
      cy.getByTestId('select-starter').click();
      
      cy.getByTestId('downgrade-warning').should('be.visible')
        .and('contain', 'You will lose access to AI insights');
      
      cy.getByTestId('acknowledge-downgrade').check();
      cy.getByTestId('confirm-downgrade').click();
      
      cy.getByTestId('downgrade-scheduled').should('be.visible')
        .and('contain', 'Changes will take effect at the end of your current billing period');
    });

    it('manages payment methods', () => {
      cy.getByTestId('payment-methods-section').within(() => {
        cy.getByTestId('add-payment-method').click();
      });
      
      cy.getByTestId('payment-method-modal').should('be.visible');
      
      // Add new card
      cy.getByTestId('card-element').should('be.visible');
      cy.getByTestId('save-card').click();
      
      // Should show in payment methods list
      cy.getByTestId('payment-method-1234').should('be.visible')
        .and('contain', '•••• 1234');
      
      // Set as default
      cy.getByTestId('set-default-1234').click();
      cy.getByTestId('default-badge-1234').should('be.visible');
      
      // Remove payment method
      cy.getByTestId('remove-payment-method-1234').click();
      cy.getByTestId('confirm-remove').click();
      cy.getByTestId('payment-method-1234').should('not.exist');
    });

    it('downloads invoices', () => {
      cy.intercept('GET', '/api/billing/invoices/*/download', {
        statusCode: 200,
        headers: {
          'content-disposition': 'attachment; filename=invoice.pdf'
        },
        body: 'PDF content'
      }).as('downloadInvoice');
      
      cy.getByTestId('billing-history').within(() => {
        cy.getByTestId('download-invoice-1').click();
      });
      
      cy.wait('@downloadInvoice');
    });

    it('cancels subscription', () => {
      cy.getByTestId('cancel-subscription').click();
      cy.getByTestId('cancellation-modal').should('be.visible');
      
      // Retention attempt
      cy.getByTestId('retention-offer').should('be.visible');
      cy.getByTestId('decline-offer').click();
      
      // Cancellation reason
      cy.getByTestId('cancellation-reason').select('too-expensive');
      cy.getByTestId('cancellation-feedback').type('Great product but over budget');
      
      cy.getByTestId('confirm-cancellation').click();
      
      cy.getByTestId('cancellation-confirmed').should('be.visible');
      cy.getByTestId('access-until-date').should('be.visible');
    });
  });

  context('Enterprise Sales Flow', () => {
    it('provides enterprise contact form', () => {
      cy.visit('/pricing');
      cy.getByTestId('contact-sales').click();
      
      cy.getByTestId('enterprise-form').should('be.visible');
      cy.getByTestId('company-name').type('Enterprise Corp');
      cy.getByTestId('contact-name').type('Jane Smith');
      cy.getByTestId('contact-email').type('jane@enterprise.com');
      cy.getByTestId('company-size').select('1000+');
      cy.getByTestId('use-case').type('Enterprise pricing optimization for 20+ products');
      
      cy.getByTestId('submit-enterprise-form').click();
      
      cy.getByTestId('enterprise-submitted').should('be.visible')
        .and('contain', 'Our enterprise team will contact you within 24 hours');
    });

    it('schedules demo calls', () => {
      cy.visit('/demo');
      
      cy.getByTestId('calendar-widget').should('be.visible');
      cy.getByTestId('available-slot-1').click();
      
      cy.getByTestId('demo-form').within(() => {
        cy.getByTestId('attendee-name').type('John Doe');
        cy.getByTestId('attendee-email').type('john@company.com');
        cy.getByTestId('company-name').type('Demo Corp');
        cy.getByTestId('demo-goals').type('Evaluate pricing optimization tools');
      });
      
      cy.getByTestId('schedule-demo').click();
      
      cy.getByTestId('demo-scheduled').should('be.visible');
      cy.getByTestId('calendar-invite').should('be.visible');
      cy.getByTestId('demo-prep-email').should('be.visible');
    });
  });

  context('Mobile Purchase Experience', () => {
    beforeEach(() => {
      cy.viewport(375, 667);
    });

    it('optimizes pricing page for mobile', () => {
      cy.visit('/pricing');
      
      cy.checkMobileLayout();
      
      // Pricing tiers should stack vertically
      cy.getByTestId('pricing-tiers').should('have.class', 'mobile-stack');
      
      // Recommended tier should be prominent
      cy.getByTestId('pricing-tier-professional').should('have.class', 'highlighted');
      
      // Feature lists should be collapsible
      cy.getByTestId('toggle-features-starter').click();
      cy.getByTestId('tier-starter-features').should('be.visible');
    });

    it('provides mobile-optimized checkout', () => {
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      // Checkout should use mobile layout
      cy.getByTestId('checkout-container').should('have.class', 'mobile-checkout');
      
      // Payment form should be touch-friendly
      cy.getByTestId('customer-email').should('have.attr', 'inputmode', 'email');
      cy.getByTestId('customer-phone').should('have.attr', 'inputmode', 'tel');
      
      // Order summary should be collapsible
      cy.getByTestId('order-summary-toggle').click();
      cy.getByTestId('order-summary-details').should('be.visible');
    });

    it('supports mobile payment methods', () => {
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      cy.getByTestId('customer-email').type('mobile@example.com');
      cy.getByTestId('customer-name').type('Mobile User');
      
      // Should show mobile payment options
      cy.getByTestId('payment-method-tabs').within(() => {
        cy.getByTestId('tab-card').should('be.visible');
        cy.getByTestId('tab-apple-pay').should('be.visible');
        cy.getByTestId('tab-google-pay').should('be.visible');
      });
      
      // Test Apple Pay
      cy.getByTestId('tab-apple-pay').click();
      cy.getByTestId('apple-pay-button').should('be.visible');
    });
  });

  context('Security and Compliance', () => {
    it('encrypts sensitive data transmission', () => {
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      // Verify HTTPS
      cy.url().should('include', 'https://');
      
      // Check for security indicators
      cy.getByTestId('secure-checkout-badge').should('be.visible');
      cy.getByTestId('pci-compliance-badge').should('be.visible');
    });

    it('validates PCI compliance requirements', () => {
      cy.visit('/checkout');
      
      // Credit card form should be in iframe (Stripe Elements)
      cy.getByTestId('card-element').should('exist');
      
      // No card details should be stored locally
      cy.window().then((win) => {
        expect(win.localStorage.getItem('cardNumber')).to.be.null;
        expect(win.localStorage.getItem('cardCvc')).to.be.null;
      });
    });

    it('implements fraud prevention measures', () => {
      cy.intercept('POST', '/api/payments/risk-assessment', {
        statusCode: 200,
        body: { riskLevel: 'low', approved: true }
      }).as('riskAssessment');
      
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      cy.getByTestId('customer-email').type('test@example.com');
      cy.getByTestId('submit-payment').click();
      
      cy.wait('@riskAssessment');
      
      // Should proceed with low risk
      cy.getByTestId('payment-processing').should('be.visible');
    });
  });

  afterEach(() => {
    // Clean up any test subscriptions or payment methods
    cy.window().then((win) => {
      win.localStorage.removeItem('checkout-session');
      win.localStorage.removeItem('payment-intent');
    });
  });
});