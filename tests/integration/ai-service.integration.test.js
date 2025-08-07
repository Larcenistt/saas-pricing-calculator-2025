import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '@/components/Calculator';
import * as aiService from '@/services/ai.client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Integration tests for AI service with real API interaction patterns
describe('AI Service Integration', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
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

  describe('AI Insights Generation', () => {
    it('integrates with OpenAI service for pricing recommendations', async () => {
      // Mock successful API response
      const mockInsights = {
        recommendations: [
          'Consider implementing value-based pricing tiers',
          'Your pricing is competitive but could be optimized for growth',
          'Bundle features to increase average deal size'
        ],
        competitiveAnalysis: 'Well-positioned in the mid-market segment',
        riskAssessment: 'Low risk for price increase',
        confidence: 87,
        reasoning: 'Based on industry benchmarks and pricing psychology principles',
        marketPosition: 'competitive',
        optimizationOpportunities: [
          { type: 'price_increase', impact: 'high', confidence: 85 },
          { type: 'bundling', impact: 'medium', confidence: 78 }
        ]
      };

      vi.mocked(aiService.getAIInsights).mockResolvedValue(mockInsights);

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      // Fill form with realistic data
      const formData = {
        currentPrice: '149',
        customers: '245',
        churnRate: '3.5',
        competitorPrice: '179',
        cac: '520',
        industry: 'b2b-saas',
        companyStage: 'growth'
      };

      Object.entries(formData).forEach(async ([field, value]) => {
        const input = screen.getByTestId(`input-${field}`);
        if (input) {
          await user.clear(input);
          await user.type(input, value);
        }
      });

      // Submit calculation
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Wait for AI insights
      await waitFor(() => {
        expect(aiService.getAIInsights).toHaveBeenCalledWith(
          expect.objectContaining({
            currentPrice: 149,
            customers: 245,
            churnRate: 3.5,
            competitorPrice: 179,
            cac: 520
          })
        );
      });

      // Verify AI insights are displayed
      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });

      // Check recommendations
      mockInsights.recommendations.forEach(recommendation => {
        expect(screen.getByText(recommendation)).toBeInTheDocument();
      });

      // Check confidence score
      expect(screen.getByText('87%')).toBeInTheDocument();
      expect(screen.getByText('High Confidence')).toBeInTheDocument();

      // Check competitive analysis
      expect(screen.getByText(mockInsights.competitiveAnalysis)).toBeInTheDocument();
    });

    it('handles AI service rate limiting gracefully', async () => {
      // Mock rate limiting response
      vi.mocked(aiService.getAIInsights).mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
        retryAfter: 60
      });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should show rate limit message
      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again in/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('provides fallback recommendations when AI fails', async () => {
      // Mock AI service failure
      vi.mocked(aiService.getAIInsights).mockRejectedValue(new Error('Service unavailable'));

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should show fallback recommendations
      await waitFor(() => {
        expect(screen.getByTestId('fallback-insights')).toBeInTheDocument();
        expect(screen.getByText(/ai insights temporarily unavailable/i)).toBeInTheDocument();
        expect(screen.getByText(/basic recommendations/i)).toBeInTheDocument();
      });

      // Should still show basic pricing analysis
      expect(screen.getByText(/consider testing a price increase/i)).toBeInTheDocument();
      expect(screen.getByText(/monitor competitor pricing/i)).toBeInTheDocument();
    });

    it('retries AI requests with exponential backoff', async () => {
      let callCount = 0;
      vi.mocked(aiService.getAIInsights).mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          recommendations: ['Successful after retry'],
          confidence: 85
        });
      });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('Successful after retry')).toBeInTheDocument();
      }, { timeout: 10000 });

      expect(callCount).toBe(3);
    });

    it('customizes AI prompts based on industry context', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      // Select e-commerce industry
      const industrySelect = screen.getByTestId('industry-template-selector');
      await user.selectOptions(industrySelect, 'e-commerce');

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(aiService.getAIInsights).toHaveBeenCalledWith(
          expect.objectContaining({
            industry: 'e-commerce',
            context: expect.objectContaining({
              type: 'e-commerce',
              specificConcerns: expect.arrayContaining([
                'cart_abandonment',
                'conversion_rates',
                'shipping_costs'
              ])
            })
          })
        );
      });
    });
  });

  describe('Real-time AI Features', () => {
    it('provides progressive AI insights during form filling', async () => {
      vi.mocked(aiService.getPartialInsights).mockResolvedValue({
        quickTips: ['Price point looks reasonable for B2B SaaS'],
        confidence: 'partial'
      });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      // Start typing price
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.type(priceInput, '99');

      // Should trigger partial insights
      await waitFor(() => {
        expect(aiService.getPartialInsights).toHaveBeenCalled();
      });

      expect(screen.getByText(/price point looks reasonable/i)).toBeInTheDocument();
    });

    it('streams AI responses for better UX', async () => {
      // Mock streaming response
      const mockStream = {
        recommendations: ['Streaming recommendation 1'],
        partial: true,
        progress: 0.3
      };

      vi.mocked(aiService.streamAIInsights).mockImplementation(async function* () {
        yield { ...mockStream, progress: 0.3 };
        yield { ...mockStream, recommendations: [...mockStream.recommendations, 'Streaming recommendation 2'], progress: 0.6 };
        yield { 
          recommendations: [...mockStream.recommendations, 'Streaming recommendation 2', 'Final recommendation'],
          partial: false,
          progress: 1.0
        };
      });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should show progressive updates
      await waitFor(() => {
        expect(screen.getByText('Streaming recommendation 1')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Streaming recommendation 2')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Final recommendation')).toBeInTheDocument();
      });

      // Progress indicator should reach 100%
      await waitFor(() => {
        expect(screen.getByTestId('ai-progress')).toHaveAttribute('value', '100');
      });
    });
  });

  describe('AI Model Performance', () => {
    it('measures and reports AI response times', async () => {
      let responseTime;
      vi.mocked(aiService.getAIInsights).mockImplementation(async () => {
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate 1.5s response
        responseTime = Date.now() - startTime;
        
        return {
          recommendations: ['Test recommendation'],
          confidence: 85,
          responseTime
        };
      });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });

      // Should track performance metrics
      expect(screen.getByTestId('ai-response-time')).toBeInTheDocument();
      expect(responseTime).toBeLessThan(3000); // Should be under 3s
    });

    it('handles different AI model confidence levels', async () => {
      const testCases = [
        { confidence: 95, expectedClass: 'high-confidence', expectedText: 'Very High Confidence' },
        { confidence: 85, expectedClass: 'high-confidence', expectedText: 'High Confidence' },
        { confidence: 65, expectedClass: 'medium-confidence', expectedText: 'Medium Confidence' },
        { confidence: 45, expectedClass: 'low-confidence', expectedText: 'Low Confidence' }
      ];

      for (const testCase of testCases) {
        vi.mocked(aiService.getAIInsights).mockResolvedValue({
          recommendations: ['Test recommendation'],
          confidence: testCase.confidence
        });

        const user = userEvent.setup();
        renderWithQueryClient(<Calculator />);

        await fillBasicForm(user);
        
        const calculateButton = screen.getByRole('button', { name: /calculate/i });
        await user.click(calculateButton);

        await waitFor(() => {
          const confidenceIndicator = screen.getByTestId('confidence-indicator');
          expect(confidenceIndicator).toHaveClass(testCase.expectedClass);
          expect(confidenceIndicator).toHaveTextContent(testCase.expectedText);
        });

        queryClient.clear();
      }
    });

    it('validates AI recommendation quality', async () => {
      const lowQualityResponse = {
        recommendations: ['Generic advice'],
        confidence: 30,
        reasoning: '',
        specificity: 'low'
      };

      vi.mocked(aiService.getAIInsights).mockResolvedValue(lowQualityResponse);

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        // Should show quality warning for low-quality responses
        expect(screen.getByTestId('quality-warning')).toBeInTheDocument();
        expect(screen.getByText(/recommendations may be generic/i)).toBeInTheDocument();
      });

      // Should offer to retry with more context
      expect(screen.getByRole('button', { name: /get better insights/i })).toBeInTheDocument();
    });
  });

  describe('AI Context Management', () => {
    it('maintains conversation context across interactions', async () => {
      const initialInsights = {
        recommendations: ['Initial recommendation'],
        conversationId: 'conv_123',
        confidence: 85
      };

      const followUpInsights = {
        recommendations: ['Follow-up recommendation based on previous context'],
        conversationId: 'conv_123',
        confidence: 88
      };

      vi.mocked(aiService.getAIInsights)
        .mockResolvedValueOnce(initialInsights)
        .mockResolvedValueOnce(followUpInsights);

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      // First calculation
      await fillBasicForm(user);
      
      let calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText('Initial recommendation')).toBeInTheDocument();
      });

      // Modify inputs and recalculate
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.clear(priceInput);
      await user.type(priceInput, '199');

      calculateButton = screen.getByRole('button', { name: /recalculate/i });
      await user.click(calculateButton);

      // Second call should include conversation context
      await waitFor(() => {
        expect(aiService.getAIInsights).toHaveBeenLastCalledWith(
          expect.objectContaining({
            conversationId: 'conv_123',
            previousRecommendations: ['Initial recommendation']
          })
        );
      });

      expect(screen.getByText('Follow-up recommendation based on previous context')).toBeInTheDocument();
    });

    it('learns from user feedback on recommendations', async () => {
      vi.mocked(aiService.getAIInsights).mockResolvedValue({
        recommendations: [
          { id: 'rec_1', text: 'Increase price by 20%', confidence: 85 },
          { id: 'rec_2', text: 'Add premium tier', confidence: 78 }
        ],
        confidence: 85
      });

      vi.mocked(aiService.submitFeedback).mockResolvedValue({ success: true });

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByTestId('ai-insights-section')).toBeInTheDocument();
      });

      // Provide feedback on recommendations
      const thumbsUp = screen.getByTestId('thumbs-up-rec_1');
      await user.click(thumbsUp);

      const thumbsDown = screen.getByTestId('thumbs-down-rec_2');
      await user.click(thumbsDown);

      // Should submit feedback to AI service
      await waitFor(() => {
        expect(aiService.submitFeedback).toHaveBeenCalledWith([
          { recommendationId: 'rec_1', feedback: 'positive' },
          { recommendationId: 'rec_2', feedback: 'negative' }
        ]);
      });
    });

    it('personalizes recommendations based on user history', async () => {
      const userProfile = {
        industry: 'b2b-saas',
        companySize: 'startup',
        previousCalculations: 3,
        preferredStrategies: ['conservative_growth', 'value_based_pricing']
      };

      vi.mocked(aiService.getAIInsights).mockResolvedValue({
        recommendations: ['Personalized recommendation based on your previous calculations'],
        confidence: 92,
        personalizationScore: 'high'
      });

      // Mock user authentication
      global.testUtils.mockAuthUser = userProfile;

      const user = userEvent.setup();
      renderWithQueryClient(<Calculator />);

      await fillBasicForm(user);
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      await waitFor(() => {
        expect(aiService.getAIInsights).toHaveBeenCalledWith(
          expect.objectContaining({
            userProfile,
            personalizationEnabled: true
          })
        );
      });

      expect(screen.getByTestId('personalization-indicator')).toBeInTheDocument();
      expect(screen.getByText('Personalized recommendation based on your previous calculations')).toBeInTheDocument();
    });
  });

  // Helper function to fill basic form
  async function fillBasicForm(user) {
    const formData = {
      currentPrice: '99',
      customers: '100',
      churnRate: '5',
      competitorPrice: '120',
      cac: '300'
    };

    for (const [field, value] of Object.entries(formData)) {
      const input = screen.getByTestId(`input-${field}`);
      await user.clear(input);
      await user.type(input, value);
    }
  }
});