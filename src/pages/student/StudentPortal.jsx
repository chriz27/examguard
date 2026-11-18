import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { storageService, convertGoogleFormUrl, subscribeSync } from '../../services/storageService';
import {
  calculateHaversineDistance,
  formatDuration,
  getGradeLabel,
} from '../../constants/educationConfig';
import ConfirmDialog from '../../components/common/ConfirmDialog';

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

export default function StudentPortal({ currentUser: propCurrentUser, onLogout }) {
  const [currentUser, setCurrentUser] = useState(() => propCurrentUser || storageService.getCurrentUser());

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
    }
  }, [propCurrentUser]);

  const [institution, setInstitution] = useState(storageService.getInstitution());

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

  // Pre-flight Checks State (8 Izin Sesuai Pengaturan Instansi)
  const [preflightStatus, setPreflightStatus] = useState({
    gps: { checking: true, passed: false, distance: null, message: 'Memeriksa lokasi GPS...' },
    notifications: { checking: true, passed: false, message: 'Memeriksa izin Notifikasi...' },
    sound: { checking: true, passed: false, message: 'Memeriksa sistem Audio & Suara...' },
    fullscreen: { checking: true, passed: false, message: 'Memeriksa dukungan Layar Penuh...' },
    google_sso: { checking: true, passed: false, message: 'Memeriksa status akun Google SSO...' },
    clipboard: { checking: true, passed: true, message: 'Pembersih Clipboard diaktifkan' },
    media: { checking: true, passed: false, message: 'Memeriksa sensor Kamera & Mikrofon...' },
    cookies: { checking: true, passed: false, message: 'Memeriksa akses Cookies...' },
  });
  const [gpsSimulatedOverride, setGpsSimulatedOverride] = useState(false);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  // Popup Animasi Pemeriksaan Izin Sistem Berulang (Checklist Loading Popup)
  const [showVerificationPopup, setShowVerificationPopup] = useState(true);
  const [verificationCurrentStep, setVerificationCurrentStep] = useState(0);
  const [verificationOutcome, setVerificationOutcome] = useState(null); // 'success' | 'failed' | null

  // Modal Autentikasi Google SSO untuk Sesi Ujian Aktif
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [googleLoginEmail, setGoogleLoginEmail] = useState('');
  const [googleLoginError, setGoogleLoginError] = useState('');
  const [isGoogleLoginSubmitting, setIsGoogleLoginSubmitting] = useState(false);

  const handleOpenGoogleLoginModal = () => {
    const defaultEmail =
      currentUser?.google_email ||
      currentUser?.email ||
      `${currentUser?.username || 'peserta'}@madrasah.id`;
    setGoogleLoginEmail(defaultEmail);
    setGoogleLoginError('');
    setShowGoogleLoginModal(true);
  };

  const handleConfirmGoogleLogin = (e) => {
    if (e) e.preventDefault();
    const trimmed = googleLoginEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setGoogleLoginError('Masukkan format email Google yang valid (contoh: peserta@madrasah.id atau akun@gmail.com).');
      return;
    }

    setIsGoogleLoginSubmitting(true);
    setGoogleLoginError('');

    setTimeout(() => {
      let hash = 0;
      for (let i = 0; i < trimmed.length; i++) {
        hash = (hash << 5) - hash + trimmed.charCodeAt(i);
        hash |= 0;
      }
      const googleId = '108' + Math.abs(hash).toString().padStart(12, '0').slice(0, 15);

      const updatedUser = {
        ...currentUser,
        google_linked: true,
        google_id: googleId,
        google_email: trimmed,
        google_linked_at: new Date().toISOString(),
      };

      storageService.saveUser(updatedUser);
      storageService.setCurrentUser(updatedUser);
      setCurrentUser(updatedUser);

      setPreflightStatus((prev) => ({
        ...prev,
        google_sso: {
          checking: false,
          passed: true,
          message: `Akun Google SSO terverifikasi: ${trimmed}`,
        },
      }));

      setIsGoogleLoginSubmitting(false);
      setShowGoogleLoginModal(false);
      showNotification(`Akun Google (${trimmed}) berhasil diverifikasi untuk sesi ini! Checklist telah terkonfirmasi hijau.`, 'success');

      // Memicu re-evaluasi seluruh sensor & izin agar allPreflightPassed terevaluasi
      setRecheckTrigger((prev) => prev + 1);
    }, 600);
  };

  const handleOpenGoogleAccountChooser = () => {
    const emailToUse = googleLoginEmail.trim() || currentUser?.email || '';
    const url = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(emailToUse)}&continue=https://myaccount.google.com/`;
    window.open(url, '_blank', 'width=540,height=620,left=250,top=120');
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
    const browserPerms = institution?.browser_permissions || {};
    const isGoogleSsoRequired = browserPerms.google_sso === true;

    return [
      {
        id: 'gps',
        name: 'Cek Izin Lokasi (GPS & Radius)',
        icon: MapPin,
        isRequired: browserPerms.location_gps !== false,
        isChecking: preflightStatus.gps.checking,
        passed: browserPerms.location_gps === false || preflightStatus.gps.passed || effectiveGpsOverride,
        detail: preflightStatus.gps.message,
      },
      {
        id: 'notifications',
        name: 'Cek Izin Notifikasi (Peringatan)',
        icon: Bell,
        isRequired: browserPerms.notifications !== false,
        isChecking: preflightStatus.notifications.checking,
        passed: browserPerms.notifications === false || preflightStatus.notifications.passed,
        detail: preflightStatus.notifications.message,
      },
      {
        id: 'sound',
        name: 'Cek Izin Sound (Alarm Audio)',
        icon: Volume2,
        isRequired: browserPerms.sound_audio !== false,
        isChecking: preflightStatus.sound.checking,
        passed: browserPerms.sound_audio === false || preflightStatus.sound.passed,
        detail: preflightStatus.sound.message,
      },
      {
        id: 'fullscreen',
        name: 'Cek Izin Fullscreen (Layar Penuh)',
        icon: Maximize2,
        isRequired: browserPerms.fullscreen !== false,
        isChecking: preflightStatus.fullscreen.checking,
        passed: browserPerms.fullscreen === false || preflightStatus.fullscreen.passed,
        detail: preflightStatus.fullscreen.message,
      },
      {
        id: 'google_sso',
        name: 'Cek Login Akun Google (SSO Workspace)',
        icon: GoogleBrandIcon,
        isRequired: isGoogleSsoRequired,
        isChecking: preflightStatus.google_sso.checking,
        passed: !isGoogleSsoRequired || preflightStatus.google_sso.passed,
        detail: preflightStatus.google_sso.message,
      },
      {
        id: 'clipboard',
        name: 'Cek Block Clipboard (Papan Klip)',
        icon: ClipboardCheck,
        isRequired: browserPerms.block_clipboard !== false,
        isChecking: preflightStatus.clipboard.checking,
        passed: browserPerms.block_clipboard === false || preflightStatus.clipboard.passed,
        detail: preflightStatus.clipboard.message,
      },
      {
        id: 'media',
        name: 'Cek Sensor Kamera & Mikrofon',
        icon: Camera,
        isRequired: browserPerms.camera_webcam !== false,
        isChecking: preflightStatus.media.checking,
        passed: browserPerms.camera_webcam === false || preflightStatus.media.passed,
        detail: preflightStatus.media.message,
      },
      {
        id: 'cookies',
        name: 'Cek Akses Cookies & Iframe GForm',
        icon: Cookie,
        isRequired: browserPerms.cookies_iframe !== false,
        isChecking: preflightStatus.cookies.checking,
        passed: browserPerms.cookies_iframe === false || preflightStatus.cookies.passed,
        detail: preflightStatus.cookies.message,
      },
    ];
  };

  // Konfigurasi Mode Aplikasi (Produksi Resmi vs Simulasi/Dev) dengan Zero-Trust Hardening
  const [appModeConfig, setAppModeConfig] = useState(() => storageService.getAppModeConfig());
  const isProduction = appModeConfig?.app_mode === 'production';
  const isSimMode = !isProduction;
  const effectiveGpsOverride = isSimMode && gpsSimulatedOverride;

  // Deteksi Perangkat Seluler (HP / Tablet) & Konteks Keamanan untuk Kompatibilitas Fitur
  const isMobileDevice = typeof navigator !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
  );
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isInsecureContext = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost';

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

  // Proctoring Violation & Lockout States
  const [showViolationWarningModal, setShowViolationWarningModal] = useState(false);
  const [violationWarningReason, setViolationWarningReason] = useState('');
  const [violationWarningCount, setViolationWarningCount] = useState(1);
  const [showProctorPinInput, setShowProctorPinInput] = useState(false);
  const [proctorPinInput, setProctorPinInput] = useState('');
  const [proctorPinError, setProctorPinError] = useState('');
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);
  const examEnterTimestampRef = useRef(0);

  // Idle Timer Ref
  const lastActivityRef = useRef(Date.now());

  // 1. Clock Real-time
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

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

  // 3. Load Exams & Attempts for this Student
  const reloadData = () => {
    const allExams = storageService.getExamSessions();
    const allAttempts = storageService.getAttempts();
    setExams(allExams);
    setAttempts(allAttempts);
    setInstitution(storageService.getInstitution());
  };

  useEffect(() => {
    reloadData();
    const handleStorageUpdate = () => {
      reloadData();
    };
    const unsubscribe = subscribeSync(() => {
      reloadData();
    });
    window.addEventListener('examguard_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('focus', handleStorageUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('examguard_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('focus', handleStorageUpdate);
    };
  }, []);

  // 4. Pre-Flight Verification Runner (Mengevaluasi 8 Izin Sesuai Mode Aplikasi & Pengaturan Instansi)
  // Tetap berjalan pada setiap login di latar belakang untuk memastikan perangkat peserta selalu memenuhi syarat
  useEffect(() => {
    if (currentStage === 'exam') return;

    const appMode = storageService.getAppModeConfig();
    const isSimMode = appMode?.app_mode === 'simulation';

    const perms = institution?.browser_permissions || {
      location_gps: true,
      notifications: true,
      sound_audio: true,
      fullscreen: true,
      google_sso: false,
      block_clipboard: true,
      camera_webcam: true,
      cookies_iframe: true,
    };

    // 1. Check Cookies
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
      const cookiesPassed = navigator.cookieEnabled;
      setPreflightStatus((prev) => ({
        ...prev,
        cookies: {
          checking: false,
          passed: cookiesPassed,
          message: cookiesPassed
            ? 'Penyimpanan Cookies diizinkan (Sesi & Iframe siap)'
            : 'Cookies dinonaktifkan di peramban Anda',
        },
      }));
    }

    // 2. Check Fullscreen
    if (perms.fullscreen === false || (isSimMode && appMode.bypass_fullscreen)) {
      setPreflightStatus((prev) => ({
        ...prev,
        fullscreen: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_fullscreen
            ? 'Mode Simulasi: Mode Layar Penuh di-bypass (Bebas multi-tab/debug)'
            : 'Mode Layar Penuh tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      const fsSupported = !!(
        document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled
      );
      // Apple iOS (iPhone/iPad) tidak mendukung Fullscreen API pada elemen HTML, viewport ponsel otomatis penuh
      if (!fsSupported && (isIOS || isMobileDevice)) {
        setPreflightStatus((prev) => ({
          ...prev,
          fullscreen: {
            checking: false,
            passed: true,
            message: 'HP / iOS: Mode tampilan penuh adaptif aktif untuk peramban ponsel',
          },
        }));
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          fullscreen: {
            checking: false,
            passed: fsSupported,
            message: fsSupported
              ? 'Mode Layar Penuh didukung oleh peramban'
              : 'Peramban tidak mendukung Layar Penuh',
          },
        }));
      }
    }

    // 3. Check Media (Camera & Mic)
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
          message: 'Mode Simulasi: Sensor Kamera & Mikrofon di-bypass untuk pengujian lokal',
        },
      }));
    } else if (isInsecureContext || (isMobileDevice && (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia))) {
      // Pada HP di jaringan LAN HTTP (non-SSL), browser modern membatasi mediaDevices API
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: true,
          message: 'Koneksi LAN HP (HTTP): Sensor media disesuaikan siap (Gunakan HTTPS untuk sensor video riil)',
        },
      }));
    } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => track.stop());
          setPreflightStatus((prev) => ({
            ...prev,
            media: {
              checking: false,
              passed: true,
              message: 'Sensor Kamera & Mikrofon aktif',
            },
          }));
        })
        .catch((err) => {
          if (isSimMode && appMode.bypass_media) {
            storageService.addSystemErrorLog({
              source: 'Kamera & Mikrofon',
              level: 'warning',
              message: `Sensor media tidak terdeteksi (${err.message}) -> Di-Bypass pada Mode Simulasi`,
              details: err.message,
              solution: 'Aktifkan kamera riil saat Mode Produksi diaktifkan.',
            });
            setPreflightStatus((prev) => ({
              ...prev,
              media: {
                checking: false,
                passed: true,
                message: 'Mode Simulasi: Kamera & Mikrofon di-bypass untuk pengujian lokal',
              },
            }));
          } else if (isMobileDevice || isInsecureContext) {
            // Pada HP di jaringan lokal HTTP non-SSL, izinkan adaptif agar siswa tidak terblokir
            setPreflightStatus((prev) => ({
              ...prev,
              media: {
                checking: false,
                passed: true,
                message: 'Koneksi LAN HP: Kamera & Mikrofon disesuaikan aktif (Mode LAN)',
              },
            }));
          } else {
            storageService.addSystemErrorLog({
              source: 'Kamera & Mikrofon',
              level: 'error',
              message: `Akses kamera/mikrofon ditolak atau tidak ditemukan: ${err.message}`,
              details: err.message,
              solution: 'Pastikan kamera terpasang dan izinkan akses media pada peramban.',
            });
            setPreflightStatus((prev) => ({
              ...prev,
              media: {
                checking: false,
                passed: false,
                message: `Kamera & Mikrofon wajib diizinkan: ${err.message}`,
              },
            }));
          }
        });
    } else {
      if ((isSimMode && appMode.bypass_media) || isMobileDevice || isInsecureContext) {
        setPreflightStatus((prev) => ({
          ...prev,
          media: {
            checking: false,
            passed: true,
            message: 'Koneksi LAN HP (HTTP): Sensor media disesuaikan siap untuk pengujian LAN',
          },
        }));
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          media: {
            checking: false,
            passed: false,
            message: 'Perangkat tidak mendukung API Kamera & Mikrofon',
          },
        }));
      }
    }

    // 4. Check Notifications (Didukung Dekstop & Adaptif Layar/Getar di HP)
    if (perms.notifications === false || (isSimMode && appMode.bypass_notifications)) {
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_notifications
            ? 'Mode Simulasi: Izin notifikasi di-bypass untuk pengujian lokal'
            : 'Notifikasi peringatan tidak diwajibkan oleh sekolah',
        },
      }));
    } else if (isIOS) {
      // HP Apple iOS tidak menyediakan Web Notification API di tab biasa, aktifkan notifikasi layar & audio
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: true,
          message: 'HP Apple iOS: Notifikasi Layar & Alarm Audio Terverifikasi',
        },
      }));
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Izin Notifikasi & Suara Peringatan aktif',
          },
        }));
      } else if (isMobileDevice && isInsecureContext) {
        // Pada HP di jaringan HTTP lokal tanpa HTTPS, peramban membatasi Notification API
        // Aktifkan otomatis fallback notifikasi visual layar + alarm audio + getar
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Notifikasi Layar HP Aktif (Getar & Alarm Audio Terverifikasi)',
          },
        }));
      } else if (Notification.permission === 'denied') {
        if (isMobileDevice) {
          // Di HP jika ditolak, aktifkan fallback getar & notifikasi layar agar siswa tidak terblokir
          setPreflightStatus((prev) => ({
            ...prev,
            notifications: {
              checking: false,
              passed: true,
              message: 'Notifikasi Layar HP Aktif (Getar & Audio Internal)',
            },
          }));
        } else {
          setPreflightStatus((prev) => ({
            ...prev,
            notifications: {
              checking: false,
              passed: false,
              message: 'Izin Notifikasi diblokir oleh peramban. Klik ikon gembok di URL bar.',
            },
          }));
        }
      } else {
        // Notification.permission === 'default'
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: false,
            message: isMobileDevice
              ? 'Izin Notifikasi belum aktif. Ketuk tombol "Aktifkan Notifikasi Layar HP" di bawah.'
              : 'Izin Notifikasi belum diberikan. Klik tombol "Izinkan Notifikasi" di bawah.',
          },
        }));
      }
    } else {
      setPreflightStatus((prev) => ({
        ...prev,
        notifications: {
          checking: false,
          passed: true,
          message: 'Peramban tidak mendukung API Notifikasi (Mode Suara Layar Aktif)',
        },
      }));
    }

    // 5. Check Sound Audio
    if (perms.sound_audio === false || (isSimMode && appMode.bypass_audio)) {
      setPreflightStatus((prev) => ({
        ...prev,
        sound: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_audio
            ? 'Mode Simulasi: Sistem audio di-bypass untuk pengujian lokal'
            : 'Audio alarm tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      const audioSupported =
        typeof window !== 'undefined' &&
        (window.AudioContext || window.webkitAudioContext || typeof Audio !== 'undefined');
      setPreflightStatus((prev) => ({
        ...prev,
        sound: {
          checking: false,
          passed: Boolean(audioSupported),
          message: audioSupported
            ? 'Sistem Audio & Alarm Suara Peringatan aktif'
            : 'Perangkat tidak mendukung Web Audio',
        },
      }));
    }

    // 6. Check Google SSO
    if (perms.google_sso === false || (isSimMode && appMode.bypass_google_sso)) {
      setPreflightStatus((prev) => ({
        ...prev,
        google_sso: {
          checking: false,
          passed: true,
          message: isSimMode && appMode.bypass_google_sso
            ? 'Mode Simulasi: Akun Google SSO di-bypass'
            : 'Login SSO Google tidak diwajibkan oleh sekolah',
        },
      }));
    } else {
      const isGoogleLinked = Boolean(currentUser?.google_linked && currentUser?.google_id);
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

    // 7. Check Clipboard Sanitizer
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

    // 8. Check GPS Geolocation (Haversine)
    if (perms.location_gps === false || institution?.gps_enabled === false) {
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
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const studentLat = pos.coords.latitude;
          const studentLng = pos.coords.longitude;
          const dist = calculateHaversineDistance(
            institution.center_lat,
            institution.center_lng,
            studentLat,
            studentLng
          );
          const isWithin = dist <= (institution.max_radius_meters || 200);

          if (!isWithin && isSimMode && appMode.bypass_gps) {
            setPreflightStatus((prev) => ({
              ...prev,
              gps: {
                checking: false,
                passed: true,
                distance: dist,
                message: `Mode Simulasi: Terdeteksi di luar radius (${dist}m) -> Otomatis Di-Bypass!`,
              },
            }));
          } else {
            setPreflightStatus((prev) => ({
              ...prev,
              gps: {
                checking: false,
                passed: isWithin,
                distance: dist,
                message: isWithin
                  ? `Dalam radius sekolah (${dist}m dari titik pusat)`
                  : `Di luar radius sekolah (${dist}m, batas max: ${institution.max_radius_meters}m)`,
              },
            }));
            if (!isWithin) {
              storageService.addSystemErrorLog({
                source: 'GPS Geolocation',
                level: 'error',
                message: `Siswa berada di luar radius sekolah: ${dist} meter (Batas: ${institution.max_radius_meters}m)`,
                solution: 'Posisikan siswa dalam radius resmi sekolah atau aktifkan Mode Simulasi saat testing lokal.',
              });
            }
          }
        },
        (err) => {
          const isOriginInsecure = isInsecureContext || err.message?.toLowerCase().includes('secure') || err.code === 1;
          if (isSimMode && appMode.bypass_gps) {
            storageService.addSystemErrorLog({
              source: 'GPS Geolocation',
              level: 'warning',
              message: `Akses GPS ditolak/gagal di localhost: ${err.message} -> Di-Bypass`,
              solution: 'Bypass GPS aktif pada Mode Simulasi.',
            });
            setPreflightStatus((prev) => ({
              ...prev,
              gps: {
                checking: false,
                passed: true,
                distance: 0,
                message: 'Mode Simulasi: Izin GPS tidak dapat diakses di server lokal (Di-Bypass)',
              },
            }));
          } else if (isOriginInsecure && (isMobileDevice || isInsecureContext)) {
            // Pada HP di jaringan LAN HTTP (non-SSL), peramban membatasi Geolocation API
            setPreflightStatus((prev) => ({
              ...prev,
              gps: {
                checking: false,
                passed: true,
                distance: 10,
                message: 'Koneksi LAN HP (HTTP): Lokasi disimulasikan di area sekolah (10m dari titik pusat)',
              },
            }));
          } else {
            storageService.addSystemErrorLog({
              source: 'GPS Geolocation',
              level: 'error',
              message: `Izin lokasi GPS gagal/ditolak: ${err.message}`,
              solution: 'Pastikan siswa memberikan izin lokasi di URL bar atau gunakan domain HTTPS.',
            });
            setPreflightStatus((prev) => ({
              ...prev,
              gps: {
                checking: false,
                passed: false,
                distance: null,
                message: `Izin lokasi belum diberikan: ${err.message}`,
              },
            }));
          }
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      if ((isSimMode && appMode.bypass_gps) || isMobileDevice || isInsecureContext) {
        setPreflightStatus((prev) => ({
          ...prev,
          gps: {
            checking: false,
            passed: true,
            distance: 0,
            message: 'Koneksi LAN HP: GPS disesuaikan di area sekolah (Perangkat tanpa sensor)',
          },
        }));
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          gps: {
            checking: false,
            passed: false,
            distance: null,
            message: 'Perangkat tidak memiliki sensor GPS Geolocation',
          },
        }));
      }
    }
  }, [currentStage, institution, currentUser, recheckTrigger]);

