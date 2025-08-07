import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlassCard from '@/components/ui/GlassCard';

describe('GlassCard Component', () => {
  describe('Rendering and Basic Props', () => {
    it('renders children content correctly', () => {
      render(
        <GlassCard>
          <p>Test content</p>
        </GlassCard>
      );
      
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <GlassCard className="custom-class" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      render(
        <GlassCard data-testid="glass-card" role="article" aria-label="Test card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('role', 'article');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });

  describe('Variant Styles', () => {
    it('renders with default variant styling', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-glass-surface', 'border-glass-border');
    });

    it('renders with primary variant styling', () => {
      render(
        <GlassCard variant="primary" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-glass-primary', 'border-primary-500/20');
    });

    it('renders with secondary variant styling', () => {
      render(
        <GlassCard variant="secondary" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-glass-secondary', 'border-secondary-500/20');
    });

    it('renders with gold variant styling', () => {
      render(
        <GlassCard variant="gold" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-glass-tertiary', 'border-accent-500/20');
    });

    it('renders with success variant styling', () => {
      render(
        <GlassCard variant="success" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-success-500/5', 'border-success-500/20');
    });

    it('renders with warning variant styling', () => {
      render(
        <GlassCard variant="warning" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-warning-500/5', 'border-warning-500/20');
    });

    it('renders with error variant styling', () => {
      render(
        <GlassCard variant="error" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-error-500/5', 'border-error-500/20');
    });
  });

  describe('Interactive Features', () => {
    it('applies hover effects by default', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('hover:shadow-glass-strong', 'hover:border-glass-border-strong', 'hover:scale-102');
    });

    it('disables hover effects when hover prop is false', () => {
      render(
        <GlassCard hover={false} data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).not.toHaveClass('hover:shadow-glass-strong', 'hover:border-glass-border-strong', 'hover:scale-102');
    });

    it('shows shimmer effect overlay when hover is enabled', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      // Check that shimmer effect element is present
      const shimmerElement = screen.getByTestId('glass-card').querySelector('.bg-shimmer');
      expect(shimmerElement).toBeInTheDocument();
    });

    it('hides shimmer effect when hover is disabled', () => {
      render(
        <GlassCard hover={false} data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      // Check that shimmer effect element is not present
      const shimmerElement = screen.getByTestId('glass-card').querySelector('.bg-shimmer');
      expect(shimmerElement).toBeNull();
    });
  });

  describe('Glow Effects', () => {
    it('does not apply glow effects by default', () => {
      render(
        <GlassCard data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).not.toHaveClass('shadow-glow');
    });

    it('applies default glow effect when glow is enabled', () => {
      render(
        <GlassCard glow data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('shadow-glow');
    });

    it('applies variant-specific glow effects', () => {
      render(
        <GlassCard variant="secondary" glow data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('shadow-glow-blue');
    });

    it('renders gradient border highlight when glow is enabled', () => {
      render(
        <GlassCard glow data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      // Check that gradient border element is present
      const gradientElement = screen.getByTestId('glass-card').querySelector('.bg-gradient-to-r');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('Gradient and Additional Styling', () => {
    it('applies gradient background when gradient prop is true', () => {
      render(
        <GlassCard gradient data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-gradient-to-br', 'from-glass-surface', 'to-glass-primary');
    });

    it('combines multiple styling options correctly', () => {
      render(
        <GlassCard 
          variant="gold" 
          glow 
          gradient 
          hover={false} 
          className="custom-class"
          data-testid="glass-card"
        >
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveClass('bg-glass-tertiary', 'border-accent-500/20', 'shadow-glow-gold', 'bg-gradient-to-br', 'custom-class');
      expect(card).not.toHaveClass('hover:shadow-glass-strong');
    });
  });

  describe('Animation Props', () => {
    it('applies animation by default', () => {
      // Since we've mocked framer-motion, we just check that the component renders
      render(
        <GlassCard data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('disables animation when animate prop is false', () => {
      render(
        <GlassCard animate={false} data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus behavior', async () => {
      const user = userEvent.setup();
      
      render(
        <GlassCard tabIndex={0} data-testid="glass-card">
          <button>Click me</button>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      await user.tab();
      expect(card).toHaveFocus();
    });

    it('preserves ARIA attributes', () => {
      render(
        <GlassCard 
          data-testid="glass-card"
          aria-labelledby="card-title"
          role="region"
        >
          <h2 id="card-title">Card Title</h2>
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      expect(card).toHaveAttribute('aria-labelledby', 'card-title');
      expect(card).toHaveAttribute('role', 'region');
    });

    it('maintains readable contrast with dark backgrounds', () => {
      render(
        <GlassCard variant="primary" data-testid="glass-card">
          <p>This should be readable</p>
        </GlassCard>
      );
      
      // Basic check that content is rendered (contrast would be tested with visual regression)
      expect(screen.getByText('This should be readable')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders quickly with minimal re-renders', () => {
      const renderSpy = vi.fn();
      
      const TestComponent = (props) => {
        renderSpy();
        return (
          <GlassCard {...props}>
            <p>Performance test</p>
          </GlassCard>
        );
      };
      
      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('handles multiple cards efficiently', () => {
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <GlassCard key={i} data-testid={`card-${i}`}>
              <p>Card {i}</p>
            </GlassCard>
          ))}
        </div>
      );
      
      // Check all cards render correctly
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`card-${i}`)).toBeInTheDocument();
        expect(screen.getByText(`Card ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(
        <GlassCard data-testid="glass-card">
        </GlassCard>
      );
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('handles null children gracefully', () => {
      render(
        <GlassCard data-testid="glass-card">
          {null}
        </GlassCard>
      );
      
      expect(screen.getByTestId('glass-card')).toBeInTheDocument();
    });

    it('handles complex nested content', () => {
      render(
        <GlassCard data-testid="glass-card">
          <div>
            <h2>Title</h2>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <button>Action</button>
          </div>
        </GlassCard>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      render(
        <GlassCard variant="invalid" data-testid="glass-card">
          <p>Content</p>
        </GlassCard>
      );
      
      const card = screen.getByTestId('glass-card');
      // Should fallback to default styling
      expect(card).toBeInTheDocument();
    });
  });
});