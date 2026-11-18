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
    attempts: [],
    attendance: [],
    events: [],
    lastUpdated: Date.now(),
  };

  return {
    name: 'examguard-lan-sync',
    configureServer(server) {
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

              // 1. Sinkronisasi Attempt Peserta
              if (Array.isArray(data.attempts)) {
                data.attempts.forEach((newAtt) => {
                  if (!newAtt) return;
                  const idx = sharedState.attempts.findIndex(
                    (a) =>
                      a.id === newAtt.id ||
                      (a.student_id === newAtt.student_id && a.exam_session_id === newAtt.exam_session_id)
                  );
                  if (idx >= 0) {
                    sharedState.attempts[idx] = { ...sharedState.attempts[idx], ...newAtt };
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
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    examGuardLanSyncPlugin(),
  ],
  base: './', // WAJIB untuk cPanel: bekerja di root public_html, subdomain, maupun subfolder
  build: {
    sourcemap: false, // Keamanan produksi: mencegah bocornya kode sumber asli
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      ignored: ['**/*.zip', '**/dist/**', '**/.git/**'],
    },
  },
});

