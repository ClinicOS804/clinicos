import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      clinicId?: string;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      token = auth.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token as string;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
      return;
    }

    const payload = verifyToken(token);
    req.user     = payload;
    req.clinicId = payload.clinicId || undefined;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

export function doctorOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'DOCTOR') {
    res.status(403).json({ error: 'Doctor access required', code: 'FORBIDDEN' });
    return;
  }
  next();
}

export function doctorOrStaff(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'DOCTOR' && req.user?.role !== 'STAFF') {
    res.status(403).json({ error: 'Access denied', code: 'FORBIDDEN' });
    return;
  }
  next();
}
