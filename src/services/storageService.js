import { generateUUID, EDUCATION_LEVELS, formatExamToken } from '../constants/educationConfig';

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
 * Pengaturan Default Izin Peramban (Pre-Flight Browser Permissions)
 * Menentukan izin apa saja yang wajib dicek dan dipenuhi oleh siswa saat login & memulai ujian.
 */
export const DEFAULT_BROWSER_PERMISSIONS = {
  location_gps: true,       // 1. Izinkan Lokasi (Login GPS)
  notifications: true,      // 2. Izinkan Notifications (Suara peringatan)
  sound_audio: true,        // 3. Izinkan Sound
  fullscreen: true,         // 4. Izinkan Fullscreen
  google_sso: false,        // 5. Login Akun Google
  block_clipboard: true,    // 6. Block Clipboard
  camera_webcam: true,      // 7. Sensor Kamera & Mikrofon
  cookies_iframe: true,     // 8. Third-Party Cookies (Iframe GForm)
};

/**
 * Data awal institusi
 */
const DEFAULT_INSTITUTION = {
  id: generateUUID(),
  name: 'SMA Negeri 1 Nusantara',
  npsn: '20104829', // 8 digit numerik resmi Kemendikbudristek
  logo_url: null, // URL atau Base64 logo resmi instansi
  education_level: 'SMA',
  allowed_grades: [10, 11, 12],
  idle_timeout_minutes: 30,
  gps_enabled: true, // Sakelar ON/OFF pengecekan lokasi GPS saat ujian
  center_lat: -6.2088,
  center_lng: 106.8456,
  max_radius_meters: 200,
  gmaps_url: 'https://maps.google.com/?q=-6.2088,106.8456',
  auth_method: 'BOTH', // 'SSO_ONLY', 'CREDENTIALS_ONLY', 'BOTH'
  google_oauth_enabled: true,
  google_client_id: '842918239012-examguard.apps.googleusercontent.com',
  google_client_secret: 'GOCSPX-ExamGuardSecretToken2026',
  recaptcha_enabled: true,
  recaptcha_site_key: '6LeIx0aUAAAAAExampleKeyExamGuardSiteKey',
  recaptcha_secret_key: '6LeIx0aUAAAAAExampleKeyExamGuardSecret',
  browser_permissions: { ...DEFAULT_BROWSER_PERMISSIONS },
};

/**
 * Data awal pengguna
 */
