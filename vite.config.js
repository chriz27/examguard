import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createServer } from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * ExamGuard SQLite + WebSocket Real-Time Plugin
 *
 * Menyediakan:
 *  - REST API ke SQLite via /api/db/* (semua operasi CRUD)
 *  - WebSocket server (ws://<host>:5174) untuk push real-time ke semua klien
 *  - Migrasi otomatis dari .examguard-db.json ke SQLite (sekali jalan)
 */
function examGuardSQLitePlugin() {
  let dbApi, broadcast, setWss;

  let activeWss = null;

  function loadDb() {
    try {
      const dbPath = path.resolve(process.cwd(), 'server/db.cjs');
      delete require.cache[dbPath];
      const dbModule = require(dbPath);
      dbApi = dbModule.dbApi;
      broadcast = dbModule.broadcast;
      setWss = dbModule.setWss;
      if (activeWss && typeof setWss === 'function') {
        setWss(activeWss);
      }
      return true;
    } catch (err) {
      console.error('[ExamGuard DB] Gagal memuat SQLite engine:', err.message);
      console.error('[ExamGuard DB] Pastikan sudah menjalankan: npm install');
      return false;
    }
  }

  function setupWebSocketServer(httpServer) {
    let WebSocket;
    try {
      WebSocket = require('ws');
    } catch {
      console.warn('[ExamGuard WS] Package "ws" belum terinstall. npm install diperlukan.');
      return;
    }

    const WS_PORT = 5174;
    const wss = new WebSocket.Server({ port: WS_PORT });
    activeWss = wss;
    setWss(wss);

    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`[ExamGuard WS] Klien terhubung: ${clientIp} (total: ${wss.clients.size})`);

      // Kirim snapshot data terbaru saat klien baru terhubung
      try {
        const snapshot = {
          institution:        dbApi.getInstitution(),
          users:              dbApi.getUsers(),
          examSessions:       dbApi.getExamSessions(),
          attempts:           dbApi.getAttempts(),
          attendance:         dbApi.getAttendance(),
          appModeConfig:      dbApi.getAppModeConfig(),
          beritaAcaraConfig:  dbApi.getBeritaAcaraConfig(),
          systemErrorLogs:    dbApi.getSystemErrorLogs(),
        };
        ws.send(JSON.stringify({ event: 'snapshot', data: snapshot, timestamp: Date.now() }));
      } catch (e) {
        console.error('[ExamGuard WS] Gagal mengirim snapshot:', e.message);
      }

      ws.on('message', (msg) => {
        // Client bisa mengirim heartbeat
        try {
          const parsed = JSON.parse(msg);
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
          }
        } catch {}
      });

      ws.on('close', () => {
        console.log(`[ExamGuard WS] Klien terputus (remaining: ${wss.clients.size})`);
      });

      ws.on('error', (err) => {
        console.warn('[ExamGuard WS] Error klien:', err.message);
      });
    });

    wss.on('error', (err) => {
      console.error('[ExamGuard WS] Server error:', err.message);
    });

    console.log(`[ExamGuard WS] WebSocket server aktif di port ${WS_PORT}`);
  }

  /**
   * Parse body request JSON secara async
   */
  function parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }

  /**
   * Kirim response JSON
   */
  function sendJson(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Role');
    res.end(JSON.stringify(data));
  }

  /**
   * Router utama API
   * Semua endpoint: /api/db/<resource>
   */
  async function handleApiRequest(req, res) {
    // CORS pre-flight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Role');
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!req) return;
    const rawUrl = req.url || '';
    const url = rawUrl.split('?')[0];
    const method = req.method || 'GET';
    const headers = req.headers || {};
    const callerRole = (req.headers && req.headers['x-user-role']) || (headers && headers['x-user-role']) || null;

    try {
      let body = {};
      if (method === 'POST' || method === 'PUT') {
        body = await parseBody(req);
      }

      // ── /api/db/snapshot ─ Full state snapshot ──────────────────────────
      if (url === '/api/db/snapshot' && method === 'GET') {
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

      // ── /api/db/institution ──────────────────────────────────────────────
      if (url === '/api/db/institution') {
        if (method === 'GET') {
          return sendJson(res, 200, dbApi.getInstitution());
        }
        if (method === 'POST' || method === 'PUT') {
          const updated = dbApi.updateInstitution(body);
          broadcast('institution_updated', { institution: updated });
          return sendJson(res, 200, updated);
        }
      }

      // ── /api/db/users ────────────────────────────────────────────────────
      if (url === '/api/db/users' && method === 'GET') {
        return sendJson(res, 200, dbApi.getUsers());
      }
      if (url === '/api/db/users' && method === 'POST') {
        // Tambah user baru
        const result = body.role === 'student' ? dbApi.addStudent(body) : (() => {
          dbApi.saveUser(body);
          return { success: true, user: dbApi.getUserById(body.id) };
        })();
        if (result.success) {
          broadcast('user_saved', { user: result.user });
        }
        return sendJson(res, result.success ? 200 : 400, result);
      }

      // ── /api/db/users/by-email/:email ────────────────────────────
      const emailMatch = url.match(/^\/api\/db\/users\/by-email\/(.+)$/);
      if (emailMatch && method === 'GET') {
        const email = decodeURIComponent(emailMatch[1]).trim().toLowerCase();
        const user = dbApi.getUserByEmail(email);
        if (!user) return sendJson(res, 404, { error: 'Peserta dengan email tersebut tidak ditemukan di database.' });
        return sendJson(res, 200, user);
      }

      // /api/db/users/:id
      const userMatch = url.match(/^\/api\/db\/users\/([^/]+)(\/.*)?$/);
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
            if (r.success) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          if (sub === '/toggle-verified') {
            const r = dbApi.toggleUserVerified(userId);
            if (r.success) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          if (sub === '/reset-device') {
            const user = dbApi.resetUserDevice(userId);
            broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-password') {
            const user = dbApi.resetStudentPassword(userId);
            broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-sso') {
            const user = dbApi.resetStudentSSO(userId);
            broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/reset-token') {
            const user = dbApi.resetStudentLoginToken(userId);
            broadcast('user_updated', { user });
            return sendJson(res, 200, { success: true, user });
          }
          if (sub === '/update-admin') {
            const r = dbApi.updateAdminProfile(userId, body);
            if (r.success) broadcast('user_updated', { user: r.user });
            return sendJson(res, r.success ? 200 : 400, r);
          }
          // Update student data
          const r = dbApi.updateStudent(userId, body);
          if (r.success) broadcast('user_updated', { user: r.user });
          return sendJson(res, r.success ? 200 : 400, r);
        }

        if (method === 'DELETE') {
          dbApi.deleteUser(userId);
          broadcast('user_deleted', { deletedId: userId });
          return sendJson(res, 200, { success: true });
        }
      }

      // /api/db/users/delete-all-students
      if (url === '/api/db/users/delete-all-students' && method === 'DELETE') {
        dbApi.deleteAllStudents();
        broadcast('all_students_deleted', {});
        return sendJson(res, 200, { success: true });
      }

      // /api/db/users/import
      if (url === '/api/db/users/import' && method === 'POST') {
        if (body.validate_only) {
          return sendJson(res, 200, dbApi.validateImportStudents(body.students || []));
        }
        const added = dbApi.bulkImportStudents(body.students || []);
        broadcast('users_imported', { count: added.length });
        return sendJson(res, 200, { success: true, count: added.length, users: added });
      }

      // ── /api/db/exam-sessions ────────────────────────────────────────────
      if (url === '/api/db/exam-sessions' && method === 'GET') {
        return sendJson(res, 200, dbApi.getExamSessions());
      }
      if (url === '/api/db/exam-sessions' && method === 'POST') {
        const exam = dbApi.saveExamSession(body);
        broadcast('sessions_updated', { exam });
        return sendJson(res, 200, { success: true, exam });
      }

      const examMatch = url.match(/^\/api\/db\/exam-sessions\/([^/]+)(\/.*)?$/);
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
            broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          if (sub === '/restore') {
            const exam = dbApi.restoreExamFromArchive(examId);
            broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          if (sub === '/toggle-active') {
            const exam = dbApi.toggleExamActive(examId);
            broadcast('sessions_updated', { exam });
            return sendJson(res, 200, { success: true, exam });
          }
          const exam = dbApi.saveExamSession({ id: examId, ...body });
          broadcast('sessions_updated', { exam });
          return sendJson(res, 200, { success: true, exam });
        }
        if (method === 'DELETE') {
          // CASCADE DELETE di SQLite otomatis hapus attempts & attendance
          dbApi.deleteExamSession(examId);
          broadcast('session_deleted', { deletedId: examId });
          return sendJson(res, 200, { success: true });
        }
      }

      // ── /api/db/attempts ─────────────────────────────────────────────────
      if (url === '/api/db/attempts' && method === 'GET') {
        return sendJson(res, 200, dbApi.getAttempts());
      }
      if (url === '/api/db/attempts' && method === 'POST') {
        const attempt = dbApi.saveAttempt(body);
        if (attempt) {
          broadcast('attempt_updated', { attempt });
        }
        return sendJson(res, attempt ? 200 : 400, attempt || { error: 'Gagal menyimpan attempt.' });
      }

      const attemptMatch = url.match(/^\/api\/db\/attempts\/([^/]+)\/([^/]+)(\/.*)?$/);
      if (attemptMatch) {
        const studentId  = decodeURIComponent(attemptMatch[1]);
        const examId     = decodeURIComponent(attemptMatch[2]);
        const sub        = attemptMatch[3] || '';

        if (method === 'GET') {
          return sendJson(res, 200, dbApi.getAttempt(studentId, examId));
        }
        if (method === 'PUT') {
          if (sub === '/unlock') {
            const a = dbApi.proctorUnlockAttempt(studentId, examId);
            broadcast('attempt_unlocked', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/reset-violations') {
            const a = dbApi.proctorResetViolations(studentId, examId);
            broadcast('violations_reset', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/reset-work') {
            const a = dbApi.proctorResetStudentWork(studentId, examId, body.examTitle);
            broadcast('work_reset', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/complete') {
            const a = dbApi.proctorSetAttemptCompleted(studentId, examId, body.examTitle);
            broadcast('attempt_completed', { attempt: a });
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/update-time') {
            const a = dbApi.updateAttemptTime(studentId, examId, body.timeSpentSeconds);
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/ping') {
            const a = dbApi.updateAttemptPing(body.attemptId, body.latencyMs);
            return sendJson(res, 200, { success: true, attempt: a });
          }
          if (sub === '/heartbeat') {
            const a = dbApi.updateAttemptHeartbeat(studentId, examId, body.timeSpentSeconds, body.latencyMs);
            return sendJson(res, 200, { success: true, attempt: a });
          }
        }
        if (method === 'DELETE') {
          dbApi.proctorSetAttemptNotStarted(studentId, examId);
          broadcast('attempt_removed', { studentId, examSessionId: examId });
          return sendJson(res, 200, { success: true });
        }
      }

      // Bulk proctor actions
      if (url === '/api/db/attempts/bulk' && method === 'POST') {
        const { action, studentIds, examSessionId, examTitle } = body;
        let count = 0;
        if (action === 'reset')       count = dbApi.proctorBulkReset(studentIds, examSessionId, examTitle);
        if (action === 'complete')    count = dbApi.proctorBulkComplete(studentIds, examSessionId, examTitle);
        if (action === 'not-started') count = dbApi.proctorBulkNotStarted(studentIds, examSessionId);
        broadcast('bulk_attempt_updated', { action, examSessionId, count });
        return sendJson(res, 200, { success: true, count });
      }

      // ── /api/db/attendance ───────────────────────────────────────────────
      if (url === '/api/db/attendance' && method === 'GET') {
        const params = new URL(req.url, 'http://localhost').searchParams;
        const sessionId = params.get('exam_session_id');
        return sendJson(res, 200, dbApi.getAttendance(sessionId || null));
      }
      if (url === '/api/db/attendance' && method === 'POST') {
        const rec = dbApi.updateAttendance(body.exam_session_id, body.student_id, body, body.updated_by);
        broadcast('attendance_updated', { record: rec });
        return sendJson(res, 200, { success: true, record: rec });
      }

      const attMatch = url.match(/^\/api\/db\/attendance\/([^/]+)\/([^/]+)$/);
      if (attMatch) {
        const examId   = decodeURIComponent(attMatch[1]);
        const studentId = decodeURIComponent(attMatch[2]);
        if (method === 'DELETE') {
          dbApi.removeAttendance(examId, studentId);
          broadcast('attendance_removed', { examSessionId: examId, studentId });
          return sendJson(res, 200, { success: true });
        }
      }

      // ── /api/db/berita-acara ─────────────────────────────────────────────
      if (url === '/api/db/berita-acara') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getBeritaAcaraConfig());
        if (method === 'POST' || method === 'PUT') {
          const updated = dbApi.saveBeritaAcaraConfig(body);
          broadcast('berita_acara_updated', { config: updated });
          return sendJson(res, 200, updated);
        }
      }

      // ── /api/db/app-mode ─────────────────────────────────────────────────
      if (url === '/api/db/app-mode') {
        if (method === 'GET') return sendJson(res, 200, dbApi.getAppModeConfig());
        if (method === 'POST' || method === 'PUT') {
          const r = dbApi.saveAppModeConfig(body, callerRole);
          if (r.success) broadcast('app_mode_updated', { config: r.config });
          return sendJson(res, r.success ? 200 : 403, r);
        }
      }

      // ── /api/db/logs ─────────────────────────────────────────────────────
      if (url === '/api/db/logs') {
        if (method === 'GET')  return sendJson(res, 200, dbApi.getSystemErrorLogs());
        if (method === 'POST') {
          const log = dbApi.addSystemErrorLog(body);
          return sendJson(res, 200, { success: true, log });
        }
        if (method === 'DELETE') {
          dbApi.clearSystemErrorLogs();
          broadcast('logs_cleared', {});
          return sendJson(res, 200, { success: true });
        }
      }

      // ── /api/db/backup ───────────────────────────────────────────────────
      if (url === '/api/db/backup' && method === 'GET') {
        return sendJson(res, 200, dbApi.getFullSystemData());
      }

      // ── /api/db/restore ──────────────────────────────────────────────────
      if (url === '/api/db/restore' && method === 'POST') {
        if (callerRole !== 'admin') return sendJson(res, 403, { error: 'Hanya Super Admin yang dapat memulihkan data.' });
        const result = dbApi.restoreAllData(body);
        broadcast('system_restored', { timestamp: Date.now() });
        return sendJson(res, 200, { success: true, data: result });
      }

      // ── /api/db/migrate-json ─────────────────────────────────────────────
      if (url === '/api/db/migrate-json' && method === 'POST') {
        const jsonPath = path.resolve(process.cwd(), '.examguard-db.json');
        const result = dbApi.migrateFromJsonFile(jsonPath);
        if (result.success) broadcast('system_restored', { timestamp: Date.now() });
        return sendJson(res, result.success ? 200 : 400, result);
      }

      // 404 fallback
      sendJson(res, 404, { error: `Endpoint tidak ditemukan: ${method} ${url}` });

    } catch (err) {
      console.error('[ExamGuard API] Error:', err);
      sendJson(res, 500, { error: err.message });
    }
  }

  return {
    name: 'examguard-sqlite',

    configureServer(server) {
      const dbLoaded = loadDb();

      if (!dbLoaded) {
        console.warn('[ExamGuard DB] SQLite tidak aktif. Jalankan npm install terlebih dahulu.');
        return;
      }

      // Migrasi otomatis dari .examguard-db.json (sekali jalan)
      const jsonFile = path.resolve(process.cwd(), '.examguard-db.json');
      const migrationFlag = path.resolve(process.cwd(), '.examguard-migrated');
      if (fs.existsSync(jsonFile) && !fs.existsSync(migrationFlag)) {
        console.log('[ExamGuard DB] Memulai migrasi otomatis dari .examguard-db.json...');
        const result = dbApi.migrateFromJsonFile(jsonFile);
        if (result.success) {
          fs.writeFileSync(migrationFlag, new Date().toISOString());
          console.log('[ExamGuard DB] Migrasi selesai! Data tersimpan di examguard.db');
        } else {
          console.error('[ExamGuard DB] Migrasi gagal:', result.message);
        }
      }

      // Pasang middleware REST API di Vite dev server
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/db')) {
          handleApiRequest(req, res).catch(err => {
            console.error('[ExamGuard API] Unhandled:', err);
            sendJson(res, 500, { error: err.message });
          });
          return;
        }
        next();
      });

      // Setup WebSocket server setelah HTTP server Vite siap
      server.httpServer?.once('listening', () => {
        setupWebSocketServer(server.httpServer);
      });

      console.log('[ExamGuard DB] SQLite engine aktif. API: /api/db/*');
    },

    configurePreviewServer(server) {
      const dbLoaded = loadDb();
      if (!dbLoaded) return;

      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/db')) {
          handleApiRequest(req, res).catch(err => {
            console.error('[ExamGuard API] Unhandled:', err);
            sendJson(res, 500, { error: err.message });
          });
          return;
        }
        next();
      });

      server.httpServer?.once('listening', () => {
        setupWebSocketServer(server.httpServer);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    examGuardSQLitePlugin(),
  ],
  base: command === 'build' ? './' : '/',
  build: {
    sourcemap: false,
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      clientPort: 5173,
    },
    watch: {
      ignored: ['**/*.zip', '**/dist/**', '**/.git/**', '**/examguard.db*', '**/.examguard-db.json*'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    allowedHosts: true,
  },
}));

// reload trigger
