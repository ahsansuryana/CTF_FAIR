# US-16: Lihat Audit Log

**As an** admin,
**I want** melihat log semua aksi admin dan semua submission peserta,
**So that** saya bisa melakukan investigasi jika terjadi kecurangan atau insiden.

## Acceptance Criteria

- [ ] Halaman audit log menampilkan semua aksi admin: perubahan config, CRUD soal, ban peserta, start/stop event, dll
- [ ] Log submission menampilkan: username, soal, flag yang diinput, IP, timestamp, hasil (benar/salah)
- [ ] Filter tersedia: berdasarkan tipe aksi, tanggal, username
- [ ] Tombol export sebagai CSV tersedia
- [ ] Log tidak dapat dihapus melalui UI (append-only)

## Notes
- FR Terkait: [FR-11](../FR/FR-11-audit-logging.md)
