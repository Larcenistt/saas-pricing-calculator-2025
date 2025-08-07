import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '@/components/Calculator';
import * as aiService from '@/services/ai.client';
import * as analyticsService from '@/utils/analytics';
import * as exportPDF from '@/utils/exportPDF';

// Mock all external dependencies
vi.mock('@/services/ai.client');
vi.mock('@/utils/analytics');
vi.mock('@/utils/exportPDF');
vi.mock('socket.io-client');

describe('Calculator Component - Premium Features', () => {
  const mockAIInsights = {
    recommendations: [
      'Consider implementing value-based pricing tiers',
      'Your current pricing is 15% below market average',
      'Implementing annual billing could increase LTV by 20%'
    ],
    competitiveAnalysis: 'Well positioned against competitors',
    optimizationOpportunities: ['Price increase opportunity', 'Bundle optimization'],
    confidence: 85,
  };

  const mockCalculationResults = {
    mrr: 9900,
    ltv: 1881.43,
    ltvCacRatio: 6.27,
    paybackPeriod: 4.8,
    pricingTiers: [
      { name: 'Starter', price: 79, features: ['Basic analytics', 'Email support'] },
      { name: 'Professional', price: 149, features: ['Advanced analytics', 'Priority support'] },
      { name: 'Enterprise', price: 299, features: ['Custom integrations', 'Dedicated support'] },
    ],
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock AI service
    vi.mocked(aiService.getAIInsights).mockResolvedValue(mockAIInsights);
    
    // Mock analytics
    vi.mocked(analyticsService.analyticsService.trackCalculatorUse).mockResolvedValue(true);
    vi.mocked(analyticsService.analyticsService.trackPDFExport).mockResolvedValue(true);
    
    // Mock PDF export
    vi.mocked(exportPDF.exportToPDF).mockResolvedValue(true);
  });

  describe('AI-Powered Insights Integration', () => {
    it('fetches AI insights after successful calculation', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      // Fill out form with valid data
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
      await user.click(calculateButton);
      
      // Wait for calculation to complete
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
      
      // Verify AI service was called
      expect(aiService.getAIInsights).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPrice: 99,
          customers: 100,
          churnRate: 5,
          competitorPrice: 120,
          cac: 300,
        })
      );
    });

    it('displays AI recommendations in the results', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      // Complete calculation
      await fillFormAndCalculate(user);
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });
      
      // Check that AI recommendations are displayed
      for (const recommendation of mockAIInsights.recommendations) {
        expect(screen.getByText(recommendation)).toBeInTheDocument();
      }
      
      // Check confidence score
      expect(screen.getByText(`${mockAIInsights.confidence}%`)).toBeInTheDocument();
    });

    it('shows loading state while fetching AI insights', async () => {
      // Make AI service slower to test loading state
      vi.mocked(aiService.getAIInsights).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAIInsights), 1000))
      );
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Should show AI loading state
      await waitFor(() => {
        expect(screen.getByText(/generating ai insights/i)).toBeInTheDocument();
      });
      
      // Eventually should show results
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('handles AI service errors gracefully', async () => {
      vi.mocked(aiService.getAIInsights).mockRejectedValue(new Error('AI service unavailable'));
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });
      
      // Should show fallback message instead of crashing
      expect(screen.getByText(/ai insights temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Premium Visualization Features', () => {
    it('renders interactive pricing tier chart', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      await waitFor(() => {
        expect(screen.getByTestId('pricing-tiers-chart')).toBeInTheDocument();
      });
      
      // Should show all three tiers
      expect(screen.getByText('Starter')).toBeInTheDocument();
      expect(screen.getByText('Professional')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('displays advanced metrics visualization', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      await waitFor(() => {
        // Check for advanced metrics cards
        expect(screen.getByTestId('ltv-cac-chart')).toBeInTheDocument();
        expect(screen.getByTestId('revenue-projection-chart')).toBeInTheDocument();
        expect(screen.getByTestId('payback-period-chart')).toBeInTheDocument();
      });
    });

    it('supports chart interactions', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      await waitFor(() => {
        const chart = screen.getByTestId('pricing-tiers-chart');
        expect(chart).toBeInTheDocument();
      });
      
      // Click on a tier to see details
      const professionalTier = screen.getByText('Professional');
      await user.click(professionalTier);
      
      // Should show tier details
      await waitFor(() => {
        expect(screen.getByTestId('tier-details-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Export Features', () => {
    it('generates professional PDF with AI insights', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Wait for AI insights to load
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(exportPDF.exportToPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            aiInsights: mockAIInsights,
            includeRecommendations: true,
            template: 'professional',
          })
        );
      });
    });

    it('supports different export templates', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Open export options
      const exportOptions = screen.getByTestId('export-options-dropdown');
      await user.click(exportOptions);
      
      // Select executive template
      const executiveTemplate = screen.getByText('Executive Summary');
      await user.click(executiveTemplate);
      
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(exportPDF.exportToPDF).toHaveBeenCalledWith(
          expect.objectContaining({
            template: 'executive',
          })
        );
      });
    });

    it('tracks export analytics with template type', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(analyticsService.analyticsService.trackPDFExport).toHaveBeenCalledWith(
          expect.objectContaining({
            template: expect.any(String),
            hasAIInsights: true,
          })
        );
      });
    });
  });

  describe('Real-time Collaboration Features', () => {
    it('shows collaboration indicators', async () => {
      // Mock WebSocket connection
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        connected: true,
      };
      
      vi.mocked(require('socket.io-client').io).mockReturnValue(mockSocket);
      
      render(<Calculator />);
      
      // Should show collaboration status
      expect(screen.getByTestId('collaboration-indicator')).toBeInTheDocument();
    });

    it('displays real-time user activity', async () => {
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'user-activity') {
            // Simulate other user activity
            callback({
              userId: '123',
              userName: 'John Doe',
              action: 'editing',
              field: 'currentPrice',
            });
          }
        }),
        off: vi.fn(),
        connected: true,
      };
      
      vi.mocked(require('socket.io-client').io).mockReturnValue(mockSocket);
      
      render(<Calculator />);
      
      // Should show other user's activity
      await waitFor(() => {
        expect(screen.getByText(/john doe is editing/i)).toBeInTheDocument();
      });
    });

    it('syncs changes across users', async () => {
      const mockSocket = {
        emit: vi.fn(),
        on: vi.fn((event, callback) => {
          if (event === 'calculation-updated') {
            callback({
              inputs: { currentPrice: 149 },
              results: mockCalculationResults,
            });
          }
        }),
        off: vi.fn(),
        connected: true,
      };
      
      vi.mocked(require('socket.io-client').io).mockReturnValue(mockSocket);
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      // Should update UI with synced data
      await waitFor(() => {
        const priceInput = screen.getByTestId('input-currentPrice');
        expect(priceInput).toHaveValue(149);
      });
    });
  });

  describe('Progressive Enhancement Features', () => {
    it('shows advanced options toggle', () => {
      render(<Calculator />);
      
      const advancedToggle = screen.getByRole('button', { name: /advanced options/i });
      expect(advancedToggle).toBeInTheDocument();
    });

    it('reveals additional fields in advanced mode', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      const advancedToggle = screen.getByRole('button', { name: /advanced options/i });
      await user.click(advancedToggle);
      
      // Should show advanced fields
      expect(screen.getByLabelText(/customer lifetime value/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/market size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/growth rate/i)).toBeInTheDocument();
    });

    it('preserves basic inputs when toggling advanced mode', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      // Fill basic inputs
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.clear(priceInput);
      await user.type(priceInput, '199');
      
      // Toggle advanced mode
      const advancedToggle = screen.getByRole('button', { name: /advanced options/i });
      await user.click(advancedToggle);
      
      // Basic input should be preserved
      expect(priceInput).toHaveValue(199);
    });
  });

  describe('Industry Template Integration', () => {
    it('shows industry template selector', () => {
      render(<Calculator />);
      
      const templateSelector = screen.getByTestId('industry-template-selector');
      expect(templateSelector).toBeInTheDocument();
    });

    it('pre-populates fields with template data', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      const templateSelector = screen.getByTestId('industry-template-selector');
      await user.selectOptions(templateSelector, 'b2b-saas');
      
      // Should pre-fill with B2B SaaS typical values
      await waitFor(() => {
        const churnInput = screen.getByTestId('input-churnRate');
        expect(churnInput).toHaveValue(5); // Typical B2B SaaS churn
      });
    });

    it('provides industry-specific benchmarks', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      const templateSelector = screen.getByTestId('industry-template-selector');
      await user.selectOptions(templateSelector, 'b2b-saas');
      
      await fillFormAndCalculate(user);
      
      // Should show industry benchmarks
      await waitFor(() => {
        expect(screen.getByText(/industry benchmark/i)).toBeInTheDocument();
        expect(screen.getByText(/vs average b2b saas/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and User Experience', () => {
    it('shows calculation progress', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Should show progress during calculation
      expect(screen.getByTestId('calculation-progress')).toBeInTheDocument();
    });

    it('provides real-time input validation', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.clear(priceInput);
      await user.type(priceInput, '-50');
      
      // Should show validation error immediately
      await waitFor(() => {
        expect(screen.getByText(/price must be positive/i)).toBeInTheDocument();
      });
    });

    it('shows helpful tooltips for complex fields', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      const cacTooltip = screen.getByTestId('tooltip-cac');
      await user.hover(cacTooltip);
      
      await waitFor(() => {
        expect(screen.getByText(/customer acquisition cost/i)).toBeInTheDocument();
      });
    });

    it('supports keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Ctrl+E should trigger export
      await user.keyboard('{Control>}e{/Control}');
      
      await waitFor(() => {
        expect(exportPDF.exportToPDF).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    it('handles network failures gracefully', async () => {
      vi.mocked(aiService.getAIInsights).mockRejectedValue(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Should show error message without crashing
      await waitFor(() => {
        expect(screen.getByText(/connection issue/i)).toBeInTheDocument();
      });
      
      // Should provide retry option
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('recovers from temporary errors', async () => {
      // First call fails, second succeeds
      vi.mocked(aiService.getAIInsights)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValue(mockAIInsights);
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Should show error initially
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
      
      // Retry should work
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });
    });

    it('provides fallback when AI is unavailable', async () => {
      vi.mocked(aiService.getAIInsights).mockRejectedValue(new Error('Service unavailable'));
      
      const user = userEvent.setup();
      render(<Calculator />);
      
      await fillFormAndCalculate(user);
      
      // Should show results without AI insights
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
        expect(screen.getByText(/basic recommendations/i)).toBeInTheDocument();
      });
    });
  });

  // Helper function to fill form and calculate
  async function fillFormAndCalculate(user) {
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
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('results-section')).toBeInTheDocument();
    });
  }
});