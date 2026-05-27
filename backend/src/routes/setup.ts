import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate';
import { signToken, signRefreshToken } from '../middleware/auth';

const router = Router();

const setupSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  eventDescription: z.string().optional(),
  flagPrefix: z.string().default('CTF_ITFAIR'),
  logoUrl: z.string().optional(),
  primaryColor: z.string().default('#d4820a'),
  startTime: z.string().datetime({ message: 'Invalid start time' }),
  endTime: z.string().datetime({ message: 'Invalid end time' }),
  instanceTtlSeconds: z.number().int().min(60).default(3600),
  maxInstancesPerUser: z.number().int().min(1).default(3),
  adminUsername: z.string().min(3, 'Username must be at least 3 characters'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

router.get('/status', async (_req, res: Response) => {
  try {
    const config = await prisma.appConfig.findFirst();
    const done = config?.isSetupDone || false;
    res.json({ success: true, data: { done } });
  } catch {
    res.json({ success: true, data: { done: false } });
  }
});

router.post('/complete', validate(setupSchema), async (req, res: Response) => {
  try {
    const existing = await prisma.appConfig.findFirst();
    if (existing?.isSetupDone) {
      res.status(404).json({ success: false, error: 'Setup already completed' });
      return;
    }

    const {
      eventName,
      eventDescription,
      flagPrefix,
      logoUrl,
      primaryColor,
      startTime,
      endTime,
      instanceTtlSeconds,
      maxInstancesPerUser,
      adminUsername,
      adminPassword,
    } = req.body;

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        role: 'ADMIN',
      },
    });

    const configEntries = [
      { key: 'event_name', value: eventName },
      { key: 'event_description', value: eventDescription || '' },
      { key: 'flag_prefix', value: flagPrefix },
      { key: 'logo_url', value: logoUrl || '' },
      { key: 'primary_color', value: primaryColor },
      { key: 'start_time', value: startTime },
      { key: 'end_time', value: endTime },
      { key: 'is_running', value: false },
      { key: 'scoreboard_frozen', value: false },
      { key: 'instance_ttl_seconds', value: instanceTtlSeconds },
      { key: 'max_instances_per_user', value: maxInstancesPerUser },
    ];

    for (const entry of configEntries) {
      await prisma.eventConfig.upsert({
        where: { key: entry.key },
        update: { value: entry.value as string | number | boolean, updatedBy: admin.id },
        create: { key: entry.key, value: entry.value as string | number | boolean, updatedBy: admin.id },
      });
    }

    await prisma.appConfig.create({
      data: { isSetupDone: true },
    });

    const tokenPayload = { userId: admin.id, role: 'ADMIN' as const };
    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

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
        user: { id: admin.id, username: admin.username, role: admin.role },
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
