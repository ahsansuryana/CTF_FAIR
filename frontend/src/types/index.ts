export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'PARTICIPANT';
}

export interface AuthResponse {
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
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

export interface Hint {
  id: string;
  content: string;
  orderIndex: number;
}

export interface ChallengeFile {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface ChallengeDetail extends ChallengeStatus {
  hints: Hint[];
  files?: ChallengeFile[];
  solvedAt: string | null;
}

export interface ScoreboardEntry {
  rank: number;
  userId: string;
  username: string;
  totalPoints: number;
  solvedCount: number;
  lastSolveAt: string | null;
  solves?: {
    challengeId: string;
    challengeTitle: string;
    points: number;
    solvedAt: string;
  }[];
}

export interface EventInfo {
  name: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  isRunning: boolean;
}

export interface AdminStats {
  totalParticipants: number;
  totalSolves: number;
  totalChallenges: number;
  topChallenges: { title: string; solveCount: number }[];
  recentSubmissions: {
    id: string;
    username: string;
    challengeTitle: string;
    isCorrect: boolean;
    submittedAt: string;
    ipAddress: string | null;
  }[];
  eventStatus: {
    isRunning: boolean;
    isFrozen: boolean;
    name: string;
    startTime: string | null;
    endTime: string | null;
  };
}

export interface DockerInstanceStatus {
  hasInstance: boolean;
  instance?: {
    id: string;
    url: string;
    expiresAt: string;
    status: string;
    timeRemaining: number;
    port: number;
  };
}
