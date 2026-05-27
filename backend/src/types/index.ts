import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ScoreboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  solvedCount: number;
  lastSolveAt: string | null;
}

export interface ChallengeStatus {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  orderIndex: number;
  isSolved: boolean;
  isLocked: boolean;
  isUnlocked: boolean;
  hintCount: number;
  dockerImage: string | null;
  attachmentUrl: string | null;
}
