/**
 * ExamGuard SQLite Integration Test
 * File: server/test-db.cjs
 *
 * Jalankan: node server/test-db.cjs
 * Memvalidasi semua fungsi dbApi terhadap database SQLite.
 */

'use strict';

const path = require('path');
// Set working directory ke root project
process.chdir(path.resolve(__dirname, '..'));

const { dbApi } = require('./db.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}: ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion gagal');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'Nilai tidak sama'}: got "${a}", expected "${b}"`);
}

console.log('\n========================================');
console.log('  ExamGuard SQLite Integration Tests');
console.log('========================================\n');

// Bersihkan data test lama jika ada run sebelumnya yang gagal
try {
  const prevStudent1 = dbApi.getUserByNisn('9999000001');
  if (prevStudent1) dbApi.deleteUser(prevStudent1.id);
  const prevStudent2 = dbApi.getUserByNisn('9999000002');
  if (prevStudent2) dbApi.deleteUser(prevStudent2.id);
  dbApi.deleteExamSession('TEST-EXAM-001');
} catch {}

// Simpan konfigurasi asli sebelum tes agar tidak merusak data produksi
const _originalInstitution = dbApi.getInstitution();

// ─── 1. Institution ───────────────────────────────────────────────────────────
console.log('📋 Institution:');
test('getInstitution mengembalikan objek', () => {
  const inst = dbApi.getInstitution();
  assert(inst !== null, 'institution harus ada setelah seed');
  assert(typeof inst.name === 'string', 'name harus string');
  assert(Array.isArray(inst.allowed_grades), 'allowed_grades harus array');
  assert(typeof inst.browser_permissions === 'object', 'browser_permissions harus object');
});

test('updateInstitution menyimpan perubahan', () => {
  const updated = dbApi.updateInstitution({ name: 'SMA Test Updated', npsn: '12345678' });
  assertEqual(updated.name, 'SMA Test Updated', 'Nama tidak tersimpan');
  assertEqual(updated.npsn, '12345678', 'NPSN tidak tersimpan');
  // Kembalikan ke default
  if (_originalInstitution?.name) dbApi.updateInstitution({ name: _originalInstitution.name, npsn: _originalInstitution.npsn });
});

test('updateInstitution validasi auth_method', () => {
  const updated = dbApi.updateInstitution({ auth_method: 'BOTH' });
  assertEqual(updated.auth_method, 'BOTH');
  if (_originalInstitution?.auth_method) dbApi.updateInstitution({ auth_method: _originalInstitution.auth_method });
});

// ─── 2. Users ─────────────────────────────────────────────────────────────────
console.log('\n👤 Users:');
test('getUsers mengembalikan minimal 2 user (admin + proctor)', () => {
  const users = dbApi.getUsers();
  assert(Array.isArray(users), 'harus array');
  assert(users.length >= 2, 'harus ada min 2 user');
  assert(users.some(u => u.username === 'admin'), 'harus ada admin');
  assert(users.some(u => u.username === 'proktor'), 'harus ada proktor');
});

test('addStudent menambah peserta baru', () => {
  const result = dbApi.addStudent({
    nisn: '9999000001',
    nama: 'Test Peserta Satu',
    nis: 'T001',
    kelas: 'XII IPA 1',
    tingkat: 12,
    jenis_kelamin: 'L',
    agama: 'Islam',
  });
  assert(result.success, `Gagal: ${result.message}`);
  assert(result.user.nisn === '9999000001', 'NISN tidak match');
  assert(result.user.username === '9999000001', 'username harus = nisn');
});

test('addStudent menolak NISN duplikat', () => {
  const result = dbApi.addStudent({ nisn: '9999000001', nama: 'Duplikat' });
  assert(!result.success, 'harus gagal untuk NISN duplikat');
  assertEqual(result.field, 'nisn');
});

test('getUserByNisn menemukan peserta', () => {
  const user = dbApi.getUserByNisn('9999000001');
  assert(user !== null, 'harus ditemukan');
  assertEqual(user.nama, 'Test Peserta Satu');
});

test('updateStudent mengubah data peserta', () => {
  const user = dbApi.getUserByNisn('9999000001');
  const result = dbApi.updateStudent(user.id, { nama: 'Test Peserta Updated', kelas: 'XII IPS 2' });
  assert(result.success, `Gagal: ${result.message}`);
  assertEqual(result.user.nama, 'Test Peserta Updated');
  assertEqual(result.user.kelas, 'XII IPS 2');
});

test('toggleUserActive mengubah status aktif', () => {
  const user = dbApi.getUserByNisn('9999000001');
  const original = user.is_active;
  const r = dbApi.toggleUserActive(user.id);
  assert(r.success);
  assertEqual(r.user.is_active, !original, 'Status harus berubah');
  // Kembalikan
  dbApi.toggleUserActive(user.id);
});

test('resetStudentSSO memutus Google link', () => {
  const user = dbApi.getUserByNisn('9999000001');
  // Set google_linked dulu
  dbApi.saveUser({ ...user, google_linked: true, google_id: 'fake_id', google_email: 'test@gmail.com' });
  const result = dbApi.resetStudentSSO(user.id);
  assert(!result.google_linked, 'google_linked harus false');
  assert(result.google_id === null, 'google_id harus null');
});

// ─── 3. Exam Sessions ─────────────────────────────────────────────────────────
console.log('\n📚 Exam Sessions:');
test('saveExamSession membuat sesi ujian baru', () => {
  const exam = dbApi.saveExamSession({
    id: 'TEST-EXAM-001',
    subject: 'Matematika',
    title: 'Ujian Matematika Test',
    session_group: 'Penilaian Harian (PH)',
    grade_level: 12,
    exam_token: 'MATHTEST',
    finish_token: 'FINISH01',
    start_time: '2026-12-01T08:00',
    end_time: '2026-12-01T10:00',
  });
  assert(exam !== null, 'harus berhasil');
  assertEqual(exam.id, 'TEST-EXAM-001');
  assertEqual(exam.subject, 'Matematika');
});

test('getExamSessions mengembalikan semua sesi', () => {
  const sessions = dbApi.getExamSessions();
  assert(Array.isArray(sessions), 'harus array');
  assert(sessions.some(e => e.id === 'TEST-EXAM-001'), 'harus ada sesi test');
});

test('archiveExamSession mengarsipkan sesi', () => {
  const exam = dbApi.archiveExamSession('TEST-EXAM-001');
  assert(exam !== null);
  assert(exam.is_archived === true, 'harus terarsip');
  assert(exam.is_active === false, 'harus tidak aktif');
});

test('restoreExamFromArchive memulihkan sesi', () => {
  const exam = dbApi.restoreExamFromArchive('TEST-EXAM-001');
  assert(exam !== null);
  assert(exam.is_archived === false, 'harus tidak terarsip');
  assert(exam.is_active === true, 'harus aktif');
});

// ─── 4. Student Attempts ──────────────────────────────────────────────────────
console.log('\n📝 Student Attempts:');
let testStudentId = null;
let testAttemptId = null;

test('saveAttempt membuat attempt baru', () => {
  const student = dbApi.getUserByNisn('9999000001');
  testStudentId = student.id;

  const attempt = dbApi.saveAttempt({
    student_id: student.id,
    exam_session_id: 'TEST-EXAM-001',
    exam_title: 'Ujian Matematika Test',
    status: 'IN_PROGRESS',
    violation_count: 0,
  });
  assert(attempt !== null, 'harus berhasil');
  assertEqual(attempt.student_id, student.id);
  assertEqual(attempt.status, 'IN_PROGRESS');
  testAttemptId = attempt.id;
});

test('getAttempt menemukan attempt by student + exam', () => {
  const a = dbApi.getAttempt(testStudentId, 'TEST-EXAM-001');
  assert(a !== null, 'harus ditemukan');
  assertEqual(a.status, 'IN_PROGRESS');
});

test('saveAttempt upsert — update violation_count (take max)', () => {
  const student = dbApi.getUserByNisn('9999000001');
  // Set violation_count = 3
  const a = dbApi.saveAttempt({
    student_id: student.id,
    exam_session_id: 'TEST-EXAM-001',
    violation_count: 3,
    status: 'IN_PROGRESS',
  });
  assertEqual(a.violation_count, 3, 'violation_count harus 3');

  // Coba turunkan tanpa reset flag — harus tetap 3 (take max)
  const a2 = dbApi.saveAttempt({
    student_id: student.id,
    exam_session_id: 'TEST-EXAM-001',
    violation_count: 1,
    status: 'IN_PROGRESS',
    is_reset_violations: false,
  });
  assertEqual(a2.violation_count, 3, 'violation_count harus tetap 3 (max)');
});

test('proctorResetViolations mereset violation ke 0', () => {
  const a = dbApi.proctorResetViolations(testStudentId, 'TEST-EXAM-001');
  assert(a !== null);
  assertEqual(a.violation_count, 0, 'harus 0 setelah reset');
  assertEqual(a.is_reset_violations, true);
});

test('proctorResetStudentWork mengubah status ke RESET_BY_PROCTOR', () => {
  const a = dbApi.proctorResetStudentWork(testStudentId, 'TEST-EXAM-001', 'Ujian Test');
  assert(a !== null);
  assertEqual(a.status, 'RESET_BY_PROCTOR');
  assert(a.reset_at !== null, 'reset_at harus terisi');
});

test('proctorSetAttemptCompleted mengubah status ke COMPLETED', () => {
  const a = dbApi.proctorSetAttemptCompleted(testStudentId, 'TEST-EXAM-001', 'Ujian Test');
  assert(a !== null);
  assertEqual(a.status, 'COMPLETED');
  assert(a.completed_at !== null, 'completed_at harus terisi');
});

test('updateAttemptTime memperbarui waktu pengerjaan', () => {
  const a = dbApi.updateAttemptTime(testStudentId, 'TEST-EXAM-001', 1800);
  assert(a !== null);
  assertEqual(a.time_spent_seconds, 1800);
});

// ─── 5. Exam Attendance ───────────────────────────────────────────────────────
console.log('\n📋 Exam Attendance:');
test('updateAttendance menyimpan presensi', () => {
  const rec = dbApi.updateAttendance('TEST-EXAM-001', testStudentId, { status: 'HADIR', keterangan: 'Tepat waktu' }, 'Proktor');
  assert(rec !== null);
  assertEqual(rec.status, 'HADIR');
  assertEqual(rec.keterangan, 'Tepat waktu');
});

test('getAttendance mengambil semua presensi', () => {
  const all = dbApi.getAttendance();
  assert(Array.isArray(all));
  assert(all.some(a => a.student_id === testStudentId), 'harus ada presensi test');
});

test('getAttendance dengan filter examSessionId', () => {
  const filtered = dbApi.getAttendance('TEST-EXAM-001');
  assert(filtered.every(a => a.exam_session_id === 'TEST-EXAM-001'), 'harus semua untuk sesi yang sama');
});

test('updateAttendance upsert — update status', () => {
  const rec = dbApi.updateAttendance('TEST-EXAM-001', testStudentId, { status: 'IZIN', keterangan: 'Sakit' });
  assertEqual(rec.status, 'IZIN');
  assertEqual(rec.keterangan, 'Sakit');
});

// ─── 6. Berita Acara Config ───────────────────────────────────────────────────
console.log('\n📄 Berita Acara Config:');
test('saveBeritaAcaraConfig menyimpan konfigurasi', () => {
  const updated = dbApi.saveBeritaAcaraConfig({
    instansi_pusat: 'Kemendikbud',
    kepala_sekolah_nama: 'Drs. Budi Santoso, M.Pd',
    paper_size: 'A4',
  });
  assertEqual(updated.instansi_pusat, 'Kemendikbud');
  assertEqual(updated.kepala_sekolah_nama, 'Drs. Budi Santoso, M.Pd');
  assertEqual(updated.paper_size, 'A4');
});

test('getBeritaAcaraConfig mengembalikan konfigurasi', () => {
  const config = dbApi.getBeritaAcaraConfig();
  assert(config !== null);
  assert(typeof config.instansi_pusat === 'string');
});

// ─── 7. App Mode Config ───────────────────────────────────────────────────────
console.log('\n🔧 App Mode Config:');
test('getAppModeConfig mengembalikan mode produksi default', () => {
  const config = dbApi.getAppModeConfig();
  assert(config !== null);
  // Default harus production
  assertEqual(config.app_mode, 'production');
  assertEqual(config.bypass_gps, false, 'bypass_gps harus false di production');
  assertEqual(config.bypass_fullscreen, false);
});

test('saveAppModeConfig hanya admin yang bisa aktifkan simulation', () => {
  const result = dbApi.saveAppModeConfig({ app_mode: 'simulation' }, 'student');
  assert(!result.success, 'student tidak boleh mengubah ke simulation');
});

test('saveAppModeConfig admin bisa aktifkan simulation', () => {
  const result = dbApi.saveAppModeConfig({ app_mode: 'simulation', bypass_gps: true }, 'admin');
  assert(result.success, `Gagal: ${result?.message}`);
  assertEqual(result.config.app_mode, 'simulation');
  assertEqual(result.config.bypass_gps, true);
  // Kembalikan ke production
  dbApi.saveAppModeConfig({ app_mode: 'production' }, 'admin');
});

// ─── 8. System Error Logs ─────────────────────────────────────────────────────
console.log('\n🔴 System Error Logs:');
test('addSystemErrorLog menambah log baru', () => {
  const log = dbApi.addSystemErrorLog({
    source: 'GPS',
    level: 'error',
    message: 'GPS tidak tersedia',
    details: 'Permission denied',
    solution: 'Aktifkan izin GPS di peramban',
  });
  assert(log !== null);
  assertEqual(log.source, 'GPS');
  assertEqual(log.level, 'error');
  assert(log.id, 'harus ada ID');
});

test('getSystemErrorLogs mengembalikan log', () => {
  const logs = dbApi.getSystemErrorLogs();
  assert(Array.isArray(logs));
  assert(logs.length > 0, 'harus ada minimal 1 log');
});

test('clearSystemErrorLogs membersihkan semua log', () => {
  dbApi.clearSystemErrorLogs();
  const logs = dbApi.getSystemErrorLogs();
  assertEqual(logs.length, 0, 'harus kosong setelah clear');
});

// ─── 9. Cascade Delete ────────────────────────────────────────────────────────
console.log('\n🗑️  Cascade Delete (Integritas Relasional):');
test('deleteUser cascade hapus attempts & attendance', () => {
  const student = dbApi.getUserByNisn('9999000001');
  if (!student) throw new Error('Student test tidak ditemukan');

  // Verifikasi ada attempt & attendance sebelum hapus
  const attemptsBefore = dbApi.getAttempt(student.id, 'TEST-EXAM-001');
  const attBefore = dbApi.getAttendance('TEST-EXAM-001').find(a => a.student_id === student.id);

  // Hapus user
  dbApi.deleteUser(student.id);

  // Cek cascade: attempt dan attendance harus ikut terhapus
  const attemptsAfter = dbApi.getAttempt(student.id, 'TEST-EXAM-001');
  const attAfter = dbApi.getAttendance('TEST-EXAM-001').find(a => a.student_id === student.id);

  assert(attemptsAfter === null || attemptsAfter === undefined, 'Attempts harus terhapus cascade');
  assert(attAfter === undefined, 'Attendance harus terhapus cascade');
});

test('deleteExamSession cascade hapus attempts & attendance', () => {
  // Pastikan sesi ujian test ada
  if (!dbApi.getExamSessionById('TEST-EXAM-001')) {
    dbApi.saveExamSession({
      id: 'TEST-EXAM-001',
      subject: 'Matematika',
      title: 'Ujian Matematika Test',
      session_group: 'Penilaian Harian (PH)',
      grade_level: 12,
    });
  }

  // Buat data segar
  const r = dbApi.addStudent({ nisn: '9999000002', nama: 'Test Cascade', nis: 'T002' });
  assert(r.success, `Gagal addStudent: ${r.message}`);
  const sid = r.user.id;

  dbApi.saveAttempt({ student_id: sid, exam_session_id: 'TEST-EXAM-001', status: 'IN_PROGRESS' });
  dbApi.updateAttendance('TEST-EXAM-001', sid, { status: 'HADIR' });

  // Hapus exam session
  dbApi.deleteExamSession('TEST-EXAM-001');

  // Cek cascade
  const a = dbApi.getAttempt(sid, 'TEST-EXAM-001');
  const att = dbApi.getAttendance('TEST-EXAM-001').find(x => x.student_id === sid);

  assert(a === null || a === undefined, 'Attempt harus terhapus cascade dengan exam session');
  assert(att === undefined, 'Attendance harus terhapus cascade dengan exam session');

  // Cleanup
  dbApi.deleteUser(sid);
});

// ─── 10. getFullSystemData ────────────────────────────────────────────────────
console.log('\n💾 Full System Data:');
test('getFullSystemData mengembalikan semua entitas', () => {
  const data = dbApi.getFullSystemData();
  assert(data.institution !== null, 'institution harus ada');
  assert(Array.isArray(data.users), 'users harus array');
  assert(Array.isArray(data.exam_sessions), 'exam_sessions harus array');
  assert(Array.isArray(data.student_attempts), 'student_attempts harus array');
  assert(Array.isArray(data.exam_attendance), 'exam_attendance harus array');
  assert(data.exported_at, 'exported_at harus ada');
});

// ─── Hasil ────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`  HASIL: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  console.error('⚠️  Ada test yang gagal! Periksa konfigurasi database.');
  process.exit(1);
} else {
  console.log('🎉 Semua test passed! Database SQLite siap digunakan.');
  process.exit(0);
}
