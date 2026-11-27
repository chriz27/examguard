/**
 * ExamGuard SQLite Database Engine
 * File: server/db.cjs
 *
 * Menyediakan semua operasi database menggunakan better-sqlite3 (synchronous, ACID).
 * Diimpor oleh vite.config.js (Node.js context, bukan browser).
 *
 * Skema Relasional:
 *   institution       (single-row config)
 *   users             (admin, proctor, student)
 *   exam_sessions     (sesi ujian & bank soal)
 *   student_attempts  → FK users(id) CASCADE, FK exam_sessions(id) CASCADE
 *   exam_attendance   → FK users(id) CASCADE, FK exam_sessions(id) CASCADE
 *   berita_acara_config  (single-row config)
 *   app_mode_config   (single-row config)
 *   system_error_logs (audit trail)
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.EXAMGUARD_DB_PATH || path.resolve(__dirname, '..', 'examguard.db');

// ─── Bootstrap ───────────────────────────────────────────────────────────────
let rawDb;
let engineName = '';

// 1. Coba Node.js 22+ built-in node:sqlite (Zero-install, Zero-compiler, bawaan Node 22+)
try {
  const { DatabaseSync } = require('node:sqlite');
  rawDb = new DatabaseSync(DB_PATH);
  engineName = 'Node.js Built-in SQLite (' + process.version + ')';
} catch (e1) {
  // 2. Fallback ke better-sqlite3 jika Node < 22
  try {
    const Database = require('better-sqlite3');
    rawDb = new Database(DB_PATH);
    engineName = 'better-sqlite3';
  } catch (e2) {
    console.error('\n[ExamGuard DB] Tidak dapat memuat engine SQLite.');
    if (e1.message && e1.message.includes('No such built-in module')) {
      console.error('Penyebab: Node.js ' + process.version + ' memerlukan flag --experimental-sqlite.');
      console.error('Solusi: Jalankan perintah melalui npm agar flag aktif otomatis:');
      console.error('  -> npm run dev');
      console.error('  -> npm run test:db');
    } else {
      console.error('Error node:sqlite:', e1.message);
      console.error('Error better-sqlite3:', e2.message);
    }
    process.exit(1);
  }
}

console.log(`[ExamGuard DB] Terhubung menggunakan ${engineName}`);

// Ekstrak nama-nama parameter yang dideklarasikan dalam SQL (contoh: @id, @nama, :status)
function extractNamedParams(sql) {
  // Hapus string literal '...' agar karakter @, :, $ di dalam teks tidak dianggap parameter
  const cleanSql = sql.replace(/'(?:''|[^'])*'/g, '');
  const matches = cleanSql.match(/[@:$][a-zA-Z0-9_]+/g);
  return matches ? [...new Set(matches)] : [];
}

// Bind parameter hanya untuk nama yang tepat sesuai ekspektasi SQL (mencegah "Unknown named parameter")
function bindNamedParams(expectedParams, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const bound = {};
  for (const param of expectedParams) {
    const cleanKey = param.slice(1);
    let val = undefined;
    if (input[param] !== undefined) val = input[param];
    else if (input[cleanKey] !== undefined) val = input[cleanKey];
    else if (input['@' + cleanKey] !== undefined) val = input['@' + cleanKey];
    else if (input[':' + cleanKey] !== undefined) val = input[':' + cleanKey];
    else if (input['$' + cleanKey] !== undefined) val = input['$' + cleanKey];
    else val = null;

    if (val === undefined || val === null) {
      val = null;
    } else if (typeof val === 'boolean') {
      val = val ? 1 : 0;
    }
    bound[param] = val;
  }
  return bound;
}

function normalizeArgs(args) {
  return args.map(a => (a === undefined ? null : (typeof a === 'boolean' ? (a ? 1 : 0) : a)));
}

// Wrapper seragam (bekerja transparan di node:sqlite maupun better-sqlite3)
const db = {
  exec(sql) {
    return rawDb.exec(sql);
  },
  prepare(sql) {
    const rawStmt = rawDb.prepare(sql);
    const expectedNamed = extractNamedParams(sql);
    const hasNamed = expectedNamed.length > 0;

    return {
      run(...args) {
        if (hasNamed && args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          return rawStmt.run(bindNamedParams(expectedNamed, args[0]));
        }
        return rawStmt.run(...normalizeArgs(args));
      },
      get(...args) {
        if (hasNamed && args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          return rawStmt.get(bindNamedParams(expectedNamed, args[0]));
        }
        return rawStmt.get(...normalizeArgs(args));
      },
      all(...args) {
        if (hasNamed && args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0]) && args[0] !== null) {
          return rawStmt.all(bindNamedParams(expectedNamed, args[0]));
        }
        return rawStmt.all(...normalizeArgs(args));
      },
    };
  },
  transaction(fn) {
    if (typeof rawDb.transaction === 'function') {
      return rawDb.transaction(fn);
    }
    return (...args) => {
      rawDb.exec('BEGIN');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK');
        throw err;
      }
    };
  },
  pragma(str) {
    if (typeof rawDb.pragma === 'function') return rawDb.pragma(str);
    return rawDb.exec(`PRAGMA ${str};`);
  },
};

// Aktifkan WAL mode untuk performa & keamanan konkurensi
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');

// ─── Schema DDL ──────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS institution (
    id              TEXT PRIMARY KEY DEFAULT 'singleton',
    name            TEXT NOT NULL DEFAULT 'Institusi Pendidikan',
    npsn            TEXT NOT NULL DEFAULT '00000000',
    logo_url        TEXT,
    education_level TEXT NOT NULL DEFAULT 'SMA',
    allowed_grades  TEXT NOT NULL DEFAULT '[10,11,12]',
    idle_timeout_minutes INTEGER NOT NULL DEFAULT 30,
    gps_enabled     INTEGER NOT NULL DEFAULT 1,
    center_lat      REAL NOT NULL DEFAULT -6.2088,
    center_lng      REAL NOT NULL DEFAULT 106.8456,
    max_radius_meters INTEGER NOT NULL DEFAULT 200,
    gmaps_url       TEXT DEFAULT 'https://maps.google.com/?q=-6.2088,106.8456',
    auth_method     TEXT NOT NULL DEFAULT 'CREDENTIALS_ONLY' CHECK(auth_method IN ('SSO_ONLY','CREDENTIALS_ONLY','BOTH')),
    google_oauth_enabled INTEGER NOT NULL DEFAULT 0,
    google_client_id     TEXT DEFAULT '',
    google_client_secret TEXT DEFAULT '',
    recaptcha_enabled    INTEGER NOT NULL DEFAULT 0,
    recaptcha_site_key   TEXT DEFAULT '',
    recaptcha_secret_key TEXT DEFAULT '',
    recaptcha_version    TEXT NOT NULL DEFAULT 'v2' CHECK(recaptcha_version IN ('v2','v3')),
    finish_token_lead_minutes INTEGER NOT NULL DEFAULT 10,
    browser_permissions TEXT NOT NULL DEFAULT '{}',
    google_oauth_verified INTEGER NOT NULL DEFAULT 0,
    google_oauth_verified_email TEXT DEFAULT '',
    google_oauth_verified_at TEXT DEFAULT '',
    lock_device_enabled INTEGER NOT NULL DEFAULT 1,
    ngrok_authtoken     TEXT DEFAULT '',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    password        TEXT NOT NULL,
    nama            TEXT NOT NULL,
    email           TEXT NOT NULL DEFAULT '',
    role            TEXT NOT NULL CHECK(role IN ('admin','proctor','student')),
    nisn            TEXT NOT NULL DEFAULT '',
    nis             TEXT NOT NULL DEFAULT '',
    nomor_ujian     TEXT NOT NULL DEFAULT '',
    jenis_kelamin   TEXT NOT NULL DEFAULT 'L' CHECK(jenis_kelamin IN ('L','P','')),
    agama           TEXT NOT NULL DEFAULT 'Islam',
    kelas           TEXT NOT NULL DEFAULT '',
    tingkat         INTEGER NOT NULL DEFAULT 0,
    ruang           TEXT NOT NULL DEFAULT 'Ruang 01',
    is_active       INTEGER NOT NULL DEFAULT 1,
    is_verified     INTEGER NOT NULL DEFAULT 1,
    google_linked   INTEGER NOT NULL DEFAULT 0,
    google_id       TEXT,
    google_email    TEXT,
    google_linked_at TEXT,
    active_device_id TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_nisn     ON users(nisn);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

  CREATE TABLE IF NOT EXISTS exam_sessions (
    id              TEXT PRIMARY KEY,
    subject         TEXT NOT NULL DEFAULT 'Mata Pelajaran Umum',
    title           TEXT NOT NULL,
    session_group   TEXT NOT NULL DEFAULT 'Asesmen Tengah Semester (ATS)',
    description     TEXT NOT NULL DEFAULT '',
    grade_level     INTEGER NOT NULL DEFAULT 12,
    is_active       INTEGER NOT NULL DEFAULT 1,
    is_archived     INTEGER NOT NULL DEFAULT 0,
    gform_base_url  TEXT NOT NULL DEFAULT '',
    respon_base_url TEXT NOT NULL DEFAULT '',
    exam_token      TEXT NOT NULL DEFAULT '',
    finish_token    TEXT NOT NULL DEFAULT '',
    start_time      TEXT NOT NULL DEFAULT '',
    end_time        TEXT NOT NULL DEFAULT '',
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_exam_sessions_active   ON exam_sessions(is_active);
  CREATE INDEX IF NOT EXISTS idx_exam_sessions_archived ON exam_sessions(is_archived);

  CREATE TABLE IF NOT EXISTS student_attempts (
    id                   TEXT PRIMARY KEY,
    student_id           TEXT NOT NULL,
    student_name         TEXT NOT NULL DEFAULT '',
    student_nisn         TEXT NOT NULL DEFAULT '',
    student_kelas        TEXT NOT NULL DEFAULT '',
    student_tingkat      INTEGER NOT NULL DEFAULT 0,
    exam_session_id      TEXT NOT NULL,
    exam_title           TEXT NOT NULL DEFAULT '',
    status               TEXT NOT NULL DEFAULT 'IN_PROGRESS'
                         CHECK(status IN ('IN_PROGRESS','COMPLETED','LOCKED','RESET_BY_PROCTOR','UNLOCKED')),
    violation_count      INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds   INTEGER NOT NULL DEFAULT 0,
    last_violation_reason TEXT NOT NULL DEFAULT '',
    ping_latency_ms      INTEGER,
    last_ping_at         TEXT,
    started_at           TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at         TEXT,
    reset_at             TEXT,
    unlocked_at          TEXT,
    updated_at           TEXT NOT NULL DEFAULT (datetime('now')),
    is_proctor_action    INTEGER NOT NULL DEFAULT 0,
    is_reset_violations  INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (student_id)      REFERENCES users(id)          ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id)  ON DELETE CASCADE ON UPDATE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_unique
    ON student_attempts(student_id, exam_session_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_student   ON student_attempts(student_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_exam      ON student_attempts(exam_session_id);
  CREATE INDEX IF NOT EXISTS idx_attempts_status    ON student_attempts(status);
  CREATE INDEX IF NOT EXISTS idx_attempts_updated   ON student_attempts(updated_at DESC);

  CREATE TABLE IF NOT EXISTS exam_attendance (
    id              TEXT PRIMARY KEY,
    exam_session_id TEXT NOT NULL,
    student_id      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'HADIR'
                    CHECK(status IN ('HADIR','SAKIT','IZIN','ALPHA','DISPENSASI')),
    keterangan      TEXT NOT NULL DEFAULT '',
    updated_by      TEXT NOT NULL DEFAULT 'Proktor',
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (student_id)      REFERENCES users(id)         ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(exam_session_id, student_id)
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_session ON exam_attendance(exam_session_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_student ON exam_attendance(student_id);

  CREATE TABLE IF NOT EXISTS berita_acara_config (
    id                  TEXT PRIMARY KEY DEFAULT 'singleton',
    instansi_pusat      TEXT NOT NULL DEFAULT '',
    alamat              TEXT NOT NULL DEFAULT '',
    kepala_sekolah_nama TEXT NOT NULL DEFAULT '',
    kepala_sekolah_nip  TEXT NOT NULL DEFAULT '',
    proktor_nama        TEXT NOT NULL DEFAULT '',
    proktor_nip         TEXT NOT NULL DEFAULT '',
    pengawas_nama       TEXT NOT NULL DEFAULT '',
    pengawas_nip        TEXT NOT NULL DEFAULT '',
    catatan_pelaksanaan TEXT NOT NULL DEFAULT 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.',
    paper_size          TEXT NOT NULL DEFAULT 'A4' CHECK(paper_size IN ('A4','F4','LETTER')),
    margin_preset       TEXT NOT NULL DEFAULT 'standard',
    margin_top          INTEGER NOT NULL DEFAULT 15,
    margin_right        INTEGER NOT NULL DEFAULT 15,
    margin_bottom       INTEGER NOT NULL DEFAULT 15,
    margin_left         INTEGER NOT NULL DEFAULT 15,
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS app_mode_config (
    id                   TEXT PRIMARY KEY DEFAULT 'singleton',
    app_mode             TEXT NOT NULL DEFAULT 'production' CHECK(app_mode IN ('production','simulation')),
    bypass_gps           INTEGER NOT NULL DEFAULT 0,
    bypass_media         INTEGER NOT NULL DEFAULT 0,
    bypass_audio         INTEGER NOT NULL DEFAULT 0,
    bypass_notifications INTEGER NOT NULL DEFAULT 0,
    bypass_fullscreen    INTEGER NOT NULL DEFAULT 0,
    bypass_cookies_check INTEGER NOT NULL DEFAULT 0,
    bypass_google_sso    INTEGER NOT NULL DEFAULT 0,
    mock_gps_lat         REAL,
    mock_gps_lng         REAL,
    signature            TEXT NOT NULL DEFAULT '',
    updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_error_logs (
    id          TEXT PRIMARY KEY,
    timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
    source      TEXT NOT NULL DEFAULT 'Sistem',
    level       TEXT NOT NULL DEFAULT 'error' CHECK(level IN ('error','warning','info')),
    message     TEXT NOT NULL DEFAULT '',
    details     TEXT NOT NULL DEFAULT '',
    solution    TEXT NOT NULL DEFAULT '',
    user_agent  TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS active_broadcast (
    id            TEXT PRIMARY KEY DEFAULT 'singleton',
    message       TEXT NOT NULL DEFAULT '',
    scheduled_at  TEXT DEFAULT NULL,
    broadcast_id  TEXT NOT NULL DEFAULT '',
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON system_error_logs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_error_logs_level     ON system_error_logs(level);
`);

// Migration: Tambahkan kolom google_oauth_verified jika belum ada di tabel institution
try {
  rawDb.exec(`ALTER TABLE institution ADD COLUMN google_oauth_verified INTEGER NOT NULL DEFAULT 0;`);
} catch (_) {}
try {
  rawDb.exec(`ALTER TABLE institution ADD COLUMN google_oauth_verified_email TEXT DEFAULT '';`);
} catch (_) {}
try {
  rawDb.exec(`ALTER TABLE institution ADD COLUMN google_oauth_verified_at TEXT DEFAULT '';`);
} catch (_) {}
try {
  rawDb.exec(`ALTER TABLE institution ADD COLUMN lock_device_enabled INTEGER NOT NULL DEFAULT 1;`);
} catch (_) {}
try {
  rawDb.exec(`ALTER TABLE institution ADD COLUMN ngrok_authtoken TEXT DEFAULT '';`);
} catch (_) {}
try {
  rawDb.exec(`ALTER TABLE users ADD COLUMN login_token TEXT DEFAULT '';`);
} catch (_) {}
try {
  rawDb.exec(`CREATE INDEX IF NOT EXISTS idx_users_login_token ON users(login_token);`);
} catch (_) {}

// ─── Seed Data Default ────────────────────────────────────────────────────────
function seedDefaultData() {
  // Pastikan semua peserta memiliki login_token unik otomatis
  try {
    const studentsWithoutToken = db.prepare("SELECT id, nisn, nomor_ujian FROM users WHERE (login_token IS NULL OR login_token = '') AND role='student'").all();
    if (studentsWithoutToken && studentsWithoutToken.length > 0) {
      const updateTokenStmt = db.prepare("UPDATE users SET login_token=? WHERE id=?");
      for (const s of studentsWithoutToken) {
        const seed = (s.nomor_ujian || s.nisn || s.id || 'STD').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
        const r1 = Math.random().toString(36).substring(2, 10).toUpperCase();
        const r2 = Math.random().toString(36).substring(2, 10).toUpperCase();
        updateTokenStmt.run(`EGTOK-${seed}-${r1}-${r2}`, s.id);
      }
    }
  } catch (_) {}
  // Seed institution jika belum ada
  const instRow = db.prepare("SELECT id FROM institution WHERE id='singleton'").get();
  if (!instRow) {
    db.prepare(`
      INSERT INTO institution (id, name, npsn, education_level, allowed_grades, browser_permissions)
      VALUES ('singleton', 'SMA Negeri 1 Nusantara', '20104829', 'SMA', '[10,11,12]',
        '{"location_gps":true,"notifications":true,"sound_audio":true,"fullscreen":true,"google_sso":false,"block_clipboard":true,"camera_webcam":true,"cookies_iframe":true}')
    `).run();
  }

  // Seed berita_acara_config jika belum ada
  const baRow = db.prepare("SELECT id FROM berita_acara_config WHERE id='singleton'").get();
  if (!baRow) {
    db.prepare("INSERT INTO berita_acara_config (id) VALUES ('singleton')").run();
  }

  // Seed app_mode_config jika belum ada
  const amRow = db.prepare("SELECT id FROM app_mode_config WHERE id='singleton'").get();
  if (!amRow) {
    db.prepare("INSERT INTO app_mode_config (id, signature) VALUES ('singleton', 'eg_sig_production')").run();
  }

  // Seed akun admin & proctor jika belum ada
  const adminRow = db.prepare("SELECT id FROM users WHERE username='admin'").get();
  if (!adminRow) {
    db.prepare(`
      INSERT INTO users (id, username, password, nama, email, role, is_active, is_verified)
      VALUES ('ADMIN-SUPER-01', 'admin', 'admin', 'Super Admin', 'admin@examguard.sch.id', 'admin', 1, 1)
    `).run();
  }

  const proctorRow = db.prepare("SELECT id FROM users WHERE username='proktor'").get();
  if (!proctorRow) {
    db.prepare(`
      INSERT INTO users (id, username, password, nama, email, role, is_active, is_verified)
      VALUES ('PROCTOR-01', 'proktor', 'proktor', 'Proktor Ujian', 'proktor@examguard.sch.id', 'proctor', 1, 1)
    `).run();
  }

  // Seed active_broadcast jika belum ada
  const bcastRow = db.prepare("SELECT id FROM active_broadcast WHERE id='singleton'").get();
  if (!bcastRow) {
    db.prepare("INSERT INTO active_broadcast (id, message, broadcast_id) VALUES ('singleton', '', '')").run();
  }
}

seedDefaultData();

// ─── Helper ──────────────────────────────────────────────────────────────────
function boolToInt(v) { return v ? 1 : 0; }
function intToBool(v) { return v === 1 || v === true; }
function parseJson(v, fallback) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}
function safeStr(v, fallback = '') { return v !== null && v !== undefined ? String(v) : fallback; }

// Konversi row SQLite ke objek JS (integer/bool, JSON parsing)
function rowToInstitution(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    npsn: r.npsn,
    logo_url: r.logo_url || null,
    education_level: r.education_level,
    allowed_grades: parseJson(r.allowed_grades, [10, 11, 12]),
    idle_timeout_minutes: r.idle_timeout_minutes,
    gps_enabled: intToBool(r.gps_enabled),
    center_lat: r.center_lat,
    center_lng: r.center_lng,
    max_radius_meters: r.max_radius_meters,
    gmaps_url: r.gmaps_url,
    auth_method: r.auth_method,
    google_oauth_enabled: intToBool(r.google_oauth_enabled),
    google_client_id: r.google_client_id || '',
    google_client_secret: r.google_client_secret || '',
    recaptcha_enabled: intToBool(r.recaptcha_enabled),
    recaptcha_site_key: r.recaptcha_site_key || '',
    recaptcha_secret_key: r.recaptcha_secret_key || '',
    recaptcha_version: r.recaptcha_version,
    lock_device_enabled: r.lock_device_enabled !== 0,
    ngrok_authtoken: r.ngrok_authtoken || '',
    finish_token_lead_minutes: r.finish_token_lead_minutes,
    browser_permissions: parseJson(r.browser_permissions, {}),
    google_oauth_verified: intToBool(r.google_oauth_verified),
    google_oauth_verified_email: r.google_oauth_verified_email || '',
    google_oauth_verified_at: r.google_oauth_verified_at || '',
    updated_at: r.updated_at,
  };
}

function rowToUser(r) {
  if (!r) return null;
  return {
    id: r.id,
    username: r.username,
    password: r.password,
    nama: r.nama,
    email: r.email,
    role: r.role,
    nisn: r.nisn,
    nis: r.nis,
    nomor_ujian: r.nomor_ujian,
    jenis_kelamin: r.jenis_kelamin,
    agama: r.agama,
    kelas: r.kelas,
    tingkat: r.tingkat,
    ruang: r.ruang,
    is_active: intToBool(r.is_active),
    is_verified: intToBool(r.is_verified),
    google_linked: intToBool(r.google_linked),
    google_id: r.google_id || null,
    google_email: r.google_email || null,
    google_linked_at: r.google_linked_at || null,
    active_device_id: r.active_device_id || null,
    login_token: r.login_token || '',
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function rowToExamSession(r) {
  if (!r) return null;
  return {
    id: r.id,
    subject: r.subject,
    title: r.title,
    session_group: r.session_group,
    description: r.description,
    grade_level: r.grade_level,
    is_active: intToBool(r.is_active),
    is_archived: intToBool(r.is_archived),
    gform_base_url: r.gform_base_url,
    respon_base_url: r.respon_base_url,
    exam_token: r.exam_token,
    finish_token: r.finish_token,
    start_time: r.start_time,
    end_time: r.end_time,
    duration_minutes: r.duration_minutes,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function rowToAttempt(r) {
  if (!r) return null;
  return {
    id: r.id,
    student_id: r.student_id,
    student_name: r.student_name,
    student_nisn: r.student_nisn,
    student_kelas: r.student_kelas,
    student_tingkat: r.student_tingkat,
    exam_session_id: r.exam_session_id,
    exam_title: r.exam_title,
    status: r.status,
    violation_count: r.violation_count,
    time_spent_seconds: r.time_spent_seconds,
    last_violation_reason: r.last_violation_reason,
    ping_latency_ms: r.ping_latency_ms,
    last_ping_at: r.last_ping_at,
    started_at: r.started_at,
    completed_at: r.completed_at,
    reset_at: r.reset_at,
    unlocked_at: r.unlocked_at,
    updated_at: r.updated_at,
    is_proctor_action: intToBool(r.is_proctor_action),
    is_reset_violations: intToBool(r.is_reset_violations),
  };
}

function rowToAttendance(r) {
  if (!r) return null;
  return {
    id: r.id,
    exam_session_id: r.exam_session_id,
    student_id: r.student_id,
    status: r.status,
    keterangan: r.keterangan,
    updated_by: r.updated_by,
    updated_at: r.updated_at,
  };
}

function rowToErrorLog(r) {
  if (!r) return null;
  return {
    id: r.id,
    timestamp: r.timestamp,
    source: r.source,
    level: r.level,
    message: r.message,
    details: r.details,
    solution: r.solution,
    userAgent: r.user_agent,
  };
}

// ─── UUID ─────────────────────────────────────────────────────────────────────
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ─── Prepared Statements (singleton cache) ────────────────────────────────────
const stmts = {
  // Institution
  getInstitution:    db.prepare("SELECT * FROM institution WHERE id='singleton'"),
  upsertInstitution: db.prepare(`
    INSERT INTO institution (id,name,npsn,logo_url,education_level,allowed_grades,
      idle_timeout_minutes,gps_enabled,center_lat,center_lng,max_radius_meters,
      gmaps_url,auth_method,google_oauth_enabled,google_client_id,google_client_secret,
      recaptcha_enabled,recaptcha_site_key,recaptcha_secret_key,recaptcha_version,
      finish_token_lead_minutes,browser_permissions,google_oauth_verified,google_oauth_verified_email,google_oauth_verified_at,lock_device_enabled,ngrok_authtoken,updated_at)
    VALUES (@id,@name,@npsn,@logo_url,@education_level,@allowed_grades,
      @idle_timeout_minutes,@gps_enabled,@center_lat,@center_lng,@max_radius_meters,
      @gmaps_url,@auth_method,@google_oauth_enabled,@google_client_id,@google_client_secret,
      @recaptcha_enabled,@recaptcha_site_key,@recaptcha_secret_key,@recaptcha_version,
      @finish_token_lead_minutes,@browser_permissions,@google_oauth_verified,@google_oauth_verified_email,@google_oauth_verified_at,@lock_device_enabled,@ngrok_authtoken,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,npsn=excluded.npsn,logo_url=excluded.logo_url,
      education_level=excluded.education_level,allowed_grades=excluded.allowed_grades,
      idle_timeout_minutes=excluded.idle_timeout_minutes,gps_enabled=excluded.gps_enabled,
      center_lat=excluded.center_lat,center_lng=excluded.center_lng,
      max_radius_meters=excluded.max_radius_meters,gmaps_url=excluded.gmaps_url,
      auth_method=excluded.auth_method,google_oauth_enabled=excluded.google_oauth_enabled,
      google_client_id=excluded.google_client_id,google_client_secret=excluded.google_client_secret,
      recaptcha_enabled=excluded.recaptcha_enabled,recaptcha_site_key=excluded.recaptcha_site_key,
      recaptcha_secret_key=excluded.recaptcha_secret_key,recaptcha_version=excluded.recaptcha_version,
      finish_token_lead_minutes=excluded.finish_token_lead_minutes,
      browser_permissions=excluded.browser_permissions,
      google_oauth_verified=excluded.google_oauth_verified,
      google_oauth_verified_email=excluded.google_oauth_verified_email,
      google_oauth_verified_at=excluded.google_oauth_verified_at,
      lock_device_enabled=excluded.lock_device_enabled,
      ngrok_authtoken=excluded.ngrok_authtoken,
      updated_at=excluded.updated_at
  `),

  // Users
  getAllUsers:       db.prepare('SELECT * FROM users ORDER BY role ASC, nama ASC'),
  getUserById:      db.prepare('SELECT * FROM users WHERE id=?'),
  getUserByUsername:db.prepare("SELECT * FROM users WHERE username=? COLLATE NOCASE OR nisn=? COLLATE NOCASE OR nomor_ujian=? COLLATE NOCASE OR (login_token=? AND login_token != '')"),
  getUserByLoginToken: db.prepare("SELECT * FROM users WHERE login_token=? AND login_token != ''"),
  getUserByNisn:    db.prepare('SELECT * FROM users WHERE nisn=?'),
  getUserByEmail:   db.prepare('SELECT * FROM users WHERE email=? OR google_email=?'),
  getStudents:      db.prepare("SELECT * FROM users WHERE role='student' ORDER BY nama ASC"),
  insertUser: db.prepare(`
    INSERT INTO users (id,username,password,nama,email,role,nisn,nis,nomor_ujian,
      jenis_kelamin,agama,kelas,tingkat,ruang,is_active,is_verified,
      google_linked,google_id,google_email,google_linked_at,active_device_id,login_token,updated_at)
    VALUES (@id,@username,@password,@nama,@email,@role,@nisn,@nis,@nomor_ujian,
      @jenis_kelamin,@agama,@kelas,@tingkat,@ruang,@is_active,@is_verified,
      @google_linked,@google_id,@google_email,@google_linked_at,@active_device_id,@login_token,@updated_at)
  `),
  updateUser: db.prepare(`
    UPDATE users SET
      username=@username,password=@password,nama=@nama,email=@email,role=@role,
      nisn=@nisn,nis=@nis,nomor_ujian=@nomor_ujian,jenis_kelamin=@jenis_kelamin,
      agama=@agama,kelas=@kelas,tingkat=@tingkat,ruang=@ruang,
      is_active=@is_active,is_verified=@is_verified,
      google_linked=@google_linked,google_id=@google_id,google_email=@google_email,
      google_linked_at=@google_linked_at,active_device_id=@active_device_id,
      login_token=@login_token,
      updated_at=@updated_at
    WHERE id=@id
  `),
  deleteUser:         db.prepare('DELETE FROM users WHERE id=?'),
  deleteAllStudents:  db.prepare("DELETE FROM users WHERE role='student'"),
  checkNisnDup:       db.prepare('SELECT id FROM users WHERE nisn=? AND id!=?'),
  checkUsernameDup:   db.prepare('SELECT id FROM users WHERE username=? AND id!=?'),
  checkEmailDup:      db.prepare('SELECT id FROM users WHERE email=? AND id!=?'),

  // Exam Sessions
  getAllExamSessions:    db.prepare('SELECT * FROM exam_sessions ORDER BY created_at DESC'),
  getActiveExamSessions:db.prepare("SELECT * FROM exam_sessions WHERE is_active=1 AND is_archived=0 ORDER BY created_at DESC"),
  getArchivedExams:     db.prepare("SELECT * FROM exam_sessions WHERE is_archived=1 ORDER BY created_at DESC"),
  getExamSessionById:   db.prepare('SELECT * FROM exam_sessions WHERE id=?'),
  insertExamSession: db.prepare(`
    INSERT INTO exam_sessions (id,subject,title,session_group,description,grade_level,
      is_active,is_archived,gform_base_url,respon_base_url,exam_token,finish_token,
      start_time,end_time,duration_minutes,created_at,updated_at)
    VALUES (@id,@subject,@title,@session_group,@description,@grade_level,
      @is_active,@is_archived,@gform_base_url,@respon_base_url,@exam_token,@finish_token,
      @start_time,@end_time,@duration_minutes,@created_at,@updated_at)
  `),
  updateExamSession: db.prepare(`
    UPDATE exam_sessions SET
      subject=@subject,title=@title,session_group=@session_group,description=@description,
      grade_level=@grade_level,is_active=@is_active,is_archived=@is_archived,
      gform_base_url=@gform_base_url,respon_base_url=@respon_base_url,
      exam_token=@exam_token,finish_token=@finish_token,
      start_time=@start_time,end_time=@end_time,duration_minutes=@duration_minutes,
      updated_at=@updated_at
    WHERE id=@id
  `),
  deleteExamSession:  db.prepare('DELETE FROM exam_sessions WHERE id=?'),

  // Student Attempts
  getAllAttempts:      db.prepare('SELECT * FROM student_attempts ORDER BY updated_at DESC'),
  getAttemptsByStudent:    db.prepare('SELECT * FROM student_attempts WHERE student_id=?'),
  getAttemptsBySession:    db.prepare('SELECT * FROM student_attempts WHERE exam_session_id=?'),
  getAttemptByStudentExam: db.prepare('SELECT * FROM student_attempts WHERE student_id=? AND exam_session_id=?'),
  getAttemptById:          db.prepare('SELECT * FROM student_attempts WHERE id=?'),
  upsertAttempt: db.prepare(`
    INSERT INTO student_attempts
      (id,student_id,student_name,student_nisn,student_kelas,student_tingkat,
       exam_session_id,exam_title,status,violation_count,time_spent_seconds,
       last_violation_reason,ping_latency_ms,last_ping_at,started_at,completed_at,
       reset_at,unlocked_at,updated_at,is_proctor_action,is_reset_violations)
    VALUES
      (@id,@student_id,@student_name,@student_nisn,@student_kelas,@student_tingkat,
       @exam_session_id,@exam_title,@status,@violation_count,@time_spent_seconds,
       @last_violation_reason,@ping_latency_ms,@last_ping_at,@started_at,@completed_at,
       @reset_at,@unlocked_at,@updated_at,@is_proctor_action,@is_reset_violations)
    ON CONFLICT(student_id, exam_session_id) DO UPDATE SET
      status=excluded.status,
      violation_count=CASE
        WHEN excluded.is_reset_violations=1 THEN excluded.violation_count
        ELSE MAX(student_attempts.violation_count, excluded.violation_count)
      END,
      time_spent_seconds=excluded.time_spent_seconds,
      last_violation_reason=excluded.last_violation_reason,
      ping_latency_ms=excluded.ping_latency_ms,
      last_ping_at=excluded.last_ping_at,
      completed_at=excluded.completed_at,
      reset_at=excluded.reset_at,
      unlocked_at=excluded.unlocked_at,
      updated_at=excluded.updated_at,
      is_proctor_action=excluded.is_proctor_action,
      is_reset_violations=excluded.is_reset_violations,
      student_name=excluded.student_name,
      student_nisn=excluded.student_nisn,
      student_kelas=excluded.student_kelas,
      student_tingkat=excluded.student_tingkat,
      exam_title=excluded.exam_title
  `),
  deleteAttempt:          db.prepare('DELETE FROM student_attempts WHERE id=?'),
  deleteAttemptByStudentExam: db.prepare('DELETE FROM student_attempts WHERE student_id=? AND exam_session_id=?'),
  updateAttemptStatus: db.prepare(`
    UPDATE student_attempts SET status=@status,updated_at=@updated_at,
      is_proctor_action=@is_proctor_action WHERE id=@id
  `),
  updateAttemptTime: db.prepare(`
    UPDATE student_attempts SET time_spent_seconds=@time_spent_seconds, updated_at=@updated_at WHERE id=@id
  `),
  updateAttemptPing: db.prepare(`
    UPDATE student_attempts SET ping_latency_ms=@ping_latency_ms, last_ping_at=@last_ping_at WHERE id=@id
  `),

  // Attendance
  getAllAttendance:            db.prepare('SELECT * FROM exam_attendance ORDER BY updated_at DESC'),
  getAttendanceBySession:     db.prepare('SELECT * FROM exam_attendance WHERE exam_session_id=?'),
  getAttendanceByStudentExam: db.prepare('SELECT * FROM exam_attendance WHERE student_id=? AND exam_session_id=?'),
  upsertAttendance: db.prepare(`
    INSERT INTO exam_attendance (id, exam_session_id, student_id, status, keterangan, updated_by, updated_at)
    VALUES (@id, @exam_session_id, @student_id, @status, @keterangan, @updated_by, @updated_at)
    ON CONFLICT(exam_session_id, student_id) DO UPDATE SET
      status=excluded.status, keterangan=excluded.keterangan,
      updated_by=excluded.updated_by, updated_at=excluded.updated_at
  `),
  deleteAttendanceByStudentExam: db.prepare('DELETE FROM exam_attendance WHERE student_id=? AND exam_session_id=?'),

  // Berita Acara
  getBeritaAcara:    db.prepare("SELECT * FROM berita_acara_config WHERE id='singleton'"),
  upsertBeritaAcara: db.prepare(`
    INSERT INTO berita_acara_config
      (id,instansi_pusat,alamat,kepala_sekolah_nama,kepala_sekolah_nip,proktor_nama,proktor_nip,
       pengawas_nama,pengawas_nip,catatan_pelaksanaan,paper_size,margin_preset,
       margin_top,margin_right,margin_bottom,margin_left,updated_at)
    VALUES ('singleton',@instansi_pusat,@alamat,@kepala_sekolah_nama,@kepala_sekolah_nip,
      @proktor_nama,@proktor_nip,@pengawas_nama,@pengawas_nip,@catatan_pelaksanaan,
      @paper_size,@margin_preset,@margin_top,@margin_right,@margin_bottom,@margin_left,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      instansi_pusat=excluded.instansi_pusat,alamat=excluded.alamat,
      kepala_sekolah_nama=excluded.kepala_sekolah_nama,kepala_sekolah_nip=excluded.kepala_sekolah_nip,
      proktor_nama=excluded.proktor_nama,proktor_nip=excluded.proktor_nip,
      pengawas_nama=excluded.pengawas_nama,pengawas_nip=excluded.pengawas_nip,
      catatan_pelaksanaan=excluded.catatan_pelaksanaan,paper_size=excluded.paper_size,
      margin_preset=excluded.margin_preset,margin_top=excluded.margin_top,
      margin_right=excluded.margin_right,margin_bottom=excluded.margin_bottom,
      margin_left=excluded.margin_left,updated_at=excluded.updated_at
  `),

  // App Mode Config
  getAppMode:    db.prepare("SELECT * FROM app_mode_config WHERE id='singleton'"),
  upsertAppMode: db.prepare(`
    INSERT INTO app_mode_config
      (id,app_mode,bypass_gps,bypass_media,bypass_audio,bypass_notifications,
       bypass_fullscreen,bypass_cookies_check,bypass_google_sso,mock_gps_lat,mock_gps_lng,
       signature,updated_at)
    VALUES ('singleton',@app_mode,@bypass_gps,@bypass_media,@bypass_audio,@bypass_notifications,
      @bypass_fullscreen,@bypass_cookies_check,@bypass_google_sso,@mock_gps_lat,@mock_gps_lng,
      @signature,@updated_at)
    ON CONFLICT(id) DO UPDATE SET
      app_mode=excluded.app_mode,bypass_gps=excluded.bypass_gps,bypass_media=excluded.bypass_media,
      bypass_audio=excluded.bypass_audio,bypass_notifications=excluded.bypass_notifications,
      bypass_fullscreen=excluded.bypass_fullscreen,bypass_cookies_check=excluded.bypass_cookies_check,
      bypass_google_sso=excluded.bypass_google_sso,mock_gps_lat=excluded.mock_gps_lat,
      mock_gps_lng=excluded.mock_gps_lng,signature=excluded.signature,updated_at=excluded.updated_at
  `),

  // System Error Logs
  getAllLogs:    db.prepare('SELECT * FROM system_error_logs ORDER BY timestamp DESC LIMIT 150'),
  insertLog:    db.prepare(`
    INSERT INTO system_error_logs (id,timestamp,source,level,message,details,solution,user_agent)
    VALUES (@id,@timestamp,@source,@level,@message,@details,@solution,@user_agent)
  `),
  clearLogs:    db.prepare('DELETE FROM system_error_logs'),

  // Active Broadcast
  getActiveBroadcast: db.prepare("SELECT * FROM active_broadcast WHERE id='singleton'"),
  upsertActiveBroadcast: db.prepare(`
    INSERT INTO active_broadcast (id, message, scheduled_at, broadcast_id, updated_at)
    VALUES ('singleton', @message, @scheduled_at, @broadcast_id, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      message=excluded.message,
      scheduled_at=excluded.scheduled_at,
      broadcast_id=excluded.broadcast_id,
      updated_at=excluded.updated_at
  `),
  clearActiveBroadcast: db.prepare(`
    UPDATE active_broadcast SET message='', scheduled_at=NULL, broadcast_id='', updated_at=datetime('now') WHERE id='singleton'
  `),
};

// ─── API Handler Functions ────────────────────────────────────────────────────
// Semua fungsi ini dipanggil oleh HTTP handler di vite.config.js
// dan mengembalikan plain JS objects.

const dbApi = {

  // ── Institution ──────────────────────────────────────────────────────────
  getInstitution() {
    return rowToInstitution(stmts.getInstitution.get());
  },

  updateInstitution(data) {
    const now = new Date().toISOString();
    const current = this.getInstitution() || {};
    const bp = typeof data.browser_permissions === 'string'
      ? data.browser_permissions
      : JSON.stringify({ ...parseJson(current.browser_permissions, {}), ...(data.browser_permissions || {}) });
    const ag = data.allowed_grades !== undefined
      ? (typeof data.allowed_grades === 'string' ? data.allowed_grades : JSON.stringify(data.allowed_grades))
      : JSON.stringify(current.allowed_grades || [10, 11, 12]);

    stmts.upsertInstitution.run({
      id: 'singleton',
      name: safeStr(data.name, current.name || 'Institusi Pendidikan'),
      npsn: safeStr(data.npsn, current.npsn || '00000000').replace(/[^a-zA-Z0-9]/g, '').toUpperCase(),
      logo_url: data.logo_url !== undefined ? data.logo_url : (current.logo_url || null),
      education_level: safeStr(data.education_level, current.education_level || 'SMA'),
      allowed_grades: ag,
      idle_timeout_minutes: data.idle_timeout_minutes !== undefined ? data.idle_timeout_minutes : (current.idle_timeout_minutes || 30),
      gps_enabled: boolToInt(data.gps_enabled !== undefined ? data.gps_enabled : current.gps_enabled),
      center_lat: data.center_lat !== undefined ? data.center_lat : (current.center_lat || -6.2088),
      center_lng: data.center_lng !== undefined ? data.center_lng : (current.center_lng || 106.8456),
      max_radius_meters: data.max_radius_meters !== undefined ? data.max_radius_meters : (current.max_radius_meters || 200),
      gmaps_url: safeStr(data.gmaps_url, current.gmaps_url || ''),
      auth_method: safeStr(data.auth_method, current.auth_method || 'CREDENTIALS_ONLY'),
      google_oauth_enabled: boolToInt(data.google_oauth_enabled !== undefined ? data.google_oauth_enabled : current.google_oauth_enabled),
      google_client_id: safeStr(data.google_client_id, current.google_client_id || ''),
      google_client_secret: safeStr(data.google_client_secret, current.google_client_secret || ''),
      recaptcha_enabled: boolToInt(data.recaptcha_enabled !== undefined ? data.recaptcha_enabled : current.recaptcha_enabled),
      recaptcha_site_key: safeStr(data.recaptcha_site_key, current.recaptcha_site_key || ''),
      recaptcha_secret_key: safeStr(data.recaptcha_secret_key, current.recaptcha_secret_key || ''),
      recaptcha_version: safeStr(data.recaptcha_version, current.recaptcha_version || 'v2'),
      finish_token_lead_minutes: data.finish_token_lead_minutes !== undefined ? data.finish_token_lead_minutes : (current.finish_token_lead_minutes || 10),
      browser_permissions: bp,
      google_oauth_verified: boolToInt(data.google_oauth_verified !== undefined ? data.google_oauth_verified : current.google_oauth_verified),
      google_oauth_verified_email: safeStr(data.google_oauth_verified_email, current.google_oauth_verified_email || ''),
      google_oauth_verified_at: safeStr(data.google_oauth_verified_at, current.google_oauth_verified_at || ''),
      lock_device_enabled: boolToInt(data.lock_device_enabled !== undefined ? data.lock_device_enabled : (current.lock_device_enabled !== undefined ? current.lock_device_enabled : true)),
      ngrok_authtoken: safeStr(data.ngrok_authtoken, current.ngrok_authtoken || ''),
      updated_at: now,
    });
    return this.getInstitution();
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  getUsers() {
    return stmts.getAllUsers.all().map(rowToUser);
  },

  getUserById(id) {
    return rowToUser(stmts.getUserById.get(id));
  },

  getUserByUsername(username) {
    if (!username) return null;
    const u = String(username).trim();
    return rowToUser(stmts.getUserByUsername.get(u, u, u, u));
  },

  getUserByLoginToken(token) {
    if (!token) return null;
    const t = String(token).trim();
    return rowToUser(stmts.getUserByLoginToken.get(t));
  },

  getUserByNisn(nisn) {
    return rowToUser(stmts.getUserByNisn.get(nisn));
  },

  getUserByEmail(email) {
    const em = email?.toLowerCase?.() || email;
    return rowToUser(stmts.getUserByEmail.get(em, em));
  },

  getStudents() {
    return stmts.getStudents.all().map(rowToUser);
  },

  saveUser(data) {
    const now = new Date().toISOString();
    const existing = data.id ? this.getUserById(data.id) : null;
    const generateStudentToken = (u) => {
      const seed = (u.nomor_ujian || u.nisn || u.id || 'STD').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
      const r1 = Math.random().toString(36).substring(2, 10).toUpperCase();
      const r2 = Math.random().toString(36).substring(2, 10).toUpperCase();
      return `EGTOK-${seed}-${r1}-${r2}`;
    };

    if (existing) {
      const isStudent = (data.role || existing.role) === 'student';
      stmts.updateUser.run({
        id: data.id,
        username: safeStr(data.username, existing.username),
        password: safeStr(data.password, existing.password),
        nama: safeStr(data.nama, existing.nama),
        email: safeStr(data.email, existing.email).toLowerCase(),
        role: safeStr(data.role, existing.role),
        nisn: safeStr(data.nisn, existing.nisn),
        nis: safeStr(data.nis, existing.nis),
        nomor_ujian: safeStr(data.nomor_ujian, existing.nomor_ujian),
        jenis_kelamin: safeStr(data.jenis_kelamin, existing.jenis_kelamin),
        agama: safeStr(data.agama, existing.agama),
        kelas: safeStr(data.kelas, existing.kelas),
        tingkat: data.tingkat !== undefined ? parseInt(data.tingkat, 10) : existing.tingkat,
        ruang: safeStr(data.ruang, existing.ruang),
        is_active: boolToInt(data.is_active !== undefined ? data.is_active : existing.is_active),
        is_verified: boolToInt(data.is_verified !== undefined ? data.is_verified : existing.is_verified),
        google_linked: boolToInt(data.google_linked !== undefined ? data.google_linked : existing.google_linked),
        google_id: data.google_id !== undefined ? data.google_id : existing.google_id,
        google_email: data.google_email !== undefined ? data.google_email : existing.google_email,
        google_linked_at: data.google_linked_at !== undefined ? data.google_linked_at : existing.google_linked_at,
        active_device_id: data.active_device_id !== undefined ? data.active_device_id : existing.active_device_id,
        login_token: safeStr(data.login_token, existing.login_token || (isStudent ? generateStudentToken(existing) : '')),
        updated_at: now,
      });
    } else {
      const id = data.id || generateUUID();
      const role = safeStr(data.role, 'student');
      const isStudent = role === 'student';
      stmts.insertUser.run({
        id,
        username: safeStr(data.username, id),
        password: safeStr(data.password, ''),
        nama: safeStr(data.nama, 'Pengguna Baru'),
        email: safeStr(data.email, `${id}@examguard.sch.id`).toLowerCase(),
        role,
        nisn: safeStr(data.nisn, ''),
        nis: safeStr(data.nis, ''),
        nomor_ujian: safeStr(data.nomor_ujian, ''),
        jenis_kelamin: data.jenis_kelamin === 'P' ? 'P' : 'L',
        agama: safeStr(data.agama, 'Islam'),
        kelas: safeStr(data.kelas, ''),
        tingkat: parseInt(data.tingkat, 10) || 0,
        ruang: safeStr(data.ruang, 'Ruang 01'),
        is_active: boolToInt(data.is_active !== undefined ? data.is_active : true),
        is_verified: boolToInt(data.is_verified !== undefined ? data.is_verified : true),
        google_linked: boolToInt(data.google_linked || false),
        google_id: data.google_id || null,
        google_email: data.google_email || null,
        google_linked_at: data.google_linked_at || null,
        active_device_id: data.active_device_id || null,
        login_token: safeStr(data.login_token, isStudent ? generateStudentToken(data) : ''),
        updated_at: now,
      });
    }
    return this.getUserById(data.id || data.username);
  },

  addStudent(data) {
    const nisn = safeStr(data.nisn, '').trim();
    if (!nisn) return { success: false, message: 'NISN wajib diisi.' };

    // Validasi duplikasi
    const dupNisn = db.prepare('SELECT id,nama,kelas FROM users WHERE nisn=?').get(nisn);
    if (dupNisn) return { success: false, field: 'nisn', message: `NISN "${nisn}" sudah terdaftar atas nama "${dupNisn.nama}".` };

    const nomorUjian = safeStr(data.nomor_ujian, nisn).replace(/[^a-zA-Z0-9\-_.\/]/g, '') || nisn;
    const dupNoUjian = db.prepare('SELECT id,nama FROM users WHERE nomor_ujian=?').get(nomorUjian);
    if (dupNoUjian) return { success: false, field: 'nomor_ujian', message: `Nomor Ujian "${nomorUjian}" sudah digunakan.` };

    const rawNis = safeStr(data.nis, '').trim();
    if (rawNis && rawNis !== '-') {
      const dupNis = db.prepare("SELECT id,nama FROM users WHERE nis=? AND nis!='' AND nis!='-'").get(rawNis);
      if (dupNis) return { success: false, field: 'nis', message: `NIS "${rawNis}" sudah terdaftar atas nama "${dupNis.nama}".` };
    }

    const isVerified = data.is_verified !== false;
    const isActive   = isVerified ? (data.is_active !== false) : false;

    const newStudent = {
      id: generateUUID(),
      username: nisn,
      password: rawNis || nisn,
      nama: safeStr(data.nama, `Siswa ${nisn}`).trim(),
      email: safeStr(data.email, `${nisn}@student.sch.id`).toLowerCase().trim(),
      role: 'student',
      nisn,
      nis: rawNis,
      nomor_ujian: nomorUjian,
      jenis_kelamin: data.jenis_kelamin === 'P' ? 'P' : 'L',
      agama: safeStr(data.agama, 'Islam').trim(),
      kelas: safeStr(data.kelas, '-').trim(),
      tingkat: parseInt(data.tingkat, 10) || 0,
      ruang: safeStr(data.ruang, 'Ruang 01').trim(),
      is_active: isActive,
      is_verified: isVerified,
      google_linked: false,
      google_id: null,
      google_email: null,
      google_linked_at: null,
      active_device_id: null,
    };

    this.saveUser(newStudent);
    return { success: true, user: this.getUserById(newStudent.id) };
  },

  updateStudent(id, data) {
    const user = this.getUserById(id);
    if (!user) return { success: false, message: 'Peserta tidak ditemukan.' };

    const nisn = safeStr(data.nisn, user.nisn).trim();
    if (nisn !== user.nisn) {
      const dup = db.prepare('SELECT id,nama FROM users WHERE nisn=? AND id!=?').get(nisn, id);
      if (dup) return { success: false, field: 'nisn', message: `NISN "${nisn}" sudah digunakan oleh "${dup.nama}".` };
    }

    const isVerified = data.is_verified !== undefined ? Boolean(data.is_verified) : user.is_verified;
    const isActive   = isVerified ? (data.is_active !== undefined ? Boolean(data.is_active) : user.is_active) : false;

    // Jika email diubah, putus link SSO
    const newEmail = safeStr(data.email, user.email).toLowerCase().trim();
    const emailChanged = newEmail !== user.email;

    this.saveUser({
      ...user,
      ...data,
      id,
      nisn,
      username: nisn, // username selalu = nisn
      is_active: isActive,
      is_verified: isVerified,
      email: newEmail,
      google_linked: emailChanged ? false : (data.google_linked !== undefined ? Boolean(data.google_linked) : user.google_linked),
      google_id: emailChanged ? null : (data.google_id !== undefined ? data.google_id : user.google_id),
      google_email: emailChanged ? null : (data.google_email !== undefined ? data.google_email : user.google_email),
      google_linked_at: emailChanged ? null : (data.google_linked_at !== undefined ? data.google_linked_at : user.google_linked_at),
    });

    return { success: true, user: this.getUserById(id), emailChanged };
  },

  deleteUser(id) {
    // CASCADE DELETE pada attempts & attendance sudah ditangani oleh FK di SQLite
    stmts.deleteUser.run(id);
    return true;
  },

  deleteAllStudents() {
    // CASCADE DELETE pada attempts & attendance sudah ditangani oleh FK di SQLite
    stmts.deleteAllStudents.run();
    return true;
  },

  toggleUserActive(id) {
    const user = this.getUserById(id);
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' };
    if (!user.is_verified && !user.is_active) {
      return { success: false, message: 'Peserta belum terverifikasi! Verifikasi terlebih dahulu sebelum mengaktifkan.' };
    }
    const newActive = !user.is_active;
    const is_active = user.is_verified ? newActive : false;
    this.saveUser({ ...user, is_active });
    return { success: true, user: this.getUserById(id) };
  },

  toggleUserVerified(id) {
    const user = this.getUserById(id);
    if (!user) return { success: false, message: 'Pengguna tidak ditemukan.' };
    const newVerified = !user.is_verified;
    this.saveUser({ ...user, is_verified: newVerified, is_active: newVerified ? user.is_active : false });
    return { success: true, user: this.getUserById(id) };
  },

  resetUserDevice(id) {
    this.saveUser({ id, active_device_id: null });
    return this.getUserById(id);
  },

  resetStudentPassword(studentId) {
    const user = this.getUserById(studentId);
    if (!user) throw new Error('Data peserta tidak ditemukan.');
    const defaultPw = safeStr(user.nis || user.nisn, user.nisn).trim();
    this.saveUser({ id: studentId, password: defaultPw });
    return this.getUserById(studentId);
  },

  resetStudentSSO(studentId) {
    const user = this.getUserById(studentId);
    if (!user) throw new Error('Data peserta tidak ditemukan.');
    if (!user.password) {
      this.saveUser({ id: studentId, google_linked: false, google_id: null, google_email: null, google_linked_at: null, password: safeStr(user.nis || user.nisn, '').trim() });
    } else {
      this.saveUser({ id: studentId, google_linked: false, google_id: null, google_email: null, google_linked_at: null });
    }
    return this.getUserById(studentId);
  },

  resetStudentLoginToken(studentId) {
    const user = this.getUserById(studentId);
    if (!user) throw new Error('Data peserta tidak ditemukan.');
    const seed = (user.nomor_ujian || user.nisn || user.id || 'STD').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    const r1 = Math.random().toString(36).substring(2, 10).toUpperCase();
    const r2 = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newToken = `EGTOK-${seed}-${r1}-${r2}`;
    this.saveUser({ id: studentId, login_token: newToken });
    return this.getUserById(studentId);
  },

  updateAdminProfile(userId, { username, email, password, nama }) {
    let user = this.getUserById(userId);
    if (!user && (userId === 'PROCTOR-01' || userId === 'proktor-1')) {
      const pRow = db.prepare("SELECT * FROM users WHERE role = 'proctor' LIMIT 1").get();
      if (pRow) user = this.rowToUser(pRow);
    }
    if (!user && (userId === 'ADMIN-SUPER-01' || userId === 'admin-1')) {
      const aRow = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get();
      if (aRow) user = this.rowToUser(aRow);
    }
    if (!user || (user.role !== 'admin' && user.role !== 'proctor')) {
      return { success: false, message: 'Akun pengawas/administrator tidak ditemukan.' };
    }
    const targetId = user.id;
    if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const dup = db.prepare('SELECT id FROM users WHERE username=? AND id!=?').get(username.trim().toLowerCase(), targetId);
      if (dup) return { success: false, message: `Username "${username}" sudah digunakan oleh akun lain.` };
    }
    this.saveUser({
      ...user,
      id: targetId,
      username: username ? username.trim() : user.username,
      email: email ? email.trim() : user.email,
      password: password || user.password,
      nama: nama ? nama.trim() : user.nama,
    });
    return { success: true, user: this.getUserById(targetId) };
  },

  // Validasi import massal
  validateImportStudents(list) {
    const existing = this.getStudents();
    const errors = [];
    const valid  = [];
    const seenNisn     = new Map();
    const seenNoUjian  = new Map();
    const seenNis      = new Map();

    list.forEach((row, idx) => {
      const rowNum = row.rowNumber || idx + 1;
      const nama   = safeStr(row.nama, '').trim();
      const nisn   = safeStr(row.nisn, '').trim();
      const noUjian = (safeStr(row.nomor_ujian, '').trim() || nisn).replace(/[^a-zA-Z0-9\-_.\/]/g, '') || nisn;
      const nis    = safeStr(row.nis, '').trim();
      let rowErr   = false;

      if (!nama) { errors.push({ rowNumber: rowNum, field: 'nama', description: 'Nama wajib diisi.' }); rowErr = true; }
      if (!nisn) { errors.push({ rowNumber: rowNum, field: 'nisn', description: 'NISN wajib diisi.' }); rowErr = true; }

      if (!rowErr) {
        const dbNisn = existing.find(u => u.nisn === nisn);
        if (dbNisn) { errors.push({ rowNumber: rowNum, nama, field:'nisn', description:`NISN "${nisn}" sudah ada di database (${dbNisn.nama}).` }); rowErr=true; }
        const fileNisn = seenNisn.get(nisn.toLowerCase());
        if (fileNisn) { errors.push({ rowNumber: rowNum, nama, field:'nisn', description:`NISN "${nisn}" duplikat di baris ${fileNisn.rowNum}.` }); rowErr=true; }
        const dbNoUjian = existing.find(u => u.nomor_ujian === noUjian);
        if (dbNoUjian) { errors.push({ rowNumber: rowNum, nama, field:'nomor_ujian', description:`Nomor Ujian "${noUjian}" sudah ada (${dbNoUjian.nama}).` }); rowErr=true; }
        const fileNoUjian = seenNoUjian.get(noUjian.toLowerCase());
        if (fileNoUjian) { errors.push({ rowNumber: rowNum, nama, field:'nomor_ujian', description:`Nomor Ujian "${noUjian}" duplikat di baris ${fileNoUjian.rowNum}.` }); rowErr=true; }
        if (nis && nis !== '-') {
          const dbNis = existing.find(u => u.nis === nis && nis !== '');
          if (dbNis) { errors.push({ rowNumber: rowNum, nama, field:'nis', description:`NIS "${nis}" sudah ada (${dbNis.nama}).` }); rowErr=true; }
          const fileNis = seenNis.get(nis.toLowerCase());
          if (fileNis) { errors.push({ rowNumber: rowNum, nama, field:'nis', description:`NIS "${nis}" duplikat di baris ${fileNis.rowNum}.` }); rowErr=true; }
        }
      }

      if (!rowErr) {
        seenNisn.set(nisn.toLowerCase(), { rowNum, nama });
        seenNoUjian.set(noUjian.toLowerCase(), { rowNum, nama });
        if (nis && nis !== '-') seenNis.set(nis.toLowerCase(), { rowNum, nama });
        valid.push({ ...row, nisn, nomor_ujian: noUjian });
      }
    });
    return { errors, validStudents: valid };
  },

  bulkImportStudents(validList) {
    const insert = db.transaction((students) => {
      const added = [];
      students.forEach(data => {
        const r = this.addStudent(data);
        if (r.success) added.push(r.user);
      });
      return added;
    });
    return insert(validList);
  },

  // ── Exam Sessions ─────────────────────────────────────────────────────────
  getExamSessions() {
    return stmts.getAllExamSessions.all().map(rowToExamSession);
  },

  getActiveExamSessions() {
    return stmts.getActiveExamSessions.all().map(rowToExamSession);
  },

  getArchivedExams() {
    return stmts.getArchivedExams.all().map(rowToExamSession);
  },

  getExamSessionById(id) {
    return rowToExamSession(stmts.getExamSessionById.get(id));
  },

  saveExamSession(data) {
    const now = new Date().toISOString();
    const id = data.id || generateUUID();
    const existing = this.getExamSessionById(id);
    const payload = {
      id,
      subject: safeStr(data.subject, 'Mata Pelajaran Umum').trim(),
      title: safeStr(data.title, '').trim(),
      session_group: safeStr(data.session_group, 'Asesmen Tengah Semester (ATS)').trim(),
      description: safeStr(data.description, '').trim(),
      grade_level: parseInt(data.grade_level, 10) || 12,
      is_active: boolToInt(data.is_active !== undefined ? data.is_active : true),
      is_archived: boolToInt(data.is_archived || false),
      gform_base_url: safeStr(data.gform_base_url, '').trim(),
      respon_base_url: safeStr(data.respon_base_url, '').trim(),
      exam_token: safeStr(data.exam_token, '').toUpperCase().trim(),
      finish_token: safeStr(data.finish_token, '').toUpperCase().trim(),
      start_time: safeStr(data.start_time, '').trim(),
      end_time: safeStr(data.end_time, '').trim(),
      duration_minutes: parseInt(data.duration_minutes, 10) || 60,
      created_at: existing ? existing.created_at : (data.created_at || now),
      updated_at: now,
    };

    if (existing) {
      stmts.updateExamSession.run(payload);
    } else {
      stmts.insertExamSession.run(payload);
    }
    return this.getExamSessionById(id);
  },

  deleteExamSession(id) {
    // CASCADE DELETE pada attempts & attendance sudah ditangani FK SQLite
    stmts.deleteExamSession.run(id);
    return true;
  },

  archiveExamSession(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_archived: true, is_active: false });
  },

  restoreExamFromArchive(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_archived: false, is_active: true });
  },

  toggleExamActive(id) {
    const exam = this.getExamSessionById(id);
    if (!exam) return null;
    return this.saveExamSession({ ...exam, is_active: !exam.is_active });
  },

  // ── Student Attempts ──────────────────────────────────────────────────────
  getAttempts() {
    return stmts.getAllAttempts.all().map(rowToAttempt);
  },

  getAttemptsBySession(examSessionId) {
    return stmts.getAttemptsBySession.all(examSessionId).map(rowToAttempt);
  },

  getAttempt(studentId, examSessionId) {
    if (examSessionId) {
      return rowToAttempt(stmts.getAttemptByStudentExam.get(studentId, examSessionId));
    }
    return rowToAttempt(stmts.getAttemptsByStudent.all(studentId)[0] || null);
  },

  saveAttempt(data) {
    const now = new Date().toISOString();
    const existing = data.student_id && data.exam_session_id
      ? this.getAttempt(data.student_id, data.exam_session_id)
      : (data.id ? rowToAttempt(stmts.getAttemptById.get(data.id)) : null);

    // Validasi: student dan exam_session harus ada
    const studentRow = data.student_id ? stmts.getUserById.get(data.student_id) : null;
    if (!studentRow) return null;
    const examRow = data.exam_session_id ? stmts.getExamSessionById.get(data.exam_session_id) : null;
    if (!examRow) return null;

    const isProctorAction = Boolean(data.is_proctor_action || false);
    const isResetViolations = Boolean(data.is_reset_violations || false);

    const payload = {
      id: data.id || (existing?.id) || generateUUID(),
      student_id: data.student_id,
      student_name: safeStr(data.student_name, studentRow.nama),
      student_nisn: safeStr(data.student_nisn, studentRow.nisn),
      student_kelas: safeStr(data.student_kelas, studentRow.kelas),
      student_tingkat: data.student_tingkat !== undefined ? data.student_tingkat : (studentRow.tingkat || 0),
      exam_session_id: data.exam_session_id,
      exam_title: safeStr(data.exam_title, examRow.title),
      status: safeStr(data.status, existing?.status || 'IN_PROGRESS'),
      violation_count: data.violation_count !== undefined ? parseInt(data.violation_count, 10) : (existing?.violation_count || 0),
      time_spent_seconds: data.time_spent_seconds !== undefined ? parseInt(data.time_spent_seconds, 10) : (existing?.time_spent_seconds || 0),
      last_violation_reason: safeStr(data.last_violation_reason, existing?.last_violation_reason || ''),
      ping_latency_ms: data.ping_latency_ms !== undefined ? data.ping_latency_ms : (existing?.ping_latency_ms || null),
      last_ping_at: data.last_ping_at !== undefined ? data.last_ping_at : (existing?.last_ping_at || null),
      started_at: existing?.started_at || data.started_at || now,
      completed_at: data.completed_at !== undefined ? data.completed_at : (existing?.completed_at || null),
      reset_at: data.reset_at !== undefined ? data.reset_at : (existing?.reset_at || null),
      unlocked_at: data.unlocked_at !== undefined ? data.unlocked_at : (existing?.unlocked_at || null),
      updated_at: now,
      is_proctor_action: boolToInt(isProctorAction),
      is_reset_violations: boolToInt(isResetViolations),
    };

    stmts.upsertAttempt.run(payload);
    return this.getAttempt(data.student_id, data.exam_session_id);
  },

  deleteAttempt(studentId, examSessionId) {
    stmts.deleteAttemptByStudentExam.run(studentId, examSessionId);
    return true;
  },

  updateAttemptTime(studentId, examSessionId, timeSpentSeconds) {
    const attempt = this.getAttempt(studentId, examSessionId);
    if (!attempt) return null;
    stmts.updateAttemptTime.run({ id: attempt.id, time_spent_seconds: timeSpentSeconds, updated_at: new Date().toISOString() });
    return this.getAttempt(studentId, examSessionId);
  },

  updateAttemptPing(attemptId, latencyMs) {
    stmts.updateAttemptPing.run({ id: attemptId, ping_latency_ms: Math.round(latencyMs), last_ping_at: new Date().toISOString() });
    return rowToAttempt(stmts.getAttemptById.get(attemptId));
  },

  updateAttemptHeartbeat(studentId, examSessionId, timeSpentSeconds, latencyMs) {
    const attempt = this.getAttempt(studentId, examSessionId);
    if (!attempt) return null;
    const now = new Date().toISOString();
    const timeSpent = timeSpentSeconds !== undefined && timeSpentSeconds !== null ? Number(timeSpentSeconds) : attempt.time_spent_seconds;
    const ping = latencyMs !== undefined && latencyMs !== null ? Math.round(Number(latencyMs)) : attempt.ping_latency_ms;
    db.prepare(`
      UPDATE student_attempts
      SET time_spent_seconds = ?,
          ping_latency_ms = ?,
          last_ping_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(timeSpent, ping, now, now, attempt.id);
    return this.getAttempt(studentId, examSessionId);
  },

  // Aksi Pengawas: Unlock
  proctorUnlockAttempt(studentId, examSessionId) {
    const now = new Date().toISOString();
    const attempt = this.getAttempt(studentId, examSessionId);
    if (attempt) {
      return this.saveAttempt({
        ...attempt,
        status: 'IN_PROGRESS',
        violation_count: 0,
        last_violation_reason: '',
        unlocked_at: now,
        is_proctor_action: true,
        is_reset_violations: true,
      });
    }
    return null;
  },

  // Aksi Pengawas: Reset pelanggaran
  proctorResetViolations(studentId, examSessionId) {
    const attempt = this.getAttempt(studentId, examSessionId);
    if (attempt) {
      const updates = { ...attempt, violation_count: 0, last_violation_reason: '', is_reset_violations: true };
      if (attempt.status === 'LOCKED') {
        updates.status = 'IN_PROGRESS';
        updates.unlocked_at = new Date().toISOString();
        updates.is_proctor_action = true;
      }
      return this.saveAttempt(updates);
    }
    return null;
  },

  // Aksi Pengawas: Reset pekerjaan (kerjakan ulang)
  proctorResetStudentWork(studentId, examSessionId, examTitle = '') {
    const now = new Date().toISOString();
    const student = this.getUserById(studentId);
    const existing = this.getAttempt(studentId, examSessionId);
    return this.saveAttempt({
      ...(existing || {}),
      student_id: studentId,
      exam_session_id: examSessionId,
      exam_title: examTitle || existing?.exam_title || '',
      student_name: student?.nama || '',
      student_nisn: student?.nisn || '',
      student_kelas: student?.kelas || '',
      student_tingkat: student?.tingkat || 0,
      status: 'RESET_BY_PROCTOR',
      violation_count: 0,
      time_spent_seconds: 0,
      last_violation_reason: '',
      completed_at: null,
      reset_at: now,
      is_proctor_action: true,
      is_reset_violations: true,
    });
  },

  // Aksi Pengawas: Set selesai
  proctorSetAttemptCompleted(studentId, examSessionId, examTitle = '') {
    const now = new Date().toISOString();
    const student = this.getUserById(studentId);
    const existing = this.getAttempt(studentId, examSessionId);
    const result = this.saveAttempt({
      ...(existing || {}),
      student_id: studentId,
      exam_session_id: examSessionId,
      exam_title: examTitle || existing?.exam_title || '',
      student_name: student?.nama || '',
      student_nisn: student?.nisn || '',
      student_kelas: student?.kelas || '',
      student_tingkat: student?.tingkat || 0,
      status: 'COMPLETED',
      completed_at: now,
      is_proctor_action: true,
    });
    // Catat ke presensi sebagai HADIR
    if (student) {
      this.updateAttendance(examSessionId, studentId, { status: 'HADIR', keterangan: 'Selesai (Diatur Pengawas)' }, 'Pengawas');
    }
    return result;
  },

  // Aksi Pengawas: Hapus attempt (kembali ke "Belum Masuk")
  proctorSetAttemptNotStarted(studentId, examSessionId) {
    this.deleteAttempt(studentId, examSessionId);
    // Hapus presensi juga
    stmts.deleteAttendanceByStudentExam.run(studentId, examSessionId);
    return true;
  },

  // Bulk proctor actions
  proctorBulkReset(studentIds, examSessionId, examTitle) {
    const tx = db.transaction((ids) => {
      let count = 0;
      ids.forEach(sid => { if (this.proctorResetStudentWork(sid, examSessionId, examTitle)) count++; });
      return count;
    });
    return tx(studentIds);
  },

  proctorBulkComplete(studentIds, examSessionId, examTitle) {
    const tx = db.transaction((ids) => {
      let count = 0;
      ids.forEach(sid => { if (this.proctorSetAttemptCompleted(sid, examSessionId, examTitle)) count++; });
      return count;
    });
    return tx(studentIds);
  },

  proctorBulkNotStarted(studentIds, examSessionId) {
    const tx = db.transaction((ids) => {
      let count = 0;
      ids.forEach(sid => { if (this.proctorSetAttemptNotStarted(sid, examSessionId)) count++; });
      return count;
    });
    return tx(studentIds);
  },

  // ── Exam Attendance ───────────────────────────────────────────────────────
  getAttendance(examSessionId = null) {
    if (examSessionId) return stmts.getAttendanceBySession.all(examSessionId).map(rowToAttendance);
    return stmts.getAllAttendance.all().map(rowToAttendance);
  },

  updateAttendance(examSessionId, studentId, data, updatedBy = 'Proktor') {
    const existing = stmts.getAttendanceByStudentExam.get(studentId, examSessionId);
    stmts.upsertAttendance.run({
      id: existing?.id || generateUUID(),
      exam_session_id: examSessionId,
      student_id: studentId,
      status: safeStr(data.status, 'HADIR'),
      keterangan: safeStr(data.keterangan, '').trim(),
      updated_by: safeStr(updatedBy, 'Proktor'),
      updated_at: new Date().toISOString(),
    });
    return rowToAttendance(stmts.getAttendanceByStudentExam.get(studentId, examSessionId));
  },

  removeAttendance(examSessionId, studentId) {
    stmts.deleteAttendanceByStudentExam.run(studentId, examSessionId);
    return true;
  },

  // ── Berita Acara Config ───────────────────────────────────────────────────
  getBeritaAcaraConfig() {
    const r = stmts.getBeritaAcara.get();
    if (!r) return {};
    return {
      instansi_pusat: r.instansi_pusat,
      alamat: r.alamat,
      kepala_sekolah_nama: r.kepala_sekolah_nama,
      kepala_sekolah_nip: r.kepala_sekolah_nip,
      proktor_nama: r.proktor_nama,
      proktor_nip: r.proktor_nip,
      pengawas_nama: r.pengawas_nama,
      pengawas_nip: r.pengawas_nip,
      catatan_pelaksanaan: r.catatan_pelaksanaan,
      paper_size: r.paper_size,
      margin_preset: r.margin_preset,
      margin_top: r.margin_top,
      margin_right: r.margin_right,
      margin_bottom: r.margin_bottom,
      margin_left: r.margin_left,
      updated_at: r.updated_at,
    };
  },

  saveBeritaAcaraConfig(data) {
    const current = this.getBeritaAcaraConfig();
    stmts.upsertBeritaAcara.run({
      instansi_pusat:      safeStr(data.instansi_pusat,      current.instansi_pusat || ''),
      alamat:              safeStr(data.alamat,              current.alamat || ''),
      kepala_sekolah_nama: safeStr(data.kepala_sekolah_nama, current.kepala_sekolah_nama || ''),
      kepala_sekolah_nip:  safeStr(data.kepala_sekolah_nip,  current.kepala_sekolah_nip || ''),
      proktor_nama:        safeStr(data.proktor_nama,        current.proktor_nama || ''),
      proktor_nip:         safeStr(data.proktor_nip,         current.proktor_nip || ''),
      pengawas_nama:       safeStr(data.pengawas_nama,       current.pengawas_nama || ''),
      pengawas_nip:        safeStr(data.pengawas_nip,        current.pengawas_nip || ''),
      catatan_pelaksanaan: safeStr(data.catatan_pelaksanaan, current.catatan_pelaksanaan || ''),
      paper_size:          safeStr(data.paper_size,          current.paper_size || 'A4'),
      margin_preset:       safeStr(data.margin_preset,       current.margin_preset || 'standard'),
      margin_top:          data.margin_top    !== undefined ? data.margin_top    : (current.margin_top    || 15),
      margin_right:        data.margin_right  !== undefined ? data.margin_right  : (current.margin_right  || 15),
      margin_bottom:       data.margin_bottom !== undefined ? data.margin_bottom : (current.margin_bottom || 15),
      margin_left:         data.margin_left   !== undefined ? data.margin_left   : (current.margin_left   || 15),
      updated_at: new Date().toISOString(),
    });
    return this.getBeritaAcaraConfig();
  },

  // ── App Mode Config ───────────────────────────────────────────────────────
  getAppModeConfig() {
    const r = stmts.getAppMode.get();
    if (!r) return { app_mode: 'production' };
    const isSimulation = r.app_mode === 'simulation';
    return {
      app_mode: r.app_mode,
      bypass_gps:           isSimulation ? intToBool(r.bypass_gps)           : false,
      bypass_media:         isSimulation ? intToBool(r.bypass_media)         : false,
      bypass_audio:         isSimulation ? intToBool(r.bypass_audio)         : false,
      bypass_notifications: isSimulation ? intToBool(r.bypass_notifications) : false,
      bypass_fullscreen:    isSimulation ? intToBool(r.bypass_fullscreen)    : false,
      bypass_cookies_check: isSimulation ? intToBool(r.bypass_cookies_check) : false,
      bypass_google_sso:    isSimulation ? intToBool(r.bypass_google_sso)    : false,
      mock_gps_coords: isSimulation && r.mock_gps_lat ? { lat: r.mock_gps_lat, lng: r.mock_gps_lng } : null,
      signature: r.signature,
      updated_at: r.updated_at,
    };
  },

  saveAppModeConfig(data, callerRole = null) {
    const current = this.getAppModeConfig();
    const requestedMode = safeStr(data.app_mode, current.app_mode);

    // Hanya admin yang boleh mengaktifkan simulation mode
    if (requestedMode === 'simulation' && current.app_mode === 'production') {
      if (callerRole !== 'admin') {
        return { success: false, message: 'Hanya Super Admin yang dapat mengaktifkan Mode Simulasi.' };
      }
    }

    const isProduction = requestedMode === 'production';
    const isSwitchingToSimulation = requestedMode === 'simulation' && current.app_mode === 'production';
    const defaultGps = isSwitchingToSimulation ? 1 : boolToInt(current.bypass_gps !== undefined ? current.bypass_gps : 1);
    const defaultSso = isSwitchingToSimulation ? 1 : boolToInt(current.bypass_google_sso !== undefined ? current.bypass_google_sso : 1);
    const mockCoords = data.mock_gps_coords || current.mock_gps_coords || { lat: -6.2088, lng: 106.8456 };

    stmts.upsertAppMode.run({
      app_mode:             isProduction ? 'production' : 'simulation',
      bypass_gps:           isProduction ? 0 : (data.bypass_gps           !== undefined ? boolToInt(data.bypass_gps)           : defaultGps),
      bypass_media:         isProduction ? 0 : (data.bypass_media         !== undefined ? boolToInt(data.bypass_media)         : boolToInt(current.bypass_media)),
      bypass_audio:         isProduction ? 0 : (data.bypass_audio         !== undefined ? boolToInt(data.bypass_audio)         : boolToInt(current.bypass_audio)),
      bypass_notifications: isProduction ? 0 : (data.bypass_notifications !== undefined ? boolToInt(data.bypass_notifications) : boolToInt(current.bypass_notifications)),
      bypass_fullscreen:    isProduction ? 0 : (data.bypass_fullscreen    !== undefined ? boolToInt(data.bypass_fullscreen)    : boolToInt(current.bypass_fullscreen)),
      bypass_cookies_check: isProduction ? 0 : (data.bypass_cookies_check !== undefined ? boolToInt(data.bypass_cookies_check) : boolToInt(current.bypass_cookies_check)),
      bypass_google_sso:    isProduction ? 0 : (data.bypass_google_sso    !== undefined ? boolToInt(data.bypass_google_sso)    : defaultSso),
      mock_gps_lat:  isProduction ? null : (mockCoords.lat || null),
      mock_gps_lng:  isProduction ? null : (mockCoords.lng || null),
      signature: data.signature || (isProduction ? 'eg_sig_production' : 'eg_sig_simulation'),
      updated_at: new Date().toISOString(),
    });
    return { success: true, config: this.getAppModeConfig() };
  },

  // ── System Error Logs ─────────────────────────────────────────────────────
  getSystemErrorLogs() {
    return stmts.getAllLogs.all().map(rowToErrorLog);
  },

  addSystemErrorLog(entry) {
    const log = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      source: safeStr(entry.source, 'Sistem'),
      level: safeStr(entry.level, 'error'),
      message: safeStr(entry.message, 'Terjadi kesalahan sistem'),
      details: safeStr(entry.details, ''),
      solution: safeStr(entry.solution, ''),
      user_agent: safeStr(entry.userAgent || entry.user_agent, ''),
    };
    stmts.insertLog.run(log);
    // Batasi 150 log terbaru
    db.prepare('DELETE FROM system_error_logs WHERE id NOT IN (SELECT id FROM system_error_logs ORDER BY timestamp DESC LIMIT 150)').run();
    return rowToErrorLog(db.prepare('SELECT * FROM system_error_logs WHERE id=?').get(log.id));
  },

  clearSystemErrorLogs() {
    stmts.clearLogs.run();
    return true;
  },

  // ── Active Broadcast (Siaran Cepat Peserta & Pengawas) ────────────────────
  getActiveBroadcast() {
    try {
      const row = stmts.getActiveBroadcast.get();
      if (!row) return { id: 'singleton', message: '', scheduled_at: null, broadcast_id: '' };
      return {
        id: row.id || 'singleton',
        message: row.message || '',
        scheduled_at: row.scheduled_at || null,
        broadcast_id: row.broadcast_id || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    } catch {
      return { id: 'singleton', message: '', scheduled_at: null, broadcast_id: '' };
    }
  },

  saveBroadcast(data) {
    const msg = String(data?.message || '').slice(0, 100).trim();
    const sched = data?.scheduled_at || null;
    const bId = data?.broadcast_id || ('bc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
    const now = new Date().toISOString();
    stmts.upsertActiveBroadcast.run({
      message: msg,
      scheduled_at: sched,
      broadcast_id: bId,
      updated_at: now,
    });
    const updated = this.getActiveBroadcast();
    broadcast('broadcast_updated', { broadcast: updated });
    return updated;
  },

  clearBroadcast() {
    stmts.clearActiveBroadcast.run();
    const empty = { id: 'singleton', message: '', scheduled_at: null, broadcast_id: '' };
    broadcast('broadcast_updated', { broadcast: empty });
    return empty;
  },

  // ── Full System Data (Backup/Restore) ─────────────────────────────────────
  getFullSystemData() {
    return {
      institution:        this.getInstitution(),
      users:              this.getUsers(),
      exam_sessions:      this.getExamSessions(),
      student_attempts:   this.getAttempts(),
      exam_attendance:    this.getAttendance(),
      berita_acara_config: this.getBeritaAcaraConfig(),
      app_mode_config:    this.getAppModeConfig(),
      system_error_logs:  this.getSystemErrorLogs(),
      exported_at:        new Date().toISOString(),
    };
  },

  restoreAllData(data) {
    const tx = db.transaction(() => {
      if (data.institution) this.updateInstitution(data.institution);
      if (data.berita_acara_config) this.saveBeritaAcaraConfig(data.berita_acara_config);
      if (data.app_mode_config) this.saveAppModeConfig(data.app_mode_config, 'admin');
      if (Array.isArray(data.users)) {
        // Bersihkan peserta lama, sisakan admin & proctor
        db.prepare("DELETE FROM users WHERE role='student'").run();
        data.users.filter(u => u.role === 'student').forEach(u => {
          try { this.addStudent(u); } catch {}
        });
        // Update admin & proctor
        data.users.filter(u => u.role !== 'student').forEach(u => {
          try { this.saveUser(u); } catch {}
        });
      }
      if (Array.isArray(data.exam_sessions)) {
        // Bersihkan sesi lama
        db.prepare('DELETE FROM exam_sessions').run();
        data.exam_sessions.forEach(e => { try { this.saveExamSession(e); } catch {} });
      }
      if (Array.isArray(data.student_attempts)) {
        db.prepare('DELETE FROM student_attempts').run();
        data.student_attempts.forEach(a => { try { this.saveAttempt(a); } catch {} });
      }
      if (Array.isArray(data.exam_attendance)) {
        db.prepare('DELETE FROM exam_attendance').run();
        data.exam_attendance.forEach(a => {
          try { this.updateAttendance(a.exam_session_id, a.student_id, a, a.updated_by); } catch {}
        });
      }
      if (Array.isArray(data.system_error_logs)) {
        stmts.clearLogs.run();
        data.system_error_logs.forEach(l => { try { this.addSystemErrorLog(l); } catch {} });
      }
    });
    tx();
    return this.getFullSystemData();
  },

  // ── Migrate dari .examguard-db.json (one-time) ────────────────────────────
  migrateFromJsonFile(jsonPath) {
    if (!fs.existsSync(jsonPath)) return { success: false, message: 'File JSON tidak ditemukan.' };
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      this.restoreAllData({
        institution:         raw.institution,
        berita_acara_config: raw.beritaAcaraConfig,
        app_mode_config:     raw.appModeConfig,
        users:               raw.users,
        exam_sessions:       raw.examSessions,
        student_attempts:    raw.attempts,
        exam_attendance:     raw.attendance,
        system_error_logs:   raw.systemErrorLogs,
      });
      return { success: true, message: 'Migrasi dari JSON berhasil.' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },
};

// ─── WebSocket Broadcast ─────────────────────────────────────────────────────
let wssRef = null;
function setWss(wss) { wssRef = wss; }

function broadcast(event, data) {
  if (!wssRef) return;
  const msg = JSON.stringify({ event, data, timestamp: Date.now() });
  wssRef.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      try { client.send(msg); } catch {}
    }
  });
}

module.exports = { db, dbApi, setWss, broadcast, generateUUID };
