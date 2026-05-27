import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types';
import prisma from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '15m') as string;
  return jwt.sign(
    { ...payload, iss: 'ctf-fair', aud: 'ctf-fair-api' },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

export function signRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string;
  return jwt.sign(
    { ...payload, iss: 'ctf-fair', aud: 'ctf-fair-api' },
    process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    { expiresIn } as jwt.SignOptions
  );
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret', { issuer: 'ctf-fair', audience: 'ctf-fair-api' }) as JwtPayload;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'ctf-fair', audience: 'ctf-fair-api' }) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
}

export async function requireParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'PARTICIPANT') {
    res.status(403).json({ success: false, error: 'Participant access required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
  if (user?.isBanned) {
    res.status(403).json({ success: false, error: 'Akun Anda telah dinonaktifkan' });
    return;
  }

  next();
}

export async function requireEventRunning(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const config = await prisma.eventConfig.findUnique({ where: { key: 'is_running' } });
  const isRunning = config?.value === true;

  if (!isRunning) {
    res.status(403).json({ success: false, error: 'Event belum dimulai atau sudah berakhir' });
    return;
  }

  next();
}
