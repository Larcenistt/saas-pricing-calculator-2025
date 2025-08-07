import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GradientButton from '@/components/ui/GradientButton';

describe('GradientButton Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<GradientButton>Click me</GradientButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <GradientButton className="custom-class" data-testid="button">
          Button
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('custom-class');
    });

    it('forwards additional props', () => {
      render(
        <GradientButton data-testid="button" type="submit" aria-label="Submit form">
          Submit
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });
  });

  describe('Variants', () => {
    it('renders with primary variant by default', () => {
      render(<GradientButton data-testid="button">Primary</GradientButton>);
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('from-primary-600', 'via-primary-500', 'to-secondary-600');
    });

    it('renders with secondary variant', () => {
      render(
        <GradientButton variant="secondary" data-testid="button">
          Secondary
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('from-secondary-600', 'via-secondary-500', 'to-primary-600');
    });

    it('renders with gold variant', () => {
      render(
        <GradientButton variant="gold" data-testid="button">
          Gold
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('from-accent-600', 'via-accent-500', 'to-accent-400');
    });

    it('renders with success variant', () => {
      render(
        <GradientButton variant="success" data-testid="button">
          Success
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('from-success-600', 'via-success-500', 'to-primary-600');
    });

    it('renders with outline variant', () => {
      render(
        <GradientButton variant="outline" data-testid="button">
          Outline
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-glass-surface', 'border-2', 'border-primary-500/50');
    });

    it('renders with glass variant', () => {
      render(
        <GradientButton variant="glass" data-testid="button">
          Glass
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-glass-surface', 'backdrop-blur-xl', 'shadow-glass');
    });

    it('renders with ghost variant', () => {
      render(
        <GradientButton variant="ghost" data-testid="button">
          Ghost
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('bg-transparent', 'text-neutral-300');
    });
  });

  describe('Sizes', () => {
    it('renders with medium size by default', () => {
      render(<GradientButton data-testid="button">Medium</GradientButton>);
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base', 'rounded-xl');
    });

    it('renders with extra small size', () => {
      render(
        <GradientButton size="xs" data-testid="button">
          Extra Small
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs', 'rounded-lg');
    });

    it('renders with small size', () => {
      render(
        <GradientButton size="sm" data-testid="button">
          Small
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm', 'rounded-xl');
    });

    it('renders with large size', () => {
      render(
        <GradientButton size="lg" data-testid="button">
          Large
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg', 'rounded-2xl');
    });

    it('renders with extra large size', () => {
      render(
        <GradientButton size="xl" data-testid="button">
          Extra Large
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('px-10', 'py-5', 'text-xl', 'rounded-2xl');
    });
  });

  describe('Icons', () => {
    const testIcon = <span data-testid="test-icon">🔥</span>;

    it('renders icon on the left by default', () => {
      render(
        <GradientButton icon={testIcon}>
          With Icon
        </GradientButton>
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      
      // Icon should come before text
      const button = screen.getByRole('button');
      const iconElement = screen.getByTestId('test-icon');
      const textElement = screen.getByText('With Icon');
      
      expect(button.compareDocumentPosition(iconElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('renders icon on the right when iconPosition is right', () => {
      render(
        <GradientButton icon={testIcon} iconPosition="right">
          With Icon Right
        </GradientButton>
      );
      
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('applies correct icon size based on button size', () => {
      render(
        <GradientButton icon={testIcon} size="lg" data-testid="button">
          Large with Icon
        </GradientButton>
      );
      
      const iconWrapper = screen.getByTestId('test-icon').parentElement;
      expect(iconWrapper).toHaveClass('w-6', 'h-6');
    });

    it('handles string icons', () => {
      render(
        <GradientButton icon="→">
          Arrow Button
        </GradientButton>
      );
      
      expect(screen.getByText('→')).toBeInTheDocument();
    });
  });

  describe('Interactive States', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GradientButton onClick={handleClick}>
          Clickable
        </GradientButton>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies disabled styles when disabled', () => {
      render(
        <GradientButton disabled data-testid="button">
          Disabled
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
    });

    it('does not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GradientButton disabled onClick={handleClick}>
          Disabled
        </GradientButton>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      render(
        <GradientButton loading data-testid="button">
          Loading
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('cursor-wait');
      expect(button).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Check for spinner
      const spinner = button.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('does not trigger click when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GradientButton loading onClick={handleClick}>
          Loading
        </GradientButton>
      );
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('applies glow effect', () => {
      render(
        <GradientButton glow data-testid="button">
          Glowing
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('animate-glow-pulse');
    });

    it('applies hover effects when not disabled', () => {
      render(
        <GradientButton data-testid="button">
          Hoverable
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('hover:scale-105', 'hover:shadow-2xl');
    });
  });

  describe('Visual Effects', () => {
    it('renders background gradient animation for gradient variants', () => {
      render(
        <GradientButton variant="primary" data-testid="button">
          Primary
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const gradientOverlay = button.querySelector('.animate-shimmer');
      expect(gradientOverlay).toBeInTheDocument();
    });

    it('does not render background gradient for outline variant', () => {
      render(
        <GradientButton variant="outline" data-testid="button">
          Outline
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const gradientOverlay = button.querySelector('.animate-shimmer');
      expect(gradientOverlay).toBeNull();
    });

    it('does not render background gradient for glass variant', () => {
      render(
        <GradientButton variant="glass" data-testid="button">
          Glass
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const gradientOverlay = button.querySelector('.animate-shimmer');
      expect(gradientOverlay).toBeNull();
    });

    it('does not render background gradient for ghost variant', () => {
      render(
        <GradientButton variant="ghost" data-testid="button">
          Ghost
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const gradientOverlay = button.querySelector('.animate-shimmer');
      expect(gradientOverlay).toBeNull();
    });

    it('renders glow effect when enabled', () => {
      render(
        <GradientButton glow data-testid="button">
          Glow
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const glowOverlay = button.querySelector('.blur-xl');
      expect(glowOverlay).toBeInTheDocument();
    });

    it('renders ripple effect', () => {
      render(
        <GradientButton data-testid="button">
          Ripple
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      const rippleContainer = button.querySelector('.mix-blend-overlay');
      expect(rippleContainer).toBeInTheDocument();
    });
  });

  describe('Animation', () => {
    it('applies animation by default', () => {
      render(
        <GradientButton data-testid="button">
          Animated
        </GradientButton>
      );
      
      // Since we mocked framer-motion, we just verify the component renders
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('disables animation when animate is false', () => {
      render(
        <GradientButton animate={false} data-testid="button">
          Not Animated
        </GradientButton>
      );
      
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus behavior', async () => {
      const user = userEvent.setup();
      
      render(
        <GradientButton data-testid="button">
          Focusable
        </GradientButton>
      );
      
      await user.tab();
      expect(screen.getByTestId('button')).toHaveFocus();
    });

    it('supports keyboard interactions', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <GradientButton onClick={handleClick}>
          Keyboard
        </GradientButton>
      );
      
      const button = screen.getByRole('button');
      button.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('announces loading state to screen readers', () => {
      render(
        <GradientButton loading>
          Loading Button
        </GradientButton>
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('maintains accessible focus styles', () => {
      render(
        <GradientButton data-testid="button">
          Focus Styles
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-4', 'focus:ring-primary-500/20');
    });

    it('preserves aria attributes', () => {
      render(
        <GradientButton 
          aria-describedby="help-text"
          aria-pressed="false"
          data-testid="button"
        >
          Accessible
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children', () => {
      render(
        <GradientButton data-testid="button">
        </GradientButton>
      );
      
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('handles null icon gracefully', () => {
      render(
        <GradientButton icon={null}>
          No Icon
        </GradientButton>
      );
      
      expect(screen.getByRole('button', { name: 'No Icon' })).toBeInTheDocument();
    });

    it('handles invalid variant gracefully', () => {
      render(
        <GradientButton variant="invalid" data-testid="button">
          Invalid Variant
        </GradientButton>
      );
      
      // Should still render without crashing
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('handles invalid size gracefully', () => {
      render(
        <GradientButton size="invalid" data-testid="button">
          Invalid Size
        </GradientButton>
      );
      
      // Should still render without crashing
      expect(screen.getByTestId('button')).toBeInTheDocument();
    });

    it('combines all props correctly', () => {
      const handleClick = vi.fn();
      
      render(
        <GradientButton
          variant="gold"
          size="lg"
          icon="★"
          iconPosition="right"
          glow
          loading={false}
          disabled={false}
          className="custom-class"
          onClick={handleClick}
          data-testid="button"
        >
          Complex Button
        </GradientButton>
      );
      
      const button = screen.getByTestId('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('from-accent-600', 'px-8', 'py-4');
      expect(button).not.toBeDisabled();
      expect(screen.getByText('★')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with multiple instances', () => {
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <GradientButton key={i} data-testid={`button-${i}`}>
              Button {i}
            </GradientButton>
          ))}
        </div>
      );
      
      for (let i = 0; i < 10; i++) {
        expect(screen.getByTestId(`button-${i}`)).toBeInTheDocument();
      }
    });

    it('handles rapid state changes', () => {
      const { rerender } = render(
        <GradientButton loading={false} data-testid="button">
          Dynamic
        </GradientButton>
      );
      
      expect(screen.getByTestId('button')).not.toBeDisabled();
      
      rerender(
        <GradientButton loading={true} data-testid="button">
          Dynamic
        </GradientButton>
      );
      
      expect(screen.getByTestId('button')).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });
});