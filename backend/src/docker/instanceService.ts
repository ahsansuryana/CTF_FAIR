import Docker from 'dockerode';
import prisma from '../lib/prisma';

const docker = new Docker();

const MEMORY_LIMIT = 128 * 1024 * 1024;
const MEMORY_SWAP = 256 * 1024 * 1024;
const CPU_QUOTA = 50000;
const PIDS_LIMIT = 50;
const NETWORK_NAME = process.env.DOCKER_NETWORK || 'ctf-challenges-net';

export async function createContainer(
  userId: string,
  challengeId: string,
  imageName: string,
  assignedPort: number,
  ttlSeconds: number,
): Promise<string> {
  const container = await docker.createContainer({
    Image: imageName,
    Tty: true,
    HostConfig: {
      PortBindings: { '80/tcp': [{ HostPort: String(assignedPort) }] },
      NetworkMode: NETWORK_NAME,
      Memory: MEMORY_LIMIT,
      MemorySwap: MEMORY_SWAP,
      CpuQuota: CPU_QUOTA,
      PidsLimit: PIDS_LIMIT,
      Privileged: false,
      ReadonlyRootfs: false,
      CapDrop: ['ALL'],
      CapAdd: [],
      AutoRemove: false,
      RestartPolicy: { Name: 'no' },
    },
    NetworkingConfig: {
      EndpointsConfig: {
        [NETWORK_NAME]: {},
      },
    },
  });

  await container.start();

  const containerId = container.id;

  // Update DB with real container ID
  await prisma.dockerInstance.updateMany({
    where: { userId, challengeId, status: 'RUNNING' },
    data: { containerId },
  });

  return containerId;
}

export async function stopContainer(containerId: string): Promise<void> {
  try {
    const container = docker.getContainer(containerId);
    await container.stop({ t: 5 });
    await container.remove({ v: true, force: true });
  } catch (error) {
    console.error(`Failed to stop container ${containerId}:`, error);
  }
}

export async function cleanupExpiredInstances(): Promise<void> {
  const expired = await prisma.dockerInstance.findMany({
    where: {
      status: 'RUNNING',
      expiresAt: { lte: new Date() },
    },
  });

  for (const instance of expired) {
    if (instance.containerId && !instance.containerId.startsWith('placeholder-')) {
      await stopContainer(instance.containerId);
    }
    await prisma.dockerInstance.update({
      where: { id: instance.id },
      data: { status: 'EXPIRED' },
    });
  }

  // Also cleanup orphaned instances (status running but container gone)
  const allRunning = await prisma.dockerInstance.findMany({
    where: { status: 'RUNNING' },
  });

  for (const instance of allRunning) {
    if (instance.containerId && !instance.containerId.startsWith('placeholder-')) {
      try {
        const container = docker.getContainer(instance.containerId);
        await container.inspect();
      } catch {
        await prisma.dockerInstance.update({
          where: { id: instance.id },
          data: { status: 'EXPIRED' },
        });
      }
    }
  }
}

// Run cleanup every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

export function startCleanupInterval(): void {
  cleanupInterval = setInterval(cleanupExpiredInstances, 60 * 1000);
}

export function stopCleanupInterval(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
