# CTF FAIR

Self-hosted, open-source Capture The Flag platform for cybersecurity competitions.

## Quick Start

```bash
# Clone and deploy
git clone <repo-url> ctf-fair
cd ctf-fair
docker compose up -d
```

Access `https://yourdomain.com` and complete the **Setup Wizard** to create your first event.

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- 2 vCPU, 2GB RAM, 20GB storage
- Domain name with DNS pointing to server (for HTTPS)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `JWT_SECRET` | (required) | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | (required) | Refresh token secret |
| `POSTGRES_USER` | `ctffair` | Database user |
| `POSTGRES_PASSWORD` | `changeme` | Database password |
| `DOMAIN` | `localhost` | Your domain for SSL |
| `DOCKER_INSTANCE_DEFAULT_TTL` | `3600` | Default container TTL in seconds |

## Architecture

```
Nginx (HTTPS) → React Static / Express API + Socket.io
                     ↓
              PostgreSQL ← → Docker Daemon (dockerode)
```

## Features

- **Challenge System** — Sequential unlock, 5 categories (Web, Crypto, Forensics, Stegano, OSINT)
- **Docker Integration** — Per-participant isolated containers for Web challenges
- **Real-time Scoreboard** — WebSocket-powered live rankings
- **Admin Dashboard** — Full CRUD for challenges, participants, settings
- **Security** — JWT auth, rate limiting, audit logging, Docker isolation

## Development

```bash
docker compose -f docker-compose.dev.yml up -d
```

- Frontend: `http://localhost:5173` (hot reload)
- Backend: `http://localhost:3001` (hot reload via tsx watch)
- Database: `postgresql://ctffair:changeme@localhost:5432/ctffair`

## License

MIT
