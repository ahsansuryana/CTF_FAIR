# US-10: Manajemen Peserta

**As an** admin,
**I want** menambahkan dan mengelola akun peserta dari dashboard,
**So that** peserta bisa login dan saya bisa mengontrol akses mereka selama kompetisi.

## Acceptance Criteria

- [ ] Tabel peserta menampilkan: username, total poin, jumlah solve, status (aktif/banned)
- [ ] Tombol "Tambah Peserta" membuka form input username + password
- [ ] Password dapat di-reset oleh admin kapan saja
- [ ] Tombol ban/unban tersedia per peserta dengan konfirmasi dialog
- [ ] Klik nama peserta → halaman detail: semua solve, semua submission (dengan flag yang diinput & IP), status ban
- [ ] Hapus peserta hanya bisa jika belum ada submission

## Notes
- FR Terkait: [FR-13](../FR/FR-13-participant-management.md)
