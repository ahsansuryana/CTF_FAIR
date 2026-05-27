# US-11: Konfigurasi Event & Platform

**As an** admin,
**I want** mengubah semua pengaturan event dan platform dari dashboard,
**So that** saya bisa menyesuaikan tampilan dan perilaku platform untuk setiap event tanpa edit file.

## Acceptance Criteria

- [ ] Halaman "Pengaturan" di dashboard memiliki section: Info Event, Waktu Event, Konfigurasi Docker, Tampilan
- [ ] Semua field dapat diubah dan tersimpan dengan tombol "Simpan"
- [ ] Perubahan nama event / logo langsung terlihat di frontend peserta tanpa refresh
- [ ] Perubahan waktu event memperbarui countdown timer di semua client
- [ ] Perubahan TTL Docker berlaku untuk instance baru (bukan yang sudah berjalan)
- [ ] Validasi input: waktu selesai harus setelah waktu mulai, TTL minimal 60 detik

## Notes
- FR Terkait: [FR-9](../FR/FR-9-admin-dashboard.md), [FR-12](../FR/FR-12-event-timer.md)
