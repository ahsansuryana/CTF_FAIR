# CTF FAIR — Design & Agent Skill Specification

---

## 1. Coding Agent Required Skills

### Core Stack
| Skill | Keterangan |
|---|---|
| **React (TypeScript)** | Semua UI komponen, routing (React Router v6), state management (Zustand atau Redux Toolkit) |
| **Express.js (TypeScript)** | REST API, middleware auth JWT, rate limiting, audit log |
| **PostgreSQL + Prisma/Drizzle** | Schema design, migrations, query optimization |
| **Socket.io** | Real-time scoreboard, event broadcasting |
| **Docker & Docker Compose** | Multi-container orchestration, network isolation per peserta, resource limit |
| **Nginx** | Reverse proxy, HTTPS via Let's Encrypt (Certbot), WebSocket proxying |

### Security & Auth
| Skill | Keterangan |
|---|---|
| **JWT (jsonwebtoken)** | Access token + refresh token flow |
| **bcrypt** | Password hashing |
| **Helmet.js** | HTTP security headers |
| **express-rate-limit** | Rate limiting per endpoint |
| **Input validation (Zod)** | Schema validation request body |

### DevOps & Infrastructure
| Skill | Keterangan |
|---|---|
| **Docker SDK / dockerode** | Spin up / destroy container per peserta untuk soal Web |
| **TTL management** | Auto-cleanup container setelah timeout |
| **Network isolation** | Docker network per instance, bridge mode |

### Frontend Specific
| Skill | Keterangan |
|---|---|
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animasi transisi, micro-interaction |
| **Recharts / Victory** | Scoreboard chart, statistik |
| **React Query (TanStack)** | Server state, caching, refetch |
| **Socket.io-client** | Subscribe scoreboard real-time |

---

## 2. Design System — Mengacu Estetika Claude.ai

### Filosofi Desain
> **"Refined Dark Intelligence"** — Bersih, serius, premium. Tidak playful, tidak brutal. Interface yang memberi rasa bahwa pengguna sedang bekerja di lingkungan profesional dan powerful.

Sama seperti claude.ai: dark background, tipografi bersih, kontras tinggi, interaksi yang halus dan responsif tanpa berlebihan.

---

### Color Palette

```css
:root {
  /* Background layers */
  --bg-base:       #0d0d10;   /* Canvas utama */
  --bg-surface:    #16161a;   /* Card, panel */
  --bg-elevated:   #1e1e24;   /* Modal, dropdown */
  --bg-muted:      #252530;   /* Input, code block */

  /* Border */
  --border-subtle: #2a2a35;
  --border-default:#3a3a48;
  --border-strong: #52526a;

  /* Text */
  --text-primary:  #f0f0f5;
  --text-secondary:#a0a0b8;
  --text-muted:    #606078;
  --text-disabled: #3a3a50;

  /* Accent — satu warna utama, seperti claude.ai menggunakan orange-copper */
  --accent:        #d4820a;   /* CTF: amber/orange — warna "flag" */
  --accent-hover:  #e8950f;
  --accent-subtle: rgba(212, 130, 10, 0.12);

  /* Status */
  --success:       #22c55e;
  --danger:        #ef4444;
  --warning:       #f59e0b;
  --info:          #3b82f6;

  /* Solved state */
  --solved-bg:     rgba(34, 197, 94, 0.08);
  --solved-border: rgba(34, 197, 94, 0.3);
}
```

---

### Typography

```css
/* Display / Heading — karakter tegas, technical */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Sora:wght@300;400;500;600;700&display=swap');

--font-display: 'Sora', sans-serif;       /* Heading, nav, label */
--font-body:    'Sora', sans-serif;        /* Body text */
--font-mono:    'IBM Plex Mono', monospace; /* Flag input, kode, hash */

/* Scale */
--text-xs:   0.75rem;   /* 12px — badge, label kecil */
--text-sm:   0.875rem;  /* 14px — body sekunder */
--text-base: 1rem;      /* 16px — body utama */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px — card title */
--text-2xl:  1.5rem;    /* 24px — section heading */
--text-3xl:  1.875rem;  /* 30px — page title */
--text-4xl:  2.25rem;   /* 36px — hero */
```

---

### Spacing & Layout

```
Gunakan 8px grid system.
Padding card: 24px
Gap antar card: 16px
Max-width konten: 1200px
Sidebar admin: 240px (collapsed: 64px)
Border-radius: 8px (card), 6px (button), 4px (badge)
```

---

### Component Specifications

#### Navbar
- Background: `var(--bg-surface)` dengan `border-bottom: 1px solid var(--border-subtle)`
- Logo: teks "CTF FAIR" font mono, warna `var(--accent)`
- Navigasi item: warna `--text-secondary`, hover `--text-primary` + underline `--accent`
- Timer kompetisi: monospace countdown di tengah, warna `--accent`
- **3 state timer** (FR-12.4):
  - **Pre-event**: "Mulai dalam HH:MM:SS" — teks `--text-secondary`
  - **Live**: Countdown sisa waktu — teks `--accent`
  - **Ended**: "Event Telah Berakhir" — teks `--danger`

