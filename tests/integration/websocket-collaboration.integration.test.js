import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calculator from '@/components/Calculator';
import CollaborationIndicator from '@/components/CollaborationIndicator';
import { io } from 'socket.io-client';

// Mock Socket.IO
vi.mock('socket.io-client');

describe('WebSocket Collaboration Integration', () => {
  let mockSocket;
  let mockEvents;

  beforeEach(() => {
    mockEvents = {};
    
    mockSocket = {
      emit: vi.fn(),
      on: vi.fn((event, callback) => {
        if (!mockEvents[event]) {
          mockEvents[event] = [];
        }
        mockEvents[event].push(callback);
      }),
      off: vi.fn(),
      disconnect: vi.fn(),
      connected: true,
      id: 'socket_123',
    };

    vi.mocked(io).mockReturnValue(mockSocket);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper to trigger socket events
  const triggerSocketEvent = (event, data) => {
    if (mockEvents[event]) {
      mockEvents[event].forEach(callback => callback(data));
    }
  };

  describe('Real-time Collaboration Setup', () => {
    it('establishes WebSocket connection on component mount', () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      expect(io).toHaveBeenCalledWith(expect.any(String), {
        query: { roomId: 'room_123' },
        transports: ['websocket', 'polling']
      });

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user-joined', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('user-left', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('field-changed', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('calculation-updated', expect.any(Function));
    });

    it('joins collaboration room on connection', () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate connection
      triggerSocketEvent('connect');

      expect(mockSocket.emit).toHaveBeenCalledWith('join-room', {
        roomId: 'room_123',
        userInfo: {
          id: expect.any(String),
          name: expect.any(String),
          avatar: expect.any(String)
        }
      });
    });

    it('handles connection failures gracefully', async () => {
      mockSocket.connected = false;
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate connection error
      triggerSocketEvent('connect_error', { message: 'Connection failed' });

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-error')).toBeInTheDocument();
        expect(screen.getByText(/collaboration unavailable/i)).toBeInTheDocument();
      });

      // Should show retry option
      expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument();
    });

    it('reconnects automatically after disconnection', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate initial connection
      triggerSocketEvent('connect');
      
      // Simulate disconnection
      mockSocket.connected = false;
      triggerSocketEvent('disconnect', 'transport close');

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Reconnecting...');
      });

      // Simulate reconnection
      mockSocket.connected = true;
      triggerSocketEvent('connect');

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });
    });
  });

  describe('User Presence Management', () => {
    beforeEach(() => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      triggerSocketEvent('connect');
    });

    it('shows active users in the room', async () => {
      const user1 = {
        id: 'user_1',
        name: 'Alice Smith',
        avatar: '/avatars/alice.jpg',
        status: 'active'
      };

      const user2 = {
        id: 'user_2',
        name: 'Bob Johnson',
        avatar: '/avatars/bob.jpg',
        status: 'active'
      };

      // Users join the room
      triggerSocketEvent('user-joined', user1);
      triggerSocketEvent('user-joined', user2);

      await waitFor(() => {
        expect(screen.getByTestId('user-avatar-user_1')).toBeInTheDocument();
        expect(screen.getByTestId('user-avatar-user_2')).toBeInTheDocument();
      });

      // Check user info display
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByTestId('active-users-count')).toHaveTextContent('2');
    });

    it('removes users when they leave', async () => {
      const user1 = {
        id: 'user_1',
        name: 'Alice Smith',
        avatar: '/avatars/alice.jpg'
      };

      triggerSocketEvent('user-joined', user1);

      await waitFor(() => {
        expect(screen.getByTestId('user-avatar-user_1')).toBeInTheDocument();
      });

      // User leaves
      triggerSocketEvent('user-left', { userId: 'user_1' });

      await waitFor(() => {
        expect(screen.queryByTestId('user-avatar-user_1')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('active-users-count')).toHaveTextContent('0');
    });

    it('shows user activity indicators', async () => {
      const user = userEvent.setup();
      
      const collaborator = {
        id: 'user_1',
        name: 'Alice Smith',
        avatar: '/avatars/alice.jpg'
      };

      triggerSocketEvent('user-joined', collaborator);

      // Simulate user typing
      triggerSocketEvent('user-activity', {
        userId: 'user_1',
        action: 'typing',
        field: 'currentPrice',
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(screen.getByTestId('activity-indicator-user_1')).toBeInTheDocument();
        expect(screen.getByText(/alice is editing price/i)).toBeInTheDocument();
      });

      // Activity should fade after timeout
      await waitFor(() => {
        expect(screen.queryByTestId('activity-indicator-user_1')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('displays cursor positions for other users', async () => {
      const collaborator = {
        id: 'user_1',
        name: 'Alice Smith',
        color: '#ff6b6b'
      };

      triggerSocketEvent('user-joined', collaborator);

      // Simulate cursor movement
      triggerSocketEvent('cursor-moved', {
        userId: 'user_1',
        x: 150,
        y: 200,
        elementId: 'input-currentPrice'
      });

      await waitFor(() => {
        const cursor = screen.getByTestId('remote-cursor-user_1');
        expect(cursor).toBeInTheDocument();
        expect(cursor).toHaveStyle('left: 150px; top: 200px');
      });

      // Cursor should show user name
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  describe('Real-time Field Synchronization', () => {
    beforeEach(() => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      triggerSocketEvent('connect');
    });

    it('broadcasts field changes to other users', async () => {
      const user = userEvent.setup();
      
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.type(priceInput, '149');

      // Should emit field change
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('field-change', {
          field: 'currentPrice',
          value: '149',
          timestamp: expect.any(Number)
        });
      });
    });

    it('receives and applies field changes from other users', async () => {
      // Simulate field change from another user
      triggerSocketEvent('field-changed', {
        userId: 'user_1',
        userName: 'Alice Smith',
        field: 'currentPrice',
        value: '199',
        timestamp: Date.now()
      });

      await waitFor(() => {
        const priceInput = screen.getByTestId('input-currentPrice');
        expect(priceInput).toHaveValue(199);
      });

      // Should show change indicator
      expect(screen.getByTestId('field-change-indicator')).toBeInTheDocument();
      expect(screen.getByText(/alice updated price/i)).toBeInTheDocument();
    });

    it('handles conflicting changes with operational transforms', async () => {
      const user = userEvent.setup();
      
      const priceInput = screen.getByTestId('input-currentPrice');
      
      // Start typing locally
      await user.type(priceInput, '1');
      
      // Receive concurrent change from another user
      triggerSocketEvent('field-changed', {
        userId: 'user_1',
        field: 'currentPrice',
        value: '2',
        timestamp: Date.now() - 100, // Earlier timestamp
        operation: 'replace'
      });

      // Should resolve conflict (later timestamp wins)
      await waitFor(() => {
        expect(priceInput).toHaveValue(1); // Local change wins
      });

      // Should show conflict resolution indicator
      expect(screen.getByTestId('conflict-resolved')).toBeInTheDocument();
    });

    it('provides undo/redo for collaborative changes', async () => {
      const user = userEvent.setup();
      
      // Make initial change
      const priceInput = screen.getByTestId('input-currentPrice');
      await user.type(priceInput, '99');

      // Receive change from collaborator
      triggerSocketEvent('field-changed', {
        userId: 'user_1',
        field: 'currentPrice',
        value: '149',
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(priceInput).toHaveValue(149);
      });

      // Undo last change
      await user.keyboard('{Control>}z{/Control}');

      await waitFor(() => {
        expect(priceInput).toHaveValue(99);
      });

      // Should notify other users of undo
      expect(mockSocket.emit).toHaveBeenCalledWith('field-change', {
        field: 'currentPrice',
        value: '99',
        operation: 'undo',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Collaborative Calculations', () => {
    beforeEach(() => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      triggerSocketEvent('connect');
    });

    it('synchronizes calculation results across users', async () => {
      const user = userEvent.setup();

      // Fill form and calculate
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');
      await user.type(screen.getByTestId('input-competitorPrice'), '120');
      await user.type(screen.getByTestId('input-cac'), '300');

      const calculateButton = screen.getByRole('button', { name: /calculate/i });
      await user.click(calculateButton);

      // Should broadcast calculation
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('calculation-start', {
          inputs: {
            currentPrice: 99,
            customers: 100,
            churnRate: 5,
            competitorPrice: 120,
            cac: 300
          },
          timestamp: expect.any(Number)
        });
      });

      // Simulate calculation completion
      const results = {
        mrr: 9900,
        ltv: 1881.43,
        ltvCacRatio: 6.27,
        paybackPeriod: 4.8
      };

      triggerSocketEvent('calculation-completed', {
        userId: mockSocket.id,
        results,
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(screen.getByTestId('result-mrr')).toHaveTextContent('$9,900');
      });
    });

    it('shows calculation status for other users', async () => {
      // Another user starts calculation
      triggerSocketEvent('calculation-start', {
        userId: 'user_1',
        userName: 'Alice Smith',
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-status')).toHaveTextContent(
          'Alice is running calculations...'
        );
      });

      // Calculation completes
      triggerSocketEvent('calculation-completed', {
        userId: 'user_1',
        userName: 'Alice Smith',
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-status')).toHaveTextContent(
          'Alice completed calculations'
        );
      });
    });

    it('handles calculation errors in collaborative mode', async () => {
      // Simulate calculation error from another user
      triggerSocketEvent('calculation-error', {
        userId: 'user_1',
        userName: 'Alice Smith',
        error: 'Invalid input values',
        timestamp: Date.now()
      });

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-error')).toBeInTheDocument();
        expect(screen.getByText(/alice encountered an error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Permissions and Access Control', () => {
    it('enforces view-only permissions', () => {
      render(
        <Calculator 
          enableCollaboration={true} 
          roomId="room_123"
          userPermissions="view-only"
        />
      );

      // Form inputs should be disabled
      expect(screen.getByTestId('input-currentPrice')).toBeDisabled();
      expect(screen.getByTestId('input-customers')).toBeDisabled();
      
      // Calculate button should be hidden
      expect(screen.queryByRole('button', { name: /calculate/i })).not.toBeInTheDocument();

      // Should show view-only indicator
      expect(screen.getByTestId('view-only-indicator')).toBeInTheDocument();
    });

    it('allows comment-only permissions', async () => {
      render(
        <Calculator 
          enableCollaboration={true} 
          roomId="room_123"
          userPermissions="comment"
        />
      );

      const user = userEvent.setup();

      // Form inputs should be disabled
      expect(screen.getByTestId('input-currentPrice')).toBeDisabled();

      // But commenting should be available
      expect(screen.getByTestId('add-comment-button')).toBeInTheDocument();

      await user.click(screen.getByTestId('add-comment-button'));
      
      const commentInput = screen.getByTestId('comment-input');
      await user.type(commentInput, 'This pricing looks aggressive for the market');
      
      await user.click(screen.getByTestId('submit-comment'));

      expect(mockSocket.emit).toHaveBeenCalledWith('comment-added', {
        text: 'This pricing looks aggressive for the market',
        field: null,
        timestamp: expect.any(Number)
      });
    });

    it('manages room ownership and admin rights', () => {
      render(
        <Calculator 
          enableCollaboration={true} 
          roomId="room_123"
          isRoomOwner={true}
        />
      );

      // Owner should see collaboration settings
      expect(screen.getByTestId('collaboration-settings')).toBeInTheDocument();

      // Should be able to manage permissions
      expect(screen.getByRole('button', { name: /manage permissions/i })).toBeInTheDocument();
    });

    it('kicks users with insufficient permissions', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate permission revoked
      triggerSocketEvent('permission-revoked', {
        reason: 'Access expired',
        newPermission: null
      });

      await waitFor(() => {
        expect(screen.getByTestId('access-denied')).toBeInTheDocument();
        expect(screen.getByText(/your access has been revoked/i)).toBeInTheDocument();
      });

      // Should disconnect from room
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    it('throttles field change broadcasts', async () => {
      const user = userEvent.setup();
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      
      const priceInput = screen.getByTestId('input-currentPrice');
      
      // Type rapidly
      await user.type(priceInput, '123456789', { delay: 50 });

      // Should not emit for every keystroke
      const fieldChangeEmits = mockSocket.emit.mock.calls.filter(
        call => call[0] === 'field-change'
      );
      
      expect(fieldChangeEmits.length).toBeLessThan(9); // Less than number of characters
      expect(fieldChangeEmits.length).toBeGreaterThan(0); // But some emits occurred
    });

    it('batches multiple field changes', async () => {
      const user = userEvent.setup();
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      
      // Change multiple fields quickly
      await user.type(screen.getByTestId('input-currentPrice'), '99');
      await user.type(screen.getByTestId('input-customers'), '100');
      await user.type(screen.getByTestId('input-churnRate'), '5');

      // Should batch changes
      await waitFor(() => {
        const batchEmits = mockSocket.emit.mock.calls.filter(
          call => call[0] === 'field-batch-change'
        );
        expect(batchEmits.length).toBeGreaterThan(0);
      });
    });

    it('handles large rooms efficiently', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate many users joining
      for (let i = 0; i < 50; i++) {
        triggerSocketEvent('user-joined', {
          id: `user_${i}`,
          name: `User ${i}`,
          avatar: `/avatars/user${i}.jpg`
        });
      }

      // Should handle gracefully without performance issues
      await waitFor(() => {
        expect(screen.getByTestId('active-users-count')).toHaveTextContent('50');
      });

      // Should show only first few avatars with overflow indicator
      const visibleAvatars = screen.getAllByTestId(/user-avatar-user_/);
      expect(visibleAvatars.length).toBeLessThan(10);
      expect(screen.getByTestId('users-overflow')).toHaveTextContent('+40 more');
    });

    it('optimizes memory usage for long sessions', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);

      // Simulate many field changes over time
      for (let i = 0; i < 1000; i++) {
        triggerSocketEvent('field-changed', {
          userId: 'user_1',
          field: 'currentPrice',
          value: `${100 + i}`,
          timestamp: Date.now() + i
        });
      }

      // Should not accumulate unbounded history
      expect(screen.getByTestId('input-currentPrice')).toHaveValue(1099);
      
      // Change history should be limited
      const changeHistory = screen.queryAllByTestId(/change-history-item/);
      expect(changeHistory.length).toBeLessThan(100);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('recovers from WebSocket disconnections', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      
      // Establish connection
      triggerSocketEvent('connect');
      
      // Make some changes
      const user = userEvent.setup();
      await user.type(screen.getByTestId('input-currentPrice'), '99');

      // Simulate disconnection
      mockSocket.connected = false;
      triggerSocketEvent('disconnect');

      // Should queue changes while offline
      await user.type(screen.getByTestId('input-customers'), '100');

      // Reconnect
      mockSocket.connected = true;
      triggerSocketEvent('connect');

      // Should sync queued changes
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('sync-changes', {
          queuedChanges: expect.arrayContaining([
            expect.objectContaining({
              field: 'customers',
              value: '100'
            })
          ])
        });
      });
    });

    it('handles server errors gracefully', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      
      // Simulate server error
      triggerSocketEvent('error', {
        code: 'SERVER_ERROR',
        message: 'Internal server error'
      });

      await waitFor(() => {
        expect(screen.getByTestId('collaboration-error')).toBeInTheDocument();
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('validates incoming data integrity', async () => {
      render(<Calculator enableCollaboration={true} roomId="room_123" />);
      
      // Simulate malformed data
      triggerSocketEvent('field-changed', {
        userId: 'user_1',
        field: 'currentPrice',
        value: '<script>alert("xss")</script>',
        timestamp: 'invalid'
      });

      // Should ignore invalid data
      await waitFor(() => {
        const priceInput = screen.getByTestId('input-currentPrice');
        expect(priceInput.value).not.toContain('script');
      });

      // Should log security event
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid data received')
      );
    });
  });
});