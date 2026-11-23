import React, { useState, useEffect, Suspense, lazy, Component } from 'react';
import { storageService, subscribeSync } from './services/storageService';
import LoginPortal from './pages/auth/LoginPortal';
import BroadcastRibbon from './components/common/BroadcastRibbon';

// Code-splitting dengan lazy load agar HP peserta tidak perlu mengunduh 9.000+ baris AdminDashboard
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentPortal = lazy(() => import('./pages/student/StudentPortal'));

// Error Boundary anti-blank putih untuk menangani error runtime tak terduga
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ExamGuard ErrorBoundary Caught]:', error, errorInfo);
  }

  handleResetSession = () => {
    try {
      storageService.clearCurrentUser();
      window.location.href = window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-xl border border-zinc-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-zinc-900">
                Terjadi Kendala Memuat Antarmuka
              </h2>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Sistem mendeteksi kendala pada sesi aktif peramban Anda. Silakan muat ulang halaman atau reset sesi untuk masuk kembali.
              </p>
            </div>
            {this.state.error?.message && (
              <div className="text-left bg-zinc-100 p-2.5 rounded-lg border border-zinc-200 text-[11px] font-mono text-zinc-700 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                🔄 Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                🚪 Keluar &amp; Reset Sesi
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [institution, setInstitution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inisialisasi basis data awal & sesi aktif
    storageService.init();
    const inst = storageService.getInstitution();
    const user = storageService.getCurrentUser();
    setInstitution(inst);
    setCurrentUser(user);
    setIsLoading(false);

    // Jika peserta masuk, bersihkan hash sisa tab admin seperti #users
    if (user?.role === 'student' && window.location.hash) {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch {}
    }

    // Ambil snapshot penuh dari backend SQLite dan mutakhirkan institusi
    storageService.syncWithServer().then(() => {
      setInstitution(storageService.getInstitution());
    }).catch(() => {});

    // Dengar sinkronisasi real-time via WebSocket
    const unsubscribe = subscribeSync((event) => {
      if (typeof window !== 'undefined' && window.__examguard_is_editing) return;
      if (event === 'snapshot' || event === 'institution_updated') {
        setInstitution(storageService.getInstitution());
      }
    });

    // Dengar perubahan localStorage / CustomEvent lokal
    const handleStorageChange = () => {
      if (typeof window !== 'undefined' && window.__examguard_is_editing) return;
      setInstitution(storageService.getInstitution());
    };
    window.addEventListener('examguard_storage_updated', handleStorageChange);
    window.addEventListener('examguard_db_updated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('examguard_storage_updated', handleStorageChange);
      window.removeEventListener('examguard_db_updated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    // Bersihkan hash admin jika login sebagai siswa
    if (user?.role === 'student' && window.location.hash) {
      try {
        history.replaceState(null, '', window.location.pathname);
      } catch {}
    }
    // Sinkronisasi data institusi terbaru
    setInstitution(storageService.getInstitution());
  };

  const handleLogout = () => {
    // Keluar dari mode Fullscreen peramban saat logout
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen().catch(() => {});
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen().catch(() => {});
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen().catch(() => {});
        }
      }
    } catch {}

    storageService.clearCurrentUser();
    try {
      history.replaceState(null, '', window.location.pathname);
    } catch {}
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-medium text-zinc-500 font-mono">Memuat ExamGuard...</p>
        </div>
      </div>
    );
  }

  // Jika belum login, tampilkan Login Portal
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <BroadcastRibbon />
        <LoginPortal institution={institution} onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  // Loading spinner fallback saat lazy component sedang dimuat
  const pageLoadingFallback = (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-zinc-500 font-mono">Memuat antarmuka...</p>
      </div>
    </div>
  );

  // Jika login sebagai Admin atau Pengawas (Proctor)
  if (currentUser.role === 'admin' || currentUser.role === 'proctor') {
    return (
      <ErrorBoundary>
        <Suspense fallback={pageLoadingFallback}>
          <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Jika login sebagai Peserta (Student)
  return (
    <ErrorBoundary>
      <Suspense fallback={pageLoadingFallback}>
        <StudentPortal currentUser={currentUser} onLogout={handleLogout} />
      </Suspense>
    </ErrorBoundary>
  );
}
