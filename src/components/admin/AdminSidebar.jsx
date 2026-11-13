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
} from 'lucide-react';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  institutionName,
  institutionLogo,
  currentUser,
  onLogout,
  onOpenCpanelGuide,
}) {
  const menuItems = [
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
      id: 'users',
      label: 'Manajemen Siswa',
      icon: Users,
      description: 'Import CSV, NISN & Perangkat',
    },
    {
      id: 'account',
      label: 'Akun Administrator',
      icon: UserCheck,
      description: 'Kredensial login admin',
    },
    {
      id: 'institution',
      label: 'Pengaturan Instansi',
      icon: Building2,
      description: 'Jenjang, Logo, GPS & SSO',
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-zinc-200/80 flex flex-col justify-between h-screen shrink-0 sticky top-0 select-none">
      {/* Header / Brand */}
      <div className="p-5 border-b border-zinc-100">
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-zinc-500 truncate max-w-[170px]" title={institutionName}>
              {institutionName || 'Sistem Proctoring GForm'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-3 space-y-1 overflow-y-auto flex-1">
        <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Menu Pengawasan
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
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

        {/* Tombol Panduan cPanel */}
        <div className="pt-3">
          <button
            onClick={onOpenCpanelGuide}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 transition-all duration-200"
          >
            <Server className="w-4 h-4 shrink-0 text-blue-600" />
            <span className="text-left flex-1 truncate">Panduan Deploy cPanel</span>
            <span className="text-[10px] font-mono bg-blue-200/70 text-blue-800 px-1.5 py-0.5 rounded">.zip</span>
          </button>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700 shrink-0">
              {currentUser?.nama?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">{currentUser?.nama || 'Administrator'}</p>
              <p className="text-[11px] text-zinc-500 truncate capitalize">{currentUser?.role || 'admin'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200/80 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
