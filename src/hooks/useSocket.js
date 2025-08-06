import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const { token } = useAuthStore();

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    // Create socket connection with authentication
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from WebSocket server');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      if (error.message === 'Authentication error') {
        toast.error('WebSocket authentication failed');
      }
    });

    // Cleanup on unmount or token change
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [token]);

  // Join calculation room
  const joinCalculation = useCallback((calculationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join:calculation', calculationId);
    }
  }, [isConnected]);

  // Leave calculation room
  const leaveCalculation = useCallback((calculationId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave:calculation', calculationId);
    }
  }, [isConnected]);

  // Send calculation update
  const sendCalculationUpdate = useCallback((calculationId, inputs, results) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('calculation:update', {
        calculationId,
        inputs,
        results
      });
    }
  }, [isConnected]);

  // Send cursor position
  const sendCursorPosition = useCallback((calculationId, field, position) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('cursor:move', {
        calculationId,
        field,
        position
      });
    }
  }, [isConnected]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((calculationId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(isTyping ? 'typing:start' : 'typing:stop', calculationId);
    }
  }, [isConnected]);

  // Subscribe to events
  const onCalculationUpdate = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('calculation:updated', callback);
    
    return () => {
      socketRef.current?.off('calculation:updated', callback);
    };
  }, []);

  const onUserJoined = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('user:joined', callback);
    
    return () => {
      socketRef.current?.off('user:joined', callback);
    };
  }, []);

  const onUserLeft = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('user:left', callback);
    
    return () => {
      socketRef.current?.off('user:left', callback);
    };
  }, []);

  const onCursorMove = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('cursor:moved', callback);
    
    return () => {
      socketRef.current?.off('cursor:moved', callback);
    };
  }, []);

  const onUserTyping = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('user:typing', callback);
    
    return () => {
      socketRef.current?.off('user:typing', callback);
    };
  }, []);

  const onActivityUpdate = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('activity:update', callback);
    
    return () => {
      socketRef.current?.off('activity:update', callback);
    };
  }, []);

  const onMetricsUpdate = useCallback((callback) => {
    if (!socketRef.current) return;
    
    socketRef.current.on('metrics:update', callback);
    
    return () => {
      socketRef.current?.off('metrics:update', callback);
    };
  }, []);

  return {
    isConnected,
    activeUsers,
    joinCalculation,
    leaveCalculation,
    sendCalculationUpdate,
    sendCursorPosition,
    sendTypingIndicator,
    onCalculationUpdate,
    onUserJoined,
    onUserLeft,
    onCursorMove,
    onUserTyping,
    onActivityUpdate,
    onMetricsUpdate
  };
}

// Hook for collaborative calculator
export function useCollaborativeCalculator(calculationId) {
  const [collaborators, setCollaborators] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [cursors, setCursors] = useState({});
  const {
    isConnected,
    joinCalculation,
    leaveCalculation,
    sendCalculationUpdate,
    sendCursorPosition,
    sendTypingIndicator,
    onCalculationUpdate,
    onUserJoined,
    onUserLeft,
    onCursorMove,
    onUserTyping
  } = useSocket();

  // Join/leave calculation room
  useEffect(() => {
    if (calculationId && isConnected) {
      joinCalculation(calculationId);
      
      return () => {
        leaveCalculation(calculationId);
      };
    }
  }, [calculationId, isConnected, joinCalculation, leaveCalculation]);

  // Handle user joined
  useEffect(() => {
    const unsubscribe = onUserJoined((data) => {
      if (data.calculationId === calculationId) {
        setCollaborators(prev => [...prev, { 
          userId: data.userId, 
          email: data.email 
        }]);
        toast.success(`${data.email} joined the calculation`);
      }
    });
    
    return unsubscribe;
  }, [calculationId, onUserJoined]);

  // Handle user left
  useEffect(() => {
    const unsubscribe = onUserLeft((data) => {
      if (data.calculationId === calculationId) {
        setCollaborators(prev => prev.filter(c => c.userId !== data.userId));
        setCursors(prev => {
          const updated = { ...prev };
          delete updated[data.userId];
          return updated;
        });
        setTypingUsers(prev => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
        toast(`${data.email} left the calculation`);
      }
    });
    
    return unsubscribe;
  }, [calculationId, onUserLeft]);

  // Handle cursor movements
  useEffect(() => {
    const unsubscribe = onCursorMove((data) => {
      if (data.calculationId === calculationId) {
        setCursors(prev => ({
          ...prev,
          [data.userId]: {
            field: data.field,
            position: data.position,
            email: data.email
          }
        }));
      }
    });
    
    return unsubscribe;
  }, [calculationId, onCursorMove]);

  // Handle typing indicators
  useEffect(() => {
    const unsubscribe = onUserTyping((data) => {
      if (data.calculationId === calculationId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (data.isTyping) {
            updated.add(data.userId);
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });
      }
    });
    
    return unsubscribe;
  }, [calculationId, onUserTyping]);

  // Typing indicator with debounce
  const typingTimeoutRef = useRef(null);
  const handleTyping = useCallback(() => {
    sendTypingIndicator(calculationId, true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(calculationId, false);
    }, 1000);
  }, [calculationId, sendTypingIndicator]);

  return {
    collaborators,
    typingUsers: Array.from(typingUsers),
    cursors,
    sendUpdate: (inputs, results) => sendCalculationUpdate(calculationId, inputs, results),
    sendCursor: (field, position) => sendCursorPosition(calculationId, field, position),
    handleTyping,
    onCalculationUpdate
  };
}

// Hook for live activity feed
export function useLiveActivity() {
  const [activities, setActivities] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const { onActivityUpdate, onMetricsUpdate } = useSocket();

  useEffect(() => {
    const unsubscribeActivity = onActivityUpdate((activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
    });

    const unsubscribeMetrics = onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    return () => {
      unsubscribeActivity?.();
      unsubscribeMetrics?.();
    };
  }, [onActivityUpdate, onMetricsUpdate]);

  return {
    activities,
    metrics
  };
}