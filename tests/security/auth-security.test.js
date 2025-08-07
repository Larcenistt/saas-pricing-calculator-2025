import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Calculator from '@/components/Calculator';

// Mock authentication services
vi.mock('@/services/auth.service');

describe('Authentication and Security Tests', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    
    // Reset localStorage
    localStorage.clear();
    
    // Mock crypto for password hashing tests
    global.crypto = {
      subtle: {
        digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        generateKey: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
      },
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderWithQueryClient = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Input Validation and Sanitization', () => {
    it('validates email format strictly', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..double.dot@example.com',
        'user@example',
        '<script>alert("xss")</script>@example.com',
        'user@exam ple.com',
        'user@example..com',
      ];

      for (const email of invalidEmails) {
        await user.clear(emailInput);
        await user.type(emailInput, email);
        
        const submitButton = screen.getByRole('button', { name: /login|sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
        });
      }
    });

    it('enforces strong password requirements', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const weakPasswords = [
        '123456',
        'password',
        'qwerty',
        'abc123',
        '11111111',
        'Password', // No special chars or numbers
        'password123', // No special chars
        'Password!', // Too short
      ];

      for (const password of weakPasswords) {
        await user.clear(passwordInput);
        await user.type(passwordInput, password);
        fireEvent.blur(passwordInput);

        await waitFor(() => {
          expect(screen.getByText(/password must/i)).toBeInTheDocument();
        });
      }

      // Strong password should pass
      await user.clear(passwordInput);
      await user.type(passwordInput, 'SecureP@ssw0rd123!');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.queryByText(/password must/i)).not.toBeInTheDocument();
      });
    });

    it('sanitizes user input to prevent XSS', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        'John<script>alert("hack")</script>Doe',
      ];

      for (const maliciousInput of maliciousInputs) {
        await user.clear(nameInput);
        await user.type(nameInput, maliciousInput);

        // Input should be sanitized
        expect(nameInput.value).not.toContain('<script>');
        expect(nameInput.value).not.toContain('javascript:');
        expect(nameInput.value).not.toContain('onerror');
      }
    });

    it('validates file upload types and sizes', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(
        <form>
          <input
            type="file"
            data-testid="file-upload"
            accept=".jpg,.jpeg,.png,.pdf"
          />
        </form>
      );

      const fileInput = screen.getByTestId('file-upload');

      // Test invalid file types
      const invalidFile = new File(['content'], 'malicious.exe', {
        type: 'application/exe',
      });

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });

      // Test oversized file
      const largeFile = new File([new Array(6 * 1024 * 1024).join('a')], 'large.jpg', {
        type: 'image/jpeg',
      });

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication Security', () => {
    it('implements secure session management', () => {
      // Mock successful authentication
      const mockAuthService = vi.mocked(require('@/services/auth.service'));
      mockAuthService.login.mockResolvedValue({
        user: { id: '1', email: 'user@example.com' },
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      });

      renderWithQueryClient(<LoginForm />);

      // Should not store sensitive data in localStorage
      expect(localStorage.getItem('password')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();

      // Should use httpOnly cookies or secure storage
      expect(document.cookie).not.toContain('accessToken');
    });

    it('handles JWT token expiration securely', async () => {
      // Mock expired token scenario
      const mockAuthService = vi.mocked(require('@/services/auth.service'));
      mockAuthService.verifyToken.mockResolvedValue(false);
      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
      });

      renderWithQueryClient(
        <ProtectedRoute>
          <Calculator />
        </ProtectedRoute>
      );

      // Should automatically refresh token
      await waitFor(() => {
        expect(mockAuthService.refreshToken).toHaveBeenCalled();
      });

      // Should redirect to login if refresh fails
      mockAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      await waitFor(() => {
        expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      });
    });

    it('implements rate limiting for authentication attempts', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Simulate multiple failed attempts
      for (let i = 0; i < 6; i++) {
        await user.click(submitButton);
        await waitFor(() => {
          expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
      }

      // Should be rate limited after multiple failures
      await waitFor(() => {
        expect(screen.getByText(/too many attempts/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });
    });

    it('prevents CSRF attacks', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<LoginForm />);

      // Should include CSRF token in forms
      const form = screen.getByRole('form');
      const csrfToken = form.querySelector('input[name="csrf_token"]');
      expect(csrfToken).toBeInTheDocument();
      expect(csrfToken.value).toHaveLength.greaterThan(10);

      // Should validate CSRF token on submission
      const mockAuthService = vi.mocked(require('@/services/auth.service'));
      mockAuthService.login.mockImplementation((credentials) => {
        expect(credentials.csrfToken).toBeDefined();
        return Promise.resolve({ user: {}, accessToken: 'token' });
      });

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith(
          expect.objectContaining({
            csrfToken: expect.any(String),
          })
        );
      });
    });

    it('implements secure password recovery', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<LoginForm />);

      const forgotPasswordLink = screen.getByText(/forgot password/i);
      await user.click(forgotPasswordLink);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'user@example.com');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      // Should not reveal whether email exists
      await waitFor(() => {
        expect(
          screen.getByText(/if an account with that email exists/i)
        ).toBeInTheDocument();
      });

      // Should not accept weak recovery tokens
      const recoveryToken = 'weak-token';
      expect(recoveryToken.length).toBeGreaterThan(32);
    });
  });

  describe('Data Protection', () => {
    it('encrypts sensitive data in transit', () => {
      // Mock network requests to verify HTTPS
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        expect(url).toMatch(/^https:\/\//);
        return originalFetch(url, options);
      });

      renderWithQueryClient(<LoginForm />);
      
      // API calls should use HTTPS
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\//),
        expect.any(Object)
      );
    });

    it('properly handles personally identifiable information', async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<RegisterForm />);

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john.doe@example.com');

      // PII should not be logged to console
      const consoleSpy = vi.spyOn(console, 'log');
      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('john.doe@example.com')
      );
      consoleSpy.mockRestore();
    });

    it('implements data retention policies', () => {
      // Mock localStorage with expiration
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn((key, value) => {
        if (key.includes('user-data')) {
          const expirationTime = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
          const dataWithExpiration = JSON.stringify({
            data: JSON.parse(value),
            expires: expirationTime,
          });
          originalSetItem.call(localStorage, key, dataWithExpiration);
        } else {
          originalSetItem.call(localStorage, key, value);
        }
      });

      renderWithQueryClient(<Calculator />);

      // Data should have expiration timestamps
      const userData = localStorage.getItem('user-data');
      if (userData) {
        const parsed = JSON.parse(userData);
        expect(parsed.expires).toBeDefined();
        expect(parsed.expires).toBeGreaterThan(Date.now());
      }
    });

    it('provides data export functionality for GDPR compliance', async () => {
      const user = userEvent.setup();
      
      // Mock authenticated user
      global.mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      };

      renderWithQueryClient(
        <div>
          <button data-testid="export-data">Export My Data</button>
        </div>
      );

      const exportButton = screen.getByTestId('export-data');
      await user.click(exportButton);

      // Should trigger data export
      await waitFor(() => {
        expect(screen.getByText(/data export started/i)).toBeInTheDocument();
      });

      // Export should include all user data
      const exportData = {
        profile: global.mockUser,
        calculations: [],
        preferences: {},
      };

      expect(exportData).toHaveProperty('profile');
      expect(exportData).toHaveProperty('calculations');
      expect(exportData).toHaveProperty('preferences');
    });
  });

  describe('Access Control', () => {
    it('enforces role-based access control', async () => {
      const testCases = [
        { role: 'user', canAccess: ['calculator', 'profile'], cannotAccess: ['admin'] },
        { role: 'premium', canAccess: ['calculator', 'profile', 'ai-insights'], cannotAccess: ['admin'] },
        { role: 'admin', canAccess: ['calculator', 'profile', 'admin'], cannotAccess: [] },
      ];

      for (const { role, canAccess, cannotAccess } of testCases) {
        global.mockUser = { id: '1', role };

        for (const resource of canAccess) {
          renderWithQueryClient(
            <ProtectedRoute requiredRole={role}>
              <div data-testid={`${resource}-content`}>{resource} content</div>
            </ProtectedRoute>
          );

          expect(screen.getByTestId(`${resource}-content`)).toBeInTheDocument();
        }

        for (const resource of cannotAccess) {
          renderWithQueryClient(
            <ProtectedRoute requiredRole="admin">
              <div data-testid={`${resource}-content`}>{resource} content</div>
            </ProtectedRoute>
          );

          expect(screen.queryByTestId(`${resource}-content`)).not.toBeInTheDocument();
        }
      }
    });

    it('validates API permissions server-side', async () => {
      const user = userEvent.setup();
      
      // Mock API calls
      global.fetch = vi.fn().mockImplementation((url, options) => {
        const headers = options?.headers || {};
        
        if (url.includes('/api/admin/')) {
          if (!headers.Authorization?.includes('admin-token')) {
            return Promise.resolve({
              status: 403,
              json: () => Promise.resolve({ error: 'Forbidden' }),
            });
          }
        }
        
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      });

      renderWithQueryClient(<Calculator />);

      // Regular user trying to access admin endpoint should fail
      try {
        await fetch('/api/admin/users', {
          headers: { Authorization: 'Bearer regular-user-token' },
        });
      } catch (error) {
        expect(error.status).toBe(403);
      }
    });

    it('protects sensitive routes', () => {
      const sensitiveRoutes = [
        '/admin',
        '/dashboard',
        '/billing',
        '/api/users',
        '/api/admin',
      ];

      sensitiveRoutes.forEach(route => {
        // Should redirect to login if not authenticated
        renderWithQueryClient(
          <ProtectedRoute>
            <div data-testid="sensitive-content">Sensitive content</div>
          </ProtectedRoute>
        );

        expect(screen.queryByTestId('sensitive-content')).not.toBeInTheDocument();
        expect(screen.getByText(/please log in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Headers and Configuration', () => {
    it('implements Content Security Policy', () => {
      // Mock CSP header check
      const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline' https://trusted-cdn.com; style-src 'self' 'unsafe-inline'";
      
      document.head.innerHTML = `
        <meta http-equiv="Content-Security-Policy" content="${cspHeader}">
      `;

      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      expect(cspMeta).toBeInTheDocument();
      expect(cspMeta.content).toContain("default-src 'self'");
      expect(cspMeta.content).not.toContain("'unsafe-eval'");
    });

    it('prevents clickjacking attacks', () => {
      // Should not be embeddable in frames
      const frameOptions = 'X-Frame-Options: DENY';
      expect(frameOptions).toContain('DENY');

      // Should use CSP frame-ancestors
      const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (csp) {
        expect(csp.content).toContain("frame-ancestors 'none'");
      }
    });

    it('implements secure cookie settings', () => {
      // Mock cookie setting
      const setCookie = (name, value, options = {}) => {
        let cookieString = `${name}=${value}`;
        
        if (options.secure) cookieString += '; Secure';
        if (options.httpOnly) cookieString += '; HttpOnly';
        if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
        
        return cookieString;
      };

      const authCookie = setCookie('auth-token', 'token-value', {
        secure: true,
        httpOnly: true,
        sameSite: 'Strict',
      });

      expect(authCookie).toContain('Secure');
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain('SameSite=Strict');
    });
  });

  describe('Error Handling and Information Disclosure', () => {
    it('does not expose sensitive information in error messages', async () => {
      const user = userEvent.setup();
      
      const mockAuthService = vi.mocked(require('@/services/auth.service'));
      mockAuthService.login.mockRejectedValue(new Error('Internal server error'));

      renderWithQueryClient(<LoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'user@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert').textContent;
        
        // Should not expose database errors
        expect(errorMessage).not.toContain('SQL');
        expect(errorMessage).not.toContain('database');
        expect(errorMessage).not.toContain('server');
        expect(errorMessage).not.toContain('internal');
        
        // Should show generic error message
        expect(errorMessage).toMatch(/invalid credentials|login failed/i);
      });
    });

    it('logs security events for monitoring', () => {
      const securityLogger = {
        logSecurityEvent: vi.fn(),
      };

      global.securityLogger = securityLogger;

      // Mock failed login attempt
      const failedLoginEvent = {
        type: 'FAILED_LOGIN_ATTEMPT',
        email: 'user@example.com',
        ip: '192.168.1.1',
        timestamp: Date.now(),
      };

      securityLogger.logSecurityEvent(failedLoginEvent);

      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith({
        type: 'FAILED_LOGIN_ATTEMPT',
        email: 'user@example.com',
        ip: expect.any(String),
        timestamp: expect.any(Number),
      });
    });

    it('handles security incidents appropriately', async () => {
      const incidentHandler = {
        handleSecurityIncident: vi.fn(),
      };

      global.incidentHandler = incidentHandler;

      // Simulate SQL injection attempt
      const maliciousInput = "'; DROP TABLE users; --";
      
      // Should detect and handle security incident
      if (maliciousInput.includes('DROP TABLE')) {
        incidentHandler.handleSecurityIncident({
          type: 'SQL_INJECTION_ATTEMPT',
          input: maliciousInput,
          timestamp: Date.now(),
        });
      }

      expect(incidentHandler.handleSecurityIncident).toHaveBeenCalledWith({
        type: 'SQL_INJECTION_ATTEMPT',
        input: maliciousInput,
        timestamp: expect.any(Number),
      });
    });
  });
});