import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Upload, AlertCircle, CheckCircle2, SwitchCamera, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess, title = 'Scan QR Code Kartu Peserta Ujian' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  // Audio Beep generator via Web Audio API
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  };

  // Mulai streaming kamera
  const startCamera = async (deviceId = '') => {
    stopCamera();
    setCameraLoading(true);
    setCameraError('');

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // penting untuk iOS Safari
        await videoRef.current.play();
      }

      // Cari daftar perangkat kamera yang tersedia
      if (navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
        if (!deviceId && videoDevices.length > 0) {
          const currentTrack = stream.getVideoTracks()[0];
          const currentSetting = currentTrack.getSettings ? currentTrack.getSettings() : {};
          setSelectedCameraId(currentSetting.deviceId || videoDevices[0].deviceId);
        }
      }

      setCameraLoading(false);
      startScanningLoop();
    } catch (err) {
      console.warn('[QrScanner] Error accessing camera:', err);
      setCameraLoading(false);
      setCameraError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera Anda pada setelan izin URL ini, atau gunakan opsi unggah gambar di bawah.'
          : 'Kamera tidak ditemukan atau sedang digunakan oleh aplikasi lain. Anda dapat menggunakan opsi unggah file foto kartu ujian.'
      );
    }
  };

  // Hentikan streaming kamera dan loop scanning
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Loop pemindaian frame video
  const startScanningLoop = () => {
    const scan = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animFrameIdRef.current = requestAnimationFrame(scan);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        animFrameIdRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      if (canvas.width > 0 && canvas.height > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        let detectedCode = null;

        // 1. Coba BarcodeDetector native jika didukung browser
        if ('BarcodeDetector' in window) {
          try {
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const barcodes = await detector.detect(canvas);
            if (barcodes && barcodes.length > 0) {
              detectedCode = barcodes[0].rawValue;
            }
          } catch {}
        }

        // 2. Fallback ke jsQR (universal, 100% didukung semua browser)
        if (!detectedCode) {
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (qr && qr.data) {
              detectedCode = qr.data;
            }
          } catch {}
        }

        if (detectedCode && detectedCode.trim()) {
          handleDetectedCode(detectedCode.trim());
          return; // Berhenti looping setelah terdeteksi
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scan);
    };

    animFrameIdRef.current = requestAnimationFrame(scan);
  };

  // Eksekusi kode yang terdeteksi
  const handleDetectedCode = (code) => {
    playBeep();
    setScanSuccessFeedback(true);
    stopCamera();

    setTimeout(() => {
      setScanSuccessFeedback(false);
      onScanSuccess(code);
    }, 400);
  };

  // Handler unggah gambar QR Code dari galeri/file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        try {
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const qr = jsQR(imageData.data, imageData.width, imageData.height);
          if (qr && qr.data) {
            handleDetectedCode(qr.data);
          } else {
            setFileError('Tidak ditemukan QR Code yang valid pada gambar tersebut. Pastikan foto jelas dan tidak buram.');
          }
        } catch (err) {
          setFileError('Gagal memproses gambar: ' + err.message);
        }
      };
      img.onerror = () => {
        setFileError('Gagal membaca berkas gambar.');
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input agar bisa pilih file yang sama jika diinginkan
  };

  // Efek pembukaan modal
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCameraError('');
      setFileError('');
      setScanSuccessFeedback(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
              <p className="text-[11px] text-zinc-500">Scan kartu untuk login instan tanpa ketik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Kamera & Scanner Area */}
        <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden select-none">
          {/* Elemen Video & Canvas */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Feedback Visual Sukses Scan */}
          {scanSuccessFeedback && (
            <div className="absolute inset-0 bg-emerald-500/80 flex flex-col items-center justify-center z-30 animate-in fade-in text-white space-y-2">
              <CheckCircle2 className="w-14 h-14 animate-bounce" />
              <p className="text-sm font-bold tracking-wide">QR Code Terdeteksi!</p>
              <p className="text-xs opacity-90">Memverifikasi kredensial peserta...</p>
            </div>
          )}

          {/* Overlay Target Viewfinder */}
          {!cameraLoading && !cameraError && !scanSuccessFeedback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              {/* Dimmed background around viewport */}
              <div className="relative w-56 h-56 rounded-2xl border-2 border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                {/* 4 Sudut Target Viewfinder */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-xl -mt-1 -ml-1"></span>
                <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-xl -mt-1 -mr-1"></span>
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-xl -mb-1 -ml-1"></span>
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-xl -mb-1 -mr-1"></span>

                {/* Laser Scanning Line Animasi */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_12px_#60a5fa] animate-pulse"></div>

                <div className="absolute -bottom-8 whitespace-nowrap text-center">
                  <span className="text-[11px] font-semibold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Arahkan QR Code ke dalam kotak
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Kamera */}
          {cameraLoading && (
            <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center text-white space-y-2.5 z-20">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-xs font-medium">Menghubungkan ke sensor kamera...</p>
            </div>
          )}

          {/* Error Kamera */}
          {cameraError && (
            <div className="absolute inset-0 p-6 bg-zinc-900/95 flex flex-col items-center justify-center text-center text-zinc-100 z-20 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-200 leading-relaxed max-w-xs">{cameraError}</p>
              <button
                type="button"
                onClick={() => startCamera(selectedCameraId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-zinc-900 text-xs font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer & Pilihan Alternatif */}
        <div className="p-4 bg-white border-t border-zinc-100 space-y-3">
          {/* Peringatan error upload file jika ada */}
          {fileError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{fileError}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Tombol Ganti Kamera jika ada lebih dari 1 kamera */}
            {cameras.length > 1 && !cameraError && (
              <button
                type="button"
                onClick={() => {
                  const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
                  const nextIndex = (currentIndex + 1) % cameras.length;
                  const nextCamera = cameras[nextIndex];
                  setSelectedCameraId(nextCamera.deviceId);
                  startCamera(nextCamera.deviceId);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer"
                title="Ganti kamera depan / belakang"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-zinc-600" />
                <span>Ganti Kamera</span>
              </button>
            )}

            {/* Alternatif: Unggah Foto Gambar QR Code */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer ml-auto"
              title="Pilih file gambar kartu ujian dari galeri"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Unggah Gambar QR</span>
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-800 underline transition-colors cursor-pointer font-medium"
            >
              Kembali ke Login Manual (No. Ujian & Password)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
