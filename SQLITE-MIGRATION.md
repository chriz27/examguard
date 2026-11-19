# ExamGuard — Panduan Migrasi SQLite

## Langkah Instalasi (Wajib)

### 1. Install Dependencies Baru

Buka Command Prompt di folder `examguard`:

```bash
npm install
```

Atau klik ganda file: **`install-sqlite.bat`**

> [!NOTE]
> **Zero C++ Compiler Needed:** ExamGuard memanfaatkan **Node.js Built-in SQLite (`node:sqlite`)** yang sudah ada di Node.js v22 (seperti di Laragon Anda). Anda **TIDAK PERLU** menginstall Visual Studio C++ atau Python. Dependensi yang diinstall hanyalah `ws` (WebSocket) murni JavaScript.

---

### 2. Jalankan Aplikasi

```bash
npm run dev
```

Saat pertama kali dijalankan, sistem akan:
1. Membuat database baru: **`examguard.db`** (SQLite)
2. **Migrasi otomatis** dari `.examguard-db.json` ke SQLite (jika file JSON lama ada)
3. Menyiapkan WebSocket server di port **5174**

---

### 3. Verifikasi Database

```bash
npm run test:db
```

Menjalankan 30+ integration test terhadap semua fungsi database.

---

## Arsitektur Baru

```
Browser (React)
    │
    ├── REST API → /api/db/*  (CRUD sync)
    │       │
    └── WebSocket → ws://host:5174  (Push real-time)
            │
            └── SQLite (examguard.db)
                 ├── institution
                 ├── users
                 ├── exam_sessions
                 ├── student_attempts  ──FK→ users (CASCADE)
                 │                     ──FK→ exam_sessions (CASCADE)
                 ├── exam_attendance   ──FK→ users (CASCADE)
                 │                     ──FK→ exam_sessions (CASCADE)
                 ├── berita_acara_config
                 ├── app_mode_config
                 └── system_error_logs
```

## Perbedaan dari Versi Lama

| Aspek | Lama (JSON + localStorage) | Baru (SQLite + WebSocket) |
|-------|---------------------------|--------------------------|
| Database | File flat `.examguard-db.json` | SQLite ACID (WAL mode) |
| Relasi data | Manual JavaScript | Foreign Key dengan CASCADE |
| Sinkronisasi | HTTP polling 700ms | WebSocket push <10ms |
| Konkurensi | Race condition | Thread-safe, atomic |
| Data hantu | Ada (orphan attempts) | Tidak ada (FK cascade) |
| Penyimpanan | localStorage + JSON file | SQLite + localStorage (session saja) |

## Perintah Berguna

```bash
# Reset database (mulai dari awal)
npm run db:reset

# Migrasi manual dari JSON lama
npm run db:migrate

# Test integritas database
npm run test:db
```

## File Penting

| File | Keterangan |
|------|-----------|
| `examguard.db` | Database SQLite (jangan dihapus) |
| `server/db.cjs` | SQLite engine & semua operasi DB |
| `src/services/dbService.js` | REST API client + WebSocket client |
| `src/services/storageService.js` | Adapter backward-compatible |
| `src/hooks/useDatabase.js` | React hooks untuk data real-time |
| `vite.config.js` | Server plugin SQLite + WebSocket |
