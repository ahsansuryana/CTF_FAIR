# Tech Stack

## Frontend

| Teknologi | Versi | Justifikasi |
|-----------|-------|-------------|
| React | 18.x | Component-based, sesuai requirement |
| Vite | 5.x | Build tool cepat, HMR optimal |
| TailwindCSS | 3.x | Utility-first, mudah dikustomisasi per event |
| Socket.io Client | 4.x | WebSocket untuk scoreboard real-time |
| TanStack Query | 5.x | Server state management + caching |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client dengan interceptor |
| React Hook Form | 7.x | Form management, validasi ringan |
| Zod | 3.x | Schema validasi form (shared dengan backend) |

---

## Backend

| Teknologi | Versi | Justifikasi |
|-----------|-------|-------------|
| Node.js | 20.x LTS | Runtime stabil, long-term support |
| Express.js | 4.x | Minimal, fleksibel, sesuai requirement |
| Socket.io | 4.x | WebSocket server untuk scoreboard real-time |
| Prisma ORM | 5.x | Type-safe, migration otomatis, PostgreSQL native |
| Dockerode | 3.x | Docker SDK Node.js — create/start/stop/remove container |
| jsonwebtoken | 9.x | JWT signing & verification |
| bcryptjs | 2.x | Password hashing (cost factor 12) |
| express-rate-limit | 7.x | Rate limiting per IP / per user |
| helmet | 7.x | Secure HTTP headers otomatis |
| cors | 2.x | CORS policy management |
| zod | 3.x | Input validation di semua endpoint |
| multer | 1.x | Upload file attachment soal |
| cookie-parser | 1.x | Parse httpOnly cookie untuk JWT |

---

## Database

| Teknologi | Versi | Justifikasi |
|-----------|-------|-------------|
| PostgreSQL | 16.x | JSONB untuk config dinamis, concurrent writes optimal, row-level security |

---

## Infrastructure

| Teknologi | Justifikasi |
|-----------|-------------|
| Docker Engine | Containerisasi app + generasi instance soal Web |
| Docker Compose | Orkestrasi: `client`, `server`, `db`, `nginx` dalam satu file |
| Nginx | Reverse proxy, HTTPS termination, serve static React build |
| Certbot / Let's Encrypt | SSL/TLS otomatis (opsional; bisa pakai self-signed untuk internal) |

---

## Struktur Monorepo

```
ctf-fair/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/             # axios instance, socket.io client
│   │   └── stores/
│   └── vite.config.ts
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── services/        # business logic (docker, scoring, etc.)
│   │   ├── lib/             # prisma client, socket.io server
│   │   └── validators/      # zod schemas
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── nginx/
│   ├── nginx.conf
│   └── ssl/                 # Cert files (gitignored)
│
├── challenge-images/        # Dockerfile tiap soal Web (per challenge)
│   └── web-challenge-1/
│       └── Dockerfile
│
├── docs/                    # Dokumentasi ini
│
├── docker-compose.yml       # Production
├── docker-compose.dev.yml   # Development (hot reload)
├── .env.example             # Template environment variables
└── README.md
```

---

## Environment Variables (`.env.example`)

```env
# App
NODE_ENV=production
PORT=3001
CLIENT_URL=https://yourdomain.com

# Database
DATABASE_URL=postgresql://ctffair:password@db:5432/ctffair

# JWT
JWT_SECRET=change-this-to-a-random-256-bit-secret
JWT_EXPIRES_IN=8h

# Docker
DOCKER_NETWORK=ctf-challenges-net
DOCKER_INSTANCE_DEFAULT_TTL=300       # seconds (5 menit)
DOCKER_INSTANCE_PORT_RANGE_START=10000
DOCKER_INSTANCE_PORT_RANGE_END=20000

# Nginx / SSL
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com        # untuk Certbot
```
