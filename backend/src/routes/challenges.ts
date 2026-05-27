import { Router, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { requireAuth, requireParticipant, requireEventRunning } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { AuthenticatedRequest } from '../types';
import { createAuditLog } from '../services/audit';
import { z } from 'zod';
import { io } from '../index';

const router = Router();

const submitSchema = z.object({
  flag: z.string().min(1, 'Flag is required'),
});

const flagSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => `${(req as AuthenticatedRequest).user!.userId}:${req.params.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Please wait.' },
});

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

async function checkUnlock(userId: string, challengeId: string): Promise<{ unlocked: boolean; locked: boolean; solved: boolean }> {
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) {
    return { unlocked: false, locked: false, solved: false };
  }

  if (challenge.orderIndex === 1) {
    const solved = await prisma.solve.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    return { unlocked: !solved, locked: false, solved: !!solved };
  }

  const prevChallenge = await prisma.challenge.findFirst({
    where: { orderIndex: challenge.orderIndex - 1 },
  });

  if (!prevChallenge) {
    const solved = await prisma.solve.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    return { unlocked: !solved, locked: false, solved: !!solved };
  }

  const prevSolved = await prisma.solve.findUnique({
    where: { userId_challengeId: { userId: userId, challengeId: prevChallenge.id } },
  });

  const solved = await prisma.solve.findUnique({
    where: { userId_challengeId: { userId, challengeId } },
  });

  if (solved) {
    return { unlocked: false, locked: false, solved: true };
  }

  if (prevSolved) {
    return { unlocked: true, locked: false, solved: false };
  }

  return { unlocked: false, locked: true, solved: false };
}

router.get('/', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        hints: { select: { id: true } },
      },
    });

    const challengesWithStatus = await Promise.all(
      challenges.map(async (challenge) => {
        const status = await checkUnlock(req.user!.userId, challenge.id);
        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          points: challenge.points,
          orderIndex: challenge.orderIndex,
          isSolved: status.solved,
          isLocked: status.locked,
          isUnlocked: status.unlocked,
          hintCount: challenge.hints.length,
          dockerImage: challenge.dockerImage,
          attachmentUrl: challenge.attachmentUrl,
        };
      }),
    );

    res.json({ success: true, data: challengesWithStatus });
  } catch (error) {
    console.error('List challenges error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.get('/:id', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        hints: { orderBy: { orderIndex: 'asc' }, select: { id: true, content: true, orderIndex: true } },
        files: { where: { fileType: 'attachment' }, select: { id: true, filename: true, mimeType: true, fileSize: true, createdAt: true } },
      },
    });

    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const status = await checkUnlock(req.user!.userId, challenge.id);

    if (status.locked) {
      res.status(403).json({ success: false, error: 'Selesaikan soal sebelumnya terlebih dahulu' });
      return;
    }

    const solved = status.solved ? await prisma.solve.findUnique({
      where: { userId_challengeId: { userId: req.user!.userId, challengeId: challenge.id } },
    }) : null;

    res.json({
      success: true,
      data: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        points: challenge.points,
        orderIndex: challenge.orderIndex,
        isSolved: status.solved,
        isUnlocked: status.unlocked,
        hints: challenge.hints,
        files: challenge.files,
        solvedAt: solved?.solvedAt || null,
        dockerImage: challenge.dockerImage,
        attachmentUrl: challenge.attachmentUrl,
      },
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:id/submit', requireAuth, requireParticipant, requireEventRunning, flagSubmitLimiter, validate(submitSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const challengeId = req.params.id!;
    const { flag } = req.body;

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const status = await checkUnlock(userId, challengeId);
    if (status.locked) {
      res.status(403).json({ success: false, error: 'Selesaikan soal sebelumnya terlebih dahulu' });
      return;
    }

    if (status.solved) {
      res.json({
        success: true,
        data: { correct: true, alreadySolved: true, message: 'Kamu sudah menyelesaikan soal ini!' },
      });
      return;
    }

    const normalizedFlag = flag.trim();
    const isCorrect = timingSafeEqual(normalizedFlag, challenge.flag);

    await prisma.submission.create({
      data: {
        userId,
        challengeId,
        flagSubmitted: normalizedFlag,
        isCorrect,
        ipAddress: req.ip,
      },
    });

    if (isCorrect) {
      await prisma.solve.create({
        data: {
          userId,
          challengeId,
          pointsEarned: challenge.points,
        },
      });

      // Emit scoreboard update via Socket.io
      const scoreboard = await getScoreboard();
      io.to('scoreboard').emit('scoreboard:update', scoreboard);

      res.json({
        success: true,
        data: { correct: true, points: challenge.points, message: `Flag benar! +${challenge.points} poin` },
      });
    } else {
      res.json({
        success: true,
        data: { correct: false, message: 'Flag salah, coba lagi!' },
      });
    }
  } catch (error) {
    console.error('Submit flag error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

async function getScoreboard() {
  const users = await prisma.user.findMany({
    where: { role: 'PARTICIPANT', isBanned: false },
    include: {
      solves: {
        include: { challenge: true },
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

  return scoreboard;
}

// Hint endpoint
router.get('/:id/hints', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const challengeId = req.params.id!;
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const status = await checkUnlock(req.user!.userId, challengeId);
    if (status.locked) {
      res.status(403).json({ success: false, error: 'Selesaikan soal sebelumnya terlebih dahulu' });
      return;
    }

    const hints = await prisma.hint.findMany({
      where: { challengeId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, content: true, orderIndex: true },
    });

    res.json({ success: true, data: hints });
  } catch (error) {
    console.error('Get hints error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