#### Challenge Card
```
┌─────────────────────────────┐
│ [CATEGORY BADGE]   [POINTS] │
│                             │
│  Challenge Title            │
│  Deskripsi singkat...       │
│                             │
│  ──────────────────────     │
│  🔒 Locked  /  ✓ Solved     │
└─────────────────────────────┘
```
- State **Locked**: opacity 50%, border `--border-subtle`, cursor not-allowed
- State **Available**: border `--border-default`, hover lift `translateY(-2px)` + `box-shadow`
- State **Solved**: background `--solved-bg`, border `--solved-border`, badge hijau

#### Challenge Detail Page
- Header: kategori badge + judul + poin
- Deskripsi soal: Markdown render, font `--font-body`
- File attachment: tombol download dengan icon file, warna `--info` (FR-3.1)
- Hint section (FR-7):
  - Accordion/collapsible: judul "Hint 1", "Hint 2", ...
  - Konten hint di-render Markdown
  - Tidak ada biaya poin untuk membuka hint
  - Seluruh hint langsung terlihat (tidak bertahap)
- Status instance (khusus Web): panel status container (running/expired) + TTL countdown + tombol generate/restart (FR-6.5)
- Flag submission result:
  - Benar: toast hijau + animasi checkmark + poin earned
  - Salah: toast merah, shake input
  - Sudah solved: badge hijau "Terselesaikan" + disable input

#### Flag Input
- Font: `var(--font-mono)`
- Placeholder: `CTF_ITFAIR{...}` (prefix sesuai konfigurasi event)
- Border focus: `--accent` dengan glow `box-shadow: 0 0 0 3px var(--accent-subtle)`
- Submit button: background `--accent`, hover `--accent-hover`
- Disabled state setelah solve: border `--solved-border`, background `--solved-bg`

#### Scoreboard
- Layout: tabel dengan sticky header
- Rank #1-3: icon trophy + warna gold/silver/bronze
- Real-time update: row flash animasi saat skor berubah (fade highlight)
- Publik bisa lihat tanpa login (read-only view)

#### Admin Dashboard
- Sidebar kiri dengan icon + label, collapsible (240px / 64px)
- Main content: card grid statistik (total peserta, soal solved, flag submission rate, top solver)
- Overview: status event (running/stopped) + quick-action buttons (Start/Stop Event, Freeze Scoreboard)
- Submissions page (FR-9.6): feed real-time semua attempt, filter per peserta/challenge/status, tampilkan username, flag yang disubmit, IP, timestamp
- Audit log: tabel monospace dengan timestamp, user, action, IP + export CSV

---

### Animation Principles

```
Prinsip: Subtle, fungsional, tidak mengganggu.

Duration:
  - Micro (hover, focus): 150ms ease
  - Transition (page, panel): 250ms ease-out
  - Load/appear: 350ms ease-out

Easing: cubic-bezier(0.16, 1, 0.3, 1) — snappy masuk, halus keluar

Yang digunakan:
  - Fade + slide up saat card muncul
  - Scoreboard row highlight saat update
  - Solved animation: checkmark draw + card border pulse
  - Docker instance spinner saat provisioning
  - Setup wizard: step progress bar animated
```

---

### Page Structure

```
/ (publik)           → Scoreboard publik + informasi kompetisi
/login               → Login peserta
/dashboard           → Challenge list (sequential unlock)
/challenge/:id       → Detail soal + flag input + hint
/scoreboard          → Real-time scoreboard (publik & peserta)

/admin               → Dashboard admin (statistik real-time)
/admin/challenges    → CRUD soal
/admin/participants  → CRUD peserta
/admin/submissions   → Monitor submission real-time (FR-9.6)
/admin/logs          → Audit log
/admin/settings      → Freeze scoreboard, konfigurasi CTF
/setup               → Setup wizard (hanya muncul saat first deploy)
```

---

### Responsive Breakpoints

```
Mobile  : < 768px   → Single column, hamburger nav
Tablet  : 768-1024px → 2 column challenge grid
Desktop : > 1024px  → 3 column challenge grid, sidebar admin expanded
```

---

## 3. Referensi Visual

Acuan estetika: **claude.ai**
- Dark, bersih, tidak ramai
- Satu accent color, dipakai dengan restraint
- Tipografi sebagai elemen desain utama
- Interaksi smooth tapi tidak flashy
- Informasi density tinggi tapi tidak overwhelming

CTF FAIR menambahkan sentuhan **"terminal / hacker aesthetic"** yang subtle:
- Font mono untuk elemen teknis (flag, hash, timestamp)
- Subtle scanline atau noise texture di background (opacity sangat rendah, ~3%)
- Badge kategori dengan warna kode masing-masing (Web: biru, Crypto: ungu, Forensics: kuning, Steg: hijau, OSINT: merah)
