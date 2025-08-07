import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';
import 'vitest-canvas-mock';

// Extend Vitest matchers with Testing Library DOM
expect.extend({
  toBeInTheDocument: (...args) => expect.toBeInTheDocument(...args),
  toHaveClass: (...args) => expect.toHaveClass(...args),
  toHaveStyle: (...args) => expect.toHaveStyle(...args),
  toHaveAttribute: (...args) => expect.toHaveAttribute(...args),
  toHaveValue: (...args) => expect.toHaveValue(...args),
  toBeVisible: (...args) => expect.toBeVisible(...args),
  toHaveFocus: (...args) => expect.toHaveFocus(...args),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Web APIs that might not be available in test environment
global.fetch = vi.fn();
global.WebSocket = vi.fn();
global.EventSource = vi.fn();

// Mock Canvas
HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    aside: ({ children, ...props }) => <aside {...props}>{children}</aside>,
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>,
    svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
    path: ({ children, ...props }) => <path {...props}>{children}</path>,
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
  useMotionValue: (initial) => ({
    get: () => initial,
    set: vi.fn(),
  }),
}));

// Mock Socket.IO client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: true,
  })),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }) => children,
}));

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    confirmPayment: vi.fn(),
    elements: vi.fn(),
  })),
}));

// Mock Canvas Confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock PDF generation
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    text: vi.fn(),
    save: vi.fn(),
    addImage: vi.fn(),
  })),
}));

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
  }),
  createMockCalculation: () => ({
    id: '1',
    name: 'Test Calculation',
    inputs: {
      currentPrice: 99,
      customers: 100,
      churnRate: 5,
      competitorPrice: 120,
      cac: 300,
    },
    results: {
      mrr: 9900,
      ltv: 1881.43,
      ltvCacRatio: 6.27,
    },
    createdAt: new Date(),
  }),
};

// Console warnings suppression for tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});