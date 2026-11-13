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
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import {
  EDUCATION_LEVELS,
  AUTH_METHODS,
  ATTEMPT_STATUS,
  generateUUID,
  calculateHaversineDistance,
  formatDuration,
  getGradeLabel,
} from '../../constants/educationConfig';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [institution, setInstitution] = useState(storageService.getInstitution());
  const [users, setUsers] = useState(storageService.getUsers());
  const [exams, setExams] = useState(storageService.getExamSessions());
  const [attempts, setAttempts] = useState(storageService.getAttempts());

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modals
  const [showCpanelModal, setShowCpanelModal] = useState(false);
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

  // Password visibility
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Admin Account Form
  const [adminForm, setAdminForm] = useState({
    username: currentUser?.username || 'admin',
    email: currentUser?.email || 'admin@examguard.sch.id',
    nama: currentUser?.nama || 'Administrator Utama',
    password: currentUser?.password || 'admin',
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

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  const refreshData = () => {
    setInstitution(storageService.getInstitution());
    setUsers(storageService.getUsers());
    setExams(storageService.getExamSessions());
    setAttempts(storageService.getAttempts());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Polling real-time pemantauan
    return () => clearInterval(interval);
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
    const updated = { ...institution, logo_url: null };
    setInstitution(updated);
    storageService.updateInstitution(updated);
    refreshData();
    showNotification('Logo instansi dihapus, kembali ke default.');
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
  };

  // Simpan Pengaturan Institusi
  const handleSaveInstitution = (e) => {
    e.preventDefault();
    storageService.updateInstitution(institution);
    refreshData();
    showNotification('Konfigurasi instansi berhasil disimpan.');
  };

  // Ambil Lokasi GPS Saat Ini
  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      showNotification('Peramban Anda tidak mendukung Geolocation GPS.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setInstitution((prev) => ({
          ...prev,
          center_lat: parseFloat(pos.coords.latitude.toFixed(6)),
          center_lng: parseFloat(pos.coords.longitude.toFixed(6)),
        }));
        showNotification('Koordinat GPS berhasil disesuaikan dengan posisi Anda.');
      },
      (err) => {
        showNotification(`Gagal membaca GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  // Handler Generate QR Code Ujian (Hitam-Putih dengan Logo Instansi di Tengah)
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
      const height = 740;
      canvas.width = width;
      canvas.height = height;

      // 1. Background Bersih Putih
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Bingkai Tipis Luar
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 3;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      // 3. Header: Judul Ujian & Tingkat
      ctx.textAlign = 'center';
      ctx.fillStyle = '#09090B';
      ctx.font = 'bold 22px Inter, sans-serif';

      // Bungkus teks judul ujian agar rapi jika panjang
      const words = exam.title.split(' ');
      let line = '';
      let y = 60;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > width - 80 && n > 0) {
          ctx.fillText(line, width / 2, y);
          line = words[n] + ' ';
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, y);

      // Tingkat Kelas
      y += 32;
      ctx.font = '600 16px Inter, sans-serif';
      ctx.fillStyle = '#52525B';
      ctx.fillText(getGradeLabel(exam.grade_level), width / 2, y);

      // Garis pemisah halus
      y += 18;
      ctx.strokeStyle = '#E4E4E7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(80, y);
      ctx.lineTo(width - 80, y);
      ctx.stroke();

      // 4. Generate QR Code hitam-putih
      const qrSize = 380;
      const qrX = (width - qrSize) / 2;
      const qrY = y + 25;

      const qrPayload = JSON.stringify({
        id: exam.id,
        title: exam.title,
        token: exam.exam_token,
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

      // 5. Logo Instansi di Tengah QR Code
      const badgeSize = 82;
      const badgeX = (width - badgeSize) / 2;
      const badgeY = qrY + (qrSize - badgeSize) / 2;

      // Gambar latar putih kotak badge dengan border hitam tipis
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(badgeX, badgeY, badgeSize, badgeSize);

      const finalizeCanvas = () => {
        // 6. Footer: Token & Instruksi
        const footY = qrY + qrSize + 45;
        ctx.font = 'bold 15px JetBrains Mono, monospace';
        ctx.fillStyle = '#18181B';
        ctx.fillText(`TOKEN: ${exam.exam_token}`, width / 2, footY);

        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillStyle = '#71717A';
        ctx.fillText(institution.name || 'ExamGuard Proctoring System', width / 2, footY + 24);

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
          // Fallback simbol jika gambar gagal dimuat
          ctx.fillStyle = '#09090B';
          ctx.font = 'bold 30px sans-serif';
          ctx.fillText('🛡️', width / 2, badgeY + 52);
          finalizeCanvas();
        };
        logoImg.src = institution.logo_url;
      } else {
        // Default emblem
        ctx.fillStyle = '#09090B';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('🛡️', width / 2, badgeY + 52);
        finalizeCanvas();
      }
    }, 150);
  };

  const handleDownloadQrPng = () => {
    if (!qrPngUrl || !qrExam) return;
    const link = document.createElement('a');
    link.download = `QR_${qrExam.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    link.href = qrPngUrl;
    link.click();
    showNotification('File QR Code PNG berhasil diunduh.');
  };

  // Handler Simpan / Edit Ujian
  const handleSaveExamSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const examData = {
      id: editingExam?.id || generateUUID(),
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      grade_level: parseInt(form.grade_level.value, 10),
      is_active: form.is_active.checked,
      gform_base_url: form.gform_base_url.value.trim(),
      respon_base_url: form.respon_base_url.value.trim(),
      exam_token: form.exam_token.value.trim(),
      start_time: form.start_time.value,
      end_time: form.end_time.value,
      duration_minutes: parseInt(form.duration_minutes.value, 10) || 60,
    };

    storageService.saveExamSession(examData);
    setShowExamModal(false);
    setEditingExam(null);
    refreshData();
    showNotification('Sesi ujian GForm berhasil disimpan.');
  };

  // Handler Hapus Ujian
  const handleDeleteExam = (id, title) => {
    if (window.confirm(`Yakin ingin menghapus sesi ujian "${title}"?`)) {
      storageService.deleteExamSession(id);
      refreshData();
      showNotification('Sesi ujian berhasil dihapus.');
    }
  };

  // Aksi Pengawas 1: Reset Login
  const handleProctorResetLogin = (studentId, studentName) => {
    storageService.proctorResetStudentDevice(studentId);
    refreshData();
    showNotification(`Perangkat ${studentName} berhasil direset. Siswa kini bisa login kembali.`);
  };

  // Aksi Pengawas 2: Unlock Siswa
  const handleProctorUnlock = (attemptId, studentName) => {
    storageService.proctorUnlockAttempt(attemptId);
    refreshData();
    showNotification(`Status ujian ${studentName} berhasil dibuka (UNLOCKED).`);
  };

  // Aksi Pengawas 3: Reset Jawaban
  const handleProctorResetAnswer = (attemptId, studentName) => {
    if (
      window.confirm(
        `Reset jawaban untuk ${studentName}? Status akan diubah menjadi RESET_BY_PROCTOR dan soal akan muncul kembali di beranda siswa.`
      )
    ) {
      storageService.proctorResetAnswerAttempt(attemptId);
      refreshData();
      showNotification(`Jawaban ${studentName} direset. Soal kembali aktif di portal siswa.`);
    }
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

  // Handler Hapus Siswa
  const handleDeleteStudent = (id, name) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus data peserta "${name}"? Seluruh data akun akan dihapus dari sistem.`
      )
    ) {
      storageService.deleteUser(id);
      refreshData();
      showNotification(`Peserta "${name}" berhasil dihapus.`);
    }
  };

  // Simpan Akun Admin
  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    const res = storageService.updateAdminProfile(currentUser.id, adminForm);
    if (res.success) {
      refreshData();
      showNotification('Profil & Kredensial Administrator berhasil diperbarui.');
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

  const filteredExams = exams.filter((e) => {
    const q = examSearch.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.exam_token.toLowerCase().includes(q);
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
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
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
        institutionLogo={institution?.logo_url}
        currentUser={currentUser}
        onLogout={onLogout}
        onOpenCpanelGuide={() => setShowCpanelModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {institution.logo_url && (
              <img
                src={institution.logo_url}
                alt="Logo Sekolah"
                className="w-8 h-8 rounded-lg object-contain bg-white border border-zinc-200 p-0.5 shrink-0"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 capitalize tracking-tight">
                {activeTab === 'overview' && 'Ringkasan Sistem & Pemantauan'}
                {activeTab === 'exams' && 'Bank Sesi Ujian Google Form'}
                {activeTab === 'proctor' && 'Papan Kontrol Pengawas (Live)'}
                {activeTab === 'users' && 'Basis Data Siswa & Import CSV'}
                {activeTab === 'account' && 'Pengaturan Akun Administrator'}
                {activeTab === 'institution' && 'Konfigurasi Instansi, Logo & GPS'}
              </h1>
              <p className="text-xs text-zinc-500">
                ExamGuard v1.0 &bull; Terhubung ke Mode Penyimpanan Terpusat cPanel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCpanelModal(true)}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 shadow-2xs transition-all duration-200"
            >
              <Server className="w-3.5 h-3.5 text-zinc-500" />
              <span>Panduan cPanel</span>
            </button>
            <div className="h-4 w-px bg-zinc-200 hidden sm:block"></div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>SYSTEM READY</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
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
                    {exams.filter((e) => e.is_active).length}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">
                    Dari total {exams.length} bank soal terdaftar
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

              {/* Quick Actions & Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-zinc-900">
                      Pemantauan Pengerjaan Ujian Terbaru
                    </h2>
                    <button
                      onClick={() => setActiveTab('proctor')}
                      className="text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                    >
                      Buka Papan Kontrol &rarr;
                    </button>
                  </div>

                  {attempts.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-zinc-200 rounded-lg">
                      <Shield className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500">Belum ada aktivitas ujian siswa saat ini.</p>
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
                          {attempts.slice(0, 5).map((att) => {
                            const conf = ATTEMPT_STATUS[att.status] || ATTEMPT_STATUS.IN_PROGRESS;
                            return (
                              <tr key={att.id} className="hover:bg-zinc-50/80">
                                <td className="py-3 px-3 font-medium text-zinc-900">
                                  {att.student_name}
                                  <div className="text-[11px] text-zinc-400 font-mono">
                                    {att.student_nisn}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-zinc-600 truncate max-w-[200px]">
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

                {/* Info Card Siap cPanel */}
                <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-800 text-[11px] font-medium text-emerald-400 border border-zinc-700 mb-4">
                      <Server className="w-3.5 h-3.5" />
                      <span>100% Shared Hosting cPanel Ready</span>
                    </div>
                    <h3 className="text-base font-semibold tracking-tight text-white mb-2">
                      Siap Dipublikasikan
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Sistem ini dikonfigurasi dengan path relatif (<code className="text-zinc-200">base: './'</code>), aturan SPA <code className="text-zinc-200">.htaccess</code>, dan Force HTTPS agar dapat langsung berjalan di cPanel tanpa 404 saat refresh.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-800 space-y-2">
                    <button
                      onClick={() => setShowCpanelModal(true)}
                      className="w-full py-2.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold transition-all"
                    >
                      Buka Checklist & Panduan cPanel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SESI UJIAN GFORM */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Cari judul ujian atau token..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingExam(null);
                    setShowExamModal(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sesi Ujian GForm</span>
                </button>
              </div>

              {/* Tabel Sesi Ujian */}
              <div className="bg-white border border-zinc-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-50/70 border-b border-zinc-200/80 text-zinc-500 font-medium">
                        <th className="py-3.5 px-4">Judul & Jenjang</th>
                        <th className="py-3.5 px-4">Token Soal</th>
                        <th className="py-3.5 px-4">Durasi</th>
                        <th className="py-3.5 px-4">Jadwal Sesi</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredExams.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-zinc-400 text-xs">
                            Tidak ada data sesi ujian yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filteredExams.map((exam) => (
                          <tr key={exam.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-zinc-900">{exam.title}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  {getGradeLabel(exam.grade_level)}
                                </span>
                                {exam.respon_base_url && (
                                  <a
                                    href={exam.respon_base_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>Google Sheets Respon</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                              <span className="bg-zinc-100 px-2 py-1 rounded border border-zinc-200 text-xs">
                                {exam.exam_token}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-zinc-600 font-mono-num">
                              {exam.duration_minutes} Menit
                            </td>

                            <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                              <div>{exam.start_time ? exam.start_time.replace('T', ' ') : 'Fleksibel'}</div>
                              <div>s/d {exam.end_time ? exam.end_time.replace('T', ' ') : '-'}</div>
                            </td>

                            <td className="py-3.5 px-4">
                              <button
                                onClick={() => {
                                  storageService.toggleExamActive(exam.id);
                                  refreshData();
                                }}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                                  exam.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100'
                                    : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                                }`}
                              >
                                {exam.is_active ? 'Aktif (Tayang)' : 'Non-Aktif / Draf'}
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Tombol Generate & Download QR Code Ujian */}
                                <button
                                  onClick={() => generateQrCard(exam)}
                                  className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200/80 shadow-2xs"
                                  title="Generate & Download QR Code Ujian (Hitam-Putih dengan Logo)"
                                >
                                  <QrCode className="w-4 h-4 text-zinc-700" />
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingExam(exam);
                                    setShowExamModal(true);
                                  }}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                  title="Edit Sesi"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExam(exam.id, exam.title)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Hapus Sesi"
                                >
                                  <Trash2 className="w-4 h-4" />
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
                              <td className="py-3.5 px-4">
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
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all shadow-2xs ${
                                      att.status === 'LOCKED'
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
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all shadow-2xs ${
                                      att.status === 'COMPLETED'
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
                        <th className="py-3.5 px-4 text-center w-20">Aksi</th>
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
                                    onClick={() => {
                                      storageService.resetUserDevice(stu.id);
                                      refreshData();
                                      showNotification(`Perangkat ${stu.nama} berhasil direset.`);
                                    }}
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
                                    title={`SSO Google Terhubung: Pernah login SSO dengan email terdaftar (${stu.google_email || stu.email}) dan ID Google tersimpan (${stu.google_id}). Status otomatis dan tidak dapat diubah oleh admin.`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-[11px] font-semibold tracking-tight">SSO On</span>
                                  </div>
                                  <span
                                    className="text-[10px] text-zinc-400 font-mono mt-0.5 max-w-[125px] truncate"
                                    title={`Google ID: ${stu.google_id}`}
                                  >
                                    ID: {stu.google_id.slice(0, 10)}...
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <div
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100/90 border border-zinc-200 text-zinc-400 select-none"
                                    title="SSO Google Off: Siswa belum pernah login menggunakan Google SSO. Icon centang akan otomatis aktif (hijau) setelah siswa login lewat SSO dengan email terdaftar."
                                  >
                                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 flex items-center justify-center shrink-0">
                                      <span className="w-1.5 h-0.5 bg-zinc-400 rounded-full"></span>
                                    </div>
                                    <span className="text-[11px] font-medium text-zinc-500">SSO Off</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-400 italic mt-0.5">
                                    Belum pernah login
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Kolom 7: Status Akun (TIDAK BOLEH AKTIF JIKA BELUM TERVERIFIKASI) */}
                            <td className="py-3.5 px-4 text-center">
                              <button
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
                                    ? 'Wajib verifikasi terlebih dahulu sebelum dapat diaktifkan'
                                    : stu.is_active
                                    ? 'Klik untuk menonaktifkan akun siswa'
                                    : 'Klik untuk mengaktifkan akun siswa'
                                }
                                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                                  !stu.is_verified
                                    ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                                    : stu.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 cursor-pointer'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100 cursor-pointer'
                                }`}
                              >
                                {!stu.is_verified ? (
                                  <>
                                    <Lock className="w-3 h-3 text-zinc-400" />
                                    <span>Terkunci (Belum Verif)</span>
                                  </>
                                ) : stu.is_active ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    <span>Non-Aktif</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Kolom 8: Verifikasi */}
                            <td className="py-3.5 px-4 text-center">
                              <button
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
                                    ? 'Klik untuk mencabut status verifikasi (otomatis menonaktifkan akun)'
                                    : 'Klik untuk memverifikasi siswa (mengizinkan aktivasi akun)'
                                }
                                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                  stu.is_verified
                                    ? 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100 font-semibold'
                                }`}
                              >
                                {stu.is_verified ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Terverifikasi</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Belum Verifikasi</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Kolom 9: Aksi (Edit Akun & Hapus) */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditModal(stu)}
                                  className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Akun Siswa (Ubah Nama, NISN, Kelas, Email)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteStudent(stu.id, stu.nama)}
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Data Peserta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 5: AKUN ADMINISTRATOR */}
          {activeTab === 'account' && (
            <div className="max-w-xl bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs space-y-5">
              <div className="pb-3 border-b border-zinc-100">
                <h3 className="text-sm font-semibold text-zinc-900">Kelola Kredensial Administrator</h3>
                <p className="text-xs text-zinc-500">
                  Ubah nama pengguna, email, dan kata sandi akses panel pengawasan.
                </p>
              </div>

              <form onSubmit={handleSaveAdminProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Nama Lengkap Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.nama}
                    onChange={(e) => setAdminForm({ ...adminForm, nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Username Login Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={adminForm.username}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Email Administrator
                  </label>
                  <input
                    type="email"
                    required
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
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
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10"
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-medium shadow-xs transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Perbarui Kredensial Admin</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: PENGATURAN INSTANSI (Dipindahkan ke bawah Akun Administrator) */}
          {activeTab === 'institution' && (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      onClick={() =>
                        setInstitution({ ...institution, gps_enabled: !institution.gps_enabled })
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        institution.gps_enabled ? 'bg-zinc-900' : 'bg-zinc-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          institution.gps_enabled ? 'translate-x-5' : 'translate-x-0'
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
              </div>

              {/* FITUR 4: PENGATURAN AUTENTIKASI & GOOGLE RECAPTCHA */}
              <div className="bg-white border border-zinc-200/80 rounded-xl p-6 shadow-2xs space-y-5">
                <div className="pb-3 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-900">Metode Autentikasi & Keamanan Google</h3>
                  <p className="text-xs text-zinc-500">
                    Konfigurasi integrasi Google Workspace SSO dan perlindungan reCAPTCHA.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                      Metode Login Siswa yang Diizinkan
                    </label>
                    <select
                      value={institution.auth_method}
                      onChange={(e) => setInstitution({ ...institution, auth_method: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none bg-white"
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
                      value={institution.google_client_id || ''}
                      onChange={(e) =>
                        setInstitution({ ...institution, google_client_id: e.target.value })
                      }
                      placeholder="842918239012-xxx.apps.googleusercontent.com"
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                    Google OAuth Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showGoogleSecret ? 'text' : 'password'}
                      value={institution.google_client_secret || ''}
                      onChange={(e) =>
                        setInstitution({ ...institution, google_client_secret: e.target.value })
                      }
                      placeholder="GOCSPX-xxxxxxxxxxxxx"
                      className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-zinc-900 focus:outline-none pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600"
                    >
                      {showGoogleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Toggle reCAPTCHA */}
                <div className="pt-2 border-t border-zinc-100">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={institution.recaptcha_enabled}
                      onChange={(e) =>
                        setInstitution({ ...institution, recaptcha_enabled: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900"
                    />
                    <span className="text-xs font-medium text-zinc-800">
                      Aktifkan Verifikasi Bot Google reCAPTCHA v2 di Halaman Login
                    </span>
                  </label>

                  {institution.recaptcha_enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pl-7">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                          reCAPTCHA Site Key
                        </label>
                        <input
                          type="text"
                          value={institution.recaptcha_site_key || ''}
                          onChange={(e) =>
                            setInstitution({ ...institution, recaptcha_site_key: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                          reCAPTCHA Secret Key
                        </label>
                        <input
                          type="password"
                          value={institution.recaptcha_secret_key || ''}
                          onChange={(e) =>
                            setInstitution({ ...institution, recaptcha_secret_key: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
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
                  <span className="text-zinc-500">Judul Ujian:</span>
                  <span className="font-semibold text-zinc-900 truncate max-w-[220px]">
                    {qrExam.title}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Tingkat Kelas:</span>
                  <span className="font-medium text-zinc-800">{getGradeLabel(qrExam.grade_level)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Token Soal:</span>
                  <span className="font-mono font-bold text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                    {qrExam.exam_token}
                  </span>
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
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Judul Ujian</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingExam?.title || ''}
                  placeholder="Contoh: Penilaian Akhir Semester - Matematika Wajib"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Deskripsi / Petunjuk</label>
                <textarea
                  name="description"
                  rows="2"
                  defaultValue={editingExam?.description || ''}
                  placeholder="Petunjuk pengerjaan bagi siswa..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Tingkat Kelas Sasaran</label>
                  <select
                    name="grade_level"
                    defaultValue={editingExam?.grade_level || institution.allowed_grades[0]}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg bg-white"
                  >
                    {institution.allowed_grades.map((grade) => (
                      <option key={grade} value={grade}>
                        {getGradeLabel(grade)}
                      </option>
                    ))}
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
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">
                  URL Pengisian Google Form (Wajib dengan ?embedded=true)
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
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-[11px]"
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
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Token Soal</label>
                  <input
                    type="text"
                    name="exam_token"
                    required
                    defaultValue={editingExam?.exam_token || 'TOKEN2026'}
                    placeholder="Contoh: PAS-MTK"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono font-semibold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Mulai Sesi</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    defaultValue={editingExam?.start_time || '2026-11-11T07:30'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Selesai Sesi</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    defaultValue={editingExam?.end_time || '2026-11-11T16:00'}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={editingExam ? editingExam.is_active : true}
                    className="w-4 h-4 rounded text-zinc-900"
                  />
                  <span className="text-xs font-medium text-zinc-800">
                    Aktifkan Sesi Ini (Tampilkan di Beranda Siswa yang sesuai tingkat kelas)
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

      {/* MODAL: PANDUAN LENGKAP PUBLISH KE CPANEL */}
      {showCpanelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 text-sm">
                    Panduan Lengkap Publikasi ke Shared Hosting cPanel
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Apache / LiteSpeed Server &bull; Bebas 404 & Izin GPS/Kamera Aman
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCpanelModal(false)}
                className="text-zinc-400 hover:text-zinc-600 p-1 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-700 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Konfigurasi Vite & .htaccess Sudah 100% Sesuai Standar cPanel
                </p>
                <p className="text-[11px] leading-normal text-emerald-700">
                  Proyek ini telah dikonfigurasi dengan <code className="font-mono bg-emerald-100/80 px-1 rounded">base: './'</code> dan file <code className="font-mono bg-emerald-100/80 px-1 rounded">public/.htaccess</code> yang menyertakan rewrite fallback ke <code className="font-mono bg-emerald-100/80 px-1 rounded">index.html</code> serta Force HTTPS.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Jalankan Build Produksi</h4>
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      Jalankan perintah berikut di terminal:
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
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Kompresi Menjadi File ZIP</h4>
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      Buka folder <code className="font-mono font-medium">dist/</code>, pilih seluruh isinya (termasuk file <code className="font-mono font-medium">.htaccess</code>), lalu klik kanan &rarr; Compress to ZIP (contoh: <code className="font-mono">examguard-dist.zip</code>).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Unggah ke File Manager cPanel</h4>
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      1. Masuk ke cPanel &rarr; Buka <strong>File Manager</strong>.<br />
                      2. Masuk ke direktori target: <code className="font-mono">public_html</code> (untuk domain utama) atau folder subdomain (contoh: <code className="font-mono">public_html/ujian</code>).<br />
                      3. Klik <strong>Upload</strong> lalu unggah file <code className="font-mono">examguard-dist.zip</code>.<br />
                      4. Klik kanan file ZIP tersebut di cPanel &rarr; pilih <strong>Extract</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Pastikan File .htaccess Terbaca</h4>
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      Di pojok kanan atas File Manager cPanel, klik menu <strong>Settings</strong> &rarr; Centang opsi <strong>"Show Hidden Files (dotfiles)"</strong> &rarr; Simpan. Pastikan file <code className="font-mono">.htaccess</code> ada di folder tempat aplikasi berada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </span>
                  <div>
                    <h4 className="font-semibold text-zinc-900">Wajibkan Sertifikat SSL (HTTPS)</h4>
                    <p className="text-zinc-600 text-[11px] mt-0.5">
                      Browser memblokir izin GPS Geolocation, Kamera, dan Mikrofon jika website berjalan di HTTP biasa. Pastikan fitur SSL cPanel (Let's Encrypt / AutoSSL) aktif untuk domain Anda.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowCpanelModal(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-all cursor-pointer"
                >
                  Tutup Panduan & Kembali ke Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
