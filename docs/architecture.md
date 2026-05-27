# System Architecture

## Diagram Komponen

```
Internet
    │
    ▼
┌───────────────────────────────────────────────┐
│                   Nginx (HTTPS)                │
│  Port 80 → redirect 443                        │
│  Port 443 → proxy_pass ke client / server      │
└────────────────┬──────────────────┬────────────┘
                 │                  │
        /        │         /api/*   │
        ▼                  ▼
┌──────────────┐   ┌──────────────────────────┐
│ React Static │   │    Express API Server     │
│  (Nginx dir) │   │    + Socket.io            │
│              │   │    Port: 3001             │
└──────────────┘   └──────┬───────────┬────────┘
                          │           │
               ┌──────────▼──┐  ┌─────▼────────────┐
               │ PostgreSQL  │  │  Docker Daemon    │
               │  Port: 5432 │  │  (via Dockerode)  │
               └─────────────┘  └──────┬────────────┘
                                        │
                            ┌───────────▼────────────┐
                            │   Challenge Network     │
                            │  (ctf-challenges-net)   │
                            │                         │
                            │  [container-user1-c1]   │
                            │  [container-user2-c1]   │
                            │  [container-user1-c3]   │
                            └─────────────────────────┘
```

---

## Docker Compose Services

| Service | Image | Port Internal | Keterangan |
|---------|-------|---------------|------------|
| `nginx` | nginx:alpine | 80, 443 | Entry point semua traffic |
| `client` | node:20 (build) | 3000 | React app (di-serve Nginx sebagai static) |
| `server` | node:20 | 3001 | Express API + Socket.io |
| `db` | postgres:16 | 5432 | Database (tidak expose ke luar) |

---

## Database Schema

### Tabel `users`
```sql
id          UUID PRIMARY KEY
username    VARCHAR(50) UNIQUE NOT NULL
password    VARCHAR(255) NOT NULL          -- bcrypt hash
role        ENUM('admin', 'participant')
is_banned   BOOLEAN DEFAULT false
created_at  TIMESTAMP
```

### Tabel `challenges`
```sql
id            UUID PRIMARY KEY
title         VARCHAR(255) NOT NULL
description   TEXT NOT NULL
category      VARCHAR(50) NOT NULL         -- web, crypto, forensics, stegano, osint
points        INTEGER NOT NULL
flag          VARCHAR(500) NOT NULL        -- stored as bcrypt hash atau plaintext (config)
order_index   INTEGER NOT NULL             -- urutan unlock (1, 2, 3, ...)
is_active     BOOLEAN DEFAULT true
docker_image  VARCHAR(255)                 -- hanya untuk kategori web
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

### Tabel `hints`
```sql
id            UUID PRIMARY KEY
challenge_id  UUID REFERENCES challenges(id)
content       TEXT NOT NULL
order_index   INTEGER NOT NULL
created_at    TIMESTAMP
```

### Tabel `submissions`
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
challenge_id  UUID REFERENCES challenges(id)
submitted_flag VARCHAR(500) NOT NULL
is_correct    BOOLEAN NOT NULL
ip_address    VARCHAR(45)
submitted_at  TIMESTAMP
```

### Tabel `solves`
```sql
id            UUID PRIMARY KEY
user_id       UUID REFERENCES users(id)
challenge_id  UUID REFERENCES challenges(id)
solved_at     TIMESTAMP
points_earned INTEGER
UNIQUE(user_id, challenge_id)
```

### Tabel `instances`
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
challenge_id    UUID REFERENCES challenges(id)
container_id    VARCHAR(100) NOT NULL        -- Docker container ID
assigned_port   INTEGER NOT NULL
status          ENUM('running', 'stopped', 'expired')
expires_at      TIMESTAMP NOT NULL
created_at      TIMESTAMP
```

### Tabel `event_config`
```sql
id              UUID PRIMARY KEY
key             VARCHAR(100) UNIQUE NOT NULL
value           JSONB NOT NULL
updated_at      TIMESTAMP
updated_by      UUID REFERENCES users(id)
```
> Contoh keys: `event_name`, `event_description`, `start_time`, `end_time`,
> `is_running`, `scoreboard_frozen`, `flag_prefix`, `instance_ttl_seconds`,
> `max_instances_per_user`, `logo_url`, `primary_color`

### Tabel `app_config`
```sql
id              UUID PRIMARY KEY
is_setup_done   BOOLEAN DEFAULT false
created_at      TIMESTAMP
```

---

## Alur Data Detail

### Autentikasi
```
POST /api/auth/login
  → Zod validate body
  → Find user by username
  → bcrypt.compare(password, hash)
  → If valid: sign JWT { userId, role, exp }
  → Set httpOnly cookie 'token'
  → Return { user: { id, username, role } }
```

### Submit Flag
```
POST /api/challenges/:id/submit
  → Auth middleware (verify JWT cookie)
  → Rate limit: 10 req/menit per user
  → Check event is running
  → Check challenge exists & accessible (sequential unlock)
  → Check not already solved
  → Compare flag (case-sensitive, trim whitespace)
  → If correct:
      INSERT INTO solves
      UPDATE user score (computed from solves)
      socket.emit('scoreboard:update', newScoreboard)
  → INSERT INTO submissions (log semua attempt)
  → Return { correct: boolean, message }
```

### Generate Web Instance
```
POST /api/instances/generate
  → Auth middleware
  → Check event is running
  → Validate challenge is Web category
  → Check user already has running instance for this challenge → return existing
  → Check max_instances_per_user not exceeded
  → Find free port in configured range
  → dockerode.createContainer({
      Image: challenge.docker_image,
      HostConfig: {
        PortBindings: { '80/tcp': [{ HostPort: port }] },
        NetworkMode: 'ctf-challenges-net',
        Memory: 128 * 1024 * 1024,    // 128MB limit
        CpuQuota: 50000,               // 50% CPU
        AutoRemove: false,
        Privileged: false,
        ReadonlyRootfs: false,
      },
      NetworkingConfig: { ... }
    })
  → dockerode.startContainer()
  → INSERT INTO instances (expires_at = now + ttl)
  → Schedule TTL: setTimeout(stopContainer, ttl * 1000)
  → Return { url: `http://<server-ip>:<port>`, expiresAt }
```

### Real-time Scoreboard
```
Client connect → socket.io handshake (no auth required for scoreboard)
Server → emit('scoreboard:init', fullScoreboard) on connect
On every solve → server emit('scoreboard:update', updatedScoreboard) to ALL
Client → update UI tanpa refresh
```

---

## Network Isolation (Docker)

- Challenge containers berjalan di Docker network **`ctf-challenges-net`** (terpisah dari main app network)
- Containers **tidak** bisa akses database atau service internal
- Containers hanya terekspos via port yang di-assign (10000–20000)
- Akses ke container divalidasi via DB: `instances.user_id = :currentUserId`
