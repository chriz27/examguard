import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, X } from 'lucide-react';
import { storageService } from '../../services/storageService';

export default function BroadcastRibbon() {
  const [activeMessage, setActiveMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const activeBroadcastIdRef = useRef('');

  const checkBroadcast = () => {
    try {
      const bcast = storageService.getActiveBroadcast();
      if (!bcast || !bcast.message || !bcast.message.trim() || !bcast.broadcast_id) {
        if (isVisible) setIsVisible(false);
        return;
      }

      // Periksa apakah waktu jadwal tayang sudah tiba
      const now = new Date();
      if (bcast.scheduled_at) {
        let isDue = false;
        if (bcast.scheduled_at.includes(':') && !bcast.scheduled_at.includes('-')) {
          // Format jam HH:mm
          const [sh, sm] = bcast.scheduled_at.split(':').map(Number);
          const currentH = now.getHours();
          const currentM = now.getMinutes();
          if (currentH > sh || (currentH === sh && currentM >= sm)) {
            // Pastikan tidak lewat lebih dari 30 menit dari jadwal tayang
            const diffMin = (currentH - sh) * 60 + (currentM - sm);
            if (diffMin >= 0 && diffMin <= 30) {
              isDue = true;
            }
          }
        } else {
          // Format datetime ISO / lengkap
          const schedMs = new Date(bcast.scheduled_at).getTime();
          const nowMs = now.getTime();
          if (nowMs >= schedMs && nowMs <= schedMs + 30 * 60 * 1000) {
            isDue = true;
          }
        }

        if (!isDue) return;
      }

      // Periksa apakah siaran ini sudah pernah tampil di perangkat/browser ini ("hanya muncul 1x")
      const seenId = localStorage.getItem('examguard_seen_broadcast_id');
      if (seenId === bcast.broadcast_id) {
        return;
      }

      // Jika belum pernah tampil, munculkan pita running text
      localStorage.setItem('examguard_seen_broadcast_id', bcast.broadcast_id);
      activeBroadcastIdRef.current = bcast.broadcast_id;
      setActiveMessage(bcast.message.trim());
      setPassCount(0);
      setIsVisible(true);
    } catch (e) {
      console.warn('Broadcast check error:', e);
    }
  };

  const fetchRemoteBroadcast = async () => {
    try {
      const res = await fetch('/api/db/broadcast');
      if (res.ok) {
        const raw = await res.json();
        const data = raw?.broadcast || raw;
        if (data && data.broadcast_id && data.message) {
          const current = storageService.getActiveBroadcast();
          if (!current || current.broadcast_id !== data.broadcast_id || current.message !== data.message) {
            localStorage.setItem('examguard_active_broadcast', JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('examguard_broadcast_updated', { detail: data }));
            checkBroadcast();
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkBroadcast();
    fetchRemoteBroadcast();

    const handleBroadcastUpdate = () => checkBroadcast();
    window.addEventListener('examguard_broadcast_updated', handleBroadcastUpdate);
    window.addEventListener('examguard_storage_updated', handleBroadcastUpdate);

    // Cek lokal setiap 1.5 detik dan polling server setiap 4 detik
    const localInterval = setInterval(checkBroadcast, 1500);
    const remoteInterval = setInterval(fetchRemoteBroadcast, 4000);

    return () => {
      window.removeEventListener('examguard_broadcast_updated', handleBroadcastUpdate);
      window.removeEventListener('examguard_storage_updated', handleBroadcastUpdate);
      clearInterval(localInterval);
      clearInterval(remoteInterval);
    };
  }, []);

  // Hitung putaran animasi (berjalan 3x)
  const handleIteration = () => {
    setPassCount((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        setIsVisible(false);
      }
      return next;
    });
  };

  const handleAnimationEnd = () => {
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Batas waktu keamanan maksimal (14 detik * 3 = 42 detik + buffer = 45 detik) agar pasti hilang otomatis
  useEffect(() => {
    if (isVisible) {
      const timeout = setTimeout(() => {
        setIsVisible(false);
      }, 45000);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, activeMessage]);

  if (!isVisible || !activeMessage) return null;

  return (
    <>
      <style>{`
        @keyframes egMarqueeAnimation {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .eg-running-ribbon {
          animation: egMarqueeAnimation 14s linear 3;
          will-change: transform;
        }
      `}</style>
      <div 
        className="fixed top-0 left-0 right-0 z-[999999] pointer-events-auto bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-zinc-950 font-black shadow-2xl border-b-2 border-amber-600 flex items-center h-10 select-none overflow-hidden"
        role="alert"
        aria-live="assertive"
      >
        {/* Label Badge Statis Kiri */}
        <div className="flex items-center gap-1.5 px-3 h-full bg-amber-600 text-white font-extrabold text-xs tracking-wider uppercase shrink-0 shadow-md z-20">
          <Megaphone className="w-4 h-4 text-yellow-200 animate-bounce shrink-0" />
          <span className="hidden sm:inline">PENGUMUMAN PUSAT</span>
          <span className="sm:hidden">INFO</span>
          <span className="text-[10px] bg-amber-700/80 px-1.5 py-0.5 rounded font-mono text-yellow-100">
            {passCount + 1}/3
          </span>
        </div>

        {/* Jalur Running Text (Bergerak dari Kanan ke Kiri sebanyak 3x) */}
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div
            className="eg-running-ribbon absolute left-0 top-0 bottom-0 h-full whitespace-nowrap font-black text-sm tracking-wide text-zinc-950 uppercase flex items-center gap-6"
            onAnimationIteration={handleIteration}
            onAnimationEnd={handleAnimationEnd}
          >
            <span className="flex items-center gap-2">
              <span>📢</span>
              <span>{activeMessage}</span>
            </span>
            <span className="text-amber-800 font-bold">•</span>
            <span className="flex items-center gap-2">
              <span>📢</span>
              <span>{activeMessage}</span>
            </span>
            <span className="text-amber-800 font-bold">•</span>
            <span className="flex items-center gap-2">
              <span>📢</span>
              <span>{activeMessage}</span>
            </span>
          </div>
        </div>

        {/* Tombol Tutup Manual Kanan */}
        <button
          type="button"
          onClick={handleDismiss}
          className="h-full px-3 text-zinc-900 hover:text-black hover:bg-amber-500/40 transition-colors shrink-0 z-20 flex items-center justify-center cursor-pointer font-bold text-xs"
          title="Tutup banner sekarang"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
