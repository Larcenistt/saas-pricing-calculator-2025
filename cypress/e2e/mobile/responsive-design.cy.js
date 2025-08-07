describe('Mobile and Responsive Design Testing', () => {
  // Common viewport sizes for testing
  const viewports = {
    mobile: { width: 375, height: 667 }, // iPhone SE
    mobileLarge: { width: 414, height: 896 }, // iPhone XR
    tablet: { width: 768, height: 1024 }, // iPad
    tabletLandscape: { width: 1024, height: 768 }, // iPad Landscape
    desktop: { width: 1280, height: 720 }, // Desktop
    desktopLarge: { width: 1920, height: 1080 }, // Large Desktop
  };

  context('Cross-Device Layout Adaptation', () => {
    Object.entries(viewports).forEach(([device, dimensions]) => {
      it(`adapts layout correctly on ${device} (${dimensions.width}x${dimensions.height})`, () => {
        cy.viewport(dimensions.width, dimensions.height);
        cy.visit('/');
        
        // Check responsive navigation
        if (dimensions.width < 768) {
          // Mobile navigation
          cy.getByTestId('mobile-menu-button').should('be.visible');
          cy.getByTestId('desktop-navigation').should('not.be.visible');
          
          // Test mobile menu
          cy.getByTestId('mobile-menu-button').click();
          cy.getByTestId('mobile-menu').should('be.visible');
          cy.getByTestId('mobile-menu-overlay').click();
          cy.getByTestId('mobile-menu').should('not.be.visible');
        } else {
          // Desktop navigation
          cy.getByTestId('desktop-navigation').should('be.visible');
          cy.getByTestId('mobile-menu-button').should('not.exist');
        }
        
        // Check content layout
        cy.getByTestId('main-content').should('be.visible');
        
        // Verify no horizontal overflow
        cy.get('body').should($body => {
          const scrollWidth = $body[0].scrollWidth;
          const clientWidth = $body[0].clientWidth;
          expect(scrollWidth).to.be.at.most(clientWidth + 5); // Small tolerance
        });
      });
    });

    it('maintains proper typography scaling across devices', () => {
      const typographyChecks = [
        { selector: 'h1', minSize: 24, maxSize: 48 },
        { selector: 'h2', minSize: 20, maxSize: 36 },
        { selector: 'p', minSize: 14, maxSize: 18 },
        { selector: 'button', minSize: 14, maxSize: 16 },
      ];

      Object.entries(viewports).forEach(([device, dimensions]) => {
        cy.viewport(dimensions.width, dimensions.height);
        cy.visit('/calculator');
        
        typographyChecks.forEach(({ selector, minSize, maxSize }) => {
          cy.get(selector).first().should($el => {
            const fontSize = parseFloat(window.getComputedStyle($el[0]).fontSize);
            expect(fontSize).to.be.at.least(minSize);
            expect(fontSize).to.be.at.most(maxSize);
          });
        });
      });
    });

    it('adapts calculator layout for mobile devices', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Form should stack vertically on mobile
      cy.getByTestId('calculator-form').should('have.class', 'mobile-layout');
      
      // Input fields should be full width
      cy.get('input').each($input => {
        cy.wrap($input).should($el => {
          const styles = window.getComputedStyle($el[0]);
          expect(styles.width).to.match(/100%|calc/);
        });
      });
      
      // Button should be full width on mobile
      cy.getByTestId('calculate-button').should('have.class', 'mobile-full-width');
      
      // Advanced options should be collapsible
      cy.getByTestId('advanced-options-toggle').should('be.visible');
      cy.getByTestId('advanced-options').should('not.be.visible');
      
      cy.getByTestId('advanced-options-toggle').click();
      cy.getByTestId('advanced-options').should('be.visible');
    });
  });

  context('Touch Interaction Optimization', () => {
    it('provides appropriate touch target sizes', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // All interactive elements should meet touch target requirements
      const touchTargets = [
        'button',
        'input',
        '[role="button"]',
        '[role="tab"]',
        'a'
      ];
      
      touchTargets.forEach(selector => {
        cy.get(selector).each($element => {
          cy.wrap($element).should($el => {
            const rect = $el[0].getBoundingClientRect();
            expect(rect.width).to.be.at.least(44); // WCAG minimum
            expect(rect.height).to.be.at.least(44);
          });
        });
      });
    });

    it('handles touch gestures for interactive elements', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Test swipe gestures on sliders/ranges
      cy.get('[data-testid="price-range-slider"]').then($slider => {
        if ($slider.length) {
          cy.wrap($slider)
            .trigger('touchstart', { touches: [{ clientX: 100, clientY: 100 }] })
            .trigger('touchmove', { touches: [{ clientX: 200, clientY: 100 }] })
            .trigger('touchend');
          
          // Value should change
          cy.getByTestId('input-currentPrice').should('not.have.value', '');
        }
      });
      
      // Test pinch zoom doesn't interfere with interactions
      cy.get('body')
        .trigger('touchstart', { 
          touches: [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 }
          ] 
        })
        .trigger('touchmove', { 
          touches: [
            { clientX: 90, clientY: 90 },
            { clientX: 210, clientY: 210 }
          ] 
        })
        .trigger('touchend');
      
      // UI should remain functional
      cy.getByTestId('calculate-button').should('be.visible');
    });

    it('optimizes form input for mobile keyboards', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Numeric inputs should trigger numeric keyboard
      cy.getByTestId('input-currentPrice').should('have.attr', 'inputmode', 'numeric');
      cy.getByTestId('input-customers').should('have.attr', 'inputmode', 'numeric');
      
      // Email inputs should trigger email keyboard
      cy.get('[type="email"]').should('have.attr', 'inputmode', 'email');
      
      // Phone inputs should trigger tel keyboard
      cy.get('[type="tel"]').should('have.attr', 'inputmode', 'tel');
    });

    it('handles orientation changes gracefully', () => {
      cy.viewport(375, 667); // Portrait
      cy.visit('/calculator');
      
      cy.getByTestId('calculator-container').should('be.visible');
      
      // Switch to landscape
      cy.viewport(667, 375);
      
      // Layout should adapt
      cy.getByTestId('calculator-container').should('be.visible');
      
      // Form should still be usable
      cy.getByTestId('input-currentPrice').should('be.visible');
      cy.getByTestId('calculate-button').should('be.visible');
    });
  });

  context('Mobile Performance Optimization', () => {
    it('loads quickly on mobile networks', () => {
      cy.viewport(375, 667);
      
      // Simulate slow 3G
      cy.intercept('**/*', (req) => {
        req.reply((res) => {
          res.delay(100); // Add network delay
          res.send(res.body);
        });
      });
      
      const startTime = Date.now();
      cy.visit('/calculator');
      
      cy.getByTestId('calculator-container').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // Under 5s for slow connection
      });
    });

    it('lazy loads non-critical content on mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      // Above-the-fold content should load immediately
      cy.getByTestId('hero-section').should('be.visible');
      
      // Below-the-fold content should lazy load
      cy.scrollTo('bottom');
      cy.getByTestId('testimonials-section').should('be.visible');
      
      // Images should lazy load
      cy.get('img[loading="lazy"]').should('have.length.gt', 0);
    });

    it('minimizes data usage for mobile users', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Should load optimized images
      cy.get('img').each($img => {
        cy.wrap($img).should($el => {
          const src = $el.attr('src') || $el.attr('data-src');
          if (src) {
            expect(src).to.match(/(\.webp|\.avif|w_\d+|q_auto)/); // Optimized formats
          }
        });
      });
      
      // Should defer non-critical resources
      cy.get('script[defer], link[rel="preload"]').should('have.length.gt', 0);
    });

    it('maintains 60fps scrolling on mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      let frameCount = 0;
      const startTime = performance.now();
      
      // Monitor scroll performance
      cy.window().then(win => {
        const measurePerformance = () => {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            win.requestAnimationFrame(measurePerformance);
          }
        };
        measurePerformance();
      });
      
      // Perform scroll
      cy.scrollTo(0, 500, { duration: 1000 });
      
      cy.window().then(() => {
        expect(frameCount).to.be.at.least(50); // Close to 60fps
      });
    });
  });

  context('Mobile-Specific Features', () => {
    it('provides pull-to-refresh functionality', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Simulate pull-to-refresh gesture
      cy.get('body')
        .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 200, clientY: 300 }] }, { force: true })
        .wait(100)
        .trigger('touchend');
      
      // Should show refresh indicator
      cy.get('[data-testid="refresh-indicator"]').should('be.visible');
    });

    it('supports native mobile sharing', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Mock Web Share API
      cy.window().then(win => {
        win.navigator.share = cy.stub().resolves();
      });
      
      cy.getByTestId('share-button').click();
      
      cy.window().then(win => {
        expect(win.navigator.share).to.have.been.calledWith({
          title: 'My Pricing Analysis',
          text: 'Check out my SaaS pricing analysis',
          url: Cypress.config().baseUrl + '/calculator'
        });
      });
    });

    it('integrates with mobile system features', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Should support iOS/Android theme colors
      cy.get('meta[name="theme-color"]').should('exist');
      cy.get('meta[name="apple-mobile-web-app-status-bar-style"]').should('exist');
      
      // Should be installable as PWA
      cy.get('link[rel="manifest"]').should('exist');
      
      // Should have proper viewport settings
      cy.get('meta[name="viewport"]')
        .should('have.attr', 'content')
        .and('contain', 'width=device-width')
        .and('contain', 'initial-scale=1');
    });

    it('handles mobile payment flows', () => {
      cy.viewport(375, 667);
      cy.visit('/pricing');
      cy.getByTestId('select-professional').click();
      
      // Mobile checkout should be optimized
      cy.getByTestId('checkout-form').should('have.class', 'mobile-optimized');
      
      // Should support mobile payment methods
      cy.get('[data-testid="payment-methods"]').within(() => {
        cy.get('[data-testid="apple-pay"]').should('be.visible');
        cy.get('[data-testid="google-pay"]').should('be.visible');
      });
      
      // Form should be touch-optimized
      cy.get('input').each($input => {
        cy.wrap($input).should($el => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.height).to.be.at.least(48); // Touch-friendly height
        });
      });
    });
  });

  context('Responsive Images and Media', () => {
    it('serves appropriate image sizes for each viewport', () => {
      Object.entries(viewports).forEach(([device, dimensions]) => {
        cy.viewport(dimensions.width, dimensions.height);
        cy.visit('/');
        
        cy.get('img[srcset], picture source').each($element => {
          cy.wrap($element).should($el => {
            const srcset = $el.attr('srcset') || $el.attr('data-srcset');
            if (srcset) {
              // Should have multiple size options
              expect(srcset.split(',').length).to.be.gt(1);
            }
          });
        });
      });
    });

    it('optimizes video playback for mobile', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      cy.get('video').each($video => {
        cy.wrap($video).should('have.attr', 'preload', 'metadata');
        cy.wrap($video).should('have.attr', 'controls');
        
        // Should not autoplay on mobile to save data
        cy.wrap($video).should('not.have.attr', 'autoplay');
      });
    });

    it('provides fallbacks for unsupported media formats', () => {
      cy.viewport(375, 667);
      cy.visit('/');
      
      cy.get('video').each($video => {
        cy.wrap($video).within(() => {
          // Should have multiple source formats
          cy.get('source').should('have.length.gt', 1);
          
          // Should have fallback content
          cy.get('p, div').should('exist');
        });
      });
    });
  });

  context('Cross-Browser Mobile Testing', () => {
    const mobileUserAgents = {
      iOS: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      Android: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
      iPadOS: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
    };

    Object.entries(mobileUserAgents).forEach(([platform, userAgent]) => {
      it(`works correctly on ${platform}`, () => {
        cy.viewport(375, 667);
        
        // Mock user agent
        cy.visit('/calculator', {
          onBeforeLoad: (win) => {
            Object.defineProperty(win.navigator, 'userAgent', {
              value: userAgent
            });
          }
        });
        
        // Core functionality should work
        cy.fillCalculatorForm();
        cy.submitCalculation();
        cy.get('[data-testid="results-section"]').should('be.visible');
        
        // Platform-specific features should be available
        if (platform === 'iOS') {
          cy.get('[data-testid="add-to-homescreen"]').should('be.visible');
        }
      });
    });
  });

  context('Offline and Network Resilience', () => {
    it('gracefully handles poor connectivity', () => {
      cy.viewport(375, 667);
      
      // Simulate intermittent connectivity
      let requestCount = 0;
      cy.intercept('**/*', (req) => {
        requestCount++;
        if (requestCount % 3 === 0) {
          req.reply({ statusCode: 408 }); // Timeout every 3rd request
        } else {
          req.continue();
        }
      });
      
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      cy.getByTestId('calculate-button').click();
      
      // Should show retry options
      cy.get('[data-testid="network-error"]').should('be.visible');
      cy.getByTestId('retry-button').click();
      
      // Should eventually succeed
      cy.get('[data-testid="results-section"]').should('be.visible');
    });

    it('provides offline functionality', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Simulate offline mode
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'onLine', { value: false });
        win.dispatchEvent(new Event('offline'));
      });
      
      // Should show offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      
      // Basic calculations should still work
      cy.fillCalculatorForm();
      cy.getByTestId('calculate-button').click();
      cy.get('[data-testid="results-section"]').should('be.visible');
      
      // Should queue actions for when online
      cy.getByTestId('export-button').click();
      cy.get('[data-testid="queued-action"]').should('be.visible');
    });

    it('syncs data when connectivity is restored', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Go offline, make changes
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'onLine', { value: false });
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.fillCalculatorForm();
      cy.getByTestId('save-button').click();
      
      // Come back online
      cy.window().then(win => {
        Object.defineProperty(win.navigator, 'onLine', { value: true });
        win.dispatchEvent(new Event('online'));
      });
      
      // Should sync changes
      cy.get('[data-testid="sync-indicator"]').should('be.visible');
      cy.get('[data-testid="sync-success"]').should('be.visible');
    });
  });

  // Helper commands for mobile testing
  Cypress.Commands.add('swipeLeft', (selector) => {
    cy.get(selector)
      .trigger('touchstart', { touches: [{ clientX: 300, clientY: 300 }] })
      .trigger('touchmove', { touches: [{ clientX: 100, clientY: 300 }] })
      .trigger('touchend');
  });

  Cypress.Commands.add('swipeRight', (selector) => {
    cy.get(selector)
      .trigger('touchstart', { touches: [{ clientX: 100, clientY: 300 }] })
      .trigger('touchmove', { touches: [{ clientX: 300, clientY: 300 }] })
      .trigger('touchend');
  });

  Cypress.Commands.add('pinchZoom', (selector, scale = 2) => {
    cy.get(selector)
      .trigger('touchstart', { 
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 200, clientY: 200 }
        ] 
      })
      .trigger('touchmove', { 
        touches: [
          { clientX: 100 - (50 * scale), clientY: 100 - (50 * scale) },
          { clientX: 200 + (50 * scale), clientY: 200 + (50 * scale) }
        ] 
      })
      .trigger('touchend');
  });

  Cypress.Commands.add('testResponsiveBreakpoint', (breakpoint, callback) => {
    const breakpoints = {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536
    };
    
    const width = breakpoints[breakpoint] || breakpoint;
    cy.viewport(width, 768);
    callback();
  });
});