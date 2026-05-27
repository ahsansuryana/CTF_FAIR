import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import multer from 'multer';
import prisma from '../../lib/prisma';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { AuthenticatedRequest } from '../../types';
import { createAuditLog } from '../../services/audit';
import { saveAttachment, deleteFile } from '../../services/fileService';
import { extractAndBuildCompose, removeCompose } from '../../services/composeService';
import { io } from '../../index';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth, requireAdmin);

// Dashboard stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [totalParticipants, totalSolves, totalChallenges, recentSubmissions] = await Promise.all([
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.solve.count(),
      prisma.challenge.count({ where: { isActive: true } }),
      prisma.submission.findMany({
        take: 10,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: { select: { username: true } },
          challenge: { select: { title: true, points: true } },
        },
      }),
    ]);

    const solvesPerChallenge = await prisma.solve.groupBy({
      by: ['challengeId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topChallenges = await Promise.all(
      solvesPerChallenge.map(async (sc) => {
        const challenge = await prisma.challenge.findUnique({ where: { id: sc.challengeId } });
        return {
          title: challenge?.title || 'Unknown',
          solveCount: sc._count.id,
        };
      }),
    );

    const config = await prisma.eventConfig.findMany();
    const configMap = new Map(config.map((c) => [c.key, c.value]));

    res.json({
      success: true,
      data: {
        totalParticipants,
        totalSolves,
        totalChallenges,
        topChallenges,
        recentSubmissions: recentSubmissions.map((s) => ({
          id: s.id,
          username: s.user.username,
          challengeTitle: s.challenge.title,
          isCorrect: s.isCorrect,
          submittedAt: s.submittedAt,
          ipAddress: s.ipAddress,
        })),
        eventStatus: {
          isRunning: configMap.get('is_running') === true,
          isFrozen: configMap.get('scoreboard_frozen') === true,
          name: configMap.get('event_name') || '',
          startTime: configMap.get('start_time') || null,
          endTime: configMap.get('end_time') || null,
        },
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Challenges CRUD
router.get('/challenges', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: { select: { solves: true, submissions: true } },
        hints: { orderBy: { orderIndex: 'asc' } },
      },
    });

    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Admin list challenges error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

const challengeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['web', 'crypto', 'forensics', 'stegano', 'osint']),
  points: z.number().int().min(1, 'Points must be at least 1'),
  flag: z.string().min(1, 'Flag is required'),
  orderIndex: z.number().int().min(1, 'Order index must be at least 1'),
  isActive: z.boolean().default(true),
  dockerImage: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
});