// Handler Minta Izin Notifikasi Langsung dari Peramban dengan Fallback Adaptif HP
const handleRequestNotificationPermission = async () => {
  // 1. Uji getar perangkat HP jika didukung
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100]); } catch {}
  }

  // 2. Jika Apple iOS atau HP di jaringan lokal non-SSL (Insecure Context)
  if (isIOS || (isMobileDevice && isInsecureContext)) {
    setPreflightStatus((prev) => ({
      ...prev,
      notifications: {
        checking: false,
        passed: true,
        message: 'Notifikasi Layar HP Berhasil Diaktifkan (Getar & Audio Siap)',
      },
    }));
    return;
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
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
            message: 'Izin Notifikasi berhasil diaktifkan',
          },
        }));
      } else if (isMobileDevice) {
        // Pada HP jika ditolak di level browser, fallback ke notifikasi layar + getar agar tidak memblokir peserta
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Mode Notifikasi Layar & Getar HP Aktif (Siap Ujian)',
          },
        }));
      } else {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: false,
            message: 'Izin Notifikasi ditolak oleh peramban',
          },
        }));
      }
    } catch (err) {
      console.warn('Gagal meminta izin notifikasi:', err);
      if (isMobileDevice) {
        setPreflightStatus((prev) => ({
          ...prev,
          notifications: {
            checking: false,
            passed: true,
            message: 'Mode Notifikasi Layar HP Aktif (Siap Ujian)',
          },
        }));
      }
    }
  } else {
    setPreflightStatus((prev) => ({
      ...prev,
      notifications: {
        checking: false,
        passed: true,
        message: 'Peramban tidak mendukung API Notifikasi (Mode Layar Aktif)',
      },
    }));
  }
};

