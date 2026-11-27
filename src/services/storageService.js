/**
 * ExamGuard Storage Service — SQLite Adapter Layer (Dual Sync/Async Engine)
 * File: src/services/storageService.js
 *
 * Kompatibel 100% dengan seluruh komponen React (AdminDashboard, StudentPortal,
 * LoginPortal, App) yang memanggil storageService secara synchronous,
 * sekaligus terhubung langsung ke SQLite (examguard.db) dan WebSocket real-time.
 */

import { generateUUID, EDUCATION_LEVELS, formatExamToken } from '../constants/educationConfig.js';
import { dbService } from './dbService.js';

// Re-export dbService
export { dbService };

// ─── Export Utilitas Pendukung yang Dibutuhkan Komponen ────────────────────────
export function cleanNomorUjian(raw, fallback = '') {
  if (!raw || !String(raw).trim()) {
    return String(fallback || '').trim().toUpperCase();
  }
  return String(raw).trim().toUpperCase();
}

export function generateStudentLoginToken(seed = '') {
  const s = String(seed).replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'STD';
  const r1 = Math.random().toString(36).substring(2, 10).toUpperCase();
  const r2 = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `EGTOK-${s}-${r1}-${r2}`;
}

export function convertGoogleFormUrl(url) {
  if (!url) return '';
  let cleaned = String(url).trim();
  cleaned = cleaned.replace(/\/edit(\?.*)?$/, '/viewform');
  if (cleaned.includes('docs.google.com/forms') && !cleaned.includes('embedded=true')) {
    cleaned += (cleaned.includes('?') ? '&' : '?') + 'embedded=true';
  }
  return cleaned;
}

export function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem('examguard_client_device_id');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('examguard_client_device_id', id);
    }
    return id;
  } catch {
    return 'dev_' + Date.now();
  }
}

export function getDeviceClientInfo() {
  if (typeof window === 'undefined') {
    return { brand: 'Desktop PC', os: 'Windows', fullLabel: 'Komputer Desktop (Windows)', isMobile: false };
  }

  const ua = navigator.userAgent || '';
  let brand = 'Komputer Desktop';
  let os = 'Windows';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // 1. Deteksi Sistem Operasi (OS)
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows 11/10';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) {
    const androidVer = ua.match(/Android\s([0-9.]+)/i);
    os = androidVer ? `Android ${androidVer[1]}` : 'Android';
  } else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else os = 'Unknown OS';

  // 2. Deteksi Merek & Model HP / Perangkat
  if (/iPhone/i.test(ua)) {
    brand = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    brand = 'Apple iPad';
  } else if (/Samsung|SM-[A-Z0-9]+|GT-[A-Z0-9]+/i.test(ua)) {
    const model = ua.match(/SM-[A-Z0-9]+/i);
    brand = model ? `Samsung (${model[0]})` : 'Samsung Galaxy';
  } else if (/Xiaomi|Redmi|POCO|Mi\s|22[0-9]{6}[A-Z]|23[0-9]{6}[A-Z]/i.test(ua)) {
    const redmi = ua.match(/(Redmi[^;\)]*|POCO[^;\)]*|Mi\s[^;\)]*)/i);
    brand = redmi ? `Xiaomi ${redmi[0].trim()}` : 'Xiaomi / Redmi';
  } else if (/OPPO|CPH[0-9]{4}/i.test(ua)) {
    const oppo = ua.match(/CPH[0-9]{4}/i);
    brand = oppo ? `OPPO (${oppo[0]})` : 'OPPO';
  } else if (/vivo|V2[0-9]{3}/i.test(ua)) {
    const vivo = ua.match(/V2[0-9]{3}/i);
    brand = vivo ? `Vivo (${vivo[0]})` : 'Vivo';
  } else if (/Realme|RMX[0-9]{4}/i.test(ua)) {
    const rmx = ua.match(/RMX[0-9]{4}/i);
    brand = rmx ? `Realme (${rmx[0]})` : 'Realme';
  } else if (/Infinix|X[0-9]{3,4}/i.test(ua)) {
    const inf = ua.match(/Infinix\s[A-Z0-9]+|X[0-9]{3,4}/i);
    brand = inf ? `Infinix (${inf[0]})` : 'Infinix';
  } else if (/Tecno/i.test(ua)) {
    brand = 'Tecno';
  } else if (/Huawei|HMA-|LYA-/i.test(ua)) {
    brand = 'Huawei';
  } else if (/ASUS|ROG/i.test(ua)) {
    brand = 'ASUS';
  } else if (isMobile) {
    brand = 'Smartphone Android';
  } else {
    brand = /Windows/i.test(os) ? 'PC / Laptop Windows' : (/macOS/i.test(os) ? 'Apple Mac' : 'Komputer Desktop');
  }

  return {
    brand,
    os,
    fullLabel: `${brand} • ${os}`,
    isMobile,
  };
}

export function subscribeSync(callback) {
  return dbService.subscribe(callback);
}

export function broadcastSync(action, payload = {}) {
  // Disiarkan otomatis oleh server WebSocket setelah perubahan data tersimpan di SQLite
}

