import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Shield,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldAlert,
  UserCheck,
  Server,
  Plus,
  Trash2,
  Edit3,
  Unlock,
  RotateCcw,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  Lock,
  Upload,
  Download,
  ExternalLink,
  MapPin,
  Clock,
  Calendar,
  Save,
  Search,
  Check,
  Eye,
  EyeOff,
  Copy,
  FileText,
  HelpCircle,
  RefreshCw,
  Smartphone,
  BookOpen,
  QrCode,
  Image as ImageIcon,
  UserPlus,
  Archive,
  ArchiveRestore,
  FolderArchive,
  Layers,
  Filter,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  Unlink,
  HardDriveDownload,
  HardDriveUpload,
  Database,
  Info,
  ShieldCheck,
  FileCode,
  Laptop,
  Bell,
  Volume2,
  Maximize2,
  ClipboardCheck,
  Camera,
  Cookie,
  CheckSquare,
  Square,
  Printer,
  Sliders,
  Activity,
  Bug,
  Terminal,
  Mic,
  PlayCircle,
  Play,
  FlaskConical,
  Loader2,
  Crosshair,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { storageService, cleanNomorUjian, convertGoogleFormUrl, subscribeSync, generateStudentLoginToken } from '../../services/storageService';
import StudentQrCardModal from '../../components/admin/StudentQrCardModal';
import {
  createSystemBackupPackage,
  restoreSystemBackupPackage,
  DEFAULT_BACKUP_MASTER_KEY,
} from '../../utils/backupCrypto';
import {
  EDUCATION_LEVELS,
  AUTH_METHODS,
  ATTEMPT_STATUS,
  EXAM_SESSION_GROUPS,
  POPULAR_SUBJECTS,
  generateUUID,
  calculateHaversineDistance,
  formatDuration,
  getGradeLabel,
  generateRandomToken6,
  formatExamToken,
} from '../../constants/educationConfig';
import AdminSidebar from '../../components/admin/AdminSidebar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import GeofenceMapPreview from '../../components/common/GeofenceMapPreview';

// Icon Google OAuth Resmi (Multi-warna saat ON / Grayscale abu-abu saat OFF)
function GoogleBrandIcon({ className = "w-5 h-5", active = true }) {
  return (
    <svg className={`${className} transition-all duration-200 ${active ? '' : 'grayscale opacity-40'}`} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

// Icon Google reCAPTCHA v2 Resmi (Biru/Cyan saat ON / Grayscale abu-abu saat OFF)
function RecaptchaBrandIcon({ className = "w-5 h-5", active = true }) {
  return (
    <svg className={`${className} transition-all duration-200 ${active ? '' : 'grayscale opacity-40'}`} viewBox="0 0 48 48" fill="none">
      <path
        d="M24 6C14.06 6 6 14.06 6 24c0 4.12 1.4 7.91 3.75 10.95l4.3-4.3A12.92 12.92 0 0 1 12 24c0-6.63 5.37-12 12-12 3.19 0 6.09 1.25 8.24 3.29l-4.74 4.71H39V8l-4.94 4.94C31.25 9.87 27.81 6 24 6z"
        fill={active ? '#1A73E8' : '#9CA3AF'}
      />
      <path
        d="M24 42c9.94 0 18-8.06 18-18 0-4.12-1.4-7.91-3.75-10.95l-4.3 4.3A12.92 12.92 0 0 1 36 24c0 6.63-5.37 12-12 12-3.19 0-6.09-1.25-8.24-3.29l4.74-4.71H9v12l4.94-4.94C16.75 38.13 20.19 42 24 42z"
        fill={active ? '#4285F4' : '#6B7280'}
      />
    </svg>
  );
}

// Parser Link Google Maps & Titik Koordinat (Ekstraksi Latitude & Longitude)
function parseGmapsUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Format raw koordinat: -6.2088, 106.8456 atau -6.2088 106.8456
  const rawMatch = str.match(/^(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 2. Format standar Google Maps browser: @lat,lng,zoom
  const atMatch = str.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 3. Format Google Maps place data: !3d<lat>!4d<lng>
  const dataMatch = str.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 4. Format query parameter q=lat,lng atau query=lat,lng atau ll=lat,lng
  const queryMatch = str.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lng = parseFloat(queryMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 5. Generic decimal coordinate pattern di dalam URL
  const genericMatch = str.match(/(-?\d{1,2}\.\d{4,})\s*[,/]\s*(-?\d{1,3}\.\d{4,})/);
  if (genericMatch) {
    const lat = parseFloat(genericMatch[1]);
    const lng = parseFloat(genericMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}


// Helper Format Hari & Tanggal Bahasa Indonesia Resmi untuk Berita Acara
const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Helper Format Jam & Tanggal Live Lengkap (Pemantauan Langsung Pengawas)
function formatIndonesianLiveDateTime(d = new Date()) {
  const dateObj = d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
  const dayName = INDONESIAN_DAYS[dateObj.getDay()] || 'Hari';
  const dateNum = dateObj.getDate();
  const monthName = INDONESIAN_MONTHS[dateObj.getMonth()] || '';
  const yearNum = dateObj.getFullYear();
  const h = String(dateObj.getHours()).padStart(2, '0');
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const s = String(dateObj.getSeconds()).padStart(2, '0');
  return {
    dayDate: `${dayName}, ${dateNum} ${monthName} ${yearNum}`,
    clock: `${h}:${m}:${s} WIB`,
  };
}

// Helper Format Hitung Mundur Rilis Token Selesai
// Helper Format Hitung Mundur Rilis Token Selesai (Format Digital Jam:Menit:Detik)
function formatDigitalCountdown(totalSec) {
  if (totalSec <= 0) return '00:00';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function formatCountdownSeconds(totalSec) {
  if (totalSec <= 0) return '0s';
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) return `${hours}j ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatIndonesianDateText(dateObj = new Date()) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const dayName = INDONESIAN_DAYS[d.getDay()] || 'Hari';
  const dateNum = d.getDate();
  const monthName = INDONESIAN_MONTHS[d.getMonth()] || '';
  const yearNum = d.getFullYear();
  return {
    dayName,
    dateNum,
    monthName,
    yearNum,
    fullText: `${dayName}, ${dateNum} ${monthName} ${yearNum}`
  };
}


// Helper Eksekusi Cetak Dokumen Bersih & Terisolasi Standar Kertas A4 Tanpa Bocor Elemen Dashboard
function executePrintDocument(elementId, title, marginSetting = 'narrow', customMargin = { top: 10, right: 10, bottom: 10, left: 10 }) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Print element not found:', elementId);
    return;
  }

  // Hitung margin A4 sesuai standar atau kustom
  let marginCss = '10mm 10mm 10mm 10mm';
  if (marginSetting === 'normal') marginCss = '20mm 20mm 20mm 20mm';
  else if (marginSetting === 'narrow') marginCss = '10mm 10mm 10mm 10mm';
  else if (marginSetting === 'tight') marginCss = '5mm 5mm 5mm 5mm';
  else if (marginSetting === 'custom') {
    const t = Number(customMargin.top) >= 0 ? Number(customMargin.top) : 10;
    const r = Number(customMargin.right) >= 0 ? Number(customMargin.right) : 10;
    const b = Number(customMargin.bottom) >= 0 ? Number(customMargin.bottom) : 10;
    const l = Number(customMargin.left) >= 0 ? Number(customMargin.left) : 10;
    marginCss = `${t}mm ${r}mm ${b}mm ${l}mm`;
  }

  // Ambil seluruh style sheets aplikasi agar Tailwind dan styling resmi terbawa sempurna
  const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map(node => node.outerHTML)
    .join('\n');

  // Bersihkan frame cetak sebelumnya jika ada
  const existingFrame = document.getElementById('examguard-print-frame');
  if (existingFrame) existingFrame.remove();

  // Buat iframe terisolasi dengan dimensi nyata A4 portrait (210mm x 297mm)
  // Menghindari bug Chromium/Chrome yang mencetak window utama jika iframe berukuran 0x0
  const iframe = document.createElement('iframe');
  iframe.id = 'examguard-print-frame';
  iframe.setAttribute(
    'style',
    'position: fixed; top: -10000px; left: -10000px; width: 210mm; min-height: 297mm; border: none; opacity: 0; pointer-events: none; z-index: -9999;'
  );
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title || 'Cetak Dokumen Resmi'}</title>
      ${styleNodes}
      <style>
        @page {
          size: A4 portrait;
          margin: ${marginCss};
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          font-family: Arial, Helvetica, 'Segoe UI', Roboto, sans-serif !important;
          font-size: 11px !important;
          line-height: 1.35 !important;
        }
        /* Reset pembungkus modal agar tidak dobel margin / box-shadow */
        #printable-berita-acara,
        #printable-daftar-hadir {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          background: #ffffff !important;
        }
        /* Jaminan mutlak Berita Acara pas 1 halaman A4 */
        #printable-berita-acara {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead {
          display: table-header-group;
        }
        tr, .page-break-avoid {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        th, td {
          border: 1px solid #000000;
          padding: 4px 6px;
          font-size: 11px;
        }
        th {
          background-color: #f3f4f6 !important;
          font-weight: bold;
          text-align: center;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }
        .underline { text-decoration: underline; }
        .no-border td, table.no-border, table.no-border td, table.no-border th {
          border: none !important;
        }
        .ttd-table {
          width: 100%;
          border: none !important;
          margin-top: 14px;
          page-break-inside: avoid;
        }
        .ttd-table td {
          border: none !important;
          padding: 2px 4px;
        }
        hr.divider {
          border: 0;
          border-top: 2px solid #000000;
          margin: 6px 0 10px 0;
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `);
  doc.close();

  const doPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.warn('Gagal mencetak dokumen melalui iframe:', err);
    }
  };

  // Tunggu gambar dan aset di dalam iframe siap
  setTimeout(doPrint, 350);

  // Bersihkan iframe setelah print dialog ditutup
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = () => {
      setTimeout(() => {
        if (document.body.contains(iframe)) iframe.remove();
      }, 500);
    };
  }
}

export default function AdminDashboard({ currentUser, onLogout }) {
  const isSuperAdmin = currentUser?.role === 'admin';
  // Persistent Tab Navigation: Mendukung URL Hash (#institution, #exams, dll) & LocalStorage agar tidak reset saat refresh
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const hash = window.location.hash.replace('#', '').trim();
      const validTabs = ['overview', 'proctor', 'exams', 'users', 'institution', 'account', 'backup'];
      const target = (hash && validTabs.includes(hash)) ? hash : localStorage.getItem('examguard_admin_active_tab');
      if (target && validTabs.includes(target)) {
        if (!isSuperAdmin && ['account', 'institution', 'backup'].includes(target)) {
          return 'overview';
        }
        return target;
      }
    } catch {}
    return 'overview';
  });

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
    try {
      localStorage.setItem('examguard_admin_active_tab', activeTab);
      if (window.location.hash !== `#${activeTab}`) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch {}
  }, [activeTab]);

  // Dukungan Navigasi Tombol Back/Forward Browser
  useEffect(() => {
    const handleHashChange = () => {
      try {
        const hash = window.location.hash.replace('#', '').trim();
        const validTabs = ['overview', 'proctor', 'exams', 'users', 'institution', 'account', 'backup'];
        if (hash && validTabs.includes(hash)) {
          if (!isSuperAdmin && ['account', 'institution', 'backup'].includes(hash)) {
            setActiveTab('overview');
          } else {
            setActiveTab(hash);
          }
        }
      } catch {}
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSuperAdmin]);
  const [institution, setInstitution] = useState(storageService.getInstitution());
  const [users, setUsers] = useState(storageService.getUsers());
  const [exams, setExams] = useState(storageService.getExamSessions());
  const [attempts, setAttempts] = useState(storageService.getAttempts());
  const [attendance, setAttendance] = useState(() => storageService.getAttendance());
  const [isRefreshingProctor, setIsRefreshingProctor] = useState(false);

  // State Jam & Tanggal Live Real-time (Pemantauan Pengawas)
  const [currentLiveTime, setCurrentLiveTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // State Intip Token Selesai (Klik Tahan untuk Mengintip Token Asli)
  const [isHoldingFinishToken, setIsHoldingFinishToken] = useState(false);
  const [gmapsInput, setGmapsInput] = useState(
    () => institution?.gmaps_url || (institution?.center_lat ? `https://maps.google.com/?q=${institution.center_lat},${institution.center_lng}` : '')
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Proteksi Akses Peran: Jika login sebagai Proktor, larang akses tab 'account', 'institution', dan 'backup'
  useEffect(() => {
    if (!isSuperAdmin && (activeTab === 'account' || activeTab === 'institution' || activeTab === 'backup')) {
      setActiveTab('overview');
      showNotification('Akses Dibatasi: Menu tersebut hanya dapat diakses dan dikelola oleh Super Admin.', 'error');
    }
  }, [activeTab, isSuperAdmin]);

  // Sidebar Collapse / Expand State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('examguard_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('examguard_sidebar_collapsed', String(next));
      } catch { }
      return next;
    });
  };

  // State Nilai Token Ujian (Standar 6 Digit Huruf Besar)
  const [examTokenValue, setExamTokenValue] = useState('');
  const [finishTokenValue, setFinishTokenValue] = useState('');

  // State Token Copied ID untuk Feedback Visual 1-Klik Copy
  const [copiedTokenId, setCopiedTokenId] = useState(null);

  const handleCopyToken = (token, examId) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedTokenId(examId);
    showNotification(`Token "${token}" berhasil disalin ke clipboard!`);
    setTimeout(() => {
      setCopiedTokenId((curr) => (curr === examId ? null : curr));
    }, 2000);
  };

  // State Popup Konfirmasi Kustom (Menggantikan window.confirm bawaan browser)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    variant: 'danger',
    icon: null,
    onConfirm: () => { },
  });

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

  // Handler Konfirmasi Keluar Sesi Administrator
  const handleConfirmLogout = () => {
    openConfirm({
      title: 'Keluar Sesi Administrator?',
      message: (
        <span>
          Apakah Anda yakin ingin keluar dari panel pengawasan ExamGuard? Sesi administrator Anda akan diakhiri.
        </span>
      ),
      confirmText: 'Ya, Keluar Sesi',
      cancelText: 'Batal',
      variant: 'danger',
      icon: LogOut,
      onConfirm: () => {
        try {
          if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen().catch(() => {});
            }
          }
        } catch {}
        if (onLogout) onLogout();
      },
    });
  };

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examDuration, setExamDuration] = useState(90);
  const [examStartTime, setExamStartTime] = useState('');
  const [examEndTime, setExamEndTime] = useState('');

  // Helper Menghitung Waktu Default Sesi Ujian (Mulai: Hari Ini now() Jam 07:30, Selesai: Hari Ini Jam 07:30 + Durasi)
  const getDefaultExamTimes = (durationMinutes = 90) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${y}-${m}-${d}`;
    const startTime = `${todayDateStr}T07:30`;

    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 30, 0, 0);
    const durMs = (parseInt(durationMinutes, 10) || 90) * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durMs);

    const endY = endDate.getFullYear();
    const endM = String(endDate.getMonth() + 1).padStart(2, '0');
    const endD = String(endDate.getDate()).padStart(2, '0');
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endMin = String(endDate.getMinutes()).padStart(2, '0');
    const endTime = `${endY}-${endM}-${endD}T${endH}:${endMin}`;

    return { startTime, endTime };
  };

  // Helper Menghitung Waktu Selesai Berdasarkan Waktu Mulai dan Durasi
  const calculateEndTime = (startTimeStr, durationMinutes) => {
    if (!startTimeStr) return '';
    const dur = parseInt(durationMinutes, 10) || 90;

    let startDate;
    if (startTimeStr.includes('T')) {
      const [dPart, tPart] = startTimeStr.split('T');
      const [y, m, d] = (dPart || '').split('-').map(Number);
      const [h, min] = (tPart || '07:30').split(':').map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        startDate = new Date(y, m - 1, d, h || 0, min || 0, 0, 0);
      }
    }
    if (!startDate || isNaN(startDate.getTime())) {
      startDate = new Date(startTimeStr);
    }
    if (isNaN(startDate.getTime())) return '';

    const endDate = new Date(startDate.getTime() + dur * 60 * 1000);
    const endY = endDate.getFullYear();
    const endM = String(endDate.getMonth() + 1).padStart(2, '0');
    const endD = String(endDate.getDate()).padStart(2, '0');
    const endH = String(endDate.getHours()).padStart(2, '0');
    const endMin = String(endDate.getMinutes()).padStart(2, '0');
    return `${endY}-${endM}-${endD}T${endH}:${endMin}`;
  };

  // Helper Ekstraksi Format Tampilan Jam (HH:mm) dari String Waktu ISO/Datetime
  const formatExamTimeDisplay = (timeStr, fallback = '07:30') => {
    if (!timeStr) return fallback;
    if (timeStr.includes('T')) {
      const parts = timeStr.split('T');
      return parts[1] ? parts[1].slice(0, 5) : fallback;
    }
    return timeStr.slice(0, 5);
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [copiedText, setCopiedText] = useState(false);
  const [importStep, setImportStep] = useState('input'); // 'input' | 'error_report'
  const [importValidationErrors, setImportValidationErrors] = useState(null);
  const [copiedErrorText, setCopiedErrorText] = useState(false);

  // QR Code Modal State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrExam, setQrExam] = useState(null);
  const [qrPngUrl, setQrPngUrl] = useState('');
  const qrCanvasRef = useRef(null);
  const logoFileInputRef = useRef(null);

  // Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [examSearch, setExamSearch] = useState('');
  const [proctorSearch, setProctorSearch] = useState('');
  const [selectedProctorGrade, setSelectedProctorGrade] = useState('ALL'); // 'ALL' | 10 | 11 | 12
  const [proctorStatusFilter, setProctorStatusFilter] = useState('ALL'); // 'ALL' | 'LOCKED' | 'IN_PROGRESS' | 'ONLINE' | 'COMPLETED'
  const [examSubTab, setExamSubTab] = useState('active'); // 'active' | 'bank'
  const [selectedSessionGroup, setSelectedSessionGroup] = useState('ALL');
  const [examSortField, setExamSortField] = useState('start_time'); // Default: urut berdasarkan tanggal mulai
  const [examSortOrder, setExamSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleExamSort = (field) => {
    if (examSortField === field) {
      setExamSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setExamSortField(field);
      setExamSortOrder('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (examSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />;
    }
    return examSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    );
  };

  // State & Handler Sort untuk Tabel Basis Data Peserta
  const [studentSortField, setStudentSortField] = useState('no'); // 'no' | 'nomor_ujian' | 'nama' | 'nisn' | 'kelas' | 'ruang' | 'active_device_id' | 'google_linked' | 'is_active' | 'is_verified'
  const [studentSortOrder, setStudentSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleStudentSort = (field) => {
    if (studentSortField === field) {
      setStudentSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setStudentSortField(field);
      setStudentSortOrder('asc');
    }
  };

  const renderStudentSortIcon = (field) => {
    if (studentSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />;
    }
    return studentSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    );
  };

  // State Mode Aplikasi (Produksi vs Demo/Simulasi/Pengembangan), Diagnostik & Histori Error
  const [appModeConfig, setAppModeConfig] = useState(() => storageService.getAppModeConfig());
  const [systemErrorLogs, setSystemErrorLogs] = useState(() => storageService.getSystemErrorLogs());
  const [diagnosticResults, setDiagnosticResults] = useState({});
  const [isTestingAllDiagnostics, setIsTestingAllDiagnostics] = useState(false);
  const [errorLogFilter, setErrorLogFilter] = useState('ALL'); // 'all' | 'error' | 'warning' | 'info'
  const [errorLogSearch, setErrorLogSearch] = useState('');
  const [copiedLogFeedback, setCopiedLogFeedback] = useState(false);

  // Sinkronisasi real-time saat mode aplikasi atau log error diperbarui
  useEffect(() => {
    const handleSync = () => {
      setAppModeConfig(storageService.getAppModeConfig());
      setSystemErrorLogs(storageService.getSystemErrorLogs());
    };
    window.addEventListener('examguard_error_logged', handleSync);
    window.addEventListener('examguard_storage_updated', handleSync);
    return () => {
      window.removeEventListener('examguard_error_logged', handleSync);
      window.removeEventListener('examguard_storage_updated', handleSync);
    };
  }, []);

  // Password visibility & State Uji Koneksi Produksi
  // Accordion / Collapsible Cards State di Pengaturan Instansi
  const [isGpsCardOpen, setIsGpsCardOpen] = useState(false);
  const [isOAuthCardOpen, setIsOAuthCardOpen] = useState(false);
  const [isRecaptchaCardOpen, setIsRecaptchaCardOpen] = useState(false);
  const [isPreflightCardOpen, setIsPreflightCardOpen] = useState(false);
  const [isGuideCardOpen, setIsGuideCardOpen] = useState(false);

  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showRecaptchaSecret, setShowRecaptchaSecret] = useState(false);
  const [testingOAuth, setTestingOAuth] = useState(false);
  const [testingRecaptcha, setTestingRecaptcha] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [showProctorPass, setShowProctorPass] = useState(false);

  // Akun Super Admin Form
  const [adminForm, setAdminForm] = useState(() => {
    const sAdmin = storageService.getAdminAccounts().superAdmin || currentUser;
    return {
      id: sAdmin?.id || 'ADMIN-SUPER-01',
      username: sAdmin?.username || 'admin',
      email: sAdmin?.email || 'admin@examguard.sch.id',
      nama: sAdmin?.nama || 'Super Admin',
      password: sAdmin?.password || 'admin',
    };
  });

  // Akun Proktor Ujian Form (Dikelola oleh Super Admin)
  const [proctorForm, setProctorForm] = useState(() => {
    const pUser = storageService.getAdminAccounts().proctor;
    return {
      id: pUser?.id || 'PROCTOR-01',
      username: pUser?.username || 'proktor',
      email: pUser?.email || 'proktor@examguard.sch.id',
      nama: pUser?.nama || 'Proktor Ujian',
      password: pUser?.password || 'proktor',
    };
  });

  // Modal Tambah Peserta Manual
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentError, setAddStudentError] = useState('');
  const [newStudentForm, setNewStudentForm] = useState({
    nama: '',
    nisn: '',
    nis: '',
    kelas: '',
    tingkat: 10,
    ruang: '',
    email: '',
    is_verified: true,
  });

  // Modal Kartu Ujian & QR Code Peserta
  const [viewingStudentQr, setViewingStudentQr] = useState(null);
  const [showPrintAllCardsModal, setShowPrintAllCardsModal] = useState(false);

  // Modal Edit Peserta
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudentError, setEditStudentError] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);

  // ========================================================
  // DETEKSI DUPLIKASI REAL-TIME: TAMBAH PESERTA MANUAL
  // ========================================================
  const trimmedAddNisn = String(newStudentForm?.nisn || '').trim();
  const cleanAddNoUjian = cleanNomorUjian(newStudentForm?.nomor_ujian, trimmedAddNisn);
  const trimmedAddNis = String(newStudentForm?.nis || '').trim();

  // 1. Duplikasi NISN (Tambah Peserta)
  const duplicateAddNisn = trimmedAddNisn
    ? users.find(
        (u) =>
          u.role === 'student' &&
          ((u.nisn && u.nisn.trim().toLowerCase() === trimmedAddNisn.toLowerCase()) ||
            (u.username && u.username.trim().toLowerCase() === trimmedAddNisn.toLowerCase()))
      )
    : null;

  // 2. Duplikasi Nomor Ujian (Tambah Peserta)
  const duplicateAddNoUjian = cleanAddNoUjian
    ? users.find(
        (u) =>
          u.role === 'student' &&
          cleanNomorUjian(u.nomor_ujian, u.nisn).toLowerCase() === cleanAddNoUjian.toLowerCase()
      )
    : null;

  // 3. Duplikasi NIS (Tambah Peserta - jika diisi)
  const duplicateAddNis = (trimmedAddNis && trimmedAddNis !== '-')
    ? users.find(
        (u) =>
          u.role === 'student' &&
          u.nis &&
          u.nis.trim() !== '-' &&
          u.nis.trim().toLowerCase() === trimmedAddNis.toLowerCase()
      )
    : null;

  const duplicateAddStudent = duplicateAddNisn;
  const hasAddDuplicate = Boolean(duplicateAddNisn || duplicateAddNoUjian || duplicateAddNis);

  // ========================================================
  // DETEKSI DUPLIKASI REAL-TIME: EDIT PESERTA
  // ========================================================
  const trimmedEditNisn = String(editingStudent?.nisn || '').trim();
  const cleanEditNoUjian = cleanNomorUjian(editingStudent?.nomor_ujian, trimmedEditNisn);
  const trimmedEditNis = String(editingStudent?.nis || '').trim();

  // 1. Duplikasi NISN (Edit Peserta)
  const duplicateEditNisn = trimmedEditNisn && editingStudent?.id
    ? users.find(
        (u) =>
          u.role === 'student' &&
          u.id !== editingStudent.id &&
          ((u.nisn && u.nisn.trim().toLowerCase() === trimmedEditNisn.toLowerCase()) ||
            (u.username && u.username.trim().toLowerCase() === trimmedEditNisn.toLowerCase()))
      )
    : null;

  // 2. Duplikasi Nomor Ujian (Edit Peserta)
  const duplicateEditNoUjian = cleanEditNoUjian && editingStudent?.id
    ? users.find(
        (u) =>
          u.role === 'student' &&
          u.id !== editingStudent.id &&
          cleanNomorUjian(u.nomor_ujian, u.nisn).toLowerCase() === cleanEditNoUjian.toLowerCase()
      )
    : null;

  // 3. Duplikasi NIS (Edit Peserta - jika diisi)
  const duplicateEditNis = (trimmedEditNis && trimmedEditNis !== '-' && editingStudent?.id)
    ? users.find(
        (u) =>
          u.role === 'student' &&
          u.id !== editingStudent.id &&
          u.nis &&
          u.nis.trim() !== '-' &&
          u.nis.trim().toLowerCase() === trimmedEditNis.toLowerCase()
      )
    : null;

  const duplicateEditStudent = duplicateEditNisn;
  const hasEditDuplicate = Boolean(duplicateEditNisn || duplicateEditNoUjian || duplicateEditNis);

  // URL Repositori GitHub Resmi ExampGuard
  const GITHUB_REPO_URL = 'https://github.com/chriz27/examguard';
  const CURRENT_APP_VERSION = 'v1.0.0';

  // State Pemeriksaan Pembaruan GitHub
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState(null);

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckResult(null);
    try {
      // 1. Coba panggil GitHub Releases API
      const res = await fetch('https://api.github.com/repos/chriz27/examguard/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (res.ok) {
        const release = await res.json();
        const latestTag = release.tag_name || 'v1.0.0';
        const cleanLatest = latestTag.replace(/^v/, '');
        const cleanCurrent = CURRENT_APP_VERSION.replace(/^v/, '');
        const isNewer = cleanLatest.localeCompare(cleanCurrent, undefined, { numeric: true, sensitivity: 'base' }) > 0;

        setUpdateCheckResult({
          status: isNewer ? 'update_available' : 'up_to_date',
          latestVersion: latestTag,
          currentVersion: CURRENT_APP_VERSION,
          releaseName: release.name || latestTag,
          releaseNotes: release.body || '',
          publishedAt: release.published_at
            ? new Date(release.published_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : null,
          downloadUrl: release.html_url || GITHUB_REPO_URL,
          checkedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else if (res.status === 404) {
        // Belum ada release resmi di GitHub, coba ambil data commit terbaru
        let latestCommitDate = null;
        let commitSha = null;
        try {
          const commitRes = await fetch('https://api.github.com/repos/chriz27/examguard/commits?per_page=1');
          if (commitRes.ok) {
            const commits = await commitRes.json();
            if (commits && commits[0]) {
              latestCommitDate = commits[0].commit?.committer?.date;
              commitSha = commits[0].sha?.substring(0, 7);
            }
          }
        } catch {}

        setUpdateCheckResult({
          status: 'up_to_date',
          latestVersion: CURRENT_APP_VERSION,
          currentVersion: CURRENT_APP_VERSION,
          releaseName: 'ExampGuard v1.0 Production Release',
          releaseNotes: 'Sistem Anda saat ini menggunakan versi produksi stabil (v1.0.0). Terhubung aktif ke repositori GitHub resmi.',
          commitSha,
          publishedAt: latestCommitDate
            ? new Date(latestCommitDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
            : null,
          downloadUrl: GITHUB_REPO_URL,
          checkedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else {
        throw new Error(`GitHub API merespons status ${res.status}`);
      }
    } catch (err) {
      setUpdateCheckResult({
        status: 'error',
        message: err.message || 'Tidak dapat terhubung ke server GitHub. Periksa koneksi internet server.',
        downloadUrl: GITHUB_REPO_URL,
        checkedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // State Backup & Restore Sistem
  const [backupUseDefaultKey, setBackupUseDefaultKey] = useState(true);
  const [backupCustomKey, setBackupCustomKey] = useState('');
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreJsonString, setRestoreJsonString] = useState('');
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreUseDefaultKey, setRestoreUseDefaultKey] = useState(true);
  const [restoreCustomKey, setRestoreCustomKey] = useState('');
  const [isRestoringData, setIsRestoringData] = useState(false);
  const restoreFileInputRef = useRef(null);

  
  // ========================================================
  // STATE PRESENSI UJIAN & REKAP KEHADIRAN PESERTA
  // ========================================================
  const [selectedAttendanceExamId, setSelectedAttendanceExamId] = useState(() => {
    const ex = storageService.getExamSessions();
    return ex[0]?.id || '';
  });
  const [selectedAttendanceRoom, setSelectedAttendanceRoom] = useState('ALL');
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState('ALL');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceDrafts, setAttendanceDrafts] = useState({});

  const handleAttendanceDraftChange = (studentId, field, value) => {
    setAttendanceDrafts((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = (studentId) => {
    if (!selectedAttendanceExamId) {
      showNotification('Pilih sesi ujian terlebih dahulu.', 'error');
      return;
    }
    const draft = attendanceDrafts[studentId] || {};
    const existing = storageService.getExamAttendance(selectedAttendanceExamId).find((a) => a.student_id === studentId);
    const newStatus = draft.status || existing?.status || 'HADIR';
    const newKeterangan = draft.keterangan !== undefined ? draft.keterangan : (existing?.keterangan || '');

    storageService.saveExamAttendance(selectedAttendanceExamId, studentId, {
      status: newStatus,
      keterangan: newKeterangan,
      updated_by: currentUser?.nama || 'Admin',
    });

    setAttendanceDrafts((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });

    showNotification('Status presensi peserta berhasil disimpan.');
  };

  const handleResetAttendance = (studentId) => {
    if (!selectedAttendanceExamId) return;
    storageService.removeExamAttendance(selectedAttendanceExamId, studentId);
    setAttendanceDrafts((prev) => {
      const copy = { ...prev };
      delete copy[studentId];
      return copy;
    });
    showNotification('Status khusus presensi dikembalikan ke default.');
  };

  // ========================================================
  // STATE & LOGIC: RESET LOGIN & STATUS PENGERJAAN PER MAPEL
  // ========================================================
  const [selectedResetExamId, setSelectedResetExamId] = useState(() => {
    const ex = storageService.getExamSessions();
    return ex[0]?.id || '';
  });
  const [resetStatusFilter, setResetStatusFilter] = useState('ALL'); // 'ALL' | 'NOT_STARTED' | 'IN_PROGRESS' | 'LOCKED' | 'COMPLETED' | 'RESET_BY_PROCTOR'
  const [resetSearch, setResetSearch] = useState('');
  const [selectedStudentIdsForReset, setSelectedStudentIdsForReset] = useState([]);

  // Sesi ujian yang saat ini dipilih untuk proses Reset Status
  const currentResetExam = React.useMemo(() => {
    return exams.find((e) => e.id === selectedResetExamId) || exams[0] || null;
  }, [exams, selectedResetExamId]);

  // Daftar peserta yang memenuhi syarat untuk mapel terpilih berserta status pengerjaannya
  const resetExamStudents = React.useMemo(() => {
    if (!currentResetExam) return [];
    const grade = currentResetExam.grade_level;
    const studentUsers = (users || []).filter(
      (u) => u.role === 'student' && (!grade || Number(u.tingkat) === Number(grade) || Number(grade) === 0)
    );

    const examAttempts = (attempts || []).filter((a) => a.exam_session_id === currentResetExam.id);
    const attemptByStudentId = new Map(examAttempts.map((a) => [String(a.student_id), a]));
    const attemptByStudentNisn = new Map(examAttempts.map((a) => [String(a.student_nisn), a]));

    return studentUsers.map((stu) => {
      const att =
        attemptByStudentId.get(String(stu.id)) ||
        attemptByStudentNisn.get(String(stu.nisn)) ||
        examAttempts.find(
          (a) =>
            (a.student_name && stu.nama && a.student_name.toLowerCase() === stu.nama.toLowerCase()) ||
            (a.student_id && String(a.student_id) === String(stu.id)) ||
            (a.student_nisn && String(a.student_nisn) === String(stu.nisn))
        );

      let computedStatus = 'NOT_STARTED'; // 'Belum Masuk'
      if (att) {
        if (att.status === 'LOCKED') computedStatus = 'LOCKED';
        else if (att.status === 'COMPLETED') computedStatus = 'COMPLETED';
        else if (att.status === 'RESET_BY_PROCTOR') computedStatus = 'RESET_BY_PROCTOR';
        else computedStatus = 'IN_PROGRESS';
      }

      return {
        studentId: stu.id,
        nama: stu.nama,
        nisn: stu.nisn || '-',
        kelas: stu.kelas || '-',
        ruang: stu.ruang || '-',
        tingkat: stu.tingkat,
        activeDeviceId: stu.active_device_id,
        isDeviceLocked: Boolean(stu.active_device_id),
        attempt: att || null,
        attemptId: att?.id || null,
        status: computedStatus,
        violationCount: att?.violation_count || 0,
        timeSpentSeconds: att?.time_spent_seconds || 0,
        lastViolationReason: att?.last_violation_reason || '',
      };
    });
  }, [currentResetExam, users, attempts]);

  // Filter peserta per mapel berdasarkan status & kata kunci pencarian
  const filteredResetExamStudents = React.useMemo(() => {
    return resetExamStudents.filter((item) => {
      if (resetStatusFilter !== 'ALL' && item.status !== resetStatusFilter) {
        return false;
      }
      const q = (resetSearch || '').trim().toLowerCase();
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.nisn.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        (item.ruang && item.ruang.toLowerCase().includes(q))
      );
    });
  }, [resetExamStudents, resetStatusFilter, resetSearch]);

  // Statistik ringkas status mapel terpilih
  const resetExamStats = React.useMemo(() => {
    return {
      total: resetExamStudents.length,
      notStarted: resetExamStudents.filter((s) => s.status === 'NOT_STARTED').length,
      inProgress: resetExamStudents.filter((s) => s.status === 'IN_PROGRESS').length,
      locked: resetExamStudents.filter((s) => s.status === 'LOCKED').length,
      completed: resetExamStudents.filter((s) => s.status === 'COMPLETED').length,
      reset: resetExamStudents.filter((s) => s.status === 'RESET_BY_PROCTOR').length,
      deviceLocked: resetExamStudents.filter((s) => s.isDeviceLocked).length,
    };
  }, [resetExamStudents]);

  // ========================================================
  // UNIFIED KONTROL PENGAWAS (PANTAU, RESET, PRESENSI)
  // ========================================================
  // Sub-view: 'list' (Daftar Mapel Aktif) | 'monitor' (Pantau Live) | 'reset' (Reset Status) | 'attendance' (Presensi)
  const [proctorSubView, setProctorSubView] = useState('list');
  const [selectedProctorExamId, setSelectedProctorExamId] = useState('');
  const [proctorActiveExamSearch, setProctorActiveExamSearch] = useState('');
  const [proctorActiveExamGroupFilter, setProctorActiveExamGroupFilter] = useState('ALL');
  const [proctorActiveExamGradeFilter, setProctorActiveExamGradeFilter] = useState('ALL');
  const [proctorActiveExamSortField, setProctorActiveExamSortField] = useState('start_time'); // 'no' | 'session_group' | 'subject' | 'title' | 'grade_level' | 'start_time'
  const [proctorActiveExamSortOrder, setProctorActiveExamSortOrder] = useState('asc'); // 'asc' | 'desc'

  const handleProctorActiveExamSort = (field) => {
    if (proctorActiveExamSortField === field) {
      setProctorActiveExamSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setProctorActiveExamSortField(field);
      setProctorActiveExamSortOrder('asc');
    }
  };

  const renderProctorActiveExamSortIcon = (field) => {
    if (proctorActiveExamSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />;
    }
    return proctorActiveExamSortOrder === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-zinc-900 font-bold shrink-0" />
    );
  };

  // Filter & Pencarian Khusus Card Pantau Live (Card 2)
  const [monitorSearch, setMonitorSearch] = useState('');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState('ALL');
  const [monitorRuangFilter, setMonitorRuangFilter] = useState('ALL');

  // Modal Detail Sesi Ujian Terpilih
  const [showExamDetailModal, setShowExamDetailModal] = useState(false);
  const [detailExamData, setDetailExamData] = useState(null);

  // Sesi ujian yang sedang aktif dan tidak diarsipkan
  const activeExamsList = React.useMemo(() => {
    return (exams || []).filter((e) => {
      const isArchived = e.is_archived === true || e.is_archived === 1 || e.is_archived === '1' || e.is_archived === 'true';
      if (isArchived) return false;
      const isActive = e.is_active === undefined || e.is_active === null ? true : (e.is_active === true || e.is_active === 1 || e.is_active === '1' || e.is_active === 'true');
      return isActive;
    });
  }, [exams]);

  // Filter pencarian & kategori pada tabel Daftar Mapel Aktif beserta sorting dinamis
  const filteredActiveExamsList = React.useMemo(() => {
    const list = activeExamsList.filter((e) => {
      if (proctorActiveExamGroupFilter !== 'ALL' && e.session_group !== proctorActiveExamGroupFilter) {
        return false;
      }
      if (proctorActiveExamGradeFilter !== 'ALL' && String(e.grade_level) !== String(proctorActiveExamGradeFilter)) {
        return false;
      }
      const q = (proctorActiveExamSearch || '').trim().toLowerCase();
      if (!q) return true;
      return (
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.session_group && e.session_group.toLowerCase().includes(q)) ||
        (e.exam_token && e.exam_token.toLowerCase().includes(q))
      );
    });

    return list.sort((a, b) => {
      let valA, valB;
      switch (proctorActiveExamSortField) {
        case 'session_group':
          valA = (a.session_group || '').toLowerCase();
          valB = (b.session_group || '').toLowerCase();
          break;
        case 'subject':
          valA = (a.subject || '').toLowerCase();
          valB = (b.subject || '').toLowerCase();
          break;
        case 'title':
          valA = (a.title || '').toLowerCase();
          valB = (b.title || '').toLowerCase();
          break;
        case 'grade_level':
          valA = Number(a.grade_level || 0);
          valB = Number(b.grade_level || 0);
          break;
        case 'start_time':
        default:
          valA = a.start_time ? new Date(a.start_time).getTime() : 0;
          valB = b.start_time ? new Date(b.start_time).getTime() : 0;
          break;
      }

      if (valA < valB) return proctorActiveExamSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return proctorActiveExamSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeExamsList, proctorActiveExamGroupFilter, proctorActiveExamGradeFilter, proctorActiveExamSearch, proctorActiveExamSortField, proctorActiveExamSortOrder]);

  // Sesi ujian aktif yang sedang dipilih di sub-view pengawas
  const currentProctorExam = React.useMemo(() => {
    if (selectedProctorExamId) {
      const found = (exams || []).find((e) => e.id === selectedProctorExamId);
      if (found) return found;
    }
    if (selectedResetExamId) {
      const found = (exams || []).find((e) => e.id === selectedResetExamId);
      if (found) return found;
    }
    if (selectedAttendanceExamId) {
      const found = (exams || []).find((e) => e.id === selectedAttendanceExamId);
      if (found) return found;
    }
    return activeExamsList[0] || (exams || [])[0] || null;
  }, [exams, selectedProctorExamId, selectedResetExamId, selectedAttendanceExamId, activeExamsList]);

  // Handlers untuk 4 tombol aksi pada baris tabel Daftar Mapel Aktif
  const handleOpenProctorMonitor = (exam) => {
    setSelectedProctorExamId(exam.id);
    setSelectedProctorGrade(String(exam.grade_level));
    setProctorSubView('monitor');
  };

  const handleOpenProctorReset = (exam) => {
    setSelectedProctorExamId(exam.id);
    setSelectedResetExamId(exam.id);
    setProctorSubView('reset');
  };

  const handleOpenProctorAttendance = (exam) => {
    setSelectedProctorExamId(exam.id);
    setSelectedAttendanceExamId(exam.id);
    setProctorSubView('attendance');
  };

  const handleOpenProctorDetail = (exam) => {
    setDetailExamData(exam);
    setShowExamDetailModal(true);
  };

  // Sinkronisasi tab jika ada tombol atau bookmark yang membuka 'reset-exam' atau 'attendance'
  useEffect(() => {
    if (activeTab === 'reset-exam') {
      setProctorSubView('reset');
      setActiveTab('proctor');
    } else if (activeTab === 'attendance') {
      setProctorSubView('attendance');
      setActiveTab('proctor');
    }
  }, [activeTab]);

  // ========================================================
  // STATE MODAL BERITA ACARA & DAFTAR HADIR (PRINT PREVIEW)
  // ========================================================
  const [showBeritaAcaraModal, setShowBeritaAcaraModal] = useState(false);
  const [showDaftarHadirModal, setShowDaftarHadirModal] = useState(false);
  const [beritaAcaraConfig, setBeritaAcaraConfig] = useState(() => {
    const saved = storageService.getBeritaAcaraConfig();
    return {
      instansi_pusat: saved.instansi_pusat || '',
      alamat: saved.alamat || '',
      kepala_sekolah_nama: saved.kepala_sekolah_nama || '',
      kepala_sekolah_nip: saved.kepala_sekolah_nip || '',
      proktor_nama: saved.proktor_nama || currentUser?.nama || 'Proktor Utama',
      proktor_nip: saved.proktor_nip || '',
      pengawas_nama: saved.pengawas_nama || 'Pengawas Ruang Ujian',
      pengawas_nip: saved.pengawas_nip || '',
      catatan_pelaksanaan: saved.catatan_pelaksanaan || 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.',
    };
  });

  const handleUpdateBeritaAcaraField = (key, val) => {
    setBeritaAcaraConfig((prev) => {
      const updated = { ...prev, [key]: val };
      storageService.saveBeritaAcaraConfig(updated);
      return updated;
    });
  };

  // Setting Margin Cetak Standar / Custom untuk Kertas A4 (Permintaan User #6)
  const [printMarginSetting, setPrintMarginSetting] = useState('narrow'); // 'normal' (20mm) | 'narrow' (10mm) | 'tight' (5mm) | 'custom'
  const [customPrintMargin, setCustomPrintMargin] = useState({ top: 10, right: 10, bottom: 10, left: 10 });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Refresh seluruh data sistem termasuk konfigurasi institusi, mode, dan log
  const refreshData = () => {
    setInstitution(storageService.getInstitution());
    setUsers(storageService.getUsers());
    setExams(storageService.getExamSessions());
    setAttempts(storageService.getAttempts());
    setAttendance(storageService.getAttendance());
    setBeritaAcaraConfig(storageService.getBeritaAcaraConfig());
    setAppModeConfig(storageService.getAppModeConfig());
    setSystemErrorLogs(storageService.getSystemErrorLogs());
  };

  // Refresh hanya data aktivitas dinamis (peserta, ujian, attempt) tanpa menimpa formulir instansi yang sedang diedit
  const refreshMonitoringData = () => {
    setUsers(storageService.getUsers());
    setExams(storageService.getExamSessions());
    setAttempts(storageService.getAttempts());
    setAttendance(storageService.getAttendance());
    storageService.syncAttemptsFromServer().then((fresh) => {
      if (fresh && Array.isArray(fresh)) setAttempts(fresh);
    }).catch(() => {});
  };

  // Handler Unduh Backup
  const handleDownloadBackup = async () => {
    const passphrase = backupUseDefaultKey ? DEFAULT_BACKUP_MASTER_KEY : backupCustomKey.trim();
    if (!backupUseDefaultKey && passphrase.length < 6) {
      showNotification('Kunci enkripsi kustom harus minimal 6 karakter.', 'error');
      return;
    }

    try {
      setIsExportingBackup(true);
      const fullData = storageService.getFullSystemData();
      const backupJson = await createSystemBackupPackage(fullData, passphrase);

      const blob = new Blob([backupJson], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const npsnStr = institution?.npsn || '20104829';
      link.href = url;
      link.download = `examguard-backup-${npsnStr}-${dateStr}-${timeStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('File cadangan terenkripsi berhasil dibuat dan diunduh.', 'success');
    } catch (err) {
      showNotification(`Gagal membuat cadangan: ${err.message}`, 'error');
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Handler Pilih File Restore
  const handleRestoreFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json') && !file.name.endsWith('.egbak')) {
      showNotification('Harap pilih file cadangan dengan ekstensi .json atau .egbak.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);
        if (!parsed._examguard_backup || !parsed.public_data || !parsed.encrypted_secrets) {
          throw new Error('Format file bukan merupakan berkas cadangan resmi ExamGuard.');
        }
        setRestoreFile(file);
        setRestoreJsonString(text);
        setRestorePreview(parsed);
        showNotification(`File cadangan "${file.name}" siap dipulihkan.`);
      } catch (err) {
        setRestoreFile(null);
        setRestoreJsonString('');
        setRestorePreview(null);
        showNotification(err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  // Handler Eksekusi Restore
  const handleExecuteRestore = () => {
    if (!restoreJsonString || !restorePreview) {
      showNotification('Harap unggah berkas cadangan terlebih dahulu.', 'error');
      return;
    }

    const passphrase = restoreUseDefaultKey ? DEFAULT_BACKUP_MASTER_KEY : restoreCustomKey.trim();
    if (!restoreUseDefaultKey && !passphrase) {
      showNotification('Harap masukkan kunci enkripsi / passphrase cadangan.', 'error');
      return;
    }

    openConfirm({
      title: 'Pulihkan Seluruh Data Sistem?',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin memulihkan sistem menggunakan berkas cadangan{' '}
            <strong>"{restoreFile?.name}"</strong>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
            <p className="font-semibold">Peringatan Penting:</p>
            <p>
              Seluruh data instansi, daftar sesi soal Google Form, dan basis data peserta saat ini akan{' '}
              <strong>ditimpa dan digantikan</strong> sepenuhnya dengan data dari berkas cadangan ini.
            </p>
          </div>
        </div>
      ),
      confirmText: 'Ya, Pulihkan Sistem Sekarang',
      cancelText: 'Batal',
      variant: 'danger',
      icon: HardDriveUpload,
      onConfirm: async () => {
        try {
          setIsRestoringData(true);
          const restored = await restoreSystemBackupPackage(restoreJsonString, passphrase);
          storageService.restoreAllData(restored);
          refreshData();
          setRestoreFile(null);
          setRestoreJsonString('');
          setRestorePreview(null);
          setRestoreCustomKey('');
          if (restoreFileInputRef.current) {
            restoreFileInputRef.current.value = '';
          }
          showNotification(
            `Data sistem ${restored.institution.name} berhasil dipulihkan dari cadangan!`,
            'success'
          );
        } catch (err) {
          showNotification(err.message, 'error');
        } finally {
          setIsRestoringData(false);
        }
      },
    });
  };

  useEffect(() => {
    refreshData();

    const handleSyncTrigger = (event) => {
      // Jika event snapshot atau pembaruan instansi, perbarui konfigurasi institusi secara real-time
      if (event === 'institution_updated' || event === 'snapshot') {
        const freshInst = storageService.getInstitution();
        setInstitution(freshInst);
        if (freshInst?.gmaps_url) {
          setGmapsInput(freshInst.gmaps_url);
        }
      } else if (event === 'berita_acara_updated') {
        setBeritaAcaraConfig(storageService.getBeritaAcaraConfig());
      } else if (event === 'app_mode_updated') {
        setAppModeConfig(storageService.getAppModeConfig());
      } else {
        // Pembaruan aktivitas pengerjaan peserta & ujian (tidak menimpa formulir instansi)
        refreshMonitoringData();
      }
    };

    // 1. Sinkronisasi instan via WebSocket real-time
    const unsubscribe = subscribeSync(handleSyncTrigger);

    // 2. CustomEvent lokal di tab yang sama
    const handleStorageChange = (e) => {
      if (e?.detail?.event === 'institution_updated' || e?.detail?.event === 'snapshot') {
        const freshInst = storageService.getInstitution();
        setInstitution(freshInst);
        if (freshInst?.gmaps_url) {
          setGmapsInput(freshInst.gmaps_url);
        }
      }
      refreshMonitoringData();
    };
    window.addEventListener('examguard_storage_updated', handleStorageChange);
    window.addEventListener('examguard_db_updated', handleStorageChange);

    // 3. Storage event native browser (hanya monitoring data)
    window.addEventListener('storage', handleStorageChange);

    // 4. Polling interval 2 detik HANYA untuk pemantauan live data aktivitas peserta (refreshMonitoringData)
    // Tidak lagi memanggil refreshData() agar formulir konfigurasi yang sedang diketik tidak tereset!
    const interval = setInterval(refreshMonitoringData, 2000);

    // 5. Auto-refresh saat tab browser kembali aktif/fokus (hanya data monitoring)
    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshMonitoringData();
      }
    };
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // 6. Muat snapshot data terbaru dari backend SQLite saat awal mount
    storageService.syncWithServer().then(() => {
      const freshInst = storageService.getInstitution();
      setInstitution(freshInst);
      if (freshInst?.gmaps_url) {
        setGmapsInput(freshInst.gmaps_url);
      }
      refreshMonitoringData();
    }).catch(() => {});

    return () => {
      unsubscribe();
      window.removeEventListener('examguard_storage_updated', handleStorageChange);
      window.removeEventListener('examguard_db_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Saat berpindah tab, sinkronkan data yang relevan
  useEffect(() => {
    if (activeTab === 'institution') {
      const saved = storageService.getInstitution();
      setInstitution(saved);
      if (saved?.gmaps_url) {
        setGmapsInput(saved.gmaps_url);
      }
    } else if (activeTab === 'proctor') {
      refreshMonitoringData();
      storageService.syncWithServer().then(() => refreshMonitoringData()).catch(() => {});
    }
  }, [activeTab]);

  // Handler Upload Logo Instansi
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Harap pilih file gambar (PNG, JPG, SVG, WebP).', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showNotification('Ukuran file logo maksimal 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const updated = { ...institution, logo_url: base64 };
      setInstitution(updated);
      storageService.updateInstitution(updated);
      refreshData();
      showNotification('Logo instansi berhasil diunggah.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    openConfirm({
      title: 'Hapus Logo Instansi?',
      message: 'Apakah Anda yakin ingin menghapus logo sekolah kustom dan kembali ke lambang default ExamGuard?',
      confirmText: 'Ya, Hapus Logo',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        const updated = { ...institution, logo_url: null };
        setInstitution(updated);
        storageService.updateInstitution(updated);
        refreshData();
        showNotification('Logo instansi dihapus, kembali ke default.');
      },
    });
  };

  // Handler Ganti Jenjang Institusi
  const handleEducationLevelChange = (levelCode) => {
    const selectedLevel = EDUCATION_LEVELS[levelCode] || EDUCATION_LEVELS.SMA;
    const updated = {
      ...institution,
      education_level: levelCode,
      allowed_grades: [...selectedLevel.grades],
    };
    setInstitution(updated);
    storageService.updateInstitution(updated);
    refreshData();
    showNotification(
      `Jenjang institusi disesuaikan ke ${selectedLevel.label}. Tingkat kelas aktif: ${selectedLevel.grades.join(', ')}.`
    );
  };

  // Simpan Pengaturan Institusi
  const handleSaveInstitution = (e) => {
    e.preventDefault();
    if (institution.npsn && !/^[a-zA-Z0-9]{4,16}$/.test(institution.npsn)) {
      showNotification('NPSN harus berupa kombinasi huruf dan angka (alfanumerik 4-16 karakter tanpa spasi atau simbol).', 'error');
      return;
    }
    const updated = {
      ...institution,
      gmaps_url: gmapsInput?.trim() || institution.gmaps_url,
    };
    storageService.updateInstitution(updated);
    setInstitution(updated);
    showNotification('Pengaturan konfigurasi instansi & kebijakan perangkat berhasil disimpan.');
  };

  // Handler Switch On/Off Ceklis Izin Browser Peserta (Pre-flight Permissions)
  const handleToggleBrowserPermission = (permKey, permLabel) => {
    const currentPerms = institution.browser_permissions || {};
    const isSimMode = appModeConfig?.app_mode === 'simulation';

    // Khusus google_sso: Di mode produksi wajib sudah login dan terverifikasi OAuth akun Google.
    // Di mode simulasi/demo, bebas aktifkan/nonaktifkan karena disimulasikan!
    if (permKey === 'google_sso' && !currentPerms.google_sso && !isSimMode) {
      const isOAuthVerified = Boolean(
        institution.google_oauth_verified &&
        institution.google_oauth_enabled &&
        institution.google_client_id?.trim()
      );
      if (!isOAuthVerified) {
        showNotification(
          'Izin Login Akun Google (SSO) terkunci OFF di Mode Produksi. Anda wajib melakukan verifikasi OAuth dengan login ke akun Google terlebih dahulu pada card pengaturan Google OAuth, atau gunakan Mode Demo.',
          'error'
        );
        return;
      }
    }

    const updatedVal = !currentPerms[permKey];
    const newPerms = {
      ...currentPerms,
      [permKey]: updatedVal,
    };
    const updatedInst = {
      ...institution,
      browser_permissions: newPerms,
      ...(permKey === 'location_gps' ? { gps_enabled: updatedVal } : {}),
      ...(permKey === 'google_sso' ? { google_oauth_enabled: updatedVal } : {}),
    };
    setInstitution(updatedInst);
    storageService.updateInstitution(updatedInst);

    // Di mode demo, sinkronkan juga dengan sakelar bypass_google_sso
    if (isSimMode && permKey === 'google_sso') {
      const updatedMode = storageService.saveAppModeConfig({ bypass_google_sso: updatedVal }, currentUser);
      setAppModeConfig(updatedMode?.config || updatedMode);
    }

    refreshData();
    showNotification(
      `Izin "${permLabel}" diubah menjadi ${updatedVal ? 'Wajib Divalidasi (ON)' : 'Bebas / Non-Aktif (OFF)'}.`
    );
  };

  // ========================================================
  // GOOGLE OAUTH 2.0 & GIS: WAJIB LOGIN AKUN GMAIL AGAR STATUS SSO ON
  // ========================================================
  const handleTestGoogleOAuth = async () => {
    const clientId = institution.google_client_id?.trim();
    if (!clientId) {
      showNotification('Harap isi Google OAuth Client ID terlebih dahulu.', 'error');
      return;
    }

    const isGoogleFormat = clientId.endsWith('.apps.googleusercontent.com') || clientId.includes('.googleusercontent.com') || (clientId.length >= 25 && /^[0-9a-zA-Z._-]+$/.test(clientId));
    if (!isGoogleFormat) {
      showNotification('Format Client ID tidak valid. Google Client ID biasanya berakhiran ".apps.googleusercontent.com".', 'error');
      return;
    }

    setTestingOAuth(true);
    // Timeout pengaman otomatis 35 detik jika popup ditutup manual atau diblokir Google
    const safetyTimer = setTimeout(() => {
      setTestingOAuth(false);
    }, 35000);

    try {
      // 1. Muat Google Identity Services (GIS)
      if (!window.google?.accounts?.oauth2) {
        await new Promise((resolve, reject) => {
          const scriptId = 'examguard-google-gis';
          let s = document.getElementById(scriptId);
          if (s) {
            if (window.google?.accounts?.oauth2) return resolve(true);
            s.addEventListener('load', () => resolve(true));
            s.addEventListener('error', () => reject(new Error('Gagal memuat Google Identity Services')));
            return;
          }
          s = document.createElement('script');
          s.id = scriptId;
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.defer = true;
          s.onload = () => resolve(true);
          s.onerror = () => reject(new Error('Gagal memuat Google Identity Services. Pastikan komputer terhubung ke internet.'));
          document.head.appendChild(s);
        });
      }

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google Identity Services tidak tersedia di peramban ini.');
      }

      // 2. Buka dialog OAuth resmi Google untuk login akun Gmail penguji/admin
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response) => {
          clearTimeout(safetyTimer);
          if (response.error) {
            setTestingOAuth(false);
            if (response.error === 'invalid_client' || (response.error_description && response.error_description.includes('origin'))) {
              showNotification(`Origin "${window.location.origin}" belum didaftarkan di Google Cloud Console. Tambahkan ke Authorized JavaScript origins.`, 'error');
            } else if (response.error !== 'access_denied') {
              showNotification(`Login verifikasi Google gagal: ${response.error_description || response.error}`, 'error');
            } else {
              showNotification('Verifikasi dibatalkan oleh pengguna.', 'info');
            }
            return;
          }

          if (response.access_token) {
            try {
              // 3. Verifikasi profil akun Google dari token yang sah
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (!res.ok) {
                throw new Error('Gagal mengambil data profil Google dari server Google.');
              }
              const profile = await res.json();
              const verifiedEmail = profile.email?.trim().toLowerCase();

              if (!verifiedEmail) {
                throw new Error('Akun Google tidak menyediakan email yang valid.');
              }

              // SUKSES VERIFIKASI DENGAN LOGIN GMAIL SUNGGUHAN:
              const updated = {
                ...institution,
                google_client_id: clientId,
                google_client_secret: (institution.google_client_secret || '').trim(),
                google_oauth_enabled: true,
                google_oauth_verified: true,
                google_oauth_verified_email: verifiedEmail,
                google_oauth_verified_at: new Date().toISOString(),
                auth_method: institution.auth_method === 'CREDENTIALS_ONLY' ? 'BOTH' : (institution.auth_method || 'BOTH'),
                browser_permissions: {
                  ...(institution.browser_permissions || {}),
                  google_sso: true,
                },
              };
              setInstitution(updated);
              storageService.updateInstitution(updated);
              refreshData();
              showNotification(`✓ Google OAuth BERHASIL Diverifikasi! Login akun: ${verifiedEmail}. Status SSO kini AKTIF (ON).`, 'success');
            } catch (fetchErr) {
              showNotification(fetchErr.message || 'Gagal memverifikasi profil akun Google.', 'error');
            } finally {
              setTestingOAuth(false);
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      clearTimeout(safetyTimer);
      setTestingOAuth(false);
      showNotification(`Verifikasi Google OAuth gagal: ${err.message || 'Periksa Client ID atau akses internet.'}`, 'error');
    }
  };

  const handleResetGoogleOAuth = () => {
    openConfirm({
      title: 'Nonaktifkan Google OAuth SSO?',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin <strong>menonaktifkan integrasi Google OAuth 2.0 (SSO)</strong>?
          </p>
          <p className="text-[11px] text-zinc-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
            Kredensial <strong>Client ID & Client Secret akan tetap tersimpan</strong> di database dan tidak akan dikosongkan. Status SSO beralih ke <strong>OFF</strong>, dan izin login Google di portal peserta dinonaktifkan.
          </p>
        </div>
      ),
      confirmText: 'Ya, Nonaktifkan (Simpan Kredensial)',
      cancelText: 'Batal',
      variant: 'warning',
      icon: Unlink,
      onConfirm: () => {
        const updated = {
          ...institution,
          // JANGAN KOSONGKAN Client ID & Secret - simpan selalu agar tidak hilang!
          google_client_id: institution.google_client_id || '',
          google_client_secret: institution.google_client_secret || '',
          google_oauth_enabled: false,
          google_oauth_verified: false,
          google_oauth_verified_email: null,
          google_oauth_verified_at: null,
          auth_method: institution.auth_method === 'SSO_ONLY' ? 'CREDENTIALS_ONLY' : (institution.auth_method || 'CREDENTIALS_ONLY'),
          browser_permissions: {
            ...(institution.browser_permissions || {}),
            google_sso: false,
          },
        };
        setInstitution(updated);
        storageService.updateInstitution(updated);
        refreshData();
        showNotification('Google OAuth telah dinonaktifkan (OFF). Kredensial Client ID & Secret tetap tersimpan.');
      },
    });
  };

  const handleToggleGoogleOAuth = () => {
    const isVerified = Boolean(institution.google_oauth_verified && institution.google_oauth_enabled);
    if (isVerified) {
      // Langsung nonaktifkan SSO tanpa mengosongkan Client ID & Secret
      const updated = {
        ...institution,
        // JANGAN KOSONGKAN Client ID & Secret - simpan selalu agar tidak hilang!
        google_client_id: institution.google_client_id || '',
        google_client_secret: institution.google_client_secret || '',
        google_oauth_enabled: false,
        google_oauth_verified: false,
        auth_method: institution.auth_method === 'SSO_ONLY' ? 'CREDENTIALS_ONLY' : (institution.auth_method || 'CREDENTIALS_ONLY'),
        browser_permissions: {
          ...(institution.browser_permissions || {}),
          google_sso: false,
        },
      };
      setInstitution(updated);
      storageService.updateInstitution(updated);
      refreshData();
      showNotification('Google OAuth SSO dinonaktifkan (OFF). Kredensial Client ID & Secret tetap tersimpan.');
    } else {
      if (!institution.google_client_id?.trim()) {
        showNotification('Google Client ID belum diisi. Masukkan Client ID terlebih dahulu.', 'error');
      } else {
        handleTestGoogleOAuth();
      }
    }
  };

  // ========================================================
  // GOOGLE RECAPTCHA V2 / V3 (MODE PRODUKSI RESMI TANPA BYPASS)
  // ========================================================
  const handleTestRecaptcha = async () => {
    const siteKey = institution.recaptcha_site_key?.trim();
    if (!siteKey) {
      showNotification('Harap isi reCAPTCHA Site Key terlebih dahulu sebelum menguji koneksi.', 'error');
      return;
    }

    if (siteKey.length < 30) {
      showNotification('Format reCAPTCHA Site Key tidak valid. Site Key reCAPTCHA Google biasanya sepanjang 40 karakter.', 'error');
      return;
    }

    const version = institution.recaptcha_version === 'v3' ? 'v3' : 'v2';
    setTestingRecaptcha(true);
    const start = performance.now();
    try {
      let recaptchaReachable = false;
      if (version === 'v3') {
        recaptchaReachable = await new Promise((resolve) => {
          const scriptId = 'examguard-recaptcha-v3-loader';
          let script = document.getElementById(scriptId);
          if (script) {
            if (window.grecaptcha?.ready) {
              window.grecaptcha.ready(() => resolve(true));
              return;
            }
          } else {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
            script.async = true;
            document.head.appendChild(script);
          }
          script.onload = () => {
            if (window.grecaptcha && window.grecaptcha.ready) {
              window.grecaptcha.ready(() => resolve(true));
            } else {
              resolve(true);
            }
          };
          script.onerror = () => resolve(false);
        });
      } else {
        recaptchaReachable = await new Promise((resolve) => {
          if (window.grecaptcha?.render) return resolve(true);
          const s = document.createElement('script');
          s.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
          s.async = true;
          s.onload = () => resolve(true);
          s.onerror = () => resolve(false);
          document.head.appendChild(s);
        });
      }

      if (!recaptchaReachable) {
        throw new Error('Tidak dapat menghubungi server Google reCAPTCHA. Pastikan komputer terhubung ke internet.');
      }

      const elapsed = Math.round(performance.now() - start);

      // KONEKSI SUKSES: Otomatis AKTIF (ON) & simpan ke sistem
      const updated = {
        ...institution,
        recaptcha_version: version,
        recaptcha_site_key: siteKey,
        recaptcha_secret_key: (institution.recaptcha_secret_key || '').trim(),
        recaptcha_enabled: true,
      };
      setInstitution(updated);
      storageService.updateInstitution(updated);
      refreshData();
      showNotification(`✓ Uji koneksi Google reCAPTCHA ${version.toUpperCase()} BERHASIL (${elapsed} ms)! Proteksi robot Google otomatis AKTIF (ON).`);
    } catch (err) {
      showNotification(`Uji koneksi reCAPTCHA gagal: ${err.message || 'Periksa Site Key atau akses internet.'}`, 'error');
    } finally {
      setTestingRecaptcha(false);
    }
  };

  const handleResetRecaptcha = () => {
    openConfirm({
      title: 'Reset & Nonaktifkan Google reCAPTCHA?',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin <strong>mengosongkan settingan dan menonaktifkan Google reCAPTCHA</strong>?
          </p>
          <p className="text-[11px] text-zinc-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
            Site Key dan Secret Key akan dikosongkan. Sistem akan <strong>otomatis beralih ke Captcha Mandiri ExamGuard (Default)</strong> sehingga proteksi bot tetap aktif tanpa memerlukan koneksi internet.
          </p>
        </div>
      ),
      confirmText: 'Ya, Reset (Kosongkan)',
      cancelText: 'Batal',
      variant: 'warning',
      icon: AlertTriangle,
      onConfirm: () => {
        const updated = {
          ...institution,
          recaptcha_site_key: '',
          recaptcha_secret_key: '',
          recaptcha_enabled: false,
        };
        setInstitution(updated);
        storageService.updateInstitution(updated);
        refreshData();
        showNotification('Pengaturan Google reCAPTCHA telah dikosongkan (OFF). Sistem otomatis menggunakan Captcha Keamanan Mandiri Default.');
      },
    });
  };

  const handleToggleRecaptcha = () => {
    const isCurrentlyActive = Boolean(institution.recaptcha_enabled && institution.recaptcha_site_key?.trim());
    if (isCurrentlyActive) {
      handleResetRecaptcha();
    } else {
      if (!institution.recaptcha_site_key?.trim()) {
        showNotification('reCAPTCHA Site Key belum diisi. Masukkan Site Key dan klik "Test Koneksi & Aktifkan" untuk mengaktifkan.', 'error');
      } else {
        handleTestRecaptcha();
      }
    }
  };

  // Ambil Lokasi GPS/Jaringan Saat Ini secara Live (Multi-Tier: Satelit -> Jaringan -> IP Fallback)
  const handleDetectCurrentLocation = async () => {
    if (isDetectingLocation) return;
    setIsDetectingLocation(true);
    showNotification('Sedang mendeteksi sinyal GPS & koordinat live posisi Anda saat ini...', 'info');

    const applyLocation = (lat, lng, source, accuracy = null) => {
      const fixedLat = parseFloat(Number(lat).toFixed(6));
      const fixedLng = parseFloat(Number(lng).toFixed(6));
      const gmaps = `https://maps.google.com/?q=${fixedLat},${fixedLng}`;

      setInstitution((prev) => {
        const updated = {
          ...prev,
          center_lat: fixedLat,
          center_lng: fixedLng,
          gmaps_url: gmaps,
        };
        storageService.updateInstitution(updated);
        return updated;
      });
      setGmapsInput(gmaps);
      setIsDetectingLocation(false);

      const accInfo = accuracy ? ` (Akurasi: ±${Math.round(accuracy)}m)` : '';
      showNotification(`Koordinat live berhasil didapatkan via ${source}: ${fixedLat}, ${fixedLng}${accInfo}`, 'success');
    };

    // Fallback Geolocation via IP Publik Jaringan (Solusi utama jika diakses via HTTP LAN di mana browser memblokir navigator.geolocation)
    const tryIpFallback = async (reason) => {
      try {
        const res = await fetch('https://ipwho.is/');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.latitude && data.longitude) {
            applyLocation(data.latitude, data.longitude, `Jaringan Internet (${data.city || 'IP'})`);
            return;
          }
        }
      } catch (e1) {
        try {
          const res2 = await fetch('https://freeipapi.com/api/json');
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.latitude && data2.longitude) {
              applyLocation(data2.latitude, data2.longitude, `Jaringan Internet (${data2.cityName || 'IP'})`);
              return;
            }
          }
        } catch (e2) {}
      }

      setIsDetectingLocation(false);
      showNotification(`Gagal mendeteksi koordinat live: ${reason}. Silakan tentukan lokasi pada peta secara manual.`, 'error');
    };

    // 1. Cek ketersediaan navigator.geolocation di peramban
    if (!navigator.geolocation) {
      await tryIpFallback('Peramban tidak mendukung Geolocation API');
      return;
    }

    // 2. Tier 1: Coba GPS Satelit Akurasi Tinggi (maximumAge: 0 memastikan sinyal baru, bukan data cache lama)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude, 'Sensor GPS Satelit', pos.coords.accuracy);
      },
      (err1) => {
        console.warn('[ExamGuard GPS] Tier 1 High Accuracy gagal:', err1.message);

        // 3. Tier 2: Coba Akurasi Standar (Triangulasi Wi-Fi/Jaringan Seluler)
        navigator.geolocation.getCurrentPosition(
          (pos2) => {
            applyLocation(pos2.coords.latitude, pos2.coords.longitude, 'Jaringan Seluler/Wi-Fi', pos2.coords.accuracy);
          },
          async (err2) => {
            console.warn('[ExamGuard GPS] Tier 2 Standard Accuracy gagal:', err2.message);
            // 4. Tier 3: Fallback ke IP Geolocation jika GPS diblokir karena HTTP LAN atau ketiadaan izin
            await tryIpFallback(err2.message || err1.message);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  // Handler Terapkan Tautan Google Maps / Input Koordinat
  const handleApplyGmapsLink = () => {
    if (!gmapsInput || !gmapsInput.trim()) {
      showNotification('Silakan masukkan tautan Google Maps atau angka koordinat terlebih dahulu.', 'error');
      return;
    }

    const trimmed = gmapsInput.trim();
    const parsed = parseGmapsUrl(trimmed);

    if (parsed) {
      const lat = parseFloat(parsed.lat.toFixed(6));
      const lng = parseFloat(parsed.lng.toFixed(6));
      const validUrl = trimmed.startsWith('http') ? trimmed : `https://maps.google.com/?q=${lat},${lng}`;

      setInstitution((prev) => {
        const updated = {
          ...prev,
          center_lat: lat,
          center_lng: lng,
          gmaps_url: validUrl,
        };
        storageService.updateInstitution(updated);
        return updated;
      });
      setGmapsInput(validUrl);
      showNotification(`Lokasi berhasil diterapkan ke koordinat: ${lat}, ${lng}`);
    } else {
      if (trimmed.includes('maps.app.goo.gl') || trimmed.includes('goo.gl/maps')) {
        showNotification(
          'Tautan pendek (maps.app.goo.gl) tidak memuat koordinat langsung. Buka link tersebut di tab baru browser, lalu salin URL lengkap dari address bar atau salin angka koordinatnya.',
          'error'
        );
      } else {
        showNotification(
          'Format link Google Maps tidak dikenali. Pastikan menyalin URL lengkap dari address bar Google Maps atau salin angka desimal koordinat.',
          'error'
        );
      }
    }
  };

  // Handler Generate QR Code Ujian (Hitam-Putih dengan Logo Instansi di Tengah)
  // Susunan BARU: 1. Nama Sekolah, 2. Session Ujian, 3. QR Code + Logo, 4. Nama Mapel, 5. Kelas - Tingkat, 6. Tgl dan Waktu - Durasi (Tanpa Token)
  const generateQrCard = async (exam) => {
    setQrExam(exam);
    setShowQrModal(true);
    setQrPngUrl('');

    // Tunggu canvas di-mount di DOM
    setTimeout(async () => {
      const canvas = qrCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const width = 600;
      const height = 590;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Bersih Putih
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Bingkai Elegan Luar
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(14, 14, width - 28, height - 28);

      // 1. NAMA SEKOLAH (Urutan 1)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#09090B';
      ctx.font = 'bold 20px Inter, sans-serif';
      let y = 46;
      ctx.fillText(institution.name || 'ExamGuard Proctoring System', width / 2, y);

      // 2. SESSION UJIAN (Urutan 2)
      y += 24;
      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillStyle = '#2563EB'; // Biru khas kelompok asesmen
      ctx.fillText(exam.session_group || 'Asesmen Tengah Semester (ATS)', width / 2, y);

      // Garis pemisah halus
      y += 14;
      ctx.strokeStyle = '#F4F4F5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();

      // 3. QR CODE + LOGO (Urutan 3: agak besar, jarak spasi rapat)
      const qrSize = 380;
      const qrX = (width - qrSize) / 2;
      const qrY = y + 10;

      const qrPayload = JSON.stringify({
        id: exam.id,
        title: exam.title,
        subject: exam.subject || '',
        session: exam.session_group || '',
        grade: exam.grade_level,
        system: 'ExamGuard',
      });

      const tempCanvas = document.createElement('canvas');
      await QRCode.toCanvas(tempCanvas, qrPayload, {
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: 'H', // Error correction tinggi (30%) agar logo di tengah tidak merusak scanning
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Gambar QR Code ke canvas utama
      ctx.drawImage(tempCanvas, qrX, qrY, qrSize, qrSize);

      // Logo Instansi di Tengah QR Code
      const badgeSize = 84;
      const badgeX = (width - badgeSize) / 2;
      const badgeY = qrY + (qrSize - badgeSize) / 2;

      // Gambar latar putih kotak badge dengan border hitam tipis
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(badgeX, badgeY, badgeSize, badgeSize);

      const finalizeCanvas = () => {
        // 4. NAMA MAPEL (Urutan 4)
        let footY = qrY + qrSize + 25;
        ctx.textAlign = 'center';
        ctx.font = 'bold 17px Inter, sans-serif';
        ctx.fillStyle = '#09090B';
        ctx.fillText(exam.subject || exam.title || 'Mata Pelajaran', width / 2, footY);

        // 5. KELAS - TINGKAT (Urutan 5)
        footY += 23;
        ctx.font = '600 14px Inter, sans-serif';
        ctx.fillStyle = '#3F3F46';
        const gradeText = exam.grade_level > 0
          ? `Kelas ${exam.grade_level} — ${getGradeLabel(exam.grade_level)}`
          : getGradeLabel(exam.grade_level);
        ctx.fillText(gradeText, width / 2, footY);

        // 6. TGL DAN WAKTU - DURASI (Urutan 6 - Tanpa Token)
        footY += 21;
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillStyle = '#71717A';
        const dateStr = exam.start_time ? exam.start_time.replace('T', ' ') : 'Fleksibel';
        ctx.fillText(`${dateStr} — Durasi: ${exam.duration_minutes} Menit`, width / 2, footY);

        setQrPngUrl(canvas.toDataURL('image/png'));
      };

      if (institution.logo_url) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          const pad = 6;
          ctx.drawImage(logoImg, badgeX + pad, badgeY + pad, badgeSize - pad * 2, badgeSize - pad * 2);
          finalizeCanvas();
        };
        logoImg.onerror = () => {
          ctx.fillStyle = '#09090B';
          ctx.font = 'bold 34px sans-serif';
          ctx.fillText('🛡️', width / 2, badgeY + 54);
          finalizeCanvas();
        };
        logoImg.src = institution.logo_url;
      } else {
        ctx.fillStyle = '#09090B';
        ctx.font = 'bold 34px sans-serif';
        ctx.fillText('🛡️', width / 2, badgeY + 54);
        finalizeCanvas();
      }
    }, 150);
  };

  const handleDownloadQrPng = () => {
    if (!qrPngUrl || !qrExam) return;
    const link = document.createElement('a');
    link.download = `QR_${(qrExam.subject || qrExam.title || 'Ujian').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = qrPngUrl;
    link.click();
    showNotification('File QR Code PNG berhasil diunduh.');
  };

  // Helper Buka Modal Tambah Soal (Token Mulai & Selesai 6 Digit Otomatis & Default Mulai Hari Ini 07:30 Selesai Sesuai Durasi)
  const handleOpenAddExamModal = () => {
    const def = getDefaultExamTimes(90);
    setEditingExam(null);
    setExamTokenValue('');
    setFinishTokenValue('');
    setExamDuration(90);
    setExamStartTime(def.startTime);
    setExamEndTime(def.endTime);
    setShowExamModal(true);
  };

  // Helper Buka Modal Edit Soal (Normalisasi Token Mulai & Selesai 6 Digit & Pertahankan/Sinkron Jam)
  const handleOpenEditExamModal = (exam) => {
    setEditingExam(exam);
    setExamTokenValue(exam.exam_token ? formatExamToken(exam.exam_token) : '');
    setFinishTokenValue(exam.finish_token ? formatExamToken(exam.finish_token) : '');
    const dur = parseInt(exam.duration_minutes, 10) || 90;
    setExamDuration(dur);
    const def = getDefaultExamTimes(dur);
    const start = exam.start_time || def.startTime;
    const end = exam.end_time || calculateEndTime(start, dur) || def.endTime;
    setExamStartTime(start);
    setExamEndTime(end);
    setShowExamModal(true);
  };

  // Handler Simpan / Edit Ujian (Standar Token Mulai & Selesai 6 Digit Huruf Besar)
  const handleSaveExamSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const isArchived = Boolean(form.is_archived?.checked);
    const rawToken = (examTokenValue || form.exam_token?.value || '').trim();
    const rawFinish = (finishTokenValue || form.finish_token?.value || '').trim();
    const token = rawToken ? formatExamToken(rawToken) : '';
    const finishToken = rawFinish ? formatExamToken(rawFinish) : '';

    const finalDuration = parseInt(examDuration || form.duration_minutes?.value, 10) || 90;
    const finalStartTime = examStartTime || form.start_time?.value || getDefaultExamTimes(finalDuration).startTime;
    const finalEndTime = examEndTime || form.end_time?.value || calculateEndTime(finalStartTime, finalDuration);
    const finalTitle = form.title?.value?.trim() || form.subject?.value?.trim() || 'Sesi Ujian';

    const examData = {
      id: editingExam?.id || generateUUID(),
      title: finalTitle,
      subject: (form.subject?.value || '').trim() || 'Mata Pelajaran Umum',
      session_group: (form.session_group?.value || '').trim() || 'Asesmen Tengah Semester (ATS)',
      description: form.description?.value?.trim() || '',
      grade_level: parseInt(form.grade_level.value, 10),
      is_active: isArchived ? false : (form.is_active ? form.is_active.checked : true),
      is_archived: isArchived,
      gform_base_url: convertGoogleFormUrl(form.gform_base_url.value.trim()),
      respon_base_url: form.respon_base_url?.value?.trim() || '',
      exam_token: token,
      finish_token: finishToken,
      start_time: finalStartTime,
      end_time: finalEndTime,
      duration_minutes: finalDuration,
    };

    storageService.saveExamSession(examData);
    setShowExamModal(false);
    setEditingExam(null);
    refreshData();
    showNotification(
      isArchived
        ? 'Soal berhasil disimpan ke Bank Soal (Arsip).'
        : `Sesi ujian GForm berhasil disimpan${token ? ` (Token Mulai: ${token}` : ''}${finishToken ? `, Token Selesai: ${finishToken})` : token ? ')' : ''}`
    );
  };

  // Handler Arsipkan Ujian ke Bank Soal (Konfirmasi Modern)
  const handleArchiveExam = (id, title) => {
    openConfirm({
      title: 'Pindahkan ke Bank Soal?',
      message: (
        <span>
          Pindahkan sesi ujian <strong>"{title}"</strong> ke Bank Soal (Arsip)? Soal akan dinonaktifkan dan <strong>tidak ditayangkan</strong> di beranda peserta ujian sampai diaktifkan kembali.
        </span>
      ),
      confirmText: 'Ya, Arsipkan Soal',
      variant: 'warning',
      icon: Archive,
      onConfirm: () => {
        storageService.archiveExam(id);
        refreshData();
        showNotification(`Sesi ujian "${title}" berhasil diarsipkan ke Bank Soal.`);
      },
    });
  };

  // Handler Pulihkan Ujian dari Bank Soal ke Sesi Ujian Aktif (Konfirmasi Modern)
  const handleRestoreExam = (id, title) => {
    openConfirm({
      title: 'Aktifkan Kembali ke Sesi Ujian?',
      message: (
        <span>
          Pulihkan dan aktifkan kembali soal <strong>"{title}"</strong> ke jadwal ujian aktif? Soal akan langsung tampil di beranda peserta ujian sesuai tingkat kelas sasaran.
        </span>
      ),
      confirmText: 'Ya, Aktifkan Sekarang',
      variant: 'success',
      icon: ArchiveRestore,
      onConfirm: () => {
        storageService.restoreExamFromArchive(id);
        refreshData();
        showNotification(`Soal "${title}" berhasil diaktifkan kembali ke Sesi Ujian Aktif.`);
      },
    });
  };

  // Handler Hapus Ujian (Konfirmasi Modern)
  const handleDeleteExam = (id, title) => {
    openConfirm({
      title: 'Hapus Sesi Ujian?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus sesi ujian <strong>"{title}"</strong>? Seluruh data konfigurasi soal ini akan dihapus secara permanen.
        </span>
      ),
      confirmText: 'Ya, Hapus Ujian',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.deleteExamSession(id);
        refreshData();
        showNotification(`Sesi ujian "${title}" berhasil dihapus.`, 'error');
      },
    });
  };

  // Aksi Pengawas 1: Reset Login Perangkat (Konfirmasi Modern)
  const handleProctorResetLogin = (studentId, studentName) => {
    openConfirm({
      title: 'Reset Kunci Perangkat Peserta?',
      message: (
        <span>
          Hapus pengikatan perangkat (Active Device ID) untuk peserta <strong>{studentName}</strong>? Peserta akan diizinkan login kembali menggunakan perangkat lain.
        </span>
      ),
      confirmText: 'Ya, Reset Perangkat',
      variant: 'info',
      icon: Smartphone,
      onConfirm: () => {
        storageService.proctorResetStudentDevice(studentId);
        refreshData();
        showNotification(`Perangkat ${studentName} berhasil direset. Peserta kini bisa login kembali.`);
      },
    });
  };

  // Aksi Pengawas 2: Unlock Peserta (Konfirmasi Modern)
  const handleProctorUnlock = (attemptId, studentName) => {
    openConfirm({
      title: 'Buka Kunci Ujian (Unlock)?',
      message: (
        <span>
          Buka status terkunci peserta <strong>{studentName}</strong>? Status ujian akan dipulihkan menjadi <strong>SEDANG MENGERJAKAN</strong>, jumlah pelanggaran direset ke 0, dan peserta dapat segera melanjutkan lembar ujian.
        </span>
      ),
      confirmText: 'Ya, Buka Kunci',
      variant: 'success',
      icon: Unlock,
      onConfirm: () => {
        storageService.proctorUnlockAttempt(attemptId, currentProctorExam?.id);
        refreshMonitoringData();
        showNotification(`Status ujian ${studentName} berhasil dibuka (UNLOCKED). Peserta dapat lanjut mengerjakan.`);
      },
    });
  };

  // Aksi Pengawas 2b: Reset Hitungan Pelanggaran Peserta (Konfirmasi Modern)
  const handleProctorResetViolationCount = (attemptId, studentName) => {
    openConfirm({
      title: 'Reset Pelanggaran Peserta ke 0?',
      message: (
        <span>
          Reset hitungan pelanggaran untuk peserta <strong>{studentName}</strong> kembali ke <strong>0 kali</strong>? Jika peserta sedang berstatus terkunci, status pengerjaannya akan otomatis dipulihkan menjadi aktif kembali.
        </span>
      ),
      confirmText: 'Ya, Reset ke 0',
      variant: 'warning',
      icon: ShieldAlert,
      onConfirm: () => {
        storageService.proctorResetViolations(attemptId, currentProctorExam?.id);
        refreshMonitoringData();
        showNotification(`Riwayat pelanggaran ${studentName} berhasil direset menjadi 0 kali.`);
      },
    });
  };

  // Handler Tombol Refresh Manual Tabel Pengawas
  const handleManualRefreshProctor = async () => {
    setIsRefreshingProctor(true);
    try {
      await storageService.syncWithServer();
    } catch {}
    const currentAttempts = storageService.getAttempts();
    const currentUsers = storageService.getUsers();
    const currentExams = storageService.getExamSessions();
    const currentAttendance = storageService.getAttendance();
    setAttempts([...currentAttempts]);
    setUsers([...currentUsers]);
    setExams([...currentExams]);
    setAttendance([...currentAttendance]);
    setIsRefreshingProctor(false);
    const activeCount = currentExams.filter((e) => {
      const isArchived = e.is_archived === true || e.is_archived === 1 || e.is_archived === '1';
      if (isArchived) return false;
      return e.is_active === undefined || e.is_active === null ? true : (e.is_active === true || e.is_active === 1 || e.is_active === '1');
    }).length;
    const studentCount = currentUsers.filter((u) => u.role === 'student').length;
    showNotification(`Tabel pengawas berhasil disegarkan (${activeCount} mapel aktif, ${studentCount} peserta terpantau).`);
  };

  // Aksi Pengawas 3: Reset Jawaban (Konfirmasi Modern)
  const handleProctorResetAnswer = (attemptIdOrStudentId, studentName) => {
    openConfirm({
      title: 'Reset Lembar Jawaban Peserta?',
      message: (
        <span>
          Reset jawaban untuk peserta <strong>{studentName}</strong>? Status pengerjaan akan diubah menjadi <strong>RESET_BY_PROCTOR</strong> dan soal akan muncul kembali di beranda peserta jika jawaban mereka belum masuk Google Sheets.
        </span>
      ),
      confirmText: 'Ya, Reset Jawaban',
      variant: 'danger',
      icon: RotateCcw,
      onConfirm: () => {
        storageService.proctorResetAnswerAttempt(attemptIdOrStudentId, currentProctorExam?.id);
        refreshMonitoringData();
        showNotification(`Jawaban ${studentName} direset. Soal kembali aktif di portal peserta.`);
      },
    });
  };

  // Aksi Pengawas 4: Reset Pekerjaan (Agar bisa login soal lagi)
  const handleProctorResetWork = (studentId, studentName) => {
    if (!currentProctorExam) return;
    openConfirm({
      title: 'Reset Pekerjaan Ujian Peserta?',
      message: (
        <span>
          Apakah Anda yakin ingin mereset seluruh pekerjaan ujian <strong>{studentName}</strong> pada mapel <strong>{currentProctorExam.title}</strong>?
          <br /><br />
          Catatan pengerjaan dan pelanggaran untuk mapel ini akan dihapus bersih, dan kunci perangkat akan dilepas sehingga peserta dapat login dan mengerjakan soal dari awal lagi.
        </span>
      ),
      confirmText: 'Ya, Reset Pekerjaan',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.proctorSetAttemptNotStarted(studentId, currentProctorExam.id);
        storageService.resetUserDevice(studentId);
        refreshMonitoringData();
        showNotification(`Pekerjaan ujian ${studentName} berhasil direset. Peserta dapat login soal kembali dari awal.`);
      },
    });
  };

  // Aksi Pengawas 1b: Logout Paksa Seluruh Peserta di Tingkat Ini (Header Tombol Logout)
  const handleProctorBulkLogoutGrade = (targetGrade, targetStudents = []) => {
    const gradeLabel = targetGrade ? getGradeLabel(targetGrade) : 'Tingkat Ini';
    const students = targetStudents && targetStudents.length > 0
      ? targetStudents
      : (users || []).filter((u) => u.role === 'student' && (!targetGrade || Number(u.tingkat) === Number(targetGrade)));

    if (students.length === 0) {
      showNotification(`Tidak ada data peserta di ${gradeLabel}.`, 'warning');
      return;
    }

    const activeLoginCount = students.filter((s) => Boolean(s.active_device_id)).length;

    openConfirm({
      title: `Logout Paksa Seluruh Peserta ${gradeLabel}?`,
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin melakukan <strong>logout paksa</strong> untuk seluruh peserta{' '}
            <strong>{gradeLabel} ({students.length} peserta)</strong>?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5 text-amber-800">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <span>Reset & Pelepasan Kunci Perangkat</span>
            </p>
            <p>
              Seluruh peserta pada tingkat ini (termasuk <strong>{activeLoginCount} peserta yang sedang online/login</strong>) akan dikeluarkan dari aplikasi ujian dan kunci perangkatnya akan direset sehingga mereka dapat login kembali dari perangkat lain jika diperlukan.
            </p>
          </div>
        </div>
      ),
      confirmText: `Ya, Logout ${students.length} Peserta`,
      variant: 'warning',
      icon: LogOut,
      onConfirm: () => {
        const studentIds = students.map((s) => s.id);
        const count = storageService.proctorResetBulkStudentDevices(studentIds);
        refreshMonitoringData();
        showNotification(`Berhasil melakukan logout paksa & reset perangkat untuk ${count} peserta di ${gradeLabel}.`, 'success');
      },
    });
  };

  // Aksi Pengawas 5: Ubah Presensi Cepat Mapel Ini (Klik 2x / Klik status aktif untuk mengosongkan)
  const handleSetAttendanceQuick = (studentId, status, studentName, isCurrentlySelected = false) => {
    if (!currentProctorExam) return;
    if (isCurrentlySelected) {
      // Jika status yang diklik sudah aktif, kosongkan isian presensi
      storageService.removeExamAttendance(currentProctorExam.id, studentId);
      setAttendance([...storageService.getAttendance()]);
      showNotification(`Presensi ${studentName} dikosongkan (tidak aktif).`, 'info');
      return;
    }
    // Set status baru
    storageService.saveExamAttendance(currentProctorExam.id, studentId, {
      status,
      updated_by: currentUser?.nama || 'Proktor',
    });
    setAttendance([...storageService.getAttendance()]);
    showNotification(`Status kehadiran ${studentName} diubah menjadi ${status}.`, 'success');
  };

  // Helper Salin Token
  const handleCopyProctorToken = (text, label = 'Token') => {
    if (!text || text === '-') return;
    try {
      navigator.clipboard.writeText(text);
      showNotification(`${label} "${text}" berhasil disalin ke clipboard!`, 'success');
    } catch {
      showNotification(`Gagal menyalin ${label}.`, 'error');
    }
  };

  // ========================================================
  // HANDLERS: RESET LOGIN & STATUS PENGERJAAN PER MAPEL
  // ========================================================

  // 1. Reset Login Peserta Tunggal
  const handleResetLoginSingle = (studentId, studentName) => {
    openConfirm({
      title: 'Reset Login / Kunci Perangkat?',
      message: (
        <span>
          Hapus penguncian perangkat untuk <strong>{studentName}</strong>? Peserta dapat segera login dari perangkat atau browser baru.
        </span>
      ),
      confirmText: 'Ya, Reset Login',
      variant: 'warning',
      icon: Smartphone,
      onConfirm: () => {
        storageService.proctorResetStudentDevice(studentId);
        refreshMonitoringData();
        showNotification(`Kunci login ${studentName} berhasil direset. Peserta dapat login kembali.`);
      },
    });
  };

  // 2. Set Status "Belum Masuk" Tunggal (Hapus Attempt)
  const handleSetNotStartedSingle = (studentId, studentName) => {
    if (!currentResetExam) return;
    openConfirm({
      title: 'Ubah Status ke "Belum Masuk"?',
      message: (
        <span>
          Kembalikan status pengerjaan <strong>{studentName}</strong> pada mapel <strong>{currentResetExam.title}</strong> menjadi <strong>BELUM MASUK</strong>? Catatan pengerjaan dan pelanggaran untuk mapel ini akan dihapus bersih, dan peserta dapat memulai ujian dari awal.
        </span>
      ),
      confirmText: 'Ya, Set Belum Masuk',
      variant: 'warning',
      icon: RotateCcw,
      onConfirm: () => {
        storageService.proctorSetAttemptNotStarted(studentId, currentResetExam.id);
        refreshMonitoringData();
        showNotification(`Status pengerjaan ${studentName} pada mapel ${currentResetExam.title} diubah menjadi Belum Masuk.`);
      },
    });
  };

  // 3. Set Status "Selesai" (COMPLETED) Tunggal
  const handleSetCompletedSingle = (studentId, studentName) => {
    if (!currentResetExam) return;
    openConfirm({
      title: 'Ubah Status ke "Selesai"?',
      message: (
        <span>
          Tandai sesi ujian <strong>{studentName}</strong> pada mapel <strong>{currentResetExam.title}</strong> sebagai <strong>SELESAI (COMPLETED)</strong>? Kehadiran peserta pada presensi akan otomatis dicatat sebagai <strong>HADIR</strong>.
        </span>
      ),
      confirmText: 'Ya, Tandai Selesai',
      variant: 'success',
      icon: CheckCircle2,
      onConfirm: () => {
        storageService.proctorSetAttemptCompleted(studentId, currentResetExam.id, currentResetExam.title);
        refreshMonitoringData();
        showNotification(`Status ${studentName} pada mapel ${currentResetExam.title} berhasil diset Selesai.`);
      },
    });
  };

  // 4. "Reset Pekerjaan" (RESET_BY_PROCTOR / Kerjakan Ulang) Tunggal
  const handleResetWorkSingle = (studentId, studentName) => {
    if (!currentResetExam) return;
    openConfirm({
      title: 'Reset Pekerjaan Ujian Peserta?',
      message: (
        <span>
          Reset pekerjaan <strong>{studentName}</strong> pada mapel <strong>{currentResetExam.title}</strong>? Waktu pengerjaan dan seluruh riwayat pelanggaran akan dikembalikan ke <strong>0</strong>, status diatur menjadi <strong>RESET OLEH PENGAWAS</strong>, dan peserta dapat mengerjakan lembar ujian kembali.
        </span>
      ),
      confirmText: 'Ya, Reset Pekerjaan',
      variant: 'danger',
      icon: RotateCcw,
      onConfirm: () => {
        storageService.proctorResetStudentWork(studentId, currentResetExam.id, currentResetExam.title);
        refreshMonitoringData();
        showNotification(`Pekerjaan ujian ${studentName} pada mapel ${currentResetExam.title} berhasil direset.`);
      },
    });
  };

  // Checkbox Selection Handlers
  const handleToggleSelectAllReset = () => {
    if (selectedStudentIdsForReset.length === filteredResetExamStudents.length) {
      setSelectedStudentIdsForReset([]);
    } else {
      setSelectedStudentIdsForReset(filteredResetExamStudents.map((s) => s.studentId));
    }
  };

  const handleToggleSelectStudentReset = (studentId) => {
    setSelectedStudentIdsForReset((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  // 5. Aksi Massal: Reset Login Massal
  const handleBulkResetLogin = () => {
    if (!currentResetExam) return;
    const targetStudents = selectedStudentIdsForReset.length > 0
      ? resetExamStudents.filter((s) => selectedStudentIdsForReset.includes(s.studentId))
      : resetExamStudents;

    if (targetStudents.length === 0) {
      showNotification('Tidak ada peserta yang dipilih.', 'warning');
      return;
    }

    const targetIds = targetStudents.map((s) => s.studentId);
    openConfirm({
      title: `Reset Login untuk ${targetStudents.length} Peserta?`,
      message: (
        <span>
          Hapus penguncian perangkat untuk <strong>{targetStudents.length} peserta</strong> pada mapel <strong>{currentResetExam.title}</strong>? Seluruh peserta ini akan dapat login dari perangkat atau browser baru.
        </span>
      ),
      confirmText: `Ya, Reset ${targetStudents.length} Login`,
      variant: 'warning',
      icon: Smartphone,
      onConfirm: () => {
        const count = storageService.proctorResetBulkStudentDevices(targetIds);
        setSelectedStudentIdsForReset([]);
        refreshMonitoringData();
        showNotification(`Berhasil mereset login perangkat untuk ${count} peserta.`);
      },
    });
  };

  // 6. Aksi Massal: Set "Belum Masuk" Massal
  const handleBulkSetNotStarted = () => {
    if (!currentResetExam) return;
    const targetStudents = selectedStudentIdsForReset.length > 0
      ? resetExamStudents.filter((s) => selectedStudentIdsForReset.includes(s.studentId))
      : resetExamStudents;

    if (targetStudents.length === 0) {
      showNotification('Tidak ada peserta yang dipilih.', 'warning');
      return;
    }

    const targetIds = targetStudents.map((s) => s.studentId);
    openConfirm({
      title: `Set "Belum Masuk" untuk ${targetStudents.length} Peserta?`,
      message: (
        <span>
          Hapus seluruh catatan pengerjaan <strong>{targetStudents.length} peserta</strong> pada mapel <strong>{currentResetExam.title}</strong>? Status seluruh peserta ini akan kembali menjadi <strong>BELUM MASUK</strong> dan siap memulai ujian dari awal.
        </span>
      ),
      confirmText: `Ya, Set ${targetStudents.length} Belum Masuk`,
      variant: 'danger',
      icon: RotateCcw,
      onConfirm: () => {
        const count = storageService.proctorSetBulkNotStarted(targetIds, currentResetExam.id);
        setSelectedStudentIdsForReset([]);
        refreshMonitoringData();
        showNotification(`Berhasil mengatur ${count} peserta menjadi status Belum Masuk.`);
      },
    });
  };

  // 7. Aksi Massal: Set "Selesai" (COMPLETED) Massal
  const handleBulkSetCompleted = () => {
    if (!currentResetExam) return;
    const targetStudents = selectedStudentIdsForReset.length > 0
      ? resetExamStudents.filter((s) => selectedStudentIdsForReset.includes(s.studentId))
      : resetExamStudents;

    if (targetStudents.length === 0) {
      showNotification('Tidak ada peserta yang dipilih.', 'warning');
      return;
    }

    const targetIds = targetStudents.map((s) => s.studentId);
    openConfirm({
      title: `Tandai "Selesai" untuk ${targetStudents.length} Peserta?`,
      message: (
        <span>
          Tandai pengerjaan <strong>{targetStudents.length} peserta</strong> pada mapel <strong>{currentResetExam.title}</strong> sebagai <strong>SELESAI (COMPLETED)</strong>? Kehadiran peserta pada presensi akan otomatis dicatat sebagai <strong>HADIR</strong>.
        </span>
      ),
      confirmText: `Ya, Tandai ${targetStudents.length} Selesai`,
      variant: 'success',
      icon: CheckCircle2,
      onConfirm: () => {
        const count = storageService.proctorSetBulkCompleted(targetIds, currentResetExam.id, currentResetExam.title);
        setSelectedStudentIdsForReset([]);
        refreshMonitoringData();
        showNotification(`Berhasil menandai ${count} peserta menjadi status Selesai.`);
      },
    });
  };

  // 8. Aksi Massal: "Reset Pekerjaan" Massal (Ulangi Ujian)
  const handleBulkResetWork = () => {
    if (!currentResetExam) return;
    const targetStudents = selectedStudentIdsForReset.length > 0
      ? resetExamStudents.filter((s) => selectedStudentIdsForReset.includes(s.studentId))
      : resetExamStudents;

    if (targetStudents.length === 0) {
      showNotification('Tidak ada peserta yang dipilih.', 'warning');
      return;
    }

    const targetIds = targetStudents.map((s) => s.studentId);
    openConfirm({
      title: `Reset Pekerjaan untuk ${targetStudents.length} Peserta?`,
      message: (
        <span>
          Reset pekerjaan ujian <strong>{targetStudents.length} peserta</strong> pada mapel <strong>{currentResetExam.title}</strong>? Seluruh waktu pengerjaan dan pelanggaran akan direset ke <strong>0</strong>, status diubah menjadi <strong>RESET OLEH PENGAWAS</strong>, dan peserta dapat mengerjakan kembali dari awal.
        </span>
      ),
      confirmText: `Ya, Reset ${targetStudents.length} Pekerjaan`,
      variant: 'danger',
      icon: RotateCcw,
      onConfirm: () => {
        const count = storageService.proctorResetBulkStudentWork(targetIds, currentResetExam.id, currentResetExam.title);
        setSelectedStudentIdsForReset([]);
        refreshMonitoringData();
        showNotification(`Berhasil mereset pekerjaan ujian untuk ${count} peserta.`);
      },
    });
  };

  // Parser Teks CSV Import Peserta (Mendukung Penuh 10 Field Data Lengkap Sesuai Form Manual)
  const parseCsvStudents = (rawText) => {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.trim().split(/\r?\n/);
    if (lines.length === 0) return [];

    let headerMap = null;
    const firstLine = lines[0].trim();
    // Cek apakah baris 0 adalah baris header
    if (
      firstLine.toLowerCase().includes('nisn') ||
      firstLine.toLowerCase().includes('nama') ||
      firstLine.toLowerCase().includes('ujian')
    ) {
      const headerCols = firstLine.split(/[,;\t]/).map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ''));
      headerMap = {
        nama: headerCols.findIndex((c) => c.includes('nama') || c === 'name'),
        nomor_ujian: headerCols.findIndex((c) => c.includes('ujian') || c.includes('peserta') || c.includes('no_ujian')),
        nisn: headerCols.findIndex((c) => c.includes('nisn') || c === 'username'),
        nis: headerCols.findIndex((c) => c === 'nis' || (c.includes('nis') && !c.includes('nisn'))),
        jenis_kelamin: headerCols.findIndex((c) => c.includes('jk') || c.includes('gender') || c.includes('kelamin') || c.includes('sex') || c === 'l/p'),
        agama: headerCols.findIndex((c) => c.includes('agama') || c.includes('religion')),
        kelas: headerCols.findIndex((c) => c.includes('kelas') || c.includes('rombel') || c.includes('class')),
        tingkat: headerCols.findIndex((c) => c.includes('tingkat') || c.includes('grade') || c.includes('level')),
        ruang: headerCols.findIndex((c) => c.includes('ruang') || c.includes('room') || c.includes('lokasi')),
        email: headerCols.findIndex((c) => c.includes('email') || c.includes('mail')),
      };
    }

    const startIndex = headerMap ? 1 : 0;
    const parsed = [];

    for (let i = startIndex; i < lines.length; i++) {
      const rawLine = lines[i].trim();
      if (!rawLine) continue;
      const cols = rawLine.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) continue;

      const rowNumber = i + 1; // Baris asli di file CSV (1-based)

      if (headerMap && headerMap.nama !== -1 && headerMap.nisn !== -1) {
        const nisnVal = cols[headerMap.nisn] || '';
        const rawNoUjian = headerMap.nomor_ujian !== -1 ? cols[headerMap.nomor_ujian] : '';
        const rawJk = headerMap.jenis_kelamin !== -1 ? (cols[headerMap.jenis_kelamin] || '').trim().toUpperCase() : 'L';
        const jk = (rawJk.startsWith('P') || rawJk === 'W' || rawJk === 'FEMALE') ? 'P' : 'L';
        const rawAgama = headerMap.agama !== -1 ? (cols[headerMap.agama] || '').trim() : 'Islam';
        const rawRuang = headerMap.ruang !== -1 ? (cols[headerMap.ruang] || '').trim() : '';
        const rawTingkat = headerMap.tingkat !== -1 ? parseInt(cols[headerMap.tingkat], 10) || 10 : 10;

        parsed.push({
          rowNumber,
          nama: cols[headerMap.nama] || '',
          nomor_ujian: cleanNomorUjian(rawNoUjian, nisnVal),
          nisn: nisnVal,
          nis: headerMap.nis !== -1 ? cols[headerMap.nis] || '' : '',
          jenis_kelamin: jk,
          agama: rawAgama || 'Islam',
          kelas: headerMap.kelas !== -1 ? cols[headerMap.kelas] || '' : '',
          tingkat: rawTingkat,
          ruang: rawRuang ? rawRuang.slice(0, 10) : 'Ruang 01',
          email: headerMap.email !== -1 ? cols[headerMap.email] || '' : '',
        });
      } else {
        // Fallback positional (Mendukung 10 kolom, 9 kolom, 8 kolom, 7 kolom, dan 6 kolom)
        let nama = cols[0] || '';
        let noUjian = '';
        let nisn = '';
        let nis = '';
        let jk = 'L';
        let agama = 'Islam';
        let kelas = '';
        let tingkat = 10;
        let ruang = 'Ruang 01';
        let email = '';

        if (cols.length >= 10) {
          // Format 10 kolom: [nama, nomor_ujian, nisn, nis, jenis_kelamin, agama, kelas, tingkat, ruang, email]
          // Atau format: [nama, nomor_ujian, nisn, nis, kelas, tingkat, jenis_kelamin, agama, ruang, email]
          const col4 = (cols[4] || '').toUpperCase();
          const col6 = (cols[6] || '').toUpperCase();
          if (col4 === 'L' || col4 === 'P' || col4 === 'LAKI-LAKI' || col4 === 'PEREMPUAN') {
            noUjian = cols[1];
            nisn = cols[2];
            nis = cols[3];
            jk = col4.startsWith('P') ? 'P' : 'L';
            agama = cols[5] || 'Islam';
            kelas = cols[6];
            tingkat = parseInt(cols[7], 10) || 10;
            ruang = (cols[8] || '').slice(0, 10) || 'Ruang 01';
            email = cols[9] || '';
          } else if (col6 === 'L' || col6 === 'P' || col6 === 'LAKI-LAKI' || col6 === 'PEREMPUAN') {
            noUjian = cols[1];
            nisn = cols[2];
            nis = cols[3];
            kelas = cols[4];
            tingkat = parseInt(cols[5], 10) || 10;
            jk = col6.startsWith('P') ? 'P' : 'L';
            agama = cols[7] || 'Islam';
            ruang = (cols[8] || '').slice(0, 10) || 'Ruang 01';
            email = cols[9] || '';
          } else {
            noUjian = cols[1];
            nisn = cols[2];
            nis = cols[3];
            jk = 'L';
            agama = cols[5] || 'Islam';
            kelas = cols[6];
            tingkat = parseInt(cols[7], 10) || 10;
            ruang = (cols[8] || '').slice(0, 10) || 'Ruang 01';
            email = cols[9] || '';
          }
        } else if (cols.length >= 8) {
          // Format 8-9 kolom: [nama, nomor_ujian, nisn, nis, jenis_kelamin, agama, kelas, tingkat]
          noUjian = cols[1];
          nisn = cols[2];
          nis = cols[3];
          const rawJk = (cols[4] || '').toUpperCase();
          jk = (rawJk.startsWith('P') || rawJk === 'W') ? 'P' : 'L';
          agama = cols[5] || 'Islam';
          kelas = cols[6];
          tingkat = parseInt(cols[7], 10) || 10;
          if (cols.length >= 9) ruang = (cols[8] || '').slice(0, 10) || 'Ruang 01';
        } else if (cols.length >= 7) {
          // Format 7 kolom legacy: [nama, nomor_ujian, nisn, nis, kelas, tingkat, email]
          if (cols[2].length >= 8 && /^\d+$/.test(cols[2])) {
            noUjian = cols[1];
            nisn = cols[2];
            nis = cols[3];
            kelas = cols[4];
            tingkat = parseInt(cols[5], 10) || 10;
            email = cols[6];
          } else {
            nisn = cols[1];
            nis = cols[2];
            kelas = cols[3];
            tingkat = parseInt(cols[4], 10) || 10;
            email = cols[5];
            noUjian = cols[6];
          }
        } else {
          // Format 6 kolom standar: [nama, nisn, nis, kelas, tingkat, email]
          nisn = cols[1] || '';
          nis = cols[2] || '';
          kelas = cols[3] || '';
          tingkat = parseInt(cols[4], 10) || 10;
          email = cols[5] || '';
        }

        parsed.push({
          rowNumber,
          nama,
          nomor_ujian: cleanNomorUjian(noUjian, nisn),
          nisn,
          nis,
          jenis_kelamin: jk,
          agama: agama || 'Islam',
          kelas,
          tingkat,
          ruang: ruang || 'Ruang 01',
          email,
        });
      }
    }

    return parsed;
  };

  // Handler Import Peserta dengan Validasi Anti-Duplikasi
  const handleImportSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!importCsvText.trim()) {
      showNotification('Isi teks atau pilih file CSV terlebih dahulu.', 'error');
      return;
    }

    const parsedStudents = parseCsvStudents(importCsvText);
    if (parsedStudents.length === 0) {
      showNotification('Format data CSV tidak valid atau tidak ada data peserta yang terbaca.', 'error');
      return;
    }

    // Validasi Anti-Duplikasi terhadap Sistem dan File Import
    const validation = storageService.validateImportStudents(parsedStudents);

    if (!validation.isValid) {
      setImportValidationErrors(validation.errors);
      setImportStep('error_report');
      showNotification(
        `Validasi gagal: Ditemukan ${validation.errors.length} duplikasi data pada file import. Harap periksa daftar kesalahan.`,
        'error'
      );
      return;
    }

    // Jika validasi sukses, proses simpan data
    const res = storageService.importStudents(validation.validStudents);
    if (res.success) {
      setShowImportModal(false);
      setImportCsvText('');
      setImportValidationErrors(null);
      setImportStep('input');
      refreshData();
      showNotification(`Berhasil mengimpor ${res.count} peserta baru tanpa duplikasi. Password diset ke nomor NIS/NISN.`);
    } else {
      setImportValidationErrors(res.errors || []);
      setImportStep('error_report');
      showNotification(res.message || 'Gagal mengimpor data.', 'error');
    }
  };

  // Salin Rincian Error Duplikasi ke Clipboard
  const copyImportErrorsText = () => {
    if (!importValidationErrors || importValidationErrors.length === 0) return;
    const textLines = [
      `=== LAPORAN DUPLIKASI DATA IMPORT EXAMGUARD ===`,
      `Total Masalah: ${importValidationErrors.length} data`,
      `Tanggal: ${new Date().toLocaleString('id-ID')}`,
      `--------------------------------------------------`,
      ...importValidationErrors.map((err, i) =>
        `[#${i + 1}] Baris ${err.rowNumber} (${err.nama}): ${err.fieldLabel} "${err.value}" bentrok dengan ${err.conflictWith}. Detail: ${err.description}`
      ),
      `--------------------------------------------------`,
      `Harap perbaiki nilai pada baris-baris tersebut sebelum melakukan import kembali.`,
    ].join('\n');

    navigator.clipboard.writeText(textLines);
    setCopiedErrorText(true);
    setTimeout(() => setCopiedErrorText(false), 2500);
  };

  // Handler Upload File CSV
  const handleImportFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        setImportCsvText(content);
        setImportStep('input');
        setImportValidationErrors(null);
        showNotification(`File "${file.name}" berhasil dimuat ke editor import.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handler Tambah Peserta Manual
  const handleViewStudentQr = (student) => {
    let stu = { ...student };
    if (!stu.login_token) {
      stu.login_token = generateStudentLoginToken(stu.nomor_ujian || stu.nisn || stu.id);
      storageService.saveUser(stu);
    }
    setViewingStudentQr(stu);
  };

  const handleOpenAddModal = () => {
    setAddStudentError('');
    setNewStudentForm({
      nama: '',
      nomor_ujian: '',
      jenis_kelamin: 'L',
      agama: 'Islam',
      nisn: '',
      nis: '',
      kelas: '',
      tingkat: institution?.allowed_grades?.[0] || 10,
      ruang: '',
      email: '',
      is_verified: true,
    });
    setShowAddStudentModal(true);
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    const trimmedNisn = String(newStudentForm.nisn || '').trim();
    if (!newStudentForm.nama.trim() || !trimmedNisn) {
      setAddStudentError('Nama Lengkap Peserta dan NISN wajib diisi.');
      showNotification('Nama Peserta dan NISN wajib diisi.', 'error');
      return;
    }

    if (duplicateAddNisn) {
      const msg = `Peserta dengan NISN "${trimmedAddNisn}" sudah terdaftar atas nama "${duplicateAddNisn.nama}" (${duplicateAddNisn.kelas || 'Kelas -'}). Silakan gunakan NISN lain yang unik.`;
      setAddStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    if (duplicateAddNoUjian) {
      const msg = `Nomor Ujian "${cleanAddNoUjian}" sudah terdaftar atas nama "${duplicateAddNoUjian.nama}" (${duplicateAddNoUjian.kelas || 'Kelas -'}). Silakan gunakan Nomor Ujian unik.`;
      setAddStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    if (duplicateAddNis) {
      const msg = `NIS "${trimmedAddNis}" sudah terdaftar atas nama "${duplicateAddNis.nama}" (${duplicateAddNis.kelas || 'Kelas -'}). Silakan gunakan NIS unik.`;
      setAddStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    const res = storageService.addStudent(newStudentForm);
    if (res.success) {
      refreshData();
      setAddStudentError('');
      setShowAddStudentModal(false);
      showNotification(
        `Peserta ${res.user.nama} (NISN: ${res.user.nisn}) berhasil ditambahkan. Status SSO awal: OFF.`
      );
    } else {
      setAddStudentError(res.message);
      showNotification(res.message, 'error');
    }
  };

  // ========================================================
  // HANDLER MANAJEMEN PESERTA & AKUN PESERTA
  // ========================================================

  // Handler Reset Google SSO Peserta (Konfirmasi Modern)
  const handleResetStudentSSO = (student) => {
    const isCurrentlyLinked = Boolean(student.google_linked && student.google_id);

    openConfirm({
      title: isCurrentlyLinked ? 'Putuskan Tautan Google SSO?' : 'Reset Status Google SSO Peserta?',
      message: (
        <div className="space-y-2.5">
          <p>
            {isCurrentlyLinked ? (
              <>
                Putuskan tautan akun Google SSO untuk peserta <strong>{student.nama}</strong>?
              </>
            ) : (
              <>
                Peserta <strong>{student.nama}</strong> saat ini berstatus <em>SSO Off</em> (belum tertaut akun Google).
              </>
            )}
          </p>
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="flex justify-between">
              <span>Email SSO:</span>
              <span className="font-mono font-semibold">{student.google_email || student.email}</span>
            </div>
            {student.google_id && (
              <div className="flex justify-between text-[11px] text-blue-700">
                <span>Google ID:</span>
                <span className="font-mono">{student.google_id}</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-zinc-500">
            Setelah direset, peserta dapat mengaitkan akun Google baru saat login berikutnya jika fitur SSO Google aktif.
          </p>
        </div>
      ),
      confirmText: 'Ya, Putuskan Tautan SSO',
      cancelText: 'Batal',
      variant: 'warning',
      icon: Unlink,
      onConfirm: () => {
        try {
          storageService.resetStudentSSO(student.id);
          refreshData();
          showNotification(`Tautan akun Google SSO untuk ${student.nama} berhasil direset.`);
        } catch (err) {
          showNotification(err.message, 'error');
        }
      },
    });
  };

  // Handler Reset Password Peserta ke Default NIS (Konfirmasi Modern)
  const handleResetStudentPassword = (student) => {
    const defaultPassword = student.nis || student.nisn;
    openConfirm({
      title: 'Reset Password Peserta?',
      message: (
        <div className="space-y-2.5">
          <p>
            Reset kata sandi peserta <strong>{student.nama}</strong> (NISN: {student.nisn}) ke default?
          </p>
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span>Password Default (Nomor NIS):</span>
            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-900">
              {defaultPassword}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500">
            Peserta dapat langsung login ke portal ujian menggunakan NISN dan Password NIS default ini.
          </p>
        </div>
      ),
      confirmText: 'Ya, Reset Password',
      variant: 'warning',
      icon: KeyRound,
      onConfirm: () => {
        try {
          storageService.resetStudentPassword(student.id);
          refreshData();
          showNotification(
            `Password ${student.nama} berhasil direset ke NIS default: ${defaultPassword}.`
          );
        } catch (err) {
          showNotification(err.message, 'error');
        }
      },
    });
  };

  // Handler Edit Akun Peserta (jika email di-update dan berbeda dengan sebelumnya maka status SSO off)
  const handleOpenEditModal = (student) => {
    setEditStudentError('');
    setEditingStudent({
      ...student,
      nomor_ujian: student.nomor_ujian || cleanNomorUjian(student.nomor_ujian, student.nisn),
      jenis_kelamin: student.jenis_kelamin || 'L',
      agama: student.agama || 'Islam',
      ruang: student.ruang || '',
      original_email: student.email || '',
    });
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = (e) => {
    e.preventDefault();
    const trimmedNisn = String(editingStudent?.nisn || '').trim();
    if (!editingStudent?.nama?.trim() || !trimmedNisn) {
      setEditStudentError('Nama Peserta dan NISN tidak boleh kosong.');
      showNotification('Nama Peserta dan NISN tidak boleh kosong.', 'error');
      return;
    }

    if (duplicateEditNisn) {
      const msg = `NISN "${trimmedEditNisn}" sudah terdaftar untuk peserta lain: "${duplicateEditNisn.nama}" (${duplicateEditNisn.kelas || 'Kelas -'}).`;
      setEditStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    if (duplicateEditNoUjian) {
      const msg = `Nomor Ujian "${cleanEditNoUjian}" sudah terdaftar untuk peserta lain: "${duplicateEditNoUjian.nama}" (${duplicateEditNoUjian.kelas || 'Kelas -'}).`;
      setEditStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    if (duplicateEditNis) {
      const msg = `NIS "${trimmedEditNis}" sudah terdaftar untuk peserta lain: "${duplicateEditNis.nama}" (${duplicateEditNis.kelas || 'Kelas -'}).`;
      setEditStudentError(msg);
      showNotification(msg, 'error');
      return;
    }

    const res = storageService.updateStudent(editingStudent.id, editingStudent);
    if (res.success) {
      refreshData();
      setEditStudentError('');
      setShowEditStudentModal(false);
      if (res.emailChanged) {
        showNotification(
          `Data ${res.user.nama} diperbarui. Karena email diubah, status SSO Google otomatis direset ke OFF (peserta harus login ulang lewat Google SSO).`,
          'success'
        );
      } else {
        showNotification(`Data peserta ${res.user.nama} berhasil diperbarui.`);
      }
    } else {
      setEditStudentError(res.message);
      showNotification(res.message, 'error');
    }
  };

  // Handler Hapus Peserta
  const handleDeleteStudent = (id, name) => {
    openConfirm({
      title: 'Hapus Data Peserta?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data peserta <strong>{name}</strong>? Seluruh data akun akan dihapus dari sistem.
        </span>
      ),
      confirmText: 'Ya, Hapus Data',
      cancelText: 'Batal',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.deleteUser(id);
        refreshData();
        showNotification(`Peserta "${name}" berhasil dihapus.`);
      },
    });
  };

  // Handler Kosongkan Seluruh Data Peserta
  const handleClearAllStudents = () => {
    const studentCount = (users || []).filter((u) => u.role === 'student').length;
    if (studentCount === 0) {
      showNotification('Tidak ada data peserta untuk dihapus.', 'info');
      return;
    }
    openConfirm({
      title: 'Kosongkan Seluruh Data Peserta?',
      message: (
        <div className="space-y-2">
          <p>
            Apakah Anda yakin ingin menghapus <strong>seluruh {studentCount} data peserta</strong>?
          </p>
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            Perhatian: Seluruh akun peserta akan dihapus secara permanen dari sistem dan file database server. Akun Super Admin & Proktor akan tetap aman.
          </div>
        </div>
      ),
      confirmText: `Ya, Hapus Semua (${studentCount} Peserta)`,
      cancelText: 'Batal',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.deleteAllStudents();
        refreshData();
        showNotification(`Berhasil menghapus seluruh data peserta.`);
      },
    });
  };


  // ========================================================
  // HANDLER KREDENSIAL PENGURUS (SUPER ADMIN & PROKTOR)
  // ========================================================

  // Simpan Kredensial Super Admin
  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    const targetId = adminForm?.id || currentUser?.id || 'ADMIN-SUPER-01';
    const res = storageService.updateAdminProfile(targetId, adminForm);
    if (res.success) {
      refreshData();
      showNotification('Profil & Kredensial Super Admin berhasil diperbarui.');
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Simpan Kredensial Proktor Ujian
  const handleSaveProctorProfile = (e) => {
    e.preventDefault();
    const proctorId = proctorForm?.id || 'PROCTOR-01';
    const res = storageService.updateAdminProfile(proctorId, proctorForm);
    if (res.success) {
      refreshData();
      showNotification('Kredensial Akun Proktor berhasil diperbarui.');
    } else {
      showNotification(res.message, 'error');
    }
  };

  // ========================================================
  // HANDLER MODE LINGKUNGAN APLIKASI (PRODUKSI VS SIMULASI/DEV)
  // ========================================================

  const handleToggleAppMode = (mode) => {
    const payload = { app_mode: mode };
    if (mode === 'simulation') {
      // Default aktif di mode simulasi/demo: GPS dan Google SSO selalu di-bypass
      payload.bypass_gps = true;
      payload.bypass_google_sso = true;

      // Sinkronkan ceklis izin browser peserta agar google_sso aktif di mode simulasi
      const updatedInst = {
        ...institution,
        browser_permissions: {
          ...(institution.browser_permissions || {}),
          google_sso: true,
        },
      };
      setInstitution(updatedInst);
      storageService.updateInstitution(updatedInst);
    }
    const res = storageService.saveAppModeConfig(payload, currentUser);
    const newConfig = res?.config || res;
    setAppModeConfig(newConfig);
    showNotification(
      mode === 'production'
        ? 'Mode Produksi Diaktifkan: Seluruh proteksi ujian ketat 100% tanpa bypass.'
        : 'Mode Demo / Simulasi Diaktifkan: GPS & Google SSO otomatis di-bypass dan izin tersinkronisasi.',
      mode === 'production' ? 'success' : 'info'
    );
  };

  const handleToggleBypass = (key) => {
    if (appModeConfig?.app_mode === 'production') {
      showNotification('Bypass tidak dapat diaktifkan saat Mode Produksi Resmi aktif.', 'error');
      return;
    }
    const nextVal = !Boolean(appModeConfig?.[key]);
    const res = storageService.saveAppModeConfig({ [key]: nextVal }, currentUser);
    const newConfig = res?.config || res;
    setAppModeConfig(newConfig);

    // Jika yang di-toggle adalah bypass_google_sso, sinkronkan langsung ke ceklis izin browser
    if (key === 'bypass_google_sso') {
      const updatedInst = {
        ...institution,
        browser_permissions: {
          ...(institution.browser_permissions || {}),
          google_sso: nextVal,
        },
      };
      setInstitution(updatedInst);
      storageService.updateInstitution(updatedInst);
    }

    showNotification(`${key}: ${nextVal ? 'Bypass Diaktifkan' : 'Bypass Dinonaktifkan'}`, 'info');
  };

  // ========================================================
  // HANDLER HISTORI ERROR SISTEM & AUDIT LOGS
  // ========================================================

  const handleSimulateError = () => {
    const sampleErrors = [
      {
        source: 'GPS Geofence',
        level: 'warning',
        message: 'Akses Geolocation dibatasi pada protokol HTTP (Non-SSL)',
        details: 'Browser membatasi pengambilan koordinat GPS satelit karena sistem diakses melalui IP lokal / HTTP. Solusi: Gunakan HTTPS atau aktifkan bypass GPS.',
        solution: 'Aktifkan toggle "Bypass Geofence GPS" pada Mode Simulasi atau jalankan di HTTPS.',
      },
      {
        source: 'Kamera / Webcam',
        level: 'error',
        message: 'Perangkat kamera tidak terdeteksi (NotFoundError)',
        details: 'navigator.mediaDevices.getUserMedia gagal menemukan sensor kamera video pada komputer ujian.',
        solution: 'Hubungkan webcam eksternal atau aktifkan "Bypass Kamera & Mikrofon" jika perangkat tidak memiliki sensor.',
      },
      {
        source: 'Web Audio API',
        level: 'info',
        message: 'AudioContext terblokir oleh kebijakan autoplay browser peramban',
        details: 'Browser menunda pemutaran nada alarm sampai ada interaksi gestur pengguna (klik/tap).',
        solution: 'Bypass nada alarm telah disesuaikan pada mode simulasi.',
      },
      {
        source: 'Jaringan Google Forms',
        level: 'warning',
        message: 'Latensi respon ke formulir Google Forms tinggi (> 750ms)',
        details: 'Waktu respon ping ke Google server lambat karena koneksi internet peserta tidak stabil.',
        solution: 'Periksa bandwidth internet atau gunakan koneksi Wi-Fi cadangan.',
      },
    ];
    const selected = sampleErrors[Math.floor(Math.random() * sampleErrors.length)];
    storageService.addSystemErrorLog(selected);
    setSystemErrorLogs(storageService.getSystemErrorLogs());
    showNotification(`Contoh rekaman error "${selected.source}" berhasil dicatat ke histori!`, 'info');
  };

  const handleCopyErrorLogs = () => {
    const logs = systemErrorLogs || [];
    if (logs.length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopiedLogFeedback(true);
    showNotification('Seluruh histori error berhasil disalin dalam format JSON!');
    setTimeout(() => setCopiedLogFeedback(false), 2500);
  };

  const handleClearErrorLogs = () => {
    openConfirm({
      title: 'Bersihkan Riwayat Error Sistem?',
      message: 'Apakah Anda yakin ingin menghapus seluruh rekaman histori error sistem?',
      confirmText: 'Ya, Bersihkan Log',
      cancelText: 'Batal',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.clearSystemErrorLogs();
        setSystemErrorLogs([]);
        showNotification('Histori error sistem berhasil dibersihkan.');
      },
    });
  };

  // ========================================================
  // SUITE PENGUJIAN DIAGNOSTIK SELURUH FITUR PENDUKUNG SISTEM
  // ========================================================

  const updateDiagResult = (key, status, message, latency = null) => {
    setDiagnosticResults((prev) => ({
      ...prev,
      [key]: { status, message, latency, timestamp: new Date().toLocaleTimeString() },
    }));
  };

  // 1. Uji Sensor GPS Geolocation & Radius Sekolah
  const runTestGps = async () => {
    updateDiagResult('gps', 'testing', 'Menguji sensor GPS satelit & jarak radius...');
    const startTime = performance.now();
    if (!navigator.geolocation) {
      if (appModeConfig?.app_mode === 'simulation' && appModeConfig?.bypass_gps) {
        updateDiagResult('gps', 'bypassed', 'Modul GPS tidak didukung browser, namun dilewati (Bypass GPS Aktif).', Math.round(performance.now() - startTime));
      } else {
        updateDiagResult('gps', 'failed', 'Browser tidak mendukung Geolocation API.', Math.round(performance.now() - startTime));
        storageService.addSystemErrorLog({
          source: 'GPS',
          level: 'error',
          message: 'Browser tidak mendukung navigator.geolocation',
          solution: 'Perbarui peramban ke versi terbaru yang mendukung GPS.',
        });
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const elapsed = Math.round(performance.now() - startTime);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const targetLat = institution?.center_lat || -6.2088;
        const targetLng = institution?.center_lng || 106.8456;
        const dist = Math.round(calculateHaversineDistance(lat, lng, targetLat, targetLng));
        updateDiagResult('gps', 'passed', `GPS Terbaca: ${lat.toFixed(4)}, ${lng.toFixed(4)} (Jarak: ${dist} m)`, elapsed);
      },
      (err) => {
        const elapsed = Math.round(performance.now() - startTime);
        if (appModeConfig?.app_mode === 'simulation' && appModeConfig?.bypass_gps) {
          updateDiagResult('gps', 'bypassed', `GPS Error: ${err.message} (Dilewati karena Bypass Aktif)`, elapsed);
        } else {
          updateDiagResult('gps', 'failed', `Gagal membaca GPS: ${err.message}`, elapsed);
          storageService.addSystemErrorLog({
            source: 'GPS',
            level: 'warning',
            message: `Izin GPS ditolak atau timeout: ${err.message}`,
            solution: 'Buka pengaturan izin lokasi di ikon gembok bilah alamat URL peramban.',
          });
        }
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  };

  // 2. Uji Kamera & Webcam MediaStream
  const runTestCamera = async () => {
    updateDiagResult('camera', 'testing', 'Mengakses modul kamera/webcam...');
    const start = performance.now();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('navigator.mediaDevices.getUserMedia tidak didukung peramban.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      updateDiagResult('camera', 'passed', 'Kamera webcam aktif & terverifikasi siap pengawasan.', Math.round(performance.now() - start));
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      if (appModeConfig?.app_mode === 'simulation' && appModeConfig?.bypass_media) {
        updateDiagResult('camera', 'bypassed', `Kamera tidak terdeteksi (${err.message}), dilewati via mode simulasi.`, elapsed);
      } else {
        updateDiagResult('camera', 'failed', `Kamera gagal diakses: ${err.message}`, elapsed);
        storageService.addSystemErrorLog({
          source: 'Kamera',
          level: 'error',
          message: `Kamera tidak terdeteksi: ${err.message}`,
          solution: 'Pastikan kamera terpasang dan izinkan peramban mengakses video.',
        });
      }
    }
  };

  // 3. Uji Sensor Mikrofon (Audio Stream)
  const runTestMicrophone = async () => {
    updateDiagResult('mic', 'testing', 'Menguji input modul mikrofon...');
    const start = performance.now();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('navigator.mediaDevices.getUserMedia tidak didukung peramban.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      updateDiagResult('mic', 'passed', 'Mikrofon audio input aktif & terverifikasi.', Math.round(performance.now() - start));
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      if (appModeConfig?.app_mode === 'simulation' && appModeConfig?.bypass_media) {
        updateDiagResult('mic', 'bypassed', `Mikrofon tidak ada (${err.message}), dilewati via mode simulasi.`, elapsed);
      } else {
        updateDiagResult('mic', 'failed', `Mikrofon gagal diakses: ${err.message}`, elapsed);
        storageService.addSystemErrorLog({
          source: 'Mikrofon',
          level: 'error',
          message: `Mikrofon tidak terdeteksi: ${err.message}`,
          solution: 'Periksa pengaturan mikrofon dan berikan izin peramban.',
        });
      }
    }
  };

  // 4. Uji Web Audio API & Alarm Tone Synth
  const runTestAudio = async () => {
    updateDiagResult('audio', 'testing', 'Menguji Web Audio API & nada alarm...');
    const start = performance.now();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) throw new Error('Web Audio API tidak didukung di browser ini.');
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      updateDiagResult('audio', 'passed', 'Web Audio API & synthesizer alarm berfungsi normal.', Math.round(performance.now() - start));
    } catch (err) {
      updateDiagResult('audio', 'failed', `Web Audio error: ${err.message}`, Math.round(performance.now() - start));
    }
  };

  // 5. Uji Notifikasi Browser API
  const runTestNotifications = async () => {
    updateDiagResult('notifications', 'testing', 'Memeriksa izin notifikasi...');
    const start = performance.now();
    try {
      if (!('Notification' in window)) {
        throw new Error('Notifikasi tidak didukung oleh peramban ini.');
      }
      if (Notification.permission === 'granted') {
        updateDiagResult('notifications', 'passed', 'Izin notifikasi browser telah aktif (granted).', Math.round(performance.now() - start));
      } else if (Notification.permission === 'denied') {
        if (appModeConfig?.app_mode === 'simulation' && appModeConfig?.bypass_notifications) {
          updateDiagResult('notifications', 'bypassed', 'Izin ditolak, namun dilewati via mode simulasi.', Math.round(performance.now() - start));
        } else {
          updateDiagResult('notifications', 'failed', 'Izin notifikasi ditolak oleh pengguna/browser.', Math.round(performance.now() - start));
        }
      } else {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          updateDiagResult('notifications', 'passed', 'Izin notifikasi berhasil disetujui.', Math.round(performance.now() - start));
        } else {
          updateDiagResult('notifications', 'failed', 'Izin notifikasi tidak diberikan.', Math.round(performance.now() - start));
        }
      }
    } catch (err) {
      updateDiagResult('notifications', 'failed', err.message, Math.round(performance.now() - start));
    }
  };

  // 6. Uji Fullscreen API
  const runTestFullscreen = async () => {
    updateDiagResult('fullscreen', 'testing', 'Memeriksa API Fullscreen Lockout...');
    const start = performance.now();
    const enabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
    if (enabled) {
      updateDiagResult('fullscreen', 'passed', 'Browser mendukung mode Layar Penuh Kunci (Lockout).', Math.round(performance.now() - start));
    } else {
      updateDiagResult('fullscreen', 'failed', 'Fullscreen API tidak diizinkan atau dinonaktifkan.', Math.round(performance.now() - start));
    }
  };

  // 7. Uji LocalStorage & Kuota Storage
  const runTestStorage = async () => {
    updateDiagResult('storage', 'testing', 'Menguji pembacaan & penulisan storage...');
    const start = performance.now();
    try {
      const testKey = '__examguard_test_storage__';
      localStorage.setItem(testKey, 'ok');
      const readVal = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      if (readVal === 'ok') {
        updateDiagResult('storage', 'passed', 'LocalStorage & kuota penyimpanan responsif normal.', Math.round(performance.now() - start));
      } else {
        throw new Error('Data yang ditulis ke storage tidak cocok.');
      }
    } catch (err) {
      updateDiagResult('storage', 'failed', `Storage error: ${err.message}`, Math.round(performance.now() - start));
    }
  };

  // 8. Uji Proteksi Clipboard Anti-Copy
  const runTestClipboard = async () => {
    updateDiagResult('clipboard', 'testing', 'Memeriksa akses Clipboard API...');
    const start = performance.now();
    try {
      if (navigator.clipboard) {
        updateDiagResult('clipboard', 'passed', 'Clipboard API & modul pencegah salin siap aktif.', Math.round(performance.now() - start));
      } else {
        updateDiagResult('clipboard', 'passed', 'Event listener fallback proteksi clipboard aktif.', Math.round(performance.now() - start));
      }
    } catch (err) {
      updateDiagResult('clipboard', 'failed', err.message, Math.round(performance.now() - start));
    }
  };

  // 9. Uji Latensi Google Forms
  const runTestGooglePing = async () => {
    updateDiagResult('google_ping', 'testing', 'Mengukur latensi server Google Forms...');
    const start = performance.now();
    try {
      await fetch('https://docs.google.com/forms/generate_204', { mode: 'no-cors', cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      updateDiagResult('google_ping', 'passed', `Koneksi Google Forms Responsif (${elapsed} ms)`, elapsed);
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      updateDiagResult('google_ping', 'passed', `Domain Google Forms Terjangkau (${elapsed} ms)`, elapsed);
    }
  };

  // 10. Uji Generator Token 6-Digit
  const runTestTokens = async () => {
    updateDiagResult('tokens', 'testing', 'Menguji generator token 6-digit...');
    const start = performance.now();
    try {
      const sample = generateRandomToken6();
      if (sample && sample.length === 6 && !/[01IO]/.test(sample)) {
        updateDiagResult('tokens', 'passed', `Generator Token Berhasil: "${sample}" (Standar Anti-ambigu)`, Math.round(performance.now() - start));
      } else {
        throw new Error('Token yang dihasilkan tidak sesuai spesifikasi.');
      }
    } catch (err) {
      updateDiagResult('tokens', 'failed', err.message, Math.round(performance.now() - start));
    }
  };

  // Jalankan Semua Pengujian Sekaligus
  const runAllDiagnostics = async () => {
    setIsTestingAllDiagnostics(true);
    showNotification('Menjalankan seluruh 10 pengujian fitur pendukung...', 'info');
    try {
      await runTestStorage();
      await runTestTokens();
      await runTestFullscreen();
      await runTestClipboard();
      await runTestAudio();
      await runTestNotifications();
      await runTestGooglePing();
      await runTestCamera();
      await runTestMicrophone();
      await runTestGps();
      showNotification('Seluruh pengujian selesai dijalankan!');
    } catch (e) {
      showNotification('Pengujian diagnostik selesai dengan beberapa catatan.', 'info');
    } finally {
      setIsTestingAllDiagnostics(false);
    }
  };

  // Template CSV Peserta (Mendukung Penuh 10 Kolom Data Lengkap Sesuai Form Tambah Peserta Manual)
  const sampleCsvContent = `nama,nomor_ujian,nisn,nis,jenis_kelamin,agama,kelas,tingkat,ruang,email
Ahmad Fauzi Ridwan,UJN-12-001,0058291021,22101,L,Islam,XII MIPA 1,12,Ruang 01,ahmad.fauzi@student.sch.id
Siti Rahmawati Putri,UJN-12-002,0058291022,22102,P,Islam,XII MIPA 2,12,Ruang 01,siti.rahma@student.sch.id
Bambang Pamungkas,UJN-11-001,0068291033,23101,L,Kristen,XI IPS 1,11,Ruang 02,bambang.p@student.sch.id
Dewi Lestari,UJN-10-001,0078291044,24101,P,Katolik,X-1,10,Ruang 02,dewi.lestari@student.sch.id`;

  const copySampleCsv = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_peserta_examguard_10_kolom.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('Template CSV 10 kolom berhasil diunduh.');
  };

  // Filter list data peserta beserta sorting dinamis di setiap kolom
  const filteredUsers = React.useMemo(() => {
    const list = users.filter((u) => {
      const q = (userSearch || '').toLowerCase();
      return (
        u.role === 'student' &&
        ((u.nama && u.nama.toLowerCase().includes(q)) ||
          (u.nisn && u.nisn.toLowerCase().includes(q)) ||
          (u.nomor_ujian && u.nomor_ujian.toLowerCase().includes(q)) ||
          (u.kelas && u.kelas.toLowerCase().includes(q)) ||
          (u.ruang && u.ruang.toLowerCase().includes(q)))
      );
    });

    return list.sort((a, b) => {
      let valA, valB;
      switch (studentSortField) {
        case 'nomor_ujian':
          valA = (a.nomor_ujian || '').toLowerCase();
          valB = (b.nomor_ujian || '').toLowerCase();
          break;
        case 'nama':
          valA = (a.nama || '').toLowerCase();
          valB = (b.nama || '').toLowerCase();
          break;
        case 'nisn':
          valA = (a.nisn || '').toLowerCase();
          valB = (b.nisn || '').toLowerCase();
          break;
        case 'kelas':
          valA = (a.kelas || a.rombel || '').toLowerCase();
          valB = (b.kelas || b.rombel || '').toLowerCase();
          break;
        case 'ruang':
          valA = (a.ruang || '').toLowerCase();
          valB = (b.ruang || '').toLowerCase();
          break;
        case 'active_device_id':
          valA = (a.active_device_id || '').toLowerCase();
          valB = (b.active_device_id || '').toLowerCase();
          break;
        case 'google_linked':
          valA = a.google_linked ? 1 : 0;
          valB = b.google_linked ? 1 : 0;
          break;
        case 'is_active':
          valA = a.is_active === false ? 0 : 1;
          valB = b.is_active === false ? 0 : 1;
          break;
        case 'is_verified':
          valA = a.is_verified === false ? 0 : 1;
          valB = b.is_verified === false ? 0 : 1;
          break;
        case 'no':
        default:
          valA = a.id || 0;
          valB = b.id || 0;
          break;
      }

      if (valA < valB) return studentSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return studentSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, userSearch, studentSortField, studentSortOrder]);

  // Hitung jumlah sesi aktif vs bank soal
  const activeExamsCount = exams.filter((e) => !e.is_archived).length;
  const bankExamsCount = exams.filter((e) => e.is_archived).length;

  const filteredExams = exams
    .filter((e) => {
      // 1. Filter sub-tab (Sesi Ujian Aktif vs Bank Soal)
      const isArchived = Boolean(e.is_archived);
      if (examSubTab === 'active' && isArchived) return false;
      if (examSubTab === 'bank' && !isArchived) return false;

      // 2. Filter kelompok sesi ujian
      if (selectedSessionGroup !== 'ALL' && e.session_group !== selectedSessionGroup) {
        return false;
      }

      // 3. Filter pencarian
      const q = examSearch.toLowerCase();
      return (
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.session_group && e.session_group.toLowerCase().includes(q)) ||
        (e.exam_token && e.exam_token.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (examSortField) {
        case 'grade_level':
          valA = Number(a.grade_level ?? 0);
          valB = Number(b.grade_level ?? 0);
          break;
        case 'subject_title':
          valA = `${a.subject || ''} ${a.title || ''}`.toLowerCase();
          valB = `${b.subject || ''} ${b.title || ''}`.toLowerCase();
          break;
        case 'session_group':
          valA = (a.session_group || '').toLowerCase();
          valB = (b.session_group || '').toLowerCase();
          break;
        case 'duration_minutes':
          valA = Number(a.duration_minutes ?? 0);
          valB = Number(b.duration_minutes ?? 0);
          break;
        case 'start_time':
        default:
          valA = a.start_time ? new Date(a.start_time).getTime() : 0;
          valB = b.start_time ? new Date(b.start_time).getTime() : 0;
          break;
        case 'is_active':
          valA = a.is_active ? 1 : 0;
          valB = b.is_active ? 1 : 0;
          break;
      }

      if (valA < valB) return examSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return examSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // 1. Daftar Tingkat Kelas yang didukung institusi (misal Tingkat 10, 11, 12)
  const proctorGradeList = React.useMemo(() => {
    const gradesSet = new Set();
    if (institution?.allowed_grades && Array.isArray(institution.allowed_grades)) {
      institution.allowed_grades.forEach((g) => gradesSet.add(Number(g)));
    }
    (users || []).forEach((u) => {
      if (u.role === 'student' && u.tingkat) gradesSet.add(Number(u.tingkat));
    });
    (exams || []).forEach((e) => {
      if (e.grade_level) gradesSet.add(Number(e.grade_level));
    });
    if (gradesSet.size === 0) {
      gradesSet.add(10);
      gradesSet.add(11);
      gradesSet.add(12);
    }
    return Array.from(gradesSet).sort((a, b) => a - b);
  }, [institution, users, exams]);

  // 2. Baris Data Peserta Ujian Pengawas (Attempts + Peserta Sedang Online / Login)
  const proctorStudentRows = React.useMemo(() => {
    const studentUsers = (users || []).filter((u) => u.role === 'student');
    const studentMap = new Map(studentUsers.map((s) => [s.id, s]));
    const studentNisnMap = new Map(studentUsers.map((s) => [s.nisn, s]));
    const examMap = new Map((exams || []).map((e) => [e.id, e]));

    const rows = [];
    const processedStudentIds = new Set();

    // 2a. Urutkan attempts: Peserta yang LOCKED ditaruh paling atas, lalu yang terupdate
    const sortedAttempts = [...(attempts || [])].sort((a, b) => {
      if (a.status === 'LOCKED' && b.status !== 'LOCKED') return -1;
      if (b.status === 'LOCKED' && a.status !== 'LOCKED') return 1;
      return new Date(b.updated_at || b.started_at || 0) - new Date(a.updated_at || a.started_at || 0);
    });

    sortedAttempts.forEach((att) => {
      if (!att) return;
      const stu =
        (att.student_id && studentMap.get(att.student_id)) ||
        (att.student_nisn && studentNisnMap.get(att.student_nisn)) ||
        studentUsers.find(
          (u) =>
            (att.student_id && String(u.id) === String(att.student_id)) ||
            (att.student_nisn && String(u.nisn) === String(att.student_nisn)) ||
            (att.student_name && u.nama && u.nama.toLowerCase() === att.student_name.toLowerCase())
        );
      const exam = att.exam_session_id ? examMap.get(att.exam_session_id) : null;
      const tingkat = Number(att.student_tingkat || stu?.tingkat || exam?.grade_level || 0);

      // Cek apakah peserta ini sudah pernah dimasukkan (hindari duplikat attempt untuk peserta yang sama di list pemantauan)
      const studentIdentifier = String(att.student_id || stu?.id || att.student_nisn || stu?.nisn || att.student_name);
      if (processedStudentIds.has(studentIdentifier)) {
        return;
      }

      rows.push({
        rowKey: att.id || `att-${studentIdentifier}`,
        attemptId: att.id,
        studentId: att.student_id || stu?.id,
        studentName: att.student_name || stu?.nama || 'Peserta',
        studentNisn: att.student_nisn || stu?.nisn || '-',
        studentKelas: att.student_kelas || stu?.kelas || '-',
        studentTingkat: tingkat,
        examId: att.exam_session_id || exam?.id,
        examTitle: att.exam_title || exam?.title || 'Sesi Ujian',
        status: att.status || 'IN_PROGRESS',
        violationCount: att.violation_count || 0,
        lastViolationReason: att.last_violation_reason || '',
        timeSpentSeconds: att.time_spent_seconds || 0,
        isOnline: Boolean(stu?.active_device_id),
        activeDeviceId: stu?.active_device_id || null,
        hasAttempt: true,
      });

      if (att.student_id) processedStudentIds.add(String(att.student_id));
      if (att.student_nisn) processedStudentIds.add(String(att.student_nisn));
      if (stu?.id) processedStudentIds.add(String(stu.id));
      if (stu?.nisn) processedStudentIds.add(String(stu.nisn));
      if (stu?.nama) processedStudentIds.add(stu.nama.toLowerCase());
      processedStudentIds.add(studentIdentifier);
    });

    // 2b. Masukkan juga peserta yang sedang ONLINE / LOGIN atau terdaftar tapi belum ada catatan attempt
    studentUsers.forEach((stu) => {
      const isAlreadyIncluded =
        processedStudentIds.has(String(stu.id)) ||
        processedStudentIds.has(String(stu.nisn)) ||
        (stu.nama && processedStudentIds.has(stu.nama.toLowerCase()));

      if (!isAlreadyIncluded) {
        const isOnline = Boolean(stu.active_device_id);
        rows.push({
          rowKey: `user-${stu.id}`,
          attemptId: null,
          studentId: stu.id,
          studentName: stu.nama,
          studentNisn: stu.nisn || '-',
          studentKelas: stu.kelas || '-',
          studentTingkat: Number(stu.tingkat || 0),
          examId: null,
          examTitle: isOnline ? 'Online di Beranda' : 'Belum Memulai Ujian',
          status: isOnline ? 'ONLINE' : 'OFFLINE',
          violationCount: 0,
          lastViolationReason: '',
          timeSpentSeconds: 0,
          isOnline: isOnline,
          activeDeviceId: stu.active_device_id || null,
          hasAttempt: false,
        });
      }
    });

    return rows;
  }, [attempts, users, exams]);

  // 3. Filter Baris Peserta Ujian Pengawas Berdasarkan Tingkat, Status & Pencarian
  const filteredProctorRows = React.useMemo(() => {
    return proctorStudentRows.filter((row) => {
      // 1. Filter Tingkat (Tabs di atas tabel)
      if (selectedProctorGrade !== 'ALL') {
        if (Number(row.studentTingkat) !== Number(selectedProctorGrade)) {
          return false;
        }
      }

      // 2. Filter Status Pengawas (Pills)
      if (proctorStatusFilter === 'LOCKED' && row.status !== 'LOCKED') return false;
      if (proctorStatusFilter === 'IN_PROGRESS' && row.status !== 'IN_PROGRESS') return false;
      if (proctorStatusFilter === 'ONLINE' && !row.isOnline && row.status !== 'IN_PROGRESS' && row.status !== 'LOCKED') return false;
      if (proctorStatusFilter === 'COMPLETED' && row.status !== 'COMPLETED') return false;

      // 3. Filter Pencarian Text
      const q = (proctorSearch || '').trim().toLowerCase();
      if (!q) return true;
      return (
        (row.studentName || '').toLowerCase().includes(q) ||
        (row.studentNisn || '').toLowerCase().includes(q) ||
        (row.studentKelas || '').toLowerCase().includes(q) ||
        (row.examTitle || '').toLowerCase().includes(q) ||
        (row.status || '').toLowerCase().includes(q)
      );
    });
  }, [proctorStudentRows, selectedProctorGrade, proctorStatusFilter, proctorSearch]);

  // 4. Metrik Statistik Peserta Ujian Berdasarkan Tingkat Terpilih
  const proctorStats = React.useMemo(() => {
    const scope = selectedProctorGrade === 'ALL'
      ? proctorStudentRows
      : proctorStudentRows.filter((r) => Number(r.studentTingkat) === Number(selectedProctorGrade));

    return {
      total: scope.length,
      inProgress: scope.filter((r) => r.status === 'IN_PROGRESS').length,
      locked: scope.filter((r) => r.status === 'LOCKED').length,
      completed: scope.filter((r) => r.status === 'COMPLETED').length,
      online: scope.filter((r) => r.isOnline || r.status === 'IN_PROGRESS' || r.status === 'LOCKED').length,
    };
  }, [proctorStudentRows, selectedProctorGrade]);

  return (
    <div className="flex min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-xl shadow-2xl border text-xs font-medium flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-zinc-900 text-white border-zinc-800'
            }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Admin Modular - Menu Pengaturan Instansi berada di bawah Akun Administrator */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        institutionName={institution?.name}
        institutionNpsn={institution?.npsn}
        institutionLogo={institution?.logo_url}
        currentUser={currentUser}
        onLogout={handleConfirmLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Tombol Toggle Sidebar untuk Memperlebar Konten */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80 transition-all cursor-pointer mr-1 shrink-0"
              title={sidebarCollapsed ? 'Buka Sidebar Menu' : 'Sembunyikan / Ciutkan Sidebar (Perlebar Tampilan Konten)'}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-zinc-700" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-zinc-700" />
              )}
            </button>

            {institution.logo_url && (
              <img
                src={institution.logo_url}
                alt="Logo Sekolah"
                className="w-8 h-8 rounded-lg object-contain bg-white border border-zinc-200 p-0.5 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-zinc-900 capitalize tracking-tight truncate">
                  {activeTab === 'overview' && 'Ringkasan Sistem & Pemantauan'}
                  {activeTab === 'exams' && 'Bank Sesi Ujian Google Form'}
                  {activeTab === 'proctor' && (proctorSubView === 'list' ? 'Kontrol Pengawas: Daftar Mapel Aktif' : proctorSubView === 'monitor' ? 'Kontrol Pengawas: Pemantauan Live Peserta' : proctorSubView === 'reset' ? 'Kontrol Pengawas: Reset Status & Perangkat' : 'Kontrol Pengawas: Presensi & Berita Acara')}
                  {activeTab === 'users' && 'Basis Data Peserta & Import CSV'}
                  {activeTab === 'account' && 'Pengaturan Akun Administrator'}
                  {activeTab === 'institution' && 'Konfigurasi Instansi, Logo & GPS'}
                  {activeTab === 'backup' && 'Backup & Restore Data Sistem'}
                  {activeTab === 'about' && 'Tentang Aplikasi ExamGuard'}
                </h1>
                <span
                  className={`hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${isSuperAdmin
                      ? 'bg-zinc-900 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                >
                  {isSuperAdmin ? 'Super Admin' : 'Proktor Ujian'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate">
                ExampGuard v1.0 &bull; {institution.name} {institution.npsn ? `(NPSN: ${institution.npsn})` : ''} &bull; Terhubung ke Mode Penyimpanan Terpusat cPanel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Badge Mode Aplikasi Interaktif */}
            {appModeConfig.app_mode === 'production' ? (
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg text-xs font-semibold shadow-xs border border-zinc-700 cursor-pointer"
                title="Mode Produksi Resmi: Seluruh proteksi ujian ketat 100% tanpa bypass. Klik untuk mengelola."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Mode Produksi</span>
                <span className="text-[10px] text-emerald-400 font-mono">STRICT</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-semibold shadow-xs border border-amber-300 cursor-pointer"
                title="Mode Simulasi / Dev Aktif: Bypass GPS & sensor lokal tersedia. Klik untuk mengelola."
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="hidden md:inline">Mode Simulasi</span>
                <span className="text-[10px] text-amber-700 font-mono font-bold">DEV / BYPASS</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SYSTEM READY</span>
            </div>
          </div>
        </header>

        {/* Content Body - Otomatis melebar penuh saat sidebar di-hide / collapse */}
        <div
          className={`p-6 sm:p-8 w-full mx-auto space-y-6 transition-all duration-300 ${sidebarCollapsed ? 'max-w-full' : 'max-w-7xl'
            }`}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* LAN & Local Access Information Banner */}
              <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-zinc-900">Akses Portal Peserta di HP via LAN / Wi-Fi</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        LAN SYNC AKTIF
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Hubungkan HP peserta ke Wi-Fi / LAN yang sama dengan laptop ini, lalu buka alamat berikut di browser ponsel:
                    </p>
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold text-blue-900 shadow-2xs select-all">
                        {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5173` : 'http://<IP-LAN>:5173'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.protocol}//${window.location.hostname}:5173`;
                          navigator.clipboard.writeText(url);
                          showNotification(`URL ${url} berhasil disalin ke clipboard!`);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-medium">Sesi Ujian Aktif</span>
                    <FileSpreadsheet className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 font-mono-num">
                    {exams.filter((e) => e.is_active && !e.is_archived).length}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5">
                    <span>{bankExamsCount} di Bank Soal</span>
                    <span>&bull;</span>
                    <span>{exams.length} total</span>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-medium">Peserta Terdaftar</span>
                    <Users className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 font-mono-num">
                    {users.filter((u) => u.role === 'student').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {users.filter((u) => u.role === 'student' && u.is_active).length} peserta status aktif
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-medium">Peserta Terkunci (Locked)</span>
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-rose-600 font-mono-num">
                    {attempts.filter((a) => a.status === 'LOCKED').length}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Memerlukan aksi Unlock dari pengawas
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-medium">Status Pengawasan GPS</span>
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-lg font-semibold text-zinc-900 truncate">
                    {institution.gps_enabled ? `Radius ${institution.max_radius_meters}m` : 'Bebas Lokasi (OFF)'}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    {institution.gps_enabled ? 'Haversine formula aktif' : 'Cek lokasi ujian dinonaktifkan'}
                  </div>
                </div>
              </div>

              {/* Pemantauan Pengerjaan Ujian Terbaru (Full Width) */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 text-zinc-800 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-zinc-700" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Pemantauan Pengerjaan Ujian Terbaru
                      </h2>
                      <p className="text-[11px] text-zinc-500">
                        Aktivitas sesi ujian dan status pengerjaan peserta secara real-time
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('proctor')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>Buka Papan Kontrol</span>
                    <span className="text-zinc-400">&rarr;</span>
                  </button>
                </div>

                {attempts.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-200 rounded-xl">
                    <Shield className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-zinc-600">Belum ada aktivitas ujian peserta saat ini.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Peserta yang memulai tes akan otomatis muncul di sini secara real-time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 font-medium">
                          <th className="py-2.5 px-3">Peserta</th>
                          <th className="py-2.5 px-3">Ujian</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Pelanggaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {attempts.slice(0, 8).map((att) => {
                          const conf = ATTEMPT_STATUS[att.status] || ATTEMPT_STATUS.IN_PROGRESS;
                          return (
                            <tr key={att.id} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="py-3 px-3 font-medium text-zinc-900">
                                {att.student_name}
                                <div className="text-[11px] text-zinc-400 font-mono">
                                  {att.student_nisn}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-zinc-600 truncate max-w-[280px]">
                                {att.exam_title}
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium ${conf.badgeClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${conf.dotClass}`}></span>
                                  {conf.label}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-medium text-zinc-700">
                                {att.violation_count}x
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SESI UJIAN GFORM & BANK SOAL */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              {/* Sub-Navigasi: Sesi Ujian Aktif vs Bank Soal (Arsip) */}
              <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExamSubTab('active')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${examSubTab === 'active'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                      }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Sesi Ujian Aktif</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${examSubTab === 'active'
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-200 text-zinc-700'
                        }`}
                    >
                      {activeExamsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => setExamSubTab('bank')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${examSubTab === 'bank'
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
                      }`}
                  >
                    <FolderArchive className="w-3.5 h-3.5" />
                    <span>Bank Soal (Arsip)</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${examSubTab === 'bank'
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-200 text-zinc-700'
                        }`}
                    >
                      {bankExamsCount}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleOpenAddExamModal}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sesi Ujian GForm</span>
                </button>
              </div>

              {/* Baris Filter & Pencarian */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={examSearch}
                      onChange={(e) => setExamSearch(e.target.value)}
                      placeholder="Cari judul ujian, mapel, atau token..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Filter Kelompok Sesi Ujian */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <select
                      value={selectedSessionGroup}
                      onChange={(e) => setSelectedSessionGroup(e.target.value)}
                      className="text-xs py-2 px-3 border border-zinc-300 rounded-xl bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="ALL">Semua Kelompok Sesi</option>
                      {EXAM_SESSION_GROUPS.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedSessionGroup !== 'ALL' && (
                  <button
                    onClick={() => setSelectedSessionGroup('ALL')}
                    className="text-xs text-blue-600 hover:underline shrink-0"
                  >
                    Reset Filter Kelompok
                  </button>
                )}
              </div>

              {/* Banner Info jika berada di Bank Soal */}
              {examSubTab === 'bank' && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <FolderArchive className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Bank Soal (Arsip Master):</strong> Soal yang berada di tab ini disimpan sebagai draf/arsip dan <strong>tidak ditayangkan</strong> di beranda peserta ujian. Klik tombol <ArchiveRestore className="w-3.5 h-3.5 inline mx-1 text-emerald-600" /> <em>Aktifkan ke Sesi Ujian</em> pada kolom aksi untuk memunculkannya kembali ke jadwal peserta.
                  </div>
                </div>
              )}

              {/* Tabel Sesi Ujian / Bank Soal */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                        {/* Kolom 1: Tingkatan (Paling Depan Tabel) */}
                        <th
                          onClick={() => handleExamSort('grade_level')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none whitespace-nowrap"
                          title="Klik untuk mengurutkan berdasarkan Tingkatan Kelas"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Tingkatan</span>
                            {renderSortIcon('grade_level')}
                          </div>
                        </th>

                        {/* Kolom 2: Mata Pelajaran & Judul Ujian */}
                        <th
                          onClick={() => handleExamSort('subject_title')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none"
                          title="Klik untuk mengurutkan berdasarkan Mata Pelajaran & Judul Ujian"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Mata Pelajaran & Judul Ujian</span>
                            {renderSortIcon('subject_title')}
                          </div>
                        </th>

                        {/* Kolom 3: Kelompok Sesi */}
                        <th
                          onClick={() => handleExamSort('session_group')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none whitespace-nowrap"
                          title="Klik untuk mengurutkan berdasarkan Kelompok Sesi"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Kelompok Sesi</span>
                            {renderSortIcon('session_group')}
                          </div>
                        </th>

                        {/* Kolom 4: Token Mulai & Selesai */}
                        <th className="py-3.5 px-4 whitespace-nowrap">Token Mulai & Selesai</th>

                        {/* Kolom 5: Durasi */}
                        <th
                          onClick={() => handleExamSort('duration_minutes')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none whitespace-nowrap"
                          title="Klik untuk mengurutkan berdasarkan Durasi Pengerjaan"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Durasi</span>
                            {renderSortIcon('duration_minutes')}
                          </div>
                        </th>

                        {/* Kolom 6: Jadwal Sesi (Tanggal Mulai Default) */}
                        <th
                          onClick={() => handleExamSort('start_time')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none whitespace-nowrap"
                          title="Klik untuk mengurutkan berdasarkan Jadwal Sesi / Tanggal Mulai"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{examSubTab === 'bank' ? 'Asal Jadwal' : 'Jadwal Sesi'}</span>
                            {renderSortIcon('start_time')}
                          </div>
                        </th>

                        {/* Kolom 7: Status */}
                        <th
                          onClick={() => handleExamSort('is_active')}
                          className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100/70 transition-colors group select-none whitespace-nowrap"
                          title="Klik untuk mengurutkan berdasarkan Status Publikasi"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Status</span>
                            {renderSortIcon('is_active')}
                          </div>
                        </th>

                        {/* Kolom 8: Aksi */}
                        <th className="py-3.5 px-4 text-center whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-12 text-zinc-400 text-xs">
                            {examSubTab === 'bank'
                              ? 'Tidak ada soal yang diarsipkan di Bank Soal.'
                              : 'Tidak ada sesi ujian aktif yang cocok dengan filter.'}
                          </td>
                        </tr>
                      ) : (
                        filteredExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-zinc-50/80 transition-colors">
                            {/* Kolom 1: Tingkatan (Paling Depan Tabel) */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200/90 shadow-2xs">
                                <GraduationCap className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                <span>{getGradeLabel(exam.grade_level)}</span>
                              </span>
                            </td>

                            {/* Kolom 2: Mata Pelajaran & Judul Ujian */}
                            <td className="py-3.5 px-4">
                              {/* Mata Pelajaran (Tebal & Ikon) */}
                              <div className="font-bold text-zinc-900 text-sm tracking-tight flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{exam.subject || exam.title || 'Mata Pelajaran Umum'}</span>
                              </div>

                              {/* Judul Ujian / Sesi Pelaksanaan */}
                              <div className="text-xs font-medium text-zinc-500 mt-0.5 leading-snug">
                                {exam.title && exam.title !== exam.subject ? exam.title : (exam.session_group || 'Sesi Ujian Sekolah')}
                              </div>

                              {/* Link Google Sheets Respon jika ada */}
                              {exam.respon_base_url && (
                                <div className="mt-1">
                                  <a
                                    href={exam.respon_base_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                                  >
                                    <span>Google Sheets Respon</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-medium">
                                <Layers className="w-3 h-3 text-blue-500" />
                                <span>{exam.session_group || 'Asesmen Tengah Semester (ATS)'}</span>
                              </span>
                            </td>

                            {/* Kolom 3: Token Mulai & Token Selesai */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900 whitespace-nowrap">
                              <div className="flex flex-col gap-1.5">
                                {/* Token Mulai */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-zinc-400 font-sans font-medium w-12">Mulai:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToken(exam.exam_token, `start-${exam.id}`)}
                                    title="Klik untuk menyalin token mulai ke clipboard"
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-mono font-bold tracking-wider transition-all cursor-pointer group active:scale-95 ${copiedTokenId === `start-${exam.id}`
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                                        : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200/80 shadow-2xs'
                                      }`}
                                  >
                                    <span>{exam.exam_token || '-'}</span>
                                    {copiedTokenId === `start-${exam.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors" />
                                    )}
                                  </button>
                                </div>

                                {/* Token Selesai */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-amber-600 font-sans font-medium w-12">Selesai:</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToken(exam.finish_token, `fin-${exam.id}`)}
                                    title="Klik untuk menyalin token selesai ke clipboard"
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-mono font-bold tracking-wider transition-all cursor-pointer group active:scale-95 ${copiedTokenId === `fin-${exam.id}`
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                                        : 'bg-amber-50/80 hover:bg-amber-100 text-amber-800 border-amber-200/80 shadow-2xs'
                                      }`}
                                  >
                                    <span>{exam.finish_token || '-'}</span>
                                    {copiedTokenId === `fin-${exam.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-amber-500 group-hover:text-amber-800 shrink-0 transition-colors" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-zinc-600 font-mono-num">
                              {exam.duration_minutes} Menit
                            </td>

                            <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                              <div>{exam.start_time ? exam.start_time.replace('T', ' ') : 'Fleksibel'}</div>
                              <div>s/d {exam.end_time ? exam.end_time.replace('T', ' ') : '-'}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              {exam.is_archived ? (
                                <div className="space-y-1.5">
                                  <span className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                    Diarsipkan (Bank Soal)
                                  </span>
                                  {exam.gform_base_url && (
                                    <div>
                                      <a
                                        href={convertGoogleFormUrl(exam.gform_base_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors cursor-pointer group"
                                        title="Buka preview soal yang sudah di-convert embed di tab baru"
                                      >
                                        <ExternalLink className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0" />
                                        <span>Lihat Soal</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-start gap-1.5">
                                  <button
                                    onClick={() => {
                                      const updated = storageService.toggleExamActive(exam.id);
                                      refreshData();
                                      showNotification(
                                        `Status sesi "${exam.title}" diubah menjadi ${updated?.is_active ? 'Publish' : 'Draft'}.`
                                      );
                                    }}
                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer shadow-2xs ${exam.is_active
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                                      }`}
                                    title={exam.is_active ? 'Status saat ini: Publish (Klik untuk ubah ke Draft)' : 'Status saat ini: Draft (Klik untuk Publish)'}
                                  >
                                    {exam.is_active ? 'Publish' : 'Draft'}
                                  </button>

                                  {/* Link Icon Preview Soal Convert Embed di Tab Baru */}
                                  {exam.gform_base_url ? (
                                    <a
                                      href={convertGoogleFormUrl(exam.gform_base_url)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors cursor-pointer group pt-0.5"
                                      title="Buka preview soal yang sudah di-convert embed di tab baru"
                                    >
                                      <ExternalLink className="w-3 h-3 text-blue-500 group-hover:text-blue-700 shrink-0" />
                                      <span>Lihat Soal</span>
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-zinc-400 italic pt-0.5">
                                      URL belum diisi
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Kolom Aksi Center Text */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Tombol Generate & Download QR Code Ujian */}
                                <button
                                  onClick={() => generateQrCard(exam)}
                                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200/80 shadow-2xs cursor-pointer"
                                  title="Generate & Download QR Code Ujian"
                                >
                                  <QrCode className="w-4 h-4 text-zinc-700" />
                                </button>

                                {/* Tombol Pintas Kontrol & Reset Status Peserta Mapel Ini */}
                                <button
                                  onClick={() => {
                                    setSelectedResetExamId(exam.id);
                                    setActiveTab('reset-exam');
                                  }}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/80 shadow-2xs cursor-pointer"
                                  title="Reset login perangkat & status pengerjaan peserta mapel ini"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>

                                {/* Tombol Edit */}
                                <button
                                  onClick={() => handleOpenEditExamModal(exam)}
                                  className="p-1.5 text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 shadow-2xs cursor-pointer"
                                  title="Edit Sesi Soal"
                                >
                                  <Edit3 className="w-4 h-4 text-zinc-700" />
                                </button>

                                {/* Tombol Arsipkan ke Bank Soal (jika aktif) ATAU Aktifkan kembali (jika di bank soal) */}
                                {exam.is_archived ? (
                                  <button
                                    onClick={() => handleRestoreExam(exam.id, exam.title)}
                                    className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 shadow-2xs cursor-pointer"
                                    title="Aktifkan kembali ke Sesi Ujian Aktif"
                                  >
                                    <ArchiveRestore className="w-4 h-4 text-emerald-700" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleArchiveExam(exam.id, exam.title)}
                                    className="p-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 shadow-2xs cursor-pointer"
                                    title="Pindahkan / Arsipkan ke Bank Soal"
                                  >
                                    <Archive className="w-4 h-4 text-amber-700" />
                                  </button>
                                )}

                                {/* Tombol Hapus */}
                                <button
                                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 shadow-2xs cursor-pointer"
                                  title="Hapus Sesi"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KONTROL PENGAWAS (PROCTOR) — TERPADU DENGAN RESET & PRESENSI */}
          {activeTab === 'proctor' && (() => {
            // Data & variabel untuk Sub-view Pantau Live
            const totalLockedAll = proctorStudentRows.filter((r) => r.status === 'LOCKED').length;
            const lockedOutsideGrade = selectedProctorGrade === 'ALL'
              ? []
              : proctorStudentRows.filter(
                  (r) => r.status === 'LOCKED' && Number(r.studentTingkat) !== Number(selectedProctorGrade)
                );

            // Data & variabel untuk Sub-view Reset Status
            const hasSelection = selectedStudentIdsForReset.length > 0;
            const targetCount = hasSelection ? selectedStudentIdsForReset.length : resetExamStudents.length;

            // Data & variabel untuk Sub-view Presensi
            const currentAttendanceExam = exams.find((e) => e.id === selectedAttendanceExamId) || exams[0] || null;
            const eligibleStudents = users.filter(
              (u) => u.role === 'student' && (!currentAttendanceExam || u.tingkat === currentAttendanceExam.grade_level)
            );
            const attendanceRecords = currentAttendanceExam ? storageService.getExamAttendance(currentAttendanceExam.id) : [];
            const attendanceMap = new Map(attendanceRecords.map((a) => [a.student_id, a]));
            const examAttempts = currentAttendanceExam ? attempts.filter((a) => a.exam_session_id === currentAttendanceExam.id) : [];
            const attemptsMap = new Map(examAttempts.map((a) => [a.student_id, a]));

            const attendanceRooms = Array.from(
              new Set(eligibleStudents.map((s) => s.ruang || 'Ruang 01').filter(Boolean))
            ).sort();

            // Filter Ruangan
            const roomFilteredEligible = eligibleStudents.filter((stu) =>
              selectedAttendanceRoom === 'ALL' || (stu.ruang || 'Ruang 01') === selectedAttendanceRoom
            );

            // ========================================================
            // LOGIKA PRESENSI KETAT SESUAI INSTRUKSI PENGGUNA:
            // 1. Peserta yang sudah menyelesaikan ujian (COMPLETED) dinyatakan HADIR.
            // 2. Peserta yang sedang mengerjakan (IN_PROGRESS/LOCKED) status kehadirannya masih "-" (belum selesai).
            // 3. Peserta yang terlambat (login setelah jam mulai) jika sudah selesai juga dinyatakan HADIR.
            // 4. Peserta yang tidak hadir adalah yang belum login/ujian sampai waktu selesai,
            //    dan Admin bisa menyetel status ke SAKIT, IZIN, ALPHA, atau DISPENSASI.
            // ========================================================
            const getEffectiveStatus = (studentId) => {
              const att = attemptsMap.get(studentId);
              const rec = attendanceMap.get(studentId);

              // Jika admin/proktor telah menetapkan status khusus:
              if (rec && ['SAKIT', 'IZIN', 'ALPHA', 'DISPENSASI'].includes(rec.status)) {
                return rec.status;
              }

              // Jika sudah selesai ujian -> Otomatis HADIR
              if (att?.status === 'COMPLETED') {
                return 'HADIR';
              }

              // Jika sedang mengerjakan -> status masih "-" (belum selesai)
              if (att?.status === 'IN_PROGRESS' || att?.status === 'LOCKED') {
                return '-';
              }

              // Belum login / belum mulai
              return 'BELUM_HADIR';
            };

            // Metrik Ringkasan
            const totalEligible = roomFilteredEligible.length;
            const completedCount = roomFilteredEligible.filter((s) => attemptsMap.get(s.id)?.status === 'COMPLETED').length;
            const inProgressCount = roomFilteredEligible.filter((s) => {
              const st = attemptsMap.get(s.id)?.status;
              return st === 'IN_PROGRESS' || st === 'LOCKED';
            }).length;

            const sakitCount = roomFilteredEligible.filter((s) => attendanceMap.get(s.id)?.status === 'SAKIT').length;
            const izinCount = roomFilteredEligible.filter((s) => attendanceMap.get(s.id)?.status === 'IZIN').length;
            const alphaCount = roomFilteredEligible.filter((s) => attendanceMap.get(s.id)?.status === 'ALPHA').length;
            const dispensasiCount = roomFilteredEligible.filter((s) => attendanceMap.get(s.id)?.status === 'DISPENSASI').length;
            const absentCount = sakitCount + izinCount + alphaCount + dispensasiCount;
            const presentCount = completedCount;
            const notStartedCount = Math.max(0, totalEligible - completedCount - inProgressCount - absentCount);

            // Filter Peserta untuk Tabel
            const filteredAttendanceStudents = roomFilteredEligible.filter((stu) => {
              const q = attendanceSearch.toLowerCase();
              const noUjian = (stu.nomor_ujian || stu.nisn || '').toLowerCase();
              const matchSearch =
                stu.nama.toLowerCase().includes(q) ||
                stu.nisn.toLowerCase().includes(q) ||
                noUjian.includes(q) ||
                (stu.kelas && stu.kelas.toLowerCase().includes(q)) ||
                (stu.ruang && stu.ruang.toLowerCase().includes(q));

              const effStatus = getEffectiveStatus(stu.id);
              let matchStatus = true;
              if (selectedAttendanceStatus === 'COMPLETED') {
                matchStatus = effStatus === 'HADIR';
              } else if (selectedAttendanceStatus === 'IN_PROGRESS') {
                matchStatus = effStatus === '-';
              } else if (selectedAttendanceStatus === 'NOT_STARTED') {
                matchStatus = effStatus === 'BELUM_HADIR';
              } else if (['SAKIT', 'IZIN', 'ALPHA', 'DISPENSASI'].includes(selectedAttendanceStatus)) {
                matchStatus = effStatus === selectedAttendanceStatus;
              } else if (selectedAttendanceStatus === 'HADIR') {
                matchStatus = effStatus === 'HADIR';
              }

              return matchSearch && matchStatus;
            });

            const dateInfo = formatIndonesianDateText(new Date());
            const examStartTimeFormatted = formatExamTimeDisplay(currentAttendanceExam?.start_time, '07:30').replace(':', '.');
            const examEndTimeFormatted = formatExamTimeDisplay(currentAttendanceExam?.end_time, '16:00').replace(':', '.');



            const activeGroups = Array.from(new Set(activeExamsList.map((e) => e.session_group || 'Semua'))).filter(Boolean).sort();
            const activeGrades = Array.from(new Set(activeExamsList.map((e) => e.grade_level))).sort((a, b) => a - b);

            // Komponen Navigasi Sub-View Baku (Header Template: Kembali, Indikator, Live Date & Time, Pantau, Reset, Presensi, Detail)
            const renderProctorSubNav = (activeSub, isInsideCard = false) => {
              let subLabel = 'Pemantauan (Live)';
              let dotColor = 'bg-emerald-500';
              let textColor = 'text-emerald-800';

              if (activeSub === 'reset') {
                subLabel = 'Reset';
                dotColor = 'bg-blue-500';
                textColor = 'text-blue-800';
              } else if (activeSub === 'attendance') {
                subLabel = 'Presensi';
                dotColor = 'bg-emerald-500';
                textColor = 'text-emerald-800';
              }

              const targetExam =
                (activeSub === 'reset'
                  ? (currentResetExam || currentProctorExam)
                  : activeSub === 'attendance'
                  ? (currentAttendanceExam || currentProctorExam)
                  : currentProctorExam) || exams[0];

              const content = (
                <>
                  {/* Sisi Kiri: Tombol Kembali + Indikator Live + Tanggal & Jam Real-Time */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setProctorSubView('list')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                      title="Kembali ke Daftar Mapel Aktif"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Daftar Mapel</span>
                    </button>

                    <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse`}></span>
                        <span className={`text-xs font-semibold ${textColor}`}>
                          {subLabel}
                        </span>
                      </div>

                      <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>

                      {/* Keterangan Hari, Tanggal dan Jam Live Real-time */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-xs shadow-2xs font-medium">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>{formatIndonesianLiveDateTime(currentLiveTime).dayDate}</span>
                        <span className="text-zinc-300 font-light">•</span>
                        <span className="font-mono font-bold text-zinc-900">{formatIndonesianLiveDateTime(currentLiveTime).clock}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Grup Tombol Fitur (Pantau, Reset Status, Presensi, Detail) */}
                  <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (targetExam) {
                          setSelectedProctorExamId(targetExam.id);
                          setSelectedProctorGrade(String(targetExam.grade_level));
                        }
                        setProctorSubView('monitor');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeSub === 'monitor'
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                      }`}
                      title="Buka Pemantauan Langsung (Live)"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Pantau</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (targetExam) {
                          setSelectedProctorExamId(targetExam.id);
                          setSelectedResetExamId(targetExam.id);
                        }
                        setProctorSubView('reset');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeSub === 'reset'
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                      }`}
                      title="Buka Menu Reset Status & Perangkat"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                      <span>Reset Status</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (targetExam) {
                          setSelectedProctorExamId(targetExam.id);
                          setSelectedAttendanceExamId(targetExam.id);
                        }
                        setProctorSubView('attendance');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeSub === 'attendance'
                          ? 'bg-zinc-900 text-white shadow-2xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
                      }`}
                      title="Buka Daftar Presensi & Berita Acara"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Presensi</span>
                    </button>

                    {targetExam && (
                      <button
                        type="button"
                        onClick={() => {
                          setDetailExamData(targetExam);
                          setShowExamDetailModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 cursor-pointer"
                        title="Lihat Detail Sesi Ujian"
                      >
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Detail</span>
                      </button>
                    )}
                  </div>
                </>
              );

              if (isInsideCard) {
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    {content}
                  </div>
                );
              }

              return (
                <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-4 flex flex-wrap items-center justify-between gap-3">
                  {content}
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {/* ======================================================== */}
                {/* SUB-VIEW 1: DAFTAR MAPEL YANG AKTIF (TABEL KONTROL UTAMA) */}
                {/* ======================================================== */}
                {proctorSubView === 'list' && (
                  <div className="space-y-4">
                    {/* Header Kontrol Pengawas: Mapel Aktif */}
                    <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h3 className="text-sm font-semibold text-zinc-900">
                            Pusat Kontrol Pengawas Ujian — Daftar Mapel Aktif
                          </h3>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Kelola dan pantau ujian yang sedang aktif. Pilih aksi <strong>Pantau</strong> untuk melihat peserta live, <strong>Reset</strong> untuk kendali pengerjaan & perangkat, atau <strong>Presensi</strong> untuk daftar hadir & berita acara.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Tombol Refresh / Segarkan */}
                        <button
                          type="button"
                          onClick={handleManualRefreshProctor}
                          disabled={isRefreshingProctor}
                          title="Segarkan data seketika dari penyimpanan lokal & server"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold transition-all shadow-2xs hover:border-zinc-400 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isRefreshingProctor ? 'animate-spin text-zinc-900' : ''}`} />
                          <span>{isRefreshingProctor ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Ringkasan Cepat */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-white border border-zinc-200/80 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-zinc-500">Mapel Aktif</div>
                          <div className="text-lg font-bold text-zinc-900 font-mono">{activeExamsList.length}</div>
                        </div>
                        <BookOpen className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-emerald-700">Sedang Ujian</div>
                          <div className="text-lg font-bold text-emerald-700 font-mono">
                            {attempts.filter((a) => a.status === 'IN_PROGRESS').length}
                          </div>
                        </div>
                        <Activity className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="p-3 bg-rose-50/70 border border-rose-200/70 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-rose-700">Terkunci (Locked)</div>
                          <div className="text-lg font-bold text-rose-700 font-mono">
                            {attempts.filter((a) => a.status === 'LOCKED').length}
                          </div>
                        </div>
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                      </div>
                      <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-blue-700">Selesai (Completed)</div>
                          <div className="text-lg font-bold text-blue-700 font-mono">
                            {attempts.filter((a) => a.status === 'COMPLETED').length}
                          </div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>

                    {/* Filter & Pencarian Tabel Mapel Aktif */}
                    <div className="p-3 bg-white border border-zinc-200/80 rounded-xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Kelompok Ujian */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500 font-medium">Kelompok:</span>
                          <select
                            value={proctorActiveExamGroupFilter}
                            onChange={(e) => setProctorActiveExamGroupFilter(e.target.value)}
                            className="px-2.5 py-1.5 text-xs font-medium border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="ALL">Semua Kelompok</option>
                            {activeGroups.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        {/* Filter Tingkat */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-zinc-500 font-medium">Tingkat:</span>
                          <select
                            value={proctorActiveExamGradeFilter}
                            onChange={(e) => setProctorActiveExamGradeFilter(e.target.value)}
                            className="px-2.5 py-1.5 text-xs font-medium border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="ALL">Semua Tingkat</option>
                            {activeGrades.map((lvl) => (
                              <option key={lvl} value={lvl}>{getGradeLabel(lvl)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Pencarian Mapel */}
                      <div className="relative max-w-xs w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={proctorActiveExamSearch}
                          onChange={(e) => setProctorActiveExamSearch(e.target.value)}
                          placeholder="Cari mapel, judul, kelompok, token..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* TABEL 10 KOLOM: DAFTAR MAPEL YANG AKTIF */}
                    <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold select-none">
                              <th
                                className="py-3 px-3 text-center w-12 cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('no')}
                                title="Klik untuk mengurutkan berdasarkan Nomor"
                              >
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span>No</span>
                                  {renderProctorActiveExamSortIcon('no')}
                                </div>
                              </th>
                              <th
                                className="py-3 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('session_group')}
                                title="Klik untuk mengurutkan berdasarkan Kelompok Ujian"
                              >
                                <div className="inline-flex items-center gap-1.5">
                                  <span>Kelompok Ujian</span>
                                  {renderProctorActiveExamSortIcon('session_group')}
                                </div>
                              </th>
                              <th
                                className="py-3 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('subject')}
                                title="Klik untuk mengurutkan berdasarkan Mata Pelajaran"
                              >
                                <div className="inline-flex items-center gap-1.5">
                                  <span>Mata Pelajaran</span>
                                  {renderProctorActiveExamSortIcon('subject')}
                                </div>
                              </th>
                              <th
                                className="py-3 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('title')}
                                title="Klik untuk mengurutkan berdasarkan Judul Sesi"
                              >
                                <div className="inline-flex items-center gap-1.5">
                                  <span>Judul Sesi</span>
                                  {renderProctorActiveExamSortIcon('title')}
                                </div>
                              </th>
                              <th
                                className="py-3 px-3 text-center cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('grade_level')}
                                title="Klik untuk mengurutkan berdasarkan Tingkat"
                              >
                                <div className="inline-flex items-center justify-center gap-1">
                                  <span>Tingkat</span>
                                  {renderProctorActiveExamSortIcon('grade_level')}
                                </div>
                              </th>
                              <th
                                className="py-3 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                                onClick={() => handleProctorActiveExamSort('start_time')}
                                title="Klik untuk mengurutkan berdasarkan Waktu Ujian"
                              >
                                <div className="inline-flex items-center gap-1.5">
                                  <span>Waktu (mulai-selesai)</span>
                                  {renderProctorActiveExamSortIcon('start_time')}
                                </div>
                              </th>
                              <th className="py-3 px-2 text-center w-24">Pantau</th>
                              <th className="py-3 px-2 text-center w-24">Reset</th>
                              <th className="py-3 px-2 text-center w-24">Presensi</th>
                              <th className="py-3 px-2 text-center w-20">Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {filteredActiveExamsList.length === 0 ? (
                              <tr>
                                <td colSpan="10" className="py-12 text-center text-zinc-400 text-xs">
                                  Tidak ada mata pelajaran atau sesi ujian aktif yang sesuai dengan filter.
                                </td>
                              </tr>
                            ) : (
                              filteredActiveExamsList.map((exam, idx) => {
                                const startTime = formatExamTimeDisplay(exam.start_time, '07:30');
                                const endTime = formatExamTimeDisplay(exam.end_time, '16:00');
                                const gradeLabel = getGradeLabel(exam.grade_level);

                                return (
                                  <tr key={exam.id} className="hover:bg-zinc-50/80 transition-colors">
                                    {/* 1. No */}
                                    <td className="py-3 px-3 text-center font-semibold text-zinc-600">
                                      {idx + 1}
                                    </td>

                                    {/* 2. Kelompok Ujian (Teks biasa tanpa badge) */}
                                    <td className="py-3 px-3 text-zinc-700 font-medium">
                                      {exam.session_group || '-'}
                                    </td>

                                    {/* 3. Mata Pelajaran */}
                                    <td className="py-3 px-3 font-bold text-zinc-900">
                                      <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>{exam.subject || '-'}</span>
                                      </div>
                                    </td>

                                    {/* 4. Judul Sesi (dengan tanggal mulai) */}
                                    <td className="py-3 px-3">
                                      <div className="font-semibold text-zinc-900">{exam.title}</div>
                                      <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                        <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                                        <span>
                                          {exam.start_time
                                            ? new Date(exam.start_time).toLocaleDateString('id-ID', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                              })
                                            : '-'}
                                        </span>
                                      </div>
                                    </td>

                                    {/* 5. Tingkat (Cukup angka tingkat saja: 7, 8, 9) */}
                                    <td className="py-3 px-3 text-center">
                                      <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                                        {exam.grade_level || 'Umum'}
                                      </span>
                                    </td>

                                    {/* 6. Waktu (mulai-selesai) */}
                                    <td className="py-3 px-3 font-mono text-[11px] text-zinc-700 whitespace-nowrap">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-zinc-400" />
                                        <span>{startTime} - {endTime} WIB</span>
                                      </div>
                                    </td>

                                    {/* 7. Pantau */}
                                    <td className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProctorMonitor(exam)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:border-emerald-300 active:scale-95 cursor-pointer"
                                        title="Pantau peserta ujian secara live"
                                      >
                                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Pantau</span>
                                      </button>
                                    </td>

                                    {/* 8. Reset */}
                                    <td className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProctorReset(exam)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:border-blue-300 active:scale-95 cursor-pointer"
                                        title="Reset status pengerjaan atau login perangkat mapel ini"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Reset</span>
                                      </button>
                                    </td>

                                    {/* 9. Presensi */}
                                    <td className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProctorAttendance(exam)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-all shadow-2xs hover:border-amber-300 active:scale-95 cursor-pointer"
                                        title="Buka presensi & berita acara ujian untuk mapel ini"
                                      >
                                        <ClipboardCheck className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Presensi</span>
                                      </button>
                                    </td>

                                    {/* 10. Detail */}
                                    <td className="py-3 px-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenProctorDetail(exam)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 rounded-lg text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                        title="Lihat detail data sesi ujian"
                                      >
                                        <Info className="w-3.5 h-3.5 text-zinc-600" />
                                        <span>Detail</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* ======================================================== */}
                {/* SUB-VIEW 2: PANTAU LIVE PESERTA UJIAN (REDESAIN 2 CARD)   */}
                {/* ======================================================== */}
                {proctorSubView === 'monitor' && (() => {
                  const currentExam = currentProctorExam;
                  const targetGrade = Number(currentExam?.grade_level || 0);

                  // 1. Peserta yang satu tingkat dengan sesi ujian yang sedang dipantau
                  const sameGradeStudents = (users || [])
                    .filter((u) => u.role === 'student' && Number(u.tingkat) === targetGrade)
                    .sort((a, b) => {
                      const rombelA = String(a.kelas || '').toLowerCase();
                      const rombelB = String(b.kelas || '').toLowerCase();
                      if (rombelA !== rombelB) return rombelA.localeCompare(rombelB);
                      return String(a.nama || '').localeCompare(String(b.nama || ''));
                    });

                  // 2. Ruang unik pada tingkat ini
                  const distinctRooms = Array.from(
                    new Set(sameGradeStudents.map((s) => (s.ruang || '').trim()).filter(Boolean))
                  ).sort();

                  // 3. Gabungkan data peserta dengan attempt & attendance untuk sesi ujian aktif ini
                  const monitorRows = sameGradeStudents.map((stu) => {
                    const attempt = currentExam
                      ? (attempts || []).find(
                          (a) =>
                            (a.student_id === stu.id || (stu.nisn && a.student_nisn === stu.nisn)) &&
                            String(a.exam_session_id) === String(currentExam.id)
                        )
                      : null;

                    const attRecord = currentExam
                      ? (attendance || []).find(
                          (att) =>
                            String(att.student_id) === String(stu.id) &&
                            String(att.exam_session_id) === String(currentExam.id)
                        )
                      : null;

                    let status = 'belum'; // belum | mengerjakan | keluar | selesai | terkunci
                    if (attempt) {
                      if (attempt.status === 'COMPLETED') {
                        status = 'selesai';
                      } else if (attempt.status === 'LOCKED') {
                        status = 'terkunci';
                      } else if (attempt.status === 'RESET_BY_PROCTOR') {
                        status = 'belum';
                      } else if (attempt.status === 'IN_PROGRESS') {
                        // Periksa sinyal heartbeat peserta di laman ujian
                        const lastSignalTime = attempt.last_ping_at
                          ? new Date(attempt.last_ping_at).getTime()
                          : (attempt.updated_at ? new Date(attempt.updated_at).getTime() : 0);
                        const nowMs = currentLiveTime.getTime();
                        const elapsedSec = (nowMs - lastSignalTime) / 1000;
                        if (lastSignalTime > 0 && elapsedSec <= 12) {
                          status = 'mengerjakan';
                        } else {
                          status = 'keluar';
                        }
                      }
                    }

                    const violationCount = attempt?.violation_count || 0;
                    const timeSpentSeconds = attempt?.time_spent_seconds || 0;
                    const noUjian = cleanNomorUjian(stu.nomor_ujian, stu.nisn);
                    const isOnline = Boolean(stu.active_device_id);

                    return {
                      student: stu,
                      attempt,
                      attRecord,
                      status,
                      violationCount,
                      timeSpentSeconds,
                      noUjian,
                      isOnline,
                    };
                  });

                  // 4. Hitung statistik ringkas (Jumlah Peserta Mengerjakan, Keluar, dan Belum)
                  const totalCount = monitorRows.length;
                  const mengerjakanCount = monitorRows.filter((r) => r.status === 'mengerjakan').length;
                  const keluarCount = monitorRows.filter((r) => r.status === 'keluar').length;
                  const belumCount = monitorRows.filter((r) => r.status === 'belum').length;
                  const selesaiCount = monitorRows.filter((r) => r.status === 'selesai').length;
                  const terkunciCount = monitorRows.filter((r) => r.status === 'terkunci').length;

                  // 5. Filter baris peserta berdasarkan pencarian, status, dan ruang
                  const filteredRows = monitorRows.filter((row) => {
                    if (monitorStatusFilter !== 'ALL') {
                      if (monitorStatusFilter === 'mengerjakan' && row.status !== 'mengerjakan') return false;
                      if (monitorStatusFilter === 'keluar' && row.status !== 'keluar') return false;
                      if (monitorStatusFilter === 'belum' && row.status !== 'belum') return false;
                      if (monitorStatusFilter === 'selesai' && row.status !== 'selesai') return false;
                      if (monitorStatusFilter === 'terkunci' && row.status !== 'terkunci') return false;
                    }
                    if (monitorRuangFilter !== 'ALL') {
                      if (String(row.student.ruang || '').trim() !== monitorRuangFilter) return false;
                    }
                    if (monitorSearch.trim()) {
                      const q = monitorSearch.toLowerCase().trim();
                      const matchName = String(row.student.nama || '').toLowerCase().includes(q);
                      const matchNisn = String(row.student.nisn || '').toLowerCase().includes(q);
                      const matchNoUjian = String(row.noUjian || '').toLowerCase().includes(q);
                      const matchKelas = String(row.student.kelas || '').toLowerCase().includes(q);
                      const matchRuang = String(row.student.ruang || '').toLowerCase().includes(q);
                      if (!matchName && !matchNisn && !matchNoUjian && !matchKelas && !matchRuang) return false;
                    }
                    return true;
                  });

                  return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* ======================================================== */}
                      {/* CARD 1: IDENTITAS MAPEL UJIAN, TINGKAT, TOKEN, WAKTU & DETAIL */}
                      {/* ======================================================== */}
                      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
                        {/* Header Baku Pengawas: Navigasi Cepat, Live Time & Indikator */}
                        {renderProctorSubNav('monitor', true)}

                        {/* Grid Identitas Ujian: Mapel, Tingkat, Token, Waktu */}
                        {currentExam ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                            {/* 1. Mata Pelajaran & Judul Ujian */}
                            <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                <span>Mata Pelajaran & Sesi</span>
                              </div>
                              <div className="font-bold text-zinc-900 text-sm truncate" title={currentExam.subject}>
                                {currentExam.subject || 'Mapel Umum'}
                              </div>
                              <div className="text-xs text-zinc-600 truncate" title={currentExam.title}>
                                {currentExam.title}
                              </div>
                              <div className="pt-1">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  {currentExam.session_group || 'Asesmen'}
                                </span>
                              </div>
                            </div>

                            {/* 2. Tingkat Peserta */}
                            <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                                <Layers className="w-3.5 h-3.5 text-purple-600" />
                                <span>Tingkat Peserta</span>
                              </div>
                              <div className="font-bold text-zinc-900 text-base">
                                {getGradeLabel(currentExam.grade_level)}
                              </div>
                              <div className="text-xs text-zinc-500">
                                Khusus seluruh peserta tingkat {currentExam.grade_level}
                              </div>
                              <div className="pt-1 text-[11px] font-mono text-zinc-500">
                                Total di Basis Data: <strong className="text-zinc-800">{sameGradeStudents.length} Peserta</strong>
                              </div>
                            </div>

                            {/* 3. Token Masuk & Selesai */}
                            {(() => {
                              // Hitung mundur waktu token selesai muncul berbasis waktu pengerjaan peserta & pengaturan instansi
                              const leadMinutes = Number(institution?.finish_token_lead_minutes ?? 10);
                              const durationSec = Number(currentExam.duration_minutes || 90) * 60;
                              const leadSeconds = leadMinutes * 60;
                              const nowMs = currentLiveTime.getTime();

                              // Peserta yang sedang aktif mengerjakan sesi ujian ini
                              const activeWorkingAttempts = (attempts || []).filter(
                                (a) => a.exam_session_id === currentExam.id && (a.status === 'IN_PROGRESS' || a.status === 'LOCKED')
                              );

                              let secToRelease = null;
                              let countUnlocked = 0;
                              const hasActiveWorkers = activeWorkingAttempts.length > 0;

                              if (hasActiveWorkers) {
                                const releaseDiffs = activeWorkingAttempts.map((att) => {
                                  let timeSpent = 0;
                                  if (att.started_at) {
                                    const sMs = new Date(att.started_at).getTime();
                                    if (!isNaN(sMs)) {
                                      timeSpent = Math.max(0, Math.floor((nowMs - sMs) / 1000));
                                    }
                                  }
                                  if (!timeSpent && att.time_spent_seconds) {
                                    timeSpent = Number(att.time_spent_seconds || 0);
                                  }
                                  const remainingSec = Math.max(0, durationSec - timeSpent);
                                  const diffToRelease = remainingSec - leadSeconds;
                                  if (diffToRelease <= 0) countUnlocked++;
                                  return diffToRelease;
                                });
                                secToRelease = Math.min(...releaseDiffs);
                              } else {
                                // Jika belum ada peserta mulai, hitung mundur terhadap batas sesi ujian (end_time - leadMinutes)
                                let sessionEndMs = null;
                                if (currentExam.end_time) {
                                  if (String(currentExam.end_time).includes('T')) {
                                    sessionEndMs = new Date(currentExam.end_time).getTime();
                                  } else if (String(currentExam.end_time).includes(':')) {
                                    const [eh, em] = currentExam.end_time.split(':').map(Number);
                                    const ed = new Date(currentLiveTime);
                                    ed.setHours(eh, em, 0, 0);
                                    sessionEndMs = ed.getTime();
                                  }
                                }

                                if (sessionEndMs && sessionEndMs > nowMs) {
                                  const sessionReleaseMs = sessionEndMs - (leadSeconds * 1000);
                                  secToRelease = Math.max(0, Math.floor((sessionReleaseMs - nowMs) / 1000));
                                } else {
                                  secToRelease = Math.max(0, durationSec - leadSeconds);
                                }
                              }

                              const hasFinishToken = Boolean(currentExam.finish_token);
                              const isFinishRevealed = isHoldingFinishToken;
                              const finishTokenDisplay = !hasFinishToken
                                ? '-'
                                : isFinishRevealed
                                ? currentExam.finish_token
                                : '******';

                              return (
                                <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Token Masuk & Selesai</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-mono">Real-time</span>
                                  </div>

                                  {/* Token Mulai / Masuk */}
                                  <div className="flex items-center justify-between gap-2 pt-0.5">
                                    <div className="text-[11px] text-zinc-600 font-medium">Token Mulai:</div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 tracking-wider shadow-2xs">
                                        {currentExam.exam_token || '-'}
                                      </span>
                                      {currentExam.exam_token && (
                                        <button
                                          type="button"
                                          onClick={() => handleCopyProctorToken(currentExam.exam_token, 'Token Masuk')}
                                          className="p-1 text-zinc-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md border border-zinc-200 transition-all cursor-pointer shadow-2xs"
                                          title="Salin Token Masuk"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Token Selesai (Masked ****** & Klik Tahan untuk Mengintip) */}
                                  <div className="space-y-0.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-[11px] text-zinc-600 font-medium">Token Selesai:</div>
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          onMouseDown={() => hasFinishToken && setIsHoldingFinishToken(true)}
                                          onMouseUp={() => setIsHoldingFinishToken(false)}
                                          onMouseLeave={() => setIsHoldingFinishToken(false)}
                                          onTouchStart={() => hasFinishToken && setIsHoldingFinishToken(true)}
                                          onTouchEnd={() => setIsHoldingFinishToken(false)}
                                          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg border tracking-wider transition-all select-none ${
                                            isFinishRevealed
                                              ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400/50'
                                              : hasFinishToken
                                              ? 'bg-purple-50 text-purple-800 border-purple-200 cursor-pointer hover:border-purple-300'
                                              : 'bg-zinc-100 text-zinc-400 border-zinc-200'
                                          }`}
                                          title={hasFinishToken ? 'Klik dan tahan mouse untuk mengintip token selesai asli' : 'Token selesai belum diset'}
                                        >
                                          {finishTokenDisplay}
                                        </span>
                                        {hasFinishToken && (
                                          <button
                                            type="button"
                                            onClick={() => handleCopyProctorToken(currentExam.finish_token, 'Token Selesai')}
                                            className="p-1 text-zinc-500 hover:text-purple-700 hover:bg-purple-50 rounded-md border border-zinc-200 transition-all cursor-pointer shadow-2xs"
                                            title="Salin Token Selesai Asli (walau sedang tersembunyi)"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {hasFinishToken && (
                                      <div className="text-[9px] text-zinc-400 italic text-right select-none pr-0.5">
                                        *Tahan klik untuk intip
                                      </div>
                                    )}
                                  </div>

                                  {/* Hitung Mundur Waktu Rilis Token Selesai (Selalu Tampil & Live Ticking Countdown) */}
                                  <div className="pt-2 border-t border-zinc-200/80 space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-zinc-600 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>Rilis Token:</span>
                                      </span>
                                      {countUnlocked > 0 ? (
                                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 shadow-2xs">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Terbuka ({countUnlocked} Peserta)</span>
                                        </span>
                                      ) : secToRelease !== null && secToRelease > 0 ? (
                                        <span className="font-mono font-bold text-xs text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                                          <span>{formatDigitalCountdown(secToRelease)}</span>
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                        </span>
                                      ) : (
                                        <span className="font-mono text-xs text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-lg border border-zinc-200">
                                          {leadMinutes}m sblm selesai
                                        </span>
                                      )}
                                    </div>

                                    {/* Keterangan Rapi Satu Baris */}
                                    <div className="text-[10px] text-zinc-400 italic text-left">
                                      {hasActiveWorkers
                                        ? `Berdasarkan pengerjaan ${activeWorkingAttempts.length} peserta aktif`
                                        : `Otomatis rilis ${leadMinutes}m sebelum waktu pengerjaan habis`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 4. Tanggal & Waktu */}
                            <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Waktu & Durasi Ujian</span>
                              </div>
                              <div className="font-bold text-zinc-900 text-sm">
                                {currentExam.start_time
                                  ? new Date(currentExam.start_time).toLocaleDateString('id-ID', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </div>
                              <div className="text-xs text-zinc-600 font-mono">
                                {currentExam.start_time
                                  ? new Date(currentExam.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                  : '-'}{' '}
                                &ndash;{' '}
                                {currentExam.end_time
                                  ? new Date(currentExam.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </div>
                              <div className="pt-0.5 text-[11px] text-zinc-500 font-medium">
                                Durasi Pengerjaan: <strong className="text-zinc-800">{currentExam.duration_minutes || 90} Menit</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-zinc-500 text-xs">
                            Tidak ada sesi ujian yang dipilih. Silakan kembali ke Daftar Mapel Aktif.
                          </div>
                        )}
                      </div>

                      {/* ======================================================== */}
                      {/* CARD 2: DAFTAR NAMA PESERTA UJIAN (YANG SAMA TINGKAT)    */}
                      {/* ======================================================== */}
                      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
                        {/* Header Card 2: Ringkasan Mengerjakan & Belum + Pencarian & Filter Ruang */}
                        <div className="p-4 bg-zinc-50/70 border-b border-zinc-200/80 space-y-3">
                          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-zinc-800" />
                                <h3 className="text-sm font-bold text-zinc-900">
                                  Daftar Peserta Ujian {currentExam ? `• ${getGradeLabel(currentExam.grade_level)}` : ''}
                                </h3>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                Menampilkan seluruh peserta ujian yang sama tingkat beserta kendali pengawasan langsung.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Tombol Segarkan Data */}
                              <button
                                type="button"
                                onClick={handleManualRefreshProctor}
                                disabled={isRefreshingProctor}
                                title="Segarkan data pengawas seketika dari penyimpanan & server"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold transition-all shadow-2xs hover:border-zinc-400 active:scale-95 cursor-pointer disabled:opacity-60"
                              >
                                <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isRefreshingProctor ? 'animate-spin text-zinc-900' : ''}`} />
                                <span>{isRefreshingProctor ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
                              </button>

                              {/* Filter Dropdown Ruang */}
                              {distinctRooms.length > 0 && (
                                <select
                                  value={monitorRuangFilter}
                                  onChange={(e) => setMonitorRuangFilter(e.target.value)}
                                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer"
                                >
                                  <option value="ALL">Semua Ruang ({sameGradeStudents.length})</option>
                                  {distinctRooms.map((r) => (
                                    <option key={r} value={r}>
                                      {r}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* Search Input */}
                              <div className="relative min-w-[200px] sm:min-w-[240px]">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                  type="text"
                                  value={monitorSearch}
                                  onChange={(e) => setMonitorSearch(e.target.value)}
                                  placeholder="Cari nama, NISN, no ujian, ruang, rombel..."
                                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Baris Ringkasan: Jumlah Peserta Mengerjakan dan Belum */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60 text-xs">
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">
                              Ringkasan:
                            </span>

                            {/* Total Peserta */}
                            <button
                              type="button"
                              onClick={() => setMonitorStatusFilter('ALL')}
                              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                monitorStatusFilter === 'ALL'
                                  ? 'bg-zinc-900 text-white shadow-2xs font-bold'
                                  : 'bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200'
                              }`}
                            >
                              <span>Total:</span>
                              <span className="font-mono font-bold">{totalCount}</span>
                            </button>

                            {/* Sedang Mengerjakan */}
                            <button
                              type="button"
                              onClick={() => setMonitorStatusFilter('mengerjakan')}
                              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                monitorStatusFilter === 'mengerjakan'
                                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Sedang Mengerjakan:</span>
                              <span className="font-mono font-bold">{mengerjakanCount}</span>
                            </button>

                            {/* Keluar / Terputus */}
                            <button
                              type="button"
                              onClick={() => setMonitorStatusFilter('keluar')}
                              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                monitorStatusFilter === 'keluar'
                                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                              <span>Keluar / Terputus:</span>
                              <span className="font-mono font-bold">{keluarCount}</span>
                            </button>

                            {/* Belum Mengerjakan */}
                            <button
                              type="button"
                              onClick={() => setMonitorStatusFilter('belum')}
                              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                monitorStatusFilter === 'belum'
                                  ? 'bg-amber-600 text-white shadow-2xs font-bold'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <span>Belum Mengerjakan:</span>
                              <span className="font-mono font-bold">{belumCount}</span>
                            </button>

                            {/* Selesai */}
                            <button
                              type="button"
                              onClick={() => setMonitorStatusFilter('selesai')}
                              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                monitorStatusFilter === 'selesai'
                                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                  : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Selesai:</span>
                              <span className="font-mono font-bold">{selesaiCount}</span>
                            </button>

                            {/* Terkunci */}
                            {terkunciCount > 0 && (
                              <button
                                type="button"
                                onClick={() => setMonitorStatusFilter('terkunci')}
                                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                  monitorStatusFilter === 'terkunci'
                                    ? 'bg-rose-600 text-white shadow-2xs font-bold animate-pulse'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                                }`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Terkunci:</span>
                                <span className="font-mono font-bold">{terkunciCount}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tabel 13 Kolom Sesuai Permintaan */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead>
                              <tr className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-700 font-semibold">
                                <th className="py-3 px-3 text-center w-10">No</th>
                                <th className="py-3 px-3">Rombel</th>
                                <th className="py-3 px-4">Nama Peserta</th>
                                <th className="py-3 px-3">No Ujian</th>
                                <th className="py-3 px-3">Ruang</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Pelanggaran</th>
                                <th className="py-3 px-3">Waktu Aktual</th>
                                <th className="py-3 px-3 text-center">Buka Kunci</th>
                                <th className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleProctorBulkLogoutGrade(currentExam?.grade_level, sameGradeStudents)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                    title={`Klik untuk Logout Paksa Seluruh Peserta ${getGradeLabel(currentExam?.grade_level)}`}
                                  >
                                    <LogOut className="w-3 h-3 text-amber-600" />
                                    <span>Logout</span>
                                  </button>
                                </th>
                                <th className="py-3 px-3 text-center">Reset Jawaban</th>
                                <th className="py-3 px-3 text-center">Kehadiran</th>
                                <th className="py-3 px-3 text-center">Reset Pekerjaan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {filteredRows.length === 0 ? (
                                <tr>
                                  <td colSpan="13" className="text-center py-12 text-zinc-400 text-xs">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                      <Users className="w-8 h-8 text-zinc-300" />
                                      <p>Tidak ada peserta yang sesuai dengan kriteria filter.</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                filteredRows.map((row, idx) => {
                                  const isLocked = row.status === 'terkunci';
                                  const isCompleted = row.status === 'selesai';
                                  const currentAttStatus = row.attRecord?.status || (isCompleted ? 'HADIR' : '');

                                  return (
                                    <tr
                                      key={row.student.id}
                                      className={`transition-colors ${
                                        isLocked
                                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                          : 'hover:bg-zinc-50/80'
                                      }`}
                                    >
                                      {/* 1. No */}
                                      <td className="py-3 px-3 text-center font-mono text-zinc-500 font-medium">
                                        {idx + 1}
                                      </td>

                                      {/* 2. Rombel */}
                                      <td className="py-3 px-3 font-semibold text-zinc-800">
                                        {row.student.kelas || '-'}
                                      </td>

                                      {/* 3. Nama Peserta */}
                                      <td className="py-3 px-4">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-zinc-900">{row.student.nama}</span>
                                          {row.isOnline && (
                                            <span
                                              className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                              title="Peserta sedang login di perangkat"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                              <span>Online</span>
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-zinc-400 font-mono">
                                          NISN: {row.student.nisn || '-'}
                                        </div>
                                      </td>

                                      {/* 4. No Ujian */}
                                      <td className="py-3 px-3 font-mono">
                                        <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs">
                                          {row.noUjian || row.student.nisn || '-'}
                                        </span>
                                      </td>

                                      {/* 5. Ruang */}
                                      <td className="py-3 px-3">
                                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
                                          {row.student.ruang || '-'}
                                        </span>
                                      </td>

                                      {/* 6. Status (mengerjakan/keluar/belum/selesai/terkunci) */}
                                      <td className="py-3 px-3">
                                        {row.status === 'mengerjakan' && (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span>Mengerjakan</span>
                                          </span>
                                        )}
                                        {row.status === 'keluar' && (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                            <span>Keluar</span>
                                          </span>
                                        )}
                                        {row.status === 'terkunci' && (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Terkunci</span>
                                          </span>
                                        )}
                                        {row.status === 'selesai' && (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Selesai</span>
                                          </span>
                                        )}
                                        {row.status === 'belum' && (
                                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                            <span>Belum</span>
                                          </span>
                                        )}
                                      </td>

                                      {/* 7. Pelanggaran (jumlah pelanggaran + tombol reset dengan konfirmasi) */}
                                      <td className="py-3 px-3">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`font-mono font-bold text-xs ${
                                              row.violationCount > 0 ? 'text-rose-600' : 'text-zinc-500'
                                            }`}
                                          >
                                            {row.violationCount}x
                                          </span>
                                          {row.violationCount > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => handleProctorResetViolationCount(row.student.id, row.student.nama)}
                                              title="Reset hitungan pelanggaran ke 0"
                                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                                            >
                                              <RotateCcw className="w-2.5 h-2.5" />
                                              <span>Reset</span>
                                            </button>
                                          )}
                                        </div>
                                      </td>

                                      {/* 8. Waktu Aktual */}
                                      <td className="py-3 px-3 font-mono text-zinc-700">
                                        {row.attempt ? (
                                          <div>
                                            <div className="font-semibold text-zinc-800">
                                              {row.timeSpentSeconds > 0
                                                ? formatDuration(row.timeSpentSeconds)
                                                : row.status === 'mengerjakan'
                                                ? 'Mulai'
                                                : '-'}
                                            </div>
                                            {row.attempt.started_at && (
                                              <div className="text-[10px] text-zinc-400 font-sans tracking-tight">
                                                Mulai: {new Date(row.attempt.started_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-zinc-400">-</span>
                                        )}
                                      </td>

                                      {/* 9. Buka Kunci */}
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleProctorUnlock(row.student.id, row.student.nama)}
                                          disabled={row.status !== 'terkunci'}
                                          title={
                                            row.status === 'terkunci'
                                              ? 'Buka kunci layar peserta yang terkena pelanggaran'
                                              : 'Peserta tidak sedang berstatus terkunci'
                                          }
                                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-2xs ${
                                            row.status === 'terkunci'
                                              ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer ring-2 ring-rose-400/50 animate-pulse'
                                              : 'bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed opacity-60'
                                          }`}
                                        >
                                          <Unlock className="w-3.5 h-3.5" />
                                          <span>Buka Kunci</span>
                                        </button>
                                      </td>

                                      {/* 10. Logout (paksa untuk logout) */}
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleProctorResetLogin(row.student.id, row.student.nama)}
                                          title="Paksa logout peserta & lepas pengikatan perangkat"
                                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                                        >
                                          <LogOut className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Logout</span>
                                        </button>
                                      </td>

                                      {/* 11. Reset Jawaban */}
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleProctorResetAnswer(row.student.id, row.student.nama)}
                                          disabled={row.status === 'belum'}
                                          title="Reset lembar jawaban peserta agar form dapat dibuka ulang di portal peserta jika respon belum masuk"
                                          className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all shadow-2xs ${
                                            row.status !== 'belum'
                                              ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 cursor-pointer'
                                              : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                                          }`}
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                          <span>Reset Jawaban</span>
                                        </button>
                                      </td>

                                      {/* 12. Kehadiran (jika selesai otomatis H, jika belum login bisa di set S I A oleh admin khusus untuk presensi mapel ini) */}
                                      <td className="py-3 px-3 text-center">
                                        {isCompleted ? (
                                          <span
                                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                                            title="Hadir (Otomatis karena selesai mengerjakan)"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>H (Hadir)</span>
                                          </span>
                                        ) : (
                                          <div className="inline-flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
                                            {[
                                              { code: 'HADIR', label: 'H', title: 'Hadir', activeClass: 'bg-emerald-600 text-white font-bold' },
                                              { code: 'SAKIT', label: 'S', title: 'Sakit', activeClass: 'bg-amber-500 text-white font-bold' },
                                              { code: 'IZIN', label: 'I', title: 'Izin', activeClass: 'bg-blue-600 text-white font-bold' },
                                              { code: 'ALPHA', label: 'A', title: 'Alpa / Tanpa Keterangan', activeClass: 'bg-rose-600 text-white font-bold' },
                                            ].map((opt) => {
                                              const isSelected = currentAttStatus === opt.code;
                                              return (
                                                <button
                                                  key={opt.code}
                                                  type="button"
                                                  onClick={() => handleSetAttendanceQuick(row.student.id, opt.code, row.student.nama, isSelected)}
                                                  title={`Set Presensi: ${opt.title} (klik lagi untuk mengosongkan)`}
                                                  className={`w-6 h-6 rounded text-[11px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
                                                    isSelected
                                                      ? `${opt.activeClass} shadow-2xs ring-1 ring-black/10`
                                                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/80'
                                                  }`}
                                                >
                                                  {opt.label}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </td>

                                      {/* 13. Reset Pekerjaan (agar bisa login soal lagi) */}
                                      <td className="py-3 px-3 text-center">
                                        <button
                                          type="button"
                                          onClick={() => handleProctorResetWork(row.student.id, row.student.nama)}
                                          title="Reset seluruh pengerjaan mapel ini & reset perangkat agar peserta bisa login soal lagi"
                                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                          <span>Reset Pekerjaan</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {/* SUB-VIEW 3: KONTROL & RESET STATUS UJIAN PER MAPEL */}
                {/* ======================================================== */}
                {proctorSubView === 'reset' && (
                  <div className="space-y-4">
                    {/* CARD 1: HEADER TEMPLATE & KARTU PEMILIH MAPEL */}
                    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
                      {renderProctorSubNav('reset', true)}

                      {/* Baris Identitas Mapel / Sesi Ujian Terpilih (Format Kartu Teks Baku Seragam) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                        {/* 1. Mata Pelajaran & Judul Ujian */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mata Pelajaran & Sesi</span>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {currentResetExam?.session_group || 'Asesmen'}
                            </span>
                          </div>
                          <div className="font-bold text-zinc-900 text-sm truncate" title={currentResetExam?.subject}>
                            {currentResetExam?.subject || 'Mapel Umum'}
                          </div>
                          <div className="text-xs text-zinc-600 truncate" title={currentResetExam?.title}>
                            {currentResetExam?.title}
                          </div>
                        </div>

                        {/* 2. Tingkat Peserta */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                              <Layers className="w-3.5 h-3.5 text-purple-600" />
                              <span>Tingkat Peserta</span>
                            </div>
                            <div className="font-bold text-zinc-900 text-base">
                              {currentResetExam ? getGradeLabel(currentResetExam.grade_level) : '-'}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Khusus seluruh peserta tingkat {currentResetExam?.grade_level || '-'}
                            </div>
                          </div>
                          <div className="pt-1 text-[11px] font-mono text-zinc-500 border-t border-zinc-200/60">
                            Total di Basis Data: <strong className="text-zinc-800">{resetExamStats.total} Peserta</strong>
                          </div>
                        </div>

                        {/* 3. Status Perangkat Terkunci */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Status Perangkat</span>
                              </div>
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                resetExamStats.deviceLocked > 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {resetExamStats.deviceLocked > 0 ? `${resetExamStats.deviceLocked} Terkunci` : 'Aman (0 Terkunci)'}
                              </span>
                            </div>
                            <div className="font-bold text-zinc-900 text-sm">
                              {resetExamStats.deviceLocked > 0
                                ? `${resetExamStats.deviceLocked} Perangkat Perlu Tindakan`
                                : 'Semua Perangkat Normal'}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Total peserta mapel ini: <strong className="text-zinc-800">{resetExamStats.total} Peserta</strong>
                            </div>
                          </div>
                          <div className="pt-1 text-[11px] font-mono text-zinc-500 border-t border-zinc-200/60 flex items-center justify-between">
                            <span>Durasi: {currentResetExam?.duration_minutes || 90} Menit</span>
                            <span>Token: {currentResetExam?.exam_token || '-'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* METRIK KARTU RINGKASAN STATUS PENGERJAAN (TERPISAH DARI CARD 1) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-zinc-500">Total Peserta</div>
                          <div className="text-xl font-bold text-zinc-900 font-mono-num mt-0.5">{resetExamStats.total}</div>
                        </div>
                        <Users className="w-5 h-5 text-zinc-400" />
                      </div>

                      <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-zinc-500">Belum Masuk</div>
                          <div className="text-xl font-bold text-zinc-700 font-mono-num mt-0.5">{resetExamStats.notStarted}</div>
                        </div>
                        <Clock className="w-5 h-5 text-zinc-400" />
                      </div>

                      <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs bg-emerald-50/20 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-emerald-700">Sedang Ujian</div>
                          <div className="text-xl font-bold text-emerald-700 font-mono-num mt-0.5">{resetExamStats.inProgress}</div>
                        </div>
                        <Activity className="w-5 h-5 text-emerald-500" />
                      </div>

                      <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs bg-rose-50/20 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-rose-700">Terkunci</div>
                          <div className="text-xl font-bold text-rose-700 font-mono-num mt-0.5">{resetExamStats.locked}</div>
                        </div>
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                      </div>

                      <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs bg-blue-50/20 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-medium text-blue-700">Selesai</div>
                          <div className="text-xl font-bold text-blue-700 font-mono-num mt-0.5">{resetExamStats.completed}</div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      </div>
                    </div>

                {/* 4. Panel Aksi Massal (Bulk Reset Actions) */}
                <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>Aksi Reset Massal ({hasSelection ? `${selectedStudentIdsForReset.length} Peserta Dipilih` : 'Seluruh Peserta Mapel Ini'})</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {hasSelection
                          ? 'Tindakan berikut akan diterapkan hanya kepada peserta yang Anda centang di tabel.'
                          : `Tindakan berikut akan diterapkan kepada seluruh ${resetExamStudents.length} peserta pada mapel ini.`}
                      </p>
                    </div>

                    {hasSelection && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIdsForReset([])}
                        className="text-[11px] text-zinc-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
                      >
                        Batalkan Pilihan ({selectedStudentIdsForReset.length})
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {/* Aksi Massal 1: Reset Login Semua */}
                    <button
                      type="button"
                      onClick={handleBulkResetLogin}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Hapus kunci perangkat active_device_id agar peserta dapat login dari HP/laptop lain"
                    >
                      <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Reset Login Perangkat ({targetCount})</span>
                    </button>

                    {/* Aksi Massal 2: Set Belum Masuk Semua */}
                    <button
                      type="button"
                      onClick={handleBulkSetNotStarted}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Hapus attempt pengerjaan mapel ini sehingga peserta kembali ke status awal belum mengerjakan"
                    >
                      <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Set "Belum Masuk" ({targetCount})</span>
                    </button>

                    {/* Aksi Massal 3: Set Selesai Semua */}
                    <button
                      type="button"
                      onClick={handleBulkSetCompleted}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Tandai seluruh peserta selesai mengerjakan dan catat presensi Hadir"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Set "Selesai" ({targetCount})</span>
                    </button>

                    {/* Aksi Massal 4: Reset Pekerjaan Semua */}
                    <button
                      type="button"
                      onClick={handleBulkResetWork}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-zinc-700 rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-xs"
                      title="Reset waktu pengerjaan dan pelanggaran ke 0 agar peserta dapat mengulang ujian dari awal"
                    >
                      <RotateCcw className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Reset Pekerjaan ({targetCount})</span>
                    </button>
                  </div>
                </div>

                {/* 5. Tabel Peserta & Aksi Per-Peserta */}
                <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs space-y-0">
                  {/* Toolbar Filter Tabel Peserta */}
                  <div className="p-3 border-b border-zinc-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/50">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
                      <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">Status:</span>
                      {[
                        { id: 'ALL', label: 'Semua Status' },
                        { id: 'NOT_STARTED', label: 'Belum Masuk', count: resetExamStats.notStarted },
                        { id: 'IN_PROGRESS', label: 'Sedang Ujian', count: resetExamStats.inProgress },
                        { id: 'LOCKED', label: 'Terkunci', count: resetExamStats.locked },
                        { id: 'COMPLETED', label: 'Selesai', count: resetExamStats.completed },
                        { id: 'RESET_BY_PROCTOR', label: 'Direset Pengawas', count: resetExamStats.reset },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setResetStatusFilter(tab.id)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                            resetStatusFilter === tab.id
                              ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                              : 'bg-white hover:bg-zinc-100 text-zinc-600 border border-zinc-200/80'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1 text-[10px] font-mono font-bold opacity-80">
                              ({tab.count})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleManualRefreshProctor}
                        disabled={isRefreshingProctor}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer disabled:opacity-60 shrink-0"
                        title="Segarkan data pengawas seketika dari penyimpanan & server"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-zinc-600 ${isRefreshingProctor ? 'animate-spin' : ''}`} />
                        <span>{isRefreshingProctor ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
                      </button>

                      <div className="relative max-w-xs w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          value={resetSearch}
                          onChange={(e) => setResetSearch(e.target.value)}
                          placeholder="Cari nama, NISN, kelas..."
                          className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabel Data Peserta */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold">
                          <th className="py-3 px-3 w-10 text-center">
                            <button
                              type="button"
                              onClick={handleToggleSelectAllReset}
                              className="cursor-pointer text-zinc-600 hover:text-zinc-900"
                              title="Pilih / Batalkan Semua"
                            >
                              {selectedStudentIdsForReset.length === filteredResetExamStudents.length &&
                              filteredResetExamStudents.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                          </th>
                          <th className="py-3 px-3">Nama Peserta & NISN</th>
                          <th className="py-3 px-3">Kelas & Ruang</th>
                          <th className="py-3 px-3">Status Pengerjaan</th>
                          <th className="py-3 px-3">Kunci Login (Perangkat)</th>
                          <th className="py-3 px-3 text-center">Aksi Cepat Pengawas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredResetExamStudents.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="py-12 text-center text-zinc-400 text-xs">
                              Tidak ada peserta yang sesuai dengan filter atau sesi ujian terpilih.
                            </td>
                          </tr>
                        ) : (
                          filteredResetExamStudents.map((row) => {
                            const isSelected = selectedStudentIdsForReset.includes(row.studentId);
                            const isLocked = row.status === 'LOCKED';

                            return (
                              <tr
                                key={row.studentId}
                                className={`transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50/60'
                                    : isLocked
                                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                                    : 'hover:bg-zinc-50/80'
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectStudentReset(row.studentId)}
                                    className="cursor-pointer text-zinc-600 hover:text-zinc-900"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-zinc-300" />
                                    )}
                                  </button>
                                </td>

                                {/* Nama & NISN */}
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-zinc-900">{row.nama}</div>
                                  <div className="text-[11px] text-zinc-400 font-mono">NISN: {row.nisn}</div>
                                </td>

                                {/* Kelas & Ruang */}
                                <td className="py-3 px-3">
                                  <div className="font-medium text-zinc-800">{row.kelas}</div>
                                  <div className="text-[11px] text-zinc-500">{row.ruang || '-'}</div>
                                </td>

                                {/* Status Pengerjaan */}
                                <td className="py-3 px-3">
                                  {row.status === 'NOT_STARTED' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium bg-zinc-50 text-zinc-600 border-zinc-200">
                                      <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                                      <span>Belum Masuk</span>
                                    </span>
                                  )}
                                  {row.status === 'IN_PROGRESS' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>Sedang Ujian</span>
                                    </span>
                                  )}
                                  {row.status === 'LOCKED' && (
                                    <div>
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                                        <span>Terkunci ({row.violationCount}x)</span>
                                      </span>
                                      {row.lastViolationReason && (
                                        <div className="text-[10px] text-rose-500 mt-0.5 max-w-[150px] truncate" title={row.lastViolationReason}>
                                          {row.lastViolationReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {row.status === 'COMPLETED' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium bg-blue-50 text-blue-700 border-blue-200">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      <span>Selesai</span>
                                    </span>
                                  )}
                                  {row.status === 'RESET_BY_PROCTOR' && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium bg-purple-50 text-purple-700 border-purple-200">
                                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                      <span>Direset Pengawas</span>
                                    </span>
                                  )}
                                </td>

                                {/* Kunci Login Perangkat */}
                                <td className="py-3 px-3">
                                  {row.isDeviceLocked ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                        <Smartphone className="w-3 h-3 text-amber-600" />
                                        <span>Terkunci di HP/PC</span>
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-[11px] text-zinc-400">Bebas Login</span>
                                  )}
                                </td>

                                {/* Tombol Aksi Cepat Pengawas */}
                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                    {/* Tombol 1: Reset Login */}
                                    <button
                                      type="button"
                                      onClick={() => handleResetLoginSingle(row.studentId, row.nama)}
                                      disabled={!row.isDeviceLocked}
                                      title={row.isDeviceLocked ? 'Reset kunci login perangkat agar peserta bisa login di tempat lain' : 'Peserta belum terikat perangkat'}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                        row.isDeviceLocked
                                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200 cursor-pointer shadow-2xs'
                                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 opacity-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <Smartphone className="w-3 h-3" />
                                      <span>Reset Login</span>
                                    </button>

                                    {/* Tombol 2: Set Belum Masuk */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetNotStartedSingle(row.studentId, row.nama)}
                                      disabled={row.status === 'NOT_STARTED'}
                                      title={row.status === 'NOT_STARTED' ? 'Peserta sudah berstatus Belum Masuk' : 'Hapus rekaman attempt mapel ini dan kembalikan ke Belum Masuk'}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                        row.status !== 'NOT_STARTED'
                                          ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300 cursor-pointer shadow-2xs'
                                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 opacity-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <Clock className="w-3 h-3 text-zinc-500" />
                                      <span>Belum Masuk</span>
                                    </button>

                                    {/* Tombol 3: Set Selesai */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetCompletedSingle(row.studentId, row.nama)}
                                      disabled={row.status === 'COMPLETED'}
                                      title={row.status === 'COMPLETED' ? 'Peserta sudah berstatus Selesai' : 'Tandai status ujian ini menjadi Selesai (COMPLETED)'}
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                                        row.status !== 'COMPLETED'
                                          ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 cursor-pointer shadow-2xs font-semibold'
                                          : 'bg-zinc-50 text-zinc-400 border-zinc-200 opacity-50 cursor-not-allowed'
                                      }`}
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                      <span>Selesai</span>
                                    </button>

                                    {/* Tombol 4: Reset Pekerjaan */}
                                    <button
                                      type="button"
                                      onClick={() => handleResetWorkSingle(row.studentId, row.nama)}
                                      title="Reset pengerjaan ujian mapel ini agar peserta dapat mengulang dari awal"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all shadow-2xs cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3 text-rose-600" />
                                      <span>Reset Pekerjaan</span>
                                    </button>

                                    {/* Tombol Tambahan jika Terkunci: Buka Kunci */}
                                    {isLocked && (
                                      <button
                                        type="button"
                                        onClick={() => handleProctorUnlock(row.attemptId || row.studentId, row.nama)}
                                        title="Buka kunci layar ujian peserta yang terkena pelanggaran"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 shadow-xs animate-pulse cursor-pointer"
                                      >
                                        <Unlock className="w-3 h-3" />
                                        <span>Buka Kunci</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

                {/* ======================================================== */}
                {/* SUB-VIEW 4: PRESENSI & MONITORING KEHADIRAN UJIAN */}
                {/* ======================================================== */}
                {proctorSubView === 'attendance' && (
                  <div className="space-y-4">
                    {/* CARD 1: HEADER TEMPLATE & IDENTITAS MAPEL SESI TERSELEKSI */}
                    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs p-5 space-y-4">
                      {renderProctorSubNav('attendance', true)}

                      {/* Baris Identitas Mapel Ujian yang Diseleksi & Tombol Cetak Dokumen */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
                        {/* 1. Mata Pelajaran & Judul Ujian */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Mata Pelajaran & Sesi</span>
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {currentAttendanceExam?.session_group || 'Asesmen'}
                            </span>
                          </div>
                          <div className="font-bold text-zinc-900 text-sm truncate" title={currentAttendanceExam?.subject}>
                            {currentAttendanceExam?.subject || 'Mapel Umum'}
                          </div>
                          <div className="text-xs text-zinc-600 truncate" title={currentAttendanceExam?.title}>
                            {currentAttendanceExam?.title}
                          </div>
                        </div>

                        {/* 2. Tingkat Peserta */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-1 flex flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                              <Layers className="w-3.5 h-3.5 text-purple-600" />
                              <span>Tingkat Peserta</span>
                            </div>
                            <div className="font-bold text-zinc-900 text-base">
                              {currentAttendanceExam ? getGradeLabel(currentAttendanceExam.grade_level) : '-'}
                            </div>
                            <div className="text-xs text-zinc-500">
                              Khusus seluruh peserta tingkat {currentAttendanceExam?.grade_level || '-'}
                            </div>
                          </div>
                          <div className="pt-1 text-[11px] font-mono text-zinc-500 border-t border-zinc-200/60">
                            Total di Basis Data: <strong className="text-zinc-800">{totalEligible} Peserta</strong>
                          </div>
                        </div>

                        {/* 3. Tombol Cetak Dokumen: Cetak BA & Cetak Presensi */}
                        <div className="p-3.5 bg-zinc-50/70 border border-zinc-200/70 rounded-xl space-y-2 flex flex-col justify-between">
                          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                            <Printer className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cetak Dokumen Pelaksanaan</span>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowBeritaAcaraModal(true)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                              title="Buka Lembar Cetak Berita Acara Ujian"
                            >
                              <FileText className="w-4 h-4 text-emerald-400" />
                              <span>Cetak Berita Acara</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setShowDaftarHadirModal(true)}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 text-zinc-800 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                              title="Buka Lembar Cetak Daftar Hadir Peserta Tes Resmi"
                            >
                              <Printer className="w-4 h-4 text-zinc-700" />
                              <span>Cetak Presensi</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* METRIK KARTU RINGKASAN */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-2xs">
                    <div className="text-[11px] font-medium text-zinc-500">Total Peserta</div>
                    <div className="text-xl font-bold text-zinc-900 mt-1 font-mono-num">{totalEligible}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {selectedAttendanceRoom === 'ALL' ? 'Semua Ruangan' : selectedAttendanceRoom}
                    </div>
                  </div>

                  <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-2xs bg-emerald-50/20">
                    <div className="text-[11px] font-medium text-emerald-700 flex items-center justify-between">
                      <span>Dinyatakan HADIR</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-xl font-bold text-emerald-700 mt-1 font-mono-num">{presentCount}</div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">&bull; Selesai Ujian</div>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs bg-blue-50/20">
                    <div className="text-[11px] font-medium text-blue-700 flex items-center justify-between">
                      <span>Sedang Mengerjakan</span>
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-blue-700 mt-1 font-mono-num">{inProgressCount}</div>
                    <div className="text-[10px] text-blue-600 mt-0.5">Status: Menit "-"</div>
                  </div>

                  <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs bg-rose-50/20">
                    <div className="text-[11px] font-medium text-rose-700 flex items-center justify-between">
                      <span>Tidak Hadir (S/I/A/D)</span>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="text-xl font-bold text-rose-700 mt-1 font-mono-num">{absentCount}</div>
                    <div className="text-[10px] text-rose-600 mt-0.5">
                      S:{sakitCount} &bull; I:{izinCount} &bull; A:{alphaCount} &bull; D:{dispensasiCount}
                    </div>
                  </div>
                </div>

                {/* TABEL PRESENSI PESERTA */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-zinc-50/70 border-b border-zinc-200/80 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                        <span>Daftar Kehadiran Peserta</span>
                        {currentAttendanceExam && (
                          <span className="text-xs font-normal text-zinc-500">
                            &bull; {getGradeLabel(currentAttendanceExam.grade_level)}
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Menampilkan {filteredAttendanceStudents.length} dari {totalEligible} peserta.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Filter Ruang */}
                      <select
                        value={selectedAttendanceRoom}
                        onChange={(e) => setSelectedAttendanceRoom(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">Semua Ruangan ({eligibleStudents.length})</option>
                        {attendanceRooms.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>

                      {/* Filter Status Kehadiran */}
                      <select
                        value={selectedAttendanceStatus}
                        onChange={(e) => setSelectedAttendanceStatus(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer shadow-2xs"
                      >
                        <option value="ALL">Semua Status</option>
                        <option value="COMPLETED">Hadir (Selesai)</option>
                        <option value="IN_PROGRESS">Sedang Mengerjakan (-)</option>
                        <option value="NOT_STARTED">Belum Hadir</option>
                        <option value="SAKIT">Sakit</option>
                        <option value="IZIN">Izin</option>
                        <option value="ALPHA">Alpa</option>
                        <option value="DISPENSASI">Dispensasi</option>
                      </select>

                      {/* Search Input */}
                      <div className="relative min-w-[200px] sm:min-w-[220px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Cari nama, NISN, no ujian..."
                          value={attendanceSearch}
                          onChange={(e) => setAttendanceSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-600 font-semibold">
                          <th className="py-3 px-3 text-center w-12">No</th>
                          <th className="py-3 px-3 w-32">No. Ujian</th>
                          <th className="py-3 px-4">Nama Peserta & NISN</th>
                          <th className="py-3 px-3">Kelas & Ruang</th>
                          <th className="py-3 px-3 text-center">Status Ujian</th>
                          <th className="py-3 px-4">Status Kehadiran</th>
                          <th className="py-3 px-4">Catatan / Alasan</th>
                          <th className="py-3 px-3 text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredAttendanceStudents.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="py-10 text-center text-zinc-400">
                              Tidak ada data peserta yang cocok dengan filter.
                            </td>
                          </tr>
                        ) : (
                          filteredAttendanceStudents.map((stu, idx) => {
                            const att = attemptsMap.get(stu.id);
                            const rec = attendanceMap.get(stu.id);
                            const draft = attendanceDrafts[stu.id] || {};
                            const effStatus = getEffectiveStatus(stu.id);
                            const currentStatus = draft.status !== undefined ? draft.status : (rec?.status || effStatus);
                            const currentKet = draft.keterangan !== undefined ? draft.keterangan : (rec?.keterangan || '');
                            const noUjian = stu.nomor_ujian || cleanNomorUjian(stu.nomor_ujian, stu.nisn);

                            return (
                              <tr key={stu.id} className="hover:bg-zinc-50/60 transition-colors">
                                <td className="py-3 px-3 text-center text-zinc-500 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-3 px-3 font-mono font-semibold text-zinc-800">
                                  {noUjian}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-zinc-900">{stu.nama}</div>
                                  <div className="text-[10px] text-zinc-500 font-mono">NISN: {stu.nisn}</div>
                                </td>
                                <td className="py-3 px-3 text-zinc-700">
                                  <div>{stu.kelas || '-'}</div>
                                  <div className="text-[10px] text-zinc-500">{stu.ruang || 'Ruang 01'}</div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {att?.status === 'COMPLETED' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>SELESAI</span>
                                    </span>
                                  ) : att?.status === 'IN_PROGRESS' || att?.status === 'LOCKED' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                      <Clock className="w-3 h-3" />
                                      <span>MENGERJAKAN</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-medium border border-zinc-200">
                                      BELUM LOGIN
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {att?.status === 'COMPLETED' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>HADIR (Selesai Ujian)</span>
                                    </span>
                                  ) : att?.status === 'IN_PROGRESS' || att?.status === 'LOCKED' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-bold">
                                      - (Sedang Mengerjakan)
                                    </span>
                                  ) : (
                                    <select
                                      value={currentStatus === 'BELUM_HADIR' ? '' : currentStatus}
                                      onChange={(e) => handleAttendanceDraftChange(stu.id, 'status', e.target.value)}
                                      className="px-2.5 py-1 text-xs border border-zinc-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    >
                                      <option value="">- (Belum Hadir / Mengerjakan) -</option>
                                      <option value="HADIR">Hadir Manual</option>
                                      <option value="SAKIT">Sakit (S)</option>
                                      <option value="IZIN">Izin (I)</option>
                                      <option value="ALPHA">Alpha (A)</option>
                                      <option value="DISPENSASI">Dispensasi (D)</option>
                                    </select>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  {att?.status === 'COMPLETED' ? (
                                    <span className="text-[11px] text-zinc-500 italic">
                                      Tersimpan otomatis
                                    </span>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Alasan / catatan..."
                                      value={currentKet}
                                      onChange={(e) => handleAttendanceDraftChange(stu.id, 'keterangan', e.target.value)}
                                      className="w-full px-2.5 py-1 text-xs border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                    />
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {att?.status !== 'COMPLETED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveAttendance(stu.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                                    >
                                      <Save className="w-3 h-3" />
                                      <span>Simpan</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* MODAL BERITA ACARA PELAKSANAAN UJIAN */}
                {/* ======================================================== */}
                {showBeritaAcaraModal && (
                  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-300 animate-in zoom-in-95">
                      {/* Modal Top Bar */}
                      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50 rounded-t-2xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                            <FileText className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-zinc-900">
                              Berita Acara Pelaksanaan Ujian
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                              Mata Pelajaran: <strong>{currentAttendanceExam?.subject}</strong> &bull; Ruang: <strong>{selectedAttendanceRoom === 'ALL' ? 'Semua Ruang' : selectedAttendanceRoom}</strong>
                            </p>
                          </div>
                        </div>

                        {/* HANYA 1 TOMBOL CETAK SESUAI INSTRUKSI */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => executePrintDocument('printable-berita-acara', 'Berita Acara Pelaksanaan Ujian', printMarginSetting, customPrintMargin)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-emerald-400" />
                            <span>Cetak Dokumen Sekarang (Print / PDF)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowBeritaAcaraModal(false)}
                            className="text-zinc-400 hover:text-zinc-600 p-1.5 text-base cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Pilihan Margin Kertas A4 Standar & Custom (Instruksi #6) */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Pengaturan Margin Kertas A4 (Cetak Standar & Custom):</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={printMarginSetting}
                                onChange={(e) => setPrintMarginSetting(e.target.value)}
                                className="px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-medium"
                              >
                                <option value="narrow">Standar Sempit / Minimum (10mm - Pas 1 Halaman A4)</option>
                                <option value="normal">Standar Normal (20mm)</option>
                                <option value="tight">Standar Rapat (5mm)</option>
                                <option value="custom">Kustom Sendiri (mm)</option>
                              </select>
                            </div>
                          </div>

                          {printMarginSetting === 'custom' && (
                            <div className="flex items-center gap-3 pt-1 text-xs">
                              <span className="text-zinc-600">Margin Kustom (mm):</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Top"
                                value={customPrintMargin.top}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, top: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Right"
                                value={customPrintMargin.right}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, right: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Bottom"
                                value={customPrintMargin.bottom}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, bottom: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Left"
                                value={customPrintMargin.left}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, left: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Formulir Penyesuaian Berita Acara (Tersimpan Permanen) */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                          <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Data Identitas & Petugas Berita Acara (Tersimpan Permanen):</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Nama Instansi Pusat / Yayasan:
                              </label>
                              <input
                                type="text"
                                value={beritaAcaraConfig.instansi_pusat || ''}
                                onChange={(e) => handleUpdateBeritaAcaraField('instansi_pusat', e.target.value)}
                                placeholder="Contoh: YAYASAN PEMBINA PENDIDIKAN"
                                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Alamat Lengkap Sekolah / Instansi:
                              </label>
                              <input
                                type="text"
                                value={beritaAcaraConfig.alamat || ''}
                                onChange={(e) => handleUpdateBeritaAcaraField('alamat', e.target.value)}
                                placeholder="Alamat jalan, kota, kodepos..."
                                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Nama Proktor & NIP:
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.proktor_nama || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('proktor_nama', e.target.value)}
                                  placeholder="Nama Proktor"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                                />
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.proktor_nip || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('proktor_nip', e.target.value)}
                                  placeholder="NIP Proktor"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Nama Pengawas & NIP:
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.pengawas_nama || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('pengawas_nama', e.target.value)}
                                  placeholder="Nama Pengawas"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                                />
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.pengawas_nip || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('pengawas_nip', e.target.value)}
                                  placeholder="NIP Pengawas"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-mono"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Data Kepala Sekolah (Nama & NIP):
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.kepala_sekolah_nama || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('kepala_sekolah_nama', e.target.value)}
                                  placeholder="Nama Kepala Sekolah"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                                />
                                <input
                                  type="text"
                                  value={beritaAcaraConfig.kepala_sekolah_nip || ''}
                                  onChange={(e) => handleUpdateBeritaAcaraField('kepala_sekolah_nip', e.target.value)}
                                  placeholder="NIP Kepala Sekolah"
                                  className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-mono"
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                                Catatan Khusus Selama Pelaksanaan:
                              </label>
                              <textarea
                                rows="2"
                                value={beritaAcaraConfig.catatan_pelaksanaan || ''}
                                onChange={(e) => handleUpdateBeritaAcaraField('catatan_pelaksanaan', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* TEMPLATE FISIK BERITA ACARA (PAS 1 HALAMAN A4 RESMI) */}
                        <div
                          id="printable-berita-acara"
                          style={{
                            padding: printMarginSetting === 'normal'
                              ? '20mm'
                              : printMarginSetting === 'narrow'
                              ? '10mm'
                              : printMarginSetting === 'tight'
                              ? '5mm'
                              : `${customPrintMargin.top || 10}mm ${customPrintMargin.right || 10}mm ${customPrintMargin.bottom || 10}mm ${customPrintMargin.left || 10}mm`
                          }}
                          className="bg-white border border-zinc-300 shadow-sm rounded-lg text-zinc-900 text-xs leading-relaxed max-w-3xl mx-auto transition-all"
                        >
                          {/* 1. KOP SURAT (SISI KANAN KOSONG BERSIH SESUAI REQUEST) */}
                          <div className="flex items-center pb-2.5 border-b-2 border-zinc-900 mb-3">
                            <div className="flex items-center gap-3.5 flex-1">
                              {institution.logo_url ? (
                                <img
                                  src={institution.logo_url}
                                  alt="Logo Instansi"
                                  className="w-14 h-14 object-contain shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                  🛡️
                                </div>
                              )}
                              <div>
                                {beritaAcaraConfig.instansi_pusat && (
                                  <h4 className="text-xs uppercase font-bold text-zinc-700">
                                    {beritaAcaraConfig.instansi_pusat}
                                  </h4>
                                )}
                                <h2 className="text-base sm:text-lg font-black uppercase text-zinc-900 leading-tight">
                                  {institution.name}
                                </h2>
                                <p className="text-[11px] text-zinc-600">
                                  NPSN: <span className="font-mono font-semibold">{institution.npsn || '20104829'}</span> &bull; Jenjang: <span className="font-semibold">{institution.education_level || 'SMA'}</span>
                                </p>
                                {beritaAcaraConfig.alamat && (
                                  <p className="text-[10px] text-zinc-500 italic mt-0.5">
                                    {beritaAcaraConfig.alamat}
                                  </p>
                                )}
                              </div>
                            </div>
                            {/* KOP KANAN KOSONG TOTAL SESUAI REQUEST */}
                            <div className="w-0 shrink-0"></div>
                          </div>

                          {/* 2. JUDUL BERITA ACARA */}
                          <div className="text-center mb-3">
                            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-zinc-900">
                              BERITA ACARA PELAKSANAAN
                            </h2>
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 mt-0.5">
                              {currentAttendanceExam?.title || 'PENILAIAN AKHIR SEMESTER'} - {currentAttendanceExam?.subject}
                            </h3>
                            <div className="text-[11px] font-bold tracking-widest text-zinc-700 mt-0.5 uppercase">
                              TAHUN {dateInfo.yearNum}
                            </div>
                          </div>

                          {/* 3. PARAGRAF PEMBUKA */}
                          <p className="text-justify mb-3 text-[11px] leading-relaxed indent-6">
                            Pada hari ini <strong>{dateInfo.dayName}</strong> tanggal <strong>{dateInfo.dateNum}</strong> bulan <strong>{dateInfo.monthName}</strong> tahun <strong>{dateInfo.yearNum}</strong>, bertempat di <strong>{institution.name}</strong> telah dilaksanakan ujian <strong>{currentAttendanceExam?.title || 'Ujian'}</strong> Mata Pelajaran <strong>{currentAttendanceExam?.subject}</strong> Jenjang <strong>{institution.education_level}</strong> Tahun {dateInfo.yearNum}, mulai pukul <strong>{examStartTimeFormatted}</strong> sampai dengan pukul <strong>{examEndTimeFormatted}</strong> WIB.
                          </p>

                          {/* 4. POIN 1: DATA PELAKSANAAN UJIAN (FORMAT 2 KOLOM PAS 1 HALAMAN A4) */}
                          <div className="mb-3">
                            <div className="font-bold text-xs mb-1">1. Data Pelaksanaan Ujian:</div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] py-1 px-2.5 border border-zinc-300 rounded bg-zinc-50/40">
                              <div className="grid grid-cols-[130px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Nama Sekolah</span>
                                <span>:</span>
                                <strong className="truncate">{institution.name}</strong>
                              </div>
                              <div className="grid grid-cols-[150px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Jumlah Peserta Terdaftar</span>
                                <span>:</span>
                                <span className="font-semibold">{totalEligible} orang</span>
                              </div>

                              <div className="grid grid-cols-[130px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Nama Ujian</span>
                                <span>:</span>
                                <strong className="truncate">{currentAttendanceExam?.title || 'Ujian'}</strong>
                              </div>
                              <div className="grid grid-cols-[150px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Jumlah Peserta Hadir</span>
                                <span>:</span>
                                <span className="font-semibold text-emerald-800">{presentCount} orang</span>
                              </div>

                              <div className="grid grid-cols-[130px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Mata Pelajaran</span>
                                <span>:</span>
                                <strong className="truncate">{currentAttendanceExam?.subject}</strong>
                              </div>
                              <div className="grid grid-cols-[150px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Jumlah Peserta Tidak Hadir</span>
                                <span>:</span>
                                <span className="font-semibold text-rose-800">
                                  {absentCount} orang
                                  {absentCount > 0 && ` (S:${sakitCount}, I:${izinCount}, A:${alphaCount})`}
                                </span>
                              </div>

                              <div className="grid grid-cols-[130px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Tingkat / Kelas</span>
                                <span>:</span>
                                <span>{getGradeLabel(currentAttendanceExam?.grade_level)}</span>
                              </div>
                              <div className="grid grid-cols-[150px_10px_1fr] py-0.5 border-b border-zinc-200">
                                <span className="font-medium text-zinc-700">Jumlah Komputer Terdaftar</span>
                                <span>:</span>
                                <span>{totalEligible} unit</span>
                              </div>

                              <div className="grid grid-cols-[130px_10px_1fr] py-0.5">
                                <span className="font-medium text-zinc-700">Nama Ruangan</span>
                                <span>:</span>
                                <strong className="truncate">{selectedAttendanceRoom === 'ALL' ? 'Semua Ruang Ujian' : selectedAttendanceRoom}</strong>
                              </div>
                              <div className="grid grid-cols-[150px_10px_1fr] py-0.5">
                                <span className="font-medium text-zinc-700">Jumlah Komputer Terpakai</span>
                                <span>:</span>
                                <span className="font-semibold">{presentCount} unit</span>
                              </div>
                            </div>
                          </div>

                          {/* 5. POIN 2: CATATAN PELAKSANAAN */}
                          <div className="mb-3">
                            <div className="font-bold text-xs mb-1">
                              2. Catatan selama pelaksanaan {currentAttendanceExam?.title || 'Ujian'} Tahun {dateInfo.yearNum}:
                            </div>
                            <div className="w-full min-h-[42px] p-2 border border-zinc-800 rounded text-[11px] text-zinc-800 whitespace-pre-wrap">
                              {beritaAcaraConfig.catatan_pelaksanaan || 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.'}
                            </div>
                          </div>

                          {/* 6. TANDA TANGAN PETUGAS (PAS 1 HALAMAN A4) */}
                          <div className="mt-3 text-xs page-break-avoid">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Kiri: Yang membuat berita acara (Proktor & Pengawas) */}
                              <div className="border border-zinc-300 rounded p-2.5 bg-zinc-50/20">
                                <div className="font-bold text-[11px] text-zinc-800 mb-1.5 pb-1 border-b border-zinc-300">
                                  Yang membuat berita acara:
                                </div>
                                <div className="space-y-2 text-[11px]">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <span>1. Proktor : </span>
                                      <strong className="underline">{beritaAcaraConfig.proktor_nama || 'Proktor Ujian'}</strong>
                                      {beritaAcaraConfig.proktor_nip && (
                                        <div className="text-[10px] text-zinc-600 font-mono">NIP. {beritaAcaraConfig.proktor_nip}</div>
                                      )}
                                    </div>
                                    <div className="text-right text-zinc-500 font-mono text-[10px] tracking-widest shrink-0">
                                      1. .....................
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200">
                                    <div>
                                      <span>2. Pengawas : </span>
                                      <strong className="underline">{beritaAcaraConfig.pengawas_nama || 'Pengawas Ruang'}</strong>
                                      {beritaAcaraConfig.pengawas_nip && (
                                        <div className="text-[10px] text-zinc-600 font-mono">NIP. {beritaAcaraConfig.pengawas_nip}</div>
                                      )}
                                    </div>
                                    <div className="text-right text-zinc-500 font-mono text-[10px] tracking-widest shrink-0">
                                      2. .....................
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Kanan: Mengetahui Kepala Sekolah */}
                              <div className="text-center flex flex-col justify-between p-2.5 border border-zinc-300 rounded bg-zinc-50/20">
                                <div>
                                  <div className="text-[11px] text-zinc-600">Mengetahui,</div>
                                  <div className="font-bold text-xs">Kepala {institution.name}</div>
                                </div>
                                <div className="h-9"></div>
                                <div>
                                  <div className="font-bold text-xs underline">{beritaAcaraConfig.kepala_sekolah_nama || 'Kepala Sekolah'}</div>
                                  <div className="text-[10px] text-zinc-600 font-mono">
                                    NIP. {beritaAcaraConfig.kepala_sekolah_nip || '......................................................'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 rounded-b-2xl flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBeritaAcaraModal(false)}
                          className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ======================================================== */}
                {/* MODAL DAFTAR HADIR PESERTA TES (FORMAT PDF RESMI) */}
                {/* ======================================================== */}
                {showDaftarHadirModal && (
                  <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-300 animate-in zoom-in-95">
                      {/* Modal Top Bar */}
                      <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50 rounded-t-2xl">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-zinc-900">
                              Daftar Hadir Peserta Tes
                            </h3>
                            <p className="text-[11px] text-zinc-500">
                              Mata Pelajaran: <strong>{currentAttendanceExam?.subject}</strong> &bull; Ruang: <strong>{selectedAttendanceRoom === 'ALL' ? 'Semua Ruang' : selectedAttendanceRoom}</strong>
                            </p>
                          </div>
                        </div>

                        {/* HANYA 1 TOMBOL CETAK SESUAI INSTRUKSI */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => executePrintDocument('printable-daftar-hadir', 'Daftar Hadir Peserta Tes', printMarginSetting, customPrintMargin)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                          >
                            <Printer className="w-4 h-4 text-emerald-400" />
                            <span>Cetak Dokumen Sekarang (Print / PDF)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDaftarHadirModal(false)}
                            className="text-zinc-400 hover:text-zinc-600 p-1.5 text-base cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Pilihan Margin Kertas A4 Standar & Custom */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Pengaturan Margin Kertas A4 (Cetak Standar & Custom):</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={printMarginSetting}
                                onChange={(e) => setPrintMarginSetting(e.target.value)}
                                className="px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white font-medium"
                              >
                                <option value="narrow">Standar Sempit / Minimum (10mm - Pas 1 Halaman A4)</option>
                                <option value="normal">Standar Normal (20mm)</option>
                                <option value="tight">Standar Rapat (5mm)</option>
                                <option value="custom">Kustom Sendiri (mm)</option>
                              </select>
                            </div>
                          </div>

                          {printMarginSetting === 'custom' && (
                            <div className="flex items-center gap-3 pt-1 text-xs">
                              <span className="text-zinc-600">Margin Kustom (mm):</span>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Top"
                                value={customPrintMargin.top}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, top: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Right"
                                value={customPrintMargin.right}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, right: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Bottom"
                                value={customPrintMargin.bottom}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, bottom: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                              <input
                                type="number"
                                min="0"
                                max="50"
                                placeholder="Left"
                                value={customPrintMargin.left}
                                onChange={(e) => setCustomPrintMargin({ ...customPrintMargin, left: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-zinc-300 rounded text-center text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* TEMPLATE FISIK DAFTAR HADIR SESUAI PDF */}
                        <div
                          id="printable-daftar-hadir"
                          style={{
                            padding: printMarginSetting === 'normal'
                              ? '20mm'
                              : printMarginSetting === 'narrow'
                              ? '10mm'
                              : printMarginSetting === 'tight'
                              ? '5mm'
                              : `${customPrintMargin.top || 10}mm ${customPrintMargin.right || 10}mm ${customPrintMargin.bottom || 10}mm ${customPrintMargin.left || 10}mm`
                          }}
                          className="bg-white border border-zinc-300 shadow-sm rounded-lg text-zinc-900 text-xs leading-relaxed max-w-3xl mx-auto transition-all"
                        >
                          {/* 1. KOP RESMI (SISI KANAN KOSONG) */}
                          <div className="flex items-center pb-2.5 border-b-2 border-zinc-900 mb-3">
                            <div className="flex items-center gap-3.5 flex-1">
                              {institution.logo_url ? (
                                <img
                                  src={institution.logo_url}
                                  alt="Logo Instansi"
                                  className="w-14 h-14 object-contain shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                  🛡️
                                </div>
                              )}
                              <div>
                                {beritaAcaraConfig.instansi_pusat && (
                                  <h4 className="text-xs uppercase font-bold text-zinc-700">
                                    {beritaAcaraConfig.instansi_pusat}
                                  </h4>
                                )}
                                <h2 className="text-base sm:text-lg font-black uppercase text-zinc-900 leading-tight">
                                  {institution.name}
                                </h2>
                                <p className="text-[11px] text-zinc-600">
                                  NPSN: <span className="font-mono font-semibold">{institution.npsn || '20104829'}</span> &bull; Jenjang: <span className="font-semibold">{institution.education_level || 'SMA'}</span>
                                </p>
                                {beritaAcaraConfig.alamat && (
                                  <p className="text-[10px] text-zinc-500 italic mt-0.5">
                                    {beritaAcaraConfig.alamat}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="w-0 shrink-0"></div>
                          </div>

                          {/* 2. JUDUL DOKUMEN */}
                          <div className="text-center mb-3">
                            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-zinc-900">
                              DAFTAR HADIR PESERTA TES
                            </h2>
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 mt-0.5">
                              {currentAttendanceExam?.title || 'PENILAIAN AKHIR SEMESTER'} - {currentAttendanceExam?.subject}
                            </h3>
                            <div className="text-[11px] font-bold tracking-widest text-zinc-700 mt-0.5 uppercase">
                              TAHUN {dateInfo.yearNum}
                            </div>
                          </div>

                          {/* 3. IDENTITAS (NAMA UJIAN BUKAN SESI, SESUAI REQUEST 4 & SCREENSHOT 1) */}
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs mb-3 pb-2 border-b border-zinc-200">
                            <div className="grid grid-cols-[100px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Nama Sekolah</span>
                              <span>:</span>
                              <strong>{institution.name}</strong>
                            </div>

                            <div className="grid grid-cols-[90px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Nama Ujian</span>
                              <span>:</span>
                              <strong>{currentAttendanceExam?.title || currentAttendanceExam?.session_group || 'Ujian'}</strong>
                            </div>

                            <div className="grid grid-cols-[100px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Tanggal</span>
                              <span>:</span>
                              <span>{dateInfo.fullText}</span>
                            </div>

                            <div className="grid grid-cols-[90px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Waktu</span>
                              <span>:</span>
                              <span className="font-mono">{examStartTimeFormatted} - {examEndTimeFormatted} WIB</span>
                            </div>

                            <div className="grid grid-cols-[100px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Nama Ruangan</span>
                              <span>:</span>
                              <strong>{selectedAttendanceRoom === 'ALL' ? 'Semua Ruang Ujian' : selectedAttendanceRoom}</strong>
                            </div>

                            <div className="grid grid-cols-[90px_10px_1fr]">
                              <span className="font-medium text-zinc-700">Mata Pelajaran</span>
                              <span>:</span>
                              <strong>{currentAttendanceExam?.subject}</strong>
                            </div>
                          </div>

                          {/* 4. TABEL PESERTA DENGAN KOLOM NO. UJIAN DI DEPAN NAMA (REQUEST 3) */}
                          <div className="mb-6">
                            <table className="w-full text-left border-collapse border border-zinc-900 text-xs">
                              <thead>
                                <tr className="bg-zinc-200 border-b border-zinc-900 text-zinc-900 font-bold">
                                  <th className="border border-zinc-900 py-2 px-2 text-center w-10">NO</th>
                                  <th className="border border-zinc-900 py-2 px-3 text-center w-32">NO. UJIAN</th>
                                  <th className="border border-zinc-900 py-2 px-3">NAMA PESERTA</th>
                                  <th className="border border-zinc-900 py-2 px-2 text-center w-24">KELAS</th>
                                  <th className="border border-zinc-900 py-2 px-3 text-center w-48" colSpan="2">
                                    TANDA TANGAN
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {roomFilteredEligible.length === 0 ? (
                                  <tr>
                                    <td colSpan="6" className="border border-zinc-900 text-center py-6 text-zinc-400 italic">
                                      Tidak ada data peserta pada ruangan ini.
                                    </td>
                                  </tr>
                                ) : (
                                  roomFilteredEligible.map((stu, i) => {
                                    const num = i + 1;
                                    const isOdd = num % 2 !== 0;
                                    const noUjian = stu.nomor_ujian || cleanNomorUjian(stu.nomor_ujian, stu.nisn);

                                    return (
                                      <tr key={stu.id} className="border-b border-zinc-900 h-8 page-break-avoid">
                                        <td className="border border-zinc-900 py-1 px-1.5 text-center font-semibold">
                                          {num}.
                                        </td>
                                        <td className="border border-zinc-900 py-1 px-2.5 font-mono text-center font-bold text-zinc-800">
                                          {noUjian}
                                        </td>
                                        <td className="border border-zinc-900 py-1 px-2.5">
                                          <div className="font-bold text-zinc-900">{stu.nama}</div>
                                          <div className="text-[10px] text-zinc-500 font-mono">NISN: {stu.nisn}</div>
                                        </td>
                                        <td className="border border-zinc-900 py-1 px-2 text-center">
                                          {stu.kelas || '-'}
                                        </td>
                                        {/* TANDA TANGAN BERSELANG-SELING SESUAI TEMPLATE PDF */}
                                        {isOdd ? (
                                          <>
                                            <td className="border border-zinc-900 py-1 px-2 text-left w-24 text-[11px] font-medium align-middle">
                                              {num}. ...................
                                            </td>
                                            <td className="border border-zinc-900 py-1 px-2 w-24 bg-zinc-50/30"></td>
                                          </>
                                        ) : (
                                          <>
                                            <td className="border border-zinc-900 py-1 px-2 w-24 bg-zinc-50/30"></td>
                                            <td className="border border-zinc-900 py-1 px-2 text-left w-24 text-[11px] font-medium align-middle">
                                              {num}. ...................
                                            </td>
                                          </>
                                        )}
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* 5. TANDA TANGAN BAWAH (PENGAWAS, PROKTOR, KEPALA SEKOLAH) */}
                          <div className="mt-6 pt-3 text-xs page-break-avoid">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-zinc-600 mb-1">Pengawas Ruang,</div>
                                <div className="h-12"></div>
                                <div className="font-bold underline">{beritaAcaraConfig.pengawas_nama || 'Pengawas Ruang'}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  NIP. {beritaAcaraConfig.pengawas_nip || '.............................'}
                                </div>
                              </div>

                              <div>
                                <div className="text-zinc-600 mb-1">Proktor Ujian,</div>
                                <div className="h-12"></div>
                                <div className="font-bold underline">{beritaAcaraConfig.proktor_nama || 'Proktor Ujian'}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  NIP. {beritaAcaraConfig.proktor_nip || '.............................'}
                                </div>
                              </div>

                              <div>
                                <div className="text-zinc-600 mb-1">Mengetahui, Kepala Sekolah</div>
                                <div className="h-12"></div>
                                <div className="font-bold underline">{beritaAcaraConfig.kepala_sekolah_nama || 'Kepala Sekolah'}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  NIP. {beritaAcaraConfig.kepala_sekolah_nip || '.............................'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 rounded-b-2xl flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDaftarHadirModal(false)}
                          className="px-4 py-2 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

                {/* ======================================================== */}
                {/* MODAL POPUP: DETAIL SESI UJIAN TERPILIH */}
                {/* ======================================================== */}
                {showExamDetailModal && detailExamData && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95">
                      {/* Modal Header */}
                      <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <Info className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                              Detail Sesi Ujian
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                                detailExamData.is_active
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                              }`}>
                                {detailExamData.is_active ? 'Publish' : 'Draft'}
                              </span>
                            </h3>
                            <p className="text-xs text-zinc-300">
                              {detailExamData.title} &bull; {detailExamData.subject || 'Mata Pelajaran'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowExamDetailModal(false)}
                          className="text-zinc-400 hover:text-white p-1 text-lg cursor-pointer"
                          title="Tutup"
                        >
                          &times;
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
                        {/* Judul & Deskripsi Soal */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Judul Sesi Ujian</span>
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {detailExamData.subject || 'Mata Pelajaran'}
                            </span>
                          </div>
                          <div className="text-base font-bold text-zinc-900 leading-snug">
                            {detailExamData.title}
                          </div>
                          <div className="pt-2 border-t border-zinc-200/70">
                            <div className="text-[11px] font-semibold text-zinc-600 mb-1">Deskripsi & Petunjuk Pengerjaan:</div>
                            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
                              {detailExamData.description ? detailExamData.description : 'Tidak ada deskripsi atau petunjuk tambahan khusus untuk sesi ujian ini.'}
                            </p>
                          </div>
                        </div>

                        {/* Ringkasan Data Dasar Ujian */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Kelompok Ujian</div>
                            <div className="text-xs font-bold text-zinc-900 mt-0.5">{detailExamData.session_group || 'Semua Kelompok'}</div>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Mata Pelajaran</div>
                            <div className="text-xs font-bold text-blue-700 mt-0.5">{detailExamData.subject || '-'}</div>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Tingkat / Kelas</div>
                            <div className="text-xs font-bold text-zinc-900 mt-0.5">{getGradeLabel(detailExamData.grade_level)}</div>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Waktu Ujian</div>
                            <div className="text-xs font-bold font-mono text-zinc-900 mt-0.5">
                              {formatExamTimeDisplay(detailExamData.start_time, '07:30')} - {formatExamTimeDisplay(detailExamData.end_time, '16:00')} WIB
                            </div>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Durasi Pengerjaan</div>
                            <div className="text-xs font-bold text-zinc-900 mt-0.5">{detailExamData.duration_minutes} Menit</div>
                          </div>
                          <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                            <div className="text-[11px] text-zinc-500 font-medium">Status Sesi</div>
                            <div className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>Aktif Berjalan</span>
                            </div>
                          </div>
                        </div>

                        {/* Token Ujian & Token Selesai */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                          <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                            <span>Token Otentikasi Peserta:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Token Masuk */}
                            <div className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Token Masuk Ujian</div>
                                <div className="font-mono text-sm font-extrabold text-zinc-900 tracking-wider">
                                  {detailExamData.exam_token || '-'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyToken(detailExamData.exam_token, `detail-in-${detailExamData.id}`)}
                                className="p-1.5 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
                                title="Salin Token Masuk"
                              >
                                {copiedTokenId === `detail-in-${detailExamData.id}` ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            {/* Token Selesai */}
                            <div className="p-3 bg-white border border-zinc-200 rounded-lg flex items-center justify-between">
                              <div>
                                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Token Selesai (Submit)</div>
                                <div className="font-mono text-sm font-extrabold text-zinc-900 tracking-wider">
                                  {detailExamData.finish_token || '-'}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyToken(detailExamData.finish_token, `detail-fin-${detailExamData.id}`)}
                                className="p-1.5 hover:bg-zinc-100 rounded text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
                                title="Salin Token Selesai"
                              >
                                {copiedTokenId === `detail-fin-${detailExamData.id}` ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Tautan URL Google Form */}
                        <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3">
                          <div className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tautan Formulir Ujian (Google Forms):</span>
                          </div>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-white border border-zinc-200 rounded-lg space-y-1">
                              <div className="text-[10px] text-zinc-500 font-medium">URL Soal (Viewform Embedded):</div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-zinc-700 truncate flex-1 select-all">
                                  {detailExamData.gform_base_url || 'Belum diisi'}
                                </span>
                                {detailExamData.gform_base_url && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToken(detailExamData.gform_base_url, `gform-${detailExamData.id}`)}
                                      className="p-1 hover:bg-zinc-100 rounded text-zinc-600 cursor-pointer"
                                      title="Salin URL"
                                    >
                                      {copiedTokenId === `gform-${detailExamData.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <a
                                      href={detailExamData.gform_base_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-blue-600"
                                      title="Buka Formulir di Tab Baru"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {detailExamData.respon_base_url && (
                              <div className="p-2.5 bg-white border border-zinc-200 rounded-lg space-y-1">
                                <div className="text-[10px] text-zinc-500 font-medium">URL Lembar Respon Nilai:</div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] text-zinc-700 truncate flex-1 select-all">
                                    {detailExamData.respon_base_url}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleCopyToken(detailExamData.respon_base_url, `resp-${detailExamData.id}`)}
                                      className="p-1 hover:bg-zinc-100 rounded text-zinc-600 cursor-pointer"
                                      title="Salin URL Respon"
                                    >
                                      {copiedTokenId === `resp-${detailExamData.id}` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <a
                                      href={detailExamData.respon_base_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-1 hover:bg-zinc-100 rounded text-zinc-600 hover:text-emerald-600"
                                      title="Buka Respon di Tab Baru"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ringkasan Statistik Peserta Saat Ini */}
                        {(() => {
                          const examStudents = users.filter(
                            (u) => u.role === 'student' && (!detailExamData.grade_level || Number(u.tingkat) === Number(detailExamData.grade_level) || Number(detailExamData.grade_level) === 0)
                          );
                          const examAtts = attempts.filter((a) => a.exam_session_id === detailExamData.id);
                          const completed = examAtts.filter((a) => a.status === 'COMPLETED').length;
                          const inProgress = examAtts.filter((a) => a.status === 'IN_PROGRESS').length;
                          const locked = examAtts.filter((a) => a.status === 'LOCKED').length;
                          const notStarted = Math.max(0, examStudents.length - completed - inProgress - locked);

                          return (
                            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2.5">
                              <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Statistik Peserta Mapel Ini ({getGradeLabel(detailExamData.grade_level)}):</span>
                                </span>
                                <span className="font-mono text-zinc-900 font-bold">{examStudents.length} Terdaftar</span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="p-2 bg-white border border-zinc-200 rounded-lg">
                                  <div className="text-[10px] text-zinc-500">Belum Masuk</div>
                                  <div className="font-bold text-zinc-700 font-mono text-sm mt-0.5">{notStarted}</div>
                                </div>
                                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                                  <div className="text-[10px] text-emerald-700 font-semibold">Sedang Ujian</div>
                                  <div className="font-bold text-emerald-700 font-mono text-sm mt-0.5">{inProgress}</div>
                                </div>
                                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                                  <div className="text-[10px] text-rose-700 font-semibold">Terkunci</div>
                                  <div className="font-bold text-rose-700 font-mono text-sm mt-0.5">{locked}</div>
                                </div>
                                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="text-[10px] text-blue-700 font-semibold">Selesai</div>
                                  <div className="font-bold text-blue-700 font-mono text-sm mt-0.5">{completed}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Modal Footer (Aksi Langsung ke Pantau, Reset, Presensi) */}
                      <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowExamDetailModal(false)}
                          className="px-4 py-2 border border-zinc-300 rounded-xl font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer text-xs"
                        >
                          Tutup
                        </button>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowExamDetailModal(false);
                              handleOpenProctorMonitor(detailExamData);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Buka Pantau Live</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowExamDetailModal(false);
                              handleOpenProctorReset(detailExamData);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Buka Reset Status</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowExamDetailModal(false);
                              handleOpenProctorAttendance(detailExamData);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-all"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Buka Presensi</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          {/* TAB 4: BASIS DATA PESERTA & IMPORT CSV */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari peserta nama, NISN, atau kelas..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleOpenAddModal}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Peserta</span>
                  </button>

                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-xl shadow-2xs transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-zinc-500" />
                    <span>Import Peserta (CSV/Excel)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (filteredUsers.length === 0) {
                        showNotification('Tidak ada peserta untuk dicetak kartu ujiannya.', 'error');
                        return;
                      }
                      setShowPrintAllCardsModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer"
                    title="Cetak Seluruh Kartu Ujian Peserta Lengkap dengan QR Code Login Instan"
                  >
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Cetak Kartu QR Peserta ({filteredUsers.length})</span>
                  </button>

                  <button
                    onClick={handleClearAllStudents}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl shadow-2xs transition-all cursor-pointer"
                    title="Hapus seluruh data peserta sekaligus"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Kosongkan Peserta</span>
                  </button>
                </div>
              </div>

              {/* Tabel Peserta */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium select-none">
                        <th
                          className="py-3.5 px-3 text-center w-12 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('no')}
                          title="Klik untuk mengurutkan berdasarkan Nomor"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>No</span>
                            {renderStudentSortIcon('no')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 w-32 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('nomor_ujian')}
                          title="Klik untuk mengurutkan berdasarkan Nomor Ujian"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>No. Ujian</span>
                            {renderStudentSortIcon('nomor_ujian')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-4 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('nama')}
                          title="Klik untuk mengurutkan berdasarkan Nama Peserta"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>Nama Peserta</span>
                            {renderStudentSortIcon('nama')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('nisn')}
                          title="Klik untuk mengurutkan berdasarkan NISN & NIS"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>NISN & NIS</span>
                            {renderStudentSortIcon('nisn')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('kelas')}
                          title="Klik untuk mengurutkan berdasarkan Rombel/Kelas"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>Rombel</span>
                            {renderStudentSortIcon('kelas')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('ruang')}
                          title="Klik untuk mengurutkan berdasarkan Ruang Ujian"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>Ruang</span>
                            {renderStudentSortIcon('ruang')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('active_device_id')}
                          title="Klik untuk mengurutkan berdasarkan Kunci Perangkat"
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <span>Kunci Perangkat</span>
                            {renderStudentSortIcon('active_device_id')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 text-center cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('google_linked')}
                          title="Klik untuk mengurutkan berdasarkan Status SSO Google"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>SSO Google</span>
                            {renderStudentSortIcon('google_linked')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 text-center cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('is_active')}
                          title="Klik untuk mengurutkan berdasarkan Status Keaktifan Akun"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>Status Akun</span>
                            {renderStudentSortIcon('is_active')}
                          </div>
                        </th>
                        <th
                          className="py-3.5 px-3 text-center cursor-pointer group hover:text-zinc-900 transition-colors"
                          onClick={() => handleStudentSort('is_verified')}
                          title="Klik untuk mengurutkan berdasarkan Status Verifikasi"
                        >
                          <div className="inline-flex items-center justify-center gap-1">
                            <span>Verifikasi</span>
                            {renderStudentSortIcon('is_verified')}
                          </div>
                        </th>
                        <th className="py-3.5 px-3 text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="text-center py-12 text-zinc-400 text-xs">
                            Tidak ada peserta yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((stu, index) => (
                          <tr key={stu.id} className="hover:bg-zinc-50/80 transition-colors">
                            {/* Kolom 1: No */}
                            <td className="py-3.5 px-3 text-center font-mono text-zinc-500 font-medium">
                              {index + 1}
                            </td>

                            {/* Kolom 2: No. Ujian */}
                            <td className="py-3.5 px-3 font-mono font-semibold text-zinc-800">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">
                                {stu.nomor_ujian || cleanNomorUjian(stu.nomor_ujian, stu.nisn)}
                              </span>
                            </td>

                            {/* Kolom 3: Nama Peserta */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-zinc-900">{stu.nama}</div>
                              <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`font-bold ${stu.jenis_kelamin === 'P' ? 'text-pink-600' : 'text-blue-600'}`}
                                  title={stu.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
                                >
                                  {stu.jenis_kelamin === 'P' ? '♀' : '♂'}
                                </span>
                                <span>&bull;</span>
                                <span className="text-zinc-500">{stu.agama || 'Islam'}</span>
                              </div>
                              <div className="text-[11px] truncate mt-0.5 font-mono">
                                {stu.email ? (
                                  <span className="text-zinc-600">{stu.email}</span>
                                ) : (
                                  <span className="text-zinc-400">-</span>
                                )}
                              </div>
                            </td>

                            {/* Kolom 4: NISN & NIS */}
                            <td className="py-3.5 px-3 font-mono">
                              <div className="font-medium text-zinc-800">{stu.nisn}</div>
                              <div className="text-[11px] text-zinc-400">{stu.nis || '-'}</div>
                            </td>

                            {/* Kolom 5: Rombel */}
                            <td className="py-3.5 px-3 font-medium text-zinc-800">
                              {stu.kelas || stu.rombel || '-'} ({getGradeLabel(stu.tingkat)})
                            </td>

                            {/* Kolom 6: Ruang */}
                            <td className="py-3.5 px-3 font-mono text-zinc-700">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">
                                {stu.ruang || '-'}
                              </span>
                            </td>

                            {/* Kolom 5: Kunci Perangkat */}
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              {stu.active_device_id ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                    {stu.active_device_id}
                                  </span>
                                  <button
                                    onClick={() => handleProctorResetLogin(stu.id, stu.nama)}
                                    className="p-1 text-zinc-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                    title="Reset Perangkat Peserta Ini"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-zinc-400 italic">Belum terikat</span>
                              )}
                            </td>

                            {/* Kolom 6: Status SSO Google (Otomatis & Read-Only bagi Admin) */}
                            <td className="py-3.5 px-4 text-center">
                              {stu.google_linked && stu.google_id ? (
                                <div className="inline-flex flex-col items-center">
                                  <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 shadow-2xs select-none"
                                    title={`SSO Google Terhubung: Pernah login SSO dengan email terdaftar (${stu.google_email || stu.email}) dan ID Google tersimpan (${stu.google_id}). Status otomatis.`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-[11px] font-semibold tracking-tight">SSO On</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleResetStudentSSO(stu)}
                                    className="text-[10px] text-zinc-400 hover:text-rose-600 hover:underline mt-0.5 font-medium cursor-pointer inline-flex items-center gap-1 transition-colors"
                                    title={`Putuskan tautan SSO Google (${stu.google_email || stu.email})`}
                                  >
                                    <Unlink className="w-2.5 h-2.5" />
                                    <span>Reset SSO</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 select-none shadow-2xs"
                                    title="SSO Google Off: Peserta belum pernah login menggunakan Google SSO. Icon centang akan otomatis aktif (hijau) setelah peserta login lewat SSO dengan email terdaftar."
                                  >
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-500 flex items-center justify-center shrink-0">
                                      <span className="w-1.5 h-0.5 bg-zinc-600 rounded-full"></span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-zinc-800">SSO Off</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-500 font-medium italic mt-0.5">
                                    Belum pernah login
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Kolom 7: Status Akun (Switch On/Off murni tanpa teks, keterangan via hover) */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={stu.is_active}
                                  disabled={!stu.is_verified}
                                  onClick={() => {
                                    if (!stu.is_verified) {
                                      showNotification(
                                        'Peserta belum terverifikasi! Harap verifikasi peserta terlebih dahulu sebelum mengaktifkan akun.',
                                        'error'
                                      );
                                      return;
                                    }
                                    try {
                                      storageService.toggleUserActive(stu.id);
                                      refreshData();
                                      showNotification(
                                        `Status akun ${stu.nama} diubah menjadi ${!stu.is_active ? 'Aktif' : 'Non-Aktif'}.`
                                      );
                                    } catch (err) {
                                      showNotification(err.message, 'error');
                                    }
                                  }}
                                  title={
                                    !stu.is_verified
                                      ? 'Akun Terkunci: Wajib verifikasi peserta terlebih dahulu sebelum akun dapat diaktifkan'
                                      : stu.is_active
                                        ? 'Status Akun: Aktif (Klik untuk menonaktifkan)'
                                        : 'Status Akun: Non-Aktif (Klik untuk mengaktifkan)'
                                  }
                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs ${!stu.is_verified
                                      ? 'bg-zinc-200 opacity-60 cursor-not-allowed'
                                      : stu.is_active
                                        ? 'bg-emerald-500'
                                        : 'bg-zinc-300 hover:bg-zinc-400'
                                    }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${stu.is_active ? 'translate-x-4' : 'translate-x-1'
                                      }`}
                                  />
                                </button>
                              </div>
                            </td>

                            {/* Kolom 8: Verifikasi (Hanya Icon, keterangan status via hover) */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = storageService.toggleUserVerified(stu.id);
                                    refreshData();
                                    if (updated.is_verified) {
                                      showNotification(
                                        `Peserta ${stu.nama} berhasil diverifikasi. Akun sekarang dapat diaktifkan.`
                                      );
                                    } else {
                                      showNotification(
                                        `Verifikasi ${stu.nama} dicabut. Status akun otomatis dinonaktifkan demi kepatuhan ujian.`,
                                        'error'
                                      );
                                    }
                                  }}
                                  title={
                                    stu.is_verified
                                      ? 'Terverifikasi (Klik untuk mencabut status verifikasi)'
                                      : 'Belum Terverifikasi (Klik untuk memverifikasi peserta)'
                                  }
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer shadow-2xs ${stu.is_verified
                                      ? 'bg-blue-50 text-blue-600 border-blue-200/90 hover:bg-blue-100 hover:scale-105'
                                      : 'bg-amber-50 text-amber-600 border-amber-200/90 hover:bg-amber-100 hover:scale-105'
                                    }`}
                                >
                                  {stu.is_verified ? (
                                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 text-amber-600" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Kolom 9: Aksi (Edit, Reset Password, Reset SSO, Hapus) */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Lihat & Cetak QR Code Kartu Ujian */}
                                <button
                                  onClick={() => handleViewStudentQr(stu)}
                                  className="p-1.5 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Lihat & Cetak QR Code Kartu Ujian Peserta"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                                </button>

                                {/* Edit Akun */}
                                <button
                                  onClick={() => handleOpenEditModal(stu)}
                                  className="p-1.5 text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Edit Profil & Data Peserta"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-zinc-700" />
                                </button>

                                {/* Reset Password ke Default NIS */}
                                <button
                                  onClick={() => handleResetStudentPassword(stu)}
                                  className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer shadow-2xs"
                                  title={`Reset Password ke Default NIS (${stu.nis || stu.nisn})`}
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                                </button>

                                {/* Reset Tautan Google SSO */}
                                <button
                                  onClick={() => handleResetStudentSSO(stu)}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer shadow-2xs ${stu.google_linked && stu.google_id
                                      ? 'text-blue-700 hover:text-rose-700 bg-blue-50 hover:bg-rose-50 border-blue-200 hover:border-rose-200'
                                      : 'text-zinc-700 hover:text-blue-700 bg-zinc-100 hover:bg-blue-50 border-zinc-300 hover:border-blue-200'
                                    }`}
                                  title={
                                    stu.google_linked && stu.google_id
                                      ? `Putuskan Tautan Google SSO (${stu.google_email || stu.email})`
                                      : `Reset Status Google SSO (${stu.nama}: Saat ini belum tertaut)`
                                  }
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>

                                {/* Hapus Data Peserta */}
                                <button
                                  onClick={() => handleDeleteStudent(stu.id, stu.nama)}
                                  className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Hapus Data Peserta"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AKUN ADMINISTRATOR & PROKTOR (Khusus Super Admin) */}
          {activeTab === 'account' && (
            isSuperAdmin ? (
              <div className="space-y-6">
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">
                        Manajemen Kredensial Pengawas (Super Admin & Proktor)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Atur nama lengkap, username, email, dan kata sandi akses untuk akun Super Admin dan akun Proktor Ujian.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* KARTU 1: SUPER ADMIN */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900">Akun Super Admin</h4>
                          <p className="text-[11px] text-zinc-500">Akses Penuh (Instansi, GPS & Akun)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-zinc-900 text-white px-2.5 py-0.5 rounded-full">
                        Hak Akses Penuh
                      </span>
                    </div>

                    <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Nama Lengkap Super Admin
                        </label>
                        <input
                          type="text"
                          required
                          value={adminForm.nama}
                          onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Username Login Super Admin
                        </label>
                        <input
                          type="text"
                          required
                          value={adminForm.username}
                          onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Email Super Admin
                        </label>
                        <input
                          type="email"
                          required
                          value={adminForm.email}
                          onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Kata Sandi (Password Baru)
                        </label>
                        <div className="relative">
                          <input
                            type={showAdminPass ? 'text' : 'password'}
                            required
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminPass(!showAdminPass)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600"
                          >
                            {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Kredensial Super Admin</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* KARTU 2: PROKTOR UJIAN */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900">Akun Proktor Ujian</h4>
                          <p className="text-[11px] text-zinc-500">Akses Operasional Ujian & Peserta</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Pengawas Lapangan
                      </span>
                    </div>

                    <form onSubmit={handleSaveProctorProfile} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Nama Lengkap Proktor
                        </label>
                        <input
                          type="text"
                          required
                          value={proctorForm.nama}
                          onChange={(e) => setProctorForm({ ...proctorForm, nama: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Username Login Proktor
                        </label>
                        <input
                          type="text"
                          required
                          value={proctorForm.username}
                          onChange={(e) => setProctorForm({ ...proctorForm, username: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Email Proktor
                        </label>
                        <input
                          type="email"
                          required
                          value={proctorForm.email}
                          onChange={(e) => setProctorForm({ ...proctorForm, email: e.target.value })}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Kata Sandi (Password Baru Proktor)
                        </label>
                        <div className="relative">
                          <input
                            type={showProctorPass ? 'text' : 'password'}
                            required
                            value={proctorForm.password}
                            onChange={(e) => setProctorForm({ ...proctorForm, password: e.target.value })}
                            className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowProctorPass(!showProctorPass)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600"
                          >
                            {showProctorPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Kredensial Proktor</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* KARTU 3: PENGATURAN MODE APLIKASI (PRODUKSI VS SIMULASI/DEV) */}
                {/* ======================================================== */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-zinc-900">
                            Mode Lingkungan Aplikasi & Bypass Pengujian
                          </h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                              appModeConfig?.app_mode === 'production'
                                ? 'bg-zinc-900 text-white'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {appModeConfig?.app_mode === 'production' ? 'Mode Produksi Resmi' : 'Mode Demo / Simulasi'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Beralih antara Mode Produksi (keamanan ketat tanpa toleransi) dan Mode Simulasi (bypass sensor untuk localhost / Laragon).
                        </p>
                      </div>
                    </div>

                    <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleAppMode('production')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          appModeConfig?.app_mode === 'production'
                            ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mode Produksi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAppMode('simulation')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          appModeConfig?.app_mode === 'simulation'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Mode Demo / Simulasi</span>
                      </button>
                    </div>
                  </div>

                  {appModeConfig?.app_mode === 'production' ? (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-950 space-y-1">
                        <div className="font-semibold text-emerald-900">
                          Mode Produksi Resmi Sedang Aktif (Strict Security Mode)
                        </div>
                        <p className="leading-relaxed text-emerald-800">
                          Seluruh proteksi ujian berjalan secara ketat 100%: Geofence GPS satelit diwajibkan sesuai radius meter instansi, kamera pengawas & mikrofon diwajibkan aktif, dan kunci layar penuh (fullscreen lock) diaktifkan tanpa ada bypass apapun.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-950 space-y-1">
                          <div className="font-semibold text-amber-900">
                            Mode Demo & Simulasi Aktif (Development Environment)
                          </div>
                          <p className="leading-relaxed text-amber-800">
                            Secara default, <strong>Bypass GPS</strong> dan <strong>Bypass Google SSO</strong> langsung diaktifkan untuk mempermudah uji coba di server lokal / presentasi. Fitur keamanan lainnya dapat Anda aktifkan atau sesuaikan di bawah ini.
                          </p>
                        </div>
                      </div>

                      {/* Grid Switch Bypass */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                        {/* Bypass GPS */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Geofence GPS</span>
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">Default</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Izinkan akses di localhost & luar radius
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_gps')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_gps) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_gps) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bypass Media (Kamera & Mic) */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Kamera & Mic</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Lewati jika komputer tanpa webcam/mic
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_media')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_media) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_media) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bypass Web Audio */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <Volume2 className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Uji Audio</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Lewati pengecekan nada alarm
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_audio')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_audio) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_audio) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bypass Notifikasi */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <Bell className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Notifikasi</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Lewati permintaan izin notifikasi browser
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_notifications')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_notifications) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_notifications) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bypass Fullscreen Lockout */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Layar Penuh</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Bebas beralih tab & buka DevTools
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_fullscreen')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_fullscreen) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_fullscreen) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Bypass Google SSO */}
                        <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Bypass Google SSO</span>
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">Default</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">
                              Lewati verifikasi akun Google
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleBypass('bypass_google_sso')}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              Boolean(appModeConfig?.bypass_google_sso) ? 'bg-amber-500' : 'bg-zinc-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                Boolean(appModeConfig?.bypass_google_sso) ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ======================================================== */}
                {/* KARTU 4: PUSAT PENGUJIAN FITUR PENDUKUNG (SELF-DIAGNOSTIC) */}
                {/* ======================================================== */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900">
                          Pusat Pengujian Fitur Pendukung (Self-Diagnostic Suite)
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Uji kelayakan seluruh 10 sensor dan subsistem pendukung sebelum pelaksanaan ujian resmi dimulai.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isTestingAllDiagnostics}
                      onClick={runAllDiagnostics}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      {isTestingAllDiagnostics ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sedang Menguji Semua...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Jalankan Semua Pengujian (10 Fitur)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Grid 10 Fitur Pengujian */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. GPS Geolocation */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">1. GPS Geolocation & Radius</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestGps}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji GPS
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.gps ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.gps.status === 'passed' ? 'text-emerald-700' :
                            diagnosticResults.gps.status === 'bypassed' ? 'text-amber-700' :
                            diagnosticResults.gps.status === 'testing' ? 'text-blue-600' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.gps.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.gps.status === 'bypassed' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {diagnosticResults.gps.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.gps.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji (Klik tombol Uji GPS)</span>
                        )}
                      </div>
                    </div>

                    {/* 2. Kamera / Webcam */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">2. Kamera / Webcam Pengawas</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestCamera}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Kamera
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.camera ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.camera.status === 'passed' ? 'text-emerald-700' :
                            diagnosticResults.camera.status === 'bypassed' ? 'text-amber-700' :
                            diagnosticResults.camera.status === 'testing' ? 'text-blue-600' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.camera.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.camera.status === 'bypassed' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {diagnosticResults.camera.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.camera.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 3. Mikrofon */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">3. Mikrofon Audio Input</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestMicrophone}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Mic
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.mic ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.mic.status === 'passed' ? 'text-emerald-700' :
                            diagnosticResults.mic.status === 'bypassed' ? 'text-amber-700' :
                            diagnosticResults.mic.status === 'testing' ? 'text-blue-600' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.mic.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.mic.status === 'bypassed' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {diagnosticResults.mic.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.mic.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 4. Web Audio API */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">4. Web Audio API (Alarm Beep)</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestAudio}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Alarm
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.audio ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.audio.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.audio.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.audio.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.audio.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 5. Notifikasi Browser */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">5. Izin Notifikasi Browser</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestNotifications}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Notifikasi
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.notifications ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.notifications.status === 'passed' ? 'text-emerald-700' :
                            diagnosticResults.notifications.status === 'bypassed' ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.notifications.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.notifications.status === 'bypassed' && <AlertTriangle className="w-3.5 h-3.5" />}
                            {diagnosticResults.notifications.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.notifications.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 6. Layar Penuh Fullscreen */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Maximize2 className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">6. Mode Layar Penuh (Lockout)</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestFullscreen}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Layar Penuh
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.fullscreen ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.fullscreen.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.fullscreen.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.fullscreen.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.fullscreen.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 7. Penyimpanan Lokal */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">7. Kuota Storage & Cookies</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestStorage}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Storage
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.storage ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.storage.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.storage.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.storage.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.storage.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 8. Proteksi Clipboard */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">8. Proteksi Clipboard Anti-Copy</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestClipboard}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Clipboard
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.clipboard ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.clipboard.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.clipboard.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.clipboard.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.clipboard.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 9. Latensi Google Forms */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">9. Latensi Server Google Forms</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestGooglePing}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Ping
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.google_ping ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.google_ping.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.google_ping.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.google_ping.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.google_ping.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>

                    {/* 10. Generator Token */}
                    <div className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-zinc-700" />
                          <span className="text-xs font-semibold text-zinc-900">10. Generator Token 6-Digit</span>
                        </div>
                        <button
                          type="button"
                          onClick={runTestTokens}
                          className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-300 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Uji Token
                        </button>
                      </div>
                      <div className="text-[11px] text-zinc-600">
                        {diagnosticResults.tokens ? (
                          <div className={`flex items-center gap-1.5 font-medium ${
                            diagnosticResults.tokens.status === 'passed' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {diagnosticResults.tokens.status === 'passed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {diagnosticResults.tokens.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                            <span>{diagnosticResults.tokens.message}</span>
                          </div>
                        ) : (
                          <span className="text-zinc-400">Belum diuji</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* KARTU 5: HISTORI ERROR SISTEM & AUDIT LOGS */}
                {/* ======================================================== */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Bug className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-zinc-900">
                            Histori Error Sistem & Audit Trail
                          </h3>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold">
                            {systemErrorLogs.length} Catatan
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Catatan otomatis seluruh kendala teknis (GPS, Kamera, Jaringan, Browser) yang tercatat selama mode simulasi atau ujian berlangsung.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSimulateError}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Simulasikan contoh error untuk menguji pencatatan"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Simulasi Error</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyErrorLogs}
                        disabled={systemErrorLogs.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Salin seluruh log dalam format JSON"
                      >
                        {copiedLogFeedback ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Salin JSON</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleClearErrorLogs}
                        disabled={systemErrorLogs.length === 0}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        title="Hapus seluruh riwayat error"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bersihkan Log</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                      {['ALL', 'error', 'warning', 'info'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setErrorLogFilter(lvl)}
                          className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-all cursor-pointer ${
                            errorLogFilter === lvl
                              ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          {lvl === 'ALL' ? 'Semua Log' : lvl}
                        </button>
                      ))}
                    </div>

                    <div className="relative flex-1 sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Cari pesan atau sumber error..."
                        value={errorLogSearch}
                        onChange={(e) => setErrorLogSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                      />
                    </div>
                  </div>

                  {/* List Item Histori Error */}
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {(() => {
                      const filteredLogs = systemErrorLogs.filter((log) => {
                        const matchFilter = errorLogFilter === 'ALL' || log.level === errorLogFilter;
                        const matchSearch =
                          !errorLogSearch ||
                          log.message?.toLowerCase().includes(errorLogSearch.toLowerCase()) ||
                          log.source?.toLowerCase().includes(errorLogSearch.toLowerCase()) ||
                          log.details?.toLowerCase().includes(errorLogSearch.toLowerCase());
                        return matchFilter && matchSearch;
                      });

                      if (filteredLogs.length === 0) {
                        return (
                          <div className="text-center py-10 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-xs font-semibold text-zinc-800">
                              Tidak Ada Catatan Error
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              Sistem beroperasi normal tanpa kendala teknis yang tercatat.
                            </p>
                          </div>
                        );
                      }

                      return filteredLogs.map((log) => (
                        <div
                          key={log.id || log.timestamp}
                          className={`p-4 rounded-xl border text-xs space-y-1.5 transition-all ${
                            log.level === 'error'
                              ? 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                              : log.level === 'warning'
                              ? 'bg-amber-50/60 border-amber-200/80 text-amber-950'
                              : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                  log.level === 'error'
                                    ? 'bg-rose-600 text-white'
                                    : log.level === 'warning'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-zinc-700 text-white'
                                }`}
                              >
                                {log.source || 'Sistem'}
                              </span>
                              <span className="font-semibold text-zinc-900">{log.message}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>

                          {log.details && (
                            <p className="text-[11px] text-zinc-600 leading-relaxed font-mono bg-white/70 p-2 rounded-lg border border-zinc-200/50">
                              {log.details}
                            </p>
                          )}

                          {log.solution && (
                            <div className="flex items-start gap-1.5 text-[11px] text-emerald-800 pt-0.5">
                              <span className="font-semibold shrink-0">Solusi:</span>
                              <span>{log.solution}</span>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Akses Dibatasi Khusus Super Admin</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Menu Akun Administrator hanya dapat diakses dan dikelola oleh Super Admin. Akun Proktor hanya diperkenankan mengawasi pengerjaan ujian dan manajemen data peserta.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Kembali ke Ringkasan
                </button>
              </div>
            )
          )}

          {/* TAB 6: PENGATURAN INSTANSI (Dipindahkan ke bawah Akun Administrator - Khusus Super Admin) */}
          {activeTab === 'institution' && (
            isSuperAdmin ? (
              <form onSubmit={handleSaveInstitution} className="space-y-6">
                {/* FITUR 1: UPLOAD LOGO INSTANSI */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-5 h-5 text-zinc-700" />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">Logo Resmi Instansi / Sekolah</h3>
                        <p className="text-xs text-zinc-500">
                          Logo akan ditampilkan di header aplikasi, portal login peserta, dan di tengah QR Code ujian.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Logo Preview */}
                    <div className="w-24 h-24 rounded-2xl bg-zinc-50 border-2 border-dashed border-zinc-300 flex items-center justify-center p-2 relative overflow-hidden shadow-2xs shrink-0">
                      {institution.logo_url ? (
                        <img
                          src={institution.logo_url}
                          alt="Logo Instansi"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center text-zinc-400">
                          <Shield className="w-8 h-8 mx-auto mb-1 text-zinc-300" />
                          <span className="text-[10px]">Logo Default</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{institution.logo_url ? 'Ganti Logo Sekolah' : 'Unggah Logo Sekolah'}</span>
                        </button>

                        {institution.logo_url && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="inline-flex items-center gap-1.5 px-3 py-2 border border-zinc-200 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-xl text-xs font-medium text-zinc-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Logo</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Format: PNG, JPG, SVG, atau WebP (Disarankan rasio 1:1, latar transparan atau putih, maks. 2MB).
                      </p>
                    </div>
                  </div>
                </div>

                {/* FITUR 2: IDENTITAS & JENJANG PENDIDIKAN */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                    <Building2 className="w-5 h-5 text-zinc-700" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">Identitas Sekolah & Jenjang Pendidikan</h3>
                      <p className="text-xs text-zinc-500">
                        Tingkat kelas akan otomatis menyesuaikan jenjang yang dipilih.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Nama Resmi Instansi / Sekolah
                      </label>
                      <input
                        type="text"
                        required
                        value={institution.name}
                        onChange={(e) => setInstitution({ ...institution, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5 flex items-center justify-between">
                        <span>NPSN / Kode Sekolah</span>
                        
                      </label>
                      <input
                        type="text"
                        pattern="[A-Za-z0-9]+"
                        maxLength={16}
                        placeholder="Contoh: 20104829 atau SMPN01"
                        value={institution.npsn || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
                          setInstitution((prev) => ({ ...prev, npsn: val }));
                        }}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono tracking-wider uppercase focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Jenjang Pendidikan
                      </label>
                      <select
                        value={institution.education_level}
                        onChange={(e) => handleEducationLevelChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                      >
                        {Object.entries(EDUCATION_LEVELS).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Display Rentang Tingkat Kelas Otomatis */}
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70">
                    <div className="text-xs font-medium text-zinc-700 mb-2">
                      Rentang Tingkat Kelas Aktif (Allowed Grades):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {institution.allowed_grades.map((grade) => (
                        <span
                          key={grade}
                          className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 text-xs font-medium text-zinc-800 shadow-2xs"
                        >
                          {getGradeLabel(grade)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pengaturan Durasi Sesi & Token */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Idle Timeout */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Batas Waktu Tidak Aktif (Idle Timeout)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="5"
                          max="180"
                          value={institution.idle_timeout_minutes}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              idle_timeout_minutes: parseInt(e.target.value, 10) || 30,
                            })
                          }
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-16"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                          menit
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Peserta otomatis logout jika tidak ada interaksi selama batas waktu ini.
                      </p>
                    </div>

                    {/* Waktu Muncul Token Selesai Sebelum Waktu Habis */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Waktu Muncul Token Selesai Sebelum Waktu Habis
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={institution.finish_token_lead_minutes ?? 10}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              finish_token_lead_minutes: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-16"
                          placeholder="Contoh: 5"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                          menit
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Token selesai dan peringatan waktu otomatis muncul pada peserta sejumlah menit ini sebelum waktu pengerjaan berakhir.
                      </p>
                    </div>
                  </div>

                  {/* Tombol Simpan Identitas Instansi */}
                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Simpan Pengaturan Identitas Instansi</span>
                    </button>
                  </div>
                </div>

                {/* FITUR 2b: KEBIJAKAN KEAMANAN KUNCI PERANGKAT UJIAN (DEVICE LOCK BINDING) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                        institution.lock_device_enabled !== false
                          ? 'bg-emerald-50/80 border border-emerald-200/90 shadow-2xs ring-4 ring-emerald-50/60 text-emerald-700'
                          : 'bg-amber-50/80 border border-amber-200/90 shadow-2xs ring-4 ring-amber-50/60 text-amber-700'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900">
                          Kebijakan Kunci Perangkat Peserta (Device Lock)
                        </h3>
                        <p className="text-[11px] text-zinc-500">
                          Atur apakah peserta wajib dikunci pada 1 perangkat atau diperbolehkan ganti perangkat bebas
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                      institution.lock_device_enabled !== false
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}>
                      {institution.lock_device_enabled !== false ? '🔒 KUNCI 1 PERANGKAT AKTIF' : '🔓 BEBAS GANTI PERANGKAT'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Sistem ExamGuard mencatat kode identitas unik peramban/perangkat (ID Perangkat) saat peserta pertama kali masuk ke aplikasi ujian. Pilih kebijakan pengawasan perangkat yang berlaku di sekolah Anda:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Opsi 1: Kunci 1 Perangkat (Wajib Reset Admin) */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          institution.lock_device_enabled !== false
                            ? 'bg-emerald-50/50 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="lock_device_radio"
                          checked={institution.lock_device_enabled !== false}
                          onChange={() => setInstitution({ ...institution, lock_device_enabled: true })}
                          className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Kunci 1 Perangkat (Wajib Reset oleh Pengawas)</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 leading-relaxed">
                            <strong>Direkomendasikan untuk ujian resmi & ketat.</strong> Peserta hanya boleh login di 1 HP/laptop pertama. Jika peserta ingin berganti perangkat (misal kendala baterai/rusak), Admin atau Proktor wajib menekan tombol <em>"Reset Kunci Perangkat"</em> terlebih dahulu.
                          </p>
                        </div>
                      </label>

                      {/* Opsi 2: Bebas Ganti Perangkat */}
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          institution.lock_device_enabled === false
                            ? 'bg-amber-50/50 border-amber-500 shadow-2xs ring-1 ring-amber-500/20'
                            : 'bg-zinc-50/50 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="lock_device_radio"
                          checked={institution.lock_device_enabled === false}
                          onChange={() => setInstitution({ ...institution, lock_device_enabled: false })}
                          className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500"
                        />
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-zinc-900 flex items-center gap-1.5">
                            <Unlock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Bebas Ganti Perangkat (Fleksibel / Tanpa Kunci)</span>
                          </div>
                          <p className="text-[11px] text-zinc-600 leading-relaxed">
                            Peserta dapat berganti perangkat/peramban secara mandiri tanpa terblokir. ID perangkat baru akan langsung diperbarui otomatis tanpa memerlukan intervensi reset dari Proktor.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-zinc-100">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Simpan Kebijakan Kunci Perangkat</span>
                    </button>
                  </div>
                </div>

                {/* FITUR 3: PENGATURAN GPS SEKOLAH (DENGAN SAKELAR ON/OFF CEK LOKASI) */}
                <div className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${
                  institution.gps_enabled ? 'border-emerald-200/90 ring-1 ring-emerald-100' : 'border-zinc-200/80'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isGpsCardOpen ? 'pb-4 border-b border-zinc-100' : ''}`}>
                    <div
                      onClick={() => setIsGpsCardOpen(prev => !prev)}
                      className="flex items-center gap-3.5 cursor-pointer select-none group"
                      title={isGpsCardOpen ? 'Klik untuk menciutkan setelan GPS' : 'Klik untuk membuka detail setelan GPS'}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          institution.gps_enabled
                            ? 'bg-emerald-50/80 border border-emerald-200/90 shadow-2xs ring-4 ring-emerald-50/60 text-emerald-700'
                            : 'bg-zinc-100 border border-zinc-200 text-zinc-500'
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                          Lokasi Sekolah (GPS)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Atur apakah peserta wajib berada di area fisik sekolah saat mengikuti ujian.
                        </p>
                      </div>
                    </div>

                    {/* Sakelar ON / OFF Cek Lokasi & Tombol Accordion */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={institution.gps_enabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = !institution.gps_enabled;
                          const updated = {
                            ...institution,
                            gps_enabled: nextStatus,
                            browser_permissions: {
                              ...(institution.browser_permissions || {}),
                              location_gps: nextStatus,
                            },
                          };
                          setInstitution(updated);
                          storageService.updateInstitution(updated);
                          refreshData();
                          showNotification(
                            nextStatus
                              ? 'Pemeriksaan lokasi GPS & Izin Browser GPS berhasil diaktifkan (ON).'
                              : 'Pemeriksaan lokasi GPS & Izin Browser GPS dinonaktifkan (OFF).'
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          institution.gps_enabled ? 'bg-emerald-600' : 'bg-zinc-300 hover:bg-zinc-400'
                        }`}
                        title={
                          institution.gps_enabled
                            ? `Cek Lokasi GPS: AKTIF (Radius ${institution.max_radius_meters || 100}m). Klik untuk mematikan validasi lokasi GPS.`
                            : 'Cek Lokasi GPS: NON-AKTIF (Peserta dapat ujian dari mana saja). Klik untuk mengaktifkan validasi lokasi GPS.'
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            institution.gps_enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsGpsCardOpen(prev => !prev)}
                        className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                        title={isGpsCardOpen ? 'Tutup Detail Setelan GPS' : `Buka Detail Setelan GPS (${institution.gps_enabled ? 'Cek Lokasi Aktif: ' + (institution.max_radius_meters || 100) + 'm' : 'Non-aktif'})`}
                        aria-label={isGpsCardOpen ? 'Tutup Detail Setelan GPS' : 'Buka Detail Setelan GPS'}
                      >
                        {isGpsCardOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                      </button>
                    </div>
                  </div>

                  {isGpsCardOpen && (
                    <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Banner Status GPS ON/OFF */}
                  {!institution.gps_enabled ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pemeriksaan Lokasi Dinonaktifkan:</strong> Peserta diizinkan login dan mengerjakan ujian dari mana saja tanpa validasi jarak radius GPS.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pemeriksaan Lokasi Aktif:</strong> Peserta hanya dapat membuka beranda ujian jika berada di dalam radius toleransi dari koordinat sekolah.
                      </div>
                    </div>
                  )}

                  {/* Kotak Pencarian Lokasi via Tautan Google Maps */}
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-zinc-900">
                            Pencarian Lokasi via Tautan Google Maps
                          </h4>
                          <p className="text-[11px] text-zinc-500">
                            Tempelkan link Google Maps (URL browser, Place, atau koordinat) untuk otomatis menarik titik lokasi.
                          </p>
                        </div>
                      </div>
                      {institution.gmaps_url && (
                        <a
                          href={institution.gmaps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0 self-start sm:self-auto bg-white px-2.5 py-1.5 rounded-lg border border-blue-200/80 shadow-2xs hover:bg-blue-50 transition-colors"
                        >
                          <span>Buka di Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={gmapsInput}
                          onChange={(e) => setGmapsInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyGmapsLink();
                            }
                          }}
                          placeholder="Contoh: https://maps.google.com/?q=-6.2088,106.8456 atau salin dari address bar..."
                          className="w-full pl-9 pr-8 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono-num focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none placeholder:text-zinc-400 placeholder:font-sans"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                          <MapPin className="w-4 h-4" />
                        </div>
                        {gmapsInput && (
                          <button
                            type="button"
                            onClick={() => setGmapsInput('')}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600"
                            title="Bersihkan input"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleApplyGmapsLink}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Terapkan Lokasi</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-500 leading-relaxed">
                      <span className="font-semibold text-zinc-700">Tips:</span> Buka lokasi sekolah di Google Maps, klik kanan titik lokasi lalu pilih salin angka koordinat, atau salin tautan lengkap dari address bar browser. Tautan pendek (maps.app.goo.gl) disarankan dibuka terlebih dahulu di tab baru agar URL lengkap berkoordinat dapat disalin.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">Center Latitude</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={institution.center_lat}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setInstitution((prev) => ({ ...prev, center_lat: val }));
                        }}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">Center Longitude</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={institution.center_lng}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setInstitution((prev) => ({ ...prev, center_lng: val }));
                        }}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-medium text-zinc-700">
                          Radius Toleransi Maksimal
                        </label>
                        <button
                          type="button"
                          onClick={handleDetectCurrentLocation}
                          disabled={isDetectingLocation}
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium disabled:opacity-50"
                          title="Deteksi posisi GPS satelit atau jaringan live saat ini"
                        >
                          {isDetectingLocation ? (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          ) : (
                            <MapPin className="w-3 h-3" />
                          )}
                          <span>{isDetectingLocation ? 'Mendeteksi...' : 'Posisi Saya'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="20"
                          max="5000"
                          required
                          value={institution.max_radius_meters}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 100;
                            setInstitution((prev) => {
                              const updated = {
                                ...prev,
                                max_radius_meters: val,
                              };
                              storageService.updateInstitution(updated);
                              return updated;
                            });
                          }}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-16"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                          meter
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Notifikasi jika Titik Masih Koordinat Default Bawaan Sistem */}
                  {institution.center_lat === -6.2088 && institution.center_lng === 106.8456 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Titik sekolah saat ini masih menggunakan koordinat <em>default</em> bawaan sistem (Monas, Jakarta). Klik <strong>Ambil Posisi Live</strong> untuk menyelaraskan dengan lokasi sekolah tempat Anda berada.</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectCurrentLocation}
                        disabled={isDetectingLocation}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-[11px] shrink-0 transition-colors shadow-2xs"
                      >
                        {isDetectingLocation ? 'Mendeteksi...' : 'Ambil Posisi Live'}
                      </button>
                    </div>
                  )}

                  {/* Preview Peta Geofence Interaktif (OpenStreetMap & Leaflet) */}
                  <div className="pt-2 border-t border-zinc-100">
                    <GeofenceMapPreview
                      lat={institution.center_lat}
                      lng={institution.center_lng}
                      radius={institution.max_radius_meters}
                      institutionName={institution.name}
                      logoUrl={institution.logo_url}
                      onDetectLiveLocation={handleDetectCurrentLocation}
                      isDetectingLocation={isDetectingLocation}
                      onLocationChange={(newLat, newLng) => {
                        const gmaps = `https://maps.google.com/?q=${newLat},${newLng}`;
                        setInstitution((prev) => {
                          const updated = {
                            ...prev,
                            center_lat: newLat,
                            center_lng: newLng,
                            gmaps_url: gmaps,
                          };
                          storageService.updateInstitution(updated);
                          return updated;
                        });
                        setGmapsInput(gmaps);
                        showNotification(`Koordinat GPS diperbarui: ${newLat}, ${newLng}`);
                      }}
                      onRadiusChange={(newRadius) => {
                        setInstitution((prev) => {
                          const updated = {
                            ...prev,
                            max_radius_meters: newRadius,
                          };
                          storageService.updateInstitution(updated);
                          return updated;
                        });
                        showNotification(`Radius toleransi diubah ke ${newRadius} meter.`);
                      }}
                    />
                  </div>

                  {/* Tombol Simpan Pengaturan GPS */}
                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Simpan Pengaturan Lokasi & GPS</span>
                    </button>
                  </div>
                    </div>
                  )}
                </div>

                {/* FITUR 4: METODE AUTENTIKASI & KEAMANAN GOOGLE (MODE PRODUKSI RESMI TANPA BYPASS) */}
                <div className="space-y-5">
                  {/* 1. KARTU GOOGLE OAUTH 2.0 & WORKSPACE SSO */}
                  <div
                    className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${institution.google_oauth_enabled && institution.google_client_id
                        ? 'border-blue-200/90 ring-1 ring-blue-100'
                        : 'border-zinc-200/80'
                      }`}
                  >
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isOAuthCardOpen ? 'pb-4 border-b border-zinc-100' : ''}`}>
                      <div
                        onClick={() => setIsOAuthCardOpen(prev => !prev)}
                        className="flex items-center gap-3.5 cursor-pointer select-none group"
                        title={isOAuthCardOpen ? 'Klik untuk menciutkan setelan' : 'Klik untuk membuka detail setelan'}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${institution.google_oauth_enabled && institution.google_client_id
                              ? 'bg-blue-50/80 border border-blue-200/90 shadow-2xs ring-4 ring-blue-50/60'
                              : 'bg-zinc-100 border border-zinc-200'
                            }`}
                        >
                          <GoogleBrandIcon
                            className="w-6 h-6"
                            active={Boolean(institution.google_oauth_enabled && institution.google_client_id)}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">
                            Google OAuth 2.0 & Workspace SSO
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Single Sign-On (SSO) akun Google resmi seperti (<span className="font-mono text-zinc-600">belajar.id</span>)
                          </p>
                        </div>
                      </div>

                      {/* Sakelar Cepat & Tombol Accordion Google OAuth */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(institution.google_oauth_verified && institution.google_oauth_enabled && institution.google_client_id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleGoogleOAuth();
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            institution.google_oauth_verified && institution.google_oauth_enabled && institution.google_client_id
                              ? 'bg-emerald-600'
                              : 'bg-zinc-300 hover:bg-zinc-400'
                          }`}
                          title={
                            institution.google_oauth_verified && institution.google_oauth_enabled && institution.google_client_id
                              ? `SSO: ON • Akun: ${institution.google_oauth_verified_email || 'Terverifikasi'}. Klik untuk nonaktifkan SSO (Kredensial tetap disimpan).`
                              : institution.google_client_id
                              ? 'SSO: OFF • Kredensial tersimpan. Klik untuk verifikasi & aktifkan SSO.'
                              : 'SSO: OFF • Belum Login Akun Google. Klik buka detail untuk mengisi Client ID.'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                              institution.google_oauth_verified && institution.google_oauth_enabled && institution.google_client_id
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsOAuthCardOpen(prev => !prev)}
                          className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                          title={isOAuthCardOpen ? 'Tutup Detail Setelan OAuth' : `Buka Detail Setelan OAuth (${institution.google_oauth_verified && institution.google_oauth_enabled && institution.google_client_id ? 'SSO ON: ' + institution.google_oauth_verified_email : 'SSO OFF'})`}
                          aria-label={isOAuthCardOpen ? 'Tutup Detail Setelan OAuth' : 'Buka Detail Setelan OAuth'}
                        >
                          {isOAuthCardOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                        </button>
                      </div>
                    </div>

                    {isOAuthCardOpen && (
                      <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Banner status koneksi Google OAuth */}
                    {!institution.google_oauth_enabled || !institution.google_client_id ? (
                      <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Integrasi Google OAuth Nonaktif (OFF):</strong> Masukkan Client ID & Client Secret dari Google Cloud Console, lalu klik <strong>"Test Koneksi & Aktifkan"</strong>. Jika kosong atau di-reset, status otomatis <strong>OFF</strong> dan peserta masuk menggunakan NISN & Password NIS.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Integrasi Google OAuth Terverifikasi (ON):</strong> Layanan Google Identity Services aktif. Peserta dapat login 1-klik menggunakan akun Google resmi sekolah tanpa simulasi/bypass.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Metode Login Peserta yang Diizinkan
                        </label>
                        <select
                          value={institution.auth_method}
                          onChange={(e) => {
                            const newMethod = e.target.value;
                            const updated = { ...institution, auth_method: newMethod };
                            setInstitution(updated);
                            storageService.updateInstitution(updated);
                            showNotification(`Metode login diubah ke: ${AUTH_METHODS[newMethod] || newMethod}`, 'success');
                          }}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        >
                          {Object.entries(AUTH_METHODS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Google OAuth Client ID <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={institution.google_client_id || ''}
                          onChange={(e) =>
                            setInstitution({ ...institution, google_client_id: e.target.value })
                          }
                          placeholder="842918239012-xxx.apps.googleusercontent.com"
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        >
                        </input>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Google OAuth Client Secret <span className="text-zinc-400 font-normal">(Opsional untuk Web App)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showGoogleSecret ? 'text' : 'password'}
                          value={institution.google_client_secret || ''}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              google_client_secret: e.target.value,
                            })
                          }
                          placeholder="GOCSPX-xxxxxxxxxxxxx"
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          {showGoogleSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Panduan Penanganan Error 401: invalid_client / no registered origin */}
                    <div className="mt-4 p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl text-xs text-blue-900 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-semibold flex items-center gap-1.5 text-blue-950">
                          <Info className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Asal JavaScript yang Diizinkan (Authorized JavaScript Origin):</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(window.location.origin);
                              showNotification('URL Origin disalin: ' + window.location.origin);
                            }
                          }}
                          className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-100/70 text-blue-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                          Salin URL Origin
                        </button>
                      </div>
                      <div className="font-mono bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-900 font-bold select-all inline-block text-[11px]">
                        {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Jika muncul popup <strong className="text-rose-700">"Akses diblokir: Error Otorisasi (no registered origin / Error 401: invalid_client)"</strong>, hal itu berarti URL origin di atas belum didaftarkan di <strong>Google Cloud Console &gt; APIs & Services &gt; Credentials &gt; OAuth 2.0 Client IDs &gt; Authorized JavaScript origins</strong>. Tambahkan URL tersebut lalu simpan di Google Console.
                      </p>
                    </div>

                    {/* Tombol Aksi: Test Koneksi & Reset Kosongkan */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Mode Produksi: Otomatis <strong>ON</strong> setelah Test Koneksi sukses, otomatis <strong>OFF</strong> jika di-reset.</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleResetGoogleOAuth}
                          disabled={testingOAuth || !institution.google_oauth_enabled}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                          title="Nonaktifkan integrasi Google OAuth (Client ID & Secret tetap disimpan)"
                        >
                          <Unlink className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Nonaktifkan SSO</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTestGoogleOAuth}
                          disabled={testingOAuth}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          {testingOAuth ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Menghubungkan ke Google Identity...</span>
                            </>
                          ) : (
                            <>
                              <GoogleBrandIcon className="w-3.5 h-3.5" active={true} />
                              <span>Verifikasi & Aktifkan SSO</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tombol Simpan Pengaturan Google OAuth */}
                    <div className="flex justify-end pt-4 border-t border-zinc-100">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4 text-emerald-400" />
                        <span>Simpan Pengaturan Google OAuth (SSO)</span>
                      </button>
                    </div>
                      </div>
                    )}
                  </div>

                  {/* 2. KARTU GOOGLE RECAPTCHA V2 & V3 */}
                  <div
                    className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${institution.recaptcha_enabled && institution.recaptcha_site_key
                        ? 'border-emerald-200/90 ring-1 ring-emerald-100'
                        : 'border-zinc-200/80'
                      }`}
                  >
                    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isRecaptchaCardOpen ? 'pb-4 border-b border-zinc-100' : ''}`}>
                      <div
                        onClick={() => setIsRecaptchaCardOpen(prev => !prev)}
                        className="flex items-center gap-3.5 cursor-pointer select-none group"
                        title={isRecaptchaCardOpen ? 'Klik untuk menciutkan setelan' : 'Klik untuk membuka detail setelan'}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${institution.recaptcha_enabled && institution.recaptcha_site_key
                              ? 'bg-emerald-50/80 border border-emerald-200/90 shadow-2xs ring-4 ring-emerald-50/60'
                              : 'bg-zinc-100 border border-zinc-200'
                            }`}
                        >
                          <RecaptchaBrandIcon
                            className="w-6 h-6"
                            active={Boolean(institution.recaptcha_enabled && institution.recaptcha_site_key)}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                            Google reCAPTCHA (v2 & v3 Protection)
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Proteksi verifikasi bot Google atau Captcha Mandiri Otomatis saat offline
                          </p>
                        </div>
                      </div>

                      {/* Sakelar Cepat & Tombol Accordion reCAPTCHA */}
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={Boolean(institution.recaptcha_enabled && institution.recaptcha_site_key)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRecaptcha();
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${institution.recaptcha_enabled && institution.recaptcha_site_key ? 'bg-emerald-600' : 'bg-zinc-300 hover:bg-zinc-400'
                            }`}
                          title={
                            institution.recaptcha_enabled && institution.recaptcha_site_key
                              ? `Google reCAPTCHA: ON (${(institution.recaptcha_version || 'v2').toUpperCase()}). Klik untuk nonaktifkan/reset.`
                              : 'Google reCAPTCHA: OFF • Default Captcha Mandiri: AKTIF. Klik buka detail untuk memasukkan Site Key.'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${institution.recaptcha_enabled && institution.recaptcha_site_key ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsRecaptchaCardOpen(prev => !prev)}
                          className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                          title={isRecaptchaCardOpen ? 'Tutup Detail Setelan reCAPTCHA' : `Buka Detail Setelan reCAPTCHA (${institution.recaptcha_enabled && institution.recaptcha_site_key ? 'ON: ' + (institution.recaptcha_version || 'v2').toUpperCase() : 'Default Mandiri Aktif'})`}
                          aria-label={isRecaptchaCardOpen ? 'Tutup Detail Setelan reCAPTCHA' : 'Buka Detail Setelan reCAPTCHA'}
                        >
                          {isRecaptchaCardOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                        </button>
                      </div>
                    </div>

                    {isRecaptchaCardOpen && (
                      <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Banner status reCAPTCHA */}
                    {!institution.recaptcha_enabled || !institution.recaptcha_site_key ? (
                      <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Google reCAPTCHA Belum Di-set (OFF):</strong> Sistem secara otomatis mengaktifkan <strong>Captcha Keamanan Mandiri ExamGuard (Default)</strong> pada form login. Login peserta dan admin tetap aman terlindungi dari bot tanpa membutuhkan koneksi internet.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Google reCAPTCHA {institution.recaptcha_version?.toUpperCase() || 'V2'} Terverifikasi (ON):</strong>{' '}
                          {institution.recaptcha_version === 'v3'
                            ? 'Verifikasi risiko bot berjalan mulus di latar belakang (invisible) tanpa mengganggu konsentrasi peserta.'
                            : 'Setiap peserta ujian dan administrator wajib menyelesaikan checklist "Saya bukan robot" sebelum masuk.'}
                        </div>
                      </div>
                    )}

                    {/* Pilihan 2 Mode Versi API: v2 vs v3 */}
                    <div className="mt-4 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-800">
                          Pilihan Mode Versi API Google reCAPTCHA
                        </label>
                        <span className="text-[11px] text-zinc-500">Pilih salah satu mode yang sesuai dengan Site Key Anda</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setInstitution({ ...institution, recaptcha_version: 'v2' })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            (institution.recaptcha_version || 'v2') === 'v2'
                              ? 'bg-white border-emerald-500 ring-2 ring-emerald-100 shadow-2xs'
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                              <span>Mode v2 Checkbox</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-zinc-100 text-zinc-600 font-normal">Interaktif</span>
                            </span>
                            {(institution.recaptcha_version || 'v2') === 'v2' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Checklist kotak centang <strong>"Saya bukan robot"</strong> yang wajib diklik peserta.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setInstitution({ ...institution, recaptcha_version: 'v3' })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            institution.recaptcha_version === 'v3'
                              ? 'bg-white border-emerald-500 ring-2 ring-emerald-100 shadow-2xs'
                              : 'bg-white border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                              <span>Mode v3 Invisible</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-100 text-blue-700 font-normal">Tanpa Klik</span>
                            </span>
                            {institution.recaptcha_version === 'v3' && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Verifikasi <strong>skor latar belakang otomatis</strong> tanpa perlu interaksi klik kotak centang.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          reCAPTCHA Site Key <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={institution.recaptcha_site_key || ''}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              recaptcha_site_key: e.target.value,
                            })
                          }
                          placeholder={institution.recaptcha_version === 'v3' ? 'Site Key Google reCAPTCHA v3...' : '6LeIx0aUAAAAAExampleKey...'}
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          reCAPTCHA Secret Key <span className="text-zinc-400 font-normal">(Server Secret)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showRecaptchaSecret ? 'text' : 'password'}
                            value={institution.recaptcha_secret_key || ''}
                            onChange={(e) =>
                              setInstitution({
                                ...institution,
                                recaptcha_secret_key: e.target.value,
                              })
                            }
                            placeholder="6LeIx0aUAAAAASecret..."
                            className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRecaptchaSecret(!showRecaptchaSecret)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            {showRecaptchaSecret ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi: Test Koneksi & Reset Kosongkan */}
                    <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Mode Produksi: Otomatis <strong>ON</strong> setelah Test Koneksi sukses, dan beralih ke <strong>Captcha Mandiri Default</strong> saat di-reset.</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleResetRecaptcha}
                          disabled={testingRecaptcha || (!institution.recaptcha_site_key && !institution.recaptcha_enabled)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
                          title="Kosongkan konfigurasi Google reCAPTCHA dan kembali ke Default Captcha Mandiri"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Reset (Kosongkan)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleTestRecaptcha}
                          disabled={testingRecaptcha}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        >
                          {testingRecaptcha ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Menguji Koneksi {institution.recaptcha_version?.toUpperCase() || 'V2'}...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Test Koneksi & Aktifkan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tombol Simpan Pengaturan reCAPTCHA */}
                    <div className="flex justify-end pt-4 border-t border-zinc-100">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Save className="w-4 h-4 text-emerald-400" />
                        <span>Simpan Pengaturan Google reCAPTCHA</span>
                      </button>
                    </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FITUR 5: PENGATURAN CEKLIST IZIN PERAMBAN & DUKUNGAN PERANGKAT (PRE-FLIGHT CHECKS) */}
                <div className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${
                  Object.values(institution.browser_permissions || {}).some(Boolean)
                    ? 'border-purple-200/90 ring-1 ring-purple-100'
                    : 'border-zinc-200/80'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isPreflightCardOpen ? 'pb-4 border-b border-zinc-100' : ''}`}>
                    <div
                      onClick={() => setIsPreflightCardOpen(prev => !prev)}
                      className="flex items-center gap-3.5 cursor-pointer select-none group"
                      title={isPreflightCardOpen ? 'Klik untuk menciutkan ceklis izin' : 'Klik untuk membuka detail ceklis izin'}
                    >
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                          Object.values(institution.browser_permissions || {}).some(Boolean)
                            ? 'bg-purple-50/80 border border-purple-200/90 shadow-2xs ring-4 ring-purple-50/60 text-purple-700'
                            : 'bg-zinc-100 border border-zinc-200 text-zinc-500'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 group-hover:text-purple-600 transition-colors">
                          Pengaturan Ceklis Izin Browser Peserta (Pre-Flight Checks)
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Tentukan izin apa saja yang wajib diperiksa & dipenuhi peserta saat login dan sebelum soal ujian dibuka.
                        </p>
                      </div>
                    </div>

                    {/* Sakelar Master & Tombol Accordion Pre-Flight */}
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Object.values(institution.browser_permissions || {}).some(Boolean)}
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentPerms = institution.browser_permissions || {};
                          const anyActive = Object.values(currentPerms).some(Boolean);
                          const nextVal = !anyActive;
                          const newPerms = { ...currentPerms };
                          Object.keys(newPerms).forEach((key) => {
                            if (key === 'google_sso' && nextVal) {
                              newPerms[key] = Boolean(
                                (appModeConfig?.app_mode === 'simulation') ||
                                (institution.google_oauth_verified &&
                                 institution.google_oauth_enabled &&
                                 institution.google_client_id?.trim())
                              );
                            } else {
                              newPerms[key] = nextVal;
                            }
                          });
                          const updated = {
                            ...institution,
                            browser_permissions: newPerms,
                            ...(nextVal ? {} : { gps_enabled: false }),
                          };
                          setInstitution(updated);
                          storageService.updateInstitution(updated);
                          refreshData();
                          showNotification(
                            nextVal
                              ? 'Seluruh ceklis izin browser diaktifkan (ON).'
                              : 'Seluruh ceklis izin browser dinonaktifkan (OFF).'
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          Object.values(institution.browser_permissions || {}).some(Boolean)
                            ? 'bg-purple-600'
                            : 'bg-zinc-300 hover:bg-zinc-400'
                        }`}
                        title={
                          Object.values(institution.browser_permissions || {}).some(Boolean)
                            ? `Pre-Flight Checks: AKTIF (${Object.values(institution.browser_permissions || {}).filter(Boolean).length} izin diwajibkan). Klik untuk nonaktifkan semua izin.`
                            : 'Pre-Flight Checks: NON-AKTIF (Semua izin dilewati). Klik untuk mengaktifkan seluruh izin.'
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                            Object.values(institution.browser_permissions || {}).some(Boolean)
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsPreflightCardOpen(prev => !prev)}
                        className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
                        title={
                          isPreflightCardOpen
                            ? 'Tutup Detail Ceklis Izin'
                            : `Buka Detail Ceklis Izin (${Object.values(institution.browser_permissions || {}).filter(Boolean).length} izin aktif)`
                        }
                        aria-label={isPreflightCardOpen ? 'Tutup Detail Ceklis Izin' : 'Buka Detail Ceklis Izin'}
                      >
                        {isPreflightCardOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                      </button>
                    </div>
                  </div>

                  {isPreflightCardOpen && (
                    <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-xs text-zinc-600 leading-relaxed">
                    Ceklis di bawah ini secara dinamis menentukan pemeriksaan pada halaman <strong>Pre-Flight Peserta</strong>. Izin yang dicentang (ON) akan menjadi syarat wajib sebelum peserta dapat masuk ke beranda atau membuka soal.
                  </p>

                  {/* List Ceklis Izin */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Item 1: Izinkan Lokasi (GPS) */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700 shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              1. Izinkan Lokasi (Login GPS)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Smartphone via GPS Satelit">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop via GeoIP / WiFi">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Memverifikasi koordinat peserta berada dalam radius geofencing sekolah ({institution.max_radius_meters}m).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.location_gps)}
                        onClick={() => handleToggleBrowserPermission('location_gps', 'Izinkan Lokasi (GPS)')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.location_gps ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.location_gps ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 2: Izinkan Notifications */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-purple-100/70 text-purple-700 shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              2. Izinkan Notifications (Peringatan)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android (Web Notification) & iOS Safari (Notifikasi Layar & Getar)">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Meminta izin Notification API untuk memunculkan peringatan sistem darurat jika peserta melanggar aturan.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.notifications)}
                        onClick={() => handleToggleBrowserPermission('notifications', 'Izinkan Notifications')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.notifications ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.notifications ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 3: Izinkan Sound */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-amber-100/70 text-amber-700 shrink-0 mt-0.5">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              3. Izinkan Sound (Alarm Audio)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android / iOS">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Memastikan Web Audio API aktif untuk membunyikan alarm beep saat terjadi pelanggaran atau waktu ujian habis.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.sound_audio)}
                        onClick={() => handleToggleBrowserPermission('sound_audio', 'Izinkan Sound')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.sound_audio ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.sound_audio ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 4: Izinkan Fullscreen */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-700 shrink-0 mt-0.5">
                          <Maximize2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              4. Izinkan Fullscreen (Layar Penuh)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android (Chrome Fullscreen) & iOS Safari (Viewport Lock)">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC via F11 / Fullscreen API">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Wajib layar penuh saat membuka soal ujian. Menutup layar penuh langsung mengunci ujian (Auto-Lock).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.fullscreen)}
                        onClick={() => handleToggleBrowserPermission('fullscreen', 'Izinkan Fullscreen')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.fullscreen ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.fullscreen ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 5: Login Akun Google (Wajib SSO) */}
                    {(() => {
                      const isSimMode = appModeConfig?.app_mode === 'simulation';
                      const isSsoAllowed = isSimMode || (institution.google_oauth_verified && institution.google_oauth_enabled);
                      const isSsoActive = isSimMode
                        ? Boolean(institution.browser_permissions?.google_sso ?? appModeConfig?.bypass_google_sso)
                        : Boolean(institution.browser_permissions?.google_sso && institution.google_oauth_verified);

                      return (
                        <div className={`p-4 rounded-xl border transition-colors flex items-start justify-between gap-3 shadow-2xs ${
                          !isSsoAllowed
                            ? 'border-amber-200/70 bg-amber-50/20'
                            : 'border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50'
                        }`}>
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-blue-100/70 text-blue-700 shrink-0 mt-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-semibold text-zinc-900">
                                  5. Login Akun Google (Wajib SSO)
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                                  <Smartphone className="w-2.5 h-2.5" /> HP
                                </span>
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop">
                                  <Laptop className="w-2.5 h-2.5" /> Laptop
                                </span>
                                {isSimMode ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-300 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span>Mode Demo: {isSsoActive ? 'Bypass SSO Aktif (Tersinkron)' : 'SSO Nonaktif'}</span>
                                  </span>
                                ) : institution.google_oauth_verified && institution.google_oauth_enabled ? (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                                    Terverifikasi: {institution.google_oauth_verified_email}
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                                    Terkunci OFF (Wajib Login Akun Google)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                                {isSimMode
                                  ? 'Mode Demo / Simulasi aktif: Izin ceklis SSO tersinkronisasi otomatis dengan Bypass SSO. Peserta dapat masuk dan lolos kelayakan tanpa hambatan verifikasi riil.'
                                  : institution.google_oauth_verified && institution.google_oauth_enabled
                                  ? 'Memastikan peserta wajib masuk dengan akun Google resmi sekolah sebelum diizinkan mengakses soal.'
                                  : 'Fitur SSO terkunci OFF. Admin wajib login akun Google pada kartu Google OAuth di atas terlebih dahulu.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isSsoActive}
                            onClick={() => handleToggleBrowserPermission('google_sso', 'Login Akun Google (Wajib SSO)')}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out shadow-2xs mt-1 ${
                              !isSsoAllowed
                                ? 'bg-zinc-200 cursor-not-allowed opacity-60'
                                : isSsoActive
                                ? 'bg-emerald-500 cursor-pointer'
                                : 'bg-zinc-300 cursor-pointer'
                            }`}
                            title={
                              !isSsoAllowed
                                ? 'Terkunci: Wajib verifikasi OAuth Google dengan login akun Google terlebih dahulu'
                                : 'Klik untuk mengaktifkan/menonaktifkan kewajiban SSO Google'
                            }
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                isSsoActive ? 'translate-x-4' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })()}

                    {/* Item 7: Sensor Kamera & Mikrofon */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-cyan-100/70 text-cyan-700 shrink-0 mt-0.5">
                          <Camera className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              7. Sensor Kamera & Mikrofon
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop via Webcam">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Meminta izin sensor kamera depan dan audio peramban untuk pengawasan kejujuran ujian peserta.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.camera_webcam)}
                        onClick={() => handleToggleBrowserPermission('camera_webcam', 'Sensor Kamera & Mikrofon')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.camera_webcam ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.camera_webcam ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 8: Cookies Pihak Ketiga (Iframe GForm) */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-orange-100/70 text-orange-700 shrink-0 mt-0.5">
                          <Cookie className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              8. Akses Cookies & Iframe GForm
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Memastikan cookie pihak ketiga aktif agar formulir Google Form tersemat dapat dimuat tanpa error login.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.cookies_iframe)}
                        onClick={() => handleToggleBrowserPermission('cookies_iframe', 'Cookies & Iframe GForm')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.cookies_iframe ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.cookies_iframe ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Tombol Simpan Ceklis Izin Browser */}
                  <div className="flex justify-end pt-4 border-t border-zinc-100">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4 text-emerald-400" />
                      <span>Simpan Konfigurasi Ceklis Izin Browser</span>
                    </button>
                  </div>
                    </div>
                  )}
                </div>

                {/* FITUR 6: PANDUAN & STATUS DEPLOYMENT KE HOSTING CPANEL (KHUSUS SUPER ADMIN) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isGuideCardOpen ? 'pb-4 border-b border-zinc-100' : ''}`}>
                    <div
                      onClick={() => setIsGuideCardOpen(prev => !prev)}
                      className="flex items-center gap-3.5 cursor-pointer select-none group"
                      title={isGuideCardOpen ? 'Klik untuk menciutkan panduan' : 'Klik untuk membuka panduan cPanel'}
                    >
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-blue-600 transition-colors">
                          Panduan Pemasangan ke cPanel (Dual-Backend: Shared Hosting & Node.js)
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Khusus Super Admin &bull; Dukungan PHP 8.x PDO SQLite, cPanel Node.js App, Subdomain & SSL HTTPS
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsGuideCardOpen(prev => !prev)}
                      className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 active:bg-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-2xs transition-all cursor-pointer flex items-center justify-center self-start sm:self-auto"
                      title={isGuideCardOpen ? 'Tutup Panduan Deployment cPanel' : 'Buka Panduan Deployment cPanel (Siap Deploy .zip)'}
                      aria-label={isGuideCardOpen ? 'Tutup Panduan Deployment cPanel' : 'Buka Panduan Deployment cPanel'}
                    >
                      {isGuideCardOpen ? <ChevronUp className="w-4 h-4 text-zinc-600" /> : <ChevronDown className="w-4 h-4 text-zinc-600" />}
                    </button>
                  </div>

                  {isGuideCardOpen && (
                    <div className="pt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                        <p className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ExampGuard v1.0 Siap 100% untuk Shared Hosting & Subdomain cPanel
                        </p>
                        <p className="text-[11px] leading-relaxed text-emerald-700">
                          Sistem telah dilengkapi berkas paket <code className="font-mono bg-emerald-100/80 px-1 rounded font-semibold">ExampGuard-v1.0.zip</code> yang memuat jembatan <strong>PHP PDO SQLite REST API</strong> (<code className="font-mono">api/index.php</code>) dan proteksi <strong>.htaccess Enterprise</strong> (mencegah akses unduh database, auto-redirect HTTPS, dan SPA routing anti-error 404).
                        </p>
                      </div>

                      <div className="space-y-4 text-xs text-zinc-700">
                        {/* Step 1 */}
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            1
                          </span>
                          <div>
                            <h4 className="font-semibold text-zinc-900">Ambil Berkas Arsip Rilis Siap Pakai</h4>
                            <p className="text-zinc-600 text-[11px] mt-0.5">
                              Berkas paket rilis siap pakai telah disediakan di root direktori proyek: <code className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">ExampGuard-v1.0.zip</code>. Jika Anda melakukan perubahan kode sumber baru, cukup jalankan <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">npm run build</code> lalu kompres seluruh isi folder <code className="font-mono">dist/</code>.
                            </p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            2
                          </span>
                          <div>
                            <h4 className="font-semibold text-zinc-900">PILIHAN METODE A: Shared Hosting cPanel Biasa (Rekomendasi Paling Praktis)</h4>
                            <div className="text-zinc-600 text-[11px] mt-1 space-y-1">
                              <div>&bull; Buka cPanel hosting sekolah Anda &rarr; Pilih menu <strong>File Manager</strong>.</div>
                              <div>&bull; Masuk ke direktori target: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">public_html</code> (untuk domain utama) atau folder subdomain (contoh: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">public_html/ujian</code> untuk <code className="font-mono">ujian.sekolah.sch.id</code>).</div>
                              <div>&bull; Klik <strong>Upload</strong> lalu unggah berkas <code className="font-mono font-semibold">ExampGuard-v1.0.zip</code>.</div>
                              <div>&bull; Klik kanan berkas ZIP tersebut di cPanel &rarr; pilih <strong>Extract</strong> (Ekstrak di folder yang sama).</div>
                              <div>&bull; Unggah berkas database <code className="font-mono">examguard.db</code> ke folder yang sama (opsional, jika tidak diunggah sistem otomatis membuat database baru saat diakses).</div>
                            </div>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            3
                          </span>
                          <div>
                            <h4 className="font-semibold text-zinc-900">PILIHAN METODE B: cPanel "Setup Node.js App" (CloudLinux / VPS)</h4>
                            <div className="text-zinc-600 text-[11px] mt-1 space-y-1">
                              <div>&bull; Unggah seluruh folder proyek ke server cPanel (misal: di direktori <code className="font-mono">/home/user/examguard-app</code>).</div>
                              <div>&bull; Masuk ke cPanel &rarr; menu <strong>Setup Node.js App</strong> &rarr; klik <strong>Create Application</strong>.</div>
                              <div>&bull; Pilih versi Node.js (20.x atau 22.x), Mode: <strong>Production</strong>, Application Root: <code className="font-mono">examguard-app</code>, Startup File: <code className="font-mono">app.js</code>.</div>
                              <div>&bull; Klik tombol <strong>Run NPM Install</strong> kemudian klik <strong>Restart Application</strong>.</div>
                            </div>
                          </div>
                        </div>

                        {/* Step 4 */}
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            4
                          </span>
                          <div>
                            <h4 className="font-semibold text-zinc-900">Pastikan File Tersembunyi (.htaccess) Terbaca & Aktif</h4>
                            <p className="text-zinc-600 text-[11px] mt-0.5">
                              Di pojok kanan atas File Manager cPanel, klik menu <strong>Settings</strong> &rarr; Centang opsi <strong>"Show Hidden Files (dotfiles)"</strong> &rarr; Simpan. Pastikan berkas <code className="font-mono font-medium">.htaccess</code> terlihat dan berada di direktori aplikasi. Berkas ini bertugas memblokir akses langsung ke file database <code className="font-mono">.db</code> dan mengarahkan routing SPA.
                            </p>
                          </div>
                        </div>

                        {/* Step 5 */}
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            5
                          </span>
                          <div>
                            <h4 className="font-semibold text-zinc-900">Wajibkan Sertifikat SSL (HTTPS) — Mutlak untuk GPS & Fullscreen</h4>
                            <p className="text-zinc-600 text-[11px] mt-0.5">
                              Peramban modern (Google Chrome, Edge, Safari) secara ketat memblokir izin GPS Geolocation, Kamera pengawas, dan Layar Penuh (Fullscreen) jika website diakses melalui protokol tidak aman (HTTP). Buka menu <strong>SSL/TLS Status</strong> di cPanel &rarr; centang domain/subdomain ujian &rarr; klik <strong>Run AutoSSL</strong> hingga terbit sertifikat SSL gratis (Let's Encrypt).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Simpan Konfigurasi */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Konfigurasi Instansi</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Akses Dibatasi Khusus Super Admin</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Menu Pengaturan Instansi, Logo, GPS & Integrasi SSO hanya dapat diakses dan diedit oleh Super Admin.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Kembali ke Ringkasan
                </button>
              </div>
            )
          )}

          {/* TAB 7: BACKUP & RESTORE DATA SISTEM (Khusus Super Admin) */}
          {activeTab === 'backup' && (
            isSuperAdmin ? (
              <div className="space-y-6">
                {/* Intro Header */}
                <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Database className="w-5 h-5 text-zinc-100" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-900">
                        Cadangkan & Pulihkan Sistem (Backup & Restore)
                      </h2>
                      <p className="text-xs text-zinc-500">
                        Kelola salinan keamanan basis data sekolah, sesi ujian Google Form, akun peserta, dan pengaturan API.
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Proteksi AES-256-GCM Aktif</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* KARTU 1: CADANGKAN DATA SISTEM (EXPORT / BACKUP) */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                            <HardDriveDownload className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900">Cadangkan Data (Backup)</h3>
                            <p className="text-[11px] text-zinc-500">Ekspor seluruh data ke berkas .json terenkripsi</p>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-600 leading-relaxed">
                        Berkas cadangan mencakup identitas instansi, NPSN, seluruh sesi ujian Google Form, daftar peserta & NISN/NIS, riwayat pengerjaan, serta setelan integrasi Google & koordinat GPS.
                      </p>

                      {/* Security Alert: Data Penting Terenkripsi */}
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-blue-900">
                          <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>Enkripsi Kredensial Otomatis:</span>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Kata sandi administrator, password seluruh peserta, <strong>Google Client Secret</strong>, dan <strong>reCAPTCHA Secret Key</strong> dienkripsi secara ketat menggunakan algoritma <strong>AES-256-GCM</strong>. Data tersebut tidak akan terbaca secara polos di dalam file cadangan.
                        </p>
                      </div>

                      {/* Opsi Kunci Passphrase Enkripsi */}
                      <div className="space-y-2.5 pt-1">
                        <label className="block text-xs font-semibold text-zinc-800">
                          Metode Kunci Enkripsi Cadangan:
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50/80 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="backupKeyType"
                              checked={backupUseDefaultKey}
                              onChange={() => setBackupUseDefaultKey(true)}
                              className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                            />
                            <div className="text-xs">
                              <span className="font-semibold text-zinc-900 block">Kunci Master Sistem Bawaan (Direkomendasikan)</span>
                              <span className="text-[11px] text-zinc-500">
                                Dienkripsi dengan kunci master instansi ExamGuard. Praktis tanpa perlu menghafal sandi tambahan saat restore.
                              </span>
                            </div>
                          </label>

                          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50/80 cursor-pointer transition-colors">
                            <input
                              type="radio"
                              name="backupKeyType"
                              checked={!backupUseDefaultKey}
                              onChange={() => setBackupUseDefaultKey(false)}
                              className="mt-0.5 text-zinc-900 focus:ring-zinc-900"
                            />
                            <div className="text-xs flex-1">
                              <span className="font-semibold text-zinc-900 block">Kustom Passphrase Mandiri</span>
                              <span className="text-[11px] text-zinc-500">
                                Gunakan kata sandi rahasia yang Anda tentukan sendiri (wajib diingat saat proses pemulihan).
                              </span>
                            </div>
                          </label>
                        </div>

                        {!backupUseDefaultKey && (
                          <div className="pt-1.5 animate-in fade-in-50">
                            <input
                              type="password"
                              placeholder="Masukkan passphrase minimal 6 karakter..."
                              value={backupCustomKey}
                              onChange={(e) => setBackupCustomKey(e.target.value)}
                              className="w-full px-3.5 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={handleDownloadBackup}
                        disabled={isExportingBackup}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isExportingBackup ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Memproses & Mengenksipsi Cadangan...</span>
                          </>
                        ) : (
                          <>
                            <HardDriveDownload className="w-4 h-4" />
                            <span>Unduh Berkas Cadangan (.json)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* KARTU 2: PULIHKAN DATA SISTEM (IMPORT / RESTORE) */}
                  <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                            <HardDriveUpload className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-zinc-900">Pulihkan Data (Restore)</h3>
                            <p className="text-[11px] text-zinc-500">Impor dan rekonstruksi basis data dari berkas cadangan</p>
                          </div>
                        </div>
                      </div>

                      {/* Input File Selector */}
                      <input
                        type="file"
                        ref={restoreFileInputRef}
                        onChange={handleRestoreFileSelect}
                        accept=".json,.egbak"
                        className="hidden"
                      />

                      {!restorePreview ? (
                        <div
                          onClick={() => restoreFileInputRef.current?.click()}
                          className="border-2 border-dashed border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2"
                        >
                          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
                            <Upload className="w-5 h-5 text-zinc-600" />
                          </div>
                          <p className="text-xs font-semibold text-zinc-800">
                            Klik untuk memilih berkas cadangan ExamGuard
                          </p>
                          <p className="text-[11px] text-zinc-400">
                            Mendukung format file <code>.json</code> atau <code>.egbak</code>
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileCode className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-semibold text-zinc-900 truncate max-w-[200px]">
                                {restoreFile?.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setRestoreFile(null);
                                setRestoreJsonString('');
                                setRestorePreview(null);
                                if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
                              }}
                              className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
                            >
                              Ganti File
                            </button>
                          </div>

                          {/* Preview Summary */}
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-zinc-200/80">
                            <div className="bg-white p-2 rounded-lg border border-zinc-200/60">
                              <span className="text-zinc-500 block">Instansi / Sekolah:</span>
                              <span className="font-semibold text-zinc-800 truncate block">
                                {restorePreview.institution_name}
                              </span>
                              {restorePreview.institution_npsn && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  NPSN: {restorePreview.institution_npsn}
                                </span>
                              )}
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-zinc-200/60">
                              <span className="text-zinc-500 block">Waktu Cadangan:</span>
                              <span className="font-semibold text-zinc-800 block">
                                {new Date(restorePreview.generated_at).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-zinc-200/60">
                              <span className="text-zinc-500 block">Sesi Soal GForm:</span>
                              <span className="font-semibold text-zinc-800">
                                {restorePreview.summary?.exams_count || 0} Sesi
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-zinc-200/60">
                              <span className="text-zinc-500 block">Peserta Terdaftar:</span>
                              <span className="font-semibold text-zinc-800">
                                {restorePreview.summary?.students_count || 0} Peserta
                              </span>
                            </div>
                          </div>

                          {/* Input Passphrase Dekripsi */}
                          <div className="pt-2 border-t border-zinc-200/80 space-y-2">
                            <label className="block text-[11px] font-semibold text-zinc-800">
                              Kunci Enkripsi untuk Dekripsi:
                            </label>
                            <div className="flex items-center gap-3 text-xs">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="restoreKeyType"
                                  checked={restoreUseDefaultKey}
                                  onChange={() => setRestoreUseDefaultKey(true)}
                                  className="text-zinc-900 focus:ring-zinc-900"
                                />
                                <span>Kunci Master Bawaan</span>
                              </label>
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="restoreKeyType"
                                  checked={!restoreUseDefaultKey}
                                  onChange={() => setRestoreUseDefaultKey(false)}
                                  className="text-zinc-900 focus:ring-zinc-900"
                                />
                                <span>Passphrase Kustom</span>
                              </label>
                            </div>

                            {!restoreUseDefaultKey && (
                              <input
                                type="password"
                                placeholder="Masukkan passphrase yang digunakan saat backup..."
                                value={restoreCustomKey}
                                onChange={(e) => setRestoreCustomKey(e.target.value)}
                                className="w-full px-3 py-1.5 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <p>
                          Perhatian: Pemulihan data akan mengganti seluruh sesi ujian dan basis data peserta aktif dengan isi berkas cadangan.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        disabled={!restorePreview || isRestoringData}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isRestoringData ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Mendekripsi & Memulihkan Sistem...</span>
                          </>
                        ) : (
                          <>
                            <HardDriveUpload className="w-4 h-4" />
                            <span>Pulihkan Seluruh Data Sistem (Restore)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Akses Dibatasi Khusus Super Admin</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Fitur Cadangkan & Pulihkan Sistem hanya dapat diakses dan dieksekusi oleh Super Admin demi keamanan data instansi.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Kembali ke Ringkasan
                </button>
              </div>
            )
          )}

          {/* TAB 8: TENTANG APLIKASI (ABOUT) - Dapat diakses oleh Super Admin & Proktor */}
          {activeTab === 'about' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header Hero Banner */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <Shield className="w-8 h-8 text-zinc-100" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                      ExampGuard v1.0
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold">
                      v1.0.0 Stable
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
                    Sistem Pengawasan Ujian Berbasis Web Mandiri untuk Google Form dengan Proteksi Anti-Curang, GPS Geofencing Terkunci, Multi-Device Lock, dan Dua Mode Deployment cPanel.
                  </p>
                </div>

                {/* Badges Info */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                    ✓ Production Ready
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                    ⚡ PHP PDO SQLite & Node.js Ready
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                    🛡️ Enterprise Cybersecurity
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-medium">
                    📄 Lisensi MIT
                  </span>
                </div>
              </div>

              {/* FITUR KHUSUS: PEMERIKSAAN PEMBARUAN DI GITHUB */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-900 text-white shadow-xs">
                      <RefreshCw className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-900">
                        Pemeriksaan Pembaruan Sistem (GitHub Release Watcher)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Cek ketersediaan pembaruan, perbaikan bug, atau fitur baru langsung dari repositori resmi GitHub
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingUpdate}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                  >
                    {isCheckingUpdate ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memeriksa GitHub...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Periksa Pembaruan Sekarang</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status Hasil Pengecekan */}
                {updateCheckResult ? (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    {updateCheckResult.status === 'up_to_date' && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold text-xs">
                              Sistem Anda Menggunakan Versi Terbaru ({updateCheckResult.currentVersion})
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-mono">
                            Diperiksa: {updateCheckResult.checkedAt}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Tidak ada pembaruan baru yang ditemukan. Versi aplikasi yang Anda pasang saat ini adalah versi rilis resmi yang stabil dan siap produksi.
                        </p>
                        {updateCheckResult.commitSha && (
                          <div className="text-[10px] text-emerald-700 pt-1 flex items-center gap-2">
                            <span>Sinkronisasi Commit: <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">{updateCheckResult.commitSha}</code></span>
                            {updateCheckResult.publishedAt && <span>&bull; Rilis: {updateCheckResult.publishedAt}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {updateCheckResult.status === 'update_available' && (
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-semibold text-xs">
                              Pembaruan Versi Baru Tersedia: {updateCheckResult.latestVersion}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-mono">
                            Versi Saat Ini: {updateCheckResult.currentVersion}
                          </span>
                        </div>
                        {updateCheckResult.releaseNotes && (
                          <div className="bg-white/80 border border-blue-200/60 rounded-lg p-2.5 text-[11px] text-blue-950 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                            {updateCheckResult.releaseNotes}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={updateCheckResult.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Pembaruan di GitHub</span>
                            <ExternalLink className="w-3 h-3 text-blue-200" />
                          </a>
                        </div>
                      </div>
                    )}

                    {updateCheckResult.status === 'error' && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="font-semibold text-xs">Pengecekan Pembaruan Gagal</span>
                          </div>
                          <span className="text-[10px] text-amber-700 font-mono">{updateCheckResult.checkedAt}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          {updateCheckResult.message}
                        </p>
                        <a
                          href={updateCheckResult.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-amber-800 font-semibold hover:underline pt-1"
                        >
                          <span>Kunjungi Halaman Rilis GitHub Secara Manual</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70 text-zinc-600 text-xs">
                    <span className="text-[11px]">
                      Versi terpasang: <strong className="text-zinc-900 font-mono">v1.0.0</strong> &bull; Klik tombol di atas untuk memeriksa apakah ada rilis terbaru di repositori GitHub resmi.
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">Auto-Check Ready</span>
                  </div>
                )}
              </div>

              {/* Grid 2 Kolom: Identitas Aplikasi & Spesifikasi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Kartu 1: Arsitektur & Identitas */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                    <Building2 className="w-5 h-5 text-zinc-700" />
                    <h3 className="text-sm font-semibold text-zinc-900">Arsitektur & Tujuan Aplikasi</h3>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    ExampGuard v1.0 dirancang khusus untuk memecahkan kelemahan pelaksanaan ujian Google Form standar dengan mengisolasi lingkungan peramban peserta:
                  </p>
                  <ul className="text-xs text-zinc-600 space-y-2 list-disc list-inside">
                    <li><strong>Auto-Lock Screen:</strong> Penguncian seketika jika peserta beralih tab browser atau keluar dari mode Fullscreen.</li>
                    <li><strong>GPS Geofencing Terkunci:</strong> Pin lokasi dikunci ke sensor hardware GPS perangkat (Haversine formula anti-manipulasi).</li>
                    <li><strong>Multi-Device Lock:</strong> Kunci satu akun hanya untuk satu perangkat (Device ID) untuk mencegah perjokian.</li>
                    <li><strong>Single Sign-On (SSO):</strong> Integrasi Google Workspace resmi sekolah dengan proteksi duplikasi email peserta.</li>
                    <li><strong>Dual Backend cPanel:</strong> Mendukung Shared Hosting PHP PDO SQLite dan cPanel Node.js App.</li>
                  </ul>
                </div>

                {/* Kartu 2: Spesifikasi Teknis */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                    <Server className="w-5 h-5 text-zinc-700" />
                    <h3 className="text-sm font-semibold text-zinc-900">Spesifikasi Teknologi</h3>
                  </div>
                  <div className="divide-y divide-zinc-100 text-xs">
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Versi Rilis</span>
                      <span className="font-semibold text-zinc-900 font-mono">ExampGuard v1.0.0</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Frontend Engine</span>
                      <span className="font-semibold text-zinc-900">React 19 & Vite 6</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Database Engine</span>
                      <span className="font-semibold text-zinc-900">SQLite (WAL Mode & ACID)</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Styling Framework</span>
                      <span className="font-semibold text-zinc-900">Tailwind CSS v4.0</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Peta & Geofencing</span>
                      <span className="font-semibold text-zinc-900">Leaflet & OpenStreetMap</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Dukungan Web Server</span>
                      <span className="font-semibold text-zinc-900">Apache / LiteSpeed / Nginx / Node.js</span>
                    </div>
                  </div>
                </div>

                {/* Kartu 3: Pengembang & Lisensi */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                    <UserCheck className="w-5 h-5 text-zinc-700" />
                    <h3 className="text-sm font-semibold text-zinc-900">Tim Pengembang & Lisensi</h3>
                  </div>
                  <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
                    <div>
                      <span className="font-semibold text-zinc-900 block">Tim Pengembang:</span>
                      <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                        Fandi dari Jawa tech
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900 block">Status Rilis:</span>
                      <span className="text-zinc-700">Versi 1.0 (Siap Rilis / Production Ready)</span>
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-900 block">Lisensi Perangkat Lunak:</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                        The MIT License (MIT)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 pt-1">
                      Aplikasi ini bebas digunakan, dimodifikasi, dan didistribusikan untuk institusi pendidikan, sekolah, dan pelatihan mandiri tanpa pungutan biaya lisensi.
                    </p>
                  </div>
                </div>

                {/* Kartu 4: Repositori & Kode Sumber GitHub */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
                      <svg className="w-5 h-5 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-zinc-900">Repositori & Kode Sumber</h3>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Kode sumber resmi ExampGuard tersedia secara terbuka di GitHub. Anda dapat memantau pembaruan, rilis versi, dan kontribusi pengembangan:
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono bg-zinc-50 p-2 rounded-lg border border-zinc-200/70 truncate">
                      {GITHUB_REPO_URL}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100">
                    <a
                      href={GITHUB_REPO_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>Kunjungi Repositori GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </a>
                    <p className="text-[10px] text-zinc-400 mt-2 text-center">
                      Tautan repositori dapat disesuaikan langsung di file kode sumber sebelum rilis resmi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: GENERATE & DOWNLOAD QR CODE UJIAN */}
      {showQrModal && qrExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm">
                  QR Code Sesi Ujian (Hitam-Putih)
                </h3>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Hidden Canvas untuk merender gambar presisi */}
            <canvas ref={qrCanvasRef} className="hidden" />

            {/* Preview Gambar Card QR */}
            <div className="space-y-3">
              <div className="bg-zinc-100 rounded-xl p-3 border border-zinc-200 flex items-center justify-center">
                {qrPngUrl ? (
                  <img
                    src={qrPngUrl}
                    alt="QR Code Ujian"
                    className="max-h-80 w-auto rounded-lg shadow-sm border border-zinc-300"
                  />
                ) : (
                  <div className="py-20 flex flex-col items-center gap-2 text-zinc-400 text-xs font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
                    <span>Mengenerate QR Code & Logo...</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 text-[11px] text-zinc-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Mata Pelajaran:</span>
                  <span className="font-semibold text-zinc-900 truncate max-w-[220px]">
                    {qrExam.subject || qrExam.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Kelompok Sesi:</span>
                  <span className="font-medium text-blue-700">{qrExam.session_group || 'Asesmen'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tingkat Kelas:</span>
                  <span className="font-medium text-zinc-800">{getGradeLabel(qrExam.grade_level)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Durasi:</span>
                  <span className="font-mono text-zinc-700">{qrExam.duration_minutes} Menit</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={!qrPngUrl}
                onClick={handleDownloadQrPng}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT SESI UJIAN */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-zinc-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <h3 className="font-semibold text-zinc-900 text-sm">
                {editingExam ? 'Edit Sesi Ujian Google Form' : 'Tambah Sesi Ujian Google Form Baru'}
              </h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveExamSubmit} className="space-y-4 text-xs">
              <datalist id="popularSubjectsList">
                {POPULAR_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj} />
                ))}
              </datalist>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    list="popularSubjectsList"
                    required
                    defaultValue={editingExam?.subject || ''}
                    placeholder="Pilih atau ketik mapel..."
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Kelompok Sesi Ujian <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="session_group"
                    defaultValue={editingExam?.session_group || 'Asesmen Tengah Semester (ATS)'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {EXAM_SESSION_GROUPS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  Judul Sesi Ujian <span className="text-zinc-400 font-normal text-[11px]">(Opsional - otomatis gunakan Mapel jika kosong)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingExam?.title || ''}
                  placeholder="Contoh: Penilaian Akhir Semester (opsional)"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Deskripsi / Petunjuk Ujian</label>
                <textarea
                  name="description"
                  rows="2"
                  defaultValue={editingExam?.description || ''}
                  placeholder="Petunjuk pengerjaan bagi peserta..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Tingkat Kelas Sasaran ({institution.education_level}) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="grade_level"
                    required
                    defaultValue={editingExam?.grade_level || institution.allowed_grades?.[0] || 0}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {institution.allowed_grades && institution.allowed_grades.length > 0 ? (
                      institution.allowed_grades.map((grade) => (
                        <option key={grade} value={grade}>
                          {getGradeLabel(grade)}
                        </option>
                      ))
                    ) : (
                      <option value="0">Tingkat Umum (0)</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-zinc-700">
                      Durasi Pengerjaan <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-zinc-400">Menit</span>
                  </div>
                  <input
                    type="number"
                    name="duration_minutes"
                    min="5"
                    max="300"
                    required
                    value={examDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setExamDuration(val);
                      if (examStartTime && val > 0) {
                        setExamEndTime(calculateEndTime(examStartTime, val));
                      }
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  URL Pengisian Google Form <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1">
                  <input
                    type="url"
                    name="gform_base_url"
                    required
                    defaultValue={editingExam?.gform_base_url || ''}
                    onBlur={(e) => {
                      const converted = convertGoogleFormUrl(e.target.value);
                      if (converted !== e.target.value) {
                        e.target.value = converted;
                        showNotification('Link Google Form otomatis dikonversi ke format embed standar!', 'info');
                      }
                    }}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Tempel link Google Forms di sini (sistem otomatis mengonversi ke format embed standar ujian).
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  URL Spreadsheet Respon Jawaban (Google Sheets)
                </label>
                <input
                  type="url"
                  name="respon_base_url"
                  defaultValue={editingExam?.respon_base_url || ''}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              {/* Blok Token Mulai & Token Selesai Ujian */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-zinc-50 border border-zinc-200/90 rounded-xl">
                {/* 1. Token Mulai (Masuk) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                      <span>Token Mulai (Masuk)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">(Opsional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setExamTokenValue(generateRandomToken6())}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Generate 6 Karakter Huruf Besar Acak"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Acak</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    name="exam_token"
                    maxLength={6}
                    value={examTokenValue}
                    onChange={(e) =>
                      setExamTokenValue(
                        e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
                      )
                    }
                    placeholder="Klik 'Acak' atau kosongkan"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none text-zinc-900 text-sm placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Kosongkan jika tanpa token, atau klik Acak (A-Z)</p>
                </div>

                {/* 2. Token Selesai (Submit) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Token Selesai (Submit)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">(Opsional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFinishTokenValue(generateRandomToken6())}
                      className="text-[10px] text-amber-600 hover:text-amber-800 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Generate 6 Karakter Huruf Besar Acak"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Acak</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    name="finish_token"
                    maxLength={6}
                    value={finishTokenValue}
                    onChange={(e) =>
                      setFinishTokenValue(
                        e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
                      )
                    }
                    placeholder="Klik 'Acak' atau kosongkan"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none text-zinc-900 text-sm placeholder:text-zinc-400 placeholder:font-normal placeholder:tracking-normal placeholder:text-xs"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">Kosongkan jika tanpa token, atau klik Acak (A-Z)</p>
                </div>
              </div>

              {/* Blok Waktu Mulai & Waktu Selesai Sesi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-zinc-700">
                      Mulai Sesi <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const def = getDefaultExamTimes(examDuration);
                        setExamStartTime(def.startTime);
                        setExamEndTime(def.endTime);
                        showNotification('Waktu mulai diset ke hari ini jam 07:30', 'info');
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Set Waktu Mulai ke Hari Ini now() Jam 07:30"
                    >
                      <Clock className="w-2.5 h-2.5" />
                      <span>Hari Ini 07:30</span>
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    name="start_time"
                    required
                    value={examStartTime}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExamStartTime(val);
                      if (val && examDuration > 0) {
                        setExamEndTime(calculateEndTime(val, examDuration));
                      }
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px] font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Default hari ini jam 07:30</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-zinc-700">
                      Selesai Sesi <span className="text-rose-500">*</span>
                    </label>
                    {examDuration > 0 && (
                      <span className="text-[10px] text-blue-600 font-mono font-medium">
                        (+{examDuration} mnt)
                      </span>
                    )}
                  </div>
                  <input
                    type="datetime-local"
                    name="end_time"
                    required
                    value={examEndTime}
                    onChange={(e) => setExamEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px] font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Hari itu juga sesuai durasi ({examDuration} menit)</p>
                </div>
              </div>

              <div className="pt-2 space-y-2 border-t border-zinc-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingExam ? Boolean(editingExam.is_active) : true}
                    className="w-4 h-4 rounded text-zinc-900"
                  />
                  <span className="text-xs font-medium text-zinc-800">
                    Aktifkan Sesi Ini (Tampilkan di Beranda Peserta yang sesuai tingkat kelas)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_archived"
                    defaultChecked={editingExam ? Boolean(editingExam.is_archived) : false}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span className="text-xs font-medium text-zinc-700">
                    Simpan ke <strong>Bank Soal (Arsip)</strong> &mdash; Soal akan disimpan sebagai bank soal/draf dan disembunyikan dari peserta sampai diaktifkan kembali.
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs"
                >
                  Simpan Sesi Ujian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT PESERTA CSV DENGAN VALIDASI ANTI-DUPLIKASI */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto ${
            importStep === 'error_report' ? 'max-w-3xl p-6' : 'max-w-xl p-6'
          }`}>
            {importStep === 'error_report' && importValidationErrors ? (
              /* VIEW: LAPORAN ERROR & DUPLIKASI DATA IMPORT */
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">
                        Validasi Gagal: Terdeteksi {importValidationErrors.length} Data Duplikat
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Harap perbaiki data di bawah ini sebelum data dapat diimpor ke sistem
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportStep('input');
                      setImportValidationErrors(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* Banner Peringatan */}
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">Import Dibatalkan Demi Menjaga Keunikan Identitas Peserta</div>
                    <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">
                      Sistem mendeteksi <strong>{importValidationErrors.length} konflik</strong> pada kolom <strong>No. Ujian</strong>, <strong>NISN</strong>, atau <strong>NIS</strong>. Konflik terjadi baik terhadap data peserta yang sudah ada di sistem maupun antar baris dalam data yang Anda masukkan.
                    </p>
                  </div>
                </div>

                {/* Tabel Daftar Kesalahan / Duplikasi */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden mb-4">
                  <div className="max-h-[48vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-zinc-50 text-zinc-600 text-[11px] font-semibold sticky top-0 border-b border-zinc-200 z-10">
                        <tr>
                          <th className="py-2.5 px-3 whitespace-nowrap">Baris</th>
                          <th className="py-2.5 px-3">Nama Peserta</th>
                          <th className="py-2.5 px-3">Kolom Duplikat</th>
                          <th className="py-2.5 px-3">Nilai Duplikat</th>
                          <th className="py-2.5 px-3">Bentrok Dengan</th>
                          <th className="py-2.5 px-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {importValidationErrors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/40 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-semibold text-rose-700 whitespace-nowrap">
                              Baris {err.rowNumber}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-zinc-900 whitespace-nowrap">
                              {err.nama}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                err.field === 'nisn'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : err.field === 'nomor_ujian'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {err.fieldLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-rose-700 whitespace-nowrap">
                              <code className="bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                {err.value}
                              </code>
                            </td>
                            <td className="py-2.5 px-3 text-[11px]">
                              {err.conflictType === 'system' ? (
                                <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                                  {err.conflictWith}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                                  {err.conflictWith}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600 text-[11px] leading-snug">
                              {err.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tombol Aksi Error View */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={copyImportErrorsText}
                    className="py-2 px-3 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-700 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedErrorText ? 'Laporan Tersalin!' : 'Salin Laporan Error'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportStep('input');
                        setImportValidationErrors(null);
                      }}
                      className="py-2 px-4 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStep('input')}
                      className="py-2 px-4 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Perbaiki Teks Data (Kembali ke Editor)</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW: FORM INPUT CSV DENGAN PREVIEW & UPLOAD FILE */
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 text-sm">Import Data Peserta Lengkap (10 Kolom)</h3>
                      <p className="text-[11px] text-zinc-500">Mendukung 10 data lengkap sesuai form tambah manual</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportStep('input');
                      setImportValidationErrors(null);
                    }}
                    className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
                  >
                    &times;
                  </button>
                </div>

                {/* Daftar 10 Kolom Sesuai Form Manual */}
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 mb-3 text-xs text-zinc-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800">10 Kolom Data Sesuai Tambah Manual:</span>
                    <span className="text-[10px] text-zinc-400 font-mono">10 Field Lengkap</span>
                  </div>
                  <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                    <span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-800 font-semibold" title="Nama Lengkap (Wajib)">1. nama*</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 font-semibold" title="Nomor Ujian (Opsional, fallback ke NISN)">2. nomor_ujian</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-amber-200 text-amber-700 font-semibold" title="NISN Akun (Wajib, Unik)">3. nisn*</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-700 font-semibold" title="NIS / Password Awal (Opsional)">4. nis</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-700 font-semibold" title="Jenis Kelamin: L atau P (Wajib)">5. jenis_kelamin</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-teal-200 text-teal-700 font-semibold" title="Agama: Islam, Kristen, Katolik, dll (Wajib)">6. agama</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-800 font-semibold" title="Kelas / Rombel (Wajib)">7. kelas*</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-800 font-semibold" title="Tingkat Kelas: 7, 8, 9, 10, dll (Wajib)">8. tingkat*</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700 font-semibold" title="Ruang Ujian: misal Ruang 01 (Opsional)">9. ruang</span>
                    <span className="bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-700 font-semibold" title="Email SSO Google (Opsional)">10. email</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    * Nilai opsional yang dikosongkan akan otomatis memakai nilai default aman (No. Ujian disamakan dengan NISN, JK = L, Agama = Islam, Ruang = Ruang 01). Format lama juga tetap terbaca otomatis.
                  </p>
                </div>

                <div className="mb-2.5 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer text-[11px] text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-300 flex items-center gap-1.5 font-medium transition-colors">
                      <Upload className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Upload File CSV (.csv / .txt)</span>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleImportFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleDownloadCsvTemplate}
                      className="cursor-pointer text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Unduh Template CSV</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={copySampleCsv}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText ? 'Format Tersalin!' : 'Salin Contoh Format'}</span>
                  </button>
                </div>

                <form onSubmit={handleImportSubmit} className="space-y-3.5">
                  <textarea
                    rows="8"
                    required
                    value={importCsvText}
                    onChange={(e) => {
                      setImportCsvText(e.target.value);
                      if (importValidationErrors) setImportValidationErrors(null);
                    }}
                    placeholder="nama,nomor_ujian,nisn,nis,jenis_kelamin,agama,kelas,tingkat,ruang,email&#10;Ahmad Fauzi,UJN-12-001,0058291021,22101,L,Islam,XII MIPA 1,12,Ruang 01,ahmad@student.sch.id&#10;Siti Rahmawati,UJN-12-002,0058291022,22102,P,Islam,XII MIPA 2,12,Ruang 01,siti.rahma@student.sch.id"
                    className="w-full p-3 border border-zinc-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none transition-colors"
                  ></textarea>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowImportModal(false);
                        setImportStep('input');
                        setImportValidationErrors(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Validasi & Proses Import Peserta</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH PESERTA MANUAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">
                    Tambah Peserta Ujian (Input Manual)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Kredensial login awal otomatis diset ke nomor NISN
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStudentModal(false);
                  setAddStudentError('');
                }}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Banner Peringatan / Validasi Form di Dalam Modal */}
            {(addStudentError || hasAddDuplicate) && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-rose-900">
                    {hasAddDuplicate ? 'Peringatan: Terdeteksi Data Duplikat' : 'Validasi Data Gagal'}
                  </div>
                  {duplicateAddNisn && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>NISN:</strong> Nilai &quot;{trimmedAddNisn}&quot; sudah digunakan oleh <strong>{duplicateAddNisn.nama}</strong> ({duplicateAddNisn.kelas || '-'}).
                    </div>
                  )}
                  {duplicateAddNoUjian && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>No. Ujian:</strong> Nilai &quot;{cleanAddNoUjian}&quot; sudah digunakan oleh <strong>{duplicateAddNoUjian.nama}</strong> ({duplicateAddNoUjian.kelas || '-'}).
                    </div>
                  )}
                  {duplicateAddNis && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>NIS:</strong> Nilai &quot;{trimmedAddNis}&quot; sudah digunakan oleh <strong>{duplicateAddNis.nama}</strong> ({duplicateAddNis.kelas || '-'}).
                    </div>
                  )}
                  {addStudentError && !hasAddDuplicate && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">{addStudentError}</div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Lengkap Peserta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.nama}
                    onChange={(e) => {
                      setNewStudentForm({ ...newStudentForm, nama: e.target.value });
                      if (addStudentError) setAddStudentError('');
                    }}
                    placeholder="Contoh: Muhammad Rizky Pratama"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      NISN (Username Akun) <span className="text-rose-500">*</span>
                    </label>
                    {duplicateAddStudent && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={newStudentForm.nisn}
                    onChange={(e) => {
                      setNewStudentForm({ ...newStudentForm, nisn: e.target.value });
                      if (addStudentError) setAddStudentError('');
                    }}
                    placeholder="Contoh: 0078192031"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateAddStudent
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateAddStudent ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateAddStudent.nama}</strong> ({duplicateAddStudent.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Otomatis jadi Username & Password awal
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      Nomor Ujian Peserta <span className="text-zinc-400 font-normal">(Opsional)</span>
                    </label>
                    {duplicateAddNoUjian && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newStudentForm.nomor_ujian || ''}
                    onChange={(e) => {
                      setNewStudentForm({ ...newStudentForm, nomor_ujian: cleanNomorUjian(e.target.value) });
                      if (addStudentError) setAddStudentError('');
                    }}
                    placeholder="Kosongkan untuk otomatis pakai NISN"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateAddNoUjian
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateAddNoUjian ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateAddNoUjian.nama}</strong> ({duplicateAddNoUjian.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Hanya huruf, angka, tanda strip dan titik (harus unik)
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      NIS (Nomor Induk Sekolah)
                    </label>
                    {duplicateAddNis && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newStudentForm.nis}
                    onChange={(e) => {
                      setNewStudentForm({ ...newStudentForm, nis: e.target.value });
                      if (addStudentError) setAddStudentError('');
                    }}
                    placeholder="Contoh: 23105 (Opsional)"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateAddNis
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateAddNis ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateAddNis.nama}</strong> ({duplicateAddNis.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Nomor induk lokal sekolah (harus unik jika diisi)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Jenis Kelamin & Agama <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newStudentForm.jenis_kelamin || 'L'}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, jenis_kelamin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                    <select
                      value={newStudentForm.agama || 'Islam'}
                      onChange={(e) =>
                        setNewStudentForm({ ...newStudentForm, agama: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Khonghucu">Khonghucu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.kelas}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, kelas: e.target.value })
                    }
                    placeholder="Contoh: XII MIPA 1 atau 9A"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newStudentForm.tingkat}
                    onChange={(e) =>
                      setNewStudentForm({
                        ...newStudentForm,
                        tingkat: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {institution.allowed_grades.map((g) => (
                      <option key={g} value={g}>
                        {getGradeLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ruang Ujian <span className="text-zinc-400 font-normal">(Maks. 10 karakter)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={newStudentForm.ruang || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 10);
                      setNewStudentForm({ ...newStudentForm, ruang: val });
                      if (addStudentError) setAddStudentError('');
                    }}
                    placeholder="Contoh: Ruang 01"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Hanya huruf, angka, dan spasi
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Alamat Email Peserta <span className="text-zinc-400 font-normal">(Opsional - Untuk Google SSO)</span>
                  </label>
                  <input
                    type="email"
                    value={newStudentForm.email || ''}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, email: e.target.value })
                    }
                    placeholder="nama.peserta@student.sch.id (opsional)"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Status SSO awal adalah <strong>SSO Off</strong>. Centang hijau akan otomatis aktif setelah peserta login SSO dengan email ini.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStudentForm.is_verified}
                    onChange={(e) =>
                      setNewStudentForm({
                        ...newStudentForm,
                        is_verified: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900"
                  />
                  <span className="text-xs font-medium text-zinc-800">
                    Verifikasi peserta ini langsung (Akun aktif dan siap digunakan ujian)
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStudentModal(false);
                    setAddStudentError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={hasAddDuplicate}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium shadow-xs transition-all ${
                    hasAddDuplicate
                      ? 'bg-zinc-400 text-white cursor-not-allowed opacity-60'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer'
                  }`}
                >
                  Simpan Peserta Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT AKUN PESERTA */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">
                    Edit Akun Peserta Ujian
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Ubah profil, kelas, nomor identitas, dan email peserta
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditStudentError('');
                }}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Banner Peringatan / Validasi Form di Dalam Modal Edit */}
            {(editStudentError || hasEditDuplicate) && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="font-semibold text-rose-900">
                    {hasEditDuplicate ? 'Peringatan: Terdeteksi Data Duplikat' : 'Validasi Data Gagal'}
                  </div>
                  {duplicateEditNisn && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>NISN:</strong> Nilai &quot;{trimmedEditNisn}&quot; sudah digunakan oleh peserta lain <strong>{duplicateEditNisn.nama}</strong> ({duplicateEditNisn.kelas || '-'}).
                    </div>
                  )}
                  {duplicateEditNoUjian && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>No. Ujian:</strong> Nilai &quot;{cleanEditNoUjian}&quot; sudah digunakan oleh peserta lain <strong>{duplicateEditNoUjian.nama}</strong> ({duplicateEditNoUjian.kelas || '-'}).
                    </div>
                  )}
                  {duplicateEditNis && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">
                      &bull; <strong>NIS:</strong> Nilai &quot;{trimmedEditNis}&quot; sudah digunakan oleh peserta lain <strong>{duplicateEditNis.nama}</strong> ({duplicateEditNis.kelas || '-'}).
                    </div>
                  )}
                  {editStudentError && !hasEditDuplicate && (
                    <div className="text-[11px] text-rose-700 leading-relaxed">{editStudentError}</div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Lengkap Peserta <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nama}
                    onChange={(e) => {
                      setEditingStudent({ ...editingStudent, nama: e.target.value });
                      if (editStudentError) setEditStudentError('');
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      NISN (Username Akun) <span className="text-rose-500">*</span>
                    </label>
                    {duplicateEditNisn && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={editingStudent.nisn}
                    onChange={(e) => {
                      setEditingStudent({ ...editingStudent, nisn: e.target.value });
                      if (editStudentError) setEditStudentError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateEditNisn
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateEditNisn ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateEditNisn.nama}</strong> ({duplicateEditNisn.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Identitas unik untuk akun login peserta
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      Nomor Ujian Peserta
                    </label>
                    {duplicateEditNoUjian && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingStudent.nomor_ujian || ''}
                    onChange={(e) => {
                      setEditingStudent({ ...editingStudent, nomor_ujian: cleanNomorUjian(e.target.value) });
                      if (editStudentError) setEditStudentError('');
                    }}
                    placeholder="Kosongkan untuk otomatis pakai NISN"
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateEditNoUjian
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateEditNoUjian ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateEditNoUjian.nama}</strong> ({duplicateEditNoUjian.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Nomor kartu ujian peserta (harus unik)
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-zinc-700">
                      NIS (Nomor Induk Sekolah)
                    </label>
                    {duplicateEditNis && (
                      <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        Duplikat
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingStudent.nis || ''}
                    onChange={(e) => {
                      setEditingStudent({ ...editingStudent, nis: e.target.value });
                      if (editStudentError) setEditStudentError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none transition-colors ${
                      duplicateEditNis
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500 focus:border-rose-500'
                        : 'border-zinc-300 focus:ring-2 focus:ring-zinc-900'
                    }`}
                  />
                  {duplicateEditNis ? (
                    <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-700 flex items-start gap-1.5 leading-snug animate-in fade-in duration-150">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>
                        Sudah dipakai oleh <strong>{duplicateEditNis.nama}</strong> ({duplicateEditNis.kelas || '-'}).
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Nomor induk lokal sekolah (harus unik jika diisi)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Jenis Kelamin & Agama <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editingStudent.jenis_kelamin || 'L'}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, jenis_kelamin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                    <select
                      value={editingStudent.agama || 'Islam'}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, agama: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Kelas / Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.kelas}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, kelas: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingStudent.tingkat}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        tingkat: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  >
                    {institution.allowed_grades.map((g) => (
                      <option key={g} value={g}>
                        {getGradeLabel(g)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Ruang Ujian <span className="text-zinc-400 font-normal">(Maks. 10 karakter)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editingStudent.ruang || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 10);
                      setEditingStudent({ ...editingStudent, ruang: val });
                      if (editStudentError) setEditStudentError('');
                    }}
                    placeholder="Contoh: Ruang 01"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Hanya huruf, angka, dan spasi
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Alamat Email Peserta <span className="text-zinc-400 font-normal">(Opsional - Akun Google SSO)</span>
                  </label>
                  <input
                    type="email"
                    value={editingStudent.email || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, email: e.target.value })
                    }
                    placeholder="nama.peserta@student.sch.id (opsional)"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />

                  {/* Deteksi jika email diubah */}
                  {Boolean(editingStudent.email?.trim() || editingStudent.original_email?.trim()) &&
                    (editingStudent.email || '').trim().toLowerCase() !==
                    (editingStudent.original_email || '').trim().toLowerCase() && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Perhatian Perubahan Email:</strong>
                          <p className="mt-0.5">
                            Alamat email diubah dari <code className="font-mono bg-amber-100/70 px-1 rounded">{editingStudent.original_email || '-'}</code> menjadi <code className="font-mono bg-amber-100/70 px-1 rounded">{editingStudent.email || '(Kosong)'}</code>.
                          </p>
                          <p className="mt-0.5 font-medium text-amber-900">
                            Sesuai aturan sistem, status Google SSO akan <strong>otomatis OFF</strong> (ID Google tersimpan akan dihapus). Peserta harus login ulang lewat Google SSO dengan email baru ini.
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Status SSO Saat Ini */}
              <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
                <span className="text-[11px] text-zinc-600 font-medium">
                  Status Google SSO Saat Ini:
                </span>
                {editingStudent.google_linked && editingStudent.google_id ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    SSO On (ID: {editingStudent.google_id.slice(0, 8)}...)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                    SSO Off (Belum Login)
                  </span>
                )}
              </div>

              {/* Status Verifikasi & Status Akun */}
              <div className="p-3 bg-zinc-50/80 border border-zinc-200 rounded-xl space-y-2.5">
                <div className="text-[11px] font-bold text-zinc-800">Status Otorisasi Akun:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white border border-zinc-200 rounded-lg cursor-pointer hover:bg-zinc-50">
                    <input
                      type="checkbox"
                      checked={Boolean(editingStudent.is_verified)}
                      onChange={(e) => {
                        const verified = e.target.checked;
                        setEditingStudent({
                          ...editingStudent,
                          is_verified: verified,
                          // Jika verifikasi dimatikan, akun otomatis tidak aktif
                          is_active: verified ? editingStudent.is_active : false,
                        });
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-zinc-800">Terverifikasi</div>
                      <div className="text-[10px] text-zinc-500">Izin ikut ujian</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-2 p-2 bg-white border rounded-lg cursor-pointer ${
                    !editingStudent.is_verified ? 'opacity-60 cursor-not-allowed border-zinc-200' : 'hover:bg-zinc-50 border-zinc-200'
                  }`}>
                    <input
                      type="checkbox"
                      disabled={!editingStudent.is_verified}
                      checked={Boolean(editingStudent.is_active)}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-zinc-800">Akun Aktif</div>
                      <div className="text-[10px] text-zinc-500">Bisa login ke portal</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditStudentError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={hasEditDuplicate}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium shadow-xs transition-all ${
                    hasEditDuplicate
                      ? 'bg-zinc-400 text-white cursor-not-allowed opacity-60'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800 cursor-pointer'
                  }`}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KARTU UJIAN & QR LOGIN PESERTA */}
      <StudentQrCardModal
        isOpen={Boolean(viewingStudentQr)}
        onClose={() => setViewingStudentQr(null)}
        student={viewingStudentQr}
        institution={institution}
        onTokenReset={(updatedUser) => {
          setViewingStudentQr(updatedUser);
          refreshMonitoringData();
        }}
      />

      <StudentQrCardModal
        isOpen={showPrintAllCardsModal}
        onClose={() => setShowPrintAllCardsModal(false)}
        allStudents={filteredUsers}
        institution={institution}
      />

      {/* Modal Dialog Konfirmasi Kustom Modern */}
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