router.post('/challenges', validate(challengeSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.challenge.findFirst({ where: { orderIndex: req.body.orderIndex } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Order index already exists. Choose a different order.' });
      return;
    }

    const challenge = await prisma.challenge.create({
      data: req.body,
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.created',
      targetType: 'challenge',
      targetId: challenge.id,
      metadata: { title: challenge.title },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/challenges/:id', validate(challengeSchema.partial()), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenge = await prisma.challenge.update({
      where: { id: req.params.id! },
      data: req.body,
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.updated',
      targetType: 'challenge',
      targetId: challenge.id,
      metadata: { title: challenge.title },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/challenges/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const solveCount = await prisma.solve.count({ where: { challengeId: req.params.id! } });
    if (solveCount > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete challenge with existing solves' });
      return;
    }

    const challenge = await prisma.challenge.delete({ where: { id: req.params.id! } });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.deleted',
      targetType: 'challenge',
      targetId: challenge.id,
      metadata: { title: challenge.title },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Challenge deleted' } });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/challenges/:id/toggle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id! } });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const updated = await prisma.challenge.update({
      where: { id: req.params.id! },
      data: { isActive: !challenge.isActive },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Toggle challenge error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Hints CRUD
router.post('/challenges/:id/hints', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challengeId = req.params.id!!;
    const hint = await prisma.hint.create({
      data: {
        challengeId,
        content: req.body.content,
        orderIndex: req.body.orderIndex || 0,
      },
    });
    res.status(201).json({ success: true, data: hint });
  } catch (error) {
    console.error('Create hint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/hints/:hintId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const hint = await prisma.hint.update({
      where: { id: req.params.hintId },
      data: { content: req.body.content, orderIndex: req.body.orderIndex },
    });
    res.json({ success: true, data: hint });
  } catch (error) {
    console.error('Update hint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/hints/:hintId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.hint.delete({ where: { id: req.params.hintId } });
    res.json({ success: true, data: { message: 'Hint deleted' } });
  } catch (error) {
    console.error('Delete hint error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Participant management
router.get('/participants', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const participants = await prisma.user.findMany({
      where: { role: 'PARTICIPANT' },
      select: {
        id: true,
        username: true,
        isBanned: true,
        createdAt: true,
        _count: { select: { solves: true } },
        solves: { select: { pointsEarned: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = participants.map((p) => ({
      id: p.id,
      username: p.username,
      isBanned: p.isBanned,
      createdAt: p.createdAt,
      totalPoints: p.solves.reduce((sum, s) => sum + s.pointsEarned, 0),
      solveCount: p._count.solves,
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('List participants error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

const createParticipantSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/participants', validate(createParticipantSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({ where: { username: req.body.username } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await prisma.user.create({
      data: {
        username: req.body.username,
        passwordHash,
        role: 'PARTICIPANT',
      },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'participant.created',
      targetType: 'participant',
      targetId: user.id,
      metadata: { username: user.username },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Create participant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/participants/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const participant = await prisma.user.findUnique({
      where: { id: req.params.id! },
      select: {
        id: true,
        username: true,
        role: true,
        isBanned: true,
        createdAt: true,
        solves: {
          include: { challenge: { select: { title: true, points: true, category: true } } },
          orderBy: { solvedAt: 'desc' },
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 50,
          include: { challenge: { select: { title: true } } },
        },
      },
    });

    if (!participant || participant.role !== 'PARTICIPANT') {
      res.status(404).json({ success: false, error: 'Participant not found' });
      return;
    }

    res.json({ success: true, data: participant });
  } catch (error) {
    console.error('Get participant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/participants/:id/reset-password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.params.id! },
      data: { passwordHash },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'participant.password_reset',
      targetType: 'participant',
      targetId: req.params.id!,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Password reset successful' } });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.patch('/participants/:id/toggle-ban', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const participant = await prisma.user.findUnique({ where: { id: req.params.id! } });
    if (!participant) {
      res.status(404).json({ success: false, error: 'Participant not found' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id! },
      data: { isBanned: !participant.isBanned },
      select: { id: true, username: true, isBanned: true },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: updated.isBanned ? 'participant.banned' : 'participant.unbanned',
      targetType: 'participant',
      targetId: updated.id,
      metadata: { username: updated.username },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Toggle ban error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/participants/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const submissionCount = await prisma.submission.count({ where: { userId: req.params.id! } });
    if (submissionCount > 0) {
      res.status(400).json({ success: false, error: 'Cannot delete participant with existing submissions' });
      return;
    }

    await prisma.user.delete({ where: { id: req.params.id! } });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'participant.deleted',
      targetType: 'participant',
      targetId: req.params.id!,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Participant deleted' } });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Event control
router.post('/event/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.eventConfig.upsert({
      where: { key: 'is_running' },
      update: { value: true, updatedBy: req.user!.userId },
      create: { key: 'is_running', value: true, updatedBy: req.user!.userId },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'event.started',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Event started' } });
  } catch (error) {
    console.error('Start event error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/event/stop', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await prisma.eventConfig.upsert({
      where: { key: 'is_running' },
      update: { value: false, updatedBy: req.user!.userId },
      create: { key: 'is_running', value: false, updatedBy: req.user!.userId },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'event.stopped',
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Event stopped' } });
  } catch (error) {
    console.error('Stop event error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Scoreboard controls
router.patch('/scoreboard/freeze', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const config = await prisma.eventConfig.findUnique({ where: { key: 'scoreboard_frozen' } });
    const isFrozen = config?.value === true;

    await prisma.eventConfig.upsert({
      where: { key: 'scoreboard_frozen' },
      update: { value: !isFrozen, updatedBy: req.user!.userId },
      create: { key: 'scoreboard_frozen', value: true, updatedBy: req.user!.userId },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: isFrozen ? 'scoreboard.unfrozen' : 'scoreboard.frozen',
      ipAddress: req.ip,
    });

    io.to('scoreboard').emit('scoreboard:freeze', { isFrozen: !isFrozen });

    res.json({ success: true, data: { isFrozen: !isFrozen } });
  } catch (error) {
    console.error('Freeze scoreboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/scoreboard', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'PARTICIPANT', isBanned: false },
      include: {
        solves: {
          include: { challenge: { select: { title: true, points: true } } },
          orderBy: { solvedAt: 'asc' },
        },
      },
    });

    const scoreboard = users
      .filter((u) => u.solves.length > 0)
      .map((user) => ({
        userId: user.id,
        username: user.username,
        totalPoints: user.solves.reduce((sum, s) => sum + s.pointsEarned, 0),
        solvedCount: user.solves.length,
        lastSolveAt: user.solves.length > 0 ? user.solves[user.solves.length - 1]!.solvedAt.toISOString() : null,
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (a.lastSolveAt && b.lastSolveAt) return new Date(a.lastSolveAt).getTime() - new Date(b.lastSolveAt).getTime();
        return 0;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json({ success: true, data: scoreboard });
  } catch (error) {
    console.error('Admin scoreboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Config management
router.get('/config', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const configs = await prisma.eventConfig.findMany();
    const configMap: Record<string, unknown> = {};
    for (const c of configs) {
      configMap[c.key] = c.value;
    }
    res.json({ success: true, data: configMap });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.put('/config', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body as Record<string, unknown>;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.eventConfig.upsert({
        where: { key },
        update: { value: value as string | number | boolean, updatedBy: req.user!.userId },
        create: { key, value: value as string | number | boolean, updatedBy: req.user!.userId },
      });
    }

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'config.updated',
      metadata: updates,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Config updated' } });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Submissions
router.get('/submissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId, challengeId, isCorrect, page = '1', limit = '50' } = req.query;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (challengeId) where.challengeId = challengeId;
    if (isCorrect !== undefined) where.isCorrect = isCorrect === 'true';

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { username: true } },
          challenge: { select: { title: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        submissions: submissions.map((s) => ({
          id: s.id,
          username: s.user.username,
          challengeTitle: s.challenge.title,
          challengeId: s.challengeId,
          flagSubmitted: s.flagSubmitted,
          isCorrect: s.isCorrect,
          ipAddress: s.ipAddress,
          submittedAt: s.submittedAt,
        })),
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('List submissions error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Audit logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, actorId, page = '1', limit = '50' } = req.query;

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (actorId) where.actorId = actorId;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          actor: { select: { username: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs: logs.map((l) => ({
          id: l.id,
          actorUsername: l.actor.username,
          action: l.action,
          targetType: l.targetType,
          targetId: l.targetId,
          metadata: l.metadata,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt,
        })),
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/audit-logs/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { username: true } } },
    });

    const csv = [
      'Timestamp,Actor,Action,Target Type,Target ID,IP Address,Metadata',
      ...logs.map((l) =>
        [
          l.createdAt.toISOString(),
          l.actor.username,
          l.action,
          l.targetType || '',
          l.targetId || '',
          l.ipAddress || '',
          JSON.stringify(l.metadata || {}),
        ].join(','),
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Docker instances - admin view
router.get('/instances', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const instances = await prisma.dockerInstance.findMany({
      where: { status: 'RUNNING' },
      include: {
        user: { select: { username: true } },
        challenge: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: instances });
  } catch (error) {
    console.error('List instances error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/instances/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instance = await prisma.dockerInstance.findUnique({ where: { id: req.params.id! } });
    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    if (instance.containerId && !instance.containerId.startsWith('placeholder-')) {
      try {
        const { stopContainer } = await import('../../docker/instanceService');
        await stopContainer(instance.containerId);
      } catch {
        // Ignore Docker errors for admin force-stop
      }
    }

    await prisma.dockerInstance.update({
      where: { id: req.params.id! },
      data: { status: 'STOPPED' },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'instance.force_stopped',
      targetType: 'instance',
      targetId: instance.id,
      metadata: { userId: instance.userId, challengeId: instance.challengeId },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Instance force stopped' } });
  } catch (error) {
    console.error('Force stop instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// File upload
router.post('/challenges/:id/files', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id! } });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const record = await saveAttachment(
      req.params.id!,
      req.file.originalname,
      req.file.buffer,
      req.file.mimetype,
    );

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.file_uploaded',
      targetType: 'challenge',
      targetId: challenge.id,
      metadata: { filename: record.filename, fileSize: record.fileSize },
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: record });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(400).json({ success: false, error: error.message || 'File upload failed' });
  }
});

// File list
router.get('/challenges/:id/files', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await prisma.challengeFile.findMany({
      where: { challengeId: req.params.id!, fileType: 'attachment' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, filename: true, mimeType: true, fileSize: true, createdAt: true },
    });
    res.json({ success: true, data: files });
  } catch (error) {
    console.error('File list error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// File delete
router.delete('/challenges/:id/files/:fileId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await deleteFile(req.params.fileId!);

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.file_deleted',
      targetType: 'challenge',
      targetId: req.params.id!,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'File deleted' } });
  } catch (error: any) {
    console.error('File delete error:', error);
    res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// Check compose status
router.get('/challenges/:id/compose', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id! },
      select: { id: true, dockerImage: true, composeStatus: true },
    });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }
    res.json({ success: true, data: challenge });
  } catch (error) {
    console.error('Compose status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Compose upload
router.post('/challenges/:id/compose', upload.single('compose'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No compose file uploaded' });
      return;
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id! } });
    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    if (req.file.mimetype !== 'application/zip' && !req.file.originalname.endsWith('.zip')) {
      res.status(400).json({ success: false, error: 'Only ZIP files are supported for compose upload' });
      return;
    }

    const result = await extractAndBuildCompose(req.params.id!, req.file.buffer);

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.compose_uploaded',
      targetType: 'challenge',
      targetId: challenge.id,
      metadata: { imageTag: result.imageTag },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Compose upload error:', error);
    res.status(400).json({ success: false, error: error.message || 'Compose upload failed' });
  }
});

// Compose delete
router.delete('/challenges/:id/compose', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await removeCompose(req.params.id!);

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'challenge.compose_deleted',
      targetType: 'challenge',
      targetId: req.params.id!,
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Compose files removed' } });
  } catch (error) {
    console.error('Compose delete error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
