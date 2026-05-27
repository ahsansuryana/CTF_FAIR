# CTF FAIR

Self-hosted, open-source **Capture The Flag** platform for cybersecurity competitions. Deploy your own CTF event with a single command.

## Features

- **Challenge System** — 5 categories (Web, Crypto, Forensics, Stegano, OSINT) with sequential unlock
- **Docker Integration** — Per-participant isolated containers for Web challenges with auto-cleanup (TTL)
- **Real-time Scoreboard** — WebSocket-powered live rankings, publicly accessible
- **Admin Dashboard** — Full CRUD for challenges, participants, event settings
- **Flag Validation** — Case-sensitive, timing-safe comparison, rate-limited
- **Setup Wizard** — 3-step initial configuration on first deploy
- **Audit Logging** — All actions logged with IP and timestamp
- **Security** — JWT httpOnly cookies, bcrypt(12), Helmet, rate limiting, Docker isolation
- **Dark Theme** — Refined dark UI inspired by claude.ai

## Quick Start

```bash
git clone <repo-url> ctf-fair
cd ctf-fair
cp .env.example .env    # edit secrets
docker compose up -d
```

Access `https://yourdomain.com` and complete the **Setup Wizard** to create your first event.

## Prerequisites

- Docker Engine 24+ & Docker Compose v2+
- 2 vCPU, 2 GB RAM, 20 GB storage
- Domain name with DNS (for HTTPS via Let's Encrypt)

## Architecture

```
Nginx (HTTPS) → React Static / Express API + Socket.io
                     ↓
              PostgreSQL ← → Docker Daemon (dockerode)
```

| Service | Role |
|---------|------|
| **nginx** | Reverse proxy, HTTPS termination, WebSocket proxy, rate limiting |
| **frontend** | React 18 + Vite, TailwindCSS, Framer Motion |
| **backend** | Express.js + Prisma + Socket.io + Dockerode |
| **postgres** | PostgreSQL 16, persistent volume |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | (required) | Refresh token secret |
| `JWT_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `POSTGRES_USER` | `ctffair` | Database user |
| `POSTGRES_PASSWORD` | `changeme` | Database password |
| `DOMAIN` | `localhost` | Domain for SSL |
| `DOCKER_NETWORK` | `ctf-challenges-net` | Docker network for challenge containers |
| `DOCKER_INSTANCE_DEFAULT_TTL` | `3600` | Default container TTL in seconds |
| `DOCKER_INSTANCE_PORT_RANGE_START` | `10000` | Start of exposed port range |
| `DOCKER_INSTANCE_PORT_RANGE_END` | `20000` | End of exposed port range |

## Development

```bash
docker compose -f docker-compose.dev.yml up -d
```

- Frontend: `http://localhost:5173` (hot reload)
- Backend: `http://localhost:3001` (hot reload via tsx watch)
- Database: `postgresql://ctffair:changeme@localhost:5432/ctffair`

## Challenge Docker Images

For Web challenges, upload a **ZIP file** containing a `Dockerfile`:

```
challenge-web.zip
├── Dockerfile          # required
├── app.py / index.js   # source code
└── requirements.txt
```

Upload via Admin Dashboard → Challenges → Files tab → **Upload ZIP**.

The backend builds the image automatically and tags it as `challenge-{id}:latest`. Containers are created per-participant with resource limits (128 MB RAM, 50% CPU, no privileged mode).

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/auth/me` | JWT | Current user |
| GET | `/api/setup/status` | — | Setup status |
| GET | `/api/event/info` | — | Event info |
| GET | `/api/challenges` | Participant | List challenges |
| POST | `/api/challenges/:id/submit` | Participant | Submit flag |
| GET | `/api/scoreboard` | — | Public scoreboard |
| POST | `/api/instances/generate` | Participant | Generate Docker instance |
| GET/POST/PUT/DELETE | `/api/admin/*` | Admin | Admin CRUD |

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand, Socket.io Client, Framer Motion |
| Backend | Node.js 20, Express.js, TypeScript, Prisma ORM, Socket.io, Dockerode, Zod |
| Database | PostgreSQL 16 |
| Infrastructure | Docker, Docker Compose, Nginx |

## License

MIT
