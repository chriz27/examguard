import React, { useState, useEffect, Suspense, lazy } from 'react';
import { storageService, subscribeSync } from './services/storageService';
import LoginPortal from './pages/auth/LoginPortal';

// Code-splitting dengan lazy load agar HP peserta tidak perlu mengunduh 9.000+ baris AdminDashboard
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const StudentPortal = lazy(() => import('./pages/student/StudentPortal'));

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

    // Ambil snapshot penuh dari backend SQLite dan mutakhirkan institusi
    storageService.syncWithServer().then(() => {
      setInstitution(storageService.getInstitution());
    }).catch(() => {});

    // Dengar sinkronisasi real-time via WebSocket
    const unsubscribe = subscribeSync((event) => {
      if (event === 'snapshot' || event === 'institution_updated') {
        setInstitution(storageService.getInstitution());
      }
    });

    // Dengar perubahan localStorage / CustomEvent lokal
    const handleStorageChange = () => {
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
    // Sinkronisasi data institusi terbaru
    setInstitution(storageService.getInstitution());
  };

  const handleLogout = () => {
    storageService.clearCurrentUser();
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
    return <LoginPortal institution={institution} onLoginSuccess={handleLoginSuccess} />;
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
      <Suspense fallback={pageLoadingFallback}>
        <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
      </Suspense>
    );
  }

  // Jika login sebagai Peserta (Student)
  return (
    <Suspense fallback={pageLoadingFallback}>
      <StudentPortal currentUser={currentUser} onLogout={handleLogout} />
    </Suspense>
  );
}

