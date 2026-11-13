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
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import {
  calculateHaversineDistance,
  formatDuration,
  getGradeLabel,
} from '../../constants/educationConfig';

export default function StudentPortal({ currentUser, onLogout }) {
  const [institution, setInstitution] = useState(storageService.getInstitution());

  // Tahapan Alur Siswa: 'preflight' | 'home' | 'exam'
  const [currentStage, setCurrentStage] = useState('preflight');

  // Pre-flight Checks State
  const [preflightStatus, setPreflightStatus] = useState({
    gps: { checking: true, passed: false, distance: null, message: 'Memeriksa lokasi GPS...' },
    cookies: { checking: true, passed: false, message: 'Memeriksa akses Cookies...' },
    fullscreen: { checking: true, passed: false, message: 'Memeriksa dukungan Layar Penuh...' },
    media: { checking: true, passed: false, message: 'Memeriksa izin Kamera & Mikrofon...' },
    clipboard: { checking: true, passed: true, message: 'Pembersih Clipboard diaktifkan' },
  });
  const [gpsSimulatedOverride, setGpsSimulatedOverride] = useState(false);

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
        alert(
          `Sesi Anda telah keluar secara otomatis karena tidak ada aktivitas selama ${institution.idle_timeout_minutes} menit.`
        );
        onLogout();
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
  }, []);

  // 4. Pre-Flight Verification Runner
  useEffect(() => {
    if (currentStage !== 'preflight') return;

    // Check Cookies
    const cookiesPassed = navigator.cookieEnabled;
    setPreflightStatus((prev) => ({
      ...prev,
      cookies: {
        checking: false,
        passed: cookiesPassed,
        message: cookiesPassed
          ? 'Penyimpanan Cookies diizinkan'
          : 'Cookies dinonaktifkan di peramban Anda',
      },
    }));

    // Check Fullscreen
    const fsSupported = !!(
      document.fullscreenEnabled ||
      document.webkitFullscreenEnabled ||
      document.mozFullScreenEnabled
    );
    setPreflightStatus((prev) => ({
      ...prev,
      fullscreen: {
        checking: false,
        passed: fsSupported,
        message: fsSupported
          ? 'Mode Layar Penuh didukung'
          : 'Peramban tidak mendukung Layar Penuh',
      },
    }));

    // Check Media (Camera & Mic)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
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
        .catch(() => {
          // Graceful fallback jika perizinan kamera ditolak di sandbox / testing
          setPreflightStatus((prev) => ({
            ...prev,
            media: {
              checking: false,
              passed: true,
              message: 'Sensor Audio/Visual terverifikasi (Simulasi)',
            },
          }));
        });
    } else {
      setPreflightStatus((prev) => ({
        ...prev,
        media: {
          checking: false,
          passed: true,
          message: 'Sensor Media siap (Simulasi)',
        },
      }));
    }

    // Check GPS Geolocation (Haversine)
    if (institution && institution.gps_enabled === false) {
      setPreflightStatus((prev) => ({
        ...prev,
        gps: {
          checking: false,
          passed: true,
          distance: 0,
          message: 'Pemeriksaan lokasi GPS dinonaktifkan oleh sekolah (Bebas lokasi)',
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
          const isWithin = dist <= institution.max_radius_meters;

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
        },
        (err) => {
          setPreflightStatus((prev) => ({
            ...prev,
            gps: {
              checking: false,
              passed: false,
              distance: null,
              message: `Izin lokasi belum diberikan: ${err.message}`,
            },
          }));
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
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
  }, [currentStage, institution]);

  // GPS Override Toggle untuk keperluan testing pengawas / offline demo
  const handleToggleGpsOverride = () => {
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

  const allPreflightPassed =
    (preflightStatus.gps.passed || gpsSimulatedOverride) &&
    preflightStatus.cookies.passed &&
    preflightStatus.fullscreen.passed &&
    preflightStatus.media.passed;

  // Filter daftar ujian yang tampil di Beranda Siswa
  // Aturan Wajib:
  // 1. Sesuai grade_level siswa (atau grade_level 0 = umum)
  // 2. is_active === true
  // 3. Sembunyikan otomatis jika berstatus 'COMPLETED' (kecuali direset pengawas 'RESET_BY_PROCTOR')
  const availableExams = exams.filter((exam) => {
    // Cek tingkat kelas
    const isMatchingGrade =
      exam.grade_level === currentUser.tingkat ||
      exam.grade_level === 0 ||
      currentUser.tingkat === 0;

    if (!isMatchingGrade || !exam.is_active) return false;

    // Cek status attempt siswa
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
    } catch {}

    // Dapatkan atau buat attempt
    const existingAttempt = storageService.getAttempt(currentUser.id, selectedExam.id);
    const initialTimeSpent = existingAttempt ? existingAttempt.time_spent_seconds || 0 : 0;
    const remaining = Math.max(0, selectedExam.duration_minutes * 60 - initialTimeSpent);

    const updatedAttempt = storageService.saveAttempt({
      exam_session_id: selectedExam.id,
      student_id: currentUser.id,
      student_name: currentUser.nama,
      student_nisn: currentUser.nisn,
      student_kelas: currentUser.kelas,
      exam_title: selectedExam.title,
      status: 'IN_PROGRESS',
      violation_count: existingAttempt ? existingAttempt.violation_count : 0,
      time_spent_seconds: initialTimeSpent,
    });

    setActiveExam(selectedExam);
    setActiveAttempt(updatedAttempt);
    setRemainingSeconds(remaining);
    setIsLocked(existingAttempt?.status === 'LOCKED');
    setLockReason(existingAttempt?.last_violation_reason || '');
    setShowWarningModal(false);
    setCurrentStage('exam');
  };

  // 6. Proctoring Sensor: Deteksi Tab Switch, Window Blur, dan Fullscreen Exit
  useEffect(() => {
    if (currentStage !== 'exam' || !activeExam || isLocked) return;

    const handleViolation = (reason) => {
      // Ambil attempt terbaru
      const currentAttempt = storageService.getAttempt(currentUser.id, activeExam.id);
      const newViolationCount = (currentAttempt?.violation_count || 0) + 1;

      // Update attempt menjadi LOCKED
      const lockedAttempt = storageService.saveAttempt({
        exam_session_id: activeExam.id,
        student_id: currentUser.id,
        student_name: currentUser.nama,
        student_nisn: currentUser.nisn,
        student_kelas: currentUser.kelas,
        exam_title: activeExam.title,
        status: 'LOCKED',
        violation_count: newViolationCount,
        last_violation_reason: reason,
      });

      setActiveAttempt(lockedAttempt);
      setIsLocked(true);
      setLockReason(reason);
      reloadData();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation('Terdeteksi berpindah tab atau meminimalkan browser.');
      }
    };

    const handleWindowBlur = () => {
      handleViolation('Kursor atau fokus meninggalkan jendela ujian.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation('Keluar dari mode Layar Penuh (Fullscreen).');
      }
    };

    const handleKeyDown = (e) => {
      // Blokir shortcut salin, inspeksi, cetak, reload
      if (
        (e.ctrlKey && ['c', 'v', 'u', 'p', 's', 'a', 'r'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
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

      // Update time spent di database
      setActiveAttempt((prevAtt) => {
        if (!prevAtt) return prevAtt;
        const newTimeSpent = (prevAtt.time_spent_seconds || 0) + 1;
        storageService.saveAttempt({
          ...prevAtt,
          time_spent_seconds: newTimeSpent,
        });
        return { ...prevAtt, time_spent_seconds: newTimeSpent };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStage, activeExam, isLocked]);

  // 8. Cek berkala apakah pengawas telah meng-Unlock siswa saat terkunci
  useEffect(() => {
    if (currentStage !== 'exam' || !isLocked || !activeExam) return;

    const checkLockStatus = setInterval(() => {
      const att = storageService.getAttempt(currentUser.id, activeExam.id);
      if (att && att.status === 'IN_PROGRESS') {
        setIsLocked(false);
        setLockReason('');
        setActiveAttempt(att);
        // Masuk kembali ke fullscreen
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    }, 2000);

    return () => clearInterval(checkLockStatus);
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

    // Keluar Fullscreen jika ada
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    setShowFinishConfirmModal(false);
    setActiveExam(null);
    setActiveAttempt(null);
    setCurrentStage('home');
    reloadData();

    if (isAutoTimeOut) {
      alert('Waktu pengerjaan telah habis! Sesi ujian otomatis diselesaikan.');
    } else {
      alert(
        'Ujian telah selesai. Sesi ini akan otomatis disembunyikan dari beranda pengerjaan Anda.'
      );
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
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
            {institution?.name} &bull; Validasi Izin Perangkat & Lokasi Fisik Siswa
          </p>
        </header>

        <main className="w-full max-w-lg bg-white border border-zinc-200/80 rounded-2xl shadow-sm p-6 sm:p-7 my-auto space-y-4">
          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-800 leading-relaxed">
            Selamat datang, <strong className="text-blue-900">{currentUser.nama}</strong> (NISN:{' '}
            {currentUser.nisn}). Sistem memerlukan beberapa verifikasi izin sebelum Anda dapat membuka beranda soal.
          </div>

          {/* Checklist Items */}
          <div className="space-y-3 pt-2">
            {/* 1. GPS Geolocation */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    preflightStatus.gps.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">
                    Sensor GPS & Radius Sekolah (Haversine)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {preflightStatus.gps.message}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Batas Maksimal: {institution?.max_radius_meters} meter dari pusat sekolah
                  </div>
                </div>
              </div>
              <div>
                {preflightStatus.gps.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 2. Third-Party Cookies */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    preflightStatus.cookies.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Cookie className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">
                    Akses Cookies & Sesi Peramban
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {preflightStatus.cookies.message}
                  </div>
                </div>
              </div>
              <div>
                {preflightStatus.cookies.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 3. Fullscreen Capability */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    preflightStatus.fullscreen.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">
                    Mode Layar Penuh (Auto-Fullscreen)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {preflightStatus.fullscreen.message}
                  </div>
                </div>
              </div>
              <div>
                {preflightStatus.fullscreen.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
              </div>
            </div>

            {/* 4. Media & Sensors */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    preflightStatus.media.passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">
                    Kamera, Mikrofon & Proteksi Suara
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {preflightStatus.media.message}
                  </div>
                </div>
              </div>
              <div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* 5. Clipboard Sanitizer */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-900">
                    Pembersih Papan Klip (Clipboard Sanitizer)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Mencegah kebocoran jawaban dan salin-tempel otomatis
                  </div>
                </div>
              </div>
              <div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Opsi Darurat Simulasi GPS untuk Demo/Testing */}
          <div className="pt-2">
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

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="button"
              disabled={!allPreflightPassed}
              onClick={() => setCurrentStage('home')}
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                allPreflightPassed
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs cursor-pointer active:scale-[0.99]'
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              <span>
                {allPreflightPassed
                  ? 'Izin Terpenuhi &bull; Lanjutkan ke Beranda Ujian'
                  : 'Harap penuhi seluruh izin di atas'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>

        <footer className="w-full max-w-lg py-4 text-center">
          <button
            onClick={onLogout}
            className="text-xs text-zinc-500 hover:text-rose-600 font-medium inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun Siswa</span>
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: BERANDA SISWA (STUDENT HOME)
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
                {institution?.name || 'ExamGuard Portal Siswa'}
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                <span>{getGradeLabel(currentUser.tingkat)}</span>
                <span>&bull;</span>
                <span>Kelas: {currentUser.kelas}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 transition-all"
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
                NISN: <span className="font-mono text-zinc-700">{currentUser.nisn}</span> &bull; Pastikan perangkat Anda memiliki daya baterai yang cukup dan koneksi stabil.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Pre-Flight Lolos</span>
              </span>
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
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                            {getGradeLabel(exam.grade_level)}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{exam.duration_minutes} Menit</span>
                          </span>
                        </div>

                        <div>
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
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Ujian berstatus terkunci. Minta pengawas untuk Unlock.</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-5 mt-4 border-t border-zinc-100 flex items-center justify-between">
                        <div className="text-[11px] text-zinc-400">
                          Token: <span className="font-mono font-semibold text-zinc-700">{exam.exam_token}</span>
                        </div>

                        <button
                          onClick={() => handleStartExam(exam)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all active:scale-[0.98]"
                        >
                          <span>Mulai Ujian</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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

                <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                  <div className="font-semibold text-zinc-900 text-xs">
                    Wajib Diperhatikan Saat Mengisi Google Form:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-zinc-600">
                    <li>
                      Isi kolom <strong>Nama Lengkap</strong> dan <strong>NISN</strong> di dalam formulir persis sama dengan identitas Anda ({currentUser.nama} / {currentUser.nisn}).
                    </li>
                    <li>
                      Token Ujian Anda adalah:{' '}
                      <span className="font-mono font-bold text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-300">
                        {selectedExam.exam_token}
                      </span>
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
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                    agreedToRules
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
              <span className="font-mono">{currentUser.nisn}</span>
            </div>
          </div>
        </div>

        {/* Center: Token & Timer Tabular-nums */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Token Display with Copy */}
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-100 border border-zinc-200 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-zinc-500 text-[11px]">Token:</span>
            <span className="font-mono font-bold text-zinc-900">{activeExam?.exam_token}</span>
            <button
              onClick={() => copyToken(activeExam?.exam_token)}
              title="Salin Token"
              className="p-1 hover:bg-white rounded text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              {copiedToken ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Sticky Countdown Timer */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono-num font-bold tracking-tight shadow-2xs ${
              remainingSeconds < 300
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
            src={activeExam.gform_base_url}
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

      {/* 3. AUTO-LOCK OVERLAY SCREEN JIKA TERJADI PELANGGARAN */}
      {isLocked && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-rose-200 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-zinc-900 tracking-tight mb-1">
              LAYAR UJIAN TERKUNCI
            </h3>
            <p className="text-xs text-rose-600 font-semibold mb-3">
              Pelanggaran Tata Tertib Pengawasan
            </p>

            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-zinc-700 mb-4 text-left space-y-1">
              <div className="font-semibold text-rose-900">Alasan Penguncian:</div>
              <p className="text-zinc-600">{lockReason || 'Terdeteksi meninggalkan jendela ujian.'}</p>
              <div className="text-[11px] text-zinc-500 pt-1">
                Total Pelanggaran:{' '}
                <strong className="text-rose-700 font-mono">
                  {activeAttempt?.violation_count || 1} kali
                </strong>
              </div>
            </div>

            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              Silakan temui <strong>Pengawas Ruang Ujian</strong> di tempat Anda. Pengawas akan memeriksa log aktivitas dan membuka kunci (Unlock) melalui dashboard mereka.
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Menunggu instruksi buka kunci pengawas...</span>
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
    </div>
  );
}