const DEFAULT_USERS = [
  {
    id: 'ADMIN-SUPER-01',
    username: 'admin',
    password: 'admin',
    nama: 'Super Admin',
    email: 'admin@examguard.sch.id',
    role: 'admin', // Super Admin: Akses Penuh (termasuk Pengaturan Instansi & Akun Admin)
    nisn: '',
    nis: '',
    kelas: 'Administrator Utama',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: 'PROCTOR-01',
    username: 'proktor',
    password: 'proktor',
    nama: 'Proktor Ujian',
    email: 'proktor@examguard.sch.id',
    role: 'proctor', // Proktor: Akses Operasional Ujian (Pengaturan Instansi & Akun Admin di-hide)
    nisn: '',
    nis: '',
    kelas: 'Pengawas / Proktor',
    tingkat: 0,
    is_active: true,
    is_verified: true,
    active_device_id: null,
  },
  {
    id: generateUUID(),
    username: '0058291021',
    password: '22101', // Default password adalah NIS
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
    password: '22102', // Default password adalah NIS
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
    password: '23101', // Default password adalah NIS
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
    subject: 'Matematika Wajib',
    title: 'Penilaian Akhir Semester - Matematika Wajib',
    session_group: 'Asesmen Akhir Semester (AAS)',
    description: 'Materi: Statistika, Dimensi Tiga, dan Kaidah Pencacahan. Wajib menggunakan kalkulator manual, dilarang membuka tab lain.',
    grade_level: 12,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6Z-sample-math-exam/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing',
    exam_token: 'MTKWJB',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:00',
    duration_minutes: 90,
  },
  {
    id: generateUUID(),
    subject: 'Fisika',
    title: 'Ujian Fisika Lanjutan - Gelombang & Optik',
    session_group: 'Asesmen Tengah Semester (ATS)',
    description: 'Kerjakan soal uraian dan pilihan ganda. Pastikan kuota dan daya baterai perangkat mencukupi.',
    grade_level: 12,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_fisika/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_fisika_sheets',
    exam_token: 'FSKOPT',
    start_time: '2026-11-11T08:00',
    end_time: '2026-11-11T17:00',
    duration_minutes: 60,
  },
  {
    id: generateUUID(),
    subject: 'Bahasa Indonesia',
    title: 'Simulasi Asesmen Bahasa Indonesia',
    session_group: 'Simulasi & Try Out',
    description: 'Teks Eksplanasi dan Teks Prosedur Kompleks untuk Kelas XI.',
    grade_level: 11,
    is_active: true,
    is_archived: false,
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_indo/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_indo_sheets',
    exam_token: 'BINDXI',
    start_time: '2026-11-11T07:30',
    end_time: '2026-11-11T16:30',
    duration_minutes: 75,
  },
  {
    id: generateUUID(),
    subject: 'Biologi',
    title: 'Bank Soal: Biologi Sel, Genetika & Hereditas',
    session_group: 'Penilaian Harian (PH)',
    description: 'Master bank soal bab genetika dan metabolisme sel. Soal ini tersimpan di arsip bank soal.',
    grade_level: 12,
    is_active: false,
    is_archived: true, // Diarsipkan ke Bank Soal
    gform_base_url: 'https://docs.google.com/forms/d/e/1FAIpQLScX_sample_biologi/viewform?embedded=true',
    respon_base_url: 'https://docs.google.com/spreadsheets/d/sample_biologi_sheets',
    exam_token: 'BIOGEN',
    start_time: '2026-11-10T08:00',
    end_time: '2026-11-10T15:00',
    duration_minutes: 60,
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
    } else {
      // Pastikan akun proktor dan super admin selalu tersedia di database
      try {
        const currentUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        let modified = false;

        // Cek akun proktor
        const hasProctor = currentUsers.some((u) => u.username === 'proktor' || (u.role === 'proctor' && u.username));
        if (!hasProctor) {
          currentUsers.push({
            id: 'PROCTOR-01',
            username: 'proktor',
            password: 'proktor',
            nama: 'Proktor Ujian',
            email: 'proktor@examguard.sch.id',
            role: 'proctor',
            nisn: '',
            nis: '',
            kelas: 'Pengawas / Proktor',
            tingkat: 0,
            is_active: true,
            is_verified: true,
            active_device_id: null,
          });
          modified = true;
        }

        // Pastikan akun admin memiliki role admin
        const adminUser = currentUsers.find((u) => u.username === 'admin');
        if (adminUser && adminUser.role !== 'admin') {
          adminUser.role = 'admin';
          modified = true;
        }

        if (modified) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(currentUsers));
        }
      } catch {}
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
      const browser_permissions = {
        ...DEFAULT_BROWSER_PERMISSIONS,
        ...(parsed.browser_permissions || {}),
      };
      // Sinkronisasi otomatis gps_enabled dengan permission location_gps jika ada
      if (typeof parsed.gps_enabled === 'boolean') {
        browser_permissions.location_gps = parsed.gps_enabled;
      }
      return {
        ...DEFAULT_INSTITUTION,
        ...parsed,
        npsn: parsed.npsn ? String(parsed.npsn).replace(/\D/g, '').slice(0, 8) : '20104829',
        browser_permissions,
        google_oauth_enabled:
          typeof parsed.google_oauth_enabled === 'boolean'
            ? parsed.google_oauth_enabled
            : (parsed.auth_method !== 'CREDENTIALS_ONLY'),
        recaptcha_enabled:
          typeof parsed.recaptcha_enabled === 'boolean'
            ? parsed.recaptcha_enabled
            : true,
        gps_enabled: typeof parsed.gps_enabled === 'boolean' ? parsed.gps_enabled : true,
        logo_url: parsed.logo_url || null,
        gmaps_url: parsed.gmaps_url || 'https://maps.google.com/?q=-6.2088,106.8456',
      };
    } catch {
      return DEFAULT_INSTITUTION;
    }
  },

  updateInstitution(data) {
    const current = this.getInstitution();
    // Sinkronisasi otomatis allowed_grades sesuai jenjang pendidikan tanpa delay
    let allowed_grades = data.allowed_grades;
    if (data.education_level && EDUCATION_LEVELS[data.education_level]) {
      allowed_grades = EDUCATION_LEVELS[data.education_level].grades;
    } else if (!allowed_grades) {
      allowed_grades = current.allowed_grades || [10, 11, 12];
    }

    const npsn = data.npsn !== undefined ? String(data.npsn).replace(/\D/g, '').slice(0, 8) : current.npsn || '20104829';

    const browser_permissions = {
      ...current.browser_permissions,
      ...(data.browser_permissions || {}),
    };

    // Sinkronisasi timbal balik gps_enabled
    let gps_enabled = current.gps_enabled;
    if (typeof data.gps_enabled === 'boolean') {
      gps_enabled = data.gps_enabled;
      browser_permissions.location_gps = data.gps_enabled;
    } else if (typeof data.browser_permissions?.location_gps === 'boolean') {
      gps_enabled = data.browser_permissions.location_gps;
    }

    const updated = {
      ...current,
      ...data,
      npsn,
      gps_enabled,
      browser_permissions,
      allowed_grades,
    };
    localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: updated }));
    }
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

        // RULE: Password default siswa adalah nomor NIS
        let password = u.password;
        if (u.role === 'student' && (!password || password === u.nisn) && u.nis) {
          password = String(u.nis).trim();
          modified = true;
        }

        if (
          u.is_verified !== isVerified ||
          u.is_active !== isActive ||
          u.google_linked !== googleLinked ||
          u.google_id !== googleId ||
          u.google_email !== googleEmail ||
          u.google_linked_at !== googleLinkedAt ||
          u.password !== password
        ) {
          modified = true;
        }

        return {
          ...u,
          password: password || u.password,
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
      password: String(data.nis || nisn).trim(), // Default password adalah nomor NIS (atau NISN jika NIS kosong)
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

  // Reset Kata Sandi Siswa ke Default (Nomor NIS siswa)
  resetStudentPassword(studentId) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === studentId);
    if (!target) {
      throw new Error('Data peserta tidak ditemukan.');
    }
    const defaultPassword = String(target.nis || target.nisn).trim();
    target.password = defaultPassword;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return target;
  },

  // Reset Tautan Google SSO Siswa (Memutuskan koneksi akun Google & mengembalikan ke login NISN/NIS)
  resetStudentSSO(studentId) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === studentId);
    if (!target) {
      throw new Error('Data peserta tidak ditemukan.');
    }
    target.google_linked = false;
    target.google_id = null;
    target.google_email = null;
    target.google_linked_at = null;
    // Pastikan password tetap terisi nomor NIS
    if (!target.password) {
      target.password = String(target.nis || target.nisn).trim();
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
        password: existingIndex >= 0 ? users[existingIndex].password : String(row.nis || nisn).trim(), // Default password adalah nomor NIS
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

  // Mengambil data kedua akun pengawas (Super Admin & Proktor)
  getAdminAccounts() {
    const users = this.getUsers();
    return {
      superAdmin: users.find((u) => u.role === 'admin' || u.username === 'admin') || null,
      proctor: users.find((u) => u.role === 'proctor' || u.username === 'proktor') || null,
    };
  },

  // Update profil kredensial akun Super Admin atau Proktor
  updateAdminProfile(userId, { username, email, password, nama }) {
    const users = this.getUsers();
    const target = users.find((u) => u.id === userId && (u.role === 'admin' || u.role === 'proctor'));
    if (!target) return { success: false, message: 'Akun pengawas/administrator tidak ditemukan' };

    // Validasi keunikan username
    if (username && username.trim().toLowerCase() !== target.username.toLowerCase()) {
      const cleanUser = username.trim().toLowerCase();
      const duplicate = users.find(
        (u) => u.id !== userId && u.username.toLowerCase() === cleanUser
      );
      if (duplicate) {
        return { success: false, message: `Username "${username}" sudah digunakan oleh akun lain.` };
      }
      target.username = username.trim();
    }

    if (email) target.email = email.trim();
    if (password) target.password = password;
    if (nama) target.nama = nama.trim();

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Update session jika akun yang sedang diedit adalah pengguna yang sedang login
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(target);
    }
    return { success: true, user: target };
  },

  // 3. EXAM SESSIONS & BANK SOAL
  getExamSessions() {
    this.init();
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_SESSIONS)) || [];
      let modified = false;

      const normalized = raw.map((e) => {
        const subject = e.subject || (e.title ? e.title.split('-')[0].trim() : 'Mata Pelajaran Umum');
        const sessionGroup = e.session_group || 'Asesmen Tengah Semester (ATS)';
        const isArchived = typeof e.is_archived === 'boolean' ? e.is_archived : false;
        const examToken = formatExamToken(e.exam_token);

        if (
          e.subject !== subject ||
          e.session_group !== sessionGroup ||
          e.is_archived !== isArchived ||
          e.exam_token !== examToken
        ) {
          modified = true;
        }

        return {
          ...e,
          subject,
          session_group: sessionGroup,
          is_archived: isArchived,
          exam_token: examToken,
        };
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(normalized));
      }
      return normalized;
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
      subject: (examData.subject || 'Mata Pelajaran Umum').trim(),
      session_group: (examData.session_group || 'Asesmen Tengah Semester (ATS)').trim(),
      exam_token: formatExamToken(examData.exam_token),
      grade_level: parseInt(examData.grade_level, 10) || 0,
      duration_minutes: parseInt(examData.duration_minutes, 10) || 60,
      is_active: typeof examData.is_active === 'boolean' ? examData.is_active : true,
      is_archived: typeof examData.is_archived === 'boolean' ? examData.is_archived : false,
    };

    const index = exams.findIndex((e) => e.id === examToSave.id);
    if (index >= 0) {
      exams[index] = examToSave;
    } else {
      exams.push(examToSave);
    }
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
    return examToSave;
  },

  archiveExam(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_archived = true;
      target.is_active = false; // Saat diarsipkan otomatis nonaktif di jadwal aktif siswa
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  restoreExamFromArchive(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_archived = false;
      target.is_active = true; // Otomatis aktif kembali di jadwal ujian
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
    }
    return target;
  },

  deleteExamSession(id) {
    const exams = this.getExamSessions().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
    }
  },

  toggleExamActive(id) {
    const exams = this.getExamSessions();
    const target = exams.find((e) => e.id === id);
    if (target) {
      target.is_active = !target.is_active;
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(exams));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('examguard_storage_updated'));
      }
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

  // 6. CADANGAN & PEMULIHAN SISTEM (BACKUP & RESTORE)
  getFullSystemData() {
    this.init();
    return {
      institution: this.getInstitution(),
      users: this.getUsers(),
      exam_sessions: this.getExamSessions(),
      student_attempts: this.getStudentAttempts(),
    };
  },

  restoreAllData(restoredData) {
    if (!restoredData) throw new Error('Data pemulihan kosong.');
    if (restoredData.institution) {
      localStorage.setItem(STORAGE_KEYS.INSTITUTION, JSON.stringify(restoredData.institution));
    }
    if (restoredData.users && Array.isArray(restoredData.users)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(restoredData.users));
    }
    if (restoredData.exam_sessions && Array.isArray(restoredData.exam_sessions)) {
      localStorage.setItem(STORAGE_KEYS.EXAM_SESSIONS, JSON.stringify(restoredData.exam_sessions));
    }
    if (restoredData.student_attempts && Array.isArray(restoredData.student_attempts)) {
      localStorage.setItem(STORAGE_KEYS.STUDENT_ATTEMPTS, JSON.stringify(restoredData.student_attempts));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('examguard_storage_updated', { detail: restoredData }));
    }
    return true;
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

