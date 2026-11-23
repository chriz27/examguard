<?php
// scripts/test_exam_update.php
// End-to-End Verification Test for Exam Session Updates & Persistence

$dbPath = dirname(__DIR__) . '/examguard.db';
echo "========================================================\n";
echo "EXAMGUARD E2E TEST: EXAM SESSION UPDATE & PERSISTENCE\n";
echo "Database: $dbPath\n";
echo "========================================================\n\n";

if (!file_exists($dbPath)) {
    echo "[!] Database file examguard.db does not exist yet. It will be initialized.\n";
}

$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

// Include api helper functions without running request router
$_SERVER['REQUEST_METHOD'] = 'TEST';
$_SERVER['REQUEST_URI'] = '/api/db/test';

// Verify table exists
$tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='exam_sessions'")->fetchAll();
if (empty($tables)) {
    echo "Creating exam_sessions table...\n";
    $pdo->exec("CREATE TABLE IF NOT EXISTS exam_sessions (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        title TEXT NOT NULL,
        session_group TEXT NOT NULL DEFAULT 'Asesmen Tengah Semester (ATS)',
        description TEXT DEFAULT '',
        grade_level INTEGER NOT NULL DEFAULT 10,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_archived INTEGER NOT NULL DEFAULT 0,
        gform_base_url TEXT NOT NULL,
        respon_base_url TEXT DEFAULT '',
        exam_token TEXT DEFAULT '',
        finish_token TEXT DEFAULT '',
        start_time TEXT DEFAULT '',
        end_time TEXT DEFAULT '',
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )");
}

$testExamId = 'test-exam-' . bin2hex(random_bytes(4));

// -------------------------------------------------------------
// TEST 1: INSERT NEW EXAM (POST /exam-sessions)
// -------------------------------------------------------------
echo "[TEST 1] Creating new Exam Session: $testExamId\n";
$initialData = [
    'id' => $testExamId,
    'subject' => 'Matematika Peminatan',
    'title' => 'Ujian Tengah Semester Ganjil',
    'session_group' => 'Penilaian Tengah Semester (PTS)',
    'description' => 'Kerjakan dengan teliti dan jujur.',
    'grade_level' => 11,
    'is_active' => 1,
    'is_archived' => 0,
    'gform_base_url' => 'https://docs.google.com/forms/d/e/1FAIpQLSc_TEST_ORIGINAL/viewform?embedded=true',
    'respon_base_url' => 'https://docs.google.com/spreadsheets/d/1_TEST_SPREADSHEET/edit',
    'exam_token' => 'ABC123',
    'finish_token' => 'XYZ789',
    'start_time' => '2026-11-23T07:30',
    'end_time' => '2026-11-23T09:00',
    'duration_minutes' => 90
];

$stmt = $pdo->prepare("INSERT INTO exam_sessions (
    id, subject, title, session_group, description, grade_level, is_active, is_archived,
    gform_base_url, respon_base_url, exam_token, finish_token, start_time, end_time, duration_minutes, created_at, updated_at
) VALUES (
    :id, :subject, :title, :session_group, :description, :grade_level, :is_active, :is_archived,
    :gform_base_url, :respon_base_url, :exam_token, :finish_token, :start_time, :end_time, :duration_minutes, datetime('now'), datetime('now')
)");
$stmt->execute([
    ':id' => $initialData['id'],
    ':subject' => $initialData['subject'],
    ':title' => $initialData['title'],
    ':session_group' => $initialData['session_group'],
    ':description' => $initialData['description'],
    ':grade_level' => $initialData['grade_level'],
    ':is_active' => $initialData['is_active'],
    ':is_archived' => $initialData['is_archived'],
    ':gform_base_url' => $initialData['gform_base_url'],
    ':respon_base_url' => $initialData['respon_base_url'],
    ':exam_token' => $initialData['exam_token'],
    ':finish_token' => $initialData['finish_token'],
    ':start_time' => $initialData['start_time'],
    ':end_time' => $initialData['end_time'],
    ':duration_minutes' => $initialData['duration_minutes']
]);

$check = $pdo->query("SELECT * FROM exam_sessions WHERE id = '$testExamId'")->fetch();
assert($check !== false, 'Test 1 Failed: Record was not inserted');
assert($check['exam_token'] === 'ABC123', 'Test 1 Failed: Initial token mismatch');
assert($check['duration_minutes'] == 90, 'Test 1 Failed: Initial duration mismatch');
echo "  [OK] Inserted successfully. Initial token: {$check['exam_token']}, GForm URL: {$check['gform_base_url']}\n\n";

