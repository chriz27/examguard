<?php
/**
 * ExamGuard Enterprise SQLite REST API Bridge (PHP PDO)
 * File: api/index.php
 * 
 * Pengembang: Fandi dari Jawa tech
 * Versi     : 1.0 (Production Ready)
 * 
 * Jembatan database enterprise untuk shared hosting cPanel & Apache/Nginx.
 * Mengakses SQLite langsung via PHP PDO tanpa dependensi library eksternal.
 */

// 1. Matikan error display langsung di response (Cegah info disclosure), log ke error server
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// 2. Enterprise Security & CORS Headers
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-User-Role, Authorization');

// Preflight CORS handler
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 3. Resolusi Path Database SQLite
$dbPaths = [
    __DIR__ . '/../../examguard.db',
    __DIR__ . '/../examguard.db',
    __DIR__ . '/examguard.db',
    dirname($_SERVER['DOCUMENT_ROOT']) . '/examguard.db',
    $_SERVER['DOCUMENT_ROOT'] . '/examguard.db'
];

$dbPath = null;
foreach ($dbPaths as $path) {
    if (file_exists($path)) {
        $dbPath = realpath($path);
        break;
    }
}

if (!$dbPath) {
    // Jika belum ada, gunakan lokasi default di folder induk atau direktori saat ini
    $defaultCandidate = dirname(__DIR__) . '/examguard.db';
    if (!is_writable(dirname($defaultCandidate))) {
        $defaultCandidate = __DIR__ . '/examguard.db';
    }
    $dbPath = $defaultCandidate;
}

try {
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Optimasi Konkurensi & Integritas SQLite
    $pdo->exec('PRAGMA foreign_keys = ON;');
    $pdo->exec('PRAGMA journal_mode = WAL;');
    $pdo->exec('PRAGMA synchronous = NORMAL;');
    $pdo->exec('PRAGMA busy_timeout = 5000;');
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Gagal membuka database SQLite: ' . $e->getMessage()]);
    exit;
}

