# 🛡️ ExamGuard v1.3.0 - Enterprise Exam Browser & Proctoring System

<div align="center">

[![Versi](https://img.shields.io/badge/Versi-1.3.0_Production_Ready-emerald?style=for-the-badge&logo=shield)](https://github.com/chriz27/examguard/releases)
[![Unduh Paket cPanel](https://img.shields.io/badge/📥_Download-cPanel_ZIP_(v1.3.0)-blue?style=for-the-badge&logo=archive)](https://github.com/chriz27/examguard/releases/download/v1.3.0/examguard-v1.3.0-cpanel.zip)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v4_HEX_Safe-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-8.0+_PDO_SQLite-777BB4?style=for-the-badge&logo=php)](https://php.net)
[![Database](https://img.shields.io/badge/SQLite-Zero_Config_WAL-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**Sistem Pengawasan & Pengamanan Asesmen Digital Modern Terstandar untuk Google Forms.**

*Tanpa perlu unduh instal aplikasi dari Play Store atau App Store — langsung berjalan aman, responsif, dan terkunci di seluruh peramban.*  
*(✅ Chrome Android, ✅ Chrome / Edge Desktop, ⚠ Safari iOS)*

---

### 👨‍💻 Tim Pengembang
Dikembangkan dengan penuh dedikasi oleh **Fandi dari Jawa tech**  
Untuk kemajuan ekosistem asesmen digital sekolah, madrasah, dan instansi pendidikan di seluruh Indonesia.

<div align="center" style="margin-top: 10px;">

[![Dukung Developer via Saweria](https://img.shields.io/badge/☕_Dukung_Developer-Saweria-FFA500?style=for-the-badge&logo=kofi&logoColor=white)](https://saweria.co/chriz27)

</div>

</div>

---

## 📥 Berkas Unduhan Rilis Siap Pakai (cPanel Package)

Bagi pengguna hosting **cPanel**, gunakan berkas paket kompilasi mandiri di bawah ini yang telah memuat seluruh folder `dist/`, berkas meta `manifest.json`, konfigurasi `.htaccess`, dan skrip backend `api/`:

| Versi Rilis | Berkas Paket ZIP cPanel | Tautan Unduh Langsung | Status |
| :--- | :--- | :--- | :--- |
| **v1.3.0 (Terbaru)** | `examguard-v1.3.0-cpanel.zip` | [**Unduh examguard-v1.3.0-cpanel.zip**](https://github.com/chriz27/examguard/releases/download/v1.3.0/examguard-v1.3.0-cpanel.zip) | 🟢 **Sangat Disarankan (Production)** |
| **v1.2.2** | `examguard-v1.2.2-cpanel.zip` | [**Unduh examguard-v1.2.2-cpanel.zip**](https://github.com/chriz27/examguard/releases/download/v1.2.2/examguard-v1.2.2-cpanel.zip) | ⚪ Arsip Rilis Stabil |

> [!WARNING]
> **PENTING UNTUK PENGGUNA CPANEL:** Jangan mengunggah berkas ZIP *Source Code* mentah bawaan GitHub Releases (`Source code.zip`) karena berkas tersebut belum dikompilasi oleh Vite/Node.js dan tidak memuat folder aset produksi. **Wajib gunakan berkas rilis kompilasi: `examguard-v1.3.0-cpanel.zip`**.

---

## 💡 Apa Itu ExamGuard & Tujuan Aplikasi

**ExamGuard for Google Forms** adalah platform *Exam Browser* berbasis web modern yang dirancang untuk mengamankan jalannya asesmen atau ujian daring dengan Google Formulir. Siswa mengerjakan soal di dalam lingkungan peramban terkunci (*Kiosk Mode*) yang steril dari berbagai potensi kecurangan.

### 🎯 Tujuan & Latar Belakang Aplikasi
Banyak sekolah dan lembaga pendidikan di Indonesia menyelenggarakan asesmen digital (Ulangan Harian, Asesmen Sumatif/Formatif, Penilaian Akhir Semester, hingga Ujian Sekolah) menggunakan **Google Formulir (Google Forms)** karena kemudahan pembuatan soal dan pengoreksian otomatis. Namun, pelaksanaan ujian melalui Google Form standar memiliki celah kecurangan yang sangat tinggi:
* Peserta dapat dengan mudah membuka tab baru, mencari kunci jawaban di Google atau ChatGPT.
* Soal dan jawaban dapat disalin (*copy-paste*) ke grup perpesanan (WhatsApp/Telegram).
* Terjadi praktik joki ujian di mana akun siswa dikerjakan oleh orang lain dari luar sekolah atau rumah.
* Aplikasi *Exam Browser* berbasis Play Store/App Store sering membebani siswa (memori HP penuh, kendala tipe Android lawas, perizinan rumit, atau butuh biaya lisensi server tinggi).

### 🚀 Visi & Solusi ExamGuard
ExamGuard hadir untuk **mendekatkan teknologi asesmen aman kepada seluruh sekolah tanpa biaya lisensi mahal dan tanpa konfigurasi server yang rumit**. ExamGuard membungkus lembar soal Google Form di dalam lingkungan **Kiosk Sandbox Terkunci** berbasis peramban web modern yang menjamin integritas ujian:

1. **Fullscreen Lock:** Penguncian layar penuh seketika saat ujian dimulai; mendeteksi pergantian tab, split screen, dan shortcut terlarang.
2. **GPS Geofencing Presisi Tinggi:** Validasi radius koordinat berbasis sensor perangkat (hanya bisa login & mengerjakan di area sekolah tertentu).
3. **One-Device Lock:** Kunci satu akun hanya untuk satu perangkat fisik untuk mencegah perjokian atau login ganda.
4. **Penjadwalan Soal & Rilis Token:** Buka dan tutup akses ujian secara otomatis sesuai jadwal waktu mulai dan selesai, disertai rilis token masuk dan token selesai yang terstandar.
5. **Alarm Peringatan Pelanggaran:** Sirine otomatis berbunyi saat terjadi kecurangan ringan, serta layar merah penuh (*Red Screen*) saat akun dikunci.
6. **Google SSO & One Tap:** Otentikasi praktis akun Google Workspace sekolah yang aktif sejak halaman login hingga verifikasi kelayakan sistem.
7. **Google reCAPTCHA & Captcha Mandiri:** Perlindungan gerbang login dari serangan bot otomatis dan percobaan tebak password (*brute force*).
8. **Login Scan Kartu:** Kemudahan login peserta dengan memindai kode QR pada kartu ujian cetak mandiri atau massal.
9. **Multi-Device:** Berjalan mulus di berbagai perangkat siswa (Android, Laptop/PC Desktop, dan iOS Safari) tanpa perlu instal aplikasi tambahan.
10. **Pusat Pembaruan Otomatis (OTA Updater):** Pembaruan sistem 1-Klik langsung dari GitHub dengan garansi perlindungan database 100%.

> [!TIP]
> **Hosting Hemat & Bebas Rumit:** Aplikasi ini dapat dihosting dengan sangat hemat dan mudah di cPanel Shared Hosting biasa tanpa perlu konfigurasi database MySQL terpisah karena ditenagai oleh mesin SQLite bawaan (Zero-Config).

---

## 🏛️ Arsitektur Sistem & Filosofi Desain

ExamGuard dirancang dengan prinsip **Client-First Resilient Architecture** yang mengutamakan kelancaran pengerjaan siswa di lapangan meskipun koneksi jaringan sekolah mengalami fluktuasi (*jitter*):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ARSITEKTUR HYBRID EXAMGUARD                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│  [SISWA / CLIENT BROWSER]                                                       │
│  React 19 + PWA Engine (Local State, Offline Safeguard, Hardware Sensors)       │
│      │                                                                          │
│      ├──► Fullscreen & Visibility Guard (Deteksi Tab & Layar Penuh)             │
│      ├──► Physical GPS Geofencing (Haversine Formula Radius Meter)              │
│      ├──► Device Fingerprint Engine (Penguncian 1 Akun = 1 HP)                  │
│      └──► Web Audio Alarm Context (Sirine Pelanggaran & Alarm Darurat)          │
│                                                                                 │
│  [BACKEND & STORAGE ENGINE]                                                     │
│  • cPanel Mode: PHP 8.0+ Single Entry API (api/index.php) + SQLite PDO (WAL)    │
│  • Local/VPS Mode: Node.js 18+ Express API + SQLite3 + WebSocket Push           │
│  • Database: examguard.db (Zero-Config, Atomic Transactions, Self-Contained)    │
│                                                                                 │
│  [PROCTOR & ADMIN DASHBOARD]                                                    │
│  • Real-time Live Monitoring Hub (Heartbeat, Baterai, Ping Latensi ms)          │
│  • Remote Proctor Controls (Buka Kunci, Reset Pekerjaan, Reset Perangkat)       │
│  • Broadcast Engine (Pita Berjalan Marquee Running Text Real-time 3x)           │
│  • Auto-OTA Updater (Pembaruan 1-Klik GitHub & Unggah ZIP Verifikasi Meta)      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Zero-Config Database (SQLite PDO & WAL Mode)
Tidak memerlukan pembuatan database MySQL terpisah, tanpa repot konfigurasi `DB_HOST`, `DB_USER`, atau `DB_PASSWORD`. Berkas database SQLite (`examguard.db`) terisolasi aman dengan proteksi file-level dan transaksi atomik, siap menampung ribuan data siswa dan rekaman log pelanggaran.

### 2. Dual-Engine Backend (cPanel PHP & Node.js WebSocket)
* **cPanel Shared Hosting:** Berjalan mulus di hosting hemat dengan PHP 8.0+ via `api/index.php` REST endpoint.
* **VPS / Local Server:** Mendukung engine Node.js + WebSocket untuk sinkronisasi sub-detik yang sangat responsif.

### 3. Anti-Terkunci Permanen & Toleransi Aman
Sistem proctoring ExamGuard membedakan antara pelanggaran sementara (*warning banner/popup*) dan pelanggaran kumulatif berat (*lockout*). Siswa tidak akan kehilangan data formulir yang telah diisi saat layar terkunci karena Google Form berjalan di dalam iframe terisolasi yang terlindungi.

---

## ⚙️ Spesifikasi Teknologi & Status Server

| Komponen / Lapisan | Spesifikasi Teknologi | Keterangan & Peran |
| :--- | :--- | :--- |
| **Versi Rilis** | **ExamGuard v1.3.0 Stable** | Rilis produksi mutakhir dengan Mode Offline/Online Ngrok, hardening keamanan, &amp; perbaikan portal proktor |
| **Frontend Engine** | **React 19 & Vite 6** | Framework Single Page Application (SPA) modern, rendering reaktif, dan HMR ultra-cepat |
| **Styling Framework** | **Tailwind CSS v4.0 (HEX-Safe)** | Desain modern dengan palet standar sRGB HEX untuk kompatibilitas 100% pada Chrome & OS lawas |
| **Backend Runtime** | **cPanel Host (PHP 8.0+ PDO) & Node.js 18+** | Endpoint REST `api/index.php` atau runtime Express + WebSocket untuk LAN/VPS |
| **Database Engine** | **SQLite 3 (WAL Mode & ACID)** | Database berkas mandiri (0ms latensi lokal, zero-setup, atomic commit, dan konkurensi tinggi) |
| **Peta & Geofencing** | **Leaflet & OpenStreetMap** | Validasi radius jarak koordinat presisi tinggi menggunakan rumus Haversine |
| **Dukungan Web Server** | **Apache / LiteSpeed / Nginx / Node.js** | Kompatibel dengan berbagai lingkungan server hosting maupun server mandiri |
| **Protokol Jaringan** | **HTTPS (SSL/TLS Mandatory)** | Mewajibkan enkripsi HTTPS untuk akses sensor GPS, Kamera QR, dan Fullscreen API |
| **Autentikasi & Bot Guard** | **Google GIS (SSO) & reCAPTCHA v2/v3** | Login resmi Google Workspace, One Tap, reCAPTCHA, disertai **Captcha Mandiri Offline** |
| **Sensor Perangkat** | **HTML5 Web APIs** | Geolocation API (GPS), Fullscreen API, Page Visibility API, Battery Status, dan Web Audio API |
| **Sinkronisasi Data** | **Real-time Snapshot &bull; Mode WAL** | Penulisan data simultan dan sinkronisasi berkala tanpa konflik read-write |
| **Status Lisensi** | **The MIT License (Open Community)** | Bebas digunakan, dimodifikasi, dan didistribusikan untuk institusi pendidikan secara permanen |

---

## 🚀 Riwayat Rilis & Pembaruan (Changelog)

### Versi 1.3.0 (Rilis Terbaru - 27 November 2026)
* 🌐 **Mode Offline & Online (Akses Server & Cloud Tunnel):** Kartu kontrol cerdas di Pengaturan Instansi dengan deteksi otomatis 3 mode lingkungan (cPanel Hosting Publik, Cloud Ngrok HTTPS, dan Wi-Fi Lokal).
* 🔒 **Integrasi Cloud Tunneling Ngrok:** Kemudahan online-kan server lokal sekolah dengan enkripsi HTTPS gratis agar izin Kamera, Mikrofon, dan GPS HP siswa aktif 100% tanpa kendala sertifikat SSL.
* 🛡️ **Hardening Keamanan Rahasia (Secrets Masking):** Standar enterprise ISO/IEC 27001 & OWASP ASVS; kredensial rahasia (Google Client Secret, reCAPTCHA Secret Key, dan Ngrok Authtoken) di-masking sehingga tidak pernah bocor ke browser peserta.
* 👨‍🏫 **Perbaikan Autentikasi Proktor:** Validasi password terenkripsi & sinkronisasi multi-role proktor berjalan stabil.
* 🔄 **Reset Password Peserta:** Sinkronisasi instan ke database dan cache penyimpanan lokal.
* 🚪 **Akses Form Admin Tersembunyi:** 7x ketuk logo sekolah untuk membuka formulir login admin; ketukan ke-8 mengunci kembali ke portal siswa.
* 📁 **Accordion Terpadu Pengaturan Google:** Menyatukan 4 sub-bagian (Google OAuth, reCAPTCHA, Google Drive Coming Soon, dan Sheets Coming Soon).
* 📊 **Menu Rekap Nilai:** Penyiapan fondasi menu dan antarmuka untuk fitur auto-sync nilai Google Forms yang direncanakan di v2.0.0.
* 📱 **Modal QR Code Portal Siswa Fleksibel:** Menghasilkan kode QR instan yang membaca tautan publik aktif secara dinamis.
* 💾 **Hardening Database Concurrency:** Konfigurasi `PRAGMA busy_timeout = 5000`, WAL mode, dan penanganan atomic commit tanpa database locking.

### Versi 1.2.2 (23 November 2026)
* 🛠️ **Perbaikan Total Update Sesi Ujian Google Form:** Menerapkan sistem **UPSERT** cerdas pada backend SQLite (`POST /exam-sessions` dan `PUT /exam-sessions/{id}`). Pembaruan URL Google Form, Token Mulai, Token Selesai, Waktu Mulai/Selesai, dan Durasi tersimpan secara persisten tanpa terhambat error *unique constraint*.
* ⚡ **Penguatan Pembaruan 1-Klik Otomatis dari GitHub:** Penanganan otomatis redirect cURL AWS S3 (`objects.githubusercontent.com`) dan verifikasi SSL bundle yang kompatibel dengan server cPanel berstatus `open_basedir`.
* 🛡️ **Proteksi Database 100% Anti-Tertimpa:** Sistem pembaruan (baik 1-Klik maupun manual ZIP) secara ketat memblokir dan membatalkan otomatis jika terdapat berkas `.db` di dalam paket, menjamin data siswa dan nilai ujian tetap aman.
* 🔒 **Fitur Form & Modal Lock:** Mencegah background snapshot polling menimpa data yang sedang aktif diketik pada formulir admin (Pengaturan Instansi, Bank Sesi Ujian, Kontrol Pengawas, dan Manajemen Peserta).
* 📅 **Normalisasi Datetime Form:** Menormalkan format tanggal string ISO ke format standar `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`) sehingga jam ujian lama tidak hilang saat diedit.

### Versi 1.2.1
* ⚡ **Pusat Pembaruan Sistem (OTA Update Hub):** Penambahan antarmuka pembaruan sistem mandiri dengan opsi 1-Klik dari GitHub dan formulir unggah paket rilis ZIP offline.
* 📢 **Fitur Siaran Pengawas (Live Broadcast):** Penambahan pita pengumuman running text real-time 3x putaran.
* ⏱️ **Badge Status Jadwal Soal:** Penandaan otomatis *Berlangsung*, *Akan Datang*, dan *Berakhir* serta auto-sort soal aktif di kontrol pengawas.
* 🧹 **Penyegaran Tampilan Login:** Tata letak login peserta yang bersih dengan dukungan Scan QR Kartu Ujian dan Google SSO.

---

## 🔄 Panduan Pembaruan Aplikasi di cPanel

### 💡 Metode 1: Pembaruan 1-Klik Otomatis dari GitHub (Direkomendasikan)
1. Masuk ke **Panel Admin ExamGuard** Anda menggunakan akun Super Admin (`admin`).
2. Buka menu **"Pusat Pembaruan Sistem"** (atau kartu Tentang Aplikasi).
3. Klik tombol **"Periksa Pembaruan Sekarang"**.
4. Jika versi baru terdeteksi, klik tombol hijau **"⚡ Pasang Pembaruan 1-Klik Otomatis"**.
5. Sistem akan mengunduh paket kompilasi resmi dari GitHub, memverifikasi integritas `manifest.json`, mengekstrak berkas, dan menjalankan migrasi database otomatis.
6. Klik **"Muat Ulang Halaman"**. Selesai! *(Database `examguard.db` dijamin aman 100%)*.

---

### 🛠️ Metode 2: Unggah Berkas ZIP via Panel Admin ExamGuard
1. Unduh berkas paket rilis kompilasi: [**examguard-v1.3.0-cpanel.zip**](https://github.com/chriz27/examguard/releases/download/v1.3.0/examguard-v1.3.0-cpanel.zip).
2. Masuk ke **Panel Admin** &rarr; Buka **Pusat Pembaruan Sistem**.
3. Pada bagian **Offline: Unggah Paket Pembaruan Manual (.ZIP)**, klik **"Pilih Berkas ZIP..."** dan pilih berkas `examguard-v1.3.0-cpanel.zip`.
4. Klik tombol **"🚀 Verifikasi & Pasang Pembaruan"**.
5. Tunggu proses verifikasi manifest dan ekstraksi selesai. Klik Muat Ulang Halaman.

---

### 📂 Metode 3: Unggah Manual via File Manager cPanel
Jika server hosting Anda berada di balik firewall tertutup (*intranet/offline*):
1. Unduh berkas [**examguard-v1.3.0-cpanel.zip**](https://github.com/chriz27/examguard/releases/download/v1.3.0/examguard-v1.3.0-cpanel.zip).
2. Masuk ke **cPanel** &rarr; Buka **File Manager** &rarr; Masuk ke folder web root subdomain Anda (misal `public_html/ujian`).
3. *(Langkah Pencegahan)*: Unduh berkas database `examguard.db` (atau `api/examguard.db`) ke laptop Anda sebagai cadangan.
4. Klik tombol **Upload**, unggah berkas `examguard-v1.3.0-cpanel.zip`.
5. Klik kanan pada berkas zip &rarr; Pilih **Extract**. Berkas kode frontend (`index.html`, `assets/`, `manifest.json`) dan `api/index.php` akan terperbarui tanpa menimpa database.
6. Hapus berkas zip dari server dan lakukan hard-refresh di peramban (**Ctrl + F5**).

---

## 🌐 Panduan Pasang Baru di cPanel (Zero-Config SQLite)

ExamGuard tidak memerlukan pembuatan database MySQL. Ikuti 3 langkah praktis berikut:

### Langkah 1: Siapkan Subdomain di cPanel
1. Masuk ke cPanel hosting sekolah Anda &rarr; Buka menu **Domains** atau **Subdomains**.
2. Buat subdomain baru (contoh: `ujian.sekolah.sch.id`).
3. Catat folder tujuannya (*Document Root*), biasanya otomatis di `public_html/ujian`.

### Langkah 2: Unggah & Ekstrak Berkas Rilis
1. Masuk ke **File Manager** cPanel &rarr; Buka folder `public_html/ujian`.
2. Klik tombol **Upload**, unggah berkas [**examguard-v1.3.0-cpanel.zip**](https://github.com/chriz27/examguard/releases/download/v1.3.0/examguard-v1.3.0-cpanel.zip).
3. Ekstrak berkas tersebut langsung di dalam folder subdomain.

### Langkah 3: Aktifkan Sertifikat SSL (HTTPS)
1. Buka menu **SSL/TLS Status** di cPanel.
2. Centang subdomain ujian Anda, lalu klik **Run AutoSSL**.
3. Selesai! Buka subdomain Anda di peramban: `https://ujian.sekolah.sch.id`.

> [!IMPORTANT]
> **Wajib Protokol HTTPS:** Sensor GPS dan izin Kiosk Layar Penuh modern memerlukan protokol aman HTTPS. Pastikan SSL AutoSSL cPanel sudah berstatus hijau aktif.

---

## 🔑 Kredensial Akun Default

Setelah instalasi selesai, sistem telah terisi akun bawaan:

| Peran Akun | Username | Password Default | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Akses penuh: Pengaturan Instansi, Bank Soal, Akun, Import Siswa, Backup & Restore, OTA Updater |
| **Proktor Ujian** | `proktor` | `proktor` *(atau `proktor123`)* | Khusus pengawasan: Pantau peserta, rilis token, reset pekerjaan, reset perangkat, dan cetak berita acara |
| **Contoh Siswa** | `0068291033` | `23101` *(Nomor NIS)* | Portal peserta untuk mengerjakan ujian |

> [!TIP]
> Demi keamanan, segera perbarui kata sandi Super Admin melalui menu **Akun Administrator** setelah instalasi pertama kali.

---

## 🔐 Integrasi Google OAuth 2.0 (SSO) & reCAPTCHA

Pengaturan integrasi Google dapat dikelola langsung melalui menu **Pengaturan Instansi** (Khusus Super Admin):

### 1. 🔑 Google OAuth 2.0 Client ID (Login Akun Google Siswa)
* Memungkinkan instansi mewajibkan siswa masuk menggunakan akun resmi Google Workspace sekolah (misal `@sekolah.sch.id` atau `@belajar.id`).
* Dapatkan **Client ID** tipe *Web application* melalui [Google Cloud Console](https://console.cloud.google.com/).
* Masukkan URL domain Anda (misal `https://ujian.sekolah.sch.id`) pada kolom **Authorized JavaScript origins**.
* Tempelkan Client ID pada menu Pengaturan Instansi ExamGuard dan aktifkan ceklis izin Google SSO.

### 2. 🛡️ Google reCAPTCHA & Captcha Mandiri Offline
* Dukungan **reCAPTCHA v2 (Checkbox)** dan **reCAPTCHA v3 (Background Score)** untuk mencegah serangan bot.
* **Captcha Mandiri Bawaan:** Jika sekolah tidak ingin menggunakan Google reCAPTCHA atau mengadakan ujian di jaringan intranet/LAN offline, cukup kosongkan kolom Site Key. ExamGuard akan mengaktifkan Captcha 5-karakter lokal secara otomatis tanpa butuh akses internet ke Google.

---

## 💻 Panduan Menjalankan di Komputer Lokal (Pengembang)

```bash
# 1. Kloning repositori & masuk ke direktori proyek
git clone https://github.com/chriz27/examguard.git
cd examguard

# 2. Pasang dependensi Node.js
npm install

# 3. Jalankan server pengembangan Vite
npm run dev
# Buka di peramban: http://localhost:5173

# 4. Jalankan kompilasi siap rilis (Production Build)
npm run build

# 5. Buat paket ZIP cPanel siap pakai
powershell -ExecutionPolicy Bypass -File scripts/make_cpanel_zip.ps1
```

---

## 🛠️ Tanya Jawab & Pemecahan Masalah (FAQ)

### Q: Mengapa saat mengedit soal GForm perubahan tidak tersimpan?
> **Solusi:** Di versi v1.3.0 (dan v1.2.2+), masalah ini telah **diperbaiki secara menyeluruh**. Pastikan Anda telah memperbarui sistem ke v1.3.0 yang menggunakan mekanisme UPSERT SQLite pada endpoint `api/index.php`.

### Q: Mengapa siswa mendapat pesan "Geolocation Denied" saat login?
> **Solusi:** Sensor GPS pada peramban Chrome dan Safari **hanya diizinkan aktif jika website menggunakan protokol aman HTTPS**. Pada v1.3.0, Anda dapat menggunakan fitur **Mode Offline & Online (Ngrok Cloud Tunnel)** untuk mendapatkan koneksi HTTPS instan bagi server lokal/Wi-Fi sekolah.

### Q: Mengapa muncul halaman 404 Not Found saat menekan tombol refresh di browser?
> **Solusi:** Pastikan berkas **`.htaccess`** yang disertakan pada paket rilis sudah terunggah di folder root subdomain cPanel Anda untuk merutekan Single Page Application ke `index.html`.

### Q: Apakah data siswa dan nilai ujian akan hilang saat sistem diperbarui ke versi baru?
> **Solusi:** **Sama sekali tidak hilang.** Database disimpan secara mandiri di berkas `examguard.db`. Sistem pembaruan ExamGuard v1.3.0 dilengkapi proteksi isolasi data sehingga proses pembaruan hanya memperbarui berkas frontend dan script API tanpa pernah menimpa database yang sudah ada.

---

<div align="center">

Dibuat dengan ❤️ oleh **Fandi dari Jawa tech**  
*Mendukung asesmen digital sekolah yang jujur, aman, dan berintegritas tinggi.*

</div>
