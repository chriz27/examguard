import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  Clock,
  MapPin,
  Camera,
  Mic,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  LogOut,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Cookie,
  Volume2,
  DownloadCloud,
  ChevronRight,
  School,
  ExternalLink,
  KeyRound,
  Bell,
  Smartphone,
  Laptop,
  ClipboardCheck,
  Loader2,
  FlaskConical,
  X,
  ShieldCheck,
  BatteryMedium,
  HardDrive,
  Cpu,
  Wifi,
  Monitor,
  User,
  Eye,
  EyeOff,
  Zap,
  BatteryWarning,
  Crosshair,
  Home,
  Navigation,
} from 'lucide-react';
import { storageService, convertGoogleFormUrl, subscribeSync, getOrCreateDeviceId } from '../../services/storageService';
import {
  calculateHaversineDistance,
  formatDuration,
  getGradeLabel,
} from '../../constants/educationConfig';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GeofenceMapPreview from '../../components/common/GeofenceMapPreview';
import BroadcastRibbon from '../../components/common/BroadcastRibbon';

// Icon Google OAuth Resmi (Multi-warna)
function GoogleBrandIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.17 0 9.97 0 12s.46 3.83 1.26 5.42l4.02-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

// Komponen Header Nama Sekolah & Tingkat untuk Tampilan HP (Responsive Marquee jika Terpotong)
function MobileSchoolHeader({ schoolName, gradeLabel }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const displayName = schoolName || 'ExamGuard Portal Peserta';

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        // Bandingkan lebar teks asli dengan lebar container yang tersedia di layar HP
        const hasOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth + 1;
        setIsOverflowing(hasOverflow);
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 250);
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [displayName]);

  // Kecepatan membaca looping yang nyaman di ponsel (minimal 7s, maksimal 22s tergantung panjang teks)
  const animDuration = Math.max(7, Math.min(22, Math.round(displayName.length * 0.35)));

  return (
    <div className="sm:hidden min-w-0 flex-1 overflow-hidden pr-1">
      {/* Hidden element untuk mengukur panjang teks secara akurat tanpa terpengaruh animasi */}
      <span
        ref={textRef}
        aria-hidden="true"
        className="absolute opacity-0 pointer-events-none whitespace-nowrap text-xs font-semibold"
        style={{ visibility: 'hidden', top: -9999, left: -9999 }}
      >
        {displayName}
      </span>

      {/* Baris 1: Nama Sekolah (Animasi Marquee Berjalan jika Terpotong) */}
      <div ref={containerRef} className="overflow-hidden w-full relative">
        {isOverflowing ? (
          <div className="overflow-hidden whitespace-nowrap w-full">
            <div
              className="inline-flex will-change-transform"
              style={{
                animation: `egSchoolNameMarquee ${animDuration}s linear infinite`,
              }}
            >
              <span className="font-semibold text-zinc-900 text-xs pr-8 shrink-0 flex items-center gap-2">
                <span>{displayName}</span>
                <span className="text-zinc-300 text-[10px]">&bull;</span>
              </span>
              <span className="font-semibold text-zinc-900 text-xs pr-8 shrink-0 flex items-center gap-2">
                <span>{displayName}</span>
                <span className="text-zinc-300 text-[10px]">&bull;</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="font-semibold text-zinc-900 text-xs truncate">
            {displayName}
          </div>
        )}
      </div>

      {/* Baris 2: Tingkat */}
      <div className="text-[10px] text-zinc-500 font-medium leading-tight truncate">
        {gradeLabel}
      </div>
    </div>
  );
}

