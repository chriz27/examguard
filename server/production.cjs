/**
 * ExamGuard Enterprise Production Server (Node.js)
 * File: server/production.cjs
 * 
 * Tim Pengembang : Fandi dari Jawa tech
 * Versi          : 1.0 (Production Release)
 * 
 * Melayani:
 *   1. REST API /api/db/* (terhubung langsung ke SQLite via server/db.cjs)
 *   2. Static File Server untuk hasil build frontend (dist/)
 *   3. SPA Client-Side Routing Fallback (index.html)
 *   4. WebSocket Server real-time (ws://)
 * 
 * Kompatibel dengan: cPanel "Setup Node.js App", Phusion Passenger, PM2, Docker, VPS.
 */

'use strict';

const http = require('node:http');
const fs   = require('node:fs');
const path = require('node:path');
const url  = require('node:url');

const PORT     = parseInt(process.env.PORT || process.env.APP_PORT || '5173', 10);
const WS_PORT  = parseInt(process.env.WS_PORT || '5174', 10);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// 1. Muat SQLite Engine
let dbApi, broadcast, setWss;
try {
  const dbModule = require('./db.cjs');
  dbApi     = dbModule.dbApi;
  broadcast = dbModule.broadcast;
  setWss    = dbModule.setWss;
  console.log('[ExamGuard Production] SQLite Database Engine aktif & siap.');
} catch (err) {
  console.error('[ExamGuard Production] FATAL: Gagal memuat SQLite Engine:', err);
  process.exit(1);
}

// 2. Setup WebSocket Server
let wss = null;
try {
  const WebSocket = require('ws');
  wss = new WebSocket.Server({ port: WS_PORT });
  if (typeof setWss === 'function') {
    setWss(wss);
  }

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    // Kirim initial snapshot
    try {
      const snap = {
        institution:       dbApi.getInstitution(),
        users:             dbApi.getUsers(),
        examSessions:      dbApi.getExamSessions(),
        attempts:          dbApi.getAttempts(),
        attendance:        dbApi.getAttendance(),
        appModeConfig:     dbApi.getAppModeConfig(),
        beritaAcaraConfig: dbApi.getBeritaAcaraConfig(),
        systemErrorLogs:   dbApi.getSystemErrorLogs(),
      };
      ws.send(JSON.stringify({ event: 'snapshot', data: snap, timestamp: Date.now() }));
    } catch (e) {
      console.warn('[ExamGuard WS] Gagal kirim snapshot ke klien baru:', e.message);
    }

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
        }
      } catch {}
    });
  });

  console.log(`[ExamGuard WS] WebSocket aktif di port ${WS_PORT}`);
} catch (e) {
  console.warn('[ExamGuard WS] Modul "ws" tidak tersedia atau port terpakai. Mode HTTP Polling otomatis aktif.');
}

// 3. MIME Types Registry
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js':   'application/javascript; charset=UTF-8',
  '.mjs':  'application/javascript; charset=UTF-8',
  '.css':  'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.eot':  'application/vnd.ms-fontobject',
  '.otf':  'font/otf',
  '.wasm': 'application/wasm',
  '.pdf':  'application/pdf',
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, statusCode, data) {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Role, Authorization',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(jsonStr);
}

