import React, { useState } from 'react';
import {
  Shield,
  User,
  Lock,
  ArrowRight,
  School,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { storageService, getOrCreateDeviceId } from '../../services/storageService';

export default function LoginPortal({ institution, onLoginSuccess }) {
  const appModeConfig = storageService.getAppModeConfig();
  const isProduction = appModeConfig?.app_mode === 'production';
  const isSimulation = !isProduction;

  const [activeTab, setActiveTab] = useState(isProduction ? 'student' : 'admin'); // Mode produksi langsung siap untuk login siswa
  const [username, setUsername] = useState(isProduction ? '' : 'admin');
  const [password, setPassword] = useState(isProduction ? '' : 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(!institution?.recaptcha_enabled);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ssoModalOpen, setSsoModalOpen] = useState(false);
  const [ssoEmail, setSsoEmail] = useState('');

  const currentDeviceId = getOrCreateDeviceId();

  const handleFillDemo = (type) => {
    if (isProduction) {
      console.warn('SECURITY ALERT: Akun demo dinonaktifkan pada Mode Produksi Resmi.');
      return;
    }
    setErrorMsg('');
    if (type === 'admin') {
      setActiveTab('admin');
      setUsername('admin');
      setPassword('admin');
      setIsCaptchaVerified(true);
    } else if (type === 'proctor') {
      setActiveTab('admin');
      setUsername('proktor');
      setPassword('proktor');
      setIsCaptchaVerified(true);
    } else {
      setActiveTab('student');
      setUsername('0068291033'); // Contoh akun siswa: Bambang Pamungkas (Non-SSO)
      setPassword('23101'); // Password default NIS siswa
      setIsCaptchaVerified(true);
    }
  };

  const handleRecaptchaClick = () => {
    if (isCaptchaVerified) return;
    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setIsCaptchaVerified(true);
    }, 700);
  };

  const handleCredentialsLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (institution?.recaptcha_enabled && !isCaptchaVerified) {
      setErrorMsg('Harap centang verifikasi reCAPTCHA terlebih dahulu.');
      return;
    }

    const trimmedUser = username.trim();
    if (!trimmedUser || !password) {
      setErrorMsg('Silakan isi kolom Nama Pengguna / NISN dan Password.');
      return;
    }

    const user = storageService.getUserByUsername(trimmedUser);

    if (!user) {
      setErrorMsg(
        activeTab === 'student'
          ? 'Data Siswa (No. Ujian / NISN) tidak ditemukan di sistem sekolah. Pastikan nomor benar atau hubungi Admin/Pengawas.'
          : 'Nama Pengguna Administrator tidak ditemukan.'
      );
      return;
    }

    // ATURAN WAJIB SSO: Jika Google OAuth aktif dan sudah terhubung Google SSO, siswa WAJIB login via Google SSO
    const isGoogleOAuthActive = institution?.google_oauth_enabled !== false;
    if (isGoogleOAuthActive && user.role === 'student' && user.google_linked && user.google_id) {
      setErrorMsg(
        `Akun Anda (${user.nama}) telah terhubung ke Google SSO (${user.google_email || user.email}). Anda WAJIB masuk menggunakan tombol "Masuk dengan Google SSO Siswa" di bawah. Jika akses Google hilang, silakan lapor Admin/Proktor untuk Reset SSO.`
      );
      return;
    }

    if (user.password !== password) {
      setErrorMsg(
        activeTab === 'student'
          ? 'Password salah. Password default adalah nomor NIS siswa. Jika lupa, silakan lapor ke Admin/Proktor untuk Reset Password.'
          : 'Kombinasi Pengguna / Administrator dan Password tidak cocok.'
      );
      return;
    }

    if (!user.is_active) {
      setErrorMsg('Akun Anda dinonaktifkan oleh pihak sekolah. Hubungi proctor/admin.');
      return;
    }

    if (!user.is_verified) {
      setErrorMsg('Akun Anda belum diverifikasi oleh panitia ujian sekolah.');
      return;
    }

    // Cek penguncian 1 perangkat untuk siswa
    if (user.role === 'student') {
      if (user.active_device_id && user.active_device_id !== currentDeviceId) {
        setErrorMsg(
          `Akun terkunci di perangkat lain (${user.active_device_id}). Silakan temui pengawas ujian untuk "Reset Login Perangkat".`
        );
        return;
      }
      // Ikat perangkat sekarang
      user.active_device_id = currentDeviceId;
      storageService.saveUser(user);
    }

    storageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  const handleGoogleSsoSimulated = (emailInput) => {
    setErrorMsg('');
    const email = (emailInput || ssoEmail).trim().toLowerCase();
    if (!email) {
      setErrorMsg('Masukkan alamat email Google akun sekolah Anda.');
      return;
    }

    const user = storageService.getUserByEmail(email);
    if (!user) {
      setErrorMsg(`Email ${email} tidak terdaftar di database siswa/staf institusi ini.`);
      setSsoModalOpen(false);
      return;
    }

    if (!user.is_verified) {
      setErrorMsg('Akun Anda belum diverifikasi oleh panitia ujian sekolah.');
      setSsoModalOpen(false);
      return;
    }

    if (!user.is_active) {
      setErrorMsg('Akun Anda dinonaktifkan oleh administrator.');
      setSsoModalOpen(false);
      return;
    }

    if (user.role === 'student' && user.active_device_id && user.active_device_id !== currentDeviceId) {
      setErrorMsg(
        `Akun terkunci di perangkat lain (${user.active_device_id}). Hubungi pengawas untuk Reset Login.`
      );
      setSsoModalOpen(false);
      return;
    }

    if (user.role === 'student') {
      user.active_device_id = currentDeviceId;
      user.google_linked = true;
      if (!user.google_id) {
        let hash = 0;
        for (let i = 0; i < email.length; i++) {
          hash = (hash << 5) - hash + email.charCodeAt(i);
          hash |= 0;
        }
        user.google_id = '108' + Math.abs(hash).toString().padStart(12, '0').slice(0, 15);
      }
      user.google_email = email;
      user.google_linked_at = new Date().toISOString();
      storageService.saveUser(user);
    }

    setSsoModalOpen(false);
    storageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  const isGoogleOAuthActive = institution?.google_oauth_enabled !== false;
  const showSsoOption =
    isGoogleOAuthActive &&
    (institution?.auth_method === 'SSO_ONLY' || institution?.auth_method === 'BOTH');
  const showCredentialsOption =
    !isGoogleOAuthActive ||
    institution?.auth_method === 'CREDENTIALS_ONLY' ||
    institution?.auth_method === 'BOTH';

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
      {/* Header Institusi */}
      <header className="w-full max-w-md pt-6 pb-2 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white shadow-sm mb-3 overflow-hidden">
          {institution?.logo_url ? (
            <img
              src={institution.logo_url}
              alt="Logo Sekolah"
              className="w-full h-full object-contain p-1.5 bg-white"
            />
          ) : (
            <Shield className="w-6 h-6 text-zinc-100" />
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
          {institution?.name || 'ExamGuard Proctoring'}
        </h1>
        <div className="inline-flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-medium">
          <School className="w-3.5 h-3.5" />
          <span>
            {institution?.npsn ? `NPSN: ${institution.npsn} • ` : ''}Jenjang {institution?.education_level || 'SMA'} &bull; Sistem Terproteksi
          </span>
        </div>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-8 my-auto">
        {/* Tab Switcher: Admin / Siswa */}
        <div className="grid grid-cols-2 p-1 bg-zinc-100/90 rounded-xl mb-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
              if (username === '0058291021' || username === '0068291033') setUsername('admin');
              if (password === '22101' || password === '23101' || password === '0058291021') setPassword('admin');
            }}
            className={`py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'admin' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Admin / Pengawas
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
              if (username === 'admin') setUsername('0068291033');
              if (password === 'admin') setPassword('23101');
            }}
            className={`py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'student' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            Portal Peserta Ujian
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Form Login Kredensial */}
        {activeTab === 'student' && showSsoOption && institution?.auth_method === 'SSO_ONLY' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 text-center">
              <p className="text-xs text-zinc-600 mb-1">Sekolah ini menggunakan kebijakan</p>
              <p className="text-sm font-semibold text-zinc-900">Single Sign-On (Google Workspace)</p>
            </div>

            <button
              type="button"
              onClick={() => setSsoModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-sm font-medium text-zinc-800 shadow-xs transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Masuk dengan Akun Google Siswa</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {activeTab === 'student' ? 'Nomor Ujian / NISN Siswa' : 'Username Administrator'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === 'student' ? 'Contoh: UJN-12-001 atau 0058291021' : 'admin'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all"
                />
              </div>
              {activeTab === 'student' && (
                <p className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Login: <strong>No. Ujian / NISN</strong> &bull; Password: <strong>NIS Siswa</strong></span>
                  <span className="text-zinc-400">Reset lapor proktor</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">Kata Sandi (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all font-mono-num"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Google reCAPTCHA v2 Widget */}
            {institution?.recaptcha_enabled && (
              <div className="pt-1">
                <div
                  onClick={handleRecaptchaClick}
                  className="cursor-pointer border border-zinc-200 rounded-xl p-3 bg-zinc-50/80 hover:bg-zinc-100/70 transition-all flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                        isCaptchaVerified
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-zinc-300'
                      }`}
                    >
                      {captchaLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
                      ) : isCaptchaVerified ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      ) : null}
                    </div>
                    <span className="text-xs font-medium text-zinc-800">Saya bukan robot (reCAPTCHA)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-semibold text-zinc-400 tracking-wider">PROTECTED</div>
                    <div className="text-[9px] text-zinc-400">Google Policy</div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-xs transition-all duration-200 active:scale-[0.99]"
            >
              <span>{activeTab === 'student' ? 'Masuk ke Portal Ujian' : 'Masuk Dashboard Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {activeTab === 'student' && (
              <p className="text-[11px] text-zinc-500 text-center pt-1 leading-normal">
                Lupa kata sandi atau butuh reset SSO? <strong className="text-zinc-700">Wajib lapor ke Admin/Proktor</strong> untuk reset akun.
              </p>
            )}

            {/* Opsi SSO jika BOTH di tab siswa */}
            {activeTab === 'student' && showSsoOption && (
              <div className="pt-2">
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-zinc-400">atau</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSsoModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-zinc-300 bg-white hover:bg-zinc-50 rounded-xl text-xs font-medium text-zinc-700 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Masuk dengan Google SSO Siswa</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Informasi ID Perangkat Browser Siswa */}
        <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
            <span>ID Perangkat Klien:</span>
          </span>
          <span className="font-mono text-zinc-500 font-medium">{currentDeviceId}</span>
        </div>
      </main>

      {/* Modal Simulasi Google SSO */}
      {ssoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <h3 className="font-semibold text-zinc-900 text-sm">Google Workspace Sign-In</h3>
            </div>
            <p className="text-xs text-zinc-600 mb-4">
              Pilih atau masukkan email akun siswa Google Workspace Anda:
            </p>

            {isSimulation && (
              <div className="space-y-2 mb-4">
                <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                  Pilihan Cepat Akun Demo (Mode Simulasi)
                </div>
                <button
                  type="button"
                  onClick={() => handleGoogleSsoSimulated('ahmad.fauzi@student.sch.id')}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-zinc-800">Ahmad Fauzi (XII MIPA 1)</div>
                    <div className="text-zinc-400">ahmad.fauzi@student.sch.id</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleSsoSimulated('siti.rahma@student.sch.id')}
                  className="w-full text-left p-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-zinc-800">Siti Rahmawati (XII MIPA 2)</div>
                    <div className="text-zinc-400">siti.rahma@student.sch.id</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                {isSimulation ? 'Atau Ketik Email Akun Sekolah' : 'Ketik Email Akun Google Siswa'}
              </label>
              <input
                type="email"
                value={ssoEmail}
                onChange={(e) => setSsoEmail(e.target.value)}
                placeholder="nama@student.sch.id"
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSsoModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleGoogleSsoSimulated(ssoEmail)}
                className="flex-1 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Hak Cipta & Info Kredensial Pengujian */}
      <footer className="w-full max-w-md py-4 text-center">
        {isSimulation && (
          <div className="p-3 bg-zinc-100/90 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-600 mb-2 shadow-2xs animate-in fade-in">
            <p className="font-semibold text-zinc-800 mb-1.5 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Klik Cepat Akun Demo Pengujian (Mode Simulasi):</span>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="py-1.5 px-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg text-left transition-all hover:border-zinc-400 cursor-pointer"
              >
                <div className="text-[9.5px] text-zinc-500 font-medium">Super Admin:</div>
                <div className="font-mono font-bold text-zinc-900 text-[10.5px]">admin</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('proctor')}
                className="py-1.5 px-2 bg-white hover:bg-zinc-50 border border-emerald-300 bg-emerald-50/30 rounded-lg text-left transition-all hover:border-emerald-400 cursor-pointer"
              >
                <div className="text-[9.5px] text-emerald-700 font-medium">Proktor:</div>
                <div className="font-mono font-bold text-zinc-900 text-[10.5px]">proktor</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="py-1.5 px-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg text-left transition-all hover:border-zinc-400 cursor-pointer"
              >
                <div className="text-[9.5px] text-zinc-500 font-medium">Siswa:</div>
                <div className="font-mono font-bold text-zinc-900 text-[10.5px]">0068291033</div>
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-zinc-400">
          ExamGuard &copy; {new Date().getFullYear()} &bull; Arsitektur Produksi Siap cPanel
        </p>
      </footer>
    </div>
  );
}

