import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  QrCode,
  FileText,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sliders,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import QRCode from 'qrcode';

const STORAGE_KEY = 'examguard_exam_card_config';

const getInitialConfig = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        examName: parsed.examName || 'ASESMEN AKHIR SEMESTER (AAS)',
        examDate: parsed.examDate || '21 - 26 November 2026',
        examNotes:
          parsed.examNotes ||
          'Harap hadir 15 menit sebelum ujian dimulai & kartu jangan sampai hilang/rusak.',
        cardsPerPage: parsed.cardsPerPage === 4 ? 4 : 6,
      };
    }
  } catch {}
  return {
    examName: 'ASESMEN AKHIR SEMESTER (AAS)',
    examDate: '21 - 26 November 2026',
    examNotes: 'Harap hadir 15 menit sebelum ujian dimulai & kartu jangan sampai hilang/rusak.',
    cardsPerPage: 6,
  };
};

export default function StudentQrCardModal({
  isOpen,
  onClose,
  student,
  allStudents = null,
  institution,
  onTokenReset = null,
}) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [batchQrUrls, setBatchQrUrls] = useState({});
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [config, setConfig] = useState(getInitialConfig);
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [currentStudent, setCurrentStudent] = useState(student);
  const [activeToken, setActiveToken] = useState(student?.login_token || '');
  const [isResettingToken, setIsResettingToken] = useState(false);
  const [tokenResetSuccess, setTokenResetSuccess] = useState(false);

  useEffect(() => {
    setCurrentStudent(student);
    setActiveToken(student?.login_token || '');
    setTokenResetSuccess(false);
  }, [student]);

  const isBatch = Boolean(allStudents && Array.isArray(allStudents));

  // Simpan config ke localStorage setiap kali berubah
  const handleConfigChange = (key, value) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleResetConfig = () => {
    const defaultConfig = {
      examName: 'ASESMEN AKHIR SEMESTER (AAS)',
      examDate: '21 - 26 November 2026',
      examNotes: 'Harap hadir 15 menit sebelum ujian dimulai & kartu jangan sampai hilang/rusak.',
      cardsPerPage: 6,
    };
    setConfig(defaultConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultConfig));
    } catch {}
  };

  // Generate single QR code
  useEffect(() => {
    if (isOpen && currentStudent && !isBatch) {
      const token = activeToken || currentStudent.login_token || currentStudent.nisn || currentStudent.nomor_ujian || currentStudent.id;
      QRCode.toDataURL(token, {
        width: 300,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: { dark: '#000000', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => {});
    }
  }, [isOpen, currentStudent, activeToken, isBatch]);

  // Handler atur ulang token baru jika kartu hilang
  const handleResetToken = async () => {
    if (!currentStudent?.id || isResettingToken) return;
    const targetName = currentStudent.nama || 'peserta ini';
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin mengatur ulang token login untuk ${targetName}?\n\nToken lama akan langsung hangus dan kartu lama tidak bisa lagi digunakan untuk login ujian.`
    );
    if (!confirmed) return;

    setIsResettingToken(true);
    try {
      const res = storageService.resetStudentLoginToken(currentStudent.id);
      if (res && res.success && res.token) {
        setActiveToken(res.token);
        const updatedStu = { ...currentStudent, login_token: res.token };
        setCurrentStudent(updatedStu);
        setTokenResetSuccess(true);
        setTimeout(() => setTokenResetSuccess(false), 4000);
        if (onTokenReset) onTokenReset(updatedStu);
      } else {
        alert('Gagal mengatur ulang token peserta.');
      }
    } catch (err) {
      console.error('Reset token error:', err);
      alert('Terjadi kesalahan saat mengatur ulang token.');
    } finally {
      setIsResettingToken(false);
    }
  };

  // Generate batch QR codes
  useEffect(() => {
    if (isOpen && isBatch && allStudents.length > 0) {
      setGeneratingBatch(true);
      const urls = {};
      Promise.all(
        allStudents.map(async (stu) => {
          const token = stu.login_token || stu.nisn || stu.nomor_ujian || stu.id;
          try {
            const url = await QRCode.toDataURL(token, {
              width: 220,
              margin: 1,
              errorCorrectionLevel: 'M',
              color: { dark: '#000000', light: '#ffffff' },
            });
            urls[stu.id] = url;
          } catch {}
        })
      ).then(() => {
        setBatchQrUrls(urls);
        setGeneratingBatch(false);
      });
    }
  }, [isOpen, isBatch, allStudents]);

  // Chunking siswa per lembar A4
  const sheets = useMemo(() => {
    if (!isBatch || !allStudents) return [];
    const pageSize = config.cardsPerPage || 6;
    const result = [];
    for (let i = 0; i < allStudents.length; i += pageSize) {
      result.push(allStudents.slice(i, i + pageSize));
    }
    return result;
  }, [isBatch, allStudents, config.cardsPerPage]);

  if (!isOpen) return null;

  const handleCopyToken = (token) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const schoolName = institution?.name || 'KLLSA NEGERI 1 NUSANTARA';
  const schoolNpsn = institution?.npsn || '20104829';
  const logoUrl = institution?.logo_url;

  // Komponen Kartu Siswa Reusable (Desain Resmi Sesuai Arahan)
  const renderCard = (stu, qrCodeUrl, isCompact = false) => {
    const nomorUjian = stu.nomor_ujian || stu.nisn || stu.username || '-';
    const namaPeserta = stu.nama || '-';
    const nisn = stu.nisn || '-';
    const rombel = stu.kelas || '-';
    const ruang = stu.ruang || 'Ruang 01';

    return (
      <div
        key={stu.id}
        className={`exam-card border-2 border-zinc-900 rounded-xl bg-white text-zinc-900 flex flex-col justify-between overflow-hidden relative shadow-xs print:shadow-none print:border-zinc-950 ${
          isCompact ? 'p-2.5 h-[87mm] max-h-[88mm]' : 'p-3.5'
        }`}
      >
        {/* KOP KARTU RESMI (Safe Exam Guard dihilangkan, digantikan Nama Ujian) */}
        <div className="pb-2 border-b-2 border-zinc-900 flex items-center gap-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Sekolah"
              className={`${isCompact ? 'w-10 h-10' : 'w-12 h-12'} object-contain shrink-0`}
            />
          ) : (
            <div
              className={`${
                isCompact ? 'w-10 h-10 text-xs' : 'w-12 h-12 text-sm'
              } rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black shrink-0 tracking-wider`}
            >
              KOP
            </div>
          )}
          <div className="min-w-0 flex-1 text-center">
            <h2
              className={`font-black uppercase tracking-tight text-zinc-950 truncate leading-tight ${
                isCompact ? 'text-[11px]' : 'text-xs sm:text-sm'
              }`}
            >
              {schoolName}
            </h2>
            <p className="text-[9px] font-semibold text-zinc-700 leading-tight">
              NPSN: {schoolNpsn}
            </p>
            <p
              className={`font-black uppercase tracking-tight text-zinc-900 truncate mt-0.5 ${
                isCompact ? 'text-[10px]' : 'text-[11px]'
              }`}
            >
              {config.examName || 'ASESMEN UJIAN SEKOLAH'}
            </p>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-900 text-white text-[8px] font-extrabold uppercase tracking-widest mt-0.5">
              KARTU PESERTA UJIAN
            </div>
          </div>
        </div>

        {/* BODY KARTU: DATA IDENTITAS & QR CODE */}
        <div className="pt-2 flex items-start justify-between gap-2 flex-1">
          {/* Data Identitas Peserta */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* NOMOR UJIAN */}
            <div className="flex items-center text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                Nomor Ujian
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-mono font-extrabold text-zinc-950 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-400 text-[11px] truncate">
                {nomorUjian}
              </span>
            </div>

            {/* NAMA PESERTA */}
            <div className="flex items-start text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                Nama Peserta
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-bold text-zinc-900 truncate uppercase text-[10.5px]">
                {namaPeserta}
              </span>
            </div>

            {/* NISN */}
            <div className="flex items-center text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                NISN
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-mono font-semibold text-zinc-900 text-[10px]">
                {nisn}
              </span>
            </div>

            {/* ROMBEL */}
            <div className="flex items-center text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                Rombel
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-semibold text-zinc-900 text-[10px]">
                {rombel}
              </span>
            </div>

            {/* PELAKSANAAN */}
            <div className="flex items-center text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                Pelaksanaan
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-medium text-zinc-900 text-[9.5px] truncate">
                {config.examDate || '-'}
              </span>
            </div>

            {/* RUANG */}
            <div className="flex items-center text-[11px] leading-tight">
              <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-600 text-[9px]">
                Ruang
              </span>
              <span className="mr-1 text-zinc-400 font-bold">:</span>
              <span className="font-semibold text-zinc-900 text-[9.5px]">
                {ruang}
              </span>
            </div>

            {/* CATATAN (jika ada) */}
            {config.examNotes && (
              <div className="flex items-start text-[10px] leading-tight pt-0.5">
                <span className="w-[84px] shrink-0 font-bold uppercase text-zinc-500 text-[8.5px]">
                  Catatan
                </span>
                <span className="mr-1 text-zinc-400 font-bold">:</span>
                <span className="text-[8.5px] text-zinc-600 italic line-clamp-2 leading-tight">
                  {config.examNotes}
                </span>
              </div>
            )}
          </div>

          {/* Kolom QR Code Login */}
          <div className="shrink-0 flex flex-col items-center justify-center pt-0.5">
            <div className="p-1 bg-white border border-zinc-900 rounded-lg shadow-2xs">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code Login"
                  className={`${isCompact ? 'w-[78px] h-[78px]' : 'w-[96px] h-[96px]'} object-contain`}
                />
              ) : (
                <div
                  className={`${
                    isCompact ? 'w-[78px] h-[78px]' : 'w-[96px] h-[96px]'
                  } bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400`}
                >
                  Memuat QR...
                </div>
              )}
            </div>
            <span className="text-[7.5px] font-extrabold text-zinc-800 uppercase tracking-tight mt-1 text-center">
              SCAN UNTUK LOGIN
            </span>
          </div>
        </div>

        {/* FOOTER KARTU (Pesan Aman Pengganti Token) */}
        <div className="mt-2 pt-1.5 border-t border-dashed border-zinc-400 text-center">
          <p className="text-[8px] font-semibold text-zinc-700 italic leading-tight">
            "Jaga dan simpan kartu ini jangan sampai di gunakan oleh orang lain untuk login ujian"
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
      {/* CSS Khusus Print A4 */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 7mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 11pt !important;
          }
          /* Sembunyikan semua elemen modal UI luar */
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 196mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
          }
          .a4-sheet {
            width: 196mm !important;
            height: 280mm !important;
            max-height: 280mm !important;
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
          }
          .a4-sheet:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .exam-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border-color: #000000 !important;
          }
        }
      `}</style>

      <div
        className={`relative w-full ${
          isBatch ? 'max-w-5xl' : 'max-w-2xl'
        } bg-zinc-100 rounded-2xl shadow-2xl border border-zinc-300 overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 flex flex-col max-h-[92vh]`}
      >
        {/* Header Modal Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-zinc-200 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 leading-tight">
                {isBatch
                  ? `Cetak Kartu Ujian Masal (${allStudents.length} Peserta Terpilih)`
                  : 'Kartu Peserta Ujian & QR Login'}
              </h3>
              <p className="text-[11px] text-zinc-500">
                {isBatch
                  ? `Format Standar A4 (${config.cardsPerPage} Kartu/Lembar) - Bebas Terpotong`
                  : 'Scan QR Code ini di laman login peserta untuk otomatis masuk'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigPanel((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                showConfigPanel
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-700'
              }`}
              title="Atur Nama Ujian, Tanggal, dan Catatan"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kustomisasi Kartu</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isBatch && generatingBatch}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Dokumen (Print / PDF)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bar Input Kustomisasi Tambahan (Nama Ujian, Tanggal, Catatan) */}
        {showConfigPanel && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-5 py-3.5 shrink-0 print:hidden transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Data Tambahan pada Kartu Ujian (Diterapkan Realtime ke Kartu)
              </span>
              <button
                type="button"
                onClick={handleResetConfig}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nama Ujian */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                  Nama Ujian (Tampil di Kop) *
                </label>
                <input
                  type="text"
                  value={config.examName}
                  onChange={(e) => handleConfigChange('examName', e.target.value)}
                  placeholder="e.g. ASESMEN AKHIR SEMESTER (AAS)"
                  className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900"
                />
              </div>

              {/* Tanggal Pelaksanaan */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                  Tanggal Pelaksanaan *
                </label>
                <input
                  type="text"
                  value={config.examDate}
                  onChange={(e) => handleConfigChange('examDate', e.target.value)}
                  placeholder="e.g. 21 - 26 November 2026"
                  className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900"
                />
              </div>

              {/* Catatan Ujian */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 uppercase mb-1">
                  Catatan Ujian (Opsional)
                </label>
                <input
                  type="text"
                  value={config.examNotes}
                  onChange={(e) => handleConfigChange('examNotes', e.target.value)}
                  placeholder="e.g. Harap hadir 15 menit sebelum ujian..."
                  className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-zinc-900"
                />
              </div>
            </div>

            {isBatch && (
              <div className="mt-2.5 pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-600 font-medium">Format Kertas A4:</span>
                  <div className="inline-flex rounded-lg border border-zinc-300 bg-white p-0.5">
                    <button
                      type="button"
                      onClick={() => handleConfigChange('cardsPerPage', 6)}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        config.cardsPerPage === 6
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      6 Kartu / Lembar A4 (Rekomendasi Hemat)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfigChange('cardsPerPage', 4)}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        config.cardsPerPage === 4
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      4 Kartu / Lembar A4 (Format Lebih Besar)
                    </button>
                  </div>
                </div>
                <div className="text-zinc-500 text-[10px]">
                  Total: <strong>{allStudents.length}</strong> peserta &bull;{' '}
                  <strong>{sheets.length}</strong> lembar A4
                </div>
              </div>
            )}
          </div>
        )}

        {/* Konten Utama / Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-200/60">
          {/* ================= MODE KARTU TUNGGAL ================= */}
          {!isBatch && currentStudent && (
            <div id="print-area" className="max-w-md mx-auto space-y-4">
              {renderCard(currentStudent, qrDataUrl, false)}

              {/* Box Aksi Tambahan: Token Asli (Hanya di layar monitor) */}
              <div className="p-4 rounded-xl bg-white border border-zinc-200 text-xs space-y-2.5 shadow-xs print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-800">
                    Token QR Login Peserta:
                  </span>
                  {/* Posisi Tombol: Salin Token | Reset Token */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyToken(activeToken)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      title="Salin token ke clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Salin Token</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResetToken}
                      disabled={isResettingToken}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      title="Atur ulang QR token baru jika kartu hilang. Token lama tidak akan bisa digunakan lagi."
                    >
                      <RotateCw
                        className={`w-3.5 h-3.5 text-amber-600 ${isResettingToken ? 'animate-spin' : ''}`}
                      />
                      <span>{isResettingToken ? 'Mereset...' : 'Reset Token'}</span>
                    </button>
                  </div>
                </div>

                {tokenResetSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Token QR baru berhasil diatur ulang! Kartu lama sudah tidak berlaku untuk login.
                    </span>
                  </div>
                )}

                <div className="font-mono bg-zinc-50 p-2 rounded-lg border border-zinc-200 text-zinc-900 select-all text-xs break-all">
                  {activeToken || 'Belum di-generate'}
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Gunakan tombol <strong>Reset Token</strong> jika kartu peserta hilang agar token lama dinonaktifkan demi keamanan. Peserta dapat login menggunakan kartu/token baru.
                </p>
              </div>
            </div>
          )}

          {/* ================= MODE MASAL / BATCH (PREVIEW KERTAS A4) ================= */}
          {isBatch && (
            <div>
              {generatingBatch ? (
                <div className="py-20 text-center text-zinc-600 space-y-3 bg-white rounded-2xl border border-zinc-200 p-8 shadow-xs">
                  <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h4 className="text-sm font-bold text-zinc-800">
                    Meng-generate QR Code untuk {allStudents.length} Peserta...
                  </h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Setiap peserta dibuatkan token QR Login unik dengan enkripsi tingkat tinggi untuk keamanan maksimal.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Navigasi Lembar A4 di Layar Preview */}
                  <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-zinc-200 shadow-2xs print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-800">
                        Preview Lembar A4:
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Lembar {currentSheetIndex + 1} dari {sheets.length || 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentSheetIndex((prev) => Math.max(0, prev - 1))}
                        disabled={currentSheetIndex === 0}
                        className="p-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        title="Lembar Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4 text-zinc-700" />
                      </button>
                      <span className="text-xs font-mono text-zinc-600 px-1">
                        {currentSheetIndex + 1} / {sheets.length}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentSheetIndex((prev) => Math.min(sheets.length - 1, prev + 1))
                        }
                        disabled={currentSheetIndex >= sheets.length - 1}
                        className="p-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                        title="Lembar Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4 text-zinc-700" />
                      </button>
                    </div>
                  </div>

                  {/* AREA PRINT & PREVIEW A4 ASLI */}
                  <div id="print-area" className="flex flex-col items-center gap-6">
                    {/* Saat di layar: tampilkan lembar aktif (currentSheetIndex) agar ringan & persis A4; Saat PRINT: tampilkan SEMUA lembar */}
                    {sheets.map((sheetStudents, sheetIdx) => {
                      const isSheetVisibleOnScreen = sheetIdx === currentSheetIndex;

                      return (
                        <div
                          key={`sheet-${sheetIdx}`}
                          className={`a4-sheet bg-white border border-zinc-300 shadow-xl rounded-sm p-[6mm] w-full max-w-[196mm] min-h-[278mm] flex flex-col justify-between ${
                            isSheetVisibleOnScreen ? 'block' : 'hidden print:block'
                          }`}
                        >
                          {/* Grid Kartu pada Lembar A4: 2 Kolom x 3 Baris atau 2 Kolom x 2 Baris */}
                          <div
                            className={`grid grid-cols-2 gap-[4mm] ${
                              config.cardsPerPage === 4 ? 'grid-rows-2 h-full' : 'grid-rows-3'
                            }`}
                          >
                            {sheetStudents.map((stu) =>
                              renderCard(
                                stu,
                                batchQrUrls[stu.id],
                                config.cardsPerPage === 6
                              )
                            )}
                          </div>

                          {/* Penanda Kaki Lembar Cetak A4 */}
                          <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[8px] text-zinc-400 font-mono print:flex">
                            <span>
                              {schoolName} &bull; {config.examName}
                            </span>
                            <span>
                              Halaman {sheetIdx + 1} dari {sheets.length}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
