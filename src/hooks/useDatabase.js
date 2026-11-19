/**
 * ExamGuard Custom Hooks — SQLite Real-time Data
 * File: src/hooks/useDatabase.js
 *
 * Menyediakan hooks React untuk mengakses data dari SQLite secara real-time.
 * Komponen tidak perlu mengelola WebSocket atau cache secara manual.
 *
 * Penggunaan:
 *   const { institution, loading, error } = useInstitution();
 *   const { users, loading } = useUsers();
 *   const { attempts, loading } = useAttempts();
 *   const { examSessions } = useExamSessions();
 *   const { attendance } = useAttendance(examSessionId);
 *   const { appModeConfig } = useAppMode();
 *   const { data, loading, error } = useSnapshot(); // Ambil semua sekaligus
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '../services/dbService.js';

// ─── Generic Hook ─────────────────────────────────────────────────────────────
function useDbData(fetcher, deps = [], eventNames = []) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const isMounted             = useRef(true);

  const load = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (isMounted.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message || 'Gagal memuat data dari database.');
        setLoading(false);
      }
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  // Listen ke WS events & DOM events
  useEffect(() => {
    const handleDbUpdate = (event) => {
      const evName = event.detail?.event;
      if (!eventNames.length || eventNames.includes(evName) || evName === 'snapshot' || evName === 'system_restored') {
        load();
      }
    };

    window.addEventListener('examguard_db_updated', handleDbUpdate);
    return () => window.removeEventListener('examguard_db_updated', handleDbUpdate);
  }, [load, ...eventNames]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, reload: load };
}

// ─── Snapshot (semua data sekaligus) ─────────────────────────────────────────
export function useSnapshot() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const snap = await dbService.getSnapshot();
      if (isMounted.current) {
        setData(snap);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => { isMounted.current = false; };
  }, [load]);

  useEffect(() => {
    const handle = (e) => {
      const ev = e.detail?.event;
      if (ev === 'system_restored') load();
    };
    window.addEventListener('examguard_db_updated', handle);
    return () => window.removeEventListener('examguard_db_updated', handle);
  }, [load]);

  return { data, loading, error, reload: load };
}

// ─── Institution ──────────────────────────────────────────────────────────────
export function useInstitution() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getInstitution(),
    [],
    ['institution_updated']
  );
  return { institution: data, loading, error, reload };
}

// ─── Users ────────────────────────────────────────────────────────────────────
export function useUsers() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getUsers(),
    [],
    ['user_saved', 'user_updated', 'user_deleted', 'all_students_deleted', 'users_imported']
  );
  return { users: data || [], loading, error, reload };
}

export function useStudents() {
  const { users, loading, error, reload } = useUsers();
  return {
    students: (users || []).filter(u => u.role === 'student'),
    loading,
    error,
    reload,
  };
}

// ─── Exam Sessions ────────────────────────────────────────────────────────────
export function useExamSessions() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getExamSessions(),
    [],
    ['sessions_updated', 'session_deleted']
  );
  return { examSessions: data || [], loading, error, reload };
}

// ─── Student Attempts ─────────────────────────────────────────────────────────
export function useAttempts(examSessionId = null) {
  const { data, loading, error, reload } = useDbData(
    async () => {
      if (examSessionId) return dbService.getAttemptsBySession(examSessionId);
      return dbService.getAttempts();
    },
    [examSessionId],
    ['attempt_updated', 'attempt_unlocked', 'violations_reset', 'work_reset',
     'attempt_completed', 'attempt_removed', 'bulk_attempt_updated']
  );
  return { attempts: data || [], loading, error, reload };
}

// ─── Exam Attendance ──────────────────────────────────────────────────────────
export function useAttendance(examSessionId = null) {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getExamAttendance(examSessionId),
    [examSessionId],
    ['attendance_updated', 'attendance_removed']
  );
  return { attendance: data || [], loading, error, reload };
}

// ─── App Mode Config ──────────────────────────────────────────────────────────
export function useAppMode() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getAppModeConfig(),
    [],
    ['app_mode_updated']
  );
  return { appModeConfig: data, loading, error, reload };
}

// ─── Berita Acara Config ──────────────────────────────────────────────────────
export function useBeritaAcara() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getBeritaAcaraConfig(),
    [],
    ['berita_acara_updated']
  );
  return { beritaAcaraConfig: data, loading, error, reload };
}

// ─── System Error Logs ────────────────────────────────────────────────────────
export function useSystemErrorLogs() {
  const { data, loading, error, reload } = useDbData(
    () => dbService.getSystemErrorLogs(),
    [],
    ['error_log_added', 'logs_cleared']
  );
  return { systemErrorLogs: data || [], loading, error, reload };
}

// ─── WebSocket Status ─────────────────────────────────────────────────────────
export function useDbConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check via ping
    dbService.ping().then(ok => setIsConnected(ok));

    const handle = (e) => {
      if (e.detail?.event === 'snapshot') setIsConnected(true);
    };
    window.addEventListener('examguard_db_updated', handle);
    return () => window.removeEventListener('examguard_db_updated', handle);
  }, []);

  return { isConnected };
}

// ─── Combined Dashboard Hook ──────────────────────────────────────────────────
// Untuk AdminDashboard & halaman yang butuh banyak data sekaligus
export function useDashboardData() {
  const [state, setState] = useState({
    institution: null,
    users: [],
    examSessions: [],
    attempts: [],
    attendance: [],
    appModeConfig: null,
    beritaAcaraConfig: null,
    systemErrorLogs: [],
    loading: true,
    error: null,
  });

  const isMounted = useRef(true);

  const loadAll = useCallback(async () => {
    if (!isMounted.current) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const snap = await dbService.getSnapshot();
      if (isMounted.current) {
        setState({
          institution:       snap.institution,
          users:             snap.users || [],
          examSessions:      snap.examSessions || [],
          attempts:          snap.attempts || [],
          attendance:        snap.attendance || [],
          appModeConfig:     snap.appModeConfig,
          beritaAcaraConfig: snap.beritaAcaraConfig,
          systemErrorLogs:   snap.systemErrorLogs || [],
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      if (isMounted.current) {
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadAll();
    return () => { isMounted.current = false; };
  }, [loadAll]);

  // Reload on any DB event
  useEffect(() => {
    const handle = () => loadAll();
    window.addEventListener('examguard_db_updated', handle);
    return () => window.removeEventListener('examguard_db_updated', handle);
  }, [loadAll]);

  return { ...state, reload: loadAll };
}
