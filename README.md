# ExamGuard - GForm Proctoring WebApp

**ExamGuard** adalah sistem pengawasan ujian (*proctoring system*) berbasis web modern dan terintegrasi untuk formulir **Google Form**. Aplikasi ini dirancang khusus untuk institusi pendidikan (SD, SMP, SMA/SMK, hingga Perguruan Tinggi/Umum) dengan arsitektur yang 100% siap dipublikasikan ke **Shared Hosting cPanel (Apache / LiteSpeed)** maupun dijalankan di lingkungan lokal pengembang.

---

## Daftar Isi
1. [Fitur Utama](#fitur-utama)
2. [Prasyarat Sistem (Prerequisites)](#prasyarat-sistem-prerequisites)
3. [Panduan Menjalankan dalam Mode Developer](#panduan-menjalankan-dalam-mode-developer)
4. [Kredensial Akun Demo Pengujian](#kredensial-akun-demo-pengujian)
5. [Alur Kerja & Panduan Fitur Pengujian](#alur-kerja--panduan-fitur-pengujian)
6. [Struktur Folder Proyek](#struktur-folder-proyek)
7. [Build Produksi Siap cPanel](#build-produksi-siap-cpanel)
8. [Pemecahan Masalah (Troubleshooting)](#pemecahan-masalah-troubleshooting)

---

## Fitur Utama

- **Modern Minimalist UI/UX (Anti-AI Slop):** Menggunakan Tailwind CSS v4, font Inter & JetBrains Mono, border halus, ambient shadow, dan tabular numbers untuk timer.
- **Pre-Flight Permission Check:** Validasi izin Geolocation GPS (Haversine Formula), Third-Party Cookies, Fullscreen, sensor Kamera/Mikrofon, serta Pembersih Papan Klip (Clipboard Sanitizer).
- **Proctoring Engine Anti-Curang:**
  - Deteksi perpindahan tab browser (`visibilitychange`).
  - Deteksi hilangnya fokus jendela (`window.blur`).
  - Deteksi keluar dari mode Layar Penuh (Fullscreen).
  - Layar **Auto-Lock** seketika saat terjadi pelanggaran dengan pencatatan counter pelanggaran.
  - Pemblokiran klik kanan (*anti-context menu*), pemblokiran kombinasi tombol (`Ctrl+C`, `Ctrl+V`, `Ctrl+U`, `F12`, `Alt+Tab`), serta penonaktifan penerjemahan otomatis (*anti-translate*).
- **Sticky Header Ujian:** Dilengkapi hitung mundur timer pengerjaan, chip token soal dengan tombol sekali-salin, dan konfirmasi penyelesaian ujian.
- **Papan Kontrol Pengawas (Live Proctoring):** Pemantauan status pengerjaan secara real-time (`IN_PROGRESS`, `LOCKED`, `COMPLETED`, `RESET_BY_PROCTOR`), waktu aktual, dan dilengkapi **3 Tombol Aksi Pengawas**:
  1. **Reset Login:** Menghapus `active_device_id` siswa agar dapat login di perangkat lain.
  2. **Unlock:** Membuka kunci siswa yang berstatus `LOCKED`.
  3. **Reset Jawaban:** Mengubah status `COMPLETED` menjadi `RESET_BY_PROCTOR` agar soal yang tersembunyi muncul kembali di portal siswa jika respons Google Sheets belum terisi.
- **Manajemen Tingkat Kelas & Jenjang:** Otomatis menyesuaikan rentang kelas berdasarkan jenjang:
  - `SD` $\rightarrow$ Kelas 1–6
  - `SMP` $\rightarrow$ Kelas 7–9
  - `SMA` $\rightarrow$ Kelas 10–12
  - `LAINNYA` $\rightarrow$ Tingkat 0 (Umum/Pelatihan)
- **Import Siswa (CSV/Excel):** Format `nama, nisn, nis, kelas, tingkat, email`. Username dan password awal otomatis diset ke nomor **NISN**.
- **Sensor Auto-Logout:** Logout otomatis jika siswa tidak melakukan interaksi selama batas waktu `idle_timeout_minutes`.

---

## Prasyarat Sistem (Prerequisites)

Sebelum menjalankan aplikasi, pastikan perangkat komputer Anda telah terpasang:
- **Node.js**: Versi `18.x`, `20.x`, atau versi LTS yang lebih baru (disarankan Node v20+).
- **NPM**: Versi 9.x atau 10.x+ (bawaan dari instalasi Node.js).
- **Web Browser Modern**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau Brave (direkomendasikan Chrome/Edge untuk kompatibilitas penuh API Fullscreen dan Geolocation).
- **Git** (Opsional).

Untuk memeriksa versi yang terpasang di komputer Anda, jalankan perintah:
```bash
node -v
npm -v
```

---

## Panduan Menjalankan dalam Mode Developer

Ikuti langkah-langkah berikut secara berurutan:

### 1. Buka Terminal di Direktori Proyek
Buka terminal favorit Anda (PowerShell, Command Prompt, Git Bash, atau Terminal VS Code / Antigravity IDE), lalu navigasikan ke folder proyek:
```bash
cd d:\laragon\www\examguard
```

### 2. Instal Seluruh Dependensi
Jika Anda baru pertama kali mengkloning atau membuka proyek ini, jalankan instalasi paket dependensi:
```bash
npm install
```
> **Catatan Windows PowerShell:** Jika muncul peringatan keamanan eksekusi skrip (`PSSecurityException`), gunakan `npm.cmd install`.

### 3. Jalankan Vite Development Server
Jalankan server pengembang lokal dengan perintah:
```bash
npm run dev
```

Agar aplikasi dapat diakses dari perangkat lain dalam satu jaringan WiFi/LAN (misalnya smartphone atau laptop pengawas):
```bash
npm run dev -- --host 0.0.0.0
```

### 4. Buka Aplikasi di Browser
Setelah server berjalan, output di terminal akan menampilkan alamat akses:
```text
  VITE v6.x.x  ready in 1200 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```
Buka browser Anda dan akses: **[http://localhost:5173](http://localhost:5173)**

---

## Kredensial Akun Demo Pengujian

Aplikasi telah dilengkapi dengan data *seed* awal untuk memudahkan pengujian semua alur:

| Peran (Role) | Username / NISN | Password | Keterangan, Status & Tautan Google |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin` | Akses penuh dashboard, bank soal, pengaturan instansi |
| **Pengawas (Proctor)** | `pengawas1` | `pengawas1` | Akses live monitoring & tombol aksi pengawas |
| **Siswa 1** | `0058291021` | `0058291021` | Ahmad Fauzi Ridwan (XII MIPA 1) &bull; **Terverifikasi**, **Aktif**, **Google SSO Tertaut** |
| **Siswa 2** | `0058291022` | `0058291022` | Siti Rahmawati Putri (XII MIPA 2) &bull; **Belum Verifikasi**, **Terkunci**, **Belum Taut Google** |
| **Siswa 3** | `0068291033` | `0068291033` | Bambang Pamungkas (XI IPS 1) &bull; **Terverifikasi**, **Aktif**, **Belum Taut Google** |

---

## Alur Kerja & Panduan Fitur Pengujian

### A. Pengujian Sisi Siswa (Student Portal)
1. **Login Siswa:** Masuk menggunakan NISN `0058291021` dan password `0058291021`.
2. **Pemeriksaan Pre-Flight:**
   - Sistem akan memeriksa Cookies, Fullscreen, Media, dan GPS Haversine.
   - *Tips Pengujian:* Jika Anda menguji di luar koordinat sekolah atau di lingkungan offline, klik tautan **"Mode Simulasi Pengawas"** di bagian bawah checklist untuk menyimulasikan GPS dalam radius (15m).
   - Klik **"Izin Terpenuhi &bull; Lanjutkan ke Beranda Ujian"**.
3. **Beranda Siswa:**
   - Periksa sapaan ramah (*"Halo, Ahmad Fauzi! Yuk cek jadwal ujianmu hari ini"*).
   - Periksa daftar ujian. Ujian yang tampil hanya ujian yang sesuai dengan tingkat kelas siswa (Tingkat 12).
4. **Mulai Ujian:**
   - Klik **"Mulai Ujian"** pada sesi soal.
   - Baca petunjuk di modal himbauan, centang pernyataan tata tertib, lalu klik **"Buka Soal & Fullscreen"**.
5. **Laman Ujian & Simulasi Pelanggaran (Auto-Lock):**
   - Layar akan otomatis masuk ke mode Fullscreen.
   - Timer hitung mundur akan berjalan di sticky header.
   - **Coba Pindah Tab:** Buka tab baru atau minimalkan jendela browser. Layar akan langsung terkunci (**LAYAR UJIAN TERKUNCI**) dengan status `LOCKED`.
6. **Selesaikan Ujian:**
   - Klik tombol **"Selesaikan Ujian"** di pojok kanan atas.
   - Konfirmasi dialog. Setelah diselesaikan, status berubah menjadi `COMPLETED` dan soal akan **otomatis disembunyikan** dari beranda siswa.

### B. Pengujian Sisi Administrator & Pengawas (Admin Dashboard)
1. Buka browser baru (atau jendela *Incognito / Private Window*), lalu login dengan akun `admin` / `admin`.
2. **Papan Kontrol Pengawas (Tab 'Kontrol Pengawas'):**
   - Siswa yang tadi terkunci akan tampil dengan status `LOCKED` berwarna merah dan jumlah pelanggarannya.
   - Uji coba **Tombol Aksi Pengawas**:
     - Klik **"Unlock"** $\rightarrow$ Kembali ke jendela siswa, layar ujian siswa akan otomatis terbuka kembali tanpa perlu refresh.
     - Klik **"Reset Login"** $\rightarrow$ Kunci ID perangkat siswa akan dihapus.
     - Klik **"Reset Jawaban"** $\rightarrow$ Status siswa yang sudah `COMPLETED` diubah menjadi `RESET_BY_PROCTOR`, sehingga soal kembali muncul di beranda siswa.
3. **Pengaturan Instansi (Tab 'Pengaturan Instansi'):**
   - Coba ubah jenjang ke `SMP` atau `SD` $\rightarrow$ perhatikan rentang tingkat kelas otomatis berubah.
   - Atur batas radius toleransi GPS atau klik **"Gunakan Posisi Saya"** untuk mengisi koordinat saat ini.
4. **Manajemen Siswa (Tab 'Manajemen Siswa'):**
   - **Tombol Tambah Peserta Manual:** Klik tombol **"+ Tambah Peserta"** untuk menginput data siswa baru secara manual (Nama, NISN, NIS, Kelas, Tingkat, Email, serta opsi verifikasi langsung). Status SSO awal siswa baru otomatis berstatus OFF.
   - **Tombol Import Siswa (CSV/Excel):** Klik **"Import Siswa (CSV/Excel)"**, klik **"Salin Contoh"**, lalu klik **"Proses Import Siswa"**. Siswa baru akan langsung tersimpan dan password awal otomatis diset ke nomor NISN.
   - **Kolom Nomor Urut (No):** Seluruh data siswa memiliki penomoran urut rapi dari nomor 1.
   - **Aturan Verifikasi Wajib:** Siswa berstatus `Belum Verifikasi` memiliki status akun terkunci (`Terkunci (Belum Verif)`) dan **tidak dapat diaktifkan** sebelum panitia melakukan verifikasi. Jika verifikasi siswa dicabut, status akun siswa otomatis dinonaktifkan demi kepatuhan ujian.
   - **Kolom Status SSO Google (Otomatis & Read-Only):**
     - **Centang Hijau (`SSO On`):** Tampil otomatis jika siswa telah pernah login menggunakan email terdaftar dan menyimpan ID akun Google unik.
     - **Centang Off (`SSO Off`):** Tampil jika siswa belum pernah menggunakan Google SSO untuk login ke sistem.
     - **Proteksi Admin:** Admin tidak dapat mengubah status ini secara manual karena murni merupakan hasil autentikasi SSO siswa.
   - **Kolom Aksi (Edit & Hapus):**
     - Klik ikon **Edit** untuk memperbarui nama, NISN, NIS, kelas, tingkat, atau email siswa.
     - **Aturan Reset Email:** Jika email di-update dan berbeda dari email sebelumnya, status Google SSO otomatis **OFF** dan ID Google tersimpan dihapus, sehingga siswa wajib melakukan login ulang melalui Google SSO dengan email barunya.
     - Klik ikon **Hapus** untuk menghapus peserta dari database.

---

## Struktur Folder Proyek

```text
examguard/
├── dist/                          # Hasil build produksi siap cPanel
│   ├── assets/                    # File JavaScript & CSS yang telah di-bundle & hash
│   ├── .htaccess                  # Konfigurasi Apache (SPA Routing & Force HTTPS)
│   └── index.html                 # Entry point HTML produksi (relatif path ./)
├── public/
│   └── .htaccess                  # File .htaccess asli untuk disalin Vite ke dist/
├── src/
│   ├── components/
│   │   └── admin/
│   │       └── AdminSidebar.jsx   # Komponen sidebar admin minimalis monokrom
│   ├── constants/
│   │   └── educationConfig.js     # Jenjang pendidikan, Haversine formula, UUID v4
│   ├── pages/
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx # Dashboard admin, kontrol proctor, import CSV
│   │   ├── auth/
│   │   │   └── LoginPortal.jsx    # Portal login siswa, admin, Google SSO, reCAPTCHA
│   │   └── student/
│   │       └── StudentPortal.jsx  # Pre-flight check, beranda, laman ujian GForm
│   ├── services/
│   │   └── storageService.js      # Arsitektur database terpusat (localStorage + API adapter)
│   ├── App.jsx                    # Root router & session manager
│   ├── index.css                  # Tailwind CSS v4 directives & font styling
│   └── main.jsx                   # React DOM render entry point
├── index.html                     # HTML Template Vite
├── package.json                   # Dependensi & script proyek
├── vite.config.js                 # Konfigurasi Vite (base: './', port 5173, outDir: 'dist')
├── examguard-cpanel-ready.zip     # Arsip ZIP produksi siap unggah ke cPanel
└── README.md                      # Dokumentasi & panduan developer ini
```

---

## Build Produksi Siap cPanel

Aplikasi ini telah dirancang dengan aturan konfigurasi khusus agar dapat berjalan di cPanel (*root* `public_html`, subdomain, maupun subfolder):

1. **Jalankan Build Produksi:**
   ```bash
   npm run build
   ```
2. **Karakteristik Hasil Build:**
   - Menggunakan path relatif (`base: './'`) sehingga bebas dari masalah *blank screen* atau aset tidak terpanggil.
   - `build.sourcemap: false` untuk menjaga keamanan kode sumber.
   - File `public/.htaccess` otomatis disalin ke dalam folder `dist/`.
3. **Langkah Publikasi ke cPanel:**
   - Kompres seluruh isi folder `dist/` menjadi file ZIP (atau gunakan file yang telah kami sediakan: `examguard-cpanel-ready.zip`).
   - Masuk ke cPanel $\rightarrow$ Buka **File Manager** $\rightarrow$ Masuk ke folder target (contoh: `public_html` atau `public_html/ujian`).
   - Klik **Upload** dan unggah file ZIP tersebut, lalu klik **Extract Here**.
   - Pastikan opsi *"Show Hidden Files (dotfiles)"* aktif di Settings File Manager cPanel agar file `.htaccess` terbaca oleh Apache / LiteSpeed.
   - Pastikan **SSL (HTTPS)** telah aktif pada domain/subdomain Anda.

---

## Pemecahan Masalah (Troubleshooting)

| Gejala Masalah | Penyebab | Solusi |
| :--- | :--- | :--- |
| **Port 5173 already in use** | Port 5173 sedang dipakai oleh proses lain | Jalankan dengan port lain: `npm run dev -- --port 5174` |
| **Izin Lokasi (GPS) Ditolak** | Browser memblokir akses lokasi | Klik ikon gembok/setelan situs di address bar browser, ubah izin *Location* ke *Allow*, lalu muat ulang halaman. |
| **Mode Layar Penuh Ditolak** | Browser membutuhkan interaksi klik pengguna | Pastikan Anda mengklik tombol "Buka Soal & Fullscreen" (browser memblokir fullscreen yang dipicu otomatis tanpa interaksi). |
| **Perangkat Terkunci di Akun Siswa** | Siswa sebelumnya login di perangkat atau peramban lain | Login ke panel Admin $\rightarrow$ Tab *Kontrol Pengawas* atau *Manajemen Siswa* $\rightarrow$ Klik **Reset Login** pada siswa tersebut. |
| **PSSecurityException di PowerShell** | Kebijakan eksekusi skrip Windows memblokir file `.ps1` | Gunakan perintah `npm.cmd run dev` atau jalankan `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |

---

## Lisensi & Kontributor

Dikembangkan dengan standar arsitektur tingkat tinggi untuk sistem pengawasan ujian Google Form mandiri. Bebas digunakan dan disesuaikan untuk kebutuhan instansi pendidikan Anda.