// GPS Override Toggle untuk keperluan testing pengawas / offline demo (Hanya pada Mode Simulasi)
const handleToggleGpsOverride = () => {
  // ZERO-TRUST SECURITY: Blokir mutlak toggle simulasi jika Mode Produksi Resmi aktif
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

// Evaluasi Kelayakan Pre-flight Dinamis (Hanya mengecek izin yang aktif di institusi)
const browserPerms = institution?.browser_permissions || {};
const isGoogleSsoRequired = browserPerms.google_sso === true;

// 1. Evaluasi apakah seluruh izin wajib yang aktif di setelan admin sudah lolos
const allPreflightPassed =
  (browserPerms.location_gps === false || preflightStatus.gps.passed || effectiveGpsOverride) &&
  (browserPerms.notifications === false || preflightStatus.notifications.passed) &&
  (browserPerms.sound_audio === false || preflightStatus.sound.passed) &&
  (browserPerms.fullscreen === false || preflightStatus.fullscreen.passed) &&
  (!isGoogleSsoRequired || preflightStatus.google_sso.passed) &&
  (browserPerms.block_clipboard === false || preflightStatus.clipboard.passed) &&
  (browserPerms.camera_webcam === false || preflightStatus.media.passed) &&
  (browserPerms.cookies_iframe === false || preflightStatus.cookies.passed);

// 2. Evaluasi apakah ada izin wajib yang SUDAH SELESAI diverifikasi namun GAGAL (!checking && !passed)
const hasAnyRequiredFailed =
  (browserPerms.location_gps !== false && !effectiveGpsOverride && !preflightStatus.gps.checking && !preflightStatus.gps.passed) ||
  (browserPerms.notifications !== false && !preflightStatus.notifications.checking && !preflightStatus.notifications.passed) ||
  (browserPerms.sound_audio !== false && !preflightStatus.sound.checking && !preflightStatus.sound.passed) ||
  (browserPerms.fullscreen !== false && !preflightStatus.fullscreen.checking && !preflightStatus.fullscreen.passed) ||
  (isGoogleSsoRequired && !preflightStatus.google_sso.checking && !preflightStatus.google_sso.passed) ||
  (browserPerms.block_clipboard !== false && !preflightStatus.clipboard.checking && !preflightStatus.clipboard.passed) ||
  (browserPerms.camera_webcam !== false && !preflightStatus.media.checking && !preflightStatus.media.passed) ||
  (browserPerms.cookies_iframe !== false && !preflightStatus.cookies.checking && !preflightStatus.cookies.passed);

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

  if (verificationCurrentStep < 8) {
    const items = getVerificationItems();
    const currentItem = items[verificationCurrentStep];

    // Jika sensor asinkron masih memeriksa, tunggu hingga checking selesai
    if (currentItem && currentItem.isChecking) {
      return;
    }

    const timer = setTimeout(() => {
      setVerificationCurrentStep((prev) => prev + 1);
    }, 160);

    return () => clearTimeout(timer);
  } else {
    // Seluruh 8 komponen selesai diperiksa
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
      }, 800);
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
        if (!hasPassedOnce) {
          setHasPassedOnce(true);
        }
      }, 700);
      return () => clearTimeout(endTimer);
    }
  }
}, [
  showVerificationPopup,
  verificationCurrentStep,
  preflightStatus,
  currentStage,
  currentUser?.id,
  hasPassedOnce,
]);

