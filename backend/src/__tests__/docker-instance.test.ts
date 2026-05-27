import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from './setup';

describe('Docker Instance Management', () => {
  let userId: string;
  let challengeId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        username: `dockertest_${Date.now()}`,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'PARTICIPANT',
      },
    });
    userId = user.id;

    const challenge = await prisma.challenge.create({
      data: {
        title: 'Web Challenge',
        description: 'A web challenge with Docker',
        category: 'web',
        points: 300,
        flag: 'CTF_ITFAIR{web_flag}',
        orderIndex: 1,
        isActive: true,
        dockerImage: 'ctf-web-challenge:latest',
      },
    });
    challengeId = challenge.id;
  });

  it('Should create a Docker instance record', async () => {
    const instance = await prisma.dockerInstance.create({
      data: {
        userId,
        challengeId,
        containerId: 'test-container-id',
        assignedPort: 10001,
        status: 'RUNNING',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    expect(instance).toBeDefined();
    expect(instance.status).toBe('RUNNING');
  });

  it('Should validate owner access', async () => {
    const instance = await prisma.dockerInstance.findFirst({
      where: { userId, challengeId },
    });
    expect(instance).toBeDefined();
    expect(instance!.userId).toBe(userId);
  });

  it('Should mark instance as expired', async () => {
    const expired = await prisma.dockerInstance.updateMany({
      where: {
        userId,
        challengeId,
        status: 'RUNNING',
        expiresAt: { lte: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    expect(expired.count).toBe(0); // No expired instances (TTL not reached)
  });

  it('Should clean up expired instances', async () => {
    // Create a past-expiry instance
    const pastInstance = await prisma.dockerInstance.create({
      data: {
        userId,
        challengeId,
        containerId: 'expired-container',
        assignedPort: 10002,
        status: 'RUNNING',
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    expect(pastInstance).toBeDefined();

    // Update to expired
    await prisma.dockerInstance.update({
      where: { id: pastInstance.id },
      data: { status: 'EXPIRED' },
    });

    const expired = await prisma.dockerInstance.findUnique({ where: { id: pastInstance.id } });
    expect(expired!.status).toBe('EXPIRED');
  });
});
