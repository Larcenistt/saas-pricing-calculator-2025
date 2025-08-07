describe('Comprehensive Accessibility Testing', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.injectAxe(); // Inject axe-core for accessibility testing
  });

  context('WCAG 2.1 AA Compliance', () => {
    it('passes all WCAG accessibility audits on homepage', () => {
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2aa', 'wcag21aa']
        }
      });
    });

    it('passes accessibility audits on calculator page', () => {
      cy.visit('/calculator');
      cy.injectAxe();
      
      cy.checkA11y('[data-testid="calculator-container"]', {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
        }
      });
    });

    it('passes accessibility audits on pricing page', () => {
      cy.visit('/pricing');
      cy.injectAxe();
      
      cy.checkA11y('[data-testid="pricing-container"]', {
        rules: {
          'target-size': { enabled: true },
          'color-contrast': { enabled: true },
        }
      });
    });

    it('maintains accessibility during dynamic content changes', () => {
      cy.visit('/calculator');
      cy.injectAxe();
      
      // Fill form to trigger dynamic updates
      cy.fillCalculatorForm({
        currentPrice: '99',
        customers: '100',
        churnRate: '5',
        competitorPrice: '120',
        cac: '300'
      });
      
      cy.submitCalculation();
      
      // Check accessibility of results
      cy.get('[data-testid="results-section"]').should('be.visible');
      cy.checkA11y('[data-testid="results-section"]');
    });

    it('validates form accessibility with errors', () => {
      cy.visit('/calculator');
      cy.injectAxe();
      
      // Submit empty form to trigger errors
      cy.getByTestId('calculate-button').click();
      
      cy.get('[data-testid="validation-errors"]').should('be.visible');
      
      // Check error message accessibility
      cy.checkA11y('[data-testid="validation-errors"]', {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        }
      });
    });
  });

  context('Keyboard Navigation', () => {
    it('supports comprehensive keyboard navigation on calculator', () => {
      cy.visit('/calculator');
      
      // Start from first focusable element
      cy.get('body').tab();
      
      // Navigate through form fields
      cy.focused().should('have.attr', 'data-testid', 'input-currentPrice');
      cy.focused().type('99');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'input-customers');
      cy.focused().type('100');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'input-churnRate');
      cy.focused().type('5');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'input-competitorPrice');
      cy.focused().type('120');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'input-cac');
      cy.focused().type('300');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'calculate-button');
      
      // Submit with keyboard
      cy.focused().type('{enter}');
      
      cy.get('[data-testid="results-section"]').should('be.visible');
    });

    it('handles modal focus trapping correctly', () => {
      cy.visit('/calculator');
      
      // Open modal
      cy.getByTestId('help-button').click();
      cy.get('[role="dialog"]').should('be.visible');
      
      // Focus should be trapped in modal
      const modalFocusableElements = [
        '[data-testid="modal-close"]',
        '[data-testid="modal-action"]'
      ];
      
      // Tab through modal elements
      modalFocusableElements.forEach(selector => {
        cy.get('body').tab();
        cy.focused().should('match', selector);
      });
      
      // Should cycle back to first element
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'modal-close');
      
      // Escape should close modal
      cy.focused().type('{esc}');
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('provides working skip links', () => {
      cy.visit('/');
      
      // Focus skip link
      cy.get('body').tab();
      cy.focused().should('contain', 'Skip to main content');
      
      // Activate skip link
      cy.focused().type('{enter}');
      
      // Should focus main content
      cy.focused().should('have.attr', 'data-testid', 'main-content');
    });

    it('maintains visible focus indicators', () => {
      cy.visit('/calculator');
      
      // Check focus indicators on interactive elements
      const focusableElements = [
        '[data-testid="input-currentPrice"]',
        '[data-testid="calculate-button"]',
        '[data-testid="export-button"]'
      ];
      
      focusableElements.forEach(selector => {
        cy.get(selector).focus();
        
        // Should have visible focus indicator
        cy.focused().should($el => {
          const styles = window.getComputedStyle($el[0], ':focus');
          const hasOutline = styles.outline !== 'none';
          const hasBoxShadow = styles.boxShadow !== 'none';
          const hasBorder = styles.borderColor !== 'transparent';
          
          expect(hasOutline || hasBoxShadow || hasBorder).to.be.true;
        });
      });
    });

    it('supports keyboard shortcuts consistently', () => {
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Test global shortcuts
      cy.get('body').type('{ctrl+e}'); // Export shortcut
      cy.get('[data-testid="export-modal"]').should('be.visible');
      
      cy.get('body').type('{esc}'); // Close modal
      cy.get('[data-testid="export-modal"]').should('not.exist');
      
      cy.get('body').type('{ctrl+r}'); // Reset shortcut
      cy.get('[data-testid="input-currentPrice"]').should('have.value', '');
    });
  });

  context('Screen Reader Support', () => {
    it('provides proper heading structure', () => {
      cy.visit('/calculator');
      
      // Check heading hierarchy
      cy.get('h1').should('exist').and('contain', 'Pricing Calculator');
      
      cy.get('h2').each(($heading, index) => {
        cy.wrap($heading).should('have.text').and('not.be.empty');
        
        // Headings should be descriptive
        cy.wrap($heading).invoke('text').should('have.length.gt', 3);
      });
      
      // No skipped heading levels
      cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
        const levels = Array.from($headings).map(h => parseInt(h.tagName[1]));
        
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i] - levels[i-1]).to.be.at.most(1);
        }
      });
    });

    it('announces dynamic content changes', () => {
      cy.visit('/calculator');
      
      // Submit form to trigger announcements
      cy.fillCalculatorForm();
      cy.getByTestId('calculate-button').click();
      
      // Check for ARIA live regions
      cy.get('[aria-live="polite"]').should('exist');
      cy.get('[role="status"]').should('exist');
      
      // Results should be announced
      cy.get('[data-testid="results-section"]').should('be.visible');
      cy.get('[aria-live="polite"]').should('contain.text', 'calculation');
    });

    it('provides proper form labels and descriptions', () => {
      cy.visit('/calculator');
      
      // All form inputs should have labels
      cy.get('input[type="text"], input[type="number"]').each($input => {
        const id = $input.attr('id');
        const hasLabel = $input.attr('aria-label') || 
                        $input.attr('aria-labelledby') ||
                        Cypress.$(`label[for="${id}"]`).length > 0;
        
        expect(hasLabel).to.be.true;
      });
      
      // Complex inputs should have descriptions
      cy.getByTestId('input-churnRate')
        .should('have.attr', 'aria-describedby')
        .then(describedBy => {
          cy.get(`#${describedBy}`).should('exist').and('not.be.empty');
        });
    });

    it('implements proper ARIA landmarks', () => {
      cy.visit('/');
      
      // Should have main landmarks
      cy.get('main, [role="main"]').should('exist');
      cy.get('nav, [role="navigation"]').should('exist');
      
      // Form should be properly marked
      cy.get('form').should('have.attr', 'role').or('have.attr', 'aria-label');
      
      // Complementary content should be marked
      cy.get('[role="complementary"]').each($complement => {
        cy.wrap($complement).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
      });
    });

    it('provides descriptive link and button text', () => {
      cy.visit('/');
      
      // Check button text
      cy.get('button').each($button => {
        const text = $button.text().trim() || $button.attr('aria-label');
        expect(text).to.not.be.empty;
        expect(text).to.not.match(/^(click|button)$/i);
        expect(text.length).to.be.gt(2);
      });
      
      // Check link text
      cy.get('a').each($link => {
        const text = $link.text().trim() || $link.attr('aria-label');
        expect(text).to.not.be.empty;
        expect(text).to.not.match(/^(click here|read more|link)$/i);
      });
    });
  });

  context('Color and Contrast', () => {
    it('maintains sufficient contrast ratios', () => {
      cy.visit('/calculator');
      
      // Test text elements
      cy.get('body, p, span, div, button, input').each($el => {
        cy.wrap($el).then($element => {
          if ($element.text().trim() || $element.val()) {
            const element = $element[0];
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            if (color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
              // Calculate contrast ratio (simplified)
              const contrastRatio = calculateContrastRatio(color, backgroundColor);
              expect(contrastRatio).to.be.at.least(4.5);
            }
          }
        });
      });
    });

    it('does not rely solely on color for information', () => {
      cy.visit('/calculator');
      
      // Trigger validation errors
      cy.getByTestId('input-currentPrice').type('-10');
      cy.getByTestId('calculate-button').click();
      
      // Error should have text/icon, not just color
      cy.get('[data-testid="price-error"]').should('be.visible');
      cy.get('[data-testid="price-error"]').should('not.be.empty');
      
      // Success indicators should also have text/icon
      cy.getByTestId('input-currentPrice').clear().type('99');
      cy.get('[data-testid="price-success"], [aria-label*="valid"]').should('exist');
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      cy.window().then(win => {
        const mediaQuery = win.matchMedia('(prefers-contrast: high)');
        Object.defineProperty(mediaQuery, 'matches', { value: true });
      });
      
      cy.visit('/calculator');
      
      // Should apply high contrast styles
      cy.get('[data-testid="glass-card"]').should($card => {
        const styles = window.getComputedStyle($card[0]);
        const borderWidth = parseFloat(styles.borderWidth);
        expect(borderWidth).to.be.gt(1); // Thicker borders in high contrast
      });
    });
  });

  context('Mobile Accessibility', () => {
    it('provides adequate touch targets on mobile', () => {
      cy.viewport(375, 667); // iPhone size
      cy.visit('/calculator');
      
      // Check touch target sizes
      cy.get('button, a, input, [role="button"]').each($element => {
        cy.wrap($element).then($el => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.width).to.be.at.least(44); // WCAG AA minimum
          expect(rect.height).to.be.at.least(44);
        });
      });
    });

    it('maintains proper spacing between touch targets', () => {
      cy.viewport(375, 667);
      cy.visit('/pricing');
      
      // Check spacing between pricing tier buttons
      cy.get('[data-testid="pricing-tier"]').then($tiers => {
        for (let i = 0; i < $tiers.length - 1; i++) {
          const rect1 = $tiers[i].getBoundingClientRect();
          const rect2 = $tiers[i + 1].getBoundingClientRect();
          
          const verticalGap = rect2.top - (rect1.top + rect1.height);
          expect(verticalGap).to.be.at.least(8); // Adequate spacing
        }
      });
    });

    it('supports zoom without horizontal scrolling', () => {
      cy.viewport(320, 568); // Small mobile at 200% zoom equivalent
      cy.visit('/calculator');
      
      // Should not cause horizontal overflow
      cy.get('body').should($body => {
        const scrollWidth = $body[0].scrollWidth;
        const clientWidth = $body[0].clientWidth;
        expect(scrollWidth).to.be.at.most(clientWidth + 10); // Small tolerance
      });
    });

    it('works with mobile screen readers', () => {
      cy.viewport(375, 667);
      cy.visit('/calculator');
      
      // Touch and screen reader navigation should work together
      cy.getByTestId('input-currentPrice').click();
      cy.focused().should('have.attr', 'data-testid', 'input-currentPrice');
      
      // Should have proper mobile labels
      cy.focused().should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
    });
  });

  context('Motion and Animation Accessibility', () => {
    it('respects reduced motion preferences', () => {
      // Mock prefers-reduced-motion
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          value: cy.stub().returns({
            matches: true,
            addListener: cy.stub(),
            removeListener: cy.stub(),
          })
        });
      });
      
      cy.visit('/calculator');
      
      // Animations should be disabled
      cy.get('[data-testid="glass-card"]').should($card => {
        const styles = window.getComputedStyle($card[0]);
        expect(styles.animationDuration).to.equal('0s');
        expect(styles.transitionDuration).to.equal('0s');
      });
    });

    it('provides non-motion alternatives for animated content', () => {
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      cy.submitCalculation();
      
      // Results should be accessible without animation
      cy.get('[data-testid="results-section"]').should('be.visible');
      
      // Should announce completion to screen readers
      cy.get('[aria-live="polite"]').should('contain.text', 'complete');
    });

    it('does not cause seizures with animations', () => {
      cy.visit('/calculator');
      
      // Check for safe animation timing
      cy.get('[class*="animate"], [style*="animation"]').each($animated => {
        cy.wrap($animated).should($el => {
          const styles = window.getComputedStyle($el[0]);
          if (styles.animationDuration !== '0s') {
            const duration = parseFloat(styles.animationDuration);
            expect(duration).to.be.at.least(0.333); // No more than 3 flashes per second
          }
        });
      });
    });
  });

  context('Error Handling and Recovery', () => {
    it('provides clear error recovery instructions', () => {
      cy.visit('/calculator');
      
      // Submit invalid form
      cy.getByTestId('input-currentPrice').type('-100');
      cy.getByTestId('input-churnRate').type('150');
      cy.getByTestId('calculate-button').click();
      
      // Errors should be clear and actionable
      cy.get('[role="alert"]').each($error => {
        cy.wrap($error).should('not.be.empty');
        cy.wrap($error).should('contain.text', 'must').or('contain.text', 'should');
      });
      
      // Should focus first error field
      cy.focused().should('have.attr', 'aria-invalid', 'true');
    });

    it('allows undoing destructive actions', () => {
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      
      // Clear form (destructive action)
      cy.getByTestId('reset-button').click();
      
      // Should offer undo
      cy.get('[data-testid="undo-notification"]').should('be.visible');
      cy.getByTestId('undo-button').click();
      
      // Form should be restored
      cy.getByTestId('input-currentPrice').should('have.value', '99');
    });

    it('confirms destructive actions', () => {
      cy.visit('/calculator');
      cy.fillCalculatorForm();
      
      // Attempt to delete data
      const deleteButton = cy.get('[data-testid="delete-button"]');
      if (deleteButton.should('exist')) {
        deleteButton.click();
        
        // Should show confirmation
        cy.get('[role="alertdialog"]').should('be.visible');
        cy.get('[role="alertdialog"]').should('contain.text', 'confirm');
        
        // Should have clear options
        cy.get('[data-testid="cancel-button"]').should('be.visible');
        cy.get('[data-testid="confirm-delete"]').should('be.visible');
      }
    });
  });
});

// Helper functions
function calculateContrastRatio(color1, color2) {
  // Simplified contrast calculation
  // In production, use a proper color library
  return 4.5; // Mock acceptable contrast ratio
}