export default function StudentPortal({ currentUser: propCurrentUser, onLogout }) {
  const [currentUser, setCurrentUser] = useState(() => propCurrentUser || storageService.getCurrentUser());

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  const [institution, setInstitution] = useState(storageService.getInstitution());

  // Modal Ganti Kata Sandi Mandiri oleh Peserta
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Evaluasi Kuat Password 5 Tingkat:
  // 1. Min 6 karakter, 2. Huruf kecil, 3. Huruf besar, 4. Angka, 5. Simbol unik
  // Aturan: Minimal 6 digit & minimal 4 kriteria terpenuhi
  const hasMinLength = newPasswordInput.length >= 6;
  const hasLower = /[a-z]/.test(newPasswordInput);
  const hasUpper = /[A-Z]/.test(newPasswordInput);
  const hasNumber = /[0-9]/.test(newPasswordInput);
  const hasSymbol = /[^a-zA-Z0-9]/.test(newPasswordInput);
  const passCriteriaList = [hasMinLength, hasLower, hasUpper, hasNumber, hasSymbol];
  const passedCriteriaCount = passCriteriaList.filter(Boolean).length;
  const isPasswordValid = hasMinLength && passedCriteriaCount >= 4 && newPasswordInput === confirmPasswordInput;

  const getStrengthInfo = (count) => {
    if (count <= 1) return { label: 'Sangat Lemah', barColor: 'bg-rose-500', textColor: 'text-rose-600' };
    if (count === 2) return { label: 'Lemah', barColor: 'bg-amber-500', textColor: 'text-amber-600' };
    if (count === 3) return { label: 'Cukup', barColor: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (count === 4) return { label: 'Kuat (Memenuhi Syarat)', barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
    return { label: 'Sangat Kuat (Sempurna)', barColor: 'bg-emerald-600', textColor: 'text-emerald-700' };
  };
  const strengthInfo = getStrengthInfo(passedCriteriaCount);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!hasMinLength) {
      setChangePasswordError('Password baru minimal harus 6 karakter / digit.');
      return;
    }
    if (passedCriteriaCount < 4) {
      setChangePasswordError('Password baru belum memenuhi minimal 4 dari 5 kriteria keamanan.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = storageService.changeStudentPassword(currentUser.id, oldPasswordInput, newPasswordInput);
      if (!res.success) {
        setChangePasswordError(res.message || 'Gagal mengubah password. Pastikan password lama sesuai.');
        setIsChangingPassword(false);
        return;
      }

      if (res.user) {
        setCurrentUser(res.user);
        try {
          sessionStorage.setItem('examguard_student_session', JSON.stringify(res.user));
        } catch {}
      }

      setChangePasswordSuccess('Password berhasil diubah! Gunakan password baru Anda untuk login berikutnya.');
      showNotification('Kata sandi berhasil diperbarui!', 'success');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setOldPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setChangePasswordSuccess('');
        setIsChangingPassword(false);
      }, 1500);
    } catch (err) {
      setChangePasswordError('Terjadi kesalahan sistem: ' + err.message);
      setIsChangingPassword(false);
    }
  };

  // Real-time Baterai & Ping Latensi ke Google (Google Form)
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [pingMs, setPingMs] = useState(24);
  const [pingStatus, setPingStatus] = useState('good'); // 'good' | 'fair' | 'poor'
  const [isRefreshingExams, setIsRefreshingExams] = useState(false);

  useEffect(() => {
    let batteryObj = null;
    const syncBattery = (b) => {
      setBatteryLevel(Math.round(b.level * 100));
      setIsCharging(Boolean(b.charging));
    };
    if (typeof navigator !== 'undefined' && typeof navigator.getBattery === 'function') {
      navigator.getBattery()
        .then((b) => {
          batteryObj = b;
          syncBattery(b);
          b.addEventListener('levelchange', () => syncBattery(b));
          b.addEventListener('chargingchange', () => syncBattery(b));
        })
        .catch(() => {});
    }
    return () => {
      if (batteryObj) {
        batteryObj.removeEventListener('levelchange', () => syncBattery(batteryObj));
        batteryObj.removeEventListener('chargingchange', () => syncBattery(batteryObj));
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const measureGooglePing = async () => {
      const tStart = performance.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        await fetch('https://www.google.com/generate_204?t=' + Date.now(), {
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const elapsed = Math.round(performance.now() - tStart);
        if (!isMounted) return;
        setPingMs(elapsed);
        setPingStatus(elapsed < 120 ? 'good' : elapsed < 350 ? 'fair' : 'poor');
      } catch {
        try {
          const tFb = performance.now();
          await fetch('/favicon.ico?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
          const elapsedFb = Math.round(performance.now() - tFb);
          if (!isMounted) return;
          setPingMs(elapsedFb);
          setPingStatus(elapsedFb < 120 ? 'good' : 'fair');
        } catch {
          if (!isMounted) return;
          setPingMs(999);
          setPingStatus('poor');
        }
      }
    };

    measureGooglePing();
    const interval = setInterval(measureGooglePing, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRefreshExams = async () => {
    setIsRefreshingExams(true);
    setCurrentTime(new Date());
    try {
      // Tarik data snapshot paling segar langsung dari SQLite server
      const fresh = await storageService.syncWithServer();
      reloadData(fresh);
    } catch {
      reloadData();
    }
    setTimeout(() => {
      setIsRefreshingExams(false);
      showNotification('Daftar sesi soal ujian berhasil diperbarui dari server.', 'success');
    }, 400);
  };

  // Dialog Notifikasi & Konfirmasi Modern (Pengganti alert & confirm bawaan browser)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Mengerti',
    cancelText: null,
    variant: 'info',
    icon: null,
    onConfirm: () => { },
  });

  const openAlert = ({
    title,
    message,
    confirmText = 'Mengerti',
    variant = 'info',
    icon = null,
    onConfirm,
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText: null,
      variant,
      icon,
      onConfirm: () => {
        if (onConfirm) onConfirm();
      },
    });
  };

  const openConfirm = ({
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    variant = 'danger',
    icon = null,
    onConfirm,
  }) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      icon,
      onConfirm: () => {
        if (onConfirm) onConfirm();
      },
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  // Toast Notification State untuk Peserta
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const showNotification = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3500);
  };

  const handleConfirmLogout = () => {
    openConfirm({
      title: 'Keluar dari Portal Ujian?',
      message: (
        <span>
          Apakah Anda yakin ingin keluar dari akun peserta ujian? Anda harus login kembali menggunakan NISN/Email untuk melanjutkan.
        </span>
      ),
      confirmText: 'Ya, Keluar Akun',
      cancelText: 'Batal',
      variant: 'danger',
      icon: LogOut,
      onConfirm: () => {
        // Keluar dari mode Layar Penuh (Fullscreen) saat logout peserta
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen().catch(() => {});
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen().catch(() => {});
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen().catch(() => {});
            }
          }
        } catch {}

        try {
          sessionStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
          localStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
        } catch {}
        if (onLogout) onLogout();
      },
    });
  };

  // Riwayat Kelayakan Sistem (Pre-Flight) yang pernah lolos pada sesi ini (Tampil 1x layar penuh, selanjutnya tersimpan dalam icon di beranda)
  const [hasPassedOnce, setHasPassedOnce] = useState(() => {
    try {
      return (
        sessionStorage.getItem(`examguard_preflight_passed_${currentUser?.id}`) === 'true' ||
        localStorage.getItem(`examguard_preflight_passed_${currentUser?.id}`) === 'true'
      );
    } catch {
      return false;
    }
  });

  // Tahapan Alur Peserta: 'preflight' | 'home' | 'exam'
  // Jika sudah pernah lolos sebelumnya pada sesi ini, langsung arahkan ke 'home', namun pengecekan tetap berjalan di latar belakang setiap login
  const [currentStage, setCurrentStage] = useState(() => {
    try {
      const alreadyDone =
        sessionStorage.getItem(`examguard_preflight_passed_${currentUser?.id}`) === 'true' ||
        localStorage.getItem(`examguard_preflight_passed_${currentUser?.id}`) === 'true';
      return alreadyDone ? 'home' : 'preflight';
    } catch {
      return 'preflight';
    }
  });

  // Modal Dialog Rincian Kelayakan Sistem (Dibuka dari Icon di Beranda Peserta)
  const [showPreflightModal, setShowPreflightModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [headerLogoError, setHeaderLogoError] = useState(false);

  // Pre-flight Checks State (8 Izin Sesuai Pengaturan Instansi)
  const [preflightStatus, setPreflightStatus] = useState(() => {
    const inst = storageService.getInstitution();
    let bp = inst?.browser_permissions || {};
    if (typeof bp === 'string') {
      try { bp = JSON.parse(bp); } catch { bp = {}; }
    }
    const gpsOff =
      bp.location_gps === false ||
      bp.location_gps === 0 ||
      bp.location_gps === '0' ||
      inst?.gps_enabled === false ||
      inst?.gps_enabled === 0 ||
      inst?.gps_enabled === '0';

    return {
      gps: {
        checking: false,
        passed: Boolean(gpsOff),
        distance: gpsOff ? 0 : null,
        message: gpsOff
          ? 'Pemeriksaan lokasi GPS dinonaktifkan oleh sekolah (Bebas lokasi)'
          : 'Menunggu pemeriksaan GPS...',
      },
      notifications: { checking: false, passed: bp.notifications === false, message: 'Izin Notifikasi' },
      sound: { checking: false, passed: bp.sound_audio === false, message: 'Sistem Audio' },
      fullscreen: { checking: false, passed: bp.fullscreen === false, message: 'Mode Layar Penuh' },
      google_sso: { checking: false, passed: bp.google_sso !== true, message: 'Akun Google SSO' },
      clipboard: { checking: false, passed: true, message: 'Pembersih Clipboard diaktifkan' },
      media: { checking: false, passed: bp.camera_webcam === false, message: 'Sensor Kamera & Mikrofon' },
      cookies: { checking: false, passed: true, message: 'Penyimpanan Cookies siap' },
    };
  });
  const [gpsSimulatedOverride, setGpsSimulatedOverride] = useState(false);
  const [audioTested, setAudioTested] = useState(false);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  // Konfigurasi Mode Aplikasi (Produksi Resmi vs Simulasi/Dev) dengan Zero-Trust Hardening
  const [appModeConfig, setAppModeConfig] = useState(() => storageService.getAppModeConfig());
  const isProduction = appModeConfig?.app_mode === 'production';
  const isSimMode = !isProduction;
  const effectiveGpsOverride = isSimMode && (gpsSimulatedOverride || Boolean(appModeConfig?.bypass_gps));

  // Izin Peramban Institusi & Status Evaluasi
  const browserPerms = typeof institution?.browser_permissions === 'string'
    ? (() => { try { return JSON.parse(institution.browser_permissions); } catch { return {}; } })()
    : (institution?.browser_permissions || {});
  const isGoogleSsoRequired = browserPerms?.google_sso === true;
  const isGoogleSsoBypassed = isSimMode && Boolean(appModeConfig?.bypass_google_sso);

  const isGpsDisabled =
    browserPerms.location_gps === false ||
    browserPerms.location_gps === 0 ||
    browserPerms.location_gps === '0' ||
    institution?.gps_enabled === false ||
    institution?.gps_enabled === 0 ||
    institution?.gps_enabled === '0';
  const isGpsRequired = !isGpsDisabled;

  // Popup Animasi Pemeriksaan Izin Sistem Berulang (Checklist Loading Popup)
  const [showVerificationPopup, setShowVerificationPopup] = useState(true);
  const [verificationCurrentStep, setVerificationCurrentStep] = useState(0);
  const [verificationOutcome, setVerificationOutcome] = useState(null); // 'success' | 'failed' | null

  // Modal Autentikasi Google SSO untuk Sesi Ujian Aktif
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [googleLoginError, setGoogleLoginError] = useState('');
  const [isGoogleLoginSubmitting, setIsGoogleLoginSubmitting] = useState(false);

  // Modal Popup Lebar Pemeriksaan Lokasi Maps & Garis Jarak
  const [showLocationDetailModal, setShowLocationDetailModal] = useState(false);
  const [showInlineMapPreview, setShowInlineMapPreview] = useState(true);
  const [studentCoords, setStudentCoords] = useState(null); // { lat, lng, accuracy }

  useEffect(() => {
    if (!showLocationDetailModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLocationDetailModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLocationDetailModal]);

  const handleOpenGoogleLoginModal = () => {
    setGoogleLoginError('');
    setShowGoogleLoginModal(true);
  };

    // Otomatis picu Google One Tap saat preflight jika Google SSO belum terverifikasi
  const triggerGoogleOneTapPreflight = async () => {
    if (!institution?.google_client_id?.trim()) return;
    try {
      if (!window.google?.accounts?.id) {
        await new Promise((resolve) => {
          let s = document.getElementById('google-jssdk-portal');
          if (s) {
            if (window.google?.accounts?.id) return resolve(true);
            s.addEventListener('load', () => resolve(true));
            s.addEventListener('error', () => resolve(false));
            return;
          }
          s = document.createElement('script');
          s.id = 'google-jssdk-portal';
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.head.appendChild(s);
        });
      }
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: institution.google_client_id.trim(),
        callback: (response) => {
          if (response.credential) {
            try {
              const base64Url = response.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              const googleEmail = (payload.email || '').toLowerCase().trim();
              const googleSub = payload.sub || ('gid_' + Date.now());

              const updatedUser = {
                ...currentUser,
                google_linked: true,
                google_id: googleSub,
                google_email: googleEmail,
                google_linked_at: new Date().toISOString(),
                email: currentUser.email || googleEmail,
              };

              storageService.saveUser(updatedUser);
              storageService.setCurrentUser(updatedUser);
              setCurrentUser(updatedUser);
              try {
                sessionStorage.setItem(`examguard_google_sso_verified_${currentUser.id}`, 'true');
              } catch {}

              setPreflightStatus((prev) => ({
                ...prev,
                google_sso: {
                  checking: false,
                  passed: true,
                  message: `Akun Google SSO terverifikasi: ${googleEmail}`,
                },
              }));
              showNotification(`Google One Tap berhasil! Akun ${googleEmail} telah tertaut.`, 'success');
              setRecheckTrigger((prev) => prev + 1);
            } catch (e) {
              console.warn('[OneTap Preflight] Parse error:', e);
            }
          }
        },
        auto_select: false,
        cancel_on_tap_outside: false,
      });
      window.google.accounts.id.prompt();
    } catch (err) {
      console.warn('[OneTap Preflight] Error:', err);
    }
  };

  useEffect(() => {
    if (currentStage === 'preflight' && isGoogleSsoRequired && !preflightStatus.google_sso.passed && institution?.google_client_id?.trim()) {
      const timer = setTimeout(() => {
        triggerGoogleOneTapPreflight();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStage, isGoogleSsoRequired, preflightStatus.google_sso.passed, institution?.google_client_id]);

  const handleDirectGoogleSso = async () => {
    setGoogleLoginError('');
    if (!institution?.google_client_id?.trim()) {
      setGoogleLoginError('Google Client ID belum dikonfigurasi di pengaturan instansi oleh Administrator.');
      return;
    }

    setIsGoogleLoginSubmitting(true);
    try {
      // Pastikan library Google GIS termuat
      if (!window.google?.accounts?.oauth2) {
        await new Promise((resolve, reject) => {
          let s = document.getElementById('google-jssdk-portal');
          if (s) {
            if (window.google?.accounts?.oauth2) return resolve(true);
            s.addEventListener('load', () => resolve(true));
            s.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')));
            return;
          }
          s = document.createElement('script');
          s.id = 'google-jssdk-portal';
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve(true);
          s.onerror = () => reject(new Error('Gagal memuat Google Identity Services. Pastikan perangkat terhubung ke internet.'));
          document.head.appendChild(s);
        });
      }

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: institution.google_client_id.trim(),
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.error) {
            setIsGoogleLoginSubmitting(false);
            if (response.error !== 'access_denied') {
              setGoogleLoginError(`Autentikasi Google gagal: ${response.error_description || response.error}`);
            }
            return;
          }
          if (response.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!res.ok) throw new Error('Gagal mengambil profil akun Google dari server Google.');
              const profile = await res.json();
              const googleEmail = profile.email?.trim().toLowerCase();
              const googleSub = profile.sub;

              // 1. Cek apakah email Google yang dipilih telah digunakan oleh akun peserta lain di sistem
              const existingOtherUser = await storageService.getUserByEmailFromServer(googleEmail);
              if (existingOtherUser && String(existingOtherUser.id) !== String(currentUser.id)) {
                setIsGoogleLoginSubmitting(false);
                setGoogleLoginError(
                  `Akun Google (${googleEmail}) sudah digunakan oleh peserta lain atas nama "${existingOtherUser.nama || 'Peserta Lain'}" (NISN/ID: ${existingOtherUser.nisn || existingOtherUser.nis || existingOtherUser.nomor_ujian || '-'}). Setiap peserta wajib menggunakan email pribadi unik yang belum dipakai akun lain.`
                );
                return;
              }

              // 2. Validasi langsung dengan data email terdaftar jika peserta sudah memiliki email di profil
              const registeredEmail = (currentUser?.email || currentUser?.google_email || '').trim().toLowerCase();
              if (registeredEmail && googleEmail !== registeredEmail) {
                setIsGoogleLoginSubmitting(false);
                setGoogleLoginError(
                  `Akun Google yang Anda pilih (${googleEmail}) tidak cocok dengan email terdaftar untuk peserta ${currentUser.nama} (${registeredEmail}). Silakan masuk dengan akun Google yang sesuai.`
                );
                return;
              }

              // Simpan data tautan akun Google ke database SQLite
              const updatedUser = {
                ...currentUser,
                google_linked: true,
                google_id: googleSub || ('gid_' + Date.now()),
                google_email: googleEmail,
                google_linked_at: new Date().toISOString(),
                email: currentUser.email || googleEmail,
              };

              storageService.saveUser(updatedUser);
              storageService.setCurrentUser(updatedUser);
              setCurrentUser(updatedUser);
              try {
                sessionStorage.setItem(`examguard_google_sso_verified_${currentUser.id}`, 'true');
              } catch {}

              setPreflightStatus((prev) => ({
                ...prev,
                google_sso: {
                  checking: false,
                  passed: true,
                  message: `Akun Google SSO terverifikasi: ${googleEmail}`,
                },
              }));

              setIsGoogleLoginSubmitting(false);
              setShowGoogleLoginModal(false);
              showNotification(`Akun Google (${googleEmail}) berhasil diverifikasi untuk sesi ini! Checklist telah terkonfirmasi hijau.`, 'success');

              // Memicu re-evaluasi seluruh sensor & izin agar allPreflightPassed terevaluasi
              setRecheckTrigger((prev) => prev + 1);
            } catch (err) {
              setIsGoogleLoginSubmitting(false);
              setGoogleLoginError(err.message || 'Gagal memverifikasi profil Google.');
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setIsGoogleLoginSubmitting(false);
      setGoogleLoginError(err.message || 'Gagal membuka Google Sign-in.');
    }
  };

  const handleRecheckPermissions = () => {
    setVerificationCurrentStep(0);
    setVerificationOutcome(null);
    setShowVerificationPopup(true);
    setRecheckTrigger((prev) => prev + 1);
    reloadData();
    showNotification('Memeriksa ulang seluruh sensor & izin perangkat...', 'info');
  };

  // Definisi 8 Komponen Izin Sistem yang Diverifikasi
  const getVerificationItems = () => {
    const isGpsBypassed = isSimMode && Boolean(appModeConfig?.bypass_gps);
    const isNotifBypassed = isSimMode && Boolean(appModeConfig?.bypass_notifications);
    const isAudioBypassed = isSimMode && Boolean(appModeConfig?.bypass_audio);
    const isFullscreenBypassed = isSimMode && Boolean(appModeConfig?.bypass_fullscreen);
    const isMediaBypassed = isSimMode && Boolean(appModeConfig?.bypass_media);
    const isCookiesBypassed = isSimMode && Boolean(appModeConfig?.bypass_cookies_check);

    return [
      {
        id: 'gps',
        name: 'Cek Izin Lokasi (GPS & Radius)',
        icon: MapPin,
        isRequired: isGpsRequired && !isGpsBypassed,
        isChecking: isGpsRequired && !isGpsBypassed && preflightStatus.gps.checking,
        passed: isGpsDisabled || isGpsBypassed || preflightStatus.gps.passed || effectiveGpsOverride,
        detail: isGpsDisabled
          ? 'Pemeriksaan lokasi GPS dinonaktifkan oleh sekolah (Bebas lokasi)'
          : isGpsBypassed
          ? 'Mode Simulasi: Verifikasi Lokasi GPS di-bypass'
          : preflightStatus.gps.message,
      },
      {
        id: 'notifications',
        name: 'Cek Izin Notifikasi (Peringatan)',
        icon: Bell,
        isRequired: browserPerms.notifications !== false && !isNotifBypassed,
        isChecking: browserPerms.notifications !== false && !isNotifBypassed && preflightStatus.notifications.checking,
        passed: browserPerms.notifications === false || isNotifBypassed || preflightStatus.notifications.passed,
        detail: browserPerms.notifications === false
          ? 'Izin notifikasi tidak diwajibkan oleh sekolah'
          : isNotifBypassed
          ? 'Mode Simulasi: Izin notifikasi di-bypass'
          : preflightStatus.notifications.message,
      },
      {
        id: 'sound',
        name: 'Cek Izin Sound (Alarm Audio)',
        icon: Volume2,
        isRequired: browserPerms.sound_audio !== false && !isAudioBypassed,
        isChecking: browserPerms.sound_audio !== false && !isAudioBypassed && preflightStatus.sound.checking,
        passed: browserPerms.sound_audio === false || isAudioBypassed || preflightStatus.sound.passed,
        detail: browserPerms.sound_audio === false
          ? 'Izin sound/audio tidak diwajibkan oleh sekolah'
          : isAudioBypassed
          ? 'Mode Simulasi: Sistem audio di-bypass'
          : preflightStatus.sound.message,
      },
      {
        id: 'google_sso',
        name: 'Cek Login Akun Google (SSO Workspace)',
        icon: GoogleBrandIcon,
        isRequired: isGoogleSsoRequired && !isGoogleSsoBypassed,
        isChecking: isGoogleSsoRequired && !isGoogleSsoBypassed && preflightStatus.google_sso.checking,
        passed: !isGoogleSsoRequired || isGoogleSsoBypassed || preflightStatus.google_sso.passed,
        detail: !isGoogleSsoRequired
          ? 'Login Google SSO tidak diwajibkan oleh sekolah'
          : isGoogleSsoBypassed
          ? 'Mode Simulasi: Akun Google SSO di-bypass'
          : preflightStatus.google_sso.message,
      },
      {
        id: 'clipboard',
        name: 'Cek Block Clipboard (Papan Klip)',
        icon: ClipboardCheck,
        isRequired: browserPerms.block_clipboard !== false,
        isChecking: browserPerms.block_clipboard !== false && preflightStatus.clipboard.checking,
        passed: browserPerms.block_clipboard === false || preflightStatus.clipboard.passed,
        detail: browserPerms.block_clipboard === false
          ? 'Proteksi papan klip tidak diwajibkan oleh sekolah'
          : preflightStatus.clipboard.message,
      },
      {
        id: 'media',
        name: 'Cek Sensor Kamera & Mikrofon',
        icon: Camera,
        isRequired: browserPerms.camera_webcam !== false && !isMediaBypassed,
        isChecking: browserPerms.camera_webcam !== false && !isMediaBypassed && preflightStatus.media.checking,
        passed: browserPerms.camera_webcam === false || isMediaBypassed || preflightStatus.media.passed,
        detail: browserPerms.camera_webcam === false
          ? 'Sensor kamera & mikrofon tidak diwajibkan oleh sekolah'
          : isMediaBypassed
          ? 'Mode Simulasi: Sensor kamera & mikrofon di-bypass'
          : preflightStatus.media.message,
      },
      {
        id: 'cookies',
        name: 'Cek Akses Cookies & Iframe GForm',
        icon: Cookie,
        isRequired: browserPerms.cookies_iframe !== false && !isCookiesBypassed,
        isChecking: browserPerms.cookies_iframe !== false && !isCookiesBypassed && preflightStatus.cookies.checking,
        passed: browserPerms.cookies_iframe === false || isCookiesBypassed || preflightStatus.cookies.passed,
        detail: browserPerms.cookies_iframe === false
          ? 'Penyimpanan cookies tidak diwajibkan oleh sekolah'
          : isCookiesBypassed
          ? 'Mode Simulasi: Akses cookies di-bypass'
          : preflightStatus.cookies.message,
      },
      {
        id: 'fullscreen',
        name: 'Cek Izin Fullscreen (Layar Penuh)',
        icon: Maximize2,
        isRequired: browserPerms.fullscreen !== false && !isFullscreenBypassed,
        isChecking: browserPerms.fullscreen !== false && !isFullscreenBypassed && preflightStatus.fullscreen.checking,
        passed: browserPerms.fullscreen === false || isFullscreenBypassed || preflightStatus.fullscreen.passed,
        detail: browserPerms.fullscreen === false
          ? 'Mode layar penuh tidak diwajibkan oleh sekolah'
          : isFullscreenBypassed
          ? 'Mode Simulasi: Mode Layar Penuh di-bypass'
          : preflightStatus.fullscreen.message,
      },
    ];
  };

  // (appModeConfig, isProduction, isSimMode, effectiveGpsOverride telah dideklarasikan di level atas komponen)

  // Deteksi Perangkat Seluler (HP / Tablet), Safari iOS & Konteks Jaringan
  const isMobileDevice = typeof navigator !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
  );
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const hasNativeFullscreen = typeof document !== 'undefined' && Boolean(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.msRequestFullscreen
  );
  const isInsecureContext = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost';
  const isLocalLan = typeof window !== 'undefined' && /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|127\.0\.0\.1|localhost)/.test(window.location.hostname);

  useEffect(() => {
    const handleModeUpdate = () => {
      setAppModeConfig(storageService.getAppModeConfig());
    };
    window.addEventListener('examguard_storage_updated', handleModeUpdate);
    return () => window.removeEventListener('examguard_storage_updated', handleModeUpdate);
  }, []);

  // Home State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);

  // Exam Active State
  const [activeExam, setActiveExam] = useState(null);
  const [activeAttempt, setActiveAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showFinishConfirmModal, setShowFinishConfirmModal] = useState(false);
  const [showRefreshConfirmModal, setShowRefreshConfirmModal] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [gformKey, setGformKey] = useState(0);
  const [isGformLoading, setIsGformLoading] = useState(false);

  // Modal Popover Token Ujian & Panduan Balon
  const [showTokenPopup, setShowTokenPopup] = useState(false);
  const [hasOpenedStartTokenHint, setHasOpenedStartTokenHint] = useState(false);
  const [hasOpenedFinishTokenHint, setHasOpenedFinishTokenHint] = useState(false);

  // Auto-dismiss balon panduan token setelah 20 detik agar tidak menghalangi jika diabaikan peserta
  useEffect(() => {
    if (currentStage === 'exam' && !hasOpenedStartTokenHint) {
      const timer = setTimeout(() => {
        setHasOpenedStartTokenHint(true);
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, hasOpenedStartTokenHint]);

  useEffect(() => {
    if (currentStage === 'exam' && !hasOpenedFinishTokenHint) {
      const leadMinutes = Number(institution?.finish_token_lead_minutes || 10);
      const isFinishTokenActive = Boolean(activeExam?.finish_token) && remainingSeconds <= leadMinutes * 60;
      if (isFinishTokenActive) {
        const timer = setTimeout(() => {
          setHasOpenedFinishTokenHint(true);
        }, 20000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentStage, hasOpenedFinishTokenHint, remainingSeconds, activeExam, institution]);

  // Proctoring Violation & Lockout States
  const [isDomFullscreen, setIsDomFullscreen] = useState(
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement || document.webkitFullscreenElement) : true
  );
  const [showViolationWarningModal, setShowViolationWarningModal] = useState(false);
  const [violationWarningReason, setViolationWarningReason] = useState('');
  const [violationWarningCount, setViolationWarningCount] = useState(1);
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);
  const [checkingUnlockExamId, setCheckingUnlockExamId] = useState(null);
  const examEnterTimestampRef = useRef(0);
  const lastViolationTimeRef = useRef(0);

  // Idle Timer Ref
  const lastActivityRef = useRef(Date.now());

  // 1. Clock Real-time
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

    // Alarm Darurat 3 Detik saat Layar Terkunci
  useEffect(() => {
    if (isLocked && currentStage === 'exam') {
      stopContinuousWarningAlarm();
      playLockedAlarmFor3Seconds();
    }
  }, [isLocked, currentStage]);

  // 2. Idle Timeout Monitor
  useEffect(() => {
    const timeoutMs = (institution?.idle_timeout_minutes || 30) * 60 * 1000;

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    const idleChecker = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= timeoutMs) {
        openAlert({
          title: 'Sesi Telah Berakhir',
          message: `Sesi Anda keluar secara otomatis karena tidak ada aktivitas selama ${institution.idle_timeout_minutes} menit. Silakan login kembali.`,
          variant: 'warning',
          icon: LogOut,
          onConfirm: () => {
            try {
              if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                if (document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                } else if (document.webkitExitFullscreen) {
                  document.webkitExitFullscreen().catch(() => {});
                } else if (document.mozCancelFullScreen) {
                  document.mozCancelFullScreen().catch(() => {});
                } else if (document.msExitFullscreen) {
                  document.msExitFullscreen().catch(() => {});
                }
              }
            } catch {}
            onLogout();
          },
        });
      }
    }, 10000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(idleChecker);
    };
  }, [institution, onLogout]);

  // 3. Load Exams & Attempts for this Student (Sinkron dari Cache Memori & Server)
  const reloadData = (freshData = null) => {
    const allExams = freshData?.examSessions || freshData?.exam_sessions || storageService.getExamSessions();
    const allAttempts = freshData?.attempts || freshData?.student_attempts || storageService.getAttempts();
    setExams([...allExams]);
    setAttempts([...allAttempts]);
    if (freshData?.institution) setInstitution(freshData.institution);
    else setInstitution(storageService.getInstitution());
    if (freshData?.appModeConfig || freshData?.app_mode_config) setAppModeConfig(freshData.appModeConfig || freshData.app_mode_config);
    else setAppModeConfig(storageService.getAppModeConfig());

    if (currentUser?.id) {
      const freshUser = (Array.isArray(freshData?.users) && freshData.users.find((x) => x.id === currentUser.id)) ||
        storageService.getUserById(currentUser.id);
      if (freshUser) {
        setCurrentUser((prev) => ({ ...prev, ...freshUser }));
      }
    }
  };

  useEffect(() => {
    reloadData();
    // Tarik snapshot terkini dari SQLite sekali saat portal dibuka
    storageService.syncWithServer().then((fresh) => {
      if (fresh) reloadData(fresh);
    }).catch(() => {});

    // Selalu pastikan status mode produksi/simulasi sinkron dari database SQLite
    storageService.fetchAppModeFromServer().then((conf) => {
      if (conf) setAppModeConfig(conf);
    }).catch(() => {});

    // Perbarui waktu real-time & status soal secara otomatis setiap 10 detik
    const timerInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);

    const handleStorageUpdate = (e) => {
      if (e?.detail?.event === 'snapshot') {
        reloadData(e?.detail?.data);
        return;
      }
      reloadData();
    };

    const handleWindowFocus = () => {
      setCurrentTime(new Date());
      storageService.syncWithServer().then((fresh) => {
        if (fresh) reloadData(fresh);
        else reloadData();
      }).catch(() => reloadData());
    };

    const unsubscribe = subscribeSync((event, data) => {
      if (event === 'snapshot') {
        reloadData(data);
      } else if (event === 'sessions_updated' || event === 'session_deleted') {
        storageService.syncWithServer().then((fresh) => {
          if (fresh) reloadData(fresh);
          else reloadData();
        }).catch(() => reloadData());
      } else {
        reloadData();
      }
    });

    window.addEventListener('examguard_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      clearInterval(timerInterval);
      unsubscribe();
      window.removeEventListener('examguard_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // 4. Pre-Flight Verification Runner (Pemeriksaan Akurat Berdasarkan Setelan Riil Peramban Peserta)
  // Berjalan di latar belakang untuk memastikan setiap izin yang diwajibkan admin benar-benar diizinkan oleh peramban
  useEffect(() => {
    if (currentStage === 'exam') return;

    const appMode = storageService.getAppModeConfig();
    const isSimMode = appMode?.app_mode === 'simulation';

    let rawBp = institution?.browser_permissions;
    if (typeof rawBp === 'string') {
      try { rawBp = JSON.parse(rawBp); } catch { rawBp = {}; }
    }
    const perms = (rawBp && typeof rawBp === 'object') ? rawBp : {
      location_gps: false,
      notifications: true,
      sound_audio: true,
      fullscreen: true,
      google_sso: false,
      block_clipboard: true,
      camera_webcam: true,
      cookies_iframe: true,
    };

    // 1. Check Cookies & Storage (Riil)
    if (perms.cookies_iframe === false || (isSimMode && appMode.bypass_cookies_check)) {
      setPreflightStatus((prev) => ({
        ...prev,
        cookies: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_cookies_check
            ? 'Mode Simulasi: Penyimpanan Cookies di-bypass'
            : 'Penyimpanan Cookies tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      let storageOk = false;
      try {
        localStorage.setItem('__eg_storage_test__', '1');
        localStorage.removeItem('__eg_storage_test__');
        storageOk = navigator.cookieEnabled !== false;
      } catch {
        storageOk = false;
      }
      setPreflightStatus((prev) => ({
        ...prev,
        cookies: {
          checking: false,
          passed: storageOk,
          message: storageOk
            ? 'Penyimpanan Cookies & Sesi peramban diizinkan (Siap)'
            : 'Penyimpanan Cookies diblokir atau dinonaktifkan di peramban Anda',
        },
      }));
    }

    // 2. Check Fullscreen (Riil: Kompatibel Desktop, Android, & Safari iOS)
    if (perms.fullscreen === false || (isSimMode && appMode.bypass_fullscreen)) {
      setPreflightStatus((prev) => ({
        ...prev,
        fullscreen: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_fullscreen
            ? 'Mode Simulasi: Mode Layar Penuh di-bypass'
            : 'Mode Layar Penuh tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      const isNativeFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      const isIOSSafariFs = (isIOS || !hasNativeFullscreen) && (
        Boolean(window.navigator.standalone) ||
        document.body.classList.contains('ios-viewport-fullscreen')
      );
      const isCurrentlyFullscreen = isNativeFs || isIOSSafariFs;

      setPreflightStatus((prev) => ({
        ...prev,
        fullscreen: {
          checking: false,
          passed: isCurrentlyFullscreen,
          message: isCurrentlyFullscreen
            ? (isIOSSafariFs ? 'Mode Kunci Tampilan Layar Penuh HP iOS aktif' : 'Mode Layar Penuh (Fullscreen) telah aktif')
            : 'Layar Penuh belum aktif. Klik tombol "Masuk Layar Penuh" di bawah.',
        },
      }));
    }

    // 3. Check Media: Kamera & Mikrofon (Riil: Tidak meloloskan jika belum diberi izin)
    if (perms.camera_webcam === false) {
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: true,
          message: 'Sensor Kamera & Mikrofon tidak diwajibkan oleh sekolah',
        },
      }));
    } else if (isSimMode && appMode.bypass_media) {
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: true,
          message: 'Mode Simulasi: Sensor Kamera & Mikrofon di-bypass',
        },
      }));
    } else if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: false,
          message: 'Peramban atau koneksi jaringan tidak mendukung API Kamera/Mikrofon',
        },
      }));
    } else {
      // Periksa status izin kamera jika permissions query didukung
      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'camera' })
          .then((perm) => {
            if (perm.state === 'granted') {
              setPreflightStatus((prev) => ({
                ...prev,
                media: {
                  checking: false,
                  passed: true,
                  message: 'Izin Kamera & Mikrofon aktif (Granted)',
                },
              }));
            } else if (perm.state === 'denied') {
              setPreflightStatus((prev) => ({
                ...prev,
                media: {
                  checking: false,
                  passed: false,
                  message: 'Izin Kamera diblokir oleh peramban. Klik ikon gembok di URL bar.',
                },
              }));
            } else {
              setPreflightStatus((prev) => ({
                ...prev,
                media: {
                  checking: false,
                  passed: false,
                  message: 'Izin Kamera belum diberikan. Klik tombol "Izinkan Kamera & Mic" di bawah.',
                },
              }));
            }
          })
          .catch(() => {
            // Jika query tidak didukung untuk camera di browser ini, minta interaksi pengguna
            setPreflightStatus((prev) => ({
              ...prev,
              media: {
                checking: false,
                passed: false,
                message: 'Izin Kamera & Mikrofon belum diverifikasi. Klik tombol di bawah.',
              },
            }));
          });
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          media: {
            checking: false,
            passed: false,
            message: 'Izin Kamera & Mikrofon belum diverifikasi. Klik tombol di bawah.',
          },
        }));
      }
    }

    // 4. Check Notifications (Riil: Berdasarkan Notification.permission)
    if (perms.notifications === false || (isSimMode && appMode.bypass_notifications)) {
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_notifications
            ? 'Mode Simulasi: Izin notifikasi di-bypass'
            : 'Notifikasi peringatan tidak diwajibkan oleh sekolah',
        },
      }));
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Izin Notifikasi peramban aktif (Granted)',
          },
        }));
      } else if (Notification.permission === 'denied') {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: false,
            message: 'Izin Notifikasi diblokir oleh peramban. Klik ikon gembok di URL bar untuk mengizinkan.',
          },
        }));
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: false,
            message: 'Izin Notifikasi belum aktif. Klik tombol "Izinkan Notifikasi" di bawah.',
          },
        }));
      }
    } else {
      // Browser tidak mendukung Web Notification API (misal Safari iOS non-PWA, atau HTTP LAN)
      // Gunakan fallback otomatis ke Notifikasi Suara & Getaran HP (In-App Haptic)
      const hasVibration = typeof navigator !== 'undefined' && Boolean(navigator.vibrate);
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: true,
          message: hasVibration
            ? 'Notifikasi Suara & Getaran HP (In-App Haptic) Aktif'
            : 'Peringatan Audio & Visual Layar HP Aktif (Fallback Seluler)',
        },
      }));
    }

    // 5. Check Sound Audio (Riil: Wajib diverifikasi melalui tes audio/klik)
    if (perms.sound_audio === false || (isSimMode && appMode.bypass_audio)) {
      setPreflightStatus((prev) => ({
        ...prev,
        sound: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_audio
            ? 'Mode Simulasi: Sistem audio di-bypass'
            : 'Audio alarm tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      setPreflightStatus((prev) => ({
        ...prev,
        sound: {
          checking: false,
          passed: audioTested,
          message: audioTested
            ? 'Sistem Suara & Alarm Audio teruji dan aktif'
            : 'Audio alarm belum diuji. Klik tombol "Uji Bunyi Alarm" di bawah.',
        },
      }));
    }

    // 6. Check Google SSO (Riil: Sesuai status akun tertaut & verifikasi OAuth sekolah)
    const isOAuthVerifiedInSchool = Boolean(institution?.google_oauth_verified && institution?.google_oauth_enabled && institution?.google_client_id?.trim());
    if (perms.google_sso === false || !isOAuthVerifiedInSchool || (isSimMode && appMode.bypass_google_sso)) {
      setPreflightStatus((prev) => ({
        ...prev,
        google_sso: {
          checking: false,
          passed: true,
          message: !isOAuthVerifiedInSchool
            ? 'OAuth Google belum diverifikasi di admin (Bebas SSO)'
            : isSimMode && appMode.bypass_google_sso
            ? 'Mode Simulasi: Akun Google SSO di-bypass'
            : 'Login SSO Google tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      const isSessionSsoVerified = typeof window !== 'undefined' && sessionStorage.getItem(`examguard_google_sso_verified_${currentUser?.id}`) === 'true';
      const isGoogleLinked = Boolean((currentUser?.google_linked && (currentUser?.google_email || currentUser?.google_id)) || isSessionSsoVerified);
      setPreflightStatus((prev) => ({
        ...prev,
        google_sso: {
          checking: false,
          passed: isGoogleLinked,
          message: isGoogleLinked
            ? `Akun Google SSO terverifikasi: ${currentUser.google_email || currentUser.email}`
            : 'Akun belum ditautkan dengan Google SSO. Klik tombol Login Google di bawah untuk memverifikasi akun Google pada sesi ini.',
        },
      }));
    }

    // 7. Check Clipboard Sanitizer (Riil: Proteksi Salin-Tempel)
    if (perms.block_clipboard === false) {
      setPreflightStatus((prev) => ({
        ...prev,
        clipboard: {
          checking: false,
          passed: true,
          message: 'Proteksi Clipboard dinonaktifkan oleh sekolah',
        },
      }));
    } else {
      setPreflightStatus((prev) => ({
        ...prev,
        clipboard: {
          checking: false,
          passed: true,
          message: 'Pembersih Papan Klip aktif (Mencegah kecurangan salin-tempel)',
        },
      }));
    }

    // 8. Check GPS Geolocation (Riil: Mengukur koordinat & jarak Haversine ke titik sekolah)
    const isGpsDisabledInEffect =
      perms.location_gps === false ||
      perms.location_gps === 0 ||
      perms.location_gps === '0' ||
      institution?.gps_enabled === false ||
      institution?.gps_enabled === 0 ||
      institution?.gps_enabled === '0';

    if (isGpsDisabledInEffect) {
      setPreflightStatus((prev) => ({
        ...prev,
        gps: {
          checking: false,
          passed: true,
          distance: 0,
          message: 'Pemeriksaan lokasi GPS dinonaktifkan oleh sekolah (Bebas lokasi)',
        },
      }));
    } else if (isSimMode && appMode.bypass_gps) {
      setPreflightStatus((prev) => ({
        ...prev,
        gps: {
          checking: false,
          passed: true,
          distance: 0,
          message: 'Mode Simulasi: Lokasi GPS Di-Bypass (Simulasi di Dalam Sekolah)',
        },
      }));
    } else if (!navigator.geolocation) {
      setPreflightStatus((prev) => ({
        ...prev,
        gps: {
          checking: false,
          passed: false,
          distance: null,
          message: 'Perangkat tidak memiliki sensor GPS Geolocation',
        },
      }));
    } else {
      setPreflightStatus((prev) => ({
        ...prev,
        gps: { ...prev.gps, checking: true, message: 'Memeriksa sinyal GPS riil...' },
      }));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const studentLat = pos.coords.latitude;
          const studentLng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 0); // Radius presisi hardware GPS HP
          setStudentCoords({ lat: studentLat, lng: studentLng, accuracy });
          const targetLat = institution?.center_lat || -6.2088;
          const targetLng = institution?.center_lng || 106.8456;
          const dist = Math.round(calculateHaversineDistance(
            targetLat,
            targetLng,
            studentLat,
            studentLng
          ));
          const maxRadius = institution?.max_radius_meters || 200;

          // Toleransi cerdas akurasi sensor HP: jika jarak bersih (jarak - toleransi sensor) masuk radius
          const effectiveDistance = Math.max(0, dist - accuracy);
          const isWithin = dist <= maxRadius || effectiveDistance <= maxRadius;

          const isDefaultJakarta = Math.abs(targetLat - (-6.2088)) < 0.001 && Math.abs(targetLng - 106.8456) < 0.001;
          let msg = isWithin
            ? `Dalam radius sekolah (${dist}m, akurasi GPS: ±${accuracy}m)`
            : `Di luar radius sekolah (${dist}m, batas max: ${maxRadius}m, akurasi: ±${accuracy}m)`;

          if (!isWithin && isDefaultJakarta && dist > 5000) {
            msg += ' (Catatan: Titik sekolah di admin masih default Monas Jakarta)';
          }

          setPreflightStatus((prev) => ({
            ...prev,
            gps: {
              checking: false,
              passed: isWithin,
              distance: dist,
              accuracy,
              message: msg,
            },
          }));
        },
        (err) => {
          let msg = 'Izin lokasi belum diberikan: ' + err.message;
          if (err.code === 1) {
            if (isInsecureContext && isLocalLan) {
              msg = 'Akses GPS dibatasi peramban pada HTTP LAN non-HTTPS. Hubungkan ke Wi-Fi sekolah atau gunakan HTTPS.';
            } else {
              msg = 'Izin lokasi GPS ditolak oleh peramban. Buka setelan izin situs atau ikon gembok untuk mengizinkan.';
            }
          } else if (err.code === 2) {
            msg = 'Layanan GPS perangkat mati. Aktifkan Lokasi/GPS pada HP Anda.';
          } else if (err.code === 3) {
            msg = 'Pencarian satelit GPS timeout. Klik tombol periksa ulang.';
          }
          setPreflightStatus((prev) => ({
            ...prev,
            gps: {
              checking: false,
              passed: false,
              distance: null,
              message: msg,
            },
          }));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, [currentStage, institution, currentUser, recheckTrigger, audioTested]);

  // Listener Real-time Perubahan Mode Fullscreen (Layar Penuh)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      const perms = institution?.browser_permissions || {};
      if (perms.fullscreen !== false) {
        setPreflightStatus((prev) => ({
          ...prev,
          fullscreen: {
            checking: false,
            passed: isFs,
            message: isFs
              ? 'Mode Layar Penuh (Fullscreen) telah aktif'
              : 'Layar Penuh belum aktif. Klik tombol "Masuk Layar Penuh" di bawah.',
          },
        }));
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [institution]);

  // ========================================================
  // HANDLER INTERAKTIF PERIZINAN RIIL BROWSER PESERTA
  // ========================================================

  // 1. Minta Izin & Periksa Lokasi GPS Riil
  const handleRequestGps = () => {
    setPreflightStatus((prev) => ({
      ...prev,
      gps: { checking: true, passed: false, distance: null, message: 'Memeriksa sinyal GPS riil...' },
    }));
    if (!navigator.geolocation) {
      showNotification('Peramban tidak mendukung API Geolocation.', 'error');
      setPreflightStatus((prev) => ({
        ...prev,
        gps: { checking: false, passed: false, distance: null, message: 'Peramban tidak mendukung GPS' },
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const studentLat = pos.coords.latitude;
        const studentLng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 0);
        setStudentCoords({ lat: studentLat, lng: studentLng, accuracy });
        const targetLat = institution?.center_lat || -6.2088;
        const targetLng = institution?.center_lng || 106.8456;
        const dist = Math.round(calculateHaversineDistance(targetLat, targetLng, studentLat, studentLng));
        const maxRadius = institution?.max_radius_meters || 200;

        // Toleransi cerdas akurasi sensor HP
        const effectiveDistance = Math.max(0, dist - accuracy);
        const isWithin = dist <= maxRadius || effectiveDistance <= maxRadius;

        const isDefaultJakarta = Math.abs(targetLat - (-6.2088)) < 0.001 && Math.abs(targetLng - 106.8456) < 0.001;
        let msg = isWithin
          ? `Dalam radius sekolah (${dist}m, akurasi GPS: ±${accuracy}m)`
          : `Di luar radius sekolah (${dist}m, batas max: ${maxRadius}m, akurasi: ±${accuracy}m)`;

        if (!isWithin && isDefaultJakarta && dist > 5000) {
          msg += ' (Catatan: Titik sekolah di admin masih default Monas Jakarta)';
        }

        setPreflightStatus((prev) => ({
          ...prev,
          gps: {
            checking: false,
            passed: isWithin,
            distance: dist,
            accuracy,
            message: msg,
          },
        }));

        if (isWithin) {
          showNotification(`Lokasi GPS HP terverifikasi (${dist}m, akurasi ±${accuracy}m)!`, 'success');
        } else {
          showNotification(`Di luar radius: ${dist}m (Maks ${maxRadius}m, akurasi ±${accuracy}m)`, 'error');
        }
      },
      (err) => {
        let msg = 'Izin lokasi belum diberikan: ' + err.message;
        if (err.code === 1) msg = 'Izin lokasi GPS ditolak oleh browser. Buka setelan izin situs di URL bar.';
        else if (err.code === 2) msg = 'Layanan GPS perangkat mati. Aktifkan GPS pada HP Anda.';
        else if (err.code === 3) msg = 'Waktu pencarian koordinat GPS habis. Coba lagi.';
        setPreflightStatus((prev) => ({
          ...prev,
          gps: { checking: false, passed: false, distance: null, message: msg },
        }));
        showNotification(msg, 'error');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // 2. Minta Izin Notifikasi Langsung dari Peramban
  const handleRequestNotificationPermission = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([100, 50, 100]); } catch {}
    }

    if (!('Notification' in window)) {
      showNotification('Peramban tidak mendukung API Notifikasi.', 'error');
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: false,
          message: 'Peramban tidak mendukung API Notifikasi Peringatan.',
        },
      }));
      return;
    }

    try {
      let result;
      if (typeof Notification.requestPermission === 'function') {
        try {
          const req = Notification.requestPermission();
          if (req && typeof req.then === 'function') {
            result = await req;
          } else {
            result = await new Promise((resolve) => Notification.requestPermission(resolve));
          }
        } catch {
          result = await new Promise((resolve) => Notification.requestPermission(resolve));
        }
      }

      if (result === 'granted') {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Izin Notifikasi peramban aktif (Granted)',
          },
        }));
        showNotification('Izin Notifikasi berhasil diaktifkan!', 'success');
      } else {
        // Fallback cerdas: Aktifkan notifikasi internal pop-up alert layar + getar HP + alarm suara
        // Sehingga peserta pada jaringan lokal HTTP atau peramban HP tidak terkunci
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Notifikasi Layar Penuh (Pop-up Alert, Getar & Suara Alarm HP) diaktifkan',
          },
        }));
        showNotification('Notifikasi Layar & Getar HP berhasil diaktifkan!', 'success');
      }
    } catch (err) {
      showNotification('Gagal meminta izin: ' + err.message, 'error');
    }
  };

  // 3. Minta Izin Kamera & Mikrofon Langsung
  const handleRequestCameraMic = async () => {
    setPreflightStatus((prev) => ({
      ...prev,
      media: { checking: true, passed: false, message: 'Mengakses Kamera & Mikrofon...' },
    }));

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Peramban tidak mendukung API Kamera/Mikrofon.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: true,
          message: 'Sensor Kamera & Mikrofon aktif dan terverifikasi',
        },
      }));
      showNotification('Izin Kamera & Mikrofon berhasil diberikan!', 'success');
    } catch (err) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      const msg = isDenied
        ? 'Izin Kamera/Mic ditolak atau diblokir peramban. Klik ikon gembok di URL bar.'
        : `Gagal mengakses sensor media: ${err.message}`;
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: false,
          message: msg,
        },
      }));
      showNotification(msg, 'error');
    }
  };

  // ========================================================
  // SISTEM AUDIO SINTESIS ALARM & NOTIFIKASI SUARA VOLUME TINGGI
  // ========================================================
  const audioContextRef = useRef(null);
  const activeOscillatorsRef = useRef([]);
  const warningAlarmLoopRef = useRef(null);
  const lockAlarmTimerRef = useRef(null);

  // Listener sentuhan layar (touchstart) khusus iOS Safari untuk membuka kunci AudioContext
  useEffect(() => {
    const unlockIosAudio = () => {
      try {
        const ctx = getOrCreateAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      } catch {}
    };
    window.addEventListener('touchstart', unlockIosAudio, { passive: true, once: true });
    return () => window.removeEventListener('touchstart', unlockIosAudio);
  }, []);

  const getOrCreateAudioContext = () => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      return audioContextRef.current;
    } catch (e) {
      console.warn('AudioContext init error:', e);
      return null;
    }
  };

  /**
   * Hentikan pengulangan alarm peringatan dan matikan seluruh osilator audio aktif seketika
   */
  const stopContinuousWarningAlarm = () => {
    if (warningAlarmLoopRef.current) {
      clearInterval(warningAlarmLoopRef.current);
      warningAlarmLoopRef.current = null;
    }
    try {
      activeOscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });
      activeOscillatorsRef.current = [];
    } catch {}
  };

  /**
   * Mainkan Suara Alarm Volume Tinggi (Web Audio API Berbasis Sintesis)
   * Selalu aktif tanpa dependensi file eksternal (100% offline aman)
   * @param {'test' | 'warning' | 'locked'} type
   */
  const playHighVolumeAlarm = (type = 'warning') => {
    try {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      if (type === 'test') {
        // Nada Uji Coba: Dua beep nada tinggi jelas (Volume Tinggi 0.75)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174, now + 0.15); // A5 -> D6
        gain.gain.setValueAtTime(1.0, now); // Volume Full 100% Sesuai Arahan Pengujian
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        activeOscillatorsRef.current.push(osc);
        osc.onended = () => {
          activeOscillatorsRef.current = activeOscillatorsRef.current.filter((o) => o !== osc);
        };
      } else if (type === 'warning') {
        // Nada Peringatan Pelanggaran: Sirine 4 pulsa nada tinggi bergantian (Volume Maksimal 0.9)
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startT = now + i * 0.18;
          const endT = startT + 0.14;

          osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
          osc.frequency.setValueAtTime(i % 2 === 0 ? 1250 : 920, startT);
          gain.gain.setValueAtTime(0.9, startT);
          gain.gain.exponentialRampToValueAtTime(0.01, endT);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startT);
          osc.stop(endT);

          activeOscillatorsRef.current.push(osc);
          osc.onended = () => {
            activeOscillatorsRef.current = activeOscillatorsRef.current.filter((o) => o !== osc);
          };
        }
      } else if (type === 'locked') {
        // Nada Kunci Layar (Batas Toleransi Terlampaui): Sirine darurat menyapu naik-turun kencang (Volume 1.0)
        for (let cycle = 0; cycle < 3; cycle++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const startT = now + cycle * 0.45;
          const peakT = startT + 0.22;
          const endT = startT + 0.44;

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(500, startT);
          osc.frequency.linearRampToValueAtTime(1400, peakT);
          osc.frequency.linearRampToValueAtTime(450, endT);

          gain.gain.setValueAtTime(1.0, startT);
          gain.gain.setValueAtTime(1.0, peakT);
          gain.gain.exponentialRampToValueAtTime(0.02, endT);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(startT);
          osc.stop(endT);

          activeOscillatorsRef.current.push(osc);
          osc.onended = () => {
            activeOscillatorsRef.current = activeOscillatorsRef.current.filter((o) => o !== osc);
          };
        }
      }
    } catch (err) {
      console.warn('Gagal memainkan suara alarm:', err);
    }
  };

  /**
   * Mainkan alarm peringatan secara kontinu berulang hingga peserta kembali ke halaman ujian
   */
  const startContinuousWarningAlarm = () => {
    stopContinuousWarningAlarm();
    playHighVolumeAlarm('warning');
    warningAlarmLoopRef.current = setInterval(() => {
      playHighVolumeAlarm('warning');
    }, 850);
  };

  /**
   * Mainkan alarm layar terkunci selama tepat 3 detik lalu berhenti
   */
  const playLockedAlarmFor3Seconds = () => {
    stopContinuousWarningAlarm();
    if (lockAlarmTimerRef.current) {
      clearTimeout(lockAlarmTimerRef.current);
      lockAlarmTimerRef.current = null;
    }

    try {
      const ctx = getOrCreateAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      // Sirine darurat menyapu naik-turun (frekuensi 450Hz - 1400Hz) selama tepat 3.0 detik (6 siklus x 0.5s)
      const totalDuration = 3.0;
      const cycleDuration = 0.5;
      const cycles = Math.floor(totalDuration / cycleDuration);

      for (let cycle = 0; cycle < cycles; cycle++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startT = now + cycle * cycleDuration;
        const peakT = startT + cycleDuration / 2;
        const endT = startT + cycleDuration;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, startT);
        osc.frequency.linearRampToValueAtTime(1400, peakT);
        osc.frequency.linearRampToValueAtTime(450, endT);

        gain.gain.setValueAtTime(1.0, startT);
        gain.gain.setValueAtTime(1.0, peakT);
        gain.gain.exponentialRampToValueAtTime(0.02, endT);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startT);
        osc.stop(endT);

        activeOscillatorsRef.current.push(osc);
        osc.onended = () => {
          activeOscillatorsRef.current = activeOscillatorsRef.current.filter((o) => o !== osc);
        };
      }

      // Safeguard pembersihan tepat 3 detik
      lockAlarmTimerRef.current = setTimeout(() => {
        try {
          activeOscillatorsRef.current.forEach((osc) => {
            try { osc.stop(); } catch {}
          });
          activeOscillatorsRef.current = [];
        } catch {}
      }, 3050);
    } catch (err) {
      console.warn('Gagal memainkan suara alarm terkunci 3 detik:', err);
    }
  };

  // 4. Uji & Aktifkan Suara Audio Alarm (Web Audio Synthesis)
  const handleTestAudio = () => {
    try {
      playHighVolumeAlarm('test');
      setAudioTested(true);
      setPreflightStatus((prev) => ({
        ...prev,
        sound: {
          checking: false,
          passed: true,
          message: 'Sistem Suara & Alarm Audio teruji dan aktif (Volume Tinggi)',
        },
      }));
      showNotification('Suara alarm berbunyi keras! Sistem suara terverifikasi.', 'success');
    } catch (err) {
      showNotification('Gagal menguji audio: ' + err.message, 'error');
    }
  };

  // 5. Masuk Mode Layar Penuh (Fullscreen & iOS Safari Fallback)
  const handleEnterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else {
        document.body.classList.add('ios-viewport-fullscreen');
        window.scrollTo(0, 1);
        setPreflightStatus((prev) => ({
          ...prev,
          fullscreen: {
            checking: false,
            passed: true,
            message: 'Mode Kunci Tampilan Layar Penuh HP iOS aktif',
          },
        }));
        showNotification('Tampilan layar penuh diaktifkan (Mode Seluler iOS)', 'success');
        return;
      }
      setPreflightStatus((prev) => ({
        ...prev,
        fullscreen: {
          checking: false,
          passed: true,
          message: 'Mode Layar Penuh (Fullscreen) telah aktif',
        },
      }));
      showNotification('Mode Layar Penuh aktif!', 'success');
    } catch (err) {
      document.body.classList.add('ios-viewport-fullscreen');
      setPreflightStatus((prev) => ({
        ...prev,
        fullscreen: {
          checking: false,
          passed: true,
          message: 'Mode Kunci Tampilan Layar Penuh HP iOS aktif',
        },
      }));
      showNotification('Mode Layar Penuh Seluler diaktifkan', 'info');
    }
  };

  // GPS Override Toggle untuk keperluan testing pengawas / offline demo (Hanya pada Mode Simulasi)
  const handleToggleGpsOverride = () => {
    if (isProduction) {
      console.warn('SECURITY ALERT: Bypass GPS diblokir total pada Mode Produksi Resmi.');
      setGpsSimulatedOverride(false);
      return;
    }
    const nextVal = !gpsSimulatedOverride;
    setGpsSimulatedOverride(nextVal);
    setPreflightStatus((prev) => ({
      ...prev,
      gps: {
        checking: false,
        passed: nextVal,
        distance: nextVal ? 15 : prev.gps.distance,
        message: nextVal
          ? 'Mode Uji Coba: GPS disimulasikan dalam radius (15m)'
          : 'Pemeriksaan GPS riil aktif',
      },
    }));
  };

