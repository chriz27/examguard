import { generateUUID, EDUCATION_LEVELS, formatExamToken } from '../constants/educationConfig.js';

const STORAGE_KEYS = {
  INSTITUTION: 'examguard_institution',
  USERS: 'examguard_users',
  EXAM_SESSIONS: 'examguard_exam_sessions',
  STUDENT_ATTEMPTS: 'examguard_student_attempts',
  EXAM_ATTENDANCE: 'examguard_exam_attendance',
  BERITA_ACARA_CONFIG: 'examguard_berita_acara_config',
  APP_MODE_CONFIG: 'examguard_app_mode_config',
  SYSTEM_ERROR_LOGS: 'examguard_system_error_logs',
  CURRENT_USER: 'examguard_current_user',
  DEVICE_ID: 'examguard_client_device_id',
};

// Cross-tab & Multi-window Synchronization Channel via BroadcastChannel
let syncChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('examguard_sync_bus');
  }
} catch {
  syncChannel = null;
}

// LAN Server Sync Channel: Memungkinkan sinkronisasi real-time antar perangkat via LAN (Laptop/PC Proktor <-> HP Peserta)
const syncListeners = new Set();
let lastProcessedServerTimestamp = 0;
let isLanPollingActive = false;

export function broadcastSync(action, payload = {}) {
  try {
    if (syncChannel) {
      syncChannel.postMessage({ action, payload, timestamp: Date.now() });
    }
  } catch {}
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { action, ...payload } }));
    } catch {}

    // Broadcast ke server LAN Vite jika tersedia
    try {
      const attempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS) || '[]');
      const attendance = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_ATTENDANCE) || '[]');
      const institution = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTION) || 'null');
      const appModeConfig = JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_MODE_CONFIG) || 'null');
      const examSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS) || 'null');
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload, attempts, attendance, institution, appModeConfig, examSessions }),
      }).catch(() => {});
    } catch {}
  }
}

export function subscribeSync(callback) {
  syncListeners.add(callback);
  let handler = null;
  if (syncChannel) {
    handler = (event) => {
      if (event && event.data) {
        callback(event.data);
      }
    };
    syncChannel.addEventListener('message', handler);
  }
  return () => {
    syncListeners.delete(callback);
    if (syncChannel && handler) {
      try {
        syncChannel.removeEventListener('message', handler);
      } catch {}
    }
  };
}

// Inisialisasi polling LAN sync secara otomatis di latar belakang
function initLanSyncPoller() {
  if (typeof window === 'undefined' || isLanPollingActive) return;
  isLanPollingActive = true;

  const poll = async () => {
    try {
      const res = await fetch('/api/sync', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.lastUpdated && data.lastUpdated > lastProcessedServerTimestamp) {
          lastProcessedServerTimestamp = data.lastUpdated;

          let storageModified = false;

          // 1. Sinkronisasi institusi (logo, nama instansi) jika dikirim oleh admin
          if (data.institution && typeof data.institution === 'object') {
            const currentInst = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTION) || '{}');
            if (JSON.stringify(currentInst) !== JSON.stringify(data.institution)) {
              localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(data.institution));
              storageModified = true;
            }
          }

          // 2. Sinkronisasi mode aplikasi (produksi vs simulasi)
          if (data.appModeConfig && typeof data.appModeConfig === 'object') {
            const currentMode = JSON.parse(localStorage.getItem(STORAGE_KEYS.APP_MODE_CONFIG) || '{}');
            if (JSON.stringify(currentMode) !== JSON.stringify(data.appModeConfig)) {
              localStorage.setItem(STORAGE_KEYS.APP_MODE_CONFIG, JSON.stringify(data.appModeConfig));
              storageModified = true;
            }
          }

          // 3. Sinkronisasi sesi ujian yang aktif
          if (Array.isArray(data.examSessions) && data.examSessions.length > 0) {
            const currentSessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS) || '[]');
            if (JSON.stringify(currentSessions) !== JSON.stringify(data.examSessions)) {
              localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(data.examSessions));
              storageModified = true;
            }
          }

          // 4. Sinkronisasi daftar attempts pengerjaan peserta dengan smart conflict resolution
          if (Array.isArray(data.attempts) && data.attempts.length > 0) {
            const currentAttempts = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS) || '[]');
            data.attempts.forEach((srvAtt) => {
              const idx = currentAttempts.findIndex(
                (loc) => loc.id === srvAtt.id || (loc.student_id === srvAtt.student_id && loc.exam_session_id === srvAtt.exam_session_id)
              );
              if (idx >= 0) {
                const loc = currentAttempts[idx];
                const isProctorAction = Boolean(srvAtt.is_proctor_action || srvAtt.is_reset_violations);
                const mergedViolations = isProctorAction
                  ? (srvAtt.violation_count ?? 0)
                  : Math.max(Number(loc.violation_count || 0), Number(srvAtt.violation_count || 0));

                let mergedStatus = srvAtt.status || loc.status;
                if (loc.status === 'LOCKED' && !isProctorAction && mergedStatus !== 'COMPLETED' && mergedStatus !== 'RESET_BY_PROCTOR') {
                  mergedStatus = 'LOCKED';
                }

                if (
                  loc.status !== mergedStatus ||
                  loc.violation_count !== mergedViolations ||
                  loc.unlocked_at !== srvAtt.unlocked_at ||
                  (srvAtt.time_spent_seconds && srvAtt.time_spent_seconds > (loc.time_spent_seconds || 0))
                ) {
                  currentAttempts[idx] = {
                    ...loc,
                    ...srvAtt,
                    violation_count: mergedViolations,
                    status: mergedStatus,
                  };
                  storageModified = true;
                }
              } else {
                currentAttempts.push(srvAtt);
                storageModified = true;
              }
            });
            if (storageModified) {
              localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(currentAttempts));
            }
          }

          // 5. Proses event terbaru (misal: attempt_unlocked, attempt_updated, work_reset)
          if (Array.isArray(data.events) && data.events.length > 0) {
            const recentEvents = data.events.slice(-5);
            recentEvents.forEach((ev) => {
              syncListeners.forEach((listener) => {
                try { listener(ev); } catch {}
              });
            });
          }

          if (storageModified) {
            window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
          }
        }
      }
    } catch {}
  };

  setInterval(poll, 1500);
}

/**
 * Konfigurasi Mode Lingkungan Aplikasi:
 * - 'production': Mode resmi pelaksanaan ujian riil. Seluruh bypass mati total, validasi ketat (GPS, Kamera, Fullscreen, dll).
 * - 'simulation': Mode demo / simulasi / pengembangan. Memungkinkan bypass GPS dan fitur yang tidak dapat diakses di localhost/LAN.
 */
/**
 * Generator Tanda Tangan Digital Integritas Mode Kernel
 */
export function generateModeSignature(appMode) {
  const salt = 'EXAMGUARD_KERNEL_SECURE_2026_PRODUCTION_TOKEN';
  let hash = 0;
  const str = `${appMode}::${salt}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return 'eg_sig_' + Math.abs(hash).toString(16);
}

export const DEFAULT_APP_MODE_CONFIG = {
  app_mode: 'production', // 'production' (Resmi) | 'simulation' (Demo/Pengembangan)
  bypass_gps: false, // Kunci mati di mode produksi
  bypass_media: false, // Kunci mati di mode produksi
  bypass_audio: false, // Kunci mati di mode produksi
  bypass_notifications: false, // Kunci mati di mode produksi
  bypass_fullscreen: false, // Kunci mati di mode produksi
  bypass_cookies_check: false, // Kunci mati di mode produksi
  bypass_google_sso: false, // Kunci mati di mode produksi
  mock_gps_coords: null,
  signature: generateModeSignature('production'),
  updated_at: new Date().toISOString(),
};

/**
 * Dapatkan atau hasilkan Device ID unik untuk peramban ini
 */
export function getOrCreateDeviceId() {
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = 'DEV-' + generateUUID().slice(0, 13).toUpperCase();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

/**
 * Konversi otomatis link Google Form (misal link editor /edit, link share, link tanpa embedded)
 * menjadi link standar pengerjaan ujian: https://docs.google.com/forms/d/{id}/viewform?embedded=true
 */
export function convertGoogleFormUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();

  // 1. Ekstrak Form ID dari Google Forms URL
  // Contoh 1: https://docs.google.com/forms/d/1SUrGA_GLbNdW3HDb2sWf2RhvKySKGV_7ES0I7aWJoPM/edit
  // Contoh 2: https://docs.google.com/forms/d/e/1FAIpQLSc6Z-sample/edit?usp=sharing
  // Contoh 3: https://docs.google.com/forms/d/1SUrGA.../viewform
  const match = url.match(/^https?:\/\/docs\.google\.com\/forms\/d\/(e\/[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)([\/\?].*)?$/i);
  if (match) {
    const formIdPart = match[1]; // misal '1SUrGA_GLbNdW3HDb2sWf2RhvKySKGV_7ES0I7aWJoPM' atau 'e/1FAIpQLSc...'
    return `https://docs.google.com/forms/d/${formIdPart}/viewform?embedded=true`;
  }

  // 2. Fallback jika memuat docs.google.com/forms
  if (url.includes('docs.google.com/forms')) {
    if (url.includes('/edit')) {
      const base = url.split('/edit')[0];
      return `${base}/viewform?embedded=true`;
    }
    if (url.includes('/viewform')) {
      const base = url.split('?')[0];
      return `${base}?embedded=true`;
    }
    // Jika format https://docs.google.com/forms/d/XXXX
    if (url.includes('/forms/d/')) {
      const clean = url.replace(/\/+$/, '');
      return `${clean}/viewform?embedded=true`;
    }
  }

  return url;
}

/**
 * Pengaturan Default Izin Peramban (Pre-Flight Browser Permissions)
 * Menentukan izin apa saja yang wajib dicek dan dipenuhi oleh siswa saat login & memulai ujian.
 */
export const DEFAULT_BROWSER_PERMISSIONS = {
  location_gps: true,       // 1. Izinkan Lokasi (Login GPS)
  notifications: true,      // 2. Izinkan Notifications (Suara peringatan)
  sound_audio: true,        // 3. Izinkan Sound
  fullscreen: true,         // 4. Izinkan Fullscreen
  google_sso: false,        // 5. Login Akun Google
  block_clipboard: true,    // 6. Block Clipboard
  camera_webcam: true,      // 7. Sensor Kamera & Mikrofon
  cookies_iframe: true,     // 8. Third-Party Cookies (Iframe GForm)
};

