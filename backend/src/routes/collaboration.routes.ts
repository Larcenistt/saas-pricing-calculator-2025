import { Router, Request, Response } from 'express';
import { getCollaborationService } from '../services/collaboration.service';
import { securityService } from '../services/security.service';
import { prisma } from '../server';
import { logger } from '../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const createSessionSchema = Joi.object({
  calculationId: Joi.string().uuid().required(),
  maxParticipants: Joi.number().integer().min(2).max(20).default(5),
  settings: Joi.object({
    allowGuestAccess: Joi.boolean().default(false),
    requireApproval: Joi.boolean().default(false),
    recordChanges: Joi.boolean().default(true),
    allowComments: Joi.boolean().default(true)
  }).default({})
});

const inviteParticipantSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  permissions: Joi.array().items(
    Joi.string().valid('read', 'write', 'comment', 'admin')
  ).default(['read', 'write', 'comment']),
  message: Joi.string().max(500).optional()
});

const updateSessionSettingsSchema = Joi.object({
  maxParticipants: Joi.number().integer().min(2).max(20).optional(),
  settings: Joi.object({
    allowGuestAccess: Joi.boolean().optional(),
    requireApproval: Joi.boolean().optional(),
    recordChanges: Joi.boolean().optional(),
    allowComments: Joi.boolean().optional()
  }).optional(),
  expiresAt: Joi.date().greater('now').optional()
});

/**
 * @route POST /api/v1/collaboration/sessions
 * @desc Create a new collaboration session
 * @access Private (Professional/Enterprise plans)
 */
router.post('/sessions',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'collaboration',
    validateInput: createSessionSchema,
    permissions: ['collaboration']
  }),
  async (req: Request, res: Response) => {
    try {
      const { calculationId, maxParticipants, settings } = req.body;
      
      // Verify user owns the calculation or is part of the team
      const calculation = await prisma.calculation.findUnique({
        where: { id: calculationId },
        include: { team: { include: { members: true } } }
      });
      
      if (!calculation) {
        return res.status(404).json({
          success: false,
          error: 'Calculation not found',
          code: 'CALCULATION_NOT_FOUND'
        });
      }
      
      // Check if user has access to the calculation
      const hasAccess = calculation.userId === req.user.id ||
        (calculation.team && calculation.team.members.some(m => m.userId === req.user.id));
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this calculation',
          code: 'ACCESS_DENIED'
        });
      }
      
      // Check for existing active sessions
      const existingSession = await prisma.collaborationSession.findFirst({
        where: {
          calculationId,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (existingSession) {
        return res.json({
          success: true,
          data: {
            sessionId: existingSession.id,
            message: 'Using existing active session',
            existing: true
          }
        });
      }
      
      // Create new session
      const collaborationService = getCollaborationService();
      const sessionId = await collaborationService.createSession(
        calculationId,
        req.user.id,
        maxParticipants
      );
      
      // Update session settings if provided
      if (settings && Object.keys(settings).length > 0) {
        await prisma.collaborationSession.update({
          where: { id: sessionId },
          data: { settings: settings as any }
        });
      }
      
      logger.info(`Created collaboration session ${sessionId} for calculation ${calculationId}`);
      
      res.status(201).json({
        success: true,
        data: {
          sessionId,
          calculationId,
          hostId: req.user.id,
          maxParticipants,
          settings,
          joinUrl: `${process.env.FRONTEND_URL}/collaborate/${sessionId}`,
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
        }
      });

    } catch (error: any) {
      logger.error('Collaboration session creation failed:', error);
      
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to create collaboration session',
        code: error.code || 'SESSION_CREATION_ERROR'
      });
    }
  }
);

/**
 * @route GET /api/v1/collaboration/sessions/:sessionId
 * @desc Get collaboration session details
 * @access Private
 */
