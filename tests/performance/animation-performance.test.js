import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '@/components/Calculator';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';

// Animation performance testing
describe('Animation Performance Tests', () => {
  let performanceEntries = [];
  let animationFrameCallbacks = [];
  let rafId = 0;

  beforeEach(() => {
    // Mock performance API
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
    global.performance.getEntriesByType = vi.fn(() => performanceEntries);
    global.performance.getEntriesByName = vi.fn((name) => 
      performanceEntries.filter(entry => entry.name === name)
    );

    // Mock requestAnimationFrame for controlled testing
    global.requestAnimationFrame = vi.fn((callback) => {
      const id = rafId++;
      animationFrameCallbacks.push({ id, callback, timestamp: performance.now() });
      return id;
    });

    global.cancelAnimationFrame = vi.fn((id) => {
      const index = animationFrameCallbacks.findIndex(cb => cb.id === id);
      if (index > -1) {
        animationFrameCallbacks.splice(index, 1);
      }
    });

    // Mock IntersectionObserver for animation triggers
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
      observe: vi.fn(() => {
        // Simulate element coming into view
        setTimeout(() => {
          callback([{ isIntersecting: true, target: document.body }]);
        }, 100);
      }),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    performanceEntries = [];
    animationFrameCallbacks = [];
    rafId = 0;
    vi.clearAllMocks();
  });

  describe('60fps Animation Requirements', () => {
    it('maintains 60fps during card hover animations', async () => {
      const user = userEvent.setup();
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      
      // Track animation performance
      const animationStart = performance.now();
      
      // Trigger hover animation
      await user.hover(card);
      
      // Simulate animation frames for 1 second
      for (let i = 0; i < 60; i++) {
        animationFrameCallbacks.forEach(cb => {
          cb.callback(animationStart + (i * 16.67)); // 60fps = 16.67ms per frame
        });
      }
      
      const animationEnd = performance.now();
      const totalTime = animationEnd - animationStart;
      const expectedFrames = Math.floor(totalTime / 16.67);
      
      // Should maintain close to 60fps
      expect(animationFrameCallbacks.length).toBeGreaterThanOrEqual(expectedFrames * 0.9);
      
      // Each frame should not exceed 16.67ms budget
      animationFrameCallbacks.forEach((cb, index) => {
        if (index > 0) {
          const frameTime = cb.timestamp - animationFrameCallbacks[index - 1].timestamp;
          expect(frameTime).toBeLessThanOrEqual(20); // Allow 20ms tolerance
        }
      });
    });

    it('optimizes button press animations for responsiveness', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <GradientButton onClick={handleClick} animate={true} data-testid="button">
          Click Me
        </GradientButton>
      );

      const button = screen.getByTestId('button');
      
      // Measure animation latency
      const interactionStart = performance.now();
      
      await user.click(button);
      
      // First animation frame should fire quickly
      expect(animationFrameCallbacks.length).toBeGreaterThan(0);
      
      const firstFrameDelay = animationFrameCallbacks[0].timestamp - interactionStart;
      
      // First frame should start within one frame budget (16.67ms)
      expect(firstFrameDelay).toBeLessThanOrEqual(20);
      
      // Animation should complete within reasonable time
      expect(handleClick).toHaveBeenCalled();
    });

    it('handles multiple concurrent animations efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <GlassCard key={i} hover={true} data-testid={`card-${i}`}>
              Card {i}
            </GlassCard>
          ))}
        </div>
      );

      // Trigger multiple animations simultaneously
      const animationStart = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const card = screen.getByTestId(`card-${i}`);
        await user.hover(card);
      }

      // Simulate concurrent animations
      for (let frame = 0; frame < 30; frame++) {
        animationFrameCallbacks.forEach(cb => {
          cb.callback(animationStart + (frame * 16.67));
        });
      }

      // Should not drop below 30fps even with multiple animations
      const expectedMinFrames = 25; // 30 frames with some tolerance
      expect(animationFrameCallbacks.length).toBeGreaterThanOrEqual(expectedMinFrames);
    });

    it('pauses animations when tab is not visible', () => {
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true
      });
      
      document.dispatchEvent(new Event('visibilitychange'));

      const initialRAFCount = animationFrameCallbacks.length;

      // Trigger animation while hidden
      const card = screen.getByTestId('glass-card');
      fireEvent.mouseEnter(card);

      // Should not create new animation frames while hidden
      expect(animationFrameCallbacks.length).toBeLessThanOrEqual(initialRAFCount);

      // Resume when visible again
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true
      });
      
      document.dispatchEvent(new Event('visibilitychange'));

      fireEvent.mouseEnter(card);
      
      // Should resume animations
      expect(animationFrameCallbacks.length).toBeGreaterThan(initialRAFCount);
    });
  });

  describe('Calculator Animation Performance', () => {
    it('smoothly animates results appearance', async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      // Fill form
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');
      await user.type(screen.getByTestId('input-competitorPrice'), '120');
      await user.type(screen.getByTestId('input-cac'), '300');

      const animationStart = performance.now();
      
      // Trigger calculation
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Wait for results to appear with animation
      await waitFor(() => {
        expect(screen.getByTestId('results-section')).toBeInTheDocument();
      });

      const animationEnd = performance.now();
      const animationDuration = animationEnd - animationStart;

      // Results animation should be smooth and not too long
      expect(animationDuration).toBeLessThan(1000); // Under 1 second
      expect(animationFrameCallbacks.length).toBeGreaterThan(10); // Smooth animation needs multiple frames
    });

    it('optimizes chart animations for large datasets', async () => {
      const user = userEvent.setup();
      render(<Calculator />);

      // Mock large dataset calculation
      const largeDataResults = {
        projections: Array.from({ length: 100 }, (_, i) => ({
          month: i,
          revenue: 1000 + (i * 100),
          customers: 10 + i,
        })),
      };

      // Fill form and calculate
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '1000');
      
      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Chart animation should still maintain performance
      await waitFor(() => {
        const chart = screen.queryByTestId('revenue-projection-chart');
        if (chart) {
          // Animation frames should not exceed frame budget
          animationFrameCallbacks.forEach((cb, index) => {
            if (index > 0) {
              const frameTime = cb.timestamp - animationFrameCallbacks[index - 1].timestamp;
              expect(frameTime).toBeLessThanOrEqual(25); // Allow some tolerance for complex charts
            }
          });
        }
      });
    });

    it('uses will-change property for optimal layer creation', () => {
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      
      // Should apply will-change for hardware acceleration
      const computedStyle = window.getComputedStyle(card);
      expect(computedStyle.willChange).toMatch(/transform|opacity/);
    });
  });

  describe('Memory Management', () => {
    it('cleans up animation frames on component unmount', () => {
      const { unmount } = render(
        <GlassCard hover={true} data-testid="glass-card">Content</GlassCard>
      );

      // Trigger animation
      const card = screen.getByTestId('glass-card');
      fireEvent.mouseEnter(card);

      const activeFramesBefore = animationFrameCallbacks.length;
      expect(activeFramesBefore).toBeGreaterThan(0);

      // Unmount component
      unmount();

      // Should cancel animation frames
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('prevents memory leaks from animation loops', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          {Array.from({ length: 100 }, (_, i) => (
            <GlassCard key={i} hover={true} data-testid={`card-${i}`}>
              Card {i}
            </GlassCard>
          ))}
        </div>
      );

      // Trigger many animations
      for (let i = 0; i < 100; i++) {
        const card = screen.getByTestId(`card-${i}`);
        await user.hover(card);
        await user.unhover(card);
      }

      // Should not accumulate unbounded animation frames
      expect(animationFrameCallbacks.length).toBeLessThan(200);
    });

    it('reuses animation timelines efficiently', async () => {
      const user = userEvent.setup();
      
      render(<GradientButton animate={true} data-testid="button">Button</GradientButton>);

      const button = screen.getByTestId('button');
      
      // Multiple interactions should reuse timelines
      for (let i = 0; i < 5; i++) {
        await user.click(button);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Should not create excessive animation objects
      const uniqueAnimations = new Set(
        animationFrameCallbacks.map(cb => cb.callback.toString())
      );
      expect(uniqueAnimations.size).toBeLessThan(10);
    });
  });

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it('respects user preference for reduced motion', () => {
      render(<GlassCard animate={true} data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      fireEvent.mouseEnter(card);

      // Should not create animation frames when reduced motion is preferred
      expect(animationFrameCallbacks.length).toBe(0);
    });

    it('provides instant feedback without animations when reduced motion is on', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(
        <GradientButton onClick={handleClick} animate={true}>
          Click Me
        </GradientButton>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      // Should execute callback immediately without animation delays
      expect(handleClick).toHaveBeenCalled();
      expect(animationFrameCallbacks.length).toBe(0);
    });
  });

  describe('Performance Monitoring', () => {
    it('tracks animation performance metrics', () => {
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      const card = screen.getByTestId('glass-card');
      fireEvent.mouseEnter(card);

      // Should mark performance milestones
      expect(performance.mark).toHaveBeenCalledWith(
        expect.stringContaining('animation-start')
      );
    });

    it('measures frame timing consistency', () => {
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      // Simulate inconsistent frame timing
      animationFrameCallbacks.forEach((cb, index) => {
        const irregularTiming = performance.now() + (index * (15 + Math.random() * 10));
        cb.callback(irregularTiming);
      });

      // Should measure and report timing inconsistencies
      expect(performance.measure).toHaveBeenCalled();
    });

    it('provides performance debugging information', () => {
      const consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
      
      render(<GlassCard hover={true} data-testid="glass-card">Content</GlassCard>);

      if (process.env.NODE_ENV === 'development') {
        expect(consoleDebug).toHaveBeenCalledWith(
          expect.stringContaining('Animation performance')
        );
      }
      
      consoleDebug.mockRestore();
    });
  });
});

