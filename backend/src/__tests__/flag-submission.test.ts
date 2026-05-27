import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from './setup';

describe('Flag Submission', () => {
  let userId: string;
  let challengeId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `flagsolver_${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'PARTICIPANT',
      },
    });
    userId = user.id;

    const challenge = await prisma.challenge.create({
      data: {
        title: 'Flag Test',
        description: 'Test flag submission',
        category: 'crypto',
        points: 100,
        flag: 'CTF_ITFAIR{secret_flag}',
        orderIndex: 1,
        isActive: true,
      },
    });
    challengeId = challenge.id;

    await prisma.eventConfig.upsert({
      where: { key: 'is_running' },
      update: { value: true },
      create: { key: 'is_running', value: true },
    });
  });

  it('Should record correct submission', async () => {
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId,
        flagSubmitted: 'CTF_ITFAIR{secret_flag}',
        isCorrect: true,
        ipAddress: '127.0.0.1',
      },
    });
    expect(submission.isCorrect).toBe(true);
  });

  it('Should record incorrect submission', async () => {
    const submission = await prisma.submission.create({
      data: {
        userId,
        challengeId,
        flagSubmitted: 'CTF_ITFAIR{wrong_flag}',
        isCorrect: false,
        ipAddress: '127.0.0.1',
      },
    });
    expect(submission.isCorrect).toBe(false);
  });

  it('Should not allow duplicate solves', async () => {
    await prisma.solve.create({
      data: { userId, challengeId, pointsEarned: 100 },
    });

    await expect(
      prisma.solve.create({
        data: { userId, challengeId, pointsEarned: 100 },
      }),
    ).rejects.toThrow();
  });
});
