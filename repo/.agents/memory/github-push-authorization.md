---
name: GitHub push authorization
description: Replit-specific requirement for pushing commits to GitHub
---

Push ke remote GitHub tidak berhasil hanya dengan menambahkan URL `origin`; jalur push resmi membutuhkan kredensial GitHub source-control yang terhubung ke Replit.

**Why:** Percobaan push tanpa koneksi GitHub menghasilkan `NO_CREDENTIALS`, meskipun repository publik dapat di-clone dan remote sudah benar.

**How to apply:** Hubungkan akun GitHub melalui koneksi resmi Replit sebelum menjalankan push berikutnya. Jangan meminta atau menaruh token mentah di chat, file, atau URL remote.