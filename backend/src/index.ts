import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import setupRoutes from './routes/setup';
import challengeRoutes from './routes/challenges';
import scoreboardRoutes from './routes/scoreboard';
import eventRoutes from './routes/event';
import instanceRoutes from './routes/instances';
import adminRoutes from './routes/admin';
import fileRoutes from './routes/files';

export const prisma = new PrismaClient();

const app = express();
const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Trust nginx proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Setup check middleware - block non-setup routes if setup not done
app.use('/api', async (req, res, next) => {
  if (req.path.startsWith('/setup') || req.path === '/health') {
    next();
    return;
  }

  try {
    const appConfig = await prisma.appConfig.findFirst();
    if (!appConfig?.isSetupDone) {
      res.status(503).json({ success: false, error: 'Setup belum selesai', needsSetup: true });
      return;
    }
  } catch {
    // DB might not be ready yet
  }

  next();
});

// Start Docker cleanup interval
import { startCleanupInterval } from './docker/instanceService';
startCleanupInterval();

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/setup', setupRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/scoreboard', scoreboardRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

// Error handler
app.use(errorHandler);

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split(';').find((c: string) => c.trim().startsWith('token='))?.split('=')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret', { issuer: 'ctf-fair', audience: 'ctf-fair-api' });
      (socket as any).user = decoded;
    } catch {
      // Allow connection without auth (scoreboard is public)
    }
  }
  next();
});

// Socket.io handling
io.on('connection', (socket) => {
  socket.join('scoreboard');

  socket.on('disconnect', () => {
    socket.leave('scoreboard');
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close();
  process.exit(0);
});

const PORT = parseInt(process.env.PORT || '3001', 10);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
