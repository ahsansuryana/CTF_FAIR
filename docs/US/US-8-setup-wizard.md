# US-8: Setup Wizard Pertama Kali

**As an** admin yang baru deploy platform,
**I want** menjalani proses setup terpandu saat pertama kali mengakses platform,
**So that** saya bisa mengkonfigurasi event dan platform tanpa perlu mengedit file konfigurasi manual.

## Acceptance Criteria

- [ ] Setelah `docker compose up`, mengakses URL platform pertama kali langsung diarahkan ke halaman setup `/setup`
- [ ] Wizard terdiri dari 3 langkah dengan progress indicator yang jelas
- [ ] Langkah 1: Konfigurasi platform (nama event, deskripsi, flag prefix, logo, warna tema)
- [ ] Langkah 2: Konfigurasi event (waktu mulai/selesai, TTL Docker instance, max instance per user)
- [ ] Langkah 3: Buat akun admin pertama (username + password + konfirmasi)
- [ ] Validasi input real-time (password match, datetime valid, dll)
- [ ] Setelah submit: langsung login sebagai admin dan redirect ke dashboard
- [ ] Setelah setup selesai, halaman `/setup` tidak dapat diakses lagi (404 atau redirect)
- [ ] Semua konfigurasi setup dapat diubah kembali dari dashboard admin

## Notes
- FR Terkait: [FR-2](../FR/FR-2-setup-wizard.md)
