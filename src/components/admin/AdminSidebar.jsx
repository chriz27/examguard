import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldAlert,
  UserCheck,
  Server,
  LogOut,
  ChevronRight,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Info,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  institutionName,
  institutionNpsn,
  institutionLogo,
  currentUser,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const isSuperAdmin = currentUser?.role === 'admin';

  // Daftar lengkap menu dashboard
  const allMenuItems = [
    {
      id: 'overview',
      label: 'Ringkasan & Metrik',
      icon: LayoutDashboard,
      description: 'Statistik real-time sistem',
    },
    {
      id: 'exams',
      label: 'Sesi Ujian GForm',
      icon: FileSpreadsheet,
      description: 'Bank soal & konfigurasi token',
    },
    {
      id: 'proctor',
      label: 'Kontrol Pengawas',
      icon: ShieldAlert,
      badge: 'Live',
      description: 'Pemantauan & reset siswa',
    },
    {
      id: 'reset-exam',
      label: 'Reset Status Ujian',
      icon: RotateCcw,
      badge: 'Mapel',
      description: 'Reset login & status per mapel',
    },
    {
      id: 'attendance',
      label: 'Presensi Ujian',
      icon: ClipboardCheck,
      description: 'Rekap kehadiran & status selesai',
      superAdminOnly: false,
    },
    {
      id: 'users',
      label: 'Manajemen Siswa',
      icon: Users,
      description: 'Import CSV, NISN & Perangkat',
    },
    {
      id: 'account',
      label: 'Akun Administrator',
      icon: UserCheck,
      description: 'Kredensial, Mode Demo & Diagnostik',
      superAdminOnly: true, // Hanya Super Admin yang dapat melihat/mengedit
    },
    {
      id: 'institution',
      label: 'Pengaturan Instansi',
      icon: Building2,
      description: 'Jenjang, Logo, GPS & SSO',
      superAdminOnly: true, // Hanya Super Admin yang dapat melihat/mengedit
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      icon: Database,
      description: 'Cadangkan & pulihkan data sistem',
      superAdminOnly: true, // Hanya Super Admin yang dapat mengakses backup
    },
    {
      id: 'about',
      label: 'Tentang Aplikasi',
      icon: Info,
      description: 'Versi, pengembang & lisensi',
      superAdminOnly: false, // Dapat diakses oleh Super Admin & Proktor
    },
  ];

  // Filter menu: Jika bukan Super Admin (yaitu Proktor), menu Akun Admin & Pengaturan Instansi KE-HIDE
  const menuItems = allMenuItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={`bg-white border-r border-zinc-200/80 flex flex-col justify-between h-screen shrink-0 sticky top-0 select-none transition-all duration-300 ease-in-out z-30 ${
        isCollapsed ? 'w-[72px]' : 'w-72'
      }`}
    >
      {/* Header / Brand */}
      <div className={`border-b border-zinc-100 ${isCollapsed ? 'p-3 flex flex-col items-center gap-2' : 'p-5'}`}>
        {isCollapsed ? (
          <>
            {institutionLogo ? (
              <img
                src={institutionLogo}
                alt="Logo Instansi"
                className="w-9 h-9 rounded-xl object-contain bg-white border border-zinc-200/80 p-0.5 shadow-2xs shrink-0 cursor-pointer"
                title={institutionName || 'ExamGuard'}
                onClick={onToggleCollapse}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer"
                title="ExamGuard Proctoring"
                onClick={onToggleCollapse}
              >
                <Shield className="w-4 h-4 text-zinc-100" />
              </div>
            )}
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Perlebar Sidebar Menu"
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {institutionLogo ? (
                <img
                  src={institutionLogo}
                  alt="Logo Instansi"
                  className="w-10 h-10 rounded-xl object-contain bg-white border border-zinc-200/80 p-0.5 shadow-2xs shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Shield className="w-5 h-5 text-zinc-100" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-zinc-900 tracking-tight text-base truncate">
                    ExamGuard
                  </span>
                  <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                    cPanel
                  </span>
                </div>
                <p className="text-xs text-zinc-600 font-medium truncate max-w-[140px]" title={institutionName}>
                  {institutionName || 'Sistem Proctoring GForm'}
                </p>
                {institutionNpsn && (
                  <p className="text-[10px] text-zinc-400 font-mono tracking-tight">
                    NPSN: {institutionNpsn}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollapse}
              title="Sembunyikan / Ciutkan Sidebar (Perlebar Konten)"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={`space-y-1 overflow-y-auto flex-1 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {!isCollapsed && (
          <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Menu Pengawasan
          </div>
        )}

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (isCollapsed) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-full flex items-center justify-center p-2.5 rounded-xl transition-all duration-200 relative group cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.badge && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
                {/* Floating Tooltip */}
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left cursor-pointer ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge ? (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-zinc-800 text-zinc-300' : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                  }`}
                >
                  {item.badge}
                </span>
              ) : (
                isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Logout */}
      <div className={`border-t border-zinc-100 bg-zinc-50/60 ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-4'}`}>
        {isCollapsed ? (
          <>
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 cursor-default shadow-xs ${
                isSuperAdmin ? 'bg-zinc-900 text-white' : 'bg-emerald-600 text-white'
              }`}
              title={`${currentUser?.nama || (isSuperAdmin ? 'Super Admin' : 'Proktor')} (${
                isSuperAdmin ? 'Super Admin (Akses Penuh)' : 'Proktor Ujian'
              })`}
            >
              {currentUser?.nama?.charAt(0) || (isSuperAdmin ? 'S' : 'P')}
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Keluar Sesi"
              className="p-2 rounded-xl text-zinc-500 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200/80 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                    isSuperAdmin ? 'bg-zinc-900 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentUser?.nama?.charAt(0) || (isSuperAdmin ? 'S' : 'P')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">
                    {currentUser?.nama || (isSuperAdmin ? 'Super Admin' : 'Proktor Ujian')}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isSuperAdmin
                          ? 'bg-zinc-900 text-white'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isSuperAdmin ? 'Super Admin' : 'Proktor Ujian'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono truncate">
                      @{currentUser?.username || (isSuperAdmin ? 'admin' : 'proktor')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200/80 transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sesi</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