// 4. HTTP Request Handler
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-User-Role, Authorization',
    });
    return res.end();
  }

  // ── REST API Handler (/api/db/*) ──────────────────────────────────────────
  if (pathname.startsWith('/api/db')) {
    const callerRole = req.headers['x-user-role'] || null;
    let body = {};
    if (method === 'POST' || method === 'PUT') {
      body = await parseBody(req);
    }

    try {
      // Snapshot
      if (pathname === '/api/db/snapshot' && method === 'GET') {
        return sendJson(res, 200, {
          institution:       dbApi.getInstitution(),
          users:             dbApi.getUsers(),
          examSessions:      dbApi.getExamSessions(),
          attempts:          dbApi.getAttempts(),
          attendance:        dbApi.getAttendance(),
          appModeConfig:     dbApi.getAppModeConfig(),
          beritaAcaraConfig: dbApi.getBeritaAcaraConfig(),
          systemErrorLogs:   dbApi.getSystemErrorLogs(),
        });
      }

      // Institution
      if (pathname === '/api/db/institution') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getInstitution());
        if (method === 'POST' || method === 'PUT') {
          const updated = dbApi.updateInstitution(body);
          if (broadcast) broadcast('institution_updated', { institution: updated });
          return sendJson(res, 200, updated);
        }
      }

      // Users
      if (pathname === '/api/db/users' && method === 'GET') {
        return sendJson(res, 200, dbApi.getUsers());
      }
      if (pathname === '/api/db/users' && method === 'POST') {
        const result = body.role === 'student' ? dbApi.addStudent(body) : (() => {
          dbApi.saveUser(body);
          return { success: true, user: dbApi.getUserById(body.id) };
        })();
        if (result.success && broadcast) broadcast('user_saved', { user: result.user });
        return sendJson(res, result.success ? 200 : 400, result);
      }
      if (pathname === '/api/db/users/delete-all-students' && method === 'DELETE') {
        dbApi.deleteAllStudents();
        if (broadcast) broadcast('all_students_deleted', {});
        return sendJson(res, 200, { success: true });
      }
      if (pathname === '/api/db/users/import' && method === 'POST') {
        if (body.validate_only) {
          return sendJson(res, 200, dbApi.validateImportStudents(body.students || []));
        }
        const added = dbApi.bulkImportStudents(body.students || []);
        if (broadcast) broadcast('users_imported', { count: added.length });
        return sendJson(res, 200, { success: true, count: added.length, users: added });
      }

      const emailMatch = pathname.match(/^\/api\/db\/users\/by-email\/(.+)$/);
      if (emailMatch && method === 'GET') {
        const email = decodeURIComponent(emailMatch[1]).trim().toLowerCase();
        const user = dbApi.getUserByEmail(email);
        if (!user) return sendJson(res, 404, { error: 'Peserta dengan email tersebut tidak ditemukan di database.' });
        return sendJson(res, 200, user);
      }

      const userMatch = pathname.match(/^\/api\/db\/users\/([^/]+)(\/.*)?$/);
      if (userMatch) {
        const userId = decodeURIComponent(userMatch[1]);
        const sub = userMatch[2] || '';
        if (method === 'GET') {
          const user = dbApi.getUserById(userId);
          if (!user) return sendJson(res, 404, { error: 'User tidak ditemukan.' });
          return sendJson(res, 200, user);
        }
        if (method === 'PUT') {
          if (sub === '/toggle-active') {
            const r = dbApi.toggleUserActive(userId);
            if (r.success && broadcast) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          if (sub === '/toggle-verified') {
            const r = dbApi.toggleUserVerified(userId);
            if (r.success && broadcast) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          if (sub === '/reset-device') {
            const user = dbApi.resetUserDevice(userId);
            if (broadcast) broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-password') {
            const user = dbApi.resetStudentPassword(userId);
            if (broadcast) broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-sso') {
            const user = dbApi.resetStudentSSO(userId);
            if (broadcast) broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-token') {
            const user = dbApi.resetStudentLoginToken(userId);
            if (broadcast) broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/update-admin') {
            const r = dbApi.updateAdminProfile(userId, body);
            if (r.success && broadcast) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          const r = dbApi.updateStudent(userId, body);
          if (r.success && broadcast) broadcast('user_updated', { user: r.user });
          return sendJson(res, r.success ? 200 : 400, r);
        }
        if (method === 'DELETE') {
          dbApi.deleteUser(userId);
          if (broadcast) broadcast('user_deleted', { deletedId: userId });
          return sendJson(res, 200, { success: true });
        }
      }

      // Exam Sessions
      if (pathname === '/api/db/exam-sessions' && method === 'GET') {
        return sendJson(res, 200, dbApi.getExamSessions());
      }
      if (pathname === '/api/db/exam-sessions' && method === 'POST') {
        const exam = dbApi.saveExamSession(body);
        if (broadcast) broadcast('sessions_updated', { exam });
        return sendJson(res, 200, { success: true, exam });
      }

      const examMatch = pathname.match(/^\/api\/db\/exam-sessions\/([^/]+)(\/.*)?$/);
      if (examMatch) {
        const examId = decodeURIComponent(examMatch[1]);
        const sub = examMatch[2] || '';
        if (method === 'GET') {
          const exam = dbApi.getExamSessionById(examId);
          if (!exam) return sendJson(res, 404, { error: 'Sesi ujian tidak ditemukan.' });
          return sendJson(res, 200, exam);
        }
        if (method === 'PUT') {
          if (sub === '/archive') {
            const exam = dbApi.archiveExamSession(examId);
            if (broadcast) broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          if (sub === '/restore') {
            const exam = dbApi.restoreExamFromArchive(examId);
            if (broadcast) broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          if (sub === '/toggle-active') {
            const exam = dbApi.toggleExamActive(examId);
            if (broadcast) broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          const exam = dbApi.saveExamSession({ id: examId, ...body });
          if (broadcast) broadcast('sessions_updated', { exam });
          return sendJson(res, 200, { success: true, exam });
        }
        if (method === 'DELETE') {
          dbApi.deleteExamSession(examId);
          if (broadcast) broadcast('session_deleted', { deletedId: examId });
          return sendJson(res, 200, { success: true });
        }
      }

      // Attempts
      if (pathname === '/api/db/attempts' && method === 'GET') {
        return sendJson(res, 200, dbApi.getAttempts());
      }
      if (pathname === '/api/db/attempts' && method === 'POST') {
        const attempt = dbApi.saveAttempt(body);
        if (attempt && broadcast) broadcast('attempt_updated', { attempt });
        return sendJson(res, attempt ? 200 : 400, attempt || { error: 'Gagal menyimpan attempt.' });
      }
      if (pathname === '/api/db/attempts/bulk' && method === 'POST') {
        const { action, studentIds, examSessionId, examTitle } = body;
        let count = 0;
        if (action === 'reset')       count = dbApi.proctorBulkReset(studentIds, examSessionId, examTitle);
        if (action === 'complete')    count = dbApi.proctorBulkComplete(studentIds, examSessionId, examTitle);
        if (action === 'not-started') count = dbApi.proctorBulkNotStarted(studentIds, examSessionId);
        if (broadcast) broadcast('bulk_attempt_updated', { action, examSessionId, count });
        return sendJson(res, 200, { success: true, count });
      }

      const attemptMatch = pathname.match(/^\/api\/db\/attempts\/([^/]+)\/([^/]+)(\/.*)?$/);
      if (attemptMatch) {
        const studentId = decodeURIComponent(attemptMatch[1]);
        const examId    = decodeURIComponent(attemptMatch[2]);
        const sub       = attemptMatch[3] || '';
        if (method === 'GET') {
          return sendJson(res, 200, dbApi.getAttempt(studentId, examId));
        }
        if (method === 'PUT') {
          if (sub === '/unlock') {
            const a = dbApi.proctorUnlockAttempt(studentId, examId);
            if (broadcast) broadcast('attempt_unlocked', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/reset-violations') {
            const a = dbApi.proctorResetViolations(studentId, examId);
            if (broadcast) broadcast('violations_reset', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/reset-work') {
            const a = dbApi.proctorResetStudentWork(studentId, examId, body.examTitle);
            if (broadcast) broadcast('work_reset', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/complete') {
            const a = dbApi.proctorSetAttemptCompleted(studentId, examId, body.examTitle);
            if (broadcast) broadcast('attempt_completed', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/update-time') {
            const a = dbApi.updateAttemptTime(studentId, examId, body.timeSpentSeconds);
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/heartbeat') {
            const a = dbApi.updateAttemptHeartbeat(studentId, examId, body.timeSpentSeconds, body.latencyMs);
            return sendJson(res, 200, { success: true, attempt: a });
          }
        }
        if (method === 'DELETE') {
          dbApi.proctorSetAttemptNotStarted(studentId, examId);
          if (broadcast) broadcast('attempt_removed', { studentId, examSessionId: examId });
          return sendJson(res, 200, { success: true });
        }
      }

      // Attendance
      if (pathname === '/api/db/attendance' && method === 'GET') {
        const sessionId = parsedUrl.query.exam_session_id;
        return sendJson(res, 200, dbApi.getAttendance(sessionId || null));
      }
      if (pathname === '/api/db/attendance' && method === 'POST') {
        const rec = dbApi.updateAttendance(body.exam_session_id, body.student_id, body, body.updated_by);
        if (broadcast) broadcast('attendance_updated', { record: rec });
        return sendJson(res, 200, { success: true, record: rec });
      }

      // Berita Acara & App Mode
      if (pathname === '/api/db/berita-acara') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getBeritaAcaraConfig());
        if (method === 'POST' || method === 'PUT') {
          const updated = dbApi.saveBeritaAcaraConfig(body);
          if (broadcast) broadcast('berita_acara_updated', { config: updated });
          return sendJson(res, 200, updated);
        }
      }

      if (pathname === '/api/db/app-mode') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getAppModeConfig());
        if (method === 'POST' || method === 'PUT') {
          const r = dbApi.saveAppModeConfig(body, callerRole);
          if (r.success && broadcast) broadcast('app_mode_updated', { config: r.config });
          return sendJson(res, r.success ? 200 : 403, r);
        }
      }

      // Logs & Backup
      if (pathname === '/api/db/logs') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getSystemErrorLogs());
        if (method === 'POST') {
          const log = dbApi.addSystemErrorLog(body);
          return sendJson(res, 200, { success: true, log });
        }
        if (method === 'DELETE') {
          dbApi.clearSystemErrorLogs();
          if (broadcast) broadcast('logs_cleared', {});
          return sendJson(res, 200, { success: true });
        }
      }

      if (pathname === '/api/db/backup' && method === 'GET') {
        return sendJson(res, 200, dbApi.getFullSystemData());
      }

      if (pathname === '/api/db/restore' && method === 'POST') {
        if (callerRole !== 'admin') return sendJson(res, 403, { error: 'Hanya Super Admin yang diizinkan.' });
        const result = dbApi.restoreAllData(body);
        if (broadcast) broadcast('system_restored', { timestamp: Date.now() });
        return sendJson(res, 200, { success: true, data: result });
      }

      return sendJson(res, 404, { error: `Endpoint tidak ditemukan: ${method} ${pathname}` });
    } catch (apiErr) {
      console.error('[ExamGuard API Error]', apiErr);
      return sendJson(res, 500, { error: apiErr.message });
    }
  }

  // ── Static Files & SPA Fallback ───────────────────────────────────────────
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\])+/, '');
  let filePath = path.join(DIST_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    // Jika file tidak ada atau folder, fallback ke dist/index.html (SPA Routing)
    if (err || stats.isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Cache-Control headers
    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'geolocation=(self), camera=(self), microphone=(self), fullscreen=(self), clipboard-read=(self), clipboard-write=(self)',
    };

    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else if (['.js', '.css', '.woff2', '.png', '.jpg', '.svg'].includes(ext)) {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('File not found');
        return;
      }
      res.writeHead(200, headers);
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('  ExamGuard Enterprise v1.0 - Production Server');
  console.log('  Pengembang: Fandi dari Jawa tech');
  console.log(`  Server aktif di : http://localhost:${PORT}`);
  console.log(`  Database        : SQLite (examguard.db)`);
  console.log(`  WebSocket       : ws://localhost:${WS_PORT}`);
  console.log('================================================================');
});