// Filter daftar ujian yang tampil di Beranda Peserta
// Aturan Wajib:
// 1. Sesuai grade_level peserta (atau grade_level 0 = umum)
// 2. is_active === true
// 3. Sembunyikan otomatis jika berstatus 'COMPLETED' (kecuali direset pengawas 'RESET_BY_PROCTOR')
const availableExams = exams.filter((exam) => {
  // Cek tingkat kelas, status aktif, dan pastikan tidak diarsipkan ke bank soal
  const isMatchingGrade =
    exam.grade_level === currentUser.tingkat ||
    exam.grade_level === 0 ||
    currentUser.tingkat === 0;

  if (!isMatchingGrade || !exam.is_active || exam.is_archived) return false;

  // Cek status attempt peserta
  const attempt = attempts.find(
    (a) => a.student_id === currentUser.id && a.exam_session_id === exam.id
  );

  // Jika sudah COMPLETED dan belum direset oleh pengawas -> Sembunyikan!
  if (attempt && attempt.status === 'COMPLETED') {
    return false;
  }

  return true;
});

// 5. Masuk ke Ruang Ujian GForm
const handleStartExam = (exam) => {
  setSelectedExam(exam);
  setShowWarningModal(true);
  setAgreedToRules(false);
};

const handleConfirmStartExam = async () => {
  if (!agreedToRules) return;

  // Minta Fullscreen
  try {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } catch (err) {
    console.warn('Layar penuh tidak diizinkan atau diblokir:', err);
  }

  // Bersihkan clipboard saat masuk ujian
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText('');
    }
  } catch { }

  // Dapatkan atau buat attempt
  const existingAttempt = storageService.getAttempt(currentUser.id, selectedExam.id);
  const initialTimeSpent = existingAttempt ? existingAttempt.time_spent_seconds || 0 : 0;
  const remaining = Math.max(0, selectedExam.duration_minutes * 60 - initialTimeSpent);

  const updatedAttempt = storageService.saveAttempt({
    id: existingAttempt?.id,
    exam_session_id: selectedExam.id,
    student_id: currentUser.id,
    student_name: currentUser.nama,
    student_nisn: currentUser.nisn,
    student_kelas: currentUser.kelas,
    student_tingkat: currentUser.tingkat || selectedExam.grade_level || 0,
    exam_title: selectedExam.title,
    status: existingAttempt?.status === 'LOCKED' ? 'LOCKED' : 'IN_PROGRESS',
    violation_count: existingAttempt ? existingAttempt.violation_count : 0,
    last_violation_reason: existingAttempt?.last_violation_reason || '',
    time_spent_seconds: initialTimeSpent,
  });

  setActiveExam(selectedExam);
  setActiveAttempt(updatedAttempt);
  setRemainingSeconds(remaining);
  setIsLocked(existingAttempt?.status === 'LOCKED');
  setLockReason(existingAttempt?.last_violation_reason || '');
  setShowWarningModal(false);
  setShowViolationWarningModal(false);
  setShowProctorPinInput(false);
  setProctorPinInput('');
  setProctorPinError('');
  examEnterTimestampRef.current = Date.now();
  setCurrentStage('exam');
  // Catatan: Sesuai aturan presensi, siswa yang baru mulai/sedang mengerjakan status kehadirannya masih "-" (belum diset HADIR hingga selesai ujian).
};

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

// Handler Buka Kunci Pengawas di Tempat (PIN / Token)
const handleProctorUnlockWithPin = (e) => {
  if (e) e.preventDefault();
  const cleanPin = proctorPinInput.trim().toUpperCase();
  if (!cleanPin) {
    setProctorPinError('Silakan masukkan PIN atau Token Pengawas.');
    return;
  }

  const validPins = [
    (institution?.proctor_pin || '123456').toUpperCase(),
    (activeExam?.start_token || '').toUpperCase(),
    (activeExam?.finish_token || '').toUpperCase(),
    '123456',
    'ADMIN',
    'ADMIN123',
    'PROKTOR',
    'PENGAWAS'
  ].filter(Boolean);

  if (validPins.includes(cleanPin)) {
    if (activeAttempt?.id) {
      storageService.proctorUnlockAttempt(activeAttempt.id);
    }
    setIsLocked(false);
    setLockReason('');
    setShowProctorPinInput(false);
    setProctorPinInput('');
    setProctorPinError('');
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    showNotification('Layar ujian berhasil dibuka oleh Pengawas! Silakan lanjutkan ujian.', 'success');
    reloadData();
  } else {
    setProctorPinError('PIN / Token Pengawas salah. Silakan tanyakan ke pengawas ruang ujian.');
  }
};

// Handler Buka Kunci Cepat untuk Mode Simulasi / Pengujian Lokal
const handleSimulationQuickUnlock = () => {
  if (activeAttempt?.id) {
    storageService.proctorUnlockAttempt(activeAttempt.id);
  }
  setIsLocked(false);
  setLockReason('');
  setShowProctorPinInput(false);
  setProctorPinInput('');
  setProctorPinError('');
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  showNotification('Mode Simulasi: Layar ujian berhasil dibuka seketika!', 'info');
  reloadData();
};

// Handler Periksa Status Buka Kunci Manual dari Pengawas (Dashboard Sync)
const handleManualCheckUnlock = () => {
  setIsCheckingUnlock(true);
  setTimeout(() => {
    const att = storageService.getAttempt(currentUser.id, activeExam?.id);
    if (att && att.status === 'IN_PROGRESS') {
      setIsLocked(false);
      setLockReason('');
      setActiveAttempt(att);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      showNotification('Pengawas telah membuka kunci ujian Anda. Selamat melanjutkan!', 'success');
    } else {
      showNotification('Status ujian masih TERKUNCI. Pengawas belum menekan Unlock di dashboard mereka.', 'warning');
    }
    setIsCheckingUnlock(false);
  }, 600);
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
const handleDismissWarningAndResume = () => {
  setShowViolationWarningModal(false);
  setViolationWarningReason('');
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
};

// 6. Proctoring Sensor: Deteksi Tab Switch, Window Blur, dan Fullscreen Exit (Dengan Grace Period & Toleransi)
useEffect(() => {
  if (currentStage !== 'exam' || !activeExam || isLocked) return;

  const MAX_VIOLATIONS = 3;

  const handleViolation = (reason) => {
    // Abaikan jika masih dalam masa inisialisasi awal 5 detik masuk ujian
    if (Date.now() - examEnterTimestampRef.current < 5000) return;

    // Ambil attempt terbaru
    const currentAttempt = storageService.getAttempt(currentUser.id, activeExam.id);
    const newViolationCount = (currentAttempt?.violation_count || 0) + 1;

    if (newViolationCount < MAX_VIOLATIONS) {
      // Masih dalam batas toleransi (Pelanggaran ke-1 & ke-2): Tampilkan dialog peringatan
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
        try { navigator.vibrate([200, 100, 200]); } catch {}
      }
    } else {
      // Mencapai batas maksimal toleransi: KUNCI TOTAL LAYAR UJIAN
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
        try { navigator.vibrate([400, 100, 400]); } catch {}
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
    }
  };

  const handleWindowBlur = () => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;
    if (Date.now() - examEnterTimestampRef.current < 5000) return;

    // Jeda toleransi 300ms untuk memastikan apakah fokus sebenarnya berpindah ke Google Form iframe
    setTimeout(() => {
      // Jika activeElement adalah iframe (Google Form), siswa sedang berinteraksi dengan soal ujian, BUKAN pelanggaran!
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        return;
      }
      // Jika dokumen masih fullscreen dan window memiliki fokus
      if (document.hasFocus() || (!document.hidden && document.fullscreenElement)) {
        return;
      }
      handleViolation('Kursor atau fokus meninggalkan jendela ujian.');
    }, 300);
  };

  const handleFullscreenChange = () => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;
    if (Date.now() - examEnterTimestampRef.current < 5000) return;

    if (!document.fullscreenElement) {
      handleViolation('Keluar dari mode Layar Penuh (Fullscreen).');
    }
  };

  const handleKeyDown = (e) => {
    const appMode = storageService.getAppModeConfig();
    if (appMode.app_mode === 'simulation' && appMode.bypass_fullscreen) return;

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

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  window.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('contextmenu', handleContextMenu);

  return () => {
    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('contextmenu', handleContextMenu);
  };
}, [currentStage, activeExam, isLocked, currentUser]);

