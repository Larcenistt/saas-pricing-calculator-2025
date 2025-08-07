import '@testing-library/jest-dom';
import { configureAxe } from 'jest-axe';

// Configure axe for comprehensive accessibility testing
const axe = configureAxe({
  rules: {
    // Enable all WCAG 2.1 AA rules
    'wcag2a': { enabled: true },
    'wcag2aa': { enabled: true },
    'wcag21aa': { enabled: true },
    
    // Premium accessibility standards
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'screen-reader': { enabled: true },
    'aria-labels': { enabled: true },
    'semantic-markup': { enabled: true },
    
    // Additional rules for better UX
    'target-size': { enabled: true },
    'motion-reduction': { enabled: true },
    'language': { enabled: true },
    'page-structure': { enabled: true },
  },
  
  tags: [
    'wcag2a',
    'wcag2aa', 
    'wcag21aa',
    'best-practice'
  ],
  
  // Custom configuration for SaaS application
  options: {
    runOnly: {
      type: 'tag',
      values: ['wcag2aa', 'wcag21aa', 'best-practice']
    },
    
    // Increase color contrast requirements for premium experience
    rules: {
      'color-contrast': {
        options: {
          noScroll: true,
          ignoreUseragentColors: false,
          ignorePseudo: false,
          shadowOutlineEmulatesFocus: false,
        }
      },
      
      // Stricter keyboard navigation requirements
      'keyboard': {
        options: {
          noScroll: true,
        }
      },
      
      // Enhanced focus management
      'focus-order-semantics': {
        enabled: true,
      },
      
      // Premium touch target requirements (44x44px minimum)
      'target-size': {
        options: {
          minimum: 44,
        }
      },
    }
  }
});

// Custom matchers for accessibility testing
expect.extend({
  async toBeAccessible(received, options = {}) {
    const results = await axe.run(received, {
      ...axe.options,
      ...options
    });
    
    const pass = results.violations.length === 0;
    
    if (pass) {
      return {
        message: () => `Expected element to have accessibility violations, but none were found`,
        pass: true,
      };
    } else {
      const violationMessages = results.violations.map(violation => 
        `${violation.id}: ${violation.description}\n` +
        violation.nodes.map(node => 
          `  - ${node.target.join(', ')}: ${node.failureSummary}`
        ).join('\n')
      ).join('\n\n');
      
      return {
        message: () => `Expected element to be accessible, but found violations:\n\n${violationMessages}`,
        pass: false,
      };
    }
  },
  
  toHaveNoColorContrastViolations(received) {
    const contrastElements = received.querySelectorAll('[style*="color"], [class*="text-"], [class*="bg-"]');
    const violations = [];
    
    contrastElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Check if contrast ratio meets WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
      if (color && backgroundColor) {
        const contrastRatio = calculateContrastRatio(color, backgroundColor);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
        const requiredRatio = isLargeText ? 3.0 : 4.5;
        
        if (contrastRatio < requiredRatio) {
          violations.push({
            element: element.tagName.toLowerCase() + (element.className ? `.${element.className}` : ''),
            contrastRatio: contrastRatio.toFixed(2),
            required: requiredRatio,
            color,
            backgroundColor,
          });
        }
      }
    });
    
    return {
      pass: violations.length === 0,
      message: () => violations.length === 0
        ? `Expected to find color contrast violations, but none were found`
        : `Found ${violations.length} color contrast violations:\n` +
          violations.map(v => 
            `  - ${v.element}: ${v.contrastRatio}:1 (required: ${v.required}:1)`
          ).join('\n')
    };
  },
  
  toSupportKeyboardNavigation(received) {
    const focusableElements = received.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const issues = [];
    
    focusableElements.forEach(element => {
      // Check if element is properly focusable
      if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
        issues.push(`Element ${element.tagName.toLowerCase()} is not focusable`);
      }
      
      // Check for proper ARIA labels
      if (!element.hasAttribute('aria-label') && 
          !element.hasAttribute('aria-labelledby') && 
          !element.textContent.trim() &&
          !element.title) {
        issues.push(`Element ${element.tagName.toLowerCase()} lacks accessible name`);
      }
      
      // Check for proper focus indicators
      const styles = window.getComputedStyle(element, ':focus');
      if (!styles.outline && !styles.boxShadow && !styles.border) {
        issues.push(`Element ${element.tagName.toLowerCase()} lacks focus indicator`);
      }
    });
    
    return {
      pass: issues.length === 0,
      message: () => issues.length === 0
        ? `Expected to find keyboard navigation issues, but none were found`
        : `Found ${issues.length} keyboard navigation issues:\n` +
          issues.map(issue => `  - ${issue}`).join('\n')
    };
  }
});

