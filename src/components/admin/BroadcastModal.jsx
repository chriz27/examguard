import React, { useState, useEffect } from 'react';
import { Megaphone, X, Send, Clock, Calendar, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function BroadcastModal({ isOpen, onClose, onNotification }) {
  const [message, setMessage] = useState('');
  const [scheduleMode, setScheduleMode] = useState('now'); // 'now' | 'schedule'
  const [scheduleTime, setScheduleTime] = useState('');
  const [lastBroadcast, setLastBroadcast] = useState({ text: '', time: '' });
  const [currentActiveBroadcast, setCurrentActiveBroadcast] = useState(null);

  // Muat data terakhir saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const lastInfo = storageService.getLastBroadcastInfo();
      setLastBroadcast(lastInfo);

      const active = storageService.getActiveBroadcast();
      setCurrentActiveBroadcast(active?.message ? active : null);

      if (active?.message) {
        setMessage(active.message);
        if (active.scheduled_at) {
          setScheduleMode('schedule');
          setScheduleTime(active.scheduled_at);
        } else {
          setScheduleMode('now');
        }
      } else {
        setMessage('');
        setScheduleMode('now');
        // Default waktu jadwal: 10 menit dari sekarang
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10);
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        setScheduleTime(`${h}:${m}`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const charCount = message.length;

  const handleSendNow = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      if (onNotification) onNotification('Silakan tuliskan teks pengumuman siaran terlebih dahulu.', 'error');
      return;
    }
    try {
      await storageService.saveBroadcast({
        message: trimmed,
        scheduled_at: null,
      });
      if (onNotification) {
        onNotification('Siaran berhasil dikirim! Banner berjalan akan tayang di portal peserta & pengawas.', 'success');
      }
      onClose();
    } catch (err) {
      if (onNotification) onNotification('Gagal mengirim siaran: ' + err.message, 'error');
    }
  };

  const handleSaveSchedule = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      if (onNotification) onNotification('Silakan tuliskan teks pengumuman siaran terlebih dahulu.', 'error');
      return;
    }
    if (scheduleMode === 'schedule' && !scheduleTime) {
      if (onNotification) onNotification('Silakan tentukan jam jadwal tayang siaran.', 'error');
      return;
    }

    try {
      await storageService.saveBroadcast({
        message: trimmed,
        scheduled_at: scheduleMode === 'schedule' ? scheduleTime : null,
      });
      if (onNotification) {
        onNotification(
          scheduleMode === 'schedule'
            ? `Siaran berhasil dijadwalkan untuk pukul ${scheduleTime} WIB.`
            : 'Siaran berhasil disimpan.',
          'success'
        );
      }
      onClose();
    } catch (err) {
      if (onNotification) onNotification('Gagal menyimpan jadwal: ' + err.message, 'error');
    }
  };

  const handleClearActive = async () => {
    try {
      await storageService.clearBroadcast();
      setMessage('');
      setCurrentActiveBroadcast(null);
      if (onNotification) onNotification('Siaran aktif berhasil dihentikan/dibersihkan.', 'info');
      onClose();
    } catch (err) {
      if (onNotification) onNotification('Gagal menghapus siaran: ' + err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-zinc-950/10 flex items-center justify-center shadow-2xs">
              <Megaphone className="w-5 h-5 text-zinc-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-950">Siaran Cepat (Broadcast)</h3>
              <p className="text-[11px] text-zinc-800 font-medium">Kirim banner pita berjalan ke portal peserta & proktor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-800 hover:text-black hover:bg-black/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-5 space-y-4">
          {/* Teks Terakhir yang Dikirim (Hanya Menampilkan Teks Terakhir) */}
          {lastBroadcast.text ? (
            <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  <span>Teks Terakhir Dikirim</span>
                </span>
                {lastBroadcast.time && (
                  <span className="font-mono text-zinc-400">
                    {new Date(lastBroadcast.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-zinc-800 italic break-words line-clamp-2">
                "{lastBroadcast.text}"
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 italic px-1">
              Belum ada siaran yang pernah dikirim sebelumnya.
            </div>
          )}

          {/* Input Textarea Pesan (Maksimal 100 Karakter) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-800">
                Pesan Siaran <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold">
                <span className="text-[11px] font-sans font-normal text-zinc-400">Karakter:</span>
                <span className={`px-2 py-0.5 rounded-md border text-xs font-mono font-bold transition-colors ${
                  charCount >= 100
                    ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                    : charCount >= 85
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {charCount}/100
                </span>
              </div>
            </div>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={100}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contoh: Waktu ujian tersisa 15 menit lagi, harap periksa kembali jawaban Anda!"
                className="w-full px-3.5 py-2.5 pb-7 text-xs text-zinc-900 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-zinc-400 resize-none font-medium leading-relaxed"
              />
              <div className="absolute bottom-2 right-3 pointer-events-none select-none">
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  charCount >= 100
                    ? 'text-rose-600 bg-rose-50 font-black'
                    : charCount >= 85
                    ? 'text-amber-800 bg-amber-100 font-bold'
                    : 'text-zinc-500 bg-zinc-100'
                }`}>
                  {charCount}/100
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 italic">
                Tayang seperti pita berjalan (3x putaran) di beranda dan lembar soal peserta
              </span>
              <span className="text-zinc-400 text-[10px]">
                Maksimal 100 karakter
              </span>
            </div>
          </div>

          {/* Opsi Set Waktu / Penjadwalan */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
            <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
              <span>Metode Pengiriman:</span>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Hanya Muncul 1x
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScheduleMode('now')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  scheduleMode === 'now'
                    ? 'bg-amber-500 text-zinc-950 border-amber-600 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Sekarang</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleMode('schedule')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  scheduleMode === 'schedule'
                    ? 'bg-amber-500 text-zinc-950 border-amber-600 shadow-2xs'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Set Waktu (Jadwal)</span>
              </button>
            </div>

            {/* Form Input Jam jika Mode Jadwal dipilih */}
            {scheduleMode === 'schedule' && (
              <div className="pt-1.5 space-y-1 animate-in fade-in duration-150">
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Tentukan Jam Tayang Otomatis (WIB):
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white text-xs font-mono font-bold text-zinc-900 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <p className="text-[10px] text-amber-900/80 italic">
                  *Pesan akan otomatis muncul tepat pada jam ini di layar peserta & proktor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Tombol Aksi */}
        <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between gap-2">
          {currentActiveBroadcast ? (
            <button
              type="button"
              onClick={handleClearActive}
              className="inline-flex items-center gap-1 px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-200 transition-colors cursor-pointer"
              title="Hentikan siaran yang sedang aktif"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Siaran</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-zinc-600 hover:bg-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
          )}

          <div className="flex items-center gap-2">
            {scheduleMode === 'schedule' ? (
              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={!message.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Simpan Jadwal</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendNow}
                disabled={!message.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl shadow-2xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
