import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import Calculator from '@/components/Calculator';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import Navigation from '@/components/Navigation-Modern';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('WCAG 2.1 AA Compliance Tests', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    global.a11yHelpers.clearScreenReaderAnnouncements();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithQueryClient = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Semantic HTML and ARIA', () => {
    it('uses semantic HTML structure', async () => {
      const { container } = renderWithQueryClient(<Calculator />);
      
      // Check for proper semantic elements
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('form')).toBeInTheDocument();
      
      // Check for proper heading hierarchy
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
      
      // Verify heading hierarchy is logical (no skipped levels)
      const headingLevels = Array.from(headings).map(h => parseInt(h.tagName[1]));
      for (let i = 1; i < headingLevels.length; i++) {
        const current = headingLevels[i];
        const previous = headingLevels[i - 1];
        expect(current - previous).toBeLessThanOrEqual(1);
      }
      
      await expect(container).toBeAccessible();
    });

    it('provides proper ARIA labels and descriptions', () => {
      renderWithQueryClient(<Calculator />);
      
      // Form inputs should have proper labels
      const priceInput = screen.getByTestId('input-currentPrice');
      expect(priceInput).toHaveAttribute('aria-label');
      expect(priceInput).toHaveAccessibleName();
      
      const customersInput = screen.getByTestId('input-customers');
      expect(customersInput).toHaveAttribute('aria-label');
      expect(customersInput).toHaveAccessibleName();
      
      // Complex inputs should have descriptions
      const churnInput = screen.getByTestId('input-churnRate');
      const churnDescription = screen.getByTestId('churn-description');
      expect(churnInput).toHaveAttribute('aria-describedby', churnDescription.id);
    });

    it('implements proper landmark regions', () => {
      const { container } = renderWithQueryClient(
        <div>
          <Navigation />
          <Calculator />
        </div>
      );
      
      // Should have navigation landmark
      expect(container.querySelector('nav')).toBeInTheDocument();
      expect(container.querySelector('[role="navigation"]')).toBeInTheDocument();
      
      // Should have main content landmark
      expect(container.querySelector('main')).toBeInTheDocument();
      expect(container.querySelector('[role="main"]')).toBeInTheDocument();
      
      // Form should be properly identified
      expect(container.querySelector('form')).toBeInTheDocument();
      expect(container.querySelector('[role="form"]')).toBeInTheDocument();
    });

    it('provides meaningful page titles and headings', () => {
      renderWithQueryClient(<Calculator />);
      
      // Should have descriptive page title
      expect(document.title).toMatch(/pricing calculator/i);
      
      // Main heading should describe the page purpose
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/pricing calculator/i);
      
      // Section headings should be descriptive
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      sectionHeadings.forEach(heading => {
        expect(heading.textContent.trim()).toHaveLength.greaterThan(3);
      });
    });

    it('implements proper form validation messages', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);
      
      // Error messages should be announced to screen readers
      await waitFor(() => {
        const errorMessage = screen.getByTestId('validation-error');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
      });
      
      // Specific field errors should be associated with inputs
      const priceInput = screen.getByTestId('input-currentPrice');
      const priceError = screen.getByTestId('price-error');
      expect(priceInput).toHaveAttribute('aria-describedby', priceError.id);
      expect(priceInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Tab through all interactive elements
      const interactiveElements = screen.getAllByRole(/(button|textbox|combobox|checkbox|radio)/);
      
      for (let i = 0; i < interactiveElements.length; i++) {
        await user.tab();
        const focused = document.activeElement;
        
        expect(interactiveElements).toContainEqual(focused);
        expect(focused).toBeVisible();
        
        // Focus indicator should be visible
        const styles = window.getComputedStyle(focused, ':focus');
        expect(
          styles.outline !== 'none' || 
          styles.boxShadow !== 'none' || 
          styles.border !== 'none'
        ).toBe(true);
      }
    });

    it('maintains logical tab order', async () => {
      renderWithQueryClient(<Calculator />);
      
      const expectedOrder = [
        'input-currentPrice',
        'input-customers', 
        'input-churnRate',
        'input-competitorPrice',
        'input-cac',
        'calculate-button'
      ];
      
      const navigationResult = await global.a11yHelpers.testKeyboardNavigation(
        document.body,
        expectedOrder
      );
      
      expect(navigationResult.matches).toBe(true);
    });

    it('handles keyboard shortcuts properly', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Fill form first
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');
      await user.type(screen.getByTestId('input-competitorPrice'), '120');
      await user.type(screen.getByTestId('input-cac'), '300');
      
      // Submit with Enter
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
      
      // Export with Ctrl+E
      await user.keyboard('{Control>}e{/Control}');
      
      await waitFor(() => {
        expect(screen.getByTestId('export-modal')).toBeInTheDocument();
      });
    });

    it('traps focus in modals and dialogs', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Open modal
      const helpButton = screen.getByRole('button', { name: /help/i });
      await user.click(helpButton);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Focus should be trapped within modal
      const focusableInModal = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Tab should cycle through modal elements only
      for (let i = 0; i < focusableInModal.length + 2; i++) {
        await user.tab();
        const focused = document.activeElement;
        expect(modal.contains(focused)).toBe(true);
      }
      
      // Escape should close modal
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('provides skip links for keyboard users', () => {
      const { container } = renderWithQueryClient(
        <div>
          <Navigation />
          <Calculator />
        </div>
      );
      
      const skipLink = container.querySelector('.skip-link, [href="#main-content"]');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveTextContent(/skip to main content/i);
      
      // Skip link should be focusable
      skipLink.focus();
      expect(skipLink).toHaveFocus();
    });
  });

  describe('Color and Contrast', () => {
    it('meets WCAG AA color contrast requirements', () => {
      const { container } = render(<GlassCard>Test content</GlassCard>);
      
      expect(container.firstChild).toHaveNoColorContrastViolations();
    });

    it('maintains contrast in all component variants', () => {
      const variants = ['default', 'primary', 'secondary', 'success', 'warning', 'error'];
      
      variants.forEach(variant => {
        const { container } = render(
          <GlassCard variant={variant}>Test content</GlassCard>
        );
        
        const contrastTest = global.a11yHelpers.testColorContrast(container.firstChild);
        expect(contrastTest.pass).toBe(true);
        expect(parseFloat(contrastTest.ratio)).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('provides sufficient contrast for interactive elements', () => {
      const { container } = render(
        <GradientButton variant="primary">Click me</GradientButton>
      );
      
      const button = container.firstChild;
      const contrastTest = global.a11yHelpers.testColorContrast(button);
      
      expect(contrastTest.pass).toBe(true);
      
      // Test hover state
      fireEvent.mouseOver(button);
      const hoverContrastTest = global.a11yHelpers.testColorContrast(button);
      expect(hoverContrastTest.pass).toBe(true);
      
      // Test focus state
      button.focus();
      const focusContrastTest = global.a11yHelpers.testColorContrast(button);
      expect(focusContrastTest.pass).toBe(true);
    });

    it('does not rely solely on color to convey information', () => {
      renderWithQueryClient(<Calculator />);
      
      // Error states should have icons or text, not just red color
      const priceInput = screen.getByTestId('input-currentPrice');
      fireEvent.change(priceInput, { target: { value: '-10' } });
      fireEvent.blur(priceInput);
      
      const errorIndicator = screen.getByTestId('price-error');
      expect(errorIndicator).toBeInTheDocument();
      expect(errorIndicator.textContent).toMatch(/error|invalid|required/i);
      
      // Success states should have checkmarks or text, not just green color
      fireEvent.change(priceInput, { target: { value: '99' } });
      fireEvent.blur(priceInput);
      
      const successIndicator = screen.queryByTestId('price-success');
      if (successIndicator) {
        expect(successIndicator.textContent || successIndicator.getAttribute('aria-label')).toBeTruthy();
      }
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      const { container } = render(<GlassCard>High contrast content</GlassCard>);
      
      // Should apply high contrast styles
      const card = container.firstChild;
      const styles = window.getComputedStyle(card);
      
      // In high contrast mode, should have stronger borders and clearer backgrounds
      expect(styles.borderWidth).not.toBe('0px');
      expect(parseFloat(styles.borderWidth)).toBeGreaterThan(1);
    });
  });

  describe('Motion and Animation', () => {
    it('respects prefers-reduced-motion setting', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<GlassCard animate={true}>Animated content</GlassCard>);
      
      // Should not apply animations when reduced motion is preferred
      const card = screen.getByText('Animated content').parentElement;
      const styles = window.getComputedStyle(card);
      
      expect(styles.animationDuration).toBe('0s');
      expect(styles.transitionDuration).toBe('0s');
    });

    it('provides alternative ways to access animated content', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Results should be accessible both through animation and direct navigation
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');
      await user.type(screen.getByTestId('input-competitorPrice'), '120');
      await user.type(screen.getByTestId('input-cac'), '300');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);
      
      // Results should be announced to screen readers
      await waitFor(() => {
        const announcements = global.a11yHelpers.getScreenReaderAnnouncements();
        expect(announcements.some(a => a.message.includes('calculation complete'))).toBe(true);
      });
    });

    it('does not cause seizures with flashing content', () => {
      render(<GlassCard glow={true}>Glowing content</GlassCard>);
      
      // Glow animations should not flash more than 3 times per second
      const card = screen.getByText('Glowing content').parentElement;
      const styles = window.getComputedStyle(card);
      
      if (styles.animationDuration !== '0s') {
        const duration = parseFloat(styles.animationDuration);
        expect(duration).toBeGreaterThan(0.333); // Minimum 333ms to stay under 3 flashes/second
      }
    });
  });

  describe('Form Accessibility', () => {
    it('provides clear form instructions', () => {
      renderWithQueryClient(<Calculator />);
      
      // Form should have instructions
      const instructions = screen.getByTestId('form-instructions');
      expect(instructions).toBeInTheDocument();
      expect(instructions).toHaveTextContent(/required fields|complete the form/i);
      
      // Required fields should be clearly marked
      const requiredInputs = screen.getAllByRole('textbox', { required: true });
      requiredInputs.forEach(input => {
        expect(
          input.hasAttribute('aria-required') || 
          input.hasAttribute('required') ||
          input.getAttribute('aria-label')?.includes('required')
        ).toBe(true);
      });
    });

    it('groups related form controls', () => {
      renderWithQueryClient(<Calculator />);
      
      // Related inputs should be in fieldsets
      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets.length).toBeGreaterThan(0);
      
      fieldsets.forEach(fieldset => {
        expect(fieldset).toHaveAccessibleName();
      });
    });

    it('provides autocomplete attributes where appropriate', () => {
      renderWithQueryClient(<Calculator />);
      
      // Business-related inputs should have autocomplete
      const companyNameInput = screen.queryByTestId('input-companyName');
      if (companyNameInput) {
        expect(companyNameInput).toHaveAttribute('autocomplete', 'organization');
      }
      
      const emailInput = screen.queryByTestId('input-email');
      if (emailInput) {
        expect(emailInput).toHaveAttribute('autocomplete', 'email');
      }
    });

    it('handles form errors accessibly', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Submit form with errors
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);
      
      await waitFor(() => {
        // Error summary should be present and focused
        const errorSummary = screen.getByTestId('error-summary');
        expect(errorSummary).toBeInTheDocument();
        expect(errorSummary).toHaveAttribute('role', 'alert');
        expect(errorSummary).toHaveFocus();
        
        // Individual field errors should be linked to inputs
        const priceError = screen.getByTestId('price-error');
        const priceInput = screen.getByTestId('input-currentPrice');
        expect(priceInput).toHaveAttribute('aria-describedby', priceError.id);
        expect(priceInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('provides proper headings structure for screen readers', () => {
      const { container } = renderWithQueryClient(<Calculator />);
      
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const headingText = Array.from(headings).map(h => ({
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim()
      }));
      
      // Should start with h1
      expect(headingText[0]?.level).toBe(1);
      
      // No skipped levels
      for (let i = 1; i < headingText.length; i++) {
        const diff = headingText[i].level - headingText[i-1].level;
        expect(diff).toBeLessThanOrEqual(1);
      }
      
      // Headings should be descriptive
      headingText.forEach(heading => {
        expect(heading.text.length).toBeGreaterThan(0);
        expect(heading.text).not.toMatch(/^(click here|read more|link)$/i);
      });
    });

    it('announces dynamic content changes', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Fill and submit form
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');
      await user.type(screen.getByTestId('input-competitorPrice'), '120');
      await user.type(screen.getByTestId('input-cac'), '300');
      
      global.a11yHelpers.clearScreenReaderAnnouncements();
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);
      
      // Should announce calculation progress and completion
      await waitFor(() => {
        const announcements = global.a11yHelpers.getScreenReaderAnnouncements();
        expect(announcements.length).toBeGreaterThan(0);
        
        const hasProgressAnnouncement = announcements.some(a => 
          a.message.includes('calculating') || a.message.includes('processing')
        );
        expect(hasProgressAnnouncement).toBe(true);
      });
      
      await waitFor(() => {
        const announcements = global.a11yHelpers.getScreenReaderAnnouncements();
        const hasCompletionAnnouncement = announcements.some(a => 
          a.message.includes('complete') || a.message.includes('results')
        );
        expect(hasCompletionAnnouncement).toBe(true);
      });
    });

    it('provides descriptive button and link text', () => {
      renderWithQueryClient(<Calculator />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || button.textContent.trim();
        expect(accessibleName).toBeTruthy();
        expect(accessibleName).not.toMatch(/^(click|button|link)$/i);
        expect(accessibleName.length).toBeGreaterThan(2);
      });
      
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const accessibleName = link.getAttribute('aria-label') || link.textContent.trim();
        expect(accessibleName).toBeTruthy();
        expect(accessibleName).not.toMatch(/^(click here|read more|link)$/i);
      });
    });

    it('uses ARIA landmarks appropriately', () => {
      const { container } = renderWithQueryClient(
        <div>
          <Navigation />
          <Calculator />
        </div>
      );
      
      // Should have main landmarks
      expect(container.querySelector('[role="main"], main')).toBeInTheDocument();
      expect(container.querySelector('[role="navigation"], nav')).toBeInTheDocument();
      
      // Form should be identified
      const form = container.querySelector('form');
      expect(form).toHaveAttribute('role');
      expect(form).toHaveAccessibleName();
      
      // Complementary content should be marked
      const aside = container.querySelector('[role="complementary"], aside');
      if (aside) {
        expect(aside).toHaveAccessibleName();
      }
    });
  });

  describe('Touch and Mobile Accessibility', () => {
    it('provides adequate touch target sizes', () => {
      const { container } = render(
        <div>
          <GradientButton size="sm">Small Button</GradientButton>
          <GradientButton size="md">Medium Button</GradientButton>
          <GradientButton size="lg">Large Button</GradientButton>
        </div>
      );
      
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        
        // WCAG AA requires minimum 44x44px touch targets
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });
    });

    it('maintains proper spacing between touch targets', () => {
      const { container } = render(
        <div>
          <GradientButton>Button 1</GradientButton>
          <GradientButton>Button 2</GradientButton>
          <GradientButton>Button 3</GradientButton>
        </div>
      );
      
      const buttons = Array.from(container.querySelectorAll('button'));
      
      for (let i = 0; i < buttons.length - 1; i++) {
        const rect1 = buttons[i].getBoundingClientRect();
        const rect2 = buttons[i + 1].getBoundingClientRect();
        
        const distance = Math.abs(rect2.left - rect1.right);
        
        // Should have adequate spacing (recommend 8px minimum)
        expect(distance).toBeGreaterThanOrEqual(8);
      }
    });

    it('supports zoom up to 200% without horizontal scrolling', () => {
      // Mock viewport at 200% zoom
      Object.defineProperty(window, 'innerWidth', { value: 640, writable: true }); // 1280 / 2
      Object.defineProperty(window, 'innerHeight', { value: 360, writable: true }); // 720 / 2
      
      const { container } = renderWithQueryClient(<Calculator />);
      
      // Content should not cause horizontal overflow
      const body = document.body;
      const html = document.documentElement;
      
      const maxWidth = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      );
      
      expect(maxWidth).toBeLessThanOrEqual(window.innerWidth);
    });
  });

  describe('Error Prevention and Recovery', () => {
    it('provides clear error messages with recovery instructions', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Submit invalid data
      await user.type(screen.getByTestId('input-currentPrice'), '-10');
      await user.type(screen.getByTestId('input-churnRate'), '150');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);
      
      await waitFor(() => {
        const errorMessages = screen.getAllByRole('alert');
        errorMessages.forEach(error => {
          // Error messages should be descriptive and actionable
          expect(error.textContent).toMatch(/(must be|should be|required|invalid)/i);
          expect(error.textContent.length).toBeGreaterThan(10);
        });
      });
    });

    it('allows users to undo destructive actions', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Fill form with data
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      
      // Clear form (destructive action)
      const resetButton = screen.getByRole('button', { name: /reset|clear/i });
      await user.click(resetButton);
      
      // Should provide undo option
      const undoButton = screen.queryByRole('button', { name: /undo/i });
      expect(undoButton).toBeInTheDocument();
    });

    it('confirms before destructive actions', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);
      
      // Attempt destructive action
      const deleteButton = screen.queryByRole('button', { name: /delete|remove/i });
      if (deleteButton) {
        await user.click(deleteButton);
        
        // Should show confirmation dialog
        const confirmDialog = screen.getByRole('dialog');
        expect(confirmDialog).toBeInTheDocument();
        expect(confirmDialog).toHaveTextContent(/confirm|sure|delete/i);
        
        // Should have clear options
        expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /confirm|delete/i })).toBeInTheDocument();
      }
    });
  });
});