import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: string;
  clinicId: string;
  role: 'DOCTOR' | 'STAFF' | 'SUPERADMIN';
  email: string;
  plan?: string;
  staffRole?: string;
}

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set in environment variables');
  return s;
};

const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret()) as JwtPayload;
}
