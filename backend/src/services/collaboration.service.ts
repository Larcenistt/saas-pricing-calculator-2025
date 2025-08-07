import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';

export interface SessionParticipant {
  id: string;
  userId?: string;
  socketId: string;
  name: string;
  email?: string;
  permissions: string[];
  cursor?: { x: number; y: number; field?: string };
  joinedAt: Date;
  lastActive: Date;
}

export interface SessionState {
  sessionId: string;
  inputs: Record<string, any>;
  results?: Record<string, any>;
  participants: SessionParticipant[];
  version: number;
  lastUpdated: Date;
}

export interface UpdateInfo {
  userId?: string;
  socketId: string;
  timestamp: number;
}

export interface UpdateResult {
  success: boolean;
  finalValue: any;
  conflicts?: any[];
  timestamp: number;
  version: number;
}

interface JWTPayload {
  sub: string;
  email: string;
  name: string;
}

class CollaborationService {
  private io: SocketIOServer;
  private activeSessions: Map<string, SessionManager> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();
  private rateLimitCache = new NodeCache({ stdTTL: 60 }); // 1 minute cache for rate limiting

  constructor(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.initializeCleanup();

    logger.info('WebSocket collaboration server initialized');
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
        
        const user = await prisma.user.findUnique({
          where: { id: decoded.sub },
          include: { subscription: true }
        });

        if (!user || !user.isActive) {
          throw new Error('User not found or inactive');
        }

        socket.userId = decoded.sub;
        socket.user = user;
        
        next();
      } catch (error) {
        logger.warn(`WebSocket authentication failed: ${error}`);
        next(new Error('Authentication failed'));
      }
    });

    // Rate limiting middleware
    this.io.use(async (socket, next) => {
      const userId = socket.userId;
      const rateLimitKey = `ws:ratelimit:${userId}`;
      const currentCount = this.rateLimitCache.get(rateLimitKey) as number || 0;
      
      if (currentCount > 100) { // 100 connections per minute per user
        next(new Error('Rate limit exceeded'));
        return;
      }
      
      this.rateLimitCache.set(rateLimitKey, currentCount + 1);
      next();
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      logger.info(`User ${userId} connected with socket ${socket.id}`);
      
      // Track user connections
      this.trackUserConnection(userId, socket.id);
      
      // Core collaboration events
      socket.on('join-session', (data) => this.handleJoinSession(socket, data));
      socket.on('leave-session', (data) => this.handleLeaveSession(socket, data));
      socket.on('update-input', (data) => this.handleInputUpdate(socket, data));
      socket.on('cursor-move', (data) => this.handleCursorMove(socket, data));
      socket.on('add-comment', (data) => this.handleAddComment(socket, data));
      socket.on('resolve-comment', (data) => this.handleResolveComment(socket, data));
      socket.on('request-recalculation', (data) => this.handleRecalculation(socket, data));
      
      // Connection management
      socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
      socket.on('error', (error) => this.handleError(socket, error));
    });
  }

  private trackUserConnection(userId: string, socketId: string): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
    this.socketUsers.set(socketId, userId);
  }

  private async handleJoinSession(socket: Socket, data: { sessionId: string; permissions?: string[] }): Promise<void> {
    try {
      const { sessionId, permissions = ['read', 'write', 'comment'] } = data;
      
      // Validate session exists and user has access
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId },
        include: { 
          calculation: { include: { user: true, team: true } },
          host: true,
          participants: true
        }
      });

      if (!session || !session.isActive) {
        socket.emit('error', { 
          code: 'SESSION_NOT_FOUND',
          message: 'Collaboration session not found or expired' 
        });
        return;
      }

      // Check if user can join (owner, team member, or invited)
      const canJoin = await this.canUserJoinSession(socket.userId, session);
      if (!canJoin) {
        socket.emit('error', { 
          code: 'JOIN_DENIED',
          message: 'Access denied to this collaboration session' 
        });
        return;
      }

      // Check participant limit
      if (session.participants.length >= session.maxParticipants) {
        socket.emit('error', { 
          code: 'SESSION_FULL',
          message: 'Collaboration session has reached maximum participants' 
        });
        return;
      }

      // Join socket room
      await socket.join(sessionId);
      socket.currentSession = sessionId;

      // Get or create session manager
      let sessionManager = this.activeSessions.get(sessionId);
      if (!sessionManager) {
        sessionManager = new SessionManager(sessionId);
        this.activeSessions.set(sessionId, sessionManager);
        await sessionManager.initialize();
      }

      // Add participant
      const participant: SessionParticipant = {
        id: uuidv4(),
        userId: socket.userId,
        socketId: socket.id,
        name: socket.user.name || socket.user.email,
        email: socket.user.email,
        permissions,
        joinedAt: new Date(),
        lastActive: new Date()
      };

      await sessionManager.addParticipant(participant);

      // Add to database
      await prisma.collaborationParticipant.create({
        data: {
          sessionId,
          userId: socket.userId,
          socketId: socket.id,
          permissions: permissions as any,
          guestName: socket.user.name
        }
      });

      // Notify other participants
      socket.to(sessionId).emit('participant-joined', {
        participant: this.serializeParticipant(participant),
        timestamp: new Date().toISOString()
      });

      // Send current session state to joining user
      const sessionState = await sessionManager.getState();
      socket.emit('session-joined', {
        sessionId,
        state: sessionState,
        participants: sessionManager.getParticipants().map(p => this.serializeParticipant(p)),
        permissions: participant.permissions,
        timestamp: new Date().toISOString()
      });

      logger.info(`User ${socket.userId} joined collaboration session ${sessionId}`);

    } catch (error) {
      logger.error('Error joining session:', error);
      socket.emit('error', {
        code: 'JOIN_ERROR',
        message: 'Failed to join collaboration session'
      });
    }
  }

  private async handleLeaveSession(socket: Socket, data: { sessionId: string }): Promise<void> {
    try {
      const { sessionId } = data;
      
      if (socket.currentSession !== sessionId) return;

      const sessionManager = this.activeSessions.get(sessionId);
      if (sessionManager) {
        await sessionManager.removeParticipant(socket.id);
        
        // Notify other participants
        socket.to(sessionId).emit('participant-left', {
          socketId: socket.id,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }

      // Remove from database
      await prisma.collaborationParticipant.deleteMany({
        where: {
          sessionId,
          socketId: socket.id
        }
      });

      // Leave socket room
      socket.leave(sessionId);
      socket.currentSession = undefined;

      logger.info(`User ${socket.userId} left collaboration session ${sessionId}`);

    } catch (error) {
      logger.error('Error leaving session:', error);
    }
  }

  private async handleInputUpdate(socket: Socket, data: { field: string; value: any; timestamp?: number }): Promise<void> {
    try {
      const { field, value, timestamp = Date.now() } = data;
      const sessionId = socket.currentSession;

      if (!sessionId) return;

      const sessionManager = this.activeSessions.get(sessionId);
      if (!sessionManager) return;

      // Check permissions
      const participant = sessionManager.getParticipant(socket.id);
      if (!participant?.permissions.includes('write')) {
        socket.emit('error', { 
          code: 'PERMISSION_DENIED',
          message: 'Write permission required' 
        });
        return;
      }

      // Rate limit input updates (10 per second per user)
      const rateLimitKey = `input:${socket.userId}:${Math.floor(Date.now() / 1000)}`;
      const updateCount = this.rateLimitCache.get(rateLimitKey) as number || 0;
      if (updateCount > 10) {
        socket.emit('error', { code: 'RATE_LIMIT', message: 'Too many updates' });
        return;
      }
      this.rateLimitCache.set(rateLimitKey, updateCount + 1, 1);

      // Apply update with conflict resolution
      const updateResult = await sessionManager.updateInput(field, value, {
        userId: socket.userId,
        socketId: socket.id,
        timestamp
      });

      if (updateResult.success) {
        // Broadcast to other participants (not sender)
        socket.to(sessionId).emit('input-updated', {
          field,
          value: updateResult.finalValue,
          updatedBy: {
            userId: socket.userId,
            name: socket.user.name || socket.user.email,
            socketId: socket.id
          },
          timestamp: updateResult.timestamp,
          version: updateResult.version
        });

        // Schedule recalculation with debouncing
        sessionManager.scheduleRecalculation();
      }

      // Update participant activity
      await sessionManager.updateParticipantActivity(socket.id);

    } catch (error) {
      logger.error('Error updating input:', error);
      socket.emit('error', {
        code: 'UPDATE_ERROR',
        message: 'Failed to update input'
      });
    }
  }

  private async handleCursorMove(socket: Socket, data: { x: number; y: number; field?: string }): Promise<void> {
    try {
      const sessionId = socket.currentSession;
      if (!sessionId) return;

      const sessionManager = this.activeSessions.get(sessionId);
      if (!sessionManager) return;

      // Update cursor position
      await sessionManager.updateCursor(socket.id, data);

      // Broadcast cursor position to other participants
      socket.to(sessionId).emit('cursor-moved', {
        userId: socket.userId,
        socketId: socket.id,
        cursor: data,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Error handling cursor move:', error);
    }
  }

  private async handleAddComment(socket: Socket, data: { content: string; position?: any }): Promise<void> {
    try {
      const { content, position } = data;
      const sessionId = socket.currentSession;

      if (!sessionId || !content.trim()) return;

      const participant = this.activeSessions.get(sessionId)?.getParticipant(socket.id);
      if (!participant?.permissions.includes('comment')) {
        socket.emit('error', { code: 'PERMISSION_DENIED', message: 'Comment permission required' });
        return;
      }

      // Save comment to database
      const comment = await prisma.collaborationComment.create({
        data: {
          sessionId,
          authorId: socket.userId,
          content: content.trim(),
          position: position as any
        },
        include: { author: true }
      });

      // Broadcast comment to all participants
      this.io.to(sessionId).emit('comment-added', {
        id: comment.id,
        content: comment.content,
        position: comment.position,
        author: {
          id: comment.author?.id,
          name: comment.author?.name || comment.author?.email,
          email: comment.author?.email
        },
        createdAt: comment.createdAt.toISOString()
      });

    } catch (error) {
      logger.error('Error adding comment:', error);
      socket.emit('error', { code: 'COMMENT_ERROR', message: 'Failed to add comment' });
    }
  }

  private async handleResolveComment(socket: Socket, data: { commentId: string }): Promise<void> {
    try {
      const { commentId } = data;
      const sessionId = socket.currentSession;

      if (!sessionId) return;

      // Update comment in database
      const comment = await prisma.collaborationComment.update({
        where: { id: commentId },
        data: { isResolved: true },
        include: { author: true }
      });

      // Broadcast resolution to all participants
      this.io.to(sessionId).emit('comment-resolved', {
        commentId,
        resolvedBy: {
          id: socket.userId,
          name: socket.user.name || socket.user.email
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error resolving comment:', error);
    }
  }

  private async handleRecalculation(socket: Socket, _data: any): Promise<void> {
    try {
      const sessionId = socket.currentSession;
      if (!sessionId) return;

      const sessionManager = this.activeSessions.get(sessionId);
      if (!sessionManager) return;

      await sessionManager.performRecalculation(socket.userId, socket.user.name || socket.user.email);

    } catch (error) {
      logger.error('Recalculation error:', error);
      socket.emit('error', {
        code: 'CALCULATION_ERROR',
        message: 'Failed to recalculate'
      });
    }
  }

  private handleDisconnect(socket: Socket, reason: string): void {
    const userId = socket.userId;
    const sessionId = socket.currentSession;
    
    logger.info(`User ${userId} disconnected: ${reason}`);

    // Remove from user connections tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUsers.delete(socket.id);

    // Clean up session participation
    if (sessionId) {
      this.handleLeaveSession(socket, { sessionId });
    }
  }

  private handleError(socket: Socket, error: any): void {
    logger.error(`WebSocket error for user ${socket.userId}:`, error);
  }

  private async canUserJoinSession(userId: string, session: any): Promise<boolean> {
    // Host can always join
    if (session.hostId === userId) return true;

    // Calculation owner can join
    if (session.calculation.userId === userId) return true;

    // Team members can join if calculation belongs to team
    if (session.calculation.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: session.calculation.teamId,
          userId: userId
        }
      });
      if (teamMember) return true;
    }

    return false;
  }

  private serializeParticipant(participant: SessionParticipant): any {
    return {
      id: participant.id,
      userId: participant.userId,
      name: participant.name,
      email: participant.email,
      permissions: participant.permissions,
      cursor: participant.cursor,
      joinedAt: participant.joinedAt.toISOString(),
      lastActive: participant.lastActive.toISOString()
    };
  }

  private initializeCleanup(): void {
    // Clean up expired sessions every 10 minutes
    setInterval(async () => {
      try {
        const expiredSessions = await prisma.collaborationSession.findMany({
          where: {
            isActive: true,
            expiresAt: { lt: new Date() }
          }
        });

        for (const session of expiredSessions) {
          await this.cleanupSession(session.id);
        }
      } catch (error) {
        logger.error('Error cleaning up expired sessions:', error);
      }
    }, 10 * 60 * 1000);
  }

  private async cleanupSession(sessionId: string): Promise<void> {
    try {
      // Mark session as inactive
      await prisma.collaborationSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      });

      // Remove from active sessions
      const sessionManager = this.activeSessions.get(sessionId);
      if (sessionManager) {
        await sessionManager.cleanup();
        this.activeSessions.delete(sessionId);
      }

      // Notify participants
      this.io.to(sessionId).emit('session-expired', {
        sessionId,
        timestamp: new Date().toISOString()
      });

      // Disconnect all sockets in the room
      const sockets = await this.io.in(sessionId).fetchSockets();
      for (const socket of sockets) {
        socket.leave(sessionId);
        (socket as any).currentSession = undefined;
      }

      logger.info(`Cleaned up expired session: ${sessionId}`);
    } catch (error) {
      logger.error(`Error cleaning up session ${sessionId}:`, error);
    }
  }

  // Public methods for session management
  async createSession(calculationId: string, hostId: string, maxParticipants = 5): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

    await prisma.collaborationSession.create({
      data: {
        id: sessionId,
        calculationId,
        hostId,
        maxParticipants,
        settings: { 
          allowGuestAccess: false,
          requireApproval: false,
          recordChanges: true
        },
        expiresAt
      }
    });

    logger.info(`Created collaboration session ${sessionId} for calculation ${calculationId}`);
    return sessionId;
  }

  async getActiveParticipants(sessionId: string): Promise<SessionParticipant[]> {
    const sessionManager = this.activeSessions.get(sessionId);
    return sessionManager ? sessionManager.getParticipants() : [];
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

// Session Manager class for handling session state
class SessionManager {
  private sessionId: string;
  private participants: Map<string, SessionParticipant> = new Map();
  private state: any = { inputs: {}, results: null };
  private version: number = 1;
  private recalculationTimeout: NodeJS.Timeout | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  async initialize(): Promise<void> {
    // Load session state from database or calculation
    const session = await prisma.collaborationSession.findUnique({
      where: { id: this.sessionId },
      include: { calculation: true }
    });

    if (session) {
      this.state = session.sessionState || {
        inputs: session.calculation.inputs,
        results: session.calculation.results
      };
    }
  }

  async addParticipant(participant: SessionParticipant): Promise<void> {
    this.participants.set(participant.socketId, participant);
  }

  async removeParticipant(socketId: string): Promise<void> {
    this.participants.delete(socketId);
  }

  getParticipant(socketId: string): SessionParticipant | undefined {
    return this.participants.get(socketId);
  }

  getParticipants(): SessionParticipant[] {
    return Array.from(this.participants.values());
  }

  async updateInput(field: string, value: any, updateInfo: UpdateInfo): Promise<UpdateResult> {
    // Simple last-write-wins conflict resolution
    this.state.inputs[field] = value;
    this.version++;

    // Save state to Redis for persistence
    await this.saveState();

    return {
      success: true,
      finalValue: value,
      timestamp: Date.now(),
      version: this.version
    };
  }

  async updateCursor(socketId: string, cursor: { x: number; y: number; field?: string }): Promise<void> {
    const participant = this.participants.get(socketId);
    if (participant) {
      participant.cursor = cursor;
      participant.lastActive = new Date();
    }
  }

  async updateParticipantActivity(socketId: string): Promise<void> {
    const participant = this.participants.get(socketId);
    if (participant) {
      participant.lastActive = new Date();
    }
  }

  scheduleRecalculation(delay = 500): void {
    if (this.recalculationTimeout) {
      clearTimeout(this.recalculationTimeout);
    }

    this.recalculationTimeout = setTimeout(() => {
      this.performRecalculation();
    }, delay);
  }

  async performRecalculation(userId?: string, userName?: string): Promise<void> {
    try {
      // Import calculation service dynamically to avoid circular imports
      const { calculationService } = await import('./calculation.service');
      
      const results = await calculationService.calculate(this.state.inputs);
      this.state.results = results;
      this.version++;

      // Save updated state
      await this.saveState();

      // Get IO instance and broadcast results
      const io = getSocketIOInstance();
      io.to(this.sessionId).emit('calculation-updated', {
        results,
        calculatedBy: userId ? { userId, name: userName } : null,
        timestamp: new Date().toISOString(),
        version: this.version
      });

    } catch (error) {
      logger.error('Recalculation failed:', error);
    }
  }

  async getState(): Promise<SessionState> {
    return {
      sessionId: this.sessionId,
      inputs: this.state.inputs,
      results: this.state.results,
      participants: this.getParticipants(),
      version: this.version,
      lastUpdated: new Date()
    };
  }

  private async saveState(): Promise<void> {
    try {
      // Save to Redis
      const stateKey = `collaboration:state:${this.sessionId}`;
      await redisClient.setex(stateKey, 3600, JSON.stringify(this.state)); // 1 hour TTL

      // Update database
      await prisma.collaborationSession.update({
        where: { id: this.sessionId },
        data: { sessionState: this.state }
      });
    } catch (error) {
      logger.error('Failed to save session state:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.recalculationTimeout) {
      clearTimeout(this.recalculationTimeout);
    }
    
    // Clean up Redis state
    const stateKey = `collaboration:state:${this.sessionId}`;
    await redisClient.del(stateKey);
  }
}

// Global instance for accessing in other modules
let collaborationService: CollaborationService | null = null;

export function initializeCollaboration(httpServer: Server): void {
  collaborationService = new CollaborationService(httpServer);
}

export function getCollaborationService(): CollaborationService {
  if (!collaborationService) {
    throw new Error('Collaboration service not initialized');
  }
  return collaborationService;
}

export function getSocketIOInstance(): SocketIOServer {
  return getCollaborationService().getIO();
}

export { CollaborationService };