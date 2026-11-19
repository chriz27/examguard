# 🛡️ ExamGuard - GForm Proctoring WebApp

<div align="center">

[![GitHub](https://img.shields.io/badge/GitHub-chriz27%2Fexamguard-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/chriz27/examguard)
![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-ACID_WAL-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**Sistem Pengawasan Ujian Berbasis Web Modern untuk Google Form dengan Proteksi Anti-Curang, GPS Geofencing, Google SSO, dan Dua Tingkat Peran Pengawas.**

[Fitur Utama](#-fitur-utama) • [Prasyarat](#-prasyarat-sistem) • [Instalasi Lokal](#-panduan-instalasi-lokal-mode-pengembang) • [Deploy cPanel](#-panduan-instalasi--deployment-ke-cpanel) • [Kredensial Demo](#-kredensial-akun-demo-pengujian) • [Repositori GitHub](https://github.com/chriz27/examguard)

</div>

---

## 📋 Daftar Isi

1. [Tentang ExamGuard](#-tentang-examguard)
2. [Fitur Utama](#-fitur-utama)
3. [Arsitektur & Alur Kerja Sistem](#-arsitektur--alur-kerja-sistem)
4. [Basis Data Relasional SQLite & Real-Time Engine](#-basis-data-relasional-sqlite--real-time-engine)
5. [Keamanan, Validasi & Integritas Ujian](#-keamanan-validasi--integritas-ujian)
6. [Skalabilitas & Panduan Pelaksanaan 700+ Peserta](#-skalabilitas--panduan-pelaksanaan-700-peserta)
7. [Prasyarat Sistem](#-prasyarat-sistem)
8. [Panduan Instalasi Lokal (Mode Pengembang)](#-panduan-instalasi-lokal-mode-pengembang)
9. [Panduan Instalasi & Deployment ke cPanel](#-panduan-instalasi--deployment-ke-cpanel)
10. [Kredensial Akun Demo Pengujian](#-kredensial-akun-demo-pengujian)
11. [Alur & Hak Akses Administrator](#-alur--hak-akses-administrator)
12. [Struktur Folder Proyek](#-struktur-folder-proyek)
13. [Konfigurasi Tambahan (OAuth, reCAPTCHA, GPS)](#-konfigurasi-tambahan)
14. [Pemecahan Masalah (Troubleshooting)](#-pemecahan-masalah-troubleshooting)
15. [Lisensi](#-lisensi)

---

## 💡 Tentang ExamGuard

**ExamGuard** adalah aplikasi *proctoring web* (pengawasan ujian) ringan, modern, dan mandiri yang membungkus formulir **Google Form** dalam lingkungan ujian yang aman dan terpantau. Dirancang khusus untuk sekolah (SD, SMP, SMA/SMK) maupun perguruan tinggi yang membutuhkan sistem ujian digital berstandar tinggi tanpa perlu infrastruktur server database yang rumit.

Aplikasi ini **100% Client-Side Ready** dan telah dioptimalkan untuk berjalan mulus baik di **Jaringan Wi-Fi/LAN Lokal** maupun di **Shared Hosting cPanel (Apache / LiteSpeed)** hanya dengan mengunggah paket build `.zip`.

---

## ✨ Fitur Utama

- **🎨 Modern Minimalist Design:** Antarmuka bersih (*anti-AI slop*) menggunakan Tailwind CSS v4, tipografi Inter & JetBrains Mono, border halus, serta modal konfirmasi khusus (tanpa popup bawaan browser).
- **🔒 Anti-Curang Proctoring Engine:**
  - Deteksi perpindahan tab browser (`visibilitychange`).
  - Deteksi hilangnya fokus jendela (`window.blur`).
  - Deteksi keluar dari mode Fullscreen (Layar Penuh).
  - **Auto-Lock Screen** seketika saat terjadi pelanggaran dengan counter akumulasi pelanggaran.
  - Pemblokiran klik kanan, inspect element (`F12`), `Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `Alt+Tab`, serta *anti-translate*.
- **🆔 Validasi 3 Kunci Identitas Anti-Duplikasi:**
  - Verifikasi *real-time* bahwa **Nomor Ujian**, **NISN**, dan **NIS** wajib unik antar siswa.
  - Penandaan kolom merah dan badge `Duplikat` seketika saat admin mengetik data ganda.
  - **Laporan Validasi Import Massal (CSV/Excel):** Mendeteksi duplikasi terhadap data sistem maupun bentrok antar baris dalam file import, lengkap dengan rincian baris dan tombol salin laporan.
- **📍 GPS Geofencing Interaktif (Leaflet & OpenStreetMap):**
  - Preview peta interaktif gratis tanpa Google Maps API berbayar.
  - Pengaturan radius toleransi ujian (50m, 100m, 200m, 500m, dst) menggunakan formula trigonometri *Haversine*.
  - Fitur pencarian lokasi langsung (*live search Nominatim*) dan input tautan Google Maps langsung.
- **🔐 Dua Tingkat Akses Administrator (RBAC):**
  - **Super Admin:** Akses mutlak ke semua fitur, termasuk *Pengaturan Instansi* dan *Kelola Akun Administrator*.
  - **Proktor Ujian:** Khusus operasional lapangan (*Ringkasan & Metrik*, *Sesi Ujian*, *Kontrol Pengawas Live*, dan *Manajemen Siswa*). Menu sensitif otomatis disembunyikan.
- **⚡ Kontrol Pengawas Real-Time:**
  - **Unlock:** Membuka kembali siswa yang terkunci tanpa reload.
  - **Reset Login:** Melepas ikatan *Device ID* siswa jika ganti perangkat.
  - **Reset Pekerjaan:** Mengembalikan status ujian menjadi `RESET_BY_PROCTOR` agar siswa dapat mengulang dari awal.
  - **Reset Password & Reset SSO:** Reset password instan ke default NIS dan pencabutan koneksi Google SSO per siswa.
- **🏷️ Sticky Header Ujian:** Timer hitung mundur pengerjaan, chip token soal sekali-klik salin (*click-to-copy*), dan konfirmasi submit ujian.
- **🌐 Google Workspace SSO & reCAPTCHA v2:** Dukungan integrasi OAuth login sekolah dan verifikasi bot reCAPTCHA v2 dengan kontrol toggle on/off.
- **🏫 Identitas Sekolah & NPSN Resmi:** Konfigurasi nama sekolah, jenjang pendidikan, serta input validasi **NPSN 8 digit angka numerik** yang tersimpan di basis data sistem dan tampil pada header aplikasi.
- **💾 Backup & Restore Terenkripsi (AES-256-GCM):** Fasilitas pencadangan dan pemulihan data instansi, link bank soal, basis data siswa, serta riwayat ujian dengan **enkripsi militer AES-256-GCM** otomatis untuk password dan kunci rahasia Google.
- **⚡ Code-Splitting Modular:** Bundle portal siswa dipisah secara *lazy load* (`~100 KB gzipped`) sehingga loading di smartphone peserta sangat cepat dan hemat kuota/RAM.

---

## 🏗️ Arsitektur & Alur Kerja Sistem

ExamGuard mengusung arsitektur terintegrasi **Node.js SQLite Backend Engine + WebSocket Push + React SPA Client**. Sistem memisahkan beban komputasi secara cerdas untuk menjamin konkurensi tinggi, integritas data mutlak, dan latensi nol:

```mermaid
flowchart TD
    subgraph Klien Peserta
        HP["Smartphone / Laptop Siswa<br>(Menjalankan Kiosk Lockdown & Timer)"]
    end

    subgraph Infrastruktur Google
        GF["Google Forms Cloud Engine<br>(Penyajian Soal & Penyimpanan Jawaban)"]
    end

    subgraph Server ExamGuard (Host / LAN / Cloud)
        SRV["Vite + Node.js Engine (Port 5173)<br>(Static Assets & REST API /api/db/*)"]
        WSS["WebSocket Push Server (Port 5174)<br>(Real-Time Event Broadcast < 10ms)"]
        SQLITE[("examguard.db (SQLite WAL Mode)<br>• ACID Transactions<br>• Foreign Key ON DELETE CASCADE")]
        PROCTOR["Dashboard Super Admin & Proktor<br>(Monitoring Live & Kontrol Pengawas)"]
    end

    HP -->|"1. Unduh WebApp (~100 KB gzipped)"| SRV
    HP -->|"2. Render Form & Submit Jawaban Langsung"| GF
    HP <-->|"3. Mutasi Pengerjaan & Ping (REST API)"| SRV
    SRV <-->|"4. ACID Query & FK Enforcement"| SQLITE
    SQLITE -.->|"5. Auto-Broadcast Event"| WSS
    WSS -->|"6. Push Event Seketika (<10ms)"| HP
    WSS -->|"6. Push Status Live (<10ms)"| PROCTOR
    PROCTOR <-->|"7. Aksi Unlock / Reset / Kelola Data"| SRV
```

### 1. Pemisahan Beban Komputasi
* **Beban Soal & Jawaban:** Ditangani 100% oleh **Google Forms**. Server sekolah tidak akan pernah mengalami *database connection pool timeout* atau *crash* saat ratusan siswa menekan tombol submit bersamaan.
* **Beban Pengawasan (Proctoring Client):** Timer ujian, deteksi fullscreen, pendeteksi perpindahan aplikasi (`visibilitychange`), dan GPS Geofencing berjalan di memori browser HP masing-masing siswa.
* **Beban Penyimpanan & Integritas Relasional:** Dikelola oleh **SQLite** via engine `better-sqlite3` dengan mode **Write-Ahead Logging (WAL)** pada level file server (`examguard.db`).
* **Beban Sinkronisasi Real-Time:** Dikelola oleh **WebSocket Server (ws)** di port 5174 yang menyebarkan (*push*) setiap mutasi proktor ke seluruh layar perangkat dalam waktu **< 10 milidetik**, menggantikan polling HTTP lama.

---

## 🗄️ Basis Data Relasional SQLite & Real-Time Engine

ExamGuard telah sepenuhnya dimigrasikan dari file flat JSON menjadi **Database Relasional Sejati (SQLite)** yang berjalan dengan konfigurasi **ACID, Foreign Keys ON, dan WAL Mode**. Ini mengeliminasi seluruh risiko *race condition*, *lost update*, dan data hantu (*orphan records*).

### 1. Diagram Relasi Entitas (Entity-Relationship Diagram / ERD)

```mermaid
erDiagram
    institution {
        TEXT id PK "singleton"
        TEXT name "Nama Sekolah"
        TEXT npsn "NPSN 8 digit"
        TEXT logo_url "URL Logo"
        TEXT education_level "Jenjang (SD/SMP/SMA/Lainnya)"
        TEXT allowed_grades "JSON Array Tingkat"
        INTEGER idle_timeout_minutes "Batas Waktu Idle"
        INTEGER gps_enabled "Status GPS (1/0)"
        REAL center_lat "Latitude Pusat"
        REAL center_lng "Longitude Pusat"
        INTEGER max_radius_meters "Radius Toleransi (m)"
        TEXT gmaps_url "Link Google Maps"
        TEXT auth_method "SSO_ONLY | CREDENTIALS_ONLY | BOTH"
        INTEGER google_oauth_enabled "Status Google SSO (1/0)"
        TEXT google_client_id "Google OAuth Client ID"
        TEXT google_client_secret "Google OAuth Secret"
        INTEGER recaptcha_enabled "Status Captcha (1/0)"
        TEXT recaptcha_site_key "reCAPTCHA Site Key"
        TEXT recaptcha_secret_key "reCAPTCHA Secret Key"
        TEXT recaptcha_version "v2 | v3"
        INTEGER finish_token_lead_minutes "Lead Time Token Selesai"
        TEXT browser_permissions "JSON Setelan Izin Browser"
        TEXT updated_at "Timestamp Terakhir"
    }

    users {
        TEXT id PK "UUID / String ID"
        TEXT username UK "Username Unik (NISN untuk Siswa)"
        TEXT password "Kata Sandi (Default NIS)"
        TEXT nama "Nama Lengkap"
        TEXT email "Alamat Email"
        TEXT role "admin | proctor | student"
        TEXT nisn "Nomor Induk Siswa Nasional"
        TEXT nis "Nomor Induk Sekolah"
        TEXT nomor_ujian "Nomor Peserta Ujian Unik"
        TEXT jenis_kelamin "L | P"
        TEXT agama "Agama Peserta"
        TEXT kelas "Nama Rombel / Kelas"
        INTEGER tingkat "Tingkat Kelas (1-12)"
        TEXT ruang "Ruang Ujian (Default Ruang 01)"
        INTEGER is_active "Status Akun Aktif (1/0)"
        INTEGER is_verified "Status Verifikasi Panitia (1/0)"
        INTEGER google_linked "Tautan Akun Google SSO (1/0)"
        TEXT google_id "ID Sub Akun Google"
        TEXT google_email "Email Akun Google Terhubung"
        TEXT google_linked_at "Timestamp Tautan SSO"
        TEXT active_device_id "Binding Fingerprint Perangkat"
        TEXT created_at "Waktu Dibuat"
        TEXT updated_at "Waktu Diperbarui"
    }

    exam_sessions {
        TEXT id PK "UUID Sesi Ujian"
        TEXT subject "Mata Pelajaran"
        TEXT title "Judul Lengkap Sesi Ujian"
        TEXT session_group "Kelompok (ATS, AAS, ASAJ, PH, dll)"
        TEXT description "Deskripsi & Petunjuk Pengerjaan"
        INTEGER grade_level "Tingkat Kelas Sasaran"
        INTEGER is_active "Status Sesi Aktif (1/0)"
        INTEGER is_archived "Status Bank Soal / Arsip (1/0)"
        TEXT gform_base_url "URL Formulir Soal Google Form"
        TEXT respon_base_url "URL Spreadsheet Respon Jawaban"
        TEXT exam_token "Token Masuk Ujian"
        TEXT finish_token "Token Selesai Ujian"
        TEXT start_time "Waktu Mulai Ujian"
        TEXT end_time "Waktu Berakhir Ujian"
        INTEGER duration_minutes "Durasi Pengerjaan (Menit)"
        TEXT created_at "Waktu Dibuat"
        TEXT updated_at "Waktu Diperbarui"
    }

    student_attempts {
        TEXT id PK "UUID Rekaman Pengerjaan"
        TEXT student_id FK "ID Peserta (users.id)"
        TEXT student_name "Snapshot Nama Peserta"
        TEXT student_nisn "Snapshot NISN Peserta"
        TEXT student_kelas "Snapshot Kelas Peserta"
        INTEGER student_tingkat "Snapshot Tingkat Peserta"
        TEXT exam_session_id FK "ID Sesi Ujian (exam_sessions.id)"
        TEXT exam_title "Snapshot Judul Ujian"
        TEXT status "IN_PROGRESS | COMPLETED | LOCKED | RESET_BY_PROCTOR | UNLOCKED"
        INTEGER violation_count "Akumulasi Pelanggaran"
        INTEGER time_spent_seconds "Waktu Pengerjaan Berjalan (Detik)"
        TEXT last_violation_reason "Alasan Pelanggaran Terakhir"
        INTEGER ping_latency_ms "Latensi Jaringan Klien (ms)"
        TEXT last_ping_at "Timestamp Ping Terakhir"
        TEXT started_at "Waktu Mulai Ujian"
        TEXT completed_at "Waktu Selesai Ujian"
        TEXT reset_at "Waktu Reset Pengawas"
        TEXT unlocked_at "Waktu Buka Kunci Pengawas"
        TEXT updated_at "Waktu Update Terakhir"
        INTEGER is_proctor_action "Flag Aksi Pengawas (1/0)"
        INTEGER is_reset_violations "Flag Reset Pelanggaran (1/0)"
    }

    exam_attendance {
        TEXT id PK "UUID Presensi"
        TEXT exam_session_id FK "ID Sesi Ujian (exam_sessions.id)"
        TEXT student_id FK "ID Peserta (users.id)"
        TEXT status "HADIR | SAKIT | IZIN | ALPHA | DISPENSASI"
        TEXT keterangan "Catatan Keterangan Khusus"
        TEXT updated_by "Pengubah Terakhir (Proktor/Admin)"
        TEXT updated_at "Timestamp Terakhir"
    }

    berita_acara_config {
        TEXT id PK "singleton"
        TEXT instansi_pusat "Kementerian / Dinas Naungan"
        TEXT alamat "Alamat Lengkap Instansi"
        TEXT kepala_sekolah_nama "Nama Kepala Sekolah"
        TEXT kepala_sekolah_nip "NIP Kepala Sekolah"
        TEXT proktor_nama "Nama Proktor Pelaksana"
        TEXT proktor_nip "NIP Proktor Pelaksana"
        TEXT pengawas_nama "Nama Pengawas Ruang"
        TEXT pengawas_nip "NIP Pengawas Ruang"
        TEXT catatan_pelaksanaan "Catatan Kejadian Khusus Pelaksanaan"
        TEXT paper_size "A4 | F4 | LETTER"
        TEXT margin_preset "standard | compact | narrow | custom"
        INTEGER margin_top "Margin Atas (mm)"
        INTEGER margin_right "Margin Kanan (mm)"
        INTEGER margin_bottom "Margin Bawah (mm)"
        INTEGER margin_left "Margin Kiri (mm)"
        TEXT updated_at "Timestamp Update"
    }

    app_mode_config {
        TEXT id PK "singleton"
        TEXT app_mode "production | simulation"
        INTEGER bypass_gps "Bypass GPS (Hanya Simulasi)"
        INTEGER bypass_media "Bypass Kamera (Hanya Simulasi)"
        INTEGER bypass_audio "Bypass Audio (Hanya Simulasi)"
        INTEGER bypass_notifications "Bypass Notifikasi (Hanya Simulasi)"
        INTEGER bypass_fullscreen "Bypass Fullscreen (Hanya Simulasi)"
        INTEGER bypass_cookies_check "Bypass Cookies (Hanya Simulasi)"
        INTEGER bypass_google_sso "Bypass SSO (Hanya Simulasi)"
        REAL mock_gps_lat "Latitude Simulasi"
        REAL mock_gps_lng "Longitude Simulasi"
        TEXT signature "Tanda Tangan Integritas Kernel"
        TEXT updated_at "Timestamp Update"
    }

    system_error_logs {
        TEXT id PK "UUID Log"
        TEXT timestamp "Waktu Terjadi Error"
        TEXT source "Sumber Error (GPS, Kamera, Auth, dll)"
        TEXT level "error | warning | info"
        TEXT message "Pesan Kesalahan Ringkas"
        TEXT details "Rincian Teknis / Stack Trace"
        TEXT solution "Saran Solusi Penanganan"
        TEXT user_agent "Identitas Browser / Perangkat Klien"
    }

    users ||--o{ student_attempts : "CASCADE ON DELETE / ON UPDATE"
    exam_sessions ||--o{ student_attempts : "CASCADE ON DELETE / ON UPDATE"
    users ||--o{ exam_attendance : "CASCADE ON DELETE / ON UPDATE"
    exam_sessions ||--o{ exam_attendance : "CASCADE ON DELETE / ON UPDATE"
```

---

### 2. Rincian Hubungan Relasional (Foreign Keys & Cascade)

Sistem database ExamGuard menerapkan prinsip **Strict Referential Integrity**:

1. **Relasi `users` $\rightarrow$ `student_attempts`:**
   - **Kunci:** `student_attempts.student_id` merujuk ke `users.id`.
   - **Klausul:** `ON DELETE CASCADE ON UPDATE CASCADE`.
   - **Dampak:** Saat peserta ujian dihapus dari sistem (baik satu per satu maupun saat tombol *Kosongkan Peserta* ditekan), seluruh riwayat pengerjaan, counter pelanggaran, dan status ujian peserta tersebut **otomatis terhapus bersih dari disk**. Tidak akan pernah ada data hantu (*ghost/orphan attempt*) yang tertinggal di tabel pengawasan proktor.
2. **Relasi `exam_sessions` $\rightarrow$ `student_attempts`:**
   - **Kunci:** `student_attempts.exam_session_id` merujuk ke `exam_sessions.id`.
   - **Klausul:** `ON DELETE CASCADE ON UPDATE CASCADE`.
   - **Dampak:** Menghapus suatu sesi ujian atau bank soal akan langsung menghapus seluruh log pengerjaan yang terikat pada ujian tersebut secara atomik.
3. **Relasi `users` & `exam_sessions` $\rightarrow$ `exam_attendance`:**
   - **Kunci:** `exam_attendance.student_id` $\rightarrow$ `users.id` dan `exam_attendance.exam_session_id` $\rightarrow$ `exam_sessions.id`.
   - **Klausul:** `ON DELETE CASCADE ON UPDATE CASCADE`.
   - **Unique Constraint:** `UNIQUE(exam_session_id, student_id)` menjamin seorang siswa hanya memiliki 1 baris presensi per sesi ujian.
4. **Indeks Performa Tinggi:**
   - Indeks unik majemuk `idx_attempts_unique` pada `(student_id, exam_session_id)` memastikan operasi upsert pengerjaan berlangsung instan dalam skala waktu $O(1)$.
   - Indeks pencarian pada `users(role)`, `users(nisn)`, `users(username)`, dan `system_error_logs(timestamp DESC)`.

---

### 3. Keunggulan Arsitektur SQLite + WebSocket Dibandingkan File JSON Lama

| Parameter | Arsitektur Lama (File JSON + `localStorage`) | Arsitektur Baru (SQLite + WebSocket Push) |
| :--- | :--- | :--- |
| **Penyimpanan Utama** | File teks `.examguard-db.json` ditimpa seluruhnya | File database biner terindeks `examguard.db` |
| **Integritas Relasional** | Logika manual JS (rentan data hantu jika terlewat) | **Engine-Level `ON DELETE CASCADE` 100% Akurat** |
| **Keamanan Transaksi** | Tidak ada (risiko file rusak jika server mati mendadak) | **Penuh (ACID Transactions dengan Write-Ahead Log / WAL)** |
| **Mekanisme Sinkronisasi** | Polling HTTP setiap 700ms (beban CPU & lag) | **WebSocket Push Server (< 10 milidetik ke seluruh HP/laptop)** |
| **Masalah Concurrency** | Race condition (request siswa saling menimpa data) | **Row-Level Locking & Atomic Upsert (Thread-Safe)** |
| **Pembersihan Data** | Data sering kembali lagi saat browser direfresh | **Single Source of Truth mutlak di file database SQLite** |

---

### 4. REST API Endpoint SQLite (`/api/db/*`)

Vite development server menyediakan REST API terpadu yang mengeksekusi *prepared statements* SQLite secara aman dari SQL Injection:

* `GET /api/db/snapshot` &mdash; Mengambil snapshot seluruh entitas sistem secara instan saat inisialisasi aplikasi.
* `GET | POST | PUT /api/db/institution` &mdash; Pengaturan profil sekolah, GPS geofence, dan integrasi Google.
* `GET | POST /api/db/users` &mdash; Pengambilan daftar pengguna dan pendaftaran peserta baru.
* `PUT /api/db/users/:id/*` &mdash; Aksi toggle aktif, verifikasi, reset perangkat, reset password, dan reset Google SSO.
* `DELETE /api/db/users/:id` &mdash; Hapus akun peserta (memicu *cascade delete* ke attempts dan attendance).
* `DELETE /api/db/users/delete-all-students` &mdash; Mengosongkan seluruh peserta ujian secara massal.
* `POST /api/db/users/import` &mdash; Validasi pra-impor anti-duplikasi dan import massal berkecepatan tinggi dalam satu transaksi database (`db.transaction`).
* `GET | POST | PUT | DELETE /api/db/exam-sessions` &mdash; Manajemen sesi ujian aktif dan pengarsipan bank soal.
* `GET | POST /api/db/attempts` &mdash; Pemantauan pengerjaan ujian real-time dan perekaman pelanggaran.
* `PUT /api/db/attempts/:studentId/:examId/*` &mdash; Kontrol pengawas: *unlock*, *reset-violations*, *reset-work*, *complete*, *update-time*, *ping*.
* `POST /api/db/attempts/bulk` &mdash; Aksi kontrol pengawas massal (reset, selesaikan, atau hapus attempt per rombel).
* `GET | POST | DELETE /api/db/attendance` &mdash; Presensi kehadiran peserta ujian per mapel.
* `GET | POST /api/db/berita-acara` &mdash; Konfigurasi kop berita acara ujian dan pengaturan margin cetak PDF/kertas.
* `GET | POST /api/db/app-mode` &mdash; Penegakan mode produksi resmi vs mode simulasi dengan validasi signature kernel.
* `GET | POST | DELETE /api/db/logs` &mdash; Audit trail dan log diagnosa kesalahan sistem.
* `GET /api/db/backup` & `POST /api/db/restore` &mdash; Fasilitas pencadangan dan pemulihan penuh seluruh basis data.

---

## 🛡️ Keamanan, Validasi & Integritas Ujian

### 1. Kiosk Lockdown Engine
* **Fullscreen Enforcer:** Siswa wajib berada dalam mode layar penuh. Jika keluar dari mode fullscreen, layar terkunci dan sistem mencatat pelanggaran.
* **Focus & Tab Switch Detection:** Event `visibilitychange` dan `window.blur` memantau apakah siswa berpindah tab atau membuka aplikasi split-screen.
* **Pencegahan Tombol Pintasan:** Memblokir kombinasi tombol berbahaya seperti `Alt+Tab`, `Windows Key`, `Ctrl+W`, `Ctrl+C`, `Ctrl+V`, `F11`, `F12` (Inspect Element), serta klik kanan.

### 2. Validasi 3 Kunci Anti-Duplikasi (No Ujian, NISN, NIS)
* **Pada Formulir Tambah & Edit Siswa:** Kolom No. Ujian, NISN, dan NIS memiliki validasi reaktif. Jika ditemukan kesamaan dengan siswa lain, sistem langsung mengunci tombol simpan dan menampilkan nama serta kelas pemilik data asli.
* **Pada Import Massal (CSV / Excel):** Sistem menjalankan audit mendalam sebelum data masuk ke sistem. Jika terdapat data ganda (baik bentrok dengan data yang sudah ada di sekolah maupun antar-baris dalam file import itu sendiri), proses import dibatalkan secara aman dan sistem memunculkan tabel rincian kesalahan lengkap dengan nomor barisnya.

### 3. Keamanan Perangkat & Akun
* **One-Device Lock (Kunci Perangkat):** Akun peserta diikat ke satu perangkat melalui fingerprint `device_id`. Siswa tidak dapat login di perangkat lain secara bersamaan kecuali login perangkat direset oleh proktor.
* **Google SSO Security Auto-Reset:** Jika admin atau proktor memperbarui alamat email siswa di dashboard, tautan SSO Google siswa otomatis diputus (*status OFF*) demi mencegah potensi pembajakan akun.

---

## 📈 Skalabilitas & Panduan Pelaksanaan 700+ Peserta

ExamGuard **sangat aman dan sanggup melayani 700 peserta sekaligus**, karena beban komputasi berat (kuis soal, gambar, dan submit ratusan jawaban) ditangani oleh infrastruktur Google Forms.

Namun, untuk memastikan kelancaran ujian massal di lapangan, perhatikan panduan infrastruktur berikut:

### 1. Titik Kritis Jaringan (*Network Bottlenecks*) & Solusinya
* **Kapasitas Access Point Wi-Fi:** 1 router Wi-Fi standar hanya mampu menampung 30–50 HP. Untuk 700 siswa (~20 ruang kelas), pastikan tiap ruang kelas memiliki Access Point terpisah, atau izinkan siswa menggunakan kuota internet seluler (4G/5G).
* **Efek Stampede Login Serentak:** Hindari 700 siswa membuka aplikasi pada detik yang persis sama. Bagi waktu mulai login per tingkatan kelas dengan selisih 2–3 menit (misal: Kelas 12 pukul 07:45, Kelas 11 pukul 07:48, Kelas 10 pukul 07:51).

### 2. Perbandingan Dua Skenario Penerapan Terbaik

| Parameter | Skenario A: Web Hosting cPanel + Cloudflare (Sangat Direkomendasikan) | Skenario B: Mode Jaringan Lokal Offline (LAN) |
| :--- | :--- | :--- |
| **Bentuk Penerapan** | Diunggah ke cPanel domain sekolah (misal: `cbt.sekolah.sch.id`) dengan CDN gratis Cloudflare. | Komputer/Laptop bertindak sebagai server lokal di jaringan LAN sekolah. |
| **Koneksi Siswa** | Siswa fleksibel menggunakan Wi-Fi sekolah maupun kuota internet HP pribadi. | Siswa wajib terhubung ke Wi-Fi / kabel LAN sekolah yang sama dengan proktor. |
| **Model Pengawasan** | 1 Super Admin & beberapa Proktor dapat memantau 700 siswa secara terpusat dari mana saja. | **Model Terdistribusi:** Bagi per proktor per ruangan (1 Laptop Proktor melayani 30–60 siswa di ruangannya). |
| **Kestabilan** | **Sangat Tinggi (99.9%)**, file statis dilayani oleh edge server CDN Cloudflare. | **Tinggi**, asalkan kapasitas Access Point Wi-Fi di tiap ruang kelas memadai. |

---

---

## 💻 Prasyarat Sistem

Sebelum memulai instalasi, pastikan sistem komputer Anda telah memenuhi prasyarat berikut:

| Komponen | Kebutuhan Minimum | Rekomendasi |
| :--- | :--- | :--- |
| **Node.js** | Versi 18.x LTS | **Versi 20.x atau 22.x LTS** |
| **NPM** | Versi 9.x | **Versi 10.x+** (bawaan Node.js) |
| **Browser** | Google Chrome 100+ / Edge 100+ | **Google Chrome Terbaru** (Dukungan API Sensor Terbaik) |
| **Koneksi Internet** | Diperlukan saat `npm install` dan memuat peta OpenStreetMap |
| **Hosting Target** | Apache / LiteSpeed dengan dukungan `.htaccess` & SSL (HTTPS) |

Periksa versi Node.js & NPM Anda melalui terminal:
```bash
node -v
npm -v
```

---

## 🚀 Panduan Instalasi Lokal (Mode Pengembang)

Ikuti langkah-langkah di bawah ini untuk menjalankan ExamGuard di komputer lokal Anda:

### 1. Kloning Repository atau Unduh Sumber Kode
Jika menggunakan Git:
```bash
git clone https://github.com/chriz27/examguard.git
cd examguard
```
Atau jika menggunakan Laragon / XAMPP, letakkan folder proyek di direktori web server Anda (misal `d:\laragon\www\examguard`).

### 2. Instalasi Paket Dependensi
Jalankan perintah instalasi paket modul Node (termasuk engine **SQLite `better-sqlite3`** dan **WebSocket `ws`**):
```bash
npm install
```
*Atau di Windows, Anda cukup klik ganda file:* **`install-sqlite.bat`**

> [!TIP]
> **Pengguna Windows PowerShell:** Jika muncul error eksekusi skrip (*PSSecurityException*), gunakan perintah `npm.cmd install` atau jalankan `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` di PowerShell Administrator.

### 3. Menjalankan Local Development Server
Jalankan server pengembangan berbasis Vite:
```bash
npm run dev
```

Saat pertama kali dijalankan, server Node.js akan otomatis:
1. Menginisialisasi basis data SQLite baru: **`examguard.db`** (dengan skema 8 tabel relasional).
2. Melakukan **migrasi otomatis** data dari `.examguard-db.json` (jika tersedia).
3. Mengaktifkan **WebSocket Server** di port `5174` untuk push data real-time ke semua perangkat.

Agar aplikasi dapat diakses oleh perangkat lain dalam satu jaringan WiFi/LAN yang sama (misalnya untuk pengawasan langsung dari HP siswa):
```bash
npm run dev -- --host 0.0.0.0
```

### 4. Buka Aplikasi di Browser
Buka peramban web dan arahkan ke alamat yang tampil di terminal:
- Akses Lokal: **[http://localhost:5173](http://localhost:5173)**
- Akses Jaringan LAN: `http://[IP-Komputer-Anda]:5173`
- Endpoint REST API SQLite: `http://localhost:5173/api/db/*`
- Endpoint WebSocket Real-Time: `ws://localhost:5174`

### 5. Verifikasi Integritas & Perintah Database Berguna
ExamGuard dilengkapi dengan suite pengujian otomatis dan skrip pengelolaan database:

```bash
# 1. Jalankan 30+ Integration Test SQLite (Validasi Relasi, FK Cascade, & CRUD)
npm run test:db

# 2. Reset database dari nol (membersihkan file examguard.db)
npm run db:reset

# 3. Migrasi manual ulang dari file backup .examguard-db.json
npm run db:migrate
```

---

## 🌐 Panduan Instalasi & Deployment ke cPanel

ExamGuard telah dirancang dengan arsitektur **cPanel-Ready** (menggunakan *relative path* `./` dan file `.htaccess` bawaan untuk mengatasi masalah refresh 404 pada Single Page Application).

```mermaid
flowchart LR
    A["npm run build"] --> B["Folder dist/"]
    B --> C["Kompres ke .ZIP"]
    C --> D["Upload File Manager cPanel"]
    D --> E["Extract di public_html"]
    E --> F["Aktifkan SSL / HTTPS"]
```

### Langkah 1: Buat Bundel Produksi (Build)
Jalankan perintah build pada terminal proyek Anda:
```bash
npm run build
```
Vite akan mengompilasi kode sumber ke dalam folder `dist/` dalam hitungan detik.

### Langkah 2: Siapkan File Arsip (.ZIP)
Kompres seluruh isi di dalam folder `dist/` menjadi file ZIP (misal: `examguard-cpanel-ready.zip`).

> [!IMPORTANT]
> Pastikan file `.htaccess` yang ada di dalam `dist/` ikut terkompres ke dalam file ZIP.

### Langkah 3: Unggah ke cPanel File Manager
1. Masuk ke dashboard **cPanel** hosting sekolah Anda.
2. Buka menu **File Manager**.
3. Masuk ke direktori target:
   - Jika untuk domain utama: buka folder `public_html/`.
   - Jika untuk subdomain (misal `ujian.sekolah.sch.id`): buka folder document root subdomain tersebut (contoh: `public_html/ujian/`).
4. Klik tombol **Upload** di menu atas cPanel, lalu pilih file `examguard-cpanel-ready.zip`.

### Langkah 4: Ekstrak File ZIP di Server
1. Klik kanan pada file ZIP yang baru diunggah di File Manager cPanel, lalu pilih **Extract** (Ekstrak di direktori aktif).
2. Hapus file ZIP setelah diekstrak untuk menghemat ruang penyimpanan hosting.
3. Pastikan struktur file terlihat seperti ini di folder root domain Anda:
   ```text
   public_html/ (atau folder subdomain)
   ├── assets/
   │   ├── index-[hash].css
   │   └── index-[hash].js
   ├── .htaccess
   ├── favicon.ico
   └── index.html
   ```

> [!TIP]
> **Jika file `.htaccess` tidak terlihat di File Manager cPanel:**  
> Klik tombol **Settings** di pojok kanan atas File Manager cPanel, lalu centang opsi **"Show Hidden Files (dotfiles)"** dan klik **Save**.

### Langkah 5: Pastikan SSL (HTTPS) Aktif
Fitur **Geolocation GPS**, **Fullscreen API**, dan **Pembersih Clipboard** mewajibkan protokol aman **HTTPS**:
1. Pastikan fitur **AutoSSL / Let's Encrypt** telah berstatus aktif di cPanel untuk domain/subdomain ujian.
2. File `.htaccess` ExamGuard sudah secara otomatis mengalihkan seluruh lalu lintas HTTP ke HTTPS (*Force HTTPS*).

---

## 🔑 Kredensial Akun Demo Pengujian

Aplikasi telah terisi dengan data bawaan (*seed database*) untuk memudahkan pengujian seluruh fitur dan skenario:

| Peran (Role) | Username / NISN | Password Default | Nomor Ujian | Keterangan & Hak Akses |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin` | `-` | **Akses Penuh:** Kelola Instansi, Akun Admin, Bank Soal, Sesi Ujian, & Monitoring |
| **Proktor Ujian** | `proktor` | `proktor` | `-` | **Operasional Ujian:** Monitoring Siswa Live, Bank Sesi, Reset Password/SSO Siswa |
| **Siswa 1** | `0058291021` | `22101` (NIS) | `UJN-12-001` | Ahmad Fauzi Ridwan (XII MIPA 1) • **Terverifikasi**, **SSO Google On** |
| **Siswa 2** | `0058291022` | `22102` (NIS) | `UJN-12-002` | Siti Rahmawati Putri (XII MIPA 2) • **Terverifikasi**, **SSO Google Off** |
| **Siswa 3** | `0068291033` | `23101` (NIS) | `UJN-11-001` | Bambang Pamungkas (XI IPS 1) • **Terverifikasi**, **SSO Google Off** |

> [!NOTE]
> - **Aturan Default Kredensial Siswa:** `Username` = **NISN**, `Password` = **NIS**.
> - Jika akun siswa telah terhubung dengan **Google SSO**, siswa wajib masuk menggunakan tombol **Masuk dengan Google**. Siswa dapat meminta reset SSO ke Super Admin/Proktor jika ingin kembali menggunakan login NISN/NIS biasa.

---

## 👥 Alur & Hak Akses Administrator

ExamGuard membedakan wewenang administrator menjadi dua tingkatan:

```text
┌─────────────────────────────────────────────────────────────┐
│                       SUPER ADMIN                           │
│  (Akses Penuh: Pengaturan Instansi, GForm, Akun, Database)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
     [Pengaturan Instansi &          [Operasional Pengawasan]
      Akun Administrator]                      │
      (Khusus Super Admin)                     ▼
                               ┌──────────────────────────────┐
                               │        PROKTOR UJIAN         │
                               │ • Ringkasan & Metrik         │
                               │ • Bank Sesi Ujian GForm      │
                               │ • Papan Kontrol Pengawas Live│
                               │ • Basis Data Siswa & Reset   │
                               └──────────────────────────────┘
```

1. **Super Admin:**
   - Mengatur identitas instansi (nama sekolah, jenjang SD/SMP/SMA, logo).
   - Mengatur koordinat GPS Geofencing, radius toleransi, dan peta interaktif.
   - Mengatur integrasi Google Workspace SSO Client ID dan Google reCAPTCHA v2.
   - Mengubah kata sandi Super Admin dan akun Proktor Ujian.
2. **Proktor Ujian:**
   - Memantau aktivitas pengerjaan siswa secara langsung (*Live Monitoring*).
   - Melakukan aksi *Unlock* siswa terkunci akibat pelanggaran.
   - Melakukan *Reset Login* perangkat siswa.
   - Mereset password akun siswa ke default NIS dan mereset status Google SSO jika siswa mengalami kendala akun.
   - Menu *Pengaturan Instansi* dan *Akun Administrator* otomatis **disembunyikan** dari sidebar Proktor.

---

## 📁 Struktur Folder Proyek

```text
examguard/
├── examguard.db                       # Database SQLite utama (Single Source of Truth, WAL mode)
├── examguard.db-wal                   # Write-Ahead Log SQLite untuk konkurensi tulis tinggi
├── install-sqlite.bat                 # Skrip instalasi dependensi otomatis (klik ganda)
├── SQLITE-MIGRATION.md                # Dokumentasi teknis & panduan operasional SQLite
├── dist/                              # Output build siap hosting cPanel
│   ├── assets/                        # Bundle JS & CSS ter-hash
│   ├── .htaccess                      # Aturan SPA routing & Force HTTPS
│   └── index.html                     # Entry point HTML produksi
├── public/
│   ├── .htaccess                      # Konfigurasi Apache bawaan
│   └── favicon.ico                    # Favicon aplikasi
├── server/                            # Backend Engine Server (Node.js)
│   ├── db.cjs                         # SQLite Engine: Skema DDL, Foreign Keys, & CRUD API
│   └── test-db.cjs                    # 30+ Integration Test SQLite Engine (npm run test:db)
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminSidebar.jsx       # Navigasi panel admin dengan filter role
│   │   └── common/
│   │       ├── ConfirmModal.jsx       # Modal konfirmasi kustom modern
│   │       └── NotificationToast.jsx  # Toast notifikasi kustom modern
│   ├── constants/
│   │   └── educationConfig.js         # Konfigurasi jenjang, Haversine GPS, helper
│   ├── hooks/
│   │   └── useDatabase.js             # React Hooks real-time (useSnapshot, useUsers, useAttempts)
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx     # Dashboard terpadu Super Admin & Proktor
│   │   ├── auth/
│   │   │   └── LoginPortal.jsx        # Gerbang login multi-peran & SSO
│   │   └── student/
│   │       └── StudentPortal.jsx      # Pre-flight check, beranda, & ujian GForm
│   ├── services/
│   │   ├── dbService.js               # REST API client & WebSocket client real-time
│   │   └── storageService.js          # Adapter backward-compatible ke dbService
│   ├── App.jsx                        # Komponen root aplikasi & router
│   ├── index.css                      # Konfigurasi Tailwind CSS v4 & styling font
│   └── main.jsx                       # Entry point React DOM
├── examguard-cpanel-ready.zip         # Arsip siap deploy ke cPanel
├── package.json                       # Dependensi (React, Vite, better-sqlite3, ws)
├── vite.config.js                     # Vite Config + Plugin SQLite & WebSocket Server
└── README.md                          # Panduan dokumentasi lengkap ini
```

---

## ⚙️ Konfigurasi Tambahan

### 1. Konfigurasi Google Workspace SSO (Mode Produksi Resmi)
Untuk mengaktifkan autentikasi akun Google sekolah (@sekolah.sch.id):
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru $\rightarrow$ Buka menu **APIs & Services** $\rightarrow$ **Credentials**.
3. Buat **OAuth 2.0 Client IDs** (Web Application).
4. Tambahkan domain sekolah Anda ke dalam **Authorized JavaScript origins** (misal: `https://ujian.sekolah.sch.id` atau `http://localhost:5173`).
5. Salin **Client ID** yang diperoleh, lalu masuk ke ExamGuard sebagai Super Admin $\rightarrow$ Tab **Pengaturan Instansi** $\rightarrow$ Masukkan Client ID pada formulir Google OAuth.
6. Klik tombol **Test Koneksi & Aktifkan**. Begitu terverifikasi, status otomatis beralih ke **AKTIF (ON)**.
> **Catatan Keamanan:** Jika Google OAuth belum dikonfigurasi atau di-reset, tombol SSO pada portal login otomatis **tersembunyi (hidden)** dan seluruh peserta wajib login menggunakan nomor **Nomor Ujian / NISN** dan **Password NIS**.

### 2. Konfigurasi Google reCAPTCHA (v2 Checkbox & v3 Invisible)
ExamGuard mendukung 2 mode API resmi Google reCAPTCHA dan sistem Captcha Mandiri Default:
1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2. Daftarkan domain sekolah dengan memilih salah satu tipe:
   - **reCAPTCHA v2 ("I'm not a robot" Checkbox):** Menampilkan kotak centang interaktif yang wajib diselesaikan siswa.
   - **reCAPTCHA v3 (Score-based Invisible):** Verifikasi latar belakang otomatis tanpa mengganggu alur pengerjaan siswa.
3. Masukkan **Site Key** dan **Secret Key** ke tab **Pengaturan Instansi** di ExamGuard, pilih versi yang sesuai (v2 atau v3), lalu klik **Test Koneksi & Aktifkan**.
> **Proteksi Captcha Mandiri (Default):** Jika Google reCAPTCHA belum diset (kosong) atau aplikasi dijalankan pada jaringan tertutup (*offline LAN*), sistem secara otomatis mengaktifkan **Captcha Keamanan Mandiri ExamGuard (Default)** berbasis *visual canvas anti-bot* 5 karakter. Dengan demikian, portal login tetap 100% terlindungi dari serangan *brute-force* bot tanpa bergantung pada koneksi internet luar.

---

## 🛠️ Pemecahan Masalah (Troubleshooting)

| Gejala Masalah | Kemungkinan Penyebab | Langkah Solusi |
| :--- | :--- | :--- |
| **Port 5173 already in use** | Port 5173 sedang dipakai oleh aplikasi lain | Jalankan Vite pada port alternatif: `npm run dev -- --port 5175` |
| **Gagal Memuat SQLite Engine (`better-sqlite3`)** | Dependensi native belum terinstal | Jalankan `npm install` atau klik ganda `install-sqlite.bat` di root direktori proyek. |
| **WebSocket Port 5174 Conflict** | Port 5174 dipakai oleh servis latar belakang lain | Tutup proses yang menggunakan port 5174 atau sesuaikan `WS_PORT` pada `vite.config.js` dan `dbService.js`. |
| **Error 404 saat Refresh di cPanel** | File `.htaccess` belum terunggah atau `mod_rewrite` nonaktif | Pastikan file `.htaccess` berada di folder yang sama dengan `index.html` dan opsi *Show Hidden Files* aktif di cPanel. |
| **Izin Geolocation / GPS Gagal** | Situs dibuka tanpa protokol HTTPS | Akses situs melalui `https://` bukan `http://`. Browser memblokir API sensor pada koneksi non-HTTPS. |
| **Mode Layar Penuh Ditolak** | Pemicuan Fullscreen tanpa interaksi klik | Pastikan siswa mengklik tombol "Buka Soal & Fullscreen". Browser modern melarang otomatisasi fullscreen tanpa klik pengguna. |
| **Peta Leaflet Tidak Muncul / Abu-abu** | Koneksi internet lambat atau kontainer peta belum render | Pastikan perangkat terhubung ke internet untuk memuat tile OpenStreetMap. Peta akan otomatis menyesuaikan ukuran kontainer. |
| **Siswa Terkunci di Perangkat Lama** | Siswa berpindah HP/Laptop tanpa logout | Minta Proktor membuka menu *Kontrol Pengawas* atau *Manajemen Siswa*, lalu klik tombol **Reset Login** pada siswa tersebut. |
| **PSSecurityException di Windows** | PowerShell membatasi eksekusi skrip lokal | Gunakan `npm.cmd [perintah]` atau jalankan perintah PowerShell: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |

---

## 📄 Lisensi & Repositori

ExamGuard dirilis di bawah lisensi [MIT](LICENSE). Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan instansi pendidikan, sekolah, maupun pelatihan mandiri.

* **Repositori Resmi:** [https://github.com/chriz27/examguard](https://github.com/chriz27/examguard)
* **Author / Maintainer:** [chriz27](https://github.com/chriz27)
