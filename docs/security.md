# Security Requirements

## 1. Autentikasi

### 1.1 JWT & Cookie
- JWT disimpan di **httpOnly cookie** (bukan `localStorage` / `sessionStorage`) — tidak dapat diakses JavaScript
- Cookie flags wajib: `HttpOnly`, `Secure` (HTTPS only), `SameSite=Strict`
- JWT payload: `{ userId, role, iat, exp }`
- Token expiry: **8 jam** (dapat dikonfigurasi via env `JWT_EXPIRES_IN`)
- Logout: hapus cookie di server (set cookie dengan `maxAge: 0`)

### 1.2 Password
- Hashing menggunakan **bcrypt** dengan cost factor **12**
- Password minimal **8 karakter**
- Password **tidak pernah** disimpan plaintext, tidak pernah dikembalikan di response

### 1.3 Login Rate Limiting
- Maksimum **5 attempt gagal** per IP per 15 menit
- Setelah limit tercapai: HTTP 429 + pesan jelas
- Implementasi: `express-rate-limit` dengan store PostgreSQL atau in-memory

---

## 2. Otorisasi (RBAC)

### 2.1 Role
| Role | Akses |
|------|-------|
| `admin` | Semua endpoint, termasuk `/api/admin/*` |
| `participant` | Endpoint peserta saja (`/api/challenges`, `/api/submissions`, `/api/instances`, `/api/scoreboard`) |
| Publik (no token) | Hanya `/api/scoreboard` dan halaman publik |

### 2.2 Middleware

```
authMiddleware       → verify JWT cookie → attach req.user
requireAdmin         → check req.user.role === 'admin'
requireParticipant   → check req.user.role === 'participant' && !user.is_banned
requireEventRunning  → check event_config.is_running === true
```

### 2.3 Endpoint Protection
- Semua route `/api/admin/*` wajib: `authMiddleware` + `requireAdmin`
- Semua route peserta wajib: `authMiddleware` + `requireParticipant`
- **Tidak ada endpoint admin yang dapat diakses tanpa JWT yang valid**

---

## 3. Input Validation

- **Semua** input dari client divalidasi menggunakan **Zod** sebelum menyentuh database
- Prisma ORM menggunakan **parameterized queries** → SQL injection tidak mungkin
- File upload (attachment soal): validasi MIME type + ukuran maksimum 50MB
- Flag submission: trim whitespace sebelum compare, tidak ada normalisasi case (case-sensitive)

---

## 4. HTTP Security Headers (Helmet)

Semua header berikut wajib diaktifkan via `helmet()`:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Content-Security-Policy` | Batasi sumber script, style, image |
| `Referrer-Policy` | `no-referrer` |

---

## 5. CORS

```javascript
cors({
  origin: process.env.CLIENT_URL,   // hanya domain frontend
  credentials: true,                 // allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
})
```
- **Tidak** menggunakan `origin: '*'`

---

## 6. HTTPS via Nginx

### Konfigurasi Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;   # redirect HTTP → HTTPS
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Serve React static build
    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }

    # Proxy API
    location /api/ {
        proxy_pass http://server:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket (Socket.io)
    location /socket.io/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL Opsi
| Opsi | Kapan Digunakan |
|------|-----------------|
| Let's Encrypt (Certbot) | Domain publik dengan DNS |
| Self-signed cert | Internal / development / Zero Trust tunnel |

---

## 7. Docker Instance Security

### Isolasi Container
- Semua challenge container berjalan di Docker network **`ctf-challenges-net`** yang **terpisah** dari network utama app
- Container **tidak bisa** mengakses `server`, `db`, atau service internal lainnya
- Validasi kepemilikan instance: setiap akses ke instance harus divalidasi via `instances.user_id = currentUser.id` di DB

### Resource Limits (Per Container)
```javascript
{
  Memory: 128 * 1024 * 1024,   // 128 MB max RAM
  MemorySwap: 256 * 1024 * 1024,
  CpuQuota: 50000,              // 50% dari 1 CPU core
  PidsLimit: 50,                // max 50 processes
  Privileged: false,            // TIDAK ada privileged mode
  ReadonlyRootfs: false,        // bisa di-enable untuk challenge tertentu
  CapDrop: ['ALL'],             // drop semua Linux capabilities
  CapAdd: [],                   // tidak ada capability tambahan
  NetworkMode: 'ctf-challenges-net',
}
```

### TTL & Cleanup
- Setiap container punya `expires_at` di DB
- Server menjalankan **cron job tiap 1 menit** untuk stop dan remove container yang sudah expired
- Saat server restart: semua instance di DB yang statusnya `running` tapi containernya tidak ada → set status `expired`

---

## 8. Rate Limiting — Flag Submission

- Maksimum **10 submit** per menit per user per challenge
- Cooldown **30 detik** setelah 5 submit salah berturut-turut pada challenge yang sama
- Semua attempt (benar/salah) dicatat di tabel `submissions` dengan IP address

---

## 9. Anti-Cheat

- **Audit Log**: semua submission dicatat (user, challenge, flag yang dimasukkan, IP, timestamp)
- **IP Logging**: admin dapat melihat submission per IP untuk mendeteksi flag sharing
- **One Solve Per User**: constraint `UNIQUE(user_id, challenge_id)` di tabel `solves`
- **Flag tidak ditampilkan** di response API manapun setelah solve, hanya status `correct: true`

---

## 10. Environment & Secrets

- Semua secret di file `.env` (tidak di-commit ke repo)
- `.env` wajib ada di `.gitignore`
- `.env.example` disediakan dengan placeholder values
- `JWT_SECRET` wajib diganti sebelum production (panjang minimal 32 karakter acak)
- Database password wajib diganti dari default
