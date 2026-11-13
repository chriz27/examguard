import React, { useState, useEffect } from 'react';
import { storageService } from './services/storageService';
import LoginPortal from './pages/auth/LoginPortal';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentPortal from './pages/student/StudentPortal';

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

  // Jika login sebagai Admin atau Pengawas (Proctor)
  if (currentUser.role === 'admin' || currentUser.role === 'proctor') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Jika login sebagai Siswa (Student)
  return <StudentPortal currentUser={currentUser} onLogout={handleLogout} />;
}

