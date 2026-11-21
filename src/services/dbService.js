/**
 * ExamGuard Database Service Client
 * File: src/services/dbService.js
 *
 * Layer komunikasi antara React frontend dan SQLite backend via:
 *  - REST API: fetch('/api/db/*') untuk operasi CRUD
 *  - WebSocket: ws://<host>:5174 untuk push real-time
 *
 * Desain:
 *  - Semua fungsi async (mengembalikan Promise)
 *  - Cache in-memory untuk performa UI (invalidated oleh WS events)
 *  - Listener pattern untuk komponen React (subscribe/unsubscribe)
 *  - Fallback ke localStorage HANYA untuk: session user & device ID
 */

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_BASE = '/api/db';

// ─── In-memory Cache ──────────────────────────────────────────────────────────
let _cache = {
  institution:       null,
  users:             null,
  examSessions:      null,
  attempts:          null,
  attendance:        null,
  appModeConfig:     null,
  beritaAcaraConfig: null,
  systemErrorLogs:   null,
  lastSync:          0,
};

// ─── Event Listener Registry ──────────────────────────────────────────────────
const _listeners = new Set();

function _notifyListeners(event, data) {
  _listeners.forEach(fn => { try { fn(event, data); } catch {} });
  // Dispatch DOM event untuk komponen yang listen via useEffect
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('examguard_db_updated', { detail: { event, data } }));
  }
}

// ─── WebSocket Client ─────────────────────────────────────────────────────────
let _ws = null;
let _wsReconnectTimer = null;
let _wsReady = false;

function _connectWebSocket() {
  if (typeof window === 'undefined') return;
  if (_ws && (_ws.readyState === WebSocket.OPEN || _ws.readyState === WebSocket.CONNECTING)) return;

  const wsHost = window.location.hostname;
  const wsUrl  = `ws://${wsHost}:5174`;

  try {
    _ws = new WebSocket(wsUrl);
  } catch {
    _scheduleReconnect();
    return;
  }

  _ws.onopen = () => {
    _wsReady = true;
    console.log('[ExamGuard WS] Terhubung ke server real-time');
    clearTimeout(_wsReconnectTimer);
  };

  _ws.onmessage = (event) => {
    try {
      const { event: evName, data } = JSON.parse(event.data);
      _handleServerEvent(evName, data);
    } catch {}
  };

  _ws.onclose = () => {
    _wsReady = false;
    _scheduleReconnect();
  };

  _ws.onerror = () => {
    _wsReady = false;
  };
}

function _scheduleReconnect(delay = 3000) {
  clearTimeout(_wsReconnectTimer);
  _wsReconnectTimer = setTimeout(() => _connectWebSocket(), delay);
}

/**
 * Tangani event dari server melalui WebSocket.
 * Update cache & notifikasi listener.
 */