export function generateModeSignature(appMode) {
  const salt = 'EXAMGUARD_KERNEL_SECURE_2026_PRODUCTION_TOKEN';
  let hash = 0;
  const str = `${appMode}::${salt}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return 'eg_sig_' + Math.abs(hash).toString(16);
}

// ─── In-memory Synchronous Cache ──────────────────────────────────────────────
const _cache = {
  institution: null,
  users: [],
  examSessions: [],
  attempts: [],
  attendance: [],
  appModeConfig: {
    id: 'singleton',
    app_mode: 'production',
    bypass_gps: false,
    bypass_media: false,
    bypass_audio: false,
    bypass_notifications: false,
    bypass_fullscreen: false,
    bypass_cookies_check: false,
    bypass_google_sso: false,
    signature: 'eg_sig_production',
  },
  beritaAcaraConfig: null,
  systemErrorLogs: [],
  activeBroadcast: null,
};

// Muat cache awal dari localStorage (0ms synchronous read)
function _loadInitialCache() {
  if (typeof window === 'undefined') return;
  try {
    const rawInst = localStorage.getItem('examguard_institution');
    if (rawInst) _cache.institution = JSON.parse(rawInst);
    const rawUsers = localStorage.getItem('examguard_users');
    if (rawUsers) _cache.users = JSON.parse(rawUsers);
    const rawExams = localStorage.getItem('examguard_exam_sessions');
    if (rawExams) _cache.examSessions = JSON.parse(rawExams);
    const rawAtt = localStorage.getItem('examguard_attempts');
    if (rawAtt) _cache.attempts = JSON.parse(rawAtt);
    const rawPresensi = localStorage.getItem('examguard_attendance');
    if (rawPresensi) _cache.attendance = JSON.parse(rawPresensi);
    const rawAppMode = localStorage.getItem('examguard_app_mode');
    if (rawAppMode) _cache.appModeConfig = JSON.parse(rawAppMode);
    const rawBa = localStorage.getItem('examguard_berita_acara');
    if (rawBa) _cache.beritaAcaraConfig = JSON.parse(rawBa);
    const rawLogs = localStorage.getItem('examguard_error_logs');
    if (rawLogs) _cache.systemErrorLogs = JSON.parse(rawLogs);
    const rawBcast = localStorage.getItem('examguard_active_broadcast');
    if (rawBcast) _cache.activeBroadcast = JSON.parse(rawBcast);
  } catch { }
}

function _applySnapshot(data) {
  if (!data) return;
  const bcast = data.activeBroadcast || data.active_broadcast;
  if (bcast) {
    _cache.activeBroadcast = bcast;
    try { localStorage.setItem('examguard_active_broadcast', JSON.stringify(bcast)); } catch { }
  }
  const isEditingLocked = typeof window !== 'undefined' && Boolean(window.__examguard_is_editing);
  if (data.institution && !isEditingLocked) {
    if (typeof data.institution.browser_permissions === 'string') {
      try { data.institution.browser_permissions = JSON.parse(data.institution.browser_permissions); } catch { }
    }
    _cache.institution = data.institution;
    try { localStorage.setItem('examguard_institution', JSON.stringify(data.institution)); } catch { }
  }
  if (Array.isArray(data.users) && !isEditingLocked) {
    _cache.users = data.users;
    try { localStorage.setItem('examguard_users', JSON.stringify(data.users)); } catch { }
  }
  const examList = Array.isArray(data.examSessions)
    ? data.examSessions
    : (Array.isArray(data.exam_sessions) ? data.exam_sessions : null);
  if (examList && !isEditingLocked) {
    _cache.examSessions = examList;
    try { localStorage.setItem('examguard_exam_sessions', JSON.stringify(examList)); } catch { }
  }
  const attemptList = Array.isArray(data.attempts)
    ? data.attempts
    : (Array.isArray(data.student_attempts) ? data.student_attempts : null);
  if (attemptList) {
    _cache.attempts = attemptList;
    try { localStorage.setItem('examguard_attempts', JSON.stringify(attemptList)); } catch { }
  }
  const attendanceList = Array.isArray(data.attendance)
    ? data.attendance
    : (Array.isArray(data.exam_attendance) ? data.exam_attendance : null);
  if (attendanceList) {
    _cache.attendance = attendanceList;
    try { localStorage.setItem('examguard_attendance', JSON.stringify(attendanceList)); } catch { }
  }
  const appMode = data.appModeConfig || data.app_mode_config;
  if (appMode) {
    _cache.appModeConfig = appMode;
    try { localStorage.setItem('examguard_app_mode', JSON.stringify(appMode)); } catch { }
  }
  const beritaAcara = data.beritaAcaraConfig || data.berita_acara_config;
  if (beritaAcara) {
    _cache.beritaAcaraConfig = beritaAcara;
    try { localStorage.setItem('examguard_berita_acara', JSON.stringify(beritaAcara)); } catch { }
  }
  const errorLogs = Array.isArray(data.systemErrorLogs)
    ? data.systemErrorLogs
    : (Array.isArray(data.system_error_logs) ? data.system_error_logs : null);
  if (errorLogs) {
    _cache.systemErrorLogs = errorLogs;
    try { localStorage.setItem('examguard_error_logs', JSON.stringify(errorLogs)); } catch { }
  }
}

// Inisialisasi awal modul di browser
if (typeof window !== 'undefined') {
  _loadInitialCache();

  // Dengar perubahan lintas-tab/jendela dari localStorage (cross-tab real-time sync)
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === 'examguard_institution') {
      try {
        const raw = localStorage.getItem('examguard_institution');
        if (raw) _cache.institution = JSON.parse(raw);
      } catch { }
    }
    if (!e.key || e.key === 'examguard_exam_sessions') {
      try {
        const raw = localStorage.getItem('examguard_exam_sessions');
        if (raw) _cache.examSessions = JSON.parse(raw);
      } catch { }
    }
    if (!e.key || e.key === 'examguard_attempts') {
      try {
        const raw = localStorage.getItem('examguard_attempts');
        if (raw) _cache.attempts = JSON.parse(raw);
      } catch { }
    }
    if (!e.key || e.key === 'examguard_users') {
      try {
        const raw = localStorage.getItem('examguard_users');
        if (raw) _cache.users = JSON.parse(raw);
      } catch { }
    }
    if (!e.key || e.key === 'examguard_app_mode') {
      try {
        const raw = localStorage.getItem('examguard_app_mode');
        if (raw) _cache.appModeConfig = JSON.parse(raw);
      } catch { }
    }
    if (!e.key || e.key === 'examguard_active_broadcast') {
      try {
        const raw = localStorage.getItem('examguard_active_broadcast');
        if (raw) _cache.activeBroadcast = JSON.parse(raw);
        else _cache.activeBroadcast = null;
        window.dispatchEvent(new CustomEvent('examguard_broadcast_updated', { detail: _cache.activeBroadcast }));
      } catch { }
    }
    try {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', {
        detail: { event: 'cross_tab_storage', key: e.key }
      }));
      window.dispatchEvent(new CustomEvent('examguard_db_updated', {
        detail: { event: 'cross_tab_storage', key: e.key }
      }));
    } catch { }
  });

  // Fetch snapshot mutakhir dari SQLite backend via REST API
  fetch('/api/db/snapshot')
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) {
        _applySnapshot(data);
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'snapshot', data } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'snapshot', data } }));
      }
    })
    .catch(() => { });

  // Dengar perubahan real-time dari WebSocket via dbService
  dbService.subscribe((event, data) => {
    switch (event) {
      case 'snapshot':
        _applySnapshot(data);
        break;
      case 'institution_updated':
        if (data.institution) {
          _cache.institution = data.institution;
          try { localStorage.setItem('examguard_institution', JSON.stringify(data.institution)); } catch { }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'institution_updated', institution: data.institution } }));
          }
        }
        break;
      case 'user_saved':
      case 'user_updated':
        if (data.user) {
          const idx = _cache.users.findIndex(u => u.id === data.user.id);
          if (idx >= 0) _cache.users[idx] = data.user;
          else _cache.users.push(data.user);
          try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
        }
        break;
      case 'user_deleted':
        if (data.deletedId) {
          _cache.users = _cache.users.filter(u => u.id !== data.deletedId);
          _cache.attempts = _cache.attempts.filter(a => a.student_id !== data.deletedId);
          _cache.attendance = _cache.attendance.filter(a => a.student_id !== data.deletedId);
          try {
            localStorage.setItem('examguard_users', JSON.stringify(_cache.users));
            localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts));
            localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance));
          } catch { }
        }
        break;
      case 'all_students_deleted':
        _cache.users = _cache.users.filter(u => u.role !== 'student');
        _cache.attempts = [];
        _cache.attendance = [];
        try {
          localStorage.setItem('examguard_users', JSON.stringify(_cache.users));
          localStorage.setItem('examguard_attempts', JSON.stringify([]));
          localStorage.setItem('examguard_attendance', JSON.stringify([]));
        } catch { }
        break;
      case 'sessions_updated':
      case 'session_deleted':
        if (data.deletedId) {
          _cache.examSessions = _cache.examSessions.filter(e => e.id !== data.deletedId);
          _cache.attempts = _cache.attempts.filter(a => a.exam_session_id !== data.deletedId);
          _cache.attendance = _cache.attendance.filter(a => a.exam_session_id !== data.deletedId);
        } else if (data.exam) {
          const idx = _cache.examSessions.findIndex(e => e.id === data.exam.id);
          if (idx >= 0) _cache.examSessions[idx] = data.exam;
          else _cache.examSessions.unshift(data.exam);
        }
        try {
          localStorage.setItem('examguard_exam_sessions', JSON.stringify(_cache.examSessions));
          localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts));
          localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance));
        } catch { }
        break;
      case 'attempt_updated':
      case 'attempt_unlocked':
      case 'violations_reset':
      case 'work_reset':
      case 'attempt_completed':
        if (data.attempt) {
          const idx = _cache.attempts.findIndex(a => a.id === data.attempt.id || (a.student_id === data.attempt.student_id && a.exam_session_id === data.attempt.exam_session_id));
          if (idx >= 0) _cache.attempts[idx] = data.attempt;
          else _cache.attempts.unshift(data.attempt);
          try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
        }
        break;
      case 'attempt_removed':
        if (data.studentId && data.examSessionId) {
          _cache.attempts = _cache.attempts.filter(a => !(a.student_id === data.studentId && a.exam_session_id === data.examSessionId));
          try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
        }
        break;
      case 'attendance_updated':
        if (data.record) {
          const idx = _cache.attendance.findIndex(a => a.student_id === data.record.student_id && a.exam_session_id === data.record.exam_session_id);
          if (idx >= 0) _cache.attendance[idx] = data.record;
          else _cache.attendance.push(data.record);
          try { localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance)); } catch { }
        }
        break;
      case 'app_mode_updated':
        if (data.config) {
          _cache.appModeConfig = data.config;
          try { localStorage.setItem('examguard_app_mode', JSON.stringify(data.config)); } catch { }
        }
        break;
      case 'berita_acara_updated':
        if (data.config) {
          _cache.beritaAcaraConfig = data.config;
          try { localStorage.setItem('examguard_berita_acara', JSON.stringify(data.config)); } catch { }
        }
        break;
      default:
        break;
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event, ...data } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event, ...data } }));
      } catch { }
    }
  });
}

// ─── Main Storage Service Object ──────────────────────────────────────────────
export const storageService = {

  // ── Init & Server Sync ──────────────────────────────────────────────────
  init() {
    _loadInitialCache();
    dbService.init();
  },

  setDraftEditing(status) {
    if (typeof window !== 'undefined') {
      window.__examguard_is_editing = Boolean(status);
    }
  },

  isDraftEditing() {
    return typeof window !== 'undefined' && Boolean(window.__examguard_is_editing);
  },

  async syncWithServer() {
    if (typeof window === 'undefined') return null;
    if (this.isDraftEditing()) return null;
    try {
      const res = await fetch('/api/db/snapshot');
      if (res.ok) {
        const data = await res.json();
        _applySnapshot(data);
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'snapshot', data } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'snapshot', data } }));
        return data;
      }
    } catch (e) {
      console.warn('[ExamGuard Storage] syncWithServer error:', e);
    }
    return null;
  },

  // ── Institution ───────────────────────────────────────────────────────────
  getInstitution() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('examguard_institution');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            _cache.institution = parsed;
          }
        }
      } catch { }
    }
    if (_cache.institution) {
      if (_cache.institution.lock_device_enabled === undefined) {
        _cache.institution.lock_device_enabled = true;
      }
      return _cache.institution;
    }
    return {
      id: 'singleton',
      name: 'SMA Negeri 1 Nusantara',
      npsn: '20104829',
      logo_url: null,
      education_level: 'SMA',
      allowed_grades: [10, 11, 12],
      idle_timeout_minutes: 30,
      gps_enabled: true,
      center_lat: -6.2088,
      center_lng: 106.8456,
      max_radius_meters: 200,
      gmaps_url: 'https://maps.google.com/?q=-6.2088,106.8456',
      auth_method: 'CREDENTIALS_ONLY',
      google_oauth_enabled: false,
      google_client_id: '',
      google_client_secret: '',
      recaptcha_enabled: false,
      recaptcha_site_key: '',
      recaptcha_secret_key: '',
      recaptcha_version: 'v2',
      finish_token_lead_minutes: 10,
      browser_permissions: {
        location_gps: true,
        notifications: true,
        sound_audio: true,
        fullscreen: true,
        google_sso: false,
        block_clipboard: true,
        camera_webcam: true,
        cookies_iframe: true,
      },
      google_oauth_verified: false,
      google_oauth_verified_email: '',
      google_oauth_verified_at: null,
      lock_device_enabled: true,
    };
  },

  updateInstitution(data) {
    const current = this.getInstitution();
    const updated = { ...current, ...data, updated_at: new Date().toISOString() };
    _cache.institution = updated;
    try { localStorage.setItem('examguard_institution', JSON.stringify(updated)); } catch { }
    // Kirim async ke SQLite backend
    dbService.updateInstitution(updated).catch(err => console.error('[ExamGuard Storage] Sync error updateInstitution:', err));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'institution_updated', institution: updated } }));
      window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'institution_updated', institution: updated } }));
    }
    return updated;
  },

  async getTunnelStatus() {
    return await dbService.getTunnelStatus();
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers() {
    return _cache.users ? [..._cache.users] : [];
  },

  getUserById(id) {
    return (_cache.users || []).find(u => u.id === id) || null;
  },

  getUserByUsername(username) {
    if (!username) return null;
    const q = String(username).trim().toLowerCase();
    return (_cache.users || []).find(u =>
      (u.username && u.username.toLowerCase() === q) ||
      (u.nisn && u.nisn.toLowerCase() === q) ||
      (u.nomor_ujian && u.nomor_ujian.toLowerCase() === q) ||
      (u.login_token && u.login_token.toLowerCase() === q)
    ) || null;
  },

  getUserByLoginToken(token) {
    if (!token) return null;
    const q = String(token).trim().toLowerCase();
    return (_cache.users || []).find(u =>
      u.login_token && u.login_token.toLowerCase() === q
    ) || null;
  },

  getUserByEmail(email) {
    if (!email) return null;
    const q = String(email).trim().toLowerCase();
    return (_cache.users || []).find(u =>
      (u.email && u.email.toLowerCase() === q) ||
      (u.google_email && u.google_email.toLowerCase() === q)
    ) || null;
  },

  async getUserByEmailFromServer(email) {
    if (!email) return null;
    const q = String(email).trim().toLowerCase();
    try {
      const res = await fetch(`/api/db/users/by-email/${encodeURIComponent(q)}`);
      if (res.ok) {
        const user = await res.json();
        if (user && user.id) {
          const idx = (_cache.users || []).findIndex(u => u.id === user.id);
          if (idx >= 0) _cache.users[idx] = user;
          else _cache.users.push(user);
          return user;
        }
      }
    } catch { }
    return this.getUserByEmail(q);
  },

  saveUser(user) {
    const existingIdx = (_cache.users || []).findIndex(u => u.id === user.id);
    const isStudent = user.role === 'student';
    let token = user.login_token;
    if (isStudent && !token) {
      token = generateStudentLoginToken(user.nomor_ujian || user.nisn || user.id);
    }
    const updated = { ...user, ...(token ? { login_token: token } : {}), updated_at: new Date().toISOString() };
    if (existingIdx >= 0) {
      _cache.users[existingIdx] = updated;
    } else {
      _cache.users.push(updated);
    }
    try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }

    if (user.role === 'student') {
      if (existingIdx >= 0) {
        dbService.updateStudent(user.id, user).catch(() => { });
      } else {
        dbService.addStudent(user).catch(() => { });
      }
    } else {
      dbService.updateAdminProfile(user.id, user).catch(() => { });
    }
    return updated;
  },

  deleteUser(id) {
    _cache.users = (_cache.users || []).filter(u => u.id !== id);
    _cache.attempts = (_cache.attempts || []).filter(a => a.student_id !== id);
    _cache.attendance = (_cache.attendance || []).filter(a => a.student_id !== id);
    try {
      localStorage.setItem('examguard_users', JSON.stringify(_cache.users));
      localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts));
      localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance));
    } catch { }
    dbService.deleteUser(id).catch(err => console.error('[ExamGuard Storage] Sync error deleteUser:', err));
    return true;
  },

  deleteAllStudents() {
    _cache.users = (_cache.users || []).filter(u => u.role !== 'student');
    _cache.attempts = [];
    _cache.attendance = [];
    try {
      localStorage.setItem('examguard_users', JSON.stringify(_cache.users));
      localStorage.setItem('examguard_attempts', JSON.stringify([]));
      localStorage.setItem('examguard_attendance', JSON.stringify([]));
    } catch { }
    dbService.deleteAllStudents().catch(err => console.error('[ExamGuard Storage] Sync error deleteAllStudents:', err));
    return true;
  },

  addStudent(data) {
    const nisn = String(data.nisn || '').trim();
    if (!nisn) return { success: false, message: 'NISN wajib diisi.', field: 'nisn' };

    const dupNisn = (_cache.users || []).find(u => u.nisn === nisn);
    if (dupNisn) {
      return { success: false, message: `Peserta dengan NISN "${nisn}" sudah terdaftar atas nama "${dupNisn.nama}".`, field: 'nisn' };
    }

    const noUjian = cleanNomorUjian(data.nomor_ujian, nisn);
    if (noUjian) {
      const dupNo = (_cache.users || []).find(u => u.nomor_ujian === noUjian);
      if (dupNo) {
        return { success: false, message: `Nomor Ujian "${noUjian}" sudah terdaftar atas nama "${dupNo.nama}".`, field: 'nomor_ujian' };
      }
    }

    const nis = String(data.nis || '').trim();
    if (nis) {
      const dupNis = (_cache.users || []).find(u => u.nis === nis);
      if (dupNis) {
        return { success: false, message: `NIS "${nis}" sudah terdaftar atas nama "${dupNis.nama}".`, field: 'nis' };
      }
    }

    const newStudent = {
      id: data.id || generateUUID(),
      username: nisn,
      password: nis || nisn,
      nama: String(data.nama || '').trim(),
      email: data.email ? String(data.email).trim() : null,
      role: 'student',
      nisn: nisn,
      nis: nis || null,
      nomor_ujian: noUjian,
      jenis_kelamin: data.jenis_kelamin || 'L',
      agama: data.agama || 'Islam',
      kelas: data.kelas || '',
      tingkat: data.tingkat || 10,
      ruang: String(data.ruang || '').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 10),
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      is_verified: data.is_verified !== undefined ? Boolean(data.is_verified) : true,
      google_linked: Boolean(data.google_linked || false),
      google_id: data.google_id || null,
      google_email: data.google_email || null,
      google_linked_at: data.google_linked_at || null,
      active_device_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    _cache.users.push(newStudent);
    try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }

    // Async push ke SQLite
    dbService.addStudent(newStudent).catch(err => console.error('[ExamGuard Storage] Sync error addStudent:', err));
    return { success: true, user: newStudent };
  },

  updateStudent(id, data) {
    const idx = (_cache.users || []).findIndex(u => u.id === id);
    if (idx < 0) return { success: false, message: 'Peserta tidak ditemukan.' };

    const current = _cache.users[idx];
    const newNis = data.nis !== undefined ? String(data.nis || '').trim() : current.nis;
    const newNisn = data.nisn !== undefined ? String(data.nisn || '').trim() : current.nisn;
    const newUsername = newNisn || data.nomor_ujian || newNis || current.username;

    // Cek apakah password peserta sebelumnya adalah default (NIS atau NISN lama)
    const wasDefaultPassword = !current.password ||
      current.password === current.nis ||
      current.password === current.nisn ||
      current.password === '123456' ||
      current.password === 'password';

    let resolvedPassword = current.password;
    if (data.password) {
      resolvedPassword = data.password;
    } else if (wasDefaultPassword) {
      resolvedPassword = newNis || newNisn || '123456';
    }

    const payload = {
      ...data,
      username: newUsername,
      password: resolvedPassword,
    };

    const updated = {
      ...current,
      ...payload,
      ruang: data.ruang !== undefined ? String(data.ruang || '').replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 10) : current.ruang,
      nomor_ujian: data.nomor_ujian !== undefined ? cleanNomorUjian(data.nomor_ujian, newNisn) : current.nomor_ujian,
      updated_at: new Date().toISOString(),
    };
    _cache.users[idx] = updated;
    try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }

    dbService.updateStudent(id, payload).catch(err => console.error('[ExamGuard Storage] Sync error updateStudent:', err));
    return { success: true, user: updated };
  },

  toggleUserActive(id) {
    const idx = (_cache.users || []).findIndex(u => u.id === id);
    if (idx >= 0) {
      _cache.users[idx].is_active = !_cache.users[idx].is_active;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.toggleUserActive(id).catch(() => { });
      return { success: true, user: _cache.users[idx] };
    }
    return { success: false };
  },

  toggleUserVerified(id) {
    const idx = (_cache.users || []).findIndex(u => u.id === id);
    if (idx >= 0) {
      _cache.users[idx].is_verified = !_cache.users[idx].is_verified;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.toggleUserVerified(id).catch(() => { });
      return { success: true, user: _cache.users[idx] };
    }
    return { success: false };
  },

  resetUserDevice(id) {
    const idx = (_cache.users || []).findIndex(u => String(u.id) === String(id));
    if (idx >= 0) {
      _cache.users[idx].active_device_id = null;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      try {
        if (typeof dbService.resetUserDevice === 'function') {
          dbService.resetUserDevice(id).catch(() => { });
        }
      } catch (e) { }
      return { success: true, user: _cache.users[idx] };
    }
    return { success: false };
  },

  changeStudentPassword(studentId, oldPassword, newPassword) {
    const idx = (_cache.users || []).findIndex(u => u.id === studentId);
    if (idx < 0) return { success: false, message: 'Data peserta tidak ditemukan.' };
    const user = _cache.users[idx];
    const expected = user.password || user.nis || user.nisn;
    if (oldPassword !== expected) {
      return { success: false, message: 'Kata sandi saat ini tidak cocok. Silakan periksa kembali.' };
    }
    const cleanNew = String(newPassword || '').trim();
    if (cleanNew.length < 4) {
      return { success: false, message: 'Kata sandi baru minimal 4 karakter.' };
    }
    _cache.users[idx].password = cleanNew;
    _cache.users[idx].updated_at = new Date().toISOString();
    try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
    dbService.updateStudent(studentId, { password: cleanNew }).catch(err => console.error('[ExamGuard Storage] Sync error changeStudentPassword:', err));
    return { success: true, message: 'Kata sandi berhasil diperbarui.', user: _cache.users[idx] };
  },

  resetStudentPassword(studentId) {
    const idx = (_cache.users || []).findIndex(u => u.id === studentId);
    if (idx >= 0) {
      const defPass = _cache.users[idx].nis || _cache.users[idx].nisn;
      _cache.users[idx].password = defPass;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.resetStudentPassword(studentId).catch(() => { });
      return { success: true, defaultPassword: defPass };
    }
    return { success: false };
  },

  resetStudentSSO(studentId) {
    const idx = (_cache.users || []).findIndex(u => u.id === studentId);
    if (idx >= 0) {
      _cache.users[idx].google_linked = false;
      _cache.users[idx].google_id = null;
      _cache.users[idx].google_email = null;
      _cache.users[idx].google_linked_at = null;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.resetStudentSSO(studentId).catch(() => { });
      return { success: true, user: _cache.users[idx] };
    }
    return { success: false };
  },

  resetStudentLoginToken(studentId) {
    const idx = (_cache.users || []).findIndex(u => u.id === studentId);
    if (idx >= 0) {
      const seed = _cache.users[idx].nomor_ujian || _cache.users[idx].nisn || _cache.users[idx].id;
      const newToken = generateStudentLoginToken(seed);
      _cache.users[idx].login_token = newToken;
      _cache.users[idx].updated_at = new Date().toISOString();
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.resetStudentLoginToken(studentId).catch(() => { });
      return { success: true, token: newToken, user: _cache.users[idx] };
    }
    return { success: false };
  },

  unlinkStudentGoogle(studentId) {
    return this.resetStudentSSO(studentId);
  },

  getAdminAccounts() {
    return {
      superAdmin: (_cache.users || []).find(u => u.role === 'admin') || null,
      proctor: (_cache.users || []).find(u => u.role === 'proctor') || null,
    };
  },

  updateAdminProfile(userId, data) {
    let idx = (_cache.users || []).findIndex(u => u.id === userId);
    if (idx < 0) {
      if (data.role === 'admin' || userId === 'ADMIN-SUPER-01' || userId === 'admin-1') {
        idx = (_cache.users || []).findIndex(u => u.role === 'admin');
      } else if (data.role === 'proctor' || userId === 'PROCTOR-01' || userId === 'proktor-1') {
        idx = (_cache.users || []).findIndex(u => u.role === 'proctor');
      }
    }
    if (idx >= 0) {
      const targetUser = _cache.users[idx];
      _cache.users[idx] = { ...targetUser, ...data, id: targetUser.id, updated_at: new Date().toISOString() };
      try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }
      dbService.updateAdminProfile(targetUser.id, data).catch(() => { });
      return { success: true, user: _cache.users[idx] };
    }
    return { success: false, message: 'Akun tidak ditemukan.' };
  },

  validateImportStudents(students) {
    const existingUsers = _cache.users || [];
    const errors = [];
    const validStudents = [];
    const seenNisn = new Set();
    const seenNoUjian = new Set();

    students.forEach((s, idx) => {
      const rowNumber = s.rowNumber || idx + 1;
      const nisn = String(s.nisn || '').trim();
      const noUjian = cleanNomorUjian(s.nomor_ujian, nisn);

      if (!nisn) {
        errors.push({ rowNumber, nama: s.nama, fieldLabel: 'NISN', value: '', conflictWith: 'Kolom Kosong', description: 'NISN wajib diisi.' });
        return;
      }

      if (seenNisn.has(nisn)) {
        errors.push({ rowNumber, nama: s.nama, fieldLabel: 'NISN', value: nisn, conflictWith: 'Data dalam file yang sama', description: 'NISN ganda dalam satu file import.' });
        return;
      }
      seenNisn.add(nisn);

      const dupNisn = existingUsers.find(u => u.nisn === nisn);
      if (dupNisn) {
        errors.push({ rowNumber, nama: s.nama, fieldLabel: 'NISN', value: nisn, conflictWith: `Peserta "${dupNisn.nama}"`, description: 'NISN sudah ada di basis data.' });
        return;
      }

      if (noUjian) {
        if (seenNoUjian.has(noUjian)) {
          errors.push({ rowNumber, nama: s.nama, fieldLabel: 'No. Ujian', value: noUjian, conflictWith: 'Data dalam file yang sama', description: 'Nomor ujian ganda dalam satu file import.' });
          return;
        }
        seenNoUjian.add(noUjian);
        const dupNo = existingUsers.find(u => u.nomor_ujian === noUjian);
        if (dupNo) {
          errors.push({ rowNumber, nama: s.nama, fieldLabel: 'No. Ujian', value: noUjian, conflictWith: `Peserta "${dupNo.nama}"`, description: 'Nomor ujian sudah ada di basis data.' });
          return;
        }
      }

      validStudents.push({ ...s, nomor_ujian: noUjian });
    });

    return { isValid: errors.length === 0, validStudents, errors };
  },

  bulkImportStudents(validList) {
    if (!Array.isArray(validList) || validList.length === 0) return { success: false, message: 'Tidak ada data valid.' };
    const newOnes = validList.map(s => ({
      id: s.id || generateUUID(),
      username: s.nisn,
      password: s.nis || s.nisn,
      nama: s.nama,
      email: s.email || null,
      role: 'student',
      nisn: s.nisn,
      nis: s.nis || null,
      nomor_ujian: cleanNomorUjian(s.nomor_ujian, s.nisn),
      jenis_kelamin: s.jenis_kelamin || 'L',
      agama: s.agama || 'Islam',
      kelas: s.kelas || '',
      tingkat: s.tingkat || 10,
      ruang: s.ruang || 'Ruang 01',
      is_active: true,
      is_verified: true,
      google_linked: false,
      google_id: null,
      google_email: null,
      google_linked_at: null,
      active_device_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    _cache.users.push(...newOnes);
    try { localStorage.setItem('examguard_users', JSON.stringify(_cache.users)); } catch { }

    dbService.bulkImportStudents(validList).catch(err => console.error('[ExamGuard Storage] Sync error bulkImportStudents:', err));
    return { success: true, count: newOnes.length };
  },

  importStudents(validList) {
    return this.bulkImportStudents(validList);
  },

  // ── Exam Sessions ─────────────────────────────────────────────────────────
  getExamSessions() {
    return _cache.examSessions ? [..._cache.examSessions] : [];
  },

  getExamSessionById(id) {
    return (_cache.examSessions || []).find(e => e.id === id) || null;
  },

  saveExamSession(data) {
    const id = data.id || generateUUID();
    const token = data.exam_token ? formatExamToken(data.exam_token) : '';
    const existingIdx = (_cache.examSessions || []).findIndex(e => e.id === id);

    const examData = {
      id,
      title: data.title || '',
      subject: data.subject || 'Mata Pelajaran Umum',
      session_group: data.session_group || 'Asesmen Tengah Semester (ATS)',
      description: data.description || '',
      grade_level: data.grade_level !== undefined ? parseInt(data.grade_level, 10) : 10,
      is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      is_archived: Boolean(data.is_archived || false),
      gform_base_url: convertGoogleFormUrl(data.gform_base_url || ''),
      respon_base_url: data.respon_base_url || '',
      exam_token: token,
      finish_token: data.finish_token ? formatExamToken(data.finish_token) : '',
      start_time: data.start_time || '',
      end_time: data.end_time || '',
      duration_minutes: parseInt(data.duration_minutes, 10) || 60,
      created_at: existingIdx >= 0 ? _cache.examSessions[existingIdx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      _cache.examSessions[existingIdx] = examData;
    } else {
      _cache.examSessions.unshift(examData);
    }
    try { localStorage.setItem('examguard_exam_sessions', JSON.stringify(_cache.examSessions)); } catch { }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'sessions_updated', exam: examData } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'sessions_updated', exam: examData } }));
      } catch { }
    }

    dbService.saveExamSession(examData).catch(err => console.error('[ExamGuard Storage] Sync error saveExamSession:', err));
    return examData;
  },

  deleteExamSession(id) {
    _cache.examSessions = (_cache.examSessions || []).filter(e => e.id !== id);
    _cache.attempts = (_cache.attempts || []).filter(a => a.exam_session_id !== id);
    _cache.attendance = (_cache.attendance || []).filter(a => a.exam_session_id !== id);
    try {
      localStorage.setItem('examguard_exam_sessions', JSON.stringify(_cache.examSessions));
      localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts));
      localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance));
    } catch { }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'session_deleted', deletedId: id } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'session_deleted', deletedId: id } }));
      } catch { }
    }

    dbService.deleteExamSession(id).catch(err => console.error('[ExamGuard Storage] Sync error deleteExamSession:', err));
    return true;
  },

  archiveExamSession(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_archived: true, is_active: false });
  },

  archiveExam(id) {
    return this.archiveExamSession(id);
  },

  restoreExamFromArchive(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_archived: false, is_active: true });
  },

  restoreExam(id) {
    return this.restoreExamFromArchive(id);
  },

  toggleExamActive(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_active: !exam.is_active });
  },

  // ── Student Attempts ──────────────────────────────────────────────────────
  getAttempts() {
    return _cache.attempts ? [..._cache.attempts] : [];
  },

  getStudentAttempts() {
    return _cache.attempts ? [..._cache.attempts] : [];
  },

  getAttempt(studentIdOrNisn, examSessionId) {
    if (!studentIdOrNisn) return null;
    return (_cache.attempts || []).find(a =>
      (a.student_id === studentIdOrNisn || a.student_nisn === studentIdOrNisn) &&
      (!examSessionId || a.exam_session_id === examSessionId)
    ) || null;
  },

  saveAttempt(data) {
    const student = this.getUserById(data.student_id) || this.getUserByUsername(data.student_nisn);
    const exam = this.getExamSessionById(data.exam_session_id);

    const existingIdx = (_cache.attempts || []).findIndex(a =>
      (data.id && a.id === data.id) ||
      (a.student_id === data.student_id && a.exam_session_id === data.exam_session_id)
    );

    const now = new Date().toISOString();
    const existing = existingIdx >= 0 ? _cache.attempts[existingIdx] : null;

    const attempt = {
      id: data.id || existing?.id || generateUUID(),
      student_id: data.student_id,
      student_name: data.student_name || student?.nama || existing?.student_name || '',
      student_nisn: data.student_nisn || student?.nisn || existing?.student_nisn || '',
      student_kelas: data.student_kelas || student?.kelas || existing?.student_kelas || '',
      student_tingkat: data.student_tingkat !== undefined ? data.student_tingkat : (student?.tingkat || 0),
      exam_session_id: data.exam_session_id,
      exam_title: data.exam_title || exam?.title || existing?.exam_title || '',
      status: data.status || existing?.status || 'IN_PROGRESS',
      violation_count: data.is_reset_violations
        ? (data.violation_count || 0)
        : Math.max(existing?.violation_count || 0, data.violation_count || 0),
      time_spent_seconds: data.time_spent_seconds !== undefined ? data.time_spent_seconds : (existing?.time_spent_seconds || 0),
      last_violation_reason: data.last_violation_reason || existing?.last_violation_reason || '',
      ping_latency_ms: data.ping_latency_ms !== undefined ? data.ping_latency_ms : (existing?.ping_latency_ms || null),
      last_ping_at: data.last_ping_at !== undefined ? data.last_ping_at : (existing?.last_ping_at || null),
      started_at: existing?.started_at || data.started_at || now,
      completed_at: data.completed_at !== undefined ? data.completed_at : (existing?.completed_at || null),
      reset_at: data.reset_at !== undefined ? data.reset_at : (existing?.reset_at || null),
      unlocked_at: data.unlocked_at !== undefined ? data.unlocked_at : (existing?.unlocked_at || null),
      updated_at: now,
      is_proctor_action: Boolean(data.is_proctor_action),
      is_reset_violations: Boolean(data.is_reset_violations),
    };

    if (existingIdx >= 0) {
      _cache.attempts[existingIdx] = attempt;
    } else {
      _cache.attempts.unshift(attempt);
    }
    try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }

    dbService.saveAttempt(attempt).catch(err => console.error('[ExamGuard Storage] Sync error saveAttempt:', err));
    return attempt;
  },

  deleteAttempt(studentId, examSessionId) {
    _cache.attempts = (_cache.attempts || []).filter(
      a => !(String(a.student_id) === String(studentId) && String(a.exam_session_id) === String(examSessionId))
    );
    try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
    try {
      if (typeof dbService.deleteAttempt === 'function') {
        dbService.deleteAttempt(studentId, examSessionId).catch(() => { });
      } else if (typeof dbService.proctorSetAttemptNotStarted === 'function') {
        dbService.proctorSetAttemptNotStarted(studentId, examSessionId).catch(() => { });
      }
    } catch (e) {
      console.warn('Sync server deleteAttempt error:', e);
    }
    return true;
  },

  updateAttemptTime(studentId, examSessionId, timeSpentSeconds) {
    const attempt = this.getAttempt(studentId, examSessionId);
    if (!attempt) return null;
    attempt.time_spent_seconds = timeSpentSeconds;
    attempt.updated_at = new Date().toISOString();
    try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
    dbService.updateAttemptTime(studentId, examSessionId, timeSpentSeconds).catch(() => { });
    return attempt;
  },

  updateAttemptPing(attemptId, latencyMs) {
    const attempt = (_cache.attempts || []).find(a => a.id === attemptId);
    if (!attempt) return null;
    attempt.ping_latency_ms = Math.round(latencyMs);
    attempt.last_ping_at = new Date().toISOString();
    try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
    dbService.updateAttemptPing(attemptId, latencyMs).catch(() => { });
    return attempt;
  },

  async sendExamHeartbeat(studentId, examSessionId, timeSpentSeconds, latencyMs) {
    const attempt = this.getAttempt(studentId, examSessionId);
    const now = new Date().toISOString();
    if (attempt) {
      if (timeSpentSeconds !== undefined && timeSpentSeconds !== null) attempt.time_spent_seconds = timeSpentSeconds;
      if (latencyMs !== undefined && latencyMs !== null) attempt.ping_latency_ms = Math.round(latencyMs);
      attempt.last_ping_at = now;
      attempt.updated_at = now;
      try { localStorage.setItem('examguard_attempts', JSON.stringify(_cache.attempts)); } catch { }
    }
    return dbService.sendExamHeartbeat(studentId, examSessionId, timeSpentSeconds, latencyMs);
  },

  async syncAttemptsFromServer() {
    try {
      const res = await fetch('/api/db/attempts');
      if (res.ok) {
        const attempts = await res.json();
        if (Array.isArray(attempts)) {
          _cache.attempts = attempts;
          try { localStorage.setItem('examguard_attempts', JSON.stringify(attempts)); } catch { }
          return attempts;
        }
      }
    } catch { }
    return _cache.attempts || [];
  },

  proctorUnlockAttempt(studentIdOrAttemptId, examSessionId = null) {
    let attempt = examSessionId ? this.getAttempt(studentIdOrAttemptId, examSessionId) : null;
    if (!attempt) {
      attempt = (_cache.attempts || []).find(a => a.id === studentIdOrAttemptId || a.student_id === studentIdOrAttemptId);
    }
    if (!attempt) return null;
    const updated = this.saveAttempt({
      ...attempt,
      status: 'IN_PROGRESS',
      violation_count: 0,
      last_violation_reason: '',
      unlocked_at: new Date().toISOString(),
      is_proctor_action: true,
      is_reset_violations: true,
    });
    // Panggil backend API khusus unlock untuk memicu broadcast WebSocket 'attempt_unlocked'
    dbService.proctorUnlockAttempt(attempt.student_id, attempt.exam_session_id).catch(() => { });
    return updated;
  },

  proctorResetViolations(studentIdOrAttemptId, examSessionId = null) {
    let attempt = examSessionId ? this.getAttempt(studentIdOrAttemptId, examSessionId) : null;
    if (!attempt) {
      attempt = (_cache.attempts || []).find(a => a.id === studentIdOrAttemptId || a.student_id === studentIdOrAttemptId);
    }
    if (!attempt) return null;
    const updates = { ...attempt, violation_count: 0, last_violation_reason: '', is_reset_violations: true };
    if (attempt.status === 'LOCKED') {
      updates.status = 'IN_PROGRESS';
      updates.unlocked_at = new Date().toISOString();
      updates.is_proctor_action = true;
    }
    const updated = this.saveAttempt(updates);
    // Panggil backend API khusus reset-violations untuk memicu broadcast WebSocket 'violations_reset'
    dbService.proctorResetViolations(attempt.student_id, attempt.exam_session_id).catch(() => { });
    return updated;
  },

  proctorResetAnswerAttempt(studentIdOrAttemptId, examSessionId = null) {
    let attempt = examSessionId ? this.getAttempt(studentIdOrAttemptId, examSessionId) : null;
    if (!attempt) {
      attempt = (_cache.attempts || []).find(a => a.id === studentIdOrAttemptId || a.student_id === studentIdOrAttemptId);
    }
    if (!attempt) return null;
    return this.saveAttempt({
      ...attempt,
      status: 'RESET_BY_PROCTOR',
      violation_count: 0,
      time_spent_seconds: 0,
      started_at: null,
      last_violation_reason: '',
      reset_at: new Date().toISOString(),
      completed_at: null,
      is_proctor_action: true,
      is_reset_violations: true,
    });
  },

  proctorResetStudentDevice(studentId) {
    return this.resetUserDevice(studentId);
  },

  proctorResetStudentWork(studentId, examSessionId, examTitle = '') {
    const student = this.getUserById(studentId);
    const exam = this.getExamSessionById(examSessionId);
    return this.saveAttempt({
      student_id: studentId,
      student_name: student?.nama || '',
      student_nisn: student?.nisn || '',
      student_kelas: student?.kelas || '',
      student_tingkat: student?.tingkat || 0,
      exam_session_id: examSessionId,
      exam_title: examTitle || exam?.title || '',
      status: 'RESET_BY_PROCTOR',
      violation_count: 0,
      time_spent_seconds: 0,
      started_at: null,
      last_violation_reason: '',
      reset_at: new Date().toISOString(),
      completed_at: null,
      is_proctor_action: true,
      is_reset_violations: true,
    });
  },

  proctorSetAttemptCompleted(studentId, examSessionId, examTitle = '') {
    const attempt = this.getAttempt(studentId, examSessionId) || {};
    const updated = this.saveAttempt({
      ...attempt,
      student_id: studentId,
      exam_session_id: examSessionId,
      exam_title: examTitle || attempt.exam_title || '',
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      is_proctor_action: true,
    });
    // Set presensi otomatis menjadi HADIR
    this.saveExamAttendance(examSessionId, studentId, { status: 'HADIR' });
    return updated;
  },

  proctorSetAttemptNotStarted(studentId, examSessionId) {
    this.deleteAttempt(studentId, examSessionId);
    this.removeExamAttendance(examSessionId, studentId);
    return true;
  },

  proctorSetBulkCompleted(studentIds, examSessionId, examTitle = '') {
    studentIds.forEach(id => this.proctorSetAttemptCompleted(id, examSessionId, examTitle));
    dbService.proctorBulkComplete(studentIds, examSessionId, examTitle).catch(() => { });
    return studentIds.length;
  },

  proctorResetBulkStudentWork(studentIds, examSessionId, examTitle = '') {
    studentIds.forEach(id => this.proctorResetStudentWork(id, examSessionId, examTitle));
    dbService.proctorBulkReset(studentIds, examSessionId, examTitle).catch(() => { });
    return studentIds.length;
  },

  proctorSetBulkNotStarted(studentIds, examSessionId) {
    studentIds.forEach(id => this.proctorSetAttemptNotStarted(id, examSessionId));
    dbService.proctorBulkNotStarted(studentIds, examSessionId).catch(() => { });
    return studentIds.length;
  },

  // ── Exam Attendance ───────────────────────────────────────────────────────
  getExamAttendance(examSessionId = null) {
    if (examSessionId) {
      return (_cache.attendance || []).filter(a => a.exam_session_id === examSessionId);
    }
    return _cache.attendance ? [..._cache.attendance] : [];
  },

  getAttendance(examSessionId = null) {
    return this.getExamAttendance(examSessionId);
  },

  saveExamAttendance(examSessionId, studentId, data) {
    const idx = (_cache.attendance || []).findIndex(
      a => a.exam_session_id === examSessionId && a.student_id === studentId
    );
    const record = {
      id: idx >= 0 ? _cache.attendance[idx].id : generateUUID(),
      exam_session_id: examSessionId,
      student_id: studentId,
      status: data.status || 'HADIR',
      keterangan: data.keterangan || '',
      updated_by: data.updated_by || 'Proktor',
      updated_at: new Date().toISOString(),
    };
    if (idx >= 0) {
      _cache.attendance[idx] = record;
    } else {
      _cache.attendance.push(record);
    }
    try { localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance)); } catch { }

    dbService.updateStudentAttendance(examSessionId, studentId, data, record.updated_by).catch(() => { });
    return record;
  },

  removeExamAttendance(examSessionId, studentId) {
    _cache.attendance = (_cache.attendance || []).filter(
      a => !(a.exam_session_id === examSessionId && a.student_id === studentId)
    );
    try { localStorage.setItem('examguard_attendance', JSON.stringify(_cache.attendance)); } catch { }
    dbService.removeExamAttendance(examSessionId, studentId).catch(() => { });
    return true;
  },

  // ── Berita Acara Config ───────────────────────────────────────────────────
  getBeritaAcaraConfig() {
    return _cache.beritaAcaraConfig || {
      id: 'singleton',
      instansi_pusat: '',
      alamat: '',
      kepala_sekolah_nama: '',
      kepala_sekolah_nip: '',
      proktor_nama: '',
      proktor_nip: '',
      pengawas_nama: '',
      pengawas_nip: '',
      catatan_pelaksanaan: 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.',
      paper_size: 'A4',
      margin_preset: 'standard',
      margin_top: 15,
      margin_right: 15,
      margin_bottom: 15,
      margin_left: 15,
    };
  },

  saveBeritaAcaraConfig(config) {
    const current = this.getBeritaAcaraConfig();
    const updated = { ...current, ...config, updated_at: new Date().toISOString() };
    _cache.beritaAcaraConfig = updated;
    try { localStorage.setItem('examguard_berita_acara', JSON.stringify(updated)); } catch { }
    dbService.saveBeritaAcaraConfig(updated).catch(() => { });
    return updated;
  },

  // ── App Mode Config ───────────────────────────────────────────────────────
  getAppModeConfig() {
    return _cache.appModeConfig || {
      id: 'singleton',
      app_mode: 'production',
      bypass_gps: false,
      bypass_media: false,
      bypass_audio: false,
      bypass_notifications: false,
      bypass_fullscreen: false,
      bypass_cookies_check: false,
      bypass_google_sso: false,
      mock_gps_lat: null,
      mock_gps_lng: null,
      signature: 'eg_sig_production',
    };
  },

  async fetchAppModeFromServer() {
    if (typeof window === 'undefined') return this.getAppModeConfig();
    try {
      const res = await fetch('/api/db/app-mode');
      if (res.ok) {
        const conf = await res.json();
        _cache.appModeConfig = conf;
        try { localStorage.setItem('examguard_app_mode', JSON.stringify(conf)); } catch { }
        return conf;
      }
    } catch { }
    return this.getAppModeConfig();
  },

  saveAppModeConfig(config, caller = null) {
    const current = this.getAppModeConfig();
    const isCallerAdmin = caller?.role === 'admin' || this.getCurrentUser()?.role === 'admin';

    // Peserta tidak boleh mengubah ke simulasi
    if (config.app_mode === 'simulation' && !isCallerAdmin) {
      return { success: false, message: 'Hanya administrator yang diizinkan mengaktifkan Mode Simulasi.' };
    }

    const requestedMode = config.app_mode || current.app_mode || 'production';
    const isProduction = requestedMode === 'production';
    const isSwitchingToSimulation = requestedMode === 'simulation' && current.app_mode === 'production';

    const defaultGps = isSwitchingToSimulation ? true : (current.bypass_gps !== undefined ? Boolean(current.bypass_gps) : true);
    const defaultSso = isSwitchingToSimulation ? true : (current.bypass_google_sso !== undefined ? Boolean(current.bypass_google_sso) : true);

    const updated = {
      ...current,
      ...config,
      app_mode: requestedMode,
      bypass_gps: isProduction ? false : (config.bypass_gps !== undefined ? Boolean(config.bypass_gps) : defaultGps),
      bypass_media: isProduction ? false : (config.bypass_media !== undefined ? Boolean(config.bypass_media) : Boolean(current.bypass_media)),
      bypass_audio: isProduction ? false : (config.bypass_audio !== undefined ? Boolean(config.bypass_audio) : Boolean(current.bypass_audio)),
      bypass_notifications: isProduction ? false : (config.bypass_notifications !== undefined ? Boolean(config.bypass_notifications) : Boolean(current.bypass_notifications)),
      bypass_fullscreen: isProduction ? false : (config.bypass_fullscreen !== undefined ? Boolean(config.bypass_fullscreen) : Boolean(current.bypass_fullscreen)),
      bypass_cookies_check: isProduction ? false : (config.bypass_cookies_check !== undefined ? Boolean(config.bypass_cookies_check) : Boolean(current.bypass_cookies_check)),
      bypass_google_sso: isProduction ? false : (config.bypass_google_sso !== undefined ? Boolean(config.bypass_google_sso) : defaultSso),
      signature: generateModeSignature(requestedMode),
      updated_at: new Date().toISOString(),
    };

    _cache.appModeConfig = updated;
    try { localStorage.setItem('examguard_app_mode', JSON.stringify(updated)); } catch { }
    dbService.saveAppModeConfig(updated).catch(() => { });

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'app_mode_updated', config: updated } }));
        window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'app_mode_updated', config: updated } }));
      } catch { }
    }

    return {
      ...updated,
      success: true,
      config: updated,
    };
  },

  // ── System Error Logs ─────────────────────────────────────────────────────
  getSystemErrorLogs() {
    return _cache.systemErrorLogs || [];
  },

  addSystemErrorLog(entry) {
    const item = {
      id: entry.id || generateUUID(),
      timestamp: new Date().toISOString(),
      source: entry.source || 'Sistem',
      level: entry.level || 'error',
      message: entry.message || '',
      details: entry.details || '',
      solution: entry.solution || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
    _cache.systemErrorLogs.unshift(item);
    if (_cache.systemErrorLogs.length > 150) _cache.systemErrorLogs.pop();
    try { localStorage.setItem('examguard_error_logs', JSON.stringify(_cache.systemErrorLogs)); } catch { }
    dbService.addSystemErrorLog(item).catch(() => { });
    return item;
  },

  clearSystemErrorLogs() {
    _cache.systemErrorLogs = [];
    try { localStorage.setItem('examguard_error_logs', JSON.stringify([])); } catch { }
    dbService.clearSystemErrorLogs().catch(() => { });
    return true;
  },

  // ── Session Management (localStorage) ─────────────────────────────────────
  getCurrentUser() {
    return dbService.getCurrentUser();
  },

  setCurrentUser(user) {
    dbService.setCurrentUser(user);
  },

  clearCurrentUser() {
    dbService.clearCurrentUser();
  },

  getDeviceId() {
    return getOrCreateDeviceId();
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  login(usernameOrNisn, password) {
    const users = this.getUsers();
    const inst = this.getInstitution();
    const inputUser = String(usernameOrNisn || '').trim().toLowerCase();
    const inputPass = String(password || '').trim();

    const found = users.find(u => {
      const matchU = u.username && u.username.toLowerCase() === inputUser;
      const matchN = u.nisn && u.nisn.toLowerCase() === inputUser;
      const matchNo = u.nomor_ujian && u.nomor_ujian.toLowerCase() === inputUser;
      return matchU || matchN || matchNo;
    });

    if (!found) {
      return { success: false, message: 'Akun tidak ditemukan di sistem.' };
    }

    if (inst.auth_method === 'SSO_ONLY' && found.role === 'student') {
      return { success: false, message: 'Sekolah mengatur metode masuk "Hanya Google SSO".' };
    }

    if (found.password !== inputPass) {
      return { success: false, message: 'Password salah.' };
    }

    if (!found.is_active) {
      return { success: false, message: 'Akun Anda dinonaktifkan oleh sekolah.' };
    }

    if (!found.is_verified) {
      return { success: false, message: 'Akun Anda belum diverifikasi panitia ujian.' };
    }

    const isLockDevice = inst?.lock_device_enabled !== false;
    const currentDev = getOrCreateDeviceId();

    if (isLockDevice && found.role === 'student' && found.active_device_id && found.active_device_id !== currentDev) {
      return {
        success: false,
        message: `Akun terkunci di perangkat lain (${found.active_device_id}). Sesuai kebijakan sekolah, akun Anda terikat pada 1 perangkat. Hubungi Pengawas untuk Reset Kunci Perangkat jika Anda berganti perangkat.`,
      };
    }

    // Ikat ke perangkat ini jika peserta
    if (found.role === 'student') {
      if (found.active_device_id !== currentDev) {
        found.active_device_id = currentDev;
        this.saveUser(found);
      }
    }

    this.setCurrentUser(found);
    return { success: true, user: found };
  },

  // ── Backup & Restore ──────────────────────────────────────────────────────
  getFullSystemData() {
    return {
      institution: this.getInstitution(),
      users: this.getUsers(),
      exam_sessions: this.getExamSessions(),
      student_attempts: this.getAttempts(),
      exam_attendance: this.getAttendance(),
      app_mode_config: this.getAppModeConfig(),
      berita_acara_config: this.getBeritaAcaraConfig(),
      system_error_logs: this.getSystemErrorLogs(),
      exported_at: new Date().toISOString(),
    };
  },

  restoreAllData(restoredData) {
    _applySnapshot({
      institution: restoredData.institution,
      users: restoredData.users,
      examSessions: restoredData.exam_sessions || restoredData.examSessions,
      attempts: restoredData.student_attempts || restoredData.attempts,
      attendance: restoredData.exam_attendance || restoredData.attendance,
      appModeConfig: restoredData.app_mode_config || restoredData.appModeConfig,
      beritaAcaraConfig: restoredData.berita_acara_config || restoredData.beritaAcaraConfig,
      systemErrorLogs: restoredData.system_error_logs || restoredData.systemErrorLogs,
    });
    dbService.restoreAllData(restoredData).catch(err => console.error('[ExamGuard Storage] Sync error restoreAllData:', err));
    return { success: true };
  },

  // ── Broadcast (Siaran Cepat Peserta & Pengawas) ───────────────────────────
  getActiveBroadcast() {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('examguard_active_broadcast');
        if (raw) _cache.activeBroadcast = JSON.parse(raw);
      } catch { }
    }
    return _cache.activeBroadcast || { message: '', scheduled_at: null, broadcast_id: '' };
  },

  async saveBroadcast({ message, scheduled_at = null, broadcast_id = null }) {
    const finalMsg = String(message || '').slice(0, 100).trim();
    const bId = broadcast_id || ('bc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    const data = {
      id: 'singleton',
      message: finalMsg,
      scheduled_at: scheduled_at || null,
      broadcast_id: bId,
      updated_at: new Date().toISOString(),
    };
    _cache.activeBroadcast = data;
    try {
      localStorage.setItem('examguard_active_broadcast', JSON.stringify(data));
      if (finalMsg) {
        localStorage.setItem('examguard_last_broadcast_text', finalMsg);
        localStorage.setItem('examguard_last_broadcast_time', new Date().toISOString());
      }
    } catch { }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_broadcast_updated', { detail: data }));
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'broadcast_updated', data } }));
      window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event: 'broadcast_updated', data } }));
    }

    try {
      await fetch('/api/db/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.warn('[ExamGuard Storage] saveBroadcast error:', e);
    }
    return data;
  },

  getLastBroadcastInfo() {
    try {
      const text = localStorage.getItem('examguard_last_broadcast_text') || _cache.activeBroadcast?.message || '';
      const time = localStorage.getItem('examguard_last_broadcast_time') || _cache.activeBroadcast?.updated_at || '';
      return { text, time };
    } catch {
      return { text: '', time: '' };
    }
  },

  async clearBroadcast() {
    const empty = { id: 'singleton', message: '', scheduled_at: null, broadcast_id: '' };
    _cache.activeBroadcast = empty;
    try {
      localStorage.removeItem('examguard_active_broadcast');
    } catch { }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_broadcast_updated', { detail: empty }));
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: { event: 'broadcast_updated', data: empty } }));
    }
    try {
      await fetch('/api/db/broadcast', { method: 'DELETE' });
    } catch { }
    return empty;
  },
};

// ─── Backward Compatibility: apiAdapter ───────────────────────────────────────
export const apiAdapter = {
  isLiveApi: true,
  apiBase: '/api/db',
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
      });
      return response.ok ? response.json() : null;
    } catch {
      return null;
    }
  },
};

export default storageService;