router.get('/sessions/:sessionId',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId },
        include: {
          calculation: { include: { user: true, team: true } },
          host: { select: { id: true, name: true, email: true } },
          participants: {
            include: { user: { select: { id: true, name: true, email: true } } }
          },
          comments: {
            include: { author: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      // Check if user has access to this session
      const hasAccess = session.hostId === req.user.id ||
        session.calculation.userId === req.user.id ||
        session.participants.some(p => p.userId === req.user.id) ||
        (session.calculation.team?.members?.some(m => m.userId === req.user.id));
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to this session',
          code: 'ACCESS_DENIED'
        });
      }
      
      // Get active participants from WebSocket service
      const collaborationService = getCollaborationService();
      const activeParticipants = await collaborationService.getActiveParticipants(sessionId);
      
      res.json({
        success: true,
        data: {
          session: {
            id: session.id,
            calculationId: session.calculationId,
            host: session.host,
            isActive: session.isActive,
            maxParticipants: session.maxParticipants,
            settings: session.settings,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt
          },
          calculation: {
            id: session.calculation.id,
            name: session.calculation.name,
            owner: {
              id: session.calculation.user.id,
              name: session.calculation.user.name,
              email: session.calculation.user.email
            }
          },
          participants: {
            total: session.participants.length,
            active: activeParticipants.length,
            list: session.participants.map(p => ({
              id: p.id,
              user: p.user,
              permissions: p.permissions,
              joinedAt: p.joinedAt,
              lastActive: p.lastActive,
              isActive: activeParticipants.some(ap => ap.userId === p.userId)
            }))
          },
          comments: session.comments.map(c => ({
            id: c.id,
            content: c.content,
            author: c.author,
            position: c.position,
            isResolved: c.isResolved,
            createdAt: c.createdAt
          }))
        }
      });

    } catch (error: any) {
      logger.error('Session retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve session details'
      });
    }
  }
);

/**
 * @route PUT /api/v1/collaboration/sessions/:sessionId
 * @desc Update collaboration session settings
 * @access Private (Host only)
 */
router.put('/sessions/:sessionId',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api',
    validateInput: updateSessionSettingsSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      // Only host can update session settings
      if (session.hostId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Only the session host can update settings',
          code: 'HOST_ONLY'
        });
      }
      
      const updatedSession = await prisma.collaborationSession.update({
        where: { id: sessionId },
        data: {
          maxParticipants: updates.maxParticipants,
          settings: updates.settings ? { ...session.settings, ...updates.settings } : session.settings,
          expiresAt: updates.expiresAt
        }
      });
      
      logger.info(`Session ${sessionId} settings updated by host ${req.user.id}`);
      
      res.json({
        success: true,
        data: {
          sessionId: updatedSession.id,
          maxParticipants: updatedSession.maxParticipants,
          settings: updatedSession.settings,
          expiresAt: updatedSession.expiresAt
        },
        message: 'Session settings updated successfully'
      });

    } catch (error: any) {
      logger.error('Session update failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update session settings'
      });
    }
  }
);

/**
 * @route POST /api/v1/collaboration/sessions/:sessionId/invite
 * @desc Invite participant to collaboration session
 * @access Private (Host and admins)
 */