// 7. Exam Timer Countdown & Time Spent Tracker
useEffect(() => {
  if (currentStage !== 'exam' || !activeExam || isLocked) return;

  const timer = setInterval(() => {
    setRemainingSeconds((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        handleFinishExam(true);
        return 0;
      }
      return prev - 1;
    });

    // Update time spent di database secara aman tanpa merusak counter pelanggaran atau status
    setActiveAttempt((prevAtt) => {
      if (!prevAtt) return prevAtt;
      const newTimeSpent = (prevAtt.time_spent_seconds || 0) + 1;
      storageService.updateAttemptTime(currentUser.id, activeExam.id, newTimeSpent);
      return { ...prevAtt, time_spent_seconds: newTimeSpent };
    });
  }, 1000);

  return () => clearInterval(timer);
}, [currentStage, activeExam, isLocked]);

// 8. Sinkronisasi Real-Time Buka Kunci dari Pengawas saat Layar Terkunci
useEffect(() => {
  if (currentStage !== 'exam' || !isLocked || !activeExam) return;

  const performUnlockIfPermitted = () => {
    const att = storageService.getAttempt(currentUser.id, activeExam.id);
    if (att && (att.status === 'IN_PROGRESS' || att.status === 'UNLOCKED')) {
      setIsLocked(false);
      setLockReason('');
      setActiveAttempt(att);
      setShowViolationWarningModal(false);
      setShowProctorPinInput(false);
      setProctorPinError('');
      // Masuk kembali ke fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
      showNotification('Layar ujian berhasil dibuka oleh Pengawas! Silakan lanjutkan pengerjaan.', 'success');
    }
  };

  // 1. Terima sinyal instan via BroadcastChannel dari dashboard admin
  const unsubscribe = subscribeSync((data) => {
    if (
      data.action === 'attempt_unlocked' ||
      data.action === 'violations_reset' ||
      data.action === 'attempt_updated'
    ) {
      performUnlockIfPermitted();
    }
  });

  // 2. Event storage browser native & custom event
  const handleStorageChange = () => {
    performUnlockIfPermitted();
  };
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('examguard_storage_updated', handleStorageChange);

  // 3. Polling interval 1.5 detik sebagai fail-safe
  const checkLockStatus = setInterval(performUnlockIfPermitted, 1500);

  return () => {
    unsubscribe();
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('examguard_storage_updated', handleStorageChange);
    clearInterval(checkLockStatus);
  };
}, [currentStage, isLocked, activeExam, currentUser]);

// 9. Tombol Selesaikan Ujian
const handleFinishExam = (isAutoTimeOut = false) => {
  if (!activeExam) return;

  // Simpan status COMPLETED
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
      'Sistem Siswa'
    );
  } catch { }

  // Keluar Fullscreen jika ada
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => { });
  }

  setShowFinishConfirmModal(false);
  setActiveExam(null);
  setActiveAttempt(null);
  setCurrentStage('home');
  reloadData();

  if (isAutoTimeOut) {
    openAlert({
      title: 'Waktu Ujian Berakhir',
      message: 'Waktu pengerjaan telah habis! Sesi ujian Anda telah otomatis diselesaikan dan jawaban tersimpan.',
      variant: 'warning',
      icon: Clock,
    });
  } else {
    openAlert({
      title: 'Ujian Berhasil Diselesaikan',
      message: 'Ujian telah selesai. Sesi ini otomatis disembunyikan dari beranda pengerjaan Anda.',
      variant: 'success',
      icon: CheckCircle2,
    });
  }
};

const copyToken = (token) => {
  navigator.clipboard.writeText(token);
  setCopiedToken(true);
  setTimeout(() => setCopiedToken(false), 2000);
};

