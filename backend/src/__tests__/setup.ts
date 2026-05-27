import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Push schema to test database
  execSync('npx prisma db push --force-reset', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://ctffair:changeme@localhost:5432/ctffair_test' },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
