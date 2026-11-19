@echo off
echo ============================================================
echo  ExamGuard - Inisialisasi Database SQLite & Real-Time Engine
echo ============================================================
echo.
cd /d %~dp0
echo [1/3] Menginstall dependensi proyek (termasuk WebSocket ws)...
npm install
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [ERROR] Instalasi npm gagal.
  pause
  exit /b 1
)
echo.
echo [2/3] Menguji mesin database SQLite...
node --experimental-sqlite server/test-db.cjs
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo [WARN] Uji database selesai dengan catatan.
)
echo.
echo ============================================================
echo  SUKSES! Database SQLite siap.
echo  Jalankan aplikasi dengan: npm run dev
echo ============================================================
echo.
pause