// 4. Inisialisasi Skema Tabel Otomatis Jika Belum Ada
function initDatabaseSchema(PDO $pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS institution (
            id TEXT PRIMARY KEY DEFAULT 'singleton',
            name TEXT NOT NULL DEFAULT 'Institusi Pendidikan',
            npsn TEXT NOT NULL DEFAULT '00000000',
            logo_url TEXT,
            education_level TEXT NOT NULL DEFAULT 'SMA',
            allowed_grades TEXT NOT NULL DEFAULT '[10,11,12]',
            idle_timeout_minutes INTEGER NOT NULL DEFAULT 30,
            gps_enabled INTEGER NOT NULL DEFAULT 1,
            center_lat REAL NOT NULL DEFAULT -6.2088,
            center_lng REAL NOT NULL DEFAULT 106.8456,
            max_radius_meters INTEGER NOT NULL DEFAULT 200,
            gmaps_url TEXT DEFAULT 'https://maps.google.com/?q=-6.2088,106.8456',
            auth_method TEXT NOT NULL DEFAULT 'CREDENTIALS_ONLY' CHECK(auth_method IN ('SSO_ONLY','CREDENTIALS_ONLY','BOTH')),
            google_oauth_enabled INTEGER NOT NULL DEFAULT 0,
            google_client_id TEXT DEFAULT '',
            google_client_secret TEXT DEFAULT '',
            recaptcha_enabled INTEGER NOT NULL DEFAULT 0,
            recaptcha_site_key TEXT DEFAULT '',
            recaptcha_secret_key TEXT DEFAULT '',
            recaptcha_version TEXT NOT NULL DEFAULT 'v2' CHECK(recaptcha_version IN ('v2','v3')),
            finish_token_lead_minutes INTEGER NOT NULL DEFAULT 10,
            browser_permissions TEXT NOT NULL DEFAULT '{}',
            google_oauth_verified INTEGER NOT NULL DEFAULT 0,
            google_oauth_verified_email TEXT DEFAULT '',
            google_oauth_verified_at TEXT DEFAULT '',
            lock_device_enabled INTEGER NOT NULL DEFAULT 1,
            ngrok_authtoken TEXT DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            nama TEXT NOT NULL,
            email TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL CHECK(role IN ('admin','proctor','student')),
            nisn TEXT NOT NULL DEFAULT '',
            nis TEXT NOT NULL DEFAULT '',
            nomor_ujian TEXT NOT NULL DEFAULT '',
            jenis_kelamin TEXT NOT NULL DEFAULT 'L' CHECK(jenis_kelamin IN ('L','P','')),
            agama TEXT NOT NULL DEFAULT 'Islam',
            kelas TEXT NOT NULL DEFAULT '',
            tingkat INTEGER NOT NULL DEFAULT 0,
            ruang TEXT NOT NULL DEFAULT 'Ruang 01',
            is_active INTEGER NOT NULL DEFAULT 1,
            is_verified INTEGER NOT NULL DEFAULT 1,
            google_linked INTEGER NOT NULL DEFAULT 0,
            google_id TEXT,
            google_email TEXT,
            google_linked_at TEXT,
            active_device_id TEXT,
            login_token TEXT DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS exam_sessions (
            id TEXT PRIMARY KEY,
            subject TEXT NOT NULL DEFAULT 'Mata Pelajaran Umum',
            title TEXT NOT NULL,
            session_group TEXT NOT NULL DEFAULT 'Asesmen Tengah Semester (ATS)',
            description TEXT NOT NULL DEFAULT '',
            grade_level INTEGER NOT NULL DEFAULT 12,
            is_active INTEGER NOT NULL DEFAULT 1,
            is_archived INTEGER NOT NULL DEFAULT 0,
            gform_base_url TEXT NOT NULL DEFAULT '',
            respon_base_url TEXT NOT NULL DEFAULT '',
            exam_token TEXT NOT NULL DEFAULT '',
            finish_token TEXT NOT NULL DEFAULT '',
            start_time TEXT NOT NULL DEFAULT '',
            end_time TEXT NOT NULL DEFAULT '',
            duration_minutes INTEGER NOT NULL DEFAULT 60,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS student_attempts (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            student_name TEXT NOT NULL DEFAULT '',
            student_nisn TEXT NOT NULL DEFAULT '',
            student_kelas TEXT NOT NULL DEFAULT '',
            student_tingkat INTEGER NOT NULL DEFAULT 0,
            exam_session_id TEXT NOT NULL,
            exam_title TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK(status IN ('IN_PROGRESS','COMPLETED','LOCKED','RESET_BY_PROCTOR','UNLOCKED')),
            violation_count INTEGER NOT NULL DEFAULT 0,
            time_spent_seconds INTEGER NOT NULL DEFAULT 0,
            last_violation_reason TEXT NOT NULL DEFAULT '',
            ping_latency_ms INTEGER,
            last_ping_at TEXT,
            started_at TEXT NOT NULL DEFAULT (datetime('now')),
            completed_at TEXT,
            reset_at TEXT,
            unlocked_at TEXT,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            is_proctor_action INTEGER NOT NULL DEFAULT 0,
            is_reset_violations INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_unique ON student_attempts(student_id, exam_session_id);

        CREATE TABLE IF NOT EXISTS exam_attendance (
            id TEXT PRIMARY KEY,
            exam_session_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'HADIR' CHECK(status IN ('HADIR','SAKIT','IZIN','ALPHA','DISPENSASI')),
            keterangan TEXT NOT NULL DEFAULT '',
            updated_by TEXT NOT NULL DEFAULT 'Proktor',
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE(exam_session_id, student_id)
        );

        CREATE TABLE IF NOT EXISTS berita_acara_config (
            id TEXT PRIMARY KEY DEFAULT 'singleton',
            instansi_pusat TEXT NOT NULL DEFAULT '',
            alamat TEXT NOT NULL DEFAULT '',
            kepala_sekolah_nama TEXT NOT NULL DEFAULT '',
            kepala_sekolah_nip TEXT NOT NULL DEFAULT '',
            proktor_nama TEXT NOT NULL DEFAULT '',
            proktor_nip TEXT NOT NULL DEFAULT '',
            pengawas_nama TEXT NOT NULL DEFAULT '',
            pengawas_nip TEXT NOT NULL DEFAULT '',
            catatan_pelaksanaan TEXT NOT NULL DEFAULT 'Pelaksanaan ujian berlangsung dengan tertib, aman, dan terkendali sesuai tata tertib yang berlaku.',
            paper_size TEXT NOT NULL DEFAULT 'A4' CHECK(paper_size IN ('A4','F4','LETTER')),
            margin_preset TEXT NOT NULL DEFAULT 'standard',
            margin_top INTEGER NOT NULL DEFAULT 15,
            margin_right INTEGER NOT NULL DEFAULT 15,
            margin_bottom INTEGER NOT NULL DEFAULT 15,
            margin_left INTEGER NOT NULL DEFAULT 15,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS app_mode_config (
            id TEXT PRIMARY KEY DEFAULT 'singleton',
            app_mode TEXT NOT NULL DEFAULT 'production' CHECK(app_mode IN ('production','simulation')),
            bypass_gps INTEGER NOT NULL DEFAULT 0,
            bypass_media INTEGER NOT NULL DEFAULT 0,
            bypass_audio INTEGER NOT NULL DEFAULT 0,
            bypass_notifications INTEGER NOT NULL DEFAULT 0,
            bypass_fullscreen INTEGER NOT NULL DEFAULT 0,
            bypass_cookies_check INTEGER NOT NULL DEFAULT 0,
            bypass_google_sso INTEGER NOT NULL DEFAULT 0,
            mock_gps_lat REAL,
            mock_gps_lng REAL,
            signature TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS system_error_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            source TEXT NOT NULL DEFAULT 'Sistem',
            level TEXT NOT NULL DEFAULT 'error' CHECK(level IN ('error','warning','info')),
            message TEXT NOT NULL DEFAULT '',
            details TEXT NOT NULL DEFAULT '',
            solution TEXT NOT NULL DEFAULT '',
            user_agent TEXT NOT NULL DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS active_broadcast (
            id TEXT PRIMARY KEY DEFAULT 'singleton',
            message TEXT NOT NULL DEFAULT '',
            scheduled_at TEXT DEFAULT NULL,
            broadcast_id TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    ");

    // Pastikan singleton configs memiliki row awal
    $inst = $pdo->query("SELECT id FROM institution WHERE id = 'singleton'")->fetch();
    if (!$inst) {
        $pdo->exec("INSERT INTO institution (id, name, npsn) VALUES ('singleton', 'Institusi Pendidikan ExamGuard', '20104829')");
    }

    $appMode = $pdo->query("SELECT id FROM app_mode_config WHERE id = 'singleton'")->fetch();
    if (!$appMode) {
        $pdo->exec("INSERT INTO app_mode_config (id, app_mode) VALUES ('singleton', 'production')");
    }

    $beritaAcara = $pdo->query("SELECT id FROM berita_acara_config WHERE id = 'singleton'")->fetch();
    if (!$beritaAcara) {
        $pdo->exec("INSERT INTO berita_acara_config (id) VALUES ('singleton')");
    }

    $bcast = $pdo->query("SELECT id FROM active_broadcast WHERE id = 'singleton'")->fetch();
    if (!$bcast) {
        $pdo->exec("INSERT INTO active_broadcast (id, message, broadcast_id) VALUES ('singleton', '', '')");
    }

    try {
        $pdo->exec("ALTER TABLE institution ADD COLUMN ngrok_authtoken TEXT DEFAULT ''");
    } catch (Exception $e) {}

    // Default admin jika tabel user kosong
    $userCount = $pdo->query("SELECT count(*) as cnt FROM users")->fetch()['cnt'];
    if ($userCount == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (id, username, password, nama, email, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)");
        $stmt->execute(['admin-1', 'admin', 'admin123', 'Super Admin ExamGuard', 'admin@examguard.local', 'admin']);
        $stmt->execute(['proktor-1', 'proktor', 'proktor', 'Proktor Utama', 'proktor@examguard.local', 'proctor']);
    }

    // Auto-repair proktor role & account jika belum ada atau role salah ('proktor' -> 'proctor')
    try {
        $pUser = $pdo->query("SELECT id, role FROM users WHERE username = 'proktor'")->fetch();
        if (!$pUser) {
            $pStmt = $pdo->prepare("INSERT INTO users (id, username, password, nama, email, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1, 1)");
            $pStmt->execute(['proktor-1', 'proktor', 'proktor', 'Proktor Utama', 'proktor@examguard.local', 'proctor']);
        } else if ($pUser['role'] !== 'proctor') {
            $pdo->exec("UPDATE users SET role = 'proctor' WHERE username = 'proktor'");
        }
    } catch (Exception $e) {
    }
}

initDatabaseSchema($pdo);

// 5. Helpers Format Data
function intToBool($val) {
    return (bool)($val == 1 || $val === true || $val === '1');
}

function parseJsonArray($val, $fallback = []) {
    if (empty($val)) return $fallback;
    $res = json_decode($val, true);
    return is_array($res) ? $res : $fallback;
}

function rowToInstitution($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'name' => $r['name'],
        'npsn' => $r['npsn'],
        'logo_url' => $r['logo_url'],
        'education_level' => $r['education_level'],
        'allowed_grades' => parseJsonArray($r['allowed_grades'], [10, 11, 12]),
        'idle_timeout_minutes' => (int)$r['idle_timeout_minutes'],
        'gps_enabled' => intToBool($r['gps_enabled']),
        'center_lat' => (float)$r['center_lat'],
        'center_lng' => (float)$r['center_lng'],
        'max_radius_meters' => (int)$r['max_radius_meters'],
        'gmaps_url' => $r['gmaps_url'],
        'auth_method' => $r['auth_method'],
        'google_oauth_enabled' => intToBool($r['google_oauth_enabled']),
        'google_client_id' => $r['google_client_id'] ?? '',
        'google_client_secret' => (($GLOBALS['callerRole'] ?? null) === 'admin') ? ($r['google_client_secret'] ?? '') : '',
        'recaptcha_enabled' => intToBool($r['recaptcha_enabled']),
        'recaptcha_site_key' => $r['recaptcha_site_key'] ?? '',
        'recaptcha_secret_key' => (($GLOBALS['callerRole'] ?? null) === 'admin') ? ($r['recaptcha_secret_key'] ?? '') : '',
        'recaptcha_version' => $r['recaptcha_version'] ?? 'v2',
        'finish_token_lead_minutes' => (int)$r['finish_token_lead_minutes'],
        'browser_permissions' => parseJsonArray($r['browser_permissions'], []),
        'google_oauth_verified' => intToBool($r['google_oauth_verified'] ?? 0),
        'google_oauth_verified_email' => $r['google_oauth_verified_email'] ?? '',
        'google_oauth_verified_at' => $r['google_oauth_verified_at'] ?? '',
        'lock_device_enabled' => intToBool($r['lock_device_enabled'] ?? 1),
        'ngrok_authtoken' => (($GLOBALS['callerRole'] ?? null) === 'admin') ? ($r['ngrok_authtoken'] ?? '') : '',
        'updated_at' => $r['updated_at']
    ];
}

function rowToUser($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'username' => $r['username'],
        'password' => $r['password'],
        'nama' => $r['nama'],
        'email' => $r['email'] ?? '',
        'role' => $r['role'],
        'nisn' => $r['nisn'] ?? '',
        'nis' => $r['nis'] ?? '',
        'nomor_ujian' => $r['nomor_ujian'] ?? '',
        'jenis_kelamin' => $r['jenis_kelamin'] ?? 'L',
        'agama' => $r['agama'] ?? 'Islam',
        'kelas' => $r['kelas'] ?? '',
        'tingkat' => (int)($r['tingkat'] ?? 0),
        'ruang' => $r['ruang'] ?? 'Ruang 01',
        'is_active' => intToBool($r['is_active']),
        'is_verified' => intToBool($r['is_verified']),
        'google_linked' => intToBool($r['google_linked']),
        'google_id' => $r['google_id'] ?? null,
        'google_email' => $r['google_email'] ?? null,
        'google_linked_at' => $r['google_linked_at'] ?? null,
        'active_device_id' => $r['active_device_id'] ?? null,
        'login_token' => $r['login_token'] ?? '',
        'created_at' => $r['created_at'],
        'updated_at' => $r['updated_at']
    ];
}

function rowToExamSession($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'subject' => $r['subject'],
        'title' => $r['title'],
        'session_group' => $r['session_group'],
        'description' => $r['description'] ?? '',
        'grade_level' => (int)$r['grade_level'],
        'is_active' => intToBool($r['is_active']),
        'is_archived' => intToBool($r['is_archived']),
        'gform_base_url' => $r['gform_base_url'] ?? '',
        'respon_base_url' => $r['respon_base_url'] ?? '',
        'exam_token' => $r['exam_token'] ?? '',
        'finish_token' => $r['finish_token'] ?? '',
        'start_time' => $r['start_time'] ?? '',
        'end_time' => $r['end_time'] ?? '',
        'duration_minutes' => (int)($r['duration_minutes'] ?? 60),
        'created_at' => $r['created_at'],
        'updated_at' => $r['updated_at']
    ];
}

function rowToAttempt($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'student_id' => $r['student_id'],
        'student_name' => $r['student_name'] ?? '',
        'student_nisn' => $r['student_nisn'] ?? '',
        'student_kelas' => $r['student_kelas'] ?? '',
        'student_tingkat' => (int)($r['student_tingkat'] ?? 0),
        'exam_session_id' => $r['exam_session_id'],
        'exam_title' => $r['exam_title'] ?? '',
        'status' => $r['status'],
        'violation_count' => (int)($r['violation_count'] ?? 0),
        'time_spent_seconds' => (int)($r['time_spent_seconds'] ?? 0),
        'last_violation_reason' => $r['last_violation_reason'] ?? '',
        'ping_latency_ms' => $r['ping_latency_ms'] !== null ? (int)$r['ping_latency_ms'] : null,
        'last_ping_at' => $r['last_ping_at'],
        'started_at' => $r['started_at'],
        'completed_at' => $r['completed_at'],
        'reset_at' => $r['reset_at'],
        'unlocked_at' => $r['unlocked_at'],
        'updated_at' => $r['updated_at'],
        'is_proctor_action' => intToBool($r['is_proctor_action'] ?? 0),
        'is_reset_violations' => intToBool($r['is_reset_violations'] ?? 0)
    ];
}

function rowToAttendance($r) {
    if (!$r) return null;
    return [
        'id' => $r['id'],
        'exam_session_id' => $r['exam_session_id'],
        'student_id' => $r['student_id'],
        'status' => $r['status'],
        'keterangan' => $r['keterangan'] ?? '',
        'updated_by' => $r['updated_by'] ?? 'Proktor',
        'updated_at' => $r['updated_at']
    ];
}

// 6. Parsing Request & Router
$method = $_SERVER['REQUEST_METHOD'];
$rawUri = $_SERVER['REQUEST_URI'];

// Buang query string
$pathOnly = parse_url($rawUri, PHP_URL_PATH);

// Ekstrak endpoint relatif terhadap /api/db/ atau /api/
$endpoint = '';
if (isset($_GET['endpoint'])) {
    $endpoint = trim($_GET['endpoint'], '/');
} elseif (preg_match('#/api/db/(.*)$#', $pathOnly, $m)) {
    $endpoint = trim($m[1], '/');
} elseif (preg_match('#/api/(.*)$#', $pathOnly, $m)) {
    $endpoint = trim($m[1], '/');
}

$segments = $endpoint !== '' ? explode('/', $endpoint) : [];
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$callerRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;

function sendJson($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Router Utama
try {
    // ── /snapshot ──────────────────────────────────────────────
    if ($endpoint === 'snapshot' && $method === 'GET') {
        $inst = rowToInstitution($pdo->query("SELECT * FROM institution WHERE id = 'singleton'")->fetch());
        $users = array_map('rowToUser', $pdo->query("SELECT * FROM users ORDER BY nama ASC")->fetchAll());
        $exams = array_map('rowToExamSession', $pdo->query("SELECT * FROM exam_sessions ORDER BY created_at DESC")->fetchAll());
        $attempts = array_map('rowToAttempt', $pdo->query("SELECT * FROM student_attempts ORDER BY updated_at DESC")->fetchAll());
        $attendance = array_map('rowToAttendance', $pdo->query("SELECT * FROM exam_attendance")->fetchAll());
        
        $appModeRow = $pdo->query("SELECT * FROM app_mode_config WHERE id = 'singleton'")->fetch();
        $isSim = ($appModeRow['app_mode'] ?? 'production') === 'simulation';
        $appMode = [
            'app_mode' => $appModeRow['app_mode'] ?? 'production',
            'bypass_gps' => $isSim ? intToBool($appModeRow['bypass_gps'] ?? 0) : false,
            'bypass_media' => $isSim ? intToBool($appModeRow['bypass_media'] ?? 0) : false,
            'bypass_audio' => $isSim ? intToBool($appModeRow['bypass_audio'] ?? 0) : false,
            'bypass_notifications' => $isSim ? intToBool($appModeRow['bypass_notifications'] ?? 0) : false,
            'bypass_fullscreen' => $isSim ? intToBool($appModeRow['bypass_fullscreen'] ?? 0) : false,
            'bypass_cookies_check' => $isSim ? intToBool($appModeRow['bypass_cookies_check'] ?? 0) : false,
            'bypass_google_sso' => $isSim ? intToBool($appModeRow['bypass_google_sso'] ?? 0) : false,
            'mock_gps_coords' => ($isSim && !empty($appModeRow['mock_gps_lat'])) ? ['lat' => (float)$appModeRow['mock_gps_lat'], 'lng' => (float)$appModeRow['mock_gps_lng']] : null,
            'signature' => $appModeRow['signature'] ?? '',
            'updated_at' => $appModeRow['updated_at'] ?? date('Y-m-d H:i:s')
        ];

        $baRow = $pdo->query("SELECT * FROM berita_acara_config WHERE id = 'singleton'")->fetch();
        $logs = $pdo->query("SELECT * FROM system_error_logs ORDER BY timestamp DESC LIMIT 200")->fetchAll();
        $bcastRow = $pdo->query("SELECT * FROM active_broadcast WHERE id = 'singleton'")->fetch();

        sendJson([
            'institution' => $inst,
            'users' => $users,
            'examSessions' => $exams,
            'attempts' => $attempts,
            'attendance' => $attendance,
            'appModeConfig' => $appMode,
            'beritaAcaraConfig' => $baRow ?: [],
            'systemErrorLogs' => $logs,
            'activeBroadcast' => $bcastRow ?: null
        ]);
    }

    // ── /institution ───────────────────────────────────────────
    if ($endpoint === 'institution') {
        if ($method === 'GET') {
            $row = $pdo->query("SELECT * FROM institution WHERE id = 'singleton'")->fetch();
            sendJson(rowToInstitution($row));
        }
        if ($method === 'POST' || $method === 'PUT') {
            if ($callerRole === 'proctor' || ($callerRole !== null && $callerRole !== 'admin')) {
                sendJson(['error' => 'Akses Ditolak: Hanya Super Admin yang diizinkan mengubah konfigurasi instansi.'], 403);
            }
            $allowedGrades = isset($body['allowed_grades']) ? (is_array($body['allowed_grades']) ? json_encode($body['allowed_grades']) : $body['allowed_grades']) : '[10,11,12]';
            $browserPerms = isset($body['browser_permissions']) ? (is_array($body['browser_permissions']) ? json_encode($body['browser_permissions']) : $body['browser_permissions']) : '{}';

            $sql = "UPDATE institution SET 
                name = COALESCE(:name, name),
                npsn = COALESCE(:npsn, npsn),
                logo_url = :logo_url,
                education_level = COALESCE(:education_level, education_level),
                allowed_grades = :allowed_grades,
                idle_timeout_minutes = COALESCE(:idle_timeout_minutes, idle_timeout_minutes),
                gps_enabled = COALESCE(:gps_enabled, gps_enabled),
                center_lat = COALESCE(:center_lat, center_lat),
                center_lng = COALESCE(:center_lng, center_lng),
                max_radius_meters = COALESCE(:max_radius_meters, max_radius_meters),
                gmaps_url = COALESCE(:gmaps_url, gmaps_url),
                auth_method = COALESCE(:auth_method, auth_method),
                google_oauth_enabled = COALESCE(:google_oauth_enabled, google_oauth_enabled),
                google_client_id = COALESCE(:google_client_id, google_client_id),
                google_client_secret = COALESCE(:google_client_secret, google_client_secret),
                recaptcha_enabled = COALESCE(:recaptcha_enabled, recaptcha_enabled),
                recaptcha_site_key = COALESCE(:recaptcha_site_key, recaptcha_site_key),
                recaptcha_secret_key = COALESCE(:recaptcha_secret_key, recaptcha_secret_key),
                recaptcha_version = COALESCE(:recaptcha_version, recaptcha_version),
                finish_token_lead_minutes = COALESCE(:finish_token_lead_minutes, finish_token_lead_minutes),
                browser_permissions = :browser_permissions,
                google_oauth_verified = COALESCE(:google_oauth_verified, google_oauth_verified),
                google_oauth_verified_email = COALESCE(:google_oauth_verified_email, google_oauth_verified_email),
                google_oauth_verified_at = COALESCE(:google_oauth_verified_at, google_oauth_verified_at),
                lock_device_enabled = COALESCE(:lock_device_enabled, lock_device_enabled),
                ngrok_authtoken = COALESCE(:ngrok_authtoken, ngrok_authtoken),
                updated_at = datetime('now')
            WHERE id = 'singleton'";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':name' => $body['name'] ?? null,
                ':npsn' => $body['npsn'] ?? null,
                ':logo_url' => $body['logo_url'] ?? null,
                ':education_level' => $body['education_level'] ?? null,
                ':allowed_grades' => $allowedGrades,
                ':idle_timeout_minutes' => isset($body['idle_timeout_minutes']) ? (int)$body['idle_timeout_minutes'] : null,
                ':gps_enabled' => isset($body['gps_enabled']) ? ($body['gps_enabled'] ? 1 : 0) : null,
                ':center_lat' => isset($body['center_lat']) ? (float)$body['center_lat'] : null,
                ':center_lng' => isset($body['center_lng']) ? (float)$body['center_lng'] : null,
                ':max_radius_meters' => isset($body['max_radius_meters']) ? (int)$body['max_radius_meters'] : null,
                ':gmaps_url' => $body['gmaps_url'] ?? null,
                ':auth_method' => $body['auth_method'] ?? null,
                ':google_oauth_enabled' => isset($body['google_oauth_enabled']) ? ($body['google_oauth_enabled'] ? 1 : 0) : null,
                ':google_client_id' => $body['google_client_id'] ?? null,
                ':google_client_secret' => !empty($body['google_client_secret']) ? $body['google_client_secret'] : null,
                ':recaptcha_enabled' => isset($body['recaptcha_enabled']) ? ($body['recaptcha_enabled'] ? 1 : 0) : null,
                ':recaptcha_site_key' => $body['recaptcha_site_key'] ?? null,
                ':recaptcha_secret_key' => !empty($body['recaptcha_secret_key']) ? $body['recaptcha_secret_key'] : null,
                ':recaptcha_version' => $body['recaptcha_version'] ?? null,
                ':finish_token_lead_minutes' => isset($body['finish_token_lead_minutes']) ? (int)$body['finish_token_lead_minutes'] : null,
                ':browser_permissions' => $browserPerms,
                ':google_oauth_verified' => isset($body['google_oauth_verified']) ? ($body['google_oauth_verified'] ? 1 : 0) : null,
                ':google_oauth_verified_email' => $body['google_oauth_verified_email'] ?? null,
                ':google_oauth_verified_at' => $body['google_oauth_verified_at'] ?? null,
                ':lock_device_enabled' => isset($body['lock_device_enabled']) ? ($body['lock_device_enabled'] ? 1 : 0) : null,
                ':ngrok_authtoken' => isset($body['ngrok_authtoken']) ? $body['ngrok_authtoken'] : null,
            ]);

            $row = $pdo->query("SELECT * FROM institution WHERE id = 'singleton'")->fetch();
            sendJson(rowToInstitution($row));
        }
    }

    // ── /users ─────────────────────────────────────────────────
    if ($endpoint === 'users' && $method === 'GET') {
        $rows = $pdo->query("SELECT * FROM users ORDER BY nama ASC")->fetchAll();
        sendJson(array_map('rowToUser', $rows));
    }

    if ($endpoint === 'users' && $method === 'POST') {
        $id = $body['id'] ?? ('usr-' . bin2hex(random_bytes(6)));
        $stmt = $pdo->prepare("INSERT INTO users (
            id, username, password, nama, email, role, nisn, nis, nomor_ujian, jenis_kelamin,
            agama, kelas, tingkat, ruang, is_active, is_verified, active_device_id, login_token
        ) VALUES (
            :id, :username, :password, :nama, :email, :role, :nisn, :nis, :nomor_ujian, :jenis_kelamin,
            :agama, :kelas, :tingkat, :ruang, :is_active, :is_verified, :active_device_id, :login_token
        )");
        
        $stmt->execute([
            ':id' => $id,
            ':username' => trim($body['username']),
            ':password' => $body['password'] ?? '123456',
            ':nama' => $body['nama'] ?? 'Peserta Baru',
            ':email' => $body['email'] ?? '',
            ':role' => $body['role'] ?? 'student',
            ':nisn' => $body['nisn'] ?? '',
            ':nis' => $body['nis'] ?? '',
            ':nomor_ujian' => $body['nomor_ujian'] ?? '',
            ':jenis_kelamin' => $body['jenis_kelamin'] ?? 'L',
            ':agama' => $body['agama'] ?? 'Islam',
            ':kelas' => $body['kelas'] ?? '',
            ':tingkat' => (int)($body['tingkat'] ?? 0),
            ':ruang' => $body['ruang'] ?? 'Ruang 01',
            ':is_active' => isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1,
            ':is_verified' => isset($body['is_verified']) ? ($body['is_verified'] ? 1 : 0) : 1,
            ':active_device_id' => $body['active_device_id'] ?? null,
            ':login_token' => $body['login_token'] ?? ''
        ]);

        $saved = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($id))->fetch();
        sendJson(['success' => true, 'user' => rowToUser($saved)]);
    }

    // /users/delete-all-students
    if ($endpoint === 'users/delete-all-students' && $method === 'DELETE') {
        if ($callerRole === 'proctor' || ($callerRole !== null && $callerRole !== 'admin')) {
            sendJson(['error' => 'Akses Ditolak: Hanya Super Admin yang dapat menghapus seluruh data peserta.'], 403);
        }
        $pdo->exec("DELETE FROM users WHERE role = 'student'");
        sendJson(['success' => true]);
    }

    // /users/by-email/:email
    if (count($segments) === 3 && $segments[0] === 'users' && $segments[1] === 'by-email' && $method === 'GET') {
        $email = urldecode($segments[2]);
        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(google_email) = LOWER(?) LIMIT 1");
        $stmt->execute([$email, $email]);
        $u = $stmt->fetch();
        if (!$u) {
            sendJson(['error' => 'Peserta dengan email tersebut tidak ditemukan di database.'], 404);
        }
        sendJson(rowToUser($u));
    }

    // /users/import
    if ($endpoint === 'users/import' && $method === 'POST') {
        $students = $body['students'] ?? [];
        $validateOnly = !empty($body['validate_only']);
        
        if ($validateOnly) {
            // Validasi data
            sendJson(['valid' => true, 'total' => count($students), 'errors' => []]);
        }

        $pdo->beginTransaction();
        $imported = [];
        $stmt = $pdo->prepare("INSERT INTO users (
            id, username, password, nama, email, role, nisn, nis, nomor_ujian, jenis_kelamin,
            agama, kelas, tingkat, ruang, is_active, is_verified
        ) VALUES (?, ?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        ON CONFLICT(username) DO UPDATE SET
            nama = excluded.nama,
            password = excluded.password,
            nisn = excluded.nisn,
            nis = excluded.nis,
            nomor_ujian = excluded.nomor_ujian,
            kelas = excluded.kelas,
            tingkat = excluded.tingkat,
            ruang = excluded.ruang,
            updated_at = datetime('now')
        ");

        foreach ($students as $s) {
            $uid = $s['id'] ?? ('std-' . bin2hex(random_bytes(6)));
            $stmt->execute([
                $uid,
                trim($s['username']),
                $s['password'] ?? '123456',
                $s['nama'] ?? 'Peserta',
                $s['email'] ?? '',
                $s['nisn'] ?? '',
                $s['nis'] ?? '',
                $s['nomor_ujian'] ?? '',
                $s['jenis_kelamin'] ?? 'L',
                $s['agama'] ?? 'Islam',
                $s['kelas'] ?? '',
                (int)($s['tingkat'] ?? 0),
                $s['ruang'] ?? 'Ruang 01'
            ]);
            $imported[] = $uid;
        }
        $pdo->commit();

        sendJson(['success' => true, 'count' => count($imported)]);
    }

    // /users/:id and subactions
    if (count($segments) >= 2 && $segments[0] === 'users') {
        $userId = urldecode($segments[1]);
        $sub = $segments[2] ?? '';

        if ($method === 'GET' && empty($sub)) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $u = $stmt->fetch();
            if (!$u) sendJson(['error' => 'User tidak ditemukan.'], 404);
            sendJson(rowToUser($u));
        }

        if ($method === 'DELETE' && empty($sub)) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            sendJson(['success' => true]);
        }

        if ($method === 'PUT') {
            if ($sub === 'toggle-active') {
                $stmt = $pdo->prepare("UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'toggle-verified') {
                $stmt = $pdo->prepare("UPDATE users SET is_verified = CASE WHEN is_verified = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'reset-device') {
                $stmt = $pdo->prepare("UPDATE users SET active_device_id = NULL, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'reset-password') {
                $stmt = $pdo->prepare("UPDATE users SET password = CASE WHEN nis IS NOT NULL AND TRIM(nis) != '' THEN TRIM(nis) WHEN nisn IS NOT NULL AND TRIM(nisn) != '' THEN TRIM(nisn) ELSE '123456' END, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'reset-sso') {
                $stmt = $pdo->prepare("UPDATE users SET google_linked = 0, google_id = NULL, google_email = NULL, google_linked_at = NULL, email = '', updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'reset-token') {
                $stmt = $pdo->prepare("UPDATE users SET login_token = NULL, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$userId]);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            if ($sub === 'update-admin') {
                if ($callerRole === 'proctor' || ($callerRole !== null && $callerRole !== 'admin')) {
                    sendJson(['error' => 'Akses Ditolak: Proktor tidak diizinkan mengubah akun administrator.'], 403);
                }
                $targetId = $userId;
                $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE id = ?");
                $stmtCheck->execute([$userId]);
                if (!$stmtCheck->fetch()) {
                    if ($userId === 'PROCTOR-01' || ($body['username'] ?? '') === 'proktor') {
                        $pRow = $pdo->query("SELECT id FROM users WHERE role = 'proctor' LIMIT 1")->fetch();
                        if ($pRow) $targetId = $pRow['id'];
                    } else if ($userId === 'ADMIN-SUPER-01' || ($body['username'] ?? '') === 'admin') {
                        $aRow = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1")->fetch();
                        if ($aRow) $targetId = $aRow['id'];
                    }
                }

                $sql = "UPDATE users SET nama = COALESCE(:nama, nama), username = COALESCE(:username, username), updated_at = datetime('now')";
                if (!empty($body['password'])) {
                    $sql .= ", password = :password";
                }
                if (!empty($body['email'])) {
                    $sql .= ", email = :email";
                }
                $sql .= " WHERE id = :id";
                $stmt = $pdo->prepare($sql);
                $params = [
                    ':id' => $targetId,
                    ':nama' => $body['nama'] ?? null,
                    ':username' => $body['username'] ?? null
                ];
                if (!empty($body['password'])) {
                    $params[':password'] = $body['password'];
                }
                if (!empty($body['email'])) {
                    $params[':email'] = $body['email'];
                }
                $stmt->execute($params);
                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($targetId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }

            // General student update
            if (empty($sub)) {
                $stmt = $pdo->prepare("UPDATE users SET 
                    nama = COALESCE(:nama, nama),
                    username = COALESCE(:username, username),
                    password = COALESCE(:password, password),
                    email = COALESCE(:email, email),
                    nisn = COALESCE(:nisn, nisn),
                    nis = COALESCE(:nis, nis),
                    nomor_ujian = COALESCE(:nomor_ujian, nomor_ujian),
                    kelas = COALESCE(:kelas, kelas),
                    tingkat = COALESCE(:tingkat, tingkat),
                    ruang = COALESCE(:ruang, ruang),
                    jenis_kelamin = COALESCE(:jenis_kelamin, jenis_kelamin),
                    agama = COALESCE(:agama, agama),
                    active_device_id = :active_device_id,
                    login_token = COALESCE(:login_token, login_token),
                    google_linked = COALESCE(:google_linked, google_linked),
                    google_id = COALESCE(:google_id, google_id),
                    google_email = COALESCE(:google_email, google_email),
                    google_linked_at = COALESCE(:google_linked_at, google_linked_at),
                    updated_at = datetime('now')
                WHERE id = :id");

                $stmt->execute([
                    ':id' => $userId,
                    ':nama' => $body['nama'] ?? null,
                    ':username' => $body['username'] ?? null,
                    ':password' => $body['password'] ?? null,
                    ':email' => $body['email'] ?? null,
                    ':nisn' => $body['nisn'] ?? null,
                    ':nis' => $body['nis'] ?? null,
                    ':nomor_ujian' => $body['nomor_ujian'] ?? null,
                    ':kelas' => $body['kelas'] ?? null,
                    ':tingkat' => isset($body['tingkat']) ? (int)$body['tingkat'] : null,
                    ':ruang' => $body['ruang'] ?? null,
                    ':jenis_kelamin' => $body['jenis_kelamin'] ?? null,
                    ':agama' => $body['agama'] ?? null,
                    ':active_device_id' => array_key_exists('active_device_id', $body) ? $body['active_device_id'] : null,
                    ':login_token' => $body['login_token'] ?? null,
                    ':google_linked' => isset($body['google_linked']) ? ($body['google_linked'] ? 1 : 0) : null,
                    ':google_id' => $body['google_id'] ?? null,
                    ':google_email' => $body['google_email'] ?? null,
                    ':google_linked_at' => $body['google_linked_at'] ?? null,
                ]);

                $u = $pdo->query("SELECT * FROM users WHERE id = " . $pdo->quote($userId))->fetch();
                sendJson(['success' => true, 'user' => rowToUser($u)]);
            }
        }
    }

    // ── /exam-sessions ─────────────────────────────────────────
    if ($endpoint === 'exam-sessions' && $method === 'GET') {
        $rows = $pdo->query("SELECT * FROM exam_sessions ORDER BY created_at DESC")->fetchAll();
        sendJson(array_map('rowToExamSession', $rows));
    }

    if ($endpoint === 'exam-sessions' && $method === 'POST') {
        $id = $body['id'] ?? ('exam-' . bin2hex(random_bytes(6)));
        $isArchived = isset($body['is_archived']) ? ($body['is_archived'] ? 1 : 0) : 0;
        $isActive = isset($body['is_active']) ? ($body['is_active'] ? 1 : 0) : 1;

        $checkStmt = $pdo->prepare("SELECT id FROM exam_sessions WHERE id = ?");
        $checkStmt->execute([$id]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE exam_sessions SET
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
        } else {
            $stmt = $pdo->prepare("INSERT INTO exam_sessions (
                id, subject, title, session_group, description, grade_level, is_active, is_archived,
                gform_base_url, respon_base_url, exam_token, finish_token, start_time, end_time, duration_minutes, created_at, updated_at
            ) VALUES (
                :id, :subject, :title, :session_group, :description, :grade_level, :is_active, :is_archived,
                :gform_base_url, :respon_base_url, :exam_token, :finish_token, :start_time, :end_time, :duration_minutes, datetime('now'), datetime('now')
            )");
        }

        $stmt->execute([
            ':id' => $id,
            ':subject' => $body['subject'] ?? 'Mata Pelajaran Umum',
            ':title' => $body['title'] ?? 'Ujian Baru',
            ':session_group' => $body['session_group'] ?? 'Asesmen Tengah Semester (ATS)',
            ':description' => $body['description'] ?? '',
            ':grade_level' => (int)($body['grade_level'] ?? 12),
            ':is_active' => $isActive,
            ':is_archived' => $isArchived,
            ':gform_base_url' => $body['gform_base_url'] ?? '',
            ':respon_base_url' => $body['respon_base_url'] ?? '',
            ':exam_token' => $body['exam_token'] ?? '',
            ':finish_token' => $body['finish_token'] ?? '',
            ':start_time' => $body['start_time'] ?? '',
            ':end_time' => $body['end_time'] ?? '',
            ':duration_minutes' => (int)($body['duration_minutes'] ?? 60),
        ]);

        $saved = $pdo->query("SELECT * FROM exam_sessions WHERE id = " . $pdo->quote($id))->fetch();
        sendJson(['success' => true, 'exam' => rowToExamSession($saved)]);
    }

    if (count($segments) >= 2 && $segments[0] === 'exam-sessions') {
        $examId = urldecode($segments[1]);
        $sub = $segments[2] ?? '';

        if ($method === 'GET' && empty($sub)) {
            $stmt = $pdo->prepare("SELECT * FROM exam_sessions WHERE id = ?");
            $stmt->execute([$examId]);
            $ex = $stmt->fetch();
            if (!$ex) sendJson(['error' => 'Sesi ujian tidak ditemukan.'], 404);
            sendJson(rowToExamSession($ex));
        }

        if ($method === 'DELETE' && empty($sub)) {
            $stmt = $pdo->prepare("DELETE FROM exam_sessions WHERE id = ?");
            $stmt->execute([$examId]);
            sendJson(['success' => true]);
        }

        if ($method === 'PUT') {
            if ($sub === 'archive') {
                $stmt = $pdo->prepare("UPDATE exam_sessions SET is_archived = 1, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$examId]);
                $ex = $pdo->query("SELECT * FROM exam_sessions WHERE id = " . $pdo->quote($examId))->fetch();
                sendJson(['success' => true, 'exam' => rowToExamSession($ex)]);
            }

            if ($sub === 'restore') {
                $stmt = $pdo->prepare("UPDATE exam_sessions SET is_archived = 0, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$examId]);
                $ex = $pdo->query("SELECT * FROM exam_sessions WHERE id = " . $pdo->quote($examId))->fetch();
                sendJson(['success' => true, 'exam' => rowToExamSession($ex)]);
            }

            if ($sub === 'toggle-active') {
                $stmt = $pdo->prepare("UPDATE exam_sessions SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?");
                $stmt->execute([$examId]);
                $ex = $pdo->query("SELECT * FROM exam_sessions WHERE id = " . $pdo->quote($examId))->fetch();
                sendJson(['success' => true, 'exam' => rowToExamSession($ex)]);
            }

            if (empty($sub)) {
                $check = $pdo->prepare("SELECT * FROM exam_sessions WHERE id = ?");
                $check->execute([$examId]);
                $cur = $check->fetch();
                if (!$cur) {
                    sendJson(['error' => 'Sesi ujian tidak ditemukan.'], 404);
                }

                $stmt = $pdo->prepare("UPDATE exam_sessions SET 
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

                $stmt->execute([
                    ':id' => $examId,
                    ':subject' => array_key_exists('subject', $body) ? trim((string)$body['subject']) : $cur['subject'],
                    ':title' => array_key_exists('title', $body) ? trim((string)$body['title']) : $cur['title'],
                    ':session_group' => array_key_exists('session_group', $body) ? trim((string)$body['session_group']) : $cur['session_group'],
                    ':description' => array_key_exists('description', $body) ? trim((string)$body['description']) : ($cur['description'] ?? ''),
                    ':grade_level' => array_key_exists('grade_level', $body) ? (int)$body['grade_level'] : (int)$cur['grade_level'],
                    ':is_active' => array_key_exists('is_active', $body) ? ($body['is_active'] ? 1 : 0) : (int)$cur['is_active'],
                    ':is_archived' => array_key_exists('is_archived', $body) ? ($body['is_archived'] ? 1 : 0) : (int)$cur['is_archived'],
                    ':gform_base_url' => array_key_exists('gform_base_url', $body) ? trim((string)$body['gform_base_url']) : ($cur['gform_base_url'] ?? ''),
                    ':respon_base_url' => array_key_exists('respon_base_url', $body) ? trim((string)$body['respon_base_url']) : ($cur['respon_base_url'] ?? ''),
                    ':exam_token' => array_key_exists('exam_token', $body) ? trim((string)$body['exam_token']) : ($cur['exam_token'] ?? ''),
                    ':finish_token' => array_key_exists('finish_token', $body) ? trim((string)$body['finish_token']) : ($cur['finish_token'] ?? ''),
                    ':start_time' => array_key_exists('start_time', $body) ? trim((string)$body['start_time']) : ($cur['start_time'] ?? ''),
                    ':end_time' => array_key_exists('end_time', $body) ? trim((string)$body['end_time']) : ($cur['end_time'] ?? ''),
                    ':duration_minutes' => array_key_exists('duration_minutes', $body) ? (int)$body['duration_minutes'] : (int)$cur['duration_minutes'],
                ]);

                $ex = $pdo->query("SELECT * FROM exam_sessions WHERE id = " . $pdo->quote($examId))->fetch();
                sendJson(['success' => true, 'exam' => rowToExamSession($ex)]);
            }
        }
    }

    // ── /attempts ──────────────────────────────────────────────
    if ($endpoint === 'attempts' && $method === 'GET') {
        $rows = $pdo->query("SELECT * FROM student_attempts ORDER BY updated_at DESC")->fetchAll();
        sendJson(array_map('rowToAttempt', $rows));
    }

    if ($endpoint === 'attempts' && $method === 'POST') {
        $id = $body['id'] ?? ('att-' . bin2hex(random_bytes(6)));
        $stmt = $pdo->prepare("INSERT INTO student_attempts (
            id, student_id, student_name, student_nisn, student_kelas, student_tingkat,
            exam_session_id, exam_title, status, violation_count, time_spent_seconds,
            last_violation_reason, ping_latency_ms, last_ping_at, started_at
        ) VALUES (
            :id, :student_id, :student_name, :student_nisn, :student_kelas, :student_tingkat,
            :exam_session_id, :exam_title, :status, :violation_count, :time_spent_seconds,
            :last_violation_reason, :ping_latency_ms, :last_ping_at, COALESCE(:started_at, datetime('now'))
        ) ON CONFLICT(student_id, exam_session_id) DO UPDATE SET
            status = excluded.status,
            violation_count = excluded.violation_count,
            time_spent_seconds = excluded.time_spent_seconds,
            last_violation_reason = excluded.last_violation_reason,
            ping_latency_ms = excluded.ping_latency_ms,
            last_ping_at = excluded.last_ping_at,
            updated_at = datetime('now')
        ");

        $stmt->execute([
            ':id' => $id,
            ':student_id' => $body['student_id'],
            ':student_name' => $body['student_name'] ?? '',
            ':student_nisn' => $body['student_nisn'] ?? '',
            ':student_kelas' => $body['student_kelas'] ?? '',
            ':student_tingkat' => (int)($body['student_tingkat'] ?? 0),
            ':exam_session_id' => $body['exam_session_id'],
            ':exam_title' => $body['exam_title'] ?? '',
            ':status' => $body['status'] ?? 'IN_PROGRESS',
            ':violation_count' => (int)($body['violation_count'] ?? 0),
            ':time_spent_seconds' => (int)($body['time_spent_seconds'] ?? 0),
            ':last_violation_reason' => $body['last_violation_reason'] ?? '',
            ':ping_latency_ms' => isset($body['ping_latency_ms']) ? (int)$body['ping_latency_ms'] : null,
            ':last_ping_at' => $body['last_ping_at'] ?? date('Y-m-d H:i:s'),
            ':started_at' => $body['started_at'] ?? null,
        ]);

        $stmt2 = $pdo->prepare("SELECT * FROM student_attempts WHERE student_id = ? AND exam_session_id = ?");
        $stmt2->execute([$body['student_id'], $body['exam_session_id']]);
        $row = $stmt2->fetch();
        sendJson(rowToAttempt($row));
    }

    if ($endpoint === 'attempts/bulk' && $method === 'POST') {
        $action = $body['action'] ?? '';
        $sIds = $body['studentIds'] ?? [];
        $eId = $body['examSessionId'] ?? '';
        $count = 0;

        if (!empty($sIds) && !empty($eId)) {
            $inClause = implode(',', array_map([$pdo, 'quote'], $sIds));
            if ($action === 'reset') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET status = 'RESET_BY_PROCTOR', reset_at = datetime('now'), is_proctor_action = 1, updated_at = datetime('now') WHERE exam_session_id = ? AND student_id IN ($inClause)");
                $stmt->execute([$eId]);
                $count = $stmt->rowCount();
            } elseif ($action === 'complete') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET status = 'COMPLETED', completed_at = datetime('now'), is_proctor_action = 1, updated_at = datetime('now') WHERE exam_session_id = ? AND student_id IN ($inClause)");
                $stmt->execute([$eId]);
                $count = $stmt->rowCount();
            } elseif ($action === 'not-started') {
                $stmt = $pdo->prepare("DELETE FROM student_attempts WHERE exam_session_id = ? AND student_id IN ($inClause)");
                $stmt->execute([$eId]);
                $count = $stmt->rowCount();
            }
        }
        sendJson(['success' => true, 'count' => $count]);
    }

    // /attempts/:studentId/:examId/...
    if (count($segments) >= 3 && $segments[0] === 'attempts') {
        $studentId = urldecode($segments[1]);
        $examId = urldecode($segments[2]);
        $sub = $segments[3] ?? '';

        if ($method === 'GET' && empty($sub)) {
            $stmt = $pdo->prepare("SELECT * FROM student_attempts WHERE student_id = ? AND exam_session_id = ?");
            $stmt->execute([$studentId, $examId]);
            $a = $stmt->fetch();
            sendJson($a ? rowToAttempt($a) : null);
        }

        if ($method === 'DELETE' && empty($sub)) {
            $stmt = $pdo->prepare("DELETE FROM student_attempts WHERE student_id = ? AND exam_session_id = ?");
            $stmt->execute([$studentId, $examId]);
            sendJson(['success' => true]);
        }

        if ($method === 'PUT') {
            if ($sub === 'unlock') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET status = 'UNLOCKED', unlocked_at = datetime('now'), is_proctor_action = 1, updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([$studentId, $examId]);
            } elseif ($sub === 'reset-violations') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET violation_count = 0, last_violation_reason = '', is_reset_violations = 1, updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([$studentId, $examId]);
            } elseif ($sub === 'reset-work') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET status = 'RESET_BY_PROCTOR', reset_at = datetime('now'), is_proctor_action = 1, updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([$studentId, $examId]);
            } elseif ($sub === 'complete') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET status = 'COMPLETED', completed_at = datetime('now'), is_proctor_action = 1, updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([$studentId, $examId]);
            } elseif ($sub === 'update-time') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET time_spent_seconds = ?, updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([(int)($body['time_spent_seconds'] ?? 0), $studentId, $examId]);
            } elseif ($sub === 'heartbeat') {
                $stmt = $pdo->prepare("UPDATE student_attempts SET time_spent_seconds = ?, ping_latency_ms = ?, last_ping_at = datetime('now'), updated_at = datetime('now') WHERE student_id = ? AND exam_session_id = ?");
                $stmt->execute([(int)($body['time_spent_seconds'] ?? 0), (int)($body['latencyMs'] ?? 0), $studentId, $examId]);
            }

            $stmt2 = $pdo->prepare("SELECT * FROM student_attempts WHERE student_id = ? AND exam_session_id = ?");
            $stmt2->execute([$studentId, $examId]);
            $a = $stmt2->fetch();
            sendJson(['success' => true, 'attempt' => rowToAttempt($a)]);
        }
    }

    // ── /attendance ────────────────────────────────────────────
    if ($endpoint === 'attendance' && $method === 'GET') {
        $sessionId = $_GET['exam_session_id'] ?? null;
        if ($sessionId) {
            $stmt = $pdo->prepare("SELECT * FROM exam_attendance WHERE exam_session_id = ?");
            $stmt->execute([$sessionId]);
            $rows = $stmt->fetchAll();
        } else {
            $rows = $pdo->query("SELECT * FROM exam_attendance")->fetchAll();
        }
        sendJson(array_map('rowToAttendance', $rows));
    }

    if ($endpoint === 'attendance' && $method === 'POST') {
        $id = $body['id'] ?? ('attd-' . bin2hex(random_bytes(6)));
        $stmt = $pdo->prepare("INSERT INTO exam_attendance (
            id, exam_session_id, student_id, status, keterangan, updated_by
        ) VALUES (
            :id, :exam_session_id, :student_id, :status, :keterangan, :updated_by
        ) ON CONFLICT(exam_session_id, student_id) DO UPDATE SET
            status = excluded.status,
            keterangan = excluded.keterangan,
            updated_by = excluded.updated_by,
            updated_at = datetime('now')
        ");

        $stmt->execute([
            ':id' => $id,
            ':exam_session_id' => $body['exam_session_id'],
            ':student_id' => $body['student_id'],
            ':status' => $body['status'] ?? 'HADIR',
            ':keterangan' => $body['keterangan'] ?? '',
            ':updated_by' => $body['updated_by'] ?? 'Proktor'
        ]);

        $stmt2 = $pdo->prepare("SELECT * FROM exam_attendance WHERE exam_session_id = ? AND student_id = ?");
        $stmt2->execute([$body['exam_session_id'], $body['student_id']]);
        $row = $stmt2->fetch();
        sendJson(['success' => true, 'record' => rowToAttendance($row)]);
    }

    if (count($segments) === 3 && $segments[0] === 'attendance' && $method === 'DELETE') {
        $examId = urldecode($segments[1]);
        $studentId = urldecode($segments[2]);
        $stmt = $pdo->prepare("DELETE FROM exam_attendance WHERE exam_session_id = ? AND student_id = ?");
        $stmt->execute([$examId, $studentId]);
        sendJson(['success' => true]);
    }

    // ── /berita-acara ──────────────────────────────────────────
    if ($endpoint === 'berita-acara') {
        if ($method === 'GET') {
            $row = $pdo->query("SELECT * FROM berita_acara_config WHERE id = 'singleton'")->fetch();
            sendJson($row ?: []);
        }
        if ($method === 'POST' || $method === 'PUT') {
            $stmt = $pdo->prepare("UPDATE berita_acara_config SET 
                instansi_pusat = COALESCE(:instansi_pusat, instansi_pusat),
                alamat = COALESCE(:alamat, alamat),
                kepala_sekolah_nama = COALESCE(:kepala_sekolah_nama, kepala_sekolah_nama),
                kepala_sekolah_nip = COALESCE(:kepala_sekolah_nip, kepala_sekolah_nip),
                proktor_nama = COALESCE(:proktor_nama, proktor_nama),
                proktor_nip = COALESCE(:proktor_nip, proktor_nip),
                pengawas_nama = COALESCE(:pengawas_nama, pengawas_nama),
                pengawas_nip = COALESCE(:pengawas_nip, pengawas_nip),
                catatan_pelaksanaan = COALESCE(:catatan_pelaksanaan, catatan_pelaksanaan),
                paper_size = COALESCE(:paper_size, paper_size),
                margin_preset = COALESCE(:margin_preset, margin_preset),
                margin_top = COALESCE(:margin_top, margin_top),
                margin_right = COALESCE(:margin_right, margin_right),
                margin_bottom = COALESCE(:margin_bottom, margin_bottom),
                margin_left = COALESCE(:margin_left, margin_left),
                updated_at = datetime('now')
            WHERE id = 'singleton'");

            $stmt->execute([
                ':instansi_pusat' => $body['instansi_pusat'] ?? null,
                ':alamat' => $body['alamat'] ?? null,
                ':kepala_sekolah_nama' => $body['kepala_sekolah_nama'] ?? null,
                ':kepala_sekolah_nip' => $body['kepala_sekolah_nip'] ?? null,
                ':proktor_nama' => $body['proktor_nama'] ?? null,
                ':proktor_nip' => $body['proktor_nip'] ?? null,
                ':pengawas_nama' => $body['pengawas_nama'] ?? null,
                ':pengawas_nip' => $body['pengawas_nip'] ?? null,
                ':catatan_pelaksanaan' => $body['catatan_pelaksanaan'] ?? null,
                ':paper_size' => $body['paper_size'] ?? null,
                ':margin_preset' => $body['margin_preset'] ?? null,
                ':margin_top' => isset($body['margin_top']) ? (int)$body['margin_top'] : null,
                ':margin_right' => isset($body['margin_right']) ? (int)$body['margin_right'] : null,
                ':margin_bottom' => isset($body['margin_bottom']) ? (int)$body['margin_bottom'] : null,
                ':margin_left' => isset($body['margin_left']) ? (int)$body['margin_left'] : null,
            ]);

            $row = $pdo->query("SELECT * FROM berita_acara_config WHERE id = 'singleton'")->fetch();
            sendJson($row ?: []);
        }
    }

    // ── /app-mode ──────────────────────────────────────────────
    if ($endpoint === 'app-mode') {
        if ($method === 'GET') {
            $r = $pdo->query("SELECT * FROM app_mode_config WHERE id = 'singleton'")->fetch();
            $isSim = ($r['app_mode'] ?? 'production') === 'simulation';
            sendJson([
                'app_mode' => $r['app_mode'] ?? 'production',
                'bypass_gps' => $isSim ? intToBool($r['bypass_gps'] ?? 0) : false,
                'bypass_media' => $isSim ? intToBool($r['bypass_media'] ?? 0) : false,
                'bypass_audio' => $isSim ? intToBool($r['bypass_audio'] ?? 0) : false,
                'bypass_notifications' => $isSim ? intToBool($r['bypass_notifications'] ?? 0) : false,
                'bypass_fullscreen' => $isSim ? intToBool($r['bypass_fullscreen'] ?? 0) : false,
                'bypass_cookies_check' => $isSim ? intToBool($r['bypass_cookies_check'] ?? 0) : false,
                'bypass_google_sso' => $isSim ? intToBool($r['bypass_google_sso'] ?? 0) : false,
                'mock_gps_coords' => ($isSim && !empty($r['mock_gps_lat'])) ? ['lat' => (float)$r['mock_gps_lat'], 'lng' => (float)$r['mock_gps_lng']] : null,
                'signature' => $r['signature'] ?? '',
                'updated_at' => $r['updated_at'] ?? date('Y-m-d H:i:s')
            ]);
        }

        if ($method === 'POST' || $method === 'PUT') {
            if ($callerRole !== 'admin') {
                sendJson(['error' => 'Hanya Super Admin yang diizinkan mengubah konfigurasi mode aplikasi.'], 403);
            }

            $appMode = ($body['app_mode'] ?? 'production') === 'simulation' ? 'simulation' : 'production';
            $isSim = $appMode === 'simulation';

            $mockLat = null;
            $mockLng = null;
            if ($isSim && isset($body['mock_gps_coords'])) {
                $mockLat = (float)($body['mock_gps_coords']['lat'] ?? 0);
                $mockLng = (float)($body['mock_gps_coords']['lng'] ?? 0);
            }

            $stmt = $pdo->prepare("UPDATE app_mode_config SET 
                app_mode = :app_mode,
                bypass_gps = :bypass_gps,
                bypass_media = :bypass_media,
                bypass_audio = :bypass_audio,
                bypass_notifications = :bypass_notifications,
                bypass_fullscreen = :bypass_fullscreen,
                bypass_cookies_check = :bypass_cookies_check,
                bypass_google_sso = :bypass_google_sso,
                mock_gps_lat = :mock_gps_lat,
                mock_gps_lng = :mock_gps_lng,
                signature = :signature,
                updated_at = datetime('now')
            WHERE id = 'singleton'");

            $stmt->execute([
                ':app_mode' => $appMode,
                ':bypass_gps' => ($isSim && !empty($body['bypass_gps'])) ? 1 : 0,
                ':bypass_media' => ($isSim && !empty($body['bypass_media'])) ? 1 : 0,
                ':bypass_audio' => ($isSim && !empty($body['bypass_audio'])) ? 1 : 0,
                ':bypass_notifications' => ($isSim && !empty($body['bypass_notifications'])) ? 1 : 0,
                ':bypass_fullscreen' => ($isSim && !empty($body['bypass_fullscreen'])) ? 1 : 0,
                ':bypass_cookies_check' => ($isSim && !empty($body['bypass_cookies_check'])) ? 1 : 0,
                ':bypass_google_sso' => ($isSim && !empty($body['bypass_google_sso'])) ? 1 : 0,
                ':mock_gps_lat' => $mockLat,
                ':mock_gps_lng' => $mockLng,
                ':signature' => $body['signature'] ?? ''
            ]);

            sendJson(['success' => true, 'config' => $body]);
        }
    }

    // ── /logs ──────────────────────────────────────────────────
    if ($endpoint === 'logs') {
        if ($method === 'GET') {
            $rows = $pdo->query("SELECT * FROM system_error_logs ORDER BY timestamp DESC LIMIT 200")->fetchAll();
            sendJson($rows);
        }
        if ($method === 'POST') {
            $id = 'log-' . bin2hex(random_bytes(6));
            $stmt = $pdo->prepare("INSERT INTO system_error_logs (id, source, level, message, details, solution, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $id,
                $body['source'] ?? 'Sistem',
                $body['level'] ?? 'error',
                $body['message'] ?? '',
                is_array($body['details'] ?? null) ? json_encode($body['details']) : ($body['details'] ?? ''),
                $body['solution'] ?? '',
                $_SERVER['HTTP_USER_AGENT'] ?? ''
            ]);
            sendJson(['success' => true, 'id' => $id]);
        }
        if ($method === 'DELETE') {
            $pdo->exec("DELETE FROM system_error_logs");
            sendJson(['success' => true]);
        }
    }

    // ── /broadcast (Siaran Cepat Peserta & Pengawas) ───────────
    if ($endpoint === 'broadcast') {
        if ($method === 'GET') {
            $row = $pdo->query("SELECT * FROM active_broadcast WHERE id = 'singleton'")->fetch();
            sendJson($row ?: [
                'id' => 'singleton',
                'message' => '',
                'scheduled_at' => null,
                'broadcast_id' => '',
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ]);
        }
        if ($method === 'POST' || $method === 'PUT') {
            $msg = trim($body['message'] ?? '');
            if (mb_strlen($msg) > 100) {
                $msg = mb_substr($msg, 0, 100);
            }
            $sched = !empty($body['scheduled_at']) ? $body['scheduled_at'] : null;
            $broadcastId = !empty($body['broadcast_id']) ? $body['broadcast_id'] : ('bc_' . time() . '_' . substr(md5(uniqid()), 0, 6));

            $stmt = $pdo->prepare("INSERT INTO active_broadcast (id, message, scheduled_at, broadcast_id, updated_at) 
                VALUES ('singleton', :message, :scheduled_at, :broadcast_id, datetime('now'))
                ON CONFLICT(id) DO UPDATE SET 
                    message = :message, 
                    scheduled_at = :scheduled_at, 
                    broadcast_id = :broadcast_id, 
                    updated_at = datetime('now')");
            $stmt->execute([
                ':message' => $msg,
                ':scheduled_at' => $sched,
                ':broadcast_id' => $broadcastId
            ]);

            $saved = $pdo->query("SELECT * FROM active_broadcast WHERE id = 'singleton'")->fetch();
            sendJson(['success' => true, 'broadcast' => $saved]);
        }
        if ($method === 'DELETE') {
            $pdo->exec("UPDATE active_broadcast SET message = '', scheduled_at = NULL, broadcast_id = '', updated_at = datetime('now') WHERE id = 'singleton'");
            sendJson(['success' => true]);
        }
    }

    // ── /tunnel/status (Ngrok Cloud Tunnel Status) ─────────────
    if ($endpoint === 'tunnel/status' || $endpoint === 'tunnel') {
        $publicUrl = null;
        $proto = 'https';
        $tunnels = [];
        
        if (function_exists('curl_init')) {
            $ch = curl_init('http://127.0.0.1:4040/api/tunnels');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 1);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
            $response = @curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && !empty($response)) {
                $data = json_decode($response, true);
                $tunnels = $data['tunnels'] ?? [];
                foreach ($tunnels as $t) {
                    if (!empty($t['public_url'])) {
                        $publicUrl = $t['public_url'];
                        $proto = $t['proto'] ?? 'https';
                        if (str_starts_with($publicUrl, 'https://')) {
                            break;
                        }
                    }
                }
            }
        }

        sendJson([
            'success' => true,
            'active' => !empty($publicUrl),
            'public_url' => $publicUrl,
            'proto' => $proto,
            'tunnels' => $tunnels,
            'message' => !empty($publicUrl) ? 'Ngrok tunnel aktif.' : 'Ngrok tunnel tidak terdeteksi atau tidak aktif di port 4040.'
        ]);
    }

    // ── /backup & /restore ─────────────────────────────────────
    if ($endpoint === 'backup' && $method === 'GET') {
        if ($callerRole === 'proctor' || ($callerRole !== null && $callerRole !== 'admin')) {
            sendJson(['error' => 'Akses Ditolak: Fitur Backup hanya dapat diakses oleh Super Admin.'], 403);
        }
        $inst = rowToInstitution($pdo->query("SELECT * FROM institution WHERE id = 'singleton'")->fetch());
        $users = array_map('rowToUser', $pdo->query("SELECT * FROM users ORDER BY nama ASC")->fetchAll());
        $exams = array_map('rowToExamSession', $pdo->query("SELECT * FROM exam_sessions ORDER BY created_at DESC")->fetchAll());
        $attempts = array_map('rowToAttempt', $pdo->query("SELECT * FROM student_attempts ORDER BY updated_at DESC")->fetchAll());
        $attendance = array_map('rowToAttendance', $pdo->query("SELECT * FROM exam_attendance")->fetchAll());
        $baRow = $pdo->query("SELECT * FROM berita_acara_config WHERE id = 'singleton'")->fetch();
        $appModeRow = $pdo->query("SELECT * FROM app_mode_config WHERE id = 'singleton'")->fetch();
        $logs = $pdo->query("SELECT * FROM system_error_logs ORDER BY timestamp DESC LIMIT 500")->fetchAll();

        sendJson([
            'institution' => $inst,
            'users' => $users,
            'examSessions' => $exams,
            'attempts' => $attempts,
            'attendance' => $attendance,
            'appModeConfig' => $appModeRow,
            'beritaAcaraConfig' => $baRow,
            'systemErrorLogs' => $logs,
            'backup_timestamp' => date('c'),
            'generator' => 'ExamGuard Enterprise v1.0'
        ]);
    }

    // ── /system/auto-update (1-Klik GitHub & Upload ZIP Verifikasi Meta) ──────
    if ($endpoint === 'system/auto-update' && $method === 'POST') {
        if ($callerRole !== 'admin') {
            sendJson(['error' => 'Akses Ditolak: Hanya Super Admin yang berwenang memperbarui sistem.'], 403);
        }

        if (!class_exists('ZipArchive')) {
            sendJson(['error' => 'Ekstensi PHP ZipArchive belum aktif di server cPanel Anda. Harap aktifkan ekstensi "zip" melalui menu "Select PHP Version" > "Extensions" di cPanel.'], 500);
        }

        $rootDir = realpath(__DIR__ . '/..');
        $tmpDir = sys_get_temp_dir() . '/examguard_update_' . time() . '_' . mt_rand(1000, 9999);
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0755, true);
        }
        $zipFilePath = $tmpDir . '/package.zip';

        // 1. Terima berkas paket: Upload Multipart, JSON Base64, atau Unduh dari GitHub
        if (!empty($_FILES['package_file']['tmp_name'])) {
            if (!move_uploaded_file($_FILES['package_file']['tmp_name'], $zipFilePath)) {
                sendJson(['error' => 'Gagal memproses file unggahan paket pembaruan.'], 500);
            }
        } elseif (!empty($body['package_base64'])) {
            $bin = base64_decode($body['package_base64']);
            if (!$bin) {
                sendJson(['error' => 'Format paket base64 tidak valid.'], 400);
            }
            file_put_contents($zipFilePath, $bin);
        } elseif (!empty($body['download_url'])) {
            $downloadUrl = $body['download_url'];
            
            // Download via cURL dengan dukungan follow-location yang aman untuk server cPanel (open_basedir & SSL)
            if (function_exists('curl_init')) {
                $currUrl = $downloadUrl;
                $redirects = 0;
                $execRes = false;
                $httpCode = 0;

                $openBasedir = ini_get('open_basedir');
                if (empty($openBasedir)) {
                    $ch = curl_init($downloadUrl);
                    $fp = fopen($zipFilePath, 'wb');
                    curl_setopt($ch, CURLOPT_FILE, $fp);
                    curl_setopt($ch, CURLOPT_HEADER, 0);
                    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
                    curl_setopt($ch, CURLOPT_USERAGENT, 'ExamGuard-AutoUpdater/1.3.0');
                    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
                    $execRes = curl_exec($ch);
                    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                    curl_close($ch);
                    fclose($fp);
                } else {
                    // Manual follow-location untuk server cPanel dengan open_basedir aktif
                    while ($redirects < 6) {
                        $ch = curl_init($currUrl);
                        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                        curl_setopt($ch, CURLOPT_HEADER, 1);
                        curl_setopt($ch, CURLOPT_USERAGENT, 'ExamGuard-AutoUpdater/1.3.0');
                        curl_setopt($ch, CURLOPT_TIMEOUT, 300);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
                        $resp = curl_exec($ch);
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
                        curl_close($ch);

                        if ($httpCode == 301 || $httpCode == 302 || $httpCode == 307 || $httpCode == 308) {
                            $header = substr($resp, 0, $headerSize);
                            if (preg_match('/Location:\s*([^\r\n]+)/i', $header, $m)) {
                                $currUrl = trim($m[1]);
                                $redirects++;
                                continue;
                            }
                        }

                        if ($httpCode >= 200 && $httpCode < 300) {
                            file_put_contents($zipFilePath, substr($resp, $headerSize));
                            $execRes = true;
                        }
                        break;
                    }
                }

                if (!$execRes || $httpCode >= 400 || !file_exists($zipFilePath) || filesize($zipFilePath) < 1000) {
                    @unlink($zipFilePath);
                    sendJson(['error' => "Gagal mengunduh paket dari GitHub (HTTP $httpCode). Pastikan rilis GitHub memiliki aset ZIP rilis produksi (bukan source code zip) dan server cPanel terhubung ke internet."], 500);
                }
            } else {
                $opts = [
                    'http' => [
                        'method' => 'GET',
                        'header' => "User-Agent: ExamGuard-AutoUpdater/1.3.0\r\n",
                        'follow_location' => 1,
                        'timeout' => 300
                    ],
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false
                    ]
                ];
                $ctx = stream_context_create($opts);
                $content = @file_get_contents($downloadUrl, false, $ctx);
                if ($content === false || strlen($content) < 1000) {
                    sendJson(['error' => 'Gagal mengunduh paket pembaruan dari URL yang diberikan.'], 500);
                }
                file_put_contents($zipFilePath, $content);
            }
        } else {
            sendJson(['error' => 'Parameter tidak valid. Diperlukan download_url atau unggahan berkas paket pembaruan.'], 400);
        }

        // 2. Buka ZIP & Verifikasi Integritas
        $zip = new ZipArchive();
        $openRes = $zip->open($zipFilePath);
        if ($openRes !== true) {
            @unlink($zipFilePath);
            @rmdir($tmpDir);
            sendJson(['error' => "Berkas paket ZIP tidak dapat dibuka atau korup (Kode error: $openRes)."], 400);
        }

        // 3. KEAMANAN MUTLAK: Pastikan TIDAK ADA file database SQLite (.db) dalam ZIP
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            $lower = strtolower($entryName);
            if (str_ends_with($lower, '.db') || str_ends_with($lower, '.db-wal') || str_ends_with($lower, '.db-shm') || str_contains($lower, 'examguard.db')) {
                $zip->close();
                @unlink($zipFilePath);
                @rmdir($tmpDir);
                sendJson(['error' => 'BATAL DEMI KEAMANAN: Paket pembaruan memuat berkas database (.db) yang berpotensi menimpa data siswa dan nilai ujian yang sedang berjalan!'], 400);
            }
        }

        // 4. Verifikasi Berkas Meta (manifest.json) & Pastikan Paket Memuat Kompilasi Frontend
        $manifestEntryName = null;
        $manifestContent = null;
        $hasIndexHtml = false;
        $hasAssets = false;

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === 'manifest.json' || str_ends_with($name, '/manifest.json')) {
                $manifestEntryName = $name;
                $manifestContent = $zip->getFromIndex($i);
            }
            if ($name === 'index.html' || str_ends_with($name, '/index.html')) {
                $hasIndexHtml = true;
            }
            if (str_contains($name, 'assets/') || str_contains($name, 'assets\\')) {
                $hasAssets = true;
            }
        }

        if (!$manifestContent) {
            $zip->close();
            @unlink($zipFilePath);
            @rmdir($tmpDir);
            sendJson(['error' => 'Verifikasi Gagal: Berkas meta manifest.json tidak ditemukan di dalam paket rilis.'], 400);
        }

        if (!$hasIndexHtml || !$hasAssets) {
            $zip->close();
            @unlink($zipFilePath);
            @rmdir($tmpDir);
            sendJson([
                'error' => 'Verifikasi Gagal: Paket ZIP ini tidak memuat kompilasi frontend (index.html dan folder assets tidak ditemukan). Berkas yang diunggah tampaknya adalah source code mentah GitHub, bukan berkas rilis kompilasi cPanel. Harap gunakan paket rilis ZIP kompilasi (examguard-v1.3.0-cpanel.zip) yang memuat berkas dist/.'
            ], 400);
        }

        $manifest = json_decode($manifestContent, true);
        if (!$manifest || !in_array($manifest['name'] ?? '', ['ExamGuard', 'exampguard', 'Examguard'])) {
            $zip->close();
            @unlink($zipFilePath);
            @rmdir($tmpDir);
            sendJson(['error' => 'Verifikasi Gagal: Meta file menunjukkan paket ini bukan rilis resmi ExamGuard.'], 400);
        }

        $newVersion = $manifest['version'] ?? '1.3.0';

        // 5. Ekstraksi Berkas ke Root Aplikasi (Tangani flat zip maupun folder wrapper seperti dist/ atau ExamGuard/)
        $prefix = '';
        if ($manifestEntryName !== 'manifest.json') {
            $prefix = substr($manifestEntryName, 0, strrpos($manifestEntryName, 'manifest.json'));
        }

        $extractedFiles = 0;
        if (empty($prefix)) {
            $extractRes = $zip->extractTo($rootDir);
            $extractedFiles = $zip->numFiles;
        } else {
            $extractRes = true;
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entryName = $zip->getNameIndex($i);
                if (str_starts_with($entryName, $prefix)) {
                    $relPath = substr($entryName, strlen($prefix));
                    if (empty($relPath) || str_ends_with($relPath, '/')) {
                        if (!empty($relPath)) {
                            @mkdir($rootDir . '/' . $relPath, 0755, true);
                        }
                        continue;
                    }
                    $destPath = $rootDir . '/' . $relPath;
                    $destDir = dirname($destPath);
                    if (!is_dir($destDir)) {
                        @mkdir($destDir, 0755, true);
                    }
                    $stream = $zip->getStream($entryName);
                    if ($stream) {
                        $outFp = fopen($destPath, 'wb');
                        if ($outFp) {
                            stream_copy_to_stream($stream, $outFp);
                            fclose($outFp);
                            $extractedFiles++;
                        }
                        fclose($stream);
                    }
                }
            }
        }

        $zip->close();
        @unlink($zipFilePath);
        @rmdir($tmpDir);

        if (!$extractRes) {
            sendJson(['error' => 'Gagal mengekstrak berkas ke folder server. Pastikan folder subdomain memiliki izin tulis (chmod 755).'], 500);
        }

        // 6. Jalankan Migrasi Database Otomatis jika ada perubahan skema
        try {
            initDatabaseSchema($pdo);
        } catch (Exception $mErr) {}

        // Sinkronisasi otomatis api/index.php ke public/api/index.php jika folder public ada di server
        if (file_exists($rootDir . '/public/api/index.php') && file_exists($rootDir . '/api/index.php')) {
            @copy($rootDir . '/api/index.php', $rootDir . '/public/api/index.php');
        }

        sendJson([
            'success' => true,
            'message' => "Pembaruan ExamGuard ke versi $newVersion berhasil dipasang dengan sukses!",
            'version' => $newVersion,
            'manifest' => $manifest,
            'extracted_files_count' => $extractedFiles,
            'updated_at' => date('c')
        ]);
    }

    if ($endpoint === 'restore' && $method === 'POST') {
        if ($callerRole !== 'admin') {
            sendJson(['error' => 'Hanya Super Admin yang dapat memulihkan data.'], 403);
        }

        $pdo->beginTransaction();
        // Restore users
        if (!empty($body['users']) && is_array($body['users'])) {
            $pdo->exec("DELETE FROM users WHERE role = 'student'");
            $uStmt = $pdo->prepare("INSERT INTO users (
                id, username, password, nama, email, role, nisn, nis, nomor_ujian, jenis_kelamin, agama, kelas, tingkat, ruang, is_active, is_verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['users'] as $u) {
                if (($u['role'] ?? '') === 'admin') continue; // Pertahankan akun admin aktif
                $uStmt->execute([
                    $u['id'], $u['username'], $u['password'] ?? '123456', $u['nama'], $u['email'] ?? '',
                    $u['role'] ?? 'student', $u['nisn'] ?? '', $u['nis'] ?? '', $u['nomor_ujian'] ?? '',
                    $u['jenis_kelamin'] ?? 'L', $u['agama'] ?? 'Islam', $u['kelas'] ?? '', (int)($u['tingkat'] ?? 0),
                    $u['ruang'] ?? 'Ruang 01', !empty($u['is_active']) ? 1 : 0, !empty($u['is_verified']) ? 1 : 0
                ]);
            }
        }

        // Restore exam sessions
        if (!empty($body['examSessions']) && is_array($body['examSessions'])) {
            $pdo->exec("DELETE FROM exam_sessions");
            $eStmt = $pdo->prepare("INSERT INTO exam_sessions (
                id, subject, title, session_group, description, grade_level, is_active, is_archived,
                gform_base_url, respon_base_url, exam_token, finish_token, start_time, end_time, duration_minutes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($body['examSessions'] as $e) {
                $eStmt->execute([
                    $e['id'], $e['subject'], $e['title'], $e['session_group'] ?? 'ATS', $e['description'] ?? '',
                    (int)($e['grade_level'] ?? 12), !empty($e['is_active']) ? 1 : 0, !empty($e['is_archived']) ? 1 : 0,
                    $e['gform_base_url'] ?? '', $e['respon_base_url'] ?? '', $e['exam_token'] ?? '', $e['finish_token'] ?? '',
                    $e['start_time'] ?? '', $e['end_time'] ?? '', (int)($e['duration_minutes'] ?? 60)
                ]);
            }
        }

        $pdo->commit();
        sendJson(['success' => true]);
    }

    // Default 404
    sendJson(['error' => "Endpoint tidak ditemukan: $method /api/db/$endpoint"], 404);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendJson(['error' => $e->getMessage()], 500);
}
