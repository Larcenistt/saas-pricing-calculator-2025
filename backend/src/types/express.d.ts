import { User, Subscription } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user: User & {
        subscription?: Subscription;
      };
      tokenData?: {
        sub: string;
        email: string;
        jti: string;
        iat: number;
        exp: number;
      };
      currentSession?: string;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    userId: string;
    user: User & {
      subscription?: Subscription;
    };
    currentSession?: string;
  }
}