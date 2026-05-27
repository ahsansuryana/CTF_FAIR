import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate';
import { signToken, signRefreshToken, verifyRefreshToken, requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { createAuditLog } from '../services/audit';

const router = Router();

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => `${req.ip}:${(req.body?.username as string) || 'unknown'}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      await createAuditLog({
        actorId: 'unknown',
        action: 'login.failed',
        metadata: { username },
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ success: false, error: 'Akun Anda telah dinonaktifkan' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await createAuditLog({
        actorId: user.id,
        action: 'login.failed',
        metadata: { username },
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await createAuditLog({
      actorId: user.id,
      action: 'login.success',
      ipAddress: req.ip,
    });

    const cookieSecure = req.secure ?? false;

    res.cookie('token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, role: user.role },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/logout', (req, res: Response) => {
  const cookieSecure = req.secure ?? false;
  res.cookie('token', '', { httpOnly: true, secure: cookieSecure, sameSite: 'lax', maxAge: 0 });
  res.cookie('refreshToken', '', { httpOnly: true, secure: cookieSecure, sameSite: 'lax', maxAge: 0 });
  res.json({ success: true, data: { message: 'Logged out' } });
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true, isBanned: true },
    });

    if (!user || user.isBanned) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const cookieSecure = req.secure ?? false;

    const tokenPayload = { userId: user.id, role: user.role };
    const newToken = signToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    res.cookie('token', newToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { user } });
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
});

export default router;
