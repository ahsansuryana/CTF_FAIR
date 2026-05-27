import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import prisma from '../lib/prisma';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, '../../uploads');
const ATTACHMENTS_DIR = join(UPLOAD_DIR, 'attachments');
const COMPOSE_DIR = join(UPLOAD_DIR, 'compose');

const ALLOWED_ATTACHMENT_EXT = new Set(['.pdf', '.zip', '.tar.gz', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.7z', '.rar', '.csv', '.json', '.py', '.js', '.php', '.html', '.css', '.pcap', '.pcapng', '.bin', '.raw']);
const ALLOWED_ATTACHMENT_MIME = [
  'application/pdf', 'application/zip', 'application/x-tar', 'application/gzip',
  'text/plain', 'image/png', 'image/jpeg', 'image/gif',
  'application/x-7z-compressed', 'application/vnd.rar',
  'text/csv', 'application/json', 'text/x-python', 'application/javascript',
  'text/x-php', 'text/html', 'text/css', 'application/vnd.tcpdump.pcap',
  'application/octet-stream',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(name: string): string {
  const safe = basename(name).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return safe || 'unnamed';
}

function isAllowedExtension(filename: string): boolean {
  const ext = extname(filename).toLowerCase();
  if (ext === '.gz' && filename.endsWith('.tar.gz')) return true;
  if (ext === '.tar' && !filename.endsWith('.tar.gz')) return false;
  return ALLOWED_ATTACHMENT_EXT.has(ext);
}

function isAllowedMime(mime: string): boolean {
  return ALLOWED_ATTACHMENT_MIME.some((allowed) => mime.startsWith(allowed));
}

function getStoragePath(fileType: string, challengeId: string, ext: string): string {
  const baseDir = fileType === 'compose' ? COMPOSE_DIR : ATTACHMENTS_DIR;
  const challengeDir = join(baseDir, challengeId);
  ensureDir(challengeDir);
  const uuid = randomUUID();
  return join(challengeDir, `${uuid}${ext}`);
}

export async function saveAttachment(
  challengeId: string,
  originalFilename: string,
  buffer: Buffer,
  mimeType: string,
): Promise<{
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  storedPath: string;
}> {
  if (!isAllowedExtension(originalFilename)) {
    throw new Error(`File type ${extname(originalFilename)} is not allowed`);
  }
  if (!isAllowedMime(mimeType)) {
    throw new Error(`MIME type ${mimeType} is not allowed`);
  }
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const safeName = sanitizeFilename(originalFilename);
  const ext = extname(originalFilename).toLowerCase();
  const storedPath = getStoragePath('attachment', challengeId, ext);

  await writeFile(storedPath, buffer);

  const record = await prisma.challengeFile.create({
    data: {
      challengeId,
      filename: safeName,
      storedPath,
      mimeType,
      fileSize: buffer.length,
      fileType: 'attachment',
    },
  });

  return record;
}

export async function deleteFile(fileId: string): Promise<void> {
  const record = await prisma.challengeFile.findUnique({ where: { id: fileId } });
  if (!record) throw new Error('File not found');

  try {
    if (existsSync(record.storedPath)) unlinkSync(record.storedPath);
  } catch { }

  await prisma.challengeFile.delete({ where: { id: fileId } });
}

export async function getFileBuffer(fileId: string): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  fileSize: number;
}> {
  const record = await prisma.challengeFile.findUnique({ where: { id: fileId } });
  if (!record) throw new Error('File not found');

  if (!existsSync(record.storedPath)) throw new Error('File not found on disk');

  const buffer = await readFile(record.storedPath);
  return { buffer, filename: record.filename, mimeType: record.mimeType, fileSize: record.fileSize };
}

export function getChallengeComposeDir(challengeId: string): string {
  return join(COMPOSE_DIR, challengeId);
}

export function getChallengeUploadDir(challengeId: string): string {
  return join(ATTACHMENTS_DIR, challengeId);
}

export { UPLOAD_DIR, ATTACHMENTS_DIR, COMPOSE_DIR, MAX_FILE_SIZE, ALLOWED_ATTACHMENT_EXT };
