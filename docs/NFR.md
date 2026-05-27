# Non-Functional Requirements (NFR)

## NFR-1: Keamanan (Security)
Lihat detail lengkap di [`security.md`](./security.md).

| ID | Requirement |
|----|-------------|
| NFR-1.1 | Semua komunikasi client-server wajib melalui HTTPS |
| NFR-1.2 | JWT disimpan di httpOnly cookie, bukan localStorage |
| NFR-1.3 | Password di-hash dengan bcrypt cost factor 12 |
| NFR-1.4 | Semua input divalidasi di server dengan Zod |
| NFR-1.5 | Docker challenge container tidak dapat mengakses jaringan internal app |
| NFR-1.6 | Container challenge berjalan tanpa privileged mode |
| NFR-1.7 | Rate limiting aktif untuk login dan flag submission |
| NFR-1.8 | Security headers HTTP diaktifkan via Helmet |

---

## NFR-2: Performa (Performance)

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-2.1 | Response time API endpoint standar | < 300ms (p95) |
| NFR-2.2 | Scoreboard update via WebSocket | < 500ms setelah solve |
| NFR-2.3 | Generate Docker instance (container start) | < 5 detik |
| NFR-2.4 | Concurrent WebSocket connections | Minimal 200 koneksi simultan |
| NFR-2.5 | Flag submission under load | < 500ms dengan 50 req/detik |

---

## NFR-3: Skalabilitas (Scalability)

| ID | Requirement |
|----|-------------|
| NFR-3.1 | Platform harus mampu menangani minimal 200 peserta simultan tanpa degradasi |
| NFR-3.2 | Penambahan soal baru tidak memerlukan restart server |
| NFR-3.3 | Docker instance yang expired dibersihkan otomatis (tidak akumulasi) |
| NFR-3.4 | Database schema menggunakan index pada kolom yang sering di-query (`user_id`, `challenge_id`, `submitted_at`) |

---

## NFR-4: Ketersediaan (Availability)

| ID | Requirement |
|----|-------------|
| NFR-4.1 | Nginx dikonfigurasi untuk restart otomatis (`restart: always` di compose) |
| NFR-4.2 | Semua service di docker-compose punya `restart: unless-stopped` |
| NFR-4.3 | Database menggunakan volume persisten (data tidak hilang saat container restart) |
| NFR-4.4 | Server crash tidak menghilangkan data submission yang sudah masuk |
| NFR-4.5 | Saat server restart, instance Docker yang expired otomatis di-cleanup |

---

## NFR-5: Kegunaan (Usability)

| ID | Requirement |
|----|-------------|
| NFR-5.1 | Setup wizard harus selesai dalam < 5 menit untuk admin baru |
| NFR-5.2 | Pesan error harus jelas dan informatif (bukan stack trace mentah) |
| NFR-5.3 | Scoreboard dapat diakses tanpa login |
| NFR-5.4 | UI responsive untuk desktop dan mobile |
| NFR-5.5 | Timer event terlihat jelas di UI peserta |
| NFR-5.6 | Status instance (running/expired) dan countdown TTL terlihat di halaman soal Web |

---

## NFR-6: Maintainability

| ID | Requirement |
|----|-------------|
| NFR-6.1 | Kode diorganisasi dengan arsitektur berlapis (routes → controllers → services) |
| NFR-6.2 | Semua nilai konfigurasi dari environment variable (tidak ada hardcoded config) |
| NFR-6.3 | Database migration menggunakan Prisma Migrate (versioned, reproducible) |
| NFR-6.4 | `.env.example` selalu diperbarui saat ada variabel baru |
| NFR-6.5 | README berisi instruksi deploy lengkap dari nol |

---

## NFR-7: Deployability

| ID | Requirement |
|----|-------------|
| NFR-7.1 | Seluruh stack dapat dijalankan dengan satu perintah: `docker compose up -d` |
| NFR-7.2 | Tersedia dua compose file: `docker-compose.yml` (prod) dan `docker-compose.dev.yml` (dev dengan hot reload) |
| NFR-7.3 | Database migration berjalan otomatis saat server container start |
| NFR-7.4 | Tidak ada dependensi berbayar atau cloud-specific |
| NFR-7.5 | Platform dapat berjalan di VPS dengan spesifikasi minimal: 2 vCPU, 2GB RAM, 20GB storage |

---

## NFR-8: Open Source & Reusability

| ID | Requirement |
|----|-------------|
| NFR-8.1 | Lisensi MIT — bebas digunakan, dimodifikasi, dan didistribusikan |
| NFR-8.2 | Tidak ada data event yang hardcoded — semua dari DB/env |
| NFR-8.3 | Nama event, logo, format flag, warna tema semua dapat dikustomisasi dari dashboard |
| NFR-8.4 | README menjelaskan cara fork dan deploy untuk event baru |
| NFR-8.5 | Challenge Docker images disimpan terpisah di folder `challenge-images/` dengan struktur yang mudah diikuti |
