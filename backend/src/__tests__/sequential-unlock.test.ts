import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from './setup';

describe('Sequential Unlock', () => {
  let userId: string;
  let challenge1Id: string;
  let challenge2Id: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        username: `testuser_${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'PARTICIPANT',
      },
    });
    userId = user.id;

    // Create two sequential challenges
    const c1 = await prisma.challenge.create({
      data: {
        title: 'Challenge 1',
        description: 'First challenge',
        category: 'crypto',
        points: 100,
        flag: 'CTF_ITFAIR{test1}',
        orderIndex: 1,
        isActive: true,
      },
    });
    challenge1Id = c1.id;

    const c2 = await prisma.challenge.create({
      data: {
        title: 'Challenge 2',
        description: 'Second challenge (locked)',
        category: 'crypto',
        points: 200,
        flag: 'CTF_ITFAIR{test2}',
        orderIndex: 2,
        isActive: true,
      },
    });
    challenge2Id = c2.id;
  });

  it('Challenge 1 should be unlocked (first challenge)', async () => {
    const challenge = await prisma.challenge.findUnique({ where: { id: challenge1Id } });
    expect(challenge).toBeDefined();
    expect(challenge!.orderIndex).toBe(1);
  });

  it('Challenge 2 should be locked before solving Challenge 1', async () => {
    const solvedC1 = await prisma.solve.findUnique({
      where: { userId_challengeId: { userId, challengeId: challenge1Id } },
    });
    expect(solvedC1).toBeNull();
  });

  it('After solving Challenge 1, Challenge 2 becomes unlocked', async () => {
    await prisma.solve.create({
      data: {
        userId,
        challengeId: challenge1Id,
        pointsEarned: 100,
      },
    });

    const prevChallenge = await prisma.challenge.findFirst({
      where: { orderIndex: 1 },
    });

    const prevSolved = await prisma.solve.findUnique({
      where: { userId_challengeId: { userId, challengeId: prevChallenge!.id } },
    });

    expect(prevSolved).toBeDefined();
  });

  it('Cannot solve Challenge 2 without solving Challenge 1 first', async () => {
    // Delete the solve to test lock
    await prisma.solve.delete({
      where: { userId_challengeId: { userId, challengeId: challenge1Id } },
    });

    const prevChallenge = await prisma.challenge.findFirst({
      where: { orderIndex: 1 },
    });

    const prevSolved = await prisma.solve.findUnique({
      where: { userId_challengeId: { userId, challengeId: prevChallenge!.id } },
    });

    expect(prevSolved).toBeNull();
  });
});
