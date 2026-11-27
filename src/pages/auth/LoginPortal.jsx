import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  User,
  Lock,
  ArrowRight,
  School,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Check,
  QrCode,
  Camera,
  X,
  ChevronRight,
} from 'lucide-react';
import QrScannerModal from '../../components/common/QrScannerModal';
import { storageService, getOrCreateDeviceId, getDeviceClientInfo } from '../../services/storageService';
import { APP_VERSION } from '../../constants/appVersion';

export default function LoginPortal({ institution: propInstitution, onLoginSuccess }) {
  const [instState, setInstState] = useState(() => propInstitution || storageService.getInstitution() || {});

  useEffect(() => {
    if (propInstitution) {
      setInstState(propInstitution);
    }
  }, [propInstitution]);

  useEffect(() => {
    const handleSync = () => {
      setInstState(storageService.getInstitution() || {});
    };
    window.addEventListener('examguard_storage_updated', handleSync);
    window.addEventListener('examguard_db_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('examguard_storage_updated', handleSync);
      window.removeEventListener('examguard_db_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const institution = instState;
  // Status mode lingkungan aplikasi — selalu sinkron dengan database
  const [appModeConfig, setAppModeConfig] = useState(() => storageService.getAppModeConfig());
  const isProduction = appModeConfig?.app_mode === 'production';
  const isSimulation = !isProduction;
  const isGoogleSsoBypassed = isSimulation && Boolean(appModeConfig?.bypass_google_sso);

  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const logoClickTimerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('student'); // Default selalu Portal Peserta
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Handler klik logo:
  // 7x ketuk membuka form login administrator rahasia.
  // Ketukan ke-8 (atau lebih dari 7x / saat form admin sedang terbuka) akan mengembalikan ke form login siswa.
  const handleLogoClick = () => {
    if (isAdminUnlocked) {
      if (logoClickTimerRef.current) clearTimeout(logoClickTimerRef.current);
      setLogoClicks(0);
      setIsAdminUnlocked(false);
      setActiveTab('student');
      setErrorMsg('');
      setUsername('');
      setPassword('');
      return;
    }

    if (logoClickTimerRef.current) {
      clearTimeout(logoClickTimerRef.current);
    }

    const nextClicks = logoClicks + 1;
    if (nextClicks === 7) {
      setLogoClicks(0);
      setIsAdminUnlocked(true);
      setActiveTab('admin');
      setErrorMsg('');
      if (!isProduction) {
        setUsername('admin');
        setPassword('admin');
      } else {
        setUsername('');
        setPassword('');
      }
    } else if (nextClicks > 7) {
      setLogoClicks(0);
      setIsAdminUnlocked(false);
      setActiveTab('student');
      setErrorMsg('');
    } else {
      setLogoClicks(nextClicks);
      logoClickTimerRef.current = setTimeout(() => {
        setLogoClicks(0);
      }, 2500);
    }
  };

  // Status integrasi Google OAuth & Google reCAPTCHA
  const isGoogleOAuthActive = Boolean(
    (institution?.google_oauth_verified || institution?.google_oauth_verified_email) &&
    institution?.google_oauth_enabled &&
    institution?.google_client_id?.trim()
  );
  const isGoogleRecaptchaActive = Boolean(institution?.recaptcha_enabled && institution?.recaptcha_site_key?.trim());
  const recaptchaVersion = institution?.recaptcha_version === 'v3' ? 'v3' : 'v2';

  // State untuk Google reCAPTCHA (v2 / v3)
  const recaptchaContainerRef = useRef(null);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // State untuk alur Google One Tap / Penautan / Verifikasi Email SSO
  const [authStep, setAuthStep] = useState('idle'); // 'idle' | 'google_linking' | 'google_verifying' | 'sso_confirm_identity'
  const [pendingStudent, setPendingStudent] = useState(null);
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState(null);
  const [googleMismatchError, setGoogleMismatchError] = useState('');

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

  // Sinkronisasi status Mode Produksi / Simulasi selalu dicek dari database server
  useEffect(() => {
    storageService.fetchAppModeFromServer().then((conf) => {
      if (conf) setAppModeConfig(conf);
    });

    const handleAppModeChange = (e) => {
      if (e?.detail?.config) {
        setAppModeConfig(e.detail.config);
      } else {
        storageService.fetchAppModeFromServer().then((conf) => {
          if (conf) setAppModeConfig(conf);
        });
      }
    };

    window.addEventListener('examguard_storage_updated', handleAppModeChange);
    window.addEventListener('examguard_db_updated', handleAppModeChange);
    return () => {
      window.removeEventListener('examguard_storage_updated', handleAppModeChange);
      window.removeEventListener('examguard_db_updated', handleAppModeChange);
    };
  }, []);

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

  // Handler Login Otomatis via Scan QR Code Kartu Ujian
  const handleQrScanSuccess = (decodedPayload) => {
    setIsQrScannerOpen(false);
    setErrorMsg('');

    let token = String(decodedPayload || '').trim();
    if (token.startsWith('{') && token.endsWith('}')) {
      try {
        const parsed = JSON.parse(token);
        token = parsed.login_token || parsed.token || parsed.nisn || parsed.nomor_ujian || parsed.username || token;
      } catch {}
    }

    const user = storageService.getUserByLoginToken(token) || storageService.getUserByUsername(token);

    if (!user) {
      setErrorMsg('Data peserta dari QR Code / Token tidak ditemukan di sistem sekolah. Pastikan kartu ujian benar atau hubungi pengawas.');
      return;
    }

    if (user.role !== 'student') {
      setErrorMsg('QR Code ini bukan akun peserta ujian.');
      return;
    }

    const isActive = user.is_active === true || user.is_active === 'true' || user.is_active === 1 || user.is_active === undefined;
    const isVerified = user.is_verified === true || user.is_verified === 'true' || user.is_verified === 1 || user.is_verified === undefined;

    if (!isActive) {
      setErrorMsg('Akun peserta Anda dinonaktifkan oleh pihak sekolah. Hubungi proctor/admin.');
      return;
    }

    if (!isVerified) {
      setErrorMsg('Akun peserta Anda belum diverifikasi oleh panitia ujian sekolah.');
      return;
    }

    // Cek penguncian perangkat jika diaktifkan oleh kebijakan sekolah
    const isDeviceLockEnabled = institution?.lock_device_enabled !== false;
    if (isDeviceLockEnabled && user.active_device_id && user.active_device_id !== currentDeviceId) {
      setErrorMsg(
        `Akun terkunci di perangkat lain (${user.active_device_id}). Sesuai kebijakan sekolah, akun Anda terikat pada 1 perangkat. Silakan lapor pengawas ujian untuk "Reset Login Perangkat".`
      );
      return;
    }

    // ─────────────────────────────────────────────────────────────────
    // ATURAN SSO UNTUK MODE 'BOTH' (Google SSO & No. Ujian / NISN):
    // "metodelogin scan kartu ujian qr ini hanya menggantukan metode input manual
    // dan tetap melakukan cek email seperti seharusnya."
    // (Di-bypass otomatis jika Mode Simulasi / bypass_google_sso aktif)
    // ─────────────────────────────────────────────────────────────────
    if (!isGoogleSsoBypassed && isGoogleOAuthActive && institution?.auth_method === 'BOTH') {
      const hasGoogleEmail = Boolean((user.google_email || user.email)?.trim());
      const isGoogleLinked = Boolean(user.google_linked && hasGoogleEmail && user.google_id);

      if (!isGoogleLinked) {
        setPendingStudent(user);
        setGoogleMismatchError('');
        setAuthStep('google_linking');
        triggerGoogleOneTap(user, 'google_linking');
        return;
      } else {
        setPendingStudent(user);
        setGoogleMismatchError('');
        setAuthStep('google_verifying');
        triggerGoogleOneTap(user, 'google_verifying');
        return;
      }
    }

    // Jika bukan BOTH atau Google OAuth tidak aktif
    user.active_device_id = currentDeviceId;
    storageService.saveUser(user);
    storageService.setCurrentUser(user);
    onLoginSuccess(user);
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
    // (Bebas login kredensial jika Mode Simulasi / bypass_google_sso aktif)
    const isAuthMethodSSOOnly = !isGoogleSsoBypassed && isGoogleOAuthActive && institution?.auth_method === 'SSO_ONLY';
    if (isAuthMethodSSOOnly && user.role === 'student') {
      setErrorMsg(
        'Instansi saat ini mengatur metode masuk "Hanya Google SSO". Seluruh peserta wajib masuk menggunakan tombol "Masuk dengan Akun Google Peserta" di bawah.'
      );
      return;
    }

    let isPwMatch = false;
    if (user.role === 'admin' || user.username === 'admin') {
      isPwMatch = (password === (user.password || 'admin'));
    } else if (user.role === 'proctor' || user.username === 'proktor') {
      isPwMatch = (password === (user.password || 'proktor'));
    } else {
      const expectedStudentPw = user.password || user.nis || user.nisn || '123456';
      isPwMatch = (password === expectedStudentPw);
    }

    if (!isPwMatch) {
      setErrorMsg(
        activeTab === 'student'
          ? 'Password salah. Silakan periksa kembali atau hubungi proktor/pengawas ujian jika memerlukan bantuan reset kata sandi.'
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
      const isDeviceLockEnabled = institution?.lock_device_enabled !== false;
      if (isDeviceLockEnabled && user.active_device_id && user.active_device_id !== currentDeviceId) {
        setErrorMsg(
          `Akun terkunci di perangkat lain (${user.active_device_id}). Sesuai kebijakan sekolah, akun Anda terikat pada 1 perangkat. Silakan temui pengawas ujian untuk "Reset Login Perangkat".`
        );
        return;
      }

      // ─────────────────────────────────────────────────────────────────
      // ATURAN SSO UNTUK MODE 'BOTH' (Google SSO & No. Ujian / NISN):
      // Jika Google OAuth aktif di sekolah dan metode login adalah 'BOTH'
      // (Di-bypass otomatis jika Mode Simulasi / bypass_google_sso aktif)
      // ─────────────────────────────────────────────────────────────────
      if (!isGoogleSsoBypassed && isGoogleOAuthActive && institution?.auth_method === 'BOTH') {
        const hasGoogleEmail = Boolean((user.google_email || user.email)?.trim());
        const isGoogleLinked = Boolean(user.google_linked && hasGoogleEmail && user.google_id);

        if (!isGoogleLinked) {
          // Kasus 1: Belum ada email untuk SSO / belum punya ID Google
          // Terapkan Google One Tap login, simpan ke database
          setPendingStudent(user);
          setGoogleMismatchError('');
          setAuthStep('google_linking');
          triggerGoogleOneTap(user, 'google_linking');
          return;
        } else {
          // Kasus 2: Sudah ada email tersimpan di database
          // Cek apakah sama dengan email yang digunakan
          setPendingStudent(user);
          setGoogleMismatchError('');
          setAuthStep('google_verifying');
          triggerGoogleOneTap(user, 'google_verifying');
          return;
        }
      }

      // Ikat perangkat jika mode bukan BOTH atau Google OAuth tidak aktif
      user.active_device_id = currentDeviceId;
      storageService.saveUser(user);
    }

    storageService.setCurrentUser(user);
    onLoginSuccess(user);
  };

  // Muat library Google Identity Services (GIS) client
  const ensureGoogleGis = () => {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
        return resolve(true);
      }
      const scriptId = 'examguard-google-gis';
      let script = document.getElementById(scriptId);
      if (script) {
        if (window.google?.accounts?.id && window.google?.accounts?.oauth2) return resolve(true);
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
  };

  // Eksekusi prompt Google One Tap
    // Otomatis aktifkan Google One Tap sejak halaman login dimuat jika Google SSO aktif
  useEffect(() => {
    if (isGoogleOAuthActive && institution?.google_client_id?.trim()) {
      const timer = setTimeout(() => {
        try {
          triggerGoogleOneTap(null, 'sso_login');
        } catch {}
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isGoogleOAuthActive, institution?.google_client_id]);

  const triggerGoogleOneTap = async (targetStudent, mode) => {
    if (!institution?.google_client_id?.trim()) return;
    try {
      await ensureGoogleGis();
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: institution.google_client_id.trim(),
        callback: (response) => {
          if (response.credential) {
            handleGoogleCredential(response.credential, targetStudent, mode);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('[OneTap] Status:', notification.getNotDisplayedReason?.() || notification.getSkippedReason?.());
        }
      });
    } catch (err) {
      console.warn('[OneTap] Init error:', err);
    }
  };

  // Handler respon JWT dari Google One Tap
  const handleGoogleCredential = (jwtCredential, targetStudent, mode) => {
    try {
      const base64Url = jwtCredential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      const googleEmail = payload.email?.trim().toLowerCase();
      const googleSub = payload.sub;
      processGoogleAuthSuccess({ email: googleEmail, sub: googleSub, name: payload.name }, targetStudent, mode);
    } catch (err) {
      console.error('Gagal membaca token Google:', err);
      setGoogleMismatchError('Gagal memvalidasi token dari Google.');
    }
  };

  // Autentikasi Google interaktif melalui popup dialog GIS
  const handleManualGoogleAuth = async (targetStudent, mode) => {
    setErrorMsg('');
    setGoogleMismatchError('');

    if (!institution?.google_client_id?.trim()) {
      setGoogleMismatchError('Google Client ID belum dikonfigurasi di pengaturan instansi oleh Administrator.');
      return;
    }

    setSsoLoading(true);
    try {
      await ensureGoogleGis();
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
              setGoogleMismatchError(`Autentikasi Google dibatalkan atau gagal: ${response.error_description || response.error}`);
            }
            return;
          }
          if (response.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!res.ok) throw new Error('Gagal memverifikasi profil akun Google dari server Google.');
              const profile = await res.json();
              const googleEmail = profile.email?.trim().toLowerCase();
              const googleSub = profile.sub;
              setSsoLoading(false);
              processGoogleAuthSuccess({ email: googleEmail, sub: googleSub, name: profile.name }, targetStudent, mode);
            } catch (fe) {
              setSsoLoading(false);
              setGoogleMismatchError(fe.message || 'Gagal memverifikasi profil Google.');
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setSsoLoading(false);
      setGoogleMismatchError(err.message || 'Gagal membuka Google Sign-in.');
    }
  };

  // Proses sukses autentikasi Google untuk ketiga alur: Linking, Verifying, dan SSO Only
  const processGoogleAuthSuccess = async (googleProfile, targetStudent, mode) => {
    const student = targetStudent || pendingStudent;
    const currentMode = mode || authStep;

    if (!googleProfile.email) {
      setGoogleMismatchError('Akun Google tidak menyediakan informasi alamat email yang valid.');
      return;
    }

    const email = googleProfile.email.trim().toLowerCase();
    const sub = googleProfile.sub;

    // ─────────────────────────────────────────────────────────────
    // KASUS 1: PENAUTAN AKUN GOOGLE (GOOGLE LINKING)
    // Mode login: BOTH. Kredensial No. Ujian/NISN valid, tapi belum punya email/ID Google.
    // Simpan email & sub ke database, lalu lanjut ke pre-flight!
    // ─────────────────────────────────────────────────────────────
    if (currentMode === 'google_linking') {
      // Cek apakah email telah digunakan di akun peserta lain
      const existingOther = await storageService.getUserByEmailFromServer(email);
      if (existingOther && String(existingOther.id) !== String(student.id)) {
        setGoogleMismatchError(
          `Akun Google (${email}) sudah digunakan oleh peserta lain atas nama "${existingOther.nama || 'Peserta Lain'}" (NISN: ${existingOther.nisn || existingOther.nis || '-'}). Setiap peserta wajib menggunakan email pribadi yang belum terdaftar di akun lain.`
        );
        return;
      }

      const updated = {
        ...student,
        google_linked: true,
        google_id: sub || ('gid_' + Date.now()),
        google_email: email,
        google_linked_at: new Date().toISOString(),
        email: student.email || email,
        active_device_id: currentDeviceId,
      };
      storageService.saveUser(updated);
      storageService.setCurrentUser(updated);
      setAuthStep('idle');
      setPendingStudent(null);
      setPendingGoogleProfile(null);
      setGoogleMismatchError('');
      onLoginSuccess(updated);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // KASUS 2: VERIFIKASI AKUN GOOGLE (GOOGLE VERIFYING)
    // Mode login: BOTH. Kredensial valid, data email sudah ada di database.
    // Cek apakah email Google yang login SAMA dengan yang di database.
    // ─────────────────────────────────────────────────────────────
    if (currentMode === 'google_verifying') {
      const expectedEmail = (student.google_email || student.email || '').trim().toLowerCase();
      const actualEmail = email;

      if (expectedEmail && actualEmail !== expectedEmail) {
        setGoogleMismatchError(
          `Email Google yang digunakan (${actualEmail}) tidak terdaftar untuk peserta ${student.nama} (${student.nisn || student.nomor_ujian}). Silakan gunakan email terdaftar: ${expectedEmail}`
        );
        return;
      }

      // Email cocok dan data diri cocok! Lanjut ke pre-flight
      const updated = {
        ...student,
        active_device_id: currentDeviceId,
        ...(student.google_linked ? {} : {
          google_linked: true,
          google_id: sub || student.google_id || ('gid_' + Date.now()),
          google_email: email,
          google_linked_at: new Date().toISOString(),
        }),
      };
      storageService.saveUser(updated);
      storageService.setCurrentUser(updated);
      setAuthStep('idle');
      setPendingStudent(null);
      setPendingGoogleProfile(null);
      setGoogleMismatchError('');
      onLoginSuccess(updated);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // KASUS 3: LOGIN DENGAN SSO ONLY (SSO_ONLY)
    // Peserta klik "Masuk dengan Akun Google Peserta".
    // Cek apakah email terdaftar di database peserta.
    // Jika ada: Munculkan Konfirmasi Identitas Peserta.
    // Jika tidak ada: Peringatan email tidak terdaftar.
    // ─────────────────────────────────────────────────────────────
    if (currentMode === 'sso_login' || institution?.auth_method === 'SSO_ONLY') {
      const emailLower = email;
      storageService.getUserByEmailFromServer(emailLower).then((matched) => {
        if (!matched || matched.role !== 'student') {
          setErrorMsg(
            `Akun Google (${emailLower}) tidak terdaftar dalam database peserta ujian sekolah. Silakan gunakan akun Google resmi yang terdaftar, atau hubungi Admin/Proktor.`
          );
          setAuthStep('idle');
          return;
        }

        const isVerified = matched.is_verified === true || matched.is_verified === 'true' || matched.is_verified === 1 || matched.is_verified === undefined;
        const isActive = matched.is_active === true || matched.is_active === 'true' || matched.is_active === 1 || matched.is_active === undefined;

        if (!isVerified) {
          setErrorMsg('Akun peserta Anda belum diverifikasi oleh panitia ujian sekolah.');
          setAuthStep('idle');
          return;
        }
        if (!isActive) {
          setErrorMsg('Akun peserta Anda dinonaktifkan oleh pihak sekolah.');
          setAuthStep('idle');
          return;
        }
        const isDeviceLockEnabled = institution?.lock_device_enabled !== false;
        if (isDeviceLockEnabled && matched.active_device_id && matched.active_device_id !== currentDeviceId) {
          setErrorMsg(`Akun terkunci di perangkat lain (${matched.active_device_id}). Sesuai kebijakan sekolah, akun Anda terikat pada 1 perangkat. Hubungi pengawas untuk Reset Login Perangkat.`);
          setAuthStep('idle');
          return;
        }

        // Tampilkan Modal Konfirmasi Identitas Peserta
        setPendingStudent(matched);
        setPendingGoogleProfile(googleProfile);
        setAuthStep('sso_confirm_identity');
      });
    }
  };

  // Konfirmasi Identitas Peserta pada Mode SSO_ONLY
  const handleConfirmSsoIdentity = () => {
    if (!pendingStudent || !pendingGoogleProfile) return;
    const updated = {
      ...pendingStudent,
      google_linked: true,
      google_id: pendingGoogleProfile.sub || pendingStudent.google_id || ('gid_' + Date.now()),
      google_email: pendingGoogleProfile.email,
      google_linked_at: new Date().toISOString(),
      active_device_id: currentDeviceId,
    };
    storageService.saveUser(updated);
    storageService.setCurrentUser(updated);
    setAuthStep('idle');
    setPendingStudent(null);
    setPendingGoogleProfile(null);
    onLoginSuccess(updated);
  };

  // Batalkan Konfirmasi Identitas Peserta pada Mode SSO_ONLY
  const handleCancelSsoIdentity = () => {
    setAuthStep('idle');
    setPendingStudent(null);
    setPendingGoogleProfile(null);
    setErrorMsg('Login dibatalkan. Silakan login kembali dengan akun Google yang sesuai dengan identitas Anda.');
  };

  // Handler tombol SSO di tab login (Aktif untuk mode SSO_ONLY dan BOTH)
  const handleGoogleSsoProduction = async () => {
    setErrorMsg('');
    if (!institution?.google_client_id?.trim()) {
      setErrorMsg('Google Client ID belum dikonfigurasi di pengaturan instansi oleh Administrator.');
      return;
    }
    setAuthStep('sso_login');
    handleManualGoogleAuth(null, 'sso_login');
  };

  // Opsi SSO Peserta HANYA tampil di halaman login jika institusi mengatur mode "Hanya Google SSO" (SSO_ONLY)
  const showSsoOption = isGoogleOAuthActive && institution?.auth_method === 'SSO_ONLY';

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
              onClick={handleLogoClick}
              title={isAdminUnlocked ? 'Mode Administrator Aktif' : undefined}
              className="h-16 w-16 object-contain rounded-2xl shadow-sm border border-zinc-200/80 p-1 bg-white cursor-pointer select-none active:scale-95 transition-transform"
            />
          ) : (
            <div
              onClick={handleLogoClick}
              title={isAdminUnlocked ? 'Mode Administrator Aktif' : undefined}
              className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-zinc-900/10 cursor-pointer select-none active:scale-95 transition-transform"
            >
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
        </p>
      </header>

      {/* Login Card */}
      <main className="w-full max-w-md bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Tab Switcher / Header Portal */}
        {isAdminUnlocked ? (
          <div className="mb-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Mode Administrator Aktif
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdminUnlocked(false);
                  setActiveTab('student');
                  setErrorMsg('');
                }}
                className="text-[11px] text-zinc-500 hover:text-rose-600 font-medium cursor-pointer transition-colors"
                title="Sembunyikan kembali Panel Administrator"
              >
                &times; Sembunyikan Admin
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100/80 rounded-xl text-xs font-medium">
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
          </div>
        ) : (
          <div className="mb-6 text-center pb-3 border-b border-zinc-100">
            <h2 className="text-base font-bold text-zinc-900">Portal Peserta Ujian</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Silakan masuk menggunakan data peserta dari panitia ujian</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Mode Khusus SSO_ONLY di Tab Peserta (HANYA jika Google OAuth Aktif & Terhubung) */}
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
            {/* Tombol Scan QR Kartu Ujian (Inklusif satu paket dengan mode No. Ujian / NISN, TIDAK muncul di mode SSO Only) */}
            {activeTab === 'student' && institution?.auth_method !== 'SSO_ONLY' && (
              <div className="mb-1">
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 active:bg-blue-200/80 text-xs font-semibold text-blue-800 shadow-2xs transition-all cursor-pointer group"
                  title="Buka Kamera untuk Scan QR Code pada Kartu Ujian Peserta"
                >
                  <QrCode className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Scan Kartu Ujian (Login QR Code Instan)</span>
                </button>
              </div>
            )}

            {/* Opsi Login Google SSO di bagian ATAS untuk Mode BOTH (Google SSO & NISN) */}
            {activeTab === 'student' && isGoogleOAuthActive && institution?.auth_method === 'BOTH' && (
              <div className="space-y-3 pb-1">
                <button
                  type="button"
                  disabled={ssoLoading}
                  onClick={handleGoogleSsoProduction}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 active:bg-zinc-100 disabled:opacity-60 text-xs font-semibold text-zinc-800 shadow-2xs transition-all duration-200 cursor-pointer"
                >
                  {ssoLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span>Menghubungkan ke Google Identity...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      <span>Login dengan SSO Google Terdaftar</span>
                    </>
                  )}
                </button>
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2.5 text-zinc-400 font-medium text-[11px]">
                      atau masuk menggunakan no. ujian / nisn
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-zinc-700">
                  {activeTab === 'student' ? 'Nomor Ujian / NISN Peserta' : 'Username Administrator'}
                </label>
                {activeTab === 'student' && institution?.auth_method !== 'SSO_ONLY' && (
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
                    title="Buka Kamera untuk Scan QR Code Kartu Ujian"
                  >
                    <QrCode className="w-3 h-3 text-blue-600" />
                    <span>Scan Kartu Ujian</span>
                  </button>
                )}
              </div>
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
                  className={`w-full pl-10 ${activeTab === 'student' && institution?.auth_method !== 'SSO_ONLY' ? 'pr-10' : 'pr-3.5'} py-2.5 bg-white border border-zinc-300 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 transition-all`}
                />
                {activeTab === 'student' && institution?.auth_method !== 'SSO_ONLY' && (
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-blue-600 cursor-pointer"
                    title="Scan QR Code Kartu Ujian"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                )}
              </div>
              {activeTab === 'student' && (
                <p className="mt-1 text-[11px] text-zinc-500 flex items-center justify-between">
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
                        <div className="font-semibold">Verifikasi Kemanan Aktif</div>
                        <div className="text-[10px] text-emerald-700">Terproteksi otomatis oleh Google reCAPTCHA</div>
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
                      <span>Ketik Ulang Captcha</span>
                    </div>
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
                  <>Masuk menggunakan akun yang diberikan panitia.</>
                )}
              </p>
            )}


          </form>
        )}

        {/* Informasi ID Perangkat Browser Peserta */}
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
            <div className={`grid ${isAdminUnlocked ? 'grid-cols-3' : 'grid-cols-1'} gap-1.5`}>
              {isAdminUnlocked && (
                <>
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
                </>
              )}
              <button
                type="button"
                onClick={() => handleFillDemo('student')}
                className="py-1.5 px-2 bg-white hover:bg-zinc-50 border border-zinc-300 rounded-lg text-left transition-all hover:border-zinc-400 cursor-pointer"
              >
                <div className="text-[9.5px] text-zinc-500 font-medium">Peserta Ujian:</div>
                <div className="font-mono font-bold text-zinc-900 text-[10.5px]">0068291033</div>
              </button>
            </div>
          </div>
        )}
        <p className="text-[11px] text-zinc-400">
          ExamGuard {APP_VERSION} &copy; {new Date().getFullYear()} &bull; Arsitektur Produksi oleh Fandi dari Jawa tech
        </p>
      </footer>
       {/* ─────────────────────────────────────────────────────────────
          MODAL 1: GOOGLE ONE TAP / PENAUTAN & VERIFIKASI AKUN GOOGLE (MODE BOTH)
          ───────────────────────────────────────────────────────────── */}
      {(authStep === 'google_linking' || authStep === 'google_verifying') && pendingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 leading-snug">
                  {authStep === 'google_linking' ? 'Tautkan Akun Google Anda' : 'Verifikasi Akun Google Peserta'}
                </h3>
                <p className="text-xs text-zinc-500">
                  {authStep === 'google_linking'
                    ? 'Login berhasil! Tautkan akun Google resmi sekolah Anda.'
                    : 'Verifikasi akun Google terdaftar untuk membuka soal ujian.'}
                </p>
              </div>
            </div>

            {/* Ringkasan Profil Peserta */}
            <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Nama Peserta:</span>
                <span className="font-bold text-zinc-900">{pendingStudent.nama}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>No. Ujian / NISN:</span>
                <span className="font-mono font-semibold text-zinc-800">{pendingStudent.nomor_ujian || pendingStudent.nisn}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Kelas:</span>
                <span className="font-medium text-zinc-800">{pendingStudent.kelas || '-'}</span>
              </div>
              {authStep === 'google_verifying' && (
                <div className="pt-1.5 border-t border-zinc-200 flex justify-between items-center text-zinc-600">
                  <span>Email Terdaftar:</span>
                  <span className="font-mono font-bold text-blue-700">{pendingStudent.google_email || pendingStudent.email}</span>
                </div>
              )}
            </div>

            {/* Error Mismatch Notification */}
            {googleMismatchError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{googleMismatchError}</div>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                disabled={ssoLoading}
                onClick={() => handleManualGoogleAuth(pendingStudent, authStep)}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {ssoLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Menghubungkan ke Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                    </svg>
                    <span>
                      {authStep === 'google_linking' ? 'Login Akun Google untuk Tautkan' : 'Verifikasi dengan Akun Google'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthStep('idle');
                  setPendingStudent(null);
                  setGoogleMismatchError('');
                }}
                className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Batal & Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: KONFIRMASI IDENTITAS PESERTA (MODE SSO_ONLY)
          ───────────────────────────────────────────────────────────── */}
      {authStep === 'sso_confirm_identity' && pendingStudent && pendingGoogleProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200 p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 leading-snug">Konfirmasi Identitas Peserta</h3>
                <p className="text-xs text-zinc-500">Pastikan data peserta berikut sesuai dengan diri Anda</p>
              </div>
            </div>

            {/* Kartu Detail Identitas Peserta */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Nama Lengkap:</span>
                <span className="font-bold text-zinc-900 text-sm">{pendingStudent.nama}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Nomor Ujian:</span>
                <span className="font-mono font-semibold text-zinc-800">{pendingStudent.nomor_ujian || '-'}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>NISN:</span>
                <span className="font-mono font-semibold text-zinc-800">{pendingStudent.nisn}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Kelas & Ruang:</span>
                <span className="font-medium text-zinc-800">{pendingStudent.kelas} ({pendingStudent.ruang || 'Ruang 01'})</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-zinc-600">
                <span>Akun Google:</span>
                <span className="font-mono font-bold text-emerald-700">{pendingGoogleProfile.email}</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
              Apakah data peserta ujian di atas sudah sesuai dan benar milik Anda?
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmSsoIdentity}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Data Sesuai — Lanjut ke Ujian</span>
              </button>

              <button
                type="button"
                onClick={handleCancelSsoIdentity}
                className="w-full py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Bukan Data Saya / Ganti Akun Google
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Scanner QR Code Kartu Ujian */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />
    </div>
  );
}