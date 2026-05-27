# FR-11: Audit Logging

## Deskripsi
Semua aksi signifikan dicatat untuk keperluan monitoring dan investigasi.

---

## Yang Dicatat

### Aksi Peserta (di tabel `submissions`)
- Submit flag (benar & salah): user_id, challenge_id, flag_input, is_correct, ip, timestamp

### Aksi Admin (di tabel `admin_audit_logs`)
| Event | Contoh |
|-------|--------|
| `challenge.created` | Admin membuat soal baru |
| `challenge.updated` | Admin mengubah soal |
| `challenge.deleted` | Admin menghapus soal |
| `participant.created` | Admin menambah peserta |
| `participant.banned` | Admin ban peserta |
| `participant.password_reset` | Admin reset password |
| `event.started` | Admin start event |
| `event.stopped` | Admin stop event |
| `scoreboard.frozen` | Admin freeze scoreboard |
| `config.updated` | Admin ubah konfigurasi |
| `instance.force_stopped` | Admin stop paksa instance |

---

## API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|------------|
| GET | `/api/admin/audit-logs` | Admin | List audit log dengan filter |
| GET | `/api/admin/audit-logs/export` | Admin | Export sebagai CSV |
| GET | `/api/admin/submissions` | Admin | Semua submission peserta |