/**
 * Data awal institusi
 */
const DEFAULT_INSTITUTION = {
  id: generateUUID(),
  name: 'SMA Negeri 1 Nusantara',
  npsn: '20104829', // 8 digit numerik NPSN
  logo_url: null, // URL atau Base64 logo resmi instansi
  education_level: 'SMA',
  allowed_grades: [10, 11, 12],
  idle_timeout_minutes: 30,
  gps_enabled: true, // Sakelar ON/OFF pengecekan lokasi GPS saat ujian
  center_lat: -6.2088,
  center_lng: 106.8456,
  max_radius_meters: 200,
  gmaps_url: 'https://maps.google.com/?q=-6.2088,106.8456',
  auth_method: 'CREDENTIALS_ONLY', // 'SSO_ONLY', 'CREDENTIALS_ONLY', 'BOTH' (Default aman jika belum ada OAuth)
  google_oauth_enabled: false, // Default OFF di mode produksi jika belum diset & diuji
  google_client_id: '',
  google_client_secret: '',
  recaptcha_enabled: false, // Default OFF di mode produksi jika belum diset & diuji
  recaptcha_version: 'v2', // 'v2' (Checkbox "Saya bukan robot") atau 'v3' (Invisible Score-based)
  recaptcha_site_key: '',
  recaptcha_secret_key: '',
  finish_token_lead_minutes: 10, // Menit sebelum waktu habis untuk menampilkan TOKEN SELESAI
  browser_permissions: { ...DEFAULT_BROWSER_PERMISSIONS },
};

/**
 * Data awal konfigurasi Berita Acara Ujian
 */
export const DEFAULT_BERITA_ACARA_CONFIG = {
  instansi_pusat: '',
  alamat: '',
  kepala_sekolah_nama: '',
  kepala_sekolah_nip: '',
  proktor_nama: '',
  proktor_nip: '',
  pengawas_nama: '',
  pengawas_nip: '',
  catatan_pelaksanaan: 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.',
  // Pengaturan Area Cetak & Margin Kertas (Default A4)
  paper_size: 'A4', // 'A4' (Default), 'F4' (Folio/HVS 215x330mm), 'LETTER'
  margin_preset: 'standard', // 'standard' (15mm), 'compact' (10mm), 'narrow' (5mm), 'custom'
  margin_top: 15,
  margin_right: 15,
  margin_bottom: 15,
  margin_left: 15,
};

/**
 * Data awal pengguna
 */
/**
 * Sanitizer Nomor Ujian Peserta
 * Hanya mengizinkan huruf (a-z, A-Z), angka (0-9), dan simbol dasar (- _ . /)
 * Jika kosong / tidak diisi, otomatis fallback ke NISN siswa.
 */
export function cleanNomorUjian(input, defaultNisn = '') {
  const strInput = String(input ?? '').trim();
  const fallback = String(defaultNisn ?? '').trim();
  if (!strInput) {
    return fallback;
  }
  // Filter hanya alfanumerik dan simbol dasar (- _ . /)
  const cleaned = strInput.replace(/[^a-zA-Z0-9\-_./]/g, '');
  return cleaned || fallback;
}

const DEFAULT_USERS = [
  {
    id: 'ADMIN-SUPER-01',
    username: 'admin',
    password: 'admin',
    nama: 'Super Admin',
    email: 'admin@examguard.sch.id',
    role: 'admin', // Super Admin: Akses Penuh (termasuk Pengaturan Instansi & Akun Admin)
    nisn: '',
    nis: '',
    kelas: 'Administrator Utama',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: 'PROCTOR-01',
    username: 'proktor',
    password: 'proktor',
    nama: 'Proktor Ujian',
    email: 'proktor@examguard.sch.id',
    role: 'proctor', // Proktor: Akses Operasional Ujian (Pengaturan Instansi & Akun Admin di-hide)
    nisn: '',
    nis: '',
    kelas: 'Pengawas / Proktor',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0058291021',
    password: '22101', // Default password adalah NIS
    nama: 'Ahmad Fauzi Ridwan',
    nomor_ujian: 'UJN-12-001',
    jenis_kelamin: 'L',
    agama: 'Islam',
    email: 'ahmad.fauzi@student.sch.id',
    role: 'student',
    nisn: '0058291021',
    nis: '22101',
    kelas: 'XII MIPA 1',
    tingkat: 12,
    ruang: 'Ruang 01',
    is_active: true,
    is_verified: true,
    google_linked: true,
    google_id: '108291021482019284',
    google_email: 'ahmad.fauzi@student.sch.id',
    google_linked_at: '2026-11-10T08:30:00Z',
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0058291022',
    password: '22102', // Default password adalah NIS
    nama: 'Siti Rahmawati Putri',
    nomor_ujian: 'UJN-12-002',
    jenis_kelamin: 'P',
    agama: 'Islam',
    email: 'siti.rahma@student.sch.id',
    role: 'student',
    nisn: '0058291022',
    nis: '22102',
    kelas: 'XII MIPA 2',
    tingkat: 12,
    ruang: 'Ruang 01',
    is_active: true,
    is_verified: true,
    google_linked: false,
    google_id: null,
    google_email: null,
    google_linked_at: null,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0068291033',
    password: '23101', // Default password adalah NIS
    nama: 'Bambang Pamungkas',
    nomor_ujian: 'UJN-11-001',
    jenis_kelamin: 'L',
    agama: 'Islam',
    email: 'bambang.p@student.sch.id',
    role: 'student',
    nisn: '0068291033',
    nis: '23101',
    kelas: 'XI IPS 1',
    tingkat: 11,
    ruang: 'Ruang 02',
    is_active: true,
    is_verified: true,
    google_linked: false,
    google_id: null,
    google_email: null,
    google_linked_at: null,
    active_device_id: null,
  },
];

/**
 * Data awal sesi ujian Google Form
 */
const DEFAULT_EXAMS = [
  {
    id: generateUUID(),
    subject: 'Matematika Wajib',
    title: 'Penilaian Akhir Semester - Matematika Wajib',
    session_group: 'Asesmen Akhir Semester (AAS)',
    description: 'Materi: Statistika, Dimensi Tiga, dan Kaidah Pencacahan. Wajib menggunakan kalkulator manual, dilarang membuka tab lain.',
    grade_level: 12,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6Z-sample-math-exam/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
    exam_token: 'MTKWJB',
    finish_token: 'SLSAI1',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:00',
    duration_minutes: 90,
  },
  {
    id: generateUUID(),
    subject: 'Fisika',
    title: 'Ujian Fisika Lanjutan - Gelombang & Optik',
    session_group: 'Asesmen Tengah Semester (ATS)',
    description: 'Kerjakan soal uraian dan pilihan ganda. Pastikan kuota dan daya baterai perangkat mencukupi.',
    grade_level: 12,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_fisika/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_fisika_sheets',
    exam_token: 'FSKOPT',
    finish_token: 'SLSAI2',
    start_time: '2026-11-11T08:00',
    end_time: '2026-11-11T17:00',
    duration_minutes: 60,
  },
  {
    id: generateUUID(),
    subject: 'Bahasa Indonesia',
    title: 'Simulasi Asesmen Bahasa Indonesia',
    session_group: 'Simulasi & Try Out',
    description: 'Teks Eksplanasi dan Teks Prosedur Kompleks untuk Kelas XI.',
    grade_level: 11,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_indo/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_indo_sheets',
    exam_token: 'BINDXI',
    finish_token: 'SLSAI3',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:30',
    duration_minutes: 75,
  },
  {
    id: generateUUID(),
    subject: 'Biologi',
    title: 'Bank Soal: Biologi Sel, Genetika & Hereditas',
    session_group: 'Penilaian Harian (PH)',
    description: 'Master bank soal bab genetika dan metabolisme sel. Soal ini tersimpan di arsip bank soal.',
    grade_level: 12,
    is_active: false,
    is_archived: true, // Diarsipkan ke Bank Soal
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_biologi/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_biologi_sheets',
    exam_token: 'BIOGEN',
    start_time: '2026-11-10T08:00',
    end_time: '2026-11-10T15:00',
    duration_minutes: 60,
  },
];

/**
 * Service Database Terpusat (localStorage + API Adapter)
 */
