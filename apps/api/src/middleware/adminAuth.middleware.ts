import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

/**
 * Super Admin only middleware.
 * Only allows requests with role === SUPERADMIN.
 */
export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
      return;
    }

    const payload = verifyToken(token);
    if (payload.role !== 'SUPERADMIN') {
      res.status(403).json({ error: 'Super admin access required', code: 'FORBIDDEN' });
      return;
    }

    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}