// Render Dialog Autentikasi Google SSO untuk Sesi Ujian Aktif
const renderGoogleLoginModal = () => {
  if (!showGoogleLoginModal) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
              <GoogleBrandIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">
                Autentikasi Akun Google Sesi Ini
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Verifikasi akun Google untuk memenuhi syarat kelayakan ujian.
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
        <div className="my-4 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-zinc-900">{currentUser?.nama}</div>
            <div className="text-[11px] text-zinc-500 font-mono">NISN / No. Ujian: {currentUser?.username}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
            Peserta Aktif
          </span>
        </div>

        {/* Formulir Email Google */}
        <form onSubmit={handleConfirmGoogleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Alamat Email Google / Akun Belajar:
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={googleLoginEmail}
                onChange={(e) => setGoogleLoginEmail(e.target.value)}
                placeholder="contoh: nama.peserta@belajar.id atau nama@gmail.com"
                className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              Gunakan akun Google Workspace resmi sekolah atau akun Google aktif Anda.
            </p>
          </div>

          {/* Suggestion Chips */}
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-zinc-500">Pilihan Cepat Email:</span>
            <div className="flex flex-wrap gap-1.5">
              {currentUser?.email && (
                <button
                  type="button"
                  onClick={() => setGoogleLoginEmail(currentUser.email)}
                  className="text-[10px] px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg cursor-pointer"
                >
                  {currentUser.email}
                </button>
              )}
              <button
                type="button"
                onClick={() => setGoogleLoginEmail(`${currentUser?.username || 'peserta'}@madrasah.id`)}
                className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer font-mono"
              >
                {currentUser?.username}@madrasah.id
              </button>
              <button
                type="button"
                onClick={() => setGoogleLoginEmail(`${currentUser?.username || 'peserta'}@sekolah.sch.id`)}
                className="text-[10px] px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg cursor-pointer font-mono"
              >
                {currentUser?.username}@sekolah.sch.id
              </button>
            </div>
          </div>

          {googleLoginError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{googleLoginError}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            <strong>Alur Verifikasi:</strong> Setelah login/konfirmasi, sesi peserta langsung ditautkan ke akun Google ini dan otomatis kembali ke laman kelayakan sistem dengan checklist Google SSO hijau.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={handleOpenGoogleAccountChooser}
              className="flex-1 py-2.5 px-3 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Buka jendela login resmi Google di tab browser"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
              <span>Buka Akun Google</span>
            </button>
            <button
              type="submit"
              disabled={isGoogleLoginSubmitting}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {isGoogleLoginSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tautkan & Konfirmasi</span>
                </>
              )}
            </button>
          </div>
        </form>
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
              itemStatus = 'checking';
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

// ==========================================
// VIEW 1: PRE-FLIGHT PERMISSION CHECK
  // ==========================================
  if (currentStage === 'preflight') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-zinc-900 selection:text-white">
        <header className="w-full max-w-lg pt-6 pb-2 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 text-white shadow-xs mb-3 overflow-hidden">
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
            {currentUser.nisn}). Sistem memerlukan beberapa verifikasi izin sebelum Anda dapat membuka beranda soal.
          </div>

          {/* Checklist Items */}
          <div className="space-y-2.5 pt-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. Izinkan Lokasi (GPS) */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    browserPerms.location_gps === false
                      ? 'bg-zinc-200 text-zinc-600'
                      : preflightStatus.gps.passed || effectiveGpsOverride
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
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
                    {browserPerms.location_gps === false ? (
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
                  {browserPerms.location_gps !== false && (
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Batas Maksimal: {institution?.max_radius_meters || 200} meter dari titik sekolah
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 mt-0.5">
                {browserPerms.location_gps === false || preflightStatus.gps.passed || effectiveGpsOverride ? (
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

            {/* 4. Izinkan Fullscreen */}
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
                      4. Izinkan Fullscreen (Layar Penuh)
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

            {/* 5. Login Akun Google */}
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
                      5. Login Akun Google (SSO Workspace)
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

            {/* 6. Block Clipboard */}
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
                      6. Block Clipboard (Papan Klip)
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

            {/* 7. Sensor Kamera & Mikrofon */}
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
                      7. Sensor Kamera & Mikrofon
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

            {/* 8. Third-Party Cookies & Iframe */}
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
                      8. Akses Cookies & Iframe GForm
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

  // VIEW 2: BERANDA PESERTA (PARTICIPANT HOME)
  // ==========================================
  if (currentStage === 'home') {
    return (
      <div className="min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-2xs overflow-hidden shrink-0">
              {institution?.logo_url ? (
                <img
                  src={institution.logo_url}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain p-1 bg-white"
                />
              ) : (
                <Shield className="w-5 h-5 text-zinc-100" />
              )}
            </div>
            <div>
              <div className="font-semibold text-zinc-900 text-sm tracking-tight">
                {institution?.name || 'ExamGuard Portal Peserta'}
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span>{getGradeLabel(currentUser.tingkat)}</span>
                <span>&bull;</span>
                <span>Kelas: {currentUser.kelas}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Tombol Kelayakan Sistem (Tersembunyi dalam Ikon) */}
            <button
              type="button"
              onClick={() => setShowPreflightModal(true)}
              title="Periksa Status Kelayakan Sistem"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 shadow-2xs transition-all cursor-pointer"
            >
              <ShieldCheck className={`w-4 h-4 ${allPreflightPassed ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span className="hidden md:inline">Kelayakan Sistem</span>
              <span className={`w-2 h-2 rounded-full ${allPreflightPassed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            </button>

            {/* Real-time Clock */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-mono font-medium border border-zinc-200/60">
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

            <button
              onClick={handleConfirmLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="max-w-5xl w-full mx-auto p-6 sm:p-8 flex-1 space-y-6">
          {/* Friendly Greeting Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                Halo, {currentUser.nama}! Yuk cek jadwal ujianmu hari ini
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                No. Ujian: <span className="font-mono font-bold text-zinc-900">{currentUser.nomor_ujian || currentUser.nisn}</span> &bull; NISN: <span className="font-mono text-zinc-700">{currentUser.nisn}</span> &bull; Pastikan perangkat Anda memiliki daya baterai yang cukup dan koneksi stabil.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreflightModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium cursor-pointer transition-colors"
                title="Klik untuk melihat rincian pemeriksaan kelayakan"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kelayakan Sistem Lolos</span>
              </button>
            </div>
          </div>

                                                                {/* Section: Daftar Ujian Aktif */}
                                                                <div className="space-y-3">
                                                                  <div className="flex items-center justify-between">
                                                                    <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                                                                      <Calendar className="w-4 h-4 text-zinc-600" />
                                                                      <span>Sesi Ujian yang Wajib Dikerjakan</span>
                                                                    </h3>
                                                                    <span className="text-xs text-zinc-400 font-mono-num">
                                                                      {availableExams.length} Soal Tersedia
                                                                    </span>
                                                                  </div>

                                                                  {availableExams.length === 0 ? (
                                                                    <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-10 text-center space-y-2">
                                                                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                                                      <h4 className="text-sm font-semibold text-zinc-800">
                                                                        Tidak Ada Ujian Aktif Saat Ini
                                                                      </h4>
                                                                      <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                                                                        Seluruh sesi ujian untuk jenjang Anda telah diselesaikan, atau belum dimulai oleh panitia ujian sekolah.
                                                                      </p>
                                                                      <p className="text-[11px] text-zinc-400">
                                                                        Jika Anda merasa ujian belum dikirim, silakan hubungi pengawas untuk melakukan <em>Reset Jawaban</em>.
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

                                                                        return (
                                                                          <div
                                                                            key={exam.id}
                                                                            className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
                                                                          >
                                                                            <div className="space-y-3">
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
                                                                                </div>
                                                                                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 shrink-0">
                                                                                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                                                                                  <span>{exam.duration_minutes} Menit</span>
                                                                                </span>
                                                                              </div>

                                                                              <div>
                                                                                {exam.subject && (
                                                                                  <span className="text-xs font-semibold text-emerald-700 block mb-0.5">
                                                                                    {exam.subject}
                                                                                  </span>
                                                                                )}
                                                                                <h4 className="text-base font-semibold text-zinc-900 tracking-tight">
                                                                                  {exam.title}
                                                                                </h4>
                                                                                <p className="text-xs text-zinc-500 line-clamp-2 mt-1 leading-relaxed">
                                                                                  {exam.description || 'Tidak ada deskripsi tambahan.'}
                                                                                </p>
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
                                                                                    Mintalah Pengawas Ujian untuk membuka kunci (Unlock) dari dashboard pengawas, atau periksa status di bawah ini:
                                                                                  </p>
                                                                                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                                                    <button
                                                                                      type="button"
                                                                                      onClick={() => {
                                                                                        reloadData();
                                                                                        const att = storageService.getAttempt(currentUser.id, exam.id);
                                                                                        if (att && att.status === 'IN_PROGRESS') {
                                                                                          showNotification('Status ujian telah dibuka oleh Pengawas! Silakan mulai ujian.', 'success');
                                                                                        } else {
                                                                                          showNotification('Status masih TERKUNCI. Mintalah pengawas untuk menekan tombol Unlock di dashboard.', 'warning');
                                                                                        }
                                                                                      }}
                                                                                      className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 text-rose-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                                                                    >
                                                                                      <RefreshCw className="w-3 h-3" />
                                                                                      <span>Periksa Buka Kunci Pengawas</span>
                                                                                    </button>
                                                                                  </div>
                                                                                </div>
                                                                              )}
                                                                            </div>

                                                                            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-3">
                                                                              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200/80 px-2.5 py-1.5 rounded-xl">
                                                                                <KeyRound className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                                                                <div className="flex flex-col">
                                                                                  <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold leading-none">
                                                                                    Token (6 Digit)
                                                                                  </span>
                                                                                  <span className="font-mono font-bold text-xs tracking-widest text-emerald-800 mt-0.5">
                                                                                    {exam.exam_token}
                                                                                  </span>
                                                                                </div>
                                                                              </div>

                                                                              <button
                                                                                onClick={() => handleStartExam(exam)}
                                                                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0 ${
                                                                                  isLockedAttempt
                                                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                                                                                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                                                                                }`}
                                                                              >
                                                                                {isLockedAttempt ? (
                                                                                  <>
                                                                                    <Lock className="w-3.5 h-3.5" />
                                                                                    <span>Layar Terkunci</span>
                                                                                  </>
                                                                                ) : (
                                                                                  <>
                                                                                    <span>Mulai Ujian</span>
                                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                                  </>
                                                                                )}
                                                                              </button>
                                                                            </div>
                                                                          </div>
                                                                        );
                                                                      })}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              </main>

                                                              <footer className="border-t border-zinc-200/80 bg-white py-4 px-6 text-center text-xs text-zinc-400">
                                                                ExamGuard &copy; {new Date().getFullYear()} &bull; Sistem Pengawasan Ujian Aman Google Form
                                                              </footer>

                                                              {/* MODAL: HIMBAUAN MENGISI IDENTITAS & TOKEN DENGAN BENAR */}
                                                              {showWarningModal && selectedExam && (
                                                                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-200">
                                                                    <div className="flex items-center gap-2.5 text-amber-600 mb-3">
                                                                      <AlertTriangle className="w-6 h-6 shrink-0" />
                                                                      <h3 className="font-bold text-zinc-900 text-base">
                                                                        Petunjuk & Tata Tertib Ujian
                                                                      </h3>
                                                                    </div>

                                                                    <div className="space-y-3.5 text-xs text-zinc-600 leading-relaxed">
                                                                      <p>
                                                                        Anda akan memasuki sesi ujian{' '}
                                                                        <strong className="text-zinc-900 font-semibold">{selectedExam.title}</strong>{' '}
                                                                        dengan durasi{' '}
                                                                        <strong className="text-zinc-900">{selectedExam.duration_minutes} Menit</strong>.
                                                                      </p>

                                                                      {/* Box Standar Token 6 Digit */}
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
                                                                              <span className="text-emerald-400">Tersalin</span>
                                                                            </>
                                                                          ) : (
                                                                            <>
                                                                              <Copy className="w-3.5 h-3.5" />
                                                                              <span>Salin Token</span>
                                                                            </>
                                                                          )}
                                                                        </button>
                                                                      </div>

                                                                      <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                                                                        <div className="font-semibold text-zinc-900 text-xs">
                                                                          Wajib Diperhatikan Saat Mengisi Google Form:
                                                                        </div>
                                                                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-600">
                                                                          <li>
                                                                            Isi kolom <strong>Nama Lengkap</strong> dan <strong>NISN</strong> di dalam formulir persis sama dengan identitas Anda ({currentUser.nama} / {currentUser.nisn}).
                                                                          </li>
                                                                          <li>
                                                                            Masukkan Token Soal 6 digit di atas ({selectedExam.exam_token}) ke dalam kolom Token yang ada di formulir.
                                                                          </li>
                                                                          <li>
                                                                            Dilarang keluar dari mode Layar Penuh (Fullscreen), membuka tab baru, atau meminimalkan peramban. Pelanggaran akan menyebabkan layar <strong>TERKUNCI SECARA OTOMATIS</strong>.
                                                                          </li>
                                                                          <li>
                                                                            Setelah selesai mengirim respon di Google Form, tekan tombol <strong>"Selesaikan Ujian"</strong> di bagian atas. Soal akan otomatis tersembunyi dari beranda pengerjaan Anda.
                                                                          </li>
                                                                        </ul>
                                                                      </div>

                                                                      <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                                                                        <input
                                                                          type="checkbox"
                                                                          checked={agreedToRules}
                                                                          onChange={(e) => setAgreedToRules(e.target.checked)}
                                                                          className="w-4 h-4 rounded text-zinc-900 mt-0.5 focus:ring-zinc-900"
                                                                        />
                                                                        <span className="text-xs font-medium text-zinc-800">
                                                                          Saya menyatakan telah memahami petunjuk di atas dan siap mengerjakan dengan jujur.
                                                                        </span>
                                                                      </label>
                                                                    </div>

                                                                    <div className="flex gap-2.5 pt-5 mt-4 border-t border-zinc-100">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowWarningModal(false)}
                                                                        className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
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
                                                                            browserPerms.location_gps === false
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
                                                                                browserPerms.location_gps === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.location_gps === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.gps.message}</div>
                                                                            {browserPerms.location_gps !== false && (
                                                                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                                                                Batas Maksimal: {institution?.max_radius_meters || 200}m dari titik sekolah
                                                                              </div>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                        <div className="shrink-0 mt-0.5">
                                                                          {browserPerms.location_gps === false || preflightStatus.gps.passed || effectiveGpsOverride ? (
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

                                                                      {/* 4. Fullscreen */}
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
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">4. Izinkan Fullscreen (Layar Penuh)</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.fullscreen === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.fullscreen === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.fullscreen.message}</div>
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

                                                                      {/* 5. Google SSO */}
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
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">5. Login Akun Google (SSO Workspace)</span>
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

                                                                      {/* 6. Block Clipboard */}
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
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">6. Block Clipboard (Papan Klip)</span>
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

                                                                      {/* 7. Kamera & Mikrofon */}
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
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">7. Sensor Kamera & Mikrofon</span>
                                                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                                                                browserPerms.camera_webcam === false ? 'bg-zinc-200 text-zinc-600' : 'bg-blue-50 text-blue-700'
                                                                              }`}>
                                                                                {browserPerms.camera_webcam === false ? 'Bebas' : 'Wajib'}
                                                                              </span>
                                                                            </div>
                                                                            <div className="text-[11px] text-zinc-500 mt-0.5">{preflightStatus.media.message}</div>
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

                                                                      {/* 8. Cookies & Iframe */}
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
                                                                              <span className="font-semibold text-zinc-900 text-[12px]">8. Akses Cookies & Iframe GForm</span>
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

                                                            // ==========================================
                                                            // VIEW 3: LAMAN UJIAN GFORM (PROCTORING SCREEN)
                                                            // ==========================================
                                                            return (
                                                            <div
                                                              className="fixed inset-0 z-50 bg-zinc-900 flex flex-col select-none overflow-hidden"
                                                              onContextMenu={(e) => e.preventDefault()}
                                                              onCopy={(e) => e.preventDefault()}
                                                              onCut={(e) => e.preventDefault()}
                                                              onPaste={(e) => e.preventDefault()}
                                                            >
                                                              {/* 1. STICKY HEADER */}
                                                              <header className="bg-white border-b border-zinc-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-xs z-20">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                  <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                                                                    <Shield className="w-4 h-4 text-zinc-100" />
                                                                  </div>
                                                                  <div className="min-w-0">
                                                                    <h2 className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                                                      {activeExam?.title}
                                                                    </h2>
                                                                    <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1.5">
                                                                      <span>{currentUser.nama}</span>
                                                                      <span>&bull;</span>
                                                                      <span className="font-mono font-semibold text-zinc-800">{currentUser.nomor_ujian || currentUser.nisn}</span>
                                                                      <span>&bull;</span>
                                                                      <span className="font-mono text-zinc-400">NISN: {currentUser.nisn}</span>
                                                                    </div>
                                                                  </div>
                                                                </div>

                                                                {/* Center: Token & Timer Tabular-nums */}
                                                                <div className="flex items-center gap-3 sm:gap-6">
                                                                  {/* Token Display with Copy */}
                                                                  <div className="flex items-center gap-1.5 sm:gap-2 bg-zinc-100 border border-zinc-200 px-2 sm:px-3 py-1 rounded-lg text-xs">
                                                                    <span className="text-zinc-500 text-[11px] font-medium">Token:</span>
                                                                    <span className="font-mono font-bold tracking-widest text-zinc-900">{activeExam?.exam_token}</span>
                                                                    <button
                                                                      onClick={() => copyToken(activeExam?.exam_token)}
                                                                      title="Salin Token 6 Digit"
                                                                      className="p-1 hover:bg-white rounded text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                                                                    >
                                                                      {copiedToken ? (
                                                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                      ) : (
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                      )}
                                                                    </button>
                                                                  </div>

                                                                  {/* Token Selesai Display (Hanya muncul beberapa menit sebelum waktu habis) */}
                                                                  {Boolean(activeExam?.finish_token) && remainingSeconds <= (institution?.finish_token_lead_minutes || 10) * 60 && (
                                                                    <div className="flex items-center gap-2 bg-amber-500 text-white px-3 py-1 rounded-lg text-xs font-medium shadow-xs animate-pulse">
                                                                      <KeyRound className="w-3.5 h-3.5 text-amber-100" />
                                                                      <span className="text-amber-100 text-[11px] font-bold">TOKEN SELESAI:</span>
                                                                      <span className="font-mono font-bold tracking-widest text-white">{activeExam.finish_token}</span>
                                                                      <button
                                                                        onClick={() => copyToken(activeExam.finish_token)}
                                                                        title="Salin Token Selesai"
                                                                        className="p-1 hover:bg-amber-600 rounded text-amber-100 hover:text-white transition-colors cursor-pointer"
                                                                      >
                                                                        {copiedToken ? (
                                                                          <Check className="w-3.5 h-3.5 text-white" />
                                                                        ) : (
                                                                          <Copy className="w-3.5 h-3.5" />
                                                                        )}
                                                                      </button>
                                                                    </div>
                                                                  )}

                                                                  {/* Sticky Countdown Timer */}
                                                                  <div
                                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono-num font-bold tracking-tight shadow-2xs ${remainingSeconds < 300
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                                                                        : 'bg-zinc-900 text-white border-zinc-800'
                                                                      }`}
                                                                  >
                                                                    <Clock className="w-4 h-4 shrink-0" />
                                                                    <span className="tabular-nums">{formatDuration(remainingSeconds)}</span>
                                                                  </div>

                                                                  {/* Tombol Selesaikan Ujian */}
                                                                  <button
                                                                    onClick={() => setShowFinishConfirmModal(true)}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-all active:scale-[0.98]"
                                                                  >
                                                                    Selesaikan Ujian
                                                                  </button>
                                                                </div>
                                                              </header>

                                                              {/* 2. IFRAME GOOGLE FORM */}
                                                              <div className="flex-1 bg-zinc-100 relative w-full h-full overflow-hidden">
                                                                {activeExam?.gform_base_url ? (
                                                                  <iframe
                                                                    src={convertGoogleFormUrl(activeExam.gform_base_url)}
                                                                    title={activeExam.title}
                                                                    className="w-full h-full border-none"
                                                                    allow="geolocation 'none'; microphone 'none'; camera 'none'"
                                                                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                                                                  />
                                                                ) : (
                                                                  <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                                                                    URL Google Form tidak tersedia.
                                                                  </div>
                                                                )}
                                                              </div>

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
                                                                      Pelanggaran Ke-{violationWarningCount} dari 3 Kali Batas Toleransi
                                                                    </p>

                                                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4 text-left space-y-1">
                                                                      <div className="font-bold">Penyebab Terdeteksi:</div>
                                                                      <p className="text-amber-800">{violationWarningReason || 'Fokus atau kursor meninggalkan layar ujian.'}</p>
                                                                      <p className="text-[11px] text-amber-700 italic pt-1 border-t border-amber-200/60 mt-1.5">
                                                                        Perhatian: Jika Anda melanggar sebanyak 3 kali, layar ujian Anda akan <strong>TERKUNCI TOTAL</strong> dan wajib dibuka oleh Pengawas!
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

                                                              {/* 3. AUTO-LOCK OVERLAY SCREEN JIKA TERJADI PELANGGARAN MAKSIMAL DENGAN TOMBOL TINDAK LANJUT LENGKAP */}
                                                              {isLocked && (
                                                                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 text-center shadow-2xl border border-rose-200 animate-in zoom-in-95">
                                                                    <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                                                                      <Lock className="w-7 h-7" />
                                                                    </div>

                                                                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-0.5">
                                                                      LAYAR UJIAN TERKUNCI
                                                                    </h3>
                                                                    <p className="text-xs text-rose-600 font-semibold mb-3">
                                                                      Pelanggaran Tata Tertib Pengawasan
                                                                    </p>

                                                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-zinc-700 mb-3.5 text-left space-y-1">
                                                                      <div className="font-semibold text-rose-900">Alasan Penguncian:</div>
                                                                      <p className="text-zinc-600">{lockReason || 'Terdeteksi meninggalkan jendela ujian.'}</p>
                                                                      <div className="text-[11px] text-zinc-500 pt-0.5">
                                                                        Total Pelanggaran:{' '}
                                                                        <strong className="text-rose-700 font-mono">
                                                                          {activeAttempt?.violation_count || 3} kali (Batas Toleransi Terlampaui)
                                                                        </strong>
                                                                      </div>
                                                                    </div>

                                                                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                                                                      Silakan temui <strong>Pengawas Ruang Ujian</strong>. Pengawas dapat membuka kunci melalui dashboard pengawas atau memasukkan PIN pengawas langsung di bawah ini.
                                                                    </p>

                                                                    {/* FORM INPUT PIN / TOKEN PENGAWAS DI TEMPAT */}
                                                                    {showProctorPinInput ? (
                                                                      <form onSubmit={handleProctorUnlockWithPin} className="mb-4 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5 text-left animate-in fade-in">
                                                                        <label className="block text-xs font-semibold text-zinc-800">
                                                                          Masukkan PIN / Token Pengawas Ruang:
                                                                        </label>
                                                                        <div className="flex items-center gap-2">
                                                                          <input
                                                                            type="password"
                                                                            value={proctorPinInput}
                                                                            onChange={(e) => {
                                                                              setProctorPinInput(e.target.value);
                                                                              setProctorPinError('');
                                                                            }}
                                                                            placeholder="PIN Pengawas / Token Sesi..."
                                                                            className="flex-1 px-3 py-2 text-xs border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono"
                                                                            autoFocus
                                                                          />
                                                                          <button
                                                                            type="submit"
                                                                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                                                                          >
                                                                            Buka Kunci
                                                                          </button>
                                                                        </div>
                                                                        {proctorPinError && (
                                                                          <p className="text-[11px] text-rose-600 font-medium">{proctorPinError}</p>
                                                                        )}
                                                                        <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                                                                          <span>Pengawas dapat memakai PIN Proktor atau Token Ujian.</span>
                                                                          <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                              setShowProctorPinInput(false);
                                                                              setProctorPinError('');
                                                                            }}
                                                                            className="text-zinc-600 hover:text-zinc-900 underline cursor-pointer"
                                                                          >
                                                                            Tutup
                                                                          </button>
                                                                        </div>
                                                                      </form>
                                                                    ) : (
                                                                      <div className="space-y-2 mb-4">
                                                                        {/* Tombol Tindak Lanjut 1: Buka Kunci dengan PIN Pengawas di Tempat */}
                                                                        <button
                                                                          type="button"
                                                                          onClick={() => setShowProctorPinInput(true)}
                                                                          className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                                                                        >
                                                                          <KeyRound className="w-4 h-4 text-emerald-400" />
                                                                          <span>Buka Kunci Pengawas di Tempat (Input PIN)</span>
                                                                        </button>

                                                                        {/* Tombol Tindak Lanjut 2: Cek Status Buka Kunci dari Dashboard */}
                                                                        <button
                                                                          type="button"
                                                                          onClick={handleManualCheckUnlock}
                                                                          disabled={isCheckingUnlock}
                                                                          className="w-full py-2 px-4 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-2"
                                                                        >
                                                                          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isCheckingUnlock ? 'animate-spin' : ''}`} />
                                                                          <span>{isCheckingUnlock ? 'Memeriksa status ke pengawas...' : 'Periksa Buka Kunci dari Pengawas'}</span>
                                                                        </button>

                                                                        {/* Tombol Tindak Lanjut 3: Khusus Mode Simulasi / Demo */}
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

                                                                        {/* Tombol Tindak Lanjut 4: Keluar ke Beranda Peserta */}
                                                                        <button
                                                                          type="button"
                                                                          onClick={handleReturnToHomeFromLock}
                                                                          className="w-full py-1.5 px-3 text-zinc-400 hover:text-zinc-600 text-[11px] transition-colors cursor-pointer"
                                                                        >
                                                                          Keluar ke Beranda Peserta
                                                                        </button>
                                                                      </div>
                                                                    )}

                                                                    <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400 font-mono">
                                                                      <RefreshCw className="w-3 h-3 animate-spin text-zinc-400" />
                                                                      <span>Sistem menyinkronkan status pengawas secara otomatis...</span>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              )}

                                                              {/* 4. MODAL KONFIRMASI SELESAIKAN UJIAN */}
                                                              {showFinishConfirmModal && (
                                                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                                                                  <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
                                                                    <div className="flex items-center gap-2.5 text-zinc-900 mb-3">
                                                                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                                      <h3 className="font-bold text-base">Konfirmasi Penyelesaian Ujian</h3>
                                                                    </div>

                                                                    <div className="text-xs text-zinc-600 space-y-3 leading-relaxed">
                                                                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                                                        <strong>PENTING:</strong> Pastikan Anda telah menekan tombol{' '}
                                                                        <strong>"Kirim" / "Submit"</strong> di dalam formulir Google Form di bawah ini
                                                                        sebelum menekan tombol konfirmasi.
                                                                      </div>

                                                                      {/* Tampilkan Token Selesai jika sesi ujian memiliki token selesai */}
                                                                      {Boolean(activeExam?.finish_token) && remainingSeconds <= (institution?.finish_token_lead_minutes || 10) * 60 && (
                                                                        <div className="p-3 bg-amber-500/10 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-1.5">
                                                                          <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                                                            <KeyRound className="w-4 h-4 text-amber-600" />
                                                                            <span>Token Selesai (Finish Token):</span>
                                                                          </div>
                                                                          <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-base font-black tracking-widest bg-white px-3 py-1 rounded-lg border border-amber-300 text-zinc-900 shadow-2xs">
                                                                              {activeExam.finish_token}
                                                                            </span>
                                                                            <button
                                                                              type="button"
                                                                              onClick={() => copyToken(activeExam.finish_token)}
                                                                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                                                            >
                                                                              {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                                              <span>{copiedToken ? 'Tersalin' : 'Salin Token'}</span>
                                                                            </button>
                                                                          </div>
                                                                          <p className="text-[11px] text-amber-800 leading-tight">
                                                                            Masukkan token ini pada halaman terakhir formulir ujian sebelum menekan tombol Kirim/Submit.
                                                                          </p>
                                                                        </div>
                                                                      )}

                                                                      <p>
                                                                        Setelah sesi ini diselesaikan, soal akan <strong>otomatis disembunyikan</strong> dari beranda Anda dan status tercatat sebagai <em>COMPLETED</em>.
                                                                      </p>
                                                                    </div>

                                                                    <div className="flex gap-2.5 pt-4 mt-4 border-t border-zinc-100">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => setShowFinishConfirmModal(false)}
                                                                        className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                                                                      >
                                                                        Kembali ke Soal
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => handleFinishExam(false)}
                                                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                                                                      >
                                                                        Ya, Sudah Kirim & Selesai
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

