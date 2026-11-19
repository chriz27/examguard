import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Plugin Sinkronisasi Real-Time LAN ExamGuard
 * Memungkinkan Laptop/PC Pengawas dan HP Peserta di jaringan Wi-Fi/LAN yang sama
 * untuk saling berkomunikasi dan bertukar data status ujian (Unlock, Reset, dll) secara instan.
 */
function examGuardLanSyncPlugin() {
  const sharedState = {
    institution: null,
    appModeConfig: null,
    examSessions: null,
    attempts: [],
    attendance: [],
    events: [],
    lastUpdated: Date.now(),
  };

  const setupSyncMiddleware = (server) => {
    server.middlewares.use('/api/sync', (req, res, next) => {
      // Handle CORS Pre-flight
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(sharedState));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}');

            // 0. Sinkronisasi Institusi, Mode Aplikasi, & Sesi Ujian
            if (data.institution && typeof data.institution === 'object') {
              sharedState.institution = { ...(sharedState.institution || {}), ...data.institution };
            }
            if (data.appModeConfig && typeof data.appModeConfig === 'object') {
              sharedState.appModeConfig = { ...(sharedState.appModeConfig || {}), ...data.appModeConfig };
            }
            if (Array.isArray(data.examSessions)) {
              sharedState.examSessions = data.examSessions;
            }

            // 1. Sinkronisasi Attempt Peserta dengan proteksi integritas pelanggaran & status kunci
            if (Array.isArray(data.attempts)) {
              data.attempts.forEach((newAtt) => {
                if (!newAtt) return;
                const idx = sharedState.attempts.findIndex(
                  (a) =>
                    a.id === newAtt.id ||
                    (a.student_id === newAtt.student_id && a.exam_session_id === newAtt.exam_session_id)
                );
                if (idx >= 0) {
                  const existing = sharedState.attempts[idx];
                  const isProctorAction = Boolean(newAtt.is_proctor_action || newAtt.is_reset_violations);

                  // Pelanggaran: pertahankan nilai tertinggi kecuali tindakan reset resmi oleh pengawas
                  const mergedViolations = isProctorAction
                    ? (newAtt.violation_count ?? 0)
                    : Math.max(Number(existing.violation_count || 0), Number(newAtt.violation_count || 0));

                  // Status: jika sudah LOCKED, jangan izinkan downgrade ke IN_PROGRESS tanpa aksi pengawas
                  let mergedStatus = newAtt.status || existing.status;
                  if (existing.status === 'LOCKED' && !isProctorAction && mergedStatus !== 'COMPLETED' && mergedStatus !== 'RESET_BY_PROCTOR') {
                    mergedStatus = 'LOCKED';
                  }

                  sharedState.attempts[idx] = {
                    ...existing,
                    ...newAtt,
                    violation_count: mergedViolations,
                    status: mergedStatus,
                    unlocked_at: newAtt.unlocked_at || existing.unlocked_at,
                    last_violation_reason: newAtt.last_violation_reason || existing.last_violation_reason,
                    time_spent_seconds: Math.max(Number(existing.time_spent_seconds || 0), Number(newAtt.time_spent_seconds || 0)),
                  };
                } else {
                  sharedState.attempts.push(newAtt);
                }
              });
            }

            // 2. Sinkronisasi Presensi
            if (Array.isArray(data.attendance)) {
              sharedState.attendance = data.attendance;
            }

            // 3. Catat Event Terbaru (Buka Kunci, Reset, dsb)
            if (data.action) {
              sharedState.events.push({
                action: data.action,
                payload: data.payload || {},
                timestamp: Date.now(),
              });
              if (sharedState.events.length > 50) {
                sharedState.events = sharedState.events.slice(-50);
              }
            }

            sharedState.lastUpdated = Date.now();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, lastUpdated: sharedState.lastUpdated }));
          } catch (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
        return;
      }

      next();
    });
  };

  return {
    name: 'examguard-lan-sync',
    configureServer(server) {
      setupSyncMiddleware(server);
    },
    configurePreviewServer(server) {
      setupSyncMiddleware(server);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    react(),
    examGuardLanSyncPlugin(),
  ],
  // Di mode dev gunakan '/' agar asset & CSS tidak terpengaruh relative path di LAN.
  // Di mode build gunakan './' agar siap deploy cPanel/subfolder.
  base: command === 'build' ? './' : '/',
  build: {
    sourcemap: false, // Keamanan produksi: mencegah bocornya kode sumber asli
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    watch: {
      ignored: ['**/*.zip', '**/dist/**', '**/.git/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
  },
}));