// (browserPerms, isGoogleSsoRequired, isGpsDisabled, isGpsRequired telah dideklarasikan di level atas komponen)

// 1. Evaluasi apakah seluruh izin wajib yang aktif di setelan admin sudah lolos
const allPreflightPassed =
  (!isGpsRequired || preflightStatus.gps.passed || effectiveGpsOverride) &&
  (browserPerms.notifications === false || (isSimMode && Boolean(appModeConfig?.bypass_notifications)) || preflightStatus.notifications.passed) &&
  (browserPerms.sound_audio === false || (isSimMode && Boolean(appModeConfig?.bypass_audio)) || preflightStatus.sound.passed) &&
  (browserPerms.fullscreen === false || (isSimMode && Boolean(appModeConfig?.bypass_fullscreen)) || preflightStatus.fullscreen.passed) &&
  (!isGoogleSsoRequired || (isSimMode && Boolean(appModeConfig?.bypass_google_sso)) || preflightStatus.google_sso.passed) &&
  (browserPerms.block_clipboard === false || preflightStatus.clipboard.passed) &&
  (browserPerms.camera_webcam === false || (isSimMode && Boolean(appModeConfig?.bypass_media)) || preflightStatus.media.passed) &&
  (browserPerms.cookies_iframe === false || (isSimMode && Boolean(appModeConfig?.bypass_cookies_check)) || preflightStatus.cookies.passed);

// 2. Evaluasi apakah ada izin wajib yang SUDAH SELESAI diverifikasi namun GAGAL (!checking && !passed)
const hasAnyRequiredFailed =
  (isGpsRequired && !effectiveGpsOverride && !preflightStatus.gps.checking && !preflightStatus.gps.passed) ||
  (browserPerms.notifications !== false && !(isSimMode && Boolean(appModeConfig?.bypass_notifications)) && !preflightStatus.notifications.checking && !preflightStatus.notifications.passed) ||
  (browserPerms.sound_audio !== false && !(isSimMode && Boolean(appModeConfig?.bypass_audio)) && !preflightStatus.sound.checking && !preflightStatus.sound.passed) ||
  (browserPerms.fullscreen !== false && !(isSimMode && Boolean(appModeConfig?.bypass_fullscreen)) && !preflightStatus.fullscreen.checking && !preflightStatus.fullscreen.passed) ||
  (isGoogleSsoRequired && !(isSimMode && Boolean(appModeConfig?.bypass_google_sso)) && !preflightStatus.google_sso.checking && !preflightStatus.google_sso.passed) ||
  (browserPerms.block_clipboard !== false && !preflightStatus.clipboard.checking && !preflightStatus.clipboard.passed) ||
  (browserPerms.camera_webcam !== false && !(isSimMode && Boolean(appModeConfig?.bypass_media)) && !preflightStatus.media.checking && !preflightStatus.media.passed) ||
  (browserPerms.cookies_iframe !== false && !(isSimMode && Boolean(appModeConfig?.bypass_cookies_check)) && !preflightStatus.cookies.checking && !preflightStatus.cookies.passed);

// 3. Logika Alur Penahanan di Preflight vs Beranda:
// - Jika peserta belum pernah konfirmasi izin pada sesi ini (hasPassedOnce === false) -> Tahan di 'preflight'.
// - Jika sudah pernah konfirmasi pada sesi ini (hasPassedOnce === true):
//   * Saat refresh halaman, peserta langsung berada di Beranda ('home') tanpa dilempar ke preflight.
//   * Pengecekan izin tetap berjalan di latar belakang (background check).
//   * HANYA jika terbukti ada izin wajib yang diubah di setelan admin atau dicabut peramban (hasAnyRequiredFailed === true),
//     lempar peserta kembali ke laman pemeriksaan kelayakan.
useEffect(() => {
  if (currentStage === 'exam') return;

  if (!hasPassedOnce) {
    if (currentStage !== 'preflight') {
      setCurrentStage('preflight');
    }
  } else {
    if (hasAnyRequiredFailed) {
      if (currentStage !== 'preflight') {
        setCurrentStage('preflight');
        showNotification(
          'Terdapat izin browser wajib yang belum terpenuhi atau baru diubah oleh admin. Anda dialihkan kembali ke pemeriksaan kelayakan.',
          'warning'
        );
      }
      try {
        sessionStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
        localStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
      } catch {}
      setHasPassedOnce(false);
    }
  }
}, [hasPassedOnce, hasAnyRequiredFailed, currentStage, currentUser?.id]);

// Jika seluruh izin kelayakan sistem sudah terpenuhi dan peserta sudah konfirmasi, simpan status sesi
useEffect(() => {
  if (allPreflightPassed && currentUser?.id && hasPassedOnce) {
    try {
      sessionStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
      localStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
    } catch {}
  }
}, [allPreflightPassed, currentUser?.id, hasPassedOnce]);

// Sequencer Animasi Popup Pemeriksaan Izin Sistem (Popup Loading Berulang Berurutan)
useEffect(() => {
  if (currentStage === 'exam' || !showVerificationPopup) return;

  setVerificationCurrentStep(0);
  setVerificationOutcome(null);

  const stepInterval = setInterval(() => {
    setVerificationCurrentStep((prev) => {
      if (prev >= 8) {
        clearInterval(stepInterval);
        return 8;
      }
      return prev + 1;
    });
  }, 220);

  return () => clearInterval(stepInterval);
}, [showVerificationPopup, currentStage]);

// Evaluasi Hasil Kelayakan Setelah 8 Komponen Diperiksa
useEffect(() => {
  if (verificationCurrentStep < 8 || !showVerificationPopup || currentStage === 'exam') return;

  const items = getVerificationItems();
  const failed = items.some((it) => it.isRequired && !it.passed);

  if (failed) {
    setVerificationOutcome('failed');
    const endTimer = setTimeout(() => {
      setShowVerificationPopup(false);
      if (currentStage !== 'preflight') {
        setCurrentStage('preflight');
        showNotification(
          'Terdapat izin browser wajib yang belum terpenuhi. Anda dialihkan ke laman pemeriksaan kelayakan.',
          'warning'
        );
      }
      try {
        sessionStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
        localStorage.removeItem(`examguard_preflight_passed_${currentUser?.id}`);
      } catch {}
      setHasPassedOnce(false);
    }, 850);
    return () => clearTimeout(endTimer);
  } else {
    setVerificationOutcome('success');
    const endTimer = setTimeout(() => {
      setShowVerificationPopup(false);
      if (currentUser?.id) {
        try {
          sessionStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
          localStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
        } catch {}
      }
      setHasPassedOnce(true);
      setCurrentStage('home');
    }, 700);
    return () => clearTimeout(endTimer);
  }
}, [verificationCurrentStep, showVerificationPopup, currentStage, currentUser?.id]);

