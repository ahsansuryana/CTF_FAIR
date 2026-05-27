# US-1: Login ke Platform

**As a** peserta,
**I want** dapat login menggunakan username dan password yang diberikan admin,
**So that** saya bisa mengakses soal-soal CTF dan mulai berkompetisi.

## Acceptance Criteria

- [ ] Terdapat halaman login dengan field username dan password
- [ ] Jika username/password salah → tampilkan pesan error yang jelas, tidak menyebutkan mana yang salah (username atau password)
- [ ] Jika akun di-ban → tampilkan pesan "Akun Anda telah dinonaktifkan"
- [ ] Setelah 5 kali gagal dari IP yang sama dalam 15 menit → tampilkan pesan rate limit + waktu tunggu
- [ ] Setelah login berhasil → redirect ke halaman daftar soal `/challenges`
- [ ] Session tetap aktif selama 8 jam tanpa perlu login ulang
- [ ] Tombol logout tersedia di navbar, menghapus session dan redirect ke halaman login

## Notes
- FR Terkait: [FR-1](../FR/FR-1-authentication.md)
- JWT disimpan di httpOnly cookie, bukan localStorage
