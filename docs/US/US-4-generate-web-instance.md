# US-4: Generate Web Instance

**As a** peserta,
**I want** mendapatkan container web pribadi untuk soal kategori Web,
**So that** saya bisa mengakses environment soal yang terisolasi tanpa mengganggu peserta lain.

## Acceptance Criteria

- [ ] Tombol "Generate Instance" muncul di halaman detail soal Web
- [ ] Klik tombol → instance dibuat dan URL + waktu kadaluarsa ditampilkan
- [ ] URL instance dapat diklik/dibuka di tab baru
- [ ] Countdown timer TTL ditampilkan dan diperbarui setiap detik
- [ ] Jika instance sudah ada (belum expired) → tampilkan instance yang ada, bukan buat baru
- [ ] Tombol "Restart Instance" untuk membuat ulang container (instance lama dihapus)
- [ ] Saat instance expired → tampilkan pesan "Instance telah kadaluarsa" + tombol generate baru
- [ ] Instance hanya dapat diakses oleh peserta yang men-generate-nya

## Notes
- FR Terkait: [FR-6](../FR/FR-6-docker-instance-management.md)
