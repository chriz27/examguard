# 🛡️ ExamGuard - GForm Proctoring WebApp

<div align="center">

![React](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![cPanel Ready](https://img.shields.io/badge/cPanel-100%25_Ready-ff6c2c?style=for-the-badge&logo=cpanel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)

**Sistem Pengawasan Ujian Berbasis Web Modern untuk Google Form dengan Proteksi Anti-Curang, GPS Geofencing, Google SSO, dan Dua Tingkat Peran Pengawas.**

[Fitur Utama](#-fitur-utama) • [Prasyarat](#-prasyarat-sistem) • [Instalasi Lokal](#-panduan-instalasi-lokal-mode-pengembang) • [Deploy cPanel](#-panduan-instalasi--deployment-ke-cpanel) • [Kredensial Demo](#-kredensial-akun-demo-pengujian) • [Troubleshooting](#-pemecahan-masalah-troubleshooting)

</div>

---

## 📋 Daftar Isi

1. [Tentang ExamGuard](#-tentang-examguard)
2. [Fitur Utama](#-fitur-utama)
3. [Prasyarat Sistem](#-prasyarat-sistem)
4. [Panduan Instalasi Lokal (Mode Pengembang)](#-panduan-instalasi-lokal-mode-pengembang)
5. [Panduan Instalasi & Deployment ke cPanel](#-panduan-instalasi--deployment-ke-cpanel)
6. [Kredensial Akun Demo Pengujian](#-kredensial-akun-demo-pengujian)
7. [Alur & Hak Akses Administrator](#-alur--hak-akses-administrator)
8. [Struktur Folder Proyek](#-struktur-folder-proyek)
9. [Konfigurasi Tambahan (OAuth, reCAPTCHA, GPS)](#-konfigurasi-tambahan)
10. [Pemecahan Masalah (Troubleshooting)](#-pemecahan-masalah-troubleshooting)
11. [Lisensi](#-lisensi)

---

## 💡 Tentang ExamGuard

**ExamGuard** adalah aplikasi *proctoring web* (pengawasan ujian) ringan, modern, dan mandiri yang membungkus formulir **Google Form** dalam lingkungan ujian yang aman dan terpantau. Dirancang khusus untuk sekolah (SD, SMP, SMA/SMK) maupun perguruan tinggi yang membutuhkan sistem ujian digital berstandar tinggi tanpa perlu infrastruktur server rumit.

Aplikasi ini **100% Client-Side Ready** dan telah dioptimalkan untuk berjalan mulus di **Shared Hosting cPanel (Apache / LiteSpeed)** hanya dengan mengunggah paket build `.zip`.

---

## ✨ Fitur Utama

- **🎨 Modern Minimalist Design:** Antarmuka bersih (*anti-AI slop*) menggunakan Tailwind CSS v4, tipografi Inter & JetBrains Mono, border halus, serta modal konfirmasi khusus (tanpa popup bawaan browser).
- **🔒 Anti-Curang Proctoring Engine:**
  - Deteksi perpindahan tab browser (`visibilitychange`).
  - Deteksi hilangnya fokus jendela (`window.blur`).
  - Deteksi keluar dari mode Fullscreen.
  - **Auto-Lock Screen** seketika saat terjadi pelanggaran dengan counter pelanggaran tercatat.
  - Pemblokiran klik kanan, inspect element (`F12`), `Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `Alt+Tab`, serta *anti-translate*.
- **📍 GPS Geofencing Interaktif (Leaflet & OpenStreetMap):**
  - Preview peta interaktif gratis tanpa Google Maps API berbayar.
  - Pengaturan radius toleransi ujian (50m, 100m, 200m, 500m, dst).
  - Fitur pencarian lokasi langsung (*live search Nominatim*) dan input tautan Google Maps langsung.
- **🔐 Dua Tingkat Akses Administrator (RBAC):**
  - **Super Admin:** Akses mutlak ke semua fitur, termasuk *Pengaturan Instansi* dan *Kelola Akun Administrator*.
  - **Proktor Ujian:** Khusus operasional lapangan (*Ringkasan & Metrik*, *Sesi Ujian*, *Kontrol Pengawas Live*, dan *Manajemen Siswa*). Menu sensitif otomatis disembunyikan.
- **⚡ Kontrol Pengawas Real-Time:**
  - **Unlock:** Membuka kembali siswa yang terkunci tanpa reload.
  - **Reset Login:** Melepas ikatan *Device ID* siswa jika ganti perangkat.
  - **Reset Jawaban:** Mengembalikan status `COMPLETED` menjadi `RESET_BY_PROCTOR`.
  - **Reset Password & Reset SSO:** Reset password instan ke default NIS dan pencabutan koneksi Google SSO per siswa.
- **🏷️ Sticky Header Ujian:** Timer hitung mundur pengerjaan, chip token soal sekali-klik salin (*click-to-copy*), dan konfirmasi submit ujian.
- **🌐 Google Workspace SSO & reCAPTCHA v2:** Dukungan integrasi OAuth login sekolah dan verifikasi bot reCAPTCHA v2 dengan kontrol toggle on/off.
- **🏫 Identitas Sekolah & NPSN Resmi:** Konfigurasi nama sekolah, jenjang pendidikan, serta input validasi **NPSN 8 digit angka numerik** yang tersimpan di basis data sistem dan tampil pada header aplikasi.
- **💾 Backup & Restore Terenkripsi (AES-256-GCM):** Fasilitas pencadangan dan pemulihan data instansi, link bank soal, basis data siswa, serta riwayat ujian dengan **enkripsi militer AES-256-GCM** otomatis untuk password dan kunci rahasia Google.
- **ℹ️ Menu Informasi & Repositori (About):** Halaman identitas resmi aplikasi, spesifikasi teknologi, tim pengembang, lisensi MIT, serta tombol resmi repositori GitHub.

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
git clone https://github.com/username/examguard.git
cd examguard
```
Atau jika menggunakan Laragon / XAMPP, letakkan folder proyek di direktori web server Anda (misal `d:\laragon\www\examguard`).

### 2. Instalasi Paket Dependensi
Jalankan perintah instalasi paket modul Node:
```bash
npm install
```

> [!TIP]
> **Pengguna Windows PowerShell:** Jika muncul error eksekusi skrip (*PSSecurityException*), gunakan perintah `npm.cmd install` atau jalankan `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` di PowerShell Administrator.

### 3. Menjalankan Local Development Server
Jalankan server pengembangan berbasis Vite:
```bash
npm run dev
```

Agar aplikasi dapat diakses oleh perangkat lain dalam satu jaringan WiFi/LAN yang sama (misalnya untuk uji coba dari HP siswa):
```bash
npm run dev -- --host 0.0.0.0
```

### 4. Buka Aplikasi di Browser
Buka peramban web dan arahkan ke alamat yang tampil di terminal:
- Akses Lokal: **[http://localhost:5173](http://localhost:5173)**
- Akses Jaringan LAN: `http://[IP-Komputer-Anda]:5173`

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

| Peran (Role) | Username / NISN | Password Default | Keterangan & Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin` | **Akses Penuh:** Kelola Instansi, Akun Admin, Bank Soal, Sesi Ujian, & Monitoring |
| **Proktor Ujian** | `proktor` | `proktor` | **Operasional Ujian:** Monitoring Siswa Live, Bank Sesi, Reset Password/SSO Siswa |
| **Siswa 1** | `0058291021` | `22101` (NIS) | Ahmad Fauzi Ridwan (XII MIPA 1) • **Terverifikasi**, **SSO Google On** |
| **Siswa 2** | `0058291022` | `22102` (NIS) | Siti Rahmawati Putri (XII MIPA 2) • **Terverifikasi**, **SSO Google Off** |
| **Siswa 3** | `0068291033` | `23101` (NIS) | Bambang Pamungkas (XI IPS 1) • **Terverifikasi**, **SSO Google Off** |

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
├── dist/                              # Output build siap hosting cPanel
│   ├── assets/                        # Bundle JS & CSS ter-hash
│   ├── .htaccess                      # Aturan SPA routing & Force HTTPS
│   └── index.html                     # Entry point HTML produksi
├── public/
│   ├── .htaccess                      # Konfigurasi Apache bawaan
│   └── favicon.ico                    # Favicon aplikasi
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminSidebar.jsx       # Navigasi panel admin dengan filter role
│   │   └── common/
│   │       ├── ConfirmModal.jsx       # Modal konfirmasi kustom modern
│   │       └── NotificationToast.jsx  # Toast notifikasi kustom modern
│   ├── constants/
│   │   └── educationConfig.js         # Konfigurasi jenjang, Haversine GPS, helper
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx     # Dashboard terpadu Super Admin & Proktor
│   │   ├── auth/
│   │   │   └── LoginPortal.jsx        # Gerbang login multi-peran & SSO
│   │   └── student/
│   │       └── StudentPortal.jsx      # Pre-flight check, beranda, & ujian GForm
│   ├── services/
│   │   └── storageService.js          # Arsitektur penyimpanan terpusat (LocalStorage)
│   ├── App.jsx                        # Komponen root aplikasi & router
│   ├── index.css                      # Konfigurasi Tailwind CSS v4 & styling font
│   └── main.jsx                       # Entry point React DOM
├── examguard-cpanel-ready.zip         # Arsip siap deploy ke cPanel
├── package.json                       # Konfigurasi dependensi dan skrip npm
├── vite.config.js                     # Konfigurasi Vite (relative base './')
└── README.md                          # Panduan dokumentasi lengkap ini
```

---

## ⚙️ Konfigurasi Tambahan

### 1. Konfigurasi Google Workspace SSO (Opsional)
Untuk mengaktifkan autentikasi akun Google sekolah (@sekolah.sch.id):
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Buat proyek baru $\rightarrow$ Buka menu **APIs & Services** $\rightarrow$ **Credentials**.
3. Buat **OAuth 2.0 Client IDs** (Web Application).
4. Tambahkan domain sekolah Anda ke dalam **Authorized JavaScript origins** (misal: `https://ujian.sekolah.sch.id`).
5. Salin **Client ID** yang diperoleh, lalu masuk ke ExamGuard sebagai Super Admin $\rightarrow$ Tab **Pengaturan Instansi** $\rightarrow$ Masukkan Client ID pada formulir Google OAuth.
6. Aktifkan toggle switch Google OAuth.

### 2. Konfigurasi Google reCAPTCHA v2 (Opsional)
1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2. Daftarkan domain sekolah dengan memilih tipe **reCAPTCHA v2 ("I'm not a robot" Checkbox)**.
3. Masukkan **Site Key** ke tab **Pengaturan Instansi** di ExamGuard dan aktifkan proteksi reCAPTCHA.

---

## 🛠️ Pemecahan Masalah (Troubleshooting)

| Gejala Masalah | Kemungkinan Penyebab | Langkah Solusi |
| :--- | :--- | :--- |
| **Port 5173 already in use** | Port 5173 sedang dipakai oleh aplikasi lain | Jalankan Vite pada port alternatif: `npm run dev -- --port 5174` |
| **Error 404 saat Refresh di cPanel** | File `.htaccess` belum terunggah atau `mod_rewrite` nonaktif | Pastikan file `.htaccess` berada di folder yang sama dengan `index.html` dan opsi *Show Hidden Files* aktif di cPanel. |
| **Izin Geolocation / GPS Gagal** | Situs dibuka tanpa protokol HTTPS | Akses situs melalui `https://` bukan `http://`. Browser memblokir API sensor pada koneksi non-HTTPS. |
| **Mode Layar Penuh Ditolak** | Pemicuan Fullscreen tanpa interaksi klik | Pastikan siswa mengklik tombol "Buka Soal & Fullscreen". Browser modern melarang otomatisasi fullscreen tanpa klik pengguna. |
| **Peta Leaflet Tidak Muncul / Abu-abu** | Koneksi internet lambat atau kontainer peta belum render | Pastikan perangkat terhubung ke internet untuk memuat tile OpenStreetMap. Peta akan otomatis menyesuaikan ukuran kontainer. |
| **Siswa Terkunci di Perangkat Lama** | Siswa berpindah HP/Laptop tanpa logout | Minta Proktor membuka menu *Kontrol Pengawas* atau *Manajemen Siswa*, lalu klik tombol **Reset Login** pada siswa tersebut. |
| **PSSecurityException di Windows** | PowerShell membatasi eksekusi skrip lokal | Gunakan `npm.cmd [perintah]` atau jalankan perintah PowerShell: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |

---

## 📄 Lisensi

ExamGuard dirilis di bawah lisensi [MIT](LICENSE). Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan instansi pendidikan, sekolah, maupun pelatihan mandiri.
