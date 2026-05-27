import { Router, Response } from 'express';
import { requireAuth, requireParticipant, requireEventRunning } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import prisma from '../lib/prisma';
import { createContainer, stopContainer } from '../docker/instanceService';
import { createAuditLog } from '../services/audit';

const router = Router();

router.get('/status', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.query;

    if (!challengeId) {
      res.status(400).json({ success: false, error: 'challengeId is required' });
      return;
    }

    const instance = await prisma.dockerInstance.findFirst({
      where: {
        userId: req.user!.userId,
        challengeId: challengeId as string,
        status: 'RUNNING',
      },
    });

    if (!instance) {
      res.json({ success: true, data: { hasInstance: false } });
      return;
    }

    const timeRemaining = Math.max(0, Math.floor((instance.expiresAt.getTime() - Date.now()) / 1000));

    res.json({
      success: true,
      data: {
        hasInstance: true,
        instance: {
          id: instance.id,
          url: `http://${process.env.DOMAIN || 'localhost'}:${instance.assignedPort}`,
          expiresAt: instance.expiresAt,
          status: instance.status,
          timeRemaining,
          port: instance.assignedPort,
        },
      },
    });
  } catch (error) {
    console.error('Instance status error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/generate', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      res.status(400).json({ success: false, error: 'challengeId is required' });
      return;
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    if (challenge.category !== 'web' || !challenge.dockerImage) {
      res.status(400).json({ success: false, error: 'This challenge does not support Docker instances' });
      return;
    }

    // Check max instances per user
    const maxInstancesConfig = await prisma.eventConfig.findUnique({ where: { key: 'max_instances_per_user' } });
    const maxInstances = (maxInstancesConfig?.value as number) || 3;

    const runningInstances = await prisma.dockerInstance.count({
      where: { userId: req.user!.userId, status: 'RUNNING' },
    });

    if (runningInstances >= maxInstances) {
      res.status(400).json({ success: false, error: 'Maximum number of running instances reached' });
      return;
    }

    const portRangeStart = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_START || '10000', 10);
    const portRangeEnd = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_END || '20000', 10);

    // Find an available port
    const usedPorts = (await prisma.dockerInstance.findMany({
      where: { status: 'RUNNING' },
      select: { assignedPort: true },
    })).map((i) => i.assignedPort);

    let assignedPort = portRangeStart;
    for (let port = portRangeStart; port <= portRangeEnd; port++) {
      if (!usedPorts.includes(port)) {
        assignedPort = port;
        break;
      }
    }

    const ttlConfig = await prisma.eventConfig.findUnique({ where: { key: 'instance_ttl_seconds' } });
    const ttlSeconds = (ttlConfig?.value as number) || 3600;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // Try to create Docker container, fall back to DB-only if Docker unavailable
    let containerId = `placeholder-${Date.now()}`;
    try {
      containerId = await createContainer(req.user!.userId, challengeId, challenge.dockerImage, assignedPort, ttlSeconds);
    } catch (dockerError) {
      console.warn('Docker not available, running in DB-only mode:', dockerError);
    }

    const instance = await prisma.dockerInstance.create({
      data: {
        userId: req.user!.userId,
        challengeId,
        containerId,
        assignedPort,
        status: 'RUNNING',
        expiresAt,
      },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'instance.created',
      targetType: 'instance',
      targetId: instance.id,
      metadata: { challengeId, port: assignedPort, containerId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        id: instance.id,
        status: 'RUNNING',
        url: `http://${process.env.DOMAIN || 'localhost'}:${assignedPort}`,
        expiresAt: instance.expiresAt,
        timeRemaining: ttlSeconds,
        port: assignedPort,
      },
    });
  } catch (error) {
    console.error('Generate instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/restart', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      res.status(400).json({ success: false, error: 'challengeId is required' });
      return;
    }

    // Stop existing instances for this challenge
    await prisma.dockerInstance.updateMany({
      where: {
        userId: req.user!.userId,
        challengeId,
        status: 'RUNNING',
      },
      data: { status: 'STOPPED' },
    });

    // Generate new instance
    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    if (challenge.category !== 'web' || !challenge.dockerImage) {
      res.status(400).json({ success: false, error: 'This challenge does not support Docker instances' });
      return;
    }

    const portRangeStart = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_START || '10000', 10);
    const portRangeEnd = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_END || '20000', 10);

    const usedPorts = (await prisma.dockerInstance.findMany({
      where: { status: 'RUNNING' },
      select: { assignedPort: true },
    })).map((i) => i.assignedPort);

    let assignedPort = portRangeStart;
    for (let port = portRangeStart; port <= portRangeEnd; port++) {
      if (!usedPorts.includes(port)) {
        assignedPort = port;
        break;
      }
    }

    const ttlConfig = await prisma.eventConfig.findUnique({ where: { key: 'instance_ttl_seconds' } });
    const ttlSeconds = (ttlConfig?.value as number) || 3600;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    let containerId = `placeholder-${Date.now()}`;
    try {
      containerId = await createContainer(req.user!.userId, challengeId, challenge.dockerImage, assignedPort, ttlSeconds);
    } catch (dockerError) {
      console.warn('Docker not available, running in DB-only mode:', dockerError);
    }

    const instance = await prisma.dockerInstance.create({
      data: {
        userId: req.user!.userId,
        challengeId,
        containerId,
        assignedPort,
        status: 'RUNNING',
        expiresAt,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        instanceId: instance.id,
        url: `http://${process.env.DOMAIN || 'localhost'}:${assignedPort}`,
        expiresAt: instance.expiresAt,
        timeRemaining: ttlSeconds,
        port: assignedPort,
      },
    });
  } catch (error) {
    console.error('Restart instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/:id/stop', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instance = await prisma.dockerInstance.findUnique({
      where: { id: req.params.id },
    });

    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    if (instance.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not your instance' });
      return;
    }

    if (instance.status !== 'RUNNING') {
      res.status(400).json({ success: false, error: 'Instance is not running' });
      return;
    }

    // Stop and remove Docker container
    if (instance.containerId && !instance.containerId.startsWith('placeholder-')) {
      await stopContainer(instance.containerId);
    }

    await prisma.dockerInstance.update({
      where: { id: req.params.id },
      data: { status: 'STOPPED' },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'instance.stopped',
      targetType: 'instance',
      targetId: instance.id,
      metadata: { challengeId: instance.challengeId },
      ipAddress: req.ip,
    });

    res.json({ success: true, data: { message: 'Instance stopped' } });
  } catch (error) {
    console.error('Stop instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.post('/recreate', requireAuth, requireParticipant, requireEventRunning, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challengeId } = req.body;

    if (!challengeId) {
      res.status(400).json({ success: false, error: 'challengeId is required' });
      return;
    }

    const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge || !challenge.isActive) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    if (challenge.category !== 'web' || !challenge.dockerImage) {
      res.status(400).json({ success: false, error: 'This challenge does not support Docker instances' });
      return;
    }

    // Stop existing running instance for this user+challenge
    const existingInstance = await prisma.dockerInstance.findFirst({
      where: {
        userId: req.user!.userId,
        challengeId,
        status: 'RUNNING',
      },
    });

    if (existingInstance) {
      if (existingInstance.containerId && !existingInstance.containerId.startsWith('placeholder-')) {
        await stopContainer(existingInstance.containerId);
      }
      await prisma.dockerInstance.update({
        where: { id: existingInstance.id },
        data: { status: 'STOPPED' },
      });
    }

    // Check max instances per user
    const maxInstancesConfig = await prisma.eventConfig.findUnique({ where: { key: 'max_instances_per_user' } });
    const maxInstances = (maxInstancesConfig?.value as number) || 3;

    const runningInstances = await prisma.dockerInstance.count({
      where: { userId: req.user!.userId, status: 'RUNNING' },
    });

    if (runningInstances >= maxInstances) {
      res.status(400).json({ success: false, error: 'Maximum number of running instances reached' });
      return;
    }

    // Find available port
    const portRangeStart = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_START || '10000', 10);
    const portRangeEnd = parseInt(process.env.DOCKER_INSTANCE_PORT_RANGE_END || '20000', 10);

    const usedPorts = (await prisma.dockerInstance.findMany({
      where: { status: 'RUNNING' },
      select: { assignedPort: true },
    })).map((i) => i.assignedPort);

    let assignedPort = portRangeStart;
    for (let port = portRangeStart; port <= portRangeEnd; port++) {
      if (!usedPorts.includes(port)) {
        assignedPort = port;
        break;
      }
    }

    const ttlConfig = await prisma.eventConfig.findUnique({ where: { key: 'instance_ttl_seconds' } });
    const ttlSeconds = (ttlConfig?.value as number) || 3600;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    let containerId = `placeholder-${Date.now()}`;
    try {
      containerId = await createContainer(req.user!.userId, challengeId, challenge.dockerImage, assignedPort, ttlSeconds);
    } catch (dockerError) {
      console.warn('Docker not available, running in DB-only mode:', dockerError);
    }

    const instance = await prisma.dockerInstance.create({
      data: {
        userId: req.user!.userId,
        challengeId,
        containerId,
        assignedPort,
        status: 'RUNNING',
        expiresAt,
      },
    });

    await createAuditLog({
      actorId: req.user!.userId,
      action: 'instance.recreated',
      targetType: 'instance',
      targetId: instance.id,
      metadata: { challengeId, port: assignedPort, containerId },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: {
        id: instance.id,
        status: 'RUNNING',
        url: `http://${process.env.DOMAIN || 'localhost'}:${assignedPort}`,
        expiresAt: instance.expiresAt,
        timeRemaining: ttlSeconds,
        port: assignedPort,
      },
    });
  } catch (error) {
    console.error('Recreate instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

router.delete('/:id', requireAuth, requireParticipant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const instance = await prisma.dockerInstance.findUnique({
      where: { id: req.params.id },
    });

    if (!instance) {
      res.status(404).json({ success: false, error: 'Instance not found' });
      return;
    }

    if (instance.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: 'Not your instance' });
      return;
    }

    if (instance.containerId && !instance.containerId.startsWith('placeholder-')) {
      await stopContainer(instance.containerId);
    }

    await prisma.dockerInstance.update({
      where: { id: req.params.id },
      data: { status: 'STOPPED' },
    });

    res.json({ success: true, data: { message: 'Instance stopped' } });
  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
