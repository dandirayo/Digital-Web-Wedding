# Occasio Wedding Platform

Aplikasi Next.js dengan backend SQLite lokal untuk owner, client, dan undangan. Panduan utama proyek: [core.md](../Knowledge%20Core/core.md). Setup akun, data, pengujian, dan persiapan server: [BACKEND.md](../Knowledge%20Core/BACKEND.md).

## Jalankan

Node.js 24.17+ pada major 24 diperlukan. Dari folder ini:

```powershell
pnpm.cmd install --frozen-lockfile --ignore-scripts
pnpm.cmd dev
```

- Login: http://127.0.0.1:3001/login
- Owner dashboard: http://127.0.0.1:3001/owner/dashboard
- Client dashboard: http://127.0.0.1:3001/client/dashboard
- Demo undangan: http://127.0.0.1:3001/wedding/sheila-yoga

Website publik HTML tetap terpisah pada port 4174.
Akun contoh development tersedia melalui tombol Pakai Owner / Pakai Client.
