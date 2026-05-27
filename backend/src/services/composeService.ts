import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join, normalize, basename } from 'path';
import AdmZip from 'adm-zip';
import Docker from 'dockerode';
import archiver from 'archiver';
import { Readable } from 'stream';

import prisma from '../lib/prisma';
import { COMPOSE_DIR } from './fileService';

const docker = new Docker();

function packDirToTarStream(dirPath: string): Readable {
  const archive = archiver('tar', { gzip: false });
  archive.directory(dirPath, false);
  archive.finalize();
  return archive;
}

async function buildFromDockerfile(contextDir: string, imageTag: string): Promise<void> {
  const dockerfilePath = join(contextDir, 'Dockerfile');
  if (!existsSync(dockerfilePath)) {
    throw new Error('No Dockerfile found in the uploaded project');
  }

  const tarStream = packDirToTarStream(contextDir);

  const stream = await docker.buildImage(tarStream, {
    t: imageTag,
    dockerfile: 'Dockerfile',
    forcerm: true,
  });

  await new Promise<void>((resolve, reject) => {
    docker.modem.followProgress(stream, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function extractAndBuildCompose(
  challengeId: string,
  zipBuffer: Buffer,
): Promise<{ imageTag: string; composeDir: string }> {
  const composeDir = join(COMPOSE_DIR, challengeId);

  if (existsSync(composeDir)) {
    rmSync(composeDir, { recursive: true, force: true });
  }
  mkdirSync(composeDir, { recursive: true });

  // Extract ZIP with ZipSlip protection
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  let hasDockerfile = false;

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;

    const entryPath = normalize(entry.entryName.replace(/\\/g, '/'));
    const resolved = normalize(join(composeDir, entryPath));

    if (!resolved.startsWith(composeDir)) {
      throw new Error(`Invalid ZIP entry: ${entry.entryName}`);
    }

    const parentDir = resolved.slice(0, resolved.lastIndexOf('\\'));
    if (parentDir && !existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    const content = entry.getData();
    require('fs').writeFileSync(resolved, content);

    if (basename(entryPath).toLowerCase() === 'dockerfile') {
      hasDockerfile = true;
    }
  }

  if (!hasDockerfile) {
    throw new Error('ZIP must contain a Dockerfile');
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: { composeStatus: 'building' },
  });

  const imageTag = `challenge-${challengeId.replace(/-/g, '')}:latest`;

  try {
    await buildFromDockerfile(composeDir, imageTag);

    await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        dockerImage: imageTag,
        composeStatus: 'ready',
      },
    });

    return { imageTag, composeDir };
  } catch (error: any) {
    await prisma.challenge.update({
      where: { id: challengeId },
      data: { composeStatus: 'error' },
    });
    throw new Error(`Build failed: ${error.message || 'Unknown error'}`);
  }
}

export async function removeCompose(challengeId: string): Promise<void> {
  const composeDir = join(COMPOSE_DIR, challengeId);
  if (existsSync(composeDir)) {
    rmSync(composeDir, { recursive: true, force: true });
  }

  await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      dockerImage: null,
      composeStatus: 'none',
    },
  });
}