// Helper functions for animation testing
export function measureAnimationPerformance(element, animationType = 'hover') {
  const metrics = {
    frameCount: 0,
    droppedFrames: 0,
    averageFrameTime: 0,
    maxFrameTime: 0,
    totalDuration: 0,
  };

  const startTime = performance.now();
  let lastFrameTime = startTime;
  let frameTimes = [];

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.name.includes(animationType)) {
        metrics.frameCount++;
        
        const frameTime = entry.startTime - lastFrameTime;
        frameTimes.push(frameTime);
        
        if (frameTime > 16.67) {
          metrics.droppedFrames++;
        }
        
        metrics.maxFrameTime = Math.max(metrics.maxFrameTime, frameTime);
        lastFrameTime = entry.startTime;
      }
    });
  });

  observer.observe({ entryTypes: ['measure', 'mark'] });

  return {
    stop: () => {
      observer.disconnect();
      metrics.totalDuration = performance.now() - startTime;
      metrics.averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      return metrics;
    },
  };
}

export function createAnimationStressTest(componentCount = 100, animationDuration = 1000) {
  return {
    components: Array.from({ length: componentCount }, (_, i) => i),
    duration: animationDuration,
    
    async run(renderFunction) {
      const startTime = performance.now();
      const results = [];
      
      for (const componentId of this.components) {
        const component = renderFunction(componentId);
        const measurement = measureAnimationPerformance(component);
        
        // Wait for animation duration
        await new Promise(resolve => setTimeout(resolve, this.duration / this.components.length));
        
        results.push(measurement.stop());
      }
      
      const totalTime = performance.now() - startTime;
      
      return {
        totalTime,
        averageFrameRate: results.reduce((sum, r) => sum + (r.frameCount / (r.totalDuration / 1000)), 0) / results.length,
        droppedFramePercentage: results.reduce((sum, r) => sum + (r.droppedFrames / r.frameCount), 0) / results.length * 100,
        maxFrameTime: Math.max(...results.map(r => r.maxFrameTime)),
      };
    },
  };
}