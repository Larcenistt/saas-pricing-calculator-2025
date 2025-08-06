import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Calculator from '../components/Calculator';
import { analyticsService } from '../utils/analytics';

// Mock analytics
jest.mock('../utils/analytics', () => ({
  analyticsService: {
    trackCalculatorUse: jest.fn(),
    trackPDFExport: jest.fn(),
  },
}));

// Mock PDF export
jest.mock('../utils/exportPDF', () => ({
  exportToPDF: jest.fn().mockResolvedValue(true),
}));

describe('Calculator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('renders all input fields', () => {
      render(<Calculator />);
      
      expect(screen.getByLabelText(/current price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of customers/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/monthly churn rate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/competitor.*price/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customer acquisition cost/i)).toBeInTheDocument();
    });

    it('validates required fields', async () => {
      render(<Calculator />);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });
    });

    it('validates numeric inputs', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      const priceInput = screen.getByLabelText(/current price/i);
      await user.type(priceInput, 'abc');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/please enter valid numbers/i)).toBeInTheDocument();
      });
    });

    it('validates price range', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      const priceInput = screen.getByLabelText(/current price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '-10');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/price must be positive/i)).toBeInTheDocument();
      });
    });

    it('validates churn rate percentage', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      const churnInput = screen.getByLabelText(/churn rate/i);
      await user.clear(churnInput);
      await user.type(churnInput, '150');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/churn rate must be between 0 and 100/i)).toBeInTheDocument();
      });
    });
  });

  describe('Calculation Logic', () => {
    const validInputs = {
      currentPrice: '99',
      customers: '100',
      churnRate: '5',
      competitorPrice: '120',
      cac: '300',
    };

    beforeEach(async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      // Fill in all inputs
      for (const [field, value] of Object.entries(validInputs)) {
        const input = screen.getByTestId(`input-${field}`);
        await user.clear(input);
        await user.type(input, value);
      }
    });

    it('performs calculation with valid inputs', async () => {
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
      
      // Check that analytics was tracked
      expect(analyticsService.trackCalculatorUse).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 99,
          customers: 100,
          churnRate: 5,
        })
      );
    });

    it('generates three pricing tiers', async () => {
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/starter/i)).toBeInTheDocument();
        expect(screen.getByText(/professional/i)).toBeInTheDocument();
        expect(screen.getByText(/enterprise/i)).toBeInTheDocument();
      });
    });

    it('calculates correct metrics', async () => {
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        // MRR = price * customers = 99 * 100 = 9900
        expect(screen.getByText(/\$9,900/)).toBeInTheDocument();
        
        // Check for LTV calculation
        expect(screen.getByText(/ltv/i)).toBeInTheDocument();
        
        // Check for CAC ratio
        expect(screen.getByText(/ltv.*cac/i)).toBeInTheDocument();
      });
    });

    it('provides pricing insights', async () => {
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/insights/i)).toBeInTheDocument();
        expect(screen.getByTestId('insights-list').children.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      // Fill inputs and calculate
      const inputs = {
        currentPrice: '99',
        customers: '100',
        churnRate: '5',
        competitorPrice: '120',
        cac: '300',
      };
      
      for (const [field, value] of Object.entries(inputs)) {
        const input = screen.getByTestId(`input-${field}`);
        await user.clear(input);
        await user.type(input, value);
      }
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
    });

    it('shows export button after calculation', () => {
      expect(screen.getByRole('button', { name: /export.*pdf/i })).toBeInTheDocument();
    });

    it('exports results to PDF', async () => {
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(analyticsService.trackPDFExport).toHaveBeenCalled();
      });
      
      const { exportToPDF } = require('../utils/exportPDF');
      expect(exportToPDF).toHaveBeenCalledWith(
        expect.objectContaining({
          inputs: expect.any(Object),
          results: expect.any(Object),
        })
      );
    });

    it('shows success message after export', async () => {
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/export successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('shows loading state during calculation', async () => {
      render(<Calculator />);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      expect(screen.getByText(/calculating/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/calculating/i)).not.toBeInTheDocument();
      });
    });

    it('allows resetting the form', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      const priceInput = screen.getByLabelText(/current price/i);
      await user.type(priceInput, '199');
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);
      
      expect(priceInput).toHaveValue(99); // Default value
    });

    it('preserves inputs when toggling advanced options', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      const priceInput = screen.getByLabelText(/current price/i);
      await user.clear(priceInput);
      await user.type(priceInput, '149');
      
      const advancedToggle = screen.getByRole('button', { name: /advanced/i });
      fireEvent.click(advancedToggle);
      
      expect(priceInput).toHaveValue(149);
    });

    it('shows tooltips for complex fields', async () => {
      render(<Calculator />);
      
      const cacTooltip = screen.getByTestId('tooltip-cac');
      fireEvent.mouseEnter(cacTooltip);
      
      await waitFor(() => {
        expect(screen.getByText(/cost to acquire a new customer/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
      
      render(<Calculator />);
      
      const container = screen.getByTestId('calculator-container');
      expect(container).toHaveClass('mobile-layout');
    });

    it('shows mobile-optimized results', async () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(max-width: 768px)',
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      }));
      
      render(<Calculator />);
      
      // Calculate with valid inputs
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const resultsCard = screen.getByTestId('results-card');
        expect(resultsCard).toHaveClass('mobile-card');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles calculation errors gracefully', async () => {
      // Mock calculation error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Calculator />);
      
      // Force an error by mocking internal calculation
      const calculator = screen.getByTestId('calculator-container');
      calculator._calculatePricing = jest.fn().mockImplementation(() => {
        throw new Error('Calculation failed');
      });
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
      });
      
      console.error.mockRestore();
    });

    it('handles export errors gracefully', async () => {
      const { exportToPDF } = require('../utils/exportPDF');
      exportToPDF.mockRejectedValueOnce(new Error('Export failed'));
      
      render(<Calculator />);
      
      // Calculate first
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<Calculator />);
      
      expect(screen.getByRole('form', { name: /pricing calculator/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /results/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      render(<Calculator />);
      const user = userEvent.setup();
      
      // Tab through inputs
      await user.tab();
      expect(screen.getByLabelText(/current price/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/number of customers/i)).toHaveFocus();
      
      // Submit with Enter key
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText(/please fill in all required fields/i)).toBeInTheDocument();
      });
    });

    it('announces results to screen readers', async () => {
      render(<Calculator />);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      fireEvent.click(calculateButton);
      
      await waitFor(() => {
        const resultsRegion = screen.getByRole('region', { name: /results/i });
        expect(resultsRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});