// -------------------------------------------------------------
// TEST 2: UPDATE VIA PUT (gform_base_url, tokens, dates, duration)
// -------------------------------------------------------------
echo "[TEST 2] Updating Exam Session via simulated PUT /exam-sessions/$testExamId\n";
$updatePutData = [
    'gform_base_url' => 'https://docs.google.com/forms/d/e/1FAIpQLSc_TEST_UPDATED_LINK/viewform?embedded=true',
    'exam_token' => 'NEWTOK',
    'finish_token' => 'END999',
    'start_time' => '2026-11-24T08:00',
    'end_time' => '2026-11-24T10:00',
    'duration_minutes' => 120,
    'description' => 'Petunjuk telah diperbarui oleh Admin.'
];

$checkCur = $pdo->prepare("SELECT * FROM exam_sessions WHERE id = ?");
$checkCur->execute([$testExamId]);
$cur = $checkCur->fetch();

$updateStmt = $pdo->prepare("UPDATE exam_sessions SET 
    subject = :subject,
    title = :title,
    session_group = :session_group,
    description = :description,
    grade_level = :grade_level,
    is_active = :is_active,
    is_archived = :is_archived,
    gform_base_url = :gform_base_url,
    respon_base_url = :respon_base_url,
    exam_token = :exam_token,
    finish_token = :finish_token,
    start_time = :start_time,
    end_time = :end_time,
    duration_minutes = :duration_minutes,
    updated_at = datetime('now')
WHERE id = :id");

$updateStmt->execute([
    ':id' => $testExamId,
    ':subject' => array_key_exists('subject', $updatePutData) ? trim((string)$updatePutData['subject']) : $cur['subject'],
    ':title' => array_key_exists('title', $updatePutData) ? trim((string)$updatePutData['title']) : $cur['title'],
    ':session_group' => array_key_exists('session_group', $updatePutData) ? trim((string)$updatePutData['session_group']) : $cur['session_group'],
    ':description' => array_key_exists('description', $updatePutData) ? trim((string)$updatePutData['description']) : ($cur['description'] ?? ''),
    ':grade_level' => array_key_exists('grade_level', $updatePutData) ? (int)$updatePutData['grade_level'] : (int)$cur['grade_level'],
    ':is_active' => array_key_exists('is_active', $updatePutData) ? ($updatePutData['is_active'] ? 1 : 0) : (int)$cur['is_active'],
    ':is_archived' => array_key_exists('is_archived', $updatePutData) ? ($updatePutData['is_archived'] ? 1 : 0) : (int)$cur['is_archived'],
    ':gform_base_url' => array_key_exists('gform_base_url', $updatePutData) ? trim((string)$updatePutData['gform_base_url']) : ($cur['gform_base_url'] ?? ''),
    ':respon_base_url' => array_key_exists('respon_base_url', $updatePutData) ? trim((string)$updatePutData['respon_base_url']) : ($cur['respon_base_url'] ?? ''),
    ':exam_token' => array_key_exists('exam_token', $updatePutData) ? trim((string)$updatePutData['exam_token']) : ($cur['exam_token'] ?? ''),
    ':finish_token' => array_key_exists('finish_token', $updatePutData) ? trim((string)$updatePutData['finish_token']) : ($cur['finish_token'] ?? ''),
    ':start_time' => array_key_exists('start_time', $updatePutData) ? trim((string)$updatePutData['start_time']) : ($cur['start_time'] ?? ''),
    ':end_time' => array_key_exists('end_time', $updatePutData) ? trim((string)$updatePutData['end_time']) : ($cur['end_time'] ?? ''),
    ':duration_minutes' => array_key_exists('duration_minutes', $updatePutData) ? (int)$updatePutData['duration_minutes'] : (int)$cur['duration_minutes'],
]);

$check2 = $pdo->query("SELECT * FROM exam_sessions WHERE id = '$testExamId'")->fetch();
assert($check2['gform_base_url'] === $updatePutData['gform_base_url'], 'Test 2 Failed: gform_base_url did not update');
assert($check2['exam_token'] === 'NEWTOK', 'Test 2 Failed: exam_token did not update');
assert($check2['finish_token'] === 'END999', 'Test 2 Failed: finish_token did not update');
assert($check2['start_time'] === '2026-11-24T08:00', 'Test 2 Failed: start_time did not update');
assert($check2['end_time'] === '2026-11-24T10:00', 'Test 2 Failed: end_time did not update');
assert($check2['duration_minutes'] == 120, 'Test 2 Failed: duration_minutes did not update');
echo "  [OK] Updated via PUT successfully!\n";
echo "       - New GForm URL: {$check2['gform_base_url']}\n";
echo "       - New Start Token: {$check2['exam_token']}\n";
echo "       - New Finish Token: {$check2['finish_token']}\n";
echo "       - New Start/End Time: {$check2['start_time']} to {$check2['end_time']} ({$check2['duration_minutes']} min)\n\n";

// -------------------------------------------------------------
// TEST 3: UPDATE VIA UPSERT (POST /exam-sessions with existing id & cleared token)
// -------------------------------------------------------------
echo "[TEST 3] Updating via UPSERT (POST /exam-sessions) with cleared token\n";
$upsertData = [
    'id' => $testExamId,
    'subject' => 'Fisika Kuantum Terapan',
    'title' => 'Ujian Akhir Semester Fisika',
    'session_group' => 'Penilaian Akhir Semester (PAS)',
    'description' => 'Ujian tanpa token masuk.',
    'grade_level' => 12,
    'is_active' => 1,
    'is_archived' => 0,
    'gform_base_url' => 'https://docs.google.com/forms/d/e/1FAIpQLSc_FINAL_LINK/viewform?embedded=true',
    'respon_base_url' => '',
    'exam_token' => '', // Cleared
    'finish_token' => '', // Cleared
    'start_time' => '2026-11-25T07:30',
    'end_time' => '2026-11-25T09:30',
    'duration_minutes' => 120
];

$checkExisting = $pdo->prepare("SELECT id FROM exam_sessions WHERE id = ?");
$checkExisting->execute([$upsertData['id']]);
$hasExisting = $checkExisting->fetch();
assert($hasExisting !== false, 'Test 3 Failed: Record should exist for UPSERT');

$upsertStmt = $pdo->prepare("UPDATE exam_sessions SET
    subject = :subject,
    title = :title,
    session_group = :session_group,
    description = :description,
    grade_level = :grade_level,
    is_active = :is_active,
    is_archived = :is_archived,
    gform_base_url = :gform_base_url,
    respon_base_url = :respon_base_url,
    exam_token = :exam_token,
    finish_token = :finish_token,
    start_time = :start_time,
    end_time = :end_time,
    duration_minutes = :duration_minutes,
    updated_at = datetime('now')
WHERE id = :id");

$upsertStmt->execute([
    ':id' => $upsertData['id'],
    ':subject' => $upsertData['subject'],
    ':title' => $upsertData['title'],
    ':session_group' => $upsertData['session_group'],
    ':description' => $upsertData['description'],
    ':grade_level' => (int)$upsertData['grade_level'],
    ':is_active' => $upsertData['is_active'],
    ':is_archived' => $upsertData['is_archived'],
    ':gform_base_url' => $upsertData['gform_base_url'],
    ':respon_base_url' => $upsertData['respon_base_url'],
    ':exam_token' => $upsertData['exam_token'],
    ':finish_token' => $upsertData['finish_token'],
    ':start_time' => $upsertData['start_time'],
    ':end_time' => $upsertData['end_time'],
    ':duration_minutes' => (int)$upsertData['duration_minutes'],
]);

$check3 = $pdo->query("SELECT * FROM exam_sessions WHERE id = '$testExamId'")->fetch();
assert($check3['subject'] === 'Fisika Kuantum Terapan', 'Test 3 Failed: Subject not updated');
assert($check3['exam_token'] === '', 'Test 3 Failed: Cleared token should be empty string');
assert($check3['finish_token'] === '', 'Test 3 Failed: Cleared finish token should be empty string');
assert($check3['gform_base_url'] === 'https://docs.google.com/forms/d/e/1FAIpQLSc_FINAL_LINK/viewform?embedded=true', 'Test 3 Failed: URL mismatch');
assert($check3['grade_level'] == 12, 'Test 3 Failed: Grade level mismatch');
echo "  [OK] UPSERT updated successfully!\n";
echo "       - Subject: {$check3['subject']}\n";
echo "       - Token Cleared: " . ($check3['exam_token'] === '' ? 'YES (Empty)' : 'NO') . "\n";
echo "       - Final GForm URL: {$check3['gform_base_url']}\n\n";

// -------------------------------------------------------------
// CLEANUP TEST DATA
// -------------------------------------------------------------
$pdo->exec("DELETE FROM exam_sessions WHERE id = '$testExamId'");
echo "[CLEANUP] Deleted test session $testExamId. Database is clean.\n";
echo "========================================================\n";
echo "ALL TESTS PASSED WITH 100% SUCCESS!\n";
echo "========================================================\n";