function _handleServerEvent(evName, data) {
  switch (evName) {
    case 'snapshot':
      // Data awal lengkap dari server saat pertama connect
      if (data.institution)       _cache.institution       = data.institution;
      if (data.users)             _cache.users             = data.users;
      if (data.examSessions)      _cache.examSessions      = data.examSessions;
      if (data.attempts)          _cache.attempts          = data.attempts;
      if (data.attendance)        _cache.attendance        = data.attendance;
      if (data.appModeConfig)     _cache.appModeConfig     = data.appModeConfig;
      if (data.beritaAcaraConfig) _cache.beritaAcaraConfig = data.beritaAcaraConfig;
      if (data.systemErrorLogs)   _cache.systemErrorLogs   = data.systemErrorLogs;
      _cache.lastSync = Date.now();
      _notifyListeners('snapshot', data);
      break;

    case 'institution_updated':
      _cache.institution = data.institution;
      _notifyListeners('institution_updated', data);
      break;

    case 'user_saved':
    case 'user_updated':
      if (_cache.users && data.user) {
        const idx = _cache.users.findIndex(u => u.id === data.user.id);
        if (idx >= 0) _cache.users[idx] = data.user;
        else _cache.users.push(data.user);
      } else {
        _cache.users = null; // Invalidate
      }
      _notifyListeners(evName, data);
      break;

    case 'user_deleted':
      if (_cache.users && data.deletedId) {
        _cache.users = _cache.users.filter(u => u.id !== data.deletedId);
      } else {
        _cache.users = null;
      }
      // Cascade: hapus attempts & attendance dari cache juga
      if (_cache.attempts && data.deletedId) {
        _cache.attempts = _cache.attempts.filter(a => a.student_id !== data.deletedId);
      }
      if (_cache.attendance && data.deletedId) {
        _cache.attendance = _cache.attendance.filter(a => a.student_id !== data.deletedId);
      }
      _notifyListeners('user_deleted', data);
      break;

    case 'all_students_deleted':
      if (_cache.users) _cache.users = _cache.users.filter(u => u.role !== 'student');
      _cache.attempts = [];
      _cache.attendance = [];
      _notifyListeners('all_students_deleted', data);
      break;

    case 'users_imported':
      _cache.users = null; // Invalidate, akan re-fetch saat dibutuhkan
      _notifyListeners('users_imported', data);
      break;

    case 'sessions_updated':
    case 'session_deleted':
      _cache.examSessions = null;
      if (data.deletedId && _cache.attempts) {
        _cache.attempts = _cache.attempts.filter(a => a.exam_session_id !== data.deletedId);
      }
      if (data.deletedId && _cache.attendance) {
        _cache.attendance = _cache.attendance.filter(a => a.exam_session_id !== data.deletedId);
      }
      _notifyListeners(evName, data);
      break;

    case 'attempt_updated':
    case 'attempt_unlocked':
    case 'violations_reset':
    case 'work_reset':
    case 'attempt_completed':
      if (_cache.attempts && data.attempt) {
        const idx = _cache.attempts.findIndex(a => a.id === data.attempt.id);
        if (idx >= 0) _cache.attempts[idx] = data.attempt;
        else _cache.attempts.push(data.attempt);
      } else {
        _cache.attempts = null;
      }
      _notifyListeners(evName, data);
      break;

    case 'attempt_removed':
      if (_cache.attempts) {
        _cache.attempts = _cache.attempts.filter(
          a => !(a.student_id === data.studentId && a.exam_session_id === data.examSessionId)
        );
      }
      _notifyListeners('attempt_removed', data);
      break;

    case 'bulk_attempt_updated':
      _cache.attempts = null; // Invalidate
      _notifyListeners('bulk_attempt_updated', data);
      break;

    case 'attendance_updated':
      if (_cache.attendance && data.record) {
        const idx = _cache.attendance.findIndex(
          a => a.student_id === data.record.student_id && a.exam_session_id === data.record.exam_session_id
        );
        if (idx >= 0) _cache.attendance[idx] = data.record;
        else _cache.attendance.push(data.record);
      } else {
        _cache.attendance = null;
      }
      _notifyListeners('attendance_updated', data);
      break;

    case 'attendance_removed':
      if (_cache.attendance) {
        _cache.attendance = _cache.attendance.filter(
          a => !(a.exam_session_id === data.examSessionId && a.student_id === data.studentId)
        );
      }
      _notifyListeners('attendance_removed', data);
      break;

    case 'berita_acara_updated':
      _cache.beritaAcaraConfig = data.config || data;
      _notifyListeners('berita_acara_updated', data);
      break;

    case 'app_mode_updated':
      _cache.appModeConfig = data.config || data;
      _notifyListeners('app_mode_updated', data);
      break;

    case 'error_log_added':
    case 'logs_cleared':
      _cache.systemErrorLogs = null;
      _notifyListeners(evName, data);
      break;

    case 'system_restored':
      // Reset semua cache setelah restore
      Object.keys(_cache).forEach(k => { _cache[k] = null; });
      _cache.lastSync = 0;
      _notifyListeners('system_restored', data);
      break;

    default:
      _notifyListeners(evName, data);
  }
}

