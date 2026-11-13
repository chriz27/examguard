import { generateUUID } from '../constants/educationConfig';

const STORAGE_KEYS = {
  INSTITUTION: 'examguard_institution',
  USERS: 'examguard_users',
  EXAM_SESSIONS: 'examguard_exam_sessions',
  STUDENT_ATTEMPTS: 'examguard_student_attempts',
  CURRENT_USER: 'examguard_current_user',
  DEVICE_ID: 'examguard_client_device_id',
};

/**
 * Dapatkan atau hasilkan Device ID unik untuk peramban ini
 */
export function getOrCreateDeviceId() {
  let devId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!devId) {
    devId = 'DEV-' + generateUUID().slice(0, 13).toUpperCase();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, devId);
  }
  return devId;
}

/**
 * Data awal institusi
 */
const DEFAULT_INSTITUTION = {
  id: generateUUID(),
  name: 'SMA Negeri 1 Nusantara',
  logo_url: null, // URL atau Base64 logo resmi instansi
  education_level: 'SMA',
  allowed_grades: [10, 11, 12],
  idle_timeout_minutes: 30,
  gps_enabled: true, // Sakelar ON/OFF pengecekan lokasi GPS saat ujian
  center_lat: -6.2088,
  center_lng: 106.8456,
  max_radius_meters: 200,
  auth_method: 'BOTH', // 'SSO_ONLY', 'CREDENTIALS_ONLY', 'BOTH'
  google_client_id: '842918239012-examguard.apps.googleusercontent.com',
  google_client_secret: 'GOCSPX-ExamGuardSecretToken2026',
  recaptcha_enabled: true,
  recaptcha_site_key: '6LeIx0aUAAAAAExampleKeyExamGuardSiteKey',
  recaptcha_secret_key: '6LeIx0aUAAAAAExampleKeyExamGuardSecret',
};

/**
 * Data awal pengguna
 */
const DEFAULT_USERS = [
  {
    id: generateUUID(),
    username: 'admin',
    password: 'admin',
    nama: 'Administrator Utama',
    email: 'admin@examguard.sch.id',
    role: 'admin',
    nisn: '',
    nis: '',
    kelas: 'Staf IT',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: 'pengawas1',
    password: 'pengawas1',
    nama: 'Drs. Hendro Wibowo',
    email: 'hendro.wibowo@examguard.sch.id',
    role: 'proctor',
    nisn: '',
    nis: '',
    kelas: 'Pengawas Ruang 01',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0058291021',
    password: '0058291021',
    nama: 'Ahmad Fauzi Ridwan',
    email: 'ahmad.fauzi@student.sch.id',
    role: 'student',
    nisn: '0058291021',
    nis: '22101',
    kelas: 'XII MIPA 1',
    tingkat: 12,
    is_active: true,
    is_verified: true,
    google_linked: true,
    google_id: '108291021482019284',
    google_email: 'ahmad.fauzi@student.sch.id',
    google_linked_at: '2026-11-10T08:30:00Z',
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0058291022',
    password: '0058291022',
    nama: 'Siti Rahmawati Putri',
    email: 'siti.rahma@student.sch.id',
    role: 'student',
    nisn: '0058291022',
    nis: '22102',
    kelas: 'XII MIPA 2',
    tingkat: 12,
    is_active: false, // Tidak boleh aktif sebelum diverifikasi
    is_verified: false, // Status Belum Verifikasi untuk contoh kasus
    google_linked: false,
    google_id: null,
    google_email: null,
    google_linked_at: null,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0068291033',
    password: '0068291033',
    nama: 'Bambang Pamungkas',
    email: 'bambang.p@student.sch.id',
    role: 'student',
    nisn: '0068291033',
    nis: '23101',
    kelas: 'XI IPS 1',
    tingkat: 11,
    is_active: true,
    is_verified: true,
    google_linked: false,
    google_id: null,
    google_email: null,
    google_linked_at: null,
    active_device_id: null,
  },
];

/**
 * Data awal sesi ujian Google Form
 */
