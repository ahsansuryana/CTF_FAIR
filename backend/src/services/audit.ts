import prisma from '../lib/prisma';

interface AuditLogInput {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        metadata: input.metadata as never,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch {
    console.warn('Failed to create audit log:', input.action);
  }
}