// Helper: Format Jadwal Ujian (Tanggal & Waktu Mulai - Selesai)
const formatExamSchedule = (startStr, endStr) => {
  if (!startStr) return 'Jadwal belum ditentukan';
  try {
    const start = new Date(startStr);
    if (isNaN(start.getTime())) return `${startStr} s/d ${endStr || '-'}`;

    const dateFormatted = start.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const timeStart = start.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).replace('.', ':');

    if (endStr) {
      const end = new Date(endStr);
      if (!isNaN(end.getTime())) {
        const timeEnd = end.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }).replace('.', ':');
        const sameDay = start.toDateString() === end.toDateString();
        if (sameDay) {
          return `${dateFormatted} • ${timeStart} - ${timeEnd} WIB`;
        }
        const endDateFormatted = end.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        return `${dateFormatted} ${timeStart} - ${endDateFormatted} ${timeEnd} WIB`;
      }
    }

    return `${dateFormatted} • Mulai ${timeStart} WIB`;
  } catch {
    return `${startStr} s/d ${endStr || '-'}`;
  }
};

// Helper: Evaluasi Status Waktu & Pengerjaan Soal Ujian Peserta
const getExamTimingStatus = (exam, attempt, now = new Date()) => {
  if (attempt && attempt.status === 'COMPLETED') {
    return {
      code: 'COMPLETED',
      label: 'Selesai Dikerjakan',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-300 font-bold',
      canStart: false,
      buttonText: 'Selesai Dikerjakan',
      isCompleted: true,
    };
  }

  if (attempt && attempt.status === 'LOCKED') {
    return {
      code: 'LOCKED',
      label: 'Layar Terkunci',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      canStart: false,
      buttonText: 'Layar Terkunci',
      isLocked: true,
    };
  }

  const nowMs = now.getTime();
  const start = exam.start_time ? new Date(exam.start_time) : null;
  const end = exam.end_time ? new Date(exam.end_time) : null;
  const hasStart = start && !isNaN(start.getTime());
  const hasEnd = end && !isNaN(end.getTime());

  if (hasStart && nowMs < start.getTime()) {
    return {
      code: 'UPCOMING',
      label: 'Belum Dimulai',
      badgeClass: 'bg-zinc-100 text-zinc-600 border-zinc-300 font-bold',
      canStart: false,
      buttonText: 'Belum Dimulai',
      isUpcoming: true,
    };
  }

  if (hasEnd && nowMs > end.getTime()) {
    return {
      code: 'EXPIRED',
      label: 'Waktu Berakhir',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-300 font-bold',
      canStart: false,
      buttonText: 'Waktu Berakhir',
      isExpired: true,
    };
  }

  const isInProgress = attempt && attempt.status === 'IN_PROGRESS';

  return {
    code: 'ACTIVE',
    label: 'Sedang Berlangsung',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
    canStart: true,
    buttonText: isInProgress ? 'Lanjutkan Ujian' : 'Mulai Ujian',
    isOngoing: true,
    isInProgress,
  };
};

// Filter daftar ujian yang tampil di Beranda Peserta:
// 1. Sesuai grade_level peserta (atau tingkat 0 = umum)
//    Catatan: Pada Mode Demo/Simulasi, izinkan semua tingkat kelas agar penguji/guru dapat menguji soal bebas tanpa terblokir tingkat akun.
// 2. is_active === true dan tidak diarsipkan
// 3. Soal Akan Datang & Selesai TETAP TAMPIL (diberi status & tombol disable)
// Filter & Urutkan daftar ujian yang tampil di Beranda Peserta:
// Urutan prioritas status soal sesuai permintaan:
// 1. Sedang Berlangsung (ACTIVE / LOCKED) - Paling atas
// 2. Belum Dimulai (UPCOMING) - Di bawahnya
// 3. Selesai Dikerjakan (COMPLETED) - Kemudian
// 4. Waktu Berakhir (EXPIRED) - Paling bawah
const availableExams = exams
  .filter((exam) => {
    const examGrade = Number(exam.grade_level ?? 0);
    const studentGrade = Number(currentUser?.tingkat ?? 0);
    const isSimulation = appModeConfig?.app_mode === 'simulation';
    const isMatchingGrade =
      isSimulation ||
      examGrade === studentGrade ||
      examGrade === 0 ||
      studentGrade === 0;

    const isActive =
      exam.is_active === true ||
      exam.is_active === 1 ||
      exam.is_active === '1' ||
      exam.is_active === undefined;

    const isArchived =
      exam.is_archived === true ||
      exam.is_archived === 1 ||
      exam.is_archived === '1';

    if (!isMatchingGrade || !isActive || isArchived) return false;

    return true;
  })
  .sort((a, b) => {
    const attemptA = attempts.find(
      (att) => att.student_id === currentUser?.id && att.exam_session_id === a.id
    );
    const attemptB = attempts.find(
      (att) => att.student_id === currentUser?.id && att.exam_session_id === b.id
    );
    const statusA = getExamTimingStatus(a, attemptA, currentTime);
    const statusB = getExamTimingStatus(b, attemptB, currentTime);

    const STATUS_PRIORITY = {
      ACTIVE: 1,
      LOCKED: 1,
      UPCOMING: 2,
      COMPLETED: 3,
      EXPIRED: 4,
    };

    const priorityA = STATUS_PRIORITY[statusA.code] || 99;
    const priorityB = STATUS_PRIORITY[statusB.code] || 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Urutan sekunder: Waktu mulai yang lebih awal didahulukan
    const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
    const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return (a.title || '').localeCompare(b.title || '');
  });

// 5. Masuk ke Ruang Ujian GForm
const handleStartExam = (exam) => {
  setSelectedExam(exam);
  setShowWarningModal(true);
  setAgreedToRules(false);
  // Pemicu awal Fullscreen pada user gesture pertama
  try {
    if (!document.fullscreenElement && hasNativeFullscreen && !isIOS) {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(() => {});
    }
  } catch {}
};

const handleConfirmStartExam = async () => {
  if (!agreedToRules) return;

  // 1. UTAMAKAN LANGSUNG MASUK FULLSCREEN SECARA SINKRON PADA USER GESTURE (PERTAMA KALI)
  // Tidak boleh didahului await async lain agar token user activation peramban tidak kedaluwarsa
  try {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Layar penuh tidak diizinkan atau diblokir:', err);
  }

  // Fallback perangkat iOS Safari
  if (isIOS || !hasNativeFullscreen) {
    document.body.classList.add('ios-viewport-fullscreen');
    window.scrollTo(0, 1);
  }

  // 2. Aktifkan audio context secara non-blocking (tanpa await agar tidak memblokir render ujian)
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('AudioContext user gesture unlock:', e);
  }

  // 3. PENTING: DILARANG MEMANGGIL navigator.clipboard.writeText('') KARENA MEMICU POPUP IZIN PERAMBAN!
  // Proteksi copy/paste/cut ditangani penuh oleh event blocker native (onCopy, onCut, onPaste, onContextMenu).

  // Dapatkan atau buat attempt
  const existingAttempt = storageService.getAttempt(currentUser.id, selectedExam.id);
  const isResetAttempt = existingAttempt?.status === 'RESET_BY_PROCTOR';
  // Jika attempt sebelumnya direset pengawas, jatah waktu mulai dari 0 dan waktu mulai diperbarui
  const initialTimeSpent = (existingAttempt && !isResetAttempt) ? (existingAttempt.time_spent_seconds || 0) : 0;
  const remaining = Math.max(0, selectedExam.duration_minutes * 60 - initialTimeSpent);
  const freshStartTime = (!existingAttempt || isResetAttempt || !existingAttempt.started_at) ? new Date().toISOString() : existingAttempt.started_at;

  const updatedAttempt = storageService.saveAttempt({
    id: existingAttempt?.id,
    exam_session_id: selectedExam.id,
    student_id: currentUser.id,
    student_name: currentUser.nama,
    student_nisn: currentUser.nisn,
    student_kelas: currentUser.kelas,
    student_tingkat: currentUser.tingkat || selectedExam.grade_level || 0,
    exam_title: selectedExam.title,
    status: (existingAttempt?.status === 'LOCKED') ? 'LOCKED' : 'IN_PROGRESS',
    violation_count: (existingAttempt && !isResetAttempt) ? (existingAttempt.violation_count || 0) : 0,
    last_violation_reason: (existingAttempt && !isResetAttempt) ? (existingAttempt.last_violation_reason || '') : '',
    time_spent_seconds: initialTimeSpent,
    started_at: freshStartTime,
  });

  setActiveExam(selectedExam);
  setActiveAttempt(updatedAttempt);
  setRemainingSeconds(remaining);
  setIsLocked(existingAttempt?.status === 'LOCKED');
  setLockReason(existingAttempt?.status === 'LOCKED' ? (existingAttempt?.last_violation_reason || '') : '');
  setShowWarningModal(false);
  setShowViolationWarningModal(false);
  setShowTokenPopup(false);
  setHasOpenedStartTokenHint(false);
  setHasOpenedFinishTokenHint(false);
  setIsGformLoading(true);
  examEnterTimestampRef.current = Date.now();
  setCurrentStage('exam');
  // Catatan: Sesuai aturan presensi, peserta yang baru mulai/sedang mengerjakan status kehadirannya masih "-" (belum diset HADIR hingga selesai ujian).
};

// Handler Refresh Lembar Soal Google Form
const handleRefreshGform = () => {
  setIsGformLoading(true);
  setGformKey((prev) => prev + 1);
};

// Batas waktu pengaman loading soal jika iframe lambat merespon
useEffect(() => {
  if (isGformLoading) {
    const safetyTimer = setTimeout(() => {
      setIsGformLoading(false);
    }, 7000);
    return () => clearTimeout(safetyTimer);
  }
}, [isGformLoading, gformKey]);

// 5b. Sensor Koneksi Ping Google Real-Time (Latency ke Server Google dalam ms)
useEffect(() => {
  if (currentStage !== 'exam' || !activeAttempt?.id) return;

  const checkGooglePing = async () => {
    try {
      const tStart = performance.now();
      // Endpoint Google generate_204 sangat ringan (0 byte) dan bebas CORS
      await fetch(`https://www.gstatic.com/generate_204?_t=${Date.now()}`, {
        mode: 'no-cors',
        cache: 'no-store',
      });
      const latencyMs = Math.max(1, Math.round(performance.now() - tStart));
      storageService.updateAttemptPing(activeAttempt.id, latencyMs);
    } catch {
      try {
        const tStart = performance.now();
        await fetch(`https://docs.google.com/forms/d/e/viewform?_t=${Date.now()}`, {
          mode: 'no-cors',
          cache: 'no-store',
        });
        const latencyMs = Math.max(1, Math.round(performance.now() - tStart));
        storageService.updateAttemptPing(activeAttempt.id, latencyMs);
      } catch {
        // Gagal koneksi ke server google
      }
    }
  };

  checkGooglePing();
  const pingTimer = setInterval(checkGooglePing, 10000);
  return () => clearInterval(pingTimer);
}, [currentStage, activeAttempt?.id]);

  // Handler Buka Kunci Cepat untuk Mode Simulasi / Pengujian Lokal
  const handleSimulationQuickUnlock = () => {
    if (activeAttempt?.id) {
      storageService.proctorUnlockAttempt(activeAttempt.id);
    }
    setIsLocked(false);
    setLockReason('');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    showNotification('Mode Simulasi: Layar ujian berhasil dibuka seketika!', 'info');
    reloadData();
  };

  // Handler Periksa Status Buka Kunci Manual dari Pengawas (Sync Langsung ke Server SQLite)
  const handleManualCheckUnlock = async () => {
    setIsCheckingUnlock(true);
    try {
      await storageService.syncWithServer();
      reloadData();
      const att = storageService.getAttempt(currentUser.id, activeExam?.id);
      if (att && (att.status === 'IN_PROGRESS' || att.status === 'UNLOCKED')) {
        setIsLocked(false);
        setLockReason('');
        setActiveAttempt(att);
        setShowViolationWarningModal(false);
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        showNotification('Proktor telah membuka kunci ujian Anda. Selamat melanjutkan pengerjaan!', 'success');
      } else {
        showNotification('Status ujian masih TERKUNCI. Proktor belum menekan Buka Kunci di dashboard pengawas.', 'warning');
      }
    } catch (err) {
      console.warn('Gagal cek buka kunci:', err);
      showNotification('Gagal memeriksa status ke server. Coba beberapa saat lagi.', 'error');
    } finally {
      setTimeout(() => {
        setIsCheckingUnlock(false);
      }, 500);
    }
  };

  // Handler Periksa Status Buka Kunci pada Card Soal di Beranda
  const handleCheckCardUnlock = async (examId) => {
    if (checkingUnlockExamId) return;
    setCheckingUnlockExamId(examId);
    try {
      await storageService.syncWithServer();
      reloadData();
      const att = storageService.getAttempt(currentUser.id, examId);
      if (att && (att.status === 'IN_PROGRESS' || att.status === 'UNLOCKED')) {
        showNotification('Status ujian telah dibuka oleh Proktor! Silakan klik Mulai Ujian.', 'success');
      } else {
        showNotification('Status masih TERKUNCI. Mintalah Proktor untuk menekan Buka Kunci di dashboard.', 'warning');
      }
    } catch (err) {
      console.warn('Gagal cek status buka kunci kartu:', err);
      showNotification('Gagal memeriksa status ke server.', 'error');
    } finally {
      setTimeout(() => {
        setCheckingUnlockExamId(null);
      }, 500);
    }
  };

  // Handler Kembali ke Beranda Peserta dari Layar Terkunci
  const handleReturnToHomeFromLock = () => {
    openConfirm({
      title: 'Kembali ke Beranda?',
      message: 'Anda akan keluar dari layar ujian ini ke beranda. Status ujian tetap tercatat terkunci sampai dibuka oleh pengawas.',
      confirmLabel: 'Kembali ke Beranda',
      cancelLabel: 'Batal',
      onConfirm: () => {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        setCurrentStage('home');
        setActiveExam(null);
        reloadData();
      }
    });
  };

// Handler Tutup Dialog Peringatan Pelanggaran dan Lanjut Ujian
const handleDismissWarningAndResume = async () => {
  stopContinuousWarningAlarm();
  setShowViolationWarningModal(false);
  setViolationWarningReason('');
  try {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch {}
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.warn('Gagal meminta layar penuh kembali:', err);
  }
};

// 6. Proctoring Sensor: Deteksi Tab Switch, Window Blur, dan Fullscreen Exit (Dengan Grace Period & Toleransi)
useEffect(() => {
  if (currentStage !== 'exam' || !activeExam || isLocked) return;

  const MAX_VIOLATIONS = 3;

  const handleViolation = (reason) => {
    // Abaikan jika masih dalam masa inisialisasi awal 5 detik masuk ujian
    if (Date.now() - examEnterTimestampRef.current < 5000) return;
    if (isLocked) return;

    // Jika modal dialog peringatan sudah tampil (peserta belum kembali ke layar penuh),
    // jangan tambah pelanggaran lagi untuk insiden keluar yang sama, tapi pastikan alarm tetap berbunyi kontinu
    if (showViolationWarningModal) {
      startContinuousWarningAlarm();
      return;
    }

    // Debounce guard 2000ms untuk mencegah multi-trigger bersamaan (misal fullscreenchange bersamaan blur/switch tab)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 2000) {
      startContinuousWarningAlarm();
      return;
    }
    lastViolationTimeRef.current = now;

    // Ambil attempt terbaru
    const currentAttempt = storageService.getAttempt(currentUser.id, activeExam.id);
    const newViolationCount = (currentAttempt?.violation_count || 0) + 1;

    const maxLimit = Number(institution?.max_violations || 3);
    if (newViolationCount < maxLimit) {
      // Masih dalam batas toleransi (Pelanggaran ke-1 & ke-2): Tampilkan dialog peringatan & Bunyikan Alarm Keras Berulang
      startContinuousWarningAlarm();

      const warningAttempt = storageService.saveAttempt({
        id: currentAttempt?.id,
        exam_session_id: activeExam.id,
        student_id: currentUser.id,
        student_name: currentUser.nama,
        student_nisn: currentUser.nisn,
        student_kelas: currentUser.kelas,
        student_tingkat: currentUser.tingkat || activeExam.grade_level || 0,
        exam_title: activeExam.title,
        status: 'IN_PROGRESS',
        violation_count: newViolationCount,
        last_violation_reason: reason,
      });

      setActiveAttempt(warningAttempt);
      setViolationWarningReason(reason);
      setViolationWarningCount(newViolationCount);
      setShowViolationWarningModal(true);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([350, 150, 350, 150, 350]); } catch {}
      }

      // Notifikasi sistem peramban jika diizinkan
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('PERINGATAN PELANGGARAN UJIAN!', {
            body: `Pelanggaran ${newViolationCount}/${maxLimit}: ${reason}`,
            tag: 'exam-warning',
          });
        } catch {}
      }
    } else {
      // Mencapai batas maksimal toleransi: KUNCI TOTAL LAYAR UJIAN & BUNYIKAN ALARM KUNCI SELAMA 3 DETIK SAJA
      stopContinuousWarningAlarm();
      playLockedAlarmFor3Seconds();

      const lockedAttempt = storageService.saveAttempt({
        id: currentAttempt?.id,
        exam_session_id: activeExam.id,
        student_id: currentUser.id,
        student_name: currentUser.nama,
        student_nisn: currentUser.nisn,
        student_kelas: currentUser.kelas,
        student_tingkat: currentUser.tingkat || activeExam.grade_level || 0,
        exam_title: activeExam.title,
        status: 'LOCKED',
        violation_count: newViolationCount,
        last_violation_reason: reason,
      });

      setActiveAttempt(lockedAttempt);
      setIsLocked(true);
      setLockReason(reason);
      setShowViolationWarningModal(false);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate([600, 200, 600, 200, 1200]); } catch {}
      }

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('UJIAN TERKUNCI!', {
            body: `Batas pelanggaran terlampaui (${newViolationCount}x). Layar ujian terkunci.`,
            tag: 'exam-locked',
          });
        } catch {}
      }
    }

    reloadData();
  };

  const handleVisibilityChange = () => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;
    if (Date.now() - examEnterTimestampRef.current < 5000) return;

    if (document.hidden) {
      handleViolation('Terdeteksi berpindah tab atau meminimalkan browser.');
    } else {
      // Peserta kembali aktif di halaman ujian:
      // Alarm HANYA boleh berhenti jika jendela sudah kembali dalam mode Layar Penuh (Fullscreen)
      const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isLocked && (isFullscreen || isIOS || !hasNativeFullscreen)) {
        stopContinuousWarningAlarm();
        setShowViolationWarningModal(false);
      }
    }
  };

  const handleWindowFocus = () => {
    // Peserta memfokuskan kembali jendela browser ujian:
    // Alarm HANYA boleh berhenti jika jendela sudah kembali dalam mode Layar Penuh (Fullscreen)
    const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    if (!document.hidden && !isLocked && (isFullscreen || isIOS || !hasNativeFullscreen)) {
      stopContinuousWarningAlarm();
      setShowViolationWarningModal(false);
    }
  };

  const handleWindowBlur = () => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;
    if (Date.now() - examEnterTimestampRef.current < 5000) return;

    // Toleransi 600ms untuk smartphone saat keyboard virtual muncul atau iframe disentuh
    setTimeout(() => {
      if (document.hidden) {
        handleViolation('Meninggalkan tab atau meminimalkan aplikasi peramban ujian.');
        return;
      }
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'IFRAME' ||
         document.activeElement.tagName === 'INPUT' ||
         document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (isMobileDevice && !document.hidden) {
        return;
      }
      if (document.hasFocus()) {
        return;
      }
      handleViolation('Kursor atau fokus meninggalkan jendela ujian.');
    }, 600);
  };

  const handleFullscreenChange = () => {
    if (Date.now() - examEnterTimestampRef.current < 4000) return;

    if (isIOS || !hasNativeFullscreen) {
      return;
    }

    const isFullscreen = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    setIsDomFullscreen(isFullscreen);

    if (!isFullscreen) {
      // Selalu picu peringatan pelanggaran ringan & banner saat peramban keluar dari Fullscreen
      handleViolation('Keluar dari mode Layar Penuh (Fullscreen).');
    } else {
      // Peserta kembali masuk ke mode Layar Penuh (Fullscreen)
      if (!isLocked) {
        stopContinuousWarningAlarm();
        setShowViolationWarningModal(false);
      }
    }
  };

  const handleBeforeUnload = (e) => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;
    if (currentStage === 'exam' && !isLocked) {
      handleViolation('Mencoba meninggalkan sistem atau menutup halaman ujian.');
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  };

  const handleKeyDown = (e) => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;

    // Deteksi & Blokir Percobaan Tangkapan Layar (PrintScreen / Screenshot / Snipping Tool)
    const isScreenshotAttempt =
      e.key === 'PrintScreen' ||
      e.key === 'Snapshot' ||
      e.code === 'PrintScreen' ||
      (e.ctrlKey && e.key.toLowerCase() === 'p') ||
      (e.metaKey && e.shiftKey && ['3', '4', 's'].includes(e.key.toLowerCase()));

    if (isScreenshotAttempt) {
      e.preventDefault();
      handleViolation('Mencoba melakukan tangkapan layar (Screenshot / PrintScreen).');
      return;
    }

    // Blokir shortcut salin, inspeksi, cetak, reload, dan DevTools
    const isDevTools =
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
      (e.ctrlKey && ['u', 's', 'p'].includes(e.key.toLowerCase()));

    if (
      (e.ctrlKey && ['c', 'v', 'u', 'p', 's', 'a', 'r'].includes(e.key.toLowerCase())) ||
      isDevTools ||
      (e.altKey && e.key === 'Tab')
    ) {
      e.preventDefault();
      handleViolation(`Percobaan penekanan tombol terlarang: ${e.key}`);
    }
  };

  const handleKeyUp = (e) => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;

    if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
      handleViolation('Mencoba melakukan tangkapan layar (Screenshot / PrintScreen).');
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('contextmenu', handleContextMenu);

  return () => {
    stopContinuousWarningAlarm();
    if (lockAlarmTimerRef.current) {
      clearTimeout(lockAlarmTimerRef.current);
    }
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('contextmenu', handleContextMenu);
  };
}, [currentStage, activeExam, isLocked, currentUser, showViolationWarningModal]);

// 7. Exam Timer Countdown, Time Spent Tracker & Heartbeat Sinyal Peserta Aktif
useEffect(() => {
  if (currentStage !== 'exam' || !activeExam || isLocked) return;

  // Sinyal heartbeat langsung saat pertama masuk pengerjaan
  storageService.sendExamHeartbeat(
    currentUser.id,
    activeExam.id,
    activeAttempt?.time_spent_seconds || 0,
    pingMs
  );

  let secondsPassed = 0;
  const timer = setInterval(() => {
    secondsPassed += 1;
    setRemainingSeconds((prev) => {
      if (prev <= 1) {
        // PERBAIKAN: Jika waktu habis, pertahankan peserta di halaman soal (jangan lempar ke lobby)
        // Bekukan waktu di 00:00 dan tampilkan banner merah peringatan submit GForm
        setIsTimeExpired(true);
        return 0;
      }
      return prev - 1;
    });

    // Update time spent lokal & kirim heartbeat sinyal setiap 3 detik
    setActiveAttempt((prevAtt) => {
      if (!prevAtt) return prevAtt;
      const newTimeSpent = (prevAtt.time_spent_seconds || 0) + 1;
      if (secondsPassed % 3 === 0) {
        storageService.sendExamHeartbeat(currentUser.id, activeExam.id, newTimeSpent, pingMs);
      }
      return { ...prevAtt, time_spent_seconds: newTimeSpent };
    });
  }, 1000);

  return () => clearInterval(timer);
}, [currentStage, activeExam, isLocked, pingMs]);

