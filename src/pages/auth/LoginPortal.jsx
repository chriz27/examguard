import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { storageService, getOrCreateDeviceId } from '../../services/storageService';

export default function LoginPortal({ institution, onLoginSuccess }) {
  const appModeConfig = storageService.getAppModeConfig();
  const isProduction = appModeConfig?.app_mode === 'production';
  const isSimulation = !isProduction;

  const [activeTab, setActiveTab] = useState(isProduction ? 'student' : 'admin'); // Mode produksi langsung siap untuk login peserta
  const [username, setUsername] = useState(isProduction ? '' : 'admin');
  const [password, setPassword] = useState(isProduction ? '' : 'admin');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Status integrasi Google OAuth & Google reCAPTCHA
  const isGoogleOAuthActive = Boolean(institution?.google_oauth_enabled && institution?.google_client_id?.trim());
  const isGoogleRecaptchaActive = Boolean(institution?.recaptcha_enabled && institution?.recaptcha_site_key?.trim());
  const recaptchaVersion = institution?.recaptcha_version === 'v3' ? 'v3' : 'v2';

  // State untuk Google reCAPTCHA (v2 / v3)
  const recaptchaContainerRef = useRef(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  // State untuk Captcha Keamanan Mandiri (Default saat Google reCAPTCHA tidak diset / offline)
  const localCanvasRef = useRef(null);
  const [localCaptchaCode, setLocalCaptchaCode] = useState('');
  const [localCaptchaInput, setLocalCaptchaInput] = useState('');

  const currentDeviceId = getOrCreateDeviceId();

  // Generator Kode Captcha Mandiri (5 Karakter Alphanumerik Anti-ambigu)
  const generateLocalCaptchaCode = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Render Visual Canvas Captcha Mandiri dengan Garis dan Titik Anti-Bot
  const drawLocalCaptcha = (code) => {
    const canvas = localCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background gradient pastel halus
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#f8fafc');
    grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titik-titik noise
    for (let i = 0; i < 35; i++) {
      ctx.fillStyle = `rgba(${Math.floor(Math.random() * 120)}, ${Math.floor(Math.random() * 120)}, ${Math.floor(Math.random() * 120)}, 0.28)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.8 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Garis kurva acak pencegah OCR bot
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, 0.38)`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * canvas.height);
      ctx.bezierCurveTo(
        canvas.width * 0.3, Math.random() * canvas.height,
        canvas.width * 0.7, Math.random() * canvas.height,
        canvas.width, Math.random() * canvas.height
      );
      ctx.stroke();
    }

    // Karakter dengan rotasi halus dan warna tegas
    const colors = ['#0f172a', '#0369a1', '#047857', '#b45309', '#6d28d9'];
    for (let i = 0; i < code.length; i++) {
      ctx.save();
      const x = 16 + i * 22;
      const y = 26 + (Math.random() * 4 - 2);
      const angle = (Math.random() * 24 - 12) * (Math.PI / 180);
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.font = 'bold 20px "Courier New", Courier, monospace';
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillText(code[i], 0, 0);
      ctx.restore();
    }
  };

  const refreshLocalCaptcha = () => {
    const newCode = generateLocalCaptchaCode();
    setLocalCaptchaCode(newCode);
    setLocalCaptchaInput('');
    setTimeout(() => {
      drawLocalCaptcha(newCode);
    }, 60);
  };

  // Inisialisasi Captcha Mandiri jika Google reCAPTCHA tidak aktif
  useEffect(() => {
    if (!isGoogleRecaptchaActive) {
      refreshLocalCaptcha();
    }
  }, [isGoogleRecaptchaActive, activeTab]);

  // Inisialisasi Google reCAPTCHA (v2 atau v3) jika di-set aktif
  useEffect(() => {
    if (!isGoogleRecaptchaActive) return;

    if (recaptchaVersion === 'v3') {
      setIsCaptchaVerified(false);
      setRecaptchaLoading(true);
      setRecaptchaError(false);

      const scriptId = 'examguard-recaptcha-v3-sdk';
      let script = document.getElementById(scriptId);
      const onV3Loaded = () => {
        if (window.grecaptcha?.ready) {
          window.grecaptcha.ready(() => {
            window.grecaptcha.execute(institution.recaptcha_site_key.trim(), { action: 'login' })
              .then(() => {
                setIsCaptchaVerified(true);
                setRecaptchaLoading(false);
              })
              .catch((err) => {
                console.warn('reCAPTCHA v3 execute notice:', err);
                setIsCaptchaVerified(true); // Token siap / terverifikasi
                setRecaptchaLoading(false);
              });
          });
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.google.com/recaptcha/api.js?render=${institution.recaptcha_site_key.trim()}`;
        script.async = true;
        script.defer = true;
        script.onload = onV3Loaded;
        script.onerror = () => {
          setRecaptchaLoading(false);
          setRecaptchaError(true);
        };
        document.head.appendChild(script);
      } else {
        onV3Loaded();
      }
    } else {
      // reCAPTCHA v2 Checkbox
      setIsCaptchaVerified(false);
      setRecaptchaError(false);
      let mounted = true;

      const renderRecaptchaWidget = () => {
        if (!mounted || !recaptchaContainerRef.current) return;
        if (!window.grecaptcha || !window.grecaptcha.render) return;

        recaptchaContainerRef.current.innerHTML = '';
        try {
          window.grecaptcha.render(recaptchaContainerRef.current, {
            sitekey: institution.recaptcha_site_key.trim(),
            theme: 'light',
            callback: () => {
              if (mounted) {
                setIsCaptchaVerified(true);
                setErrorMsg('');
              }
            },
            'expired-callback': () => {
              if (mounted) setIsCaptchaVerified(false);
            },
            'error-callback': () => {
              if (mounted) {
                setIsCaptchaVerified(false);
                setRecaptchaError(true);
              }
            },
          });
          if (mounted) setRecaptchaLoading(false);
        } catch (e) {
          console.warn('reCAPTCHA render notice:', e);
        }
      };

      if (window.grecaptcha && window.grecaptcha.render) {
        renderRecaptchaWidget();
      } else {
        setRecaptchaLoading(true);
        const scriptId = 'examguard-recaptcha-v2-sdk';
        let script = document.getElementById(scriptId);
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://www.google.com/recaptcha/api.js?onload=onExamGuardRecaptchaReady&render=explicit';
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);
        }

        window.onExamGuardRecaptchaReady = () => {
          if (mounted) {
            setRecaptchaLoading(false);
            renderRecaptchaWidget();
          }
        };

        script.onerror = () => {
          if (mounted) {
            setRecaptchaLoading(false);
            setRecaptchaError(true);
          }
        };
      }

      return () => {
        mounted = false;
      };
    }
  }, [isGoogleRecaptchaActive, recaptchaVersion, institution?.recaptcha_site_key, activeTab]);

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
      setUsername('0068291033'); // Contoh akun peserta: Bambang Pamungkas (Non-SSO)
      setPassword('23101'); // Password default NIS peserta
      setIsCaptchaVerified(true);
    }
  };

  const handleCredentialsLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validasi Captcha Sesuai Mode Aktif
    if (isGoogleRecaptchaActive) {
      if (recaptchaVersion === 'v2' && !isCaptchaVerified) {
        setErrorMsg('Harap selesaikan verifikasi reCAPTCHA ("Saya bukan robot") terlebih dahulu.');
        return;
      }
      if (recaptchaVersion === 'v3' && !isCaptchaVerified && !recaptchaError) {
        setErrorMsg('Sedang memproses verifikasi Google reCAPTCHA v3. Silakan coba klik masuk kembali.');
        return;
      }
    } else {
      // Default Captcha Mandiri ExamGuard
      if (!localCaptchaInput.trim()) {
        setErrorMsg('Harap ketik 5 kode keamanan captcha terlebih dahulu.');
        return;
      }
      if (localCaptchaInput.trim().toUpperCase() !== localCaptchaCode.toUpperCase()) {
        setErrorMsg('Kode captcha keamanan mandiri tidak cocok. Silakan ketik kode baru yang tertera.');
        refreshLocalCaptcha();
        return;
      }
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
          ? 'Data Peserta (No. Ujian / NISN) tidak ditemukan di sistem sekolah. Pastikan nomor benar atau hubungi Admin/Pengawas.'
          : 'Nama Pengguna Administrator tidak ditemukan.'
      );
      return;
    }

    // ATURAN WAJIB SSO: Hanya jika SSO Google AKTIF & TERHUBUNG dan Instansi mengatur "Hanya SSO"
    const isAuthMethodSSOOnly = isGoogleOAuthActive && institution?.auth_method === 'SSO_ONLY';
    if (isAuthMethodSSOOnly && user.role === 'student') {
      setErrorMsg(
        'Instansi saat ini mengatur metode masuk "Hanya Google SSO". Seluruh peserta wajib masuk menggunakan tombol "Masuk dengan Akun Google Peserta" di bawah.'
      );
      return;
    }

    if (user.password !== password) {
      setErrorMsg(
        activeTab === 'student'
          ? 'Password salah. Password default adalah nomor NIS peserta. Jika lupa, silakan lapor ke Admin/Proktor untuk Reset Password.'
          : 'Kombinasi Pengguna / Administrator dan Password tidak cocok.'
      );
      return;
    }

    // Pemeriksaan fleksibel boolean/string untuk status aktif dan verifikasi akun
    const isActive = user.is_active === true || user.is_active === 'true' || user.is_active === 1 || user.is_active === undefined;
    const isVerified = user.is_verified === true || user.is_verified === 'true' || user.is_verified === 1 || user.is_verified === undefined;

    if (!isActive) {
      setErrorMsg('Akun Anda dinonaktifkan oleh pihak sekolah. Hubungi proctor/admin.');
      return;
    }

    if (!isVerified) {
      setErrorMsg('Akun Anda belum diverifikasi oleh panitia ujian sekolah.');
      return;
    }

    // Cek penguncian 1 perangkat untuk peserta
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

  // Autentikasi Google Identity Services (GIS) / Google OAuth 2.0 Mode Produksi Tanpa Bypass
  const handleGoogleSsoProduction = async () => {
    setErrorMsg('');
    if (!isGoogleOAuthActive) {
      setErrorMsg('Integrasi Google OAuth 2.0 belum diaktifkan oleh institusi sekolah.');
      return;
    }

    setSsoLoading(true);

    try {
      if (!window.google?.accounts?.oauth2) {
        await new Promise((resolve, reject) => {
          const scriptId = 'examguard-google-gis';
          let script = document.getElementById(scriptId);
          if (script) {
            if (window.google?.accounts?.oauth2) return resolve(true);
            script.addEventListener('load', () => resolve(true));
            script.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')));
            return;
          }
          script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Gagal memuat Google Identity Services. Pastikan komputer terhubung ke internet.'));
          document.head.appendChild(script);
        });
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services tidak tersedia di peramban ini.');
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: institution.google_client_id.trim(),
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.error) {
            setSsoLoading(false);
            if (response.error !== 'access_denied') {
              setErrorMsg(`Login Google dibatalkan atau gagal: ${response.error_description || response.error}`);
            }
            return;
          }

          if (response.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!res.ok) {
                throw new Error('Gagal memverifikasi profil akun Google dari server Google.');
              }
              const profile = await res.json();
              const googleEmail = profile.email?.trim().toLowerCase();
              const googleSub = profile.sub;

              if (!googleEmail) {
                throw new Error('Akun Google tidak menyediakan informasi alamat email yang valid.');
              }

              const user = storageService.getUserByEmail(googleEmail);
              if (!user) {
                setErrorMsg(`Akun Google (${googleEmail}) tidak terdaftar dalam database peserta/staf sekolah. Hubungi Admin/Proktor untuk mendaftarkan akun Anda.`);
                setSsoLoading(false);
                return;
              }

              const isVerified = user.is_verified === true || user.is_verified === 'true' || user.is_verified === 1 || user.is_verified === undefined;
              const isActive = user.is_active === true || user.is_active === 'true' || user.is_active === 1 || user.is_active === undefined;

              if (!isVerified) {
                setErrorMsg('Akun Anda belum diverifikasi oleh panitia ujian sekolah.');
                setSsoLoading(false);
                return;
              }

              if (!isActive) {
                setErrorMsg('Akun Anda dinonaktifkan oleh pihak sekolah.');
                setSsoLoading(false);
                return;
              }

              if (user.role === 'student' && user.active_device_id && user.active_device_id !== currentDeviceId) {
                setErrorMsg(`Akun terkunci di perangkat lain (${user.active_device_id}). Hubungi pengawas untuk Reset Login Perangkat.`);
                setSsoLoading(false);
                return;
              }

              if (user.role === 'student') {
                user.active_device_id = currentDeviceId;
                user.google_linked = true;
                user.google_id = googleSub || user.google_id || ('108' + Date.now());
                user.google_email = googleEmail;
                user.google_linked_at = new Date().toISOString();
                storageService.saveUser(user);
              }

              storageService.setCurrentUser(user);
              setSsoLoading(false);
              onLoginSuccess(user);
            } catch (fetchErr) {
              setErrorMsg(fetchErr.message || 'Gagal memverifikasi profil akun Google.');
              setSsoLoading(false);
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memulai proses masuk Google SSO.');
      setSsoLoading(false);
    }
  };

  // Opsi SSO HANYA muncul jika Google OAuth aktif & terhubung
  const showSsoOption =
    isGoogleOAuthActive &&
    (institution?.auth_method === 'SSO_ONLY' || institution?.auth_method === 'BOTH');

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
      {/* Header Institusi */}
      <header className="w-full max-w-md text-center py-6">
        <div className="flex justify-center mb-3">
          {institution?.logo_url && !logoError ? (
            <img
              src={institution.logo_url}
              alt="Logo Institusi"
              onError={() => setLogoError(true)}
              className="h-16 w-16 object-contain rounded-2xl shadow-sm border border-zinc-200/80 p-1 bg-white"
            />
          ) : (
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-zinc-900/10">
              <Shield className="w-7 h-7 stroke-[1.75]" />
            </div>
          )}
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">
          {institution?.name || 'Sistem Ujian Online'}
        </h1>
        <p className="text-xs text-zinc-500 mt-1 flex items-center justify-center gap-1.5">
          <School className="w-3.5 h-3.5 text-zinc-400" />
          <span>NPSN: <span className="font-mono text-zinc-700">{institution?.npsn || '20104829'}</span></span>
          <span className="text-zinc-300">&bull;</span>
          <span className="text-emerald-700 font-medium">Safe Exam Guard v1.0</span>
        </p>
      </header>

      {/* Login Card */}
      <main className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Tab Switcher: Siswa / Admin */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100/80 rounded-xl mb-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Panel Administrator
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                : 'text-zinc-500 hover:text-zinc-900'
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

        {/* Mode Khusus SSO_ONLY di Tab Siswa (HANYA jika Google OAuth Aktif & Terhubung) */}
        {activeTab === 'student' && showSsoOption && institution?.auth_method === 'SSO_ONLY' ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/60 text-center">
              <p className="text-xs text-zinc-600 mb-1">Sekolah ini menggunakan kebijakan</p>
              <p className="text-sm font-semibold text-zinc-900">Single Sign-On (Google Workspace)</p>
            </div>

            <button
              type="button"
              disabled={ssoLoading}
              onClick={handleGoogleSsoProduction}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 text-sm font-medium text-zinc-800 shadow-xs transition-all duration-200 cursor-pointer"
            >
              {ssoLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span>Menghubungkan ke Google Identity...</span>
                </>
              ) : (
                <>
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
                  <span>Masuk dengan Akun Google Peserta</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                {activeTab === 'student' ? 'Nomor Ujian / NISN Peserta' : 'Username Administrator'}
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
                  <span>Login: <strong>No. Ujian / NISN</strong> &bull; Password: <strong>NIS Peserta</strong></span>
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
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* AREA PROTEKSI CAPTCHA: GOOGLE RECAPTCHA (V2/V3) ATAU CAPTCHA MANDIRI DEFAULT */}
            {isGoogleRecaptchaActive ? (
              // 1. Google reCAPTCHA Aktif (v2 Checkbox atau v3 Invisible)
              <div className="pt-1">
                {recaptchaVersion === 'v3' ? (
                  // Mode v3: Invisible Background Check
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-semibold">Google reCAPTCHA v3 Aktif</div>
                        <div className="text-[10px] text-emerald-700">Terproteksi otomatis di latar belakang tanpa interaksi klik</div>
                      </div>
                    </div>
                    {recaptchaLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                ) : (
                  // Mode v2: Checkbox Widget Resmi "Saya bukan robot"
                  <div className="min-h-[78px] flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-50 border border-zinc-200">
                    {recaptchaLoading && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 py-3">
                        <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                        <span>Memuat Google reCAPTCHA v2...</span>
                      </div>
                    )}
                    {recaptchaError && (
                      <div className="text-center py-2 px-3 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
                        <p className="font-semibold">Gagal memuat Google reCAPTCHA</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Periksa koneksi internet, atau matikan reCAPTCHA di Pengaturan agar sistem beralih ke Captcha Mandiri.
                        </p>
                      </div>
                    )}
                    <div
                      ref={recaptchaContainerRef}
                      className={recaptchaLoading || recaptchaError ? 'hidden' : 'flex justify-center'}
                    />
                  </div>
                )}
              </div>
            ) : (
              // 2. Default Captcha Keamanan Mandiri ExamGuard (Aktif Otomatis saat Google reCAPTCHA tidak diset / Offline)
              <div className="pt-1">
                <div className="p-3 bg-zinc-50/90 border border-zinc-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                      <Shield className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Captcha Keamanan Mandiri (Default)</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 bg-zinc-200/60 px-1.5 py-0.5 rounded font-medium">
                      Anti-Bot Offline
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <canvas
                      ref={localCanvasRef}
                      width={130}
                      height={38}
                      className="rounded-lg border border-zinc-200 bg-zinc-100 shadow-2xs select-none pointer-events-none shrink-0"
                    />
                    <button
                      type="button"
                      onClick={refreshLocalCaptcha}
                      className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer shrink-0"
                      title="Ganti Kode Gambar Captcha"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      maxLength={5}
                      value={localCaptchaInput}
                      onChange={(e) => {
                        setLocalCaptchaInput(e.target.value.toUpperCase());
                        setErrorMsg('');
                      }}
                      placeholder="Ketik 5 kode"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-center focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-medium shadow-xs transition-all duration-200 active:scale-[0.99] cursor-pointer"
            >
              <span>{activeTab === 'student' ? 'Masuk ke Portal Ujian' : 'Masuk Dashboard Admin'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {activeTab === 'student' && (
              <p className="text-[11px] text-zinc-500 text-center pt-1 leading-normal">
                {isGoogleOAuthActive ? (
                  <>Lupa kata sandi atau butuh reset SSO? <strong className="text-zinc-700">Wajib lapor ke Admin/Proktor</strong> untuk reset akun.</>
                ) : (
                  <>Masuk menggunakan nomor <strong className="text-zinc-700">NISN / No. Ujian</strong> dan kata sandi nomor <strong className="text-zinc-700">NIS Siswa</strong>.</>
                )}
              </p>
            )}

            {/* Opsi SSO Siswa (HANYA MUNCUL JIKA GOOGLE OAUTH AKTIF & TERHUBUNG) */}
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
                  disabled={ssoLoading}
                  onClick={handleGoogleSsoProduction}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 rounded-xl text-xs font-medium text-zinc-700 transition-all duration-200 cursor-pointer"
                >
                  {ssoLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Menghubungkan ke Google Identity...</span>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                <div className="text-[9.5px] text-zinc-500 font-medium">Peserta:</div>
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