export const storageService = {
  // Inisialisasi awal
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INSTITUTION)) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(DEFAULT_INSTITUTION));
    } else {
      // Migrasi pembersihan kredensial dummy bawaan & penegakan aturan mode produksi:
      // Jika kredensial kosong, maka status otomatis OFF.
      try {
        const rawInst = localStorage.getItem(STORAGE_KEYS.INSTITUTION);
        if (rawInst) {
          const parsed = JSON.parse(rawInst);
          let modified = false;

          // Hapus kredensial dummy bawaan sebelumnya
          if (
            parsed.google_client_id === '842918239012-examguard.apps.googleusercontent.com' ||
            parsed.google_client_id?.includes('842918239012-examguard')
          ) {
            parsed.google_client_id = '';
            parsed.google_client_secret = '';
            parsed.google_oauth_enabled = false;
            modified = true;
          }

          if (
            parsed.recaptcha_site_key === '6LeIx0aUAAAAAExampleKeyExamGuardSiteKey' ||
            parsed.recaptcha_site_key?.includes('6LeIx0aUAAAAAExampleKey')
          ) {
            parsed.recaptcha_site_key = '';
            parsed.recaptcha_secret_key = '';
            parsed.recaptcha_enabled = false;
            modified = true;
          }

          // Rule: Jika belum di-set (kosong), otomatis OFF
          if (!parsed.google_client_id || !parsed.google_client_id.trim()) {
            if (parsed.google_oauth_enabled) {
              parsed.google_oauth_enabled = false;
              modified = true;
            }
          }

          if (!parsed.recaptcha_site_key || !parsed.recaptcha_site_key.trim()) {
            if (parsed.recaptcha_enabled) {
              parsed.recaptcha_enabled = false;
              modified = true;
            }
          }

          if (modified) {
            localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(parsed));
          }
        }
      } catch {}
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    } else {
      // Pastikan akun proktor dan super admin selalu tersedia di database
      try {
        const currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        let modified = false;

        // Cek akun proktor
        const hasProctor = currentUsers.some((u) => u.username === 'proktor' || (u.role === 'proctor' && u.username));
        if (!hasProctor) {
          currentUsers.push({
            id: 'PROCTOR-01',
            username: 'proktor',
            password: 'proktor',
            nama: 'Proktor Ujian',
            email: 'proktor@examguard.sch.id',
            role: 'proctor',
            nisn: '',
            nis: '',
            kelas: 'Pengawas / Proktor',
            tingkat: 0,
            is_active: true,
            is_verified: true,
            active_device_id: null,
          });
          modified = true;
        }

        // Pastikan akun admin memiliki role admin
        const adminUser = currentUsers.find((u) => u.username === 'admin');
        if (adminUser && adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          modified = true;
        }

        // Pastikan data siswa memiliki field nomor_ujian, jenis_kelamin, agama, dan integritas status akun
        currentUsers.forEach((u) => {
          if (u.role === 'student') {
            if (!u.nomor_ujian) {
              u.nomor_ujian = u.nisn || '';
              modified = true;
            }
            if (!u.jenis_kelamin) {
              u.jenis_kelamin = 'L';
              modified = true;
            }
            if (!u.agama) {
              u.agama = 'Islam';
              modified = true;
            }
            // Audit integritas status akun peserta: jika undefined atau null, pastikan valid
            if (u.is_active === undefined || u.is_active === null) {
              u.is_active = true;
              modified = true;
            }
            if (u.is_verified === undefined || u.is_verified === null) {
              u.is_verified = true;
              modified = true;
            }
            // Auto-heal untuk akun contoh bawaan yang sempat ter-seed false
            if (u.username === '0058291022' && (!u.is_active || !u.is_verified)) {
              u.is_active = true;
              u.is_verified = true;
              modified = true;
            }
          }
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
        }
      } catch {}
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(DEFAULT_EXAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify([]));
    }
    // Aktifkan sinkronisasi otomatis antar-perangkat LAN
    initLanSyncPoller();
    if (typeof window !== 'undefined' && !window.__eg_sync_init_done) {
      window.__eg_sync_init_done = true;
      setTimeout(() => {
        try {
          broadcastSync('init_client', {});
        } catch {}
      }, 500);
    }
  },

  // 1. INSTITUSI
  getInstitution() {
    this.init();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTION)) || DEFAULT_INSTITUTION;
      const browser_permissions = {
        ...DEFAULT_BROWSER_PERMISSIONS,
        ...(parsed.browser_permissions || {}),
      };
      // Sinkronisasi otomatis gps_enabled dengan permission location_gps jika ada
      if (typeof parsed.gps_enabled === 'boolean') {
        browser_permissions.location_gps = parsed.gps_enabled;
      }

      const googleClientId = parsed.google_client_id ? String(parsed.google_client_id).trim() : '';
      const recaptchaSiteKey = parsed.recaptcha_site_key ? String(parsed.recaptcha_site_key).trim() : '';

      // ATURAN MODE PRODUKSI: Jika tidak di-set (kosong), otomatis OFF
      const google_oauth_enabled = Boolean(parsed.google_oauth_enabled) && Boolean(googleClientId);
      const recaptcha_enabled = Boolean(parsed.recaptcha_enabled) && Boolean(recaptchaSiteKey);

      let auth_method = parsed.auth_method || 'CREDENTIALS_ONLY';
      if (!google_oauth_enabled && auth_method === 'SSO_ONLY') {
        auth_method = 'CREDENTIALS_ONLY';
      }

      return {
        ...DEFAULT_INSTITUTION,
        ...parsed,
        npsn: parsed.npsn ? String(parsed.npsn).replace(/[^a-zA-Z0-9]/g, '') : '20104829',
        browser_permissions,
        google_client_id: googleClientId,
        google_client_secret: parsed.google_client_secret ? String(parsed.google_client_secret).trim() : '',
        google_oauth_enabled,
        auth_method,
        recaptcha_site_key: recaptchaSiteKey,
        recaptcha_secret_key: parsed.recaptcha_secret_key ? String(parsed.recaptcha_secret_key).trim() : '',
        recaptcha_version: parsed.recaptcha_version === 'v3' ? 'v3' : 'v2',
        recaptcha_enabled,
        finish_token_lead_minutes:
          typeof parsed.finish_token_lead_minutes === 'number'
            ? parsed.finish_token_lead_minutes
            : 10,
        gps_enabled: typeof parsed.gps_enabled === 'boolean' ? parsed.gps_enabled : true,
        logo_url: parsed.logo_url || null,
        gmaps_url: parsed.gmaps_url || 'https://maps.google.com/?q=-6.2088,106.8456',
      };
    } catch {
      return DEFAULT_INSTITUTION;
    }
  },

  updateInstitution(data) {
    const current = this.getInstitution();
    // Sinkronisasi otomatis allowed_grades sesuai jenjang pendidikan tanpa delay
    let allowed_grades = data.allowed_grades;
    if (data.education_level && EDUCATION_LEVELS[data.education_level]) {
      allowed_grades = EDUCATION_LEVELS[data.education_level].grades;
    } else if (!allowed_grades) {
      allowed_grades = current.allowed_grades || [10, 11, 12];
    }

    const npsn = data.npsn !== undefined ? String(data.npsn).replace(/[^a-zA-Z0-9]/g, '') : current.npsn || '20104829';

    const browser_permissions = {
      ...current.browser_permissions,
      ...(data.browser_permissions || {}),
    };

    // Sinkronisasi timbal balik gps_enabled
    let gps_enabled = current.gps_enabled;
    if (typeof data.gps_enabled === 'boolean') {
      gps_enabled = data.gps_enabled;
      browser_permissions.location_gps = data.gps_enabled;
    } else if (typeof data.browser_permissions?.location_gps === 'boolean') {
      gps_enabled = data.browser_permissions.location_gps;
    }

    const googleClientId = data.google_client_id !== undefined
      ? String(data.google_client_id || '').trim()
      : String(current.google_client_id || '').trim();

    const recaptchaSiteKey = data.recaptcha_site_key !== undefined
      ? String(data.recaptcha_site_key || '').trim()
      : String(current.recaptcha_site_key || '').trim();

    // ATURAN MODE PRODUKSI: Jika tidak di-set (kosong), otomatis OFF
    let google_oauth_enabled = data.google_oauth_enabled !== undefined
      ? Boolean(data.google_oauth_enabled)
      : Boolean(current.google_oauth_enabled);
    if (!googleClientId) {
      google_oauth_enabled = false;
    }

    let recaptcha_enabled = data.recaptcha_enabled !== undefined
      ? Boolean(data.recaptcha_enabled)
      : Boolean(current.recaptcha_enabled);
    if (!recaptchaSiteKey) {
      recaptcha_enabled = false;
    }

    let auth_method = data.auth_method !== undefined ? data.auth_method : (current.auth_method || 'CREDENTIALS_ONLY');
    if (!google_oauth_enabled && auth_method === 'SSO_ONLY') {
      auth_method = 'CREDENTIALS_ONLY';
    }

    const recaptcha_version = data.recaptcha_version === 'v3'
      ? 'v3'
      : (data.recaptcha_version === 'v2' ? 'v2' : (current.recaptcha_version || 'v2'));

    const updated = {
      ...current,
      ...data,
      npsn,
      gps_enabled,
      browser_permissions,
      allowed_grades,
      google_client_id: googleClientId,
      google_oauth_enabled,
      auth_method,
      recaptcha_version,
      recaptcha_site_key: recaptchaSiteKey,
      recaptcha_enabled,
    };
    localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(updated));
    broadcastSync('institution_updated', { institution: updated });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: updated }));
    }
    return updated;
  },

  // 2. USERS
  getUsers() {
    this.init();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
      let modified = false;

      // Normalisasi aturan: tidak boleh aktif jika belum terverifikasi & lengkapi data Google SSO
      const normalized = raw.map((u) => {
        const isVerified = typeof u.is_verified === 'boolean' ? u.is_verified : true;
        let isActive = typeof u.is_active === 'boolean' ? u.is_active : true;

        // RULE: Tidak boleh aktif jika belum terverifikasi
        if (!isVerified && isActive) {
          isActive = false;
          modified = true;
        }

        // RULE: Google SSO status: centang hijau HANYA jika pernah login menggunakan email terdaftar & menyimpan id akun google
        const googleId = u.google_id || (u.google_linked && u.username === '0058291021' ? '108291021482019284' : null);
        const googleLinked = Boolean(u.google_linked && googleId);
        const googleEmail = googleLinked ? (u.google_email || u.email) : null;
        const googleLinkedAt = googleLinked ? (u.google_linked_at || '2026-11-10T08:30:00Z') : null;

        // RULE: Password default siswa adalah nomor NIS
        let password = u.password;
        if (u.role === 'student' && (!password || password === u.nisn) && u.nis) {
          password = String(u.nis).trim();
          modified = true;
        }

        // RULE: Ruang ujian siswa
        const ruang = u.role === 'student' ? (u.ruang || 'Ruang 01') : '';
        if (u.role === 'student' && !u.ruang) {
          modified = true;
        }

        // RULE: Nomor Ujian Siswa (Jika kosong / tidak diisikan, default ke NISN)
        const nomorUjian = u.role === 'student' ? cleanNomorUjian(u.nomor_ujian, u.nisn) : (u.nomor_ujian || '');
        const jenisKelamin = u.role === 'student' ? (u.jenis_kelamin === 'P' ? 'P' : 'L') : (u.jenis_kelamin || '');
        const agama = u.role === 'student' ? (u.agama || 'Islam') : (u.agama || '');

        if (
          u.role === 'student' &&
          (u.nomor_ujian !== nomorUjian || u.jenis_kelamin !== jenisKelamin || u.agama !== agama)
        ) {
          modified = true;
        }

        if (
          u.is_verified !== isVerified ||
          u.is_active !== isActive ||
          u.google_linked !== googleLinked ||
          u.google_id !== googleId ||
          u.google_email !== googleEmail ||
          u.google_linked_at !== googleLinkedAt ||
          u.password !== password ||
          (u.role === 'student' && !u.ruang)
        ) {
          modified = true;
        }

        return {
          ...u,
          nomor_ujian: u.role === 'student' ? nomorUjian : (u.nomor_ujian || ''),
          jenis_kelamin: u.role === 'student' ? jenisKelamin : (u.jenis_kelamin || ''),
          agama: u.role === 'student' ? agama : (u.agama || ''),
          ruang: u.role === 'student' ? ruang : (u.ruang || ''),
          password: password || u.password,
          is_verified: isVerified,
          is_active: isActive,
          google_linked: googleLinked,
          google_id: googleId,
          google_email: googleEmail,
          google_linked_at: googleLinkedAt,
        };
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },

  getUserById(id) {
    return this.getUsers().find((u) => u.id === id) || null;
  },

  getUserByUsername(username) {
    if (!username) return null;
    const q = username.toLowerCase().trim();
    return (
      this.getUsers().find(
        (u) =>
          (u.username && u.username.toLowerCase() === q) ||
          (u.nisn && u.nisn.toLowerCase() === q) ||
          (u.nomor_ujian && u.nomor_ujian.toLowerCase() === q)
      ) || null
    );
  },

  getUserByEmail(email) {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  saveUser(user) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push({ ...user, id: user.id || generateUUID() });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  deleteUser(id) {
    const users = this.getUsers().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  toggleUserActive(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      // RULE: Tidak boleh aktif jika belum terverifikasi!
      if (!target.is_verified && !target.is_active) {
        throw new Error(
          'Siswa belum terverifikasi oleh panitia! Harap verifikasi siswa terlebih dahulu sebelum mengaktifkan akun.'
        );
      }
      target.is_active = !target.is_active;
      // Jika statusnya belum terverifikasi, pastikan tetap false
      if (!target.is_verified) {
        target.is_active = false;
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  toggleUserVerified(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      target.is_verified = !target.is_verified;
      // RULE: Jika verifikasi dicabut (false), status akun otomatis WAJIB dinonaktifkan!
      if (!target.is_verified) {
        target.is_active = false;
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  // Update akun peserta: jika email diubah dan berbeda dengan sebelumnya maka status SSO off!
  updateStudent(id, data) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, message: 'Data peserta tidak ditemukan.' };
    }

    const current = users[index];
    const otherStudents = users.filter((u) => u.role === 'student' && u.id !== id);

    const oldEmail = (current.email || '').toLowerCase().trim();
    const newEmail = (data.email || '').toLowerCase().trim();

    // RULE PENTING: Jika email di-update dan berbeda dengan sebelumnya maka status SSO off!
    const emailChanged = oldEmail !== newEmail;
    const googleLinked = emailChanged ? false : Boolean(current.google_linked && current.google_id);
    const googleId = emailChanged ? null : (current.google_id || null);
    const googleEmail = emailChanged ? null : (current.google_email || null);
    const googleLinkedAt = emailChanged ? null : (current.google_linked_at || null);

    const nisn = String(data.nisn !== undefined ? data.nisn : current.nisn).trim();
    if (!nisn) {
      return { success: false, message: 'NISN siswa wajib diisi.' };
    }

    // 1. Validasi duplikasi NISN (terhadap peserta lain)
    const duplicateNisn = otherStudents.find(
      (u) =>
        (u.nisn && u.nisn.trim().toLowerCase() === nisn.toLowerCase()) ||
        (u.username && u.username.trim().toLowerCase() === nisn.toLowerCase())
    );
    if (duplicateNisn) {
      return {
        success: false,
        field: 'nisn',
        message: `NISN "${nisn}" sudah terdaftar untuk siswa lain: "${duplicateNisn.nama}" (${duplicateNisn.kelas || 'Kelas -'}).`,
      };
    }

    // 2. Validasi duplikasi Nomor Ujian (terhadap peserta lain)
    const rawNoUjian = data.nomor_ujian !== undefined ? String(data.nomor_ujian).trim() : current.nomor_ujian;
    const nomorUjian = cleanNomorUjian(rawNoUjian, nisn);
    const duplicateNoUjian = otherStudents.find((u) => {
      const uNoUjian = cleanNomorUjian(u.nomor_ujian, u.nisn);
      return uNoUjian.toLowerCase() === nomorUjian.toLowerCase();
    });
    if (duplicateNoUjian) {
      return {
        success: false,
        field: 'nomor_ujian',
        message: `Nomor Ujian "${nomorUjian}" sudah terdaftar untuk siswa lain: "${duplicateNoUjian.nama}" (${duplicateNoUjian.kelas || 'Kelas -'}).`,
      };
    }

    // 3. Validasi duplikasi NIS (jika diisi dan bukan '-')
    const nis = String(data.nis !== undefined ? data.nis : current.nis || '').trim();
    if (nis && nis !== '-') {
      const duplicateNis = otherStudents.find((u) => {
        const uNis = String(u.nis || '').trim();
        return uNis && uNis !== '-' && uNis.toLowerCase() === nis.toLowerCase();
      });
      if (duplicateNis) {
        return {
          success: false,
          field: 'nis',
          message: `NIS "${nis}" sudah terdaftar untuk siswa lain: "${duplicateNis.nama}" (${duplicateNis.kelas || 'Kelas -'}).`,
        };
      }
    }

    const isVerified = typeof data.is_verified === 'boolean' ? data.is_verified : current.is_verified;
    const isActive = isVerified ? (typeof data.is_active === 'boolean' ? data.is_active : current.is_active) : false;
    const jenisKelamin = data.jenis_kelamin !== undefined ? (data.jenis_kelamin === 'P' ? 'P' : 'L') : (current.jenis_kelamin || 'L');
    const agama = data.agama !== undefined ? String(data.agama).trim() : (current.agama || 'Islam');

    users[index] = {
      ...current,
      nama: (data.nama || current.nama).trim(),
      nomor_ujian: nomorUjian,
      jenis_kelamin: jenisKelamin,
      agama: agama,
      nisn: nisn,
      username: nisn, // Sinkronisasi username dengan NISN
      nis: nis,
      kelas: (data.kelas || current.kelas).trim(),
      tingkat: data.tingkat !== undefined ? parseInt(data.tingkat, 10) : current.tingkat,
      ruang: data.ruang !== undefined ? String(data.ruang).trim() : (current.ruang || 'Ruang 01'),
      email: newEmail,
      is_verified: isVerified,
      is_active: isActive,
      google_linked: googleLinked,
      google_id: googleId,
      google_email: googleEmail,
      google_linked_at: googleLinkedAt,
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    broadcastSync('update_student', { studentId: id });
    return {
      success: true,
      emailChanged,
      user: users[index],
    };
  },

  // Tambah peserta manual (status SSO awal otomatis OFF)
  addStudent(data) {
    const users = this.getUsers();
    const students = users.filter((u) => u.role === 'student');
    const nisn = String(data.nisn || '').trim();
    if (!nisn) {
      return { success: false, message: 'NISN siswa wajib diisi.' };
    }

    // 1. Cek duplikasi NISN
    const duplicateNisn = students.find(
      (u) =>
        (u.nisn && u.nisn.trim().toLowerCase() === nisn.toLowerCase()) ||
        (u.username && u.username.trim().toLowerCase() === nisn.toLowerCase())
    );
    if (duplicateNisn) {
      return {
        success: false,
        field: 'nisn',
        message: `Siswa dengan NISN "${nisn}" sudah terdaftar atas nama "${duplicateNisn.nama}" (${duplicateNisn.kelas || 'Kelas -'}).`,
      };
    }

    // 2. Cek duplikasi Nomor Ujian
    const rawNoUjian = String(data.nomor_ujian || '').trim();
    const nomorUjian = cleanNomorUjian(rawNoUjian, nisn);
    const duplicateNoUjian = students.find((u) => {
      const uNoUjian = cleanNomorUjian(u.nomor_ujian, u.nisn);
      return uNoUjian.toLowerCase() === nomorUjian.toLowerCase();
    });
    if (duplicateNoUjian) {
      return {
        success: false,
        field: 'nomor_ujian',
        message: `Nomor Ujian "${nomorUjian}" sudah terdaftar atas nama "${duplicateNoUjian.nama}" (${duplicateNoUjian.kelas || 'Kelas -'}).`,
      };
    }

    // 3. Cek duplikasi NIS (jika diisi dan bukan '-')
    const rawNis = String(data.nis || '').trim();
    if (rawNis && rawNis !== '-') {
      const duplicateNis = students.find((u) => {
        const uNis = String(u.nis || '').trim();
        return uNis && uNis !== '-' && uNis.toLowerCase() === rawNis.toLowerCase();
      });
      if (duplicateNis) {
        return {
          success: false,
          field: 'nis',
          message: `NIS "${rawNis}" sudah terdaftar atas nama "${duplicateNis.nama}" (${duplicateNis.kelas || 'Kelas -'}).`,
        };
      }
    }

    const isVerified = typeof data.is_verified === 'boolean' ? data.is_verified : true;
    const isActive = isVerified ? (typeof data.is_active === 'boolean' ? data.is_active : true) : false;

    const jenisKelamin = data.jenis_kelamin === 'P' ? 'P' : 'L';
    const agama = String(data.agama || 'Islam').trim() || 'Islam';

    const newStudent = {
      id: generateUUID(),
      username: nisn,
      password: String(data.nis || nisn).trim(), // Default password adalah nomor NIS (atau NISN jika NIS kosong)
      nama: (data.nama || `Siswa ${nisn}`).trim(),
      nomor_ujian: nomorUjian,
      jenis_kelamin: jenisKelamin,
      agama: agama,
      nisn: nisn,
      nis: rawNis,
      kelas: String(data.kelas || '-').trim(),
      tingkat: parseInt(data.tingkat, 10) || 0,
      ruang: String(data.ruang || 'Ruang 01').trim(),
      email: (data.email || `${nisn}@student.sch.id`).toLowerCase().trim(),
      role: 'student',
      is_active: isActive,
      is_verified: isVerified,
      // Status SSO awal otomatis OFF (sampai siswa login via Google SSO)
      google_linked: false,
      google_id: null,
      google_email: null,
      google_linked_at: null,
      active_device_id: null,
    };

    users.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    broadcastSync('add_student', { student: newStudent });
    return { success: true, user: newStudent };
  },

  resetUserDevice(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      target.active_device_id = null;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  // Reset Kata Sandi Siswa ke Default (Nomor NIS siswa)
  resetStudentPassword(studentId) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === studentId);
    if (!target) {
      throw new Error('Data peserta tidak ditemukan.');
    }
    const defaultPassword = String(target.nis || target.nisn).trim();
    target.password = defaultPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return target;
  },

  unlinkStudentGoogle(studentId) {
    return this.resetStudentSSO(studentId);
  },

  // Reset Tautan Google SSO Siswa (Memutuskan koneksi akun Google & mengembalikan ke login NISN/NIS)
  resetStudentSSO(studentId) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === studentId);
    if (!target) {
      throw new Error('Data peserta tidak ditemukan.');
    }
    target.google_linked = false;
    target.google_id = null;
    target.google_email = null;
    target.google_linked_at = null;
    // Pastikan password tetap terisi nomor NIS
    if (!target.password) {
      target.password = String(target.nis || target.nisn).trim();
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return target;
  },

  /**
   * Validasi Lengkap Data Import Peserta (Anti-Duplikasi No Ujian, NISN, dan NIS)
   * Memeriksa duplikasi terhadap database sistem dan antar baris dalam file import itu sendiri.
   */
  validateImportStudents(studentsList) {
    const existingStudents = this.getUsers().filter((u) => u.role === 'student');
    const errors = [];
    const validStudents = [];

    // Map untuk mendeteksi duplikasi internal di dalam list import sendiri
    const seenNisnInFile = new Map(); // nisn.toLowerCase() -> { rowNum, nama }
    const seenNoUjianInFile = new Map(); // noUjian.toLowerCase() -> { rowNum, nama }
    const seenNisInFile = new Map(); // nis.toLowerCase() -> { rowNum, nama }

    studentsList.forEach((row, index) => {
      const rowNum = row.rowNumber || index + 1;
      const nama = String(row.nama || '').trim();
      const nisn = String(row.nisn || '').trim();
      const rawNoUjian = String(row.nomor_ujian || '').trim();
      const nomorUjian = cleanNomorUjian(rawNoUjian, nisn);
      const rawNis = String(row.nis || '').trim();

      let rowHasError = false;

      // 1. Validasi Keberadaan Nama & NISN
      if (!nama) {
        errors.push({
          rowNumber: rowNum,
          nama: '(Nama Kosong)',
          field: 'nama',
          fieldLabel: 'Nama Peserta',
          value: '-',
          conflictType: 'format',
          conflictWith: '-',
          description: 'Nama peserta wajib diisi.',
        });
        rowHasError = true;
      }

      if (!nisn) {
        errors.push({
          rowNumber: rowNum,
          nama: nama || `Baris ${rowNum}`,
          field: 'nisn',
          fieldLabel: 'NISN',
          value: '-',
          conflictType: 'format',
          conflictWith: '-',
          description: 'NISN peserta wajib diisi.',
        });
        rowHasError = true;
      }

      if (!nisn) return; // Jika NISN kosong, jangan lanjut cek duplikasi

      const nisnLower = nisn.toLowerCase();
      const noUjianLower = nomorUjian.toLowerCase();
      const nisLower = rawNis.toLowerCase();

      // 2. Cek Duplikasi NISN
      // A. Terhadap file import (internal)
      if (seenNisnInFile.has(nisnLower)) {
        const prev = seenNisnInFile.get(nisnLower);
        errors.push({
          rowNumber: rowNum,
          nama,
          field: 'nisn',
          fieldLabel: 'NISN',
          value: nisn,
          conflictType: 'file',
          conflictWith: `Baris ${prev.rowNum} (${prev.nama})`,
          description: `NISN "${nisn}" duplikat dengan Baris ${prev.rowNum} (${prev.nama}) pada file import.`,
        });
        rowHasError = true;
      } else {
        seenNisnInFile.set(nisnLower, { rowNum, nama });
      }

      // B. Terhadap data siswa yang sudah ada di sistem
      const existingWithNisn = existingStudents.find(
        (u) =>
          (u.nisn && u.nisn.trim().toLowerCase() === nisnLower) ||
          (u.username && u.username.trim().toLowerCase() === nisnLower)
      );
      if (existingWithNisn) {
        errors.push({
          rowNumber: rowNum,
          nama,
          field: 'nisn',
          fieldLabel: 'NISN',
          value: nisn,
          conflictType: 'system',
          conflictWith: `Sistem: ${existingWithNisn.nama} (${existingWithNisn.kelas || 'Kelas -'})`,
          description: `NISN "${nisn}" sudah terdaftar di sistem pada siswa "${existingWithNisn.nama}" (${existingWithNisn.kelas || 'Kelas -'}).`,
        });
        rowHasError = true;
      }

      // 3. Cek Duplikasi Nomor Ujian
      if (nomorUjian) {
        // A. Terhadap file import (internal)
        if (seenNoUjianInFile.has(noUjianLower)) {
          const prev = seenNoUjianInFile.get(noUjianLower);
          errors.push({
            rowNumber: rowNum,
            nama,
            field: 'nomor_ujian',
            fieldLabel: 'Nomor Ujian',
            value: nomorUjian,
            conflictType: 'file',
            conflictWith: `Baris ${prev.rowNum} (${prev.nama})`,
            description: `Nomor Ujian "${nomorUjian}" duplikat dengan Baris ${prev.rowNum} (${prev.nama}) pada file import.`,
          });
          rowHasError = true;
        } else {
          seenNoUjianInFile.set(noUjianLower, { rowNum, nama });
        }

        // B. Terhadap data siswa yang sudah ada di sistem
        const existingWithNoUjian = existingStudents.find((u) => {
          const uNoUjian = cleanNomorUjian(u.nomor_ujian, u.nisn);
          return uNoUjian.toLowerCase() === noUjianLower;
        });
        if (existingWithNoUjian) {
          errors.push({
            rowNumber: rowNum,
            nama,
            field: 'nomor_ujian',
            fieldLabel: 'Nomor Ujian',
            value: nomorUjian,
            conflictType: 'system',
            conflictWith: `Sistem: ${existingWithNoUjian.nama} (${existingWithNoUjian.kelas || 'Kelas -'})`,
            description: `Nomor Ujian "${nomorUjian}" sudah terdaftar di sistem pada siswa "${existingWithNoUjian.nama}" (${existingWithNoUjian.kelas || 'Kelas -'}).`,
          });
          rowHasError = true;
        }
      }

      // 4. Cek Duplikasi NIS (jika diisi dan bukan '-')
      if (rawNis && rawNis !== '-') {
        // A. Terhadap file import (internal)
        if (seenNisInFile.has(nisLower)) {
          const prev = seenNisInFile.get(nisLower);
          errors.push({
            rowNumber: rowNum,
            nama,
            field: 'nis',
            fieldLabel: 'NIS',
            value: rawNis,
            conflictType: 'file',
            conflictWith: `Baris ${prev.rowNum} (${prev.nama})`,
            description: `NIS "${rawNis}" duplikat dengan Baris ${prev.rowNum} (${prev.nama}) pada file import.`,
          });
          rowHasError = true;
        } else {
          seenNisInFile.set(nisLower, { rowNum, nama });
        }

        // B. Terhadap data siswa yang sudah ada di sistem
        const existingWithNis = existingStudents.find((u) => {
          const uNis = String(u.nis || '').trim();
          return uNis && uNis !== '-' && uNis.toLowerCase() === nisLower;
        });
        if (existingWithNis) {
          errors.push({
            rowNumber: rowNum,
            nama,
            field: 'nis',
            fieldLabel: 'NIS',
            value: rawNis,
            conflictType: 'system',
            conflictWith: `Sistem: ${existingWithNis.nama} (${existingWithNis.kelas || 'Kelas -'})`,
            description: `NIS "${rawNis}" sudah terdaftar di sistem pada siswa "${existingWithNis.nama}" (${existingWithNis.kelas || 'Kelas -'}).`,
          });
          rowHasError = true;
        }
      }

      if (!rowHasError) {
        validStudents.push({
          ...row,
          nama,
          nisn,
          nomor_ujian: nomorUjian,
          nis: rawNis,
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validStudents,
      totalParsed: studentsList.length,
    };
  },

  importStudents(studentsList) {
    const validation = this.validateImportStudents(studentsList);
    if (!validation.isValid) {
      return {
        success: false,
        message: `Ditemukan ${validation.errors.length} duplikasi atau kesalahan data pada file import.`,
        errors: validation.errors,
        count: 0,
      };
    }

    const users = this.getUsers();
    let importedCount = 0;

    validation.validStudents.forEach((row) => {
      const nisn = String(row.nisn || '').trim();
      if (!nisn) return;

      const rawNoUjian = String(row.nomor_ujian || '').trim();
      const nomorUjian = cleanNomorUjian(rawNoUjian, nisn);
      const rawJk = String(row.jenis_kelamin || '').trim().toUpperCase();
      const jenisKelamin = rawJk.startsWith('P') ? 'P' : 'L';
      const agama = String(row.agama || 'Islam').trim() || 'Islam';

      const newStudent = {
        id: generateUUID(),
        username: nisn,
        password: String(row.nis || nisn).trim(), // Default password adalah nomor NIS (atau NISN jika NIS kosong)
        nama: row.nama || `Siswa ${nisn}`,
        nomor_ujian: nomorUjian,
        jenis_kelamin: jenisKelamin,
        agama: agama,
        nisn: nisn,
        nis: String(row.nis || '').trim(),
        kelas: String(row.kelas || '-').trim(),
        tingkat: parseInt(row.tingkat, 10) || 0,
        ruang: String(row.ruang || 'Ruang 01').trim(),
        email: (row.email || `${nisn}@student.sch.id`).toLowerCase().trim(),
        role: 'student',
        is_active: true,
        is_verified: true,
        google_linked: false,
        google_id: null,
        google_email: null,
        google_linked_at: null,
        active_device_id: null,
      };

      users.push(newStudent);
      importedCount++;
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    broadcastSync('import_students', { count: importedCount });
    return {
      success: true,
      count: importedCount,
      valueOf() {
        return importedCount;
      },
    };
  },

  // Mengambil data kedua akun pengawas (Super Admin & Proktor)
  getAdminAccounts() {
    const users = this.getUsers();
    return {
      superAdmin: users.find((u) => u.role === 'admin' || u.username === 'admin') || null,
      proctor: users.find((u) => u.role === 'proctor' || u.username === 'proktor') || null,
    };
  },

  // Update profil kredensial akun Super Admin atau Proktor
  updateAdminProfile(userId, { username, email, password, nama }) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId && (u.role === 'admin' || u.role === 'proctor'));
    if (!target) return { success: false, message: 'Akun pengawas/administrator tidak ditemukan' };

    // Validasi keunikan username
    if (username && username.trim().toLowerCase() !== target.username.toLowerCase()) {
      const cleanUser = username.trim().toLowerCase();
      const duplicate = users.find(
        (u) => u.id !== userId && u.username.toLowerCase() === cleanUser
      );
      if (duplicate) {
        return { success: false, message: `Username "${username}" sudah digunakan oleh akun lain.` };
      }
      target.username = username.trim();
    }

    if (email) target.email = email.trim();
    if (password) target.password = password;
    if (nama) target.nama = nama.trim();

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update session jika akun yang sedang diedit adalah pengguna yang sedang login
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(target);
    }
    return { success: true, user: target };
  },

  // 3. EXAM SESSIONS & BANK SOAL
  getExamSessions() {
    this.init();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) || [];
      let modified = false;

      const normalized = raw.map((e) => {
        const subject = e.subject || (e.title ? e.title.split('-')[0].trim() : 'Mata Pelajaran Umum');
        const sessionGroup = e.session_group || 'Asesmen Tengah Semester (ATS)';
        const isArchived = typeof e.is_archived === 'boolean' ? e.is_archived : false;
        const examToken = formatExamToken(e.exam_token);
        const finishToken = formatExamToken(e.finish_token || 'SLSAI1');
        const gformBaseUrl = convertGoogleFormUrl(e.gform_base_url || '');

        if (
          e.subject !== subject ||
          e.session_group !== sessionGroup ||
          e.is_archived !== isArchived ||
          e.exam_token !== examToken ||
          e.finish_token !== finishToken ||
          (e.gform_base_url && e.gform_base_url !== gformBaseUrl)
        ) {
          modified = true;
        }

        return {
          ...e,
          subject,
          session_group: sessionGroup,
          is_archived: isArchived,
          exam_token: examToken,
          finish_token: finishToken,
          gform_base_url: gformBaseUrl || e.gform_base_url,
        };
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },

  getExamSessionById(id) {
    return this.getExamSessions().find((e) => e.id === id) || null;
  },

  saveExamSession(examData) {
    const exams = this.getExamSessions();
    const examToSave = {
      ...examData,
      id: examData.id || generateUUID(),
      subject: (examData.subject || 'Mata Pelajaran Umum').trim(),
      session_group: (examData.session_group || 'Asesmen Tengah Semester (ATS)').trim(),
      exam_token: formatExamToken(examData.exam_token),
      finish_token: formatExamToken(examData.finish_token || 'SLSAI1'),
      gform_base_url: convertGoogleFormUrl(examData.gform_base_url || ''),
      grade_level: parseInt(examData.grade_level, 10) || 0,
      duration_minutes: parseInt(examData.duration_minutes, 10) || 60,
      is_active: typeof examData.is_active === 'boolean' ? examData.is_active : true,
      is_archived: typeof examData.is_archived === 'boolean' ? examData.is_archived : false,
    };

    const index = exams.findIndex((e) => e.id === examToSave.id);
    if (index >= 0) {
      exams[index] = examToSave;
    } else {
      exams.push(examToSave);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    broadcastSync('sessions_updated', { examSessions: exams });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return examToSave;
  },

  archiveExam(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_archived = true;
      target.is_active = false; // Saat diarsipkan otomatis nonaktif di jadwal aktif siswa
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      broadcastSync('sessions_updated', { examSessions: exams });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  restoreExamFromArchive(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_archived = false;
      target.is_active = true; // Otomatis aktif kembali di jadwal ujian
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      broadcastSync('sessions_updated', { examSessions: exams });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  deleteExamSession(id) {
    const exams = this.getExamSessions().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    broadcastSync('sessions_updated', { examSessions: exams });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
  },

  toggleExamActive(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_active = !target.is_active;
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      broadcastSync('sessions_updated', { examSessions: exams });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  // 4. STUDENT ATTEMPTS & PROCTOR CONTROL
  getAttempts() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS)) || [];
    } catch {
      return [];
    }
  },

  getStudentAttempts() {
    return this.getAttempts();
  },

  getAttempt(studentIdOrNisn, examSessionId) {
    const attempts = this.getAttempts();
    return (
      attempts.find(
        (a) =>
          (a.student_id === studentIdOrNisn ||
            a.student_nisn === studentIdOrNisn ||
            (a.student_id && String(a.student_id) === String(studentIdOrNisn)) ||
            (a.student_nisn && String(a.student_nisn) === String(studentIdOrNisn))) &&
          (!examSessionId || a.exam_session_id === examSessionId)
      ) || null
    );
  },

  // Update khusus waktu pengerjaan (dipanggil oleh timer 1s tanpa merusak status / violation)
  updateAttemptTime(studentIdOrNisn, examSessionId, timeSpentSeconds) {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(
      (a) =>
        (a.student_id === studentIdOrNisn || a.student_nisn === studentIdOrNisn) &&
        (!examSessionId || a.exam_session_id === examSessionId)
    );
    if (index >= 0) {
      attempts[index].time_spent_seconds = timeSpentSeconds;
      attempts[index].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      return attempts[index];
    }
    return null;
  },

  saveAttempt(attemptData) {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(
      (a) =>
        (attemptData.id && a.id === attemptData.id) ||
        (attemptData.student_id && attemptData.exam_session_id &&
          a.student_id === attemptData.student_id &&
          a.exam_session_id === attemptData.exam_session_id) ||
        (attemptData.student_nisn && attemptData.exam_session_id &&
          a.student_nisn === attemptData.student_nisn &&
          a.exam_session_id === attemptData.exam_session_id)
    );

    let result;
    if (index >= 0) {
      const existing = attempts[index];

      // PERLINDUNGAN PELANGGARAN: Pertahankan violation_count yang lebih besar kecuali jika tindakan reset pengawas
      const maxViolations = attemptData.is_reset_violations
        ? (attemptData.violation_count ?? 0)
        : Math.max(Number(existing.violation_count || 0), Number(attemptData.violation_count || 0));

      // PERLINDUNGAN PENGUNCIAN: Jika attempt di storage sudah LOCKED, jangan izinkan ditimpa mundur ke IN_PROGRESS
      // kecuali secara eksplisit oleh aksi pengawas (is_proctor_action) atau siswa menyelesaikan ujian (COMPLETED)
      const isProctorUnlock = Boolean(attemptData.is_proctor_action || attemptData.status === 'UNLOCKED');
      let nextStatus = attemptData.status || existing.status || 'IN_PROGRESS';
      if (existing.status === 'LOCKED' && !isProctorUnlock && nextStatus !== 'RESET_BY_PROCTOR' && nextStatus !== 'COMPLETED') {
        nextStatus = 'LOCKED';
      }

      attempts[index] = {
        ...existing,
        ...attemptData,
        id: existing.id || attemptData.id || generateUUID(),
        violation_count: maxViolations,
        status: nextStatus,
        last_violation_reason: attemptData.last_violation_reason || existing.last_violation_reason || '',
        updated_at: new Date().toISOString(),
      };
      result = attempts[index];
    } else {
      const record = {
        id: attemptData.id || generateUUID(),
        violation_count: 0,
        time_spent_seconds: 0,
        status: 'IN_PROGRESS',
        started_at: new Date().toISOString(),
        completed_at: null,
        ...attemptData,
        updated_at: new Date().toISOString(),
      };
      attempts.push(record);
      result = record;
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
    broadcastSync('attempt_updated', { attempt: result });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return result;
  },

  // Aksi Pengawas 1: Reset Login Siswa
  proctorResetStudentDevice(studentId) {
    const res = this.resetUserDevice(studentId);
    broadcastSync('device_reset', { studentId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return res;
  },

  // Aksi Pengawas 2: Unlock Siswa
  proctorUnlockAttempt(idOrStudentId) {
    const attempts = this.getAttempts();
    let target = attempts.find(
      (a) => a.id === idOrStudentId || a.student_id === idOrStudentId || a.student_nisn === idOrStudentId
    );
    if (target) {
      target.status = 'IN_PROGRESS';
      target.violation_count = 0; // Reset pelanggaran agar siswa mendapat kesempatan lanjut ujian
      target.last_violation_reason = '';
      target.unlocked_at = new Date().toISOString();
      target.is_proctor_action = true;
      target.is_reset_violations = true;
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      broadcastSync('attempt_unlocked', { attemptId: target.id, student_id: target.student_id });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    } else {
      // Fail-safe: jika siswa belum tercatat di array attempts tapi diminta buka kunci
      const student = this.getUsers().find((u) => u.id === idOrStudentId || u.nisn === idOrStudentId);
      if (student) {
        target = {
          id: generateUUID(),
          student_id: student.id,
          student_name: student.nama,
          student_nisn: student.nisn,
          student_kelas: student.kelas,
          student_tingkat: student.tingkat,
          exam_title: 'Sesi Ujian',
          status: 'IN_PROGRESS',
          violation_count: 0,
          last_violation_reason: '',
          unlocked_at: new Date().toISOString(),
          is_proctor_action: true,
          is_reset_violations: true,
        };
        attempts.push(target);
        localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
        broadcastSync('attempt_unlocked', { attemptId: target.id, student_id: target.student_id });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
        }
      }
    }
    return target;
  },

  // Aksi Pengawas 2b: Reset Penghitung Pelanggaran Siswa
  proctorResetViolations(idOrStudentId) {
    const attempts = this.getAttempts();
    const target = attempts.find(
      (a) => a.id === idOrStudentId || a.student_id === idOrStudentId || a.student_nisn === idOrStudentId
    );
    if (target) {
      target.violation_count = 0;
      target.last_violation_reason = '';
      target.is_reset_violations = true;
      if (target.status === 'LOCKED') {
        target.status = 'IN_PROGRESS';
        target.unlocked_at = new Date().toISOString();
        target.is_proctor_action = true;
      }
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      broadcastSync('violations_reset', { attemptId: target.id, student_id: target.student_id });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  // Aksi Pengawas 3: Reset Jawaban (mengubah COMPLETED menjadi RESET_BY_PROCTOR)
  proctorResetAnswerAttempt(attemptId) {
    const attempts = this.getAttempts();
    const target = attempts.find((a) => a.id === attemptId);
    if (target) {
      target.status = 'RESET_BY_PROCTOR';
      target.violation_count = 0;
      target.time_spent_seconds = 0;
      target.last_violation_reason = '';
      target.completed_at = null;
      target.reset_at = new Date().toISOString();
      target.is_proctor_action = true;
      target.is_reset_violations = true;
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      broadcastSync('answer_reset', { attemptId, student_id: target.student_id });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  // ==========================================
  // FITUR KHUSUS: RESET LOGIN & STATUS PENGERJAAN PER MAPEL
  // ==========================================

  // Reset Login Massal untuk daftar siswa
  proctorResetBulkStudentDevices(studentIds = []) {
    let count = 0;
    studentIds.forEach((id) => {
      if (this.resetUserDevice(id)) count++;
    });
    broadcastSync('bulk_device_reset', { studentIds });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return count;
  },

  // Set Status "Belum Masuk" (Hapus attempt pengerjaan untuk mapel ini)
  proctorSetAttemptNotStarted(studentIdOrNisn, examSessionId) {
    const attempts = this.getAttempts();
    const remaining = attempts.filter((a) => {
      const matchStudent =
        a.student_id === studentIdOrNisn ||
        a.student_nisn === studentIdOrNisn ||
        (a.student_id && String(a.student_id) === String(studentIdOrNisn)) ||
        (a.student_nisn && String(a.student_nisn) === String(studentIdOrNisn));
      const matchExam = !examSessionId || a.exam_session_id === examSessionId;
      return !(matchStudent && matchExam);
    });
    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(remaining));

    // Reset status presensi jika ada
    if (examSessionId) {
      try {
        const allAtt = this.getExamAttendance();
        const filteredAtt = allAtt.filter(
          (a) =>
            !(
              a.exam_session_id === examSessionId &&
              (a.student_id === studentIdOrNisn ||
                a.student_nisn === studentIdOrNisn ||
                String(a.student_id) === String(studentIdOrNisn))
            )
        );
        localStorage.setItem(STORAGE_KEYS.EXAM_ATTENDANCE, JSON.stringify(filteredAtt));
      } catch {}
    }

    broadcastSync('attempt_removed', { studentId: studentIdOrNisn, examSessionId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return true;
  },

  // Set "Belum Masuk" Massal untuk mapel terpilih
  proctorSetBulkNotStarted(studentIds = [], examSessionId) {
    if (!examSessionId) return 0;
    const studentIdSet = new Set(studentIds.map(String));
    const attempts = this.getAttempts();
    const remaining = attempts.filter((a) => {
      const isTargetStudent =
        studentIdSet.has(String(a.student_id)) || studentIdSet.has(String(a.student_nisn));
      const isTargetExam = a.exam_session_id === examSessionId;
      return !(isTargetStudent && isTargetExam);
    });
    const deletedCount = attempts.length - remaining.length;
    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(remaining));

    // Reset presensi massal
    try {
      const allAtt = this.getExamAttendance();
      const filteredAtt = allAtt.filter(
        (a) => !(a.exam_session_id === examSessionId && studentIdSet.has(String(a.student_id)))
      );
      localStorage.setItem(STORAGE_KEYS.EXAM_ATTENDANCE, JSON.stringify(filteredAtt));
    } catch {}

    broadcastSync('bulk_attempt_removed', { examSessionId, count: deletedCount });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return deletedCount;
  },

  // Set Status "Selesai" (COMPLETED)
  proctorSetAttemptCompleted(studentIdOrNisn, examSessionId, examTitle = 'Sesi Ujian') {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(
      (a) =>
        (a.student_id === studentIdOrNisn ||
          a.student_nisn === studentIdOrNisn ||
          String(a.student_id) === String(studentIdOrNisn) ||
          String(a.student_nisn) === String(studentIdOrNisn)) &&
        (!examSessionId || a.exam_session_id === examSessionId)
    );

    const student = this.getUsers().find(
      (u) =>
        u.id === studentIdOrNisn ||
        u.nisn === studentIdOrNisn ||
        String(u.id) === String(studentIdOrNisn) ||
        String(u.nisn) === String(studentIdOrNisn)
    );
    const now = new Date().toISOString();

    let result;
    if (index >= 0) {
      attempts[index] = {
        ...attempts[index],
        status: 'COMPLETED',
        completed_at: now,
        is_proctor_action: true,
        updated_at: now,
      };
      result = attempts[index];
    } else if (student && examSessionId) {
      result = {
        id: generateUUID(),
        student_id: student.id,
        student_name: student.nama,
        student_nisn: student.nisn,
        student_kelas: student.kelas,
        student_tingkat: student.tingkat,
        exam_session_id: examSessionId,
        exam_title: examTitle,
        status: 'COMPLETED',
        violation_count: 0,
        time_spent_seconds: 0,
        started_at: now,
        completed_at: now,
        updated_at: now,
        is_proctor_action: true,
      };
      attempts.push(result);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));

    // Catat ke presensi sebagai HADIR
    if (examSessionId && student) {
      try {
        this.updateStudentAttendance(
          examSessionId,
          student.id,
          { status: 'HADIR', keterangan: 'Selesai (Diatur Pengawas)' },
          'Pengawas'
        );
      } catch {}
    }

    broadcastSync('attempt_completed', { studentId: studentIdOrNisn, examSessionId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return result;
  },

  // Set "Selesai" Massal untuk mapel terpilih
  proctorSetBulkCompleted(studentIds = [], examSessionId, examTitle = 'Sesi Ujian') {
    if (!examSessionId) return 0;
    let count = 0;
    studentIds.forEach((sid) => {
      this.proctorSetAttemptCompleted(sid, examSessionId, examTitle);
      count++;
    });
    return count;
  },

  // "Reset Pekerjaan" (RESET_BY_PROCTOR / Kerjakan Ulang Dari Awal)
  proctorResetStudentWork(studentIdOrNisn, examSessionId, examTitle = 'Sesi Ujian') {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(
      (a) =>
        (a.student_id === studentIdOrNisn ||
          a.student_nisn === studentIdOrNisn ||
          String(a.student_id) === String(studentIdOrNisn) ||
          String(a.student_nisn) === String(studentIdOrNisn)) &&
        (!examSessionId || a.exam_session_id === examSessionId)
    );

    const now = new Date().toISOString();
    let result = null;

    if (index >= 0) {
      attempts[index] = {
        ...attempts[index],
        status: 'RESET_BY_PROCTOR',
        violation_count: 0,
        time_spent_seconds: 0,
        last_violation_reason: '',
        completed_at: null,
        reset_at: now,
        updated_at: now,
        is_proctor_action: true,
        is_reset_violations: true,
      };
      result = attempts[index];
    } else {
      // Jika belum ada attempt, buat attempt siap mulai
      const student = this.getUsers().find(
        (u) =>
          u.id === studentIdOrNisn ||
          u.nisn === studentIdOrNisn ||
          String(u.id) === String(studentIdOrNisn) ||
          String(u.nisn) === String(studentIdOrNisn)
      );
      if (student && examSessionId) {
        result = {
          id: generateUUID(),
          student_id: student.id,
          student_name: student.nama,
          student_nisn: student.nisn,
          student_kelas: student.kelas,
          student_tingkat: student.tingkat,
          exam_session_id: examSessionId,
          exam_title: examTitle,
          status: 'RESET_BY_PROCTOR',
          violation_count: 0,
          time_spent_seconds: 0,
          last_violation_reason: '',
          reset_at: now,
          updated_at: now,
          is_proctor_action: true,
          is_reset_violations: true,
        };
        attempts.push(result);
      }
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
    broadcastSync('work_reset', { studentId: studentIdOrNisn, examSessionId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return result;
  },

  // Reset Pekerjaan Massal untuk mapel terpilih
  proctorResetBulkStudentWork(studentIds = [], examSessionId, examTitle = 'Sesi Ujian') {
    if (!examSessionId) return 0;
    let count = 0;
    studentIds.forEach((sid) => {
      this.proctorResetStudentWork(sid, examSessionId, examTitle);
      count++;
    });
    return count;
  },

  // Update Latency / Ping Real-time Client ke Server Google
  updateAttemptPing(attemptId, latencyMs) {
    const attempts = this.getAttempts();
    const target = attempts.find((a) => a.id === attemptId);
    if (target) {
      target.ping_latency_ms = typeof latencyMs === 'number' ? Math.round(latencyMs) : null;
      target.last_ping_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  // 4b. EXAM ATTENDANCE (PRESENSI & KETERANGAN SISWA PER MAPEL/SESI UJIAN)
  getExamAttendance(examSessionId = null) {
    this.init();
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_ATTENDANCE)) || [];
      if (examSessionId) {
        return all.filter((a) => a.exam_session_id === examSessionId);
      }
      return all;
    } catch {
      return [];
    }
  },

  updateStudentAttendance(examSessionId, studentId, data, updatedBy = 'Proktor') {
    this.init();
    const all = this.getExamAttendance();
    const index = all.findIndex(
      (a) => a.exam_session_id === examSessionId && a.student_id === studentId
    );

    const record = {
      ...(index >= 0 ? all[index] : {}),
      id: index >= 0 ? all[index].id : generateUUID(),
      exam_session_id: examSessionId,
      student_id: studentId,
      status: data.status || 'HADIR', // 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'DISPENSASI'
      keterangan: (data.keterangan || '').trim(),
      updated_at: new Date().toISOString(),
      updated_by: updatedBy,
    };

    if (index >= 0) {
      all[index] = record;
    } else {
      all.push(record);
    }

    localStorage.setItem(STORAGE_KEYS.EXAM_ATTENDANCE, JSON.stringify(all));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return record;
  },

  // Simpan / update status presensi per siswa
  saveExamAttendance(examSessionId, studentId, data) {
    return this.updateStudentAttendance(
      examSessionId,
      studentId,
      data,
      data.updated_by || 'Admin'
    );
  },

  // Reset catatan presensi khusus (kembali ke default otomatis)
  removeExamAttendance(examSessionId, studentId) {
    this.init();
    const all = this.getExamAttendance();
    const filtered = all.filter(
      (a) => !(a.exam_session_id === examSessionId && a.student_id === studentId)
    );
    localStorage.setItem(STORAGE_KEYS.EXAM_ATTENDANCE, JSON.stringify(filtered));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return true;
  },

  // 4c. BERITA ACARA UJIAN (KONFIGURASI PERSISTEN PENGATURAN KOP, PEJABAT & CATATAN)
  getBeritaAcaraConfig() {
    this.init();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.BERITA_ACARA_CONFIG));
      const res = {
        ...DEFAULT_BERITA_ACARA_CONFIG,
        ...(saved || {}),
      };
      // Jika tersimpan teks default institusi kementerian, kosongkan agar bersih
      if (res.instansi_pusat === 'Kementerian Pendidikan Dasar dan Menengah') {
        res.instansi_pusat = '';
      }
      return res;
    } catch {
      return { ...DEFAULT_BERITA_ACARA_CONFIG };
    }
  },

  saveBeritaAcaraConfig(config) {
    this.init();
    try {
      const current = this.getBeritaAcaraConfig();
      const updated = {
        ...current,
        ...config,
      };
      localStorage.setItem(STORAGE_KEYS.BERITA_ACARA_CONFIG, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
      return updated;
    } catch {
      return config;
    }
  },

  // 4d. APP ENVIRONMENT MODE & SIMULATION CONFIG (MODE PRODUKSI VS SIMULASI/DEV)
  getAppModeConfig() {
    this.init();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APP_MODE_CONFIG);
      const saved = raw ? JSON.parse(raw) : null;

      // Verifikasi integritas tanda tangan digital mode jika tersimpan 'simulation'
      let isSimulationValid = false;
      if (saved && saved.app_mode === 'simulation') {
        const expectedSig = generateModeSignature('simulation');
        if (saved.signature === expectedSig) {
          isSimulationValid = true;
        } else {
          // Upaya manipulasi manual nilai localStorage terdeteksi
          console.warn('SECURITY ALERT: Tanda tangan integritas Mode Simulasi tidak valid! Otomatis dikembalikan ke Mode Produksi Resmi.');
        }
      }

      const activeMode = isSimulationValid ? 'simulation' : 'production';

      // ZERO-TRUST PRODUCTION SECURITY HARDENING:
      // Jika mode aplikasi adalah 'production', SEMUA bypass dan simulasi DIKUNCI MATI (false)
      // secara mutlak di layer penyimpanan data, dan objek di-freeze agar tidak dapat diubah di memori.
      if (activeMode === 'production') {
        return Object.freeze({
          app_mode: 'production',
          bypass_gps: false,
          bypass_media: false,
          bypass_audio: false,
          bypass_notifications: false,
          bypass_fullscreen: false,
          bypass_cookies_check: false,
          bypass_google_sso: false,
          mock_gps_coords: null,
          signature: generateModeSignature('production'),
          updated_at: saved?.updated_at || new Date().toISOString(),
        });
      }

      // Mode simulasi sah yang disetujui Super Admin
      return Object.freeze({
        app_mode: 'simulation',
        bypass_gps: Boolean(saved?.bypass_gps),
        bypass_media: Boolean(saved?.bypass_media),
        bypass_audio: Boolean(saved?.bypass_audio),
        bypass_notifications: Boolean(saved?.bypass_notifications),
        bypass_fullscreen: Boolean(saved?.bypass_fullscreen),
        bypass_cookies_check: Boolean(saved?.bypass_cookies_check),
        bypass_google_sso: Boolean(saved?.bypass_google_sso),
        mock_gps_coords: saved?.mock_gps_coords || { lat: -6.2088, lng: 106.8456 },
        signature: generateModeSignature('simulation'),
        updated_at: saved?.updated_at || new Date().toISOString(),
      });
    } catch {
      return Object.freeze({
        app_mode: 'production',
        bypass_gps: false,
        bypass_media: false,
        bypass_audio: false,
        bypass_notifications: false,
        bypass_fullscreen: false,
        bypass_cookies_check: false,
        bypass_google_sso: false,
        mock_gps_coords: null,
        signature: generateModeSignature('production'),
        updated_at: new Date().toISOString(),
      });
    }
  },

  saveAppModeConfig(config, caller = null) {
    this.init();
    try {
      const current = this.getAppModeConfig();
      const requestedMode = config.app_mode !== undefined ? config.app_mode : current.app_mode;

      // ATURAN KEAMANAN TINGGI (Zero-Escalation Rule):
      // Mengubah mode aplikasi menjadi 'simulation' HANYA diizinkan jika dieksekusi oleh Super Admin terverifikasi.
      if (requestedMode === 'simulation' && current.app_mode === 'production') {
        const currentUser = this.getCurrentUser();
        const isAuthorizedAdmin =
          (currentUser && currentUser.role === 'admin') ||
          (caller && caller.role === 'admin');

        if (!isAuthorizedAdmin) {
          console.warn('SECURITY ALERT: Upaya pengubahan mode aplikasi ke simulasi ditolak (Unauthorized Access).');
          this.addSystemErrorLog({
            source: 'Security Kernel',
            level: 'error',
            message: 'Upaya pengubahan mode aplikasi ke Mode Simulasi dicegah (Unauthorized Mode Escalation).',
            details: 'Hanya akun Super Admin yang memiliki wewenang mengaktifkan mode simulasi.',
            solution: 'Sistem tetap terkunci pada Mode Produksi Resmi.',
          });
          return current;
        }
      }

      const isProduction = requestedMode === 'production';
      const updated = {
        app_mode: isProduction ? 'production' : 'simulation',
        bypass_gps: isProduction ? false : (config.bypass_gps !== undefined ? Boolean(config.bypass_gps) : Boolean(current.bypass_gps)),
        bypass_media: isProduction ? false : (config.bypass_media !== undefined ? Boolean(config.bypass_media) : Boolean(current.bypass_media)),
        bypass_audio: isProduction ? false : (config.bypass_audio !== undefined ? Boolean(config.bypass_audio) : Boolean(current.bypass_audio)),
        bypass_notifications: isProduction ? false : (config.bypass_notifications !== undefined ? Boolean(config.bypass_notifications) : Boolean(current.bypass_notifications)),
        bypass_fullscreen: isProduction ? false : (config.bypass_fullscreen !== undefined ? Boolean(config.bypass_fullscreen) : Boolean(current.bypass_fullscreen)),
        bypass_cookies_check: isProduction ? false : (config.bypass_cookies_check !== undefined ? Boolean(config.bypass_cookies_check) : Boolean(current.bypass_cookies_check)),
        bypass_google_sso: isProduction ? false : (config.bypass_google_sso !== undefined ? Boolean(config.bypass_google_sso) : Boolean(current.bypass_google_sso)),
        mock_gps_coords: isProduction ? null : (config.mock_gps_coords || current.mock_gps_coords || { lat: -6.2088, lng: 106.8456 }),
        signature: generateModeSignature(isProduction ? 'production' : 'simulation'),
        updated_at: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.APP_MODE_CONFIG, JSON.stringify(updated));
      broadcastSync('app_mode_updated', { appModeConfig: updated });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: updated }));
      }
      return Object.freeze(updated);
    } catch {
      return config;
    }
  },

  // 4e. SYSTEM ERROR LOGS & AUDIT TRAIL (HISTORI ERROR SAAT MODE SIMULASI & DIAGNOSTIK)
  getSystemErrorLogs() {
    this.init();
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.SYSTEM_ERROR_LOGS)) || [];
      return Array.isArray(logs) ? logs : [];
    } catch {
      return [];
    }
  },

  addSystemErrorLog(entry) {
    this.init();
    try {
      const logs = this.getSystemErrorLogs();
      const newLog = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        source: entry.source || 'Sistem', // 'GPS' | 'Kamera/Mic' | 'Audio' | 'Notifikasi' | 'Fullscreen' | 'Jaringan' | 'Token' | 'Auth'
        level: entry.level || 'error', // 'error' | 'warning' | 'info'
        message: entry.message || 'Terjadi kesalahan sistem',
        details: entry.details || '',
        solution: entry.solution || 'Periksa koneksi jaringan atau setelan izin peramban.',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };
      // Batasi maksimal 150 catatan riwayat terbaru
      const updated = [newLog, ...logs].slice(0, 150);
      localStorage.setItem(STORAGE_KEYS.SYSTEM_ERROR_LOGS, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_error_logged', { detail: newLog }));
      }
      return newLog;
    } catch (e) {
      console.error('Gagal mencatat log error:', e);
      return null;
    }
  },

  clearSystemErrorLogs() {
    this.init();
    localStorage.setItem(STORAGE_KEYS.SYSTEM_ERROR_LOGS, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return true;
  },

  // 5. SESSION MANAGEMENT
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // 6. CADANGAN & PEMULIHAN SISTEM (BACKUP & RESTORE)
  getFullSystemData() {
    this.init();
    return {
      institution: this.getInstitution(),
      users: this.getUsers(),
      exam_sessions: this.getExamSessions(),
      student_attempts: this.getStudentAttempts(),
      exam_attendance: this.getExamAttendance(),
      berita_acara_config: this.getBeritaAcaraConfig(),
      app_mode_config: this.getAppModeConfig(),
      system_error_logs: this.getSystemErrorLogs(),
    };
  },

  restoreAllData(restoredData) {
    if (!restoredData) throw new Error('Data pemulihan kosong.');
    if (restoredData.institution) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(restoredData.institution));
    }
    if (restoredData.users && Array.isArray(restoredData.users)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(restoredData.users));
    }
    if (restoredData.exam_sessions && Array.isArray(restoredData.exam_sessions)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(restoredData.exam_sessions));
    }
    if (restoredData.student_attempts && Array.isArray(restoredData.student_attempts)) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(restoredData.student_attempts));
    }
    if (restoredData.exam_attendance && Array.isArray(restoredData.exam_attendance)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_ATTENDANCE, JSON.stringify(restoredData.exam_attendance));
    }
    if (restoredData.berita_acara_config) {
      localStorage.setItem(STORAGE_KEYS.BERITA_ACARA_CONFIG, JSON.stringify(restoredData.berita_acara_config));
    }
    if (restoredData.app_mode_config) {
      localStorage.setItem(STORAGE_KEYS.APP_MODE_CONFIG, JSON.stringify(restoredData.app_mode_config));
    }
    if (restoredData.system_error_logs && Array.isArray(restoredData.system_error_logs)) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_ERROR_LOGS, JSON.stringify(restoredData.system_error_logs));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: restoredData }));
    }
    return true;
  },
};

/**
 * Adapter API untuk cPanel Backend (/api/v1)
 * Bila Anda menghubungkan backend cPanel (PHP / Express / Laravel / SQLite / MySQL),
 * Anda cukup mengaktifkan mode API tanpa merombak UI.
 */
export const apiAdapter = {
  isLiveApi: false, // Setel true saat backend cPanel /api/v1 aktif
  apiBase: '/api/v1',

  async request(endpoint, options = {}) {
    if (!this.isLiveApi) {
      return null; // Menggunakan storageService lokal secara default
    }
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      return await response.json();
    } catch (err) {
      console.warn('Fallback ke storageService lokal:', err);
      return null;
    }
  },
};