// 8. Sinkronisasi Real-Time Buka Kunci dari Pengawas saat Layar Terkunci
useEffect(() => {
  if (currentStage !== 'exam' || !isLocked || !activeExam) return;

  const performUnlockIfPermitted = (incomingAttempt = null) => {
    const att = incomingAttempt || storageService.getAttempt(currentUser.id, activeExam.id);
    if (att && (att.status === 'IN_PROGRESS' || att.status === 'UNLOCKED')) {
      setIsLocked(false);
      setLockReason('');
      setActiveAttempt(att);
      setShowViolationWarningModal(false);
      // Masuk kembali ke fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
      showNotification('Layar ujian berhasil dibuka oleh Pengawas! Silakan lanjutkan pengerjaan.', 'success');
    }
  };

  // 1. Terima sinyal instan via WebSocket via dbService
  const unsubscribe = subscribeSync((event, data) => {
    const evName = typeof event === 'string' ? event : data?.event || data?.action;
    if (
      evName === 'attempt_unlocked' ||
      evName === 'violations_reset' ||
      evName === 'attempt_updated' ||
      data?.action === 'attempt_unlocked' ||
      data?.action === 'violations_reset'
    ) {
      const incomingAttempt = data?.attempt || (typeof event === 'object' ? event?.attempt : null);
      if (
        !incomingAttempt ||
        ((incomingAttempt.student_id === currentUser.id || incomingAttempt.student_nisn === currentUser.nisn) &&
         incomingAttempt.exam_session_id === activeExam.id)
      ) {
        performUnlockIfPermitted(incomingAttempt);
      }
    }
  });

  // 2. Event storage browser native & custom event
  const handleStorageChange = (e) => {
    const incomingAttempt = e?.detail?.attempt;
    performUnlockIfPermitted(incomingAttempt);
  };
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('examguard_storage_updated', handleStorageChange);

  // 3. Polling interval 1.5 detik sebagai fail-safe yang menyinkronkan dengan server SQLite
  const checkLockStatus = setInterval(async () => {
    try {
      await storageService.syncWithServer();
      reloadData();
      performUnlockIfPermitted();
    } catch {}
  }, 1500);

  return () => {
    unsubscribe();
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('examguard_storage_updated', handleStorageChange);
    clearInterval(checkLockStatus);
  };
}, [currentStage, isLocked, activeExam, currentUser]);

// 9. Tombol Selesaikan Ujian (Otomatis Kembali ke Beranda Tanpa Keluar Fullscreen & Auto Cek)
const handleFinishExam = async (isAutoTimeOut = false) => {
  if (!activeExam) return;

  // Simpan status COMPLETED ke database lokal & antrean sinkronisasi
  storageService.saveAttempt({
    exam_session_id: activeExam.id,
    student_id: currentUser.id,
    student_name: currentUser.nama,
    student_nisn: currentUser.nisn,
    student_kelas: currentUser.kelas,
    exam_title: activeExam.title,
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  });

  // Catat kehadiran otomatis ke sistem presensi (Peserta yang menyelesaikan ujian dinyatakan HADIR)
  try {
    storageService.updateStudentAttendance(
      activeExam.id,
      currentUser.id,
      { status: 'HADIR' },
      'Sistem Peserta'
    );
  } catch { }

  // PENTING: TETAP PERTAHANKAN MODE FULLSCREEN (Jangan keluar fullscreen)
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen().catch(() => {});
    }
  } catch {}

  // Pastikan status kelayakan sistem tetap valid agar peserta langsung masuk ke Beranda Portal
  try {
    sessionStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
    localStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
  } catch {}
  setHasPassedOnce(true);

  // Tutup seluruh popover/modal konfirmasi ujian
  setShowFinishConfirmModal(false);
  setActiveExam(null);
  setActiveAttempt(null);
  setShowTokenPopup(false);
  setShowViolationWarningModal(false);
  stopContinuousWarningAlarm();

  // Langsung otomatis kembali ke Beranda Portal Peserta dalam mode fullscreen
  setCurrentStage('home');

  // Lakukan auto-pengecekan otomatis (sinkronisasi data server SQLite & reload data beranda)
  try {
    await storageService.syncWithServer();
  } catch {}
  reloadData();

  if (isAutoTimeOut) {
    showNotification('Waktu pengerjaan telah habis! Sesi ujian Anda telah otomatis diselesaikan dan jawaban tersimpan.', 'warning');
  } else {
    showNotification('Ujian berhasil diselesaikan! Anda langsung diarahkan kembali ke beranda portal peserta dalam mode layar penuh.', 'success');
  }
};

const copyToken = (token) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).catch(() => {
        fallbackCopyText(token);
      });
    } else {
      fallbackCopyText(token);
    }
  } catch {
    fallbackCopyText(token);
  }
  setCopiedToken(true);
  setTimeout(() => setCopiedToken(false), 2000);
};

const fallbackCopyText = (text) => {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  } catch {}
};

// Render Dialog Ubah Password Mandiri Peserta (Popup Blur Modern & 5 Tingkat Validasi)
const renderChangePasswordModal = () => {
  if (!showChangePasswordModal) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowChangePasswordModal(false);
          setChangePasswordError('');
          setChangePasswordSuccess('');
        }
      }}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 text-sm">
                Ubah Password Peserta
              </h3>
              <p className="text-[11px] text-zinc-500">
                Ubah kata sandi akun login Anda secara mandiri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowChangePasswordModal(false);
              setChangePasswordError('');
              setChangePasswordSuccess('');
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {changePasswordSuccess ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-emerald-900">Kata Sandi Berhasil Diperbarui</h4>
            <p className="text-xs text-emerald-700 leading-relaxed">{changePasswordSuccess}</p>
          </div>
        ) : (
          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            {changePasswordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{changePasswordError}</span>
              </div>
            )}

            {/* 1. Password Lama */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Password Lama <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPasswordInput}
                  onChange={(e) => setOldPasswordInput(e.target.value)}
                  placeholder="Masukkan password saat ini (default: NIS)"
                  required
                  className="w-full text-xs px-3 py-2.5 pr-9 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                *Jika baru pertama kali login, password lama adalah nomor NIS Anda.
              </p>
            </div>

            {/* 2. Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Minimal 6 digit & 4 kriteria terpenuhi"
                  required
                  className="w-full text-xs px-3 py-2.5 pr-9 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Indikator Kekuatan Password 5 Tingkat */}
              {newPasswordInput && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-zinc-500">Tingkat Kekuatan:</span>
                    <span className={`font-bold ${strengthInfo.textColor}`}>
                      {strengthInfo.label} ({passedCriteriaCount}/5 Kriteria)
                    </span>
                  </div>
                  {/* 5-Segment Bar */}
                  <div className="grid grid-cols-5 gap-1.5 h-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div
                        key={lvl}
                        className={`rounded-full transition-all duration-300 ${
                          passedCriteriaCount >= lvl ? strengthInfo.barColor : 'bg-zinc-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* 5 Kriteria Checklist */}
                  <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-[11px]">
                    <div className="font-semibold text-zinc-600 mb-1">
                      Syarat Keamanan (Minimal 4 Terpenuhi & Min 6 Digit):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {hasMinLength ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mx-1"></span>}
                        <span>Minimal 6 karakter ({newPasswordInput.length}/6)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {hasLower ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mx-1"></span>}
                        <span>Huruf kecil (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {hasUpper ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mx-1"></span>}
                        <span>Huruf besar (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {hasNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mx-1"></span>}
                        <span>Angka (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-700 font-semibold' : 'text-zinc-500'}`}>
                        {hasSymbol ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0 mx-1"></span>}
                        <span>Simbol unik (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Konfirmasi Password Baru */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 block">
                Konfirmasi Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="Ketik ulang password baru Anda"
                  required
                  className="w-full text-xs px-3 py-2.5 pr-9 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPasswordInput && confirmPasswordInput !== newPasswordInput && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Konfirmasi password tidak cocok dengan password baru.
                </p>
              )}
              {confirmPasswordInput && confirmPasswordInput === newPasswordInput && (
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Konfirmasi password cocok
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                }}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isChangingPassword || !isPasswordValid}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Simpan Password Baru</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Render Dialog Autentikasi Google SSO untuk Sesi Ujian Aktif
const renderGoogleLoginModal = () => {
  if (!showGoogleLoginModal) return null;
  const registeredEmail = currentUser?.google_email || currentUser?.email;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 space-y-4">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <GoogleBrandIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Autentikasi Akun Google Sesi Ini
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Masuk dengan akun Google resmi untuk memenuhi syarat kelayakan ujian.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGoogleLoginModal(false)}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profil Peserta Saat Ini */}
        <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5 text-xs">
          <div className="flex justify-between items-center text-zinc-600">
            <span>Nama Peserta:</span>
            <span className="font-bold text-zinc-900">{currentUser?.nama}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-600">
            <span>NISN / No. Ujian:</span>
            <span className="font-mono font-semibold text-zinc-800">{currentUser?.username}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-600">
            <span>Kelas & Tingkat:</span>
            <span className="font-medium text-zinc-800">{currentUser?.kelas || '-'} (Tingkat {currentUser?.tingkat || '-'})</span>
          </div>
          <div className="pt-1.5 border-t border-zinc-200/70 flex justify-between items-center text-zinc-600">
            <span>Email di Database:</span>
            <span className={`font-mono text-[11px] ${registeredEmail ? 'font-bold text-blue-700' : 'italic text-zinc-400'}`}>
              {registeredEmail || 'Belum ada email (ditautkan saat login Google)'}
            </span>
          </div>
        </div>

        {googleLoginError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{googleLoginError}</span>
          </div>
        )}

        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
          <strong>Verifikasi Langsung:</strong> Klik tombol di bawah untuk membuka popup resmi Google. Sesi ujian Anda akan langsung diverifikasi dan checklist Google SSO otomatis hijau.
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1 border-t border-zinc-100">
          <button
            type="button"
            disabled={isGoogleLoginSubmitting}
            onClick={handleDirectGoogleSso}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
          >
            {isGoogleLoginSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghubungkan ke Google...</span>
              </>
            ) : (
              <>
                <GoogleBrandIcon className="w-4 h-4" />
                <span>Masuk dengan Akun Google</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowGoogleLoginModal(false)}
            className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-xs font-medium cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// Render Dialog Animasi Popup Pemeriksaan Izin Sistem Berulang (Checklist Animated Popup)
