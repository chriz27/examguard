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
  Lock,
  Upload,
  Download,
  ExternalLink,
  MapPin,
  Clock,
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
} from 'lucide-react';
import { storageService } from '../../services/storageService';
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

export default function AdminDashboard({ currentUser, onLogout }) {
  const isSuperAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState('overview');
  const [institution, setInstitution] = useState(storageService.getInstitution());
  const [users, setUsers] = useState(storageService.getUsers());
  const [exams, setExams] = useState(storageService.getExamSessions());
  const [attempts, setAttempts] = useState(storageService.getAttempts());
  const [gmapsInput, setGmapsInput] = useState(
    () => institution?.gmaps_url || (institution?.center_lat ? `https://maps.google.com/?q=${institution.center_lat},${institution.center_lng}` : '')
  );

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
        if (onLogout) onLogout();
      },
    });
  };

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [copiedText, setCopiedText] = useState(false);

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
  const [examSubTab, setExamSubTab] = useState('active'); // 'active' | 'bank'
  const [selectedSessionGroup, setSelectedSessionGroup] = useState('ALL');

  // Password visibility
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
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

  // Modal Tambah Siswa Manual
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    nama: '',
    nisn: '',
    nis: '',
    kelas: '',
    tingkat: 10,
    email: '',
    is_verified: true,
  });

  // Modal Edit Siswa
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // URL Repositori GitHub Resmi ExamGuard (Dapat diedit langsung sebelum rilis)
  const GITHUB_REPO_URL = 'https://github.com/your-username/examguard';

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

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // Refresh seluruh data sistem termasuk konfigurasi institusi
  const refreshData = () => {
    setInstitution(storageService.getInstitution());
    setUsers(storageService.getUsers());
    setExams(storageService.getExamSessions());
    setAttempts(storageService.getAttempts());
  };

  // Refresh hanya data aktivitas dinamis (siswa, ujian, attempt) tanpa menimpa formulir instansi yang sedang diedit
  const refreshMonitoringData = () => {
    setUsers(storageService.getUsers());
    setExams(storageService.getExamSessions());
    setAttempts(storageService.getAttempts());
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
              Seluruh data instansi, daftar sesi soal Google Form, dan basis data siswa saat ini akan{' '}
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
    const handleStorageChange = () => {
      refreshMonitoringData();
    };
    window.addEventListener('examguard_storage_updated', handleStorageChange);
    // Polling interval 5 detik hanya untuk data aktivitas siswa & ujian (tidak menimpa input form instansi)
    const interval = setInterval(refreshMonitoringData, 5000);
    return () => {
      window.removeEventListener('examguard_storage_updated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    if (institution.npsn && institution.npsn.length !== 8) {
      showNotification('NPSN sekolah harus terdiri dari 8 digit angka numerik.', 'error');
      return;
    }
    const updated = {
      ...institution,
      gmaps_url: gmapsInput?.trim() || institution.gmaps_url,
    };
    storageService.updateInstitution(updated);
    setInstitution(updated);
    refreshData();
    showNotification('Konfigurasi instansi dan lokasi GPS berhasil disimpan.');
  };

  // Handler Switch On/Off Ceklis Izin Browser Siswa (Pre-flight Permissions)
  const handleToggleBrowserPermission = (permKey, permLabel) => {
    const currentPerms = institution.browser_permissions || {};
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
    refreshData();
    showNotification(
      `Izin "${permLabel}" diubah menjadi ${updatedVal ? 'Wajib Divalidasi (ON)' : 'Bebas / Non-Aktif (OFF)'}.`
    );
  };

  // Handler Switch On/Off Google OAuth & Workspace SSO (Konfirmasi Modern)
  const handleToggleGoogleOAuth = () => {
    const isCurrentlyActive = Boolean(institution.google_oauth_enabled);
    if (isCurrentlyActive) {
      openConfirm({
        title: 'Matikan Google OAuth 2.0 & SSO?',
        message: (
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin <strong>menonaktifkan Google OAuth 2.0 & Workspace SSO</strong>?
            </p>
            <p className="text-[11px] text-zinc-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
              Perhatian: Tombol login "Masuk dengan Google SSO" akan disembunyikan dari beranda login siswa. Siswa dapat login menggunakan nomor <strong>NISN & Password NIS</strong>.
            </p>
          </div>
        ),
        confirmText: 'Ya, Matikan OAuth',
        cancelText: 'Batal',
        variant: 'warning',
        icon: Unlink,
        onConfirm: () => {
          const updated = {
            ...institution,
            google_oauth_enabled: false,
            auth_method:
              institution.auth_method === 'SSO_ONLY' ? 'CREDENTIALS_ONLY' : institution.auth_method,
          };
          setInstitution(updated);
          storageService.updateInstitution(updated);
          refreshData();
          showNotification('Integrasi Google OAuth & SSO dinonaktifkan.');
        },
      });
    } else {
      openConfirm({
        title: 'Aktifkan Google OAuth 2.0 & SSO?',
        message: (
          <div className="space-y-2">
            <p>
              Aktifkan <strong>Google OAuth 2.0 & Workspace SSO</strong> untuk autentikasi peserta ujian sekolah?
            </p>
            <p className="text-[11px] text-zinc-500 bg-blue-50 border border-blue-200 p-2.5 rounded-xl text-blue-900">
              Siswa dengan email terdaftar dapat login praktis 1-klik menggunakan akun Google resmi sekolah mereka.
            </p>
          </div>
        ),
        confirmText: 'Ya, Aktifkan OAuth',
        cancelText: 'Batal',
        variant: 'success',
        icon: CheckCircle2,
        onConfirm: () => {
          const updated = {
            ...institution,
            google_oauth_enabled: true,
            auth_method:
              institution.auth_method === 'CREDENTIALS_ONLY' ? 'BOTH' : institution.auth_method || 'BOTH',
          };
          setInstitution(updated);
          storageService.updateInstitution(updated);
          refreshData();
          showNotification('Integrasi Google OAuth & SSO berhasil diaktifkan.');
        },
      });
    }
  };

  // Handler Switch On/Off Google reCAPTCHA v2 (Konfirmasi Modern)
  const handleToggleRecaptcha = () => {
    const isCurrentlyActive = Boolean(institution.recaptcha_enabled);
    if (isCurrentlyActive) {
      openConfirm({
        title: 'Matikan Proteksi Google reCAPTCHA v2?',
        message: (
          <div className="space-y-2">
            <p>
              Apakah Anda yakin ingin <strong>menonaktifkan verifikasi Google reCAPTCHA v2</strong> di gerbang login?
            </p>
            <p className="text-[11px] text-zinc-500 bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-amber-900">
              Setelah dinonaktifkan, siswa dan pengawas dapat langsung login tanpa perlu menyelesaikan checklist "Saya bukan robot".
            </p>
          </div>
        ),
        confirmText: 'Ya, Matikan reCAPTCHA',
        cancelText: 'Batal',
        variant: 'warning',
        icon: AlertTriangle,
        onConfirm: () => {
          const updated = {
            ...institution,
            recaptcha_enabled: false,
          };
          setInstitution(updated);
          storageService.updateInstitution(updated);
          refreshData();
          showNotification('Proteksi Google reCAPTCHA v2 dinonaktifkan.');
        },
      });
    } else {
      openConfirm({
        title: 'Aktifkan Proteksi Google reCAPTCHA v2?',
        message: (
          <div className="space-y-2">
            <p>
              Aktifkan proteksi <strong>Google reCAPTCHA v2</strong> pada gerbang login ujian?
            </p>
            <p className="text-[11px] text-zinc-500 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900">
              Setiap peserta ujian dan administrator diwajibkan menyelesaikan verifikasi robot sebelum mengirim kredensial login.
            </p>
          </div>
        ),
        confirmText: 'Ya, Aktifkan reCAPTCHA',
        cancelText: 'Batal',
        variant: 'success',
        icon: CheckCircle2,
        onConfirm: () => {
          const updated = {
            ...institution,
            recaptcha_enabled: true,
          };
          setInstitution(updated);
          storageService.updateInstitution(updated);
          refreshData();
          showNotification('Proteksi Google reCAPTCHA v2 berhasil diaktifkan.');
        },
      });
    }
  };

  // Ambil Lokasi GPS Saat Ini
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Peramban Anda tidak mendukung Geolocation GPS.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const gmaps = `https://maps.google.com/?q=${lat},${lng}`;
        const updated = {
          ...institution,
          center_lat: lat,
          center_lng: lng,
          gmaps_url: gmaps,
        };
        setInstitution(updated);
        setGmapsInput(gmaps);
        storageService.updateInstitution(updated);
        showNotification('Koordinat GPS berhasil disesuaikan dengan posisi Anda saat ini.');
      },
      (err) => {
        showNotification(`Gagal membaca GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true }
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

      const updated = {
        ...institution,
        center_lat: lat,
        center_lng: lng,
        gmaps_url: validUrl,
      };
      setInstitution(updated);
      setGmapsInput(validUrl);
      storageService.updateInstitution(updated);
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

  // Helper Buka Modal Tambah Soal (Token Standar 6 Digit Otomatis)
  const handleOpenAddExamModal = () => {
    setEditingExam(null);
    setExamTokenValue(generateRandomToken6());
    setShowExamModal(true);
  };

  // Helper Buka Modal Edit Soal (Normalisasi Token 6 Digit)
  const handleOpenEditExamModal = (exam) => {
    setEditingExam(exam);
    setExamTokenValue(formatExamToken(exam.exam_token));
    setShowExamModal(true);
  };

  // Handler Simpan / Edit Ujian (Standar Token 6 Digit Huruf Besar)
  const handleSaveExamSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const isArchived = Boolean(form.is_archived?.checked);
    const token = formatExamToken(examTokenValue || form.exam_token?.value);

    const examData = {
      id: editingExam?.id || generateUUID(),
      title: form.title.value.trim(),
      subject: (form.subject?.value || '').trim() || 'Mata Pelajaran Umum',
      session_group: (form.session_group?.value || '').trim() || 'Asesmen Tengah Semester (ATS)',
      description: form.description.value.trim(),
      grade_level: parseInt(form.grade_level.value, 10),
      is_active: isArchived ? false : (form.is_active ? form.is_active.checked : true),
      is_archived: isArchived,
      gform_base_url: form.gform_base_url.value.trim(),
      respon_base_url: form.respon_base_url.value.trim(),
      exam_token: token,
      start_time: form.start_time.value,
      end_time: form.end_time.value,
      duration_minutes: parseInt(form.duration_minutes.value, 10) || 60,
    };

    storageService.saveExamSession(examData);
    setShowExamModal(false);
    setEditingExam(null);
    refreshData();
    showNotification(
      isArchived
        ? 'Soal berhasil disimpan ke Bank Soal (Arsip).'
        : `Sesi ujian GForm berhasil disimpan dengan Token: ${token}`
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
      title: 'Reset Kunci Perangkat Siswa?',
      message: (
        <span>
          Hapus pengikatan perangkat (Active Device ID) untuk peserta <strong>{studentName}</strong>? Siswa akan diizinkan login kembali menggunakan perangkat lain.
        </span>
      ),
      confirmText: 'Ya, Reset Perangkat',
      variant: 'info',
      icon: Smartphone,
      onConfirm: () => {
        storageService.proctorResetStudentDevice(studentId);
        refreshData();
        showNotification(`Perangkat ${studentName} berhasil direset. Siswa kini bisa login kembali.`);
      },
    });
  };

  // Aksi Pengawas 2: Unlock Siswa (Konfirmasi Modern)
  const handleProctorUnlock = (attemptId, studentName) => {
    openConfirm({
      title: 'Buka Kunci Ujian (Unlock)?',
      message: (
        <span>
          Buka status terkunci siswa <strong>{studentName}</strong>? Status ujian akan dipulihkan menjadi <strong>SEDANG MENGERJAKAN</strong> sehingga siswa dapat melanjutkan lembar ujian.
        </span>
      ),
      confirmText: 'Ya, Buka Kunci',
      variant: 'success',
      icon: Unlock,
      onConfirm: () => {
        storageService.proctorUnlockAttempt(attemptId);
        refreshData();
        showNotification(`Status ujian ${studentName} berhasil dibuka (UNLOCKED).`);
      },
    });
  };

  // Aksi Pengawas 3: Reset Jawaban (Konfirmasi Modern)
  const handleProctorResetAnswer = (attemptId, studentName) => {
    openConfirm({
      title: 'Reset Lembar Jawaban Siswa?',
      message: (
        <span>
          Reset jawaban untuk peserta <strong>{studentName}</strong>? Status pengerjaan akan diubah menjadi <strong>RESET_BY_PROCTOR</strong> dan soal akan muncul kembali di beranda siswa jika jawaban mereka belum masuk Google Sheets.
        </span>
      ),
      confirmText: 'Ya, Reset Jawaban',
      variant: 'danger',
      icon: RotateCcw,
      onConfirm: () => {
        storageService.proctorResetAnswerAttempt(attemptId);
        refreshData();
        showNotification(`Jawaban ${studentName} direset. Soal kembali aktif di portal siswa.`);
      },
    });
  };

  // Handler Import Siswa
  const handleImportSubmit = (e) => {
    e.preventDefault();
    if (!importCsvText.trim()) {
      showNotification('Isi teks CSV terlebih dahulu.', 'error');
      return;
    }

    const lines = importCsvText.trim().split('\n');
    const parsedStudents = [];

    lines.forEach((line, idx) => {
      // Abaikan header jika ada
      if (idx === 0 && line.toLowerCase().includes('nisn')) return;
      const cols = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 2) {
        parsedStudents.push({
          nama: cols[0] || '',
          nisn: cols[1] || '',
          nis: cols[2] || '',
          kelas: cols[3] || '',
          tingkat: cols[4] || institution.allowed_grades[0] || 0,
          email: cols[5] || '',
        });
      }
    });

    if (parsedStudents.length === 0) {
      showNotification('Format data CSV tidak valid atau kosong.', 'error');
      return;
    }

    const count = storageService.importStudents(parsedStudents);
    setShowImportModal(false);
    setImportCsvText('');
    refreshData();
    showNotification(`Berhasil mengimpor ${count} siswa. Password awal otomatis diset ke NISN.`);
  };

  // Handler Tambah Siswa Manual
  const handleOpenAddModal = () => {
    setNewStudentForm({
      nama: '',
      nisn: '',
      nis: '',
      kelas: '',
      tingkat: institution?.allowed_grades?.[0] || 10,
      email: '',
      is_verified: true,
    });
    setShowAddStudentModal(true);
  };

  const handleAddStudentSubmit = (e) => {
    e.preventDefault();
    if (!newStudentForm.nama.trim() || !newStudentForm.nisn.trim()) {
      showNotification('Nama Siswa dan NISN wajib diisi.', 'error');
      return;
    }

    const res = storageService.addStudent(newStudentForm);
    if (res.success) {
      refreshData();
      setShowAddStudentModal(false);
      showNotification(
        `Siswa ${res.user.nama} (NISN: ${res.user.nisn}) berhasil ditambahkan. Status SSO awal: OFF.`
      );
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Handler Edit Akun Siswa (jika email di-update dan berbeda dengan sebelumnya maka status SSO off)
  const handleOpenEditModal = (student) => {
    setEditingStudent({
      ...student,
      original_email: student.email || '',
    });
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = (e) => {
    e.preventDefault();
    if (!editingStudent.nama.trim() || !editingStudent.nisn.trim()) {
      showNotification('Nama Siswa dan NISN tidak boleh kosong.', 'error');
      return;
    }

    const res = storageService.updateStudent(editingStudent.id, editingStudent);
    if (res.success) {
      refreshData();
      setShowEditStudentModal(false);
      if (res.emailChanged) {
        showNotification(
          `Data ${res.user.nama} diperbarui. Karena email diubah, status SSO Google otomatis direset ke OFF (siswa harus login ulang lewat Google SSO).`,
          'success'
        );
      } else {
        showNotification(`Data peserta ${res.user.nama} berhasil diperbarui.`);
      }
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Handler Reset Password Siswa ke Default NIS (Konfirmasi Modern)
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
            Siswa dapat langsung login ke portal ujian menggunakan NISN dan Password NIS default ini.
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

  // Handler Reset Google SSO Siswa (Konfirmasi Modern)
  const handleResetStudentSSO = (student) => {
    const isCurrentlyLinked = Boolean(student.google_linked && student.google_id);

    openConfirm({
      title: isCurrentlyLinked ? 'Putuskan Tautan Google SSO?' : 'Reset Status Google SSO Siswa?',
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
            <div className="flex justify-between text-[11px] text-zinc-600 pt-1 border-t border-blue-100">
              <span>Password Default:</span>
              <span className="font-mono font-bold text-zinc-900">{student.nis || student.nisn}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500">
            Aksi ini memastikan tautan Google SSO dicabut dan password dikembalikan ke <strong>NIS ({student.nis || student.nisn})</strong> agar siswa dapat login via NISN/NIS biasa. (Kebijakan: Reset wajib dilaporkan siswa ke admin/proktor).
          </p>
        </div>
      ),
      confirmText: isCurrentlyLinked ? 'Ya, Putus Tautan SSO' : 'Ya, Pastikan Reset SSO',
      variant: 'info',
      icon: Unlink,
      onConfirm: () => {
        try {
          storageService.resetStudentSSO(student.id);
          refreshData();
          showNotification(
            `Kredensial Google SSO untuk ${student.nama} berhasil direset. Siswa kini login dengan NISN & NIS.`
          );
        } catch (err) {
          showNotification(err.message, 'error');
        }
      },
    });
  };

  // Handler Hapus Siswa (Konfirmasi Modern)
  const handleDeleteStudent = (id, name) => {
    openConfirm({
      title: 'Hapus Data Peserta?',
      message: (
        <span>
          Apakah Anda yakin ingin menghapus data peserta <strong>"{name}"</strong>? Seluruh data akun, kredensial login, dan riwayat aktivitas ujian siswa ini akan dihapus dari sistem.
        </span>
      ),
      confirmText: 'Ya, Hapus Siswa',
      variant: 'danger',
      icon: Trash2,
      onConfirm: () => {
        storageService.deleteUser(id);
        refreshData();
        showNotification(`Peserta "${name}" berhasil dihapus.`);
      },
    });
  };

  // Simpan Kredensial Super Admin
  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    const adminId = adminForm.id || currentUser.id;
    const res = storageService.updateAdminProfile(adminId, adminForm);
    if (res.success) {
      refreshData();
      showNotification('Kredensial Super Admin berhasil diperbarui.');
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Simpan Kredensial Proktor Ujian (oleh Super Admin)
  const handleSaveProctorProfile = (e) => {
    e.preventDefault();
    const proctorId = proctorForm.id;
    const res = storageService.updateAdminProfile(proctorId, proctorForm);
    if (res.success) {
      refreshData();
      showNotification('Kredensial Akun Proktor berhasil diperbarui.');
    } else {
      showNotification(res.message, 'error');
    }
  };

  // Template CSV Siswa
  const sampleCsvContent = `nama,nisn,nis,kelas,tingkat,email
Ahmad Fauzi Ridwan,0058291021,22101,XII MIPA 1,12,ahmad.fauzi@student.sch.id
Siti Rahmawati Putri,0058291022,22102,XII MIPA 2,12,siti.rahma@student.sch.id
Bambang Pamungkas,0068291033,23101,XI IPS 1,11,bambang.p@student.sch.id
Dewi Lestari,0078291044,24101,X-1,10,dewi.lestari@student.sch.id`;

  const copySampleCsv = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Filter list data
  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.role === 'student' &&
      (u.nama.toLowerCase().includes(q) ||
        u.nisn.toLowerCase().includes(q) ||
        (u.kelas && u.kelas.toLowerCase().includes(q)))
    );
  });

  // Hitung jumlah sesi aktif vs bank soal
  const activeExamsCount = exams.filter((e) => !e.is_archived).length;
  const bankExamsCount = exams.filter((e) => e.is_archived).length;

  const filteredExams = exams.filter((e) => {
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
  });

  const filteredAttempts = attempts.filter((a) => {
    const q = proctorSearch.toLowerCase();
    return (
      (a.student_name && a.student_name.toLowerCase().includes(q)) ||
      (a.student_nisn && a.student_nisn.toLowerCase().includes(q)) ||
      (a.exam_title && a.exam_title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white">
      {/* Toast Alert */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${toast.type === 'error'
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
                  {activeTab === 'proctor' && 'Papan Kontrol Pengawas (Live)'}
                  {activeTab === 'users' && 'Basis Data Siswa & Import CSV'}
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
                ExamGuard v1.0 &bull; {institution.name} {institution.npsn ? `(NPSN: ${institution.npsn})` : ''} &bull; Terhubung ke Mode Penyimpanan Terpusat cPanel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
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
                    <span className="text-xs font-medium">Siswa Terdaftar</span>
                    <Users className="w-4 h-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 font-mono-num">
                    {users.filter((u) => u.role === 'student').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1">
                    {users.filter((u) => u.role === 'student' && u.is_active).length} siswa status aktif
                  </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-xl p-5 shadow-2xs">
                  <div className="flex items-center justify-between text-zinc-500 mb-2">
                    <span className="text-xs font-medium">Siswa Terkunci (Locked)</span>
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
                        Aktivitas sesi ujian dan status pengerjaan siswa secara real-time
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
                    <p className="text-xs font-medium text-zinc-600">Belum ada aktivitas ujian siswa saat ini.</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Siswa yang memulai tes akan otomatis muncul di sini secara real-time.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 text-zinc-400 font-medium">
                          <th className="py-2.5 px-3">Siswa</th>
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
                    <strong>Bank Soal (Arsip Master):</strong> Soal yang berada di tab ini disimpan sebagai draf/arsip dan <strong>tidak ditayangkan</strong> di beranda peserta ujian. Klik tombol <ArchiveRestore className="w-3.5 h-3.5 inline mx-1 text-emerald-600" /> <em>Aktifkan ke Sesi Ujian</em> pada kolom aksi untuk memunculkannya kembali ke jadwal siswa.
                  </div>
                </div>
              )}

              {/* Tabel Sesi Ujian / Bank Soal */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                        <th className="py-3.5 px-4">Mata Pelajaran & Judul Ujian</th>
                        <th className="py-3.5 px-4">Kelompok Sesi</th>
                        <th className="py-3.5 px-4">Token Soal</th>
                        <th className="py-3.5 px-4">Durasi</th>
                        <th className="py-3.5 px-4">{examSubTab === 'bank' ? 'Asal Jadwal' : 'Jadwal Sesi'}</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-12 text-zinc-400 text-xs">
                            {examSubTab === 'bank'
                              ? 'Tidak ada soal yang diarsipkan di Bank Soal.'
                              : 'Tidak ada sesi ujian aktif yang cocok dengan filter.'}
                          </td>
                        </tr>
                      ) : (
                        filteredExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {exam.subject || 'Mata Pelajaran Umum'}
                                </span>
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  {getGradeLabel(exam.grade_level)}
                                </span>
                              </div>
                              <div className="font-semibold text-zinc-900 text-sm">{exam.title}</div>
                              {exam.respon_base_url && (
                                <div className="mt-1">
                                  <a
                                    href={exam.respon_base_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1"
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

                            {/* Kolom 3: Token Soal (Klik untuk Salin ke Clipboard) */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                              <button
                                type="button"
                                onClick={() => handleCopyToken(exam.exam_token, exam.id)}
                                title="Klik untuk menyalin token ke clipboard"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold tracking-wider transition-all cursor-pointer group active:scale-95 ${copiedTokenId === exam.id
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                                    : 'bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 border-zinc-200/80 hover:border-zinc-300 shadow-2xs'
                                  }`}
                              >
                                <span>{exam.exam_token}</span>
                                {copiedTokenId === exam.id ? (
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400 group-hover:text-zinc-700 shrink-0 transition-colors" />
                                )}
                              </button>
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
                                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                                  Diarsipkan (Bank Soal)
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    storageService.toggleExamActive(exam.id);
                                    refreshData();
                                  }}
                                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all cursor-pointer ${exam.is_active
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                      : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                                    }`}
                                >
                                  {exam.is_active ? 'Aktif (Tayang)' : 'Non-Aktif / Draf'}
                                </button>
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

          {/* TAB 3: KONTROL PENGAWAS (PROCTOR) */}
          {activeTab === 'proctor' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-zinc-200/80 rounded-xl shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Pemantauan Langsung Aktivitas Siswa
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Gunakan 3 tombol aksi pengawas untuk menangani kendala teknis atau kecurangan siswa.
                  </p>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={proctorSearch}
                    onChange={(e) => setProctorSearch(e.target.value)}
                    placeholder="Filter nama siswa atau NISN..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>
              </div>

              {/* Tabel Pengawas */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                        <th className="py-3.5 px-4">Nama Siswa & NISN</th>
                        <th className="py-3.5 px-4">Ujian & Kelas</th>
                        <th className="py-3.5 px-4">Status Pengerjaan</th>
                        <th className="py-3.5 px-4">Waktu Aktual</th>
                        <th className="py-3.5 px-4">Pelanggaran</th>
                        <th className="py-3.5 px-4 text-center">3 Aksi Pengawas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredAttempts.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-zinc-400 text-xs">
                            Belum ada siswa yang memulai ujian dalam catatan sistem.
                          </td>
                        </tr>
                      ) : (
                        filteredAttempts.map((att) => {
                          const conf = ATTEMPT_STATUS[att.status] || ATTEMPT_STATUS.IN_PROGRESS;
                          return (
                            <tr key={att.id} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-zinc-900">{att.student_name}</div>
                                <div className="text-[11px] text-zinc-400 font-mono">
                                  NISN: {att.student_nisn}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-medium text-zinc-800">{att.exam_title}</div>
                                <div className="text-[11px] text-zinc-400">
                                  {att.student_kelas || 'Kelas Siswa'}
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${conf.badgeClass}`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${conf.dotClass}`}></span>
                                  {conf.label}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 font-mono font-medium text-zinc-700">
                                {formatDuration(att.time_spent_seconds)}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1 font-mono font-bold">
                                  <span
                                    className={
                                      att.violation_count > 0 ? 'text-rose-600' : 'text-zinc-500'
                                    }
                                  >
                                    {att.violation_count}x
                                  </span>
                                </div>
                                {att.last_violation_reason && (
                                  <div className="text-[10px] text-rose-500 max-w-[140px] truncate" title={att.last_violation_reason}>
                                    {att.last_violation_reason}
                                  </div>
                                )}
                              </td>

                              {/* 3 Tombol Aksi Pengawas */}
                              <td className="py-3.5 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      handleProctorResetLogin(att.student_id, att.student_name)
                                    }
                                    title="Aksi 1: Hapus kunci active_device_id siswa agar bisa login di perangkat lain"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-medium text-zinc-700 transition-all shadow-2xs"
                                  >
                                    <Smartphone className="w-3 h-3 text-zinc-500" />
                                    <span>Reset Login</span>
                                  </button>

                                  <button
                                    onClick={() => handleProctorUnlock(att.id, att.student_name)}
                                    disabled={att.status !== 'LOCKED'}
                                    title="Aksi 2: Buka kunci siswa yang berstatus LOCKED karena pelanggaran"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all shadow-2xs ${att.status === 'LOCKED'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 font-semibold'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                                      }`}
                                  >
                                    <Unlock className="w-3 h-3" />
                                    <span>Unlock</span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleProctorResetAnswer(att.id, att.student_name)
                                    }
                                    disabled={att.status !== 'COMPLETED'}
                                    title="Aksi 3: Ubah status COMPLETED jadi RESET_BY_PROCTOR agar soal muncul kembali di beranda siswa jika jawaban belum masuk Sheets"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all shadow-2xs ${att.status === 'COMPLETED'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 font-semibold'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
                                      }`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Reset Jawaban</span>
                                  </button>
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

          {/* TAB 4: BASIS DATA SISWA & IMPORT CSV */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Cari siswa nama, NISN, atau kelas..."
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
                    <span>Import Siswa (CSV/Excel)</span>
                  </button>
                </div>
              </div>

              {/* Tabel Siswa */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                        <th className="py-3.5 px-4 text-center w-12">No</th>
                        <th className="py-3.5 px-4">Nama Siswa</th>
                        <th className="py-3.5 px-4">NISN & NIS</th>
                        <th className="py-3.5 px-4">Kelas & Tingkat</th>
                        <th className="py-3.5 px-4">Kunci Perangkat</th>
                        <th className="py-3.5 px-4 text-center">Status SSO Google</th>
                        <th className="py-3.5 px-4 text-center">Status Akun</th>
                        <th className="py-3.5 px-4 text-center">Verifikasi</th>
                        <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center py-12 text-zinc-400 text-xs">
                            Tidak ada siswa yang ditemukan.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((stu, index) => (
                          <tr key={stu.id} className="hover:bg-zinc-50/80 transition-colors">
                            {/* Kolom 1: No */}
                            <td className="py-3.5 px-4 text-center font-mono text-zinc-500 font-medium">
                              {index + 1}
                            </td>

                            {/* Kolom 2: Nama Siswa */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-zinc-900">{stu.nama}</div>
                              <div className="text-[11px] text-zinc-400">{stu.email}</div>
                            </td>

                            {/* Kolom 3: NISN & NIS */}
                            <td className="py-3.5 px-4 font-mono">
                              <div className="font-medium text-zinc-800">NISN: {stu.nisn}</div>
                              <div className="text-[11px] text-zinc-400">NIS: {stu.nis || '-'}</div>
                            </td>

                            {/* Kolom 4: Kelas & Tingkat */}
                            <td className="py-3.5 px-4">
                              <div className="font-medium text-zinc-800">{stu.kelas}</div>
                              <div className="text-[11px] text-zinc-500">
                                {getGradeLabel(stu.tingkat)}
                              </div>
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
                                    title="Reset Perangkat Siswa Ini"
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
                                    title="SSO Google Off: Siswa belum pernah login menggunakan Google SSO. Icon centang akan otomatis aktif (hijau) setelah siswa login lewat SSO dengan email terdaftar."
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
                                        'Siswa belum terverifikasi! Harap verifikasi siswa terlebih dahulu sebelum mengaktifkan akun.',
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
                                      ? 'Akun Terkunci: Wajib verifikasi siswa terlebih dahulu sebelum akun dapat diaktifkan'
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
                                        `Siswa ${stu.nama} berhasil diverifikasi. Akun sekarang dapat diaktifkan.`
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
                                      : 'Belum Terverifikasi (Klik untuk memverifikasi siswa)'
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
                                {/* Edit Akun */}
                                <button
                                  onClick={() => handleOpenEditModal(stu)}
                                  className="p-1.5 text-zinc-700 hover:text-zinc-950 bg-white hover:bg-zinc-100 rounded-lg border border-zinc-200 transition-colors cursor-pointer shadow-2xs"
                                  title="Edit Profil & Data Siswa"
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
                          <p className="text-[11px] text-zinc-500">Akses Operasional Ujian & Siswa</p>
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
              </div>
            ) : (
              <div className="p-8 bg-white border border-rose-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900">Akses Dibatasi Khusus Super Admin</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Menu Akun Administrator hanya dapat diakses dan dikelola oleh Super Admin. Akun Proktor hanya diperkenankan mengawasi pengerjaan ujian dan manajemen data siswa.
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
                          Logo akan ditampilkan di header aplikasi, portal login siswa, dan di tengah QR Code ujian.
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
                        <span>NPSN (8 Digit Angka)</span>
                        <span className="text-[10px] text-zinc-400 font-mono">Numerik</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{8}"
                        maxLength={8}
                        placeholder="Contoh: 20104829"
                        value={institution.npsn || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setInstitution({ ...institution, npsn: val });
                        }}
                        className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono tracking-wider focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                      />
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Nomor Pokok Sekolah Nasional resmi Kemendikbudristek (hanya angka).
                      </p>
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

                  {/* Idle Timeout */}
                  <div className="max-w-xs">
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
                      Siswa otomatis logout jika tidak ada interaksi selama batas waktu ini.
                    </p>
                  </div>
                </div>

                {/* FITUR 3: PENGATURAN GPS SEKOLAH (DENGAN SAKELAR ON/OFF CEK LOKASI) */}
                <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-3">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-5 h-5 text-zinc-700" />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Geofencing GPS Lokasi Sekolah (Haversine Formula)
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Atur apakah siswa wajib berada di area fisik sekolah saat mengikuti ujian.
                        </p>
                      </div>
                    </div>

                    {/* Sakelar ON / OFF Cek Lokasi Login Ujian */}
                    <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-1.5 px-3 rounded-xl shrink-0">
                      <span className="text-xs font-medium text-zinc-700">
                        {institution.gps_enabled ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Cek Lokasi: AKTIF
                          </span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                            Cek Lokasi: NON-AKTIF
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={institution.gps_enabled}
                        onClick={() => {
                          const nextStatus = !institution.gps_enabled;
                          const updated = {
                            ...institution,
                            gps_enabled: nextStatus,
                          };
                          setInstitution(updated);
                          storageService.updateInstitution(updated);
                          showNotification(
                            nextStatus
                              ? 'Pemeriksaan lokasi GPS berhasil diaktifkan.'
                              : 'Pemeriksaan lokasi GPS dinonaktifkan (Ujian Bebas Lokasi).'
                          );
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${institution.gps_enabled ? 'bg-emerald-600' : 'bg-zinc-300 hover:bg-zinc-400'
                          }`}
                        title={
                          institution.gps_enabled
                            ? 'Klik untuk mematikan validasi lokasi GPS'
                            : 'Klik untuk mengaktifkan validasi lokasi GPS'
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${institution.gps_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Banner Status GPS ON/OFF */}
                  {!institution.gps_enabled ? (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pemeriksaan Lokasi Dinonaktifkan:</strong> Siswa diizinkan login dan mengerjakan ujian dari mana saja tanpa validasi jarak radius GPS.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pemeriksaan Lokasi Aktif:</strong> Siswa hanya dapat membuka beranda ujian jika berada di dalam radius toleransi dari koordinat sekolah.
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
                        onChange={(e) =>
                          setInstitution({ ...institution, center_lat: parseFloat(e.target.value) || 0 })
                        }
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
                        onChange={(e) =>
                          setInstitution({ ...institution, center_lng: parseFloat(e.target.value) || 0 })
                        }
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
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>Posisi Saya</span>
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="20"
                          max="5000"
                          required
                          value={institution.max_radius_meters}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              max_radius_meters: parseInt(e.target.value, 10) || 100,
                            })
                          }
                          className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono-num focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-16"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 pointer-events-none">
                          meter
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Preview Peta Geofence Interaktif (OpenStreetMap & Leaflet) */}
                  <div className="pt-2 border-t border-zinc-100">
                    <GeofenceMapPreview
                      lat={institution.center_lat}
                      lng={institution.center_lng}
                      radius={institution.max_radius_meters}
                      institutionName={institution.name}
                      onLocationChange={(newLat, newLng) => {
                        const gmaps = `https://maps.google.com/?q=${newLat},${newLng}`;
                        const updated = {
                          ...institution,
                          center_lat: newLat,
                          center_lng: newLng,
                          gmaps_url: gmaps,
                        };
                        setInstitution(updated);
                        setGmapsInput(gmaps);
                        storageService.updateInstitution(updated);
                        showNotification(`Koordinat GPS diperbarui: ${newLat}, ${newLng}`);
                      }}
                      onRadiusChange={(newRadius) => {
                        const updated = {
                          ...institution,
                          max_radius_meters: newRadius,
                        };
                        setInstitution(updated);
                        storageService.updateInstitution(updated);
                        showNotification(`Radius toleransi diubah ke ${newRadius} meter.`);
                      }}
                    />
                  </div>
                </div>

                {/* FITUR 4: METODE AUTENTIKASI & KEAMANAN GOOGLE */}
                <div className="space-y-5">
                  {/* 1. KARTU GOOGLE OAUTH 2.0 & WORKSPACE SSO */}
                  <div
                    className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${institution.google_oauth_enabled
                        ? 'border-blue-200/90 ring-1 ring-blue-100'
                        : 'border-zinc-200/80'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${institution.google_oauth_enabled
                              ? 'bg-blue-50/80 border border-blue-200/90 shadow-2xs ring-4 ring-blue-50/60'
                              : 'bg-zinc-100 border border-zinc-200'
                            }`}
                        >
                          <GoogleBrandIcon
                            className="w-6 h-6"
                            active={institution.google_oauth_enabled}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900">
                              Google OAuth 2.0 & Workspace SSO
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Single Sign-On (SSO) akun Google resmi (
                            <span className="font-mono text-zinc-600">@sekolah.sch.id</span>)
                          </p>
                        </div>
                      </div>

                      {/* Sakelar ON / OFF & Status Koneksi Google OAuth */}
                      <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-1.5 px-3 rounded-xl shrink-0">
                        <span className="text-xs font-medium">
                          {institution.google_oauth_enabled ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              OAuth: TERHUBUNG (ON)
                            </span>
                          ) : (
                            <span className="text-zinc-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                              OAuth: TERPUTUS (OFF)
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={institution.google_oauth_enabled}
                          onClick={handleToggleGoogleOAuth}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${institution.google_oauth_enabled ? 'bg-emerald-600' : 'bg-zinc-300 hover:bg-zinc-400'
                            }`}
                          title={
                            institution.google_oauth_enabled
                              ? 'Klik untuk mematikan Google OAuth SSO'
                              : 'Klik untuk mengaktifkan Google OAuth SSO'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${institution.google_oauth_enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Banner status koneksi Google OAuth */}
                    {!institution.google_oauth_enabled ? (
                      <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Integrasi Google OAuth Nonaktif:</strong> Tombol Google SSO
                          disembunyikan di halaman login siswa. Siswa dapat login menggunakan nomor{' '}
                          <strong>NISN & Password NIS</strong>.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Integrasi Google OAuth Terhubung:</strong> Siswa yang telah
                          menautkan akun dapat masuk 1-klik via SSO Google. Kredensial Client ID &
                          Client Secret aktif memvalidasi akun.
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                      <div>
                        <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                          Metode Login Siswa yang Diizinkan
                        </label>
                        <select
                          value={institution.auth_method}
                          disabled={!institution.google_oauth_enabled}
                          onChange={(e) =>
                            setInstitution({ ...institution, auth_method: e.target.value })
                          }
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none ${!institution.google_oauth_enabled
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                              : 'bg-white border-zinc-300'
                            }`}
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
                          Google OAuth Client ID
                        </label>
                        <input
                          type="text"
                          disabled={!institution.google_oauth_enabled}
                          value={institution.google_client_id || ''}
                          onChange={(e) =>
                            setInstitution({ ...institution, google_client_id: e.target.value })
                          }
                          placeholder="842918239012-xxx.apps.googleusercontent.com"
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none ${!institution.google_oauth_enabled
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                              : 'bg-white border-zinc-300'
                            }`}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Google OAuth Client Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showGoogleSecret ? 'text' : 'password'}
                          disabled={!institution.google_oauth_enabled}
                          value={institution.google_client_secret || ''}
                          onChange={(e) =>
                            setInstitution({
                              ...institution,
                              google_client_secret: e.target.value,
                            })
                          }
                          placeholder="GOCSPX-xxxxxxxxxxxxx"
                          className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10 ${!institution.google_oauth_enabled
                              ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                              : 'bg-white border-zinc-300'
                            }`}
                        />
                        <button
                          type="button"
                          disabled={!institution.google_oauth_enabled}
                          onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 disabled:opacity-30 cursor-pointer"
                        >
                          {showGoogleSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. KARTU GOOGLE RECAPTCHA V2 */}
                  <div
                    className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all ${institution.recaptcha_enabled
                        ? 'border-emerald-200/90 ring-1 ring-emerald-100'
                        : 'border-zinc-200/80'
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${institution.recaptcha_enabled
                              ? 'bg-blue-50/80 border border-blue-200/90 shadow-2xs ring-4 ring-blue-50/60'
                              : 'bg-zinc-100 border border-zinc-200'
                            }`}
                        >
                          <RecaptchaBrandIcon
                            className="w-6 h-6"
                            active={institution.recaptcha_enabled}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-zinc-900">
                              Google reCAPTCHA v2 Protection
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Proteksi kotak centang "Saya bukan robot" untuk keamanan login ujian
                          </p>
                        </div>
                      </div>

                      {/* Sakelar ON / OFF & Status Proteksi reCAPTCHA */}
                      <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 p-1.5 px-3 rounded-xl shrink-0">
                        <span className="text-xs font-medium">
                          {institution.recaptcha_enabled ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Proteksi: AKTIF (ON)
                            </span>
                          ) : (
                            <span className="text-zinc-500 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                              Proteksi: NONAKTIF (OFF)
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={institution.recaptcha_enabled}
                          onClick={handleToggleRecaptcha}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${institution.recaptcha_enabled ? 'bg-emerald-600' : 'bg-zinc-300 hover:bg-zinc-400'
                            }`}
                          title={
                            institution.recaptcha_enabled
                              ? 'Klik untuk mematikan Google reCAPTCHA'
                              : 'Klik untuk mengaktifkan Google reCAPTCHA'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${institution.recaptcha_enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Banner status reCAPTCHA */}
                    {!institution.recaptcha_enabled ? (
                      <div className="mt-4 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Verifikasi Bot Dinonaktifkan:</strong> Halaman login tidak
                          menampilkan checklist reCAPTCHA v2. Pengguna dapat langsung login tanpa
                          verifikasi robot.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Proteksi Bot Aktif:</strong> Setiap siswa dan administrator wajib
                          menyelesaikan checklist "Saya bukan robot" sebelum formulir login
                          diproses.
                        </div>
                      </div>
                    )}

                    {institution.recaptcha_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                            reCAPTCHA Site Key
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
                            placeholder="6LeIx0aUAAAAAExampleKey..."
                            className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                            reCAPTCHA Secret Key
                          </label>
                          <input
                            type="password"
                            value={institution.recaptcha_secret_key || ''}
                            onChange={(e) =>
                              setInstitution({
                                ...institution,
                                recaptcha_secret_key: e.target.value,
                              })
                            }
                            placeholder="6LeIx0aUAAAAASecret..."
                            className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* FITUR 5: PANDUAN & STATUS DEPLOYMENT KE HOSTING CPANEL (KHUSUS SUPER ADMIN) */}
                {/* FITUR 5: PENGATURAN CEKLIST IZIN PERAMBAN & DUKUNGAN PERANGKAT (PRE-FLIGHT CHECKS) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Pengaturan Ceklis Izin Browser Siswa (Pre-Flight Checks)
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Tentukan izin apa saja yang wajib diperiksa & dipenuhi siswa saat login dan sebelum soal ujian dibuka.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-medium border border-zinc-200">
                        <Smartphone className="w-3 h-3 text-zinc-600" />
                        <span>HP / Ponsel</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-medium border border-zinc-200">
                        <Laptop className="w-3 h-3 text-zinc-600" />
                        <span>Laptop / PC</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Ceklis di bawah ini secara dinamis menentukan pemeriksaan pada halaman <strong>Pre-Flight Siswa</strong>. Izin yang dicentang (ON) akan menjadi syarat wajib sebelum siswa dapat masuk ke beranda atau membuka soal.
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
                            Memverifikasi koordinat siswa berada dalam radius geofencing sekolah ({institution.max_radius_meters}m).
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
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android via Web Notification">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop / PC">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Meminta izin Notification API untuk memunculkan peringatan sistem darurat jika siswa melanggar aturan.
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
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP Android via Chrome Fullscreen">
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

                    {/* Item 5: Login Akun Google */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
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
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Memastikan siswa wajib masuk dengan akun Google resmi sekolah sebelum diizinkan mengakses soal.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.google_sso)}
                        onClick={() => handleToggleBrowserPermission('google_sso', 'Login Akun Google (Wajib SSO)')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.google_sso ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.google_sso ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

                    {/* Item 6: Block Clipboard */}
                    <div className="p-4 rounded-xl border border-zinc-200/90 bg-zinc-50/50 hover:bg-zinc-50 transition-colors flex items-start justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-indigo-100/70 text-indigo-700 shrink-0 mt-0.5">
                          <ClipboardCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-zinc-900">
                              6. Block Clipboard (Sanitizer)
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Membersihkan papan klip dari teks bocoran jawaban dan memblokir shortcut tombol salin-tempel (Ctrl+C/V).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={Boolean(institution.browser_permissions?.block_clipboard)}
                        onClick={() => handleToggleBrowserPermission('block_clipboard', 'Block Clipboard')}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-2xs mt-1 ${institution.browser_permissions?.block_clipboard ? 'bg-emerald-500' : 'bg-zinc-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${institution.browser_permissions?.block_clipboard ? 'translate-x-4' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>

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
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di HP via Kamera Depan">
                              <Smartphone className="w-2.5 h-2.5" /> HP
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white text-zinc-600 text-[9px] font-medium border border-zinc-200" title="Didukung di Laptop via Webcam">
                              <Laptop className="w-2.5 h-2.5" /> Laptop
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                            Meminta izin sensor kamera depan dan audio peramban untuk pengawasan kejujuran ujian siswa.
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
                </div>

                {/* FITUR 6: PANDUAN & STATUS DEPLOYMENT KE HOSTING CPANEL (KHUSUS SUPER ADMIN) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900">
                          Panduan & Pengaturan Pemasangan Aplikasi di cPanel
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Khusus Super Admin &bull; Standar Apache/LiteSpeed, file .htaccess & perizinan SSL/GPS
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto font-mono">
                      Siap Deploy cPanel (.zip)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                    <p className="font-semibold text-xs mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Konfigurasi Vite & .htaccess Sudah 100% Sesuai Standar cPanel
                    </p>
                    <p className="text-[11px] leading-relaxed text-emerald-700">
                      Proyek ExamGuard telah dikonfigurasi dengan <code className="font-mono bg-emerald-100/80 px-1 rounded">base: './'</code> (jalur relatif) dan berkas <code className="font-mono bg-emerald-100/80 px-1 rounded">public/.htaccess</code> yang menyertakan rewrite fallback ke <code className="font-mono bg-emerald-100/80 px-1 rounded">index.html</code> (mencegah error 404 saat refresh) serta pemaksaan protokol HTTPS.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs text-zinc-700">
                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Jalankan Build Produksi</h4>
                        <p className="text-zinc-600 text-[11px] mt-0.5">
                          Jalankan perintah build di terminal lokal direktori proyek:
                        </p>
                        <code className="block bg-zinc-900 text-zinc-100 p-2.5 rounded-lg font-mono text-[11px] mt-1.5">
                          npm run build
                        </code>
                        <p className="text-zinc-500 text-[11px] mt-1">
                          Folder <code className="font-mono">dist/</code> akan terbentuk berisi file <code className="font-mono">index.html</code>, folder <code className="font-mono">assets/</code>, dan file <code className="font-mono">.htaccess</code>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Ambil Berkas Arsip ZIP Siap Pakai</h4>
                        <p className="text-zinc-600 text-[11px] mt-0.5">
                          Sistem telah menyediakan berkas paket siap unggah: <code className="font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">examguard-cpanel-ready.zip</code> di direktori root aplikasi yang memuat seluruh aset produksi beserta <code className="font-mono">.htaccess</code>.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Unggah ke File Manager cPanel Hosting</h4>
                        <div className="text-zinc-600 text-[11px] mt-0.5 space-y-1">
                          <div>&bull; Buka cPanel hosting sekolah Anda &rarr; Pilih menu <strong>File Manager</strong>.</div>
                          <div>&bull; Masuk ke direktori target: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">public_html</code> (untuk domain utama) atau folder subdomain (contoh: <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded">public_html/ujian</code>).</div>
                          <div>&bull; Klik <strong>Upload</strong> lalu unggah berkas <code className="font-mono">examguard-cpanel-ready.zip</code>.</div>
                          <div>&bull; Klik kanan berkas ZIP tersebut di cPanel &rarr; pilih <strong>Extract</strong> (Ekstrak di folder yang sama).</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Pastikan File Tersembunyi (.htaccess) Terbaca</h4>
                        <p className="text-zinc-600 text-[11px] mt-0.5">
                          Di pojok kanan atas File Manager cPanel, klik menu <strong>Settings</strong> &rarr; Centang opsi <strong>"Show Hidden Files (dotfiles)"</strong> &rarr; Simpan. Pastikan berkas <code className="font-mono font-medium">.htaccess</code> terlihat dan berada di direktori aplikasi.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        5
                      </span>
                      <div>
                        <h4 className="font-semibold text-zinc-900">Wajibkan Sertifikat SSL (HTTPS)</h4>
                        <p className="text-zinc-600 text-[11px] mt-0.5">
                          Peramban modern (Chrome, Edge, Safari) memblokir izin GPS Geolocation, Kamera pengawas, dan Mikrofon jika website berjalan di HTTP tanpa enkripsi. Pastikan fitur SSL cPanel (Let's Encrypt / AutoSSL) aktif untuk domain atau subdomain ujian Anda.
                        </p>
                      </div>
                    </div>
                  </div>
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
                        Berkas cadangan mencakup identitas instansi, NPSN, seluruh sesi ujian Google Form, daftar siswa & NISN/NIS, riwayat pengerjaan, serta setelan integrasi Google & koordinat GPS.
                      </p>

                      {/* Security Alert: Data Penting Terenkripsi */}
                      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-950 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-blue-900">
                          <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>Enkripsi Kredensial Otomatis:</span>
                        </div>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          Kata sandi administrator, password seluruh siswa, <strong>Google Client Secret</strong>, dan <strong>reCAPTCHA Secret Key</strong> dienkripsi secara ketat menggunakan algoritma <strong>AES-256-GCM</strong>. Data tersebut tidak akan terbaca secara polos di dalam file cadangan.
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
                                {restorePreview.summary?.students_count || 0} Siswa
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
                      ExamGuard Proctoring WebApp
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-mono font-semibold">
                      v1.0.0
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto leading-relaxed">
                    Sistem Pengawasan Ujian Berbasis Web Mandiri untuk Google Form dengan Proteksi Anti-Curang, GPS Geofencing, Google Workspace SSO, dan Kontrol Pengawas Real-Time.
                  </p>
                </div>

                {/* Badges Info */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                    ✓ Stable Production Ready
                  </span>
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                    ⚡ 100% Client-Side cPanel SPA
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                    🛡️ AES-256-GCM Secure Backup
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-200 text-xs font-medium">
                    📄 Lisensi MIT
                  </span>
                </div>
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
                    ExamGuard dirancang khusus untuk memecahkan kelemahan pelaksanaan ujian Google Form standar dengan mengisolasi lingkungan peramban siswa:
                  </p>
                  <ul className="text-xs text-zinc-600 space-y-2 list-disc list-inside">
                    <li><strong>Auto-Lock Screen:</strong> Penguncian seketika jika siswa beralih tab browser atau keluar dari mode Fullscreen.</li>
                    <li><strong>GPS Geofencing:</strong> Pembatasan pengerjaan ujian hanya dalam radius koordinat instansi/sekolah (Haversine formula).</li>
                    <li><strong>Single Sign-On (SSO):</strong> Integrasi Google Workspace resmi sekolah dengan proteksi bot Google reCAPTCHA v2.</li>
                    <li><strong>Role-Based Access Control:</strong> Pemisahan peran Super Admin (kelola instansi & akun) dan Proktor Ujian (monitoring live).</li>
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
                      <span className="font-semibold text-zinc-900 font-mono">1.0.0 (Build 2026.11)</span>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <span className="text-zinc-500">Frontend Engine</span>
                      <span className="font-semibold text-zinc-900">React 19 & Vite 6</span>
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
                      <span className="font-semibold text-zinc-900">Apache / LiteSpeed / Nginx</span>
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
                      <span>ExamGuard Architecture & Development Team</span>
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
                      Kode sumber resmi ExamGuard tersedia secara terbuka di GitHub. Anda dapat memantau pembaruan, rilis versi, dan kontribusi pengembangan:
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
                    defaultValue={editingExam?.subject || 'Matematika Wajib'}
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
                  Judul Sesi Ujian <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingExam?.title || ''}
                  placeholder="Contoh: Penilaian Akhir Semester - Matematika Wajib"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Deskripsi / Petunjuk Ujian</label>
                <textarea
                  name="description"
                  rows="2"
                  defaultValue={editingExam?.description || ''}
                  placeholder="Petunjuk pengerjaan bagi siswa..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">
                    Tingkat Kelas Sasaran ({institution.education_level})
                  </label>
                  <select
                    name="grade_level"
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
                  <label className="block font-medium text-zinc-700 mb-1">Durasi Pengerjaan (Menit)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    min="5"
                    max="300"
                    required
                    defaultValue={editingExam?.duration_minutes || 90}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  URL Pengisian Google Form (Wajib berakhiran /viewform?embedded=true)
                </label>
                <input
                  type="url"
                  name="gform_base_url"
                  required
                  defaultValue={
                    editingExam?.gform_base_url ||
                    'https://docs.google.com/forms/d/e/1FAIpQLSc6Z-sample-math-exam/viewform?embedded=true'
                  }
                  placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-[11px] focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                />
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-zinc-700">
                      Token Soal (6 Digit) <span className="text-rose-500">*</span>
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
                    required
                    maxLength={6}
                    value={examTokenValue}
                    onChange={(e) =>
                      setExamTokenValue(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                      )
                    }
                    placeholder="PASMTK"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono font-bold tracking-widest uppercase focus:ring-2 focus:ring-zinc-900 focus:outline-none text-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Standar 6 karakter huruf kapital/angka</p>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Mulai Sesi</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    defaultValue={editingExam?.start_time || '2026-11-11T07:30'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px] focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Selesai Sesi</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    defaultValue={editingExam?.end_time || '2026-11-11T16:00'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px] focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
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
                    Aktifkan Sesi Ini (Tampilkan di Beranda Siswa yang sesuai tingkat kelas)
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
                    Simpan ke <strong>Bank Soal (Arsip)</strong> &mdash; Soal akan disimpan sebagai bank soal/draf dan disembunyikan dari siswa sampai diaktifkan kembali.
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

      {/* MODAL: IMPORT SISWA CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <h3 className="font-semibold text-zinc-900 text-sm">Import Data Siswa (CSV / Excel)</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-zinc-600 mb-3">
              Tempel (paste) data teks siswa dengan format kolom:{' '}
              <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-[11px]">
                nama, nisn, nis, kelas, tingkat (0-12), email
              </code>
              . Username dan Password awal siswa otomatis diset ke <strong>NISN</strong>.
            </p>

            <div className="mb-3 flex justify-between items-center">
              <span className="text-[11px] font-medium text-zinc-500">Contoh Format:</span>
              <button
                type="button"
                onClick={copySampleCsv}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedText ? 'Tersalin!' : 'Salin Contoh'}</span>
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows="7"
                required
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="nama,nisn,nis,kelas,tingkat,email&#10;Ahmad Fauzi,0058291021,22101,XII MIPA 1,12,ahmad@student.sch.id"
                className="w-full p-3 border border-zinc-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
              ></textarea>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs"
                >
                  Proses Import Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH PESERTA MANUAL */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95">
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
                onClick={() => setShowAddStudentModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.nama}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, nama: e.target.value })
                    }
                    placeholder="Contoh: Muhammad Rizky Pratama"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    NISN (Nomor Induk Siswa Nasional) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentForm.nisn}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, nisn: e.target.value })
                    }
                    placeholder="Contoh: 0078192031"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Otomatis jadi Username & Password awal
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    NIS (Nomor Induk Sekolah)
                  </label>
                  <input
                    type="text"
                    value={newStudentForm.nis}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, nis: e.target.value })
                    }
                    placeholder="Contoh: 23105 (Opsional)"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Alamat Email Siswa <span className="text-zinc-400 font-normal">(Untuk Google SSO)</span>
                  </label>
                  <input
                    type="email"
                    value={newStudentForm.email}
                    onChange={(e) =>
                      setNewStudentForm({ ...newStudentForm, email: e.target.value })
                    }
                    placeholder="nama.siswa@student.sch.id"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Status SSO awal adalah <strong>SSO Off</strong>. Centang hijau akan otomatis aktif setelah siswa login SSO dengan email ini.
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
                    Verifikasi siswa ini langsung (Akun aktif dan siap digunakan ujian)
                  </span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 animate-in zoom-in-95">
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
                onClick={() => setShowEditStudentModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Nama Lengkap Siswa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nama}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nama: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    NISN (Username Akun) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nisn}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nisn: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    NIS (Nomor Induk Sekolah)
                  </label>
                  <input
                    type="text"
                    value={editingStudent.nis || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nis: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
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

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Alamat Email Siswa <span className="text-zinc-400 font-normal">(Akun Google SSO)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editingStudent.email}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />

                  {/* Deteksi jika email diubah */}
                  {editingStudent.email.trim().toLowerCase() !==
                    (editingStudent.original_email || '').trim().toLowerCase() && (
                      <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-[11px] leading-relaxed">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Perhatian Perubahan Email:</strong>
                          <p className="mt-0.5">
                            Alamat email diubah dari <code className="font-mono bg-amber-100/70 px-1 rounded">{editingStudent.original_email || '-'}</code> menjadi <code className="font-mono bg-amber-100/70 px-1 rounded">{editingStudent.email}</code>.
                          </p>
                          <p className="mt-0.5 font-medium text-amber-900">
                            Sesuai aturan sistem, status Google SSO akan <strong>otomatis OFF</strong> (ID Google tersimpan akan dihapus). Siswa harus login ulang lewat Google SSO dengan email baru ini.
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

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 shadow-xs cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