const DEFAULT_EXAMS = [
  {
    id: generateUUID(),
    title: 'Penilaian Akhir Semester - Matematika Wajib',
    description: 'Materi: Statistika, Dimensi Tiga, dan Kaidah Pencacahan. Wajib menggunakan kalkulator manual, dilarang membuka tab lain.',
    grade_level: 12,
    is_active: true,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6Z-sample-math-exam/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
    exam_token: 'MTK-WJB-2026',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:00',
    duration_minutes: 90,
  },
  {
    id: generateUUID(),
    title: 'Ujian Fisika Lanjutan - Gelombang & Optik',
    description: 'Kerjakan soal uraian dan pilihan ganda. Pastikan kuota dan daya baterai perangkat mencukupi.',
    grade_level: 12,
    is_active: true,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_fisika/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_fisika_sheets',
    exam_token: 'FSK-OPT-2026',
    start_time: '2026-11-11T08:00',
    end_time: '2026-11-11T17:00',
    duration_minutes: 60,
  },
  {
    id: generateUUID(),
    title: 'Simulasi Asesmen Bahasa Indonesia',
    description: 'Teks Eksplanasi dan Teks Prosedur Kompleks untuk Kelas XI.',
    grade_level: 11,
    is_active: true,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_indo/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_indo_sheets',
    exam_token: 'B-INDO-XI',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:30',
    duration_minutes: 75,
  },
];

/**
 * Service Database Terpusat (localStorage + API Adapter)
 */
