# Software Requirements Specification (SRS)

## 1. Pendahuluan

### 1.1 Tujuan
CTF FAIR adalah platform web Capture The Flag (CTF) yang bersifat **open source** dan **self-hosted**. Platform ini dirancang reusable — dapat di-deploy ulang oleh siapa pun untuk event CTF mereka sendiri hanya dengan `docker compose up`. Semua konfigurasi event bersifat dinamis melalui dashboard admin atau setup wizard.

### 1.2 Scope
Platform mencakup:
- Autentikasi peserta (login/logout)
- Setup wizard saat pertama kali deploy
- Manajemen soal (challenge) per kategori dengan unlock bertahap
- Generasi Docker container per peserta untuk soal kategori **Web**
- Pengiriman dan validasi flag
- Papan skor real-time via WebSocket, dapat diakses publik
- Dashboard admin yang sepenuhnya dinamis (tidak ada nilai hardcoded)
- Deploy via Docker Compose + Nginx HTTPS

### 1.3 Di Luar Scope
- Registrasi mandiri oleh peserta (peserta diinput admin via dashboard)
- Sistem tim (semua peserta bermain individual)
- Poin dinamis (poin bersifat fixed per soal)
- Notifikasi email/push
- Multi-event dalam satu instance

### 1.4 Definisi & Akronim

| Istilah | Definisi |
|---------|----------|
| CTF | Capture The Flag — kompetisi keamanan siber |
| Flag | String jawaban soal. Format: `CTF_ITFAIR{...}` |
| Challenge | Soal CTF |
| Instance | Docker container yang di-generate per peserta untuk soal Web |
| Solve | Kondisi berhasil: peserta submit flag yang benar |
| Admin | Penyelenggara event, akses penuh ke dashboard |
| Peserta | Pengguna terdaftar yang mengikuti kompetisi |
| Setup Wizard | Halaman konfigurasi awal yang muncul setelah deploy pertama |
| Sequential Unlock | Sistem di mana soal berikutnya hanya terbuka setelah soal sebelumnya di-solve |
| TTL | Time-to-Live — durasi hidup Docker instance (dikonfigurasi admin) |

### 1.5 Referensi
- [`tech-stack.md`](./tech-stack.md) — Stack teknologi
- [`architecture.md`](./architecture.md) — Arsitektur sistem
- [`security.md`](./security.md) — Requirements keamanan
- [`FR/index.md`](./FR/index.md) — Functional Requirements
- [`US/index.md`](./US/index.md) — User Stories

---

## 2. Aktor Sistem

| Aktor | Deskripsi | Autentikasi |
|-------|-----------|-------------|
| **Peserta** | Pengguna terdaftar yang mengerjakan soal | JWT via login |
| **Admin** | Penyelenggara event, mengelola platform | JWT via login (role: admin) |
| **Publik** | Pengunjung anonim | Tidak perlu login |

---

## 3. Gambaran Umum Sistem

### 3.1 Perspektif Produk
CTF FAIR adalah sistem mandiri. Tidak ada ketergantungan layanan eksternal berbayar. Seluruh stack berjalan dalam satu `docker-compose.yml`.

### 3.2 Fungsi Utama (Ringkasan)

**Peserta:**
- Login dengan kredensial yang dibuat admin
- Melihat daftar soal yang sudah terbuka (sequential unlock)
- Membaca deskripsi soal, file attachment, dan hint
- Meng-generate Docker instance untuk soal Web
- Submit flag dan melihat hasilnya
- Melihat scoreboard real-time

**Admin:**
- Menjalankan setup wizard saat pertama deploy
- CRUD soal (judul, deskripsi, kategori, poin, flag, attachment, hint, urutan unlock)
- CRUD peserta (tambah manual, reset password, ban)
- Konfigurasi event (nama, waktu mulai/selesai, deskripsi)
- Konfigurasi Docker instance (TTL default, max instance per user)
- Start/stop event secara manual
- Freeze/unfreeze scoreboard
- Monitor semua submission real-time
- Lihat audit log

### 3.3 Batasan Sistem
- Satu instance aplikasi = **satu event CTF aktif**
- Soal Web membutuhkan **Docker terinstall di host server**
- Flag bersifat **statis** (tidak unik per peserta)
- Poin bersifat **fixed** (tidak turun berdasarkan jumlah solver)
- Peserta **tidak bisa registrasi mandiri** — hanya admin yang membuat akun

### 3.4 Asumsi
- Server memiliki akses internet dan Docker daemon berjalan
- Admin menginput peserta secara manual dari file Excel
- Peserta memiliki koneksi internet stabil selama event
- Sertifikat SSL dikelola via Nginx (Let's Encrypt atau self-signed)

---

## 4. Kategori Soal

| Kategori | Kode | Deskripsi | Docker Instance |
|----------|------|-----------|-----------------|
| Web | `web` | Eksploitasi aplikasi web | **Ya** (per peserta) |
| Cryptography | `crypto` | Enkripsi, dekripsi, analisis | Tidak |
| Forensics | `forensics` | Analisis file, memory, network | Tidak |
| Steganography | `stegano` | Data tersembunyi dalam media | Tidak |
| OSINT | `osint` | Open Source Intelligence | Tidak |

---

## 5. Alur Umum Event

```
Deploy → Setup Wizard → Admin input soal & peserta → Admin start event
→ Peserta login → Kerjakan soal secara bertahap → Submit flag
→ Scoreboard update real-time → Admin stop/freeze event → Selesai
```