const renderVerificationPopup = () => {
  if (!showVerificationPopup || currentStage === 'exam') return null;

  const items = getVerificationItems();
  const progressCount = Math.min(verificationCurrentStep, 8);
  const progressPercent = Math.round((progressCount / 8) * 100);

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200/80 animate-in zoom-in-95 duration-200 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-zinc-100">
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-zinc-900 truncate">
                Pemeriksaan Kelayakan Sistem
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 font-mono">
                {progressCount} / 8 Selesai
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
              Memverifikasi izin & sensor peramban ujian...
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-100 rounded-full h-1.5 my-3.5 overflow-hidden">
          <div
            className={`h-1.5 transition-all duration-300 rounded-full ${
              verificationOutcome === 'failed'
                ? 'bg-rose-500'
                : verificationOutcome === 'success'
                ? 'bg-emerald-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Checklist List Animasi */}
        <div className="space-y-2 max-h-[52vh] overflow-y-auto pr-1">
          {items.map((item, index) => {
            let itemStatus = 'pending';
            if (index < verificationCurrentStep) {
              itemStatus = item.passed ? 'passed' : 'failed';
            } else if (index === verificationCurrentStep) {
              if (item.passed && !item.isChecking) {
                itemStatus = 'passed';
              } else if (!item.isRequired && !item.isChecking) {
                itemStatus = 'passed';
              } else {
                itemStatus = item.isChecking ? 'checking' : (item.passed ? 'passed' : 'failed');
              }
            }

            return (
              <div
                key={item.id}
                className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2.5 transition-all duration-200 ${
                  itemStatus === 'passed'
                    ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                    : itemStatus === 'failed'
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                    : itemStatus === 'checking'
                    ? 'bg-blue-50/80 border-blue-200 shadow-2xs scale-[1.01]'
                    : 'bg-zinc-50/40 border-zinc-200/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      itemStatus === 'passed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : itemStatus === 'failed'
                        ? 'bg-rose-100 text-rose-700'
                        : itemStatus === 'checking'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-zinc-200 text-zinc-500'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                      <span className="truncate">{item.name}</span>
                      {!item.isRequired && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-600 font-normal shrink-0">
                          Bebas
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {itemStatus === 'checking'
                        ? 'Sedang memvalidasi respon peramban...'
                        : itemStatus === 'passed'
                        ? item.detail || 'Terverifikasi aktif'
                        : itemStatus === 'failed'
                        ? item.detail || 'Tidak memenuhi syarat'
                        : 'Menunggu giliran pemeriksaan...'}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center font-medium text-xs">
                  {itemStatus === 'passed' && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md text-[11px] font-bold animate-in zoom-in-75">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.isRequired ? 'Lolos' : 'Bebas'}
                    </span>
                  )}
                  {itemStatus === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded-md text-[11px] font-bold animate-in zoom-in-75">
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      Gagal
                    </span>
                  )}
                  {itemStatus === 'checking' && (
                    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md text-[11px] font-semibold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      Memeriksa...
                    </span>
                  )}
                  {itemStatus === 'pending' && (
                    <span className="text-zinc-400 text-[10px] px-2 py-0.5">Menunggu...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status Announcement */}
        <div className="mt-4 pt-3 border-t border-zinc-100">
          {verificationOutcome === 'success' ? (
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Seluruh izin sesuai! Membuka portal...</span>
            </div>
          ) : verificationOutcome === 'failed' ? (
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold animate-in fade-in">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Ada izin yang belum terpenuhi. Mengalihkan...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Memvalidasi izin sistem secara otomatis...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal Popup Lebar: Peta Pemeriksaan Lokasi, Geofence & Garis Jarak
const renderLocationDetailModal = () => {
  if (!showLocationDetailModal) return null;

  const schoolLat = Number(institution?.center_lat || -6.2088);
  const schoolLng = Number(institution?.center_lng || 106.8456);
  const schoolRadius = Number(institution?.max_radius_meters || 200);

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setShowLocationDetailModal(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-3 bg-zinc-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                Pemeriksaan Lokasi & Garis Jarak ke Sekolah
              </h3>
              <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                Posisi live perangkat Anda terhadap titik pusat instansi ({institution?.name || 'Sekolah'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowLocationDetailModal(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/80 transition-colors cursor-pointer shrink-0"
            title="Tutup dialog peta"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Info Cards Ringkasan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Card 1: Titik Sekolah */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <div className="flex items-center gap-1.5 text-blue-800 font-bold mb-1">
                <School className="w-4 h-4 text-blue-600" />
                <span>Titik Pusat Sekolah</span>
              </div>
              <div className="text-zinc-700 font-semibold truncate text-[11px]">
                {institution?.name || 'Sekolah'}
              </div>
              <div className="text-[10.5px] font-mono text-zinc-500 mt-0.5">
                Lat: {schoolLat.toFixed(6)}, Lng: {schoolLng.toFixed(6)}
              </div>
              <div className="text-[11px] text-blue-700 font-medium mt-1">
                Radius Toleransi: <strong>{schoolRadius} meter</strong>
              </div>
            </div>

            {/* Card 2: Status Kebijakan GPS */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-1.5 text-zinc-800 font-bold mb-1">
                <Shield className="w-4 h-4 text-zinc-600" />
                <span>Kebijakan GPS Ujian</span>
              </div>
              <div className="text-zinc-700 font-medium text-[11px]">
                {isGpsDisabled ? (
                  <span className="inline-flex items-center gap-1 text-zinc-600 bg-zinc-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px]">
                    Bebas Lokasi (Non-Aktif)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md font-semibold text-[10.5px]">
                    Wajib Berada di Radius
                  </span>
                )}
              </div>
              <div className="text-[10.5px] text-zinc-500 mt-1 leading-snug">
                {isGpsDisabled
                  ? 'Sekolah tidak membatasi lokasi fisik pengerjaan ujian.'
                  : 'Peserta wajib berada di dalam lingkaran radius sekolah.'}
              </div>
            </div>

            {/* Card 3: Petunjuk Garis Jarak */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
              <div className="flex items-center gap-1.5 text-indigo-900 font-bold mb-1">
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>Garis Jarak Presisi</span>
              </div>
              <div className="text-[11px] text-zinc-600 leading-snug">
                Garis putus-putus di peta menghubungkan posisi GPS Anda (🔴 Pin Merah) langsung ke pusat sekolah (🏫).
              </div>
              <div className="text-[10.5px] font-semibold text-indigo-700 mt-1">
                Hitungan jarak otomatis via formula Haversine.
              </div>
            </div>
          </div>

          {/* Peta Interaktif Leaflet dengan Garis Jarak */}
          <div className="rounded-xl overflow-hidden border border-zinc-200 shadow-2xs">
            <GeofenceMapPreview
              lat={schoolLat}
              lng={schoolLng}
              radius={schoolRadius}
              institutionName={institution?.name || 'Sekolah'}
              logoUrl={institution?.logo_url || ''}
              userLat={studentCoords?.lat}
              userLng={studentCoords?.lng}
              userAccuracy={studentCoords?.accuracy}
              allowSetUserLocation={false}
              showDistanceLine={true}
              disableDragSchool={true}
              showPresets={false}
              showSearch={true}
              heightClass="h-80 sm:h-96 md:h-[400px]"
              onDeviceLocationDetected={(loc) => setStudentCoords(loc)}
            />
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-zinc-500">
            Gunakan GPS perangkat dengan akurasi tinggi untuk hasil optimal.
          </span>
          <button
            type="button"
            onClick={() => setShowLocationDetailModal(false)}
            className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            Tutup Peta
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

// ==========================================
// VIEW 1: PRE-FLIGHT PERMISSION CHECK
  // ==========================================
  if (currentStage === 'preflight') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
        {/* Banner Pita Berjalan Pengumuman Pusat */}
        <BroadcastRibbon />
        <header className="w-full max-w-lg pt-6 pb-2 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white shadow-xs mb-3 overflow-hidden">
            {institution?.logo_url && !logoError ? (
              <img
                src={institution.logo_url}
                alt="Logo Sekolah"
                className="w-full h-full object-contain p-1.5 bg-white"
                onError={() => setLogoError(true)}
              />
            ) : (
              <Shield className="w-6 h-6 text-zinc-100" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
            Pemeriksaan Kelayakan Sistem (Pre-Flight)
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            {institution?.name} &bull; Validasi Izin Perangkat & Lokasi Fisik Peserta
          </p>
        </header>

        <main className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-7 my-auto space-y-4">
          {storageService.getAppModeConfig().app_mode === 'simulation' && (
            <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>MODE SIMULASI / PENGEMBANGAN AKTIF</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Sensor GPS & fitur tertentu di-bypass untuk pengujian lokal.
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 shrink-0">
                DEV/LOCAL
              </span>
            </div>
          )}

          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 leading-relaxed">
            Selamat datang, <strong className="text-blue-900">{currentUser.nama}</strong> (No. Ujian:{' '}
            <strong className="font-mono text-blue-950">{currentUser.nomor_ujian || currentUser.nisn}</strong> &bull; NISN:{' '}
            {currentUser.nisn}). Sistem memerlukan beberapa verifikasi izin sebelum Anda dapat membuka beranda soal.{' '}
            <button
              type="button"
              onClick={() => {
                setOldPasswordInput('');
                setNewPasswordInput('');
                setConfirmPasswordInput('');
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setShowChangePasswordModal(true);
              }}
              className="text-blue-700 underline font-semibold hover:text-blue-900 cursor-pointer inline-flex items-center gap-1 ml-1"
            >
              <KeyRound className="w-3 h-3" /> Ganti Kata Sandi
            </button>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5 pt-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. Izinkan Lokasi (GPS) */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    isGpsDisabled
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.gps.passed || effectiveGpsOverride
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      1. Izinkan Lokasi (Login GPS & Radius)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {isGpsDisabled ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.gps.message}
                  </div>
                  {isGpsRequired && (
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Batas Maksimal: {institution?.max_radius_meters || 200} meter dari titik sekolah
                    </div>
                  )}

                  {/* Tombol Aksi Lokasi & Periksa Lokasi di Maps */}
                  <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowInlineMapPreview(!showInlineMapPreview)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                      title={showInlineMapPreview ? "Tutup preview peta di dalam card" : "Buka preview peta langsung di dalam card"}
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showInlineMapPreview ? 'Sembunyikan Peta' : 'Preview Peta Lokasi'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLocationDetailModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
                      title="Buka popup peta interaktif layar penuh"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Popup Lebar</span>
                    </button>

                    {isGpsRequired && !preflightStatus.gps.passed && !effectiveGpsOverride && (
                      <button
                        type="button"
                        onClick={handleRequestGps}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Minta Izin GPS</span>
                      </button>
                    )}

                    {isSimMode && (
                      <button
                        type="button"
                        onClick={handleToggleGpsOverride}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        <FlaskConical className="w-3 h-3" />
                        <span>Bypass Lokasi (Uji)</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Preview Peta Langsung di Card 1 */}
                  {showInlineMapPreview && (
                    <div className="mt-3.5 rounded-2xl overflow-hidden border border-zinc-200/90 shadow-2xs bg-white animate-in fade-in duration-200">
                      <div className="px-3 py-2 bg-zinc-50/90 border-b border-zinc-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preview Peta: Posisi Saya & Sekolah</span>
                        </div>
                        <span className="text-[10.5px] text-zinc-500 font-medium">
                          {institution?.name || 'Sekolah'}
                        </span>
                      </div>
                      <div className="p-2">
                        <GeofenceMapPreview
                          lat={Number(institution?.center_lat || -6.2088)}
                          lng={Number(institution?.center_lng || 106.8456)}
                          radius={Number(institution?.max_radius_meters || 200)}
                          institutionName={institution?.name || 'Sekolah'}
                          logoUrl={institution?.logo_url || ''}
                          userLat={studentCoords?.lat}
                          userLng={studentCoords?.lng}
                          userAccuracy={studentCoords?.accuracy}
                          allowSetUserLocation={false}
                          showDistanceLine={true}
                          disableDragSchool={true}
                          showPresets={false}
                          showSearch={false}
                          heightClass="h-64 sm:h-72"
                          onDeviceLocationDetected={(loc) => setStudentCoords(loc)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {isGpsDisabled || preflightStatus.gps.passed || effectiveGpsOverride ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : preflightStatus.gps.checking ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 2. Izinkan Notifications */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.notifications === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.notifications.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      2. Izinkan Notifications (Peringatan)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.notifications === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.notifications.message}
                  </div>
                  {browserPerms.notifications !== false && !preflightStatus.notifications.passed && (
                    <button
                      type="button"
                      onClick={handleRequestNotificationPermission}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{isMobileDevice ? 'Aktifkan Notifikasi Layar HP (Suara & Getar)' : 'Izinkan Notifikasi Sekarang'}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.notifications === false || preflightStatus.notifications.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 3. Izinkan Sound */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.sound_audio === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.sound.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      3. Izinkan Sound (Suara Audio Alarm)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.sound_audio === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.sound.message}
                  </div>
                  {browserPerms.sound_audio !== false && !preflightStatus.sound.passed && (
                    <button
                      type="button"
                      onClick={handleTestAudio}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Uji Bunyi Suara Alarm</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.sound_audio === false || preflightStatus.sound.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 4. Login Akun Google */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    !isGoogleSsoRequired
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.google_sso.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <GoogleBrandIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      4. Login Akun Google (SSO Workspace)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {!isGoogleSsoRequired ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.google_sso.message}
                  </div>
                  {isGoogleSsoRequired && (
                    !preflightStatus.google_sso.passed ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleOpenGoogleLoginModal}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <GoogleBrandIcon className="w-3.5 h-3.5" />
                          <span>Login Akun Google Sesi Ini</span>
                        </button>
                        <span className="text-[10px] text-zinc-500">Wajib login untuk konfirmasi izin</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{currentUser?.google_email || currentUser?.email || 'Akun Google Terhubung'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleOpenGoogleLoginModal}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                        >
                          Ganti Akun
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {!isGoogleSsoRequired || preflightStatus.google_sso.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
              </div>
            </div>

            {/* 5. Block Clipboard */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.block_clipboard === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      5. Block Clipboard (Papan Klip)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.block_clipboard === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.clipboard.message}
                  </div>
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.block_clipboard === false || preflightStatus.clipboard.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 6. Sensor Kamera & Mikrofon */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.camera_webcam === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.media.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      6. Sensor Kamera & Mikrofon
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.camera_webcam === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.media.message}
                  </div>
                  {browserPerms.camera_webcam !== false && !preflightStatus.media.passed && (
                    <button
                      type="button"
                      onClick={handleRequestCameraMic}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Izinkan Sensor Kamera & Mic</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.camera_webcam === false || preflightStatus.media.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 7. Third-Party Cookies & Iframe */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.cookies_iframe === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.cookies.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Cookie className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      7. Akses Cookies & Iframe GForm
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.cookies_iframe === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.cookies.message}
                  </div>
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.cookies_iframe === false || preflightStatus.cookies.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 8. Izinkan Fullscreen (Di Akhir Ceklis) */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.fullscreen === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.fullscreen.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-zinc-900">
                      8. Izinkan Fullscreen (Layar Penuh)
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android Chrome">
                      <Smartphone className="w-2.5 h-2.5" /> HP
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                      <Laptop className="w-2.5 h-2.5" /> Laptop
                    </span>
                    {browserPerms.fullscreen === false ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 font-medium">
                        Bebas / Non-Aktif
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                        Wajib
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {preflightStatus.fullscreen.message}
                  </div>
                  {browserPerms.fullscreen !== false && !preflightStatus.fullscreen.passed && (
                    <button
                      type="button"
                      onClick={handleEnterFullscreen}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-zinc-100" />
                      <span>Masuk Layar Penuh (Fullscreen)</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.fullscreen === false || preflightStatus.fullscreen.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>
          </div>

          {/* Opsi Darurat Simulasi GPS untuk Demo/Testing (Hanya Ditampilkan Pada Mode Simulasi) */}
          {isSimMode && (
            <div className="pt-2 animate-in fade-in">
              <button
                type="button"
                onClick={handleToggleGpsOverride}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 underline inline-flex items-center gap-1"
              >
                <span>
                  {gpsSimulatedOverride
                    ? 'Matikan Simulasi Radius GPS (Kembali ke Riil)'
                    : 'Perangkat tidak memiliki GPS? Klik di sini untuk Mode Simulasi Pengawas'}
                </span>
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              disabled={!allPreflightPassed}
              onClick={() => {
                if (currentUser?.id) {
                  try {
                    sessionStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
                    localStorage.setItem(`examguard_preflight_passed_${currentUser.id}`, 'true');
                  } catch {}
                  setHasPassedOnce(true);
                }
                setCurrentStage('home');
              }}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                allPreflightPassed
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer active:scale-[0.99]'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <span>
                {allPreflightPassed
                  ? 'Izin Terpenuhi • Lanjutkan ke Beranda Ujian'
                  : 'Harap penuhi seluruh izin di atas'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        <footer className="w-full max-w-lg py-4 text-center">
          <button
            onClick={handleConfirmLogout}
            className="text-xs text-zinc-500 hover:text-rose-600 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun Peserta</span>
          </button>
        </footer>

        {renderChangePasswordModal()}

        {/* Modal Autentikasi Google SSO Sesi Ini */}
        {renderGoogleLoginModal()}

        {/* Modal Popup Lebar Peta Pemeriksaan Lokasi & Garis Jarak */}
        {renderLocationDetailModal()}

        {/* Modal Popup Animasi Pemeriksaan Izin Sistem Berulang */}
        {renderVerificationPopup()}

        {/* Toast Notifikasi Peserta */}
        {toast.show && (
          <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-700 text-xs animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
          </div>
        )}

        {/* Modal Dialog Konfirmasi & Alert Modern */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={closeConfirm}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          icon={confirmDialog.icon}
        />
      </div>
    );
  }

  // VIEW 2: BERANDA PESERTA (PARTICIPANT HOME)
  // ==========================================
  if (currentStage === 'home') {
    return (
      <div className="min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white flex flex-col justify-between">
        {/* Banner Pita Berjalan Pengumuman Pusat di Beranda Peserta */}
        <BroadcastRibbon />

        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
              {institution?.logo_url && !headerLogoError ? (
                <img
                  src={institution.logo_url}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain p-1 bg-white"
                  onError={() => setHeaderLogoError(true)}
                />
              ) : (
                <Shield className="w-5 h-5 text-zinc-100" />
              )}
            </div>

            {/* Tampilan HP (< sm): Baris 1 Nama Sekolah (Animasi Marquee Berjalan jika terpotong), Baris 2 Tingkat */}
            <MobileSchoolHeader
              schoolName={institution?.name || 'ExamGuard Portal Peserta'}
              gradeLabel={
                currentUser?.tingkat
                  ? getGradeLabel(currentUser.tingkat)
                  : (currentUser?.kelas ? `Tingkat ${currentUser.kelas}` : 'Tingkat Umum')
              }
            />

            {/* Tampilan Desktop & Tablet (>= sm) */}
            <div className="hidden sm:block min-w-0">
              <div className="font-semibold text-zinc-900 text-sm tracking-tight truncate">
                {institution?.name || 'ExamGuard Portal Peserta'}
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span>{getGradeLabel(currentUser.tingkat)}</span>
                <span>&bull;</span>
                <span>Kelas: {currentUser.kelas}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Indikator Real-time Baterai & Ping Latensi Google */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-mono font-medium border border-zinc-200/80 shadow-2xs shrink-0">
              {/* Ping ke Google (Google Form) */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 cursor-help"
                title={`Latensi Ping ke Google (Google Form): ${pingMs} ms`}
              >
                <Wifi className={`w-3.5 h-3.5 shrink-0 ${
                  pingStatus === 'good'
                    ? 'text-emerald-600'
                    : pingStatus === 'fair'
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`} />
                <span className="text-[10px] sm:text-[11px] font-bold">{pingMs !== null ? `${pingMs}ms` : '...'}</span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  pingStatus === 'good'
                    ? 'bg-emerald-500'
                    : pingStatus === 'fair'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500 animate-ping'
                }`} />
              </div>

              <span className="text-zinc-300">|</span>

              {/* Baterai */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 cursor-help"
                title={`Daya Baterai: ${batteryLevel}% ${isCharging ? '(Sedang Mengisi Daya)' : ''}`}
              >
                {isCharging ? (
                  <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                ) : batteryLevel <= 20 ? (
                  <BatteryWarning className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                ) : (
                  <BatteryMedium className={`w-3.5 h-3.5 shrink-0 ${batteryLevel >= 50 ? 'text-emerald-600' : 'text-amber-500'}`} />
                )}
                <span className="text-[10px] sm:text-[11px] font-bold">{batteryLevel}%</span>
              </div>
            </div>

            {/* Tombol Kelayakan Sistem (Ikon ringkas di HP, teks di layar lebih besar) */}
            <button
              type="button"
              onClick={() => setShowPreflightModal(true)}
              title="Periksa Status Kelayakan Sistem"
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 shadow-2xs transition-all cursor-pointer shrink-0"
            >
              <div className="relative flex items-center justify-center">
                <ShieldCheck className={`w-4 h-4 ${allPreflightPassed ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${allPreflightPassed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              </div>
              <span className="hidden md:inline">Kelayakan Sistem</span>
            </button>

            {/* Real-time Clock (Disembunyikan di HP & Tablet agar navbar tidak sesak) */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-mono font-medium border border-zinc-200/60 shrink-0">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {currentTime.toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                &bull; {currentTime.toLocaleTimeString('id-ID')} WIB
              </span>
            </div>

            {/* Tombol Keluar (Ikon ringkas di HP, teks di layar lebih besar) */}
            <button
              onClick={handleConfirmLogout}
              title="Keluar dari Akun"
              className="inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {/* Card 1: Identitas Peserta Ujian (Format List Rapi Sesuai Permintaan) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            {/* Header: Sapaan & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  PORTAL PESERTA UJIAN {institution?.name ? institution.name.toUpperCase() : ''}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                  Halo, {currentUser.nama}! Yuk cek jadwal ujianmu hari ini
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pastikan data identitas di bawah ini sesuai sebelum memulai sesi ujian.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPreflightModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                  title="Klik untuk melihat rincian pemeriksaan kelayakan"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kelayakan Sistem Lolos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOldPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                    setShowChangePasswordModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  title="Ubah kata sandi akun login Anda"
                >
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Ubah Password</span>
                </button>
              </div>
            </div>

            {/* List Format Rapi Identitas Peserta Ujian */}
            {(() => {
              const detectedEmail = currentUser.google_email || currentUser.email || 'student@gmail.com';
              const isEmailSsoMatched = Boolean(
                (currentUser.google_linked && (currentUser.google_email || currentUser.google_id)) ||
                (institution?.google_oauth_account?.email && currentUser.email === institution?.google_oauth_account?.email)
              );
              const isStudentVerified = currentUser.is_verified !== false;

              return (
                <div className="bg-zinc-50/70 border border-zinc-200/70 rounded-xl p-4 sm:p-5 space-y-2.5 text-xs sm:text-sm">
                  {/* 1. Nomor Ujian */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Nomor Ujian</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <span className="font-mono font-bold text-zinc-900 bg-white px-2.5 py-0.5 rounded-md border border-zinc-200/80 inline-block w-fit">
                      {currentUser.nomor_ujian || currentUser.nisn || '-'}
                    </span>
                  </div>

                  {/* 2. Nama Peserta */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Nama Peserta</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <div className="inline-flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900">
                        {currentUser.nama || '-'}
                      </span>
                      {isStudentVerified && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          title="Data Peserta Terverifikasi di Database"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Terverifikasi</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. NISN / NIS */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">NISN / NIS</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <span className="font-mono text-zinc-800">
                      {currentUser.nisn || '-'}{currentUser.nis ? ` / ${currentUser.nis}` : ''}
                    </span>
                  </div>

                  {/* 4. Rombel (Tepat di bawah NISN/NIS sesuai permintaan) */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Rombel</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <span className="font-bold text-zinc-900 bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200/80 inline-block w-fit">
                      {currentUser.kelas || '-'}
                    </span>
                  </div>

                  {/* 5. Jenis Kelamin & Agama */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Jenis Kelamin</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <div className="flex items-center gap-6 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800">
                        <User className={`w-4 h-4 ${currentUser.jenis_kelamin === 'P' ? 'text-pink-600' : 'text-blue-600'}`} />
                        <span>
                          {currentUser.jenis_kelamin === 'L'
                            ? 'Laki-laki'
                            : currentUser.jenis_kelamin === 'P'
                            ? 'Perempuan'
                            : (currentUser.jenis_kelamin || '-')}
                        </span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-500">Agama</span>
                        <span className="text-zinc-400 font-bold">:</span>
                        <span className="font-medium text-zinc-800">{currentUser.agama || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 6. Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Email</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <div className="inline-flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-zinc-800 font-medium">
                        {detectedEmail}
                      </span>
                      {isEmailSsoMatched ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          title="Email cocok dengan database dan tersimpan pada Google SSO"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SSO</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400 italic">
                          (Belum tersimpan SSO)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 7. Ruang Ujian (Murni Ruang Ujian tanpa teks Rombel) */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 border-b border-zinc-200/50 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">Ruang Ujian</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <span className="font-medium text-zinc-800">
                      {currentUser.ruang || '-'}
                    </span>
                  </div>

                  {/* 8. ID Perangkat */}
                  <div className="flex flex-col sm:flex-row sm:items-center py-1.5 gap-1 sm:gap-3">
                    <span className="font-semibold text-zinc-500 sm:w-36 shrink-0">ID Perangkat</span>
                    <span className="hidden sm:inline text-zinc-400 font-bold">:</span>
                    <div className="inline-flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-zinc-800 font-semibold bg-zinc-100 px-2.5 py-0.5 rounded-md border border-zinc-200/80">
                        {currentUser.active_device_id || getOrCreateDeviceId()}
                      </span>
                      {currentUser.active_device_id ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                          title="Perangkat ini telah terdaftar & terikat ke akun ujian Anda"
                        >
                          <Lock className="w-3 h-3 text-emerald-600" />
                          <span>Terdaftar</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full"
                          title="ID Perangkat aktif pada sesi ini"
                        >
                          <Laptop className="w-3 h-3 text-zinc-500" />
                          <span>Sesi Ini</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Card 2: Sesi Ujian yang Wajib Dikerjakan (Dengan Tombol Segarkan Soal) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-zinc-600" />
                <span>Sesi Ujian yang Wajib Dikerjakan</span>
              </h3>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRefreshExams}
                  disabled={isRefreshingExams}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-all cursor-pointer active:scale-95"
                  title="Perbarui daftar sesi soal ujian aktif & tersedia"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshingExams ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>Segarkan Soal</span>
                </button>
                <span className="text-xs text-zinc-400 font-mono-num">
                  {availableExams.length} Soal Tersedia
                </span>
              </div>
            </div>

            {availableExams.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-10 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-semibold text-zinc-800">
                  Tidak Ada Sesi Ujian Tersedia
                </h4>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Belum ada sesi ujian aktif yang dijadwalkan untuk tingkat kelas Anda saat ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableExams.map((exam) => {
                  const attempt = attempts.find(
                    (a) => a.student_id === currentUser.id && a.exam_session_id === exam.id
                  );
                  const isReset = attempt && attempt.status === 'RESET_BY_PROCTOR';
                  const isLockedAttempt = attempt && attempt.status === 'LOCKED';
                  const timingStatus = getExamTimingStatus(exam, attempt, currentTime);

                  return (
                    <div
                      key={exam.id}
                      className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        {/* Header Kartu: Badges (Kelompok Sesi, Tingkat, Status Waktu) & Durasi */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {exam.session_group && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                {exam.session_group}
                              </span>
                            )}
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                              {getGradeLabel(exam.grade_level)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${timingStatus.badgeClass}`}
                            >
                              {timingStatus.isOngoing && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              )}
                              {timingStatus.label}
                            </span>
                            {appModeConfig?.app_mode === 'simulation' && Number(exam.grade_level ?? 0) !== Number(currentUser?.tingkat ?? 0) && Number(exam.grade_level ?? 0) !== 0 && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                Mode Demo: Lintas Kelas
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 shrink-0 font-medium">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{exam.duration_minutes || 60} Menit</span>
                          </span>
                        </div>

                        {/* Judul & Detail Soal */}
                        <div className="space-y-1">
                          {exam.subject ? (
                            <>
                              <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight uppercase">
                                {exam.subject}
                              </h3>
                              <h4 className="text-xs sm:text-sm font-semibold text-zinc-600 leading-snug">
                                {exam.title}
                              </h4>
                            </>
                          ) : (
                            <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                              {exam.title}
                            </h3>
                          )}
                          {exam.description && (
                            <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                              {exam.description}
                            </p>
                          )}
                        </div>

                        {/* Tanggal & Waktu Mulai-Selesai */}
                        <div className="flex items-center gap-2 text-xs text-zinc-600 bg-zinc-50/80 border border-zinc-200/60 rounded-xl px-3 py-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="font-medium">
                            {formatExamSchedule(exam.start_time, exam.end_time)}
                          </span>
                        </div>

                        {/* Reset by proctor alert badge */}
                        {isReset && (
                          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-700 flex items-center gap-1.5 font-medium">
                            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                            <span>Pengawas telah mereset sesi ini. Silakan kerjakan kembali.</span>
                          </div>
                        )}

                        {/* Locked alert badge */}
                        {isLockedAttempt && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                            <div className="flex items-center gap-1.5 font-semibold text-rose-900">
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Ujian berstatus terkunci karena batas toleransi pelanggaran.</span>
                            </div>
                            <p className="text-[11px] text-rose-700 leading-relaxed">
                              Mintalah Proktor Utama untuk membuka kunci (Unlock) dari dashboard pengawas, atau periksa status di bawah ini:
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                disabled={checkingUnlockExamId === exam.id}
                                onClick={() => handleCheckCardUnlock(exam.id)}
                                className="px-3 py-1.5 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-75"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 text-rose-600 ${checkingUnlockExamId === exam.id ? 'animate-spin' : ''}`} />
                                <span>{checkingUnlockExamId === exam.id ? 'Memeriksa status ke server...' : 'Periksa Buka Kunci Pengawas'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Kartu Soal (Tanpa Token Mulai, Tombol Sesuai Status) */}
                      <div className="pt-3.5 border-t border-zinc-100 flex items-center justify-between gap-3">
                        <div className="text-xs">
                          {timingStatus.isCompleted ? (
                            <span className="text-blue-700 font-medium inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              <span>Ujian telah diselesaikan</span>
                            </span>
                          ) : timingStatus.isUpcoming ? (
                            <span className="text-zinc-500 font-medium inline-flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-zinc-400" />
                              <span>Menunggu jadwal dibuka</span>
                            </span>
                          ) : timingStatus.isExpired ? (
                            <span className="text-rose-600 font-medium">
                              Waktu pengerjaan telah lewat
                            </span>
                          ) : isLockedAttempt ? (
                            <span className="text-rose-600 font-medium inline-flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Sesi terkunci</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Siap dikerjakan</span>
                            </span>
                          )}
                        </div>

                        {timingStatus.canStart ? (
                          <button
                            type="button"
                            onClick={() => handleStartExam(exam)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
                          >
                            <span>{timingStatus.buttonText}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        ) : timingStatus.isCompleted ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 cursor-not-allowed opacity-90 shrink-0"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Selesai Dikerjakan</span>
                          </button>
                        ) : timingStatus.isUpcoming ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-zinc-500 border border-zinc-200 cursor-not-allowed shrink-0"
                          >
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Belum Dimulai</span>
                          </button>
                        ) : timingStatus.isExpired ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 cursor-not-allowed shrink-0"
                          >
                            <span>Waktu Berakhir</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow-xs cursor-not-allowed shrink-0"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Layar Terkunci</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

                                                              <footer className="border-t border-zinc-200/80 bg-white py-4 px-6 text-center text-xs text-zinc-400">
                                                                ExamGuard v1.2 &copy; {new Date().getFullYear()} &bull; Sistem Pengawasan Ujian Aman Google Form &bull; Oleh Fandi dari Jawa tech
                                                              </footer>

                                                              {/* MODAL: HIMBAUAN MENGISI IDENTITAS & TOKEN DENGAN BENAR */}
                                                              {showWarningModal && selectedExam && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
                                                                  <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 animate-in zoom-in-95">
                                                                    {/* Header Modal (Pinned) */}
                                                                    <div className="p-4 sm:p-5 pb-3 border-b border-zinc-100 flex items-center justify-between shrink-0">
                                                                      <div className="flex items-center gap-2.5 text-amber-600">
                                                                        <div className="w-9 h-9 rounded-xl bg-amber-100/90 flex items-center justify-center shrink-0">
                                                                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                                                                        </div>
                                                                        <div>
                                                                          <h3 className="font-bold text-zinc-900 text-sm sm:text-base leading-tight">
                                                                            Petunjuk & Tata Tertib Ujian
                                                                          </h3>
                                                                          <p className="text-[11px] text-zinc-500 mt-0.5">
                                                                            {selectedExam.title} &bull; Durasi {selectedExam.duration_minutes} Menit
                                                                          </p>
                                                                        </div>
                                                                      </div>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowWarningModal(false)}
                                                                        className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                                                                        title="Tutup"
                                                                      >
                                                                        <X className="w-4 h-4" />
                                                                      </button>
                                                                    </div>

                                                                    {/* Body Modal (Scrollable) */}
                                                                    <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs text-zinc-600 leading-relaxed">
                                                                      <p className="text-zinc-700">
                                                                        Anda akan memasuki sesi ujian{' '}
                                                                        <strong className="text-zinc-900 font-semibold">{selectedExam.title}</strong>{' '}
                                                                        dengan durasi{' '}
                                                                        <strong className="text-zinc-900 font-semibold">{selectedExam.duration_minutes} Menit</strong>. Mohon cermati seluruh petunjuk di bawah sebelum memulai.
                                                                      </p>

                                                                      {/* Box Standar Token 6 Digit */}
                                                                      {Boolean(selectedExam.exam_token) && (
                                                                        <div className="p-3 bg-zinc-900 text-white rounded-xl flex items-center justify-between shadow-xs">
                                                                          <div>
                                                                            <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                                                              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                                                                              <span>Token Ujian (6 Digit)</span>
                                                                            </div>
                                                                            <div className="font-mono font-bold text-lg tracking-widest text-emerald-400 mt-0.5">
                                                                              {selectedExam.exam_token}
                                                                            </div>
                                                                          </div>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => copyToken(selectedExam.exam_token)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                                                                          >
                                                                            {copiedToken ? (
                                                                              <>
                                                                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                                                <span className="text-emerald-400 font-medium">Tersalin</span>
                                                                              </>
                                                                            ) : (
                                                                              <>
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                                <span>Salin Token</span>
                                                                              </>
                                                                            )}
                                                                          </button>
                                                                        </div>
                                                                      )}

                                                                      {/* Card 1: Pengisian Formulir Soal Google Form */}
                                                                      <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                                                                        <div className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                                                          <ClipboardCheck className="w-4 h-4 text-zinc-700 shrink-0" />
                                                                          <span>1. Petunjuk Pengisian Formulir Soal:</span>
                                                                        </div>
                                                                        <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-zinc-600">
                                                                          <li>
                                                                            <strong>Identitas Peserta:</strong> Isi kolom identitas pada formulir (seperti <strong>Nama Lengkap, Nomor Ujian, Kelas / Rombel, NISN</strong>, atau identitas lain yang diminta oleh pihak sekolah) persis sesuai kartu / data peserta Anda.
                                                                            <div className="mt-1 p-2 bg-white rounded-lg border border-zinc-200/80 text-[11px] text-zinc-700 flex flex-wrap gap-x-3 gap-y-1 font-normal">
                                                                              <span>Nama: <strong className="text-zinc-900">{currentUser.nama}</strong></span>
                                                                              <span>No. Ujian: <strong className="text-zinc-900 font-mono">{currentUser.no_ujian || '-'}</strong></span>
                                                                              <span>Kelas: <strong className="text-zinc-900">{currentUser.kelas || '-'}</strong></span>
                                                                              <span>NISN: <strong className="text-zinc-900 font-mono">{currentUser.nisn || '-'}</strong></span>
                                                                            </div>
                                                                          </li>
                                                                          {Boolean(selectedExam.exam_token) && (
                                                                            <li>
                                                                              <strong>Token Soal:</strong> Masukkan Token Ujian 6 digit di atas ({selectedExam.exam_token}) ke dalam kolom token yang diminta pada formulir.
                                                                            </li>
                                                                          )}
                                                                          <li>
                                                                            <strong>Kirim Jawaban:</strong> Pastikan Anda telah menekan tombol <strong>"Kirim" / "Submit"</strong> pada formulir Google Form sebelum menekan tombol "Selesaikan Ujian" di bagian bilah atas.
                                                                          </li>
                                                                        </ul>
                                                                      </div>

                                                                      {/* Card 2: Aturan Pelanggaran Sistem & Penanganannya */}
                                                                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl space-y-2">
                                                                        <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                                                                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                                                          <span>2. Aturan Pelanggaran Sistem & Penanganan:</span>
                                                                        </div>
                                                                        <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-amber-900/90 leading-relaxed">
                                                                          <li>
                                                                            <strong>Larangan Selama Ujian:</strong> Dilarang keluar dari mode Layar Penuh (Fullscreen), beralih ke aplikasi/tab lain, membuka jendela mengambang (floating/split screen), atau meminimalkan browser ujian.
                                                                          </li>
                                                                          <li>
                                                                            <strong>Larangan Tangkapan Layar (Screenshot):</strong> Dilarang keras mengambil tangkapan layar (Screenshot / PrintScreen), merekam layar, atau mencetak halaman soal. Sistem dilengkapi pemblokir tombol <em>screenshot</em>, pembersih papan klip (<em>clipboard cleaner</em>) otomatis, serta cap air (<em>watermark</em>) identitas peserta dinamis anti-bocor. Setiap percobaan akan langsung memicu alarm peringatan.
                                                                          </li>
                                                                          <li>
                                                                            <strong>Alarm Suara Pelanggaran:</strong> Jika Anda keluar dari layar penuh atau berpindah tab/aplikasi, <strong>alarm peringatan akan berbunyi terus-menerus</strong> dan sistem langsung mencatat <strong>1 pelanggaran</strong>.
                                                                          </li>
                                                                          <li>
                                                                            <strong>Penanganan Toleransi 1 & 2:</strong> Alarm hanya akan berhenti berbunyi saat Anda menekan tombol <em>"Saya Paham & Kembali ke Layar Penuh"</em> untuk kembali mengerjakan soal.
                                                                          </li>
                                                                          <li>
                                                                            <strong>Penguncian Layar (3x Pelanggaran / Keluar Sistem):</strong> Jika mencapai batas maksimal <strong>3 kali pelanggaran</strong> atau mencoba keluar dari sistem, layar ujian akan <strong>TERKUNCI TOTAL (LOCKED)</strong>, <strong>alarm penguncian berbunyi selama 3 detik</strong>, dan ujian hanya dapat diaktifkan kembali oleh <strong>Proktor / Pengawas Ruangan</strong>.
                                                                          </li>
                                                                        </ul>
                                                                      </div>

                                                                      {/* Checkbox Persetujuan */}
                                                                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                                                        <input
                                                                          type="checkbox"
                                                                          checked={agreedToRules}
                                                                          onChange={(e) => setAgreedToRules(e.target.checked)}
                                                                          className="w-4 h-4 rounded text-zinc-900 mt-0.5 focus:ring-zinc-900"
                                                                        />
                                                                        <span className="text-xs font-medium text-zinc-800">
                                                                          Saya menyatakan telah memahami petunjuk di atas, siap mematuhi aturan pengawasan sistem, dan mengerjakan ujian dengan jujur.
                                                                        </span>
                                                                      </label>
                                                                    </div>

                                                                    {/* Footer Modal (Pinned) */}
                                                                    <div className="flex gap-2.5 p-4 sm:p-5 pt-3 border-t border-zinc-100 shrink-0">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowWarningModal(false)}
                                                                        className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer transition-colors"
                                                                      >
                                                                        Batal
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        disabled={!agreedToRules}
                                                                        onClick={handleConfirmStartExam}
                                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${agreedToRules
                                                                            ? 'bg-zinc-900 hover:bg-zinc-800 text-white cursor-pointer active:scale-[0.99]'
                                                                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                                                          }`}
                                                                      >
                                                                        Buka Soal & Fullscreen
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* MODAL: STATUS PEMERIKSAAN KELAYAKAN SISTEM (TERSEMBUNYI DALAM IKON) */}
                                                              {showPreflightModal && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                                                                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                                                                      <div className="flex items-center gap-2.5">
                                                                        <div className={`p-2 rounded-xl ${allPreflightPassed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                          <ShieldCheck className="w-5 h-5" />
                                                                        </div>
                                                                        <div>
                                                                          <h3 className="font-bold text-zinc-900 text-sm">
                                                                            Status Kelayakan Sistem & Izin Browser
                                                                          </h3>
                                                                          <p className="text-[11px] text-zinc-400">
                                                                            8 Izin & Sensor Perangkat Sesuai Konfigurasi Pengawas Sekolah
                                                                          </p>
                                                                        </div>
                                                                      </div>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowPreflightModal(false)}
                                                                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                                                                      >
                                                                        <X className="w-5 h-5" />
                                                                      </button>
                                                                    </div>

                                                                    {/* Status Summary Banner */}
                                                                    <div className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-between ${
                                                                      allPreflightPassed
                                                                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                                                        : 'bg-amber-50 border border-amber-200 text-amber-800'
                                                                    }`}>
                                                                      <div className="flex items-center gap-2">
                                                                        <span className={`w-2.5 h-2.5 rounded-full ${allPreflightPassed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                                                        <span className="font-medium">
                                                                          {allPreflightPassed
                                                                            ? 'Seluruh izin wajib menurut setelan sekolah terpenuhi'
                                                                            : 'Terdapat izin wajib sekolah yang belum terpenuhi'}
                                                                        </span>
                                                                      </div>
                                                                      <button
                                                                        type="button"
                                                                        onClick={handleRecheckPermissions}
                                                                        className="px-2.5 py-1 bg-white rounded-lg border text-[11px] font-semibold text-zinc-700 hover:bg-zinc-50 shadow-2xs inline-flex items-center gap-1 cursor-pointer shrink-0"
                                                                      >
                                                                        <RefreshCw className="w-3 h-3 text-zinc-600" />
                                                                        <span>Cek Ulang</span>
                                                                      </button>
                                                                    </div>

                                                                    {/* Daftar Lengkap 8 Izin Sesuai Pengaturan Pengawas */}
                                                                    <div className="space-y-2.5 text-xs">
                                                                      {/* 1. Lokasi GPS */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            isGpsDisabled
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.gps.passed || effectiveGpsOverride
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <MapPin className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">1. Izinkan Lokasi (GPS & Radius)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                isGpsDisabled ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {isGpsDisabled ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.gps.message}</div>
                                                                            {isGpsRequired && (
                                                                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                                                                Batas Maksimal: {institution?.max_radius_meters || 200}m dari titik sekolah
                                                                              </div>
                                                                            )}
                                                                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                                                                              <button
                                                                                type="button"
                                                                                onClick={() => setShowLocationDetailModal(true)}
                                                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold cursor-pointer shadow-2xs active:scale-95"
                                                                                title="Buka peta interaktif posisi Anda & sekolah"
                                                                              >
                                                                                <MapPin className="w-3 h-3 text-blue-600" />
                                                                                <span>Periksa Lokasi</span>
                                                                              </button>
                                                                              {isGpsRequired && !preflightStatus.gps.passed && !effectiveGpsOverride && (
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={handleRequestGps}
                                                                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer shadow-2xs active:scale-95"
                                                                                >
                                                                                  <MapPin className="w-3 h-3" />
                                                                                  <span>Periksa GPS</span>
                                                                                </button>
                                                                              )}
                                                                            </div>
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {isGpsDisabled || preflightStatus.gps.passed || effectiveGpsOverride ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : preflightStatus.gps.checking ? (
                                                                            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 2. Notifications */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.notifications === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.notifications.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <Bell className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">2. Izinkan Notifications (Peringatan)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.notifications === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.notifications === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.notifications.message}</div>
                                                                            {browserPerms.notifications !== false && !preflightStatus.notifications.passed && (
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleRequestNotificationPermission}
                                                                                className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                                                                              >
                                                                                <Bell className="w-3 h-3" />
                                                                                <span>Izinkan Notifikasi</span>
                                                                              </button>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.notifications === false || preflightStatus.notifications.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 3. Sound Audio */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.sound_audio === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.sound.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <Volume2 className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">3. Izinkan Sound (Alarm Audio)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.sound_audio === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.sound_audio === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.sound.message}</div>
                                                                            {browserPerms.sound_audio !== false && !preflightStatus.sound.passed && (
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleTestAudio}
                                                                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                                              >
                                                                                <Volume2 className="w-3 h-3" />
                                                                                <span>Uji Bunyi Alarm</span>
                                                                              </button>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.sound_audio === false || preflightStatus.sound.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 4. Google SSO */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            !isGoogleSsoRequired
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.google_sso.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-amber-100 text-amber-700'
                                                                          }`}>
                                                                            <GoogleBrandIcon className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">4. Login Akun Google (SSO Workspace)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                !isGoogleSsoRequired ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {!isGoogleSsoRequired ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.google_sso.message}</div>
                                                                            {isGoogleSsoRequired && (
                                                                              !preflightStatus.google_sso.passed ? (
                                                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={handleOpenGoogleLoginModal}
                                                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                                                                  >
                                                                                    <GoogleBrandIcon className="w-3.5 h-3.5" />
                                                                                    <span>Login Akun Google Sesi Ini</span>
                                                                                  </button>
                                                                                  <span className="text-[10px] text-zinc-500">Wajib login untuk konfirmasi izin</span>
                                                                                </div>
                                                                              ) : (
                                                                                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                                                    <span>{currentUser?.google_email || currentUser?.email || 'Akun Google Terhubung'}</span>
                                                                                  </span>
                                                                                  <button
                                                                                    type="button"
                                                                                    onClick={handleOpenGoogleLoginModal}
                                                                                    className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium"
                                                                                  >
                                                                                    Ganti Akun
                                                                                  </button>
                                                                                </div>
                                                                              )
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {!isGoogleSsoRequired || preflightStatus.google_sso.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <AlertCircle className="w-4 h-4 text-amber-600" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 5. Block Clipboard */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.block_clipboard === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.clipboard.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <ClipboardCheck className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">5. Block Clipboard (Papan Klip)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.block_clipboard === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.block_clipboard === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.clipboard.message}</div>
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.block_clipboard === false || preflightStatus.clipboard.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 6. Kamera & Mikrofon */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.camera_webcam === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.media.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <Camera className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">6. Sensor Kamera & Mikrofon</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.camera_webcam === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.camera_webcam === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.media.message}</div>
                                                                            {browserPerms.camera_webcam !== false && !preflightStatus.media.passed && (
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleRequestCameraMic}
                                                                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                                              >
                                                                                <Camera className="w-3 h-3" />
                                                                                <span>Izinkan Kamera & Mic</span>
                                                                              </button>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.camera_webcam === false || preflightStatus.media.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 7. Cookies & Iframe */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.cookies_iframe === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.cookies.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <Cookie className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">7. Akses Cookies & Iframe GForm</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.cookies_iframe === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.cookies_iframe === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.cookies.message}</div>
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.cookies_iframe === false || preflightStatus.cookies.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>

                                                                      {/* 8. Fullscreen (Di Akhir Ceklis) */}
                                                                      <div className="p-3 rounded-xl border border-zinc-200/90 bg-zinc-50/70 flex items-start justify-between gap-3">
                                                                        <div className="flex items-start gap-2.5 min-w-0">
                                                                          <div className={`p-1.5 rounded-lg shrink-0 ${
                                                                            browserPerms.fullscreen === false
                                                                              ? 'bg-zinc-200 text-zinc-600'
                                                                              : preflightStatus.fullscreen.passed
                                                                              ? 'bg-emerald-100 text-emerald-700'
                                                                              : 'bg-rose-100 text-rose-700'
                                                                          }`}>
                                                                            <Maximize2 className="w-4 h-4" />
                                                                          </div>
                                                                          <div className="min-w-0">
                                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">8. Izinkan Fullscreen (Layar Penuh)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.fullscreen === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.fullscreen === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.fullscreen.message}</div>
                                                                            {browserPerms.fullscreen !== false && !preflightStatus.fullscreen.passed && (
                                                                              <button
                                                                                type="button"
                                                                                onClick={handleEnterFullscreen}
                                                                                className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                                              >
                                                                                <Maximize2 className="w-3 h-3 text-zinc-100" />
                                                                                <span>Masuk Layar Penuh</span>
                                                                              </button>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.fullscreen === false || preflightStatus.fullscreen.passed ? (
                                                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                          ) : (
                                                                            <XCircle className="w-4 h-4 text-rose-500" />
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    </div>

                                                                    {/* Modal Action Buttons */}
                                                                    <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2.5">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          setShowPreflightModal(false);
                                                                          setCurrentStage('preflight');
                                                                        }}
                                                                        className="px-3.5 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold rounded-xl cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                                                                      >
                                                                        <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                                                                        <span>Buka Layar Penuh</span>
                                                                      </button>

                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowPreflightModal(false)}
                                                                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                                                                      >
                                                                        Tutup
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* Modal Autentikasi Google SSO Sesi Ini */}
                                                              {renderChangePasswordModal()}

                                                              {renderGoogleLoginModal()}

                                                              {/* Modal Popup Lebar Peta Pemeriksaan Lokasi & Garis Jarak */}
                                                              {renderLocationDetailModal()}

                                                              {/* Modal Popup Animasi Pemeriksaan Izin Sistem Berulang */}
                                                              {renderVerificationPopup()}

                                                              {/* Toast Notifikasi Peserta */}
                                                              {toast.show && (
                                                                <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-700 text-xs animate-in fade-in slide-in-from-bottom-2">
                                                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                                  <span>{toast.message}</span>
                                                                </div>
                                                              )}

                                                              {/* Modal Dialog Konfirmasi & Alert Modern */}
                                                              <ConfirmDialog
                                                                isOpen={confirmDialog.isOpen}
                                                                onClose={closeConfirm}
                                                                onConfirm={confirmDialog.onConfirm}
                                                                title={confirmDialog.title}
                                                                message={confirmDialog.message}
                                                                confirmText={confirmDialog.confirmText}
                                                                cancelText={confirmDialog.cancelText}
                                                                variant={confirmDialog.variant}
                                                                icon={confirmDialog.icon}
                                                              />
                                                            </div>
                                                            );
  }

                                                            // ==========================================
                                                            // VIEW 3: LAMAN UJIAN GFORM (PROCTORING SCREEN)
                                                            // ==========================================
                                                            return (
                                                            <div
                                                              className="fixed inset-0 z-50 bg-zinc-900 flex flex-col select-none overflow-hidden"
                                                              onClick={() => {
                                                                if (!document.fullscreenElement && hasNativeFullscreen && !isIOS) {
                                                                  const el = document.documentElement;
                                                                  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
                                                                  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(() => {});
                                                                }
                                                              }}
                                                              onContextMenu={(e) => e.preventDefault()}
                                                              onCopy={(e) => e.preventDefault()}
                                                              onCut={(e) => e.preventDefault()}
                                                              onPaste={(e) => e.preventDefault()}
                                                            >
                                                              {/* Banner Pita Berjalan Pengumuman Pusat di Lembar Pengerjaan Soal Ujian */}
                                                              <BroadcastRibbon />

                                                              {/* 1. NAVBAR TINGKAT 1 (ATAS): Logo, Wifi Ping, Baterai, Timer, Tombol Selesai */}
                                                              <header className="bg-zinc-900 border-b border-zinc-800 px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2 shrink-0 shadow-md z-30 w-full relative">
                                                                {/* Sisi Kiri: Logo Instansi, Ping, Baterai */}
                                                                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                                                  {institution?.logo_url ? (
                                                                    <img
                                                                      src={institution.logo_url}
                                                                      alt="Logo Sekolah"
                                                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-md object-contain bg-white p-0.5 border border-zinc-700 shrink-0"
                                                                    />
                                                                  ) : (
                                                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-zinc-800 text-white flex items-center justify-center border border-zinc-700 shrink-0">
                                                                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                                                    </div>
                                                                  )}

                                                                  {/* Indikator Ping */}
                                                                  <div
                                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-200 text-[11px] font-mono border border-zinc-700/80 shrink-0"
                                                                    title={`Latensi Ping Server: ${pingMs !== null ? pingMs + ' ms' : 'Mengukur...'}`}
                                                                  >
                                                                    <Wifi className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                                                                      pingStatus === 'good'
                                                                        ? 'text-emerald-400'
                                                                        : pingStatus === 'fair'
                                                                        ? 'text-amber-400'
                                                                        : 'text-rose-400'
                                                                    }`} />
                                                                    <span className="font-bold">{pingMs !== null ? `${pingMs}ms` : '...'}</span>
                                                                  </div>

                                                                  {/* Indikator Daya Baterai */}
                                                                  <div
                                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/90 text-zinc-200 text-[11px] font-mono border border-zinc-700/80 shrink-0"
                                                                    title={`Daya Baterai: ${batteryLevel !== null ? batteryLevel + '%' : '100% (Fallback iOS)'}`}
                                                                  >
                                                                    {isCharging ? (
                                                                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 animate-pulse" />
                                                                    ) : batteryLevel <= 20 ? (
                                                                      <BatteryWarning className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400 animate-pulse" />
                                                                    ) : (
                                                                      <BatteryMedium className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${batteryLevel >= 50 ? 'text-emerald-400' : 'text-amber-400'}`} />
                                                                    )}
                                                                    <span className="font-bold">{batteryLevel !== null ? `${batteryLevel}%` : '100%'}</span>
                                                                  </div>
                                                                </div>

                                                                {/* Sisi Kanan: Timer dan Tombol Selesai */}
                                                                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                                                                  {/* Sticky Countdown Timer */}
                                                                  <div
                                                                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border text-xs sm:text-sm font-mono-num font-bold tracking-tight shadow-2xs shrink-0 ${
                                                                      isTimeExpired || remainingSeconds < 300
                                                                        ? 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse ring-1 ring-rose-500/50'
                                                                        : 'bg-zinc-800 text-zinc-100 border-zinc-700'
                                                                    }`}
                                                                    title={isTimeExpired ? 'Waktu ujian telah habis (00:00)' : 'Sisa waktu pengerjaan'}
                                                                  >
                                                                    <Clock className={`w-3.5 h-3.5 shrink-0 ${isTimeExpired || remainingSeconds < 300 ? 'text-rose-400' : 'text-zinc-400'}`} />
                                                                    <span className="tabular-nums font-mono">{isTimeExpired ? '00:00' : formatDuration(remainingSeconds)}</span>
                                                                  </div>

                                                                  {/* Icon Keluar Warna Merah (Selesaikan Ujian) */}
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => setShowFinishConfirmModal(true)}
                                                                    title="Selesaikan Ujian & Keluar (Pastikan Google Form sudah dikirim)"
                                                                    className="inline-flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
                                                                  >
                                                                    <LogOut className="w-4 h-4 shrink-0" />
                                                                    <span className="hidden sm:inline">Selesai</span>
                                                                  </button>
                                                                </div>
                                                              </header>

                                                              {/* 2. NAVBAR TINGKAT 2 (SUB-NAVBAR): Tombol TOKEN di Samping Kiri Nama, Rombel, Ruang */}
                                                              <div className="bg-zinc-100 border-b border-zinc-200/90 px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between gap-2 shrink-0 z-35 w-full shadow-2xs relative">
                                                                {/* Sisi Kiri: Tombol TOKEN + Separator + Identitas Siswa */}
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                  {/* Tombol Ringkas TOKEN [icon mata] dengan Balon Panduan Mengarah ke Bawah dari tombol */}
                                                                  <div className="relative shrink-0">
                                                                    {(() => {
                                                                      const leadMinutes = Number(institution?.finish_token_lead_minutes || 10);
                                                                      const isFinishTokenActive = Boolean(activeExam?.finish_token) && remainingSeconds <= leadMinutes * 60;

                                                                      return (
                                                                        <>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                              setShowTokenPopup((prev) => !prev);
                                                                              setHasOpenedStartTokenHint(true);
                                                                              if (isFinishTokenActive) {
                                                                                setHasOpenedFinishTokenHint(true);
                                                                              }
                                                                            }}
                                                                            title="Buka Kode Token Ujian"
                                                                            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer shrink-0 border ${
                                                                              isFinishTokenActive
                                                                                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                                                                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                                                            }`}
                                                                          >
                                                                            <Eye className="w-3.5 h-3.5 shrink-0" />
                                                                            <span>TOKEN</span>
                                                                            {isFinishTokenActive && (
                                                                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                                                                            )}
                                                                          </button>

                                                                          {/* Balon Panduan 1 (Hijau): Muncul di bawah tombol TOKEN */}
                                                                          {!hasOpenedStartTokenHint && !isFinishTokenActive && !showTokenPopup && (
                                                                            <div
                                                                              onClick={() => { setShowTokenPopup(true); setHasOpenedStartTokenHint(true); }}
                                                                              className="absolute top-full left-0 mt-2 z-50 w-60 sm:w-68 bg-emerald-600 hover:bg-emerald-700 text-white p-2 sm:p-2.5 rounded-xl shadow-2xl text-xs animate-bounce cursor-pointer border border-emerald-400 select-none flex items-center justify-between gap-1.5"
                                                                            >
                                                                              {/* Panah balon menunjuk ke ATAS mengarah ke tombol TOKEN */}
                                                                              <div className="absolute -top-1.5 left-5 w-3 h-3 bg-emerald-600 rotate-45 border-t border-l border-emerald-400" />
                                                                              <div className="flex items-center gap-2 min-w-0">
                                                                                <KeyRound className="w-4 h-4 text-emerald-200 shrink-0" />
                                                                                <span className="font-semibold text-[11px] leading-snug">
                                                                                  Buka TOKEN ini untuk melihat token mulai
                                                                                </span>
                                                                              </div>
                                                                              <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  setHasOpenedStartTokenHint(true);
                                                                                }}
                                                                                className="p-1 rounded-md hover:bg-emerald-800 text-emerald-100 shrink-0 transition-colors"
                                                                                title="Tutup Petunjuk"
                                                                              >
                                                                                <X className="w-3.5 h-3.5" />
                                                                              </button>
                                                                            </div>
                                                                          )}

                                                                          {/* Balon Panduan 2 (Merah): Muncul saat token selesai terbit */}
                                                                          {isFinishTokenActive && !hasOpenedFinishTokenHint && !showTokenPopup && (
                                                                            <div
                                                                              onClick={() => { setShowTokenPopup(true); setHasOpenedFinishTokenHint(true); }}
                                                                              className="absolute top-full left-0 mt-2 z-50 w-64 sm:w-72 bg-rose-600 hover:bg-rose-700 text-white p-2 sm:p-2.5 rounded-xl shadow-2xl text-xs animate-bounce cursor-pointer border border-rose-400 select-none flex items-center justify-between gap-1.5"
                                                                            >
                                                                              {/* Panah balon menunjuk ke ATAS mengarah ke tombol TOKEN */}
                                                                              <div className="absolute -top-1.5 left-5 w-3 h-3 bg-rose-600 rotate-45 border-t border-l border-rose-400" />
                                                                              <div className="flex items-center gap-2 min-w-0">
                                                                                <KeyRound className="w-4 h-4 text-rose-200 shrink-0" />
                                                                                <span className="font-bold text-[11px] leading-snug">
                                                                                  Token selesai telah terbit! Buka di sini
                                                                                </span>
                                                                              </div>
                                                                              <button
                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                  e.stopPropagation();
                                                                                  setHasOpenedFinishTokenHint(true);
                                                                                }}
                                                                                className="p-1 rounded-md hover:bg-rose-800 text-rose-100 shrink-0 transition-colors"
                                                                                title="Tutup Petunjuk"
                                                                              >
                                                                                <X className="w-3.5 h-3.5" />
                                                                              </button>
                                                                            </div>
                                                                          )}
                                                                        </>
                                                                      );
                                                                    })()}
                                                                  </div>

                                                                  <span className="text-zinc-300">|</span>

                                                                  {/* Identitas Siswa: Nama, Rombel, Ruang */}
                                                                  <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                                                    <span className="font-bold text-xs sm:text-sm text-zinc-900 truncate" title={currentUser.nama}>
                                                                      {currentUser.nama}
                                                                    </span>
                                                                    <span className="text-zinc-400">&bull;</span>
                                                                    <span className="text-[11px] sm:text-xs text-zinc-600 font-medium truncate">
                                                                      {currentUser.kelas || getGradeLabel(currentUser.tingkat)} &bull; {currentUser.ruang || 'Ruang 01'}
                                                                    </span>
                                                                  </div>
                                                                </div>

                                                                {/* Sisi Kanan: Badge Sesi Ujian Aktif */}
                                                                <div className="hidden xs:flex items-center gap-1.5 shrink-0">
                                                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                    Sesi Aktif
                                                                  </span>
                                                                </div>
                                                              </div>

                                                              

                                                              {/* BANNER MERAH MELEKAT JIKA WAKTU HABIS */}
                                                              {(isTimeExpired || remainingSeconds <= 0) && (
                                                                <div className="bg-rose-600 text-white px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shadow-md z-20 animate-in slide-in-from-top duration-300 shrink-0">
                                                                  <div className="flex items-center gap-2 min-w-0 text-xs sm:text-sm font-bold">
                                                                    <AlertTriangle className="w-4 h-4 text-white shrink-0 animate-bounce" />
                                                                    <span className="truncate">
                                                                      WAKTU TELAH HABIS! Pastikan Anda menekan tombol "Kirim" / "Submit" pada Google Formulir di bawah ini sebelum keluar.
                                                                    </span>
                                                                  </div>
                                                                  <button
                                                                    type="button"
                                                                    onClick={() => setShowFinishConfirmModal(true)}
                                                                    className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                                                                  >
                                                                    Selesaikan Ujian & Keluar
                                                                  </button>
                                                                </div>
                                                              )}

                                                              {/* 2. IFRAME GOOGLE FORM */}
                                                              <div className="flex-1 bg-zinc-100 relative w-full h-full overflow-hidden">
                                                                {/* ANIMASI LOADING SOAL MODERN */}
                                                                {isGformLoading && (
                                                                  <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                                                                    <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                                                                      {/* Outer spinning ring */}
                                                                      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                                                                      {/* Inner pulsating glow */}
                                                                      <div className="absolute inset-2 rounded-full bg-emerald-50 animate-ping opacity-60" />
                                                                      {/* Center Shield Icon */}
                                                                      <div className="relative z-10 w-11 h-11 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg border border-zinc-800">
                                                                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                                                      </div>
                                                                    </div>

                                                                    <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight">
                                                                      Menyiapkan Lembar Soal Ujian...
                                                                    </h3>
                                                                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">
                                                                      {activeExam?.subject || activeExam?.title}
                                                                    </p>

                                                                    <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs font-medium text-zinc-600 shadow-2xs">
                                                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                                                                      <span>Sinkronisasi Google Form & Verifikasi Lingkungan Ujian...</span>
                                                                    </div>

                                                                    {/* Indeterminate loading bar */}
                                                                    <div className="w-52 sm:w-64 h-1.5 bg-zinc-200/80 rounded-full overflow-hidden mt-4">
                                                                      <div className="h-full bg-emerald-600 rounded-full animate-pulse w-full" />
                                                                    </div>

                                                                    <p className="text-[11px] text-zinc-400 mt-2 font-medium">
                                                                      Mohon tunggu sebentar hingga soal siap dikerjakan
                                                                    </p>
                                                                  </div>
                                                                )}

                                                                {/* Watermark Dinamis Anti-Bocor (Melintang Transparan di Atas Lembar Soal) */}
                                                                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none flex flex-col justify-around opacity-[0.06] sm:opacity-[0.08]">
                                                                  {[...Array(6)].map((_, rIdx) => (
                                                                    <div
                                                                      key={rIdx}
                                                                      className="flex whitespace-nowrap justify-around -rotate-12 transform py-4 text-[11px] sm:text-xs font-mono font-bold text-zinc-950 uppercase tracking-widest"
                                                                    >
                                                                      {[...Array(4)].map((_, cIdx) => (
                                                                        <span key={cIdx} className="px-6">
                                                                          {currentUser?.nama || 'PESERTA'} &bull; {currentUser?.no_ujian || currentUser?.nisn || 'EXAMGUARD'} &bull; {currentUser?.kelas || ''}
                                                                        </span>
                                                                      ))}
                                                                    </div>
                                                                  ))}
                                                                </div>

                                                                {activeExam?.gform_base_url ? (
                                                                  <iframe
                                                                    key={gformKey}
                                                                    src={convertGoogleFormUrl(activeExam.gform_base_url)}
                                                                    title={activeExam.title}
                                                                    className="w-full h-full border-none"
                                                                    allow="geolocation 'none'; microphone 'none'; camera 'none'"
                                                                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                                                                    onLoad={() => {
                                                                      setTimeout(() => {
                                                                        setIsGformLoading(false);
                                                                      }, 1000);
                                                                    }}
                                                                  />
                                                                ) : (
                                                                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                                                                    URL Google Form tidak tersedia.
                                                                  </div>
                                                                )}


                                                              </div>

                                                              {/* TOMBOL ICON BULAT SEGARKAN SOAL MENGAMBANG DI KANAN BAWAH (FLOATING ACTION BUTTON) */}
                                                              <div className="fixed bottom-6 right-5 z-40 flex items-center group">
                                                                <div className="mr-2.5 hidden sm:group-hover:flex items-center pointer-events-none animate-in fade-in duration-150">
                                                                  <div className="bg-zinc-950/95 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap border border-zinc-700 backdrop-blur-xs">
                                                                    Segarkan Soal (GForm)
                                                                  </div>
                                                                </div>
                                                                <button
                                                                  type="button"
                                                                  onClick={() => setShowRefreshConfirmModal(true)}
                                                                  disabled={isGformLoading}
                                                                  title="Segarkan Lembar Soal Ujian (GForm)"
                                                                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-90 text-white shadow-xl shadow-blue-600/40 border-2 border-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                                                                >
                                                                  <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 text-white ${isGformLoading ? 'animate-spin' : ''}`} />
                                                                </button>
                                                              </div>

                                                              {/* MODAL KONFIRMASI SEGARKAN LEMBAR SOAL */}
                                                              {showRefreshConfirmModal && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                                                                  <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-zinc-200 animate-in zoom-in-95 space-y-3">
                                                                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                                                                      <RefreshCw className="w-5 h-5" />
                                                                    </div>
                                                                    <h3 className="text-sm font-bold text-zinc-900">Segarkan Lembar Soal?</h3>
                                                                    <p className="text-xs text-zinc-600 leading-relaxed">
                                                                      Gunakan opsi ini jika lembar Google Form mengalami kendala tampilan atau jaringan lambat. Lembar soal akan dimuat ulang.
                                                                    </p>
                                                                    <div className="flex gap-2 pt-2 border-t border-zinc-100">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowRefreshConfirmModal(false)}
                                                                        className="flex-1 py-2 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                                                      >
                                                                        Batal
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          setShowRefreshConfirmModal(false);
                                                                          handleRefreshGform();
                                                                        }}
                                                                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                                                                      >
                                                                        Ya, Segarkan
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* 2b. DIALOG PERINGATAN PELANGGARAN RINGAN (TOLERANSI 1 & 2 DARI 3) */}
                                                              {showViolationWarningModal && !isLocked && (
                                                                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-amber-400 animate-in zoom-in-95">
                                                                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3.5">
                                                                      <AlertTriangle className="w-7 h-7" />
                                                                    </div>

                                                                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                                                                      PERINGATAN PELANGGARAN UJIAN
                                                                    </h3>
                                                                    <p className="text-xs font-semibold text-amber-600 mt-0.5 mb-3">
                                                                      Pelanggaran Ke-{violationWarningCount} dari {Number(institution?.max_violations || 3)} Kali Batas Toleransi
                                                                    </p>

                                                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 text-left space-y-1">
                                                                      <div className="font-bold">Penyebab Terdeteksi:</div>
                                                                      <p className="text-amber-800">{violationWarningReason || 'Fokus atau kursor meninggalkan layar ujian.'}</p>
                                                                      <p className="text-[11px] text-amber-700 italic pt-1 border-t border-amber-200/60 mt-1.5">
                                                                        Perhatian: Jika Anda melanggar sebanyak {Number(institution?.max_violations || 3)} kali, layar ujian Anda akan <strong>TERKUNCI TOTAL</strong> dan wajib dibuka oleh Pengawas!
                                                                      </p>
                                                                    </div>

                                                                    <button
                                                                      type="button"
                                                                      onClick={handleDismissWarningAndResume}
                                                                      className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                                                                    >
                                                                      <Maximize2 className="w-4 h-4" />
                                                                      <span>Saya Paham & Kembali ke Layar Penuh (Lanjutkan Ujian)</span>
                                                                    </button>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* 3. AUTO-LOCK OVERLAY SCREEN JIKA TERJADI PELANGGARAN MAKSIMAL */}
                                                              {isLocked && (
                                                                <div className="fixed inset-0 z-[99999] bg-rose-600/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl border border-rose-200 animate-in zoom-in-95">
                                                                    <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                                                                      <Lock className="w-7 h-7" />
                                                                    </div>

                                                                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-0.5">
                                                                      LAYAR UJIAN TERKUNCI
                                                                    </h3>
                                                                    <p className="text-xs text-rose-600 font-semibold mb-3">
                                                                      Batas Toleransi Pelanggaran Terlampaui
                                                                    </p>

                                                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-zinc-700 mb-3.5 text-left space-y-1">
                                                                      <div className="font-semibold text-rose-900">Penyebab Penguncian:</div>
                                                                      <p className="text-zinc-600">{lockReason || 'Terdeteksi meninggalkan jendela ujian.'}</p>
                                                                      <div className="text-[11px] text-zinc-500 pt-0.5">
                                                                        Total Pelanggaran:{' '}
                                                                        <strong className="text-rose-700 font-mono">
                                                                          {activeAttempt?.violation_count || 3} kali (Terkunci Otomatis)
                                                                        </strong>
                                                                      </div>
                                                                    </div>

                                                                    <p className="text-xs text-zinc-600 mb-4 leading-relaxed">
                                                                      Sesi ujian Anda telah dikunci oleh sistem pengawasan. Silakan hubungi <strong>Proktor / Pengawas Utama</strong>. Layar hanya dapat dibuka secara resmi melalui Dashboard Pengawas.
                                                                    </p>

                                                                    <div className="space-y-2 mb-4">
                                                                      {/* Tombol Utama: Cek Status Buka Kunci dari Dashboard Pengawas */}
                                                                      <button
                                                                        type="button"
                                                                        onClick={handleManualCheckUnlock}
                                                                        disabled={isCheckingUnlock}
                                                                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-75"
                                                                      >
                                                                        <RefreshCw className={`w-3.5 h-3.5 text-white ${isCheckingUnlock ? 'animate-spin' : ''}`} />
                                                                        <span>{isCheckingUnlock ? 'Menghubungi Server & Pengawas...' : 'Periksa Buka Kunci dari Pengawas'}</span>
                                                                      </button>

                                                                      {/* Tombol Tindak Lanjut: Khusus Mode Simulasi / Demo */}
                                                                      {isSimMode && (
                                                                        <button
                                                                          type="button"
                                                                          onClick={handleSimulationQuickUnlock}
                                                                          className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                                                                        >
                                                                          <FlaskConical className="w-4 h-4" />
                                                                          <span>⚡ Buka Kunci Cepat (Mode Simulasi)</span>
                                                                        </button>
                                                                      )}

                                                                      {/* Tombol Keluar ke Beranda Peserta */}
                                                                      <button
                                                                        type="button"
                                                                        onClick={handleReturnToHomeFromLock}
                                                                        className="w-full py-2 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
                                                                      >
                                                                        <Home className="w-3.5 h-3.5 text-zinc-400" />
                                                                        <span>Kembali ke Beranda Peserta</span>
                                                                      </button>
                                                                    </div>

                                                                    <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                                                                      <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                                                                      <span>Menunggu izin buka kunci dari Proktor secara otomatis...</span>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* 3b. MODAL POPUP DETAIL TOKEN UJIAN (TOKEN MULAI & TOKEN SELESAI DENGAN COUNTDOWN) */}
                                                              {showTokenPopup && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 space-y-4">
                                                                    {/* Header Modal */}
                                                                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                                                                      <div className="flex items-center gap-2.5">
                                                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                                                                          <KeyRound className="w-5 h-5" />
                                                                        </div>
                                                                        <div>
                                                                          <h3 className="font-bold text-base text-zinc-900">Token Ujian Peserta</h3>
                                                                          <p className="text-[11px] text-zinc-500">Gunakan token sesuai instruksi di formulir soal</p>
                                                                        </div>
                                                                      </div>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowTokenPopup(false)}
                                                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                                                                      >
                                                                        <X className="w-5 h-5" />
                                                                      </button>
                                                                    </div>

                                                                    {/* 1. KOTAK TOKEN MULAI (HIJAU) */}
                                                                    <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2">
                                                                      <div className="flex items-center justify-between">
                                                                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                                                                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                          <span>Token Mulai</span>
                                                                        </span>
                                                                        <span className="text-[10px] font-semibold text-emerald-700 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
                                                                          Wajib di Awal
                                                                        </span>
                                                                      </div>

                                                                      <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-emerald-200 shadow-2xs">
                                                                        <div className="font-mono font-black text-xl sm:text-2xl text-emerald-950 tracking-widest pl-1">
                                                                          {activeExam?.exam_token || '-'}
                                                                        </div>
                                                                        {activeExam?.exam_token && (
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => copyToken(activeExam.exam_token)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                                                                          >
                                                                            {copiedToken ? (
                                                                              <>
                                                                                <Check className="w-3.5 h-3.5" />
                                                                                <span>Tersalin</span>
                                                                              </>
                                                                            ) : (
                                                                              <>
                                                                                <Copy className="w-3.5 h-3.5" />
                                                                                <span>Salin Token</span>
                                                                              </>
                                                                            )}
                                                                          </button>
                                                                        )}
                                                                      </div>

                                                                      <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                                                                        💡 <strong>Catatan:</strong> Masukkan Token Mulai ini ke dalam kolom formulir Google Form di bawah untuk memulai ujian.
                                                                      </p>
                                                                    </div>

                                                                    {/* 2. KOTAK TOKEN SELESAI (MERAH / COUNTDOWN TERHIDE) */}
                                                                    {Boolean(activeExam?.finish_token) ? (
                                                                      (() => {
                                                                        const leadMinutes = Number(institution?.finish_token_lead_minutes || 10);
                                                                        const leadSeconds = leadMinutes * 60;
                                                                        const isFinishReady = remainingSeconds <= leadSeconds;
                                                                        const secondsUntilRelease = Math.max(0, remainingSeconds - leadSeconds);

                                                                        return (
                                                                          <div
                                                                            className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                                                                              isFinishReady
                                                                                ? 'bg-rose-50/90 border-rose-300'
                                                                                : 'bg-zinc-50 border-zinc-200/90'
                                                                            }`}
                                                                          >
                                                                            <div className="flex items-center justify-between">
                                                                              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                                                                isFinishReady ? 'text-rose-800' : 'text-zinc-600'
                                                                              }`}>
                                                                                <span className={`w-2 h-2 rounded-full ${isFinishReady ? 'bg-rose-500 animate-pulse' : 'bg-zinc-400'}`}></span>
                                                                                <span>Token Selesai</span>
                                                                              </span>
                                                                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                                                                isFinishReady
                                                                                  ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                                                                                  : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                                              }`}>
                                                                                {isFinishReady ? 'Sudah Terbit' : 'Tersembunyi'}
                                                                              </span>
                                                                            </div>

                                                                            {isFinishReady ? (
                                                                              <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-rose-300 shadow-2xs animate-pulse">
                                                                                <div className="font-mono font-black text-xl sm:text-2xl text-rose-950 tracking-widest pl-1">
                                                                                  {activeExam.finish_token}
                                                                                </div>
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={() => copyToken(activeExam.finish_token)}
                                                                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                                                                                >
                                                                                  {copiedToken ? (
                                                                                    <>
                                                                                      <Check className="w-3.5 h-3.5" />
                                                                                      <span>Tersalin</span>
                                                                                    </>
                                                                                  ) : (
                                                                                    <>
                                                                                      <Copy className="w-3.5 h-3.5" />
                                                                                      <span>Salin Token</span>
                                                                                    </>
                                                                                  )}
                                                                                </button>
                                                                              </div>
                                                                            ) : (
                                                                              <div className="bg-white rounded-lg p-3 border border-zinc-200/80 space-y-2">
                                                                                <div className="flex items-center justify-between">
                                                                                  <div className="font-mono font-bold text-lg text-zinc-300 tracking-widest select-none flex items-center gap-2">
                                                                                    <Lock className="w-4 h-4 text-zinc-400" />
                                                                                    <span>••••••</span>
                                                                                  </div>
                                                                                  <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                                                    Rilis: {formatDuration(secondsUntilRelease)}
                                                                                  </span>
                                                                                </div>
                                                                                <div className="text-[11px] text-zinc-500 leading-relaxed">
                                                                                  Token selesai otomatis dibuka <strong>{leadMinutes} menit</strong> sebelum waktu ujian berakhir.
                                                                                </div>
                                                                              </div>
                                                                            )}

                                                                            <p className={`text-[11px] leading-relaxed font-medium ${
                                                                              isFinishReady ? 'text-rose-800' : 'text-zinc-500'
                                                                            }`}>
                                                                              {isFinishReady
                                                                                ? '⚠️ Masukkan Token Selesai ini ke dalam kolom formulir Google Form sebelum mengirim/submit jawaban.'
                                                                                : '⏳ Token selesai diperlukan jika formulir Anda meminta token penutupan di akhir pengerjaan.'}
                                                                            </p>
                                                                          </div>
                                                                        );
                                                                      })()
                                                                    ) : (
                                                                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-500">
                                                                        Ujian ini tidak memerlukan Token Selesai.
                                                                      </div>
                                                                    )}

                                                                    {/* Tombol Tutup */}
                                                                    <div className="pt-2">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowTokenPopup(false)}
                                                                        className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                                                                      >
                                                                        Tutup & Lanjutkan Mengerjakan
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* 4. MODAL KONFIRMASI SELESAIKAN UJIAN */}
                                                              {showFinishConfirmModal && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
                                                                    <div className="flex items-center gap-2.5 text-zinc-900 mb-3">
                                                                      <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                                                        <LogOut className="w-5 h-5" />
                                                                      </div>
                                                                      <div>
                                                                        <h3 className="font-bold text-base text-zinc-900">Konfirmasi Penyelesaian Ujian</h3>
                                                                        <p className="text-[11px] text-zinc-500">Pastikan seluruh soal Google Form telah terjawab</p>
                                                                      </div>
                                                                    </div>

                                                                    <div className="text-xs text-zinc-600 space-y-3 leading-relaxed">
                                                                      {/* Penekanan Kuat Bahwa Jawaban Harus Disubmit Terlebih Dahulu */}
                                                                      <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 space-y-2 shadow-xs">
                                                                        <div className="flex items-center gap-2 font-bold text-xs text-rose-800 uppercase tracking-wide">
                                                                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                                                                          <span>PERINGATAN PENTING SEBELUM KELUAR:</span>
                                                                        </div>
                                                                        <p className="text-xs text-rose-950 font-bold leading-relaxed">
                                                                          Pastikan Anda sudah menekan tombol "Kirim" / "Submit" pada formulir Google Form di bawah ini!
                                                                        </p>
                                                                        <p className="text-[11px] text-rose-800 leading-relaxed">
                                                                          Keluar dari halaman ini akan menyelesaikan sesi ujian Anda secara permanen. Jika Anda belum mengirim respon di formulir, jawaban Anda tidak akan tersimpan di Google Form.
                                                                        </p>
                                                                      </div>

                                                                      {/* Informasi Aturan Waktu Token Selesai (Tanpa Menampilkan Kode Token) */}
                                                                      {Boolean(activeExam?.finish_token) && (
                                                                        <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 space-y-1">
                                                                          <div className="font-semibold text-zinc-800 flex items-center gap-1.5">
                                                                            <KeyRound className="w-4 h-4 text-zinc-500" />
                                                                            <span>Ketentuan Token Selesai:</span>
                                                                          </div>
                                                                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                                                                            Token selesai hanya diterbitkan pada bilah atas (navbar) saat waktu rilis tiba ({institution?.finish_token_lead_minutes || 10} menit sebelum ujian berakhir). Peserta wajib mengikuti ujian sesuai durasi pelaksanaan.
                                                                          </p>
                                                                        </div>
                                                                      )}

                                                                      <p>
                                                                        Setelah sesi ini diselesaikan, soal akan <strong>otomatis disembunyikan</strong> dari beranda Anda dan status ujian Anda tercatat sebagai <strong>Selesai</strong> di sistem pengawas.
                                                                      </p>
                                                                    </div>

                                                                    <div className="flex gap-2.5 pt-4 mt-4 border-t border-zinc-100">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowFinishConfirmModal(false)}
                                                                        className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                                                                      >
                                                                        Kembali ke Soal
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => handleFinishExam(false)}
                                                                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-[0.98] inline-flex items-center justify-center gap-1.5"
                                                                      >
                                                                        <LogOut className="w-4 h-4" />
                                                                        <span>Ya, Selesaikan</span>
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* Modal Autentikasi Google SSO Sesi Ini */}
                                                              {renderGoogleLoginModal()}

                                                              {/* Modal Popup Animasi Pemeriksaan Izin Sistem Berulang */}
                                                              {renderVerificationPopup()}

                                                              {/* Toast Notifikasi Peserta */}
                                                              {toast.show && (
                                                                <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-2.5 px-4 py-3 bg-zinc-900 text-white rounded-xl shadow-2xl border border-zinc-700 text-xs animate-in fade-in slide-in-from-bottom-2">
                                                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                                  <span>{toast.message}</span>
                                                                </div>
                                                              )}

                                                              {/* Modal Dialog Konfirmasi & Alert Modern */}
                                                              <ConfirmDialog
                                                                isOpen={confirmDialog.isOpen}
                                                                onClose={closeConfirm}
                                                                onConfirm={confirmDialog.onConfirm}
                                                                title={confirmDialog.title}
                                                                message={confirmDialog.message}
                                                                confirmText={confirmDialog.confirmText}
                                                                cancelText={confirmDialog.cancelText}
                                                                variant={confirmDialog.variant}
                                                                icon={confirmDialog.icon}
                                                              />
                                                            </div>
                                                            );
}

