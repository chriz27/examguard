# 🛡️ ExampGuard v1.1 - Enterprise Exam Browser & Proctoring System

<div align="center">

[![Versi](https://img.shields.io/badge/Versi-1.1.0_Production_Ready-emerald?style=for-the-badge&logo=shield)](https://github.com/chriz27/examguard)
[![PHP](https://img.shields.io/badge/PHP-8.0+-blue?style=for-the-badge&logo=php)](https://php.net)
[![NodeJS](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Database](https://img.shields.io/badge/SQLite-Zero_Config-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**Sistem Pengawasan & Pengamanan Ujian Berbasis Web Mandiri untuk Google Forms.**

*Tanpa perlu instal aplikasi di Play Store atau App Store — langsung berjalan aman di seluruh browser.*</br>
*(✅ Chrome Android, ✅ Chrome Dekstop, ⚠ iOS)*

---

### 👨‍💻 Tim Pengembang
Dikembangkan dengan penuh dedikasi oleh **Fandi dari Jawa tech**  
Untuk kemajuan sistem asesmen digital sekolah, madrasah, dan instansi pendidikan di Indonesia.

</div>

---

## 💡 Apa Itu ExampGuard?

**ExampGuard** adalah platform *Exam Browser* berbasis web modern yang dirancang untuk mengamankan jalannya asesmen atau ujian daring (seperti Google Formulir). Siswa mengerjakan soal di dalam lingkungan peramban terkunci (*Kiosk Mode*) yang mencegah kecurangan seperti membuka tab lain, menyalin jawaban, mencari contekan di peramban (tab baru), maupun berpindah aplikasi.

Aplikasi ini dapat dihosting dengan sangat hemat dan mudah di **cPanel Shared Hosting biasa** tanpa perlu konfigurasi server yang rumit dan pengaturan database karena menggunakan SQLite.

---

## ✨ Fitur-Fitur Unggulan

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FITUR UTAMA EXAMPGUARD                         │
├────────────────────┬────────────────────┬──────────────────────────────┤
│  🔒 Kiosk Lock     │  📍 Geofence GPS   │  📱 One-Device Lock          │
│  Anti buka tab,    │  Kunci posisi riil │  1 akun hanya bisa dipakai   │
│  anti screenshot & │  koordinat sekolah │  di 1 perangkat (anti joki)  │
│  anti copy-paste   │  radius meter      │                              │
├────────────────────┼────────────────────┼──────────────────────────────┤
│  🔑 Google SSO     │  🖨️ Cetak Kartu QR │  📊 Proctor Live Hub         │
│  Login akun resmi  │  Format hemat A4   │  Pantau peserta real-time &  │
│  Google Workspace  │  (6 kartu/lembar)  │  fitur reset buka kunci      │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### 1. 🔒 Penguncian Peramban (*Kiosk Mode & Anti-Cheat*)
* **Fullscreen Lock:** Mewajibkan layar penuh. Keluar dari fullscreen memicu peringatan **sirine kontinu**.
* **Clipboard Blocker:** Pembersihan otomatis papan klip (*clipboard*) mencegah trik *copy-paste* soal/jawaban.
* **Developer Tools & Shortcut Blocker:** Memblokir tombol F12, Ctrl+U, Ctrl+Shift+I, Alt+Tab, tombol kembali, dan klik kanan.

### 2. 📍 GPS Geofencing Presisi Tinggi
* Koordinat diambil langsung dari sensor GPS fisik perangkat siswa (tidak dapat dimanipulasi manual).
* Admin dapat menentukan titik tengah Sekolah via OpenStreetMap/Google Maps dan jarak toleransi radius (misal: 100 meter dari gedung sekolah).

### 3. 🆔 Kebijakan Satu Perangkat (*One-Device Lock*)
* Perangkat siswa diikat dengan tanda pengenal digital unik (*Device Fingerprint*) saat pertama kali login.
* Mencegah akun siswa digunakan oleh orang lain di luar ruangan ujian. Tersedia tombol *Reset Perangkat* di dashboard pengawas jika HP siswa rusak/kehabisan baterai.

### 4. 🖨️ Cetak Kartu Peserta Ujian QR Code
* Cetak kartu peserta mandiri (perorangan) atau massal per kelas/tingkat.
* Format A4 hemat kertas (3 baris × 2 kolom = 6 kartu per lembar).
* Dilengkapi QR Code login cepat: siswa cukup mengarahkan kartu ke kamera untuk masuk secara instan tanpa mengetik NISN/kata sandi.

### 5. 📊 Panel Pengawas Real-Time (*Proctoring Live Hub*)
* Pantau status pengerjaan seluruh peserta (Sedang Mengerjakan, Belum Masuk, Terkunci, atau Selesai).
* Pantau sinyal detak jantung (*heartbeat*), ping koneksi internet (ms), dan daya baterai siswa.
* Kontrol token masuk dan token keluar mandiri.

---

## 🌐 Panduan Cepat Pasang ke cPanel (3 Langkah Mudah)

ExampGuard menggunakan arsitektur **Zero-Config Database (SQLite PDO)**. Anda **TIDAK PERLU** membuat database MySQL, tidak perlu setup nama database, username, maupun password database!

### Langkah 1: Siapkan Subdomain di cPanel
1. Masuk ke dashboard cPanel hosting sekolah Anda.
2. Cari menu **Domains** atau **Subdomains**.
3. Buat subdomain baru, misalnya: `ujian.sekolah.sch.id`.
4. Catat folder tujuannya (*Document Root*), biasanya otomatis di `public_html/ujian`.

### Langkah 2: Unggah Berkas `ExampGuard-v1.1.zip`
1. Buka **File Manager** di cPanel.
2. Masuk ke folder document root subdomain Anda (`public_html/ujian`).
3. Klik tombol **Upload**, lalu pilih berkas **`ExampGuard-v1.1.zip`**.
4. Setelah selesai, klik kanan file zip tersebut lalu pilih **Extract**.
5. Pastikan isi file (seperti `index.html`, `api/`, `assets/`, `.htaccess`) berada langsung di dalam folder subdomain.

### Langkah 3: Aktifkan SSL (HTTPS Wajib untuk GPS & Kamera)
1. Di cPanel, buka menu **SSL/TLS Status**.
2. Pilih subdomain ujian Anda lalu klik tombol **Run AutoSSL**.
3. Selesai! Buka subdomain Anda di peramban: `https://ujian.sekolah.sch.id`.

> [!IMPORTANT]
> **Wajib HTTPS:** Sensor GPS dan izin Layar Penuh modern memerlukan protokol aman HTTPS. Pastikan SSL AutoSSL cPanel sudah berstatus hijau.

---

## 🔑 Kredensial Akun Default

Setelah instalasi selesai, sistem sudah langsung terisi akun default berikut:

| Peran Akun | Username | Password Default | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Akses penuh: Pengaturan Instansi, Bank Soal, Akun, Import Siswa, Backup & Restore |
| **Proktor Ujian** | `proktor` | `proktor` *(atau `proktor123`)* | Khusus pengawasan: Pantau peserta, rilis token, reset perangkat, dan berita acara |
| **Contoh Siswa** | `0068291033` | `23101` *(Nomor NIS)* | Portal peserta untuk mengerjakan ujian |

> [!TIP]
> Demi keamanan, segera ganti kata sandi Super Admin melalui menu **Akun Administrator** setelah instalasi pertama kali.

---

## 🔐 Konfigurasi Google OAuth 2.0 (SSO) & Google reCAPTCHA

ExampGuard mendukung integrasi resmi layanan keamanan Google untuk memvalidasi identitas akun siswa dan mengamankan portal dari serangan *bot*. Pengaturannya dapat dikelola langsung melalui menu **Pengaturan Instansi** (Khusus Super Admin).

---

### 1. 🔑 Google OAuth 2.0 Client ID (Untuk Login Google SSO & One Tap)

Fitur ini memungkinkan sekolah mewajibkan siswa masuk menggunakan akun resmi Google Workspace sekolah (misal `@sekolah.sch.id` atau akun `@belajar.id`).

#### A. Cara Mendapatkan Client ID dari Google Cloud Console:
1. Buka konsol [Google Cloud Console](https://console.cloud.google.com/) dan masuk menggunakan akun Google Anda.
2. Buat proyek baru di pojok kiri atas (contoh nama: `ExampGuard Ujian Sekolah`).
3. Masuk ke menu **APIs & Services** &rarr; **OAuth consent screen**:
   * Pilih **External** (atau *Internal* jika instansi Anda memiliki Google Workspace berbayar).
   * Isi **App name** (misal: `ExampGuard CBT`) dan **User support email**.
   * Klik **Save and Continue** hingga selesai.
4. Masuk ke menu **Credentials** &rarr; Klik **+ CREATE CREDENTIALS** &rarr; Pilih **OAuth client ID**:
   * **Application type:** Pilih **Web application**.
   * **Name:** `ExampGuard Web Client`.
   * **Authorized JavaScript origins (WAJIB):** Masukkan alamat domain/subdomain tempat aplikasi dipasang dengan awalan `https://` (contoh: `https://ujian.sekolah.sch.id`). Jika sedang menguji di komputer lokal, tambahkan `http://localhost:5173`.
   * Kolom *Authorized redirect URIs* dapat dikosongkan.
5. Klik **Create**, lalu salin kode **Client ID** yang berakhiran `.apps.googleusercontent.com`.

#### B. Memasukkan Client ID ke ExampGuard:
1. Masuk ke dashboard ExampGuard sebagai **Super Admin**.
2. Buka menu **Pengaturan Instansi** &rarr; Gulir ke bagian **Integrasi Google Workspace OAuth 2.0**.
3. Tempelkan Client ID pada kolom input yang tersedia.
4. Klik tombol **Login Akun Google (Verifikasi OAuth)** untuk melakukan uji coba verifikasi ke Google.
5. Setelah status terverifikasi hijau, aktifkan sakelar **5. Login Akun Google (Wajib SSO)** pada daftar ceklis izin.
6. Siswa kini dapat masuk menggunakan tombol **Masuk dengan Akun Google** atau melalui prompt otomatis **Google One Tap**.

---

### 2. 🛡️ Google reCAPTCHA (Anti-Bot & Brute Force Protection)

ExampGuard menyediakan proteksi Captcha ganda untuk melindungi formulir login dari serangan tebak kata sandi (*brute-force*).

#### A. Cara Mendapatkan Site Key dari Google reCAPTCHA:
1. Kunjungi konsol [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin).
2. Klik tombol **+ (Create)** di pojok kanan atas untuk mendaftarkan situs.
3. Isi formulir pendaftaran:
   * **Label:** Tulis nama sekolah/ujian (misal: `ExampGuard SMPN 1`).
   * **reCAPTCHA type:** 
     * Pilih **reCAPTCHA v2 ("I'm not a robot" Checkbox)** untuk verifikasi kotak centang mandiri.
     * Atau pilih **reCAPTCHA v3 (Score-based)** untuk proteksi transparan otomatis di latar belakang tanpa mengharuskan siswa mencentang.
   * **Domains:** Masukkan domain situs tanpa `https://` (contoh: `ujian.sekolah.sch.id` atau `localhost`).
4. Setujui ketentuan layanan dan klik **Submit**.
5. Salin **Site Key (Kunci Situs)**. *(Secret Key tidak wajib diisi karena validasi klien dijalankan langsung oleh library resmi Google GIS)*.

#### B. Memasukkan reCAPTCHA Key ke ExampGuard:
1. Buka menu **Pengaturan Instansi** &rarr; Gulir ke kartu **Keamanan Google reCAPTCHA**.
2. Pilih versi yang Anda gunakan (**reCAPTCHA v2** atau **reCAPTCHA v3**).
3. Tempelkan **Site Key** Anda pada kolom yang disediakan.
4. Klik tombol **Simpan Perubahan Konfigurasi Instansi** di bagian bawah.

#### 💡 Alternatif Offline: Captcha Keamanan Mandiri (Bawaan)
Jika sekolah Anda tidak ingin membuat akun Google Cloud atau menjalankan ujian di jaringan intranet/LAN semi-offline:
* Kosongkan kolom Google reCAPTCHA Site Key.
* Sistem ExampGuard akan **secara otomatis mengaktifkan Captcha Mandiri Bawaan** (5 kode angka/huruf acak yang di-generate langsung oleh sistem lokal tanpa memerlukan koneksi internet ke server Google).

---

## 💻 Panduan Menjalankan di Komputer Lokal (Pengembang)

Jika Anda ingin menjalankan atau memodifikasi aplikasi ini di komputer sendiri:

### 1. Kloning Repositori & Pasang Dependensi
```bash
git clone https://github.com/chriz27/examguard.git
cd examguard
npm install
```

### 2. Jalankan Server Pembangunan (Development Server)
```bash
npm run dev
```
Buka peramban pada alamat: `http://localhost:5173`.

### 3. Jalankan Pengujian Database (Integration Tests)
```bash
npm run test:db
```
Pengujian bawaan akan mengecek 40 skenario keamanan, relasi database, integritas token, dan sistem proktor secara otomatis.

### 4. Build Proyek untuk Distribusi
```bash
npm run build
```
Hasil kompilasi siap produksi akan tersedia di dalam direktori `dist/`.

---
## 🚀 Catatan Rilis: Pembaruan dari v1.0 ke v1.1

Pembaruan **ExampGuard v1.1** menghadirkan penyempurnaan besar berdasarkan umpan balik pengujian lapangan:

| Fitur / Perbaikan | Versi 1.0 (Sebelumnya) | Versi 1.1 (Terbaru) |
| :--- | :--- | :--- |
| **⏱️ Waktu Ujian Habis** | Siswa langsung dilempar keluar ke lobby | **Tetap di halaman soal**; waktu membeku di `00:00` + muncul banner merah peringatan agar siswa menekan tombol **"Kirim / Submit"** di Google Form sebelum keluar |
| **🔊 Alarm Pelanggaran** | Suara alarm standar statis | **Pelanggaran Ringan:** Sirine berulang kontinu sampai siswa kembali ke layar penuh.<br>**Pelanggaran Berat:** Layar merah penuh (*Full Red Screen*) + bunyi sirine 3 detik lalu hening otomatis |
| **📶 Bilah Navigasi Ujian** | Header 1 baris, tombol refresh mengambang di kanan bawah menutupi soal | **2-Tier Navbar:**<br>• *Atas:* Logo, Wifi Ping ms responsif, Indikator Baterai, Chip Token, Timer, Tombol Selesai.<br>• *Bawah:* Nama Siswa, Rombel, Ruang, dan **Tombol Segarkan Soal Biru Kontras** (tidak menutupi soal + ada konfirmasi) |
| **🔒 Identitas Instansi** | Form sering ter-reset saat admin sedang mengetik karena background polling | **Form Draft Lock:** Pembaruan memori diabaikan selama admin sedang mengetik input hingga tombol Simpan ditekan |
| **🛡️ Toleransi Pelanggaran** | Nilai batas pelanggaran statis (3 kali) | **Fleksibel & Ada Mode Unlimited:** Admin dapat mengatur batas pelanggaran. Jika diisi `0`, sistem masuk ke **Mode Bebas / Unlimited** (hanya mencatat log tanpa pernah mengunci layar) |
| **👥 Kredensial Proktor** | Akun proktor mengalami kendala login di cPanel | **Role & Kredensial Stabil:** SQLite seed diperbaiki ke `role = 'proctor'`, menerima kata sandi `proktor` atau `proktor123`, dan diproteksi ketat dari menu sensitif admin |
| **🖨️ Cetak Kartu Peserta** | Cetak kartu mandiri/massal terkadang muncul blank putih | **Isolated Hidden Iframe Printing:** Mesin cetak mandiri A4 (grid 3x2) bebas dari blank putih di seluruh browser |
| **📱 Kompatibilitas iOS** | Suara alarm terkadang tertahan di Safari iPhone | Dukungan penuh gestur *touchstart AudioContext*, CSS `100dvh`, dan deteksi baterai tanpa galat |
| **⏱️ Panel Pengawas** | Countdown token dan durasi soal tertukar | **Dual Card Countdown:** Card Token menampilkan sisa waktu rilis token selesai, Card Waktu menampilkan status jadwal (*Belum Dimulai, Berlangsung, Selesai*) |
| **✨ Google SSO & One Tap** | Status hijau SSO terkadang berubah kuning sendiri | **Auto SSO & One Tap:** Prompt Google One Tap otomatis aktif dari halaman login hingga pre-flight, serta tersimpan atomik di database |

---

## 🛠️ Tanya Jawab & Pemecahan Masalah (FAQ)

### Q: Mengapa siswa tidak bisa mengakses GPS atau muncul peringatan "Geolocation Denied"?
> **Solusi:** Fitur GPS pada peramban modern (Google Chrome, Safari) **hanya aktif jika website menggunakan HTTPS (SSL)**. Pastikan website Anda diakses menggunakan awalan `https://`, bukan `http://`. Pada mode pengujian tanpa internet, admin dapat mengaktifkan **Mode Simulasi (Bypass GPS)** di menu Akun Administrator.

### Q: Mengapa setelah refresh halaman di cPanel muncul error 404 Not Found?
> **Solusi:** Pastikan berkas **`.htaccess`** yang disertakan dalam paket zip sudah terunggah di folder utama subdomain Anda. File `.htaccess` berfungsi mengarahkan rute Single Page Application (SPA) ke `index.html`.

### Q: Apakah data siswa akan hilang jika saya memperbarui aplikasi ke versi baru di cPanel?
> **Solusi:** **Tidak akan hilang.** Database disimpan secara terpusat pada berkas `api/examguard.db`. Paket pembaruan frontend hanya memperbarui folder `assets/` dan `index.html` tanpa menyentuh file `.db` yang sudah ada.

### Q: Bagaimana cara mengganti logo sekolah dan nama ujian?
> **Solusi:** Masuk sebagai Super Admin, buka menu **Pengaturan Instansi**. Anda dapat mengunggah file logo instansi (PNG/JPG), mengatur nama sekolah, NPSN, koordinat Google Maps, serta batas toleransi pelanggaran.

---

<div align="center">

Dibuat dengan ❤️ oleh **Fandi dari Jawa tech**  
*Mendukung asesmen digital yang jujur, aman, dan berintegritas.*

</div>