router.post('/sessions/:sessionId/invite',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'collaboration',
    validateInput: inviteParticipantSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { email, permissions, message } = req.body;
      
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId },
        include: { 
          calculation: true, 
          participants: true 
        }
      });
      
      if (!session || !session.isActive) {
        return res.status(404).json({
          success: false,
          error: 'Active session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      // Check if user can invite (host or admin)
      const canInvite = session.hostId === req.user.id ||
        session.calculation.userId === req.user.id;
      
      if (!canInvite) {
        return res.status(403).json({
          success: false,
          error: 'Only hosts can invite participants',
          code: 'HOST_ONLY'
        });
      }
      
      // Check participant limit
      if (session.participants.length >= session.maxParticipants) {
        return res.status(400).json({
          success: false,
          error: 'Session has reached maximum participants',
          code: 'SESSION_FULL'
        });
      }
      
      // Find user by email
      const invitedUser = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!invitedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found with that email address',
          code: 'USER_NOT_FOUND'
        });
      }
      
      // Check if user is already a participant
      const existingParticipant = session.participants.find(p => p.userId === invitedUser.id);
      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          error: 'User is already a participant in this session',
          code: 'ALREADY_PARTICIPANT'
        });
      }
      
      // For now, we'll create a placeholder participant record
      // In a full implementation, you'd send an email invitation
      const participant = await prisma.collaborationParticipant.create({
        data: {
          sessionId,
          userId: invitedUser.id,
          socketId: `pending-${Date.now()}`, // Placeholder until they connect
          permissions: permissions as any,
          guestName: invitedUser.name
        }
      });
      
      // TODO: Send email invitation with session link
      // await emailService.sendCollaborationInvite({
      //   to: email,
      //   sessionId,
      //   inviterName: req.user.name,
      //   message,
      //   joinUrl: `${process.env.FRONTEND_URL}/collaborate/${sessionId}`
      // });
      
      logger.info(`User ${invitedUser.id} invited to session ${sessionId} by ${req.user.id}`);
      
      res.status(201).json({
        success: true,
        data: {
          participantId: participant.sessionId,
          invitedUser: {
            id: invitedUser.id,
            name: invitedUser.name,
            email: invitedUser.email
          },
          permissions,
          joinUrl: `${process.env.FRONTEND_URL}/collaborate/${sessionId}`
        },
        message: 'Invitation sent successfully'
      });

    } catch (error: any) {
      logger.error('Collaboration invitation failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to send collaboration invitation'
      });
    }
  }
);

/**
 * @route DELETE /api/v1/collaboration/sessions/:sessionId
 * @desc End collaboration session
 * @access Private (Host only)
 */
router.delete('/sessions/:sessionId',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      const session = await prisma.collaborationSession.findUnique({
        where: { id: sessionId }
      });
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      // Only host can end session
      if (session.hostId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Only the session host can end the session',
          code: 'HOST_ONLY'
        });
      }
      
      // Mark session as inactive
      await prisma.collaborationSession.update({
        where: { id: sessionId },
        data: { isActive: false }
      });
      
      // Clean up participants
      await prisma.collaborationParticipant.deleteMany({
        where: { sessionId }
      });
      
      logger.info(`Collaboration session ${sessionId} ended by host ${req.user.id}`);
      
      res.json({
        success: true,
        message: 'Collaboration session ended successfully'
      });

    } catch (error: any) {
      logger.error('Session termination failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to end collaboration session'
      });
    }
  }
);

/**
 * @route GET /api/v1/collaboration/sessions
 * @desc Get user's collaboration sessions
 * @access Private
 */
router.get('/sessions',
  securityService.createSecurityMiddleware({
    requireAuth: true,
    rateLimitType: 'api'
  }),
  async (req: Request, res: Response) => {
    try {
      const { active, limit = 20, offset = 0 } = req.query;
      
      const whereClause: any = {
        OR: [
          { hostId: req.user.id },
          { participants: { some: { userId: req.user.id } } },
          { calculation: { userId: req.user.id } }
        ]
      };
      
      if (active === 'true') {
        whereClause.isActive = true;
        whereClause.expiresAt = { gt: new Date() };
      }
      
      const [sessions, total] = await Promise.all([
        prisma.collaborationSession.findMany({
          where: whereClause,
          include: {
            calculation: { select: { id: true, name: true } },
            host: { select: { id: true, name: true, email: true } },
            participants: { select: { userId: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: Number(limit),
          skip: Number(offset)
        }),
        prisma.collaborationSession.count({ where: whereClause })
      ]);
      
      const enrichedSessions = sessions.map(session => ({
        id: session.id,
        calculationId: session.calculationId,
        calculationName: session.calculation.name,
        host: session.host,
        isHost: session.hostId === req.user.id,
        isActive: session.isActive,
        participantCount: session.participants.length,
        maxParticipants: session.maxParticipants,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        joinUrl: session.isActive ? `${process.env.FRONTEND_URL}/collaborate/${session.id}` : null
      }));
      
      res.json({
        success: true,
        data: {
          sessions: enrichedSessions,
          pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + sessions.length < total
          }
        }
      });

    } catch (error: any) {
      logger.error('Sessions retrieval failed:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve collaboration sessions'
      });
    }
  }
);

export default router;