// Helper function to calculate color contrast ratio
function calculateContrastRatio(color1, color2) {
  // Simplified contrast calculation
  // In real implementation, you'd use a proper color library
  const rgb1 = parseRGB(color1);
  const rgb2 = parseRGB(color2);
  
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function parseRGB(color) {
  // Simplified RGB parsing - in real implementation use proper color parser
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function getRelativeLuminance(rgb) {
  const { r, g, b } = rgb;
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  
  const rL = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const gL = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const bL = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
}

// Mock screen reader announcements for testing
global.mockScreenReader = {
  announcements: [],
  announce: function(message, priority = 'polite') {
    this.announcements.push({ message, priority, timestamp: Date.now() });
  },
  clear: function() {
    this.announcements = [];
  },
  getLastAnnouncement: function() {
    return this.announcements[this.announcements.length - 1];
  },
  getAllAnnouncements: function() {
    return [...this.announcements];
  }
};

// Override aria-live regions to capture announcements
const originalCreateElement = document.createElement;
document.createElement = function(tagName, options) {
  const element = originalCreateElement.call(this, tagName, options);
  
  if (element.hasAttribute && (element.hasAttribute('aria-live') || element.getAttribute('role') === 'status' || element.getAttribute('role') === 'alert')) {
    const originalTextContent = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    
    Object.defineProperty(element, 'textContent', {
      get: originalTextContent.get,
      set: function(value) {
        if (value && value.trim()) {
          const priority = this.getAttribute('aria-live') || 'polite';
          global.mockScreenReader.announce(value.trim(), priority);
        }
        originalTextContent.set.call(this, value);
      }
    });
  }
  
  return element;
};

// Global accessibility testing helpers
global.a11yHelpers = {
  // Test keyboard navigation through a component
  async testKeyboardNavigation(container, expectedOrder = []) {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const actualOrder = [];
    
    // Simulate tab navigation
    let currentIndex = -1;
    for (let i = 0; i < focusableElements.length; i++) {
      // Find next focusable element
      let nextElement = null;
      let minTabIndex = Infinity;
      
      Array.from(focusableElements).forEach((el, index) => {
        const tabIndex = el.tabIndex || 0;
        if (index > currentIndex && tabIndex < minTabIndex) {
          nextElement = el;
          minTabIndex = tabIndex;
          currentIndex = index;
        }
      });
      
      if (nextElement) {
        nextElement.focus();
        actualOrder.push(nextElement);
      }
    }
    
    return {
      actualOrder: actualOrder.map(el => el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '')),
      expectedOrder,
      matches: expectedOrder.length === 0 || JSON.stringify(actualOrder.map(el => el.id || el.className)) === JSON.stringify(expectedOrder)
    };
  },
  
  // Test screen reader announcements
  getScreenReaderAnnouncements() {
    return global.mockScreenReader.getAllAnnouncements();
  },
  
  // Clear screen reader history
  clearScreenReaderAnnouncements() {
    global.mockScreenReader.clear();
  },
  
  // Test color contrast for specific elements
  testColorContrast(element) {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    if (!color || !backgroundColor) {
      return { pass: false, reason: 'Unable to determine colors' };
    }
    
    const ratio = calculateContrastRatio(color, backgroundColor);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;
    
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || fontWeight >= 700));
    const requiredRatio = isLargeText ? 3.0 : 4.5;
    
    return {
      pass: ratio >= requiredRatio,
      ratio: ratio.toFixed(2),
      required: requiredRatio,
      isLargeText,
      color,
      backgroundColor
    };
  }
};

export { axe };
export default axe;