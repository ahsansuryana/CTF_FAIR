# US-13: Manajemen Docker Instance

**As an** admin,
**I want** melihat dan mengontrol semua Docker instance yang sedang berjalan,
**So that** saya bisa memastikan tidak ada instance yang memakan resource berlebihan atau berjalan melampaui batas.

## Acceptance Criteria

- [ ] Tabel instance aktif menampilkan: username, nama soal, port, waktu dibuat, waktu expired, status
- [ ] Tombol "Stop" per instance untuk menghentikan paksa container
- [ ] Data diperbarui real-time atau dengan tombol refresh
- [ ] Konfigurasi TTL dan max instance per user dapat diubah dari halaman ini
- [ ] Instance yang expired otomatis hilang dari tabel (cleanup berjalan di background)

## Notes
- FR Terkait: [FR-6](../FR/FR-6-docker-instance-management.md), [FR-9](../FR/FR-9-admin-dashboard.md)
