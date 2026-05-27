# FR-6: Docker Instance Management (Soal Web)

## Deskripsi
Peserta dapat men-generate Docker container pribadi untuk soal kategori Web. Instance memiliki TTL (Time-to-Live) yang dikonfigurasi admin. Peserta dapat memperpanjang atau me-restart instance. Setiap container diisolasi dan hanya dapat diakses oleh pemiliknya.

---

## Requirements Detail

### FR-6.1 — Generate Instance
- Endpoint: `POST /api/instances/generate`
- Input: `{ challengeId: string }`
- Validasi:
  1. Challenge harus kategori `web`
  2. Challenge harus `unlocked` untuk peserta ini
  3. Event harus sedang berjalan
  4. Cek apakah sudah ada instance `running` untuk `(user_id, challenge_id)` → jika ada, return instance yang sudah ada
  5. Cek jumlah instance `running` user ini tidak melebihi `max_instances_per_user` (dari config)
- Proses:
  1. Cari port kosong di range `DOCKER_INSTANCE_PORT_RANGE_START` — `DOCKER_INSTANCE_PORT_RANGE_END`
  2. `dockerode.createContainer()` dengan resource limits (lihat security.md)
  3. `dockerode.startContainer()`
  4. `INSERT INTO instances { user_id, challenge_id, container_id, assigned_port, status: 'running', expires_at: now + ttl }`
  5. Jadwalkan cleanup otomatis via `setTimeout` atau cron
- Response: `{ instanceId, url: "http://<SERVER_IP>:<port>", expiresAt, ttlSeconds }`

### FR-6.2 — Re-generate / Restart Instance
- Endpoint: `POST /api/instances/restart`
- Input: `{ challengeId: string }`
- Stop dan remove container lama (jika ada)
- Generate container baru (flow sama dengan FR-6.1)
- Update entri di DB (`status: 'running'`, `expires_at: now + ttl`)

### FR-6.3 — Stop Instance Manual
- Endpoint: `DELETE /api/instances/:instanceId`
- Validasi: `instances.user_id === currentUser.id` (ownership check)
- `dockerode.stopContainer()`
- `dockerode.removeContainer()`
- Update DB: `status: 'stopped'`

### FR-6.4 — TTL & Auto-Cleanup
- TTL default dari `event_config.instance_ttl_seconds` (default: 300 detik / 5 menit)
- Saat instance dibuat, `expires_at` = `NOW() + ttl_seconds`
- **Cron job** berjalan setiap **60 detik**: query `instances WHERE status='running' AND expires_at < NOW()`
  - Untuk setiap instance expired: `dockerode.stopContainer()`, `dockerode.removeContainer()`, update DB `status: 'expired'`
- Saat server restart: jalankan cleanup untuk semua instance yang seharusnya expired

### FR-6.5 — Status Instance
- Endpoint: `GET /api/instances/status?challengeId=:id`
- Return: `{ hasInstance: boolean, instance?: { url, expiresAt, status, timeRemaining } }`
- `timeRemaining` dalam detik

### FR-6.6 — Admin: Lihat Semua Instance
- Endpoint: `GET /api/admin/instances`
- Return semua instance aktif dengan info user, challenge, port, TTL
- Admin dapat stop paksa instance: `DELETE /api/admin/instances/:instanceId`

### FR-6.7 — Admin: Konfigurasi Instance
- TTL dan max instance per user dapat diubah dari dashboard (simpan ke `event_config`)
- Perubahan TTL hanya berlaku untuk instance **baru** (tidak retroaktif)

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| POST | `/api/instances/generate` | Peserta | Generate instance baru |
| POST | `/api/instances/restart` | Peserta | Restart instance |
| DELETE | `/api/instances/:id` | Peserta | Stop instance manual |
| GET | `/api/instances/status` | Peserta | Cek status instance |
| GET | `/api/admin/instances` | Admin | Lihat semua instance |
| DELETE | `/api/admin/instances/:id` | Admin | Stop paksa instance |

---

## Catatan Keamanan
- Ownership validation wajib: peserta hanya bisa akses/stop instance miliknya sendiri
- Container tidak mendapat akses ke Docker socket
- Network: `ctf-challenges-net` (terpisah dari app network)
- Tidak ada privileged mode, semua Linux capabilities di-drop
- Lihat detail di [`security.md`](../security.md) bagian Docker Instance Security