// ─── HTTP Fetch Helper ────────────────────────────────────────────────────────
async function _fetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const currentUser = dbService.getCurrentUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(currentUser?.role ? { 'X-User-Role': currentUser.role } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ─── Cache-or-Fetch Helper ────────────────────────────────────────────────────
async function _cacheOrFetch(cacheKey, endpoint) {
  if (_cache[cacheKey] !== null && _cache[cacheKey] !== undefined) {
    return _cache[cacheKey];
  }
  const data = await _fetch(endpoint);
  _cache[cacheKey] = data;
  return data;
}

// ─── Main Service Object ──────────────────────────────────────────────────────
export const dbService = {

  // ── Init & Subscription ────────────────────────────────────────────────────
  init() {
    if (typeof window !== 'undefined') {
      _connectWebSocket();
    }
  },

  subscribe(callback) {
    _listeners.add(callback);
    return () => _listeners.delete(callback);
  },

  invalidateCache(key = null) {
    if (key) {
      _cache[key] = null;
    } else {
      Object.keys(_cache).forEach(k => { if (k !== 'lastSync') _cache[k] = null; });
    }
  },

  // Ambil snapshot penuh dari server (untuk init komponen)
  async getSnapshot() {
    const data = await _fetch('/snapshot');
    _cache.institution       = data.institution;
    _cache.users             = data.users;
    _cache.examSessions      = data.examSessions;
    _cache.attempts          = data.attempts;
    _cache.attendance        = data.attendance;
    _cache.appModeConfig     = data.appModeConfig;
    _cache.beritaAcaraConfig = data.beritaAcaraConfig;
    _cache.systemErrorLogs   = data.systemErrorLogs;
    _cache.lastSync          = Date.now();
    return data;
  },

  // ── Institution ────────────────────────────────────────────────────────────
  async getInstitution() {
    return _cacheOrFetch('institution', '/institution');
  },

  async updateInstitution(data) {
    const updated = await _fetch('/institution', { method: 'POST', body: JSON.stringify(data) });
    _cache.institution = updated;
    return updated;
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  async getUsers() {
    return _cacheOrFetch('users', '/users');
  },

  async getUserById(id) {
    // Cek cache dulu
    if (_cache.users) {
      const found = _cache.users.find(u => u.id === id);
      if (found) return found;
    }
    return _fetch(`/users/${encodeURIComponent(id)}`);
  },

  async addStudent(data) {
    const result = await _fetch('/users', { method: 'POST', body: JSON.stringify(data) });
    if (result.success) _cache.users = null;
    return result;
  },

  async updateStudent(id, data) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
    if (result.success) _cache.users = null;
    return result;
  },

  async deleteUser(id) {
    await _fetch(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    _cache.users = null;
    _cache.attempts = null;
    _cache.attendance = null;
    return true;
  },

  async deleteAllStudents() {
    await _fetch('/users/delete-all-students', { method: 'DELETE' });
    _cache.users = null;
    _cache.attempts = [];
    _cache.attendance = [];
    return true;
  },

  async toggleUserActive(id) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}/toggle-active`, { method: 'PUT' });
    if (result.success && _cache.users) {
      const idx = _cache.users.findIndex(u => u.id === id);
      if (idx >= 0) _cache.users[idx] = result.user;
    }
    return result;
  },

  async toggleUserVerified(id) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}/toggle-verified`, { method: 'PUT' });
    if (result.success && _cache.users) {
      const idx = _cache.users.findIndex(u => u.id === id);
      if (idx >= 0) _cache.users[idx] = result.user;
    }
    return result;
  },

  async resetUserDevice(id) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}/reset-device`, { method: 'PUT' });
    if (result.success && _cache.users) {
      const idx = _cache.users.findIndex(u => u.id === id);
      if (idx >= 0) _cache.users[idx] = result.user;
    }
    return result;
  },

  async resetStudentPassword(id) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}/reset-password`, { method: 'PUT' });
    return result;
  },

  async resetStudentSSO(id) {
    const result = await _fetch(`/users/${encodeURIComponent(id)}/reset-sso`, { method: 'PUT' });
    if (result.success && _cache.users) {
      const idx = _cache.users.findIndex(u => u.id === id);
      if (idx >= 0) _cache.users[idx] = result.user;
    }
    return result;
  },

  async updateAdminProfile(userId, data) {
    return _fetch(`/users/${encodeURIComponent(userId)}/update-admin`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async validateImportStudents(students) {
    return _fetch('/users/import', {
      method: 'POST',
      body: JSON.stringify({ validate_only: true, students }),
    });
  },

  async bulkImportStudents(students) {
    const result = await _fetch('/users/import', {
      method: 'POST',
      body: JSON.stringify({ validate_only: false, students }),
    });
    if (result.success) _cache.users = null;
    return result;
  },

  // ── Exam Sessions ──────────────────────────────────────────────────────────
  async getExamSessions() {
    return _cacheOrFetch('examSessions', '/exam-sessions');
  },

  async getExamSessionById(id) {
    if (_cache.examSessions) {
      const found = _cache.examSessions.find(e => e.id === id);
      if (found) return found;
    }
    return _fetch(`/exam-sessions/${encodeURIComponent(id)}`);
  },

  async saveExamSession(data) {
    const result = await _fetch('/exam-sessions', { method: 'POST', body: JSON.stringify(data) });
    _cache.examSessions = null;
    return result;
  },

  async deleteExamSession(id) {
    await _fetch(`/exam-sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
    _cache.examSessions = null;
    _cache.attempts = null;
    _cache.attendance = null;
    return true;
  },

  async archiveExamSession(id) {
    const result = await _fetch(`/exam-sessions/${encodeURIComponent(id)}/archive`, { method: 'PUT' });
    _cache.examSessions = null;
    return result;
  },

  async restoreExamFromArchive(id) {
    const result = await _fetch(`/exam-sessions/${encodeURIComponent(id)}/restore`, { method: 'PUT' });
    _cache.examSessions = null;
    return result;
  },

  async toggleExamActive(id) {
    const result = await _fetch(`/exam-sessions/${encodeURIComponent(id)}/toggle-active`, { method: 'PUT' });
    _cache.examSessions = null;
    return result;
  },

  // ── Student Attempts ───────────────────────────────────────────────────────
  async getAttempts() {
    return _cacheOrFetch('attempts', '/attempts');
  },

  async getAttemptsBySession(examSessionId) {
    if (_cache.attempts) {
      return _cache.attempts.filter(a => a.exam_session_id === examSessionId);
    }
    // Fetch all & cache
    const all = await this.getAttempts();
    return all.filter(a => a.exam_session_id === examSessionId);
  },

  async getAttempt(studentId, examSessionId) {
    if (_cache.attempts) {
      return _cache.attempts.find(a => a.student_id === studentId && a.exam_session_id === examSessionId) || null;
    }
    return _fetch(`/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}`);
  },

  async saveAttempt(data) {
    const result = await _fetch('/attempts', { method: 'POST', body: JSON.stringify(data) });
    if (result && _cache.attempts) {
      const idx = _cache.attempts.findIndex(a => a.student_id === result.student_id && a.exam_session_id === result.exam_session_id);
      if (idx >= 0) _cache.attempts[idx] = result;
      else _cache.attempts.push(result);
    }
    return result;
  },

  async updateAttemptTime(studentId, examSessionId, timeSpentSeconds) {
    return _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/update-time`,
      { method: 'PUT', body: JSON.stringify({ timeSpentSeconds }) }
    );
  },

  async updateAttemptPing(attemptId, studentId, examSessionId, latencyMs) {
    return _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/ping`,
      { method: 'PUT', body: JSON.stringify({ attemptId, latencyMs }) }
    );
  },

  // Aksi Pengawas
  async proctorUnlockAttempt(studentId, examSessionId) {
    const result = await _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/unlock`,
      { method: 'PUT' }
    );
    _cache.attempts = null;
    return result;
  },

  async proctorResetViolations(studentId, examSessionId) {
    const result = await _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/reset-violations`,
      { method: 'PUT' }
    );
    _cache.attempts = null;
    return result;
  },

  async proctorResetStudentWork(studentId, examSessionId, examTitle = '') {
    const result = await _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/reset-work`,
      { method: 'PUT', body: JSON.stringify({ examTitle }) }
    );
    _cache.attempts = null;
    return result;
  },

  async proctorSetAttemptCompleted(studentId, examSessionId, examTitle = '') {
    const result = await _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}/complete`,
      { method: 'PUT', body: JSON.stringify({ examTitle }) }
    );
    _cache.attempts = null;
    _cache.attendance = null;
    return result;
  },

  async proctorSetAttemptNotStarted(studentId, examSessionId) {
    await _fetch(
      `/attempts/${encodeURIComponent(studentId)}/${encodeURIComponent(examSessionId)}`,
      { method: 'DELETE' }
    );
    _cache.attempts = null;
    _cache.attendance = null;
    return true;
  },

  async proctorBulkReset(studentIds, examSessionId, examTitle) {
    const result = await _fetch('/attempts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset', studentIds, examSessionId, examTitle }),
    });
    _cache.attempts = null;
    return result;
  },

  async proctorBulkComplete(studentIds, examSessionId, examTitle) {
    const result = await _fetch('/attempts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'complete', studentIds, examSessionId, examTitle }),
    });
    _cache.attempts = null;
    _cache.attendance = null;
    return result;
  },

  async proctorBulkNotStarted(studentIds, examSessionId) {
    const result = await _fetch('/attempts/bulk', {
      method: 'POST',
      body: JSON.stringify({ action: 'not-started', studentIds, examSessionId }),
    });
    _cache.attempts = null;
    _cache.attendance = null;
    return result;
  },

  // ── Exam Attendance ────────────────────────────────────────────────────────
  async getExamAttendance(examSessionId = null) {
    if (examSessionId && _cache.attendance) {
      return _cache.attendance.filter(a => a.exam_session_id === examSessionId);
    }
    return _cacheOrFetch('attendance', `/attendance${examSessionId ? `?exam_session_id=${examSessionId}` : ''}`);
  },

  async updateStudentAttendance(examSessionId, studentId, data, updatedBy = 'Proktor') {
    const result = await _fetch('/attendance', {
      method: 'POST',
      body: JSON.stringify({ exam_session_id: examSessionId, student_id: studentId, ...data, updated_by: updatedBy }),
    });
    _cache.attendance = null;
    return result;
  },

  async removeExamAttendance(examSessionId, studentId) {
    await _fetch(
      `/attendance/${encodeURIComponent(examSessionId)}/${encodeURIComponent(studentId)}`,
      { method: 'DELETE' }
    );
    _cache.attendance = null;
    return true;
  },

  // ── Berita Acara ───────────────────────────────────────────────────────────
  async getBeritaAcaraConfig() {
    return _cacheOrFetch('beritaAcaraConfig', '/berita-acara');
  },

  async saveBeritaAcaraConfig(data) {
    const updated = await _fetch('/berita-acara', { method: 'POST', body: JSON.stringify(data) });
    _cache.beritaAcaraConfig = updated;
    return updated;
  },

  // ── App Mode Config ────────────────────────────────────────────────────────
  async getAppModeConfig() {
    return _cacheOrFetch('appModeConfig', '/app-mode');
  },

  async saveAppModeConfig(config) {
    const result = await _fetch('/app-mode', { method: 'POST', body: JSON.stringify(config) });
    if (result.success) _cache.appModeConfig = result.config;
    return result;
  },

  // ── System Error Logs ──────────────────────────────────────────────────────
  async getSystemErrorLogs() {
    return _cacheOrFetch('systemErrorLogs', '/logs');
  },

  async addSystemErrorLog(entry) {
    const result = await _fetch('/logs', { method: 'POST', body: JSON.stringify(entry) });
    _cache.systemErrorLogs = null;
    return result;
  },

  async clearSystemErrorLogs() {
    await _fetch('/logs', { method: 'DELETE' });
    _cache.systemErrorLogs = [];
    return true;
  },

  // ── Backup & Restore ───────────────────────────────────────────────────────
  async getFullSystemData() {
    return _fetch('/backup');
  },

  async restoreAllData(data) {
    return _fetch('/restore', { method: 'POST', body: JSON.stringify(data) });
  },

  // ── Session Management (tetap di localStorage) ─────────────────────────────
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('examguard_current_user')) || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem('examguard_current_user', JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem('examguard_current_user');
  },

  getDeviceId() {
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
  },

  // ── Auth Helper (Login) ────────────────────────────────────────────────────
  async loginUser(usernameOrNisn, password) {
    try {
      const users = await this.getUsers();
      const institution = await this.getInstitution();

      // Normalize input
      const inputUser = String(usernameOrNisn || '').trim().toLowerCase();
      const inputPass = String(password || '').trim();

      const found = users.find(u => {
        const matchUsername = u.username?.toLowerCase() === inputUser;
        const matchNisn     = u.nisn?.toLowerCase() === inputUser;
        const matchEmail    = u.email?.toLowerCase() === inputUser;
        return (matchUsername || matchNisn || matchEmail) && u.password === inputPass;
      });

      if (!found) {
        return { success: false, message: 'No. Ujian / NISN atau kata sandi tidak valid.' };
      }

      // Validasi akun aktif
      if (!found.is_active) {
        return { success: false, message: 'Akun Anda telah dinonaktifkan oleh administrator. Hubungi pengawas ujian.' };
      }
      if (!found.is_verified) {
        return { success: false, message: 'Akun Anda belum diverifikasi oleh panitia. Hubungi pengawas ujian.' };
      }

      // Cek metode auth (SSO_ONLY vs CREDENTIALS_ONLY vs BOTH)
      if (found.role === 'student' && institution?.auth_method === 'SSO_ONLY') {
        return {
          success: false,
          message: 'Instansi Anda hanya mengizinkan masuk melalui Google SSO. Gunakan tombol "Masuk dengan Google".',
          requireSSO: true,
        };
      }

      return { success: true, user: found };
    } catch (err) {
      console.error('[dbService.loginUser]', err);
      return { success: false, message: 'Terjadi kesalahan saat proses masuk. Coba beberapa saat lagi.' };
    }
  },

  // Registrasi device saat peserta login (device binding)
  async bindDevice(userId, deviceId) {
    return this.updateStudent(userId, { active_device_id: deviceId });
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  // Cek apakah server SQLite tersedia
  async ping() {
    try {
      await _fetch('/snapshot');
      return true;
    } catch {
      return false;
    }
  },
};

// Auto-init WebSocket saat module di-load di browser
if (typeof window !== 'undefined') {
  dbService.init();
}

export default dbService;
