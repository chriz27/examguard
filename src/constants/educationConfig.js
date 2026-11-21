/**
 * Konfigurasi Jenjang Pendidikan, Haversine Formula, & Utilitas UUID
 */

export const EDUCATION_LEVELS = {
  SD: {
    label: 'Sekolah Dasar (SD / MI)',
    code: 'SD',
    grades: [1, 2, 3, 4, 5, 6],
  },
  SMP: {
    label: 'Sekolah Menengah Pertama (SMP / MTs)',
    code: 'SMP',
    grades: [7, 8, 9],
  },
  SMA: {
    label: 'Sekolah Menengah Atas / Kejuruan (SMA / SMK / MA)',
    code: 'SMA',
    grades: [10, 11, 12],
  },
  LAINNYA: {
    label: 'Perguruan Tinggi / Pelatihan / Umum',
    code: 'LAINNYA',
    grades: [0],
  },
};

export const AUTH_METHODS = {
  SSO_ONLY: 'Hanya Google SSO',
  CREDENTIALS_ONLY: 'Hanya No. Ujian / NISN & Password',
  BOTH: 'Google SSO & No. Ujian / NISN (Keduanya)',
};

export const EXAM_SESSION_GROUPS = [
  'Asesmen Tengah Semester (ATS)',
  'Asesmen Akhir Semester (AAS)',
  'Asesmen Sumatif Akhir Jenjang (ASAJ)',
  'Penilaian Harian (PH)',
  'Simulasi & Try Out',
  'Ujian Praktik / Keterampilan',
  'Lainnya',
];

export const POPULAR_SUBJECTS = [
  'Matematika Wajib',
  'Matematika Peminatan',
  'Fisika',
  'Kimia',
  'Biologi',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Informatika',
  'Pendidikan Pancasila / PKn',
  'Sejarah',
  'Ekonomi',
  'Geografi',
  'Sosiologi',
  'Pendidikan Agama',
  'Seni Budaya',
  'Pendidikan Jasmani (PJOK)',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
];

export const ATTEMPT_STATUS = {
  IN_PROGRESS: {
    code: 'IN_PROGRESS',
    label: 'Sedang Mengerjakan',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  LOCKED: {
    code: 'LOCKED',
    label: 'Terkunci (Pelanggaran)',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  COMPLETED: {
    code: 'COMPLETED',
    label: 'Selesai',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  RESET_BY_PROCTOR: {
    code: 'RESET_BY_PROCTOR',
    label: 'Direset Pengawas',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
};

/**
 * UUID v4 Generator yang aman dan kompatibel di semua browser modern
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Haversine Formula: Menghitung jarak garis lurus antara dua koordinat GPS dalam satuan meter.
 * @param {number} lat1 Latitude titik 1
 * @param {number} lon1 Longitude titik 1
 * @param {number} lat2 Latitude titik 2
 * @param {number} lon2 Longitude titik 2
 * @returns {number} Jarak dalam satuan meter
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format detik menjadi format tampilan jam:menit:detik (HH:MM:SS atau MM:SS)
 */
export function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Label penyesuaian tingkat kelas
 */
export function getGradeLabel(gradeNumber) {
  const g = parseInt(gradeNumber, 10);
  if (g === 0) return 'Tingkat Umum';
  return `Tingkat ${g}`;
}

/**
 * Standar Token Ujian ExamGuard: Tepat 6 karakter huruf besar (A-Z) tanpa angka
 */
export function generateRandomToken6() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function formatExamToken(raw) {
  if (!raw) return '';
  return String(raw).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6);
}


