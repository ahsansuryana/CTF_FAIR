import { Router, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/', async (_req, res: Response) => {
  try {
    const config = await prisma.eventConfig.findUnique({ where: { key: 'is_running' } });
    const isRunning = config?.value === true;

    if (!isRunning) {
      res.json({ success: true, data: [] });
      return;
    }

    const frozenConfig = await prisma.eventConfig.findUnique({ where: { key: 'scoreboard_frozen' } });
    const isFrozen = frozenConfig?.value === true;

    const users = await prisma.user.findMany({
      where: { role: 'PARTICIPANT', isBanned: false },
      include: {
        solves: {
          include: { challenge: { select: { title: true, points: true, category: true } } },
          orderBy: { solvedAt: 'asc' },
        },
      },
    });

    const scoreboard = users
      .filter((u) => u.solves.length > 0)
      .map((user) => ({
        rank: 0,
        userId: user.id,
        username: user.username,
        totalPoints: user.solves.reduce((sum, s) => sum + s.pointsEarned, 0),
        solvedCount: user.solves.length,
        lastSolveAt: user.solves.length > 0 ? user.solves[user.solves.length - 1]!.solvedAt.toISOString() : null,
        solves: user.solves.map((s) => ({
          challengeId: s.challengeId,
          challengeTitle: s.challenge.title,
          points: s.pointsEarned,
          solvedAt: s.solvedAt.toISOString(),
        })),
      }))
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (a.lastSolveAt && b.lastSolveAt) return new Date(a.lastSolveAt).getTime() - new Date(b.lastSolveAt).getTime();
        return 0;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    res.json({ success: true, data: { scoreboard, isFrozen } });
  } catch (error) {
    console.error('Scoreboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