export const storageService = {
  // Inisialisasi awal
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.INSTITUTION)) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(DEFAULT_INSTITUTION));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(DEFAULT_EXAMS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify([]));
    }
  },

  // 1. INSTITUSI
  getInstitution() {
    this.init();
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.INSTITUTION)) || DEFAULT_INSTITUTION;
      return {
        ...DEFAULT_INSTITUTION,
        ...parsed,
        gps_enabled: typeof parsed.gps_enabled === 'boolean' ? parsed.gps_enabled : true,
        logo_url: parsed.logo_url || null,
      };
    } catch {
      return DEFAULT_INSTITUTION;
    }
  },

  updateInstitution(data) {
    const current = this.getInstitution();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(updated));
    return updated;
  },

  // 2. USERS
  getUsers() {
    this.init();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
      let modified = false;

      // Normalisasi aturan: tidak boleh aktif jika belum terverifikasi & lengkapi data Google SSO
      const normalized = raw.map((u) => {
        const isVerified = typeof u.is_verified === 'boolean' ? u.is_verified : true;
        let isActive = typeof u.is_active === 'boolean' ? u.is_active : true;

        // RULE: Tidak boleh aktif jika belum terverifikasi
        if (!isVerified && isActive) {
          isActive = false;
          modified = true;
        }

        // RULE: Google SSO status: centang hijau HANYA jika pernah login menggunakan email terdaftar & menyimpan id akun google
        const googleId = u.google_id || (u.google_linked && u.username === '0058291021' ? '108291021482019284' : null);
        const googleLinked = Boolean(u.google_linked && googleId);
        const googleEmail = googleLinked ? (u.google_email || u.email) : null;
        const googleLinkedAt = googleLinked ? (u.google_linked_at || '2026-11-10T08:30:00Z') : null;

        if (
          u.is_verified !== isVerified ||
          u.is_active !== isActive ||
          u.google_linked !== googleLinked ||
          u.google_id !== googleId ||
          u.google_email !== googleEmail ||
          u.google_linked_at !== googleLinkedAt
        ) {
          modified = true;
        }

        return {
          ...u,
          is_verified: isVerified,
          is_active: isActive,
          google_linked: googleLinked,
          google_id: googleId,
          google_email: googleEmail,
          google_linked_at: googleLinkedAt,
        };
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      return [];
    }
  },

  getUserById(id) {
    return this.getUsers().find((u) => u.id === id) || null;
  },

  getUserByUsername(username) {
    return this.getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase().trim()) || null;
  },

  getUserByEmail(email) {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  },

  saveUser(user) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = { ...users[index], ...user };
    } else {
      users.push({ ...user, id: user.id || generateUUID() });
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },

  deleteUser(id) {
    const users = this.getUsers().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  toggleUserActive(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      // RULE: Tidak boleh aktif jika belum terverifikasi!
      if (!target.is_verified && !target.is_active) {
        throw new Error(
          'Siswa belum terverifikasi oleh panitia! Harap verifikasi siswa terlebih dahulu sebelum mengaktifkan akun.'
        );
      }
      target.is_active = !target.is_active;
      // Jika statusnya belum terverifikasi, pastikan tetap false
      if (!target.is_verified) {
        target.is_active = false;
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  toggleUserVerified(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      target.is_verified = !target.is_verified;
      // RULE: Jika verifikasi dicabut (false), status akun otomatis WAJIB dinonaktifkan!
      if (!target.is_verified) {
        target.is_active = false;
      }
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  // Update akun peserta: jika email diubah dan berbeda dengan sebelumnya maka status SSO off!
  updateStudent(id, data) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, message: 'Data peserta tidak ditemukan.' };
    }

    const current = users[index];
    const oldEmail = (current.email || '').toLowerCase().trim();
    const newEmail = (data.email || '').toLowerCase().trim();

    // RULE PENTING: Jika email di-update dan berbeda dengan sebelumnya maka status SSO off!
    const emailChanged = oldEmail !== newEmail;
    const googleLinked = emailChanged ? false : Boolean(current.google_linked && current.google_id);
    const googleId = emailChanged ? null : (current.google_id || null);
    const googleEmail = emailChanged ? null : (current.google_email || null);
    const googleLinkedAt = emailChanged ? null : (current.google_linked_at || null);

    const nisn = String(data.nisn || current.nisn).trim();

    // Validasi duplikasi NISN jika NISN diubah
    if (nisn !== current.nisn) {
      const duplicate = users.find((u) => u.id !== id && (u.nisn === nisn || u.username === nisn));
      if (duplicate) {
        return { success: false, message: `NISN ${nisn} sudah terdaftar untuk siswa lain.` };
      }
    }

    const isVerified = typeof data.is_verified === 'boolean' ? data.is_verified : current.is_verified;
    const isActive = isVerified ? (typeof data.is_active === 'boolean' ? data.is_active : current.is_active) : false;

    users[index] = {
      ...current,
      nama: (data.nama || current.nama).trim(),
      nisn: nisn,
      username: nisn, // Sinkronisasi username dengan NISN
      nis: data.nis !== undefined ? String(data.nis).trim() : current.nis,
      kelas: (data.kelas || current.kelas).trim(),
      tingkat: data.tingkat !== undefined ? parseInt(data.tingkat, 10) : current.tingkat,
      email: newEmail,
      is_verified: isVerified,
      is_active: isActive,
      google_linked: googleLinked,
      google_id: googleId,
      google_email: googleEmail,
      google_linked_at: googleLinkedAt,
    };

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return {
      success: true,
      emailChanged,
      user: users[index],
    };
  },

  // Tambah peserta manual (status SSO awal otomatis OFF)
  addStudent(data) {
    const users = this.getUsers();
    const nisn = String(data.nisn || '').trim();
    if (!nisn) {
      return { success: false, message: 'NISN siswa wajib diisi.' };
    }

    const exists = users.find((u) => u.nisn === nisn || u.username === nisn);
    if (exists) {
      return { success: false, message: `Siswa dengan NISN ${nisn} sudah terdaftar.` };
    }

    const isVerified = typeof data.is_verified === 'boolean' ? data.is_verified : true;
    const isActive = isVerified ? (typeof data.is_active === 'boolean' ? data.is_active : true) : false;

    const newStudent = {
      id: generateUUID(),
      username: nisn,
      password: nisn, // Password awal otomatis diset ke NISN
      nama: (data.nama || `Siswa ${nisn}`).trim(),
      nisn: nisn,
      nis: String(data.nis || '').trim(),
      kelas: String(data.kelas || '-').trim(),
      tingkat: parseInt(data.tingkat, 10) || 0,
      email: (data.email || `${nisn}@student.sch.id`).toLowerCase().trim(),
      role: 'student',
      is_active: isActive,
      is_verified: isVerified,
      // Status SSO awal otomatis OFF (sampai siswa login via Google SSO)
      google_linked: false,
      google_id: null,
      google_email: null,
      google_linked_at: null,
      active_device_id: null,
    };

    users.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return { success: true, user: newStudent };
  },

  resetUserDevice(id) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (target) {
      target.active_device_id = null;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return target;
  },

  importStudents(studentsList) {
    const users = this.getUsers();
    let importedCount = 0;

    studentsList.forEach((row) => {
      const nisn = String(row.nisn || '').trim();
      if (!nisn) return;

      const existingIndex = users.findIndex((u) => u.nisn === nisn || u.username === nisn);
      const isVerified = existingIndex >= 0 ? users[existingIndex].is_verified : true;
      const isActive = isVerified ? (existingIndex >= 0 ? users[existingIndex].is_active : true) : false;

      const studentData = {
        id: existingIndex >= 0 ? users[existingIndex].id : generateUUID(),
        username: nisn,
        password: nisn, // Password awal otomatis diset ke NISN
        nama: row.nama || `Siswa ${nisn}`,
        nisn: nisn,
        nis: String(row.nis || '').trim(),
        kelas: String(row.kelas || '-').trim(),
        tingkat: parseInt(row.tingkat, 10) || 0,
        email: (row.email || `${nisn}@student.sch.id`).toLowerCase().trim(),
        role: 'student',
        is_active: isActive,
        is_verified: isVerified,
        google_linked: existingIndex >= 0 ? Boolean(users[existingIndex].google_linked && users[existingIndex].google_id) : false,
        google_id: existingIndex >= 0 ? users[existingIndex].google_id : null,
        google_email: existingIndex >= 0 ? users[existingIndex].google_email : null,
        google_linked_at: existingIndex >= 0 ? users[existingIndex].google_linked_at : null,
        active_device_id: existingIndex >= 0 ? users[existingIndex].active_device_id : null,
      };

      if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...studentData };
      } else {
        users.push(studentData);
      }
      importedCount++;
    });

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return importedCount;
  },

  updateAdminProfile(adminId, { username, email, password, nama }) {
    const users = this.getUsers();
    const admin = users.find((u) => u.id === adminId && u.role === 'admin');
    if (!admin) return { success: false, message: 'Admin tidak ditemukan' };

    if (username) admin.username = username.trim();
    if (email) admin.email = email.trim();
    if (password) admin.password = password;
    if (nama) admin.nama = nama.trim();

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update session jika sedang aktif
    const current = this.getCurrentUser();
    if (current && current.id === adminId) {
      this.setCurrentUser(admin);
    }
    return { success: true, user: admin };
  },

  // 3. EXAM SESSIONS
  getExamSessions() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) || [];
    } catch {
      return [];
    }
  },

  getExamSessionById(id) {
    return this.getExamSessions().find((e) => e.id === id) || null;
  },

  saveExamSession(examData) {
    const exams = this.getExamSessions();
    const examToSave = {
      ...examData,
      id: examData.id || generateUUID(),
      grade_level: parseInt(examData.grade_level, 10) || 0,
      duration_minutes: parseInt(examData.duration_minutes, 10) || 60,
      is_active: typeof examData.is_active === 'boolean' ? examData.is_active : true,
    };

    const index = exams.findIndex((e) => e.id === examToSave.id);
    if (index >= 0) {
      exams[index] = examToSave;
    } else {
      exams.push(examToSave);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    return examToSave;
  },

  deleteExamSession(id) {
    const exams = this.getExamSessions().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
  },

  toggleExamActive(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_active = !target.is_active;
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    }
    return target;
  },

  // 4. STUDENT ATTEMPTS & PROCTOR CONTROL
  getAttempts() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT_ATTEMPTS)) || [];
    } catch {
      return [];
    }
  },

  getAttempt(studentId, examSessionId) {
    const attempts = this.getAttempts();
    return attempts.find((a) => a.student_id === studentId && a.exam_session_id === examSessionId) || null;
  },

  saveAttempt(attemptData) {
    const attempts = this.getAttempts();
    const index = attempts.findIndex(
      (a) => a.student_id === attemptData.student_id && a.exam_session_id === attemptData.exam_session_id
    );

    const record = {
      id: generateUUID(),
      violation_count: 0,
      time_spent_seconds: 0,
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
      completed_at: null,
      ...attemptData,
    };

    if (index >= 0) {
      attempts[index] = { ...attempts[index], ...attemptData };
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      return attempts[index];
    } else {
      attempts.push(record);
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
      return record;
    }
  },

  // Aksi Pengawas 1: Reset Login Siswa
  proctorResetStudentDevice(studentId) {
    return this.resetUserDevice(studentId);
  },

  // Aksi Pengawas 2: Unlock Siswa
  proctorUnlockAttempt(attemptId) {
    const attempts = this.getAttempts();
    const target = attempts.find((a) => a.id === attemptId);
    if (target) {
      target.status = 'IN_PROGRESS';
      target.unlocked_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
    }
    return target;
  },

  // Aksi Pengawas 3: Reset Jawaban (mengubah COMPLETED menjadi RESET_BY_PROCTOR)
  proctorResetAnswerAttempt(attemptId) {
    const attempts = this.getAttempts();
    const target = attempts.find((a) => a.id === attemptId);
    if (target) {
      target.status = 'RESET_BY_PROCTOR';
      target.reset_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(attempts));
    }
    return target;
  },

  // 5. SESSION MANAGEMENT
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },
};

/**
 * Adapter API untuk cPanel Backend (/api/v1)
 * Bila Anda menghubungkan backend cPanel (PHP / Express / Laravel / SQLite / MySQL),
 * Anda cukup mengaktifkan mode API tanpa merombak UI.
 */
export const apiAdapter = {
  isLiveApi: false, // Setel true saat backend cPanel /api/v1 aktif
  apiBase: '/api/v1',

  async request(endpoint, options = {}) {
    if (!this.isLiveApi) {
      return null; // Menggunakan storageService lokal secara default
    }
    try {
      const response = await fetch(`${this.apiBase}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      return await response.json();
    } catch (err) {
      console.warn('Fallback ke storageService lokal:', err);
      return null;
    }
  },
};

